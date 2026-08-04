---
title: 基本序列化
sidebar_position: 3
id: core-api
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

本文介绍基本对象图序列化和支持的类型。

## 对象图序列化

Apache Fory™ 可自动序列化复杂对象图，并保留对象之间的结构和关系。`#[derive(ForyStruct)]` 宏在编译期生成高效序列化代码，从而消除反射开销。

**主要能力：**

- 任意深度的嵌套结构体序列化
- 集合类型（Vec、HashMap、HashSet、BTreeMap）
- 使用 `Option<T>` 的可选字段
- 自动处理原始类型和字符串
- 使用变长整数的高效二进制编码

```rust
use fory::{Fory, Error};
use fory::ForyStruct;
use std::collections::HashMap;

#[derive(ForyStruct, Debug, PartialEq)]
struct Person {
    name: String,
    age: i32,
    address: Address,
    hobbies: Vec<String>,
    metadata: HashMap<String, String>,
}

#[derive(ForyStruct, Debug, PartialEq)]
struct Address {
    street: String,
    city: String,
    country: String,
}

let mut fory = Fory::builder().xlang(true).build();
fory.register_by_name::<Address>("example.Address").unwrap();
fory.register_by_name::<Person>("example.Person").unwrap();

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

let bytes = fory.serialize(&person).unwrap();
let decoded: Person = fory.deserialize(&bytes)?;
assert_eq!(person, decoded);
```

## 支持的类型

### 原始类型

| Rust 类型                 | 说明          |
| ------------------------- | ------------- |
| `bool`                    | 布尔值        |
| `i8`, `i16`, `i32`, `i64` | 有符号整数    |
| `f32`, `f64`              | 浮点数        |
| `BFloat16`                | 16 位脑浮点数 |
| `String`                  | UTF-8 字符串  |

### 集合

| Rust 类型        | 说明     |
| ---------------- | -------- |
| `Vec<T>`         | 动态数组 |
| `VecDeque<T>`    | 双端队列 |
| `LinkedList<T>`  | 双向链表 |
| `HashMap<K, V>`  | 哈希 map |
| `BTreeMap<K, V>` | 有序 map |
| `HashSet<T>`     | 哈希 set |
| `BTreeSet<T>`    | 有序 set |
| `BinaryHeap<T>`  | 二叉堆   |
| `Option<T>`      | 可选值   |

`Vec<BFloat16>` 是 Schema 为 `array<bfloat16>` 时的稠密载体。

### 智能指针

| Rust 类型    | 说明                                   |
| ------------ | -------------------------------------- |
| `Box<T>`     | 堆分配                                 |
| `Rc<T>`      | 引用计数（跟踪共享引用）               |
| `Arc<T>`     | 线程安全的引用计数（跟踪共享引用）     |
| `RcWeak<T>`  | 指向 `Rc<T>` 的弱引用（打破循环引用）  |
| `ArcWeak<T>` | 指向 `Arc<T>` 的弱引用（打破循环引用） |
| `RefCell<T>` | 内部可变性（运行时借用检查）           |
| `Mutex<T>`   | 线程安全的内部可变性                   |

### 日期和时间

| Rust 类型   | 说明                                    |
| ----------- | --------------------------------------- |
| `Date`      | 不含时区的日期，存储为相对 epoch 的天数 |
| `Timestamp` | 时间点，存储为 epoch 秒数和纳秒         |
| `Duration`  | 有符号时间长度，存储为秒数和规范化纳秒  |

内置载体提供无依赖的构造函数、访问器、转换和经过检查的算术运算：

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

Rust 启用 `chrono::NaiveDate`、`chrono::NaiveDateTime` 和 `chrono::Duration` 所需的 `chrono` 功能时，即可支持这些类型：

```toml
[dependencies]
fory = { version = "1.5.0", features = ["chrono"] }
```

### 自定义类型

对象图序列化使用 `#[derive(ForyStruct)]`。独立的 [Rust 行格式指南](../../row-format/rust.md)记录 `#[derive(ForyRow)]` 及其支持的类型集合。

## 序列化 API

```rust
use fory::{Fory, Reader};

let mut fory = Fory::builder().xlang(true).build();
fory.register::<MyStruct>(1)?;

let obj = MyStruct { /* ... */ };

// Basic serialize/deserialize
let bytes = fory.serialize(&obj)?;
let decoded: MyStruct = fory.deserialize(&bytes)?;

// Serialize to existing buffer
let mut buf: Vec<u8> = vec![];
fory.serialize_to(&mut buf, &obj)?;

// Deserialize from reader
let mut reader = Reader::new(&buf);
let decoded: MyStruct = fory.deserialize_from(&mut reader)?;
```

Rust 值类型使用外部结构化序列化器或自定义序列化器时，请在根上显式选择：

```rust
let bytes = fory.serialize_with::<UserSerializer>(&user)?;
let decoded: third_party::User =
    fory.deserialize_with::<UserSerializer>(&bytes)?;
```

载体序列化器为根容器组合相同的选择：

```rust
use fory::VecSerializer;

let bytes =
    fory.serialize_with::<VecSerializer<UserSerializer>>(&users)?;
let decoded: Vec<third_party::User> =
    fory.deserialize_with::<VecSerializer<UserSerializer>>(&bytes)?;
```

字段注解、所有支持的载体和注册方式参见[外部类型序列化](external-types.md)。

## 性能技巧

- **预分配缓冲区**：尽量减少序列化期间的内存分配
- **紧凑编码**：使用变长编码提高空间效率
- **小端序**：针对现代 CPU 架构优化
- **引用去重**：共享对象只序列化一次

## 相关主题

- [类型注册](type-registration.md) - 注册类型
- [引用](references.md) - 共享引用与循环引用
- [自定义序列化器](custom-serializers.md) - 自定义序列化
- [外部类型序列化](external-types.md) - 第三方值和载体根值
- [Row Format](../../row-format/rust.md) - Standard Row Format 和零拷贝借用视图
