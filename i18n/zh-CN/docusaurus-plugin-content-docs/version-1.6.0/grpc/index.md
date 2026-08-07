---
title: 概述
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

当每个对端都基于同一份 Fory IDL、protobuf IDL 或 FlatBuffers IDL 契约生成，并支持对应语言的
匹配 Fory 实现时，请使用 Fory gRPC。如果需要通用 protobuf 客户端、反射工具或 protobuf 消息字节，
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
3. 添加所选语言的标准 gRPC 依赖。
4. 实现生成的 server base，并调用生成的客户端。
5. 验证生成对端之间的一元调用和流式调用。

Python 默认生成异步 `grpc.aio` 配套代码，并支持通过 `--grpc-python-mode=sync` 生成同步代码。
JavaScript 在 Node.js 中使用 `@grpc/grpc-js`；浏览器客户端通过 `--grpc-web` 单独生成，
并使用 `grpc-web`。

## 架构

生成的服务配套代码使用标准 gRPC server、channel、方法描述符、deadline、状态码、interceptor
和流式 API。Fory 生成的 marshaller 负责对生成的请求和响应模型进行编码和解码。

### 职责边界

Fory 可以为应用提供的 gRPC 实现生成服务配套代码。这些代码为请求和响应对象提供 Fory 序列化；
listener、channel、credential、身份认证、授权、deadline、重试和传输生命周期仍由应用和 gRPC 技术栈负责。

Fory 软件包不会将某个 gRPC 实现作为强制依赖。应用负责选择和配置相应的 gRPC 库。

### 生成的服务接口

编译器会生成符合语言习惯的 service base、client 或 stub、方法元数据和 Fory marshaller。
模型生成详见[生成代码](../compiler/generated-code/index.md)；各语言页面介绍 server 与 client 集成。

## 互操作性

只有使用同一份生成服务契约、匹配的 Fory 类型标识以及兼容的生成模型 Schema，Fory gRPC 对端
才能互操作。

### 协议边界

传输协议是 gRPC，但消息字节是 Fory 载荷。通用 protobuf 客户端和 server reflection 工具无法将
这些载荷解码为 protobuf 消息。每个对端都必须通过受支持的 Fory 编译器前端生成。

### 验证

至少测试一个一元调用，以及服务使用的每种流式调用形式。protobuf `UNIMPLEMENTED` 或解码失败
通常表示对端使用了普通 protobuf stub，或使用了不同的生成服务契约。

## 语言指南

Java、Python、C++、Go、Rust、JavaScript/TypeScript、C#、Dart、Scala 和 Kotlin 均有相应的
gRPC 配套代码文档。当前依赖和流式调用支持请参阅[支持矩阵](../introduction/support-matrix.md)
以及所选语言页面。

| 语言                  | 指南                                 |
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
