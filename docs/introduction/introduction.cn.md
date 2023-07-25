---
title: Introduction
order: 0
---

Fury是一个基于**JIT动态编译**和**零拷贝**的**高性能多语言序列化框架**，提供最高170x的性能和极致的易用性。

## 特性

- **多语言**: Java/Python/C++/Golang/Javascript。
- **零拷贝**: 类似[pickle5](https://peps.python.org/pep-0574/) out-of-band序列化的跨语言零拷贝和堆外内存读写。
- **高性能**: 高度可扩展的JIT框架，可以在运行时以异步多线程的方式动态生成序列化代码，提供20-170x的加速:
  - 通过内联变量减少内存访问；
  - 通过在生成代码当中内联方法调用减少虚方法开销；
  - 减少条件分支；
  - 检查hash查找；
- **多个二进制协议**: 对象图、行存等。

除了跨语言序列化，Fury也具备以下能力:

- 无缝替代Java序列化框架JDK/Kryo/Hessian等，无需修改任何用户代码，提供最高百倍以上性能，大幅改进高性能RPC调用、大规模数据传输和对象持久化效率。
- **100%兼容**JDK序列化, 原生支持JDK自定义序列化方法
  `writeObject/readObject/writeReplace/readResolve/readObjectNoData`。
- 支持Golang共享引用、循环引用、指针序列化。
- 支持自动化的Golang struct序列化。

## 协议

不同的协议有不同的序列化需求，Fury针对这些需求设计和实现了多个二进制协议：

- **跨语言对象图序列化协议**:
  - 跨语言自动序列化任意对象，不需要定义IDL，静态生成代码，以及在对象和生成代码之间进行转换。
  - 支持共享引用和循环引用，不会出现重复序列化和递归错误。
  - 支持对象多态。
- **纯Java/Python序列化协议**: 基于语言的类型信息深度优化序列化性能和大小。
- **行存协议**: 缓存友好的二进制随机读写协议，支持跳过序列化和部分序列化，可以和Apache Arrow列存自动互转。

同时也可以基于Fury已有的buffer/encoding/meta/codegen等能力快速构建新的协议，所有协议共享同一套基础能力，针对一个协议的优化，可以让所有协议受益。

## 基准测试

不同的序列化框架适合不同场景，基准测试结果仅做参考。如果你需要针对你的场景进行性能对比，确保所有序列化框架都针对该场景进行了恰当的配置。

动态序列化框架由于支持多态和引用，通常比静态序列化框架有更多的开销，除非跟Fury一样通过JIT技术进行加速。由于Fury会在运行时生成代码，**请在收集基准测试数据前进行预热，保证代码生成已经完成**。

### Java序列化

标题包含"compatible"的图表表示支持类型前后兼容。 标题不包含"compatible"的图表表示类型需要强一致，序列化和反序列化端的class的Schema必须保持一致。

`Struct`是一个有 [100 基本类型的字段的类](https://github.com/alipay/fury/tree/main/docs/benchmarks#Struct), `MediaContent`是来自 [jvm-serializers](https://github.com/eishay/jvm-serializers/blob/master/tpc/src/data/media/MediaContent.java)
的类, `Sample`
是来自 [kryo benchmark](https://github.com/EsotericSoftware/kryo/blob/master/benchmarks/src/main/java/com/esotericsoftware/kryo/benchmarks/data/Sample.java)
的类.

<p align="center">
<img width="24%" alt="" src="docs/benchmarks/compatible/bench_serialize_compatible_STRUCT_to_directBuffer_tps.png">
<img width="24%" alt="" src="docs/benchmarks/compatible/bench_serialize_compatible_MEDIA_CONTENT_to_array_tps.png">
<img width="24%" alt="" src="docs/benchmarks/serialization/bench_serialize_MEDIA_CONTENT_to_array_tps.png">
<img width="24%" alt="" src="docs/benchmarks/serialization/bench_serialize_SAMPLE_to_array_tps.png">
</p>

<p align="center">
<img width="24%" alt="" src="docs/benchmarks/compatible/bench_deserialize_compatible_STRUCT_from_directBuffer_tps.png">
<img width="24%" alt="" src="docs/benchmarks/compatible/bench_deserialize_compatible_MEDIA_CONTENT_from_array_tps.png">
<img width="24%" alt="" src="docs/benchmarks/deserialization/bench_deserialize_MEDIA_CONTENT_from_array_tps.png">
<img width="24%" alt="" src="docs/benchmarks/deserialization/bench_deserialize_SAMPLE_from_array_tps.png">
</p>

可以访问 [benchmarks](https://github.com/alipay/fury/tree/main/docs/benchmarks) 查看基准测试环境、代码以及零拷贝和堆外序列化等场景测试结果。

## 兼容性

### Schema兼容性

Fury Java序列化支持schema向前向后兼容。序列化和反序列化端可以独立增删字段。

我们会在[元数据压缩](https://github.com/alipay/fury/issues/203)完成后实现跨语言schema前后兼容。

### 二进制兼容性

我们仍在改进协议，目前不提供不同Fury版本之间的二进制兼容性，二进制兼容性将在1.0版本提供。

如果你未来可能会升级Fury，请提前做好数据和依赖的版本化管理。

## 安全

静态序列化一般比较安全，动态序列化如Java/Python序列化为了提供更多的动态和灵活性，支持反序列化未注册类型，引入了一定的安全风险。

比如，Java反序列化时可能会调用构造函数/`equals`/`hashCode`方法，如果这些方法内部包含了恶意代码，就可能造成任意代码执行等问题。

Fury提供了一个安全模式并默认开启，该模式只允许反序列化提前注册的信任的类型和内置类型，从而避免反序列化未知类型带来的风险。

**不要关闭安全模式或者类注册检查，除非你可以确保你的环境安全性。**

## 后续规划

- 元数据压缩、自动元数据共享、跨语言序列化前后兼容。
- 实现AOT框架，支持静态生成c++/golang序列化代码。
- C++/Rust对象图序列化支持。
- Golang/Rust/NodeJS行存支持
- 兼容ProtoBuffer IDL，支持基于ProtoBuffer IDL生成Fury序列化代码
- 协议扩展：特征序列化、知识图谱序列化
- 持续改进序列化基础能力，让所有协议有更好的性能。

## 如何贡献
请访问 [CONTRIBUTING](https://github.com/alipay/fury/blob/main/docs/development.md) 来了解如何向 Fury 提交更新和贡献代码。


## 加入Fury

| Platform                                                                                                                                                  | Purpose                                                                                                                                                                                                   | Estimated Response Time |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------|
| [GitHub Issues](https://github.com/alipay/fury/issues)                                                                                                    | 报告bug和提交需求                                                                                                                                                                                                | < 1 天                   |
| [Slack](https://join.slack.com/t/fury-project/shared_invite/zt-1u8soj4qc-ieYEu7ciHOqA2mo47llS8A)                                                          | 与其它用户交流，了解Fury最新动态                                                                                                                                                                                        | < 2 天                   |
| [StackOverflow](https://stackoverflow.com/questions/tagged/fury)                                                                                          | 提问如何使用Fury                                                                                                                                                                                                | < 2 天                   |
| [知乎](https://www.zhihu.com/column/c_1638859452651765760)  [推特](https://twitter.com/fury_community)  [Youtube](https://www.youtube.com/@FurySerialization) | 关注我们，了解Fury最新动态.                                                                                                                                                                                          | < 2 天                   |
| 微信公众号 / 钉钉群                                                                                                                                               | <div style="text-align:center;"><img src="docs/images/fury_wechat_12.jpg" alt="WeChat Official Account " width="20%"/> <img src="docs/images/fury_dingtalk.png" alt="Dingding Group" width="20%"/> </div> | < 2 天                   |
