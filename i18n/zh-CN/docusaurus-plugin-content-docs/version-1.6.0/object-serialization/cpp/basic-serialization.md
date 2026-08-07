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

本文介绍 Fory C++ 默认 xlang 模式下的基本对象图序列化和核心序列化 API。

## 对象图序列化

Apache Fory™ 可自动序列化复杂对象图，并保留对象之间的结构和关系。`FORY_STRUCT` 宏在编译期生成高效序列化代码，从而消除反射开销。

**主要能力：**

- 任意深度的嵌套结构体序列化
- 集合类型（vector、set、map）
- 使用 `std::optional<T>` 的可选字段
- 智能指针（`std::shared_ptr`、`std::unique_ptr`）
- 自动处理原始类型和字符串
- 使用变长整数的高效二进制编码

```cpp
#include "fory/serialization/fory.h"
#include <vector>
#include <map>

using namespace fory::serialization;

// Define structs
struct Address {
  std::string street;
  std::string city;
  std::string country;

  bool operator==(const Address &other) const {
    return street == other.street && city == other.city &&
           country == other.country;
  }
};
FORY_STRUCT(Address, street, city, country);

struct Person {
  std::string name;
  int32_t age;
  Address address;
  std::vector<std::string> hobbies;
  std::map<std::string, std::string> metadata;

  bool operator==(const Person &other) const {
    return name == other.name && age == other.age &&
           address == other.address && hobbies == other.hobbies &&
           metadata == other.metadata;
  }
};
FORY_STRUCT(Person, name, age, address, hobbies, metadata);

int main() {
  auto fory = Fory::builder().xlang(true).build();
  fory.register_struct<Address>(100);
  fory.register_struct<Person>(200);

  Person person{
      "John Doe",
      30,
      {"123 Main St", "New York", "USA"},
      {"reading", "coding"},
      {{"role", "developer"}}
  };

  auto result = fory.serialize(person);
  auto decoded = fory.deserialize<Person>(result.value());
  assert(person == decoded.value());
}
```

## 序列化 API

### 序列化到新 Vector

```cpp
auto fory = Fory::builder().xlang(true).build();
fory.register_struct<MyStruct>(1);

MyStruct obj{/* ... */};

// Serialize - returns Result<std::vector<uint8_t>, Error>
auto result = fory.serialize(obj);
if (result.ok()) {
  std::vector<uint8_t> bytes = std::move(result).value();
  // Use bytes...
} else {
  // Handle error
  std::cerr << result.error().to_string() << std::endl;
}
```

### 序列化到现有缓冲区

```cpp
// Serialize to existing Buffer (fastest path)
Buffer buffer;
auto result = fory.serialize_to(buffer, obj);
if (result.ok()) {
  size_t bytes_written = result.value();
  // buffer now contains serialized data
}

// Serialize to existing vector (zero-copy)
std::vector<uint8_t> output;
auto result = fory.serialize_to(output, obj);
if (result.ok()) {
  size_t bytes_written = result.value();
  // output now contains serialized data
}
```

### 从字节数组反序列化

```cpp
// Deserialize from raw pointer
auto result = fory.deserialize<MyStruct>(data_ptr, data_size);
if (result.ok()) {
  MyStruct obj = std::move(result).value();
}

// Deserialize from vector
std::vector<uint8_t> data = /* ... */;
auto result = fory.deserialize<MyStruct>(data);

// Deserialize from Buffer (updates reader_index)
Buffer buffer(data);
auto result = fory.deserialize<MyStruct>(buffer);
```

## 错误处理

Fory 使用 `Result<T, Error>` 类型处理错误：

```cpp
auto result = fory.serialize(obj);

// Check if operation succeeded
if (result.ok()) {
  auto value = std::move(result).value();
  // Use value...
} else {
  Error error = result.error();
  std::cerr << "Error: " << error.to_string() << std::endl;
}

// Or use FORY_TRY macro for early return
FORY_TRY(bytes, fory.serialize(obj));
// Use bytes directly...
```

常见错误类型：

- `Error::type_mismatch` - 反序列化期间类型 ID 不匹配
- `Error::invalid_data` - 数据无效或损坏
- `Error::buffer_out_of_bound` - 缓冲区溢出或下溢
- `Error::type_error` - 类型注册错误

## FORY_STRUCT 宏

`FORY_STRUCT` 宏注册用于序列化的类（结构体的用法相同）：

```cpp
class MyStruct {
public:
  int32_t x;
  std::string y;
  std::vector<int32_t> z;
  FORY_STRUCT(MyStruct, x, y, z);
};
```

将宏放在 `public:` 区域时支持私有字段：

```cpp
class PrivateUser {
public:
  PrivateUser(int32_t id, std::string name) : id_(id), name_(std::move(name)) {}

  bool operator==(const PrivateUser &other) const {
    return id_ == other.id_ && name_ == other.name_;
  }

private:
  int32_t id_ = 0;
  std::string name_;

public:
  FORY_STRUCT(PrivateUser, id_, name_);
};
```

### 访问器属性

当序列化字段通过访问器方法而非数据成员公开时，请使用 `FORY_PROPERTY`。这样仍会将类型注册为普通结构体类型：

```cpp
struct AccountImpl {
  int32_t id = 0;
};

class Account {
public:
  explicit Account(AccountImpl *impl) : impl_(impl) {}

  const int32_t &id() const { return impl_->id; }
  Account &id(int32_t value) {
    impl_->id = value;
    return *this;
  }

private:
  AccountImpl *impl_ = nullptr;

public:
  FORY_STRUCT(Account, FORY_PROPERTY(id));
};
```

`FORY_PROPERTY(id)` 调用 `obj.id()` 读取字段，并调用 `obj.id(value)` 写入字段。字段类型根据移除 cv 限定符和引用后的 const getter 返回类型推断，因此 `const int32_t &` 会被视为 `int32_t`。

当 getter 和 setter 名称不同时，使用三参数形式：

```cpp
class User {
public:
  const int32_t &get_id() const;
  void set_id(int32_t value);

  FORY_STRUCT(User, FORY_PROPERTY(id, get_id, set_id));
};
```

字段元数据可作为最后一个参数附加：

```cpp
FORY_STRUCT(Account, FORY_PROPERTY(id, fory::F().varint()));
FORY_STRUCT(User, FORY_PROPERTY(id, get_id, set_id, fory::F(1).varint()));
```

在命名空间作用域声明 `FORY_STRUCT` 时，访问器方法必须为 public。对于私有 PIMPL 访问器或私有数据成员，请将 `FORY_STRUCT` 放在类内部的 `public:` 区域。

该宏会：

1. 生成编译期字段元数据
2. 为序列化启用成员或 ADL（参数依赖查找）发现
3. 通过模板特化创建高效序列化代码

**要求：**

- 必须在类定义内部（结构体用法相同）或命名空间作用域声明
- 在类内部使用时，必须放在所有字段声明之后
- 在类内部使用时，宏必须放在 `public:` 区域
- 列出的所有字段都必须是可序列化类型
- 宏中的字段顺序不重要

## 外部/第三方类型

无法修改第三方类型时，请在命名空间作用域使用 `FORY_STRUCT`。这种方式仅适用于公共数据成员或公共访问器方法。

```cpp
namespace thirdparty {
struct Foo {
  int32_t id;
  std::string name;
};

FORY_STRUCT(Foo, id, name);
} // namespace thirdparty
```

**限制：**

- 必须在与类型相同的命名空间中、命名空间作用域声明
- 仅支持公共数据成员或访问器方法

## 继承字段

要在派生类型中包含基类字段，请使用 `FORY_BASE(Base)` 并将其放入 `FORY_STRUCT`。基类必须定义自己的 `FORY_STRUCT`，以便引用其字段。

```cpp
struct Base {
  int32_t a;
  FORY_STRUCT(Base, a);
};

struct Derived : Base {
  int32_t b;
  FORY_STRUCT(Derived, FORY_BASE(Base), b);
};
```

**注意：**

- 基类字段在派生类字段之前序列化。
- 仅支持派生类型可见的字段。

## 嵌套结构体

完全支持嵌套结构体：

```cpp
struct Inner {
  int32_t value;
  FORY_STRUCT(Inner, value);
};

struct Outer {
  Inner inner;
  std::string label;
  FORY_STRUCT(Outer, inner, label);
};

// Both must be registered
fory.register_struct<Inner>(1);
fory.register_struct<Outer>(2);
```

## 性能技巧

- **复用缓冲区**：对预分配缓冲区使用 `serialize_to(buffer, obj)`
- **预先注册**：在序列化开始前注册所有类型
- **单线程**：可行时使用 `build()`，而非 `build_thread_safe()`
- **禁用跟踪**：不需要引用时使用 `track_ref(false)`
- **紧凑编码**：使用变长编码提高空间效率

## 跨语言互操作 {#cross-language-interoperability}

所有受支持的 Fory 实现都共用默认 xlang 格式。以下内容说明它的跨语言类型映射、类型标识和互操作要求。

本文说明如何在 C++ 与其他语言之间使用 Fory 跨语言序列化。

### 概述

Apache Fory™ 支持 C++、Java、Python、Go、Rust、JavaScript/TypeScript、C#、Swift、Dart、Scala 和 Kotlin 之间的无缝数据交换。跨语言模式确保所有受支持语言之间的二进制兼容性。

### Xlang 配置

C++ 默认使用跨语言模式，兼容 Schema 演进也是该模式的默认设置。跨语言示例中应显式设置模式：

```cpp
#include "fory/serialization/fory.h"

using namespace fory::serialization;

auto fory = Fory::builder().xlang(true).build();
```

### 跨语言示例

#### C++ 生产端

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

#### Java 消费端

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

#### Python 消费端

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

### 类型映射

#### 原始类型

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

#### 字符串类型

| C++ Type      | Java Type | Python Type | Go Type  | Rust Type |
| ------------- | --------- | ----------- | -------- | --------- |
| `std::string` | `String`  | `str`       | `string` | `String`  |

#### 集合类型

| C++ Type                                    | Java Type      | Python Type     | Go Type               | Rust Type       |
| ------------------------------------------- | -------------- | --------------- | --------------------- | --------------- |
| `std::vector<T>`                            | `List<T>`      | `list`          | `[]T`                 | `Vec<T>`        |
| `std::vector<fory::float16_t>`              | `Float16List`  | `Float16Array`  | `[]float16.Float16`   | `Vec<Float16>`  |
| `std::vector<fory::bfloat16_t>`             | `BFloat16List` | `BFloat16Array` | `[]bfloat16.BFloat16` | `Vec<BFloat16>` |
| `std::set<T>`                               | `Set<T>`       | `set`           | `map[T]struct{}`      | `HashSet<T>`    |
| `std::map<K,V>` / `std::unordered_map<K,V>` | `Map<K,V>`     | `dict`          | `map[K]V`             | `HashMap<K,V>`  |

#### 列表与稠密数组

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

#### 时间类型

| C++ Type          | Java Type   | Python Type     | Go Type         |
| ----------------- | ----------- | --------------- | --------------- |
| `fory::Timestamp` | `Instant`   | `datetime`      | `time.Time`     |
| `fory::Duration`  | `Duration`  | `timedelta`     | `time.Duration` |
| `fory::Date`      | `LocalDate` | `datetime.date` | `time.Time`     |

### 字段顺序要求

**重要：**字段按 snake_case 字段名称排序，转换后的名称必须在各语言之间一致。

#### C++

```cpp
struct Person {
  std::string name;   // Field 0
  int32_t age;        // Field 1
  std::string email;  // Field 2
};
FORY_STRUCT(Person, name, age, email);  // Order matters!
```

#### Java

```java
public class Person {
    public String name;   // Field 0
    public int age;       // Field 1
    public String email;  // Field 2
}
```

#### Python

```python
class Person:
    name: str    # Field 0
    age: int     # Field 1
    email: str   # Field 2
```

### 类型 ID 一致性

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

### 兼容模式

跨语言模式默认已使用兼容 Schema 演进。对于可能独立演进的 Schema，请保留该默认设置：

```cpp
auto fory = Fory::builder().xlang(true).build();
```

兼容模式允许：

- 添加新字段（带默认值）
- 删除未使用的字段
- 重排字段

### 互操作故障排查

#### 类型不匹配错误

```
Error: Type mismatch: expected 100, got 101
```

**解决方案：**确保所有语言的类型 ID 一致。

#### 编码错误

```
Error: Invalid UTF-8 sequence
```

**解决方案：**确保所有语言中的字符串都是有效的 UTF-8。

### 相关指南

- [配置](configuration.md) - 构建器选项
- [类型注册](type-registration.md) - 注册类型
- [支持的类型](supported-types.md) - 类型兼容性

## 相关主题

- [配置](configuration.md) - 构建器选项
- [类型注册](type-registration.md) - 注册类型
- [支持的类型](supported-types.md) - 所有支持的类型
