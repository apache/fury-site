---
title: C++ 序列化指南
sidebar_position: 0
id: serialization_index
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

**Apache Fory™** 是一个高性能的多语言序列化框架，基于 **JIT 编译**与**零拷贝**技术，在保持易用性和安全性的同时提供出色性能。

C++ 实现基于现代 C++17 特性和模板元编程，提供具备编译时类型安全的高性能序列化能力。

## 为什么选择 Apache Fory™ C++？

- **高性能**：快速序列化与优化的二进制协议
- **跨语言**：可在 Java、Python、C++、Go、JavaScript 和 Rust 之间无缝序列化与反序列化数据
- **类型安全**：通过基于宏的结构体注册实现编译时类型检查
- **引用跟踪**：自动跟踪共享引用和循环引用
- **Schema 演进**：兼容模式支持独立的 Schema 变更
- **双格式支持**：对象图序列化与零拷贝行格式
- **线程安全**：同时提供单线程（最快）和线程安全两种变体

## 安装

C++ 实现同时支持 CMake 和 Bazel 构建系统。

### 前置条件

- CMake 3.16+（用于 CMake 构建）或 Bazel 8+（用于 Bazel 构建）
- 支持 C++17 的编译器（GCC 7+、Clang 5+、MSVC 2017+）

使用 MSVC 构建时，需要配置构建系统传入 `/Zc:preprocessor`。

### 使用 CMake（推荐）

最简单的集成方式是使用 CMake 的 `FetchContent` 模块：

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
    commit = "v1.5.0",  # 或使用特定 commit hash 以确保可复现性
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

使用 MSVC 构建时，在 Bazel 配置中加入符合标准的预处理器选项：

```bazel
# .bazelrc
build --cxxopt=/Zc:preprocessor
```

然后构建并运行：

```bash
bazel build //:my_app
bazel run //:my_app
```

对于本地开发，也可以改用 `local_path_override`：

```bazel
bazel_dep(name = "fory", version = "1.5.0")
local_path_override(
    module_name = "fory",
    path = "/path/to/fory",
)
```

### 示例

完整可运行示例请参见 [examples/cpp](https://github.com/apache/fory/tree/main/examples/cpp) 目录：

- [hello_world](https://github.com/apache/fory/tree/main/examples/cpp/hello_world) - 对象图序列化
- [hello_row](https://github.com/apache/fory/tree/main/examples/cpp/hello_row) - 行格式编码

## 快速开始

### 基础示例

```cpp
#include "fory/serialization/fory.h"
#include <string>
#include <vector>

using namespace fory::serialization;

// 定义结构体
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
  // 创建 Fory 实例
  auto fory = Fory::builder()
      .xlang(true)          // 启用跨语言模式
      .track_ref(false)     // 对简单类型禁用引用跟踪
      .build();

  // 为类型注册唯一 ID
  fory.register_struct<Person>(1);

  // 创建对象
  Person person{"Alice", 30, {"reading", "coding"}};

  // 序列化
  auto result = fory.serialize(person);
  if (!result.ok()) {
    // 处理错误
    return 1;
  }
  std::vector<uint8_t> bytes = std::move(result).value();

  // 反序列化
  auto deser_result = fory.deserialize<Person>(bytes);
  if (!deser_result.ok()) {
    // 处理错误
    return 1;
  }
  Person decoded = std::move(deser_result).value();

  assert(person == decoded);
  return 0;
}
```

### 继承字段

如果希望派生类型包含基类字段，请在 `FORY_STRUCT` 中写入 `FORY_BASE(Base)`。基类本身也必须定义自己的 `FORY_STRUCT`，这样其字段才能被引用。

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

## 线程安全

Apache Fory™ C++ 面向不同线程需求提供两种变体：

### 单线程（最快）

```cpp
// 单线程 Fory：速度最快，但不是线程安全的
auto fory = Fory::builder()
    .xlang(true)
    .build();
```

### 线程安全

```cpp
// 线程安全 Fory：使用上下文池
auto fory = Fory::builder()
    .xlang(true)
    .build_thread_safe();

// 可安全用于多线程
std::thread t1([&]() {
  auto result = fory.serialize(obj1);
});
std::thread t2([&]() {
  auto result = fory.serialize(obj2);
});
```

**提示：** 请在启动线程之前完成类型注册，以确保每个工作线程都能看到一致的元数据。

## 使用场景

### 对象序列化

- 含嵌套对象和引用的复杂数据结构
- 微服务中的跨语言通信
- 具备完整类型安全的通用序列化
- 使用兼容模式进行 Schema 演进

### 行格式序列化

- 高吞吐数据处理
- 需要快速字段访问的分析型负载
- 内存受限环境
- 零拷贝场景

## 后续步骤

- [配置](configuration.md) - 构建器选项与模式
- [基础序列化](basic-serialization.md) - 对象图序列化
- [Schema 演进](schema-evolution.md) - 兼容模式与 Schema 变更
- [类型注册](type-registration.md) - 注册类型
- [字段配置](schema-metadata.md) - 字段级元数据（可空、引用跟踪）
- [支持的类型](supported-types.md) - 全部支持的类型
- [跨语言](xlang-serialization.md) - XLANG 模式
- [行格式](row-format.md) - 零拷贝行格式
