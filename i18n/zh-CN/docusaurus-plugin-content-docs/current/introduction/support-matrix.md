---
title: 支持矩阵
sidebar_position: 4
id: support-matrix
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

选择能力前，请使用此矩阵确认文档所覆盖的 API。存在某个语言页面，并不表示该语言
支持所有 Fory 能力。

| 能力 | 已有文档的语言 | 互操作能力 |
| ------------------- | ---------------------------------------------------------------------------------- | -------------------------------------- |
| Xlang 对象序列化 | Java、Python、C++、Go、Rust、JavaScript/TypeScript、C#、Swift、Dart、Scala、Kotlin | 共享一种 xlang 编码格式 |
| Native 对象序列化 | Java、Python、C++、Go、Rust、Scala、Kotlin | 仅限一个 Fory 实现家族 |
| Standard Row Format | Java、Python、C++、Rust | 共享 Standard Row 布局 |
| Compact Row Format | Java | 仅供 Java 使用的紧凑布局 |
| Fory JSON | Java、Kotlin、Scala | 标准 JSON 文本 |
| Fory 编译器输出 | Java、Python、C++、Go、Rust、JavaScript/TypeScript、C#、Swift、Dart、Scala、Kotlin | 生成模型使用受支持的 Fory API |
| Fory gRPC | Java、Python、C++、Go、Rust、JavaScript/TypeScript、C#、Swift、Dart、Scala、Kotlin | 对等端必须使用匹配的生成 Fory 服务契约 |

[Android](../object-serialization/java/android.md) 和
[GraalVM Native Image](../object-serialization/java/graalvm.md) 等平台限制，由相应的 Java
对象序列化和 Fory JSON 指南说明。
