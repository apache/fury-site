---
title: 自定义序列化器
sidebar_position: 11
id: custom-serializers
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

当派生无法表达类型的序列化表示，或有意使用不透明编码时，请使用自定义序列化器。序列化器是类型级实现，并通过 `Target` 指定其处理的值。

对于 Schema 应保持结构化的公共第三方结构体或枚举，优先使用[外部类型序列化](external-types.md)。

## 实现自定义序列化器

此示例使用本地类型作为其自身的序列化器：

```rust
use fory::{Error, Fory, ReadContext, Serializer, WriteContext};

#[derive(Debug, PartialEq)]
struct Point {
    value: i32,
}

impl Serializer for Point {
    type Target = Self;

    fn write_data(value: &Self, context: &mut WriteContext) -> Result<(), Error> {
        context.writer.write_i32(value.value);
        Ok(())
    }

    fn read_data(context: &mut ReadContext) -> Result<Self, Error> {
        Ok(Self {
            value: context.reader.read_i32()?,
        })
    }

    fn default_value(_context: &mut ReadContext) -> Result<Self, Error> {
        Ok(Self { value: 0 })
    }
}

let mut fory = Fory::builder().xlang(false).build();
fory.register_serializer::<Point>(100)?;

let value = Point { value: 42 };
let bytes = fory.serialize(&value)?;
let decoded: Point = fory.deserialize(&bytes)?;
assert_eq!(decoded, value);
# Ok::<(), Error>(())
```

`write_data` 和 `read_data` 处理 EXT 主体。Fory 的完整值 `write` 和 `read` 操作提供根或字段引用以及类型信息帧。

`default_value` 是可选的。只有可空或缺失的兼容字段存在有意义的值时才实现它。该方法接收活动 `ReadContext`，因此会分配的默认值可以应用与普通读取相同的反序列化限制。

## 序列化第三方不透明类型

独立序列化器可以面向另一个 crate 中的类型：

```rust
use fory::{Error, ReadContext, Serializer, WriteContext};

struct UuidSerializer;

#[cold]
#[inline(never)]
fn invalid_uuid(error: uuid::Error) -> Error {
    Error::invalid_data(error.to_string())
}

impl Serializer for UuidSerializer {
    type Target = uuid::Uuid;

    fn write_data(
        value: &uuid::Uuid,
        context: &mut WriteContext,
    ) -> Result<(), Error> {
        context.writer.write_bytes(value.as_bytes());
        Ok(())
    }

    fn read_data(context: &mut ReadContext) -> Result<uuid::Uuid, Error> {
        let bytes = context.reader.read_bytes(16)?;
        uuid::Uuid::from_slice(bytes).map_err(invalid_uuid)
    }
}
```

注册序列化器，然后在根或字段上选择它：

```rust
fory.register_serializer::<UuidSerializer>(101)?;

let bytes = fory.serialize_with::<UuidSerializer>(&uuid)?;
let decoded =
    fory.deserialize_with::<UuidSerializer>(&bytes)?;
```

```rust
#[derive(ForyStruct)]
struct Request {
    #[fory(with = UuidSerializer)]
    id: uuid::Uuid,
}
```

自定义序列化器主体是不透明的。兼容模式不会映射其中的字段。

## 支持 `Arc<dyn Any + Send + Sync>`

如果自定义序列化器的目标必须实例化在 `Arc<dyn Any + Send + Sync>` 或同步应用特征后面，请实现 `read_arc_any`：

```rust
use std::any::Any;
use std::sync::Arc;

impl Serializer for Point {
    type Target = Self;

    // Implement write_data, read_data, and any desired default as above.

    fn read_arc_any(
        context: &mut ReadContext,
    ) -> Result<Arc<dyn Any + Send + Sync>, Error> {
        Ok(Arc::new(Self::read_data(context)?))
    }
}
```

目标必须实现 `Send + Sync`。如果省略此方法，类型化、`Box` 和 `Rc` 操作仍可用，但同步 `Arc` 实例化会返回错误。

## 按名称注册

序列化标识是限定名称时，请使用名称注册：

```rust
fory.register_serializer_by_name::<UuidSerializer>(
    "example.Uuid",
)?;
```

一个 `Fory` 实例最多只能为一个目标注册一个序列化器。

## 上下文访问

`WriteContext` 和 `ReadContext` 公开二进制写入器和读取器：

```rust
context.writer.write_i8(value);
context.writer.write_i32(value);
context.writer.write_var_u32(value);
context.writer.write_f64(value);

let value = context.reader.read_i8()?;
let value = context.reader.read_i32()?;
let value = context.reader.read_var_u32()?;
let value = context.reader.read_f64()?;
```

对于可变大小主体，请在根据编码长度分配前验证可读字节和对象图内存限制。

自定义序列化器作为可变大小载体的子节点时，载体必须在计数后为每个声明元素或映射条目至少生成一个聚合字节。如果载体的完整头部、元数据、帧和子主体短于该计数，Fory 会拒绝序列化，因此绝不会生成配对分配安全检查无法读取的字节。定长数组不受此限制，因为已验证的计数不控制分配；`Vec`、`VecDeque` 和 `BinaryHeap` 中的零大小元素也不受限制，因为这些载体不会为其分配后备存储。

## 相关主题

- [外部类型序列化](external-types.md)
- [类型注册](type-registration.md)
- [Schema 演进](schema-evolution.md)
