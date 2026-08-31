---
title: Scala
sidebar_position: 7
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

Fory JSON 通过可选的 `fory-json-scala` 制品支持 Scala 2.13 和 Scala 3。该模块支持普通 JVM 和 GraalVM Native Image，不支持 Android。

## 设置 {#setup}

```sbt
libraryDependencies += "org.apache.fory" %% "fory-json-scala" % "1.7.0"
```

`ForyJsonScala.builder()` 安装 Scala 模块并返回标准 Fory JSON builder：

```scala
import org.apache.fory.json.scala.ForyJsonScala

case class Person(name: String, age: Int = 18, aliases: List[String] = Nil)

val json = ForyJsonScala.builder().build()
val text = json.toJson(Person("Ada"))
val person = json.fromJson(text, classOf[Person])
```

请复用得到的 `ForyJson` 实例。它在构建后不可变且线程安全。

## Case class 与注解 {#case-classes-and-annotations}

case class 通过调用完整主构造函数解码。对于缺失且有默认值的参数，Fory 调用 Scala 生成的构造函数默认值方法，不解析默认值表达式，也不修改构造函数 `val` 字段。后续参数列表中的默认值会按 Scala 语义接收前面已确定的构造函数参数。缺少无默认值的参数会报错。类体中的可变属性在构造后赋值。

case class 可以声明在顶层，也可以嵌套在任意层数的 `object` 内，但每一层外部作用域都必须是 `object`。如果外层是 `class`、trait 或方法，读写都会被拒绝，因为 Fory 无法访问重建值所需的外部实例或伴生对象。

Fory JSON 注解可以直接放在 Scala 构造函数属性上：

```scala
import org.apache.fory.json.annotation.{JsonCodec, JsonIgnore, JsonProperty}

case class Media(
    @JsonProperty("media_uri") uri: String,
    @JsonIgnore internalId: String = "hidden",
    @JsonCodec(elementCodec = classOf[TagCodec]) tags: List[Tag] = Nil,
    @JsonProperty(include = JsonProperty.Include.NON_NULL) title: String = null
)
```

`JsonIgnore` 适用于字段、属性方法、setter 参数和选定的构造函数参数。`JsonCodec` 子槽位绑定直接集合元素、`Option` 内容，以及 Map 键或值。其他 Fory JSON 注解保持[注解](annotations.md)中描述的行为。

如果必需且没有默认值的引用参数使用了会省略 `null` 的包含规则，序列化会拒绝 null 值，以确保 Fory 写出的 JSON 仍可按同一个 case class Schema 读取。

## 支持的 Scala 类型 {#supported-scala-types}

| Scala 类型 | JSON 表示形式 |
| ----------------------------------------------------------- | ----------------------------------------------- |
| `Unit` | `null` |
| case class | 对象 |
| 单例对象 | 空对象 |
| 值类 | 底层值 |
| `Option[A]`、`Some[A]`、`None` | 所含值或 `null` |
| `Either[L, R]` | 恰好包含一个 `l` 或 `r` 成员的对象 |
| `List`、`Seq`、`Vector`、`Queue`、`ArraySeq`、buffer、set | 数组 |
| Scala Map、`IntMap`、`LongMap` | 对象 |
| 不可变与可变 `BitSet` | 升序整数数组 |
| `Tuple1` 至 `Tuple22` | 定长数组 |
| Scala 3 `EmptyTuple` | 空数组 |
| `BigInt`、`BigDecimal` | JSON 数字 |
| Scala `StringBuilder` | string |
| `Range`、受支持的 `NumericRange` | 已求值的值数组 |
| `FiniteDuration`、`Duration` | 固定的 `length`/`unit` 或 `special` 对象 |
| 无参数的 Scala 3 枚举 | 字符串形式的枚举分支名 |
| Scala 2 `Enumeration` | 通过绑定所属枚举的编解码器表示为字符串 |

严格求值的标准库集合通过标准 Scala builder 重建。`Either` 写入紧凑的 `l` 和 `r` 成员名，读取器也接受旧的 `left` 和 `right` 名称。Fory 不增加 Scala 专用集合大小限制；编解码器使用与 Fory JSON 核心相同的输入长度、深度、对象图内存和读取进度限制。如果稀疏 `BitSet` 的最高索引要求分配与可用 JSON 输入不成比例的底层存储，则会被拒绝。

默认模块有意不支持惰性求值或进程局部值，包括 `LazyList`、`Stream`、view、迭代器、集合 builder、`Try`、`Throwable`、`Future`、`Promise`、`ExecutionContext`、`Deadline`、函数、反射/编译器元数据和正则表达式值。有序集合或自定义集合需要精确的应用编解码器，因为排序或构造方式属于应用配置。

## 参数化类型 {#parameterized-types}

读取参数化 Scala 类型时，使用完整的 `TypeRef`：

```scala
import org.apache.fory.reflect.TypeRef

val typeRef = new TypeRef[Map[String, Option[Int]]]() {}
val value = json.fromJson("""{"count":1}""", typeRef)
```

Scala 原始字符串可以直接传给 `fromJson`，JSON 双引号无需反斜杠转义。

Scala 值类型参数在常规 JVM 签名中可能被擦除为 `Object`。`ScalaTypeRef` 是编译期类型令牌构造器，可在 Scala 2.13 和 Scala 3 上保留这些参数：

```scala
import org.apache.fory.json.scala.ScalaTypeRef

val rangeType = ScalaTypeRef[scala.collection.immutable.NumericRange[Int]]
val range = json.fromJson("[1,3,5,7]", rangeType)
```

提供完整类型参数时，`Some[Int]` 是有效声明类型。非 null JSON 值解码为 `Some(value)`；`Some[Int]` 拒绝 JSON `null`，而 `Option[Int]` 将其解码为 `None`。

## Scala 2 Enumeration

Scala 2 会从 `Enumeration#Value` 中擦除所属的 `Enumeration`。使用 `JsonEnumeration` 可在直接值、集合或数组元素、`Option` 内容以及 Map 键/值上保留其所属枚举：

```scala
import org.apache.fory.json.scala.JsonEnumeration

object Weekday extends Enumeration {
  val Monday, Tuesday = Value
}

object Month extends Enumeration {
  val January, February = Value
}

case class Schedule(
    @JsonEnumeration(classOf[Weekday.type]) day: Weekday.Value,
    @JsonEnumeration(element = classOf[Weekday.type]) days: List[Weekday.Value],
    @JsonEnumeration(content = classOf[Month.type]) month: Option[Month.Value],
    @JsonEnumeration(
      mapKey = classOf[Weekday.type],
      mapValue = classOf[Month.type]
    ) labels: Map[Weekday.Value, Month.Value]
)
```

每个槽位描述一个直接的 `Enumeration.Value` 使用位置。`value` 不能与子槽位组合；`element`、`content` 和 Map 槽位必须匹配被标注属性的直接类型结构。无效或冲突的声明会在创建 case class 元数据时失败。

自定义编码表示时，扩展 `ScalaEnumerationCodec` 并通过 `@JsonCodec` 选择该编解码器。该编解码器也实现 Map 键契约，因此其类可用于 `keyCodec`。

## Scala 3 封闭枚举与 sealed 层次结构 {#scala-3-closed-enums-and-sealed-hierarchies}

无参数的 Scala 3 枚举以分支名作为 JSON 字符串。对于带参数分支的枚举，添加 `derives ScalaJsonCodec`，即可为所有分支定义统一的封闭包装对象表示：

```scala
import org.apache.fory.json.scala.*

enum Result derives ScalaJsonCodec {
  case Ok(value: String)
  case Error(code: Int)
  case Pending
}

val json = ForyJsonScala.builder().build()
```

上述值分别使用 `{"Ok":{"value":"ready"}}`、`{"Error":{"code":7}}` 和 `{"Pending":{}}`。读取器不会接受类名或通过运行时反射选择子类型。对于无法添加 `derives` 的第三方枚举，可在 builder 调用处派生并注册其 Schema：

```scala
val json = ForyJsonScala.builder().register[thirdparty.Result].build()
```

对于 Scala 3 sealed trait 或类，添加空的 `JsonSubTypes` 注解并派生 `ScalaJsonCodec`：

```scala
import org.apache.fory.json.annotation.JsonSubTypes
import org.apache.fory.json.scala.*

@JsonSubTypes(property = "kind")
sealed trait Event derives ScalaJsonCodec

final case class Message(value: String) extends Event
case object Idle extends Event
```

此示例使用 `Message` 和 `Idle` 作为逻辑子类型名。派生过程递归遍历 sealed 分支。具体 open 类作为一个精确成员，其后代不被允许；开放抽象分支会被拒绝。非空注解值仍表示显式子集。此推导功能不支持 Scala 2 sealed trait 和类。

### 将派生编解码器打包到模块 {#packaging-derived-codecs-in-a-module}

支持多个第三方 Scala 3 枚举的库，可以将其派生编解码器打包为可复用模块：

```scala
import org.apache.fory.json.{ForyJsonModule, ModuleContext}
import org.apache.fory.json.scala.*

object ThirdPartyJsonModule extends ForyJsonModule:
  override def install(context: ModuleContext): Unit =
    context.registerCodec(
      classOf[thirdparty.Result],
      ScalaJsonCodec.derived[thirdparty.Result]
    )

val json =
  ForyJsonScala.builder()
    .withModule(ThirdPartyJsonModule)
    .build()
```

派生代码作为模块的一部分编译，因此使用者只需安装已编译的模块。这相当于将一个 builder 上的 `register[thirdparty.Result]` 调用封装为可复用形式。

模块通过 `withModule` 显式安装。Fory JSON 不扫描类路径，也不通过 `ServiceLoader` 调用模块；显式安装让启用的编解码器保持确定，并防止无关依赖改变反序列化行为。通用模块 API 和注册规则见[模块](modules.md)。

## GraalVM Native Image

Scala 模块在 JVM 和原生镜像中使用相同的注册方式。应用模型、自定义编解码器，以及派生的枚举或 sealed Schema 必须在原生镜像构建时可达。应在 native-image 构建过程中生成 Fory 编解码器，而不是添加通用反射配置。
