---
slug: fory_1_7_0_release
title: Fory v1.7.0 Released
description: "Fory 1.7.0 adds JSON support for Scala and Kotlin and incremental decoding for JSON arrays and NDJSON streams."
authors: [chaokunyang]
tags: [fory, java, scala, kotlin, swift]
---

The Apache Fory team is pleased to announce the 1.7.0 release. This release includes [26 PRs](https://github.com/apache/fory/compare/v1.6.1...v1.7.0). See the [Getting Started](https://fory.apache.org/docs/start/) page to get the libraries for your platform.

## Highlights

- Added Fory JSON support for Scala 2.13 and Scala 3.
- Added Fory JSON support for Kotlin on Android, the JVM, and GraalVM Native Image.
- Enhanced Fory JSON on GraalVM Native Image with build-time code generation enabled by default and fine-grained generated codec caching.
- Added incremental JSON stream decoding for top-level arrays and newline-delimited JSON (NDJSON), allowing values to be processed progressively from chunked UTF-8 input.
- Expanded Swift platform support to visionOS, watchOS, tvOS, and Linux, and added Swift gRPC code generation.

## JSON Support for Scala

Fory 1.7.0 introduces `fory-json-scala` for Scala 2.13 and Scala 3. Scala applications can read and write standard JSON using case classes, constructor defaults, `Option`, `Either`, tuples, collections, maps, and value classes. The module works on the JVM and GraalVM Native Image.

Add the Scala JSON module to your sbt build:

```sbt
libraryDependencies += "org.apache.fory" %% "fory-json-scala" % "1.7.0"
```

Create a reusable `ForyJson` instance with `ForyJsonScala.builder()`. Missing defaulted parameters use Scala's compiler-generated constructor defaults, so immutable case classes do not need a zero-argument constructor or mutable fields:

```scala
import org.apache.fory.json.scala.ForyJsonScala

case class Person(name: String, age: Int = 18, aliases: List[String] = Nil)

val json = ForyJsonScala.builder().build()
val person = json.fromJson("""{"name":"Ada"}""", classOf[Person])
assert(person == Person("Ada", 18, Nil))

val text = json.toJson(person)
```

Fory JSON annotations work on Scala constructor properties. Scala 2 `Enumeration` values can use `JsonEnumeration` to retain their owning enumeration, including values inside collections and maps. On Scala 3, `derives ScalaJsonCodec` supports enums with parameterized cases and, together with `JsonSubTypes`, sealed hierarchies whose allowed subtypes are declared by the application.

Use a complete `TypeRef` for parameterized types, or `ScalaTypeRef` when Scala value-type arguments would otherwise be erased. See the [Scala JSON guide](/docs/json/scala) for supported types, annotations, and Native Image setup.

## JSON Support for Kotlin

The new `fory-json-kotlin` module maps Kotlin models to standard JSON while preserving constructor defaults, nullability, unsigned types, value classes, and generic arguments. It supports the JVM, Android API 26 and later, and GraalVM Native Image without requiring `kotlin-reflect`.

Add the runtime dependency:

```kotlin
dependencies {
  implementation("org.apache.fory:fory-json-kotlin:1.7.0")
}
```

Use `jsonTypeRef<T>()` to retain Kotlin type information at the root and in nested values. Ordinary Java type tokens cannot represent every Kotlin distinction, such as nullable collection elements or a value class lowered to a primitive:

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

val account = json.fromJson("""{"id":7,"name":"Alice"}""", accountType)
val text = json.toJson(account, accountType)
```

A missing member invokes its constructor default when one exists. An explicit JSON `null` is checked against the Kotlin declaration and never requests a default. Fory calls the model's constructor, so initialization and validation still run. Sealed classes and interfaces can use `JsonSubTypes` to declare a closed set of logical subtype names.

On Android, runtime JSON code generation is disabled. Use the `fory-json-kotlin-ksp` processor when R8 or ProGuard shrinks Kotlin models, together with `JsonType` on application models or an exact `JsonMixin` for third-party targets. For Native Image, install `ForyJsonKotlin` in a reachable `ForyJsonProvider` configuration and make the required models and exact generic bindings reachable at build time. See the [Kotlin JSON guide](/docs/json/kotlin), [Android guide](/docs/json/android), and [GraalVM Native Image guide](/docs/json/graalvm) for setup and supported configurations.

## Incremental JSON Stream Decoding

Fory JSON can now decode a top-level array or NDJSON stream as UTF-8 chunks arrive. Applications can process each completed element or record without buffering the complete document or waiting for the end of the stream. Chunks are supplied as `ByteBuffer` instances and can end partway through a JSON value.

Use `newArrayStreamDecoder` for one top-level JSON array. Each successful `decodeNext` call exposes one decoded element through `value()`:

```java
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import org.apache.fory.json.ForyJson;
import org.apache.fory.json.JsonStreamDecoder;

public final class User {
  public long id;
  public String name;
}

ForyJson json = ForyJson.builder().build();
JsonStreamDecoder<User> decoder =
    json.newArrayStreamDecoder(User.class, 1024 * 1024);

ByteBuffer[] chunks = {
  ByteBuffer.wrap("[{\"id\":1,\"name\":\"Ada\"},".getBytes(StandardCharsets.UTF_8)),
  ByteBuffer.wrap("{\"id\":2,\"name\":\"Al".getBytes(StandardCharsets.UTF_8)),
  ByteBuffer.wrap("ice\"}]".getBytes(StandardCharsets.UTF_8))
};

for (ByteBuffer chunk : chunks) {
  while (decoder.decodeNext(chunk)) {
    User user = decoder.value();
    System.out.println(user.id + ": " + user.name);
  }
}
decoder.finish();
```

Use `newNdjsonStreamDecoder` for records separated by LF or CRLF. Call `finish()` at the end of input and consume its value when it returns `true`: this handles a final record without a trailing newline.

```java
JsonStreamDecoder<User> decoder =
    json.newNdjsonStreamDecoder(User.class, 1024 * 1024);

ByteBuffer chunk = ByteBuffer.wrap(
    ("{\"id\":1,\"name\":\"Ada\"}\n"
        + "{\"id\":2,\"name\":\"Alice\"}").getBytes(StandardCharsets.UTF_8));
while (decoder.decodeNext(chunk)) {
  User user = decoder.value();
  System.out.println(user.id + ": " + user.name);
}
if (decoder.finish()) {
  User user = decoder.value();
  System.out.println(user.id + ": " + user.name);
}
```

Drain each chunk before supplying the next one. The required `maxValueBytes` argument limits each array element or NDJSON record, rather than the complete stream. A decoder belongs to one stream, is not thread-safe, and cannot be reused after completion or failure. See [Incremental JSON streams](/docs/json/getting-started#incremental-json-streams) for buffer ownership, null values, and byte-limit details.

## Features

- feat(scala): add json support for scala by @chaokunyang in https://github.com/apache/fory/pull/3934
- feat(scala): add scala2 json enumeration annotation by @chaokunyang in https://github.com/apache/fory/pull/3935
- perf(scala): streamline exact List JSON writes by @chaokunyang in https://github.com/apache/fory/pull/3936
- feat(json): add Kotlin JSON support by @chaokunyang in https://github.com/apache/fory/pull/3937
- ci: reduce Android Kotlin setup time by @chaokunyang in https://github.com/apache/fory/pull/3951
- feat: harden deserialization paths by @chaokunyang in https://github.com/apache/fory/pull/3955
- feat(java): add incremental JSON stream decoding by @chaokunyang in https://github.com/apache/fory/pull/3956
- ci: isolate Scala snapshot dependencies by @chaokunyang in https://github.com/apache/fory/pull/3957
- refactor(java): remove unbounded metadata decompression by @chaokunyang in https://github.com/apache/fory/pull/3958
- feat(json): expose stream value limit errors by @chaokunyang in https://github.com/apache/fory/pull/3959
- perf(java): optimize GraalVM JSON interpreted access by @chaokunyang in https://github.com/apache/fory/pull/3960
- perf(json): add ordered field read fast path by @chaokunyang in https://github.com/apache/fory/pull/3962
- feat(java): refactor java generated codec cache granularity by @chaokunyang in https://github.com/apache/fory/pull/3963
- feat(java): parse quoted JSON scalar values by @chaokunyang in https://github.com/apache/fory/pull/3967
- feat(java): add sealed interface json subtypes support by @chaokunyang in https://github.com/apache/fory/pull/3968
- feat(compiler): Add grpc support for Swift by @yash-agarwa-l in https://github.com/apache/fory/pull/3776
- feat(swift): support more platforms by @chaokunyang in https://github.com/apache/fory/pull/3973

## Bug Fix

- fix(scala): target Java 8 bytecode for fory-scala by @KarasevRob in https://github.com/apache/fory/pull/3941
- fix(scala): support Enumeration JSON on Scala 3 by @chaokunyang in https://github.com/apache/fory/pull/3952
- ci: stabilize JVM snapshot publishing by @chaokunyang in https://github.com/apache/fory/pull/3953
- fix: fix source release artifact by @chaokunyang in https://github.com/apache/fory/pull/3969

## Other Improvements

- chore: Bump org.apache.logging.log4j:log4j-api from 2.25.4 to 2.25.5 in /java/fory-test-core by @dependabot[bot] in https://github.com/apache/fory/pull/3933
- chore: update release version to 1.6.1 by @chaokunyang in https://github.com/apache/fory/pull/3938
- ci: update sbt setup action by @chaokunyang in https://github.com/apache/fory/pull/3939
- chore: upgrade scala dependencies by @pjfanning in https://github.com/apache/fory/pull/3943
- docs: update jackson annotations license by @chaokunyang in https://github.com/apache/fory/pull/3944

## New Contributors

- @KarasevRob made their first contribution in https://github.com/apache/fory/pull/3941

**Full Changelog**: https://github.com/apache/fory/compare/v1.6.1...v1.7.0
