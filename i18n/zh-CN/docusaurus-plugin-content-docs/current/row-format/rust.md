---
title: Rust 标准行格式
sidebar_position: 6
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

Apache Fory™ Rust 实现了 Java、C++ 和 Python 使用的标准行格式。它提供零拷贝的借用视图和随机字段访问，无需重建完整值。

## 概述

当读取方只需要选定字段或集合元素，而不需要完整值的所有权副本时，请使用行格式。视图会借用输入字节，因此在使用视图期间，这些字节必须保持有效。

行格式由 Schema 驱动：传给 `from_row` 的 Rust 类型决定字段类型和声明顺序。跨语言读取方和写入方必须使用相同的 Schema。

## 何时使用行格式

- 需要选择性访问字段的分析工作负载
- 只需要部分字段的大型数据集
- 内存受限的环境
- 高吞吐量数据流水线
- 与 Java、C++ 或 Python 共享标准行格式字节

## 基本用法

```rust
use fory::{from_row, to_row, Error, ForyRow, RowView};
use std::collections::BTreeMap;

#[derive(ForyRow)]
struct UserProfile {
    id: i64,
    username: String,
    email: Option<String>,
    scores: Vec<i32>,
    preferences: BTreeMap<String, String>,
    is_active: bool,
}

fn main() -> Result<(), Error> {
    let profile = UserProfile {
        id: 12345,
        username: "alice".to_string(),
        email: Some("alice@example.com".to_string()),
        scores: vec![95, 87, 92, 88],
        preferences: BTreeMap::from([
            ("theme".to_string(), "dark".to_string()),
            ("language".to_string(), "en".to_string()),
        ]),
        is_active: true,
    };

    let row_data = to_row(&profile)?;
    let row = from_row::<UserProfile>(&row_data)?;

    // Field methods return Result and validate the referenced bytes.
    assert_eq!(row.id()?, 12345);
    assert_eq!(row.username()?, "alice");
    assert_eq!(row.email()?, Some("alice@example.com"));
    assert!(row.is_active()?);

    let scores = row.scores()?;
    assert_eq!(scores.len(), 4);
    assert_eq!(scores.get(0)?, 95);
    assert_eq!(scores.get(1)?, 87);
    assert_eq!(
        scores.iter().collect::<Result<Vec<_>, _>>()?,
        [95, 87, 92, 88]
    );

    let preferences = row.preferences()?;
    assert_eq!(preferences.len(), 2);
    assert_eq!(preferences.key(0)?, "language");
    assert_eq!(preferences.value(0)?, "en");
    assert_eq!(row.as_bytes(), row_data);
    Ok(())
}
```

`to_row` 接受行格式的根值：派生结构体、受支持的数组和 `BTreeMap` 值。标量、字符串、二进制数据和 `Option<T>` 值只能作为字段值或元素值，而不能作为独立的根值。

## 视图遍历与缓冲区复用

`ArrayView::iter` 和 `IntoIterator for &ArrayView` 会按需读取元素，并使用与 `get` 相同的校验路径。每一项都是一个 `Result`，因此访问相应元素时会报告格式错误的数据。

`MapView` 提供 `len`、`is_empty`、`key(index)` 和 `value(index)`。它的 `keys()` 和 `values()` 数组视图仍可用于独立迭代。只有当具有所有权的查找结构比按索引访问更有用时，才调用 `to_btree_map()`；它会根据借用的键视图和值视图实体化 map。

结构体、数组和 map 视图都是可低成本执行 `Copy` 和 `Clone` 的值。`RowView` trait 提供 `as_bytes()`，用于返回与视图绑定的确切编码切片；还提供 `encoded_len()`，用于返回其长度。嵌套视图只返回自身以大小分隔的子级字节。

使用 `to_row_into` 可以替换调用方所有的缓冲区，同时保留其容量：

```rust
use fory::to_row_into;

let mut row_data = Vec::with_capacity(4096);
to_row_into(&vec![1i32, 2, 3], &mut row_data).unwrap();
```

重复调用会丢弃先前的逻辑内容。如果编码返回错误，缓冲区将保持为空。行的组帧仍由应用程序负责。

## 可空性与字段顺序

`Option<T>` 声明可空字段或数组元素。`None` 会设置相应的空值位，字段方法无需读取值体便会返回 `None`。`Some(value)` 使用与 `T` 相同的定长槽位宽度。

`#[derive(ForyRow)]` 支持命名结构体，包括泛型结构体。字段按源代码中的声明顺序编码。该派生宏会生成借用的 `StructNameRowView` 类型，其可见性与源结构体一致。生成的每个字段方法都会保留相应字段的可见性，并返回 `Result<_, Error>`。

更改字段顺序或字段类型会改变行格式 Schema。请在所有生产方和消费方之间协调此类更改。

## 支持的类型

| Rust 类型                               | 标准行格式编码                 |
| --------------------------------------- | ------------------------------ |
| `bool`、`i8`、`i16`、`i32`、`i64`       | 定长标量                       |
| `f32`、`f64`                            | 定长 IEEE 754 标量             |
| `Date`                                  | 以 epoch 天数表示的定长 date32 |
| `Timestamp`                             | 定长 epoch 微秒数              |
| `Duration`                              | 定长微秒数                     |
| `String`、`&str`                        | 变长 UTF-8                     |
| `Vec<u8>`、`&[u8]`                      | 变长二进制数据                 |
| 支持的元素类型对应的 `Vec<T>`、`[T; N]` | 标准数组                       |
| `BTreeMap<K, V>`                        | 标准 map                       |
| 带有 `#[derive(ForyRow)]` 的命名结构体  | 嵌套标准行                     |
| `Option<T>`                             | 可空字段或数组元素             |

不支持 `Float16` 和 `Decimal`，因为标准行格式规范没有为它们定义完整且可互操作的编码。

定长数组要求编码的元素数等于 `N`。`BTreeMap` 的键必须实现 `Ord`；map 值无需实现 `Ord`。

`Vec<u8>` 会编码为二进制数据，而不是标准数组。当需要数组表示形式时，请使用其他受支持的元素类型。

## 标准二进制布局

- 行以按 8 字节对齐的空值位图开始，随后每个字段占用一个 8 字节槽位。
- 定长值以小端序存储在其槽位的低地址处。槽位中未使用的字节为零。
- 变长槽位是小端序 `u64` 值 `(relative_offset << 32) | size`。值体及其零填充位于固定区域之后。
- 数组以 `u64` 元素数和按 8 字节对齐的空值位图开始。定长元素使用连续的自然宽度槽位；变长元素使用 8 字节的偏移量-大小槽位。
- map 包含键数组的字节大小，随后是完整的键数组和值数组。嵌套结构体、数组和 map 都是完整的子结构。
- 变长值体和数组槽位区域使用零填充至 8 字节边界。偏移量相对于直接包含它们的行或数组。

有关规范性布局和大小公式，请参阅[行格式规范](../specification/row_format_spec.md)。

## 校验与错误

`from_row`、生成的字段方法、数组 `get`/迭代和 map 索引访问都会返回 `Result`。它们会拒绝截断的固定区域、无效的数量、超出范围的偏移量和大小、无效的 UTF-8、定长数组长度不匹配，以及 map 的键数和值数不匹配。

数组访问也会进行边界检查：

```rust
let scores = row.scores()?;
assert!(scores.get(scores.len()).is_err());
```

## 性能对比

| 操作         | 对象格式                 | 行格式                    |
| ------------ | ------------------------ | ------------------------- |
| 打开编码数据 | 重建具有所有权的值       | 创建借用视图              |
| 读取一个字段 | 访问重建后的对象         | 直接校验并读取字段        |
| 访问集合     | 使用具有所有权的集合     | 使用借用的数组或 map 视图 |
| 适用场景     | 使用完整对象和对象图语义 | 选择性访问和跨语言行      |

## ForyRow 与 ForyStruct 对比

| 特性        | `#[derive(ForyRow)]`     | `#[derive(ForyStruct)]` |
| ----------- | ------------------------ | ----------------------- |
| 读取结果    | 借用视图                 | 具有所有权的 Rust 值    |
| 字段访问    | 返回 `Result` 的字段方法 | 普通结构体访问          |
| Schema 顺序 | 源代码声明顺序           | 对象格式 Schema 规则    |
| 最适合      | 选择性访问标准行字节     | 通用对象序列化          |

## 相关主题

- [基本序列化](../object-serialization/rust/core-api.md) - 对象图序列化
- [标准行格式](index.md#standard-row) - Java、Python、C++ 和 Rust 的共享布局
- [行格式规范](../specification/row_format_spec.md) - 协议详情
