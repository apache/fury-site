---
title: Scala
sidebar_position: 12
id: scala
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

Scala 目标只生成 Scala 3 源代码。`fory-scala` 产物仍支持 Scala 2.13 和 Scala 3，但生成的
IDL 源代码和宏派生需要 Scala 3。

## 输出布局

对于 `package addressbook`，Scala 输出生成在：

- `<scala_out>/addressbook/`
- 类型文件：`AddressBook.scala`、`Person.scala`、`Dog.scala`、`Cat.scala`、`Animal.scala`
- Schema 模块：`AddressbookForyModule.scala`

对于没有 Scala 包的 Schema，Schema 模块名称从源文件主名（stem）派生，例如 `main.fdl`
生成 `MainForyModule.scala`。Scala 导入图不能混用默认包 Schema 和命名 Scala 包。

## 类型生成

不在编译器检测到的构造环中的消息会生成 case class：

```scala
import org.apache.fory.annotation.{ForyField, ForyStruct}
import org.apache.fory.scala.ForySerializer

@ForyStruct
final case class Person(
  @ForyField(id = 1) name: String,
  @ForyField(id = 3) email: Option[String],
  @ForyField(id = 7) phones: List[Person.PhoneNumber],
  @ForyField(id = 8) pet: Animal
) derives ForySerializer {
  def toBytes(): Array[Byte] =
    AddressbookForyModule.getFory.serialize(this)
}

object Person {
  def fromBytes(bytes: Array[Byte]): Person =
    AddressbookForyModule.getFory.deserialize(bytes).asInstanceOf[Person]
}
```

循环构造环中的消息会生成具有可变序列化字段的普通类，使读取代码可以在读取反向引用前
注册对象：

```scala
import org.apache.fory.annotation.{ForyField, ForyStruct, Ref}
import org.apache.fory.scala.ForySerializer

@ForyStruct
final class Node() derives ForySerializer {
  @ForyField(id = 1)
  var id: String = ""

  @Ref
  @ForyField(id = 2)
  var parent: Option[Node] = None
}
```

枚举生成具有稳定 Fory ID 的 Scala 3 枚举：

```scala
import org.apache.fory.annotation.ForyEnumId

enum PhoneType {
  @ForyEnumId(0)
  case Mobile

  @ForyEnumId(1)
  case Home

  @ForyEnumId(2)
  case Work
}
```

联合生成 Scala 3 ADT 枚举。`Unknown(UnknownCase)` 是 Fory 提供的向前兼容载体，使用
`@ForyUnknownCase` 标记。它不会出现在 Schema case 表中，因为该标记只选择载体，不会
添加 Schema 条目。Schema 定义的 case 使用非负 `@ForyCase` ID。类型化联合必须至少
包含一个非 `Unknown` case。

```scala
package addressbook

import org.apache.fory.annotation.{ForyCase, ForyUnion, ForyUnknownCase}
import org.apache.fory.scala.ForySerializer
import org.apache.fory.`type`.union.UnknownCase

@ForyUnion
enum Animal derives ForySerializer {
  @ForyUnknownCase
  case Unknown(value: UnknownCase)

  @ForyCase(id = 0)
  case Dog(value: _root_.addressbook.Dog)

  @ForyCase(id = 1)
  case Cat(value: _root_.addressbook.Cat)
}
```

当 Schema case 名称与载荷类型具有相同简单名称时，带包的 Scala 输出会保留 Schema
case 名称并限定载荷类型。如果目标输出模式无法为冲突表达合法限定名，编译器会在生成的
case 名称后追加 `Case`。

`optional T` 字段生成 `Option[T]`。顶层消息引用在字段或构造函数参数上使用 `@Ref`。
嵌套元素/值引用使用 `List[Node @Ref]` 等类型使用位置注解。

## Schema 模块

生成的 Schema 模块注册 Schema 序列化器、枚举、struct 和联合。包拥有的辅助 Fory
实例使用已安装 Schema 模块的 `ForyScala.builder().withXlang(true)`，因此消息
`toBytes`/`fromBytes` 辅助方法无需调用方管理 Fory 设置即可工作：

```scala
object AddressbookForyModule extends org.apache.fory.ForyModule {
  private lazy val fory: ThreadSafeFory =
    ForyScala.builder()
      .withXlang(true)
      .withRefTracking(true)
      .withModule(this)
      .buildThreadSafeFory()

  private[addressbook] def getFory: ThreadSafeFory = fory

  override def install(fory: Fory): Unit = {
    ScalaSerializers.registerEnum(fory, classOf[Person.PhoneType], 101L)
    ForySerializer.register(fory, classOf[Person.PhoneNumber], 102L)
    ForySerializer.register(fory, classOf[Person], 100L)
    ForySerializer.register(fory, classOf[Animal], 106L)
  }
}
```

## gRPC 服务配套代码

使用 `--grpc` 时，Scala 在生成模型的包中为每个本地服务生成一个 `<ServiceName>Grpc.scala` 对象。它公开 `SERVICE_NAME`、服务和方法描述符、`<ServiceName>ImplBase` 和 `<ServiceName>Client`。`RpcFuture`、`RpcIterator`、grpc-java 变体和生命周期指南请参阅 [Scala gRPC](../../grpc/scala.md)。
