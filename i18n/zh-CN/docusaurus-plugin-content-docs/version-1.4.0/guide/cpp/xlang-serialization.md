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

本页介绍如何使用 Fory 在 C++ 和其他语言之间进行xlang 序列化。

## 概述

Apache Fory™ 支持在 C++、Java、Python、Go、Rust 和 JavaScript 之间无缝交换数据。xlang（跨语言）模式确保所有支持语言之间的二进制兼容性。

## 启用xlang 模式

```cpp
#include "fory/serialization/fory.h"

using namespace fory::serialization;

auto fory = Fory::builder()
    .xlang(true)  // 启用xlang 模式
    .build();
```

## 跨语言示例

### C++ 生产者

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
    // 写入文件、通过网络发送等
    std::ofstream file("message.bin", std::ios::binary);
    file.write(reinterpret_cast<const char*>(bytes.data()), bytes.size());
  }
  return 0;
}
```

### Java 消费者

```java
import org.apache.fory.Fory;
import org.apache.fory.config.Language;

public class Message {
    public String topic;
    public long timestamp;
    public Map<String, String> headers;
    public byte[] payload;
}

public class Consumer {
    public static void main(String[] args) throws Exception {
        Fory fory = Fory.builder()
            .withLanguage(Language.XLANG)
            .build();
        fory.register(Message.class, 100);  // 与 C++ 相同的 ID

        byte[] bytes = Files.readAllBytes(Path.of("message.bin"));
        Message msg = (Message) fory.deserialize(bytes);

        System.out.println("Topic: " + msg.topic);
        System.out.println("Timestamp: " + msg.timestamp);
    }
}
```

### Python 消费者

```python
import pyfory

class Message:
    topic: str
    timestamp: int
    headers: dict[str, str]
    payload: bytes

fory = pyfory.Fory()
fory.register(Message, type_id=100)  # 与 C++ 相同的 ID

with open("message.bin", "rb") as f:
    data = f.read()

msg = fory.deserialize(data)
print(f"Topic: {msg.topic}")
print(f"Timestamp: {msg.timestamp}")
```

## 类型映射

### 基本类型

| C++ 类型  | Java 类型 | Python 类型 | Go 类型   | Rust 类型 |
| --------- | --------- | ----------- | --------- | --------- |
| `bool`    | `boolean` | `bool`      | `bool`    | `bool`    |
| `int8_t`  | `byte`    | `int`       | `int8`    | `i8`      |
| `int16_t` | `short`   | `int`       | `int16`   | `i16`     |
| `int32_t` | `int`     | `int`       | `int32`   | `i32`     |
| `int64_t` | `long`    | `int`       | `int64`   | `i64`     |
| `float`   | `float`   | `float`     | `float32` | `f32`     |
| `double`  | `double`  | `float`     | `float64` | `f64`     |

### 字符串类型

| C++ 类型      | Java 类型 | Python 类型 | Go 类型  | Rust 类型 |
| ------------- | --------- | ----------- | -------- | --------- |
| `std::string` | `String`  | `str`       | `string` | `String`  |

### 集合类型

| C++ 类型         | Java 类型  | Python 类型 | Go 类型          |
| ---------------- | ---------- | ----------- | ---------------- |
| `std::vector<T>` | `List<T>`  | `list`      | `[]T`            |
| `std::set<T>`    | `Set<T>`   | `set`       | `map[T]struct{}` |
| `std::map<K,V>`  | `Map<K,V>` | `dict`      | `map[K]V`        |

### 时间类型

| C++ 类型          | Java 类型   | Python 类型     | Go 类型         |
| ----------------- | ----------- | --------------- | --------------- |
| `fory::Timestamp` | `Instant`   | `datetime`      | `time.Time`     |
| `fory::Duration`  | `Duration`  | `timedelta`     | `time.Duration` |
| `fory::Date`      | `LocalDate` | `datetime.date` | `time.Time`     |

## 字段顺序要求

**关键：** 字段将按照其 snake_cased 字段名排序，转换后的名称必须在各语言之间保持一致

### C++

```cpp
struct Person {
  std::string name;   // 字段 0
  int32_t age;        // 字段 1
  std::string email;  // 字段 2
};
FORY_STRUCT(Person, name, age, email);  // 顺序很重要！
```

### Java

```java
public class Person {
    public String name;   // 字段 0
    public int age;       // 字段 1
    public String email;  // 字段 2
}
```

### Python

```python
class Person:
    name: str    # 字段 0
    age: int     # 字段 1
    email: str   # 字段 2
```

## 类型 ID 一致性

所有语言必须使用相同的类型 ID：

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

## Compatible 模式

用于跨语言边界的 schema 演化：

```cpp
// 使用 compatible 模式的 C++
auto fory = Fory::builder()
    .xlang(true)
    .compatible(true)  // 启用 schema 演化
    .build();
```

Compatible 模式允许：

- 添加新字段（带默认值）
- 删除未使用的字段
- 重排字段顺序

## 故障排查

### 类型不匹配错误

```
Error: Type mismatch: expected 100, got 101
```

**解决方案：** 确保类型 ID 在所有语言中匹配。

### 编码错误

```
Error: Invalid UTF-8 sequence
```

**解决方案：** 确保所有语言中的字符串都是有效的 UTF-8。

## 相关主题

- [配置](configuration.md) - 构建器选项
- [类型注册](type-registration.md) - 注册类型
- [支持的类型](supported-types.md) - 类型兼容性
