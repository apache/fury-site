---
title: 概述
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

Fory IDL 是 Apache Fory 的 Schema 定义语言，用于实现类型安全的跨语言序列化。只需定义一次数据结构，即可为 Java、Python、C++、Go、Rust、JavaScript/TypeScript、C#、Swift、Dart、Scala 和 Kotlin 生成原生数据结构代码。Fory IDL 也可描述 RPC 服务；编译器可为 Java、Python、Go、Rust、C++、C#、Swift、Dart、Scala、Kotlin 和 JavaScript 生成使用 Fory 序列化请求与响应载荷的 gRPC 配套服务代码。

## Schema 示例

Fory IDL 提供简单直观的语法来定义跨语言数据结构：

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

message LookupRequest [id=107] {
    string name = 1;
}

message LookupResponse [id=108] {
    Animal animal = 1;
}

service AnimalService {
    rpc Lookup (LookupRequest) returns (LookupResponse);
    rpc Classify (Animal) returns (Animal);
}
```

使用以下命令生成 Java、Python、Go、Rust、C++、C#、Swift、Dart、Scala、Kotlin 和 JavaScript 模型及 gRPC 配套服务代码：

```bash
foryc animals.fdl --java_out=./generated/java --python_out=./generated/python --go_out=./generated/go --rust_out=./generated/rust --cpp_out=./generated/cpp --csharp_out=./generated/csharp --swift_out=./generated/swift --dart_out=./generated/dart --scala_out=./generated/scala --kotlin_out=./generated/kotlin --javascript_out=./generated/javascript --grpc
```

生成的服务代码使用常规 gRPC API，但请求和响应对象通过 Fory 序列化。各语言的依赖项、
服务端和客户端设置、流式模式、浏览器支持及互操作性边界请参阅
[Fory gRPC](../grpc/index.md)。

## 为什么选择 Fory IDL？

### Schema 优先开发

只需在 Fory IDL 中定义一次数据模型，即可为所有语言生成一致且类型安全的代码。这可以确保：

- **类型安全**：在编译时而不是代码运行时发现类型错误
- **一致性**：所有语言使用相同的字段名称、类型和结构
- **文档**：Schema 可作为持续更新的文档
- **演进**：统一管理所有实现中的 Schema 变更

### Fory 原生功能

与通用 IDL 不同，Fory IDL 专为 Fory 序列化设计：

- **引用跟踪**：通过 `ref` 对共享引用和循环引用提供一等支持
- **可空字段**：通过显式 `optional` 修饰符表示可空类型
- **类型注册**：内置支持数字 ID 和基于名称的注册
- **原生代码生成**：生成带 Fory 注解/宏且符合语言习惯的代码

### 较低的集成开销

生成的代码使用原生语言构造：

- Java：带 `@ForyField` 注解的普通 POJO
- Python：带类型提示的 dataclass
- Go：带 struct tag 的 struct
- Rust：带 `#[derive(ForyStruct)]` 的 struct
- C++：带 `FORY_STRUCT` 宏的 struct
- C#：`[ForyStruct]` 类、`[ForyEnum]` 枚举、`[ForyUnion]` 联合和注册辅助方法
- JavaScript/TypeScript：带 Schema 模块辅助方法的接口
- Swift：带字段/case 元数据和注册辅助方法的 Fory 模型宏
- Dart：使用 `@ForyStruct` 的类，带有 `@ForyField` 注解和注册辅助方法
- Scala：带宏派生序列化器的 Scala 3 `case class`、普通类、枚举和 ADT 枚举模型
- Kotlin：带 KSP 生成序列化器的 Kotlin `data class`、枚举和密封类模型

## 快速开始

### 1. 安装编译器

```bash
pip install fory-compiler
```

或者从源代码安装：

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
# Generate for all languages
foryc example.fdl --output ./generated

# Generate for specific languages
foryc example.fdl --lang java,python,cpp,csharp,javascript,swift,dart,scala,kotlin --output ./generated
```

### 4. 使用生成的代码

**Java:**

```java
Person person = new Person();
person.setName("Alice");
person.setAge(30);
byte[] data = person.toBytes();
```

**Python:**

```python
import pyfory
from example import Person

person = Person(name="Alice", age=30)
data = bytes(person) # or `person.to_bytes()`
```

**JavaScript/TypeScript:**

```ts
import { deserializePerson, serializePerson } from "./generated/example";

const data = serializePerson({ name: "Alice", age: 30, email: null });
const person = deserializePerson(data);
```

## 文档

| 文档                                         | 说明                                     |
| -------------------------------------------- | ---------------------------------------- |
| [Fory IDL 语法](schema-idl.md)               | 完整的语言语法和文法                     |
| [类型系统](schema-idl.md#type-system)        | 基本类型、集合和类型规则                 |
| [RPC 服务](schema-idl.md#service-definition) | 服务和 RPC 方法语法                      |
| [编译器 CLI](cli.md)                         | 编译器命令和选项                         |
| [构建集成](build-integration.md)             | Maven、Gradle、build.rs、CMake、Bazel 等 |
| [生成的代码](generated-code/index.md)        | 各目标语言的输出格式                     |
| [Protocol Buffers IDL 支持](protobuf-idl.md) | Protobuf 映射规则和采用指南              |
| [FlatBuffers IDL 支持](flatbuffers-idl.md)   | FlatBuffers 映射规则和代码生成差异       |

## 核心概念

### 字段修饰符

- **`optional`**：字段可以为 null/None
- **`ref`**：为共享引用/循环引用启用引用跟踪
- **`list`**：字段是有序集合（别名：`repeated`）
- **`array`**：字段是一维稠密 bool 或数值数据

```protobuf
message Example {
    optional string nullable = 1;
    ref Node parent = 2;
    list<int32> numbers = 3;
}
```

### 跨语言兼容性

Fory IDL 类型映射到各语言的原生类型：

| Fory IDL 类型 | Java      | Python         | C++           | Go       | Rust     | JavaScript/TypeScript | C#       | Swift    | Dart     | Scala     | Kotlin    |
| ------------- | --------- | -------------- | ------------- | -------- | -------- | --------------------- | -------- | -------- | -------- | --------- | --------- |
| `int32`       | `int`     | `pyfory.Int32` | `int32_t`     | `int32`  | `i32`    | `number`              | `int`    | `Int32`  | `int`    | `Int`     | `Int`     |
| `string`      | `String`  | `str`          | `std::string` | `string` | `String` | `string`              | `string` | `String` | `String` | `String`  | `String`  |
| `bool`        | `boolean` | `bool`         | `bool`        | `bool`   | `bool`   | `boolean`             | `bool`   | `Bool`   | `bool`   | `Boolean` | `Boolean` |

完整映射请参阅[类型系统](schema-idl.md#type-system)。

## 最佳实践

1. **使用有意义的包名称**：将相关类型组织在一起
2. **为性能分配类型 ID**：数字 ID 比基于名称的注册更快
3. **预留 ID 范围**：为未来新增内容留出空档（例如用户使用 100-199，订单使用 200-299）
4. **显式使用 `optional`**：在 Schema 中清楚表达可空性
5. **对共享对象使用 `ref`**：对象共享时启用引用跟踪

## 示例

完整的可运行示例请参阅 [examples](https://github.com/apache/fory/tree/main/compiler/examples) 目录。
