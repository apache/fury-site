---
title: Schema 元数据
sidebar_position: 7
id: schema-metadata
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

本文说明如何配置 Rust 序列化的字段级元数据。

## 概述

Apache Fory™ 提供 `#[fory(...)]` 属性宏，用于在编译期指定可选的字段级元数据。它支持：

- **Tag ID**：分配紧凑数字 ID，尽量降低结构体字段元数据大小开销
- **可空性**：控制字段能否为 null
- **引用跟踪**：为共享所有权类型启用引用跟踪
- **跳过字段**：将字段排除在序列化之外
- **编码控制**：指定整数编码方式（varint、fixed、tagged）

## 基本语法

`#[fory(...)]` 属性放在各结构体字段上：

```rust
use fory::ForyStruct;

#[derive(ForyStruct)]
struct Person {
    #[fory(id = 0)]
    name: String,

    #[fory(id = 1)]
    age: i32,

    #[fory(id = 2, nullable)]
    nickname: Option<String>,
}
```

多个选项使用逗号分隔。

## 可用选项

### 字段 ID（`id = N`）

为字段分配数字 ID，以尽量降低结构体字段元数据大小开销：

```rust
#[derive(ForyStruct)]
struct User {
    #[fory(id = 0)]
    id: i64,

    #[fory(id = 1)]
    name: String,

    #[fory(id = 2)]
    age: i32,
}
```

**优势**：

- 序列化体积更小（元数据中的数字 ID 相比字段名称）
- 允许重命名字段而不破坏二进制兼容性

**建议**：建议为兼容模式配置字段 ID，因为这可以降低序列化成本。

**注意**：

- ID 在结构体中必须唯一
- ID 必须为非负数
- 未指定时在元数据中使用字段名称（开销更大）

### 跳过字段（`skip`）

将字段排除在序列化之外：

```rust
#[derive(ForyStruct)]
struct User {
    #[fory(id = 0)]
    id: i64,

    #[fory(id = 1)]
    name: String,

    #[fory(skip)]
    password: String, // Not serialized
}
```

`password` 字段不会包含在序列化输出中，反序列化后保持默认值。

### 可空性（`nullable`）

控制是否为字段写入 null 标志：

```rust
use fory::{Fory, RcWeak};

#[derive(ForyStruct)]
struct Record {
    // RcWeak is nullable by default, override to non-nullable
    #[fory(id = 0, nullable = false)]
    required_ref: RcWeak<Data>,
}
```

**默认行为**：

| 类型                      | 默认可空 |
| ------------------------- | -------- |
| `Option<T>`               | `true`   |
| `RcWeak<T>`, `ArcWeak<T>` | `true`   |
| 所有其他类型              | `false`  |

**注意事项**：

- 对于 `Option<T>`、`RcWeak<T>`、`ArcWeak<T>`，可空性默认为 true
- 对于所有其他类型，可空性默认为 false
- 对默认可空的类型使用 `nullable = false` 覆盖默认设置

### 引用跟踪（`ref`）

控制共享所有权类型的字段级引用跟踪：

```rust
use std::rc::Rc;
use std::sync::Arc;

#[derive(ForyStruct)]
struct Container {
    // Enable reference tracking (default for Rc/Arc)
    #[fory(id = 0, ref = true)]
    shared_data: Rc<Data>,

    // Disable reference tracking
    #[fory(id = 1, ref = false)]
    unique_data: Rc<Data>,
}
```

**默认行为**：

| 类型                              | 默认引用跟踪   |
| --------------------------------- | -------------- |
| `Rc<T>`, `Arc<T>`                 | `true`         |
| `RcWeak<T>`, `ArcWeak<T>`         | `true`         |
| `Option<Rc<T>>`, `Option<Arc<T>>` | `true`（继承） |
| 所有其他类型                      | `false`        |

**使用场景**：

- 对可能形成循环或被共享的字段启用
- 对始终唯一的字段禁用（优化）

### 编码（`encoding`）

控制整数字段的编码方式：

```rust
#[derive(ForyStruct)]
struct Metrics {
    // Variable-length encoding (smaller for small values)
    #[fory(id = 0, encoding = varint)]
    count: i64,

    // Fixed-length encoding (consistent size)
    #[fory(id = 1, encoding = fixed)]
    timestamp: i64,

    // Tagged encoding (includes type tag, u64 only)
    #[fory(id = 2, encoding = tagged)]
    value: u64,
}
```

**支持的编码**：

| 类型         | 选项                        | 默认值   |
| ------------ | --------------------------- | -------- |
| `i32`, `u32` | `varint`, `fixed`           | `varint` |
| `i64`, `u64` | `varint`, `fixed`, `tagged` | `varint` |

**使用时机**：

- `varint`：最适合通常较小的值（默认）
- `fixed`：最适合使用完整范围的值（例如时间戳、哈希）
- `tagged`：需要保留类型信息时（仅 u64）

### 嵌套集合配置

覆盖设置属于嵌套元素而非外层字段时，请使用 `list(element(...))` 和 `map(key(...), value(...))`：

```rust
use std::collections::HashMap;

#[derive(ForyStruct)]
struct Data {
    #[fory(list(element(encoding = fixed)))]
    fixed_values: Vec<i32>,

    #[fory(map(key(encoding = fixed), value(nullable = true, encoding = tagged)))]
    values_by_id: HashMap<Option<i32>, Option<u64>>,
}
```

未加注解的 `Vec<i32>` 字段是采用默认 varint 元素编码的 `list<int32>`。上面的 `fixed_values` 字段仍为 LIST，只将元素编码改为定长 `int32`。字段 Schema 本身是稠密原始数组时使用 `#[fory(array)]`；二进制数据使用 `#[fory(bytes)]` 标注 `Vec<u8>`。

`compress` 已被移除。请直接使用 `encoding = varint` 或 `encoding = fixed`。

### 外部类型字段选择

使用 `with` 选择目标为确切字段类型的序列化器。该序列化器可以是外部结构化序列化器、自定义序列化器或载体组合：

```rust
use fory::{ForyStruct, VecSerializer};
use std::collections::HashMap;

#[derive(ForyStruct)]
struct Envelope {
    #[fory(with = UserSerializer)]
    user: third_party::User,

    #[fory(with = VecSerializer<UserSerializer>)]
    direct_users: Vec<third_party::User>,

    #[fory(list(element(with = UserSerializer)))]
    users: Vec<third_party::User>,

    #[fory(map(value(with = UserSerializer)))]
    by_name: HashMap<String, third_party::User>,

    #[fory(tuple(element(index = 1, with = UserSerializer)))]
    selected: (String, third_party::User),
}
```

`with` 选择目标为确切字段节点的序列化器，因此 `direct_users` 对整个 Vec 使用载体序列化器。每个递归注解只应用于其子节点。例如，映射键和值可以选择不同序列化器。元组索引从零开始。完整递归语法和支持的载体参见[外部类型序列化](external-types.md)。

## 类型分类

Fory 对字段类型进行分类以确定默认行为：

| 类型类别  | 示例                         | 默认可空 | 默认引用 |
| --------- | ---------------------------- | -------- | -------- |
| Primitive | `i8`, `i32`, `f64`, `bool`   | `false`  | `false`  |
| Option    | `Option<T>`                  | `true`   | `false`  |
| Rc        | `Rc<T>`                      | `false`  | `true`   |
| Arc       | `Arc<T>`                     | `false`  | `true`   |
| RcWeak    | `RcWeak<T>`（Fory 类型）     | `true`   | `true`   |
| ArcWeak   | `ArcWeak<T>`（Fory 类型）    | `true`   | `true`   |
| 其他      | `String`、`Vec<T>`、用户类型 | `false`  | `false`  |

**特殊情况**：`Option<Rc<T>>` 和 `Option<Arc<T>>` 继承内部类型的引用跟踪行为。

## 完整示例

```rust
use fory::ForyStruct;
use std::rc::Rc;

#[derive(ForyStruct, Default)]
struct Document {
    // Required fields with tag IDs
    #[fory(id = 0)]
    title: String,

    #[fory(id = 1)]
    version: i32,

    // Optional field (nullable by default for Option)
    #[fory(id = 2)]
    description: Option<String>,

    // Reference-tracked shared pointer
    #[fory(id = 3)]
    parent: Rc<Document>,

    // Nullable + reference-tracked
    #[fory(id = 4, nullable)]
    related: Option<Rc<Document>>,

    // Counter with varint encoding (small values)
    #[fory(id = 5, encoding = varint)]
    view_count: u64,

    // Timestamp with fixed encoding (full range values)
    #[fory(id = 6, encoding = fixed)]
    created_at: i64,

    // Skip sensitive field
    #[fory(skip)]
    internal_state: String,
}

fn main() {
    let fory = fory::Fory::builder().xlang(false).build();

    let doc = Document {
        title: "My Document".to_string(),
        version: 1,
        description: Some("A sample document".to_string()),
        parent: Rc::new(Document::default()),
        related: None, // Allowed because nullable
        view_count: 42,
        created_at: 1704067200,
        internal_state: "secret".to_string(), // Will be skipped
    };

    let bytes = fory.serialize(&doc).unwrap();
    let decoded: Document = fory.deserialize(&bytes).unwrap();
}
```

## 编译期验证

无效配置会在编译期被发现：

```rust
// Error: duplicate field IDs
#[derive(ForyStruct)]
struct Bad {
    #[fory(id = 0)]
    field1: String,

    #[fory(id = 0)]  // Compile error: duplicate id
    field2: String,
}

// Error: invalid id value
#[derive(ForyStruct)]
struct Bad2 {
    #[fory(id = -1)]  // Compile error: id must be non-negative
    field: String,
}

// Error: invalid encoding for i32
#[derive(ForyStruct)]
struct Bad3 {
    #[fory(encoding = tagged)]  // Compile error: tagged is only valid for i64/u64
    field: i32,
}
```

## 跨语言兼容性

序列化要由其他语言（Java、C++、Go、Python）读取的数据时，请使用 Schema 元数据匹配编码预期：

```rust
#[derive(ForyStruct)]
struct CrossLangData {
    // Matches Java Integer with varint
    #[fory(id = 0, encoding = varint)]
    int_var: i32,

    // Matches Java Integer with fixed
    #[fory(id = 1, encoding = fixed)]
    int_fixed: i32,

    // Matches Java Long with tagged encoding
    #[fory(id = 2, encoding = tagged)]
    long_tagged: u64,

    // Nullable pointer matches Java nullable reference
    #[fory(id = 3, nullable)]
    optional: Option<String>,
}
```

## Schema 演进

兼容模式支持 Schema 演进。建议配置字段 ID 以降低序列化成本：

```rust
// Version 1
#[derive(ForyStruct)]
struct DataV1 {
    #[fory(id = 0)]
    id: i64,

    #[fory(id = 1)]
    name: String,
}

// Version 2: Added new field
#[derive(ForyStruct)]
struct DataV2 {
    #[fory(id = 0)]
    id: i64,

    #[fory(id = 1)]
    name: String,

    #[fory(id = 2)]
    email: Option<String>,  // New nullable field
}
```

使用 V1 序列化的数据可以用 V2 反序列化（新字段为 `None`）。

也可以省略字段 ID（元数据中会使用字段名称，开销更大）：

```rust
#[derive(ForyStruct)]
struct Data {
    id: i64,
    name: String,
}
```

## 默认值

- **可空性**：`Option<T>`、`RcWeak<T>` 和 `ArcWeak<T>` 默认可空；所有其他类型不可空
- **引用跟踪**：`Rc<T>`、`Arc<T>`、`RcWeak<T>` 和 `ArcWeak<T>` 默认启用引用跟踪；所有其他类型禁用

以下情况**需要配置字段**：

- 字段可以为 None（使用 `Option<T>`）
- 字段需要跟踪共享或循环对象引用（使用 `ref = true`）
- 整数类型为跨语言兼容性需要特定编码
- 希望减小元数据大小（使用字段 ID）

```rust
// Xlang mode: explicit configuration required
#[derive(ForyStruct)]
struct User {
    #[fory(id = 0)]
    name: String,                    // Non-nullable by default

    #[fory(id = 1)]
    email: Option<String>,           // Nullable (Option<T>)

    #[fory(id = 2, ref = true)]
    friend: Rc<User>,                // Ref tracking (default for Rc)
}
```

### 默认值摘要

| 类型                      | 默认可空 | 默认引用跟踪 |
| ------------------------- | -------- | ------------ |
| Primitives, `String`      | `false`  | `false`      |
| `Option<T>`               | `true`   | `false`      |
| `Rc<T>`, `Arc<T>`         | `false`  | `true`       |
| `RcWeak<T>`, `ArcWeak<T>` | `true`   | `true`       |

## 最佳实践

1. **配置字段 ID**：建议兼容模式使用，以降低序列化成本
2. **对敏感数据使用 `skip`**：密码、令牌、内部状态
3. **对共享对象启用引用跟踪**：同一指针多次出现时
4. **对唯一字段禁用引用跟踪**：确定字段唯一时用于优化
5. **选择合适的编码**：小值使用 `varint`，完整范围值使用 `fixed`
6. **保持 ID 稳定**：分配后不要更改字段 ID

## 选项参考

| 选项       | 语法                             | 说明                         | 适用于                     |
| ---------- | -------------------------------- | ---------------------------- | -------------------------- |
| `id`       | `id = N`                         | 用字段标签 ID 减小元数据体积 | 所有字段                   |
| `skip`     | `skip`                           | 从序列化中排除字段           | 所有字段                   |
| `nullable` | `nullable` 或 `nullable = bool`  | 控制 null 标志写入           | 所有字段                   |
| `ref`      | `ref` 或 `ref = bool`            | 控制引用跟踪                 | `Rc`、`Arc`、弱引用类型    |
| `encoding` | `encoding = varint/fixed/tagged` | 整数编码方式                 | `i32`、`u32`、`i64`、`u64` |
| `list`     | `list(element(...))`             | 元素 Schema 元数据           | list、set、array           |
| `map`      | `map(key(...), value(...))`      | key/value Schema 元数据      | `HashMap`、`BTreeMap`      |
| `tuple`    | `tuple(element(index = N, ...))` | tuple 位置 Schema 元数据     | tuple                      |
| `with`     | `with = Serializer`              | 选择字段序列化器             | 外部目标节点               |

## 相关主题

- [基本序列化](core-api.md) - 开始使用 Fory 序列化
- [Schema 演进](schema-evolution.md) - 兼容模式和 Schema 演进
- [跨语言序列化](xlang.md) - 与 Java、C++、Go、Python 互操作
- [外部类型序列化](external-types.md) - 为第三方字段选择序列化器
