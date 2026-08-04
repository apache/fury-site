---
title: Dart 环境配置
sidebar_position: 9
id: dart
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

Fory Dart 发布在 pub.dev，需要 Dart SDK 3.7 或更高版本。生成序列化器使用 `build_runner`。
一个应用中的 Fory 软件包和生成代码应保持版本兼容。

## 验证工具链

```bash
dart --version
dart pub --help
```

## 选择能力

| 能力              | 软件包或工具                    | 后续文档                                                                                                  |
| ----------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------- |
| 对象序列化        | `fory` 加 `build_runner`        | [Dart 对象序列化](../object-serialization/dart/index.md)和 [xlang](../object-serialization/dart/xlang.md) |
| Schema 和生成模型 | `fory-compiler`                 | [Fory IDL 和编译器](../compiler/index.md)                                                                 |
| Fory gRPC         | 生成的配套代码加 `package:grpc` | [Dart gRPC](../grpc/dart.md)                                                                              |

每个能力指南都会提供确切的 `pubspec.yaml`、生成命令和首个可运行示例。
