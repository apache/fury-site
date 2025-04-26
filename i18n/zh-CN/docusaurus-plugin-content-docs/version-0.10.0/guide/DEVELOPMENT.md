---
title: 开发指南
sidebar_position: 7
id: development
---

## 本地构建 Apache Fury

从 [Github 代码库](https://github.com/apache/fury) 拉取最新代码。

### 构建 Apache Fury Java

```bash
cd java
mvn clean compile -DskipTests
```

#### 本地环境要求

- java 1.8+
- maven 3.6.3+

### 构建 Apache Fury Python

```bash
cd python
pip install pyarrow==14.0.0 Cython wheel numpy pytest
pip install -v -e .
```

#### 本地环境要求

- python 3.6+

### 构建 Apache Fury C++

Build fury row format：

```bash
pip install pyarrow==14.0.0
bazel build //cpp/fury/row:fury_row_format
```

Build fury row format encoder:

```bash
pip install pyarrow==14.0.0
bazel build //cpp/fury/encoder:fury_encoder
```

#### 本地环境要求

- compilers with C++17 support
- bazel 6.3.2

### 构建 Apache Fury GoLang

```bash
cd go/fury
# run test
go test -v
# run xlang test
go test -v fury_xlang_test.go
```

#### 本地环境要求

- go 1.13+

### 构建 Apache Fury Rust

```bash
cd rust
# build
cargo build
# run test
cargo test
```

#### 本地环境要求

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### 构建 Apache Fury JavaScript

```bash
cd javascript
npm install

# run build
npm run build
# run test
npm run test
```

#### 本地环境要求

- node 14+
- npm 8+
