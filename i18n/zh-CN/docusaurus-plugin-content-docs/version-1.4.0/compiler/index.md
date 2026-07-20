---
title: 概览
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

Fory IDL 是 Apache Fory 的 Schema 定义语言，可实现类型安全的跨语言序列化。
你只需定义一次数据结构，即可为 Java、Python、Go、Rust、C++、C#、Swift、Dart、Scala、Kotlin 和 JavaScript/TypeScript 生成原生数据结构代码。Fory IDL 也可以描述 RPC service；对于 Java、Python、Go、Rust、C#、Dart、Scala、Kotlin 和 JavaScript，compiler 可以生成使用 Fory 序列化 request/response payload 的 gRPC service companion。

## 示例 Schema

Fory IDL 提供了简单直观的语法来定义跨语言数据结构：

```protobuf
package example;

enum Status {
    PENDING = 0;
    ACTIVE = 1;
    COMPLETED = 2;
}

message User {
    string name = 1;
    int32 age = 2;
    optional string email = 3;
    list<string> tags = 4;
}

message Item {
    string sku = 1;
    int32 quantity = 2;
}

message Order {
    ref User customer = 1;
    list<Item> items = 2;
    Status status = 3;
    map<string, int32> metadata = 4;
}

message Dog [id=104] {
    string name = 1;
    int32 bark_volume = 2;
}

message Cat [id=105] {
    string name = 1;
    int32 lives = 2;
}

union Animal [id=106] {
    Dog dog = 1;
    Cat cat = 2;
}
```

## 为什么选择 Fory IDL？

### Schema 优先开发

在 Fory IDL 中一次定义数据模型，即可在所有语言中生成一致且类型安全的代码。这样可以确保：

- **类型安全**：在编译期而不是运行期发现类型错误
- **一致性**：各语言使用相同字段名、类型和结构
- **文档性**：Schema 本身就是可持续演进的文档
- **可演进性**：可在所有实现中受控地进行 Schema 变更

### Fory 原生能力

与通用 IDL 不同，Fory IDL 专门为 Fory 序列化设计：

- **引用跟踪**：通过 `ref` 一等支持共享引用和循环引用
- **可空字段**：通过 `optional` 显式声明可空类型
- **类型注册**：内置支持数值 ID 与基于命名空间的注册
- **原生代码生成**：生成带 Fory 注解/宏的语言惯用代码

### 集成开销低

生成代码直接使用各语言原生构造：

- Java：带 `@ForyField` 注解的普通 POJO
- Python：带类型提示的 dataclass
- Go：带 struct tag 的结构体
- Rust：带 `#[derive(ForyObject)]` 的结构体
- C++：带 `FORY_STRUCT` 宏的结构体
- C#：带 `[ForyObject]` 的类及注册辅助函数
- JavaScript：带注册函数的接口
- Swift：带 `@ForyObject` 模型、`@ForyField` 元数据和注册辅助函数
- Dart：带 `@ForyStruct` 类、`@ForyField` 注解和注册辅助函数

## 快速开始

### 1. 安装编译器

```bash
pip install fory-compiler
```

或从源码安装：

```bash
cd compiler
pip install -e .
```

### 2. 编写 Schema

创建 `example.fdl`：

```protobuf
package example;

message Person {
    string name = 1;
    int32 age = 2;
    optional string email = 3;
}
```

### 3. 生成代码

```bash
# 为所有语言生成
foryc example.fdl --output ./generated

# 为指定语言生成
foryc example.fdl --lang java,python,csharp,javascript,swift,dart --output ./generated
```

为包含 service 定义的 schema 生成 Java、Python、Go、Rust、C#、Dart、Scala、Kotlin 和 JavaScript model 以及 gRPC service companion：

```bash
foryc animals.fdl --java_out=./generated/java --python_out=./generated/python --go_out=./generated/go --rust_out=./generated/rust --csharp_out=./generated/csharp --dart_out=./generated/dart --scala_out=./generated/scala --kotlin_out=./generated/kotlin --javascript_out=./generated/javascript --grpc
```

生成的 service 代码使用标准 gRPC API，但 request 和 response 对象使用 Fory 序列化。应用需要自行提供 grpc-java、grpc-kotlin、Scala grpc-java API、`grpcio`、grpc-go、Rust `tonic` 和 `bytes`、C# `Grpc.Core.Api` 及 server/client 依赖，或 Dart `package:grpc`；Fory package 不会把 gRPC 作为硬依赖。Python companion 默认使用 `grpc.aio`，也可以通过 `--grpc-python-mode=sync` 生成同步模式。JavaScript Node.js companion 使用 `@grpc/grpc-js`；浏览器 client 通过 `--grpc-web` 单独生成并使用 `grpc-web`。

### 4. 使用生成代码

**Java：**

```java
Person person = new Person();
person.setName("Alice");
person.setAge(30);
byte[] data = person.toBytes();
```

**Python：**

```python
import pyfory
from example import Person

person = Person(name="Alice", age=30)
data = bytes(person) # 或 `person.to_bytes()`
```

## 文档导航

| 文档                                         | 说明                               |
| -------------------------------------------- | ---------------------------------- |
| [Fory IDL 语法](schema-idl.md)               | 完整语言语法与文法                 |
| [类型系统](schema-idl.md#type-system)        | 基础类型、集合类型与类型规则       |
| [编译器指南](compiler-guide.md)              | CLI 选项与构建集成                 |
| [生成代码](generated-code.md)                | 各目标语言的输出格式               |
| [Protocol Buffers IDL 支持](protobuf-idl.md) | 与 protobuf 的对比及迁移指南       |
| [FlatBuffers IDL 支持](flatbuffers-idl.md)   | FlatBuffers 映射规则与代码生成差异 |

## 核心概念

### 字段修饰符

- **`optional`**：字段可为 null/None
- **`ref`**：为共享/循环引用启用引用跟踪
- **`list`**：字段为列表/数组（别名：`repeated`）

```protobuf
message Example {
    optional string nullable = 1;
    ref Node parent = 2;
    list<int32> numbers = 3;
}
```

### 跨语言兼容

Fory IDL 类型会映射为各语言原生类型：

| Fory IDL 类型 | Java      | Python         | Go       | Rust     | C++           | C#       | JavaScript | Swift    | Dart     |
| ------------- | --------- | -------------- | -------- | -------- | ------------- | -------- | ---------- | -------- | -------- |
| `int32`       | `int`     | `pyfory.int32` | `int32`  | `i32`    | `int32_t`     | `int`    | `number`   | `Int32`  | `Int32`  |
| `string`      | `String`  | `str`          | `string` | `String` | `std::string` | `string` | `string`   | `String` | `String` |
| `bool`        | `boolean` | `bool`         | `bool`   | `bool`   | `bool`        | `bool`   | `boolean`  | `Bool`   | `bool`   |

完整映射请参见 [类型系统](schema-idl.md#type-system)。

## 最佳实践

1. **使用有意义的 package 名称**：将相关类型分组管理
2. **为性能分配类型 ID**：数值 ID 比基于名称的注册更高效
3. **预留 ID 范围**：为后续扩展保留空隙（例如用户 100-199，订单 200-299）
4. **显式使用 `optional`**：清晰表达可空语义
5. **共享对象使用 `ref`**：对象可能被多处引用时开启引用跟踪

## 示例

完整可运行示例见 [examples](https://github.com/apache/fory/tree/main/compiler/examples) 目录。
