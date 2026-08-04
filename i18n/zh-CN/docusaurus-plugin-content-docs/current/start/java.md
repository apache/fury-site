---
title: Java 环境配置
sidebar_position: 1
id: java
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

Fory Java 制品发布到 Maven Central。Fory core 支持 Java 8 及更高版本；Java Record 需要
Java 17 或更高版本，Row Format 需要 Java 11 或更高版本。一个应用中的所有 Fory 制品应
使用相同版本。

## 验证工具链

```bash
java -version
mvn -version
# or: ./gradlew --version
```

## 选择能力

| 能力              | 制品或工具                      | 后续文档                                                                                                                                                              |
| ----------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 对象序列化        | `fory-core`                     | [Java 对象序列化](../object-serialization/java/index.md)，然后选择 [xlang](../object-serialization/java/xlang.md) 或 [native](../object-serialization/java/native.md) |
| Fory JSON         | `fory-json`                     | [Fory JSON 快速开始](../json/getting-started.md)                                                                                                                      |
| Row Format        | `fory-format`                   | [Java Row Format](../row-format/java.md)                                                                                                                              |
| Schema 和生成模型 | `fory-compiler`                 | [Fory IDL 和编译器](../compiler/index.md)                                                                                                                             |
| Fory gRPC         | 生成的配套代码加 gRPC Java 依赖 | [Java gRPC](../grpc/java.md)                                                                                                                                          |

每个能力指南都会提供确切的依赖声明和首个可运行示例。
