---
title: Kotlin 原生序列化
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

本页介绍如何在原生模式下序列化 Kotlin 特有的 JVM 类型。跨语言 Kotlin 模型请使用
[Kotlin Xlang 序列化](xlang.md)。

启用兼容模式后，Kotlin 读取端会针对部分标量字段类型变更使用 JVM 兼容读取规则。当转换后
的值具有相同逻辑值时，匹配字段可以在 `Boolean`、`String`、数值标量和
`java.math.BigDecimal` 之间读取。例如，`"true"` 和 `"false"` 可以读取为布尔值，
`"123"` 可以读取为能够容纳 `123` 的数值字段，数字和十进制数可以读取为规范字符串；
数值扩宽或收窄只有在不损失精度或范围时才会成功。数字字符串使用有限 ASCII 十进制
语法。无效字符串和有损转换会在反序列化期间失败。可空字段和装箱字段仍可与这些转换
组合使用，但引用跟踪标量的类型变更不兼容。

## 设置

所有示例都采用以下设置：

```kotlin
import org.apache.fory.kotlin.ForyKotlin

val fory = ForyKotlin.builder().withXlang(false)
    .requireClassRegistration(false)
    .build()
```

## 数据类

```kotlin
data class Person(val name: String, val age: Int, val id: Long)

fory.register(Person::class.java)

val p = Person("John", 30, 1L)
println(fory.deserialize(fory.serialize(p)))
```

## 无符号基本类型

完整支持 Kotlin 无符号类型：

```kotlin
val uByte: UByte = 255u
val uShort: UShort = 65535u
val uInt: UInt = 4294967295u
val uLong: ULong = 18446744073709551615u

println(fory.deserialize(fory.serialize(uByte)))
println(fory.deserialize(fory.serialize(uShort)))
println(fory.deserialize(fory.serialize(uInt)))
println(fory.deserialize(fory.serialize(uLong)))
```

## 无符号数组

```kotlin
val uByteArray = ubyteArrayOf(1u, 2u, 255u)
val uShortArray = ushortArrayOf(1u, 2u, 65535u)
val uIntArray = uintArrayOf(1u, 2u, 4294967295u)
val uLongArray = ulongArrayOf(1u, 2u, 18446744073709551615u)

println(fory.deserialize(fory.serialize(uByteArray)).contentToString())
println(fory.deserialize(fory.serialize(uShortArray)).contentToString())
println(fory.deserialize(fory.serialize(uIntArray)).contentToString())
println(fory.deserialize(fory.serialize(uLongArray)).contentToString())
```

## 标准库类型

### Pair 和 Triple

```kotlin
val pair = Pair("key", 42)
val triple = Triple("a", "b", "c")

println(fory.deserialize(fory.serialize(pair)))
println(fory.deserialize(fory.serialize(triple)))
```

### Result

```kotlin
val success: Result<Int> = Result.success(42)
val failure: Result<Int> = Result.failure(Exception("error"))

println(fory.deserialize(fory.serialize(success)))
println(fory.deserialize(fory.serialize(failure)))
```

## 范围与 Progression

```kotlin
val intRange = 1..10
val longRange = 1L..100L
val charRange = 'a'..'z'

println(fory.deserialize(fory.serialize(intRange)))
println(fory.deserialize(fory.serialize(longRange)))
println(fory.deserialize(fory.serialize(charRange)))

// Progressions
val intProgression = 1..10 step 2
val longProgression = 1L..100L step 10

println(fory.deserialize(fory.serialize(intProgression)))
println(fory.deserialize(fory.serialize(longProgression)))
```

## 集合

### ArrayDeque

```kotlin
val deque = ArrayDeque<String>()
deque.addFirst("first")
deque.addLast("last")

println(fory.deserialize(fory.serialize(deque)))
```

### 空集合

```kotlin
val emptyList = emptyList<String>()
val emptySet = emptySet<Int>()
val emptyMap = emptyMap<String, Int>()

println(fory.deserialize(fory.serialize(emptyList)))
println(fory.deserialize(fory.serialize(emptySet)))
println(fory.deserialize(fory.serialize(emptyMap)))
```

## Duration

```kotlin
import kotlin.time.Duration
import kotlin.time.Duration.Companion.hours
import kotlin.time.Duration.Companion.minutes

val duration: Duration = 2.hours + 30.minutes

println(fory.deserialize(fory.serialize(duration)))
```

## Regex

```kotlin
val regex = Regex("[a-zA-Z]+")

println(fory.deserialize(fory.serialize(regex)))
```

## UUID (Kotlin 2.0+)

```kotlin
import kotlin.uuid.Uuid

val uuid = Uuid.random()

println(fory.deserialize(fory.serialize(uuid)))
```

## 开箱即用的类型

以下类型可直接使用默认的 Fory Java 实现：

- **基本类型**：`Byte`、`Boolean`、`Int`、`Short`、`Long`、`Char`、`Float`、`Double`
- **字符串**：`String`
- **集合**：`ArrayList`、`HashMap`、`HashSet`、`LinkedHashSet`、`LinkedHashMap`
- **数组**：`Array`、`BooleanArray`、`ByteArray`、`CharArray`、`DoubleArray`、`FloatArray`、`IntArray`、`LongArray`、`ShortArray`

请使用 `ForyKotlin.builder()` 处理无符号值、范围和 `Duration` 等 Kotlin 特有类型。

对于仅限 Kotlin/JVM 且需要在 JVM 运行时路径上使用 Kotlin 数据类、可空类型、范围、
无符号值或 Kotlin 集合的通信，请使用原生模式。请在
[Kotlin 配置](configuration.md)中为应用选择注册和线程安全设置。
