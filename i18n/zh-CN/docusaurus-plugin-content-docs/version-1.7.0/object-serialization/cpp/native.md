---
title: 原生序列化
sidebar_position: 2
id: native
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

C++ 原生序列化是通过 `.xlang(false)` 选择、仅限 C++ 的编码模式。当所有写入端和读取端都是 C++，并且载荷应遵循 C++ 类型行为而非可移植的跨语言类型系统时，请使用该模式。

如果字节需要由 Java、Python、Go、Rust、JavaScript/TypeScript、C#、Swift、Dart、Scala、Kotlin 或其他非 C++ Fory 实现读取，请使用 C++ 默认模式[跨语言序列化](basic-serialization.md#cross-language-interoperability)。

## 何时使用原生序列化

以下场景使用原生序列化：

- 载荷仅由 C++ 应用程序生成和消费。
- 数据模型使用字符类型、无符号原生类型 ID、`std::tuple`、智能指针或 C++ 多态模型等 C++ 专属类型。
- 希望获得更快的序列化和更小的体积，并且每个读取端都使用与写入端相同的 Schema。
- C++ 专属滚动部署需要兼容的 Schema 演进。
- 希望在 C++ 边界避免可移植跨语言类型映射的约束。

## 创建原生模式 Fory 实例

```cpp
#include "fory/serialization/fory.h"
#include <cassert>
#include <cstdint>
#include <string>

using namespace fory::serialization;

struct Order {
  int64_t id;
  double amount;

  bool operator==(const Order &other) const {
    return id == other.id && amount == other.amount;
  }
};
FORY_STRUCT(Order, id, amount);

int main() {
  auto fory = Fory::builder()
      .xlang(false)
      .build();
  fory.register_struct<Order>(100);

  Order order{1, 42.5};
  auto bytes = fory.serialize(order).value();
  auto decoded = fory.deserialize<Order>(bytes).value();
  assert(order == decoded);
}
```

每个线程使用一个已配置的 `Fory` 实例；如果多个线程共享同一实例，则构建线程安全的 Fory 实例：

```cpp
auto fory = Fory::builder()
    .xlang(false)
    .track_ref(true)
    .build_thread_safe();
```

在并发序列化开始前注册类型。

## Schema 演进

原生序列化默认使用兼容模式。当仅限 C++ 的写入端和读取端 Schema 可能不同时，请保留该默认设置：

```cpp
auto fory = Fory::builder()
    .xlang(false)
    .build();
```

兼容模式写入 Schema 元数据，因此在字段标识保持兼容时，读取端可以容忍字段新增、删除或重排。参见 [Schema 演进](schema-evolution.md)。

只有每个读取端和写入端始终使用相同的 C++ Schema 时，才设置 `.compatible(false)` 以获得更快的序列化和更小的体积。

## 注册

序列化前使用稳定的 ID 或名称注册结构体：

```cpp
fory.register_struct<Order>(100);
fory.register_struct<Order>("example.Order");
```

紧凑载荷使用数字 ID。当独立团队通过名称协调类型标识时使用名称注册；必要时使用 `.` 添加命名空间前缀。

## C++ 对象范围

原生序列化支持以下 C++ 专属对象范围：

- 由 `FORY_STRUCT` 描述的结构体和类。
- `std::vector`、`std::map`、`std::unordered_map`、`std::set` 和 `std::unordered_set` 等标准容器。
- `std::optional`、`std::variant` 和类似元组的值。
- `std::shared_ptr` 和 `std::unique_ptr`。
- `char`、`char16_t` 和 `char32_t` 等字符类型。
- 使用原生模式类型 ID 的无符号整数类型。
- 通过 C++ 实现注册的多态序列化。

完整类型范围和跨语言映射说明参见[支持的类型](supported-types.md)。

## 引用与智能指针

原生序列化支持智能指针和引用跟踪：

```cpp
auto fory = Fory::builder()
    .xlang(false)
    .track_ref(true)
    .build();
```

启用引用跟踪后，可以保留共享指针标识，并通过支持的指针模式表示循环对象图。如果标识不属于模型的一部分，请对值形态数据禁用引用跟踪。

## 仅限原生模式的标量形态

某些 C++ 标量形态不是可移植的跨语言载荷。当这些形态必须作为 C++ 值往返时，请使用原生序列化：

```cpp
auto fory = Fory::builder().xlang(false).build();

auto char_bytes = fory.serialize(char32_t{U'A'}).value();
auto value = fory.deserialize<char32_t>(char_bytes).value();

auto unsigned_bytes = fory.serialize(uint64_t{42}).value();
auto unsigned_value = fory.deserialize<uint64_t>(unsigned_bytes).value();
```

对于跨语言载荷，请使用元数据和共享跨语言类型映射，不要依赖仅限 C++ 原生模式的类型 ID。

## 性能指南

- 复用已配置的 `Fory` 实例。
- 每个线程使用单线程 `Fory` 可获得最快路径；共享并发使用时采用 `build_thread_safe()`。
- 只有每个读取端和写入端始终使用相同 C++ Schema，且应用希望获得更快序列化和更小体积时，才使用 `.compatible(false)`。
- 使用显式数字 ID 注册结构体以获得紧凑载荷。
- 对值形态对象图禁用引用跟踪。
- 热路径上优先使用具体类型，而非多态/动态字段。

## 原生模式与跨语言模式对比

| 需求                     | 使用原生序列化 | 使用跨语言序列化 |
| ------------------------ | -------------- | ---------------- |
| 仅限 C++ 的载荷          | 是             | 可选             |
| 非 C++ 读取端或写入端    | 否             | 是               |
| C++ 原生字符和无符号形态 | 是             | 有限             |
| 智能指针和 C++ 对象图    | 是             | 有限             |
| 相同 Schema 的紧凑载荷   | 是             | 否               |
| 默认支持兼容 Schema 演进 | 是             | 是               |
| 跨语言可移植类型映射     | 否             | 是               |

## 故障排查

### 非 C++ 实现无法读取载荷

写入端使用了原生序列化。请使用 `.xlang(true)` 重新构建，并与每个对等端对齐类型注册。

### 字段变更后滚动部署失败

原生序列化默认使用兼容模式。当 Schema 可能不同时，请保留该默认设置。

### 仅限原生模式的标量无法映射到其他语言

可移植载荷请使用带显式元数据的跨语言序列化。原生 C++ 类型 ID 仅供 C++ 读取端使用。

### 共享指针对象图丢失标识

启用 `.track_ref(true)`，并确认对象图使用支持的指针模式。

## 相关主题

- [跨语言序列化](basic-serialization.md#cross-language-interoperability) - 跨语言 C++ 载荷
- [配置](configuration.md) - 构建器选项
- [基本序列化](basic-serialization.md) - 对象图序列化
- [支持的类型](supported-types.md) - C++ 类型支持
- [多态序列化](polymorphism.md) - 多态对象模型
- [Schema 演进](schema-evolution.md) - 兼容模式
