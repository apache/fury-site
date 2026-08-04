---
title: Rust 对象序列化
sidebar_position: 0
id: index
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

**Apache Fory™** 是高性能多语言序列化框架。Rust 实现使用编译期代码生成进行对象序列化。

Rust 实现通过自动内存管理和编译期类型安全提供灵活的高性能序列化。它既支持用于跨语言载荷的跨语言模式，也支持仅用于 Rust 载荷的原生模式。

## 为什么选择 Apache Fory™ Rust？

- **快速二进制编码**：零拷贝反序列化和优化的二进制协议
- **跨语言**：在 Java、Python、C++、Go、Rust、JavaScript/TypeScript、C#、Swift、Dart、Scala 和 Kotlin 之间无缝序列化和反序列化数据
- **类型安全**：使用派生宏进行编译期类型检查
- **循环引用**：使用 `Rc`/`Arc` 和弱指针自动跟踪共享引用与循环引用
- **多态**：使用 `Box<dyn Trait>`、`Rc<dyn Trait>` 和 `Arc<dyn Trait>` 序列化特征对象
- **Schema 演进**：兼容模式支持独立的 Schema 变更

## Crate

| Crate                                                                       | 说明                               | 版本                                          |
| --------------------------------------------------------------------------- | ---------------------------------- | --------------------------------------------- |
| [`fory`](https://github.com/apache/fory/blob/main/rust/fory)                | 面向用户的 API、运行时类型和派生宏 | [1.5.0](https://crates.io/crates/fory)        |
| [`fory-core`](https://github.com/apache/fory/blob/main/rust/fory-core/)     | 用于高级集成的底层运行时 crate     | [1.5.0](https://crates.io/crates/fory-core)   |
| [`fory-derive`](https://github.com/apache/fory/blob/main/rust/fory-derive/) | 供直接使用运行时的底层过程宏 crate | [1.5.0](https://crates.io/crates/fory-derive) |

大多数应用程序只需依赖 `fory`。它重新导出生成代码所需的派生宏和公共运行时类型。只有明确要基于底层运行时 crate 构建时，才直接使用 `fory-core` 或 `fory-derive`。

## 快速入门

将 Apache Fory™ 添加到 `Cargo.toml`：

```toml
[dependencies]
fory = "1.5.0"
```

### 基本示例

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

    // Serialize
    let bytes = fory.serialize(&user)?;
    // Deserialize
    let decoded: User = fory.deserialize(&bytes)?;
    assert_eq!(user, decoded);

    // Serialize to specified buffer
    let mut buf: Vec<u8> = vec![];
    fory.serialize_to(&mut buf, &user)?;
    // Deserialize from specified buffer
    let mut reader = Reader::new(&buf);
    let decoded: User = fory.deserialize_from(&mut reader)?;
    assert_eq!(user, decoded);
    Ok(())
}
```

## 跨语言模式与原生模式

跨语言载荷以及与其他 Fory 实现共享的 Schema 应使用跨语言模式。跨语言模式是 Rust 的默认编码模式；使用该模式的 Rust 示例会显式设置 `.xlang(true)`，以清楚展示模式选择。

仅限 Rust 的通信应使用原生模式。通过 `.xlang(false)` 选择原生模式，它会让 Rust 对象序列化保持 Rust 原生形式。该模式支持仅限原生模式的具体目标，以及没有跨语言表示的数据枚举形态。当每个选定具体目标都兼容跨语言模式时，也可以在跨语言模式中使用动态 `Any`、应用特征和共享引用载体。兼容模式默认启用。只有每个读取端和写入端都使用相同 Rust Schema，并且希望获得更快序列化和更小体积时，才设置 `.compatible(false)`。

Rust 跨语言注册和互操作规则参见[跨语言序列化](xlang.md)，仅限 Rust 的载荷参见[原生序列化](native.md)。

## 线程安全

Apache Fory™ Rust 完全线程安全：`Fory` 同时实现 `Send` 和 `Sync`，因此一个已配置实例可以在线程之间共享并并发工作。内部读写上下文池使用线程安全原语延迟初始化，使工作线程无需协调即可复用缓冲区。

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

**提示：**请在线程启动前完成注册（例如 `fory.register::<T>(id)`），确保每个工作线程看到相同的元数据。配置完成后，将实例包装在 `Arc` 中即可安全分发序列化和反序列化任务。

## 使用场景

### 对象序列化

- 包含嵌套对象和引用的复杂数据结构
- 微服务中的跨语言通信
- 具备完整类型安全的通用序列化
- 使用兼容模式进行 Schema 演进
- 包含循环引用的图形数据结构

## 后续步骤

- [配置](configuration.md) - Fory 构建器选项和模式
- [基本序列化](core-api.md) - 对象图序列化
- [跨语言序列化](xlang.md) - 跨语言模式
- [原生序列化](native.md) - 仅限 Rust 的序列化
- [引用](references.md) - 共享引用与循环引用
- [多态](polymorphism.md) - 特征对象序列化
- [自定义序列化器](custom-serializers.md) - 实现自定义序列化行为
- [外部类型序列化](external-types.md) - 外部结构化序列化器、自定义序列化器和载体组合
- [Row Format](../../row-format/rust.md) - 支持借用视图的标准 Row Format
- [gRPC 支持](../../grpc/rust.md) - 通过 tonic 传输 Fory 载荷
