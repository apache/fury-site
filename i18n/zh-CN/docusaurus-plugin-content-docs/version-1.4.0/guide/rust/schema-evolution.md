---
title: Schema 演化
sidebar_position: 7
id: schema_evolution
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

Apache Fory™ 在 **Compatible 模式**下支持 schema 演化，允许序列化和反序列化对等方具有不同的类型定义。

## Compatible 模式

使用 `compatible(true)` 启用 schema 演化：

```rust
use fory::Fory;
use fory::ForyObject;
use std::collections::HashMap;

#[derive(ForyObject, Debug)]
struct PersonV1 {
    name: String,
    age: i32,
    address: String,
}

#[derive(ForyObject, Debug)]
struct PersonV2 {
    name: String,
    age: i32,
    // address 已移除
    // phone 已添加
    phone: Option<String>,
    metadata: HashMap<String, String>,
}

let mut fory1 = Fory::default().compatible(true);
fory1.register::<PersonV1>(1);

let mut fory2 = Fory::default().compatible(true);
fory2.register::<PersonV2>(1);

let person_v1 = PersonV1 {
    name: "Alice".to_string(),
    age: 30,
    address: "123 Main St".to_string(),
};

// 使用 V1 序列化
let bytes = fory1.serialize(&person_v1);

// 使用 V2 反序列化 - 缺失的字段获得默认值
let person_v2: PersonV2 = fory2.deserialize(&bytes)?;
assert_eq!(person_v2.name, "Alice");
assert_eq!(person_v2.age, 30);
assert_eq!(person_v2.phone, None);
```

## Schema 演化功能

- 添加具有默认值的新字段
- 移除过时字段（在反序列化期间跳过）
- 更改字段可空性（`T` ↔ `Option<T>`）
- 重新排序字段（按名称匹配，而非位置）
- 对缺失字段的类型安全回退到默认值

## 兼容性规则

- 字段名称必须匹配（区分大小写）
- 不支持类型更改（可空/非可空除外）
- 嵌套结构体类型必须在两端都注册

## 枚举支持

Apache Fory™ 支持三种类型的枚举变体，在 Compatible 模式下具有完整的 schema 演化支持：

**变体类型：**

- **Unit**：C 风格枚举（`Status::Active`）
- **Unnamed**：元组风格变体（`Message::Pair(String, i32)`）
- **Named**：结构体风格变体（`Event::Click { x: i32, y: i32 }`）

```rust
use fory::{Fory, ForyObject};

#[derive(Default, ForyObject, Debug, PartialEq)]
enum Value {
    #[default]
    Null,
    Bool(bool),
    Number(f64),
    Text(String),
    Object { name: String, value: i32 },
}

let mut fory = Fory::default();
fory.register::<Value>(1)?;

let value = Value::Object { name: "score".to_string(), value: 100 };
let bytes = fory.serialize(&value)?;
let decoded: Value = fory.deserialize(&bytes)?;
assert_eq!(value, decoded);
```

### 枚举 Schema 演化

Compatible 模式通过变体类型编码（2 位）实现强大的 schema 演化：

- `0b0` = Unit，`0b1` = Unnamed，`0b10` = Named

```rust
use fory::{Fory, ForyObject};

// 旧版本
#[derive(ForyObject)]
enum OldEvent {
    Click { x: i32, y: i32 },
    Scroll { delta: f64 },
}

// 新版本 - 添加了字段和变体
#[derive(Default, ForyObject)]
enum NewEvent {
    #[default]
    Unknown,
    Click { x: i32, y: i32, timestamp: u64 },  // 添加了字段
    Scroll { delta: f64 },
    KeyPress(String),  // 新变体
}

let mut fory = Fory::builder().compatible().build();

// 使用旧 schema 序列化
let old_bytes = fory.serialize(&OldEvent::Click { x: 100, y: 200 })?;

// 使用新 schema 反序列化 - timestamp 获得默认值 (0)
let new_event: NewEvent = fory.deserialize(&old_bytes)?;
assert!(matches!(new_event, NewEvent::Click { x: 100, y: 200, timestamp: 0 }));
```

**演化能力：**

- **未知变体** → 回退到默认变体
- **Named 变体字段** → 添加/移除字段（缺失字段使用默认值）
- **Unnamed 变体元素** → 添加/移除元素（额外的跳过，缺失的使用默认值）
- **变体类型不匹配** → 自动使用当前变体的默认值

**最佳实践：**

- 始终使用 `#[default]` 标记默认变体
- Named 变体比 unnamed 变体提供更好的演化能力
- 对跨版本通信使用 compatible 模式

## 元组支持

Apache Fory™ 在兼容和非兼容模式下均支持最多 22 个元素的元组，并具有高效的序列化。

**功能：**

- 对 1 到 22 个元素的元组自动序列化
- 异构类型支持（每个元素可以是不同的类型）
- Compatible 模式下的 schema 演化（处理缺失/额外元素）

**序列化模式：**

1. **非兼容模式**：按顺序序列化元素，不使用集合头部，以实现最小开销
2. **Compatible 模式**：使用带有类型元数据的集合协议以支持 schema 演化

```rust
use fory::{Fory, Error};

let mut fory = Fory::default();

// 具有异构类型的元组
let data: (i32, String, bool, Vec<i32>) = (
    42,
    "hello".to_string(),
    true,
    vec![1, 2, 3],
);

let bytes = fory.serialize(&data)?;
let decoded: (i32, String, bool, Vec<i32>) = fory.deserialize(&bytes)?;
assert_eq!(data, decoded);
```

## 相关主题

- [配置](configuration.md) - 启用 compatible 模式
- [多态](polymorphism.md) - 具有 schema 演化的 Trait 对象
- [跨语言](xlang-serialization.md) - 跨语言的 schema 演化
