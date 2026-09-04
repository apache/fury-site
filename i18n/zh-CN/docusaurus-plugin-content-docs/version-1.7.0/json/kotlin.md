---
title: Kotlin
sidebar_position: 8
id: kotlin
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

Fory JSON Kotlin 将 Kotlin/JVM 类型映射为普通 JSON，同时保留 Kotlin 构造函数默认值、可空性、值类型和泛型参数。它是基于 Fory JSON 的可选模块，不会改变 Fory 的二进制协议。

## 安装 {#installation}

运行时接受 Kotlin 严格元数据读取器所支持的模型元数据，并使用 Kotlin 2.3.20 构建。所有模块应使用相同的 Fory 版本：

```kotlin title="build.gradle.kts"
plugins {
  kotlin("jvm") version "2.3.20"
}

repositories {
  maven("https://repository.apache.org/snapshots/") {
    mavenContent { snapshotsOnly() }
  }
  mavenCentral()
}

dependencies {
  implementation("org.apache.fory:fory-json-kotlin:1.7.1")
}
```

Kotlin 模块不需要 `kotlin-reflect`。在 Android 上，启用 R8 或 ProGuard 时，或 Kotlin 源码中的 Mixin 为 Java sealed 目标添加推导式 `JsonSubTypes` 时，请添加 Kotlin Symbol Processing（KSP）：

```kotlin title="build.gradle.kts"
plugins {
  id("com.google.devtools.ksp") version "2.3.8"
}

dependencies {
  ksp("org.apache.fory:fory-json-kotlin-ksp:1.7.1")
}
```

请为每个需要在代码压缩时精确保留的 Kotlin 源码模型标注 `@JsonType`。对于第三方目标，应在应用源码中声明精确的 `@JsonMixin`。当 Mixin 或其精确目标之一为 Kotlin 时，使用 Kotlin KSP。如果 Kotlin 源码中的 Mixin 为 Java sealed 目标添加推导式 `JsonSubTypes`，还需启用 `fory-annotation-processor`，并在 JDK 17 或更新版本上编译。

## 快速上手 {#quick-start}

使用 `ForyJsonKotlin.builder()` 安装 Kotlin 模块。对于需要保留可空性、无符号类型身份、值类身份或泛型参数的每个 Kotlin 声明根类型，请保留一个 `jsonTypeRef<T>()`：

```kotlin
import org.apache.fory.json.kotlin.ForyJsonKotlin
import org.apache.fory.json.kotlin.jsonTypeRef

data class Account(
  val id: ULong,
  val name: String,
  val nickname: String? = null,
)

val json = ForyJsonKotlin.builder().build()
val accountType = jsonTypeRef<Account>()

val text = json.toJson(Account(7u, "Alice"), accountType)
val decoded = json.fromJson(text, accountType)
```

当有符号 `Long` 和无符号 `ULong` 值需要以带引号的十进制字符串输出时，请使用
`ForyJsonKotlin.builder().writeLongAsString(true)`。该设置还适用于声明的 collection 和 Map 值、
可空值、以这些类型为底层值的 Kotlin 值类、`ULongArray`，以及核心 JSON 运行时支持的 Java Long
类包装器。Reader 同时接受带引号和不带引号的整数 token。

`jsonTypeRef<T>()` 是类型令牌，不是编解码器查找操作。应创建一次并复用。Java `Class` 或普通 Java `TypeRef` 无法表达 `List<Account?>`、`UInt` 或降低为基本类型载体的逻辑值类等区别。

也可以通过 builder 显式安装模块：

```kotlin
import org.apache.fory.json.ForyJson
import org.apache.fory.json.kotlin.ForyJsonKotlin

val json = ForyJson.builder().withModule(ForyJsonKotlin).build()
```

不会按类路径自动安装模块，也没有 Kotlin 专用的编码/解码别名。

## 不可变类与编译器默认值 {#immutable-classes-and-compiler-defaults}

普通类或 data class 映射为具有命名属性的 JSON 对象。Fory 选择一个有效的公共 Kotlin 构造函数以及可重建的属性；`copy` 和 `componentN` 函数不参与定义 Schema。只有 JSON 成员缺失时，才使用编译器生成的默认值：

```kotlin
data class Request(
  val id: Long,
  val label: String? = "new",
  val retries: Int = 3,
)
```

主构造函数会被自动选择。公共次构造函数或目标类型自身的公共静态工厂，只有经 `JsonCreator` 显式选择后才会使用；伴生对象工厂必须通过外层类中实际存在的 `@JvmStatic` 桥接方法才符合条件。`@JvmOverloads` 生成的方法不是独立 creator 候选，选定的静态工厂也不能含编译器默认参数。私有/受保护、可变参数、方法泛型、上下文参数、局部类、匿名类、`inner` 类或合成构造路径需要精确的应用编解码器。

对于这个模型：

- `{"id":1}` 会调用两个编译器默认值。
- `{"id":1,"label":null}` 会传入显式 null，不调用 `label` 的默认值。
- 缺少 `id` 会在调用构造函数前失败。
- `{"id":1,"retries":null}` 会失败；null 不会要求 Kotlin 使用默认值。

普通类体 `var` 属性在成员缺失时保留初始化值，在成员存在时于构造后赋值。`lateinit` 属性是必需的。自动 creator 属性和延后赋值属性都必须能在读写两个方向重建。

类体 `val`、计算属性、委托属性、仅 getter 的属性和委托 `var` 必须被忽略，或由精确的自定义编解码器处理。输入中存在的延后赋值 setter 在构造后按固定属性顺序执行，随后运行验证器；输入成员顺序不能决定应用调用顺序。Kotlin 类实例始终通过正常构造创建，因此不会绕过主构造函数初始化和验证。

Fory 必须能在相同配置下读取自身输出。因此，可空构造函数参数和可空延后赋值属性在为 null 时会显式输出，即使 builder 的 Java 通用默认行为是省略 null 字段。如果省略属性可能导致失败或调用不同的编译器默认值，则会拒绝该属性上显式设置的 `JsonProperty.Include.NON_NULL`。

## 可空性 {#nullability}

Kotlin 类型使用位置的可空性在根值、属性、容器元素、Map 值和泛型子类型上均会被检查：

| 声明 | 成员缺失 | 显式 JSON `null` |
| --------------------------------- | --------------------- | ---------- |
| `val value: String` | 失败 | 失败 |
| `val value: String?` | 失败 | 传入 null |
| `val value: String = expression` | 求值默认值 | 失败 |
| `val value: String? = expression` | 求值默认值 | 传入 null |

`List<String?>` 接受 null 元素，`List<String>` 拒绝 null 元素。Map 键必须非空。自动构造 Kotlin 模型时，不会猜测平台类型或未知的可空性。

透明包装类型必须让 null 只有一种明确含义。例如，非空 `Optional<T>` 用 JSON null 表示 `Optional.empty()`，因此会拒绝 `Optional<T>?` 和 `Optional<T?>`。`AtomicReference<T>` 和值类遵循相同的一一映射规则。若两个逻辑状态会共享 JSON null，应使用带标签的精确自定义编解码器。

通过注册或 `@JsonCodec` 选择的应用编解码器仍属于受信任的应用代码。对于非 null JSON token，它必须返回精确的声明类型，并遵守 Kotlin 类型使用位置的可空性。

## 注解与使用位置 {#annotations-and-use-site-targets}

Kotlin 注解参与与 Java 相同的逻辑属性合并。建议显式指定注解使用位置：

```kotlin
import org.apache.fory.json.annotation.JsonCodec
import org.apache.fory.json.annotation.JsonIgnore
import org.apache.fory.json.annotation.JsonProperty
import org.apache.fory.json.annotation.JsonType

@JsonType
data class Profile(
  @param:JsonProperty("user_id")
  val id: Long,

  @field:JsonIgnore
  val localCacheKey: String? = null,

  @field:JsonProperty(include = JsonProperty.Include.ALWAYS)
  val nickname: String? = null,

  @field:JsonCodec(elementCodec = AccountIdCodec::class)
  val accountIds: List<AccountId>,
)
```

请如上所示显式指定 JVM 使用位置，避免依赖 Kotlin 的默认目标策略。完整的目标支持与冲突规则见[注解](annotations.md#kotlin-use-site-targets)，完整值、元素、内容、键和 Map 值编解码器见[自定义编解码器](custom-codecs.md)。

## 泛型与集合 {#generics-and-collections}

使用完整的声明类型：

```kotlin
import org.apache.fory.json.kotlin.jsonTypeRef

val accountsType = jsonTypeRef<List<Account?>>()
val accounts = json.fromJson("""[null,{"id":7,"name":"Alice"}]""", accountsType)
```

Kotlin 原始字符串可以直接传给 `fromJson`，JSON 双引号无需反斜杠转义。

按类型重建时，会拒绝原始泛型类型、`in` 投影和星投影。`out X` 投影只有在可规范化为一个精确、final 或封闭的可读 Schema 时才被接受。递归返回同一个精确绑定时支持递归泛型模型；如果正在处理的原始声明展开为不同绑定，则会被拒绝。

Kotlin 只读和可变集合接口使用常规 JSON 集合/Map 行为。只读并不等于不可变：标准接口会实例化为 `ArrayList`、`LinkedHashSet` 或 `LinkedHashMap`。应声明公共接口，而不是 JDK/Kotlin 私有的空集合、单例、不可修改集合或 builder 实现类。`Iterable`、`Sequence`、迭代器、`EnumEntries` 和直接声明的 `Map.Entry` 不是自动值 Schema。

无符号类型以及符合条件的非空值类作为 Map 键时，通过常规 Map 编解码器使用 JSON 对象成员名。值类键链必须最终落到 String、枚举、有符号整数或无符号整数语义。浮点、Boolean、可空和任意对象键需要显式键编解码器或完整 Map 编解码器。

## 值类、对象与封闭层次结构 {#value-classes-objects-and-closed-hierarchies}

用户值类采用其底层值的透明 JSON 表示：

```kotlin
import org.apache.fory.json.kotlin.jsonTypeRef

@JvmInline
value class AccountId(val value: ULong)

val idType = jsonTypeRef<AccountId>()
val id = json.fromJson("18446744073709551615", idType)
```

Fory 执行经过验证的编译器构造操作，因此值类初始化检查仍会运行。如果外层值和底层值都可为空，则透明 JSON 存在歧义，自动映射会被拒绝。此时应使用带标签的精确编解码器。

无状态 `object` 或 `data object` 使用严格的 `{}`，并返回规范单例。有状态对象和伴生对象需要精确的自定义编解码器。`Unit` 也使用 `{}`；`Nothing` 被拒绝，而 `Nothing?` 只能通过显式 Kotlin 类型令牌接受 JSON null。

为 sealed 类或接口标注 `JsonSubTypes`，并将 `value` 留空，即可推导其封闭层次结构。Fory 递归纳入具体 sealed 后代，在每个具体 open 类处停止，仅允许该精确类而不允许其后代。开放抽象分支会被拒绝。推导出的逻辑名称使用源码简单名称，包括不带尾部 `$` 的对象名。非空 `value` 仍表示精确的显式子集。输入只包含逻辑子类型名，不包含 JVM 类名。属性与包装表示见[注解](annotations.md#jsonsubtypes)。

## 支持的 Kotlin 类型 {#supported-kotlin-types}

从 Kotlin 使用 Java/JDK 标量、时间类型、Optional、原子类型、数组、集合、Map、枚举和 JSON 树类型时，它们保持常规 Fory JSON 表示：

| 核心类型类别 | Kotlin 中的行为 |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Any` / `Any?` | 自然 JSON Boolean、数字、String、数组、对象或 null；写入时按运行时类型动态分派 |
| 有符号标量及装箱类型 | `Boolean`、`Byte`、`Short`、`Int`、`Long`、`Float`、`Double`、`Char` 和 `Number` 使用核心标量编解码器；非有限浮点值使用核心的带引号表示 |
| 文本 | `String`、精确 `CharSequence`、`StringBuilder` 和 `StringBuffer` 使用字符串表示 |
| 任意精度/低精度数值 | `BigInteger`、`BigDecimal`、Fory `Float16` 和 `BFloat16` 使用核心数值表示与限制 |
| 枚举 | 带引号的枚举常量名 |
| Java/Kotlin 数组 | 除 `ByteArray` 默认使用 Base64 字符串外，均为普通 JSON 数组；`@field:JsonByteArray(JsonByteArray.Format.ARRAY)` 可选择数字数组；无符号语义数组见下文 |
| Optional 与原子类 | `Optional<T>`、基本类型 Optional、原子标量/引用和原子数组保持核心透明表示，并受上述可空性规则约束 |
| 带引号的 JDK 值 | `Currency`、`File`、`URI`、`Path`、`Pattern`、`UUID`、`Locale`、`Charset` 和 `TimeZone` 保持核心字符串表示 |
| 旧版日期/时间 | `Date`、`Calendar` 及可用的 `java.sql.Date`、`Time` 和 `Timestamp` 保持自 Unix 纪元起的毫秒数表示 |
| Java 时间类型 | `LocalDate`、`LocalTime`、`LocalDateTime`、`Instant`、`java.time.Duration`、`ZoneOffset`、`ZoneId`、`ZonedDateTime`、`Year`、`YearMonth`、`MonthDay`、`Period`、`OffsetTime`、`OffsetDateTime` 和受支持的历法日期保持核心精确文本语法 |
| 其他核心值 | `BitSet`、`ByteBuffer`、`JsonArray` 和 `JsonObject` 保持常规核心表示 |
| 集合/Map | 受支持的 Java/Kotlin `Collection`、`Map` 接口和实现使用核心数组/对象表示；受支持的 Guava 不可变载体仍为可选依赖 |
| Map 键 | String、枚举、有符号 `Byte`/`Short`/`Int`/`Long`，以及下文补充的 Kotlin 无符号类型/值类；Boolean、浮点、可空和任意对象键需要显式键编解码器或完整 Map 编解码器 |
| 固定拒绝的类型 | 仍拒绝 `Class`、URL/网络/socket/地址类型、不支持的 JDK 内部集合实现，以及未注册的 `Number`/`CharSequence` 子类；应用可在常规类型和安全检查允许的范围内显式定义自有表示 |

核心表示详情见[对象映射](object-mapping.md#supported-java-types)。Kotlin 特有行为如下：

| 类型类别 | 自动 JSON 表示或处理方式 |
| ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| 普通类、data class 和嵌套类 | 具有命名属性的 JSON 对象 |
| `inner` 类、普通抽象类/接口 | 仅支持封闭的 `JsonSubTypes` 或精确自定义编解码器 |
| sealed 类/接口 | 推导或显式声明的封闭 `JsonSubTypes` 表 |
| 枚举 | 带引号的枚举名 |
| 无状态 `object`、`data object`、`Unit` | 严格的 `{}` |
| 有状态对象、伴生对象 | 仅支持精确自定义编解码器 |
| 值类 | 透明的底层值；需要精确绑定 |
| `Nothing?` / `Nothing` | 仅允许 null / 拒绝 |
| `Pair`、`Triple` | 具有 `first`、`second` 和 `third` 命名属性的对象 |
| `Result`、`Lazy`、Kotlin 标准属性委托 | 仅支持精确自定义编解码器 |
| 有符号基本类型、基本类型数组、`Array<T>` | 常规核心数字/Boolean/字符与数组表示 |
| `UByte`、`UShort`、`UInt`、`ULong` 及其数组 | 无符号十进制数字和数组 |
| 只读与可变集合/Map、Kotlin `ArrayDeque` | 常规核心数组/Map |
| `Map.Entry`、私有集合载体、`Iterable`、`Sequence`、迭代器、`EnumEntries` | 自动映射时拒绝 |
| `CharRange`、有符号/无符号整数区间 | `{"start":...,"endInclusive":...}` |
| 对应的步进序列 | `{"first":...,"last":...,"step":...}` |
| `ClosedRange`、`OpenEndRange`、抽象/开放/浮点区间 | 自动映射时拒绝 |
| `kotlin.time.Duration` | 带引号的规范 Kotlin ISO 时长 |
| `kotlin.time.Instant` | 带引号的规范 Kotlin ISO 时刻 |
| `TimedValue<T>` | `{"value":...,"duration":...}` |
| `DurationUnit`、`RegexOption` | 带引号的枚举名 |
| 时钟、时间源/时间标记、Regex/匹配状态、Random | 仅支持精确自定义编解码器 |
| `kotlin.uuid.Uuid` | 带引号的规范连字符 UUID |
| 完整泛型类 / 声明处型变 | 精确替换后的 Schema |
| `out X` / `in X` / 星投影 | 仅允许精确 final 或封闭的 `X` / 拒绝 / 拒绝 |
| 递归泛型 | 仅允许相同的精确递归绑定；正在处理时展开到另一绑定会被拒绝 |
| 类型别名 | 完全展开后的类型 |
| 函数/挂起函数、反射类型、协程/flow/channel 状态 | 拒绝 |
| 符合条件的第三方不可变 Kotlin 模型 | 在 JVM 上自动映射；应用注解覆盖时需注册精确 Mixin |

时间和 UUID API 的 Kotlin 实验性 opt-in 要求仍适用于应用源码。Fory 制品支持的编译器和元数据范围，并不意味着实验性 Kotlin API 获得跨 Kotlin 版本的兼容保证。

## 安全 {#security}

`jsonTypeRef<T>()`、注解、Mixin 和编解码器注册都是应用声明的 Schema。JSON 输入不能选择任意类、构造函数、编译器默认值、对象、伴生对象、模块、编解码器或可调用对象。sealed 层次结构仅接受其经过验证的推导或显式 `@JsonSubTypes` 表中的逻辑子类型名称。

Kotlin 数组、集合、Map 和对象使用与核心 JSON 运行时相同的 `maxDepth`、对象图内存、输入缓冲区、字段名缓存和类型检查器控制。没有 Kotlin 专有的集合或工作区限制需要配置。模型构造函数、编译器默认值、验证器和自定义编解码器仍属于可信应用代码，可能执行由应用定义的内存分配或产生副作用。

解码不可信输入前，请阅读[安全](security.md)。

## GraalVM 与 Android {#graalvm-and-android}

在 GraalVM Native Image 上，使用现有 `@ForyJsonProvider` 流程，安装 `ForyJsonKotlin`，并在返回的配置中启用代码生成。为每个可达具体 Kotlin 模型标注 `@JsonType`，或为第三方目标注册精确且可达的 Mixin。未被选中生成代码的模型继续使用解释执行映射。仅支持通过具体根类型可达的精确泛型绑定。不要添加反射配置或包级 opens。

在 Android 上，请使用 API 26 或更新版本。运行时 JSON 代码生成保持禁用。未压缩构建中的 Kotlin sealed 推导无需额外设置。使用 R8 或 ProGuard 时，或 Kotlin 源码中的 Mixin 为 Java sealed 目标添加推导式 `JsonSubTypes` 时，请启用 KSP。后一种情况还需要 `fory-annotation-processor` 和 JDK 17 或更新版本。启用代码压缩时，请遵循上面的[安装](#installation)说明和 [Android 指南](android.md)。

此 JVM 模块不支持 Kotlin/Native、Kotlin/JS 或 Kotlin/Wasm。

完整平台设置见 [GraalVM Native Image](graalvm.md) 和 [Android](android.md)。

## 故障排查 {#troubleshooting}

Kotlin 元数据、可空性、泛型绑定、Android 代码压缩、Native Image、语法、限制、自定义编解码器、子类型和根操作失败的排查方法见[故障排查](troubleshooting.md)。

比较 Fory JSON Kotlin、kotlinx.serialization、Moshi 和 Jackson Kotlin 所用的测试负载与设置，见 [Kotlin JSON 基准测试](../benchmarks/json/kotlin/README.md)。
