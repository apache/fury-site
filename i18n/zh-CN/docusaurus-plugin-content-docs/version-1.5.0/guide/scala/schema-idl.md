---
title: Schema IDL 与 Xlang
sidebar_position: 5
id: schema_idl
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

Fory schema IDL 的 Scala target 会为 xlang 载荷生成 Scala 3 源码。运行时构件仍会同时为 Scala 2.13 和 Scala 3 cross-build；只有 schema IDL 输出和 quoted macro 派生需要 Scala 3。

## 设置

生成的 Scala 代码使用 `org.apache.fory.scala` 中的公共 macro API，以及 `org.apache.fory.annotation` 中的共享 JVM 注解。Macro 内部实现位于 `org.apache.fory.scala.internal` 下。

```scala
import org.apache.fory.scala.{ForyScala, ForySerializer}
import example.ExampleForyModule

val fory = ForyScala.builder()
  .withXlang(true)
  .withRefTracking(true)
  .withModule(ExampleForyModule)
  .build()
```

生成的 schema modules 也是 Fory modules。创建自定义运行时时使用 `.withModule(...)`；如果默认的 xlang-compatible 运行时已经足够，也可以使用生成的无参 `toBytes` 和 `fromBytes` helper。

生成的 helper 会先注册 message 类型身份，再安装 message 序列化器。这个两阶段顺序让相互递归的 message graph 可以通过常规 `TypeResolver` 路径构建 descriptor metadata，而不需要临时序列化器或 Java core 中的 Scala 专用注册状态。Enums 和 unions 会直接连同其序列化器一起注册，因为它们派生出的序列化器负责 case dispatch。

## 生成的 Messages

无环 messages 会生成 case classes：

```scala
import org.apache.fory.annotation.{ForyField, ForyStruct}
import org.apache.fory.scala.ForySerializer

@ForyStruct
final case class Person(
  @ForyField(id = 1) name: String,
  @ForyField(id = 2) email: Option[String]
) derives ForySerializer
```

Schema `optional T` 字段会存储为 `Option[T]`。

编译器检测到处于构造循环中的 messages 会生成带可变序列化字段的普通类，这样反序列化器就能在读取可能指回该对象的字段之前分配并注册对象。顶层 `ref Foo`、嵌套 `list<ref Foo>` 或 `any` 字段本身不会强制使用这种形态。编译器会一起分析 message 和 union 依赖，因此 message-to-union-to-message 循环也会让参与循环的 messages 成为普通类。只包含循环嵌套类型的无环 owner messages 仍会保持为 case classes。

引用跟踪通过共享的 `@Ref` 注解表达，包括 type-use 位置：

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

`@Ref` 是 Scala macro 和 IDL API 使用的 JVM 引用跟踪注解。顶层 `ref T` 字段应在字段或构造函数参数上使用 `@Ref`。只有嵌套 element/value/payload refs（例如 `list<ref T>`）才使用 type-use `T @Ref`。

生成的 xlang collection 字段使用不可变 Scala collection 类型：`List[T]`、`Set[T]` 和 `Map[K, V]`。运行时 xlang 序列化器也可以重建受支持的可变 collection interfaces，例如 `scala.collection.Seq` 和 `scala.collection.Map`，但除非显式生成，具体的可变 collection classes 不属于 schema IDL 表面。

## 生成的 Enums

IDL enums 只生成 Scala 3 enums。编译器不会生成 Java enum 文件。

```scala
import org.apache.fory.annotation.ForyEnumId

enum Status {
  @ForyEnumId(0)
  case Unknown

  @ForyEnumId(1)
  case Ok
}
```

生成的注册使用 `ScalaSerializers.registerEnum(...)`，因此 xlang 模式会使用 case 级 `@ForyEnumId` 元信息中的稳定 Fory enum IDs。

## 生成的 Unions

IDL unions 会生成带 macro-derived 序列化器的 Scala 3 ADT enums：

```scala
import org.apache.fory.annotation.{ForyCase, ForyUnion, UInt32Type}
import org.apache.fory.config.Int32Encoding
import org.apache.fory.scala.ForySerializer

@ForyUnion
enum SearchTarget derives ForySerializer {
  @ForyCase(id = 0)
  case UnknownCase(caseId: Int, value: Any)

  @ForyCase(id = 1)
  case UserCase(value: User)

  @ForyCase(id = 2)
  case FixedIdCase(value: Long @UInt32Type(encoding = Int32Encoding.FIXED))
}
```

Schema 定义的 union cases 必须使用正 ID。Case ID `0` 预留给 Scala unknown-case carrier，其载荷会存储原始正 case ID 和反序列化出的值。当 reader 遇到更新的正 case ID 时，会返回 `UnknownCase(originalId, value)`，而不是仅因本地不知道该 case ID 就失败。

Macro 会直接写入现有的 xlang union envelope。它不会分配临时 Java `Union` carriers。

## 手动 Scala 3 派生

手写 Scala 3 models 可以派生同一个 serializer typeclass：

```scala
@ForyStruct
final class Record(@ForyField(id = 1) val id: Int) derives ForySerializer {
  @ForyField(id = 2)
  var name: String = ""
}
```

Macro 会为 constructor-owned fields 生成直接构造函数调用，并为 mutable post-construction fields 生成直接赋值。它会根据 Scala 编译期类型构建 descriptor metadata，包括嵌套 generics、`Option`、arrays、scalar encoding annotations、nullability 和 `@Ref` metadata。Java 反射不是生成 Scala metadata 的事实来源。

复制期间，当被复制的 root 可以在复制循环字段之前先分配并注册时，就支持循环图；这正是 schema IDL 对构造循环使用的普通类形态。如果复制从参与循环的不可变 constructor-owned value 开始，例如 Scala enum case 或 case class，则序列化器会给出明确错误，因为在构造完成前无法发布被复制的 identity。
