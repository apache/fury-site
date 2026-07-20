---
title: Protobuf IDL 支持
sidebar_position: 10
id: protobuf_idl_support
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

本页说明 Apache Fory 如何处理 Protocol Buffers（`.proto`）schema、protobuf 概念如何映射到 Fory，以及 protobuf 专用 Fory 扩展选项的使用方式。

## 本页内容

- 如何在具体场景下选择 protobuf 或 Fory
- 迁移时需要关注的语法与语义差异
- `.proto` 文件中支持的 Fory 扩展选项
- 从 protobuf 迁移到 Fory 的实践路径

## 快速决策指南

| 场景                                                  | 建议格式         |
| ----------------------------------------------------- | ---------------- |
| 主要构建 gRPC API，依赖 protobuf 工具链               | Protocol Buffers |
| 需要极致对象图性能与引用跟踪                          | Fory             |
| 需要在序列化数据中表达循环/共享引用                   | Fory             |
| 需要强 unknown-field 语义保证线格式兼容               | Protocol Buffers |
| 希望直接使用原生 struct/class，而非 protobuf 包装类型 | Fory             |

## Protobuf 与 Fory 对比

| 维度      | Protocol Buffers      | Fory                   |
| --------- | --------------------- | ---------------------- |
| 主要目标  | RPC/消息契约          | 高性能对象序列化       |
| 编码模型  | Tag-Length-Value      | Fory 二进制协议        |
| 引用跟踪  | 非内建                | 一等支持（`ref`）      |
| 循环引用  | 不支持                | 支持                   |
| 未知字段  | 保留                  | 不保留                 |
| 生成类型  | protobuf 专用模型类型 | 语言原生构造           |
| gRPC 生态 | 原生成熟              | Java/Python/Go/Rust/C#/Dart/Scala/Kotlin/JavaScript service codegen |

Fory 可以通过 `--grpc` 生成 Java、Python、Go、Rust、C#、Dart、Scala、Kotlin 和 JavaScript gRPC service companion。JavaScript 浏览器 client 通过 `--grpc-web` 生成。这些 service 使用标准 gRPC 传输，但 request 和 response payload 使用 Fory 序列化，而不是 protobuf。对于广泛的 gRPC 生态工具、schema reflection 和 protobuf-native interceptor，protobuf 仍是更成熟的默认选择。

## 为什么使用 Apache Fory

- **代码更贴近语言习惯**：Fory IDL 生成的类和结构体可直接作为业务领域对象使用。
- **序列化性能更高**：在 Fory 基准中，Fory 在对象序列化场景中可显著快于 protobuf。
- **对象图表达更自然**：共享引用和循环引用是内建能力，无需通过业务层 ID 关联绕过。

性能细节请参见 [性能参考](#性能参考)。

## 语法与语义映射

### Package 与文件级选项

**Protocol Buffers**

```protobuf
syntax = "proto3";
package example.models;
option java_package = "com.example.models";
option go_package = "example.com/models";
```

**Fory**

```protobuf
package example.models;
```

Fory 使用统一 package 命名空间做跨语言注册。语言特定的包路径仍可在代码生成阶段单独配置。

### Message 与 Enum 定义

**Protocol Buffers**

```protobuf
message User {
  string id = 1;
  string name = 2;
  optional string email = 3;
  int32 age = 4;
  repeated string tags = 5;
  map<string, string> metadata = 6;
}

enum Status {
  STATUS_UNSPECIFIED = 0;
  STATUS_ACTIVE = 1;
}
```

**Fory**

```protobuf
message User [id=101] {
    string id = 1;
    string name = 2;
    optional string email = 3;
    int32 age = 4;
    list<string> tags = 5;
    map<string, string> metadata = 6;
}

enum Status [id=102] {
    UNKNOWN = 0;
    ACTIVE = 1;
}
```

关键差异：

- Fory 可直接分配稳定类型 ID（`[id=...]`）。
- Fory 使用 `list<T>`（`repeated T` 为兼容别名）。
- 枚举命名更偏向语言习惯，而非 protobuf 前缀风格。

### `oneof` 到 `union`

protobuf 的 `oneof` 会被翻译为嵌套 Fory `union`，并增加一个可选字段指向该 union。

**Protocol Buffers**

```protobuf
message Event {
  oneof payload {
    string text = 1;
    int32 number = 2;
  }
}
```

**转换后的 Fory 结构**

```protobuf
message Event {
    union payload {
        string text = 1;
        int32 number = 2;
    }
    optional payload payload = 1;
}
```

说明：

- union case ID 来自原 `oneof` 字段号。
- 自动生成的 union 引用字段使用 `oneof` 中最小字段号。

### Import 与 Well-Known Types

支持 protobuf import。常见 well-known types 会直接映射：

- `google.protobuf.Timestamp` -> `timestamp`
- `google.protobuf.Duration` -> `duration`
- `google.protobuf.Any` -> `any`

## 类型映射要点

| Protobuf Type                            | Fory 映射                     |
| ---------------------------------------- | ----------------------------- |
| `bool`                                   | `bool`                        |
| `int32`, `uint32`                        | 可变长 32 位整型家族          |
| `sint32`                                 | zigzag 32 位整型              |
| `int64`, `uint64`                        | 可变长 64 位整型家族          |
| `sint64`                                 | zigzag 64 位整型              |
| `fixed32`, `fixed64`                     | 定长无符号整型家族            |
| `sfixed32`, `sfixed64`                   | 定长有符号整型家族            |
| `float`, `double`                        | `float32`, `float64`          |
| `string`, `bytes`                        | `string`, `bytes`             |
| `repeated T`                             | `list<T>`                     |
| `map<K, V>`                              | `map<K, V>`                   |
| `optional T`                             | `optional T`                  |
| `oneof`                                  | `union` + 可选 union 引用字段 |
| `int64 [(fory).type = "tagged_int64"]`   | `tagged_int64` 编码           |
| `uint64 [(fory).type = "tagged_uint64"]` | `tagged_uint64` 编码          |

## Fory 扩展选项（Protobuf）

`.proto` 文件中的 Fory 专用选项使用 `(fory).` 前缀。

```protobuf
option (fory).enable_auto_type_id = true;

message TreeNode {
  TreeNode parent = 1 [(fory).weak_ref = true];
  repeated TreeNode children = 2 [(fory).ref = true];
}
```

### 文件级选项

| 选项                                 | 类型   | 说明                                                |
| ------------------------------------ | ------ | --------------------------------------------------- |
| `(fory).use_record_for_java_message` | bool   | 对该文件所有 message 生成 Java record               |
| `(fory).polymorphism`                | bool   | 默认开启多态序列化元信息                            |
| `(fory).enable_auto_type_id`         | bool   | 缺失时自动生成类型 ID（编译器默认 true）            |
| `(fory).evolving`                    | bool   | message 的默认 schema 演进行为                      |
| `(fory).go_nested_type_style`        | string | Go 嵌套命名风格：`underscore`（默认）或 `camelcase` |

### Message 与 Enum 级选项

| 选项                         | 作用对象      | 类型   | 说明                          |
| ---------------------------- | ------------- | ------ | ----------------------------- |
| `(fory).id`                  | message, enum | int    | 显式类型 ID（用于注册）       |
| `(fory).alias`               | message, enum | string | 自动 ID 哈希使用的别名        |
| `(fory).evolving`            | message       | bool   | 覆盖文件级演进设置            |
| `(fory).use_record_for_java` | message       | bool   | 为该 message 生成 Java record |
| `(fory).deprecated`          | message, enum | bool   | 标记类型为弃用                |
| `(fory).namespace`           | message       | string | 覆盖默认 package 命名空间     |

### 字段级选项

| 选项                         | 类型   | 说明                                                                  |
| ---------------------------- | ------ | --------------------------------------------------------------------- |
| `(fory).ref`                 | bool   | 为该字段启用引用跟踪                                                  |
| `(fory).nullable`            | bool   | 将字段视为可空（`optional`）                                          |
| `(fory).weak_ref`            | bool   | 生成弱指针语义（C++/Rust 代码生成）                                   |
| `(fory).thread_safe_pointer` | bool   | 对 ref 字段使用 Rust `Arc`/`ArcWeak`；默认 `false` 使用 `Rc`/`RcWeak` |
| `(fory).deprecated`          | bool   | 标记字段为弃用                                                        |
| `(fory).type`                | string | 基础类型覆盖，目前支持 `tagged_int64`/`tagged_uint64`                 |

引用相关行为：

- `weak_ref = true` 隐含开启 ref 跟踪。
- 对 `repeated` 字段，`(fory).ref = true` 作用于列表元素。
- 对 `map<K, V>` 字段，`(fory).ref = true` 作用于 map value。
- `weak_ref` 与 `thread_safe_pointer` 是 C++/Rust 代码生成提示。
- `thread_safe_pointer` 默认为 `false`；它只改变生成的 Rust 指针承载类型，不改变编码格式。
- 在 Rust 代码生成中，`(fory).weak_ref = true` 默认使用 `RcWeak`；只有同时设置
  `(fory).thread_safe_pointer = true` 时才会切换为 `ArcWeak`。

### 典型选项组合示例

```protobuf
message Graph {
  Node root = 1 [(fory).ref = true, (fory).thread_safe_pointer = true];
  repeated Node nodes = 2 [(fory).ref = true];
  map<string, Node> cache = 3 [(fory).ref = true];
  Node parent = 4 [(fory).weak_ref = true];
}
```

## 引用跟踪 vs Protobuf ID 关联

protobuf 本身不保留共享/循环对象图。借助 Fory protobuf 扩展，可以显式启用对象图语义。

**不使用 Fory ref 选项（protobuf 风格 ID 关联）：**

```protobuf
message TreeNode {
  string id = 1;
  string parent_id = 2;
  repeated string child_ids = 3;
}
```

**使用 Fory ref 选项（对象图语义）：**

```protobuf
message TreeNode {
  TreeNode parent = 1 [(fory).weak_ref = true];
  repeated TreeNode children = 2 [(fory).ref = true];
}
```

## 迁移指南：Protobuf 到 Fory

### 第 1 步：转换 schema 语法

- 保持 package 名称稳定。
- 将 `repeated T` 改为 `list<T>`（或保留 `repeated` 别名）。
- 在需要稳定数值注册的位置添加显式 `[id=...]`。

### 第 2 步：处理 `oneof` 与特殊类型

- `oneof` -> `union` + 可选 union 字段。
- 将 protobuf well-known types 映射到 Fory 基础类型（`timestamp`、`duration`、`any`）。

### 第 3 步：用 `ref` 替换 protobuf 的对象图绕过方案

若 protobuf 里通过手工 ID 关联表达对象图，迁移到 Fory 后应改用 `ref` 修饰符（必要时使用 `ref(weak=true)`）。

### 第 4 步：更新构建与代码生成

将 protobuf 代码生成步骤替换为 Fory 编译器针对目标语言的生成命令。

对于支持的 service 输出，添加 `--grpc` 以生成 gRPC companion 代码：

```bash
foryc api.proto --java_out=./generated/java --python_out=./generated/python --go_out=./generated/go --rust_out=./generated/rust --csharp_out=./generated/csharp --dart_out=./generated/dart --scala_out=./generated/scala --kotlin_out=./generated/kotlin --javascript_out=./generated/javascript --grpc
```

生成的 Java service 文件依赖 grpc-java；Python service module 默认使用 `grpc.aio`；Rust service 文件导入 `tonic` 和 `bytes`；Go service 文件导入 grpc-go；JavaScript Node.js service 文件导入 `@grpc/grpc-js`；C# service 文件导入 `Grpc.Core.Api` 类型；Dart service 文件导入 `package:grpc`；Scala service 文件依赖 grpc-java；Kotlin service 文件依赖 grpc-java 和 grpc-kotlin。请在应用构建中加入这些依赖；Fory package 不会把 gRPC 作为硬依赖。同步 Python `grpcio` companion 可使用 `--grpc-python-mode=sync`。JavaScript 输出配合 `--grpc-web` 可生成导入 `grpc-web` 的浏览器 client。

### 第 5 步：执行兼容性验证

分阶段迁移时，可并行保留两种格式，并通过集成测试验证 payload 级一致性。

## 共存策略

迁移期间可以并行运行 protobuf 与 Fory：

```java
public byte[] serialize(Object obj, Format format) {
    if (format == Format.PROTOBUF) {
        return ((MessageLite) obj).toByteArray();
    }
    return fory.serialize(obj);
}
```

可在服务边界设置转换层，并优先迁移内部对象图较重的链路。

## 性能参考

- Benchmarks: https://fory.apache.org/docs/introduction/benchmark
- Benchmark code: https://github.com/apache/fory/tree/main/benchmarks

## 总结

当主要关注 API 契约与 gRPC 生态时，建议使用 protobuf。若主要关注对象图性能、原生数据模型与引用语义，建议使用 Fory。
