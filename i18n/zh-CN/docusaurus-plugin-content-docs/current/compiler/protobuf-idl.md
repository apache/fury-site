---
title: Protobuf IDL 支持
sidebar_position: 5
id: protobuf-idl
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

本页介绍 Apache Fory 如何处理 Protocol Buffers（`.proto`）Schema、protobuf 概念如何
映射到 Fory，以及如何使用 protobuf 专属的 Fory 扩展选项。

## 本页内容

- 根据使用场景选择 protobuf 或 Fory
- 采用过程中需要关注的语法和语义差异
- protobuf 文件中支持的 Fory 扩展选项
- 从 protobuf 迁移到 Fory 的实用模式

## 快速决策指南

| 场景                                       | 推荐格式         |
| ------------------------------------------ | ---------------- |
| 正在构建 gRPC API 并依赖 protobuf 工具     | Protocol Buffers |
| 需要最佳对象图性能和引用跟踪               | Fory             |
| 序列化数据中需要循环引用/共享引用          | Fory             |
| 编码兼容性需要强大的未知字段行为           | Protocol Buffers |
| 需要原生 struct/类，而不是 protobuf 包装器 | Fory             |

## Protobuf 与 Fory 对比概览

| 方面      | Protocol Buffers      | Fory                                                             |
| --------- | --------------------- | ---------------------------------------------------------------- |
| 主要用途  | RPC/消息契约          | 高性能对象序列化                                                 |
| 编码模型  | 标签-长度-值          | Fory 二进制协议                                                  |
| 引用跟踪  | 未内置                | 一等功能（`ref`）                                                |
| 循环引用  | 不支持                | 支持                                                             |
| 未知字段  | 保留                  | 不保留                                                           |
| 生成类型  | Protobuf 特有模型类型 | 原生语言构造                                                     |
| gRPC 生态 | 原生                  | Java/Python/Go/Rust/C#/Dart/Scala/Kotlin/JavaScript 服务代码生成 |

Fory 可以使用 `--grpc` 生成 Java、Python、Go、Rust、C#、Dart、Scala、Kotlin 和 JavaScript
gRPC 服务配套代码。JavaScript 浏览器客户端使用 `--grpc-web` 生成。这些服务使用常规 gRPC
传输，但通过 Fory 而不是 protobuf 序列化请求和响应载荷。对于广泛的 gRPC 生态工具、
Schema 反射和 protobuf 原生 interceptor，protobuf 仍是成熟的默认选择。

## 为什么使用 Apache Fory

- 符合语言习惯的生成代码：Fory IDL 生成可直接用作领域对象的语言原生类和 struct。
- 更快的序列化：在 Fory 基准测试中，对于对象序列化工作负载，Fory 可比 protobuf 快约 10 倍。
- 更好的对象图建模：共享引用和循环引用是一等功能，无需应用级 ID 链接变通方案。

基准测试详情请参阅[性能参考](#performance-references)。

## 语法和语义映射

### 包和文件选项

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

Fory 使用一个包命名空间进行跨语言注册。代码生成仍可配置语言特有的包位置。

### 消息和枚举定义

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

主要差异：

- Fory 可以直接分配稳定的类型 ID（`[id=...]`）。
- Fory 使用 `list<T>`（`repeated T` 作为别名）。
- 枚举命名约定由语言决定，而不是 protobuf 前缀风格。

### `oneof` 到 `union`

Protobuf `oneof` 会转换为嵌套 Fory `union`，再加上引用该联合的可选字段。

**Protocol Buffers**

```protobuf
message Event {
  oneof payload {
    string text = 1;
    int32 number = 2;
  }
}
```

**转换后的 Fory 风格形式**

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

- 联合 case ID 从原始 `oneof` 字段编号派生。
- 合成的联合字段使用最小的 `oneof` case 编号。

### 导入和常用类型

支持 Protobuf import。常见 well-known 类型直接映射：

- `google.protobuf.Timestamp` -> `timestamp`
- `google.protobuf.Duration` -> `duration`
- `google.protobuf.Any` -> `any`

## 类型映射要点

| Protobuf 类型                            | Fory 映射                  |
| ---------------------------------------- | -------------------------- |
| `bool`                                   | `bool`                     |
| `int32`, `uint32`                        | 变长 32 位整数类型         |
| `sint32`                                 | zigzag 32 位整数           |
| `int64`, `uint64`                        | 变长 64 位整数类型         |
| `sint64`                                 | zigzag 64 位整数           |
| `fixed32`, `fixed64`                     | 固定宽度无符号整数类型     |
| `sfixed32`, `sfixed64`                   | 固定宽度有符号整数类型     |
| `float`, `double`                        | `float32`, `float64`       |
| `string`, `bytes`                        | `string`, `bytes`          |
| `repeated T`                             | `list<T>`                  |
| `map<K, V>`                              | `map<K, V>`                |
| `optional T`                             | `optional T`               |
| `oneof`                                  | `union` + 可选联合引用字段 |
| `int64 [(fory).type = "tagged int64"]`   | `tagged int64` 编码        |
| `uint64 [(fory).type = "tagged uint64"]` | `tagged uint64` 编码       |

## Fory 扩展选项（Protobuf） {#fory-extension-options-protobuf}

`.proto` 中的 Fory 特有选项使用 `(fory).` 前缀。

```protobuf
option (fory).enable_auto_type_id = true;

message TreeNode {
  TreeNode parent = 1 [(fory).weak_ref = true];
  repeated TreeNode children = 2 [(fory).ref = true];
}
```

### 文件级选项

| 选项                                 | 类型   | 说明                                                             |
| ------------------------------------ | ------ | ---------------------------------------------------------------- |
| `(fory).use_record_for_java_message` | bool   | 为此文件中的所有消息生成 Java record                             |
| `(fory).polymorphism`                | bool   | 默认启用多态序列化元数据                                         |
| `(fory).enable_auto_type_id`         | bool   | 省略时自动生成类型 ID（编译器默认为 true）                       |
| `(fory).evolving`                    | bool   | 消息的默认 Schema 演进行为                                       |
| `(fory).go_nested_type_style`        | string | Go 嵌套命名风格：`underscore`（默认）或 `camelcase`              |
| `(fory).swift_namespace_style`       | string | Swift 命名空间风格：`enum`（默认）或 `flatten`；仅在包非空时适用 |

### 消息和枚举选项

| 选项                         | 适用于        | 类型   | 说明                        |
| ---------------------------- | ------------- | ------ | --------------------------- |
| `(fory).id`                  | message, enum | int    | 用于注册的显式类型 ID       |
| `(fory).alias`               | message, enum | string | 用于自动 ID hash 的替代名称 |
| `(fory).evolving`            | message       | bool   | 覆盖文件级演进设置          |
| `(fory).use_record_for_java` | message       | bool   | 为此消息生成 Java record    |
| `(fory).deprecated`          | message, enum | bool   | 将类型标记为已弃用          |
| `(fory).namespace`           | message       | string | 覆盖基于包的默认命名空间    |

### 字段级选项 {#field-level-options}

| 选项                         | 类型   | 说明                                                                                 |
| ---------------------------- | ------ | ------------------------------------------------------------------------------------ |
| `(fory).ref`                 | bool   | 为此字段启用引用跟踪                                                                 |
| `(fory).nullable`            | bool   | 将字段视为可空（`optional`）                                                         |
| `(fory).weak_ref`            | bool   | 生成弱指针语义（C++/Rust 代码生成）                                                  |
| `(fory).thread_safe_pointer` | bool   | Rust ref 载体选择；默认 `true` 使用 `Arc`/`ArcWeak`，显式 `false` 使用 `Rc`/`RcWeak` |
| `(fory).deprecated`          | bool   | 将字段标记为已弃用                                                                   |
| `(fory).type`                | string | 用于 tagged 64 位整数编码的基本类型覆盖                                              |

引用选项行为：

- `weak_ref = true` 隐含引用跟踪。
- 对于 `repeated` 字段，`(fory).ref = true` 应用于 list 元素。
- 对于 `map<K, V>` 字段，`(fory).ref = true` 应用于 map 值。
- `weak_ref` 和 `thread_safe_pointer` 是 C++/Rust 代码生成提示。
- `thread_safe_pointer` 默认为 `true`；它只改变生成的 Rust 指针载体，不会改变编码格式。
- 在 Rust 代码生成中，`(fory).weak_ref = true` 默认使用 `ArcWeak`，只会切换为
  `RcWeak`；切换条件是设置 `(fory).thread_safe_pointer = false`。

### 按形状展示选项示例

```protobuf
message Graph {
  Node root = 1 [(fory).ref = true];
  repeated Node nodes = 2 [(fory).ref = true];
  map<string, Node> cache = 3 [(fory).ref = true];
  Node parent = 4 [(fory).weak_ref = true];
  Node local = 5 [(fory).ref = true, (fory).thread_safe_pointer = false];
}
```

## 引用跟踪与 Protobuf ID 对比

Protobuf 本身不保留共享/循环对象图。使用 Fory protobuf 扩展可以选择启用对象图语义。

**不使用 Fory ref 选项（protobuf 风格 ID）：**

```protobuf
message TreeNode {
  string id = 1;
  string parent_id = 2;
  repeated string child_ids = 3;
}
```

**使用 Fory ref 选项（对象图）：**

```protobuf
message TreeNode {
  TreeNode parent = 1 [(fory).weak_ref = true];
  repeated TreeNode children = 2 [(fory).ref = true];
}
```

## 将 Protobuf Schema 迁移到 Fory

### 第 1 步：转换 Schema 语法

- 保持包名称稳定。
- 将 `repeated T` 替换为 `list<T>`（或保留 `repeated` 别名）。
- 在需要稳定数字注册的位置添加显式 `[id=...]`。

### 第 2 步：转换 `oneof` 和特殊类型

- `oneof` -> `union` + 可选联合字段。
- 将 protobuf well-known 类型映射到 Fory 基本类型（`timestamp`、`duration`、`any`）。

### 第 3 步：使用 `ref` 替换 Protobuf 变通方案

对于 protobuf 使用手动 ID 链接表示对象图的位置，改用 Fory `ref` 修饰符（并在需要时
使用可选的 `ref(weak=true)`）。

### 第 4 步：更新构建/代码生成

使用目标语言的 Fory 编译器调用替换 protobuf 生成步骤。

对于支持的服务输出，添加 `--grpc` 以生成 gRPC 配套代码：

```bash
foryc api.proto --java_out=./generated/java --python_out=./generated/python --go_out=./generated/go --rust_out=./generated/rust --csharp_out=./generated/csharp --dart_out=./generated/dart --scala_out=./generated/scala --kotlin_out=./generated/kotlin --javascript_out=./generated/javascript --grpc
```

生成的 Java 服务文件依赖 grpc-java 编译；生成的 Python 服务模块默认使用 `grpc.aio`；
生成的 Rust 服务文件导入 `tonic` 和 `bytes`；生成的 Go 服务文件导入 grpc-go；生成的
JavaScript Node.js 服务文件导入 `@grpc/grpc-js`；生成的 C# 服务文件导入
`Grpc.Core.Api` 类型；生成的 Dart 服务文件导入 `package:grpc`；生成的 Scala 服务文件
依赖 grpc-java 编译；生成的 Kotlin 服务文件依赖 grpc-java 和 grpc-kotlin 编译。请在应用
构建中添加这些依赖项；Fory 软件包不会将 gRPC 添加为硬依赖项。请使用
`--grpc-python-mode=sync` 生成同步 Python `grpcio` 配套代码。对 JavaScript 输出使用 `--grpc-web` 可生成导入
`grpc-web` 的浏览器客户端。Protobuf `oneof` 字段会转换为请求和响应消息中的 Fory 联合
字段。直接使用联合作为 RPC 请求或响应类型不属于常规 protobuf RPC 语法。

### 第 5 步：运行兼容性检查

对于分阶段迁移，请并行保留两种格式，并通过集成测试验证载荷级一致性。

## 共存策略

在分阶段迁移期间，可以并行运行 protobuf 和 Fory：

```java
public byte[] serialize(Object obj, Format format) {
    if (format == Format.PROTOBUF) {
        return ((MessageLite) obj).toByteArray();
    }
    return fory.serialize(obj);
}
```

在服务边界使用转换器，同时优先迁移大量使用对象图的内部路径。

## 性能参考 {#performance-references}

- 基准测试：https://fory.apache.org/docs/benchmarks/
- 基准测试代码：https://github.com/apache/fory/tree/main/benchmarks

## 总结

主要关注 API 契约和 gRPC 生态集成时，请使用 protobuf。主要关注对象图性能、原生模型和
引用语义时，请使用 Fory。
