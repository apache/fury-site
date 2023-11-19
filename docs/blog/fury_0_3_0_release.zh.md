# Fury v0.3.0 released

作者: [chaokunyang](https://github.com/chaokunyang)

Fury 0.3.0版本是一个新的大版本发布，该版本主要全面支持了任意Scala2/3对象序列化，基于FURY的序列化协议提供更小的序列化体积；通过Fury的JIT框架提供高性能。一直以来，业界对于Scala对象序列化都没有良好的解决方案，虽然JDK原生序列化能够序列化任意Scala对象，但是其性能缓慢，序列化体积膨胀，无法满足很多场景的需求。尽管业界有推特开源的[chill](https://github.com/twitter/chill)这样的序列化框架，但其性能不足，序列化体积仍然较大。随着Fury 0.3.0版本的发布，现在用户可以同时获得高压缩比和高性能。
> Fury scala还在快速优化当中，本次发布版本只对Case/Pojo/singleton等对象进行了JIT优化。对于scala.collection序列化，目前主干分支已经完成优化，未包含在本次发布里面。如果需要使用Fury JIT优化的scala[集合序列化](https://github.com/alipay/fury/pull/1073)，请使用main分支最新版本。

# Scala使用示例
## 安装依赖
```sbt
libraryDependencies += "org.furyio" % "fury-core" % "0.3.0"
```
## 创建Fury
```scala
val fury = Fury.builder()
  .withScalaOptimizationEnabled(true)
  // 最好关闭该开关，提前注册类型
  .requireClassRegistration(false)
  .withRefTracking(true)
  .build()
// 多线程环境需要创建FuryBuilder#buildThreadSafeFury()
```
## 序列化case对象
```scala
case class Person(github: String, age: Int, id: Long)
val p = Person("https://github.com/chaokunyang", 18, 1)
println(fury.deserialize(fury.serialize(p)))
println(fury.deserializeJavaObject(fury.serializeJavaObject(p)))
```
## 序列化pojo
```scala
class Foo(f1: Int, f2: String) {
  override def toString: String = s"Foo($f1, $f2)"
}
println(fury.deserialize(fury.serialize(Foo(1, "chaokunyang"))))
```
## 序列化object singleton
```scala
object singleton {
}
val o1 = fury.deserialize(fury.serialize(singleton))
val o2 = fury.deserialize(fury.serialize(singleton))
println(o1 == o2)
```
## 序列化collection
```scala
val seq = Seq(1,2)
val list = List("a", "b")
val map = Map("a" -> 1, "b" -> 2)
println(fury.deserialize(fury.serialize(seq)))
println(fury.deserialize(fury.serialize(list)))
println(fury.deserialize(fury.serialize(map)))
```
## 序列化枚举
序列化scala3枚举
```scala
enum Color { case Red, Green, Blue }
println(fury.deserialize(fury.serialize(Color.Green)))
```
序列化scala2枚举
```scala
object ColorEnum extends Enumeration {
  type ColorEnum = Value
  val Red, Green, Blue = Value
}
println(fury.deserialize(fury.serialize(ColorEnum.Green)))
```
## 序列化Option
```scala
val opt: Option[Long] = Some(100)
println(fury.deserialize(fury.serialize(opt)))
val opt1: Option[Long] = None
println(fury.deserialize(fury.serialize(opt1)))
```
# Highlight

- [Scala] 支持任意scala对象序列化，包括case/object/tuple/string/collection/enum/basic 等
- [Scala] 增加fury scala 序列化用户文档：[https://github.com/alipay/fury/blob/main/docs/guide/scala_guide.md](https://github.com/alipay/fury/blob/main/docs/guide/scala_guide.md) 
- [Scala] 实现优化的scala object singleton序列化
- [Java] java.io.Externalizable与 writeReplace/readResolve 保持兼容
- [Java] dubbo 官方集成Fury序列化：[apache/dubbo-spi-extensions#226](https://github.com/apache/dubbo-spi-extensions/pull/226)
- [Java] 支持JDK17 runtime的JDK8 字符串序列化
# Bug修复

- [Java] 支持 InputStream 返回小于指定数量的bytes
- [Java] 使用 ReflectionUtils.getCtrHandle() 用于 ExternalizableSerializer 的构造函数调用，避免反射访问权限问题
- [Java] 修复writeReplace/readResolve的继承问题，支持识别父类的writeReplace/readResolve
# 变更记录

- [Impove][Doc] 优化README文档 by [@caicancai](https://github.com/caicancai) in [#1011](https://github.com/alipay/fury/pull/1011) [#1020](https://github.com/alipay/fury/pull/1020) [#1022](https://github.com/alipay/fury/pull/1022)
- [Java] 重命名遗留的 ascii 到 latin by [@chaokunyang](https://github.com/chaokunyang) in [#1013](https://github.com/alipay/fury/pull/1013)
- [Doc] 更新 go 安装文档 by [@chaokunyang](https://github.com/chaokunyang) in [#1015](https://github.com/alipay/fury/pull/1015)
- fix(grammatical): 修复文档typos和改进文档语法错误 by [@iamahens](https://github.com/iamahens) in [#1018](https://github.com/alipay/fury/pull/1018)
- chore(docs): 修复文档typos by [@Smoothieewastaken](https://github.com/Smoothieewastaken) in [#1023](https://github.com/alipay/fury/pull/1023)
- [JavaScript] 修复对象包含binary字段时读取 buffer 错误[@wangweipeng2](https://github.com/wangweipeng2) in [#1026](https://github.com/alipay/fury/pull/1026)
- [Doc] 优化类注册文档 by [@chaokunyang](https://github.com/chaokunyang) in [#1027](https://github.com/alipay/fury/pull/1027)
- [Java] 修复writeReplace/readResolve的继承问题，支持识别父类的writeReplace/readResolve by [@chaokunyang](https://github.com/chaokunyang) in [#1030](https://github.com/alipay/fury/pull/1030)
- [Doc] 增加Scala用户文档 by [@chaokunyang](https://github.com/chaokunyang) in [#1028](https://github.com/alipay/fury/pull/1028) [#1031](https://github.com/alipay/fury/pull/1031)
- [Doc] refine scala doc by [@chaokunyang](https://github.com/chaokunyang) in 
- [Doc]  修复 README 语法错误 by [@ayushrakesh](https://github.com/ayushrakesh) in [#1037](https://github.com/alipay/fury/pull/1037)
- [Java] 支持scala 局部静态类 JIT序列化 by [@chaokunyang](https://github.com/chaokunyang) in [#1036](https://github.com/alipay/fury/pull/1036)
- [Java] 支持JDK17 runtime的JDK8 字符串序列化 by [@chaokunyang](https://github.com/chaokunyang) in [#1039](https://github.com/alipay/fury/pull/1039)  [#1042](https://github.com/alipay/fury/pull/1042)
- [Java] 设置JITContextTest超时 by [@chaokunyang](https://github.com/chaokunyang) in [#1040](https://github.com/alipay/fury/pull/1040)
- [Doc] 添加默认 reviewers by [@chaokunyang](https://github.com/chaokunyang) in [#1043](https://github.com/alipay/fury/pull/1043)
- [Java] 支持 InputStream 返回小于指定数量的bytes by [@knutwannheden](https://github.com/knutwannheden) in [#1034](https://github.com/alipay/fury/pull/1034)
- [Java] 使用 ReflectionUtils.getCtrHandle() 用于 ExternalizableSerializer 的构造函数调用，避免反射访问权限问题 by [@knutwannheden](https://github.com/knutwannheden) in [#1044](https://github.com/alipay/fury/pull/1044)
- [Doc] 文档改进 by [@Shivam250702](https://github.com/Shivam250702) in [#1047](https://github.com/alipay/fury/pull/1047)
- [Java] java.io.Externalizable与 writeReplace/readResolve 保持兼容 by [@chaokunyang](https://github.com/chaokunyang) in [#1048](https://github.com/alipay/fury/pull/1048)
- [Doc] 文档改进 by [@Spyrosigma](https://github.com/Spyrosigma) in [#1051](https://github.com/alipay/fury/pull/1051)
- [Doc] 修复语法错误 in CODE_OF_CONDUCT.md by [@HimanshuMahto](https://github.com/HimanshuMahto) in [#1050](https://github.com/alipay/fury/pull/1050)
- [Doc] 更新 scala 文档链接标题 by [@chaokunyang](https://github.com/chaokunyang) in [#1052](https://github.com/alipay/fury/pull/1052)
- [Doc] 优化scala文档 by [@chaokunyang](https://github.com/chaokunyang) in [#1041](https://github.com/alipay/fury/pull/1041)
- [Java] 使用ref tracking消息填充 StackOverflowError by [@chaokunyang](https://github.com/chaokunyang) in [#1049](https://github.com/alipay/fury/pull/1049)
- [Scala] 建立 scala project by [@chaokunyang](https://github.com/chaokunyang) in [#1054](https://github.com/alipay/fury/pull/1054)
- [Scala] 增加 scala singleton object 序列化器 by [@chaokunyang](https://github.com/chaokunyang) in [#1053](https://github.com/alipay/fury/pull/1053)
- [Doc] 文档改进 by [@vidhijain27](https://github.com/vidhijain27) in [#1056](https://github.com/alipay/fury/pull/1056)
- [Scala] 增加scala tuple序列化测试 by [@chaokunyang](https://github.com/chaokunyang) in [#1059](https://github.com/alipay/fury/pull/1059)
- [Java] 修复空的 ListExpression#genCode NPE异常 by [@farmerworking](https://github.com/farmerworking) in [#1063](https://github.com/alipay/fury/pull/1063)
# 新增贡献者
本次发布新增如下贡献者，感谢他们对Fury项目的贡献，期待后续进一步的合作：

- [@iamahens](https://github.com/iamahens) 在 [#1018](https://github.com/alipay/fury/pull/1018) 提交第一个PR
- [@Smoothieewastaken](https://github.com/Smoothieewastaken) 在 [#1023](https://github.com/alipay/fury/pull/1023) 提交第一个PR
- [@ayushrakesh](https://github.com/ayushrakesh) 在 [#1037](https://github.com/alipay/fury/pull/1037) 提交第一个PR
- [@knutwannheden](https://github.com/knutwannheden) 在 [#1034](https://github.com/alipay/fury/pull/1034) 提交第一个PR
- [@Shivam250702](https://github.com/Shivam250702) 在 [#1047](https://github.com/alipay/fury/pull/1047) 提交第一个PR
- [@Spyrosigma](https://github.com/Spyrosigma) 在 [#1051](https://github.com/alipay/fury/pull/1051) 提交第一个PR
- [@HimanshuMahto](https://github.com/HimanshuMahto) 在 [#1050](https://github.com/alipay/fury/pull/1050) 提交第一个PR
- [@vidhijain27](https://github.com/vidhijain27) 在 [#1056](https://github.com/alipay/fury/pull/1056) 提交第一个PR
- [@farmerworking](https://github.com/farmerworking) 在 [#1063](https://github.com/alipay/fury/pull/1063) 提交第一个PR

**完整变更记录**: [v0.2.1...v0.3.0](https://github.com/alipay/fury/compare/v0.2.1...v0.3.0)
