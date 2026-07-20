---
title: 基础序列化
sidebar_position: 2
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

本页介绍基础对象图序列化和核心序列化 API。

## 对象图序列化

Apache Fory™ 提供复杂对象图的自动序列化，保留对象之间的结构和关系。`FORY_STRUCT` 宏在编译时生成高效的序列化代码，消除运行时开销。

**核心功能：**

- 支持任意深度的嵌套结构体序列化
- 集合类型（vector、set、map）
- 使用 `std::optional<T>` 的可选字段
- 智能指针（`std::shared_ptr`、`std::unique_ptr`）
- 自动处理基本类型和字符串
- 使用变长整数的高效二进制编码

```cpp
#include "fory/serialization/fory.h"
#include <vector>
#include <map>

using namespace fory::serialization;

// 定义结构体
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

// 序列化 - 返回 Result<std::vector<uint8_t>, Error>
auto result = fory.serialize(obj);
if (result.ok()) {
  std::vector<uint8_t> bytes = std::move(result).value();
  // 使用 bytes...
} else {
  // 处理错误
  std::cerr << result.error().to_string() << std::endl;
}
```

### 序列化到现有缓冲区

```cpp
// 序列化到现有 Buffer（最快路径）
Buffer buffer;
auto result = fory.serialize_to(buffer, obj);
if (result.ok()) {
  size_t bytes_written = result.value();
  // buffer 现在包含序列化数据
}

// 序列化到现有 vector（零拷贝）
std::vector<uint8_t> output;
auto result = fory.serialize_to(output, obj);
if (result.ok()) {
  size_t bytes_written = result.value();
  // output 现在包含序列化数据
}
```

### 从字节数组反序列化

```cpp
// 从原始指针反序列化
auto result = fory.deserialize<MyStruct>(data_ptr, data_size);
if (result.ok()) {
  MyStruct obj = std::move(result).value();
}

// 从 vector 反序列化
std::vector<uint8_t> data = /* ... */;
auto result = fory.deserialize<MyStruct>(data);

// 从 Buffer 反序列化（更新 reader_index）
Buffer buffer(data);
auto result = fory.deserialize<MyStruct>(buffer);
```

## 错误处理

Fory 使用 `Result<T, Error>` 类型进行错误处理：

```cpp
auto result = fory.serialize(obj);

// 检查操作是否成功
if (result.ok()) {
  auto value = std::move(result).value();
  // 使用 value...
} else {
  Error error = result.error();
  std::cerr << "Error: " << error.to_string() << std::endl;
}

// 或使用 FORY_TRY 宏进行提前返回
FORY_TRY(bytes, fory.serialize(obj));
// 直接使用 bytes...
```

常见错误类型：

- `Error::type_mismatch` - 反序列化时类型 ID 不匹配
- `Error::invalid_data` - 无效或损坏的数据
- `Error::buffer_out_of_bound` - 缓冲区溢出/下溢
- `Error::type_error` - 类型注册错误

## FORY_STRUCT 宏

`FORY_STRUCT` 宏用于注册结构体以进行序列化：

```cpp
struct MyStruct {
  int32_t x;
  std::string y;
  std::vector<int32_t> z;
};

// 必须与结构体在同一命名空间中
FORY_STRUCT(MyStruct, x, y, z);
```

该宏：

1. 生成编译时字段元数据
2. 启用 ADL（参数依赖查找）进行序列化
3. 通过模板特化创建高效的序列化代码

**要求：**

- 必须放在与结构体相同的命名空间中（用于 ADL）
- 所有列出的字段必须是可序列化类型
- 宏中的字段顺序决定序列化顺序

## 嵌套结构体

完全支持嵌套结构体：

```cpp
struct Inner {
  int32_t value;
};
FORY_STRUCT(Inner, value);

struct Outer {
  Inner inner;
  std::string label;
};
FORY_STRUCT(Outer, inner, label);

// 两者都必须注册
fory.register_struct<Inner>(1);
fory.register_struct<Outer>(2);
```

## 性能提示

- **缓冲区复用**：使用 `serialize_to(buffer, obj)` 配合预分配的缓冲区
- **预注册**：在序列化开始前注册所有类型
- **单线程**：尽可能使用 `build()` 而不是 `build_thread_safe()`
- **禁用跟踪**：当不需要引用跟踪时使用 `track_ref(false)`
- **紧凑编码**：使用变长编码提高空间效率

## 相关主题

- [配置](configuration.md) - 构建器选项
- [类型注册](type-registration.md) - 注册类型
- [支持的类型](supported-types.md) - 所有支持的类型
