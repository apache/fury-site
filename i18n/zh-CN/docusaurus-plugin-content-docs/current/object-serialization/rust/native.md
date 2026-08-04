---
title: 原生序列化
sidebar_position: 2
id: native
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

Rust 原生序列化是通过 `.xlang(false)` 选择、仅限 Rust 的编码模式。当每个写入端和读取端都是 Rust，并且载荷应保留 Rust 对象图行为而非可移植的跨语言类型系统时，请使用该模式。

如果字节需要由 Java、Python、C++、Go、JavaScript/TypeScript、C#、Swift、Dart、Scala、Kotlin 或其他非 Rust Fory 实现读取，请使用 Rust 默认模式[跨语言序列化](basic-serialization.md#cross-language-interoperability)。

## 何时使用原生序列化

以下场景使用原生序列化：

- 载荷仅由 Rust 应用程序生成和消费。
- 数据模型使用类型化 `Rc<T>`、`Arc<T>`、弱指针、`RefCell<T>` 或 `Mutex<T>` 等 Rust 专属对象图功能，或在特征对象或 `dyn Any` 后使用仅限原生模式的具体目标。
- 希望获得更快序列化和更小体积，并且每个读取端都使用与写入端相同的 Schema。
- 仅限 Rust 的滚动部署需要兼容 Schema 演进。
- 希望使用 `#[derive(ForyStruct)]` 生成编译期序列化器，同时避免可移植跨语言映射的约束。

## 创建原生模式 Fory 实例

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

在线程之间共享 `Fory` 实例前完成注册。配置完成后，`Fory` 可以通过 `Arc` 共享。

## Schema 演进

原生序列化默认使用兼容模式。当仅限 Rust 的写入端和读取端版本可能不同时，请保留该默认设置：

```rust
let mut writer = Fory::builder().xlang(false).build();
let mut reader = Fory::builder().xlang(false).build();
```

字段标识保持兼容时，兼容模式使用元数据容忍字段新增、删除或重排。参见 [Schema 演进](schema-evolution.md)。

只有每个读取端和写入端始终使用相同 Rust Schema 时，才设置 `.compatible(false)` 以获得更快序列化和更小体积。

## 注册

序列化前注册应用结构体和类似枚举的类型：

```rust
// Choose a numeric ID:
fory.register::<Order>(100)?;

// Or, on a different Fory instance, choose a qualified name:
// fory.register_by_name::<Order>("example.Order")?;
```

使用显式数字 ID 获得紧凑载荷和稳定部署。当独立团队通过名称协调类型标识时使用名称注册；必要时使用 `.` 添加命名空间前缀。

## Rust 对象范围

原生序列化支持以下 Rust 专属对象范围：

- 使用 `#[derive(ForyStruct)]` 的结构体和元组结构体。
- Fory 派生宏支持的枚举和类 union 模型。
- `Vec`、map、set、tuple、array 和可选值。
- `Box<T>`、`Rc<T>`、`Arc<T>`、`RcWeak<T>` 和 `ArcWeak<T>`。
- `RefCell<T>` 和 `Mutex<T>`。
- `Box<dyn Trait>`、`Rc<dyn Trait>` 和 `Arc<dyn Trait>` 等特征对象。
- 对已注册的非容器载荷，通过 `Box<dyn Any>`、`Rc<dyn Any>` 和
  `Arc<dyn Any + Send + Sync>` 进行运行时类型分派。请将容器包装在已注册的结构体、枚举或 union 中；当不透明的 EXT/NAMED_EXT 表示合适时，也可以注册精确目标类型的自定义序列化器。
- 日期和时间载体，包括可选的 `chrono` 支持。

相关示例参见[基本序列化](basic-serialization.md)、[引用](references.md)和[特征对象序列化](polymorphism.md)。

## 共享引用与循环引用

原生模式可以使用 `Rc<T>` 和 `Arc<T>` 保留共享引用：

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

弱指针或显式循环对象图需要引用跟踪时，请使用 `.track_ref(true)`：

```rust
let mut fory = Fory::builder().xlang(false).track_ref(true).build();
```

目标仍存在时，弱指针序列化为对目标的引用；目标已被丢弃时则序列化为 null。

## 特征对象

特征对象是 Rust 语言功能，但其已注册具体目标可以使用原生或跨语言序列化。此示例使用原生模式：

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

注册可能出现在特征对象后的每个具体实现。

## 第三方结构体风格枚举

原生模式支持为具有 unit、tuple 和具名多字段变体的 Rust 枚举使用外部结构化序列化器：

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

当通信双方使用相同 Schema 时，同一个序列化器也可以配合 `compatible(false)` 使用。多字段 tuple 和具名变体没有 xlang union 映射，因此在 `xlang(true)` 下注册此序列化器会返回错误。字段、载体、根值和自定义序列化器的组合方式参见[外部类型序列化](external-types.md)。

## 性能指南

- 复用配置完成的 `Fory` 实例，并在并发使用前注册类型。
- 仅当每个读取端和写入端始终使用相同 Rust Schema，并且应用需要更快序列化和更小体积时，才使用 `.compatible(false)`。
- 对应用结构体使用派生宏生成的序列化器。
- 仅在需要弱指针或循环对象图的场景中使用 `.track_ref(true)`。
- 在热路径中优先使用具体类型字段，而不是 `dyn Any` 或特征对象。

## 原生模式与跨语言模式对比

| 需求                     | 使用原生序列化 | 使用跨语言序列化 |
| ------------------------ | -------------- | ---------------- |
| 仅限 Rust 的载荷         | 是             | 可选             |
| 非 Rust 读取端或写入端   | 否             | 是               |
| 类型化共享引用和弱引用   | 是             | 否               |
| 特征对象和 `dyn Any`     | 是             | 视情况而定       |
| 相同 Schema 下的紧凑载荷 | 是             | 是               |
| 默认支持兼容 Schema 演进 | 是             | 是               |
| 跨语言可移植的类型映射   | 否             | 是               |

只有每个选定具体目标都具有兼容跨语言模式的结构化或 EXT 标识时，特征对象和 `dyn Any` 才能在跨语言模式中工作。Rust 特征或擦除载体标识不会写入编码格式。

## 故障排查

### 非 Rust 实现无法读取载荷

写入端使用了原生序列化。请改用 `.xlang(true)` 重新构建，并与每个通信方对齐类型注册。

### 弱指针无法解析

使用 `.track_ref(true)`，并确保序列化时目标对象仍然存活。已释放的弱引用目标会反序列化为 null。

### 特征对象无法反序列化

注册特征映射，以及可能出现在该特征对象后的每个具体实现。

### 字段变更后滚动部署失败

原生序列化默认使用兼容模式。当 Schema 可能不同时，请保留该默认设置。

## 相关主题

- [跨语言序列化](basic-serialization.md#cross-language-interoperability) - 跨语言 Rust 载荷
- [配置](configuration.md) - 构建器选项
- [基本序列化](basic-serialization.md) - 对象图序列化
- [共享引用与循环引用](references.md) - `Rc`、`Arc` 和弱指针
- [特征对象序列化](polymorphism.md) - 特征对象和动态分派
- [Schema 演进](schema-evolution.md) - 兼容模式
