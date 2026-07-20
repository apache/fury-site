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

本页介绍 Scala 专用的运行时配置和 Fory 实例创建。

## Xlang 设置

Fory Scala 遵循 Java builder 默认值：启用 xlang 模式，并使用兼容 Schema 演进。跨语言 Scala 载荷、schema IDL 生成的 Scala models，以及 macro-derived xlang serializers 都应使用这一路径。

```scala
import org.apache.fory.scala.ForyScala

val fory = ForyScala.builder()
  .withXlang(true)
  .build()
```

序列化前注册应用类：

```scala
fory.register(classOf[Person])
fory.register(classOf[Point])
```

## Native 模式设置

对于需要原生 JVM 对象行为的同语言 Scala/JVM 载荷，必须：

1. 使用 `ForyScala.builder().withXlang(false)` 创建运行时，或者通过 `Fory.builder().withXlang(false).withModule(ForyScala)` 安装 `ForyScala`。
2. 序列化前注册应用类。

```scala
import org.apache.fory.scala.ForyScala

val fory = ForyScala.builder().withXlang(false)
  .build()
```

### 注册 Scala 内部类型

根据你序列化的对象类型，可能需要注册一些 Scala 内部类型：

```scala
fory.register(Class.forName("scala.Enumeration.Val"))
```

为避免这种注册，可以禁用类注册：

```scala
val fory = ForyScala.builder().withXlang(false)
  .requireClassRegistration(false)
  .build()
```

> **注意**：禁用类注册允许反序列化未知类型。这更灵活，但如果类包含恶意代码，可能不安全。

### 引用跟踪

循环引用在 Scala 中很常见。应使用 `withRefTracking(true)` 启用引用跟踪：

```scala
val fory = ForyScala.builder().withXlang(false)
  .withRefTracking(true)
  .build()
```

> **注意**：如果未启用引用跟踪，在序列化 Scala Enumeration 时，某些 Scala 版本可能出现 [StackOverflowError](https://github.com/apache/fory/issues/1032)。

## 线程安全

Fory 实例创建成本不低。实例应在多次序列化之间共享。

### 单线程使用

```scala
import org.apache.fory.Fory
import org.apache.fory.scala.ForyScala

object ForyHolder {
  val fory: Fory = ForyScala.builder()
    .withXlang(true)
    .build()
}
```

### 多线程使用

对于多线程应用，请使用 `ThreadSafeFory`：

```scala
import org.apache.fory.ThreadSafeFory
import org.apache.fory.scala.ForyScala

object ForyHolder {
  val fory: ThreadSafeFory = ForyScala.builder()
    .withXlang(true)
    .buildThreadSafeFory()
}
```

## 配置项

Fory Java 的所有配置项都可用。完整列表见 [Java 配置](../java/configuration.md)。

Scala native-mode 载荷的常用配置项：

```scala
import org.apache.fory.scala.ForyScala

val fory = ForyScala.builder().withXlang(false)
  // 为循环引用启用引用跟踪
  .withRefTracking(true)
  // 为 native-mode 载荷启用 Schema 演进支持
  .withCompatible(true)
  // 启用异步编译以获得更好的启动性能
  .withAsyncCompilation(true)
  .build()
```

### 对象图内存预算

Scala 使用 Java 的 `withMaxGraphMemoryBytes(...)` 选项。它为单次根对象反序列化
设置近似的对象图内存阈值，主要涵盖实际创建的 collection、map、array、struct 和
object。它不包含 string、binary data、primitive scalar 和紧凑 primitive array 等
叶子值，因此实际的进程内存可能高于这个值。叶子值仍受剩余输入字节数限制：如果
未读输入没有足够的字节，Fory 就不会读取或创建该叶子值。

```scala
val fory = ForyScala.builder()
  .withMaxGraphMemoryBytes(128L * 1024 * 1024)
  .build()
```

## Xlang 模式

对于 Scala xlang 或 schema IDL 生成代码，请使用默认 xlang 模式并注册生成的 schema module：

```scala
import org.apache.fory.scala.ForyScala
import example.ExampleForyModule

val fory = ForyScala.builder()
  .withXlang(true)
  .withRefTracking(true)
  .withModule(ExampleForyModule)
  .build()
```

在 xlang 模式下，Scala collections 使用规范的 `list`、`set` 和 `map` 载荷，而不是 Scala factory 载荷。生成的 optional 字段使用 `Option[T]`。

## 安全

Scala 使用 Java 运行时配置表面。生产环境以及任何不受信任的载荷来源都应保持启用类注册：

```scala
val fory = ForyScala.builder()
  .requireClassRegistration(true)
  .withMaxDepth(50)
  .withMaxGraphMemoryBytes(128L * 1024 * 1024)
  .withMaxTypeFields(512)
  .withMaxTypeMetaBytes(4096)
  .build()
```

安全相关配置：

- 保持 `requireClassRegistration(true)`，并注册应用类或生成的 modules。
- 使用 `withMaxDepth(...)` 拒绝异常深的对象图。
- 将 `withMaxGraphMemoryBytes(...)` 用作 collection、map、array、struct 和 object
  密集型载荷的近似阈值。它不是精确的 heap 上限；叶子值受剩余输入字节数限制。
- 除非数据不是恶意输入，且可信 peer 会发送更大的 metadata 或大量 schema 版本，否则保持 `withMaxTypeFields(...)`、`withMaxTypeMetaBytes(...)` 以及远端 schema-version 限制的默认值。
- Allow-listing 和 unknown-class 控制请遵循 [Java 配置](../java/configuration.md#forybuilder-选项)。
