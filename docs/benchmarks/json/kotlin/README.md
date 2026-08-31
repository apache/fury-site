# Kotlin JSON Benchmarks

The benchmark harness is in
[`benchmarks/kotlin`](https://github.com/apache/fory/tree/main/benchmarks/kotlin).
It compares Fory JSON Kotlin, kotlinx.serialization, Moshi, and Jackson Kotlin with:

- one immutable `MediaContent` model with no public zero-argument constructor;
- the Eishay fixture whose SHA-256 is
  `8faba2f57ab397f319aced5cf1e8411a76785557d4c7d1703ec9d540354310a1`;
- String serialization, UTF-8 byte serialization, String deserialization, and UTF-8 byte
  deserialization for each library;
- one standard JMH invocation for all 16 methods;
- retained declared-type serializers, adapters, readers, and writers prepared outside timing;
- fixture decode, own-output round-trip, and all-output JSON-tree equivalence checks before timing.
