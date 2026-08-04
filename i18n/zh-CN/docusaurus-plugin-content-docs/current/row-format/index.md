---
title: Row Format
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

Row Format 使用缓存友好的二进制布局存储有类型的值，无需重建完整对象图即可随机或部分访问。
它适用于分析和内存数据处理。

## 选择 Row 系列

| 系列                        | 运行时支持              | 兼容性                      |
| --------------------------- | ----------------------- | --------------------------- |
| [Standard Row](standard.md) | Java、Python、C++、Rust | 共享的 Standard Row 布局    |
| [Compact Row](compact.md)   | Java                    | 仅 Java、面向空间优化的布局 |

如果目标是完整对象重建、引用处理或通用应用消息传递，请使用二进制对象序列化。如果工作负载需要
直接从编码数据中读取选定字段、嵌套数组或 Map，请使用 Row Format。

## 运行时指南

- [Java](java.md)
- [Python](python.md)
- [C++](cpp.md)
- [Rust](rust.md)

规范性 [Row Format 规范](../specification/row_format_spec.md)定义了 Standard 和 Compact 布局。
