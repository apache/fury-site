---
title: 配置
sidebar_position: 4
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

本文介绍 C++ Fory 实例配置。`Fory::builder()` 默认创建跨语言载荷，兼容模式也默认启用。只有载荷始终在 C++ 中使用时才选择原生模式。

## 构建器模式

使用 `Fory::builder()` 构建具有自定义配置的 Fory 实例：

```cpp
#include "fory/serialization/fory.h"

using namespace fory::serialization;

// Default xlang mode.
auto fory = Fory::builder().build();

// Native mode for C++-only payloads.
auto fory = Fory::builder()
    .xlang(false)
    .build();

// Same-schema optimization. Use only when every reader and writer
// always uses the same schema.
auto fory = Fory::builder()
    .compatible(false)
    .build();
```

## 配置项

### xlang(bool)

选择编码模式。

```cpp
auto fory = Fory::builder()
    .xlang(false)
    .build();
```

设为 `true` 时，C++ 写入 Java、Python、Go、Rust、JavaScript/TypeScript、C#、Swift、Dart、Scala 和 Kotlin 共用的跨语言编码格式。设为 `false` 时，C++ 为仅限 C++ 的通信写入原生模式载荷。

**默认值：** `true`

### compatible(bool)

兼容模式默认启用，无需调用构建器方法。只有每个读取端和写入端始终使用相同 Schema，并且希望获得更快序列化和更小体积时，才设置 `.compatible(false)`。

```cpp
auto fory = Fory::builder()
    .compatible(false)
    .build();
```

对于跨语言载荷，只有确认每种语言都使用相同 Schema，或原生类型由 Fory Schema IDL 生成后，才使用 `.compatible(false)`。

**Default:** `true`

### track_ref(bool)

启用或禁用共享引用和循环引用的引用跟踪。

```cpp
auto fory = Fory::builder()
    .track_ref(true)  // Enable reference tracking
    .build();
```

启用后可避免复制共享对象，并处理循环引用。

**Default:** `true`

### max_graph_memory_bytes(int64_t)

为一次根反序列化设置近似对象图内存限制。

```cpp
auto fory = Fory::builder()
    .max_graph_memory_bytes(64 * 1024 * 1024)
    .build();
```

默认限制固定为 `128 MiB`，适用于字节数组、`Buffer` 和流根。正值会覆盖默认值；运行时创建时会拒绝显式设置的非正值。

该预算是对实例化对象图所有者的近似下界估计，主要包括集合、映射、数组、结构体和对象。它不是精确的进程堆限制，实际进程内存可能更高。独立的字符串、二进制、原始标量和原始稠密数组叶值不计入该预算，并继续依赖字节可用性检查：如果未读输入没有足够字节，Fory 不会读取或创建该叶值。

**Default:** `128 MiB`

### max_unbacked_container_items(int64_t)

限制一次根反序列化中重复读取主体未按比例消耗输入的集合元素和映射条目。默认值为 `8192`；零表示严格限制。

```cpp
auto fory = Fory::builder()
    .max_unbacked_container_items(8192)
    .build();
```

### max_dyn_depth(uint32_t)

设置动态类型对象允许的最大嵌套深度。

```cpp
auto fory = Fory::builder()
    .max_dyn_depth(10)  // Allow up to 10 levels
    .build();
```

这会限制嵌套多态对象序列化（例如 `shared_ptr<Base>`、`unique_ptr<Base>`）的最大深度，防止动态序列化场景中的深层嵌套结构导致栈溢出。

**Default:** `5`

**何时调整：**

- **增大**：用于合理的深层嵌套数据结构
- **减小**：用于更严格的安全要求或浅层数据结构

### max_schema_versions_per_type(uint32_t)

设置一个逻辑类型可接受的远端元数据版本上限。

```cpp
auto fory = Fory::builder()
    .max_schema_versions_per_type(10)
    .build();
```

**Default:** `10`

### max_type_fields(uint32_t)

设置一个已接收远端结构体元数据主体可接受的最大字段数。

```cpp
auto fory = Fory::builder()
    .max_type_fields(512)
    .build();
```

**Default:** `512`

### max_type_meta_bytes(uint32_t)

设置一个已接收 TypeDef 主体可接受的最大编码字节数，不包括 8 字节头部和任何扩展大小变长整数。

```cpp
auto fory = Fory::builder()
    .max_type_meta_bytes(4096)
    .build();
```

**Default:** `4096`

### max_average_schema_versions_per_type(uint32_t)

设置已接受远端类型的平均可接受远端元数据版本数。有效的全局下限为 `8192` 个 Schema。

```cpp
auto fory = Fory::builder()
    .max_average_schema_versions_per_type(3)
    .build();
```

**Default:** `3`

### check_struct_version(bool)

启用或禁用结构体版本检查。

```cpp
auto fory = Fory::builder()
    .compatible(false)
    .check_struct_version(true)  // Enable version checking
    .build();
```

启用后会验证类型哈希，以检测 Schema 不匹配。

**Default:** `false`

## 线程安全与单线程

### 单线程（最快）

```cpp
auto fory = Fory::builder().build();  // Returns Fory
```

单线程 `Fory` 是最快的选项，但不是线程安全的。每个线程应使用一个实例。

### 线程安全

```cpp
auto fory = Fory::builder().build_thread_safe();  // Returns ThreadSafeFory
```

`ThreadSafeFory` 使用 Fory 实例池提供线程安全的序列化。实例池会带来少量开销，但可以由多个线程安全地并发使用。

## 配置摘要

| 选项                                             | 说明                                    | 默认值    |
| ------------------------------------------------ | --------------------------------------- | --------- |
| `xlang(bool)`                                    | 使用跨语言模式                          | `true`    |
| `compatible(bool)`                               | 启用 Schema 演进                        | `true`    |
| `track_ref(bool)`                                | 启用引用跟踪                            | `true`    |
| `max_graph_memory_bytes(int64_t)`                | 每次根读取的近似对象图内存限制          | `128 MiB` |
| `max_unbacked_container_items(int64_t)`          | 每次根读取中无输入支撑的集合/映射工作量 | `8192`    |
| `max_dyn_depth(uint32_t)`                        | 动态类型的最大嵌套深度                  | `5`       |
| `max_type_fields(uint32_t)`                      | 一个已接收结构体元数据主体的最大字段数  | `512`     |
| `max_type_meta_bytes(uint32_t)`                  | 一个已接收元数据主体的最大编码字节数    | `4096`    |
| `max_schema_versions_per_type(uint32_t)`         | 一个逻辑类型的最大远端元数据版本数      | `10`      |
| `max_average_schema_versions_per_type(uint32_t)` | 各类型的平均远端元数据版本数            | `3`       |
| `check_struct_version(bool)`                     | 启用结构体版本检查                      | `false`   |

## 安全

安全相关配置：

- 反序列化不可信载荷之前，注册所有结构体和多态实现。
- 对有意使用相同 Schema 的载荷，将 `check_struct_version(true)` 与 `compatible(false)` 配合使用。
- 对大多数输入，将 `max_graph_memory_bytes(...)` 保持为固定默认值 `128 MiB`；只有可信工作负载需要不同的集合/映射/结构体限制时才设置正值。
- 在模型允许范围内尽量降低 `max_dyn_depth(...)`，以拒绝意外过深的多态对象图。
- 除非数据确定无恶意且可信对等端会发送更大的元数据或大量 Schema 版本，否则请保留远端 Schema 元数据限制的默认值。
- 对不可信输入，优先使用具体字段而非宽泛的多态字段。

## 相关主题

- [基本序列化](core-api.md) - 使用已配置的 Fory
- [跨语言序列化](core-api.md#cross-language-interoperability) - 跨语言模式详情
- [类型注册](type-registration.md) - 注册类型
