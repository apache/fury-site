---
title: Apache Fory 文档
sidebar_position: 0
id: index
license: |
  Licensed to the Apache Software Foundation (ASF) under one or more
  contributor license agreements.  See the NOTICE file distributed with
  this work for additional information regarding copyright ownership.
  The ASF licenses this file to You under the Apache License, Version 2.0
  (the "License"); you may not use this file except in compliance with
  the License.  You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
---

Apache Fory 是一个多语言序列化框架，支持二进制对象图、可随机访问的 Row、标准 JSON、
Schema 驱动的模型以及由 Fory 支持的 gRPC 服务。

## 从这里开始

1. 阅读[介绍](introduction/index.md)并[选择格式](introduction/choose-a-format.md)。
2. 按照[快速开始](start/index.md)安装所选运行时。
3. 查看[基准测试](benchmarks/index.md)及其方法论，了解相关性能依据。
4. 继续阅读对应能力的指南。

## 功能

| 功能              | 适用场景                               | 文档                                        |
| ----------------- | -------------------------------------- | ------------------------------------------- |
| 对象序列化        | 重建 xlang 或运行时原生对象图          | [对象序列化](object-serialization/index.md) |
| Row Format        | 随机和部分访问可信分析数据             | [行格式](row-format/index.md)               |
| Fory JSON         | 将高吞吐量标准 JSON 映射到 Java 对象   | [Fory JSON](json/index.md)                  |
| Fory IDL 与编译器 | 从共享 Schema 生成运行时原生模型       | [编译器](compiler/index.md)                 |
| Fory gRPC         | 生成用于编组 Fory 模型的 gRPC 配套代码 | [Fory gRPC](grpc/index.md)                  |

## 运行时文档

二进制对象序列化为以下运行时提供多页指南：
[Java](object-serialization/java/index.md)、[Python](object-serialization/python/index.md)、
[C++](object-serialization/cpp/index.md)、[Go](object-serialization/go/index.md)、
[Rust](object-serialization/rust/index.md)、
[JavaScript/TypeScript](object-serialization/javascript/index.md)、
[C#](object-serialization/csharp/index.md)、[Swift](object-serialization/swift/index.md)、
[Dart](object-serialization/dart/index.md)、[Scala](object-serialization/scala/index.md) 和
[Kotlin](object-serialization/kotlin/index.md)。

## 参考与开发

- 编码格式和类型系统详情仍位于独立的[规范](specification/xlang_serialization_spec.md)页面组中。
- 仓库贡献者应从[开发](development/index.md)和[贡献指南](https://github.com/apache/fory/blob/main/CONTRIBUTING.md)开始。
- 漏洞报告说明位于仓库的[安全策略](https://github.com/apache/fory/blob/main/SECURITY.md)中。
