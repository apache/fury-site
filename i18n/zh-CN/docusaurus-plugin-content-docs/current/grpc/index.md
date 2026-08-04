---
title: Fory gRPC
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

Fory gRPC 将标准 gRPC 传输语义与 Fory 编译器生成的请求和响应模型结合起来。载荷 marshaller
使用 Fory，而不是 protobuf 消息字节。

## 适用场景

当每个对端都基于同一份 Fory IDL、protobuf IDL 或 FlatBuffers IDL 契约生成，并支持匹配的
Fory 运行时时，请使用 Fory gRPC。如果需要通用 protobuf 客户端、反射工具或 protobuf 消息字节，
请使用普通 protobuf gRPC。

## Schema 前端

Fory gRPC 配套代码可以从以下输入生成：

- [Fory IDL](../compiler/schema-idl.md)
- [Protocol Buffers IDL](../compiler/protobuf-idl.md)
- [FlatBuffers IDL](../compiler/flatbuffers-idl.md)

编译器的[生成代码](../compiler/generated-code/index.md)参考文档介绍模型和服务产物。
使用[构建集成](../compiler/build-integration.md)将生成流程接入项目构建。

## 工作流

1. 在受支持的编译器前端中定义消息和服务。
2. 使用 `foryc` 生成模型和 gRPC 配套代码。
3. 添加所选运行时的标准 gRPC 依赖。
4. 实现生成的 server base，并调用生成的客户端。
5. 验证生成对端之间的一元调用和流式调用。

Python 默认生成异步 `grpc.aio` 配套代码，并支持通过 `--grpc-python-mode=sync` 生成同步代码。
JavaScript 在 Node.js 中使用 `@grpc/grpc-js`；浏览器客户端通过 `--grpc-web` 单独生成，
并使用 `grpc-web`。

## 运行时指南

| 运行时                | 指南                                 |
| --------------------- | ------------------------------------ |
| Java                  | [Java](java.md)                      |
| Python                | [Python](python.md)                  |
| C++                   | [C++](cpp.md)                        |
| Go                    | [Go](go.md)                          |
| Rust                  | [Rust](rust.md)                      |
| JavaScript/TypeScript | [Node.js 与 gRPC-Web](javascript.md) |
| C#                    | [C#](csharp.md)                      |
| Dart                  | [Dart](dart.md)                      |
| Scala                 | [Scala](scala.md)                    |
| Kotlin                | [Kotlin](kotlin.md)                  |

载荷和传输的职责边界请参阅[架构](architecture.md)，对端兼容性请参阅[互操作性](interoperability.md)。
