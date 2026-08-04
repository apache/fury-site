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

| 格式          | 适用场景                             | 入门文档                                             |
| ------------- | ------------------------------------ | ---------------------------------------------------- |
| Xlang 二进制  | 数据需要跨语言传输                   | [跨语言指南](../object-serialization/xlang/index.md) |
| Native 二进制 | 生产端和消费端使用同一种语言         | 相应语言指南                                         |
| Row Format    | 需要随机字段访问或分析场景的部分读取 | [Row Format 规范](../row-format/index.md)            |
| Fory JSON     | Java 应用需要高性能标准 JSON         | [Fory JSON 指南](../json/index.md)                   |

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
