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

**Apache Fory™** 是一个高性能的多语言序列化框架，基于 **JIT 编译**与**零拷贝**技术，在保持易用性和安全性的同时提供出色性能。

Rust 实现提供灵活而高性能的序列化能力，具备自动内存管理与编译时类型安全。

## 为什么选择 Apache Fory™ Rust？

- **高性能**：零拷贝反序列化与优化的二进制协议
- **跨语言**：可在 Java、Python、C++、Go、JavaScript 和 Rust 之间无缝序列化与反序列化数据
- **类型安全**：通过 derive macro 实现编译时类型检查
- **循环引用**：借助 `Rc` / `Arc` 与弱指针自动跟踪共享引用和循环引用
- **多态支持**：支持序列化 `Box<dyn Trait>`、`Rc<dyn Trait>` 和 `Arc<dyn Trait>` 等 trait 对象
- **Schema 演进**：兼容模式支持独立的 Schema 变更
- **双格式支持**：对象图序列化与零拷贝行格式

## Crate

| Crate                                                                       | 说明                           | 版本                                                                                                  |
| --------------------------------------------------------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------- |
| [`fory`](https://github.com/apache/fory/blob/main/rust/fory)                | 面向用户的 API、运行时类型和 derive macro         | [1.4.0](https://crates.io/crates/fory)        |
| [`fory-core`](https://github.com/apache/fory/blob/main/rust/fory-core/)     | 面向高级集成的底层运行时 crate                   | [1.4.0](https://crates.io/crates/fory-core)   |
| [`fory-derive`](https://github.com/apache/fory/blob/main/rust/fory-derive/) | 供直接使用运行时的底层 procedural macro crate    | [1.4.0](https://crates.io/crates/fory-derive) |

## 快速开始

在你的 `Cargo.toml` 中添加 Apache Fory™：

```toml
[dependencies]
fory = "1.4.0"
```

### 基础示例

```rust
use fory::{Fory, Error, Reader};
use fory::ForyObject;

#[derive(ForyObject, Debug, PartialEq)]
struct User {
    name: String,
    age: i32,
    email: String,
}

fn main() -> Result<(), Error> {
    let mut fory = Fory::default();
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

## 线程安全

Apache Fory™ Rust 完全线程安全：`Fory` 同时实现了 `Send` 和 `Sync`，因此一个配置好的实例可以在线程之间共享并发使用。内部读写上下文池通过线程安全原语延迟初始化，使工作线程无需额外协调即可复用缓冲区。

```rust
use fory::{Fory, Error};
use fory::ForyObject;
use std::sync::Arc;
use std::thread;

#[derive(ForyObject, Clone, Copy, Debug, PartialEq)]
struct Item {
    value: i32,
}

fn main() -> Result<(), Error> {
    let mut fory = Fory::default();
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

```text
fory/                   # 高级 API
├── src/lib.rs         # 公共 API 导出

fory-core/             # 核心序列化引擎
├── src/
│   ├── fory.rs       # 主序列化入口
│   ├── buffer.rs     # 二进制缓冲区管理
│   ├── serializer/   # 类型特定序列化器
│   ├── resolver/     # 类型解析与元数据
│   ├── meta/         # 元字符串压缩
│   ├── row/          # 行格式实现
│   └── types.rs      # 类型定义

fory-derive/           # 过程宏
├── src/
│   ├── object/       # ForyObject 宏
│   └── fory_row.rs   # ForyRow 宏
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

- [配置](configuration.md) - Fory 构建器选项与模式
- [基础序列化](basic-serialization.md) - 对象图序列化
- [引用](references.md) - 共享引用与循环引用
- [多态](polymorphism.md) - Trait 对象序列化
- [跨语言](xlang-serialization.md) - XLANG 模式
- [行格式](row-format.md) - 零拷贝行格式
