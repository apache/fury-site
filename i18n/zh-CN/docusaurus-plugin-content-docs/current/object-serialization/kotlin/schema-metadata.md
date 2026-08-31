---
title: Schema 元数据
sidebar_position: 6
id: schema-metadata
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

Kotlin Schema 元数据由 KSP 生成的 xlang 序列化器使用。Schema 概念复用 Java Fory
注解；只有在需要 Kotlin 特有的整数编码元数据时，才使用 Kotlin 类型使用位置注解。

## 结构体字段

使用 `@ForyStruct` 注解 Kotlin Schema 类，并使用 `@ForyField(id = N)` 注解构造函数属性：

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

在构造函数属性上使用 `@ForyField(id = 1)`。对于由字段支持的属性，也可以使用
`@field:ForyField(id = 1)`。不要使用 `@get:ForyField` 或 `@set:ForyField`；访问器不是
Schema 字段，处理器会拒绝它们。

配置的字段 ID 必须在结构体 Schema 内唯一，并满足 `0 <= id < 2^29`（`0` 至 `536870911`）。已分配的 ID 应保持稳定，不要复用于其他字段。省略 `id` 时使用字段名。

## 可空性

使用 Kotlin `?` 描述可空的 Schema 位置。集合和 map 内部会保留可空性：

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

不要在手写的、基于构造函数的 Kotlin 结构体中使用 Fory `@Nullable`。KSP 处理器会从
Kotlin 源代码读取可空性，并拒绝冲突的可空注解。

## 引用跟踪

Kotlin 生成的序列化器会保留字段、列表元素和 map 值的 `@Ref` 元数据：

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

全局引用跟踪仍由 Fory 配置决定。请参阅[配置](configuration.md)。

## 整数编码

Kotlin 类型使用位置的编码注解映射到 Fory xlang 整数编码：

| 注解      | 有效的 Kotlin 类型             |
| --------- | ------------------------------ |
| `@Fixed`  | `Int`, `Long`, `UInt`, `ULong` |
| `@VarInt` | `Int`, `Long`, `UInt`, `ULong` |
| `@Tagged` | `Long`, `ULong`                |

没有注解时，xlang `Int`、`Long`、`UInt` 和 `ULong` 使用 varint 编码。

## 集合与稠密数组

集合声明携带的是 Schema 形状，而不是 JVM 实现身份。`List<String>` 编码为
`list<string>`，`Map<String, Int>` 编码为 `map<string, int32>`。

支持稠密基本类型和无符号数组字段，包括 `BooleanArray`、`ByteArray`、`IntArray`、
`LongArray`、`FloatArray`、`DoubleArray`、`UByteArray`、`UShortArray`、`UIntArray` 和
`ULongArray`。`ByteArray` 编码为 Fory `binary`，除非类型使用位置带有 Java
`@ArrayType` 注解。

## 相关主题

- [静态生成的序列化器](static-generated-serializers.md)
- [配置](configuration.md)
- [默认值](default-values.md)
- [Android 支持](../java/android.md)
