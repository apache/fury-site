---
title: 基础序列化
sidebar_position: 1
id: basic-serialization
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

本文介绍 Fory Rust 默认 xlang 模式下的基本对象图序列化和支持的类型。

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
fory = { version = "1.7.1", features = ["chrono"] }
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

## 跨语言互操作 {#cross-language-interoperability}

以下内容说明默认 xlang 格式的跨语言类型映射、类型标识和互操作要求。

Apache Fory™ 支持 Java、Python、C++、Go、Rust、JavaScript/TypeScript、C#、Swift、Dart、Scala 和 Kotlin 之间的无缝数据交换。

### Xlang 配置

Rust 默认使用带兼容 Schema 演进的跨语言模式。跨语言示例中应显式设置模式：

```rust
use fory::Fory;

// Use xlang mode
let mut fory = Fory::builder().xlang(true).build();

// Register types with consistent IDs across languages
fory.register::<MyStruct>(100)?;

// Or, on a different Fory instance, use name-based registration
// fory.register_by_name::<MyStruct>("com.example.MyStruct")?;
```

### 跨语言类型注册

#### 按 ID 注册

为获得快速、紧凑的序列化，请在各语言中使用一致的 ID：

```rust
let mut fory = Fory::builder().xlang(true).build();

fory.register::<User>(100)?;  // Same ID in Java, Python, etc.
```

#### 按名称注册

用于更灵活的类型命名：

```rust
fory.register_by_name::<User>("com.example.User")?;
```

### 跨语言示例

#### Rust（序列化器）

```rust
use fory::Fory;
use fory::ForyStruct;

#[derive(ForyStruct)]
struct Person {
    name: String,
    age: i32,
}

let mut fory = Fory::builder().xlang(true).build();

fory.register::<Person>(100)?;

let person = Person {
    name: "Alice".to_string(),
    age: 30,
};

let bytes = fory.serialize(&person)?;
// bytes can be deserialized by Java, Python, etc.
```

#### 第三方 Rust 类型

外部结构化序列化器为第三方 Rust 类型提供与等价本地派生相同的跨语言 Schema：

```rust
#[derive(ForyStruct)]
#[fory(target = third_party::User)]
struct UserSerializer {
    name: String,
    age: u32,
}

let mut fory = Fory::builder().xlang(true).build();
fory.register::<UserSerializer>(100)?;

let bytes = fory.serialize_with::<UserSerializer>(&user)?;
```

容器根与载体序列化器组合，并保持普通的跨语言 LIST、MAP、元组或数组表示：

```rust
use fory::VecSerializer;

let bytes =
    fory.serialize_with::<VecSerializer<UserSerializer>>(&users)?;
```

只接受可用跨语言模式表示的 Schema。带多个元组字段或命名字段的原生 Rust 枚举变体可使用 `xlang(false)`，但其序列化器注册会在跨语言模式中被拒绝。参见[外部类型序列化](external-types.md)。

#### 动态 Rust 载体

当每个选定具体目标都有兼容跨语言模式的结构化或 EXT 标识时，可以在跨语言模式中使用 `Box<dyn Any>`、`Rc<dyn Any>`、`Arc<dyn Any + Send + Sync>` 和应用 `dyn Trait` 载体。Fory 写入具体的已注册目标标识；Rust 特征或擦除载体标识不会出现在编码格式中。

#### Java（反序列化器）

```java
import org.apache.fory.*;
import org.apache.fory.config.*;

public class Person {
    public String name;
    public int age;
}

Fory fory = Fory.builder()
    .withXlang(true)
    .withRefTracking(true)
    .build();

fory.register(Person.class, 100);  // Same ID as Rust

Person person = (Person) fory.deserialize(bytesFromRust);
```

#### Python（反序列化器）

```python
import pyfory
from dataclasses import dataclass

@dataclass
class Person:
    name: str
    age: pyfory.Int32

fory = pyfory.Fory(xlang=True, ref=True)
fory.register_type(Person, type_id=100)  # Same ID as Rust

person = fory.deserialize(bytes_from_rust)
```

### 类型映射

完整的跨语言类型映射参见 [xlang_type_mapping.md](../../specification/xlang_type_mapping.md)。

#### 常见类型映射

| Rust            | Java           | Python          |
| --------------- | -------------- | --------------- |
| `i32`           | `int`          | `int32`         |
| `i64`           | `long`         | `int64`         |
| `f32`           | `float`        | `float32`       |
| `f64`           | `double`       | `float64`       |
| `Float16`       | `Float16`      | `float16`       |
| `BFloat16`      | `BFloat16`     | `bfloat16`      |
| `String`        | `String`       | `str`           |
| `Vec<T>`        | `List<T>`      | `List[T]`       |
| `Vec<Float16>`  | `Float16List`  | `Float16Array`  |
| `Vec<BFloat16>` | `BFloat16List` | `BFloat16Array` |
| `[Float16; N]`  | `Float16List`  | `Float16Array`  |
| `[BFloat16; N]` | `BFloat16List` | `BFloat16Array` |
| `HashMap<K,V>`  | `Map<K,V>`     | `Dict[K,V]`     |
| `Option<T>`     | nullable `T`   | `Optional[T]`   |

#### 列表与稠密数组

对于手写结构体，Rust `Vec<T>` 默认映射到 Fory `list<T>`。Schema 为稠密 `array<T>` 时，请使用显式数组字段属性。

| Fory Schema       | Rust 载体和元数据              |
| ----------------- | ------------------------------ |
| `list<int32>`     | `Vec<i32>`                     |
| `array<bool>`     | `#[fory(array)] Vec<bool>`     |
| `array<int8>`     | `#[fory(array)] Vec<i8>`       |
| `array<int16>`    | `#[fory(array)] Vec<i16>`      |
| `array<int32>`    | `#[fory(array)] Vec<i32>`      |
| `array<int64>`    | `#[fory(array)] Vec<i64>`      |
| `array<uint8>`    | `#[fory(array)] Vec<u8>`       |
| `array<uint16>`   | `#[fory(array)] Vec<u16>`      |
| `array<uint32>`   | `#[fory(array)] Vec<u32>`      |
| `array<uint64>`   | `#[fory(array)] Vec<u64>`      |
| `array<float16>`  | `#[fory(array)] Vec<Float16>`  |
| `array<bfloat16>` | `#[fory(array)] Vec<BFloat16>` |
| `array<float32>`  | `#[fory(array)] Vec<f32>`      |
| `array<float64>`  | `#[fory(array)] Vec<f64>`      |

### 互操作最佳实践

1. 在所有语言中**使用一致的类型 ID**
2. 为 Schema 演进**保持兼容模式**
3. 在序列化前**注册所有类型**
4. 开发期间**测试跨语言兼容性**

### 规范与参考

- [Xlang 序列化规范](../../specification/xlang_serialization_spec.md)
- [类型映射参考](../../specification/xlang_type_mapping.md)
- [Java Xlang 序列化指南](../java/basic-serialization.md#cross-language-interoperability)
- [Python Xlang 序列化指南](../python/basic-serialization.md#cross-language-interoperability)

### 相关指南

- [配置](configuration.md) - xlang 模式配置
- [Schema 演进](schema-evolution.md) - 兼容模式
- [类型注册](type-registration.md) - 注册方法
- [外部类型序列化](external-types.md) - xlang 模式中的第三方值

### 内置值

```rust
use fory::Fory;

fn run() {
    let fory = Fory::builder().xlang(true).build();
    let bin = fory.serialize(&"hello".to_string()).expect("serialize success");
    let obj: String = fory.deserialize(&bin).expect("deserialize success");
    assert_eq!("hello".to_string(), obj);
}
```

### 自定义值

```rust
use chrono::{NaiveDate, NaiveDateTime};
use fory::{Fory, ForyStruct};
use std::collections::HashMap;

#[test]
fn complex_struct() {
    #[derive(ForyStruct, Debug, PartialEq)]
    struct Animal {
        category: String,
    }

    #[derive(ForyStruct, Debug, PartialEq)]
    struct Person {
        c1: Vec<u8>,  // binary
        c2: Vec<i16>, // primitive array
        animal: Vec<Animal>,
        c3: Vec<Vec<u8>>,
        name: String,
        c4: HashMap<String, String>,
        age: u16,
        op: Option<String>,
        op2: Option<String>,
        date: NaiveDate,
        time: NaiveDateTime,
        c5: f32,
        c6: f64,
    }
    let person: Person = Person {
        c1: vec![1, 2, 3],
        c2: vec![5, 6, 7],
        c3: vec![vec![1, 2], vec![1, 3]],
        animal: vec![Animal {
            category: "Dog".to_string(),
        }],
        c4: HashMap::from([
            ("hello1".to_string(), "hello2".to_string()),
            ("hello2".to_string(), "hello3".to_string()),
        ]),
        age: 12,
        name: "helo".to_string(),
        op: Some("option".to_string()),
        op2: None,
        date: NaiveDate::from_ymd_opt(2025, 12, 12).unwrap(),
        time: NaiveDateTime::from_timestamp_opt(1689912359, 0).unwrap(),
        c5: 2.0,
        c6: 4.0,
    };

    let mut fory = Fory::builder().xlang(true).build();
    fory
        .register_by_name::<Animal>("example.foo2")
        .expect("register Animal");
    fory
        .register_by_name::<Person>("example.foo")
        .expect("register Person");
    let bin = fory.serialize(&person).expect("serialize success");
    let obj: Person = fory.deserialize(&bin).expect("deserialize success");
    assert_eq!(person, obj);
}
```

### 共享引用与循环引用

由于所有权限制，Rust 无法实现循环引用。

## 相关主题

- [类型注册](type-registration.md) - 注册类型
- [引用](references.md) - 共享引用与循环引用
- [自定义序列化器](custom-serializers.md) - 自定义序列化
- [外部类型序列化](external-types.md) - 第三方值和载体根值
- [Row Format](../../row-format/rust.md) - Standard Row Format 和零拷贝借用视图
