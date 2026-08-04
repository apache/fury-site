---
title: C# 环境配置
sidebar_position: 7
id: csharp
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

Fory C# 以 `Apache.Fory` 名称发布到 NuGet，需要 .NET 8 SDK 或更高版本。该包包含运行时和
`ForyStruct` 类型的 source generator。一个应用的所有对等端应使用同一兼容的 Fory 发行版。

## 验证工具链

```bash
dotnet --version
```

## 选择能力

| 能力              | 软件包或工具                    | 后续文档                                                                                                    |
| ----------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| 对象序列化        | `Apache.Fory`                   | [C# 对象序列化](../object-serialization/csharp/index.md)和 [xlang](../object-serialization/csharp/xlang.md) |
| Schema 和生成模型 | `fory-compiler`                 | [Fory IDL 和编译器](../compiler/index.md)                                                                   |
| Fory gRPC         | 生成的配套代码加 gRPC .NET 依赖 | [C# gRPC](../grpc/csharp.md)                                                                                |

每个能力指南都会提供确切的软件包声明和首个可运行示例。
