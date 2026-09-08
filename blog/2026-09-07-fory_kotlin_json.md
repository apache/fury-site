---
slug: fory_kotlin_json
title: "Apache Fory™ JSON: High-Performance JSON Serialization for Kotlin"
description: "Apache Fory JSON provides high-performance serialization for Kotlin/JVM data classes, value classes, and sealed hierarchies, preserving constructor defaults and nullability."
authors: [chaokunyang]
tags: [fory, kotlin, java, json, serialization, performance]
---

**TL;DR**: Apache Fory JSON brings high-performance JSON serialization to Kotlin/JVM. It maps data classes, value classes, and sealed hierarchies to JSON while preserving constructor defaults and nullability. In benchmarks covering small messages and large documents, Fory delivers **2.78×–12.12× the throughput** of kotlinx.serialization, Moshi, and Jackson Kotlin.

<img src="/img/fory-logo-light.png" width="50%"/>

## JSON Serialization in Kotlin Applications {#kotlin-models-as-json-contracts}

Kotlin applications exchange JSON through HTTP APIs, message queues, and stored documents. Application code works with typed models, so each exchange involves converting between JSON and Kotlin objects. Reading a document includes constructing an object with the right arguments and running its initialization logic; writing it must preserve the values needed to reconstruct that object.

These conversions also consume CPU time and allocate temporary objects, especially when a service processes many messages or large documents. Apache Fory JSON combines Kotlin object mapping with a high-performance JSON engine: the Kotlin layer follows the model's type and construction rules, while the engine handles JSON parsing and output. The same mapping is available through String and direct UTF-8 APIs.

## Getting Started

Add the module from Maven Central to your existing Kotlin/JVM project, keeping all Fory dependencies on the same version:

```kotlin title="build.gradle.kts"
dependencies {
  implementation("org.apache.fory:fory-json-kotlin:1.7.1")
}
```

Create a runtime and a type token for the model. The runtime is thread-safe; retain both objects for repeated use:

```kotlin
import org.apache.fory.json.kotlin.ForyJsonKotlin
import org.apache.fory.json.kotlin.jsonTypeRef

data class Account(
  val id: ULong,
  val name: String,
  val nickname: String? = null,
)

val json = ForyJsonKotlin.builder().build()
val accountType = jsonTypeRef<Account>()

fun main() {
  val input = Account(7uL, "Alice")
  val text = json.toJson(input, accountType)
  val utf8 = json.toJsonBytes(input, accountType)

  check(json.fromJson(text, accountType) == input)
  check(json.fromJson(utf8, accountType) == input)
}
```

On a standard JVM, this example needs no model annotations or serialization compiler plugin. `ForyJsonKotlin.builder()` installs the Kotlin module, and `jsonTypeRef<T>()` describes the type to serialize or deserialize, including its generic arguments and nullability. For example, use `jsonTypeRef<List<Account?>>()` when a list can contain null elements, or `jsonTypeRef<List<Account>>()` when every element must be an account.

The byte APIs read and write UTF-8 directly, avoiding a complete intermediate String when an HTTP client, message transport, or storage API already exchanges bytes.

## Constructor Defaults and Nullability

Consider a request with one required parameter and two defaults:

```kotlin
data class Request(
  val id: Long,
  val label: String? = "new",
  val retries: Int = 3,
)
```

Fory selects the primary constructor automatically. An absent member uses its compiler default when one exists; an explicit JSON null is checked against the parameter's nullability:

| JSON input | Result |
| --- | --- |
| `{"id":1}` | `Request(1, "new", 3)` |
| `{"id":1,"label":null}` | `Request(1, null, 3)` |
| `{"label":"ready"}` | Rejected: required `id` is missing |
| `{"id":1,"retries":null}` | Rejected: `retries` is non-null |

Nullability and defaults are independent: a nullable parameter without a default still requires a JSON member. Defaults remain executable Kotlin expressions, evaluated when needed during construction. Initialization blocks and constructor validation also run normally.

This distinction affects serialization too. If `label` is null, omitting it would cause a reader to restore `"new"`. Fory therefore writes nullable constructor properties explicitly when they contain null, preserving the value on a round trip under the same configuration.

Nullability checks extend through container elements and nested generic models. The [Kotlin guide](/docs/json/kotlin#immutable-classes-and-compiler-defaults) also covers secondary constructors, explicit creators, and properties declared in the class body.

## Value Classes and Unsigned Types {#preserving-domain-types}

A value class can distinguish a domain identifier in application code while keeping a scalar JSON representation. Using the runtime above:

```kotlin
@JvmInline
value class AccountId(val value: ULong) {
  init {
    require(value > 0uL)
  }
}

val idType = jsonTypeRef<AccountId>()
val text = json.toJson(AccountId(42uL), idType) // 42
val restored = json.fromJson(text, idType)
```

Fory reconstructs `AccountId` through its validated constructor operation, so the `require` check still runs. The type token preserves the value-class identity even when the JVM represents it through a primitive carrier.

Unsigned integers retain their decimal representation, including the full `ULong` range. If an API requires 64-bit integers as JSON strings, build the runtime with `ForyJsonKotlin.builder().writeLongAsString(true)`. This applies to `Long` and `ULong`, including supported containers and value classes; readers accept quoted or unquoted integer tokens.

Transparent mapping needs an unambiguous null representation. A nullable value class with a nullable underlying value has two distinct states that would both become JSON null, so that case requires a tagged custom codec. See the [type support table](/docs/json/kotlin#supported-kotlin-types) for other Kotlin types and their representations.

## Sealed Hierarchies and Annotations {#sealed-types-and-json-annotations}

Annotating a sealed base with `JsonSubTypes` lets Fory infer the concrete alternatives from Kotlin metadata:

```kotlin
import org.apache.fory.json.annotation.JsonSubTypes

@JsonSubTypes(property = "kind")
sealed interface Payment

data class CardPayment(val lastFour: String) : Payment
data class BankTransfer(val account: String) : Payment

val paymentType = jsonTypeRef<Payment>()
val text = json.toJson(CardPayment("4242"), paymentType)
// {"kind":"CardPayment","lastFour":"4242"}
val decoded = json.fromJson(text, paymentType)
```

The declared `Payment` type selects the subtype table. The `kind` member contains a logical variant name, and unknown names are rejected; input cannot specify an arbitrary JVM class. Inferred names follow source class names. Use an explicit subtype table when wire names must survive source renaming. The same mapping works inside `jsonTypeRef<List<Payment>>()`.

Kotlin properties also use Fory's shared JSON annotations. An explicit use-site target identifies the JVM element receiving an annotation:

```kotlin
import org.apache.fory.json.annotation.JsonProperty

data class Profile(
  @param:JsonProperty("user_id")
  val id: Long,
  val name: String,
)
```

Here, `id` maps to `user_id`. Naming, formatting, Mixins, and custom codecs build on the same annotation system; the [annotation guide](/docs/json/annotations#kotlin-use-site-targets) describes the supported Kotlin targets.

## How Fory Maps Kotlin Models Efficiently {#how-fory-json-achieves-high-performance-in-kotlin}

The mapping path connects Kotlin's declarations to the shared engine:

```text
Kotlin metadata + declared root type
  → resolved constructor and property model
  → generated codec
  → shared Fory JSON runtime
```

### Resolving Kotlin Metadata {#preparing-kotlin-types-once}

When preparing a codec, the Kotlin module resolves the constructor, property accessors, generic arguments, nullability, and compiler-default parameters. It translates them into Fory's object model, which the runtime reuses for subsequent operations.

The declared root type supplies information that belongs to a particular use of a class. For `Box<List<String?>>`, for example, class metadata describes `Box<T>`, while the type token supplies `List<String?>` for `T`. Combining them lets the mapper enforce the correct rules inside the object.

### Generating Code Around Constructors {#generating-code-for-the-declared-model}

On a standard JDK, generated readers specialize field matching and decoding for that resolved model. For `Request`, the reader tracks which arguments are present, rejects a missing `id`, and selects the constructor invocation. If `label` or `retries` is absent, a default-argument mask tells Kotlin's compiler-generated constructor which expressions to evaluate. An explicit null for `label` leaves its default unselected.

Generated writers likewise use resolved accessors and field types, including the rule that nullable constructor properties must preserve null. Reusing these codecs removes repeated model discovery while keeping normal Kotlin construction and validation in the read path. An interpreted mapping path is available where runtime compilation is unavailable.

### Using the Shared JSON Engine

These codecs use Fory's existing number encoders, text processing, reusable buffers, and direct UTF-8 readers and writers. The Kotlin layer supplies the type and construction rules; the engine handles JSON input and output without requiring an intermediate JSON tree. The [Java JSON article](/blog/fory_json_fastest_java_json_framework#how-fory-json-achieves-high-performance) explains these shared optimizations in detail.

## Performance {#performance-on-kotlin-models}

The benchmarks cover a small structured message and two documents of approximately 1 MB. They compare complete serialization and deserialization operations on Kotlin models.

### Methodology {#benchmark-setup}

Both benchmark suites ran on an Apple M5 with OpenJDK 25.0.3, comparing Fory JSON for Kotlin 1.7.1, kotlinx.serialization 1.11.0, Moshi 1.15.2 with generated adapters, and Jackson Kotlin 2.22.1.

All libraries process the same Kotlin models and input within each workload. Correctness checks verify fixture reads, round trips, and equivalent JSON output. String operations exclude UTF-8 conversion. For byte operations, Fory and Jackson use direct byte-array APIs, kotlinx.serialization uses its stream APIs, and Moshi uses Okio buffers; none converts through an intermediate String.

Charts show throughput in operations per second, where higher is better, with the errors reported by JMH. The [benchmark report](https://github.com/chaokunyang/kotlin-json-benchmarks/blob/71399f45a9e6a55c07e127d240019ca9198446db/README.md) contains the full configuration, input hashes, raw measurements, and reproduction commands.

### MediaContent: Structured Messages

The Eishay MediaContent fixture contains a media record and images, using strings, numbers, lists, and enums. Its Kotlin models have required constructor arguments, `val` properties, nullable members, and parameters with compiler defaults. Null and default output settings are aligned across libraries. Correctness tests cover default-on-missing behavior; the timed fixture does not separately measure that behavior.

![Kotlin MediaContent String serialization and deserialization throughput](/img/blog/fory-kotlin-json/string_throughput.png)

![Kotlin MediaContent UTF-8 byte serialization and deserialization throughput](/img/blog/fory-kotlin-json/utf8_bytes_throughput.png)

### 1 MB Users and Clients {#users-and-clients-larger-documents}

The larger suite ports the Users and Clients schemas from `java-json-benchmark` to Kotlin data classes. A deterministic generator appends complete records until the compact UTF-8 input reaches at least 1,000,000 bytes. Each operation processes an entire document.

#### Users

Users contains text fields, numeric values, tags, and nested friends. Its document holds 431 records in 1,001,958 UTF-8 bytes.

![Kotlin Users String serialization and deserialization throughput](/img/blog/fory-kotlin-json/users_string_throughput.png)

![Kotlin Users UTF-8 byte serialization and deserialization throughput](/img/blog/fory-kotlin-json/users_utf8_bytes_throughput.png)

#### Clients

Clients adds `UUID`, `BigDecimal`, `LocalDate`, and `OffsetDateTime`, along with enums, arrays, and nested partners. Its document holds 379 records in 1,000,779 UTF-8 bytes.

Fory uses built-in JDK codecs. kotlinx.serialization and Moshi use explicit adapters for UUIDs and dates as strings and `BigDecimal` as an unquoted number with full decimal precision. Jackson registers `JavaTimeModule`. Checks compare array contents and complete `OffsetDateTime` values, allowing equivalent timestamp spellings with different trailing fractional zeros.

![Kotlin Clients String serialization and deserialization throughput](/img/blog/fory-kotlin-json/clients_string_throughput.png)

![Kotlin Clients UTF-8 byte serialization and deserialization throughput](/img/blog/fory-kotlin-json/clients_utf8_bytes_throughput.png)

### Interpreting the Results

Fory achieved the highest throughput in all four operations for each workload. The ranges below compare its throughput with each library across String and UTF-8 serialization and deserialization, calculated from unrounded scores:

| Kotlin model | vs. kotlinx.serialization | vs. Moshi | vs. Jackson Kotlin |
| --- | ---: | ---: | ---: |
| MediaContent | 3.63×–11.62× | 6.35×–12.12× | 3.91×–8.37× |
| Users | 3.50×–9.21× | 3.47×–5.53× | 2.78×–5.16× |
| Clients | 4.36×–9.45× | 4.83×–8.99× | 3.31×–9.75× |

MediaContent shows the combined cost of mapping a small constructor-based model and processing its JSON. Users and Clients extend the comparison to longer documents, nested collections, and JDK value types. These results measure the Kotlin mapping layer and JSON engine together; they do not isolate individual optimizations.

The measurements describe the selected models and configuration on one machine. They do not measure value-class or sealed-hierarchy performance, or performance on Android and Native Image. The larger corpus follows the upstream field sizes and ranges but uses its own deterministic generation sequence, so it is not a controlled comparison with the separate Java benchmark.

## JVM, Android, and GraalVM {#jvm-and-deployment-support}

This module targets Kotlin/JVM and does not require `kotlin-reflect`. The [installation guide](/docs/json/kotlin#installation) covers compatibility, and the [runtime guide](/docs/json/getting-started) includes the recommended `java.lang.invoke` opening on JDK 25 and later.

Android API 26 and later uses interpreted JSON mapping. With R8 or ProGuard enabled, add `fory-json-kotlin-ksp` and annotate required source models with `JsonType` to preserve mapping information. GraalVM Native Image uses the `ForyJsonProvider` workflow to install the Kotlin module and select reachable models for code generation. The [platform guide](/docs/json/kotlin#graalvm-and-android) covers both setups. Kotlin/Native, Kotlin/JS, and Kotlin/Wasm are outside this module's scope.

## Further Reading {#learn-more}

The [Kotlin JSON guide](/docs/json/kotlin) covers type mapping and configuration; see [Custom Codecs](/docs/json/custom-codecs) for application-specific representations and [Security](/docs/json/security) for input limits. Source code and contribution instructions are available at [apache/fory](https://github.com/apache/fory).
