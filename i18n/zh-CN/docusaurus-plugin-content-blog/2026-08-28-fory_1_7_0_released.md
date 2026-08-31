---
slug: fory_1_7_0_release
title: Apache Fory 1.7.0 正式发布
description: "Fory 1.7.0 新增 Scala 和 Kotlin 的 JSON 支持，并为 JSON 数组和 NDJSON 流提供增量解码。"
authors: [chaokunyang]
tags: [fory, java, scala, kotlin, swift]
---

Apache Fory 团队很高兴地宣布 1.7.0 版本正式发布。本次发布包含 [26 个 PR](https://github.com/apache/fory/compare/v1.6.1...v1.7.0)。请访问[快速开始](https://fory.apache.org/zh-CN/docs/start/)页面，获取适用于您所用平台的库。

## 亮点

- 新增 Scala 2.13 和 Scala 3 的 Fory JSON 支持。
- 新增 Kotlin 在 Android、JVM 和 GraalVM Native Image 上的 Fory JSON 支持。
- 增强 GraalVM Native Image 上的 Fory JSON，默认启用构建期代码生成，并细化生成编解码器的缓存粒度。
- 新增顶层数组和换行分隔 JSON（NDJSON）的增量流式解码，可从分块 UTF-8 输入中逐步处理值。
- 扩展 Swift 平台支持，新增 visionOS、watchOS、tvOS 和 Linux，并新增 Swift gRPC 代码生成。

## Scala JSON 支持

Fory 1.7.0 为 Scala 2.13 和 Scala 3 引入 `fory-json-scala`。Scala 应用可使用 case class、构造函数默认值、`Option`、`Either`、元组、集合、Map 和值类读写标准 JSON。该模块支持 JVM 和 GraalVM Native Image。

在 sbt 构建中添加 Scala JSON 模块：

```sbt
libraryDependencies += "org.apache.fory" %% "fory-json-scala" % "1.7.0"
```

通过 `ForyJsonScala.builder()` 创建可复用的 `ForyJson` 实例。缺失且有默认值的参数使用 Scala 编译器生成的构造函数默认值，因此不可变 case class 无需提供无参构造函数或可变字段：

```scala
import org.apache.fory.json.scala.ForyJsonScala

case class Person(name: String, age: Int = 18, aliases: List[String] = Nil)

val json = ForyJsonScala.builder().build()
val person = json.fromJson("""{"name":"Ada"}""", classOf[Person])
assert(person == Person("Ada", 18, Nil))

val text = json.toJson(person)
```

Fory JSON 注解可用于 Scala 构造函数属性。Scala 2 的 `Enumeration` 值可通过 `JsonEnumeration` 保留所属枚举，包括集合和 Map 中的枚举值。在 Scala 3 上，`derives ScalaJsonCodec` 支持带参数分支的枚举，并可结合 `JsonSubTypes` 支持由应用声明允许子类型的 sealed 层次结构。

参数化类型应使用完整的 `TypeRef`；Scala 值类型参数可能被擦除时，使用 `ScalaTypeRef`。支持的类型、注解和 Native Image 设置见 [Scala JSON 指南](/zh-CN/docs/json/scala)。

## Kotlin JSON 支持

新的 `fory-json-kotlin` 模块将 Kotlin 模型映射为标准 JSON，同时保留构造函数默认值、可空性、无符号类型、值类和泛型参数。它支持 JVM、Android API 26 及更新版本和 GraalVM Native Image，无需 `kotlin-reflect`。

添加运行时依赖：

```kotlin
dependencies {
  implementation("org.apache.fory:fory-json-kotlin:1.7.0")
}
```

使用 `jsonTypeRef<T>()` 保留根值和嵌套值中的 Kotlin 类型信息。普通 Java 类型令牌无法表达所有 Kotlin 类型区别，例如可空集合元素，或降低为基本类型的值类：

```kotlin
import org.apache.fory.json.kotlin.ForyJsonKotlin
import org.apache.fory.json.kotlin.jsonTypeRef

data class User(
  val id: ULong,
  val name: String,
  val nickname: String? = null,
)

val json = ForyJsonKotlin.builder().build()
val userType = jsonTypeRef<User>()

val user = json.fromJson("""{"id":7,"name":"Alice"}""", userType)
val text = json.toJson(user, userType)
```

成员缺失时，如果构造函数提供默认值，就调用该默认值。显式 JSON `null` 按 Kotlin 声明进行检查，不会请求使用默认值。Fory 会调用模型构造函数，因此初始化和验证逻辑仍会执行。sealed 类和接口可通过 `JsonSubTypes` 声明一组封闭的逻辑子类型名。

在 Android 上，运行时 JSON 代码生成被禁用。使用 R8 或 ProGuard 压缩 Kotlin 模型时，请启用 `fory-json-kotlin-ksp` 处理器，并为应用模型标注 `JsonType`，或为第三方目标声明精确的 `JsonMixin`。对于 Native Image，在可达的 `ForyJsonProvider` 配置中安装 `ForyJsonKotlin`，并确保所需模型和精确泛型绑定在构建时可达。设置方式和支持的配置见 [Kotlin JSON 指南](/zh-CN/docs/json/kotlin)、[Android 指南](/zh-CN/docs/json/android)和 [GraalVM Native Image 指南](/zh-CN/docs/json/graalvm)。

## 增量 JSON 流式解码

Fory JSON 现在可以随着 UTF-8 分块到达，逐步解码顶层数组或 NDJSON 流。应用无需缓存完整文档或等待整个流结束，即可处理每个完整元素或记录。分块通过 `ByteBuffer` 提供，边界可以位于一个 JSON 值的中间。

对于一个顶层 JSON 数组，使用 `newArrayStreamDecoder`。每次 `decodeNext` 成功后，都可通过 `value()` 获取一个已解码元素：

```java
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import org.apache.fory.json.ForyJson;
import org.apache.fory.json.JsonStreamDecoder;

public final class User {
  public long id;
  public String name;
}

ForyJson json = ForyJson.builder().build();
JsonStreamDecoder<User> decoder =
    json.newArrayStreamDecoder(User.class, 1024 * 1024);

ByteBuffer[] chunks = {
  ByteBuffer.wrap("[{\"id\":1,\"name\":\"Ada\"},".getBytes(StandardCharsets.UTF_8)),
  ByteBuffer.wrap("{\"id\":2,\"name\":\"Al".getBytes(StandardCharsets.UTF_8)),
  ByteBuffer.wrap("ice\"}]".getBytes(StandardCharsets.UTF_8))
};

for (ByteBuffer chunk : chunks) {
  while (decoder.decodeNext(chunk)) {
    User user = decoder.value();
    System.out.println(user.id + ": " + user.name);
  }
}
decoder.finish();
```

对于以 LF 或 CRLF 分隔的记录，使用 `newNdjsonStreamDecoder`。输入结束后调用 `finish()`，如果返回 `true`，还需消费其值；这样可以处理没有尾部换行符的最后一条记录。

```java
JsonStreamDecoder<User> decoder =
    json.newNdjsonStreamDecoder(User.class, 1024 * 1024);

ByteBuffer chunk = ByteBuffer.wrap(
    ("{\"id\":1,\"name\":\"Ada\"}\n"
        + "{\"id\":2,\"name\":\"Alice\"}").getBytes(StandardCharsets.UTF_8));
while (decoder.decodeNext(chunk)) {
  User user = decoder.value();
  System.out.println(user.id + ": " + user.name);
}
if (decoder.finish()) {
  User user = decoder.value();
  System.out.println(user.id + ": " + user.name);
}
```

提供下一个分块前，必须消费完当前分块。必需的 `maxValueBytes` 参数限制每个数组元素或每条 NDJSON 记录，而不是整个流。一个解码器只负责一个流，不具备线程安全性，完成或失败后不能复用。缓冲区归属、null 值和字节限制详情见[增量 JSON 流](/zh-CN/docs/json/getting-started#incremental-json-streams)。

## 新功能

- feat(scala): add json support for scala by @chaokunyang in https://github.com/apache/fory/pull/3934
- feat(scala): add scala2 json enumeration annotation by @chaokunyang in https://github.com/apache/fory/pull/3935
- perf(scala): streamline exact List JSON writes by @chaokunyang in https://github.com/apache/fory/pull/3936
- feat(json): add Kotlin JSON support by @chaokunyang in https://github.com/apache/fory/pull/3937
- ci: reduce Android Kotlin setup time by @chaokunyang in https://github.com/apache/fory/pull/3951
- feat: harden deserialization paths by @chaokunyang in https://github.com/apache/fory/pull/3955
- feat(java): add incremental JSON stream decoding by @chaokunyang in https://github.com/apache/fory/pull/3956
- ci: isolate Scala snapshot dependencies by @chaokunyang in https://github.com/apache/fory/pull/3957
- refactor(java): remove unbounded metadata decompression by @chaokunyang in https://github.com/apache/fory/pull/3958
- feat(json): expose stream value limit errors by @chaokunyang in https://github.com/apache/fory/pull/3959
- perf(java): optimize GraalVM JSON interpreted access by @chaokunyang in https://github.com/apache/fory/pull/3960
- perf(json): add ordered field read fast path by @chaokunyang in https://github.com/apache/fory/pull/3962
- feat(java): refactor java generated codec cache granularity by @chaokunyang in https://github.com/apache/fory/pull/3963
- feat(java): parse quoted JSON scalar values by @chaokunyang in https://github.com/apache/fory/pull/3967
- feat(java): add sealed interface json subtypes support by @chaokunyang in https://github.com/apache/fory/pull/3968
- feat(compiler): Add grpc support for Swift by @yash-agarwa-l in https://github.com/apache/fory/pull/3776
- feat(swift): support more platforms by @chaokunyang in https://github.com/apache/fory/pull/3973

## 问题修复

- fix(scala): target Java 8 bytecode for fory-scala by @KarasevRob in https://github.com/apache/fory/pull/3941
- fix(scala): support Enumeration JSON on Scala 3 by @chaokunyang in https://github.com/apache/fory/pull/3952
- ci: stabilize JVM snapshot publishing by @chaokunyang in https://github.com/apache/fory/pull/3953
- fix: fix source release artifact by @chaokunyang in https://github.com/apache/fory/pull/3969

## 其他改进

- chore: Bump org.apache.logging.log4j:log4j-api from 2.25.4 to 2.25.5 in /java/fory-test-core by @dependabot[bot] in https://github.com/apache/fory/pull/3933
- chore: update release version to 1.6.1 by @chaokunyang in https://github.com/apache/fory/pull/3938
- ci: update sbt setup action by @chaokunyang in https://github.com/apache/fory/pull/3939
- chore: upgrade scala dependencies by @pjfanning in https://github.com/apache/fory/pull/3943
- docs: update jackson annotations license by @chaokunyang in https://github.com/apache/fory/pull/3944

## 新贡献者

- @KarasevRob 首次贡献见 https://github.com/apache/fory/pull/3941

**完整变更日志**: https://github.com/apache/fory/compare/v1.6.1...v1.7.0
