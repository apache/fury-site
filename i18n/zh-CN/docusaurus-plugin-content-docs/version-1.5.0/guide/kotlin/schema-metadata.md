---
title: Schema 元数据
sidebar_position: 3
id: schema_metadata
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

Kotlin schema 元数据由 KSP 生成的 xlang 序列化器使用。Schema 概念复用 Java
Fory 注解；只有在需要 Kotlin 专属整数编码元数据时，才使用 Kotlin 类型使用位置
注解。

## 结构体字段

使用 `@ForyStruct` 标注 Kotlin schema 类，并用 `@ForyField(id = N)` 标注构造
函数属性：

```kotlin
import org.apache.fory.annotation.ForyField
import org.apache.fory.annotation.ForyStruct
import org.apache.fory.kotlin.Fixed
import org.apache.fory.kotlin.VarInt

@ForyStruct
data class User(
  @ForyField(id = 1)
  val id: @Fixed UInt,

  @ForyField(id = 2)
  val score: @VarInt Long,

  @ForyField(id = 3)
  val tags: List<String>,
)
```

在构造函数属性上使用 `@ForyField(id = 1)`。对于有字段支撑的属性，也可以使用
`@field:ForyField(id = 1)`。不要使用 `@get:ForyField` 或 `@set:ForyField`；
访问器不是 schema 字段，处理器会拒绝它们。

## 可空性

使用 Kotlin `?` 描述可空 schema 位置。集合和 map 内部的可空性也会保留：

```kotlin
@ForyStruct
data class NullabilityExample(
  @ForyField(id = 1)
  val names: List<String>,

  @ForyField(id = 2)
  val optionalNames: List<String?>,

  @ForyField(id = 3)
  val nullableList: List<String>?,
)
```

不要在手写的、基于构造函数的 Kotlin 结构体中使用 Fory `@Nullable`。KSP 处理器会
从 Kotlin 源码读取可空性，并拒绝冲突的可空注解。

## 引用跟踪

Kotlin 生成序列化器会保留字段、list 元素和 map 值上的 `@Ref` 元数据：

```kotlin
import org.apache.fory.annotation.Ref

@ForyStruct
data class Node(
  @ForyField(id = 1)
  val children: List<@Ref Node>,

  @ForyField(id = 2)
  @Ref
  val parent: Node?,
)
```

全局引用跟踪仍由运行时配置决定。参见[配置](configuration.md)。

## 整数编码

Kotlin 类型使用位置编码注解映射到 Fory xlang 整数编码：

| 注解 | 有效 Kotlin 类型 |
| ---------- | ------------------------------ |
| `@Fixed`   | `Int`, `Long`, `UInt`, `ULong` |
| `@VarInt`  | `Int`, `Long`, `UInt`, `ULong` |
| `@Tagged`  | `Long`, `ULong`                |

如果没有注解，xlang `Int`、`Long`、`UInt` 和 `ULong` 使用 varint 编码。

## 集合与密集数组

集合声明承载的是 schema 形态，而不是 JVM 实现身份。`List<String>` 编码为
`list<string>`，`Map<String, Int>` 编码为 `map<string, int32>`。

支持密集基本类型数组和无符号数组字段，包括 `BooleanArray`、`ByteArray`、
`IntArray`、`LongArray`、`FloatArray`、`DoubleArray`、`UByteArray`、`UShortArray`、
`UIntArray` 和 `ULongArray`。除非类型使用位置带有 Java `@ArrayType` 注解，
否则 `ByteArray` 会编码为 Fory `binary`。

## 相关主题

- [静态生成序列化器](static-generated-serializers.md)
- [配置](configuration.md)
- [默认值](default-values.md)
- [Android 支持](android-support.md)
