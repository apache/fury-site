---
title: 基础序列化
sidebar_position: 1
id: basic-serialization
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

Xlang 是 Fory Scala 的默认序列化模式。本页介绍该默认模式的基础序列化 API 和互操作规则。

## 跨语言互操作 {#cross-language-interoperability}

以下内容介绍默认 xlang 模式的模型生成、注册和跨语言往返。

Fory Schema IDL 的 Scala 目标会为 xlang 载荷生成 Scala 3 源代码。Fory Scala 产物仍然
针对 Scala 2.13 和 Scala 3 进行交叉构建；只有 Schema IDL 输出和 quoted 宏派生需要
Scala 3。

### 设置

生成的 Scala 代码使用 `org.apache.fory.scala` 中的公共宏 API，以及
`org.apache.fory.annotation` 中的共享 JVM 注解。宏内部实现在
`org.apache.fory.scala.internal` 下。

```scala
import org.apache.fory.scala.{ForyScala, ForySerializer}
import example.ExampleForyModule

val fory = ForyScala.builder()
  .withXlang(true)
  .withRefTracking(true)
  .withModule(ExampleForyModule)
  .build()
```

生成的 Schema 模块也是 Fory 模块。创建自定义 Fory 实例时使用 `.withModule(...)`；
如果生成的默认 Fory 实例已经足够，则使用生成的无参数 `toBytes` 和 `fromBytes` 辅助方法。

包含服务定义的 Schema 还可以通过 `foryc --scala_out=... --grpc` 生成 Scala 3 gRPC
服务配套代码。依赖项和客户端/服务端示例请参阅 [gRPC 支持](../../grpc/scala.md)。

生成的辅助代码会先注册消息类型身份，再安装消息序列化器。这种两阶段顺序使相互递归的
消息图能够通过常规 `TypeResolver` 路径构建描述符元数据，而无需在 Java 核心中使用
临时序列化器或 Scala 特有注册状态。枚举和联合会直接与其序列化器一起注册，因为派生
序列化器负责 case 分派。

### 生成的消息

无环消息会生成 case class：

```scala
import org.apache.fory.annotation.{ForyField, ForyStruct}
import org.apache.fory.scala.ForySerializer

@ForyStruct
final case class Person(
  @ForyField(id = 1) name: String,
  @ForyField(id = 2) email: Option[String]
) derives ForySerializer
```

Schema `optional T` 字段存储为 `Option[T]`。

处于编译器检测到的构造环中的消息会生成具有可变序列化字段的普通类，使反序列化器可以在
读取可能回指该对象的字段之前分配并注册对象。顶层 `ref Foo`、嵌套 `list<ref Foo>` 或
`any` 字段本身不会强制采用这种形式。编译器会同时分析消息和联合依赖关系，因此
消息到联合再到消息的环也会使参与其中的消息成为普通类。只包含循环嵌套类型的无环
所有者消息仍为 case class。

引用跟踪通过共享的 `@Ref` 注解表示，包括类型使用位置：

```scala
@ForyStruct
final class Node() derives ForySerializer {
  @ForyField(id = 1)
  var children: List[Node @Ref] = List.empty

  @Ref
  @ForyField(id = 2)
  var parent: Option[Node] = None
}
```

`@Ref` 是 Scala 宏和 IDL API 使用的 JVM 引用跟踪注解。请在字段或构造函数参数上使用
`@Ref` 来表示顶层 `ref T` 字段。只有类型使用位置的 `T @Ref` 才用于嵌套元素/值/载荷
引用，例如 `list<ref T>`。

生成的 xlang 集合字段使用不可变 Scala 集合类型：`List[T]`、`Set[T]` 和 `Map[K, V]`。
Fory 的 xlang 序列化器也可以重建 `scala.collection.Seq` 和
`scala.collection.Map` 等受支持的可变集合接口，但除非显式生成，否则具体可变集合类
不属于 Schema IDL 接口范围。

### 生成的枚举

IDL 枚举仅生成 Scala 3 枚举。编译器不会生成 Java 枚举文件。

```scala
import org.apache.fory.annotation.ForyEnumId

enum Status {
  @ForyEnumId(0)
  case Unknown

  @ForyEnumId(1)
  case Ok
}
```

生成的注册代码使用 `ScalaSerializers.registerEnum(...)`，因此 xlang 模式会使用来自 case
级 `@ForyEnumId` 元数据的稳定 Fory 枚举 ID。

### 生成的联合

IDL 联合会生成带宏派生序列化器的 Scala 3 ADT 枚举：

```scala
package example

import org.apache.fory.annotation.{ForyCase, ForyUnion, ForyUnknownCase, UInt32Type}
import org.apache.fory.config.Int32Encoding
import org.apache.fory.scala.ForySerializer
import org.apache.fory.`type`.union.UnknownCase

@ForyUnion
enum SearchTarget derives ForySerializer {
  @ForyUnknownCase
  case Unknown(value: UnknownCase)

  @ForyCase(id = 0)
  case User(value: _root_.example.User)

  @ForyCase(id = 1)
  case FixedId(value: Long @UInt32Type(encoding = Int32Encoding.FIXED))
}
```

当生成的 Scala 联合 case 名称与载荷类型的简单名称相同时，带软件包的输出会保留 case
名称，并使用限定名表示载荷类型。如果目标输出模式无法为冲突表达合法限定名，IDL
编译器会在生成的 case 名称后追加 `Case`。

Schema 定义的联合 case 使用非负 ID，类型化联合必须声明至少一个非 `Unknown` case。
Scala 未知 case 载体由 `@ForyUnknownCase` 选择，而不是由 Schema case ID 选择。其载荷
存储原始 case ID 和反序列化后的值。当读取端遇到较新的 case ID 时，会返回
`Unknown(UnknownCase)`，而不会仅仅因为本地不知道该 case ID 就失败。

宏会直接写入现有的 xlang 联合信封，不会分配临时 Java `Union` 载体。

### 手动 Scala 3 派生

手写 Scala 3 模型可以派生相同的序列化器 typeclass：

```scala
@ForyStruct
final class Record(@ForyField(id = 1) val id: Int) derives ForySerializer {
  @ForyField(id = 2)
  var name: String = ""
}
```

宏会为构造函数负责的字段生成直接构造函数调用，并为构造后的可变字段生成直接赋值。
它根据 Scala 编译期类型构建描述符元数据，包括嵌套泛型、`Option`、数组、标量编码注解、
可空性和 `@Ref` 元数据。Java 反射不是生成 Scala 元数据的事实来源。

复制期间，如果可以在复制循环字段之前分配并注册被复制的根对象，则支持循环图；这正是
Schema IDL 为构造环使用的普通类形式。如果复制从参与环的不可变构造函数所有值开始，
例如 Scala 枚举 case 或 case class，序列化器会给出明确错误，因为在构造完成前无法发布
被复制对象的身份。

### 第一次往返处理

```scala
import org.apache.fory.Fory
import org.apache.fory.scala.ForyScala

case class Person(name: String, age: Int)

object Example {
  def main(args: Array[String]): Unit = {
    val fory: Fory = ForyScala.builder()
      .withXlang(true)
      .build()
    fory.register(classOf[Person])

    val bytes = fory.serialize(Person("chaokunyang", 28))
    val result = fory.deserialize(bytes).asInstanceOf[Person]
    println(s"${result.name} ${result.age}")
  }
}
```
