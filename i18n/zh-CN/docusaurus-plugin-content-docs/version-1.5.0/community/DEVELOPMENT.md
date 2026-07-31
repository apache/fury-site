---
title: 开发指南
sidebar_position: 10
id: development
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

## 如何构建 Apache Fory™

请从 https://github.com/apache/fory 检出源代码树。

### 构建 Apache Fory™ Java

```bash
cd java
mvn clean compile -DskipTests
```

#### 环境要求

- java 1.8+
- maven 3.6.3+

### 构建 Apache Fory™ Python

```bash
cd python
# 首先卸载 numpy，以便在安装 pyarrow 时自动安装正确的 numpy 版本。
# 对于 Python 版本低于 3.13，目前不支持 numpy 2。
pip uninstall -y numpy
# 为 Python < 3.13 安装必要的环境。
pip install pyarrow Cython wheel pytest
# pip install pyarrow Cython wheel pytest
pip install -v -e .
```

#### 环境要求

- python 3.6+

### 构建 Apache Fory™ C++

构建 fory 行格式：

```bash
bazel build //cpp/fory/row:fory_row_format
```

构建 fory 行格式编码器：

```bash
bazel build //cpp/fory/encoder:fory_encoder
```

#### 环境要求

- 支持 C++17 的编译器
- bazel 6.3.2

### 构建 Apache Fory™ GoLang

```bash
cd go/fory
# 运行测试
go test -v ./...
# 运行跨语言测试
go test -v fory_xlang_test.go
```

#### 环境要求

- go 1.13+

### 构建 Apache Fory™ Rust

```bash
cd rust
# 构建
cargo build
# 运行测试
cargo test
# 运行特定测试
cargo test -p tests  --test $test_file $test_method
# 运行子目录下的特定测试
cargo test --test mod $dir$::$test_file::$test_method
# 调试子目录下的特定测试并获取回溯信息
RUST_BACKTRACE=1 FORY_PANIC_ON_ERROR=1 cargo test --test mod $dir$::$test_file::$test_method
# 检查 fory derive 宏生成的代码
cargo expand --test mod $mod$::$file$ > expanded.rs
```

#### 环境要求

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### 构建 Apache Fory™ JavaScript

```bash
cd javascript
npm install

# 运行构建
npm run build
# 运行测试
npm run test
```

#### 环境要求

- node 14+
- npm 8+

### Lint Markdown 文档

```bash
# 全局安装 prettier
npm install -g prettier

# 格式化 markdown 文件
prettier --write "**/*.md"
```

#### 环境要求

- node 14+
- npm 8+

## 贡献

更多信息，请参考[如何贡献到 Apache Fory™](https://github.com/apache/fory/blob/main/CONTRIBUTING.md)。
对于 AI 辅助贡献，请遵循 [AI Contribution Policy](https://github.com/apache/fory/blob/main/AI_POLICY.md)，包括 substantial AI assistance 所需的自审、双 reviewer AI review 循环、披露和验证证据。
