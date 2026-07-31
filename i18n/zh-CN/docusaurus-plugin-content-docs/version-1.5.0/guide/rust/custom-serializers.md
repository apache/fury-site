---
title: 自定义序列化器
sidebar_position: 10
id: custom_serializers
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

当派生宏无法表达类型的序列化表示，或者需要特意使用不透明编码时，请使用自定义序列化器。序列化器是一种类型级实现，通过 `Target` 指定其处理的值类型。

对于需要保持结构化 Schema 的公开第三方结构体或枚举，优先使用[外部类型序列化](external-types.md)。

## 实现自定义序列化器

以下示例使用本地类型自身作为序列化器：

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

`write_data` 和 `read_data` 处理 EXT 主体。Fory 的完整值 `write` 和 `read` 操作会为根值或字段补充引用帧和类型信息帧。

`default_value` 是可选的。仅当兼容字段为空或缺失时存在有意义的取值，才实现此方法。它会接收当前的 `ReadContext`，因此需要分配内存的默认值可以应用与普通读取相同的反序列化限制。

## 序列化第三方不透明类型

可以用独立的序列化器处理其他 crate 中的类型：

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

注册序列化器，然后在根值或字段上选择使用它：

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

自定义序列化器的主体是不透明的。兼容模式不会映射其中的字段。

## 支持 `Arc<dyn Any + Send + Sync>`

如果必须将自定义序列化器的目标具体化为 `Arc<dyn Any + Send + Sync>`，或具体化为某种同步的应用程序 trait，请实现 `read_arc_any`：

```rust
use std::any::Any;
use std::sync::Arc;

impl Serializer for Point {
    type Target = Self;

    // 按照上面的方式实现 write_data、read_data 和所需的默认值。

    fn read_arc_any(
        context: &mut ReadContext,
    ) -> Result<Arc<dyn Any + Send + Sync>, Error> {
        Ok(Arc::new(Self::read_data(context)?))
    }
}
```

目标必须实现 `Send + Sync`。如果省略此方法，带具体类型的操作以及 `Box`、`Rc` 操作仍然可用，而将值具体化为同步 `Arc` 时会返回错误。

## 按名称注册

当序列化后的标识是限定名称时，请使用名称注册：

```rust
fory.register_serializer_by_name::<UuidSerializer>(
    "example.Uuid",
)?;
```

对于同一个目标，一个 `Fory` 实例最多只能注册一个序列化器。

## 上下文访问

`WriteContext` 和 `ReadContext` 会公开二进制 writer 和 reader：

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

对于大小可变的主体，请先验证可读字节数和对象图内存限制，再根据编码后的长度分配内存。

当自定义序列化器被用作大小可变容器的子项时，容器必须在元素数或映射条目数之后，按总量计算为每个已声明的元素或映射条目至少写入一个字节。如果容器的完整头部、元数据、帧和子项主体的总长度小于该计数，Fory 会拒绝序列化，从而绝不会写出与之配对的分配安全检查无法读取的字节。定长数组不受此限制，因为其经过验证的计数不控制内存分配；`Vec`、`VecDeque` 和 `BinaryHeap` 中的零大小元素也不受此限制，因为这些容器不会为它们分配后备存储空间。

## 相关主题

- [外部类型序列化](external-types.md)
- [类型注册](type-registration.md)
- [Schema 演进](schema-evolution.md)
