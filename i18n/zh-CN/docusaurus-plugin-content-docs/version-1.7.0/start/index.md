---
title: 概述
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

从下面的语言页面开始。每个页面都提供锁定到具体发行版本的安装方式、可运行的对象序列化往返示例、该语言可用的模式，以及通往其他可用 Fory 能力的简要入口。

Apache Fory™ 以源代码制品和各语言专用软件包的形式发布。若要下载源代码，请访问 Apache Fory™ [下载](https://fory.apache.org/download)页面。

## 五分钟上手

1. 选择应用使用的语言。
2. 安装该语言页面中列出的软件包。
3. 运行最小序列化/反序列化示例。
4. 如果两种模式都可用，跨语言数据选择 xlang 模式，由一个 Fory 实现家族处理的数据选择 native 模式。
5. 前往对应能力指南，了解生产环境配置和高级 API。

## 选择语言

每个语言页面提供固定版本的安装示例、适用于应用项目的最小往返示例，以及相应能力的后续步骤：

| 语言                  | 设置                                   |
| --------------------- | -------------------------------------- |
| Java                  | [Java](java.md)                        |
| Python                | [Python](python.md)                    |
| C++                   | [C++](cpp.md)                          |
| Go                    | [Go](go.md)                            |
| Rust                  | [Rust](rust.md)                        |
| JavaScript/TypeScript | [JavaScript/TypeScript](javascript.md) |
| C#                    | [C#](csharp.md)                        |
| Swift                 | [Swift](swift.md)                      |
| Dart                  | [Dart](dart.md)                        |
| Scala                 | [Scala](scala.md)                      |
| Kotlin                | [Kotlin](kotlin.md)                    |

## 可以构建什么

| 能力 | 用途 | 可用语言 | 详细指南 |
| ---------- | ----------------------------------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------- |
| 对象序列化 | 重建对象图，包括共享引用和 Schema 变更 | 所有语言 | [对象序列化](../object-serialization/index.md) |
| Row Format | 对可信分析数据进行零拷贝、随机或部分字段访问 | Java、Python、C++、Rust | [Row Format](../row-format/index.md) |
| Fory JSON | 高性能标准 JSON 映射 | Java、Kotlin、Scala | [Fory JSON](../json/index.md) |
| Fory IDL | 从 Fory、protobuf 或 FlatBuffers IDL 生成原生模型和序列化器 | 所有语言 | [Fory IDL 与编译器](../compiler/index.md) |
| Fory gRPC | 通过常规 gRPC 传输使用生成的模型和 Fory 编码的消息 | Java、Python、C++、Go、Rust、JavaScript、C#、Dart、Scala、Kotlin | [Fory gRPC](../grpc/index.md) |

对象序列化使用 xlang 模式生成可移植的跨语言数据。Java、Python、C++、Go、Rust、Scala 和 Kotlin 还提供 native 模式，用于由一个 Fory 实现家族处理的数据。如果尚未确定使用哪种格式，请参阅[选择格式](../introduction/choose-a-format.md)。
