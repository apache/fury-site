---
title: 基础序列化
sidebar_position: 2
id: basic_serialization
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

本页涵盖基础对象图序列化和支持的类型。

## 对象图序列化

Apache Fory™ 提供复杂对象图的自动序列化，保留对象之间的结构和关系。`#[derive(ForyObject)]` 宏在编译时生成高效的序列化代码，消除运行时开销。

**核心功能：**

- 任意深度的嵌套结构体序列化
- 集合类型（Vec、HashMap、HashSet、BTreeMap）
- 使用 `Option<T>` 的可选字段
- 原始类型和字符串的自动处理
- 使用变长整数的高效二进制编码

```rust
use fory::{Fory, Error};
use fory::ForyObject;
use std::collections::HashMap;

#[derive(ForyObject, Debug, PartialEq)]
struct Person {
    name: String,
    age: i32,
    address: Address,
    hobbies: Vec<String>,
    metadata: HashMap<String, String>,
}

#[derive(ForyObject, Debug, PartialEq)]
struct Address {
    street: String,
    city: String,
    country: String,
}

let mut fory = Fory::default();
fory.register::<Address>(100);
fory.register::<Person>(200);

let person = Person {
    name: "John Doe".to_string(),
    age: 30,
    address: Address {
        street: "123 Main St".to_string(),
        city: "New York".to_string(),
        country: "USA".to_string(),
    },
    hobbies: vec!["reading".to_string(), "coding".to_string()],
    metadata: HashMap::from([
        ("role".to_string(), "developer".to_string()),
    ]),
};

let bytes = fory.serialize(&person);
let decoded: Person = fory.deserialize(&bytes)?;
assert_eq!(person, decoded);
```

## 支持的类型

### 原始类型

| Rust 类型                 | 描述         |
| ------------------------- | ------------ |
| `bool`                    | 布尔值       |
| `i8`, `i16`, `i32`, `i64` | 有符号整数   |
| `f32`, `f64`              | 浮点数       |
| `String`                  | UTF-8 字符串 |

### 集合类型

| Rust 类型        | 描述     |
| ---------------- | -------- |
| `Vec<T>`         | 动态数组 |
| `VecDeque<T>`    | 双端队列 |
| `LinkedList<T>`  | 双向链表 |
| `HashMap<K, V>`  | 哈希映射 |
| `BTreeMap<K, V>` | 有序映射 |
| `HashSet<T>`     | 哈希集合 |
| `BTreeSet<T>`    | 有序集合 |
| `BinaryHeap<T>`  | 二叉堆   |
| `Option<T>`      | 可选值   |

### 智能指针

| Rust 类型    | 描述                                   |
| ------------ | -------------------------------------- |
| `Box<T>`     | 堆分配                                 |
| `Rc<T>`      | 引用计数（跟踪共享引用）               |
| `Arc<T>`     | 线程安全引用计数（跟踪共享引用）       |
| `RcWeak<T>`  | 指向 `Rc<T>` 的弱引用（打破循环引用）  |
| `ArcWeak<T>` | 指向 `Arc<T>` 的弱引用（打破循环引用） |
| `RefCell<T>` | 内部可变性（运行时借用检查）           |
| `Mutex<T>`   | 线程安全内部可变性                     |

### 日期和时间

| Rust 类型   | 描述                              |
| ----------- | --------------------------------- |
| `Date`      | 不带时区的日期，存储为 epoch 天数 |
| `Timestamp` | 时间点，存储为 epoch 秒和纳秒     |
| `Duration`  | 有符号时长，存储为秒和规范化纳秒  |

内置承载类型提供无额外依赖的构造器、访问器、转换和 checked 算术：

```rust
use fory::{Date, Duration, Timestamp};

let date = Date::from_epoch_days(19_782);
assert_eq!(date.checked_add_days(1)?.epoch_days(), 19_783);

let timestamp = Timestamp::from_epoch_millis(-1);
assert_eq!(timestamp.to_epoch_millis()?, -1);

let duration = Duration::from_parts(1, 1_500_000_000)?;
assert_eq!(duration.to_millis()?, 2_500);
let later = timestamp.checked_add_duration(duration)?;
```

启用 Rust `chrono` feature 后，也支持 `chrono::NaiveDate`、`chrono::NaiveDateTime` 和
`chrono::Duration`：

```toml
[dependencies]
fory = { version = "1.4.0", features = ["chrono"] }
```

### 自定义类型

| 宏                      | 描述         |
| ----------------------- | ------------ |
| `#[derive(ForyObject)]` | 对象图序列化 |
| `#[derive(ForyRow)]`    | 行格式序列化 |

## 序列化 API

```rust
use fory::{Fory, Reader};

let mut fory = Fory::default();
fory.register::<MyStruct>(1)?;

let obj = MyStruct { /* ... */ };

// 基础序列化/反序列化
let bytes = fory.serialize(&obj)?;
let decoded: MyStruct = fory.deserialize(&bytes)?;

// 序列化到现有缓冲区
let mut buf: Vec<u8> = vec![];
fory.serialize_to(&mut buf, &obj)?;

// 从 reader 反序列化
let mut reader = Reader::new(&buf);
let decoded: MyStruct = fory.deserialize_from(&mut reader)?;
```

## 性能优化建议

- **零拷贝反序列化**：行格式支持直接内存访问而无需复制
- **缓冲区预分配**：在序列化期间最小化内存分配
- **紧凑编码**：变长编码以提高空间效率
- **小端序**：为现代 CPU 架构优化
- **引用去重**：共享对象仅序列化一次

## 相关主题

- [类型注册](type-registration.md) - 注册类型
- [引用](references.md) - 共享引用和循环引用
- [自定义序列化器](custom-serializers.md) - 自定义序列化
