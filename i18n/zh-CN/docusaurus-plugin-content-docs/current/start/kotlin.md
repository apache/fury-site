---
title: Kotlin 环境配置
sidebar_position: 11
id: kotlin
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

Fory Kotlin 制品发布到 Maven Central，并运行在 Fory Java 之上。Fory core 支持 Java 8 及
更高版本。一个应用中的 Kotlin、Java core 和生成代码制品应使用同一 Fory 发行版。

## 验证工具链

```bash
java -version
./gradlew --version
# or: mvn -version
```

## 选择能力

| 能力               | 制品或工具                              | 后续文档                                                                                                                                                                      |
| ------------------ | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 对象序列化         | `fory-kotlin`                           | [Kotlin 对象序列化](../object-serialization/kotlin/index.md)，然后选择 [xlang](../object-serialization/kotlin/xlang.md) 或 [native](../object-serialization/kotlin/native.md) |
| Schema 和生成模型  | `fory-compiler` 和 Kotlin KSP 支持      | [Fory IDL 和编译器](../compiler/index.md)                                                                                                                                     |
| Fory gRPC          | 生成的 coroutine 配套代码加 grpc-kotlin | [Kotlin gRPC](../grpc/kotlin.md)                                                                                                                                              |
| Android 对象序列化 | `fory-kotlin` 加生成序列化器            | [Android](../object-serialization/java/android.md)                                                                                                                            |

每个能力指南都会提供确切的 Maven 或 Gradle 声明和首个可运行示例。
