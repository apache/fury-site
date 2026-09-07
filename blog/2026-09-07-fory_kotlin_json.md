---
slug: fory_kotlin_json
title: "Introducing Apache Fory™ JSON for Kotlin: Fast Serialization with Kotlin Semantics"
description: "Fory JSON maps Kotlin models to standard JSON while preserving constructor defaults, nullability, value classes, and sealed hierarchies. Learn how to use it and explore Kotlin MediaContent and 1000 KB benchmark results."
authors: [chaokunyang]
tags: [fory, kotlin, java, json, serialization, performance]
---

**TL;DR**: Apache Fory JSON for Kotlin combines standard JSON interoperability with Kotlin constructor defaults, nullability, value classes, and sealed hierarchies. The JVM module supports String and direct UTF-8 APIs without requiring `kotlin-reflect`. In the benchmarks presented here, Fory JSON Kotlin 1.7.1 delivers **3.63×–12.12× the throughput** of kotlinx.serialization, Moshi, and Jackson Kotlin on MediaContent, and **2.78×–9.75×** on 1000 KB Users and Clients documents.

- GitHub: [apache/fory](https://github.com/apache/fory)
- Documentation: [Fory JSON for Kotlin](/docs/json/kotlin)
- Measurements: [Kotlin JSON benchmark report](https://github.com/chaokunyang/kotlin-json-benchmarks/blob/71399f45a9e6a55c07e127d240019ca9198446db/README.md)

<img src="/img/fory-logo-light.png" width="50%"/>

---

## Kotlin Models as JSON Contracts

A Kotlin data class describes how an object should be constructed as well as the values it contains. Required parameters must be supplied, defaults apply to omitted members, and nullability determines whether an explicit null is valid. These rules matter when a JSON document becomes an application object.

Apache Fory JSON maps those models to standard JSON text and UTF-8 bytes. Its Kotlin module interprets the declared Kotlin types and invokes normal construction, preserving initialization and validation. Applications can therefore use constructor-based models directly, including classes with required `val` properties.

The module adds Kotlin type handling to Fory's existing JSON runtime. Applications use the same parsing and output engine as the Java implementation, with construction guided by Kotlin metadata.

## Getting Started

Add the Kotlin JSON module, keeping all Fory dependencies on the same version:

```kotlin title="build.gradle.kts"
plugins {
  kotlin("jvm") version "2.3.20"
}

repositories {
  mavenCentral()
}

dependencies {
  implementation("org.apache.fory:fory-json-kotlin:1.7.1")
}
```

Create a runtime and a type token for the model. The runtime is immutable and thread-safe; retain both objects for repeated use:

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

  val fromText = json.fromJson(text, accountType)
  val fromUtf8 = json.fromJson(utf8, accountType)

  check(fromText == input)
  check(fromUtf8 == input)
  println(fromText.name) // Alice
}
```

This example needs no model annotations or serialization compiler plugin on a standard JVM. `ForyJsonKotlin.builder()` installs the Kotlin module, and `jsonTypeRef<Account>()` preserves the declared model's unsigned and nullable types. A Java `Class` alone cannot express all of those distinctions.

The String and byte-array methods produce the same JSON representation. The byte methods operate directly on UTF-8, which avoids an intermediate String when an HTTP client, message transport, or storage API already exchanges bytes.

## Constructor Defaults and Nullability

The declared type determines how missing members are handled. For the following request, `id` is required, while `label` and `retries` have compiler defaults:

```kotlin
data class Request(
  val id: Long,
  val label: String? = "new",
  val retries: Int = 3,
)
```

Fory selects the primary constructor automatically. An absent member invokes its default when one exists; an explicit JSON null is checked against the parameter's nullability:

| JSON input | Result |
| --- | --- |
| `{"id":1}` | `Request(1, "new", 3)` |
| `{"id":1,"label":null}` | `Request(1, null, 3)` |
| `{"label":"ready"}` | Rejected: required `id` is missing |
| `{"id":1,"retries":null}` | Rejected: `retries` is non-null |

This distinction also affects serialization. If `label` is null, omitting it would cause a reader to restore `"new"`. Fory therefore writes nullable constructor properties explicitly when they contain null, so its output reconstructs the same value under the same configuration.

Nullability and defaults remain independent: a nullable parameter without a default still requires a JSON member. The same type information extends into containers. `jsonTypeRef<List<Account?>>()` permits null elements, while `jsonTypeRef<List<Account>>()` rejects them. Retaining the full declared type preserves these rules through nested generic models.

The [Kotlin guide](/docs/json/kotlin#immutable-classes-and-compiler-defaults) covers secondary constructors, explicit creators, and properties declared in the class body.

## Preserving Domain Types

Value classes allow an application to distinguish domain identifiers without adding another object to the JSON document. Fory maps an eligible value class to its underlying value and runs its initialization checks during reconstruction:

```kotlin
import org.apache.fory.json.kotlin.ForyJsonKotlin
import org.apache.fory.json.kotlin.jsonTypeRef

@JvmInline
value class AccountId(val value: ULong) {
  init {
    require(value > 0uL)
  }
}

val json = ForyJsonKotlin.builder().build()
val idType = jsonTypeRef<AccountId>()

val text = json.toJson(AccountId(42uL), idType) // 42
val restored = json.fromJson(text, idType)
```

Here, `AccountId` remains a distinct application type, while its JSON representation is the number `42`. The type token retains that identity even when the JVM represents the value through a primitive carrier.

Unsigned integers preserve their decimal representation, including the full `ULong` range. When an API requires 64-bit integers as JSON strings, `ForyJsonKotlin.builder().writeLongAsString(true)` applies that representation to `Long` and `ULong`, including supported containers and value classes. Readers accept either quoted or unquoted integer tokens.

Automatic mapping must have an unambiguous representation. A nullable value class with a nullable underlying value would give two distinct states the same JSON null, so that case requires a tagged custom codec. The [type support table](/docs/json/kotlin#supported-kotlin-types) documents the remaining Kotlin types and their representations.

## Sealed Types and JSON Annotations

Some API values have several possible shapes. A Kotlin sealed hierarchy defines those alternatives in the model itself. Annotating its base with `JsonSubTypes` lets Fory infer the concrete variants:

```kotlin
import org.apache.fory.json.annotation.JsonSubTypes
import org.apache.fory.json.kotlin.ForyJsonKotlin
import org.apache.fory.json.kotlin.jsonTypeRef

@JsonSubTypes(property = "kind")
sealed interface Payment

data class CardPayment(val lastFour: String) : Payment
data class BankTransfer(val account: String) : Payment

val json = ForyJsonKotlin.builder().build()
val paymentType = jsonTypeRef<Payment>()

val text = json.toJson(CardPayment("4242"), paymentType)
// {"kind":"CardPayment","lastFour":"4242"}
val decoded = json.fromJson(text, paymentType)
```

Using the declared `Payment` type selects the subtype table. The `kind` property contains a logical variant name, and unknown names are rejected. JSON input cannot supply an arbitrary JVM class. Inferred names follow source class names; an explicit subtype table provides stable wire names when an API must remain independent of source renaming. The same mapping applies within `jsonTypeRef<List<Payment>>()`.

Annotations can also align individual Kotlin properties with an existing JSON contract. An explicit use-site target identifies the JVM element that should receive the annotation:

```kotlin
import org.apache.fory.json.annotation.JsonProperty

data class Profile(
  @param:JsonProperty("user_id")
  val id: Long,
  val name: String,
)
```

In this example, the constructor parameter `id` maps to the JSON member `user_id`. Naming, formatting, Mixins, and custom codecs use Fory's shared annotation system. The [annotation guide](/docs/json/annotations#kotlin-use-site-targets) explains the supported Kotlin targets and how they combine.

## Performance on Kotlin Models

Kotlin-aware construction does not require discovering the model anew for each operation. Fory prepares codecs for the declared schema and reuses that preparation across calls. On standard JDKs, generated codecs specialize property access, object framing, and primitive operations. Deserialization still invokes the model's constructor and enforces its type rules.

The JSON engine also reuses internal buffers and writes UTF-8 directly. Returning a String or byte array still allocates the requested result; buffer reuse reduces temporary work around that allocation. Together, these mechanisms support repeated operations on Kotlin models. The [Java JSON introduction](/blog/fory_json_fastest_java_json_framework) describes the shared engine's lower-level optimizations.

### Benchmark Setup

The Kotlin runs compare Fory JSON Kotlin 1.7.1, kotlinx.serialization 1.11.0, Moshi 1.15.2 with generated adapters, and Jackson Kotlin 2.22.1. Both used an Apple M5 and OpenJDK 25.0.3. JMH 1.37 ran one fork and one thread, with three 2-second warmup iterations and five 2-second measurement iterations.

All libraries process the same Kotlin models with required constructor arguments and the same input within each workload. Codecs, serializers, adapters, and typed readers/writers are prepared before timing, including Fory's runtime code generation. Setup verifies fixture reads, round trips, and equivalent JSON output. The checks follow the [Apache Fory Kotlin benchmark methodology](/docs/benchmarks/json/kotlin/).

String operations exclude UTF-8 conversion. For byte operations, Fory and Jackson use direct byte-array APIs, kotlinx.serialization uses `encodeToStream` and `decodeFromStream`, and Moshi uses an Okio `Buffer`. Stream and buffer creation and byte-array extraction are included in the measurement; these paths do not convert through an intermediate String.

Tables report operations per second, rounded to the nearest whole operation; higher is better. Charts show the errors reported by JMH. Full measurements, environment records, and reproduction commands are available in the [benchmark report](https://github.com/chaokunyang/kotlin-json-benchmarks/blob/71399f45a9e6a55c07e127d240019ca9198446db/README.md).

### MediaContent: Structured Messages

The Eishay MediaContent fixture contains a media record and images, with strings, numbers, lists, and enums. Its Kotlin models use required constructor arguments and `val` properties. The fixture also exercises nullable members and constructor defaults, with null and default output configured consistently across libraries.

![Kotlin MediaContent String serialization and deserialization throughput](/img/blog/fory-kotlin-json/string_throughput.png)

![Kotlin MediaContent UTF-8 byte serialization and deserialization throughput](/img/blog/fory-kotlin-json/utf8_bytes_throughput.png)

| Representation | Operation | Fory JSON Kotlin ops/s | kotlinx.serialization ops/s | Moshi ops/s | Jackson Kotlin ops/s |
| --- | --- | ---: | ---: | ---: | ---: |
| String | Serialize | 8,463,544 | 2,331,337 | 1,009,654 | 2,166,486 |
| String | Deserialize | 3,963,797 | 631,164 | 513,445 | 508,099 |
| UTF-8 bytes | Serialize | 12,314,484 | 1,059,643 | 1,015,884 | 1,954,090 |
| UTF-8 bytes | Deserialize | 4,449,742 | 729,606 | 701,187 | 531,665 |

Fory records the highest throughput in all four operations, reaching **12.31 million UTF-8 serializations per second**. Its largest serialization advantage is on the byte API: 11.62× kotlinx.serialization's throughput and 12.12× Moshi's. On byte deserialization, it reaches 8.37× Jackson Kotlin's throughput.

### Users and Clients: Larger Documents

The larger suite ports the Users and Clients schemas from `java-json-benchmark` to Kotlin data classes. Users contains text fields, numeric values, tags, and nested friends. Clients adds JDK value types such as `UUID`, `BigDecimal`, `LocalDate`, and `OffsetDateTime`, together with enums, arrays, and nested partners.

Each operation processes a complete document. The deterministic generator appends records until the compact UTF-8 input reaches at least 1,000,000 bytes:

| Kotlin model | UTF-8 document size | Records |
| --- | ---: | ---: |
| Users | 1,001,958 bytes | 431 |
| Clients | 1,000,779 bytes | 379 |

Fory uses its built-in JDK codecs. kotlinx.serialization and Moshi use explicit adapters for UUIDs and dates as strings and `BigDecimal` as an unquoted number without losing decimal digits. Jackson registers `JavaTimeModule` 2.22.1. Correctness checks compare array contents and complete `OffsetDateTime` values, allowing equivalent timestamp spellings with different trailing fractional zeros.

#### Users

![Kotlin Users String serialization and deserialization throughput](/img/blog/fory-kotlin-json/users_string_throughput.png)

![Kotlin Users UTF-8 byte serialization and deserialization throughput](/img/blog/fory-kotlin-json/users_utf8_bytes_throughput.png)

| Representation | Operation | Fory JSON Kotlin ops/s | kotlinx.serialization ops/s | Moshi ops/s | Jackson Kotlin ops/s |
| --- | --- | ---: | ---: | ---: | ---: |
| String | Serialize | 3,132 | 520 | 625 | 1,128 |
| String | Deserialize | 1,782 | 509 | 443 | 371 |
| UTF-8 bytes | Serialize | 3,536 | 384 | 639 | 1,003 |
| UTF-8 bytes | Deserialize | 2,046 | 480 | 590 | 396 |

On Users, Fory's UTF-8 serialization throughput is 9.21× that of kotlinx.serialization, 5.53× that of Moshi, and 3.52× that of Jackson Kotlin. It also leads both deserialization operations, where the workload includes constructing the nested records and collections.

#### Clients

![Kotlin Clients String serialization and deserialization throughput](/img/blog/fory-kotlin-json/clients_string_throughput.png)

![Kotlin Clients UTF-8 byte serialization and deserialization throughput](/img/blog/fory-kotlin-json/clients_utf8_bytes_throughput.png)

| Representation | Operation | Fory JSON Kotlin ops/s | kotlinx.serialization ops/s | Moshi ops/s | Jackson Kotlin ops/s |
| --- | --- | ---: | ---: | ---: | ---: |
| String | Serialize | 2,393 | 549 | 496 | 724 |
| String | Deserialize | 1,955 | 258 | 217 | 200 |
| UTF-8 bytes | Serialize | 3,947 | 418 | 499 | 621 |
| UTF-8 bytes | Deserialize | 2,070 | 256 | 253 | 215 |

On Clients String deserialization, Fory reaches **7.59× kotlinx.serialization, 8.99× Moshi, and 9.75× Jackson Kotlin**. These measurements extend the comparison to models containing JDK values and arrays as well as text and collections. All 32 Users/Clients cases completed, producing 160 measurement samples.

### Interpreting the Results

Across each workload's four operations, Fory's throughput relative to the other libraries falls within the following ranges. Ratios are calculated from unrounded scores:

| Kotlin model | vs. kotlinx.serialization | vs. Moshi | vs. Jackson Kotlin |
| --- | ---: | ---: | ---: |
| MediaContent | 3.63×–11.62× | 6.35×–12.12× | 3.91×–8.37× |
| Users | 3.50×–9.21× | 3.47×–5.53× | 2.78×–5.16× |
| Clients | 4.36×–9.45× | 4.83×–8.99× | 3.31×–9.75× |

The 1000 KB Kotlin results span **2.78×–9.75×** the throughput of the compared libraries. These are measurements of the selected models and configurations; performance for value classes and sealed hierarchies is not measured by these workloads.

The Users/Clients corpus follows the upstream field lengths, numeric ranges, and collection sizes, but uses its own deterministic generation sequence. Its [input hashes and environment record](https://github.com/chaokunyang/kotlin-json-benchmarks/blob/71399f45a9e6a55c07e127d240019ca9198446db/results/users-clients/environment.json) identify the tested documents. The smaller MediaContent run has a separate [environment record](https://github.com/chaokunyang/kotlin-json-benchmarks/blob/71399f45a9e6a55c07e127d240019ca9198446db/results/environment.json).

### Java Benchmark Context

The shared engine also has published Java measurements. The table below summarizes Fory JSON's throughput relative to Jackson and Gson across the operations reported for each workload:

| Java workload | vs. Jackson | vs. Gson |
| --- | ---: | ---: |
| [MediaContent: String and UTF-8](/docs/benchmarks/json/java/) | 2.43×–5.55× | 3.21×–10.00× |
| [Users: 1000 KB](https://github.com/fabienrenaud/java-json-benchmark/pull/129) | 3.54×–5.33× | 5.65×–7.09× |
| [Clients: 1000 KB](https://github.com/fabienrenaud/java-json-benchmark/pull/129) | 6.97×–10.91× | 9.16×–10.89× |

These are separate Java runs, with different library versions and measurement configurations. The large-document Java report uses Fory JSON 1.6.0; Gson's byte measurements in the Java MediaContent report include its required String conversion. The linked reports retain the full scores and setup. They provide context for the shared engine, rather than a Kotlin-versus-Java performance comparison.

## JVM and Deployment Support

The module targets Kotlin/JVM and does not require `kotlin-reflect`. Its runtime is built with Kotlin 2.3.20 and accepts model metadata supported by Kotlin's strict metadata reader. The [getting-started guide](/docs/json/getting-started) covers runtime configuration, including the recommended `java.lang.invoke` opening on JDK 25 and later.

On Android API 26 and later, Fory uses interpreted JSON mapping. When R8 or ProGuard is enabled, add `fory-json-kotlin-ksp` and mark required source models with `JsonType` to preserve their mapping. GraalVM Native Image uses the `ForyJsonProvider` workflow: install the Kotlin module and select reachable models for code generation. The [Kotlin platform guide](/docs/json/kotlin#graalvm-and-android) provides the configuration for both environments. Kotlin/Native, Kotlin/JS, and Kotlin/Wasm are outside this module's scope.

## Learn More

Fory JSON allows Kotlin applications to retain the meaning of their model declarations while exchanging standard JSON. Constructor defaults, nullability, value-class identity, and sealed alternatives remain part of the mapping, with String and UTF-8 APIs available through the same reusable runtime.

The [Kotlin JSON guide](/docs/json/kotlin) provides the complete mapping and platform reference. For application-specific representations, see [Custom Codecs](/docs/json/custom-codecs); for input limits and type controls, see [Security](/docs/json/security). Source code and contribution instructions are available at [apache/fory](https://github.com/apache/fory).
