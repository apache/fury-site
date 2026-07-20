---
title: 类型序列化
sidebar_position: 2
id: type_serialization
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

本页介绍 Scala 特定类型的序列化。

## 设置

所有示例假设以下设置：

```scala
import org.apache.fory.Fory
import org.apache.fory.serializer.scala.ScalaSerializers

val fory = Fory.builder()
  .withScalaOptimizationEnabled(true)
  .build()

ScalaSerializers.registerSerializers(fory)
```

## Case 类

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

Scala `object` 单例被序列化和反序列化为同一个实例：

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

完全支持 Scala 集合：

```scala
val seq = Seq(1, 2)
val list = List("a", "b")
val map = Map("a" -> 1, "b" -> 2)

println(fory.deserialize(fory.serialize(seq)))
println(fory.deserialize(fory.serialize(list)))
println(fory.deserialize(fory.serialize(map)))
```

## 元组

支持所有 Scala 元组类型（Tuple1 到 Tuple22）：

```scala
val tuple2 = (100, 10000L)
println(fory.deserialize(fory.serialize(tuple2)))

val tuple4 = (100, 10000L, 10000L, "str")
println(fory.deserialize(fory.serialize(tuple4)))
```

## 枚举

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

> **注意**：对于 Scala 2 Enumeration，可能需要注册 `scala.Enumeration.Val` 或启用引用跟踪以避免 `StackOverflowError`。

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

完全支持复杂的嵌套结构：

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
