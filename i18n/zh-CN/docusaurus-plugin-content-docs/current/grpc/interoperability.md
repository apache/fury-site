---
title: 互操作性
sidebar_position: 3
id: interoperability
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

只有使用同一份生成服务契约、匹配的 Fory 类型标识以及兼容的生成模型 Schema，Fory gRPC 对端
才能互操作。

## 协议边界

传输协议是 gRPC，但消息字节是 Fory 载荷。通用 protobuf 客户端和 server reflection 工具无法将
这些载荷解码为 protobuf 消息。每个对端都必须通过受支持的 Fory 编译器前端生成。

## 支持的生成配套代码

Java、Python、C++、Go、Rust、JavaScript/TypeScript、C#、Dart、Scala 和 Kotlin 均有相应的
gRPC 配套代码文档。当前依赖和流式调用支持请参阅[支持矩阵](../introduction/support-matrix.md)
以及所选运行时页面。

## 验证

至少测试一个一元调用，以及服务使用的每种流式调用形式。protobuf `UNIMPLEMENTED` 或解码失败
通常表示对端使用了普通 protobuf stub，或使用了不同的生成服务契约。
