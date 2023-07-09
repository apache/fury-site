---
title: Start
nav:
  order: 1
---

## Guide

Fury is a blazing fast multi-language serialization framework powered by jit(just-in-time compilation) and zero-copy.

## Quickstart

Here we give a quick start about how to use fury, see [User Guide](/doc##quickstart) for more details about java serialization, zero-copy and row format.

## Benchmarks

Different serialization frameworks are suitable for different scenarios, and benchmark results here are for reference only.

If you need to benchmark for your specific scenario, make sure all serialization frameworks are appropriately configured for that scenario.

Dynamic serialization frameworks supports polymorphism and reference, which has more cost compared
to static serialization frameworks, unless it uses the jit techniques as fury did.
Since fury will generate code at runtime, please warm up before collecting benchmark statistics.

### Java Serialization

<img width="33%" alt="" src="/benchmarks/serialization/bench_serialize_compatible_STRUCT_to_directBuffer_time.png">
<img width="33%" alt="" src="/benchmarks/serialization/bench_serialize_compatible_MEDIA_CONTENT_to_array_time.png">
<img width="33%" alt="" src="/benchmarks/serialization/bench_serialize_MEDIA_CONTENT_to_array_time.png">
<img width="33%" alt="" src="/benchmarks/serialization/bench_serialize_SAMPLE_to_array_time.png">
<img width="33%" alt="" src="/benchmarks/deserialization/bench_deserialize_compatible_STRUCT_from_directBuffer_time.png">
<img width="33%" alt="" src="/benchmarks/deserialization/bench_deserialize_compatible_MEDIA_CONTENT_from_array_time.png">
<img width="33%" alt="" src="/benchmarks/deserialization/bench_deserialize_MEDIA_CONTENT_from_array_time.png">
<img width="33%" alt="" src="/benchmarks/deserialization/bench_deserialize_SAMPLE_from_array_time.png">

See [benchmarks](https://github.com/alipay/fury/tree/main/docs/benchmarks) for more benchmarks about type forward/backward compatibility, off-heap support, zero-copy serialization.

## Features

- Multiple languages: Java/Python/C++/Golang/Javascript.
- Zero-copy: cross-language out-of-band serialization inspired
  by [pickle5](https://peps.python.org/pep-0574/) and off-heap read/write.
- High performance: A highly-extensible JIT framework to generate serializer code at runtime in an async multi-thread way to speed serialization, providing 20-200x speed up by:
  - reduce memory access by inline variable in generated code.
  - reduce virtual method invocation by inline call in generated code.
  - reduce conditional branching.
  - reduce hash lookup.
- q binary protocols: object graph, row format and so on.

In addition to cross-language serialization, Fury also features at:

- Drop-in replace Java serialization frameworks such as JDK/Kryo/Hessian without modifying any code, but 100x faster.
  It can greatly improve the efficiency of high-performance RPC calls, data transfer and object persistence.
- JDK serialization 100% compatible, support java custom serialization
  `writeObject/readObject/writeReplace/readResolve/readObjectNoData` natively.
- Supports shared and circular reference object serialization for golang.
- Supports automatic object serialization for golang.

## Protocols

Different scenarios have different serialization requirements. Fury designed and implemented
multiple binary protocols for those requirements:

- Cross-language object graph protocol:
  - Cross-language serialize any object automatically, no need for IDL definition, schema compilation and object to/from protocol
    conversion.
  - Support shared reference and circular reference, no duplicate data or recursion error.
  - Support object polymorphism.
- Native java/python object graph protocol: highly-optimized based on type system of the language.
- Row format protocol: a cache-friendly binary random access format, supports skipping serialization and partial serialization,
  and can convert to column-format automatically.

New protocols can be added easily based on fury existing buffer, encoding, meta, codegen and other capabilities. All of those share same codebase, and the optimization for one protocol
can be reused by another protocol.

## Compatibility

### Schema Compatibility

Fury java object graph serialization support class schema forward/backward compatibility. The serialization peer and deserialization peer can add/delete fields independently.

We plan to add support cross-language serialization after [meta compression](https://github.com/alipay/fury/issues/203) are finished.

### Binary Compatibility

We are still improving our protocols, binary compatibility are not ensured between fury releases for now. Please `shade` fury if you will upgrade fury in the future.

Binary compatibility will be ensured before fury 1.0.

## Security

Static serialization such as row format are secure by nature. But dynamic object graph serialization supports deserialize unregistered types, which can introduce security risks.

For example, the deserialization may invoke `init` constructor or `equals`/`hashCode` method, if the method body contains malicious code, the system will be at risks.

Fury provides a secure mode option and enabled by default for this protocol, which allows deserializing trusted registered types or built-in types only for security.

If your environment is **secure**, you can disable the secure mode for more dynamics, then the user types are not needed be registered ahead, and can be serialized automatically.

## RoadMap

- Meta compression, auto meta sharing and cross-language schema compatibility.
- AOT Framework for c++/golang/rust to generate code statically.
- C++/Rust object graph serialization support
- Golang/Rust/NodeJS row format support
- ProtoBuffer compatibility support
- Protocols for features and knowledge graph serialization
- Continuously improve our serialization infrastructure for any new protocols

## How to Contribute

Please read our [project development guide](https://github.com/alipay/fury/blob/main/docs/development.md).
