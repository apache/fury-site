---
title: Schema 演进
sidebar_position: 9
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

Apache Fory™ 在**兼容模式**下支持 Schema 演进，允许序列化和反序列化通信双方使用不同的类型定义。

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
    // 移除了 address
    // 添加了 phone
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

// 使用 V1 序列化
let bytes = fory1.serialize(&person_v1)?;

// 使用 V2 反序列化——缺失字段使用默认值
let person_v2: PersonV2 = fory2.deserialize(&bytes)?;
assert_eq!(person_v2.name, "Alice");
assert_eq!(person_v2.age, 30);
assert_eq!(person_v2.phone, None);
```

## Schema 演进能力

- 添加具有默认值的新字段
- 移除过时字段（反序列化期间跳过）
- 更改字段可空性（`T` ↔ `Option<T>`）
- 重排字段（按名称匹配，而非位置）
- 当转换不会丢失精度或超出范围时，更改部分标量字段的类型
- 缺失字段以类型安全的方式回退到默认值

当值可以无损转换时，兼容模式读取端能够处理部分标量字段类型的变更。只要转换后的值在逻辑上保持相同，匹配字段就可以在 `bool`、`String`、数值标量和 decimal 字段之间读取。例如，`"true"` 和 `"false"` 可以读取为布尔值，`"123"` 可以读取为能够容纳 `123` 的数值字段，数值和 decimal 值可以读取为规范字符串，而数值扩宽或缩窄转换只有在不损失精度且不超出范围时才会成功。数值字符串使用有限的 ASCII 十进制语法。可选字段同样可以与这些转换组合使用，但带引用跟踪的标量类型变更不兼容。无效字符串和有损转换会在反序列化期间失败。

## 兼容性规则

- 字段名称必须匹配（区分大小写）
- 仅支持可空/不可空变更和部分无损标量转换这两类类型变更
- 嵌套结构体类型必须在通信双方注册

## 同 Schema 优化

只有当每个载荷反序列化时使用的 Schema 始终与其序列化时使用的 Schema 相同，且需要更快的序列化速度和更小的数据体积时，才应使用 `.compatible(false)`。对于 xlang 载荷，只有在确认每种语言都使用相同的 Schema，或者 native 类型由 Fory Schema IDL 生成时，才应使用 `.compatible(false)`。

```rust
let mut fory = Fory::builder()
    .xlang(false)
    .compatible(false)
    .build();
```

可以通过 `#[fory(evolving = false)]` 让单个结构体不写入演进元数据：

```rust
use fory::ForyStruct;

#[derive(ForyStruct)]
#[fory(evolving = false)]
struct SameSchemaMessage {
    id: i32,
}
```

## 外部类型

外部结构化序列化器就是其目标类型的本地 Schema。兼容模式会匹配其中声明的字段和变体，行为与匹配等价的本地派生类型完全相同：

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

通信双方必须为同一个逻辑类型使用相同的数字 ID 或注册名称。字段的添加和删除遵循普通兼容模式规则。自定义序列化器拥有不透明的 `EXT` 主体，因此其实现必须自行定义该主体内部的版本控制方式。

## 枚举支持

Apache Fory™ 支持三种枚举变体，并在兼容模式下提供完整的 Schema 演进能力：

**变体类型：**

- **Unit**：C 风格枚举（`Status::Active`）
- **Unnamed**：类似 tuple 的变体（`Message::Pair(String, i32)`）
- **Named**：类似 struct 的变体（`Event::Click { x: i32, y: i32 }`）

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

对于 case 为 unit 或单一载荷变体的带类型代数数据类型（ADT）联合类型，如果需要保留未来版本中的载荷变体，请添加 `#[fory(unknown)] Unknown(::fory::UnknownCase)` 变体。不要将 unknown 变体设为默认变体；应保留一个使用 `#[fory(default)]` 标记的实际 Schema case。在反序列化需要保留的未知 case 之前，先在本地注册未来的载荷类型。

`UnknownCase` 将载荷存储为 `Arc<dyn Any + Send + Sync>`，因此保留的载荷类型必须满足 `Send + Sync`。通用容器不能通过其结构化承载注册直接用作类型擦除的 `Any` 载荷。请将容器包装在已注册的派生类型中；如果有意使用不透明的 `EXT`/`NAMED_EXT` 主体，也可以注册目标类型完全匹配的自定义序列化器。

### 枚举 Schema 演进

兼容模式通过变体类型编码（2 bit）提供可靠的 Schema 演进：

- `0b0` = Unit，`0b1` = Unnamed，`0b10` = Named

```rust
use fory::{Fory, ForyUnion};

// 旧版本
#[derive(ForyUnion)]
enum OldEvent {
    #[fory(default)]
    Click { x: i32, y: i32 },
    Scroll { delta: f64 },
}

// 新版本——添加了字段和变体
#[derive(ForyUnion)]
enum NewEvent {
    #[fory(default)]
    Unknown,
    Click { x: i32, y: i32, timestamp: u64 },  // 新增字段
    Scroll { delta: f64 },
    KeyPress(String),  // 新增变体
}

let mut writer = Fory::builder().xlang(false).build();
writer.register::<OldEvent>(100)?;

let mut reader = Fory::builder().xlang(false).build();
reader.register::<NewEvent>(100)?;

// 使用旧 Schema 序列化
let old_bytes = writer.serialize(&OldEvent::Click { x: 100, y: 200 })?;

// 使用新 Schema 反序列化——timestamp 使用默认值 0
let new_event: NewEvent = reader.deserialize(&old_bytes)?;
assert!(matches!(new_event, NewEvent::Click { x: 100, y: 200, timestamp: 0 }));
```

**演进能力：**

- **未知变体** → 回退到默认变体
- **Named 变体字段** → 添加/移除字段（缺失字段使用默认值）
- **Unnamed 变体元素** → 添加/移除元素（跳过多余元素，缺失元素使用默认值）
- **变体类型不匹配** → 自动使用当前变体的默认值

**最佳实践：**

- 始终用 `#[fory(default)]` 标记且仅标记一个联合类型变体
- Named 变体比 unnamed 变体提供更好的演进能力
- 跨版本通信应使用兼容模式

## Tuple 支持

Apache Fory™ 原生支持最多包含 22 个元素的 tuple，并在兼容模式和同 Schema 优化下提供高效序列化。

**功能：**

- 自动序列化包含 1 到 22 个元素的 tuple
- 支持异构类型（每个元素可以是不同类型）
- 兼容模式下支持 Schema 演进（处理缺失/额外元素）

**Schema 模式：**

1. **同 Schema 优化**：按顺序序列化元素，不写入集合头部，以实现最小开销
2. **兼容模式**：使用带类型元信息的集合协议来支持 Schema 演进

```rust
use fory::{Fory, Error};

let mut fory = Fory::builder().xlang(false).build();

// 包含异构类型的 tuple
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
- [多态](polymorphism.md) - 支持 Schema 演进的 trait 对象
- [Xlang 序列化](xlang-serialization.md) - 跨语言 Schema 演进
- [外部类型序列化](external-types.md) - 第三方值的兼容 Schema
