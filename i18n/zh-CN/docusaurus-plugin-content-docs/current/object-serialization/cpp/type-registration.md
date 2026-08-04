---
title: 类型注册
sidebar_position: 5
id: type-registration
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

本文说明如何注册用于序列化的类型。

## 概述

Apache Fory™ 要求显式注册结构体类型。该设计支持：

- **跨语言兼容性**：注册的类型 ID 可跨语言使用
- **类型安全**：在反序列化时检测类型不匹配
- **多态序列化**：支持通过智能指针序列化多态对象

## 注册结构体

使用 `register_struct<T>(type_id)` 注册结构体类型：

```cpp
#include "fory/serialization/fory.h"

using namespace fory::serialization;

struct Person {
  std::string name;
  int32_t age;
};
FORY_STRUCT(Person, name, age);

int main() {
  auto fory = Fory::builder().xlang(true).build();

  // Register with a unique type ID
  fory.register_struct<Person>(100);

  Person person{"Alice", 30};
  auto bytes = fory.serialize(person).value();
  auto decoded = fory.deserialize<Person>(bytes).value();
}
```

## 类型 ID 指南

类型 ID 必须满足：

1. **唯一**：Fory 实例中的每个类型都必须具有唯一 ID
2. **一致**：所有语言和版本必须使用相同的 ID

用户注册的类型 ID 与内置类型 ID 位于不同命名空间，因此可以从 0 开始：

```cpp
// User type IDs can start from 0
fory.register_struct<Address>(0);
fory.register_struct<Person>(1);
fory.register_struct<Order>(2);
```

## 注册枚举

使用 `register_enum<T>(type_id)` 注册枚举类型。对于从 0 开始且值连续的简单枚举，无需使用宏：

```cpp
// Simple continuous enum - no FORY_ENUM needed
enum class Color { RED, GREEN, BLUE };  // Values: 0, 1, 2

// Register with register_enum
fory.register_enum<Color>(0);
```

对于值不连续的枚举，使用 `FORY_ENUM` 宏将值映射到序号：

```cpp
// Non-continuous enum values - FORY_ENUM required
enum class Priority { LOW = 10, MEDIUM = 50, HIGH = 100 };
FORY_ENUM(Priority, LOW, MEDIUM, HIGH);
// FORY_ENUM must be defined at namespace scope.

// Global namespace enum (prefix with ::)
enum SparseStatus { UNKNOWN = -1, OK = 0, ERROR = 1 };
FORY_ENUM(::SparseStatus, UNKNOWN, OK, ERROR);

// Register after FORY_ENUM
fory.register_enum<Priority>(1);
fory.register_enum<SparseStatus>(2);
```

**何时使用 `FORY_ENUM`：**

- 枚举值不从 0 开始
- 枚举值不连续（例如 10、50、100）
- 需要在编译期建立名称到值的映射

## 线程安全注册

使用 `ThreadSafeFory` 时，请在线程启动前注册类型：

```cpp
auto fory = Fory::builder().xlang(true).build_thread_safe();

// Register all types first
fory.register_struct<TypeA>(100);
fory.register_struct<TypeB>(101);

// Now safe to use from multiple threads
std::thread t1([&]() {
  auto result = fory.serialize(obj_a);
});
std::thread t2([&]() {
  auto result = fory.serialize(obj_b);
});
```

## 跨语言注册

为保证跨语言兼容性，请确保：

1. **类型 ID 相同**：所有语言使用完全相同的 ID
2. **类型兼容**：各语言使用等价类型

### Java

```java
Fory fory = Fory.builder().withXlang(true).build();
fory.register(Person.class, 100);
fory.register(Address.class, 101);
```

### Python

```python
import pyfory

fory = pyfory.Fory(xlang=True)
fory.register(Person, type_id=100)
fory.register(Address, type_id=101)
```

### C++

```cpp
auto fory = Fory::builder().xlang(true).build();
fory.register_struct<Person>(100);
fory.register_struct<Address>(101);
```

## 内置类型 ID

内置类型已有预分配的类型 ID，无需注册：

| Type ID | Type                    |
| ------- | ----------------------- |
| 0       | UNKNOWN                 |
| 1       | BOOL                    |
| 2       | INT8                    |
| 3       | INT16                   |
| 4       | INT32                   |
| 5       | VARINT32                |
| 6       | INT64                   |
| 7       | VARINT64                |
| 8       | TAGGED_INT64            |
| 9       | UINT8                   |
| 10      | UINT16                  |
| 11      | UINT32                  |
| 12      | VAR_UINT32              |
| 13      | UINT64                  |
| 14      | VAR_UINT64              |
| 15      | TAGGED_UINT64           |
| 16      | FLOAT8                  |
| 17      | FLOAT16                 |
| 18      | BFLOAT16                |
| 19      | FLOAT32                 |
| 20      | FLOAT64                 |
| 21      | STRING                  |
| 22      | LIST                    |
| 23      | SET                     |
| 24      | MAP                     |
| 25      | ENUM                    |
| 26      | NAMED_ENUM              |
| 27      | STRUCT                  |
| 28      | COMPATIBLE_STRUCT       |
| 29      | NAMED_STRUCT            |
| 30      | NAMED_COMPATIBLE_STRUCT |
| 31      | EXT                     |
| 32      | NAMED_EXT               |
| 33      | UNION                   |
| 34      | TYPED_UNION             |
| 35      | NAMED_UNION             |
| 36      | NONE                    |
| 37      | DURATION                |
| 38      | TIMESTAMP               |
| 39      | DATE                    |
| 40      | DECIMAL                 |
| 41      | BINARY                  |
| 42      | ARRAY                   |
| 43      | BOOL_ARRAY              |
| 44      | INT8_ARRAY              |
| 45      | INT16_ARRAY             |
| 46      | INT32_ARRAY             |
| 47      | INT64_ARRAY             |
| 48      | UINT8_ARRAY             |
| 49      | UINT16_ARRAY            |
| 50      | UINT32_ARRAY            |
| 51      | UINT64_ARRAY            |
| 52      | FLOAT8_ARRAY            |
| 53      | FLOAT16_ARRAY           |
| 54      | BFLOAT16_ARRAY          |
| 55      | FLOAT32_ARRAY           |
| 56      | FLOAT64_ARRAY           |
| 64      | CHAR                    |
| 65      | CHAR16                  |
| 66      | CHAR32                  |

## 错误处理

注册错误会在序列化或反序列化时检查：

```cpp
// Attempting to serialize unregistered type
auto result = fory.serialize(unregistered_obj);
if (!result.ok()) {
  // Error: "Type not registered: ..."
  std::cerr << result.error().to_string() << std::endl;
}

// Type ID mismatch during deserialization
auto result = fory.deserialize<WrongType>(bytes);
if (!result.ok()) {
  // Error: "Type mismatch: expected X, got Y"
  std::cerr << result.error().to_string() << std::endl;
}
```

## 相关主题

- [基本序列化](core-api.md) - 使用已注册类型
- [跨语言序列化](xlang.md) - 跨语言注意事项
- [支持的类型](supported-types.md) - 所有支持的类型
