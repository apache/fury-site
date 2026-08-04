---
title: 原生序列化
sidebar_position: 2
id: native
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

原生序列化使用绑定特有的编码格式和所属运行时的原生类型系统。它不是共享的跨语言协议。

## 何时使用原生模式

当同一运行时之间的通信需要语言特有对象形状、从宿主序列化器迁移，或者需要不受 xlang
类型映射约束且更小、更快的格式时，请使用原生模式。只要需要由不同运行时读取字节，
就应使用 [xlang 模式](xlang/index.md)。

## 支持的运行时系列

- [Java](java/native.md)，包括 Scala 和 Kotlin 使用的 JVM 路径
- [Python](python/native.md)
- [C++](cpp/native.md)
- [Go](go/native.md)
- [Rust](rust/native.md)
- [Scala](scala/native.md)
- [Kotlin](kotlin/native.md)

每个运行时页面负责介绍其具体对象模型、Schema 规则、配置、扩展 API 和诊断方式。不同
运行时系列的原生载荷不能互换。
