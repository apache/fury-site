---
title: 静态生成序列化器
sidebar_position: 5
id: static_generated_serializers
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

当 Kotlin 类需要参与 Fory 跨语言 schema 序列化时，使用 `fory-kotlin-ksp`。
该处理器会在构建时生成 Kotlin 源码序列化器。这些序列化器会调用现有的 Fory
Java 运行时，包括 `WriteContext`、`ReadContext` 和 `MemoryBuffer`；不存在
Kotlin 专用协议。

静态生成的 Kotlin 序列化器面向 Kotlin/JVM 和 Android 的 xlang/schema 模式。
它们不是 Java 原生对象序列化器，也不会保留 JVM 对象图实现细节，例如确切的
具体集合类。

## 添加 KSP

在运行时添加 `fory-kotlin`，并在编译 `@ForyStruct` Kotlin 类的模块中将
`fory-kotlin-ksp` 作为 KSP 处理器运行。

```kotlin
plugins {
  id("com.google.devtools.ksp") version "<ksp-version>"
}

dependencies {
  implementation("org.apache.fory:fory-kotlin:<fory-version>")
  ksp("org.apache.fory:fory-kotlin-ksp:<fory-version>")
}
```

对于 Android，请在拥有 Kotlin 模型类的 Android 模块或库模块中配置 KSP。

## 定义结构体

Schema 概念复用 Java Fory 注解。只有在需要覆盖整数编码时，才使用 Kotlin
类型使用位置注解。

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

## 支持的结构体

处理器会为具名包中的 public 或 internal、具体、非泛型类生成序列化器。受支持的
类必须有主构造函数，且被序列化的参数必须是 `val` 或 `var` 属性。`data class`
是常见用法，但不是必需条件。

当 KSP 运行在拥有该结构体的同一个 Kotlin 模块中时，支持 internal Kotlin
结构体类。生成的 Kotlin 序列化器同样是 internal，因此它可以调用 internal
构造函数，并在 override 中暴露 internal 类型，同时仍然生成 Fory Java 运行时
可以加载的 JVM 类。该 Kotlin 模块外的应用代码仍然不能直接引用 internal
结构体，因此注册必须从能够看到该类的代码中完成。

处理器会拒绝以下声明：

- `private` 结构体类。
- 局部、匿名或嵌套的 `@ForyStruct` 类。
- Kotlin `object` 声明。
- 作为序列化目标的接口、抽象类和 sealed class。
- 泛型 `@ForyStruct` 类。
- private 构造函数属性。
- private 或 protected 主构造函数。

兼容读取支持 Kotlin 默认构造函数参数。一个结构体最多可以有 12 个带默认值的
构造函数字段。

基于构造函数的生成序列化器支持宽主构造函数。兼容读取会在生成的旁路状态中
跟踪远端字段是否存在，而不是使用构造函数 bit mask。

## 可空性

使用 Kotlin `?` 描述可空 schema 位置。集合和 map 内部的可空性也会保留。

```kotlin
@ForyStruct
data class NullabilityExample(
  @ForyField(id = 1)
  val a: List<String>,

  @ForyField(id = 2)
  val b: List<String?>,

  @ForyField(id = 3)
  val c: List<String>?,

  @ForyField(id = 4)
  val d: List<String?>?,
)
```

不要在手写的、基于构造函数的 Kotlin 结构体中使用 Fory `@Nullable`。KSP
处理器会拒绝它，因此 schema 始终从 Kotlin 源码可空性读取。编译器生成的
Kotlin IDL 源码遵循同一规则，并用 Kotlin `?` 表示可空字段。

## 引用

Kotlin 生成序列化器会保留字段、list 元素和 map 值上的 `@Ref` 元数据。构造函数
拥有的读取路径通过主构造函数构造 Kotlin 值。需要发布引用的 Schema IDL 类会
生成为可变的无参类，其 KSP 生成序列化器会在读取字段前发布实例。在这两种形态
中，字段描述符、嵌套可空性和 `@Ref` 元数据都由 KSP 负责。

## 集合

集合声明承载的是 schema 形态，而不是 JVM 实现身份。例如，`List<String>` 编码为
`list<string>`，`Map<String, Int>` 编码为 `map<string, int32>`。

反序列化只保证结果可以赋值给声明的字段类型。Fory 不会保留原始运行时值究竟是
`ArrayList`、`LinkedList`、`Collections.unmodifiableList`、同步集合包装器，
还是其他 JVM 特有集合实现。

支持的集合声明包括 Kotlin 和 Java 的 list、set、map 类型。可变集合接口字段会
反序列化为可赋值给声明类型的可变实现。没有显式 comparator 的有序集合（例如
`TreeSet` 和 `ConcurrentSkipListSet`）只接受非 null 标量或字符串元素。并发
map 声明只接受非 null 值，因为 JVM 并发 map 实现会拒绝 null 条目。

`Set<*>`、`Map<*, T>`、`Map<*, *>` 和原始 Java 集合会被拒绝。`List<*>` 和
`Map<K, *>` 会被接受，并使用动态可空值。

## 密集数组

支持 Kotlin 密集基本类型数组和无符号数组字段：

- `BooleanArray`
- `ByteArray`
- `ShortArray`
- `IntArray`
- `LongArray`
- `FloatArray`
- `DoubleArray`
- `UByteArray`
- `UShortArray`
- `UIntArray`
- `ULongArray`

字段、集合元素、map 值和 union case 中都支持拥有明确 Kotlin 承载类型的密集
数组。`array<float16>` 和 `array<bfloat16>` 使用 Java core 的 `Float16Array`
和 `BFloat16Array` 承载类型。

除非 `ByteArray` 类型使用位置带有 Java `@ArrayType` 注解，否则 `ByteArray`
会编码为 Fory `binary`。生成的 Kotlin IDL 对 `array<int8>` 使用
`@ArrayType ByteArray`，包括嵌套集合和 map 位置。

当 `T` 是非 null 布尔或数值密集数组元素类型时，顶层 `List<T>` 字段也支持
`@ArrayType`。此时该字段编码为密集 `array<T>` schema，生成的读取代码会把
解码后的 JVM list 元素转换回声明的 Kotlin 元素承载类型。

## 整数编码

Kotlin 类型使用位置编码注解映射到 Fory xlang 整数编码：

| 注解 | 有效 Kotlin 类型 |
| ---------- | ------------------------------ |
| `@Fixed`   | `Int`, `Long`, `UInt`, `ULong` |
| `@VarInt`  | `Int`, `Long`, `UInt`, `ULong` |
| `@Tagged`  | `Long`, `ULong`                |

如果没有注解，xlang `Int`、`Long`、`UInt` 和 `ULong` 使用 varint 编码。这是
xlang 模式的要求，不受 Java 原生模式数值压缩选项控制。

## Duration

Xlang `duration` 映射到 `kotlin.time.Duration`。无限 Kotlin duration 无法用
xlang duration 载荷表示，序列化时会失败。

## Sealed Union

KSP 会为带 `@ForyUnion` 注解的顶层 sealed class 生成序列化器。每个 schema
case 都是一个带 `@ForyCase` 注解的嵌套类，并且有一个名为 `value` 的构造函数
属性。Case ID `0` 保留给未知 case 承载类型：

```kotlin
@ForyUnion
sealed class Animal {
  @ForyCase(id = 0)
  data class UnknownCase(val caseId: Int, val value: Any?) : Animal()

  @ForyCase(id = 1)
  data class DogCase(val value: Dog) : Animal()
}
```

生成的 schema 模块通过 `KotlinSerializers.registerUnion` 注册 sealed union。
运行时会自动发现生成的 `<Target>_ForySerializer`，因此调用方不需要传入序列化器
实例。

## 注册类

使用 Kotlin `register<T>` 扩展注册 Kotlin 结构体类。xlang 命名空间和类型名由
你选择；生成的序列化器不会替你选择 ID 或名称。

```kotlin
import org.apache.fory.kotlin.ForyKotlin
import org.apache.fory.kotlin.register

val fory = ForyKotlin.builder()
    .withXlang(true)
    .requireClassRegistration(true)
    .build()

fory.register<User>("example", "User")
```

`ForyKotlin.builder()` 会为 Fory 实例安装 Kotlin 运行时引导逻辑。
`fory.register<T>(...)` 扩展会注册 xlang schema 类型名，并从目标类解析生成的
序列化器。

不要在应用代码中注册或引用生成的序列化器类。运行时会从已注册的目标类解析它们。

生成的 Schema IDL 模块使用同一路径。它们会按需调用
`KotlinSerializers.registerType`、`registerSerializer`、`registerEnum` 和
`registerUnion`，并且不会生成 Java 文件。

## 生成名称

生成的序列化器会输出到与目标类相同的包中。名称为 `<target>_ForySerializer`。
对于嵌套二进制名称，`$` 会编码为 `_d_`；源码中的下划线会编码为 `_u_`。

这些名称属于实现细节。它们对诊断和 Android shrink 有意义，但用户代码只应注册
目标类。

如果注册了由构造函数拥有的 Kotlin xlang 结构体，但缺少对应的 KSP 生成序列化器，
Fory 会以配置错误失败。注册生成的 Kotlin 类之前，请先用 KSP 编译生成的 IDL
源码。

## Android 与 R8

Android 应用通常不需要为生成的 Kotlin 序列化器手写 keep 规则。KSP 会在
`META-INF/proguard/` 下生成 consumer R8/ProGuard 规则，用于 Fory 使用的生成
序列化器构造函数，以及检测必需 Kotlin 生成序列化器所需的 Kotlin 元数据。

对于库模块，请把生成的 `META-INF/proguard/` 资源打包进产物。对于 Android 应用
模块，请确保 KSP 设置会把生成资源包含到 minified variant 中。

Android Gradle 设置和 release-minified 验证指南请参见
[Android 支持](android-support.md)。

## 原生对象模式

Kotlin KSP 生成序列化器只面向 xlang/schema 模式。它们不会替代 Fory Java 原生
对象序列化器，也不会保留 JVM 对象图身份。如果使用 `withXlang(false)` 创建 Fory，
Fory 会改用普通 Java 和 Kotlin 运行时序列化器。

该模块不支持 Kotlin/Native 和 Kotlin/JS。
