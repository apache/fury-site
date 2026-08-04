---
title: 配置
sidebar_position: 4
id: configuration
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

本文介绍 Rust Fory 实例配置。`Fory::builder().xlang(true).build()` 选择带兼容 Schema 演进的跨语言模式。通过 `.xlang(false)` 显式选择原生模式，该模式也默认使用兼容 Schema 演进。

## 编码模式

Apache Fory™ 支持两种序列化模式：

### 跨语言模式

通过 `.xlang(true)` 选择跨语言模式，并使用跨语言编码格式。兼容 Schema 演进是跨语言模式的默认设置；由于 Schema 更容易在不同语言之间产生差异，建议跨语言服务使用该设置：

```rust
let fory = Fory::builder().xlang(true).build();
```

只有每个读取端和写入端始终使用相同 Schema，并且希望获得更快序列化和更小体积时，才对跨语言载荷使用 `.compatible(false)`。只有确认每种语言都使用该 Schema，或原生类型由 Fory Schema IDL 生成时才使用：

```rust
let fory = Fory::builder().compatible(false).build();
```

### 原生模式

对于仅限 Rust 的载荷，请显式选择原生模式：

```rust
let fory = Fory::builder().xlang(false).build();
```

兼容模式默认启用。只有每个读取端和写入端始终使用相同 Rust Schema，并且希望获得更快序列化和更小体积时，才设置 `.compatible(false)`。

## 配置项

### 最大动态对象嵌套深度

Apache Fory™ 可防止反序列化期间深层嵌套动态对象导致栈溢出。特征对象和容器的最大嵌套深度默认为 5 层。

**默认配置：**

```rust
let fory = Fory::builder().build(); // max_dyn_depth = 5
```

**自定义深度限制：**

```rust
let fory = Fory::builder().max_dyn_depth(10).build(); // Allow up to 10 levels
```

**何时调整：**

- **增大**：用于合理的深层嵌套数据结构
- **减小**：用于更严格的安全要求或浅层数据结构

**受保护的类型：**

- `Box<dyn Any>`, `Rc<dyn Any>`, `Arc<dyn Any + Send + Sync>`
- `Box<dyn Trait>`, `Rc<dyn Trait>`, `Arc<dyn Trait>` (trait objects)
- `RcWeak<T>`, `ArcWeak<T>`
- 集合类型（Vec、HashMap、HashSet）
- 兼容模式下的嵌套结构体类型

注意：静态数据类型（非动态类型）的结构在编译期已知，因此天然安全，不受深度限制。

### 远端 Schema 元数据限制

兼容模式可以接收用于 Schema 演进的远端元数据。以下限制约束元数据大小和可接受的 Schema 版本：

```rust
let fory = Fory::builder()
    .max_type_fields(512)
    .max_type_meta_bytes(4096)
    .max_schema_versions_per_type(10)
    .max_average_schema_versions_per_type(3)
    .build();
```

- `max_type_fields` 默认为 `512`，限制一个已接收结构体元数据主体中的字段数。
- `max_type_meta_bytes` 默认为 `4096`，限制一个已接收 TypeDef 或 TypeMeta 主体的编码字节数，不包括 8 字节头部和任何扩展大小变长整数。
- `max_schema_versions_per_type` 默认为 `10`，限制一个逻辑类型可接受的远端元数据版本数。
- `max_average_schema_versions_per_type` 默认为 `3`，限制已接受远端类型的平均版本数。有效全局下限为 `8192` 个 Schema。

### 对象图内存预算

`max_graph_memory_bytes(...)` 为一次根读取设置近似对象图内存限制。该估算主要覆盖实例化的集合、映射、数组、结构体和对象，并非精确的进程堆限制。字符串、二进制数据、原始标量和原始稠密数组等叶值不计入，因此实际进程内存可能更高。叶值仍受字节可用性检查保护：如果未读输入没有足够字节，Fory 不会读取或创建该叶值。所有根输入形式的默认值固定为 `128 MiB`。可信载荷需要更大或更小限制时，请设置正字节值：

```rust
let fory = Fory::builder()
    .max_graph_memory_bytes(256 * 1024 * 1024)
    .build();
```

运行时创建时会拒绝零值。

### 无输入支撑容器工作预算

`max_unbacked_container_items(...)` 限制一次根反序列化中重复读取主体未按比例消耗输入的集合元素和映射条目。默认值为 `8192`；零表示严格限制。

```rust
let fory = Fory::builder()
    .max_unbacked_container_items(8192)
    .build();
```

### 显式跨语言示例

跨语言序列化示例中显式设置 `.xlang(true)`：

```rust
let fory = Fory::builder().xlang(true).build();
```

## 构建器模式

```rust
use fory::Fory;

// Default xlang configuration
let fory = Fory::builder().build();

// Native mode for Rust-only traffic
let fory = Fory::builder().xlang(false).build();

// Same-schema optimization for Rust-only payloads
let fory = Fory::builder().xlang(false).compatible(false).build();

// Custom depth limit
let fory = Fory::builder().max_dyn_depth(10).build();

// Custom graph memory budget
let fory = Fory::builder()
    .max_graph_memory_bytes(256 * 1024 * 1024)
    .build();

// Combined configuration
let fory = Fory::builder()
    .xlang(false)
    .max_dyn_depth(10)
    .build();
```

## 配置摘要

| 选项                                          | 说明                                               | 默认值    |
| --------------------------------------------- | -------------------------------------------------- | --------- |
| `compatible(bool)`                            | 启用 Schema 演进                                   | `true`    |
| `xlang(bool)`                                 | 使用 xlang 模式                                    | `true`    |
| `max_dyn_depth(u32)`                          | 动态类型的最大嵌套深度                             | `5`       |
| `max_graph_memory_bytes(usize)`               | 每次根值读取的近似对象图内存限制                   | `128 MiB` |
| `max_unbacked_container_items(usize)`         | 每次根值读取允许的无输入支撑 collection/map 工作量 | `8192`    |
| `max_type_fields(usize)`                      | 单个已接收结构体元数据主体的最大字段数             | `512`     |
| `max_type_meta_bytes(usize)`                  | 单个已接收元数据主体的最大编码字节数               | `4096`    |
| `max_schema_versions_per_type(usize)`         | 单个逻辑类型的最大远程元数据版本数                 | `10`      |
| `max_average_schema_versions_per_type(usize)` | 所有类型的平均远程元数据版本数                     | `3`       |

## 兼容模式

跨语言模式和原生模式都默认启用兼容模式。当 Rust 结构体可能独立演进、服务分别部署，或跨语言 Schema 由不同语言手写时，请保留该默认设置。

只有每个载荷反序列化所用 Schema 始终与序列化时相同，并且希望获得更快序列化和更小体积时，才使用 `.compatible(false)`。对于跨语言载荷，只有确认每种语言都使用相同 Schema，或原生类型由 Fory Schema IDL 生成时才使用 `.compatible(false)`。

## 安全

有关信任边界、安全的读取端配置和验证方法，请参阅 [Rust 安全](security.md)。

## 相关主题

- [基本序列化](basic-serialization.md) - 使用已配置的 Fory
- [Schema 演进](schema-evolution.md) - 兼容模式详情
- [跨语言序列化](basic-serialization.md#cross-language-interoperability) - xlang 模式
