---
slug: fory_1_7_1_release
title: Fory v1.7.1 Released
description: "Fory 1.7.1 adds string output for 64-bit integers and makes Base64 the default JSON representation for byte arrays."
authors: [chaokunyang]
tags: [fory, java, json, javascript, xlang]
---

The Apache Fory team is pleased to announce the 1.7.1 release. This patch release improves Java
JSON interoperability, expands cross-language field tag IDs, and delivers correctness and
compatibility fixes across multiple runtimes. See the
[Getting Started](https://fory.apache.org/docs/start/) page to get the libraries for your platform.

## Highlights

- Java JSON can write 64-bit integer values as strings, helping applications preserve exact values
  when JSON passes through JavaScript.
- Java JSON now writes byte arrays as Base64 strings by default, providing a more compact and
  conventional representation for binary data.

## JSON-Safe 64-Bit Integers

JavaScript numbers cannot exactly represent every 64-bit integer. Fory JSON 1.7.1 adds the
`writeLongAsString` builder option so applications can emit Java `long` and `Long` values as quoted
decimal strings when data will pass through JavaScript or another number-limited consumer:

```java
import org.apache.fory.json.ForyJson;

ForyJson json = ForyJson.builder().writeLongAsString(true).build();
String encoded = json.toJson(9_007_199_254_740_993L);

assert encoded.equals("\"9007199254740993\"");
```

The option is disabled by default. It also applies to the supported Long-like wrappers and to
declared Long values inside arrays, collections, maps, and equivalent Scala and Kotlin containers.
Readers accept both quoted and unquoted integer tokens regardless of the writer setting. See the
[Java JSON object mapping guide](/docs/json/object-mapping) for the complete behavior.

## Base64 Byte Arrays by Default

Unannotated Java `byte[]` values now use quoted standard Base64 strings instead of JSON arrays of
decimal byte values. For example, the bytes `{1, -2, 3}` are written as `"Af4D"`. This matches the
usual JSON representation for binary data and reduces encoding and parsing overhead for
binary-heavy payloads.

This is a default representation change from Fory 1.7.0. The Base64 reader does not accept the old
numeric-array representation. Applications that need to retain that representation can select it
for an exact field or getter:

```java
import org.apache.fory.json.annotation.JsonByteArray;

public final class Attachment {
  @JsonByteArray(JsonByteArray.Format.ARRAY)
  public byte[] content;
}
```

See the [JSON annotations guide](/docs/json/annotations) for `JsonByteArray` Base64 and
numeric-array mapping details.

## Features

- feat(xlang): expand field tag IDs to signed int32 by
  [@chaokunyang](https://github.com/chaokunyang) in
  [#3982](https://github.com/apache/fory/pull/3982)
- feat(json): support writing long values as strings by
  [@chaokunyang](https://github.com/chaokunyang) in
  [#4008](https://github.com/apache/fory/pull/4008)
- feat(json): encode byte arrays as Base64 JSON strings by default by
  [@ingokegel](https://github.com/ingokegel) in
  [#4012](https://github.com/apache/fory/pull/4012)

## Bug Fixes

- fix(ci): increase Android Gradle memory by [@chaokunyang](https://github.com/chaokunyang) in
  [#3980](https://github.com/apache/fory/pull/3980)
- fix(xlang): close field tag validation gaps by
  [@chaokunyang](https://github.com/chaokunyang) in
  [#3984](https://github.com/apache/fory/pull/3984)
- test(java): shorten inherited tag test name by
  [@chaokunyang](https://github.com/chaokunyang) in
  [#3985](https://github.com/apache/fory/pull/3985)
- fix: harden low-level codec boundaries by [@chaokunyang](https://github.com/chaokunyang) in
  [#3987](https://github.com/apache/fory/pull/3987)
- fix(go): preserve primitive map iteration across chunks by
  [@chaokunyang](https://github.com/chaokunyang) in
  [#3990](https://github.com/apache/fory/pull/3990)
- fix(js): avoid precision loss in negative varint64 fast path by
  [@ayush00git](https://github.com/ayush00git) in
  [#3992](https://github.com/apache/fory/pull/3992)
- fix(java): reuse local compatible type info by
  [@chaokunyang](https://github.com/chaokunyang) in
  [#4000](https://github.com/apache/fory/pull/4000)
- fix(kotlin): accept supported metadata versions by
  [@chaokunyang](https://github.com/chaokunyang) in
  [#4001](https://github.com/apache/fory/pull/4001)
- fix(javascript): use correct typemeta special chars by
  [@ayush00git](https://github.com/ayush00git) in
  [#3995](https://github.com/apache/fory/pull/3995)
- ci(kotlin): test Kotlin 2.4.10 on JDK 26 by
  [@chaokunyang](https://github.com/chaokunyang) in
  [#4002](https://github.com/apache/fory/pull/4002)
- fix(javascript): reserve writer capacity for write paths by
  [@ayush00git](https://github.com/ayush00git) in
  [#3994](https://github.com/apache/fory/pull/3994)
- fix(rust): correct send sync ownership by [@chaokunyang](https://github.com/chaokunyang) in
  [#4003](https://github.com/apache/fory/pull/4003)
- fix(scala): support nested case classes in fory-json-scala by
  [@pjfanning](https://github.com/pjfanning) in
  [#4006](https://github.com/apache/fory/pull/4006)
- fix(javascript): underflow tiny float16 magnitudes to signed zero by
  [@ayush00git](https://github.com/ayush00git) in
  [#4004](https://github.com/apache/fory/pull/4004)
- fix(javascript): keep float64 precision for dynamic non-integer numbers by
  [@ayush00git](https://github.com/ayush00git) in
  [#4005](https://github.com/apache/fory/pull/4005)
- fix(javascript): round float16 values to nearest even by
  [@chaokunyang](https://github.com/chaokunyang) in
  [#4007](https://github.com/apache/fory/pull/4007)

## Other Improvements

- chore: improve Fory release skill by [@chaokunyang](https://github.com/chaokunyang) in
  [#3979](https://github.com/apache/fory/pull/3979)
- chore: clean unnecessary buffer checks by [@chaokunyang](https://github.com/chaokunyang) in
  [#3988](https://github.com/apache/fory/pull/3988)

## New Contributors

- [@ingokegel](https://github.com/ingokegel) made their first contribution in
  [#4012](https://github.com/apache/fory/pull/4012)

**Full Changelog**: [v1.7.0...v1.7.1](https://github.com/apache/fory/compare/v1.7.0...v1.7.1)
