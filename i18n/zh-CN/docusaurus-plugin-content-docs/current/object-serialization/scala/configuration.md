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

本页介绍 Scala 特有的 Fory 实例配置和创建方式。

## Xlang 设置

Fory Scala 遵循 Java builder 的默认设置：使用带兼容 Schema 演进的 xlang 模式。
跨语言 Scala 载荷、Schema IDL 生成的 Scala 模型以及宏派生的 xlang 序列化器都应使用此路径。

```scala
import org.apache.fory.scala.ForyScala

val fory = ForyScala.builder()
  .withXlang(true)
  .build()
```

序列化之前请注册应用类：

```scala
fory.register(classOf[Person])
fory.register(classOf[Point])
```

## 原生模式设置

对于需要 JVM 原生对象行为的同语言 Scala/JVM 载荷，必须：

1. 使用 `ForyScala.builder().withXlang(false)` 创建 Fory 实例，或者安装 `ForyScala`；
   后一种方式使用 `Fory.builder().withXlang(false).withModule(ForyScala)`。
2. 序列化之前注册应用类。

```scala
import org.apache.fory.scala.ForyScala

val fory = ForyScala.builder().withXlang(false)
  .build()
```

### 注册 Scala 内部类型

根据所序列化的对象类型，可能需要注册一些 Scala 内部类型：

```scala
fory.register(Class.forName("scala.Enumeration.Val"))
```

要避免此类注册，可以禁用类注册：

```scala
val fory = ForyScala.builder().withXlang(false)
  .requireClassRegistration(false)
  .build()
```

> **注意**：禁用类注册后可以反序列化未知类型。这样更灵活，但如果类中包含恶意代码，则可能不安全。

### 引用跟踪

循环引用在 Scala 中很常见。应使用 `withRefTracking(true)` 启用引用跟踪：

```scala
val fory = ForyScala.builder()
  .withRefTracking(true)
  .build()
```

> **注意**：如果不启用引用跟踪，某些 Scala 版本在序列化 Scala Enumeration 时可能发生 [StackOverflowError](https://github.com/apache/fory/issues/1032)。

## 线程安全

创建 Fory 实例的开销并不低。应在多次序列化之间共享实例。

### 单线程用法

```scala
import org.apache.fory.Fory
import org.apache.fory.scala.ForyScala

object ForyHolder {
  val fory: Fory = ForyScala.builder()
    .withXlang(true)
    .build()
}
```

### 多线程用法

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

## 配置选项

Fory Java 的所有配置选项均可用。完整列表请参阅 [Java 配置](../java/configuration.md)。

Scala 原生模式载荷的常用选项：

```scala
import org.apache.fory.scala.ForyScala

val fory = ForyScala.builder().withXlang(false)
  // Enable reference tracking for circular references
  .withRefTracking(true)
  // Same-schema optimization. Use only when every reader and writer
  // always uses the same Scala/JVM schema.
  .withCompatible(false)
  // Enable async compilation for better startup performance
  .withAsyncCompilation(true)
  .build()
```

### 对象图内存预算

Scala 使用 Java 的 `withMaxGraphMemoryBytes(...)` 选项。它为一次根反序列化设置近似的
对象图内存限制，主要针对实体化的集合、map、数组、结构体和对象。字符串、二进制数据、
基本类型标量和稠密基本类型数组等叶子值不计入其中，因此实际进程内存可能高于此值。
叶子值仍受剩余输入字节限制：如果未读输入没有足够的字节，Fory 不会读取或创建该叶子值。

```scala
val fory = ForyScala.builder()
  .withMaxGraphMemoryBytes(128L * 1024 * 1024)
  .withMaxUnbackedContainerItems(8192)
  .build()
```

`withMaxUnbackedContainerItems(...)` 限制一次根反序列化中重复读取主体未消耗相应输入的
集合元素和 map 条目。默认值为 `8192`；零表示严格限制。

## Xlang 模式

对于 Scala xlang 或 Schema IDL 生成的代码，请使用默认 xlang 模式并注册生成的 Schema 模块：

```scala
import org.apache.fory.scala.ForyScala
import example.ExampleForyModule

val fory = ForyScala.builder()
  .withXlang(true)
  .withRefTracking(true)
  .withModule(ExampleForyModule)
  .build()
```

在 xlang 模式下，Scala 集合使用规范的 `list`、`set` 和 `map` 载荷，而不是 Scala 工厂
载荷。生成的可选字段使用 `Option[T]`。

## 兼容模式

Java builder 在 xlang 和原生模式下都默认启用兼容模式。当模型可能独立演进、服务分别
部署，或 xlang Schema 由不同语言手写时，请保留此默认设置。

只有在反序列化每个载荷所用的类 Schema 始终与序列化时相同，并且希望获得更快的序列化
速度和更小的体积时，才使用 `withCompatible(false)`。对于 xlang 载荷，只有在确认所有
语言使用相同 Schema 后，或者原生类型由 Fory Schema IDL 生成时，才调用
`withCompatible(false)`。

## 安全

有关信任边界、安全的读取端配置和验证方法，请参阅 [Scala 安全](security.md)。
