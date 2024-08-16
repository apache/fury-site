---
id: features
title: Features
sidebar_position: 3
---

- Multiple languages: Java/Python/C++/Golang/Javascript/Rust.
- Zero-copy: cross-language out-of-band serialization inspired
  by [pickle5](https://peps.python.org/pep-0574/) and off-heap read/write.
- High performance: A highly-extensible JIT framework to generate serializer code at runtime in an async multi-thread way to speed serialization, providing 20-170x speed up by:
  - reduce memory access by inline variable in generated code.
  - reduce virtual method invocation by inline call in generated code.
  - reduce conditional branching.
  - reduce hash lookup.
  - binary protocols: object graph, row format and so on.

In addition to cross-language serialization, Fury also features at:

- Drop-in replace Java serialization frameworks such as JDK/Kryo/Hessian without modifying any code, but 100x faster.
  It can greatly improve the efficiency of high-performance RPC calls, data transfer and object persistence.
- JDK serialization 100% compatible, support java custom serialization
  `writeObject/readObject/writeReplace/readResolve/readObjectNoData` natively.
- Supports shared and circular reference object serialization for golang.
- Supports automatic object serialization for golang.
