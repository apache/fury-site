---
title: 静态生成的序列化器
sidebar_position: 5
id: static-generated-serializers
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

当 Kotlin 类需要参与 Fory 跨语言 Schema 序列化时，请使用 `fory-kotlin-ksp`。该处理器
在构建时生成 Kotlin 源代码序列化器。这些序列化器会调用现有的 Fory Java 实现，包括
`WriteContext`、`ReadContext` 和 `MemoryBuffer`；不存在仅供 Kotlin 使用的协议。

静态生成的 Kotlin 序列化器用于 Kotlin/JVM 和 Android 的 xlang/Schema 模式。它们不是
Java 原生对象序列化器，也不会保留具体集合类等 JVM 对象图实现细节。

## 添加 KSP

将 `fory-kotlin` 添加到应用 classpath，并将 `fory-kotlin-ksp` 作为 KSP 处理器运行；
该处理器应位于编译 `@ForyStruct` Kotlin 类的模块中。

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

Schema 概念复用 Java Fory 注解。只有在需要覆盖整数编码时，才使用 Kotlin 类型使用位置注解。

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

## 支持的结构体

处理器会为命名软件包中的 public 或 internal、具体、非泛型类生成序列化器。受支持的类
必须具有主构造函数，并且要序列化的参数必须是 `val` 或 `var` 属性。`data
class` 是最常见的情况，但并非必需。

当 KSP 在拥有结构体的同一个 Kotlin 模块中运行时，支持 internal Kotlin 结构体类。
生成的 Kotlin 序列化器也是 internal，因此它可以调用 internal 构造函数并在 override
中公开 internal 类型，同时仍生成 Fory Java 可以加载的 JVM 类。该 Kotlin 模块之外的
应用代码仍不能直接引用 internal 结构体，因此必须在能够看到该类的代码中完成注册。

处理器会拒绝以下声明：

- `private` 结构体类。
- 局部、匿名或嵌套的 `@ForyStruct` 类。
- Kotlin `object` 声明。
- 作为序列化器目标的接口、抽象类和密封类。
- 泛型 `@ForyStruct` 类。
- 私有构造函数属性。
- private 或 protected 主构造函数。

兼容读取支持 Kotlin 构造函数默认参数。一个结构体最多可以包含 12 个带默认值的构造函数字段。

基于构造函数生成的序列化器支持具有大量参数的主构造函数。兼容读取会在生成的辅助状态中
跟踪远端字段是否存在，而不是使用构造函数位掩码。

## 可空性

使用 Kotlin `?` 描述可空的 Schema 位置。集合和 map 内部会保留可空性。

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

不要在手写的、基于构造函数的 Kotlin 结构体中使用 Fory `@Nullable`。KSP 处理器会拒绝它，
确保始终从 Kotlin 源代码的可空性读取 Schema。编译器生成的 Kotlin IDL 源代码遵循相同
规则，并使用 Kotlin `?` 表示可空字段。

## 引用

Kotlin 生成的序列化器会保留字段、列表元素和 map 值的 `@Ref` 元数据。由构造函数负责的
读取通过主构造函数创建 Kotlin 值。需要发布引用的 Schema IDL 类会生成为可变的无参类，
其 KSP 生成的序列化器会在读取字段前发布实例。在这两种形式中，字段描述符、嵌套可空性
和 `@Ref` 元数据都由 KSP 处理。

## 集合

集合声明携带的是 Schema 形状，而不是 JVM 实现身份。例如，`List<String>` 编码为
`list<string>`，`Map<String, Int>` 编码为 `map<string, int32>`。

反序列化只保证结果可以赋值给声明的字段类型。Fory 不会保留原始具体值究竟是
`ArrayList`、`LinkedList`、`Collections.unmodifiableList`、同步集合包装器还是其他
JVM 特有集合实现。

支持的集合声明包括 Kotlin 和 Java 的 list、set 和 map 类型。可变集合接口字段会反序列化
为可赋值给声明类型的可变实现。没有显式比较器的有序集合（例如 `TreeSet` 和
`ConcurrentSkipListSet`）仅接受非空标量或字符串元素。并发 map 声明仅接受非空值，
因为 JVM 并发 map 实现会拒绝空条目。

会拒绝 `Set<*>`、`Map<*, T>`、`Map<*, *>` 和原始 Java 集合。接受 `List<*>` 和
`Map<K, *>`，并使用动态可空值。

## 稠密数组

支持 Kotlin 稠密基本类型和无符号数组字段：

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

在字段、集合元素、map 值和联合 case 中，支持具有明确 Kotlin 载体的稠密数组。
`array<float16>` 和 `array<bfloat16>` 使用 Java 核心的 `Float16Array` 和
`BFloat16Array` 载体。

`ByteArray` 编码为 Fory `binary`，除非该 `ByteArray` 类型使用位置带有 Java
`@ArrayType` 注解。生成的 Kotlin IDL 使用 `@ArrayType ByteArray` 表示 `array<int8>`，包括嵌套
集合和 map 位置。

`@ArrayType` 也支持用于顶层 `List<T>` 字段，前提是 `T` 为非空布尔或数值稠密数组元素类型。
在这种情况下，字段会编码为稠密 `array<T>` Schema，生成的读取代码会将解码后的 JVM
list 元素转换回声明的 Kotlin 元素载体。

## 整数编码

Kotlin 类型使用位置的编码注解映射到 Fory xlang 整数编码：

| 注解      | 有效的 Kotlin 类型             |
| --------- | ------------------------------ |
| `@Fixed`  | `Int`, `Long`, `UInt`, `ULong` |
| `@VarInt` | `Int`, `Long`, `UInt`, `ULong` |
| `@Tagged` | `Long`, `ULong`                |

没有注解时，xlang `Int`、`Long`、`UInt` 和 `ULong` 使用 varint 编码。这是 xlang 模式的
要求，不受 Java 原生模式数值压缩选项控制。

## Duration

Xlang `duration` 映射到 `kotlin.time.Duration`。xlang duration 载荷无法表示无限 Kotlin
duration，因此这类值会在序列化期间失败。

## 密封联合

KSP 会为带 `@ForyUnion` 注解的顶层密封类生成序列化器。每个 Schema case 都是带
`@ForyCase` 注解的嵌套类，并包含一个名为 `value` 的构造函数属性。
`Unknown(UnknownCase)` 使用 `@ForyUnknownCase` 标记，作为 Fory 管理的向前兼容载体。
它不会出现在 Schema case 表中，因为该标记只选择载体，不会添加 Schema 条目。类型化
联合必须声明至少一个非 `Unknown` case：

```kotlin
package example

import org.apache.fory.annotation.ForyCase
import org.apache.fory.annotation.ForyUnion
import org.apache.fory.annotation.ForyUnknownCase
import org.apache.fory.type.union.UnknownCase

@ForyUnion
sealed class Animal {
  @ForyUnknownCase
  data class Unknown(val value: UnknownCase) : Animal()

  @ForyCase(id = 0)
  data class Dog(val value: example.Dog) : Animal()
}
```

当生成的 Kotlin 联合 case 名称与载荷类型的简单名称相同时，带软件包的输出会保留 case
名称，并使用限定名表示载荷类型。如果目标输出模式无法为冲突表达合法限定名，IDL
编译器会在生成的 case 类名后追加 `Case`。

生成的 Schema 模块通过 `KotlinSerializers.registerUnion` 注册密封联合。Fory 会自动发现
生成的 `<Target>_ForySerializer`，因此调用方无需传入序列化器实例。

## 注册类

使用 Kotlin `register<T>` 扩展注册 Kotlin 结构体类。xlang 命名空间和类型名称由你选择；
生成的序列化器不会替你选择 ID 或名称。

```kotlin
import org.apache.fory.kotlin.ForyKotlin
import org.apache.fory.kotlin.register

val fory = ForyKotlin.builder()
    .withXlang(true)
    .requireClassRegistration(true)
    .build()

fory.register<User>("example.User")
```

`ForyKotlin.builder()` 为 Fory 实例安装 Kotlin 序列化器引导程序。
`fory.register<T>(...)` 扩展会注册 xlang Schema 类型名称，并从目标类解析生成的序列化器。

不要在应用代码中注册或引用生成的序列化器类。Fory 会从已注册的目标类解析它们。

生成的 Schema IDL 模块使用相同路径。它们会根据需要调用
`KotlinSerializers.registerType`、`registerSerializer`、`registerEnum` 和
`registerUnion`，绝不会生成 Java 文件。

## 生成的名称

生成的序列化器与目标类位于同一个软件包中，其名称为 `<target>_ForySerializer`。对于
嵌套二进制名称，`$` 编码为 `_d_`；源代码中的下划线编码为 `_u_`。

这些名称属于实现细节。它们对诊断和 Android 压缩有影响，但用户代码只应注册目标类。

如果注册了由构造函数负责的 Kotlin xlang 结构体，但缺少其 KSP 生成的序列化器，Fory 会
因配置错误而失败。注册生成的 Kotlin 类之前，请使用 KSP 编译生成的 IDL 源代码。

## Android 与 R8

Android 应用不需要用户为生成的 Kotlin 序列化器编写 keep 规则。KSP 会在
`META-INF/proguard/` 下生成消费方 R8/ProGuard 规则，用于 Fory 使用的生成序列化器
构造函数以及检测所需 Kotlin 生成序列化器的 Kotlin 元数据。

对于库模块，请将生成的 `META-INF/proguard/` 资源打包到产物中。对于 Android 应用模块，
请确保 KSP 设置会在压缩变体中包含生成的资源。

Android Gradle 设置和压缩发布版验证指南请参阅 [Android 支持](../java/android.md)。

## 原生对象模式

Kotlin KSP 生成的序列化器仅用于 xlang/Schema 模式。它们不会替代 Fory Java 原生对象
序列化器，也不会保留 JVM 对象图身份。如果使用带 `withXlang(false)` 的 Fory，Fory 会
改用普通的 Java 和 Kotlin 序列化器。

本模块不支持 Kotlin/Native 和 Kotlin/JS。
