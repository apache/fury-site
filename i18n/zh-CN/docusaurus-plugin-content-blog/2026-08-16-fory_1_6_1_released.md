---
slug: fory_1_6_1_release
title: Apache Fory 1.6.1 正式发布
description: "Fory 1.6.1 提升 Swift 和 Go 序列化性能，修复 Java 兼容元数据回归，并简化 C++ TypeMeta 跟踪。"
authors: [chaokunyang]
tags: [fory, swift, go, cpp, java]
---

Apache Fory 团队很高兴地宣布 1.6.1 版本正式发布。这个聚焦改进的补丁版本提升了 Swift 和 Go 序列化性能，修复了 Java 兼容元数据状态回归，并简化了 C++ 元数据跟踪。请访问[快速开始](https://fory.apache.org/zh-CN/docs/start/)页面，获取适用于您所用平台的库。

## 亮点

- 优化 Swift 的缓冲区访问、字符串、基本类型数组、集合元素和兼容元数据读取，提升序列化与反序列化性能。
- 优化 Go 的根值处理、基本类型 struct 字段、错误检查和本地类型元信息复用。
- 修复远端读取元数据泄漏到后续本地写入和复制操作所引起的 Java 兼容模式回归。
- 简化 C++ `TypeMeta` 索引跟踪，同时保留单一类型的快速路径。

## 更快的 Swift 和 Go 序列化

Fory 1.6.1 消除了 Swift 序列化热点路径中的多项开销。同步缓冲区状态不再承担动态独占检查；紧凑基本类型数组使用专用读取器和未初始化的目标存储；ASCII 字符串在保留 UTF-8 校验的同时每次检测 8 字节；非空数组则直接读取元素。Schema 完全匹配的兼容读取还会直接复用 `TypeMeta` 头部哈希。

在仓库内的 Swift 基准测试报告中，Fory 在列出的所有序列化和反序列化测试中均领先 Protocol Buffers，在这些测试负载上的吞吐量为其 1.65～5.57 倍。

![Swift 序列化基准测试吞吐量](../../../docs/benchmarks/object-serialization/xlang/swift/throughput.png)

Go 运行时现在会在禁用引用跟踪时跳过根值的引用跟踪工作，为常见的基本类型变长整数 struct 字段提供专用路径，减少重复的错误状态检查，并在构建本地 `TypeDef` 元数据后复用它。更新后的 Go 基准测试报告显示，在列出的测试中，Fory 的每秒操作数是 Protocol Buffers 的 1.32～3.64 倍、MessagePack 的 3.19～12.00 倍。

![Go 序列化基准测试吞吐量](../../../docs/benchmarks/object-serialization/xlang/go/throughput.png)

完整的测试环境、各测试用例吞吐量和序列化大小请参阅 [Swift](/zh-CN/docs/benchmarks/object-serialization/xlang/swift/) 与 [Go](/zh-CN/docs/benchmarks/object-serialization/xlang/go/) 基准测试报告。

## Java 兼容元数据修复

Java 兼容模式读取由旧版或不同类定义写出的数据时，可能会保留远端 Schema 元数据。在受影响的 1.6.0 路径中，后续本地写入或复制操作可能错误复用该远端读取状态，数组和集合类值尤其容易受影响。Fory 1.6.1 将远端读取的类型元信息 holder 与本地写入 holder 分离，并在生成代码跳过或读取兼容字段时保留每个远端字段的 codec 分类。

该修复覆盖生成和解释执行的序列化器、数组、集合、容器字段以及 `ConcurrentHashMap.KeySetView`。解码 native 类型定义时，它还会避免将非根声明类名称解析为动态对象类型。

## 功能改进

- perf(swift): 优化 Swift 序列化性能，由 @chaokunyang 在 https://github.com/apache/fory/pull/3921 中贡献
- perf(go): 优化 Go 性能，由 @chaokunyang 在 https://github.com/apache/fory/pull/3923 中贡献
- perf(go): 更新 Go 性能文档，由 @chaokunyang 在 https://github.com/apache/fory/pull/3924 中贡献
- perf(cpp): 简化 TypeMeta 索引跟踪，由 @chaokunyang 在 https://github.com/apache/fory/pull/3932 中贡献

## 问题修复

- fix(java): 修复兼容元数据状态回归，由 @chaokunyang 在 https://github.com/apache/fory/pull/3931 中贡献

## 其他改进

- docs(java): 明确 JDK 25 模块开放建议，由 @chaokunyang 在 https://github.com/apache/fory/pull/3922 中贡献
- chore: 将开发版本号更新至 1.7.0，由 @chaokunyang 在 https://github.com/apache/fory/pull/3925 中贡献
- chore(ci): 将 android-emulator-runner 固定到 v2.38.0 的 SHA，由 @ppkarwasz 在 https://github.com/apache/fory/pull/3927 中贡献

## 新贡献者

- @ppkarwasz 在 https://github.com/apache/fory/pull/3927 中完成首次贡献

**完整变更日志**：https://github.com/apache/fory/compare/v1.6.0...v1.6.1
