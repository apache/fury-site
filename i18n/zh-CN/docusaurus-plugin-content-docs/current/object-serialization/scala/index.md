---
title: Scala 对象序列化
sidebar_position: 0
id: index
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

Apache Fory™ Scala 基于 Fory Java，为 Scala 类型提供优化的序列化器。它支持用于跨语言载荷的 xlang 模式，也支持仅用于 Scala/JVM 对象序列化的原生模式。它支持各种 Scala 对象序列化：

- `case` class 序列化
- `pojo/bean` 类序列化
- `object` 单例序列化
- `collection` 序列化（Seq、List、Map 等）
- `tuple` 和 `either` 类型
- `Option` 类型
- Scala 2 和 3 枚举

库产物支持 Scala 2.13 和 Scala 3。Schema IDL 生成的 Scala 源代码和宏派生的 xlang
序列化器需要 Scala 3。

## 功能特性

Fory Scala 继承了 Fory Java 的全部功能，并增加了 Scala 特有优化：

- **高性能**：JIT 代码生成、零拷贝，性能达到传统序列化的 20-170x
- **Scala 类型支持**：为 case class、单例、集合、tuple、Option 和 Either 提供优化的序列化器
- **默认值支持**：在 Schema 演进期间自动处理 Scala 类的默认参数
- **单例保留**：`object` 单例在反序列化后保持引用相等
- **Schema 演进**：类 Schema 变更的向前/向后兼容性

完整的功能列表请参阅 [Java 功能特性](../java/index.md#features)。

## 安装

使用 sbt 添加依赖：

```sbt
libraryDependencies += "org.apache.fory" %% "fory-scala" % "1.7.0"
```

### JDK25+

Scala 运行时使用 Fory Java 核心。在 JDK25+ 上，需要向 Fory 开放 `java.lang.invoke`。
当 Fory 位于 classpath 上时，使用 `ALL-UNNAMED`：

```bash
--add-opens=java.base/java.lang.invoke=ALL-UNNAMED
```

当 Fory 位于模块路径上时，使用 Fory 核心模块名称：

```bash
--add-opens=java.base/java.lang.invoke=org.apache.fory.core
```

## 快速开始

```scala
import org.apache.fory.Fory
import org.apache.fory.scala.ForyScala

case class Person(name: String, id: Long, github: String)
case class Point(x: Int, y: Int, z: Int)

object ScalaExample {
  val fory: Fory = ForyScala.builder()
    .withXlang(true)
    .build()

  fory.register(classOf[Person])
  fory.register(classOf[Point])

  def main(args: Array[String]): Unit = {
    val p = Person("Shawn Yang", 1, "https://github.com/chaokunyang")
    println(fory.deserialize(fory.serialize(p)))
    println(fory.deserialize(fory.serialize(Point(1, 2, 3))))
  }
}
```

## Xlang 模式与原生模式

对于跨语言载荷以及与其他 Fory 实现共享的 Schema，请使用 xlang 模式。通过 JVM builder 创建实例时，xlang 是 Scala 的默认编码模式；使用该模式的 Scala 示例会显式设置 `.withXlang(true)`，以便清楚展示模式选择。

仅用于 Scala/JVM 的通信请使用原生模式。通过 `.withXlang(false)` 选择原生模式；该模式继承 Fory Java 的 JVM 原生模式对象序列化路径，并为 case class、集合、tuple、option 和枚举增加 Scala 特有序列化器。它针对 JVM 和 Scala 类型系统进行了优化，适合在同语言 Scala/JVM 场景中替代其他框架的载荷。兼容模式默认启用。只有在所有读取端和写入端使用相同 Scala/JVM Schema，且希望获得更快的序列化速度和更小的体积时，才设置 `.withCompatible(false)`。

Scala builder 设置请参阅[配置](configuration.md)，完整的 JVM 原生模式行为请参阅 [Java 原生序列化](../java/native.md)。

## 基于 Fory Java

Fory Scala 基于 Fory Java 构建。Fory Java 的大多数配置选项、功能和概念都直接适用于 Scala。以下内容请参阅 Java 文档：

- [配置](../java/configuration.md) - 所有 ForyBuilder 选项
- [基本序列化](../java/basic-serialization.md) - 序列化模式和 API
- [类型注册](../java/type-registration.md) - 类注册与安全性
- [Schema 演进](../java/schema-evolution.md) - 向前/向后兼容性
- [自定义序列化器](../java/custom-serializers.md) - 实现自定义序列化器
- [压缩](../java/compression.md) - int、long 和字符串压缩
- [故障排除](../java/troubleshooting.md) - 常见问题及解决方法

## Scala 专属文档

- [配置](configuration.md) - Scala 特有的 Fory 设置要求
- [原生序列化](native.md) - 在 JVM 原生模式下序列化 Scala 类型
- [Schema 元数据](schema-metadata.md) - Scala 注解、引用、枚举 ID 和联合元数据
- [默认值](default-values.md) - Scala 类默认值支持
- [基础序列化](basic-serialization.md) - 默认 xlang 模式的模型、API 和跨语言互操作
- [gRPC 支持](../../grpc/scala.md) - Scala 3 生成的 gRPC 服务配套代码

解码来自应用信任边界之外的字节之前，请阅读 [Scala 安全](security.md)。
