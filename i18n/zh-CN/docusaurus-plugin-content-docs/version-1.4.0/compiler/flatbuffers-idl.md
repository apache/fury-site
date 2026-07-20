---
title: FlatBuffers IDL 支持
sidebar_position: 7
id: flatbuffers_idl
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

本页说明 Apache Fory 如何读取 FlatBuffers schema（`.fbs`）并将其转换为 Fory IR 以生成代码。

## 本页内容

- 何时应在 Fory 中使用 FlatBuffers 输入
- FlatBuffers 到 Fory 的精确映射行为
- `.fbs` 中支持的 Fory 扩展属性
- 迁移注意事项与生成代码差异

## 为什么使用 Apache Fory

- **生成代码更符合语言习惯**：Fory 会生成各语言常用风格的类/结构体，可直接作为领域对象使用。
- **Java 性能更优**：在 Fory 的 Java 对象序列化基准中，Fory 通常快于 FlatBuffers。
- **其他语言性能相近**：序列化性能通常处于同一量级。
- **实际反序列化链路更高效**：FlatBuffers 默认并不做原生对象反序列化，因此看起来更快；但当业务需要原生对象时，还需额外转换，这一步往往成为主要开销。在这种场景下，Fory 端到端反序列化通常更快。
- **API 更简单**：Fory 直接操作原生对象，无需反向构建 table 或手动管理 offset。
- **对象图建模能力更强**：Fory 原生支持共享引用和循环引用。

## 快速决策指南

| 场景                                            | 建议路径                |
| ----------------------------------------------- | ----------------------- |
| 已有 `.fbs` schema，想接入 Fory 运行时/代码生成 | 使用 FlatBuffers 输入   |
| 新建 schema，希望完整使用 Fory 语法能力         | 使用原生 Fory IDL       |
| 运行时必须保持 FlatBuffers 线格式兼容           | 继续使用 FlatBuffers 栈 |
| 需要 Fory 对象图语义（`ref`、弱引用等）         | 使用 Fory               |

## FlatBuffers 到 Fory 的映射

### Schema 级规则

- `namespace` 映射为 Fory package 命名空间。
- `include` 映射为 Fory import。
- `table` 会被翻译为 `evolving=true`。
- `struct` 会被翻译为 `evolving=false`。
- `root_type` 会被解析，但 Fory 运行时/代码生成不会使用。
- `file_identifier` 与 `file_extension` 会被解析，但 Fory 代码生成不会使用。

### 字段编号

FlatBuffers 字段没有显式 field ID。Fory 会按源码声明顺序分配字段号，从 `1` 开始。

### 标量类型映射

| FlatBuffers | Fory Type |
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

向量（`[T]`）映射为 Fory 列表类型。

### 联合类型

FlatBuffers union 映射为 Fory union。

- case ID 按声明顺序分配，从 `1` 开始。
- case 名称由类型名转换为 snake_case 字段名。

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

**转换后的 Fory 结构**

```protobuf
union Payload {
    Note note = 1;
    Metric metric = 2;
}

message Container {
    Payload payload = 1;
}
```

### gRPC Service

FlatBuffers `rpc_service` 定义会转换为 Fory service。使用 `--grpc` 时，compiler 会为 Java、Python、Go、Rust、C#、Dart、Scala、Kotlin 和 JavaScript 等支持的输出生成 gRPC service companion。JavaScript 浏览器 client 通过 `--grpc-web` 生成。这些 companion 使用 Fory 序列化 request 和 response payload。

```fbs
rpc_service SearchService {
  Lookup(SearchRequest):SearchResponse;
  StreamLookup(SearchRequest):SearchResponse (streaming: "server");
}
```

```bash
foryc api.fbs --java_out=./generated/java --python_out=./generated/python --go_out=./generated/go --rust_out=./generated/rust --csharp_out=./generated/csharp --dart_out=./generated/dart --scala_out=./generated/scala --kotlin_out=./generated/kotlin --javascript_out=./generated/javascript --grpc
```

生成的 service 代码会导入 gRPC API，因此编译或运行这些文件的应用需要提供 grpc-java、grpc-kotlin、Scala grpc-java API、`grpcio`、grpc-go、Rust `tonic` 和 `bytes`、`@grpc/grpc-js`、C# `Grpc.Core.Api` 及 server/client 依赖，或 Dart `package:grpc`。Python companion 默认使用 `grpc.aio`，也可以通过 `--grpc-python-mode=sync` 生成同步模式。Fory package 不会把 gRPC 作为硬依赖。JavaScript 输出配合 `--grpc-web` 可生成导入 `grpc-web` 的浏览器 client。

### 默认值与元数据

- FlatBuffers 默认值会被解析，但不会作为 Fory 运行时默认值生效。
- 非 Fory 的 metadata 属性会作为通用 option 保留在 IR 中，供下游工具按需消费。

## FlatBuffers 中的 Fory 扩展属性

FlatBuffers metadata 属性写法为 `key:value`。对于 Fory 扩展选项，在 `.fbs` 中使用 `fory_`（或 `fory.`）前缀；解析时会去掉该前缀。

### 支持的字段属性

| FlatBuffers Attribute           | 在 Fory 中的效果                                                         |
| ------------------------------- | ------------------------------------------------------------------------ |
| `fory_ref:true`                 | 为字段启用引用跟踪                                                       |
| `fory_nullable:true`            | 将字段标记为 optional/nullable                                           |
| `fory_weak_ref:true`            | 启用弱引用语义，并隐含开启 `ref`                                         |
| `fory_thread_safe_pointer:true` | 对 ref 字段使用 Rust `Arc`/`ArcWeak`，而不是默认的 `Rc`/`RcWeak`         |

语义说明：

- `fory_weak_ref:true` 隐含 `ref`。
- `fory_thread_safe_pointer` 默认为 `false`，仅在字段启用 ref 跟踪时生效，且不会改变编码格式。
- 在 Rust 代码生成中，`fory_weak_ref:true` 默认使用 `RcWeak`；只有同时设置
  `fory_thread_safe_pointer:true` 时才会切换为 `ArcWeak`。
- 对列表字段，`fory_ref:true` 作用于列表元素。

示例：

```fbs
table Node {
  parent: Node (fory_weak_ref: true);
  children: [Node] (fory_ref: true);
  cached: Node (fory_ref: true, fory_thread_safe_pointer: true);
}
```

## 生成代码差异

即使用 `.fbs` 作为 Fory 输入，生成的依然是标准 Fory 代码，而不是 FlatBuffers 的 `ByteBuffer` 风格 API。

- Java：带 Fory 元数据的 POJO/record
- Python：dataclass 与注册辅助代码
- Go/Rust/C++：原生结构体与 Fory 元数据

最终序列化格式是 Fory 二进制协议，而不是 FlatBuffers 线格式。

## 用法

直接编译 FlatBuffers schema：

```bash
foryc schema.fbs --lang java,python --output ./generated
```

输出转换后的 Fory schema 语法以便调试：

```bash
foryc schema.fbs --emit-fdl --emit-fdl-path ./translated
```

## 迁移注意事项

1. 保持现有 `namespace` 稳定，以保证类型注册稳定。
2. 检查依赖 FlatBuffers 字面量默认值的字段，并在业务代码中补充显式默认值。
3. 在需要对象图语义的字段上添加 `fory_ref`/`fory_weak_ref`。
4. 替换现有序列化路径前，先用 roundtrip 测试验证生成模型行为。

## 总结

FlatBuffers 输入模式可让你复用现有 `.fbs` schema，同时迁移到 Fory 运行时与代码生成模型。它适合渐进式迁移场景：既保留既有 schema 投入，又能采用 Fory 原生对象 API。
