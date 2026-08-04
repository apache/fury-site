---
title: 跨语言序列化
sidebar_position: 1
id: xlang
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

Apache Fory™ 支持 Java、Python、C++、Go、Rust、JavaScript/TypeScript、C#、Swift、Dart、Scala 和 Kotlin 之间的无缝数据交换。

## 创建跨语言 Fory 实例

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

## 跨语言类型注册

### 按 ID 注册

为获得快速、紧凑的序列化，请在各语言中使用一致的 ID：

```rust
let mut fory = Fory::builder().xlang(true).build();

fory.register::<User>(100)?;  // Same ID in Java, Python, etc.
```

### 按名称注册

用于更灵活的类型命名：

```rust
fory.register_by_name::<User>("com.example.User")?;
```

## 跨语言示例

### Rust（序列化器）

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

### 第三方 Rust 类型

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

### 动态 Rust 载体

当每个选定具体目标都有兼容跨语言模式的结构化或 EXT 标识时，可以在跨语言模式中使用 `Box<dyn Any>`、`Rc<dyn Any>`、`Arc<dyn Any + Send + Sync>` 和应用 `dyn Trait` 载体。Fory 写入具体的已注册目标标识；Rust 特征或擦除载体标识不会出现在编码格式中。

### Java（反序列化器）

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

### Python（反序列化器）

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

## 类型映射

完整的跨语言类型映射参见 [xlang_type_mapping.md](../../specification/xlang_type_mapping.md)。

### 常见类型映射

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

### 列表与稠密数组

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

## 最佳实践

1. 在所有语言中**使用一致的类型 ID**
2. 为 Schema 演进**保持兼容模式**
3. 在序列化前**注册所有类型**
4. 开发期间**测试跨语言兼容性**

## 另请参阅

- [Xlang 序列化规范](../../specification/xlang_serialization_spec.md)
- [类型映射参考](../../specification/xlang_type_mapping.md)
- [Java Xlang 序列化指南](../java/xlang.md)
- [Python Xlang 序列化指南](../python/xlang.md)

## 相关主题

- [配置](configuration.md) - xlang 模式配置
- [Schema 演进](schema-evolution.md) - 兼容模式
- [类型注册](type-registration.md) - 注册方法
- [外部类型序列化](external-types.md) - xlang 模式中的第三方值

## 内置值

```rust
use fory::Fory;

fn run() {
    let fory = Fory::builder().xlang(true).build();
    let bin = fory.serialize(&"hello".to_string()).expect("serialize success");
    let obj: String = fory.deserialize(&bin).expect("deserialize success");
    assert_eq!("hello".to_string(), obj);
}
```

## 自定义值

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

## 共享引用与循环引用

由于所有权限制，Rust 无法实现循环引用。
