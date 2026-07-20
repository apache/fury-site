---
title: 原生序列化
sidebar_position: 3
id: native_serialization
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

C++ 原生序列化是通过 `.xlang(false)` 选择的 C++ 专用编码模式。当所有写入端和读取端都是 C++，并且载荷应遵循 C++ 类型行为而不是可移植 xlang 类型系统时，可以使用它。

当字节需要由 Java、Python、Go、Rust、JavaScript 或其他非 C++ Fory 运行时读取时，请使用默认的 C++ 模式 [Xlang Serialization](xlang-serialization.md)。

## 何时使用原生序列化

在以下场景使用原生序列化：

- 载荷只由 C++ 应用生成和消费。
- 数据模型使用 C++ 特有类型，例如字符类型、原生无符号类型 ID、`std::tuple`、智能指针或 C++ 多态模型。
- 需要面向同步发布服务的 Schema 一致 C++ 载荷。
- 需要为仅 C++ 的滚动部署提供兼容的 Schema 演进。
- 希望在 C++ 边界避开可移植 xlang 类型映射约束。

## 创建原生运行时

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

每个线程使用一个配置好的 `Fory` 实例；如果同一个运行时会被多个线程共享，则构建线程安全运行时：

```cpp
auto fory = Fory::builder()
    .xlang(false)
    .track_ref(true)
    .build_thread_safe();
```

在并发序列化开始前注册类型。

## Schema 演进

原生序列化默认使用 Schema 一致模式。当仅 C++ 的写入端和读取端 Schema 可能不同时，启用兼容模式：

```cpp
auto fory = Fory::builder()
    .xlang(false)
    .compatible(true)
    .build();
```

兼容模式会写入 Schema 元数据；只要字段身份保持兼容，读取端就能容忍字段新增、删除或重排。参见 [Schema Evolution](schema-evolution.md)。

## 注册

序列化前使用稳定 ID 或名称注册结构体：

```cpp
fory.register_struct<Order>(100);
fory.register_struct<Order>("example", "Order");
```

使用数字 ID 可以获得更紧凑的载荷；当独立团队通过名称协调类型身份时，使用命名空间/类型名注册。

## C++ 对象范围

原生序列化覆盖 C++ 特有的对象范围：

- 由 `FORY_STRUCT` 描述的结构体和类。
- 标准容器，例如 `std::vector`、`std::map`、`std::unordered_map`、`std::set` 和 `std::unordered_set`。
- `std::optional`、`std::variant` 以及类似 tuple 的值。
- `std::shared_ptr` 和 `std::unique_ptr`。
- 字符类型，例如 `char`、`char16_t` 和 `char32_t`。
- 带原生模式类型 ID 的无符号整数类型。
- 通过 C++ 运行时注册的多态序列化。

完整类型范围和 xlang 映射说明请参见 [Supported Types](supported-types.md)。

## 引用和智能指针

原生序列化支持智能指针和引用跟踪：

```cpp
auto fory = Fory::builder()
    .xlang(false)
    .track_ref(true)
    .build();
```

启用引用跟踪时，可以保留共享指针身份，并通过受支持的指针模式表示循环对象图。对于不以身份作为模型一部分的值型数据，可以禁用引用跟踪。

## 仅原生模式支持的标量形态

部分 C++ 标量形态不是可移植的 xlang 载荷。当这些形态必须作为 C++ 值往返时，请使用原生序列化：

```cpp
auto fory = Fory::builder().xlang(false).build();

auto char_bytes = fory.serialize(char32_t{U'A'}).value();
auto value = fory.deserialize<char32_t>(char_bytes).value();

auto unsigned_bytes = fory.serialize(uint64_t{42}).value();
auto unsigned_value = fory.deserialize<uint64_t>(unsigned_bytes).value();
```

对于 xlang 载荷，请使用 Schema 元数据和共享的 xlang 类型映射，而不是依赖仅 C++ 原生模式支持的类型 ID。

## 性能建议

- 复用配置好的 `Fory` 实例。
- 为了获得最快路径，每个线程使用单线程 `Fory`；共享并发使用时使用 `build_thread_safe()`。
- 对同步发布的 C++ 服务保持原生 Schema 一致模式。
- 仅在需要 C++ 专用 Schema 演进时启用 `.compatible(true)`。
- 使用显式数字 ID 注册结构体，以获得紧凑载荷。
- 对值型图禁用引用跟踪。
- 在热点路径上优先使用具体类型，而不是多态/动态字段。

## 原生模式与 Xlang 对比

| 需求                                     | 使用原生序列化 | 使用 xlang 序列化 |
| ---------------------------------------- | ------------------------ | ----------------------- |
| 仅 C++ 载荷                              | 是             | 可选               |
| 非 C++ 读取端或写入端                    | 否             | 是                 |
| C++ 原生字符和无符号形态                 | 是             | 有限               |
| 智能指针和 C++ 对象图                    | 是             | 有限               |
| Schema 一致的同语言载荷                  | 是             | 否                 |
| 默认兼容 Schema 演进                     | 否             | 是                 |
| 跨运行时可移植类型映射                   | 否             | 是                 |

## 故障排查

### 非 C++ 运行时无法读取载荷

写入端正在使用原生序列化。请用 `.xlang(true)` 重新构建，并与每个对等运行时对齐类型注册。

### 字段变更后滚动部署失败

原生序列化默认使用 Schema 一致模式。当 Schema 可能不同时，请在写入端和读取端都使用 `.compatible(true)`。

### 仅原生模式支持的标量无法映射到其他语言

对于可移植载荷，请使用带显式 Schema 元数据的 xlang 序列化。C++ 原生类型 ID 仅供 C++ 读取端使用。

### 共享指针图丢失身份

启用 `.track_ref(true)`，并确认图使用受支持的指针模式。

## 相关主题

- [Xlang Serialization](xlang-serialization.md) - 跨运行时 C++ 载荷
- [Configuration](configuration.md) - 构建器选项
- [Basic Serialization](basic-serialization.md) - 对象图序列化
- [Supported Types](supported-types.md) - C++ 类型支持
- [Polymorphic Serialization](polymorphism.md) - 多态对象模型
- [Schema Evolution](schema-evolution.md) - 兼容模式
