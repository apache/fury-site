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

`pyfory` 支持跨语言对象图序列化，允许您在 Python 中序列化数据，并在 Java、Go、Rust 或其他支持的语言中反序列化。

## 启用xlang 模式

要使用 xlang 模式，创建 `Fory` 时设置 `xlang=True`：

```python
import pyfory
fory = pyfory.Fory(xlang=True, ref=False, strict=True)
```

## 跨语言示例

### Python（序列化器）

```python
import pyfory
from dataclasses import dataclass

# xlang 模式实现互操作性
f = pyfory.Fory(xlang=True, ref=True)

# 注册类型以实现跨语言兼容性
@dataclass
class Person:
    name: str
    age: pyfory.int32

f.register(Person, typename="example.Person")

person = Person("Charlie", 35)
binary_data = f.serialize(person)
# binary_data 现在可以发送到 Java、Go 等
```

### Java（反序列化器）

```java
import org.apache.fory.*;

public class Person {
    public String name;
    public int age;
}

Fory fory = Fory.builder()
    .withLanguage(Language.XLANG)
    .withRefTracking(true)
    .build();

fory.register(Person.class, "example.Person");
Person person = (Person) fory.deserialize(binaryData);
```

### Rust（反序列化器）

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

fory.register_by_namespace::<Person>("example", "Person");
let person: Person = fory.deserialize(&binary_data)?;
```

## 跨语言的类型注解

使用 pyfory 类型注解进行显式跨语言类型映射：

```python
from dataclasses import dataclass
import pyfory

@dataclass
class TypedData:
    int_value: pyfory.int32      # 32 位整数
    long_value: pyfory.int64     # 64 位整数
    float_value: pyfory.float32  # 32 位浮点数
    double_value: pyfory.float64 # 64 位浮点数
```

## 类型映射

| Python           | Java     | Rust      | Go        |
| ---------------- | -------- | --------- | --------- |
| `str`            | `String` | `String`  | `string`  |
| `int`            | `long`   | `i64`     | `int64`   |
| `pyfory.int32`   | `int`    | `i32`     | `int32`   |
| `pyfory.int64`   | `long`   | `i64`     | `int64`   |
| `float`          | `double` | `f64`     | `float64` |
| `pyfory.float32` | `float`  | `f32`     | `float32` |
| `list`           | `List`   | `Vec`     | `[]T`     |
| `dict`           | `Map`    | `HashMap` | `map[K]V` |

## 与 Python 原生模式的区别

二进制协议和 API 与 `pyfory` 的 Python 原生模式类似，但 Python 原生模式可以序列化任何 Python 对象——包括全局函数、局部函数、lambda、局部类以及使用 `__getstate__/__reduce__/__reduce_ex__` 自定义序列化的类型，这些在 xlang 模式中**不允许**。

## 另请参阅

- [xlang 序列化规范](https://fory.apache.org/docs/next/specification/fory_xlang_serialization_spec)
- [类型映射参考](https://fory.apache.org/docs/next/specification/xlang_type_mapping)
- [Java 跨语言指南](../java/xlang-serialization.md)
- [Rust 跨语言指南](../rust/xlang-serialization.md)

## 相关主题

- [配置](configuration.md) - XLANG 模式设置
- [Schema 演化](schema-evolution.md) - 兼容模式
- [类型注册](type-registration.md) - 注册模式
