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

本页介绍 Rust Fory 实例的配置。`Fory::builder().xlang(true).build()` 会选择
Xlang 模式并启用兼容的 Schema 演进。原生模式需要通过 `.xlang(false)` 显式选择，
并且默认同样启用兼容的 Schema 演进。

## 编码模式

Apache Fory™ 支持两种序列化模式：

### Xlang 模式

通过 `.xlang(true)` 选择 Xlang 模式，该模式使用跨语言编码格式。Xlang 默认启用兼容的
Schema 演进；对于跨语言服务，建议保留此默认设置，因为不同语言中的 Schema 更容易出现差异：

```rust
let fory = Fory::builder().xlang(true).build();
```

只有在每个读写端始终使用相同 Schema，并且需要更快的序列化速度和更小的体积时，才应对
Xlang 载荷使用 `.compatible(false)`。请仅在确认每种语言都使用相同 Schema，或各语言的
原生类型均由 Fory Schema IDL 生成之后使用此设置：

```rust
let fory = Fory::builder().compatible(false).build();
```

### 原生模式

对于仅在 Rust 中使用的载荷，请显式选择原生模式：

```rust
let fory = Fory::builder().xlang(false).build();
```

兼容模式默认启用。只有在每个读写端始终使用相同的 Rust Schema，并且需要更快的序列化速度
和更小的体积时，才应设置 `.compatible(false)`。

## 配置

### 最大动态对象嵌套深度

Apache Fory™ 可防止反序列化深度嵌套的动态对象时发生栈溢出。对于 trait 对象和容器，
默认最大嵌套深度为 5 层。

**默认配置：**

```rust
let fory = Fory::builder().build(); // max_dyn_depth = 5
```

**自定义深度限制：**

```rust
let fory = Fory::builder().max_dyn_depth(10).build(); // 最多允许 10 层
```

**何时调整：**

- **增加**：用于合理的深层嵌套数据结构
- **减小**：用于更严格的安全要求或浅层数据结构

**受保护的类型：**

- `Box<dyn Any>`、`Rc<dyn Any>`、`Arc<dyn Any + Send + Sync>`
- `Box<dyn Trait>`、`Rc<dyn Trait>`、`Arc<dyn Trait>`（trait 对象）
- `RcWeak<T>`、`ArcWeak<T>`
- 集合类型（Vec、HashMap、HashSet）
- 兼容模式下的嵌套结构体类型

注意：静态数据类型（非动态类型）的结构在编译时已知，本身是安全的，因此不受深度限制。

### 远端 Schema 元数据限制

兼容模式可以接收用于 Schema 演进的远端元数据。以下限制用于约束元数据大小及可接受的
Schema 版本数：

```rust
let fory = Fory::builder()
    .max_type_fields(512)
    .max_type_meta_bytes(4096)
    .max_schema_versions_per_type(10)
    .max_average_schema_versions_per_type(3)
    .build();
```

- `max_type_fields` 默认为 `512`，限制单个已接收结构体元数据主体中的字段数。
- `max_type_meta_bytes` 默认为 `4096`，限制单个已接收 TypeDef 或 TypeMeta 主体的编码字节数，
  不包括 8 字节头部和可能存在的扩展大小 varint。
- `max_schema_versions_per_type` 默认为 `10`，限制单个逻辑类型可接受的远端元数据版本数。
- `max_average_schema_versions_per_type` 默认为 `3`，限制所有已接受远端类型的平均版本数。
  有效的全局 Schema 数量下限为 `8192`。

### 对象图内存预算

`max_graph_memory_bytes(...)` 为单次根对象读取设置近似的对象图内存限额。该估算主要涵盖
实际创建的集合、map、数组、结构体和对象，并不是精确的进程堆内存上限。字符串、二进制数据、
基本类型标量和紧凑的基本类型数组等叶子值不计入估算，因此实际进程内存用量可能高于此值。
叶子值仍受可用字节数检查保护：如果未读取的输入中没有足够的字节，Fory 就不会读取或创建
该叶子值。无论根输入采用何种形式，默认限额均固定为 `128 MiB`。当可信载荷确实需要更大或
更小的限额时，可以设置一个正的字节数：

```rust
let fory = Fory::builder()
    .max_graph_memory_bytes(256 * 1024 * 1024)
    .build();
```

创建运行时时会拒绝零值。

### 显式指定 Xlang 的示例

在 Xlang 序列化示例中，请显式设置 `.xlang(true)`：

```rust
let fory = Fory::builder().xlang(true).build();
```

## Builder 模式

```rust
use fory::Fory;

// 默认的 Xlang 配置
let fory = Fory::builder().build();

// 用于仅在 Rust 中传输数据的原生模式
let fory = Fory::builder().xlang(false).build();

// 针对仅在 Rust 中使用且 Schema 相同的载荷进行优化
let fory = Fory::builder().xlang(false).compatible(false).build();

// 自定义深度限制
let fory = Fory::builder().max_dyn_depth(10).build();

// 自定义对象图内存预算
let fory = Fory::builder()
    .max_graph_memory_bytes(256 * 1024 * 1024)
    .build();

// 组合配置
let fory = Fory::builder()
    .xlang(false)
    .max_dyn_depth(10)
    .build();
```

## 配置摘要

| 选项                                          | 描述                               | 默认值    |
| --------------------------------------------- | ---------------------------------- | --------- |
| `compatible(bool)`                            | 启用 Schema 演进                   | `true`    |
| `xlang(bool)`                                 | 使用 Xlang 模式                    | `true`    |
| `max_dyn_depth(u32)`                          | 动态类型的最大嵌套深度             | `5`       |
| `max_graph_memory_bytes(usize)`               | 每次根对象读取的近似对象图内存限额 | `128 MiB` |
| `max_type_fields(usize)`                      | 单个已接收结构体元数据的最大字段数 | `512`     |
| `max_type_meta_bytes(usize)`                  | 单个已接收元数据主体的最大编码字节数 | `4096`  |
| `max_schema_versions_per_type(usize)`         | 单个逻辑类型的最大远端元数据版本数 | `10`      |
| `max_average_schema_versions_per_type(usize)` | 所有远端类型的平均元数据版本数     | `3`       |

## 兼容模式

Xlang 模式和原生模式默认都启用兼容模式。当 Rust 结构体可能独立演进、服务分别部署，或 Xlang
Schema 由不同语言手动编写时，请保留此默认设置。

只有在每个载荷反序列化时使用的 Schema 始终与序列化时使用的 Schema 相同，并且需要更快的
序列化速度和更小的体积时，才应使用 `.compatible(false)`。对于 Xlang 载荷，请仅在确认每种
语言都使用相同 Schema，或各语言的原生类型均由 Fory Schema IDL 生成之后使用
`.compatible(false)`。

## 安全

安全相关配置建议：

- 反序列化不可信载荷前，先注册应用结构体和 trait 对象实现。
- 使用 `max_dyn_depth(...)` 拒绝深度异常的动态对象图。
- 对于大多数输入，保持 `max_graph_memory_bytes(...)` 固定的 `128 MiB` 默认值；如果可信
  工作负载需要其他合理的集合、map 或结构体大小，请设置相应的正数字节限额。
- 除非数据不是恶意输入，并且可信对等方会发送更大的元数据或大量 Schema 版本，否则请保持
  远端 Schema 元数据限制的默认值。
- 对于不可信输入，优先使用具体类型字段，而不是 `dyn Any` 或宽泛的 trait 对象字段。

## 相关主题

- [基础序列化](basic-serialization.md) - 使用配置后的 Fory
- [Schema 演进](schema-evolution.md) - 兼容模式详情
- [Xlang 序列化](xlang-serialization.md) - Xlang 模式
