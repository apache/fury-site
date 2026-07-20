---
title: Schema 元数据
sidebar_position: 6
id: schema_metadata
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

本页说明如何在 Rust 中为序列化配置字段级元数据。

## 概览 {#overview}

Apache Fory™ 提供 `#[fory(...)]` 属性宏，用于在编译期指定可选的字段级元数据。它支持：

- **Tag ID**：分配紧凑的数字 ID，以减少结构体字段元信息的大小开销
- **可空性**：控制字段是否可以为 null
- **引用跟踪**：为共享所有权类型启用引用跟踪
- **跳过字段**：从序列化中排除字段
- **编码控制**：指定整数的编码方式（varint、fixed、tagged）

## 基本语法 {#basic-syntax}

`#[fory(...)]` 属性放在单个结构体字段上：

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

多个选项用逗号分隔。

## 可用选项 {#available-options}

### 字段 ID（`id = N`） {#field-id-id--n}

为字段分配数字 ID，以减少结构体字段元信息的大小开销：

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

**优点**：

- 序列化体积更小（元数据中使用数字 ID，而不是字段名）
- 允许重命名字段而不破坏二进制兼容性

**建议**：建议在兼容模式下配置字段 ID，因为这能降低序列化成本。

**说明**：

- ID 在同一结构体内必须唯一
- ID 必须是非负数
- 如果未指定，则在元数据中使用字段名（开销更大）

### 跳过字段（`skip`） {#skipping-fields-skip}

从序列化中排除字段：

```rust
#[derive(ForyStruct)]
struct User {
    #[fory(id = 0)]
    id: i64,

    #[fory(id = 1)]
    name: String,

    #[fory(skip)]
    password: String, // 不会被序列化
}
```

`password` 字段不会包含在序列化输出中，反序列化后会保持其默认值。

### 可空（`nullable`） {#nullable-nullable}

控制是否为字段写入 null 标志：

```rust
use fory::{Fory, RcWeak};

#[derive(ForyStruct)]
struct Record {
    // RcWeak 默认可空，这里覆盖为不可空
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

**说明**：

- 对 `Option<T>`、`RcWeak<T>`、`ArcWeak<T>`，可空性默认为 true
- 对所有其他类型，可空性默认为 false
- 对默认可空的类型，可使用 `nullable = false` 覆盖默认值

### 引用跟踪（`ref`） {#reference-tracking-ref}

控制共享所有权类型的逐字段引用跟踪：

```rust
use std::rc::Rc;
use std::sync::Arc;

#[derive(ForyStruct)]
struct Container {
    // 启用引用跟踪（Rc/Arc 默认启用）
    #[fory(id = 0, ref = true)]
    shared_data: Rc<Data>,

    // 禁用引用跟踪
    #[fory(id = 1, ref = false)]
    unique_data: Rc<Data>,
}
```

**默认行为**：

| 类型                              | 默认引用跟踪       |
| --------------------------------- | ------------------ |
| `Rc<T>`, `Arc<T>`                 | `true`             |
| `RcWeak<T>`, `ArcWeak<T>`         | `true`             |
| `Option<Rc<T>>`, `Option<Arc<T>>` | `true`（继承而来） |
| 所有其他类型                      | `false`            |

**使用场景**：

- 对可能存在循环或共享的字段启用
- 对始终唯一的字段禁用（优化）

### 编码（`encoding`） {#encoding-encoding}

控制整数字段的编码方式：

```rust
#[derive(ForyStruct)]
struct Metrics {
    // 变长编码（小值占用更少空间）
    #[fory(id = 0, encoding = varint)]
    count: i64,

    // 定长编码（大小固定）
    #[fory(id = 1, encoding = fixed)]
    timestamp: i64,

    // 带 tag 的编码（包含类型 tag，仅 u64）
    #[fory(id = 2, encoding = tagged)]
    value: u64,
}
```

**支持的编码**：

| 类型         | 选项                        | 默认值   |
| ------------ | --------------------------- | -------- |
| `i32`, `u32` | `varint`, `fixed`           | `varint` |
| `i64`, `u64` | `varint`, `fixed`, `tagged` | `varint` |

**何时使用**：

- `varint`：最适合通常较小的值（默认）
- `fixed`：最适合使用完整取值范围的值（例如时间戳、哈希）
- `tagged`：需要保留类型信息时使用（仅 u64）

### 嵌套集合配置 {#nested-collection-configuration}

当覆盖配置属于嵌套元素而不是外层字段时，使用 `list(element(...))` 和 `map(key(...), value(...))`：

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

`compress` 已被移除。请直接使用 `encoding = varint` 或 `encoding = fixed`。

## 类型分类 {#type-classification}

Fory 会对字段类型分类，以确定默认行为：

| 类型类别  | 示例                         | 默认可空 | 默认引用跟踪 |
| --------- | ---------------------------- | -------- | ------------ |
| Primitive | `i8`, `i32`, `f64`, `bool`   | `false`  | `false`      |
| Option    | `Option<T>`                  | `true`   | `false`      |
| Rc        | `Rc<T>`                      | `false`  | `true`       |
| Arc       | `Arc<T>`                     | `false`  | `true`       |
| RcWeak    | `RcWeak<T>`（fory 类型）     | `true`   | `true`       |
| ArcWeak   | `ArcWeak<T>`（fory 类型）    | `true`   | `true`       |
| Other     | `String`, `Vec<T>`, 用户类型 | `false`  | `false`      |

**特殊情况**：`Option<Rc<T>>` 和 `Option<Arc<T>>` 会继承内部类型的引用跟踪行为。

## 完整示例 {#complete-example}

```rust
use fory::ForyStruct;
use std::rc::Rc;

#[derive(ForyStruct, Default)]
struct Document {
    // 带 tag ID 的必需字段
    #[fory(id = 0)]
    title: String,

    #[fory(id = 1)]
    version: i32,

    // 可选字段（Option 默认可空）
    #[fory(id = 2)]
    description: Option<String>,

    // 启用引用跟踪的共享指针
    #[fory(id = 3)]
    parent: Rc<Document>,

    // 可空 + 引用跟踪
    #[fory(id = 4, nullable)]
    related: Option<Rc<Document>>,

    // 使用 varint 编码的计数器（小值）
    #[fory(id = 5, encoding = varint)]
    view_count: u64,

    // 使用 fixed 编码的时间戳（完整范围值）
    #[fory(id = 6, encoding = fixed)]
    created_at: i64,

    // 跳过敏感字段
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
        related: None, // 允许，因为可空
        view_count: 42,
        created_at: 1704067200,
        internal_state: "secret".to_string(), // 会被跳过
    };

    let bytes = fory.serialize(&doc).unwrap();
    let decoded: Document = fory.deserialize(&bytes).unwrap();
}
```

## 编译期校验 {#compile-time-validation}

无效配置会在编译期被捕获：

```rust
// 错误：重复的字段 ID
#[derive(ForyStruct)]
struct Bad {
    #[fory(id = 0)]
    field1: String,

    #[fory(id = 0)]  // 编译错误：重复 id
    field2: String,
}

// 错误：无效的 id 值
#[derive(ForyStruct)]
struct Bad2 {
    #[fory(id = -1)]  // 编译错误：id 必须是非负数
    field: String,
}

// 错误：i32 使用了无效编码
#[derive(ForyStruct)]
struct Bad3 {
    #[fory(encoding = tagged)]  // 编译错误：tagged 仅对 i64/u64 有效
    field: i32,
}
```

## 跨语言兼容性 {#cross-language-compatibility}

当序列化的数据需要由其他语言（Java、C++、Go、Python）读取时，请使用 schema 元数据匹配编码预期：

```rust
#[derive(ForyStruct)]
struct CrossLangData {
    // 匹配使用 varint 的 Java Integer
    #[fory(id = 0, encoding = varint)]
    int_var: i32,

    // 匹配使用 fixed 的 Java Integer
    #[fory(id = 1, encoding = fixed)]
    int_fixed: i32,

    // 匹配使用 tagged 编码的 Java Long
    #[fory(id = 2, encoding = tagged)]
    long_tagged: u64,

    // 可空指针匹配 Java 可空引用
    #[fory(id = 3, nullable)]
    optional: Option<String>,
}
```

## Schema 演进 {#schema-evolution}

兼容模式支持 Schema 演进。建议配置字段 ID，以降低序列化成本：

```rust
// 版本 1
#[derive(ForyStruct)]
struct DataV1 {
    #[fory(id = 0)]
    id: i64,

    #[fory(id = 1)]
    name: String,
}

// 版本 2：新增字段
#[derive(ForyStruct)]
struct DataV2 {
    #[fory(id = 0)]
    id: i64,

    #[fory(id = 1)]
    name: String,

    #[fory(id = 2)]
    email: Option<String>,  // 新的可空字段
}
```

用 V1 序列化的数据可以用 V2 反序列化（新字段将为 `None`）。

也可以省略字段 ID（元数据中会使用字段名，开销更大）：

```rust
#[derive(ForyStruct)]
struct Data {
    id: i64,
    name: String,
}
```

## 默认值 {#default-values}

- **可空性**：`Option<T>`、`RcWeak<T>` 和 `ArcWeak<T>` 默认可空；所有其他类型不可空
- **引用跟踪**：`Rc<T>`、`Arc<T>`、`RcWeak<T>` 和 `ArcWeak<T>` 默认启用引用跟踪；所有其他类型默认禁用

在以下情况下，你**需要配置字段**：

- 字段可以为 None（使用 `Option<T>`）
- 字段需要为共享/循环对象启用引用跟踪（使用 `ref = true`）
- 整数类型需要特定编码以实现跨语言兼容性
- 你想减少元数据大小（使用字段 ID）

```rust
// Xlang 模式：需要显式配置
#[derive(ForyStruct)]
struct User {
    #[fory(id = 0)]
    name: String,                    // 默认不可空

    #[fory(id = 1)]
    email: Option<String>,           // 可空（Option<T>）

    #[fory(id = 2, ref = true)]
    friend: Rc<User>,                // 引用跟踪（Rc 默认启用）
}
```

### 默认值摘要 {#default-values-summary}

| 类型                      | 默认可空 | 默认引用跟踪 |
| ------------------------- | -------- | ------------ |
| Primitives, `String`      | `false`  | `false`      |
| `Option<T>`               | `true`   | `false`      |
| `Rc<T>`, `Arc<T>`         | `false`  | `true`       |
| `RcWeak<T>`, `ArcWeak<T>` | `true`   | `true`       |

## 最佳实践 {#best-practices}

1. **配置字段 ID**：建议在兼容模式下使用，以降低序列化成本
2. **对敏感数据使用 `skip`**：密码、令牌、内部状态
3. **为共享对象启用引用跟踪**：当同一指针出现多次时
4. **为唯一字段禁用引用跟踪**：当你确定字段唯一时的优化
5. **选择合适的编码**：小值使用 `varint`，完整范围值使用 `fixed`
6. **保持 ID 稳定**：一旦分配，就不要更改字段 ID

## 选项参考 {#options-reference}

| Option     | 语法                             | 描述                           | 适用于                     |
| ---------- | -------------------------------- | ------------------------------ | -------------------------- |
| `id`       | `id = N`                         | 用于减少元数据大小的字段 tag ID | 所有字段                   |
| `skip`     | `skip`                           | 从序列化中排除字段             | 所有字段                   |
| `nullable` | `nullable` 或 `nullable = bool`  | 控制 null 标志写入             | 所有字段                   |
| `ref`      | `ref` 或 `ref = bool`            | 控制引用跟踪                   | `Rc`、`Arc`、weak 类型     |
| `encoding` | `encoding = varint/fixed/tagged` | 整数编码方法                   | `i32`、`u32`、`i64`、`u64` |
| `list`     | `list(element(...))`             | 元素 schema 元数据             | `Vec<T>`                   |
| `map`      | `map(key(...), value(...))`      | key/value schema 元数据        | `HashMap<K, V>`            |

## 相关主题 {#related-topics}

- [基本序列化](basic-serialization.md) - Fory 序列化入门
- [Schema 演进](schema-evolution.md) - 兼容模式与 Schema 演进
- [Xlang 序列化](xlang-serialization.md) - 与 Java、C++、Go、Python 互操作
