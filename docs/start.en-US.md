---
title: Start
nav:
  order: 1
---

## Guide

Fury is a JIT-based high-performance multi-language native serialization framework, focusing on providing the ultimate serialization performance and ease of use:

- Support mainstream programming languages such as Java/Python/C++/Golang, other languages can be easily extended;
- Multi-language/cross-language automatic serialization of arbitrary object graphs without creating IDL files, manually compiling schemas to generate code, and converting objects to intermediate formats;
- Multi-language/cross-language automatic serialization of shared references and circular references, users only need to care about objects, not data duplication or recursion errors;
- Based on JIT dynamic compilation technology, the whole stage serialization code is automatically generated at runtime, method inlining, code caching and dead code elimination are added, virtual method calls/conditional branches/Hash lookup/metadata writing are reduced, and compared with other 20~500 times the performance of the serialization framework;
- Zero-Copy serialization support, support for Out of band serialization protocol, and support for reading and writing of off-heap memory;
- Provides a cache-friendly binary random access row storage format, supports skip serialization and partial serialization, and can automatically switch between column storage and storage;
- Drop-in replaces the Java serialization framework of JDK/Kryo/Hessian, providing more than 20 times the performance of Kryo, more than 100 times the performance of Hessian, and more than 200 times the performance of JDK's own serialization, which can be greatly improved High-performance scene object transmission and persistence efficiency;

## Usage

### Java

### Python

### JavaScript

#### Install

```shell
npm install @furyjs/fury
```

#### Marshal & UnMarshal

```typescript
import Fury, { TypeDescription, InternalSerializerType } from '@furyjs/fury';

const description: TypeDescription = {
  type: InternalSerializerType.FURY_TYPE_TAG,
  asObject: {
    props: {
      foo: {
        type: InternalSerializerType.STRING as const,
      },
    },
    tag: 'example.foo',
  },
};
const fury = new Fury();
const serializer = fury.registerSerializerByDescription(description);
const input = fury.marshal({ foo: 'hello fury' }, serializer);
const result = fury.unmarshal(new Uint8Array(input));
console.log(result);
```
