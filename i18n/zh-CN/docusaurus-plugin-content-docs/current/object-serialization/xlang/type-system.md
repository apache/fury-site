---
title: 类型系统
sidebar_position: 1
id: type-system
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

## 序列化内置类型

常见类型无需注册即可自动序列化，包括原始数字类型、字符串、二进制、数组、列表、映射等。

低精度浮点值也是内置跨语言类型系统的一部分：

- `float16` 和 `array<float16>`
- `bfloat16` 和 `array<bfloat16>`

请使用类型映射参考中记录的语言专用载体类型。Python 仅将 `pyfory.Float16` 和 `pyfory.BFloat16` 用作注解标记；标量值是原生 Python `float`，稠密低精度数组使用 `pyfory.Float16Array` 和 `pyfory.BFloat16Array`。Go 使用 `float16` 和 `bfloat16` 包提供标量、切片和数组载体；JavaScript 使用 `number` 表示标量 `float16` 和 `bfloat16`，并使用稠密数组载体 `BoolArray`、`Float16Array` 和 `BFloat16Array` 表示相应的 `array<T>` Schema。Dart 使用 `double` 配合 `Float16Type` 或 `Bfloat16Type` 元数据表示标量字段，稠密数组则使用 `Float16List` / `Bfloat16List`。Java 在受支持的低精度载体上使用 `@ArrayType` 表示 `array<float16>` / `array<bfloat16>` Schema，而普通对象数组仍走 `list` 路径；C++、Rust 和 C# 提供各自专用的标量与数组载体。

设置 `compatible=true` 后，直接结构体/类字段可以在 `list<T>` 和 `array<T>` 之间演进，其中 `T` 为稠密布尔/数字类型。具有相同符号性和宽度范围的整数列表元素编码与相应的稠密数组元素范围匹配。该规则仅适用于直接匹配的字段 Schema，不适用于嵌套集合、映射、数组、联合或泛型位置。当实际载荷没有 null 元素时，可以将对等端的 `list<T?>` Schema 读取到本地 `array<T>` 字段。如果载荷包含 null 元素或启用引用跟踪的元素编码，读取到本地 `array<T>` 字段会引发兼容读取错误。

## 序列化自定义类型

用户定义类型必须使用注册 API 进行注册，以建立不同语言类型之间的映射关系。所有语言都应使用一致的类型名称。

## 精确映射

规范性[跨语言类型映射](../../specification/xlang_type_mapping.md)定义每个运行时的精确载体映射。运行时页面展示该映射的 API 语法和示例。
