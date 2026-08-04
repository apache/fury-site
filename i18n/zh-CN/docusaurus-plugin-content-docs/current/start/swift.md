---
title: Swift 环境配置
sidebar_position: 8
id: swift
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

Fory Swift 通过 Swift Package Manager 从 Apache Fory 仓库分发。当前软件包使用 Swift tools
6.0，目标平台为 macOS 13 或更高版本以及 iOS 16 或更高版本。一个应用的所有对等端应固定
使用同一 Fory 发行版。

## 验证工具链

```bash
swift --version
```

## 选择能力

| 能力              | 软件包 product 或工具        | 后续文档                                                                                                     |
| ----------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------ |
| 对象序列化        | Swift package product `Fory` | [Swift 对象序列化](../object-serialization/swift/index.md)和 [xlang](../object-serialization/swift/xlang.md) |
| Schema 和生成模型 | `fory-compiler`              | [Fory IDL 和编译器](../compiler/index.md)                                                                    |

所选能力指南会提供确切的软件包声明和首个可运行示例。
