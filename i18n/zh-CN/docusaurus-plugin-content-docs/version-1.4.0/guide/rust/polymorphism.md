---
title: Trait 对象序列化
sidebar_position: 6
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

Apache Fory™ 通过 trait 对象支持多态序列化，实现动态分发和类型灵活性。

## 支持的 Trait 对象类型

- `Box<dyn Trait>` - 拥有所有权的 trait 对象
- `Rc<dyn Trait>` - 引用计数 trait 对象
- `Arc<dyn Trait>` - 线程安全引用计数 trait 对象
- `Vec<Box<dyn Trait>>`、`HashMap<K, Box<dyn Trait>>` - trait 对象集合

## 基础 Trait 对象序列化

```rust
use fory::{Fory, register_trait_type};
use fory::Serializer;
use fory::ForyObject;

trait Animal: Serializer {
    fn speak(&self) -> String;
    fn name(&self) -> &str;
}

#[derive(ForyObject)]
struct Dog { name: String, breed: String }

impl Animal for Dog {
    fn speak(&self) -> String { "Woof!".to_string() }
    fn name(&self) -> &str { &self.name }
}

#[derive(ForyObject)]
struct Cat { name: String, color: String }

impl Animal for Cat {
    fn speak(&self) -> String { "Meow!".to_string() }
    fn name(&self) -> &str { &self.name }
}

// 注册 trait 实现
register_trait_type!(Animal, Dog, Cat);

#[derive(ForyObject)]
struct Zoo {
    star_animal: Box<dyn Animal>,
}

let mut fory = Fory::default().compatible(true);
fory.register::<Dog>(100);
fory.register::<Cat>(101);
fory.register::<Zoo>(102);

let zoo = Zoo {
    star_animal: Box::new(Dog {
        name: "Buddy".to_string(),
        breed: "Labrador".to_string(),
    }),
};

let bytes = fory.serialize(&zoo);
let decoded: Zoo = fory.deserialize(&bytes)?;

assert_eq!(decoded.star_animal.name(), "Buddy");
assert_eq!(decoded.star_animal.speak(), "Woof!");
```

## 序列化 dyn Any Trait 对象

Apache Fory™ 支持序列化 `Rc<dyn Any>` 和 `Arc<dyn Any>` 以实现运行时类型分发：

**要点：**

- 适用于任何实现 `Serializer` 的类型
- 反序列化后需要向下转型以访问具体类型
- 序列化期间保留类型信息
- 对插件系统和动态类型处理很有用

```rust
use std::rc::Rc;
use std::any::Any;

let dog_rc: Rc<dyn Animal> = Rc::new(Dog {
    name: "Rex".to_string(),
    breed: "Golden".to_string()
});

// 转换为 Rc<dyn Any> 以进行序列化
let dog_any: Rc<dyn Any> = dog_rc.clone();

// 序列化 Any 包装器
let bytes = fory.serialize(&dog_any);
let decoded: Rc<dyn Any> = fory.deserialize(&bytes)?;

// 向下转型回具体类型
let unwrapped = decoded.downcast_ref::<Dog>().unwrap();
assert_eq!(unwrapped.name, "Rex");
```

对于线程安全场景，使用 `Arc<dyn Any>`：

```rust
use std::sync::Arc;
use std::any::Any;

let dog_arc: Arc<dyn Animal> = Arc::new(Dog {
    name: "Buddy".to_string(),
    breed: "Labrador".to_string()
});

// 转换为 Arc<dyn Any>
let dog_any: Arc<dyn Any> = dog_arc.clone();

let bytes = fory.serialize(&dog_any);
let decoded: Arc<dyn Any> = fory.deserialize(&bytes)?;

// 向下转型为具体类型
let unwrapped = decoded.downcast_ref::<Dog>().unwrap();
assert_eq!(unwrapped.name, "Buddy");
```

## 结构体中基于 Rc/Arc 的 Trait 对象

对于具有 `Rc<dyn Trait>` 或 `Arc<dyn Trait>` 的字段，Fory 自动处理转换：

```rust
use std::sync::Arc;
use std::rc::Rc;
use std::collections::HashMap;

#[derive(ForyObject)]
struct AnimalShelter {
    animals_rc: Vec<Rc<dyn Animal>>,
    animals_arc: Vec<Arc<dyn Animal>>,
    registry: HashMap<String, Arc<dyn Animal>>,
}

let mut fory = Fory::default().compatible(true);
fory.register::<Dog>(100);
fory.register::<Cat>(101);
fory.register::<AnimalShelter>(102);

let shelter = AnimalShelter {
    animals_rc: vec![
        Rc::new(Dog { name: "Rex".to_string(), breed: "Golden".to_string() }),
        Rc::new(Cat { name: "Mittens".to_string(), color: "Gray".to_string() }),
    ],
    animals_arc: vec![
        Arc::new(Dog { name: "Buddy".to_string(), breed: "Labrador".to_string() }),
    ],
    registry: HashMap::from([
        ("pet1".to_string(), Arc::new(Dog {
            name: "Max".to_string(),
            breed: "Shepherd".to_string()
        }) as Arc<dyn Animal>),
    ]),
};

let bytes = fory.serialize(&shelter);
let decoded: AnimalShelter = fory.deserialize(&bytes)?;

assert_eq!(decoded.animals_rc[0].name(), "Rex");
assert_eq!(decoded.animals_arc[0].speak(), "Woof!");
```

## 独立 Trait 对象序列化

由于 Rust 的孤儿规则，`Rc<dyn Trait>` 和 `Arc<dyn Trait>` 不能直接实现 `Serializer`。对于独立序列化（不在结构体字段内），`register_trait_type!` 宏生成包装类型。

**注意：** 如果不想使用包装类型，可以改为序列化为 `Rc<dyn Any>` 或 `Arc<dyn Any>`（参见上面的 dyn Any 部分）。

`register_trait_type!` 宏生成 `AnimalRc` 和 `AnimalArc` 包装类型：

```rust
// 对于 Rc<dyn Trait>
let dog_rc: Rc<dyn Animal> = Rc::new(Dog {
    name: "Rex".to_string(),
    breed: "Golden".to_string()
});
let wrapper = AnimalRc::from(dog_rc);

let bytes = fory.serialize(&wrapper);
let decoded: AnimalRc = fory.deserialize(&bytes)?;

// 解包回 Rc<dyn Animal>
let unwrapped: Rc<dyn Animal> = decoded.unwrap();
assert_eq!(unwrapped.name(), "Rex");

// 对于 Arc<dyn Trait>
let dog_arc: Arc<dyn Animal> = Arc::new(Dog {
    name: "Buddy".to_string(),
    breed: "Labrador".to_string()
});
let wrapper = AnimalArc::from(dog_arc);

let bytes = fory.serialize(&wrapper);
let decoded: AnimalArc = fory.deserialize(&bytes)?;

let unwrapped: Arc<dyn Animal> = decoded.unwrap();
assert_eq!(unwrapped.name(), "Buddy");
```

## 最佳实践

1. **使用 `register_trait_type!`** 注册所有 trait 实现
2. **启用 compatible 模式**：对 trait 对象使用 `.compatible(true)`
3. **注册所有具体类型**：在序列化之前
4. **优先使用 dyn Any**：对于更简单的独立序列化

## 相关主题

- [引用](references.md) - Rc/Arc 共享引用
- [Schema 演化](schema-evolution.md) - Compatible 模式
- [类型注册](type-registration.md) - 注册类型
