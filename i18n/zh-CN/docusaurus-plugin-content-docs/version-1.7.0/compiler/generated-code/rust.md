---
title: Rust
sidebar_position: 4
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

## 输出布局

Rust 输出为每个 Schema 生成一个模块文件，例如：

- `<rust_out>/addressbook.rs`

使用 `--grpc` 且 Schema 包含服务时，Rust 还会生成：

- `<rust_out>/addressbook_service.rs`
- `<rust_out>/addressbook_service_grpc.rs`

## 类型生成

联合映射到带 `#[fory(id = ...)]` Schema case 属性的 Rust 枚举。
`#[fory(unknown)] Unknown(::fory::UnknownCase)` 标记 Fory 提供的向前兼容载体。该标记
只选择载体，不会向 Schema case 表添加条目；Schema case 仍使用完整的 `0..N` ID 范围。
生成的类型化联合必须至少包含一个非 `Unknown` case。编译器将第一个声明的非 `Unknown`
case 标记为 `#[fory(default)]`。当该 case 的载荷实现 Rust 标准 `Default` trait 时，编译器
还会从该 case 生成标准 `Default` 实现：

```rust
#[derive(::fory::ForyUnion, Clone, Debug, PartialEq, Eq, Hash)]
pub enum Animal {
    #[fory(unknown)]
    Unknown(::fory::UnknownCase),
    #[fory(id = 0, default)]
    Dog(self::Dog),
    #[fory(id = 1)]
    Cat(self::Cat),
}

impl ::std::default::Default for Animal {
    fn default() -> Self {
        Self::Dog(<self::Dog as ::std::default::Default>::default())
    }
}
```

如果所选载荷没有实现标准 `Default`，例如 `any` 载荷，则生成的联合没有不会失败的
`Default` 实现。此模型级默认值独立于 Fory 可失败的反序列化默认值；后者通过相应 codec
和当前读取上下文重建所选 case。

嵌套类型生成嵌套模块：

```rust
pub mod person {
    #[derive(ForyEnum, Debug, Clone, PartialEq, Default)]
    #[repr(i32)]
    pub enum PhoneType {
        #[default]
        Mobile = 0,
        Home = 1,
        Work = 2,
    }

    #[derive(ForyStruct, Debug, Clone, PartialEq, Default)]
    pub struct PhoneNumber {
        #[fory(id = 1)]
        pub number: String,
        #[fory(id = 2)]
        pub phone_type: PhoneType,
    }
}
```

消息派生 `ForyStruct`，并包含 `to_bytes`/`from_bytes` 辅助方法：

```rust
#[derive(ForyStruct, Debug, Clone, PartialEq, Default)]
pub struct Person {
    #[fory(id = 1)]
    pub name: String,
    #[fory(id = 7)]
    pub phones: Vec<person::PhoneNumber>,
    #[fory(id = 8)]
    pub pet: Animal,
}
```

## 注册

生成的注册函数：

```rust
pub fn register_types(fory: &mut Fory) -> Result<(), fory::Error> {
    fory.register_union::<Animal>(106)?;
    fory.register::<person::PhoneType>(101)?;
    fory.register::<person::PhoneNumber>(102)?;
    fory.register::<Person>(100)?;
    fory.register::<Dog>(104)?;
    fory.register::<Cat>(105)?;
    fory.register::<AddressBook>(103)?;
    Ok(())
}
```

对于没有显式 `[id=...]` 的 Schema，生成的注册代码使用计算得到的数字 ID：

```rust
fory.register::<Status>(1124725126)?;
fory.register_union::<Wrapper>(1471345060)?;
fory.register::<Envelope>(3022445236)?;
fory.register_union::<envelope::Detail>(1609214087)?;
fory.register::<envelope::Payload>(2862577837)?;
```

如果设置了 `option enable_auto_type_id = false;`：

```rust
fory.register_by_name::<Config>("myapp.models.Config")?;
fory.register_union_by_name::<Holder>("myapp.models.Holder")?;
```

## 使用方式

```rust
let person = Person {
    name: "Alice".into(),
    pet: Animal::Dog(self::Dog::default()),
    ..Default::default()
};

let bytes = person.to_bytes()?;
let restored = Person::from_bytes(&bytes)?;
```

## gRPC 服务配套代码

使用 `--grpc` 时，Rust 生成包含异步服务 trait 和路径常量的 `<module>_service.rs`，以及 `<module>_service_grpc.rs`；后者包含 tonic 客户端、服务端、codec 和 `ForyGrpcPayload` 实现，这些实现由模型的 `to_bytes` 和 `from_bytes` 辅助方法支持。依赖项和使用方式请参阅 [Rust gRPC](../../grpc/rust.md)。
