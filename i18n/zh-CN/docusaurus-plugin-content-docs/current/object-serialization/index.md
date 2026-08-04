---
title: 介绍
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

二进制对象序列化会重建对象图，包括已注册的应用类型、集合、多态值以及可选的共享引用。

## 选择模式

| 模式          | 适用场景                               | 从这里开始               |
| ------------- | -------------------------------------- | ------------------------ |
| Xlang（默认） | 字节需要跨越运行时边界                 | [跨语言互操作](xlang.md) |
| Native        | 所有写入端和读取端都使用同一运行时系列 | [原生序列化](native.md)  |

Xlang 和原生模式是仅有的两种对象序列化模式。Row Format 是可随机访问的分析表示形式，
Fory JSON 是 Java JSON codec；如果目标不是重建对象，请使用
[格式选择指南](../introduction/choose-a-format.md)。

## 按运行时浏览

选择运行时以查看其安装方式、生命周期、具体 API、配置、类型注册、Schema 行为、扩展、
平台支持和故障排除信息：

| 运行时                | 模式              | 文档                                                  |
| --------------------- | ----------------- | ----------------------------------------------------- |
| Java                  | xlang 和原生      | [Java 运行时](./java/index.md)                        |
| Python                | xlang 和原生      | [Python 运行时](./python/index.md)                    |
| C++                   | xlang 和原生      | [C++ 运行时](./cpp/index.md)                          |
| Go                    | xlang 和原生      | [Go 运行时](./go/index.md)                            |
| Rust                  | xlang 和原生      | [Rust 运行时](./rust/index.md)                        |
| JavaScript/TypeScript | xlang             | [JavaScript/TypeScript 运行时](./javascript/index.md) |
| C#                    | xlang             | [C# 运行时](./csharp/index.md)                        |
| Swift                 | xlang             | [Swift 运行时](./swift/index.md)                      |
| Dart                  | xlang             | [Dart 运行时](./dart/index.md)                        |
| Scala                 | xlang 和 JVM 原生 | [Scala 运行时](./scala/index.md)                      |
| Kotlin                | xlang 和 JVM 原生 | [Kotlin 运行时](./kotlin/index.md)                    |

## 安全性

解码外部提供的字节之前，请阅读[安全](security.md)。其中介绍了两种模式下的
可接受类型策略、注册、资源限制、传输责任和负向验证。

## 规范

- [Xlang 序列化格式](../specification/xlang_serialization_spec.md)
- [Java 原生对象图格式](../specification/java_serialization_spec.md)
- [Xlang 类型映射](../specification/xlang_type_mapping.md)
