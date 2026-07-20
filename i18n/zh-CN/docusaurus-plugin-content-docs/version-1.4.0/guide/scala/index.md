---
title: Scala 序列化指南
sidebar_position: 0
id: serialization_index
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

Apache Fory™ Scala 基于 Fory Java 构建，为 Scala 类型提供优化的序列化器。它支持完整的 Scala 对象序列化，包括：

- `case` 类序列化
- `pojo/bean` 类序列化
- `object` 单例序列化
- `collection` 序列化（Seq、List、Map 等）
- `tuple` 与 `either` 类型
- `Option` 类型
- Scala 2 和 Scala 3 枚举

同时支持 Scala 2 和 Scala 3。

## 特性

Fory Scala 继承了 Fory Java 的全部特性，并增加了 Scala 特定优化：

- **高性能**：JIT 代码生成、零拷贝，性能可比传统序列化快 20 到 170 倍
- **Scala 类型支持**：为 case 类、单例、集合、tuple、Option、Either 提供优化序列化器
- **默认值支持**：在 Schema 演进期间自动处理 Scala 类的默认参数
- **单例保持**：`object` 单例在反序列化后仍保持引用相等性
- **Schema 演进**：支持类 Schema 变更时的前向和后向兼容

完整特性列表请参见 [Java 特性](../java/index.md#特性)。

## 安装

使用 sbt 添加依赖：

```sbt
libraryDependencies += "org.apache.fory" %% "fory-scala" % "1.4.0"
```

## 快速开始

```scala
import org.apache.fory.Fory
import org.apache.fory.serializer.scala.ScalaSerializers

case class Person(name: String, id: Long, github: String)
case class Point(x: Int, y: Int, z: Int)

object ScalaExample {
  // 创建启用 Scala 优化的 Fory
  val fory: Fory = Fory.builder()
    .withScalaOptimizationEnabled(true)
    .build()

  // 为 Scala 注册优化的 Fory 序列化器
  ScalaSerializers.registerSerializers(fory)

  // 注册你的类
  fory.register(classOf[Person])
  fory.register(classOf[Point])

  def main(args: Array[String]): Unit = {
    val p = Person("Shawn Yang", 1, "https://github.com/chaokunyang")
    println(fory.deserialize(fory.serialize(p)))
    println(fory.deserialize(fory.serialize(Point(1, 2, 3))))
  }
}
```

## 基于 Fory Java 构建

Fory Scala 基于 Fory Java 构建。Fory Java 中的大多数配置选项、特性和概念都可直接应用于 Scala。可参考 Java 文档了解：

- [配置](../java/configuration.md) - 所有 ForyBuilder 选项
- [基础序列化](../java/basic-serialization.md) - 序列化模式与 API
- [类型注册](../java/type-registration.md) - 类注册与安全性
- [Schema 演进](../java/schema-evolution.md) - 前向和后向兼容
- [自定义序列化器](../java/custom-serializers.md) - 实现自定义序列化器
- [压缩](../java/compression.md) - Int、long 和字符串压缩
- [故障排查](../java/troubleshooting.md) - 常见问题与解决方案

## Scala 特定文档

- [Fory 创建](configuration.md) - Scala 特定的 Fory 设置要求
- [类型序列化](type-serialization.md) - Scala 类型的序列化
- [默认值](default-values.md) - Scala 类默认值支持
