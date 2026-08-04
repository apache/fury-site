---
title: Scala 原生序列化
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

本页介绍如何在原生模式下序列化 Scala 特有的 JVM 类型。跨语言 Scala 模型请使用
[跨语言互操作](basic-serialization.md#cross-language-interoperability)中介绍的 xlang 路径。

启用兼容模式后，Scala 读取端会针对部分标量字段类型变更使用 JVM 兼容读取规则。当转换后
的值具有相同逻辑值时，匹配字段可以在 `Boolean`、`String`、数值标量和
`java.math.BigDecimal` 之间读取。例如，`"true"` 和 `"false"` 可以读取为布尔值，
`"123"` 可以读取为能够容纳 `123` 的数值字段，数字和十进制数可以读取为规范字符串；
数值扩宽或收窄只有在不损失精度或范围时才会成功。数字字符串使用有限 ASCII 十进制
语法。无效字符串和有损转换会在反序列化期间失败。可选字段和装箱字段仍可与这些转换
组合使用，但引用跟踪标量的类型变更不兼容。

## 设置

所有示例都采用以下设置：

```scala
import org.apache.fory.Fory
import org.apache.fory.scala.ForyScala

val fory = ForyScala.builder().withXlang(false)
  .build()
```

## Case Class

```scala
case class Person(github: String, age: Int, id: Long)

fory.register(classOf[Person])

val p = Person("https://github.com/chaokunyang", 18, 1)
println(fory.deserialize(fory.serialize(p)))
```

## POJO 类

```scala
class Foo(f1: Int, f2: String) {
  override def toString: String = s"Foo($f1, $f2)"
}

fory.register(classOf[Foo])

println(fory.deserialize(fory.serialize(new Foo(1, "chaokunyang"))))
```

## Object 单例

Scala `object` 单例在序列化和反序列化后仍为同一实例：

```scala
object MySingleton {
  val value = 42
}

fory.register(MySingleton.getClass)

val o1 = fory.deserialize(fory.serialize(MySingleton))
val o2 = fory.deserialize(fory.serialize(MySingleton))
println(o1 == o2) // true
```

## 集合

完整支持 Scala 集合：

```scala
val seq = Seq(1, 2)
val list = List("a", "b")
val map = Map("a" -> 1, "b" -> 2)

println(fory.deserialize(fory.serialize(seq)))
println(fory.deserialize(fory.serialize(list)))
println(fory.deserialize(fory.serialize(map)))
```

## Tuple

支持所有 Scala tuple 类型（Tuple1 到 Tuple22）：

```scala
val tuple2 = (100, 10000L)
println(fory.deserialize(fory.serialize(tuple2)))

val tuple4 = (100, 10000L, 10000L, "str")
println(fory.deserialize(fory.serialize(tuple4)))
```

## Enum

### Scala 3 枚举

```scala
enum Color { case Red, Green, Blue }

fory.register(classOf[Color])

println(fory.deserialize(fory.serialize(Color.Green)))
```

### Scala 2 Enumeration

```scala
object ColorEnum extends Enumeration {
  type ColorEnum = Value
  val Red, Green, Blue = Value
}

fory.register(Class.forName("scala.Enumeration.Val"))

println(fory.deserialize(fory.serialize(ColorEnum.Green)))
```

> **注意**：对于 Scala 2 Enumeration，可能需要注册 `scala.Enumeration.Val` 或启用引用跟踪，以避免 `StackOverflowError`。

## Option

```scala
val some: Option[Long] = Some(100)
println(fory.deserialize(fory.serialize(some)))

val none: Option[Long] = None
println(fory.deserialize(fory.serialize(none)))
```

## Either

```scala
val right: Either[String, Int] = Right(42)
println(fory.deserialize(fory.serialize(right)))

val left: Either[String, Int] = Left("error")
println(fory.deserialize(fory.serialize(left)))
```

## 嵌套类型

完整支持复杂嵌套结构：

```scala
case class Address(street: String, city: String)
case class Company(name: String, address: Address)
case class Employee(name: String, company: Company, tags: List[String])

fory.register(classOf[Address])
fory.register(classOf[Company])
fory.register(classOf[Employee])

val employee = Employee(
  "John",
  Company("Acme", Address("123 Main St", "Springfield")),
  List("developer", "scala")
)

println(fory.deserialize(fory.serialize(employee)))
```

对于仅限 Scala/JVM 且需要在 JVM 运行时路径上使用 Scala case class、集合、tuple、option
或枚举的通信，请使用原生模式。生产环境 builder 设置请参阅
[Scala 配置](configuration.md)。
