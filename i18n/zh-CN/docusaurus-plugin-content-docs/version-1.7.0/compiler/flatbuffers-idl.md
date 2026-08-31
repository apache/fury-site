---
title: FlatBuffers IDL 支持
sidebar_position: 6
id: flatbuffers-idl
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

本页介绍 Apache Fory 如何读取 FlatBuffers Schema（`.fbs`），并将其转换为 Fory IR 以
生成代码。

## 本页内容

- 何时在 Fory 中使用 FlatBuffers 输入
- FlatBuffers 到 Fory 的确切映射行为
- `.fbs` 中支持的 Fory 特有属性
- 采用说明和生成代码差异

## 为什么使用 Apache Fory

- 符合语言习惯的生成代码：Fory 生成可直接用作领域对象的语言原生类/struct。
- Java 性能：在 Java 对象序列化工作负载中，Fory 基准测试显示 Fory 比 FlatBuffers 更快。
- 其他语言：序列化性能通常处于相近范围。
- 实际反序列化：调用方直接从 FlatBuffers 缓冲区读取时，FlatBuffers 可能更快；但需要
  原生对象的应用仍需转换，而转换步骤可能主导读取成本。在这些情况下，Fory 端到端
  反序列化通常更快。
- 更简单的 API：Fory 直接使用原生对象，因此无需反向构建 table 或手动管理偏移量。
- 更好的对象图建模：共享引用和循环引用是 Fory 的一等功能。

## 快速决策指南

| 场景                                           | 推荐路径                |
| ---------------------------------------------- | ----------------------- |
| 已有 `.fbs` Schema，希望使用 Fory API/代码生成 | 使用 FlatBuffers 输入   |
| 开始新的 Schema 工作，希望完整控制 Fory 语法   | 使用原生 Fory IDL       |
| 需要 FlatBuffers 编码兼容性                    | 保留 FlatBuffers 技术栈 |
| 需要 Fory 对象图语义（`ref`、弱引用等）        | 使用 Fory               |

## FlatBuffers 到 Fory 的映射

### Schema 级规则

- `namespace` 映射到 Fory 包命名空间。
- `include` 条目映射到 Fory import。
- `table` 转换为 `evolving=true`。
- `struct` 转换为 `evolving=false`。
- `root_type` 会被解析，但 Fory 代码生成会忽略它。
- `file_identifier` 和 `file_extension` 会被解析，但 Fory 代码生成不会使用它们。

### 字段编号

FlatBuffers 字段没有显式字段 ID。Fory 按源代码声明顺序分配字段编号，从 `1` 开始。

### 标量类型映射

| FlatBuffers | Fory 类型 |
| ----------- | --------- |
| `byte`      | `int8`    |
| `ubyte`     | `uint8`   |
| `short`     | `int16`   |
| `ushort`    | `uint16`  |
| `int`       | `int32`   |
| `uint`      | `uint32`  |
| `long`      | `int64`   |
| `ulong`     | `uint64`  |
| `float`     | `float32` |
| `double`    | `float64` |
| `bool`      | `bool`    |
| `string`    | `string`  |

Vector（`[T]`）映射到 Fory list。

### 联合

FlatBuffers 联合映射到 Fory 联合。

- Case ID 按声明顺序分配，从 `1` 开始。
- Case 名称从类型名称派生，使用 snake_case 字段命名。

**FlatBuffers**

```fbs
union Payload {
  Note,
  Metric
}

table Container {
  payload: Payload;
}
```

**转换后的 Fory 形式**

```protobuf
union Payload {
    Note note = 1;
    Metric metric = 2;
}

message Container {
    Payload payload = 1;
}
```

### 服务

FlatBuffers 的 `rpc_service` 定义会转换为 Fory 服务。使用 `--grpc` 时，编译器会为 Java、Python、Go、Rust、C#、Swift、Dart、Scala、Kotlin 和 JavaScript 等受支持的输出生成 gRPC 配套服务代码。JavaScript 浏览器客户端使用 `--grpc-web` 生成。这些代码使用 Fory 序列化请求和响应载荷。

```fbs
rpc_service SearchService {
  Lookup(SearchRequest):SearchResponse;
  StreamLookup(SearchRequest):SearchResponse (streaming: "server");
}
```

```bash
foryc api.fbs --java_out=./generated/java --python_out=./generated/python --go_out=./generated/go --rust_out=./generated/rust --csharp_out=./generated/csharp --dart_out=./generated/dart --scala_out=./generated/scala --kotlin_out=./generated/kotlin --javascript_out=./generated/javascript --grpc
```

生成的服务代码会导入 grpc API，因此应用在编译或运行这些文件时，必须提供 grpc-java、
grpc-kotlin、Scala grpc-java API、`grpcio`、grpc-go、Rust `tonic` 和 `bytes`、
`@grpc/grpc-js`、C# `Grpc.Core.Api` 及服务端/客户端依赖，或 Dart `package:grpc`。
Python 配套代码默认使用 `grpc.aio`，也可通过 `--grpc-python-mode=sync` 生成同步模式。
Fory 软件包不会将 gRPC 添加为硬依赖项。对 JavaScript 输出使用 `--grpc-web` 可生成导入
`grpc-web` 的浏览器客户端。

### 默认值与元数据

- FlatBuffers 默认值会被解析，但不会作为 Fory 默认值应用。
- 非 Fory 元数据属性会作为通用选项保留在 IR 中，并可由下游工具使用。

## FlatBuffers 中的 Fory 特有属性

FlatBuffers 元数据属性使用 `key:value`。对于 Fory 特有选项，使用 `fory_`
（或 `fory.`）前缀；解析时会从 `.fbs` 中移除该前缀。

### 支持的字段属性

| FlatBuffers 属性                 | 在 Fory 中的效果                                                 |
| -------------------------------- | ---------------------------------------------------------------- |
| `fory_ref:true`                  | 为字段启用引用跟踪                                               |
| `fory_nullable:true`             | 将字段标记为可选/可空                                            |
| `fory_weak_ref:true`             | 启用弱引用语义，并隐含 `ref`                                     |
| `fory_thread_safe_pointer:false` | 对 ref 字段选择 Rust `Rc`/`RcWeak`，而不是默认的 `Arc`/`ArcWeak` |

语义：

- `fory_weak_ref:true` 隐含 `ref`。
- `fory_thread_safe_pointer` 默认为 `true`，仅在字段跟踪引用时生效，并且不会改变编码格式。
- 在 Rust 代码生成中，`fory_weak_ref:true` 默认使用 `ArcWeak`，只会切换为
  `RcWeak`；切换条件是设置 `fory_thread_safe_pointer:false`。
- 对于 list 字段，`fory_ref:true` 应用于 list 元素。

示例：

```fbs
table Node {
  parent: Node (fory_weak_ref: true);
  children: [Node] (fory_ref: true);
  local: Node (fory_ref: true, fory_thread_safe_pointer: false);
}
```

## 生成代码差异

将 `.fbs` 用作 Fory 输入时，仍会生成常规 Fory 代码，而不是 FlatBuffers `ByteBuffer`
风格的 API。

- Java、Scala 和 Kotlin：带 Fory 元数据和注册辅助方法的 JVM 模型类型
- Python：dataclass 加注册辅助方法
- C++、Go 和 Rust：原生 struct 和 Fory 元数据
- JavaScript/TypeScript：TypeScript 接口和 Schema 辅助方法
- C#、Swift 和 Dart：带注册辅助方法的注解或基于宏的模型类型

序列化格式是 Fory 二进制协议，而不是 FlatBuffers 编码格式。

## 使用方式

直接编译 FlatBuffers Schema：

```bash
foryc schema.fbs --lang java,python --output ./generated
```

检查转换后的 Schema 语法以进行调试：

```bash
foryc schema.fbs --emit-fdl --emit-fdl-path ./translated
```

## 采用说明

1. 保持现有 `namespace` 值稳定，以保持类型注册稳定。
2. 检查依赖 FlatBuffers 默认字面量的字段，并根据需要在应用代码中设置显式默认值。
3. 在需要对象图语义的位置添加 `fory_ref`/`fory_weak_ref`。
4. 替换现有序列化路径之前，使用往返测试验证生成模型的行为。

## 总结

FlatBuffers 输入允许在迁移到 Fory 序列化和代码生成模型时复用现有 `.fbs` Schema。这有助于
在保留 Schema 投入并使用 Fory 原生对象 API 的同时逐步采用 Fory。
