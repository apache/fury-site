---
slug: fory_1_6_1_release
title: Fory v1.6.1 Released
description: "Fory 1.6.1 improves Swift and Go serialization performance, fixes Java compatible-metadata regressions, and simplifies C++ TypeMeta tracking."
authors: [chaokunyang]
tags: [fory, swift, go, cpp, java]
---

The Apache Fory team is pleased to announce the 1.6.1 release. This focused patch release improves Swift and Go serialization performance, fixes Java compatible-metadata state regressions, and simplifies C++ metadata tracking. See the [Getting Started](https://fory.apache.org/docs/start/) page to get the libraries for your platform.

## Highlights

- Improved Swift serialization and deserialization performance across buffer access, strings, primitive arrays, collection elements, and compatible metadata reads.
- Optimized Go root-value handling, primitive struct fields, error checks, and local type metadata reuse.
- Fixed Java compatible-mode regressions caused by remote read metadata leaking into later local writes and copies.
- Simplified C++ `TypeMeta` index tracking while preserving the single-type fast path.

## Faster Swift and Go Serialization

Fory 1.6.1 removes several sources of overhead from Swift's hot serialization paths. Synchronous buffer state no longer pays for dynamic exclusivity checks; packed primitive arrays use specialized readers and uninitialized destination storage; ASCII strings are detected eight bytes at a time while preserving UTF-8 validation; and non-null arrays take a direct element-reading path. Exact-schema compatible reads also reuse the `TypeMeta` header hash directly.

In the checked-in Swift benchmark report, Fory leads Protocol Buffers in every listed serialization and deserialization case, from 1.65× to 5.57× on the measured workloads.

![Swift serialization benchmark throughput](../docs/benchmarks/object-serialization/xlang/swift/throughput.png)

The Go runtime now avoids reference-tracking work for root values when reference tracking is disabled, specializes common primitive varint struct fields, reduces repeated error-state checks, and reuses local `TypeDef` metadata after it has been built. The refreshed Go benchmark report shows Fory running 1.32×–3.64× as many operations per second as Protocol Buffers and 3.19×–12.00× as many as MessagePack across the listed cases.

![Go serialization benchmark throughput](../docs/benchmarks/object-serialization/xlang/go/throughput.png)

See the complete [Swift](/docs/benchmarks/object-serialization/xlang/swift/) and [Go](/docs/benchmarks/object-serialization/xlang/go/) benchmark reports for the environment, per-case throughput, and serialized sizes.

## Java Compatible-Metadata Fixes

Java compatible mode can retain remote schema metadata while reading data written by an older or different class definition. In affected 1.6.0 paths, that remote read state could be reused by a later local write or copy operation, especially for arrays and collection-like values. Fory 1.6.1 separates remote-read metadata holders from local-write holders and preserves each remote field's codec category when generated code skips or reads compatible fields.

The fix covers generated and interpreted serializers, arrays, collections, container fields, and `ConcurrentHashMap.KeySetView`. It also avoids resolving non-root declaring-class names as dynamic object types when decoding native type definitions.

## Features

- perf(swift): optimize swift serialization performance by @chaokunyang in https://github.com/apache/fory/pull/3921
- perf(go): optimize go performance by @chaokunyang in https://github.com/apache/fory/pull/3923
- perf(go): update go perf docs by @chaokunyang in https://github.com/apache/fory/pull/3924
- perf(cpp): simplify TypeMeta index tracking by @chaokunyang in https://github.com/apache/fory/pull/3932

## Bug Fix

- fix(java): fix compatible metadata state regressions by @chaokunyang in https://github.com/apache/fory/pull/3931

## Other Improvements

- docs(java): clarify JDK 25 module opening recommendation by @chaokunyang in https://github.com/apache/fory/pull/3922
- chore: bump development version to 1.7.0 by @chaokunyang in https://github.com/apache/fory/pull/3925
- chore(ci): pin android-emulator-runner to v2.38.0 SHA by @ppkarwasz in https://github.com/apache/fory/pull/3927

## New Contributors

- @ppkarwasz made their first contribution in https://github.com/apache/fory/pull/3927

**Full Changelog**: https://github.com/apache/fory/compare/v1.6.0...v1.6.1
