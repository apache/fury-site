---
title: Schema 元信息
sidebar_position: 3
id: schema_metadata
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

Scala schema 元信息由 schema IDL 生成代码和 Scala 3 macro-derived xlang 序列化器使用。元信息通过共享的 JVM Fory 注解和 Scala 编译期类型信息声明。

## Struct 字段

Schema messages 可以使用 `@ForyStruct` 和 `@ForyField(id = N)`：

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

引用跟踪使用共享的 JVM `@Ref` 注解。顶层 `ref T` 字段应在字段或构造函数参数上使用 `@Ref`，嵌套 collection 或 map 载荷应使用 type-use `T @Ref`：

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

## Enum IDs

IDL enums 会生成 Scala 3 enums。稳定的 Fory enum IDs 来自 case 级 `@ForyEnumId` 元信息：

```scala
import org.apache.fory.annotation.ForyEnumId

enum Status {
  @ForyEnumId(0)
  case Unknown

  @ForyEnumId(1)
  case Ok
}
```

生成的注册使用 `ScalaSerializers.registerEnum(...)`，因此 xlang 模式会使用这些稳定 ID。

## Unions

IDL unions 会生成带 `@ForyUnion` 和 `@ForyCase` 元信息的 Scala 3 ADT enums：

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

Schema 定义的 union cases 必须使用正 ID。Case ID `0` 预留给 reader 遇到更新的正 case ID 时使用的 unknown-case carrier。

## 生成的元信息来源

Scala macro 会根据 Scala 编译期类型构建 descriptor metadata，包括嵌套 generics、`Option`、arrays、scalar encoding annotations、nullability 和 `@Ref` metadata。Java 反射不是生成 Scala metadata 的事实来源。

## 相关主题

- [Schema IDL 与 Xlang](schema-idl.md)
- [配置](configuration.md)
- [默认值](default-values.md)
