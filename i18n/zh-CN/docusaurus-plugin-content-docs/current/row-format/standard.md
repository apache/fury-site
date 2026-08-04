---
title: Standard Row Format
sidebar_position: 1
id: standard
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

Fory Row Format 是一种缓存友好的二进制格式，可实现高效的随机访问和部分反序列化。
与对象图序列化不同，它允许读取方无需重建完整对象即可访问单个字段。

## 功能特性

- **零拷贝随机访问**：直接从编码数据中读取选定字段。
- **部分反序列化**：只重建应用所需的值。
- **跨语言兼容**：在 Java、Python、C++ 和 Rust 之间共享 Standard Row 字节。
- **Apache Arrow 集成**：在 Java 和 Python 中将 Row 转换为 Arrow 数据。

## 格式边界

Standard Row 内联存储固定宽度值，并通过偏移量和大小存储变长值。Row、数组和 Map 使用
Schema 解析字段位置和元素类型。规范性的字节布局、对齐规则、类型表和字节序由
[Row Format 规范](../specification/row_format_spec.md)中定义。

Row Format 仅用于可信的分析数据，适合分析、内存映射数据、选择性字段访问和数据管道。
如果应用需要通用对象图、共享或循环引用，或者以完整对象重建为主要访问方式，请使用
[对象序列化](../object-serialization/index.md)。

## 实现

| 运行时 | Standard Row 兼容性 | 运行时指南          | 其他集成                       |
| ------ | ------------------- | ------------------- | ------------------------------ |
| Java   | 兼容                | [Java](java.md)     | Arrow 转换；接口和扩展类型映射 |
| Python | 兼容                | [Python](python.md) | PyArrow Schema 和 table 转换   |
| C++    | 兼容                | [C++](cpp.md)       | 原生 Row 读取器和写入器        |
| Rust   | 兼容                | [Rust](rust.md)     | 借用式结构体、数组和 Map 视图  |

安装、Schema 构建、编码、随机访问、部分读取和特定语言集成请参阅各运行时指南。
