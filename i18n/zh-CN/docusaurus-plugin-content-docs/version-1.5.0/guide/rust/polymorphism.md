---
title: Trait 对象序列化
sidebar_position: 8
id: polymorphism
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

Apache Fory 通过已注册的应用程序 trait 和标准 `Any` trait 支持动态值。

## 应用程序 Trait

应用程序 trait 需要扩展 `ForyObject`。使用 `register_trait_type!` 列出该 trait 接受的每个具体目标：

```rust
use fory::{
    register_trait_type, Fory, ForyObject, ForyStruct,
};

trait Animal: ForyObject {
    fn name(&self) -> &str;
}

#[derive(ForyStruct)]
struct Dog {
    name: String,
}

impl Animal for Dog {
    fn name(&self) -> &str {
        &self.name
    }
}

#[derive(ForyStruct)]
struct Cat {
    name: String,
}

impl Animal for Cat {
    fn name(&self) -> &str {
        &self.name
    }
}

register_trait_type!(Animal, Dog, Cat);
```

具体类型列表包含运行时值类型。每个类型还必须在 `Fory` 实例中注册：

```rust
let mut fory = Fory::builder().xlang(false).build();
fory.register::<Dog>(100)?;
fory.register::<Cat>(101)?;
```

列表中的第三方目标可以通过外部结构化序列化器或自定义序列化器注册。该列表仍应填写目标类型，而不是序列化器类型。

默认情况下，生成的名称仅在宏所在的模块内可见。如果库需要导出生成的根序列化器，请添加普通 Rust 可见性：

```rust
register_trait_type!(pub Animal, Dog, Cat);
```

Trait 和列表中的类型必须至少与生成的序列化器具有相同的可见范围。也支持 `pub(crate)` 和受限可见性。

## Trait 对象字段

`Box<dyn Trait>` 和 `Rc<dyn Trait>` 可以直接用于派生字段和嵌套容器：

```rust
use std::collections::HashMap;
use std::rc::Rc;

#[derive(ForyStruct)]
struct Shelter {
    featured: Box<dyn Animal>,
    shared: Rc<dyn Animal>,
    animals: Vec<Box<dyn Animal>>,
    by_name: HashMap<String, Rc<dyn Animal>>,
}
```

Fory 会先检查封闭的具体类型列表，再具体化该值。不要在 trait 对象节点上添加 `#[fory(with = ...)]`；其具体序列化器会根据已注册目标动态选择。

对于 `Arc<dyn Trait>`，trait 必须是线程安全的，并且宏需要使用其 `sync` 形式：

```rust
use std::sync::Arc;

trait SharedAnimal: ForyObject + Send + Sync {
    fn name(&self) -> &str;
}

impl SharedAnimal for Dog {
    fn name(&self) -> &str {
        &self.name
    }
}

impl SharedAnimal for Cat {
    fn name(&self) -> &str {
        &self.name
    }
}

register_trait_type!(sync SharedAnimal, Dog, Cat);

#[derive(ForyStruct)]
struct SharedShelter {
    featured: Arc<dyn SharedAnimal>,
}
```

`sync` 声明中列出的每个目标都必须实现 `Send + Sync`。当库需要导出生成的根序列化器时，请使用 `register_trait_type!(pub sync SharedAnimal, Dog, Cat)`。

## Trait 对象根值

`Box<dyn Trait>` 可以直接作为普通根值：

```rust
let animal: Box<dyn Animal> = Box::new(Dog {
    name: "Rex".to_string(),
});

let bytes = fory.serialize(&animal)?;
let decoded: Box<dyn Animal> = fory.deserialize(&bytes)?;
assert_eq!(decoded.name(), "Rex");
```

由于 Rust 的 orphan rule，不能直接为 `Rc<dyn Trait>` 和 `Arc<dyn Trait>` 实现普通序列化器。宏会为这些根值生成序列化器类型：

```rust
let animal: Rc<dyn Animal> = Rc::new(Dog {
    name: "Milo".to_string(),
});

let bytes =
    fory.serialize_with::<AnimalRcSerializer>(&animal)?;
let decoded =
    fory.deserialize_with::<AnimalRcSerializer>(&bytes)?;
assert_eq!(decoded.name(), "Milo");
```

```rust
let animal: Arc<dyn SharedAnimal> = Arc::new(Dog {
    name: "Luna".to_string(),
});

let bytes =
    fory.serialize_with::<SharedAnimalArcSerializer>(&animal)?;
let decoded =
    fory.deserialize_with::<SharedAnimalArcSerializer>(&bytes)?;
assert_eq!(decoded.name(), "Luna");
```

这些 API 会直接序列化原始的 `Rc` 或 `Arc`，不会使用转换 wrapper。生成的序列化器类型不需要按 ID 或名称注册。

## 动态 `Any`

Fory 支持：

- `Box<dyn Any>`；
- `Rc<dyn Any>`；
- `Arc<dyn Any + Send + Sync>`。

具体目标必须先注册：

```rust
use std::any::Any;

let value: Rc<dyn Any> = Rc::new(Dog {
    name: "Rex".to_string(),
});

let bytes = fory.serialize(&value)?;
let decoded: Rc<dyn Any> = fory.deserialize(&bytes)?;
let dog = decoded.downcast_ref::<Dog>().unwrap();
assert_eq!(dog.name, "Rex");
```

当类型擦除后的值需要跨线程共享时，请使用 `Arc<dyn Any + Send + Sync>`：

```rust
let value: Arc<dyn Any + Send + Sync> = Arc::new(Dog {
    name: "Buddy".to_string(),
});

let bytes = fory.serialize(&value)?;
let decoded: Arc<dyn Any + Send + Sync> =
    fory.deserialize(&bytes)?;
let dog = decoded.downcast_ref::<Dog>().unwrap();
assert_eq!(dog.name, "Buddy");
```

如果目标满足 `Send + Sync`，派生序列化器就支持具体化同步的 `Arc`。需要支持该路径的自定义序列化器应实现 `read_arc_any`。

通用 `LIST`、`SET` 和 `MAP` 身份无法标识 `Any` 背后唯一且精确的 Rust 泛型目标。请将此类容器放入已注册的结构体中；如果有意使用不透明的 `EXT` 表示，也可以为整个容器注册目标类型完全匹配的自定义序列化器。

## 相关主题

- [外部类型序列化](external-types.md)
- [引用](references.md)
- [类型注册](type-registration.md)
