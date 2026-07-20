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

Apache Fory™ 支持在多种语言（包括 Java、Python、C++、Go 和 JavaScript）之间无缝进行数据交换。

## 启用xlang 模式

```rust
use fory::Fory;

// 启用xlang 模式
let mut fory = Fory::default()
    .compatible(true)
    .xlang(true);

// 使用跨语言一致的 ID 注册类型
fory.register::<MyStruct>(100);

// 或使用基于命名空间的注册
fory.register_by_namespace::<MyStruct>("com.example", "MyStruct");
```

## 跨语言类型注册

### 按 ID 注册

对于使用跨语言一致 ID 的快速、紧凑序列化：

```rust
let mut fory = Fory::default()
    .compatible(true)
    .xlang(true);

fory.register::<User>(100);  // 在 Java、Python 等中使用相同的 ID
```

### 按命名空间注册

对于更灵活的类型命名：

```rust
fory.register_by_namespace::<User>("com.example", "User");
```

## 跨语言示例

### Rust（序列化器）

```rust
use fory::Fory;
use fory::ForyObject;

#[derive(ForyObject)]
struct Person {
    name: String,
    age: i32,
}

let mut fory = Fory::default()
    .compatible(true)
    .xlang(true);

fory.register::<Person>(100);

let person = Person {
    name: "Alice".to_string(),
    age: 30,
};

let bytes = fory.serialize(&person)?;
// bytes 可以被 Java、Python 等反序列化
```

### Java（反序列化器）

```java
import org.apache.fory.*;
import org.apache.fory.config.*;

public class Person {
    public String name;
    public int age;
}

Fory fory = Fory.builder()
    .withLanguage(Language.XLANG)
    .withRefTracking(true)
    .build();

fory.register(Person.class, 100);  // 与 Rust 使用相同的 ID

Person person = (Person) fory.deserialize(bytesFromRust);
```

### Python（反序列化器）

```python
import pyfory
from dataclasses import dataclass

@dataclass
class Person:
    name: str
    age: pyfory.int32

fory = pyfory.Fory(ref_tracking=True)
fory.register_type(Person, type_id=100)  # 与 Rust 使用相同的 ID

person = fory.deserialize(bytes_from_rust)
```

## 类型映射

有关跨语言完整类型映射，请参阅 [xlang_type_mapping.md](https://fory.apache.org/docs/specification/xlang_type_mapping)。

### 常见类型映射

| Rust           | Java       | Python        |
| -------------- | ---------- | ------------- |
| `i32`          | `int`      | `int32`       |
| `i64`          | `long`     | `int64`       |
| `f32`          | `float`    | `float32`     |
| `f64`          | `double`   | `float64`     |
| `String`       | `String`   | `str`         |
| `Vec<T>`       | `List<T>`  | `List[T]`     |
| `HashMap<K,V>` | `Map<K,V>` | `Dict[K,V]`   |
| `Option<T>`    | 可空 `T`   | `Optional[T]` |

## 最佳实践

1. **使用一致的类型 ID**：在所有语言中使用相同的 ID
2. **启用 compatible 模式**：用于 schema 演化
3. **注册所有类型**：在序列化之前
4. **测试跨语言**：在开发期间测试兼容性

## 另请参阅

- [xlang 序列化规范](https://fory.apache.org/docs/next/specification/fory_xlang_serialization_spec)
- [类型映射参考](https://fory.apache.org/docs/next/specification/xlang_type_mapping)
- [Java 跨语言指南](../java/xlang-serialization.md)
- [Python 跨语言指南](../python/xlang-serialization.md)

## 相关主题

- [配置](configuration.md) - XLANG 模式配置
- [Schema 演化](schema-evolution.md) - Compatible 模式
- [类型注册](type-registration.md) - 注册方法
