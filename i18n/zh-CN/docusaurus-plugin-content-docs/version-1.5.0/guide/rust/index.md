---
title: Rust 序列化指南
sidebar_position: 0
id: serialization_index
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

**Apache Fory™** 是一个极快的多语言序列化框架，采用 **JIT（即时）编译**和**零拷贝**技术，在保持易用性和安全性的同时提供卓越性能。

Rust 实现提供灵活且高性能的序列化能力，具备自动内存管理和编译时类型安全。它既支持用于跨语言载荷的 xlang 模式，也支持用于纯 Rust 载荷的 native 模式。

## 为什么选择 Apache Fory™ Rust？

- **快速二进制编码**：零拷贝反序列化和优化的二进制协议
- **Xlang**：可在 Java、Python、C++、Go、Rust、JavaScript/TypeScript、C#、Swift、Dart、Scala 和 Kotlin 之间无缝序列化和反序列化数据
- **类型安全**：通过派生宏进行编译时类型检查
- **循环引用**：通过 `Rc`/`Arc` 和弱指针自动跟踪共享引用和循环引用
- **多态支持**：支持序列化 `Box<dyn Trait>`、`Rc<dyn Trait>` 和 `Arc<dyn Trait>` 等 trait 对象
- **Schema 演进**：兼容模式支持独立的 Schema 变更
- **双格式支持**：对象图序列化和零拷贝行格式

## Crate

| Crate                                                                       | 描述                                             | 版本                                          |
| --------------------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------- |
| [`fory`](https://github.com/apache/fory/blob/main/rust/fory)                | 面向用户的 API、运行时类型和派生宏               | [1.5.0](https://crates.io/crates/fory)        |
| [`fory-core`](https://github.com/apache/fory/blob/main/rust/fory-core/)     | 面向高级集成的底层运行时 crate                   | [1.5.0](https://crates.io/crates/fory-core)   |
| [`fory-derive`](https://github.com/apache/fory/blob/main/rust/fory-derive/) | 供直接使用运行时的底层过程宏 crate               | [1.5.0](https://crates.io/crates/fory-derive) |

大多数应用程序只需依赖 `fory`。它会重新导出派生宏和生成代码所需的公共运行时类型。只有在有意基于底层运行时 crate 构建时，才应直接使用 `fory-core` 或 `fory-derive`。

## 快速开始

在 `Cargo.toml` 中添加 Apache Fory™：

```toml
[dependencies]
fory = "1.5.0"
```

### 基础示例

```rust
use fory::{Fory, Error, Reader};
use fory::ForyStruct;

#[derive(ForyStruct, Debug, PartialEq)]
struct User {
    name: String,
    age: i32,
    email: String,
}

fn main() -> Result<(), Error> {
    let mut fory = Fory::builder().xlang(true).build();
    fory.register::<User>(1)?;

    let user = User {
        name: "Alice".to_string(),
        age: 30,
        email: "alice@example.com".to_string(),
    };

    // 序列化
    let bytes = fory.serialize(&user)?;
    // 反序列化
    let decoded: User = fory.deserialize(&bytes)?;
    assert_eq!(user, decoded);

    // 序列化到指定缓冲区
    let mut buf: Vec<u8> = vec![];
    fory.serialize_to(&mut buf, &user)?;
    // 从指定缓冲区反序列化
    let mut reader = Reader::new(&buf);
    let decoded: User = fory.deserialize_from(&mut reader)?;
    assert_eq!(user, decoded);
    Ok(())
}
```

## Xlang 模式与 Native 模式

xlang 模式用于跨语言载荷以及与其他 Fory 实现共享的 Schema。xlang 模式是 Rust 的默认编码模式；为明确展示模式选择，使用该模式的 Rust 示例会显式设置 `.xlang(true)`。

native 模式用于纯 Rust 流量。该模式通过 `.xlang(false)` 选择，并以 Rust 原生形式保存 Rust 对象序列化。它支持在 xlang 中没有对应表示的 native-only 具体目标和数据枚举结构。只要所选的每个具体目标都与 xlang 兼容，动态 `Any`、应用程序 trait 和共享引用承载类型也可以在 xlang 模式中使用。兼容模式默认启用。只有当所有读写方都使用相同的 Rust Schema，且需要更快的序列化速度和更小的数据体积时，才应设置 `.compatible(false)`。

有关 Rust xlang 注册和互操作规则，请参阅 [Xlang 序列化](xlang-serialization.md)；有关纯 Rust 载荷，请参阅 [Native 序列化](native-serialization.md)。

## 线程安全

Apache Fory™ Rust 完全线程安全：`Fory` 同时实现了 `Send` 和 `Sync`，因此一个配置好的实例可以在线程之间共享并发使用。内部读写上下文池通过线程安全原语延迟初始化，使工作线程无需额外协调即可复用缓冲区。

```rust
use fory::{Fory, Error};
use fory::ForyStruct;
use std::sync::Arc;
use std::thread;

#[derive(ForyStruct, Clone, Copy, Debug, PartialEq)]
struct Item {
    value: i32,
}

fn main() -> Result<(), Error> {
    let mut fory = Fory::builder().xlang(true).build();
    fory.register::<Item>(1000)?;

    let fory = Arc::new(fory);
    let handles: Vec<_> = (0..8)
        .map(|i| {
            let shared = Arc::clone(&fory);
            thread::spawn(move || {
                let item = Item { value: i };
                shared.serialize(&item)
            })
        })
        .collect();

    for handle in handles {
        let bytes = handle.join().unwrap()?;
        let item: Item = fory.deserialize(&bytes)?;
        assert!(item.value >= 0);
    }

    Ok(())
}
```

**提示：** 请在启动线程之前完成注册操作，例如 `fory.register::<T>(id)`，确保每个工作线程看到一致的元数据。配置完成后，将实例包在 `Arc` 中即可安全地分发序列化和反序列化任务。

## 架构

Rust 实现由三个主要 crate 组成：

```
fory/                   # 高级 API
├── src/lib.rs         # 公共 API 导出

fory-core/             # 核心序列化引擎
├── src/
│   ├── fory.rs       # 主序列化入口
│   ├── buffer.rs     # 二进制缓冲区管理
│   ├── serializer/   # 特定类型的序列化器
│   ├── resolver/     # 类型解析和元数据
│   ├── meta/         # 元字符串压缩
│   ├── row/          # 行格式实现
│   └── types.rs      # 类型定义

fory-derive/           # 过程宏
├── src/
│   ├── object/       # ForyStruct 宏
│   └── fory_row.rs  # ForyRow 宏
```

## 使用场景

### 对象序列化

- 含嵌套对象和引用的复杂数据结构
- 微服务中的跨语言通信
- 具备完整类型安全的通用序列化
- 使用兼容模式进行 Schema 演进
- 带循环引用的图状数据结构

### 行格式序列化

- 高吞吐数据处理
- 需要快速字段访问的分析型负载
- 内存受限环境
- 实时数据流应用
- 零拷贝场景

## 后续步骤

- [配置](configuration.md) - Fory 构建器选项和模式
- [基础序列化](basic-serialization.md) - 对象图序列化
- [Xlang 序列化](xlang-serialization.md) - xlang 模式
- [Native 序列化](native-serialization.md) - 纯 Rust 序列化
- [引用](references.md) - 共享引用和循环引用
- [多态](polymorphism.md) - trait 对象序列化
- [自定义序列化器](custom-serializers.md) - 实现自定义序列化行为
- [外部类型序列化](external-types.md) - 外部结构化序列化器、自定义序列化器及承载类型组合
- [行格式](row-format.md) - 零拷贝行格式
- [gRPC 支持](grpc-support.md) - 通过 tonic 传输 Fory 载荷
