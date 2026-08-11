---
slug: fory_json_fastest_java_json_framework
title: "Introducing Apache Fory™ JSON: The Fastest Java JSON Framework in Our Benchmarks"
authors: [chaokunyang]
tags: [fory, java, json, serialization, performance]
---

**TL;DR**: Apache Fory JSON is a thread-safe Java framework for reading and writing standard JSON. It combines runtime-generated codecs with direct String and UTF-8 APIs, supports ordinary Java models, and runs on JDK 8+, Android, and GraalVM Native Image. In the published benchmark configurations below, Fory JSON is the fastest Java JSON serialization framework: up to **5.55× faster than Jackson and 10.00× faster than Gson** in the checked-in single-thread benchmark, and up to **10.91× faster than Jackson and 10.89× faster than Gson** with 1,000 KB payloads.

- GitHub: [apache/fory](https://github.com/apache/fory)
- Documentation: [Fory JSON](/docs/json/)
- Wider 1,000 KB benchmark context: [java-json-benchmark PR #129](https://github.com/fabienrenaud/java-json-benchmark/pull/129)

<img src="/img/fory-logo-light.png" width="50%"/>

---

## JSON is still on the hot path

JSON is rarely the most interesting part of a Java service. It is simply everywhere: HTTP APIs, browser traffic, event envelopes, logs, configuration, and integrations with systems that do not share a binary protocol. That makes JSON processing a recurring CPU and allocation cost, often paid on every request.

Fory already provides compact binary object serialization and a cross-language protocol. Fory JSON tackles a different job. It maps Java objects to ordinary JSON text and UTF-8 bytes, so the result remains readable by browsers, command-line tools, and any standards-compliant JSON implementation.

There is no Fory-specific envelope and no binary metadata hidden in the document. This is standard JSON, built for Java applications that need to keep the wire format while spending less time converting it.

## A complete round trip

Fory JSON 1.6.0 is available from Maven Central:

```xml
<dependency>
  <groupId>org.apache.fory</groupId>
  <artifactId>fory-json</artifactId>
  <version>1.6.0</version>
</dependency>
```

Create one `ForyJson` instance and reuse it. The built instance is immutable and thread-safe.

```java
import org.apache.fory.json.ForyJson;

public final class JsonExample {
  private static final ForyJson JSON = ForyJson.builder().build();

  public static final class User {
    public long id;
    public String name;

    public User() {}

    User(long id, String name) {
      this.id = id;
      this.name = name;
    }
  }

  public static void main(String[] args) {
    User input = new User(7, "Alice");

    String text = JSON.toJson(input);
    byte[] utf8 = JSON.toJsonBytes(input);

    User fromText = JSON.fromJson(text, User.class);
    User fromUtf8 = JSON.fromJson(utf8, User.class);

    System.out.println(text);              // {"id":7,"name":"Alice"}
    System.out.println(fromText.name);      // Alice
    System.out.println(fromUtf8.name);      // Alice
  }
}
```

String and byte-array APIs are both first-class. For generic roots, a `TypeRef<List<User>>` keeps the element type available on reads and declared writes. Fory JSON can also write a complete UTF-8 document to an `OutputStream` without taking ownership of the stream.

## Where the speed comes from

Fory JSON prepares a codec for each Java type it encounters. Runtime code generation and asynchronous compilation are enabled by default on a standard JDK, while an interpreted path remains available for restricted environments and diagnostics. Generated codecs specialize the object-mapping work for the target class instead of rediscovering the same property model on every call.

The public API also avoids making applications bounce through unnecessary representations. A service that already needs network bytes can call `toJsonBytes` and `fromJson(byte[], type)` directly. Applications working with text can stay on the String path. Custom codecs read and write through Fory's concrete JSON reader and writer rather than building an intermediate JSON tree.

Reuse matters too. A built `ForyJson` instance keeps prepared type metadata and a fixed set of reusable execution states. Multiple threads can share it, while retained writer buffers and cached input field names have explicit limits.

These choices are fairly unglamorous. That is a compliment. Fast JSON usually comes from removing repeated work in ordinary paths, not from changing what JSON means.

## The fastest Java JSON framework in these benchmarks

Any useful performance claim needs a workload. We use two views here: Apache Fory's checked-in single-thread benchmark and a three-thread benchmark that processes one 1,000 KB object per invocation. Both report throughput in operations per second, so higher is better.

The tables intentionally compare Fory JSON only with Jackson and Gson. For the wider large-payload matrix, exact payload setup, and the benchmark integration, see [PR #129 in `java-json-benchmark`](https://github.com/fabienrenaud/java-json-benchmark/pull/129).

### String and UTF-8 byte APIs

The checked-in Apache Fory benchmark ran on an Apple M4 Pro with JDK 26.0.1. It used one JMH fork and one thread, with three 2-second warmup iterations followed by five 2-second measurement iterations.

![Java JSON String benchmark throughput](../docs/benchmarks/json/java/string_throughput.png)

![Java JSON UTF-8 bytes benchmark throughput](../docs/benchmarks/json/java/utf8_bytes_throughput.png)

| Representation | Operation   | Fory JSON ops/s | Jackson ops/s | Gson ops/s | vs. Jackson | vs. Gson |
| -------------- | ----------- | --------------: | ------------: | ---------: | ----------: | -------: |
| String         | Serialize   |       7,387,465 |     2,049,368 |  1,084,042 |       3.60× |    6.81× |
| String         | Deserialize |       2,897,955 |     1,074,885 |    902,772 |       2.70× |    3.21× |
| UTF-8 bytes    | Serialize   |      10,375,498 |     1,868,614 |  1,037,211 |       5.55× |   10.00× |
| UTF-8 bytes    | Deserialize |       3,077,158 |     1,268,397 |    933,079 |       2.43× |    3.30× |

Fory JSON leads all four rows. Its largest advantage appears on UTF-8 serialization, where it passes 10 million operations per second and reaches 5.55× Jackson throughput and 10.00× Gson throughput.

The String and UTF-8 groups are deliberately separate. The String group excludes UTF-8 conversion. The byte group uses direct byte-array APIs where a library provides them; Gson includes its required String-to-byte and byte-to-String conversion.

### 1,000 KB payloads: three concurrent workers

The 1,000 KB suite asks what happens when each invocation has substantial parsing, traversal, and output work.

The 1,000 KB run used Fory JSON 1.6.0, Jackson Databind 2.17.1, and Gson 2.11.0 with the databind API. JMH ran two forks and three threads. Each fork used five 3-second warmup iterations and five 3-second measurement iterations. The Users and Clients payloads each contained one 1,000 KB object per invocation.

| Payload | Operation       | Fory JSON ops/s       | Jackson ops/s         | Gson ops/s            | vs. Jackson | vs. Gson |
| ------- | --------------- | --------------------: | --------------------: | --------------------: | ----------: | -------: |
| Users   | Serialization   | 11,867.566 ± 136.846  | 2,225.296 ± 687.106   | 1,674.083 ± 12.558    |       5.33× |    7.09× |
| Users   | Deserialization | 6,872.876 ± 46.998    | 1,940.172 ± 58.242    | 1,217.513 ± 12.358    |       3.54× |    5.65× |
| Clients | Serialization   | 11,895.269 ± 183.251  | 1,706.314 ± 36.263    | 1,298.288 ± 27.405    |       6.97× |    9.16× |
| Clients | Deserialization | 6,442.262 ± 627.116   | 590.656 ± 10.849      | 591.350 ± 6.444       |      10.91× |   10.89× |

Fory JSON again leads every published comparison. Across these four large-payload cases, it delivers 3.54× to 10.91× Jackson throughput and 5.65× to 10.89× Gson throughput.

The Clients deserialization result deserves one detail from the run report: Fory's two fork means differed by 12.9%, which widened its aggregate interval. Even with that variation, the aggregate mean remained roughly 10.9× the Jackson and Gson means. The [PR #129 benchmark report](https://github.com/fabienrenaud/java-json-benchmark/pull/129) carries the wider matrix and complete context rather than compressing all of it into this introduction.

No benchmark can promise the same multiplier for every domain model, JDK, machine, or configuration. These results support a narrower and still notable conclusion: in both published configurations reported here, Fory JSON is the fastest Java JSON serialization framework.

## A fast path that still understands Java

Performance would be much less useful if it required flattening every application model into hand-written transfer objects. Fory JSON maps the Java shapes developers already use:

- ordinary mutable classes and inherited fields;
- Java records and immutable classes built through `JsonCreator`;
- generic collections and maps through `TypeRef`;
- Java time, optionals, atomics, UUIDs, paths, big numbers, enums, and common collection types;
- natural `JsonObject` and `JsonArray` trees when the target type is dynamic.

Property discovery can combine fields with JavaBean getters and setters, or switch to field-only mode. A finite `JsonSubTypes` table handles declared polymorphic models without accepting arbitrary class names from input.

The annotation set covers the cases that tend to appear after the first production deployment: explicit property names and ordering, ignored directions, custom date/time formats, Base64 byte arrays, flattened objects, dynamic members, validators, subtype discriminators, and complete value representations.

For a third-party type that cannot carry annotations, a Mixin overlays the same Fory JSON annotations without changing or wrapping the target class:

```java
import org.apache.fory.json.ForyJson;
import org.apache.fory.json.annotation.JsonMixin;
import org.apache.fory.json.annotation.JsonProperty;

@JsonMixin(target = ThirdPartyUser.class)
abstract class ThirdPartyUserMixin {
  @JsonProperty("user_id")
  long id;
}

ForyJson json =
    ForyJson.builder()
        .registerMixin(ThirdPartyUserMixin.class)
        .build();
```

When annotations are not enough, `JsonValueCodec<T>` owns one complete JSON value and streams it through Fory's reader and writer. Child codec selections can customize collection elements, optional contents, and map keys or values without replacing the surrounding container mapping.

## JDK, Android, and native executables

The same `fory-json` artifact supports Java 8 and later. Java records require Java 17 or later.

On Android API level 26+, Fory JSON automatically uses interpreted object mapping because runtime compilation is unavailable. The Fory annotation processor can generate direct model access and exact R8 rules for `JsonType` classes and Mixins.

GraalVM Native Image has its own build-time integration. Mark reachable models with `JsonType` for prepared access metadata. If a particular completed `ForyJson` configuration should use generated codecs in the native executable, expose it from a reachable `ForyJsonProvider`; other prepared configurations continue to work with interpreted codecs.

This gives applications one mapping model across a normal JVM, Android, and native executables without pretending those runtimes have the same code-generation capabilities.

## Treat input limits as part of the API

A fast parser can consume bad input quickly too. Fory JSON does not derive arbitrary Java class names from a JSON document, and it always applies a fixed type disallow list. Applications can add a `JsonTypeChecker` allow-list for their own model surface.

Input depth defaults to 20. A separate graph-memory budget defaults to 128 MiB per root read and estimates the retained object graph created by arrays, collections, maps, records, and application objects. `JsonValidator` methods can enforce domain rules after a mapped object is complete.

Those controls do not replace HTTP body limits, authentication, authorization, timeouts, or endpoint-specific validation. They give the JSON layer clear boundaries to combine with those external controls. The [Fory JSON security guide](/docs/json/security) documents the accounting model and recommended negative tests.

## Choosing the right Fory format

Choose Fory JSON when the wire must remain ordinary JSON: public APIs, browser clients, configuration, logs, or an integration that already speaks JSON. You get the interoperability of the format with a Java implementation designed around generated codecs and reusable state.

Choose Fory's binary object serialization when both sides can use a binary protocol and the application needs features JSON does not carry, such as cross-language schema metadata, shared-reference identity, or circular object graphs. The two formats solve different problems and can live in the same service.

## Start here

The fastest route to a useful evaluation is to replace one representative Jackson or Gson round trip, reuse a single `ForyJson` instance, and benchmark the application's real model and JDK settings. The published numbers show the available headroom; the application workload tells you how much of it matters.

- Read the [Fory JSON overview](/docs/json/).
- Run the [Getting Started example](/docs/json/getting-started).
- Inspect the [complete checked-in Java JSON benchmark](/docs/benchmarks/json/java/).
- Review the [1,000 KB benchmark and broader matrix in PR #129](https://github.com/fabienrenaud/java-json-benchmark/pull/129).
- Join development at [apache/fory](https://github.com/apache/fory).

Fory JSON keeps the format everyone already understands. The difference is how little time your Java service has to spend on it.
