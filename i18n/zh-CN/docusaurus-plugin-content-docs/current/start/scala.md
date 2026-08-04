---
title: Scala 环境配置
sidebar_position: 10
id: scala
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

Fory Scala 为 Scala 2.13 和 Scala 3 发布制品到 Maven Central。由 Schema 生成的 Scala 源代码
和宏派生的 xlang 序列化器需要 Scala 3。运行时使用 Fory Java，因此所有 Fory 制品应保持
在同一发行版。

## 验证工具链

```bash
java -version
scala -version
sbt --version
```

## 选择能力

| 能力              | 制品或工具                          | 后续文档                                                                                                                                                                  |
| ----------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 对象序列化        | `fory-scala_2.13` 或 `fory-scala_3` | [Scala 对象序列化](../object-serialization/scala/index.md)，然后选择 [xlang](../object-serialization/scala/xlang.md) 或 [native](../object-serialization/scala/native.md) |
| Schema 和生成模型 | `fory-compiler`；Scala 3 输出       | [Fory IDL 和编译器](../compiler/index.md)                                                                                                                                 |
| Fory gRPC         | Scala 3 生成配套代码加 grpc-java    | [Scala gRPC](../grpc/scala.md)                                                                                                                                            |

每个能力指南都会提供确切的 Maven 或 sbt 声明和首个可运行示例。
