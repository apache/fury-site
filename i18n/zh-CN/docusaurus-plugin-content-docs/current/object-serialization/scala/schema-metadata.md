---
title: Schema 元数据
sidebar_position: 5
id: schema-metadata
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

Scala Schema 元数据由 Schema IDL 生成的代码和 Scala 3 宏派生的 xlang 序列化器使用。
元数据通过共享的 JVM Fory 注解和 Scala 编译期类型信息声明。

## 结构体字段

Schema 消息可以使用 `@ForyStruct` 和 `@ForyField(id = N)`：

```scala
import org.apache.fory.annotation.{ForyField, ForyStruct}
import org.apache.fory.scala.ForySerializer

@ForyStruct
final case class Person(
  @ForyField(id = 1) name: String,
  @ForyField(id = 2) email: Option[String]
) derives ForySerializer
```

Schema `optional T` 字段表示为 `Option[T]`。

## 引用跟踪

引用跟踪使用共享的 JVM `@Ref` 注解。请在字段或构造函数参数上使用 `@Ref` 来表示顶层
`ref T` 字段；对于嵌套集合或 map 载荷，请使用类型使用位置的 `T @Ref`：

```scala
import org.apache.fory.annotation.{ForyField, ForyStruct, Ref}

@ForyStruct
final class Node() derives ForySerializer {
  @ForyField(id = 1)
  var children: List[Node @Ref] = List.empty

  @Ref
  @ForyField(id = 2)
  var parent: Option[Node] = None
}
```

## 枚举 ID

IDL 枚举会生成 Scala 3 枚举。稳定的 Fory 枚举 ID 来自 case 级 `@ForyEnumId` 元数据：

```scala
import org.apache.fory.annotation.ForyEnumId

enum Status {
  @ForyEnumId(0)
  case Unknown

  @ForyEnumId(1)
  case Ok
}
```

生成的注册代码使用 `ScalaSerializers.registerEnum(...)`，因此 xlang 模式会使用这些稳定 ID。

## 联合

IDL 联合会生成带有 `@ForyUnion` 和 `@ForyCase` 元数据的 Scala 3 ADT 枚举：

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

Schema 定义的联合 case 使用非负 ID，类型化联合必须声明至少一个非 `Unknown` case。
未知 case 载体由 `@ForyUnknownCase` 选择，而不是由 Schema case ID 选择。当生成的 Scala
联合 case 名称与载荷类型的简单名称相同时，带软件包的输出会保留 case 名称，并使用
限定名表示载荷类型。如果目标输出模式无法为冲突表达合法限定名，IDL 编译器会在生成的
case 名称后追加 `Case`。

## 生成元数据的来源

Scala 宏根据 Scala 编译期类型构建描述符元数据，包括嵌套泛型、`Option`、数组、标量
编码注解、可空性和 `@Ref` 元数据。Java 反射不是生成 Scala 元数据的事实来源。

## 相关主题

- [跨语言互操作](basic-serialization.md#cross-language-interoperability)
- [配置](configuration.md)
- [默认值](default-values.md)
