---
title: 配置
sidebar_position: 1
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

本页涵盖 Fory 配置选项和序列化模式。

## 序列化模式

Apache Fory™ 支持两种序列化模式：

### SchemaConsistent 模式（默认）

类型声明必须在对等方之间完全匹配：

```rust
let fory = Fory::default(); // 默认为 SchemaConsistent
```

### Compatible 模式

允许独立的 schema 演化：

```rust
let fory = Fory::default().compatible(true);
```

## 配置选项

### 最大动态对象嵌套深度

Apache Fory™ 提供针对反序列化期间深度嵌套动态对象导致的栈溢出保护。默认情况下，trait 对象和容器的最大嵌套深度设置为 5 层。

**默认配置：**

```rust
let fory = Fory::default(); // max_dyn_depth = 5
```

**自定义深度限制：**

```rust
let fory = Fory::default().max_dyn_depth(10); // 允许最多 10 层
```

**何时调整：**

- **增加**：用于合法的深度嵌套数据结构
- **减少**：用于更严格的安全要求或浅层数据结构

**受保护的类型：**

- `Box<dyn Any>`、`Rc<dyn Any>`、`Arc<dyn Any>`
- `Box<dyn Trait>`、`Rc<dyn Trait>`、`Arc<dyn Trait>`（trait 对象）
- `RcWeak<T>`、`ArcWeak<T>`
- 集合类型（Vec、HashMap、HashSet）
- Compatible 模式下的嵌套结构体类型

注意：静态数据类型（非动态类型）本质上是安全的，不受深度限制约束，因为它们的结构在编译时就已知。

### 远端 Schema Metadata 限制

兼容模式可能接收用于 Schema 演进的远端 metadata。以下限制用于约束 metadata 大小和可接受的 schema 版本数：

```rust
let fory = Fory::builder()
    .max_type_fields(512)
    .max_type_meta_bytes(4096)
    .max_schema_versions_per_type(10)
    .max_average_schema_versions_per_type(3)
    .build();
```

- `max_type_fields` 默认值为 `512`，限制一个收到的 struct metadata body 中的字段数。
- `max_type_meta_bytes` 默认值为 `4096`，限制一个收到的 TypeDef 或 TypeMeta body 的编码 body 字节数，不包含 8 字节 header 和扩展 size varint。
- `max_schema_versions_per_type` 默认值为 `10`，限制一个逻辑类型可接受的远端 metadata 版本数。
- `max_average_schema_versions_per_type` 默认值为 `3`，限制所有已接受远端类型的平均版本数；有效全局下限为 `8192` 个 schema。

### 对象图内存预算

`max_graph_memory_bytes(...)` 为单次根对象读取设置近似的对象图内存阈值。估算主要
涵盖实际创建的 collection、map、array、struct 和 object；它不是精确的进程 heap
上限。它不包含 string、binary data、primitive scalar 和紧凑 primitive array 等
叶子值，因此实际的进程内存可能高于这个值。叶子值仍受可用字节数检查保护：如果
未读输入没有足够的字节，Fory 就不会读取或创建该叶子值。对于所有根输入形式，
默认值固定为 `128 MiB`。可信载荷需要更大或更小的阈值时，可以设置正数形式的
字节值：

```rust
let fory = Fory::builder()
    .max_graph_memory_bytes(256 * 1024 * 1024)
    .build();
```

创建运行时时会拒绝零值。

### 跨语言模式

启用跨语言序列化：

```rust
let fory = Fory::default()
    .compatible(true)
    .xlang(true);
```

## 构建器模式

```rust
use fory::Fory;

// 默认配置
let fory = Fory::default();

// 用于 schema 演化的兼容模式
let fory = Fory::default().compatible(true);

// 跨语言模式
let fory = Fory::default()
    .compatible(true)
    .xlang(true);

// 自定义深度限制
let fory = Fory::default().max_dyn_depth(10);

// 自定义对象图内存预算
let fory = Fory::builder()
    .max_graph_memory_bytes(256 * 1024 * 1024)
    .build();

// 组合配置
let fory = Fory::default()
    .compatible(true)
    .xlang(true)
    .max_dyn_depth(10);
```

## 配置摘要

| 选项                                          | 描述                              | 默认值  |
| --------------------------------------------- | --------------------------------- | ------- |
| `compatible(bool)`                            | 启用 schema 演化                  | `false` |
| `xlang(bool)`                                 | 启用跨语言模式                    | `false` |
| `max_dyn_depth(u32)`                          | 动态类型的最大嵌套深度            | `5`     |
| `max_graph_memory_bytes(usize)`               | 每次根对象读取的近似对象图内存阈值 | `128 MiB` |
| `max_type_fields(usize)`                      | 一个收到的 struct metadata body 最大字段数 | `512`   |
| `max_type_meta_bytes(usize)`                  | 一个收到的 metadata body 最大编码字节数 | `4096`  |
| `max_schema_versions_per_type(usize)`         | 一个逻辑类型最大远端 metadata 版本数 | `10`    |
| `max_average_schema_versions_per_type(usize)` | 所有远端类型的平均 metadata 版本数 | `3`     |

## 安全建议

- 反序列化不可信 payload 前，先注册应用 struct 和 trait-object 实现。
- 使用 `max_dyn_depth(...)` 拒绝异常深的动态对象图。
- 对于大多数输入，保持 `max_graph_memory_bytes(...)` 固定的 `128 MiB` 默认值；如果
  可信工作负载具有不同且合理的 collection、map 或 struct 大小，请设置正数形式的字节阈值。
- 除非数据不是恶意输入，且可信 peer 会发送更大的 metadata 或大量 schema 版本，否则保持远端 schema metadata 限制的默认值。
- 对不可信输入，优先使用具体类型字段，避免宽泛的 `dyn Any` 或 trait-object 字段。

## 相关主题

- [基础序列化](basic-serialization.md) - 使用已配置的 Fory
- [Schema 演化](schema-evolution.md) - Compatible 模式详情
- [跨语言](xlang-serialization.md) - XLANG 模式
