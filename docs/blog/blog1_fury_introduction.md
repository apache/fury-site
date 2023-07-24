
# Fury - A blazing fast multi-language serialization framework powered by jit and zero-copy

Auther: [chaokunyang](https://github.com/chaokunyang)

> Fury is a multi-language serialization framework powered by JIT dynamic compilation and zero copy. It supports Java/Python/Golang/JavaScript/Rust/C++, provide automatic multi-language objects serialization features, and 170x speedup compared to JDK serialization.

The GitHub address of fury repository is: https://github.com/alipay/fury

<img alt="fury banner" src="/fury_banner.png">

# Background

Serialization is basic components of system communication, and is widly used in big data, AI framework, cloud native and other distributed systems. When the object needs cto being transfered between processes/languages/nodes, or needs persistence, state read/write, copy, they all need serialization. Its performance and ease-of-use affect runtime and development efficiency.

Static serialization frameworks such as · cannot be directly used for cross-language development of domain objects due to their inability to support object reference and polymorphism, as well as the need for pre-generating code. Dynamic serialization frameworks such as JDK serialization, Kryo, Fst, Hessian, Pickle provide ease-of-use and dynamics, but do not support cross-language and have significant performance issues, which cannot meet the demands of high throughput, low latency, and large-scale data transmission scenarios.

Therefore, we developed a new multi-language serialization framework [Fury](https://github.com/alipay/fury), which is now open-sourced on [Github](https://github.com/alipay/fury). Through highly optimized serialization primitives, combined with JIT dynamic compilation and Zero-Copy technologies, Fury meets the requirements of performance, functionality, and ease-of-use simultaneously, achives automatic cross-language serialization of any object and provides ultimate performance.

<p>
<img width=44% alt="serialization" src="/case1.png">
<img  width=44% alt="deserialization" src="/case2.png">
</p>

# What is Fury

Fury is a multi-language serialization framework powered by JIT dynamic compilation and zero copy, providing blazing fast speed and usability:

- Support Java/Python/C++/Golang/JavaScript/Rust, other languages can be added easily.
- Unified multi-language serialization core capability:
  - Highly optimized serialization primitives.
  - Zero-Copy serialization support, support out of band serialization and off-heap read/write.
  - Use JIT(just-in-time) to generate serialization instructions at runtime in an async multithreaded way, which can inline more methods, code cache, eliminate dead code, reduce hash lookup, meta writing and memory read/writing.
- Multi protocols Support: providing flexibility and ease-of-use of dynamic serialization, as well as the cross-language capability of static serialization.
  - Java Serialization:
    - Drop-in replace `JDK/Kryo/Hessian`, no need to modify user code, but proviing 170x speed up as most, which can improve efficiency of rpc, data transfer and object persistence extensively.
    - 100% JDK compatible, support JDK custom serialization methods `writeObject/readObject/writeReplace/readResolve/readObjectNoData` natively.
  - Cross-language object graph:
    - Cross-language serialize any objects automatically, no need for IDL, schema compilation, and code/protocol conversion.
    - Cross-language serialize shared/circular reference, no data duplication or recursion error.
    - Support object polymorphism, multiple children type objects can be serialized simultaneously.
  - Row format
    - A cache-friendly binary random-access format, support skipping deserialization and lazy deserialization, better option for high-performance computing and large-scale data transfer.
    - Support automatic conversion to apache arrow.

# Core Serialization Capabilities

Although different scenarios require different serialization framework, the underlying operations of serialization are similar. Therefore, Fury defines and implements a set of basic serialization capabilities, which can quickly build different multi-language serialization protocols and optimize them for high performance through compilation acceleration and other optimization techniques. At the same time, performance optimization for a protocol on the basic capabilities can also benefit all serialization protocols.

## Serialization Primitives

Common serialization operations contains:

- bitmap operations
- int encoding/decoding
- int compression
- String creation/copy
- String encoding: ASCII/UTF8/UTF16
- memory copy
- array copy&compression
- meta encoding&compression&cache

Fury make many optimizations in every languages, combined with SIMD and advanced language features, we make basic operations extremely fast for different protocols to use.

## Zero-Copy Serialization

In large-scale data transmission scenarios, an object graph often has multiple binary buffer. During serialization, the serialization framework writes the data into an intermediate buffer and introduces multiple time-consuming memory copies. Fury implemented a Out-Of-Band serialization protocol inspired by pickle5, ray and arrow, which can directly capture all binary buffer in an object graph to avoid intermediate copies of these buffers, thus avoid the memory copy overhead during serialization.

The following figure shows the general serialization process of Zero-Copy when Fury turns off reference support.

<img alt="fury zero copy" src="/fury_zero_copy.jpeg">

Currently, Fury supports the following types of Zero-Copy:

- java: all basic types of arrays, ByteBuffer, ArrowRecordBatch, and VectorSchemaRoot
- python: all arrays of the array module, numpy arrays, pyarrow.Table, and pyarrow.RecordBatch
- golang:byte slice

You can also extend the new zero copy type based on the Fury interface.

## JIT dynamic compilation acceleration

For custom type objects, they usually contain a large amount of type information, Fury use this information to generate efficient serialization code at runtime, a large number of runtime operations are completed in the dynamic compilation phase, thus inline more method, better code cache, reduce virtual method calls, conditional branches, hash lookup, metadata writes, and memory reads/writes finally, the serialization performance is greatly accelerated.

For Java, Fury implements a runtime code generation framework and defines a serialization logic [operator expression IR](https://en.wikipedia.org/wiki/Intermediate_representation), perform type inference based on the generic information of the object type at runtime, and then build an expression tree that describes the logic of serialized code, generates efficient Java code from the expression tree, and then pass to [Janino](https://github.com/janino-compiler/janino) to compile it into bytecode, next load it into the user's ClassLoader or the ClassLoader created by Fury, and finally compile it into efficient assembly code through Java JIT.

Since JVM JIT skips Big method compilation and inlining, Fury also implements an optimizer , to split big methods into small methods recursively, thus ensuring that all code can be compiled and inlined.

<img alt="fury java codegen" src="/fury_java_codegen.png">

Fury also supports asynchronous multi-thread dynamic compilation, submit the code generation tasks of different serializers to a thread pool for execution, and use interpretation mode to ensure that no serialization burrs occur. You do not need to warm up all types of serialization in advance.

In Python and JavaScript scenarios, similar code generation methods are used. This method has a low development threshold and is easier to troubleshoot problems.

Since serialization requires massive operations of objects in each programming language, and the programming language does not expose the low-level API of the memory model, Native methods call has a large cost too, we cannot use [LLVM](https://www.llvm.org/) to build a unified serializer JIT framework, instead, we must implement a code generation framework and serializer construction logic for every language.

## Static code generation

Although JIT compilation can greatly improve serialization efficiency and generate better serialization code according to the statistical distribution of data at runtime, languages such as C ++/Rust do not support reflection, no virtual machines, and no low-level API for memory models. Therefore, we cannot dynamically compile serialization code for such languages through JIT.

In this scenario, Fury is implementing an AOT static code generation framework. During compilation, the serialized code is generated in advance according to the object schema, and then objects can be serialized automatically using the generated serializer. For Rust, Rust macro will be used in the future to generates code for better usability.

## Cache optimization

When serializing custom type, fury will reorder fields to ensure that fields of the same interface type are serialized in order. This can promote cache hit probability, and also promoted CPU instruction cache.

The basic type fields are written in descending order by byte size. In this way, if the initial addresses are aligned, subsequent read and write operations will occur at the position where the memory addresses are aligned, making CPU execution more efficient.

# Multi-protocol Design and Implementation

Based on the multi-language serialization core capabilities provided by Fury, we have built three serialization protocols, which are applicable to different scenarios:

- Java serialization: suitable for pure Java serialization scenarios and provides 170x performance improvement at most;
- cross-language object graph serialization: suitable for application-oriented multi-language programming and high-performance Cross-Language serialization;
- row-format serialization: suitable for distributed computing engines such as Spark/Flink/Dories/Velox/Features/Storage processing framework;

In the future, we will add new protocols for some core scenarios. Users can also build their own protocols based on Fury's serialization capability.

## Java serialization

Due to the wide use of Java in big data, cloud native, microservices, and enterprise applications, the performance optimization of Java serialization can reduce system latency greatly, improves throughput and reduces server costs.

Therefore, Fury has made a lot of performance optimizations for Java serialization. Our implementation has the following capabilities:

- Ultimate Performance : Based on Java object types and generics, combined with JIT compilation and Unsafe low-level operations, Fury is 170x faster than JDK, and 50~100x faster than Kryo/Hessian at most.
- 100% JDK serialization API compatibility : supports all JDK custom serialization methods. `writeObject/readObject/writeReplace/readResolve/readObjectNoData` to ensure the correctness of JDK serialization in any scenario. Existing Java serialization frameworks, such as Kryo/Hessian, have some correctness problems in these scenarios.
- Type compatibility: When the deserialization and serialization Class Schema are inconsistent, it can still be deserialized correctly. It supports independent application upgrade and deployment, add or delete fields independently. We made much optimization, the type compatible mode has no performance loss compared type consistent mode.
- Metadata sharing : under a certain context (TCP connection) share metadata among multiple serializations (Class name, field name, Final field type information, etc.), this information will be sent to the peer during the first serialization, the peer can reconstruct the same deserializer based on this type of information. Subsequent serialization can avoid transmitting metadata, reduce network traffic pressure, and support type compatibility automatically.
- Zero copy support: supports Out-of-band zero copy and off-heap memory read/write.

## Cross-language object graph serialization

## Row-format

# Performance Comparison

<p>
<img width=44% alt="serialization" src="/case1.png">
<img  width=44% alt="deserialization" src="/case2.png">
</p>

# Future planning(RoadMap)

- Meta compression, auto meta sharing and cross-language schema compatibility.
- AOT Framework for c++/golang/rust to generate code statically.
- C++/Rust object graph serialization support
- Golang/Rust/NodeJS row format support
- ProtoBuffer compatibility support
- Protocols for features and knowledge graph serialization
- Continuously improve our serialization infrastructure for any new protocols

# Join US

We are committed to building Fury into an open and neutral community project that pursue perfection and innovation, subsequent development and discussion will be in an open source and transparent manner in the community. Any form of participation are welcome, including but not limited to question, code contributions, technical discussions, etc. We are looking forward to receiving your ideas and feedback, participating in the construction of the project together, pushing the project forward and creating the more advanced serialization framework.

The GitHub address of the fury repository is:
https://github.com/alipay/fury

official website: https://furyio.org

All issues, PR, and Discussion are welcome.

You are also welcome to join the following official communication group to communicate with us.

| Platform                                                                                            | Purpose                                                                      | Estimated Response Time |
| --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ----------------------- |
| [GitHub Issues](https://github.com/alipay/fury/issues)                                              | For reporting bugs and filing feature requests.                              | < 1 days                |
| [Slack](https://join.slack.com/t/fury-project/shared_invite/zt-1u8soj4qc-ieYEu7ciHOqA2mo47llS8A)    | For collaborating with other Fury users and latest announcements about Fury. | < 2 days                |
| [StackOverflow](https://stackoverflow.com/questions/tagged/fury)                                    | For asking questions about how to use Fury.                                  | < 2 days                |
| [Twitter](https://twitter.com/fury_community) [Youtube](https://www.youtube.com/@FurySerialization) | Follow us for latest announcements about Fury.                               | < 2 days                |
