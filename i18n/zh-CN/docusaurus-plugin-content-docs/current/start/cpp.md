---
title: C++ 设置
sidebar_position: 3
id: cpp
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

Fory C++ 提供二进制对象序列化、Row Format、生成的模型和 Fory gRPC。它需要 C++17 编译器，并支持 CMake 3.16 及更高版本和 Bazel 8 及更高版本。

## 验证工具链

```bash
c++ --version
cmake --version
# or: bazel --version
```

## 对象序列化

与其他 Fory 运行时共享的数据使用 xlang 模式，仅供 C++ 使用的数据使用 native 模式。获取已发布的源代码树，并链接序列化目标：

```cmake title="CMakeLists.txt"
cmake_minimum_required(VERSION 3.16)
project(fory_example LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
include(FetchContent)
FetchContent_Declare(
  fory
  GIT_REPOSITORY https://github.com/apache/fory.git
  GIT_TAG v1.5.0
  SOURCE_SUBDIR cpp
)
FetchContent_MakeAvailable(fory)

add_executable(fory_example main.cc)
target_link_libraries(fory_example PRIVATE fory::serialization)
```

```cpp title="main.cc"
#include <cassert>
#include <cstdint>
#include <string>
#include <utility>
#include <vector>

#include "fory/serialization/fory.h"

struct User {
  int64_t id;
  std::string name;

  bool operator==(const User &other) const {
    return id == other.id && name == other.name;
  }
};
FORY_STRUCT(User, id, name);

int main() {
  auto fory = fory::serialization::Fory::builder().xlang(true).build();
  fory.register_struct<User>(1);

  auto bytes = fory.serialize(User{1, "Alice"});
  assert(bytes.ok());
  std::vector<uint8_t> data = std::move(bytes).value();
  auto decoded = fory.deserialize<User>(data);
  assert(decoded.ok());
  User user = std::move(decoded).value();
  assert(user.id == 1 && user.name == "Alice");
}
```

```bash
cmake -S . -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build --parallel
./build/fory_example
```

Bazel、Windows、错误处理和线程安全实例请参阅 [C++ 对象序列化](../object-serialization/cpp/index.md)；然后继续阅读 [xlang](../object-serialization/cpp/xlang.md)或 [native 模式](../object-serialization/cpp/native.md)。

## 其他能力

- **Row Format** 为可信分析数据提供随机和部分字段访问。请参阅 [C++ Row Format](../row-format/cpp.md)。
- **Fory IDL 与编译器** 生成 C++ 模型和注册辅助代码。请参阅[编译器快速入门](../compiler/getting-started.md)和 [C++ 生成代码指南](../compiler/generated-code/cpp.md)。
- **Fory gRPC** 通过 gRPC C++ 传输使用 Fory 编码的消息。请参阅 [C++ gRPC](../grpc/cpp.md)。
