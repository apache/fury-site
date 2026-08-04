---
title: C++ 环境配置
sidebar_position: 3
id: cpp
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

Fory C++ 直接从 Apache Fory 源代码树使用。它需要 C++17 编译器，并支持 CMake 3.16 或更高
版本以及 Bazel 8 或更高版本。一个应用的所有对等端应固定使用同一 Fory 发行版或 commit。

## 验证工具链

```bash
c++ --version
cmake --version
# or: bazel --version
```

## 选择能力

| 能力              | 构建目标                                            | 后续文档                                                                                                                                                          |
| ----------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 对象序列化        | `fory::serialization` 或 `//cpp/fory/serialization` | [C++ 对象序列化](../object-serialization/cpp/index.md)，然后选择 [xlang](../object-serialization/cpp/xlang.md) 或 [native](../object-serialization/cpp/native.md) |
| Row Format        | C++ Row 和编码器目标                                | [C++ Row Format](../row-format/cpp.md)                                                                                                                            |
| Schema 和生成模型 | `fory-compiler`                                     | [Fory IDL 和编译器](../compiler/index.md)                                                                                                                         |
| Fory gRPC         | 生成的配套代码加 gRPC C++                           | [C++ gRPC](../grpc/cpp.md)                                                                                                                                        |

所选能力指南会提供确切的 CMake 或 Bazel 配置以及首个可运行示例。
