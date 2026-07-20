---
title: 配置
sidebar_position: 1
id: configuration
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

本页介绍 C++ Fory 实例的配置。`Fory::builder()` 默认创建 xlang 载荷，并默认启用兼容模式。只有载荷始终停留在 C++ 中时，才选择 native 模式。

## 构建器模式

使用 `ForyBuilder` 构造具有自定义配置的 Fory 实例：

```cpp
#include "fory/serialization/fory.h"

using namespace fory::serialization;

// 默认 xlang 模式
auto fory = Fory::builder().build();

// 仅用于 C++ 载荷的 native 模式
auto fory = Fory::builder()
    .xlang(false)
    .build();

// 同 Schema 优化。只有每个读写端始终使用相同 Schema 时才使用
auto fory = Fory::builder()
    .compatible(false)
    .build();
```

## 配置

### xlang(bool)

选择编码模式。

```cpp
auto fory = Fory::builder()
    .xlang(false)
    .build();
```

设为 `true` 时，C++ 写入 Java、Python、Go、Rust、JavaScript/TypeScript、C#、Swift、Dart、Scala 和 Kotlin 共用的 xlang 编码格式。设为 `false` 时，C++ 写入仅用于 C++ 通信的 native 模式载荷。

**默认值：** `true`

### compatible(bool)

兼容模式默认启用，无需额外调用构建器方法。只有每个读写端始终使用相同 Schema，并且需要更快的序列化速度和更小的体积时，才设置 `.compatible(false)`。

```cpp
auto fory = Fory::builder()
    .compatible(false)
    .build();
```

对于 xlang 载荷，只有确认每种语言都使用相同 Schema，或 native 类型由 Fory schema IDL 生成后，才使用 `.compatible(false)`。

**默认值：** `true`

### track_ref(bool)

启用/禁用共享引用和循环引用的引用跟踪。

```cpp
auto fory = Fory::builder()
    .track_ref(true)  // 启用引用跟踪
    .build();
```

启用后，避免重复序列化共享对象并处理循环引用。

**默认值：** `true`

### max_graph_memory_bytes(int64_t)

为单次根对象反序列化设置近似的对象图内存限制。

```cpp
auto fory = Fory::builder()
    .max_graph_memory_bytes(64 * 1024 * 1024)
    .build();
```

对于以字节数组、`Buffer` 或流为根的输入，默认限制固定为 `128 MiB`。正数值会覆盖默认值；显式传入非正数时，运行时创建会失败。

该限制是对实例化后对象图所有者所占内存的近似下界估算，主要涵盖 collection、map、array、struct 和 object。它不是精确的进程堆内存上限，实际进程内存可能更高。专用的 string、binary、基础标量和基础类型稠密数组等叶子值不计入该限制，仍由可用字节数检查保护：如果未读取的输入没有足够字节，Fory 就不会读取或创建该叶子值。

**默认值：** `128 MiB`

### max_dyn_depth(uint32_t)

设置动态类型对象的最大允许嵌套深度。

```cpp
auto fory = Fory::builder()
    .max_dyn_depth(10)  // 允许最多 10 层
    .build();
```

这限制了嵌套多态对象序列化的最大深度（例如 `shared_ptr<Base>`、`unique_ptr<Base>`）。防止深度嵌套结构在动态序列化场景中导致栈溢出。

**默认值：** `5`

**何时调整：**

- **增加**：对于合法的深度嵌套数据结构
- **减少**：对于更严格的安全要求或浅层数据结构

### max_schema_versions_per_type(uint32_t)

设置一个逻辑类型可接受的最大远端 metadata 版本数。

```cpp
auto fory = Fory::builder()
    .max_schema_versions_per_type(10)
    .build();
```

**默认值：** `10`

### max_type_fields(uint32_t)

设置一个收到的远端 struct metadata body 中可接受的最大字段数。

```cpp
auto fory = Fory::builder()
    .max_type_fields(512)
    .build();
```

**默认值：** `512`

### max_type_meta_bytes(uint32_t)

设置一个收到的 TypeDef body 可接受的最大编码 body 字节数，不包含 8 字节 header 和扩展 size varint。

```cpp
auto fory = Fory::builder()
    .max_type_meta_bytes(4096)
    .build();
```

**默认值：** `4096`

### max_average_schema_versions_per_type(uint32_t)

设置所有已接受远端类型的平均 metadata 版本数限制。有效全局下限为 `8192` 个 schema。

```cpp
auto fory = Fory::builder()
    .max_average_schema_versions_per_type(3)
    .build();
```

**默认值：** `3`

### check_struct_version(bool)

启用/禁用结构体版本检查。

```cpp
auto fory = Fory::builder()
    .check_struct_version(true)  // 启用版本检查
    .build();
```

启用后，验证类型哈希以检测 schema 不匹配。

**默认值：** `false`

## 线程安全 vs 单线程

### 单线程（最快）

```cpp
auto fory = Fory::builder()
    .xlang(true)
    .build();  // 返回 Fory
```

单线程 `Fory` 是最快的选项，但非线程安全。每个线程使用一个实例。

### 线程安全

```cpp
auto fory = Fory::builder()
    .xlang(true)
    .build_thread_safe();  // 返回 ThreadSafeFory
```

`ThreadSafeFory` 使用 Fory 实例池提供线程安全的序列化。由于池开销略慢，但可以从多个线程并发安全使用。

## 配置摘要

| 选项                                             | 说明                                           | 默认值    |
| ------------------------------------------------ | ---------------------------------------------- | --------- |
| `xlang(bool)`                                    | 启用跨语言模式                                 | `true`    |
| `compatible(bool)`                               | 启用 Schema 演进                               | `true`    |
| `track_ref(bool)`                                | 启用引用跟踪                                   | `true`    |
| `max_graph_memory_bytes(int64_t)`                | 每次读取根对象时的近似对象图内存限制           | `128 MiB` |
| `max_dyn_depth(uint32_t)`                        | 动态类型的最大嵌套深度                         | `5`       |
| `max_type_fields(uint32_t)`                      | 一个收到的 struct metadata body 最大字段数     | `512`     |
| `max_type_meta_bytes(uint32_t)`                  | 一个收到的 metadata body 最大编码字节数        | `4096`    |
| `max_schema_versions_per_type(uint32_t)`         | 一个逻辑类型最大远端 metadata 版本数            | `10`      |
| `max_average_schema_versions_per_type(uint32_t)` | 所有远端类型的平均 metadata 版本数              | `3`       |
| `check_struct_version(bool)`                     | 启用结构体版本检查                             | `false`   |

## 安全

安全相关配置：

- 在反序列化不可信 payload 前，只注册预期的类型。
- 对 intentional same-schema payload，将 `check_struct_version(true)` 与 `compatible(false)` 配合使用。
- 对大多数输入保留 `max_graph_memory_bytes(...)` 的固定默认值 `128 MiB`；只有可信工作负载确实需要不同的 collection、map 或 struct 限制时，才设置其他正数值。
- 尽可能降低 `max_dyn_depth(...)`，以拒绝异常深的多态对象图。
- 除非数据不是恶意输入，且可信 peer 会发送更大的 metadata 或大量 schema 版本，否则保持远端 schema metadata 限制的默认值。
- 对不可信输入，优先使用具体字段，避免宽泛的多态字段。

## 相关主题

- [基础序列化](basic-serialization.md) - 使用配置的 Fory
- [跨语言](xlang-serialization.md) - XLANG 模式详情
- [类型注册](type-registration.md) - 注册类型
