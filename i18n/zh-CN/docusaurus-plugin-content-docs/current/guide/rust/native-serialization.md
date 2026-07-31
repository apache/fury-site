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

Rust native 序列化是通过 `.xlang(false)` 选择的纯 Rust 编码模式。当所有写入端和读取端都是 Rust，并且载荷需要保留 Rust 对象图行为而不是可移植的 xlang 类型系统时，请使用该模式。

当字节必须由 Java、Python、C++、Go、JavaScript/TypeScript、C#、Swift、Dart、Scala、Kotlin 或其他非 Rust Fory 实现读取时，请使用 Rust 默认模式 [Xlang 序列化](xlang-serialization.md)。

## 何时使用 Native 序列化

在以下场景使用 native 序列化：

- 载荷只由 Rust 应用程序产生和消费。
- 数据模型使用 Rust 特有的对象图能力，例如带具体类型的 `Rc<T>`、`Arc<T>`、弱指针、`RefCell<T>` 或 `Mutex<T>`，或者在 trait 对象或 `dyn Any` 后使用 native-only 具体目标。
- 需要更快的序列化速度和更小的数据体积，并且每个读取端使用的 Schema 都与写入端相同。
- 需要为纯 Rust 滚动部署提供兼容的 Schema 演进。
- 希望使用 `#[derive(ForyStruct)]` 生成的编译时序列化器，而不受可移植 xlang 映射约束。

## 创建 Native 模式的 Fory 实例

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

在跨线程共享 `Fory` 实例之前完成注册。配置完成后，可以通过 `Arc` 共享 `Fory`。

## Schema 演进

Native 序列化默认启用兼容模式。当纯 Rust 写入端和读取端的版本可能不同时，请保留该默认设置：

```rust
let mut writer = Fory::builder().xlang(false).build();
let mut reader = Fory::builder().xlang(false).build();
```

当字段身份保持兼容时，兼容模式使用元数据来容忍字段的新增、删除或重排。请参阅 [Schema 演进](schema-evolution.md)。

只有当每个读取端和写入端始终使用相同的 Rust Schema 时，才应设置 `.compatible(false)` 以获得更快的序列化速度和更小的数据体积。

## 注册

序列化之前注册应用程序结构体和类似枚举的类型：

```rust
// 选择数字 ID：
fory.register::<Order>(100)?;

// 或者，在另一个 Fory 实例中选择限定名称：
// fory.register_by_name::<Order>("example.Order")?;
```

显式数字 ID 适合紧凑载荷和稳定部署。当不同团队通过名称协调类型身份时，请使用名称注册；需要时用 `.` 添加命名空间前缀。

## Rust 对象能力范围

Native 序列化覆盖 Rust 特有的对象能力：

- 带 `#[derive(ForyStruct)]` 的结构体和元组结构体。
- Fory 派生宏支持的枚举和类似联合类型的模型。
- `Vec`、map、set、tuple、array 和可选值。
- `Box<T>`、`Rc<T>`、`Arc<T>`、`RcWeak<T>` 和 `ArcWeak<T>`。
- `RefCell<T>` 和 `Mutex<T>`。
- `Box<dyn Trait>`、`Rc<dyn Trait>` 和 `Arc<dyn Trait>` 等 trait 对象。
- 对已注册的非容器载荷，使用 `Box<dyn Any>`、`Rc<dyn Any>` 和 `Arc<dyn Any + Send + Sync>` 进行运行时类型分派。将容器包装在已注册的结构体、枚举或联合类型中；如果需要不透明的 `EXT`/`NAMED_EXT` 表示，也可以注册目标类型完全匹配的自定义序列化器。
- 日期和时间承载类型，包括可选的 `chrono` 支持。

有关针对性示例，请参阅[基础序列化](basic-serialization.md)、[引用](references.md)和 [Trait 对象序列化](polymorphism.md)。

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

如果目标仍然存活，弱指针会序列化为指向目标的引用；如果目标已被释放，则会序列化为 null。

## Trait 对象

Trait 对象是 Rust 语言特性，但其已注册的具体目标既可以使用 native 序列化，也可以使用 xlang 序列化。以下示例使用 native 模式：

```rust
use fory::{register_trait_type, Error, Fory, ForyObject, ForyStruct};

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

register_trait_type!(Animal, Dog);

fn main() -> Result<(), Error> {
    let mut fory = Fory::builder().xlang(false).build();
    fory.register::<Dog>(100)?;

    let value: Box<dyn Animal> = Box::new(Dog { name: "Milo".into() });
    let bytes = fory.serialize(&value)?;
    let decoded: Box<dyn Animal> = fory.deserialize(&bytes)?;
    assert_eq!(decoded.name(), "Milo");
    Ok(())
}
```

注册每一个可能出现在 trait 对象背后的具体实现。

## 第三方结构体风格枚举

Native 模式支持为带 unit、tuple 以及具名多字段变体的 Rust 枚举创建外部结构化序列化器：

```rust
use fory::{Fory, ForyUnion};

#[derive(ForyUnion)]
#[fory(target = third_party::Command)]
enum CommandSerializer {
    #[fory(default)]
    Idle,
    Move(i32, i32),
    Create { id: u128, label: String },
}

let mut fory = Fory::builder()
    .xlang(false)
    .compatible(true)
    .build();
fory.register::<CommandSerializer>(101)?;
```

当通信双方使用相同的 Schema 时，同一个序列化器也可用于 `compatible(false)`。多字段 tuple 变体和具名变体没有对应的 xlang union 映射，因此在 `xlang(true)` 下注册该序列化器会返回错误。有关字段、承载类型、根值和自定义序列化器的组合方式，请参阅[外部类型序列化](external-types.md)。

## 性能指南

- 复用配置好的 `Fory` 实例，并在并发使用前注册类型。
- 只有当每个读取端和写入端始终使用相同的 Rust Schema，且应用程序需要更快的序列化速度和更小的数据体积时，才使用 `.compatible(false)`。
- 对应用程序结构体使用派生生成的序列化器。
- 仅在需要弱指针或循环图的场景中使用 `.track_ref(true)`。
- 在热点路径上优先使用带具体类型的字段，而不是 `dyn Any` 或 trait 对象。

## Native 与 Xlang 对比

| 需求                             | 使用 native 序列化 | 使用 xlang 序列化 |
| -------------------------------- | ------------------ | ----------------- |
| 纯 Rust 载荷                     | 是                 | 可选              |
| 非 Rust 读取端或写入端           | 否                 | 是                |
| 带具体类型的共享引用和弱引用     | 是                 | 否                |
| Trait 对象和 `dyn Any`           | 是                 | 有条件支持        |
| 同 Schema 紧凑载荷               | 是                 | 是                |
| 默认支持兼容的 Schema 演进       | 是                 | 是                |
| 跨语言的可移植类型映射           | 否                 | 是                |

只有当所选的每个具体目标都具有与 xlang 兼容的结构化身份或 `EXT` 身份时，trait 对象和 `dyn Any` 才能在 xlang 模式中使用。Rust trait 或类型擦除承载类型的身份不会写入编码数据。

## 故障排查

### 非 Rust 实现无法读取载荷

写入端正在使用 native 序列化。请改用 `.xlang(true)` 重新构建，并与每个通信对端对齐类型注册。

### 弱指针无法解析

使用 `.track_ref(true)`，并确保序列化时目标对象仍然存活。已释放的弱引用目标会反序列化为 null。

### Trait 对象无法反序列化

注册 trait 映射以及每一个可能出现在该 trait 对象背后的具体实现。

### 字段变更后滚动部署失败

Native 序列化默认启用兼容模式。当 Schema 可能不同时，请保留该默认设置。

## 相关主题

- [Xlang 序列化](xlang-serialization.md) - 跨语言 Rust 载荷
- [配置](configuration.md) - 构建器选项
- [基础序列化](basic-serialization.md) - 对象图序列化
- [共享引用和循环引用](references.md) - `Rc`、`Arc` 和弱指针
- [Trait 对象序列化](polymorphism.md) - Trait 对象和动态分派
- [Schema 演进](schema-evolution.md) - 兼容模式
