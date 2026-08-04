---
title: 快速开始
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

Apache Fory™ 发行版同时提供源代码制品和特定语言的软件包。

如需下载源代码，请访问 Apache Fory™ [下载](https://fory.apache.org/download)页面。

## 选择运行时

每个运行时的环境配置页面都会检查工具链，并引导你前往该运行时支持的能力：

| 运行时                | 环境配置                               |
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

## 选择能力

| 需求                   | 后续文档                                       |
| ---------------------- | ---------------------------------------------- |
| 重建对象图             | [对象序列化](../object-serialization/index.md) |
| 随机或部分访问分析数据 | [Row Format](../row-format/index.md)           |
| 从 Java 交换标准 JSON  | [Fory JSON](../json/index.md)                  |
| 根据 Schema 生成模型   | [Fory IDL 和编译器](../compiler/index.md)      |
| 通过 gRPC 使用生成模型 | [Fory gRPC](../grpc/index.md)                  |

对象序列化随后要求你在两种模式中选择：可移植跨语言载荷使用 xlang 模式，同运行时载荷使用
native 模式。如果尚不清楚应选择哪种产品，请参阅
[选择格式](../introduction/choose-a-format.md)。

所选能力指南会提供确切依赖和首个可成功运行的任务。Schema 兼容性设置和生产配置取决于
具体运行时。
