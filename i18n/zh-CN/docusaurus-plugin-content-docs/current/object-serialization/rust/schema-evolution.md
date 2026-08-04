---
title: Schema 演进
sidebar_position: 6
id: schema-evolution
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

Apache Fory™ 在**兼容模式**中支持 Schema 演进，允许序列化和反序列化对等端使用不同的类型定义。

## 兼容模式

兼容模式默认启用：

```rust
use fory::Fory;
use fory::ForyStruct;
use std::collections::HashMap;

#[derive(ForyStruct, Debug)]
struct PersonV1 {
    name: String,
    age: i32,
    address: String,
}

#[derive(ForyStruct, Debug)]
struct PersonV2 {
    name: String,
    age: i32,
    // address removed
    // phone added
    phone: Option<String>,
    metadata: HashMap<String, String>,
}

let mut fory1 = Fory::builder().xlang(false).build();
fory1.register::<PersonV1>(1)?;

let mut fory2 = Fory::builder().xlang(false).build();
fory2.register::<PersonV2>(1)?;

let person_v1 = PersonV1 {
    name: "Alice".to_string(),
    age: 30,
    address: "123 Main St".to_string(),
};

// Serialize with V1
let bytes = fory1.serialize(&person_v1)?;

// Deserialize with V2 - missing fields get default values
let person_v2: PersonV2 = fory2.deserialize(&bytes)?;
assert_eq!(person_v2.name, "Alice");
assert_eq!(person_v2.age, 30);
assert_eq!(person_v2.phone, None);
```

## Schema 演进功能

- 添加带默认值的新字段
- 删除过时字段（反序列化期间跳过）
- 更改字段可空性（`T` ↔ `Option<T>`）
- 重排字段（按名称而非位置匹配）
- 值可以在不损失精度或范围的情况下转换时，更改部分标量字段类型
- 对缺失字段以类型安全方式回退到默认值

当值可以无损转换时，兼容读取端可以处理部分标量字段类型变更。如果转换后的值具有相同逻辑值，匹配字段可以在 `bool`、`String`、数字标量和十进制字段之间读取。例如，`"true"` 和 `"false"` 可以读取为布尔值，`"123"` 可以读取为能够保存 `123` 的数值字段，数字和十进制可以读取为规范字符串；只有不丢失精度或范围时，数字扩宽或缩窄才会成功。数字字符串使用有限 ASCII 十进制语法。可选字段仍可与这些转换组合，但启用引用跟踪的标量类型变更不兼容。无效字符串和有损转换会在反序列化期间失败。

## 兼容性规则

- 字段名称必须匹配（区分大小写）
- 类型变更仅支持可空/不可空变更和部分无损标量转换
- 嵌套结构体类型必须在两端注册

## 相同 Schema 优化

只有每个载荷反序列化所用 Schema 始终与序列化时相同，并且希望获得更快序列化和更小体积时，才使用 `.compatible(false)`。对于跨语言载荷，只有确认每种语言都使用相同 Schema，或原生类型由 Fory Schema IDL 生成时才使用 `.compatible(false)`。

```rust
let mut fory = Fory::builder()
    .xlang(false)
    .compatible(false)
    .build();
```

对于单个结构体，可以使用 `#[fory(evolving = false)]` 退出演进元数据：

```rust
use fory::ForyStruct;

#[derive(ForyStruct)]
#[fory(evolving = false)]
struct SameSchemaMessage {
    id: i32,
}
```

## 外部类型

外部结构化序列化器是其目标的本地 Schema。兼容模式匹配其声明字段和变体的方式，与等价的本地派生类型完全相同：

```rust
#[derive(ForyStruct)]
#[fory(target = third_party::User)]
struct UserSerializer {
    name: String,
    age: u32,
}

let mut fory = Fory::builder().xlang(false).compatible(true).build();
fory.register::<UserSerializer>(100)?;

let decoded: third_party::User =
    fory.deserialize_with::<UserSerializer>(&bytes)?;
```

对等端必须为逻辑类型使用相同的数字 ID 或注册名称。添加或删除字段遵循常规兼容模式规则。自定义序列化器则拥有不透明 EXT 主体，因此其实现必须在该主体中自行定义版本控制。

## 枚举支持

Apache Fory™ 在兼容模式中支持三种具有完整 Schema 演进能力的枚举变体：

**变体类型：**

- **单元**：C 风格枚举（`Status::Active`）
- **未命名**：类似元组的变体（`Message::Pair(String, i32)`）
- **命名**：类似结构体的变体（`Event::Click { x: i32, y: i32 }`）

```rust
use fory::{Fory, ForyUnion};

#[derive(ForyUnion, Debug, PartialEq)]
enum Value {
    #[fory(default)]
    Null,
    Bool(bool),
    Number(f64),
    Text(String),
    Object { name: String, value: i32 },
}

let mut fory = Fory::builder().xlang(false).build();
fory.register::<Value>(1)?;

let value = Value::Object { name: "score".to_string(), value: 100 };
let bytes = fory.serialize(&value)?;
let decoded: Value = fory.deserialize(&bytes)?;
assert_eq!(value, decoded);
```

对于 case 为 unit 或单载荷变体的类型化 ADT union，如果需要保留未来的载荷变体，请添加 `#[fory(unknown)] Unknown(::fory::UnknownCase)` 变体。不要将未知变体设为默认值；应保留一个以 `#[fory(default)]` 标记的真实 Schema case。在反序列化需要保留的未知 case 之前，请先在本地注册未来的载荷类型。

`UnknownCase` 将其载荷存储为 `Arc<dyn Any + Send + Sync>`，因此需要保留的载荷类型必须满足 `Send + Sync`。通过结构化载体注册的直接泛型容器不支持作为擦除的 `Any` 载荷。请将容器包装在已注册的派生类型中；如果有意使用不透明的 EXT/NAMED_EXT 主体，也可以注册精确目标类型的自定义序列化器。

### 枚举 Schema 演进

兼容模式通过变体类型编码（2 位）实现稳健的 Schema 演进：

- `0b0` = Unit，`0b1` = 未具名，`0b10` = 具名

```rust
use fory::{Fory, ForyUnion};

// Old version
#[derive(ForyUnion)]
enum OldEvent {
    #[fory(default)]
    Click { x: i32, y: i32 },
    Scroll { delta: f64 },
}

// New version - added field and variant
#[derive(ForyUnion)]
enum NewEvent {
    #[fory(default)]
    Unknown,
    Click { x: i32, y: i32, timestamp: u64 },  // Added field
    Scroll { delta: f64 },
    KeyPress(String),  // New variant
}

let mut writer = Fory::builder().xlang(false).build();
writer.register::<OldEvent>(100)?;

let mut reader = Fory::builder().xlang(false).build();
reader.register::<NewEvent>(100)?;

// Serialize with old schema
let old_bytes = writer.serialize(&OldEvent::Click { x: 100, y: 200 })?;

// Deserialize with new schema - timestamp gets default value (0)
let new_event: NewEvent = reader.deserialize(&old_bytes)?;
assert!(matches!(new_event, NewEvent::Click { x: 100, y: 200, timestamp: 0 }));
```

**演进能力：**

- **未知变体** → 回退到默认变体
- **具名变体字段** → 添加或删除字段（缺失字段使用默认值）
- **未具名变体元素** → 添加或删除元素（跳过多余元素，缺失元素使用默认值）
- **变体类型不匹配** → 自动使用当前变体的默认值

**最佳实践：**

- 始终只使用 `#[fory(default)]` 标记一个 union 变体
- 具名变体比未具名变体具有更好的演进能力
- 跨版本通信使用兼容模式

## 元组支持

Apache Fory™ 开箱即用地支持最多 22 个元素的元组，并在兼容模式和相同 Schema 优化中提供高效序列化。

**功能：**

- 自动序列化包含 1 到 22 个元素的元组
- 支持异构类型（每个元素可以是不同类型）
- 兼容模式中的 Schema 演进（处理缺失或多余元素）

**Schema 模式：**

1. **相同 Schema 优化**：不使用集合头部，顺序序列化元素，以降低开销
2. **兼容模式**：使用带类型元数据的集合协议进行 Schema 演进

```rust
use fory::{Fory, Error};

let mut fory = Fory::builder().xlang(false).build();

// Tuple with heterogeneous types
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

- [配置](configuration.md) - 兼容模式设置
- [多态](polymorphism.md) - 支持 Schema 演进的特征对象
- [跨语言序列化](xlang.md) - 跨语言 Schema 演进
- [外部类型序列化](external-types.md) - 第三方值的兼容 Schema
