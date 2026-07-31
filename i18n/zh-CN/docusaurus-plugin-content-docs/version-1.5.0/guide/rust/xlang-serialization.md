---
title: Xlang 序列化
sidebar_position: 2
id: xlang_serialization
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

Apache Fory™ 支持在 Java、Python、C++、Go、Rust、JavaScript/TypeScript、C#、Swift、Dart、Scala 和 Kotlin 之间无缝交换数据。

## 创建 Xlang Fory 实例

Rust 默认使用 xlang 模式和兼容的 Schema 演进。在 xlang 示例中请显式设置该模式：

```rust
use fory::Fory;

// 使用 xlang 模式
let mut fory = Fory::builder().xlang(true).build();

// 使用跨语言一致的 ID 注册类型
fory.register::<MyStruct>(100)?;

// 或者，在另一个 Fory 实例中使用名称注册
// fory.register_by_name::<MyStruct>("com.example.MyStruct")?;
```

## Xlang 类型注册

### 按 ID 注册

使用跨语言一致的 ID，可实现快速、紧凑的序列化：

```rust
let mut fory = Fory::builder().xlang(true).build();

fory.register::<User>(100)?;  // 在 Java、Python 等语言中使用相同的 ID
```

### 按名称注册

需要更灵活的类型命名时：

```rust
fory.register_by_name::<User>("com.example.User")?;
```

## Xlang 示例

### Rust（序列化端）

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
// bytes 可以由 Java、Python 等语言反序列化
```

### 第三方 Rust 类型

外部结构化序列化器可以为第三方 Rust 类型提供与等价本地派生类型相同的 xlang Schema：

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

容器根值可以与承载序列化器组合，并保留普通的 xlang `LIST`、`MAP`、tuple 或 array 表示：

```rust
use fory::VecSerializer;

let bytes =
    fory.serialize_with::<VecSerializer<UserSerializer>>(&users)?;
```

只有可用 xlang 表示的 Schema 才会被接受。包含多个 tuple 字段或具名字段的 Rust native 枚举变体可以在 `xlang(false)` 下使用，但其序列化器无法在 xlang 模式下注册。请参阅[外部类型序列化](external-types.md)。

### 动态 Rust 承载类型

当所选的每个具体目标都具有与 xlang 兼容的结构化身份或 `EXT` 身份时，`Box<dyn Any>`、`Rc<dyn Any>`、`Arc<dyn Any + Send + Sync>` 和应用程序 `dyn Trait` 承载类型都可以在 xlang 模式中使用。Fory 会写入已注册的具体目标身份；Rust trait 或类型擦除承载类型的身份不会出现在编码数据中。

### Java（反序列化端）

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

fory.register(Person.class, 100);  // 与 Rust 使用相同的 ID

Person person = (Person) fory.deserialize(bytesFromRust);
```

### Python（反序列化端）

```python
import pyfory
from dataclasses import dataclass

@dataclass
class Person:
    name: str
    age: pyfory.Int32

fory = pyfory.Fory(xlang=True, ref=True)
fory.register_type(Person, type_id=100)  # 与 Rust 使用相同的 ID

person = fory.deserialize(bytes_from_rust)
```

## 类型映射

有关完整的跨语言类型映射，请参阅 [xlang_type_mapping.md](../../specification/xlang_type_mapping.md)。

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
| `Option<T>`     | 可空 `T`       | `Optional[T]`   |

### List 与紧凑 Array

对于手写结构体，Rust `Vec<T>` 默认映射为 Fory `list<T>`。当 Schema 是紧凑 `array<T>` 时，请使用显式 array 字段属性。

| Fory Schema       | Rust 承载类型和元数据           |
| ----------------- | ------------------------------- |
| `list<int32>`     | `Vec<i32>`                      |
| `array<bool>`     | `#[fory(array)] Vec<bool>`      |
| `array<int8>`     | `#[fory(array)] Vec<i8>`        |
| `array<int16>`    | `#[fory(array)] Vec<i16>`       |
| `array<int32>`    | `#[fory(array)] Vec<i32>`       |
| `array<int64>`    | `#[fory(array)] Vec<i64>`       |
| `array<uint8>`    | `#[fory(array)] Vec<u8>`        |
| `array<uint16>`   | `#[fory(array)] Vec<u16>`       |
| `array<uint32>`   | `#[fory(array)] Vec<u32>`       |
| `array<uint64>`   | `#[fory(array)] Vec<u64>`       |
| `array<float16>`  | `#[fory(array)] Vec<Float16>`   |
| `array<bfloat16>` | `#[fory(array)] Vec<BFloat16>`  |
| `array<float32>`  | `#[fory(array)] Vec<f32>`       |
| `array<float64>`  | `#[fory(array)] Vec<f64>`       |

## 最佳实践

1. **使用一致的类型 ID**：所有语言都使用相同的 ID
2. **保持兼容模式启用**：支持 Schema 演进
3. **注册所有类型**：在序列化之前完成注册
4. **测试跨语言兼容性**：在开发期间进行互操作测试

## 另请参阅

- [Xlang 序列化规范](../../specification/xlang_serialization_spec.md)
- [类型映射参考](../../specification/xlang_type_mapping.md)
- [Java Xlang 序列化指南](../java/xlang-serialization.md)
- [Python Xlang 序列化指南](../python/xlang-serialization.md)

## 相关主题

- [配置](configuration.md) - xlang 模式配置
- [Schema 演进](schema-evolution.md) - 兼容模式
- [类型注册](type-registration.md) - 注册方法
- [外部类型序列化](external-types.md) - xlang 模式中的第三方值
