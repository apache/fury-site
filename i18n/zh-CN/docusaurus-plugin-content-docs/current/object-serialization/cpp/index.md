---
title: C++ 对象序列化
sidebar_position: 0
id: index
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

**Apache Fory™** 是由 **JIT 编译**和**零拷贝**技术驱动的高速多语言序列化框架，在保持易用性和安全性的同时提供出色性能。

C++ 实现利用现代 C++17 特性和模板元编程，提供具备编译期类型安全的高性能序列化。它既支持用于跨语言载荷的跨语言模式，也支持仅用于 C++ 载荷的原生模式。

## 为什么选择 Apache Fory™ C++？

- **快速二进制编码**：快速序列化和优化的二进制协议
- **跨语言**：在 Java、Python、C++、Go、Rust、JavaScript/TypeScript、C#、Swift、Dart、Scala 和 Kotlin 之间无缝序列化和反序列化数据
- **类型安全**：通过基于宏的结构体注册进行编译期类型检查
- **引用跟踪**：自动跟踪共享引用和循环引用
- **Schema 演进**：兼容模式支持独立的 Schema 变更
- **线程安全**：同时提供单线程和线程安全版本

## 安装

C++ 实现同时支持 CMake 和 Bazel 构建系统。

### 前置要求

- CMake 3.16+（使用 CMake 构建）或 Bazel 8+（使用 Bazel 构建）
- 兼容 C++17 的编译器（GCC 7+、Clang 5+、MSVC 2017+）

使用 MSVC 构建时，请配置构建系统以传递 `/Zc:preprocessor`。

### 使用 CMake（推荐）

使用 Fory 最简单的方式是采用 CMake 的 `FetchContent` 模块：

```cmake
cmake_minimum_required(VERSION 3.16)
project(my_project LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
if(MSVC)
    add_compile_options(/Zc:preprocessor)
endif()
include(FetchContent)
FetchContent_Declare(
    fory
    GIT_REPOSITORY https://github.com/apache/fory.git
    GIT_TAG        v1.5.0
    SOURCE_SUBDIR  cpp
)
FetchContent_MakeAvailable(fory)

add_executable(my_app main.cc)
target_link_libraries(my_app PRIVATE fory::serialization)
```

然后构建并运行：

```bash
mkdir build && cd build
cmake .. -DCMAKE_BUILD_TYPE=Release
cmake --build . --parallel
./my_app
```

### 使用 Bazel

在项目根目录创建 `MODULE.bazel` 文件：

```bazel
module(
    name = "my_project",
    version = "1.0.0",
)

bazel_dep(name = "rules_cc", version = "0.1.1")

bazel_dep(name = "fory", version = "1.5.0")
git_override(
    module_name = "fory",
    remote = "https://github.com/apache/fory.git",
    commit = "v1.5.0",  # Or use a specific commit hash for reproducibility
)
```

为应用程序创建 `BUILD` 文件：

```bazel
cc_binary(
    name = "my_app",
    srcs = ["main.cc"],
    deps = ["@fory//cpp/fory/serialization:fory_serialization"],
)
```

使用 MSVC 构建时，在 Bazel 配置中添加符合标准的预处理器选项：

```bazel
# .bazelrc
build --cxxopt=/Zc:preprocessor
```

然后构建并运行：

```bash
bazel build //:my_app
bazel run //:my_app
```

本地开发时，可以改用 `local_path_override`：

```bazel
bazel_dep(name = "fory", version = "1.5.0")
local_path_override(
    module_name = "fory",
    path = "/path/to/fory",
)
```

### 示例

完整的可运行示例参见 [examples/cpp](https://github.com/apache/fory/tree/main/examples/cpp) 目录：

- [hello_world](https://github.com/apache/fory/tree/main/examples/cpp/hello_world) - 对象图序列化

## 快速入门

### 基本示例

```cpp
#include "fory/serialization/fory.h"
#include <string>
#include <vector>

using namespace fory::serialization;

// Define a struct
struct Person {
  std::string name;
  int32_t age;
  std::vector<std::string> hobbies;

  bool operator==(const Person &other) const {
    return name == other.name && age == other.age && hobbies == other.hobbies;
  }
};
FORY_STRUCT(Person, name, age, hobbies);

int main() {
  // Create an xlang Fory instance
  auto fory = Fory::builder()
      .xlang(true)
      .track_ref(false)     // Disable reference tracking for simple types
      .build();

  // Register the type with a unique ID
  fory.register_struct<Person>(1);

  // Create an object
  Person person{"Alice", 30, {"reading", "coding"}};

  // Serialize
  auto result = fory.serialize(person);
  if (!result.ok()) {
    // Handle error
    return 1;
  }
  std::vector<uint8_t> bytes = std::move(result).value();

  // Deserialize
  auto deser_result = fory.deserialize<Person>(bytes);
  if (!deser_result.ok()) {
    // Handle error
    return 1;
  }
  Person decoded = std::move(deser_result).value();

  assert(person == decoded);
  return 0;
}
```

### 继承字段

要在派生类型中包含基类字段，请列出 `FORY_BASE(Base)` 并将其放入 `FORY_STRUCT`。基类必须定义自己的 `FORY_STRUCT`，以便引用其字段。

```cpp
struct Base {
  int32_t id;
  FORY_STRUCT(Base, id);
};

struct Derived : Base {
  std::string name;
  FORY_STRUCT(Derived, FORY_BASE(Base), name);
};
```

## 跨语言模式与原生模式

跨语言载荷以及与其他 Fory 实现共享的 Schema 应使用跨语言模式。跨语言模式是 C++ 的默认编码模式；使用该模式的 C++ 示例会显式设置 `.xlang(true)`，以清楚展示模式选择。

仅限 C++ 的通信应使用原生模式。通过 `.xlang(false)` 选择原生模式，它会让 C++ 对象序列化保持 C++ 原生形式。载荷不会离开 C++ 时，该模式针对 C++ 类型进行了优化，并避免可移植跨语言类型映射的约束。兼容模式默认启用。只有每个读取端和写入端都使用相同的 C++ Schema，并且希望获得更快的序列化和更小的体积时，才设置 `.compatible(false)`。

C++ 跨语言注册和互操作规则参见[跨语言序列化](basic-serialization.md#cross-language-interoperability)，仅限 C++ 的载荷参见[原生序列化](native.md)。

## 线程安全

Apache Fory™ C++ 针对不同的线程需求提供两个版本：

### 单线程（最快）

```cpp
// Single-threaded Fory - fastest, NOT thread-safe
auto fory = Fory::builder().xlang(true).build();
```

### 线程安全

```cpp
// Thread-safe Fory - uses context pools
auto fory = Fory::builder().xlang(true).build_thread_safe();

// Can be used from multiple threads safely
std::thread t1([&]() {
  auto result = fory.serialize(obj1);
});
std::thread t2([&]() {
  auto result = fory.serialize(obj2);
});
```

**提示：**请在线程启动前完成类型注册，确保每个工作线程看到相同的元数据。

## 使用场景

### 对象序列化

- 包含嵌套对象和引用的复杂数据结构
- 微服务中的跨语言通信
- 具备完整类型安全的通用序列化
- 使用兼容模式进行 Schema 演进

## 后续步骤

- [配置](configuration.md) - 构建器选项和模式
- [基本序列化](basic-serialization.md) - 对象图序列化
- [原生序列化](native.md) - 仅限 C++ 的序列化
- [Schema 元数据](schema-metadata.md) - 字段级元数据（可空、引用跟踪）
- [Schema 演进](schema-evolution.md) - 兼容模式和 Schema 变更
- [类型注册](type-registration.md) - 注册类型
- [支持的类型](supported-types.md) - 所有支持的类型
- [自定义序列化器](custom-serializers.md) - 扩展序列化行为
- [行格式](../../row-format/cpp.md) - 零拷贝行格式
- [gRPC 支持](../../grpc/cpp.md) - 通过 gRPC C++ 传输 Fory 载荷

解码来自应用信任边界之外的字节之前，请阅读 [C++ 安全](security.md)。
