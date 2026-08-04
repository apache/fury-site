---
title: 选择格式
sidebar_position: 2
id: choose-a-format
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

| 格式或模式    | 数据模型                    | 适用场景                             | 互操作范围                                                          | 入门文档                                             |
| ------------- | --------------------------- | ------------------------------------ | ------------------------------------------------------------------- | ---------------------------------------------------- |
| Xlang 二进制  | 可移植对象图                | 数据需要跨语言传输                   | 支持的运行时共享同一种线格式                                        | [跨语言指南](../object-serialization/xlang/index.md) |
| Native 二进制 | 运行时原生对象图            | 生产端和消费端使用同一种语言         | 仅限同一运行时家族                                                  | [对象序列化](../object-serialization/index.md)       |
| Row Format    | 可随机访问的二进制行        | 需要随机字段访问或分析场景的部分读取 | Standard Row 由 Java、Python、C++ 和 Rust 共享；Compact 仅支持 Java | [Row Format 指南](../row-format/index.md)            |
| Fory JSON     | 映射到 Java 对象的标准 JSON | Java 应用需要高性能标准 JSON         | 标准 JSON 文本                                                      | [Fory JSON 指南](../json/index.md)                   |

Xlang 和 native 是对象序列化的两种并列模式，适用于接收端需要重建对象图的场景。Row Format
和 Fory JSON 是独立格式，不是额外的对象序列化模式。

对于 Java、Scala、Kotlin、Python、C++、Go 和 Rust，同语言通信应使用 native 模式。它避开
xlang 的跨语言类型映射和元数据限制，更贴近各语言的原生类型系统，并支持更丰富的语言特定
对象图。当生产端和消费端属于同一语言家族，并且需要原生对象模型而非可移植的跨语言 Schema
时，请使用此模式。

对于仅使用 Java/JVM 的系统，native 模式可以替代 JDK serialization、Kryo、FST、Hessian
和仅供 Java 使用的 Protocol Buffers 载荷。对于仅使用 Python 的系统，native 模式可以替代
pickle 和 cloudpickle。

兼容模式是 Fory 的 Schema 演进模式。它写入读取端和写入端容忍 Schema 差异所需的元数据。
对于公开此选项的实现，xlang 模式和 native 模式默认启用兼容模式。

当服务独立部署，或字段可能随时间添加或删除时，请使用兼容模式。只有每个读取端和写入端
始终使用相同 Schema，且希望获得更快的序列化速度和更小的体积时，才将兼容模式设为
`false`。对于 xlang 载荷，只有确认每种语言使用相同 Schema，或原生类型由 Fory Schema IDL
生成后，才将兼容模式设为 `false`。

对于 xlang，所有对等端必须就类型标识达成一致。示例中基于名称的注册更容易理解。数字 ID
体积更小、速度更快，但需要在所有读取端和写入端之间协调。

## 选择总结

需要重建对象图时选择 xlang 或 native 模式。对于可信的分析数据，如果随机字段访问能带来
收益，请选择 Row Format。Java 应用需要标准 JSON 时选择 Fory JSON。多个团队需要统一的
Schema 优先契约时，请使用 Fory IDL 和编译器；它会生成使用相应 Fory 能力的模型。

## 相关能力

[Fory IDL 和编译器](../compiler/index.md)可以为支持的运行时生成原生模型。服务定义还可以生成
[Fory gRPC](../grpc/index.md)代码。这两项能力都不会定义新的序列化格式。

协议实现者应遵循 [Specifications](../specification/xlang_serialization_spec.md) 中的规范性格式文档。
