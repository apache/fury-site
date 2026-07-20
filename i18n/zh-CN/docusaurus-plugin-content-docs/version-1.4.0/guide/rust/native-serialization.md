---
title: Native 序列化
sidebar_position: 3
id: native_serialization
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

Rust native 序列化是通过 `.xlang(false)` 选择的 Rust 专用编码模式。当所有写入端和读取端都是 Rust，
并且载荷需要保留 Rust 对象图行为而不是可移植的 xlang 类型系统时，请使用该模式。

当字节必须由 Java、Python、C++、Go、JavaScript 或其他非 Rust Fory 运行时读取时，请使用默认的 Rust 模式
[Xlang Serialization](xlang-serialization.md)。

## 何时使用 Native 序列化

在以下场景使用 native 序列化：

- 载荷只由 Rust 应用产生和消费。
- 数据模型使用 Rust 特有的对象图能力，例如 `Rc<T>`、`Arc<T>`、弱指针、`RefCell<T>`、`Mutex<T>`、trait object 或 `dyn Any`。
- 需要为同步升级的服务提供 Schema 一致的 Rust 载荷。
- 需要为 Rust 专用滚动部署提供兼容 Schema 演进。
- 希望使用来自 `#[derive(ForyStruct)]` 的编译期序列化器，同时不受可移植 xlang 映射约束。

## 创建 Native 运行时

```rust
use fory::{Error, Fory, ForyStruct};

#[derive(ForyStruct, Debug, PartialEq)]
struct Order {
    id: i64,
    amount: f64,
}

fn main() -> Result<(), Error> {
    let mut fory = Fory::builder().xlang(false).build();
    fory.register::<Order>(100)?;

    let order = Order { id: 1, amount: 42.5 };
    let bytes = fory.serialize(&order)?;
    let decoded: Order = fory.deserialize(&bytes)?;
    assert_eq!(order, decoded);
    Ok(())
}
```

在跨线程共享 `Fory` 实例前完成注册。配置完成后，`Fory` 可以通过 `Arc` 共享。

## Schema 演进

Native 序列化默认使用 Schema 一致模式。只有在 Rust 专用写入端和读取端版本可能不一致时，才启用兼容模式：

```rust
let mut writer = Fory::builder().xlang(false).compatible(true).build();
let mut reader = Fory::builder().xlang(false).compatible(true).build();
```

兼容模式使用 Schema 元数据，在字段身份保持兼容时容忍字段的新增、删除或重排。参见
[Schema Evolution](schema-evolution.md)。

## 注册

序列化前注册应用 struct 和类似 enum 的类型：

```rust
fory.register::<Order>(100)?;
fory.register_by_name::<Order>("example", "Order")?;
```

使用显式数字 ID 可获得紧凑载荷和稳定部署。当不同团队通过名称协调类型身份时，使用 namespace/type-name 注册。

## Rust 对象能力范围

Native 序列化覆盖 Rust 特有的对象能力范围：

- 带 `#[derive(ForyStruct)]` 的 struct 和 tuple struct。
- Fory derive 宏支持的 enum 和类似 union 的模型。
- `Vec`、map、set、tuple、array 和可选值。
- `Box<T>`、`Rc<T>`、`Arc<T>`、`RcWeak<T>` 和 `ArcWeak<T>`。
- `RefCell<T>` 和 `Mutex<T>`。
- `Box<dyn Trait>`、`Rc<dyn Trait>` 和 `Arc<dyn Trait>` 等 trait object。
- 使用 `Rc<dyn Any>` 和 `Arc<dyn Any>` 的运行时类型分派。
- 日期和时间承载类型，包括可选的 `chrono` 支持。

聚焦示例见 [Basic Serialization](basic-serialization.md)、[References](references.md) 和
[Trait Object Serialization](polymorphism.md)。

## 共享引用和循环引用

Native 模式可以使用 `Rc<T>` 和 `Arc<T>` 保留共享引用：

```rust
use fory::{Error, Fory};
use std::rc::Rc;

fn main() -> Result<(), Error> {
    let fory = Fory::builder().xlang(false).build();
    let shared = Rc::new(String::from("shared"));
    let values = vec![shared.clone(), shared.clone()];

    let bytes = fory.serialize(&values)?;
    let decoded: Vec<Rc<String>> = fory.deserialize(&bytes)?;
    assert!(Rc::ptr_eq(&decoded[0], &decoded[1]));
    Ok(())
}
```

当弱指针或显式循环图需要引用跟踪时，使用 `.track_ref(true)`：

```rust
let mut fory = Fory::builder().xlang(false).track_ref(true).build();
```

当目标仍然存活时，弱指针会序列化为指向目标的引用；当目标已被释放时，会序列化为 null。

## Trait Object

Trait object 是 Rust 运行时能力，属于 native 序列化范围：

```rust
use fory::{register_trait_type, Error, Fory, ForyStruct, Serializer};

trait Animal: Serializer {
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

register_trait_type!(Animal, Dog);

fn main() -> Result<(), Error> {
    let mut fory = Fory::builder().xlang(false).compatible(true).build();
    fory.register::<Dog>(100)?;

    let value: Box<dyn Animal> = Box::new(Dog { name: "Milo".into() });
    let bytes = fory.serialize(&value)?;
    let decoded: Box<dyn Animal> = fory.deserialize(&bytes)?;
    assert_eq!(decoded.name(), "Milo");
    Ok(())
}
```

注册每一个可能出现在 trait object 背后的具体实现。

## 性能指南

- 复用配置好的 `Fory` 实例，并在并发使用前注册类型。
- 对同步升级的 Rust 服务保持 native Schema 一致模式。
- 仅在需要 Rust 专用 Schema 演进时启用 `.compatible(true)`。
- 对应用 struct 使用 derive 生成的序列化器。
- 仅在需要弱指针或循环图的场景中使用 `.track_ref(true)`。
- 在热点路径上优先使用具体类型字段，而不是 `dyn Any` 或 trait object。

## Native 与 Xlang 对比

| 需求                                     | 使用 native 序列化       | 使用 xlang 序列化      |
| ---------------------------------------- | ------------------------ | ----------------------- |
| Rust 专用载荷                            | 是                       | 可选                    |
| 非 Rust 读取端或写入端                   | 否                       | 是                      |
| `Rc`、`Arc`、弱指针                      | 是                       | 否                      |
| Trait object 和 `dyn Any`                | 是                       | 否                      |
| Schema 一致的同语言载荷                  | 是                       | 否                      |
| 默认兼容 Schema 演进                     | 否                       | 是                      |
| 跨运行时的可移植类型映射                 | 否                       | 是                      |

## 故障排查

### 非 Rust 运行时无法读取载荷

写入端正在使用 native 序列化。请使用 `.xlang(true)` 重新构建，并与每个对端运行时对齐类型注册。

### 弱指针无法解析

使用 `.track_ref(true)`，并确保序列化时目标对象仍然存活。已释放的弱引用目标会反序列化为 null。

### Trait object 无法反序列化

注册 trait 映射以及每一个可能出现在该 trait object 背后的具体实现。

### 字段变更后滚动部署失败

Native 序列化默认使用 Schema 一致模式。当 Schema 可能不同时，在写入端和读取端都使用 `.compatible(true)`。

## 相关主题

- [Xlang Serialization](xlang-serialization.md) - 跨运行时 Rust 载荷
- [Configuration](configuration.md) - Builder 选项
- [Basic Serialization](basic-serialization.md) - 对象图序列化
- [Shared & Circular References](references.md) - `Rc`、`Arc` 和弱指针
- [Trait Object Serialization](polymorphism.md) - Trait object 和动态分派
- [Schema Evolution](schema-evolution.md) - 兼容模式
