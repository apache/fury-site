---
title: 类型注册
sidebar_position: 4
id: type_registration
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

本页介绍如何注册类型以进行序列化。

## 概述

Apache Fory™ 要求显式注册结构体类型。这种设计使得：

- **跨语言兼容性**：注册的类型 ID 跨语言边界使用
- **类型安全**：在反序列化时检测类型不匹配
- **多态序列化**：通过智能指针启用多态对象的序列化

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

  // 使用唯一的类型 ID 注册
  fory.register_struct<Person>(100);

  Person person{"Alice", 30};
  auto bytes = fory.serialize(person).value();
  auto decoded = fory.deserialize<Person>(bytes).value();
}
```

## 类型 ID 指南

类型 ID 必须：

1. **唯一**：每个类型在 Fory 实例中必须有唯一的 ID
2. **一致**：必须在所有语言和版本中使用相同的 ID

用户注册的类型 ID 与内置类型 ID 在不同的命名空间中，因此可以从 0 开始：

```cpp
// 用户类型 ID 可以从 0 开始
fory.register_struct<Address>(0);
fory.register_struct<Person>(1);
fory.register_struct<Order>(2);
```

## 注册枚举

使用 `register_enum<T>(type_id)` 注册枚举类型。对于从 0 开始连续值的简单枚举，不需要宏：

```cpp
// 简单连续枚举 - 不需要 FORY_ENUM
enum class Color { RED, GREEN, BLUE };  // 值：0、1、2

// 使用 register_enum 注册
fory.register_enum<Color>(0);
```

对于具有非连续值的枚举，使用 `FORY_ENUM` 宏将值映射到序号：

```cpp
// 非连续枚举值 - 需要 FORY_ENUM
enum class Priority { LOW = 10, MEDIUM = 50, HIGH = 100 };
FORY_ENUM(Priority, LOW, MEDIUM, HIGH);

// 全局命名空间枚举（前缀 ::）
enum LegacyStatus { UNKNOWN = -1, OK = 0, ERROR = 1 };
FORY_ENUM(::LegacyStatus, UNKNOWN, OK, ERROR);

// FORY_ENUM 后注册
fory.register_enum<Priority>(1);
fory.register_enum<LegacyStatus>(2);
```

**何时使用 `FORY_ENUM`：**

- 枚举值不从 0 开始
- 枚举值不连续（例如 10、50、100）
- 需要在编译时进行名称到值的映射

## 线程安全注册

对于 `ThreadSafeFory`，在生成线程之前注册类型：

```cpp
auto fory = Fory::builder().xlang(true).build_thread_safe();

// 首先注册所有类型
fory.register_struct<TypeA>(100);
fory.register_struct<TypeB>(101);

// 现在可以从多个线程安全使用
std::thread t1([&]() {
  auto result = fory.serialize(obj_a);
});
std::thread t2([&]() {
  auto result = fory.serialize(obj_b);
});
```

## 跨语言注册

为了跨语言兼容性，确保：

1. **相同类型 ID**：在所有语言中使用相同的 ID
2. **兼容类型**：跨语言使用等效类型

### Java

```java
Fory fory = Fory.builder().build();
fory.register(Person.class, 100);
fory.register(Address.class, 101);
```

### Python

```python
import pyfory

fory = pyfory.Fory()
fory.register(Person, 100)
fory.register(Address, 101)
```

### C++

```cpp
auto fory = Fory::builder().xlang(true).build();
fory.register_struct<Person>(100);
fory.register_struct<Address>(101);
```

## 内置类型 ID

内置类型有预分配的类型 ID，不需要注册：

| 类型 ID | 类型                 |
| ------- | -------------------- |
| 0       | NONE                 |
| 1       | BOOL                 |
| 2       | INT8                 |
| 3       | INT16                |
| 4       | INT32                |
| 5       | VAR_INT32            |
| 6       | INT64                |
| 7       | VAR_INT64            |
| 8       | SLI_INT64            |
| 9       | FLOAT16              |
| 10      | FLOAT32              |
| 11      | FLOAT64              |
| 12      | STRING               |
| 13      | LIST                 |
| 14      | MAP                  |
| 15      | SET                  |
| 16      | TIMESTAMP            |
| 17      | DURATION             |
| 18      | LOCAL_DATE           |
| 19      | DECIMAL              |
| 20      | BINARY               |
| 21      | ARRAY                |
| 22      | BOOL_ARRAY           |
| 23-28   | INT_ARRAY 变体       |
| 29-31   | FLOAT_ARRAY 变体     |
| 32      | STRUCT               |
| 33      | COMPATIBLE_STRUCT    |
| 34      | NAMED_STRUCT         |
| 35      | NAMED*COMPATIBLE*... |
| 36      | EXT                  |
| 37      | NAMED_EXT            |
| 63      | UNKNOWN              |

## 错误处理

注册错误在序列化/反序列化时检查：

```cpp
// 尝试序列化未注册的类型
auto result = fory.serialize(unregistered_obj);
if (!result.ok()) {
  // 错误："Type not registered: ..."
  std::cerr << result.error().to_string() << std::endl;
}

// 反序列化时类型 ID 不匹配
auto result = fory.deserialize<WrongType>(bytes);
if (!result.ok()) {
  // 错误："Type mismatch: expected X, got Y"
  std::cerr << result.error().to_string() << std::endl;
}
```

## 相关主题

- [基础序列化](basic-serialization.md) - 使用已注册的类型
- [跨语言](xlang-serialization.md) - 跨语言注意事项
- [支持的类型](supported-types.md) - 所有支持的类型
