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

本文说明如何在 C++ 与其他语言之间使用 Fory 跨语言序列化。

## 概述

Apache Fory™ 支持 C++、Java、Python、Go、Rust、JavaScript/TypeScript、C#、Swift、Dart、Scala 和 Kotlin 之间的无缝数据交换。跨语言模式确保所有受支持语言之间的二进制兼容性。

## 创建跨语言 Fory 实例

C++ 默认使用跨语言模式，兼容 Schema 演进也是该模式的默认设置。跨语言示例中应显式设置模式：

```cpp
#include "fory/serialization/fory.h"

using namespace fory::serialization;

auto fory = Fory::builder().xlang(true).build();
```

## 跨语言示例

### C++ 生产端

```cpp
#include "fory/serialization/fory.h"
#include <fstream>

using namespace fory::serialization;

struct Message {
  std::string topic;
  int64_t timestamp;
  std::map<std::string, std::string> headers;
  std::vector<uint8_t> payload;

  bool operator==(const Message &other) const {
    return topic == other.topic && timestamp == other.timestamp &&
           headers == other.headers && payload == other.payload;
  }
};
FORY_STRUCT(Message, topic, timestamp, headers, payload);

int main() {
  auto fory = Fory::builder().xlang(true).build();
  fory.register_struct<Message>(100);

  Message msg{
      "events.user",
      1699999999000,
      {{"content-type", "application/json"}},
      {'h', 'e', 'l', 'l', 'o'}
  };

  auto result = fory.serialize(msg);
  if (result.ok()) {
    auto bytes = std::move(result).value();
    // write to file, send over network, etc.
    std::ofstream file("message.bin", std::ios::binary);
    file.write(reinterpret_cast<const char*>(bytes.data()), bytes.size());
  }
  return 0;
}
```

### Java 消费端

```java
import org.apache.fory.Fory;

public class Message {
    public String topic;
    public long timestamp;
    public Map<String, String> headers;
    public byte[] payload;
}

public class Consumer {
    public static void main(String[] args) throws Exception {
        Fory fory = Fory.builder()
            .withXlang(true)
            .build();
        fory.register(Message.class, 100);  // Same ID as C++

        byte[] bytes = Files.readAllBytes(Path.of("message.bin"));
        Message msg = (Message) fory.deserialize(bytes);

        System.out.println("Topic: " + msg.topic);
        System.out.println("Timestamp: " + msg.timestamp);
    }
}
```

### Python 消费端

```python
import pyfory

class Message:
    topic: str
    timestamp: int
    headers: dict[str, str]
    payload: bytes

fory = pyfory.Fory(xlang=True)
fory.register(Message, type_id=100)  # Same ID as C++

with open("message.bin", "rb") as f:
    data = f.read()

msg = fory.deserialize(data)
print(f"Topic: {msg.topic}")
print(f"Timestamp: {msg.timestamp}")
```

## 类型映射

### 原始类型

| C++ Type           | Java Type  | Python Type       | Go Type             | Rust Type  |
| ------------------ | ---------- | ----------------- | ------------------- | ---------- |
| `bool`             | `boolean`  | `bool`            | `bool`              | `bool`     |
| `int8_t`           | `byte`     | `int`             | `int8`              | `i8`       |
| `int16_t`          | `short`    | `int`             | `int16`             | `i16`      |
| `int32_t`          | `int`      | `int`             | `int32`             | `i32`      |
| `int64_t`          | `long`     | `int`             | `int64`             | `i64`      |
| `float`            | `float`    | `float`           | `float32`           | `f32`      |
| `double`           | `double`   | `float`           | `float64`           | `f64`      |
| `fory::float16_t`  | `Float16`  | `pyfory.Float16`  | `float16.Float16`   | `Float16`  |
| `fory::bfloat16_t` | `BFloat16` | `pyfory.BFloat16` | `bfloat16.BFloat16` | `BFloat16` |

### 字符串类型

| C++ Type      | Java Type | Python Type | Go Type  | Rust Type |
| ------------- | --------- | ----------- | -------- | --------- |
| `std::string` | `String`  | `str`       | `string` | `String`  |

### 集合类型

| C++ Type                                    | Java Type      | Python Type     | Go Type               | Rust Type       |
| ------------------------------------------- | -------------- | --------------- | --------------------- | --------------- |
| `std::vector<T>`                            | `List<T>`      | `list`          | `[]T`                 | `Vec<T>`        |
| `std::vector<fory::float16_t>`              | `Float16List`  | `Float16Array`  | `[]float16.Float16`   | `Vec<Float16>`  |
| `std::vector<fory::bfloat16_t>`             | `BFloat16List` | `BFloat16Array` | `[]bfloat16.BFloat16` | `Vec<BFloat16>` |
| `std::set<T>`                               | `Set<T>`       | `set`           | `map[T]struct{}`      | `HashSet<T>`    |
| `std::map<K,V>` / `std::unordered_map<K,V>` | `Map<K,V>`     | `dict`          | `map[K]V`             | `HashMap<K,V>`  |

### 列表与稠密数组

在手写 C++ 结构体中，`std::vector<T>` 默认映射到 Fory `list<T>`。当 Schema 是稠密 `array<T>` 时，请使用字段元数据 DSL 的数组节点。

| Fory Schema       | C++ 元数据示例                           |
| ----------------- | ---------------------------------------- |
| `list<int32>`     | `fory::F(id).list(fory::T::int32())`     |
| `array<bool>`     | `fory::F(id).array(fory::T::bool_())`    |
| `array<int8>`     | `fory::F(id).array(fory::T::int8())`     |
| `array<int16>`    | `fory::F(id).array(fory::T::int16())`    |
| `array<int32>`    | `fory::F(id).array(fory::T::int32())`    |
| `array<int64>`    | `fory::F(id).array(fory::T::int64())`    |
| `array<uint8>`    | `fory::F(id).array(fory::T::uint8())`    |
| `array<uint16>`   | `fory::F(id).array(fory::T::uint16())`   |
| `array<uint32>`   | `fory::F(id).array(fory::T::uint32())`   |
| `array<uint64>`   | `fory::F(id).array(fory::T::uint64())`   |
| `array<float16>`  | `fory::F(id).array(fory::T::float16())`  |
| `array<bfloat16>` | `fory::F(id).array(fory::T::bfloat16())` |
| `array<float32>`  | `fory::F(id).array(fory::T::float32())`  |
| `array<float64>`  | `fory::F(id).array(fory::T::float64())`  |

### 时间类型

| C++ Type          | Java Type   | Python Type     | Go Type         |
| ----------------- | ----------- | --------------- | --------------- |
| `fory::Timestamp` | `Instant`   | `datetime`      | `time.Time`     |
| `fory::Duration`  | `Duration`  | `timedelta`     | `time.Duration` |
| `fory::Date`      | `LocalDate` | `datetime.date` | `time.Time`     |

## 字段顺序要求

**重要：**字段按 snake_case 字段名称排序，转换后的名称必须在各语言之间一致。

### C++

```cpp
struct Person {
  std::string name;   // Field 0
  int32_t age;        // Field 1
  std::string email;  // Field 2
};
FORY_STRUCT(Person, name, age, email);  // Order matters!
```

### Java

```java
public class Person {
    public String name;   // Field 0
    public int age;       // Field 1
    public String email;  // Field 2
}
```

### Python

```python
class Person:
    name: str    # Field 0
    age: int     # Field 1
    email: str   # Field 2
```

## 类型 ID 一致性

所有语言都必须使用相同的类型 ID：

```cpp
// C++
fory.register_struct<Person>(100);
fory.register_struct<Address>(101);
fory.register_struct<Order>(102);
```

```java
// Java
fory.register(Person.class, 100);
fory.register(Address.class, 101);
fory.register(Order.class, 102);
```

```python
# Python
fory.register(Person, type_id=100)
fory.register(Address, type_id=101)
fory.register(Order, type_id=102)
```

## 兼容模式

跨语言模式默认已使用兼容 Schema 演进。对于可能独立演进的 Schema，请保留该默认设置：

```cpp
auto fory = Fory::builder().xlang(true).build();
```

兼容模式允许：

- 添加新字段（带默认值）
- 删除未使用的字段
- 重排字段

## 故障排查

### 类型不匹配错误

```
Error: Type mismatch: expected 100, got 101
```

**解决方案：**确保所有语言的类型 ID 一致。

### 编码错误

```
Error: Invalid UTF-8 sequence
```

**解决方案：**确保所有语言中的字符串都是有效的 UTF-8。

## 相关主题

- [配置](configuration.md) - 构建器选项
- [类型注册](type-registration.md) - 注册类型
- [支持的类型](supported-types.md) - 类型兼容性
