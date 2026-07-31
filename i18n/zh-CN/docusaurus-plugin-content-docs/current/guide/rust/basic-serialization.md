---
title: 基础序列化
sidebar_position: 1
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

本页介绍基础对象图序列化和支持的类型。

## 对象图序列化

Apache Fory™ 可以自动序列化复杂对象图，并保留对象之间的结构和关系。`#[derive(ForyStruct)]` 宏会在编译时生成高效的序列化代码，从而消除反射开销。

**核心能力：**

- 支持任意深度的嵌套结构体序列化
- 支持集合类型（Vec、HashMap、HashSet、BTreeMap）
- 支持使用 `Option<T>` 声明的可选字段
- 自动处理原始类型和字符串
- 使用变长整数进行高效二进制编码

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

| Rust 类型                 | 描述             |
| ------------------------- | ---------------- |
| `bool`                    | 布尔值           |
| `i8`, `i16`, `i32`, `i64` | 有符号整数       |
| `f32`, `f64`              | 浮点数           |
| `BFloat16`                | 16 位脑浮点数    |
| `String`                  | UTF-8 字符串     |

### 集合类型

| Rust 类型        | 描述       |
| ---------------- | ---------- |
| `Vec<T>`         | 动态数组   |
| `VecDeque<T>`    | 双端队列   |
| `LinkedList<T>`  | 双向链表   |
| `HashMap<K, V>`  | 哈希映射   |
| `BTreeMap<K, V>` | 有序映射   |
| `HashSet<T>`     | 哈希集合   |
| `BTreeSet<T>`    | 有序集合   |
| `BinaryHeap<T>`  | 二叉堆     |
| `Option<T>`      | 可选值     |

当 Schema 为 `array<bfloat16>` 时，使用 `Vec<BFloat16>` 作为紧凑承载类型。

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
fory = { version = "1.5.0", features = ["chrono"] }
```

### 自定义类型

| 宏                      | 描述         |
| ----------------------- | ------------ |
| `#[derive(ForyStruct)]` | 对象图序列化 |
| `#[derive(ForyRow)]`    | 行格式序列化 |

## 序列化 API

```rust
use fory::{Fory, Reader};

let mut fory = Fory::builder().xlang(true).build();
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

当 Rust 值类型使用外部结构化序列化器或自定义序列化器时，需要在根值上显式选择该序列化器：

```rust
let bytes = fory.serialize_with::<UserSerializer>(&user)?;
let decoded: third_party::User =
    fory.deserialize_with::<UserSerializer>(&bytes)?;
```

承载序列化器可以对根容器应用同样的选择：

```rust
use fory::VecSerializer;

let bytes =
    fory.serialize_with::<VecSerializer<UserSerializer>>(&users)?;
let decoded: Vec<third_party::User> =
    fory.deserialize_with::<VecSerializer<UserSerializer>>(&bytes)?;
```

有关字段注解、所有支持的承载类型以及注册方式，请参阅[外部类型序列化](external-types.md)。

## 性能优化建议

- **零拷贝反序列化**：行格式支持直接访问内存，无需复制
- **缓冲区预分配**：尽量减少序列化期间的内存分配
- **紧凑编码**：通过变长编码提高空间效率
- **小端序**：针对现代 CPU 架构进行优化
- **引用去重**：共享对象只序列化一次

## 相关主题

- [类型注册](type-registration.md) - 注册类型
- [引用](references.md) - 共享引用和循环引用
- [自定义序列化器](custom-serializers.md) - 自定义序列化
- [外部类型序列化](external-types.md) - 第三方值和根承载类型
