---
title: Scala 序列化指南
sidebar_position: 4
id: scala_guide
---

Apache Fury 支持所有 Scala 对象序列化：

- `case` 支持类序列化；
- `pojo/bean` 支持类序列化；
- `object` 支持单例序列化；
- `collection` 支持序列化；
- 其他类型（如 `tuple/either` AND BASIC 类型）也都受支持。

Scala 2 和 3 均支持。

## 安装

```sbt
libraryDependencies += "org.apache.fury" % "fury-core" % "0.7.1"
```

## Fury 对象创建

当使用 Apache Fury 进行 Scala 序列化时，您应该至少使用以下选项创建 Fury 对象：

```scala
val fury = Fury.builder()
  .withScalaOptimizationEnabled(true)
  .requireClassRegistration(true)
  .withRefTracking(true)
  .build()
```

根据您序列化的对象类型，您可能需要注册一些 Scala 的内部类型：

```scala
fury.register(Class.forName("scala.collection.generic.DefaultSerializationProxy"))
fury.register(Class.forName("scala.Enumeration.Val"))
```

如果要避免此类注册，可以通过禁用类 `FuryBuilder#requireClassRegistration(false)` 来完成。

> 请注意：此选项可以反序列化未知的对象类型，使用更灵活。但如果类包含任何的恶意代码，会有安全风险。

循环引用在 Scala 中很常见，`Reference tracking` 应该由 `FuryBuilder#withRefTracking(true)` 配置选项开启。如果不启用 `Reference tracking`，则在序列化 Scala Enumeration 时，某些 Scala 版本可能会发生 [StackOverflowError 错误](https://github.com/apache/fury/issues/1032)。

> 注意：Fury 实例应该在多个序列化之间共享，创建 Fury 实例开销很大，应该尽量复用。

如果您在多个线程中使用共享的 Fury 实例，您应该使用 `ThreadSafeFury` 代替 `FuryBuilder#buildThreadSafeFury()`。

## 序列化 case 对象

```scala
case class Person(github: String, age: Int, id: Long)
val p = Person("https://github.com/chaokunyang", 18, 1)
println(fury.deserialize(fury.serialize(p)))
println(fury.deserializeJavaObject(fury.serializeJavaObject(p)))
```

## 序列化 pojo

```scala
class Foo(f1: Int, f2: String) {
  override def toString: String = s"Foo($f1, $f2)"
}
println(fury.deserialize(fury.serialize(Foo(1, "chaokunyang"))))
```

## 序列化对象单例

```scala
object singleton {
}
val o1 = fury.deserialize(fury.serialize(singleton))
val o2 = fury.deserialize(fury.serialize(singleton))
println(o1 == o2)
```

## 序列化集合

```scala
val seq = Seq(1,2)
val list = List("a", "b")
val map = Map("a" -> 1, "b" -> 2)
println(fury.deserialize(fury.serialize(seq)))
println(fury.deserialize(fury.serialize(list)))
println(fury.deserialize(fury.serialize(map)))
```

## 序列化元组

```scala
val tuple = Tuple2(100, 10000L)
println(fury.deserialize(fury.serialize(tuple)))
val tuple = Tuple4(100, 10000L, 10000L, "str")
println(fury.deserialize(fury.serialize(tuple)))
```

## 序列化枚举

### Scala3 枚举

```scala
enum Color { case Red, Green, Blue }
println(fury.deserialize(fury.serialize(Color.Green)))
```

### Scala2 枚举

```scala
object ColorEnum extends Enumeration {
  type ColorEnum = Value
  val Red, Green, Blue = Value
}
println(fury.deserialize(fury.serialize(ColorEnum.Green)))
```

## 序列化 Option 类型

```scala
val opt: Option[Long] = Some(100)
println(fury.deserialize(fury.serialize(opt)))
val opt1: Option[Long] = None
println(fury.deserialize(fury.serialize(opt1)))
```

## 性能

 `pojo/bean/case/object` Scala 对 Apache Fury JIT 的支持很好，性能与 Apache Fury Java 一样优异。

Scala 集合和泛型不遵循 Java 集合框架，并且未与当前发行版中的 Apache Fury JIT 完全集成。性能不会像 Java 的 Fury collections 序列化那么好。

scala 集合的执行将调用 Java 序列化 API `writeObject/readObject/writeReplace/readResolve/readObjectNoData/Externalizable` 和 Fury `ObjectStream` 实现。虽然 `org.apache.fury.serializer.ObjectStreamSerializer` 比 JDK `ObjectOutputStream/ObjectInputStream` 快很多，但它仍然不知道如何使用 Scala 集合泛型。

未来我们计划为 Scala 类型提供更多优化，敬请期待，更多信息请参看 [#682](https://github.com/apache/fury/issues/682)！

Scala 集合序列化已在 [#1073](https://github.com/apache/fury/pull/1073) 完成 ，如果您想获得更好的性能，请使用 Apache Fury snapshot 版本。
