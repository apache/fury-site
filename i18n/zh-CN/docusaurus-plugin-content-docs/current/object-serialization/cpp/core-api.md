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

本文介绍基本对象图序列化和核心序列化 API。

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

## 相关主题

- [配置](configuration.md) - 构建器选项
- [类型注册](type-registration.md) - 注册类型
- [支持的类型](supported-types.md) - 所有支持的类型
