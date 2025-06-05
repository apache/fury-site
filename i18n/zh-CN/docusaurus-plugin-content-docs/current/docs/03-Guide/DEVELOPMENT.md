---
title: 开发指南
sidebar_position: 7
id: development
---

## 本地构建 Apache Fory

从 [Github 代码库](https://github.com/apache/fory) 拉取最新代码。

### 构建 Apache Fory Java

```bash
cd java
mvn clean compile -DskipTests
```

#### 本地环境要求

- java 1.8+
- maven 3.6.3+

### 构建 Apache Fory Python

```bash
cd python
pip install pyarrow==14.0.0 Cython wheel numpy pytest
pip install -v -e .
```

#### 本地环境要求

- python 3.6+

### 构建 Apache Fory C++

Build fory row format：

```bash
pip install pyarrow==14.0.0
bazel build //cpp/fory/row:fory_row_format
```

Build fory row format encoder:

```bash
pip install pyarrow==14.0.0
bazel build //cpp/fory/encoder:fory_encoder
```

#### 本地环境要求

- compilers with C++17 support
- bazel 6.3.2

### 构建 Apache Fory GoLang

```bash
cd go/fory
# run test
go test -v
# run xlang test
go test -v fory_xlang_test.go
```

#### 本地环境要求

- go 1.13+

### 构建 Apache Fory Rust

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

### 构建 Apache Fory JavaScript

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
