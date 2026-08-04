---
title: Rust 环境配置
sidebar_position: 5
id: rust
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

Fory Rust 发布在 crates.io。workspace 支持的最低 Rust 版本为 1.70，并使用 Rust 2021 edition。
一个应用的所有对等端应使用同一兼容的 Fory 发行版。

## 验证工具链

```bash
rustc --version
cargo --version
```

## 选择能力

| 能力                | Crate 或工具                        | 后续文档                                                                                                                                                              |
| ------------------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 对象序列化          | `fory`                              | [Rust 对象序列化](../object-serialization/rust/index.md)，然后选择 [xlang](../object-serialization/rust/xlang.md) 或 [native](../object-serialization/rust/native.md) |
| Standard Row Format | `fory`                              | [Rust Row Format](../row-format/rust.md)                                                                                                                              |
| Schema 和生成模型   | `fory-compiler`                     | [Fory IDL 和编译器](../compiler/index.md)                                                                                                                             |
| Fory gRPC           | 生成的配套代码加 `tonic` 和 `bytes` | [Rust gRPC](../grpc/rust.md)                                                                                                                                          |

每个能力指南都会提供确切的依赖声明和首个可运行示例。
