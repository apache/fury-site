---
title: 自定义序列化器
sidebar_position: 4
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

对于不支持 `#[derive(ForyObject)]` 的类型，可以手动实现 `Serializer` trait。

## 何时使用自定义序列化器

- 来自其他 crate 的外部类型
- 具有特殊序列化要求的类型
- 旧数据格式兼容性
- 性能关键的自定义编码

## 实现 Serializer Trait

```rust
use fory::{Fory, ReadContext, WriteContext, Serializer, ForyDefault, Error};
use std::any::Any;

#[derive(Debug, PartialEq)]
struct CustomType {
    value: i32,
    name: String,
}

impl Serializer for CustomType {
    fn fory_write_data(&self, context: &mut WriteContext, is_field: bool) {
        context.writer.write_i32(self.value);
        context.writer.write_varuint32(self.name.len() as u32);
        context.writer.write_utf8_string(&self.name);
    }

    fn fory_read_data(context: &mut ReadContext, is_field: bool) -> Result<Self, Error> {
        let value = context.reader.read_i32();
        let len = context.reader.read_varuint32() as usize;
        let name = context.reader.read_utf8_string(len);
        Ok(Self { value, name })
    }

    fn fory_type_id_dyn(&self, type_resolver: &TypeResolver) -> u32 {
        Self::fory_get_type_id(type_resolver)
    }

    fn as_any(&self) -> &dyn Any {
        self
    }
}

impl ForyDefault for CustomType {
    fn fory_default() -> Self {
        Self::default()
    }
}
```

## 注册自定义序列化器

```rust
let mut fory = Fory::default();
fory.register_serializer::<CustomType>(100);

let custom = CustomType {
    value: 42,
    name: "test".to_string(),
};
let bytes = fory.serialize(&custom);
let decoded: CustomType = fory.deserialize(&bytes)?;
assert_eq!(custom, decoded);
```

## WriteContext 和 ReadContext

`WriteContext` 和 `ReadContext` 提供对以下内容的访问：

- **writer/reader**：二进制缓冲区操作
- **type_resolver**：类型注册信息
- **ref_resolver**：引用跟踪（用于共享/循环引用）

### 常用 Writer 方法

```rust
// 原始类型
context.writer.write_i8(value);
context.writer.write_i16(value);
context.writer.write_i32(value);
context.writer.write_i64(value);
context.writer.write_f32(value);
context.writer.write_f64(value);
context.writer.write_bool(value);

// 变长整数
context.writer.write_varint32(value);
context.writer.write_varuint32(value);

// 字符串
context.writer.write_utf8_string(&string);
```

### 常用 Reader 方法

```rust
// 原始类型
let value = context.reader.read_i8();
let value = context.reader.read_i16();
let value = context.reader.read_i32();
let value = context.reader.read_i64();
let value = context.reader.read_f32();
let value = context.reader.read_f64();
let value = context.reader.read_bool();

// 变长整数
let value = context.reader.read_varint32();
let value = context.reader.read_varuint32();

// 字符串
let string = context.reader.read_utf8_string(len);
```

## 最佳实践

1. **使用变长编码**：对可能较小的整数使用变长编码
2. **首先写入长度**：对变长数据先写入长度
3. **正确处理错误**：在 read 方法中正确处理错误
4. **实现 ForyDefault**：以支持 schema 演化

## 相关主题

- [类型注册](type-registration.md) - 注册序列化器
- [基础序列化](basic-serialization.md) - 使用 ForyObject derive
- [Schema 演化](schema-evolution.md) - Compatible 模式
