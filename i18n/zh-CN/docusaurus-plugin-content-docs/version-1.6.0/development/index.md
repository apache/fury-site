---
title: 构建与测试
sidebar_position: 1
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

贡献者文档涵盖仓库设置、构建、测试、调试和面向发布的工作流程。
这部分文档与已发布构件的用户指南相互独立。

从 https://github.com/apache/fory 克隆源代码树。

## Java

```bash
cd java
mvn -T16 package
```

环境要求：

- JDK 17+
- Maven 3.6.3+

## Python

```bash
cd python
pip install -v -e .

# Optional: build Cython extension (replace X.Y with your Python version)
bazel build //:cp_fory_so --@rules_python//python/config_settings:python_version=X.Y
```

环境要求：

- CPython 3.8+
- Bazel 8+（构建 Cython 扩展时必需）

## C++

```bash
cd cpp
bazel build //cpp/...
```

环境要求：

- C++17 编译器
- Bazel 8+

## Go

```bash
cd go/fory
go test -v ./...
```

从 Java 测试模块运行 Go xlang 测试：

```bash
cd java
mvn -T16 install -DskipTests
cd fory-core
FORY_GO_JAVA_CI=1 ENABLE_FORY_DEBUG_OUTPUT=1 mvn test -Dtest=org.apache.fory.xlang.GoXlangTest
```

环境要求：Go 1.24+。

## Rust

```bash
cd rust
cargo build
cargo test --features tests

# Debug a specific test
RUST_BACKTRACE=1 FORY_PANIC_ON_ERROR=1 ENABLE_FORY_DEBUG_OUTPUT=1 \
  cargo test --test mod $dir$::$test_file::$test_method -- --nocapture
```

环境要求：

- 通过 rustup 安装的 Rust 工具链
- `cargo-expand`（可选，用于调试宏展开）

## JavaScript

```bash
cd javascript
npm install

npm run build
node ./node_modules/.bin/jest --ci --reporters=default --reporters=jest-junit
```

环境要求：

- Node.js (LTS)
- npm

## Markdown

```bash
cd docs
npx prettier --write "**/*.md"
```

环境要求：

- Node.js (LTS)
- npm

## 调试

仓库中的 VS Code、Bazel、LLDB 和 GDB 配置请参阅[调试 C++](cpp-debugging.md)。

不属于共享仓库构建的语言特定贡献者说明，仍保留在各语言的源代码树和贡献者
README 中。

## 参与贡献

有关贡献的详细信息，请参阅
[如何为 Apache Fory™ 做贡献](https://github.com/apache/fory/blob/main/CONTRIBUTING.md)。
对于 AI 辅助的贡献，请遵循
[AI 贡献政策](https://github.com/apache/fory/blob/main/AI_POLICY.md)，包括大量使用 AI 辅助时
所需的自我审查、双审查者 AI 审查流程、披露和验证证据。
