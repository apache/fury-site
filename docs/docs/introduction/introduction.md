---
id: introduction
title: Introduction
sidebar_position: 1
---

Fory is a blazing fast multi-language serialization framework powered by jit(just-in-time compilation) and zero-copy.

## Protocols

Different scenarios have different serialization requirements. Fory designed and implemented
multiple binary protocols for those requirements:

- Cross-language object graph protocol:
  - Cross-language serialize any object automatically, no need for IDL definition, schema compilation and object to/from protocol
    conversion.
  - Support shared reference and circular reference, no duplicate data or recursion error.
  - Support object polymorphism.
- Native java/python object graph protocol: highly-optimized based on type system of the language.
- Row format protocol: a cache-friendly binary random access format, supports skipping serialization and partial serialization,
  and can convert to column-format automatically.

New protocols can be added easily based on fory existing buffer, encoding, meta, codegen and other capabilities. All of those share same codebase, and the optimization for one protocol
can be reused by another protocol.

## Compatibility

### Schema Compatibility

Fory java object graph serialization support class schema forward/backward compatibility. The serialization peer and deserialization peer can add/delete fields independently.

We plan to add support cross-language serialization after [meta compression](https://github.com/apache/fory/issues/203) are finished.

### Binary Compatibility

We are still improving our protocols, binary compatibility are not ensured between fory releases for now. Please `shade` fory if you will upgrade fory in the future.

Binary compatibility will be ensured before fory 1.0.

## Security

Static serialization such as row format are secure by nature. But dynamic object graph serialization supports deserialize unregistered types, which can introduce security risks.

For example, the deserialization may invoke `init` constructor or `equals`/`hashCode` method, if the method body contains malicious code, the system will be at risks.

Fory provides a class registration mode option and enabled by default for this protocol, which allows deserializing trusted registered types or built-in types only for security.

Fory provides a class registration option and enabled by default for such protocols, which allows only deserializing trusted registered types or built-in types. **Do not disable class registration or class registration checks unless you can ensure your environment is indeed secure**. We are not responsible for security if you disabled the class registration option.

## RoadMap

- Meta compression, auto meta sharing and cross-language schema compatibility.
- AOT Framework for c++/golang to generate code statically.
- C++/Rust object graph serialization support
- Golang/Rust/NodeJS row format support
- ProtoBuffer compatibility support
- Protocols for features and knowledge graph serialization
- Continuously improve our serialization infrastructure for any new protocols

## How to Contribute

Please read the [CONTRIBUTING](https://github.com/apache/fory/blob/main/CONTRIBUTING.md) guide for instructions on how to contribute.
