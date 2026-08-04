---
title: 配置
sidebar_position: 3
id: configuration
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

本页介绍 Kotlin 特有的 Fory 实例配置和创建方式。

## Xlang 设置

Fory Kotlin 遵循 Java builder 的默认设置：使用带兼容 Schema 演进的 xlang 模式。
跨语言 Kotlin 载荷、Schema IDL 生成的 Kotlin 模型以及 KSP 生成的 xlang 序列化器都应
使用此路径。

```kotlin
import org.apache.fory.kotlin.ForyKotlin

val fory = ForyKotlin.builder()
    .withXlang(true)
    .requireClassRegistration(true)
    .build()
```

## 原生模式设置

对于需要 JVM 原生对象行为的同语言 Kotlin/JVM 载荷，请显式使用原生模式：

```kotlin
import org.apache.fory.kotlin.ForyKotlin

val fory = ForyKotlin.builder().withXlang(false)
    .requireClassRegistration(true)
    .build()
```

## 线程安全

创建 Fory 实例的开销并不低。应在多次序列化之间共享实例。

### 单线程用法

```kotlin
import org.apache.fory.Fory
import org.apache.fory.kotlin.ForyKotlin

object ForyHolder {
    val fory: Fory = ForyKotlin.builder()
        .withXlang(true)
        .requireClassRegistration(true)
        .build()
}
```

### 多线程用法

对于多线程应用，请使用 `ThreadSafeFory`：

```kotlin
import org.apache.fory.ThreadSafeFory
import org.apache.fory.kotlin.ForyKotlin

object ForyHolder {
    val fory: ThreadSafeFory = ForyKotlin.builder()
        .withXlang(true)
        .requireClassRegistration(true)
        .buildThreadSafeFory()
}
```

### 使用 Builder 方法

```kotlin
// Thread-safe Fory
val fory: ThreadSafeFory = ForyKotlin.builder()
    .withXlang(true)
    .requireClassRegistration(true)
    .buildThreadSafeFory()
```

## 配置选项

Fory Java 的所有配置选项均可用。完整列表请参阅 [Java 配置](../java/configuration.md)。

Kotlin 原生模式载荷的常用选项：

```kotlin
import org.apache.fory.kotlin.ForyKotlin

val fory = ForyKotlin.builder().withXlang(false)
    // Enable reference tracking for circular references
    .withRefTracking(true)
    // Same-schema optimization. Use only when every reader and writer
    // always uses the same Kotlin/JVM schema.
    .withCompatible(false)
    // Enable async compilation for better startup performance
    .withAsyncCompilation(true)
    // Compression options
    .withIntCompressed(true)
    .withLongCompressed(true)
    .build()
```

### 对象图内存预算

Kotlin 使用 Java 的 `withMaxGraphMemoryBytes(...)` 选项。它为一次根反序列化设置近似的
对象图内存限制，主要针对实体化的集合、map、数组、结构体和对象。字符串、二进制数据、
基本类型标量和稠密基本类型数组等叶子值不计入其中，因此实际进程内存可能高于此值。
叶子值仍受剩余输入字节限制：如果未读输入没有足够的字节，Fory 不会读取或创建该叶子值。

```kotlin
val fory = ForyKotlin.builder()
    .withMaxGraphMemoryBytes(128L * 1024 * 1024)
    .withMaxUnbackedContainerItems(8192)
    .build()
```

`withMaxUnbackedContainerItems(...)` 限制一次根反序列化中重复读取主体未消耗相应输入的
集合元素和 map 条目。默认值为 `8192`；零表示严格限制。

## 兼容模式

Java builder 在 xlang 和原生模式下都默认启用兼容模式。当模型可能独立演进、服务分别
部署，或 xlang Schema 由不同语言手写时，请保留此默认设置。

只有在反序列化每个载荷所用的类 Schema 始终与序列化时相同，并且希望获得更快的序列化
速度和更小的体积时，才使用 `withCompatible(false)`。对于 xlang 载荷，只有在确认所有
语言使用相同 Schema 后，或者原生类型由 Fory Schema IDL 生成时，才调用
`withCompatible(false)`。

## 安全性

Kotlin 使用 Java 配置接口。在生产环境以及处理任何不可信载荷来源时，请保持启用类注册：

```kotlin
val fory = ForyKotlin.builder()
    .requireClassRegistration(true)
    .withMaxDepth(50)
    .withMaxGraphMemoryBytes(128L * 1024 * 1024)
    .withMaxUnbackedContainerItems(8192)
    .withMaxTypeFields(512)
    .withMaxTypeMetaBytes(4096)
    .build()
```

与安全相关的配置：

- 保持 `requireClassRegistration(true)`，并注册应用类或生成的模块。
- 使用 `withMaxDepth(...)` 拒绝深度异常的对象图。
- 使用 `withMaxGraphMemoryBytes(...)` 为包含大量集合、map、数组、结构体和对象的载荷
  设置近似限制。它不是精确的堆上限；叶子值受剩余输入字节限制。
- 除非可信的紧凑 codec 需要更大的根操作余量，否则将
  `withMaxUnbackedContainerItems(...)` 保持为 `8192`。零会拒绝每一个无输入支撑的条目。
- 除非数据没有恶意，且可信对端会发送更大的元数据或许多 Schema 版本，否则请将
  `withMaxTypeFields(...)`、`withMaxTypeMetaBytes(...)` 和远端 Schema 版本限制保留为默认值。
- 白名单和未知类控制请遵循[对象序列化安全](../security.md)。
