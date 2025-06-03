---
id: features
title: Features
sidebar_position: 3
---

- 多种语言：Java/Python/C++/Golang/Javascript/Rust。
- 零拷贝：类似[pickle5](https://peps.python.org/pep-0574/)，支持堆外读/写的跨语言序列化。
- 高性能：高度可扩展的 JIT 框架，可在运行时以异步多线程方式生成序列化程序代码，以加快序列化速度，通过以下方式提升 20-170 倍的速度：
  - 减少在生成代码中内联变量减少内存访问；
  - 通过在生成的代码中内联调用来减少虚拟方法调用；
  - 减少条件分支；
  - 减少哈希查找；
- 二进制协议：对象图、行格式等。

除了跨语言序列化之外，Fury 还支持以下功能：

- 直接替换 Java 序列化框架，如 JDK/Kryo/Hessian，无需修改任何代码，但速度提高 100 倍。它可以大大提高 RPC 调用性能、数据传输和对象持久化的效率；
- JDK 序列化 100% 兼容，原生支持 java 自定义序列化 `writeObject/readObject/writeReplace/readResolve/readObjectNoData`；
- 支持 golang 的共享和循环引用对象序列化；
- 支持 golang 的自动对象序列化。
