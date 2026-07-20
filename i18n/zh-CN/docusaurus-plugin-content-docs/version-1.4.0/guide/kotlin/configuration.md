---
title: 配置
sidebar_position: 1
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

本页介绍 Kotlin 专属运行时配置和 Fory 实例创建。

## Xlang 设置

Fory Kotlin 遵循 Java builder 默认值：启用 xlang 模式和兼容 Schema 演进。
跨语言 Kotlin 载荷、Schema IDL 生成的 Kotlin 模型，以及 KSP 生成的 xlang
序列化器都应使用这条路径。

```kotlin
import org.apache.fory.kotlin.ForyKotlin

val fory = ForyKotlin.builder()
    .withXlang(true)
    .requireClassRegistration(true)
    .build()
```

## Native 模式设置

对于需要原生 JVM 对象行为的同语言 Kotlin/JVM 载荷，请显式使用 native 模式：

```kotlin
import org.apache.fory.kotlin.ForyKotlin

val fory = ForyKotlin.builder().withXlang(false)
    .requireClassRegistration(true)
    .build()
```

## 线程安全

创建 Fory 实例成本不低。实例应在多次序列化之间共享。

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

## 配置

Fory Java 的所有配置选项都可用。完整列表请参见
[Java 配置](../java/configuration.md)。

Kotlin native 模式载荷的常见选项：

```kotlin
import org.apache.fory.kotlin.ForyKotlin

val fory = ForyKotlin.builder().withXlang(false)
    // Enable reference tracking for circular references
    .withRefTracking(true)
    // Enable schema evolution support for native-mode payloads
    .withCompatible(true)
    // Bound remote schema metadata resource usage
    .withMaxTypeFields(512)
    .withMaxTypeMetaBytes(4096)
    // Enable async compilation for better startup performance
    .withAsyncCompilation(true)
    // Compression options
    .withIntCompressed(true)
    .withLongCompressed(true)
    .build()
```

### 对象图内存预算

Kotlin 使用 Java 的 `withMaxGraphMemoryBytes(...)` 选项。它为单次根对象反序列化
设置近似的对象图内存阈值，主要涵盖实际创建的 collection、map、array、struct 和
object。它不包含 string、binary data、primitive scalar 和紧凑 primitive array 等
叶子值，因此实际的进程内存可能高于这个值。叶子值仍受剩余输入字节数限制：如果
未读输入没有足够的字节，Fory 就不会读取或创建该叶子值。

```kotlin
val fory = ForyKotlin.builder()
    .withMaxGraphMemoryBytes(128L * 1024 * 1024)
    .build()
```

## 安全

生产环境以及任何不受信任的 payload 来源都应保持启用类注册：

```kotlin
val fory = ForyKotlin.builder()
    .requireClassRegistration(true)
    .withMaxDepth(50)
    .withMaxGraphMemoryBytes(128L * 1024 * 1024)
    .withMaxTypeFields(512)
    .withMaxTypeMetaBytes(4096)
    .build()
```

安全相关配置：

- 保持 `requireClassRegistration(true)`，并注册应用类或生成的 module。
- 使用 `withMaxDepth(...)` 拒绝异常深的对象图。
- 将 `withMaxGraphMemoryBytes(...)` 用作 collection、map、array、struct 和 object
  密集型载荷的近似阈值。它不是精确的 heap 上限；叶子值受剩余输入字节数限制。
- 除非数据不是恶意输入，且可信 peer 会发送更大的 metadata 或大量 schema 版本，否则保持 `withMaxTypeFields(...)`、`withMaxTypeMetaBytes(...)` 以及远端 schema-version 限制的默认值。
- Allow-listing 和 unknown-class 控制请遵循 [Java 配置](../java/configuration.md#forybuilder-选项)。
