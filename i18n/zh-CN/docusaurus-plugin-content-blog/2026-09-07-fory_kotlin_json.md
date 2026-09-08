---
slug: fory_kotlin_json
title: "Apache Fory™ JSON：面向 Kotlin 的高性能 JSON 序列化"
description: "Apache Fory JSON 为 Kotlin/JVM 数据类、值类和 sealed 层次结构提供高性能序列化，保留构造函数默认值与可空性。"
authors: [chaokunyang]
tags: [fory, kotlin, java, json, serialization, performance]
---

**摘要**：Apache Fory JSON 为 Kotlin/JVM 提供高性能 JSON 序列化，支持数据类、值类和 sealed 层次结构，并保留构造函数默认值与可空性。在涵盖小消息和大文档的基准测试中，Fory 的吞吐量高于 kotlinx.serialization、Moshi 和 Jackson Kotlin。

<img src="/img/fory-logo-light.png" width="50%"/>

## Kotlin 应用中的 JSON 序列化 {#kotlin-models-as-json-contracts}

Kotlin 应用通过 HTTP API、消息队列和存储的文档交换 JSON，而应用代码使用具有明确类型的模型，因此每次交换都涉及 JSON 与 Kotlin 对象之间的转换。读取文档时，需要用正确的参数构造对象，并执行初始化逻辑；写入时，则需要保留还原对象所需的值。

这些转换也会消耗 CPU 并产生临时内存分配，在处理大量消息或大文档的服务中尤其值得关注。Apache Fory JSON 将 Kotlin 对象映射与高性能 JSON 引擎结合起来：Kotlin 层遵循模型的类型和构造规则，引擎负责 JSON 解析与输出。String 和直接 UTF-8 API 均使用这套映射。

## 快速开始 {#getting-started}

在现有 Kotlin/JVM 项目中添加 Maven Central 上的模块，并确保所有 Fory 依赖使用相同版本：

```kotlin title="build.gradle.kts"
dependencies {
  implementation("org.apache.fory:fory-json-kotlin:1.7.1")
}
```

创建运行时和模型的类型令牌。运行时是线程安全的；应保留这两个对象以便重复使用：

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

fun main() {
  val input = Account(7uL, "Alice")
  val text = json.toJson(input, accountType)
  val utf8 = json.toJsonBytes(input, accountType)

  check(json.fromJson(text, accountType) == input)
  check(json.fromJson(utf8, accountType) == input)
}
```

在标准 JVM 上，这个示例不需要模型注解或序列化编译器插件。`ForyJsonKotlin.builder()` 安装 Kotlin 模块，`jsonTypeRef<T>()` 描述要序列化或反序列化的类型，包括泛型参数和可空性。例如，列表允许包含 null 元素时使用 `jsonTypeRef<List<Account?>>()`，每个元素都必须是账户时则使用 `jsonTypeRef<List<Account>>()`。

字节 API 直接读写 UTF-8。当 HTTP 客户端、消息传输或存储 API 已经使用字节交换数据时，可以避免将完整文档转换为中间 String。

## 构造函数默认值与可空性 {#constructor-defaults-and-nullability}

下面的请求模型有一个必需参数和两个带默认值的参数：

```kotlin
data class Request(
  val id: Long,
  val label: String? = "new",
  val retries: Int = 3,
)
```

Fory 自动选择主构造函数。成员缺失且存在默认值时，会使用编译器提供的默认值逻辑；对于显式 JSON null，则根据参数的可空性进行检查：

| JSON 输入 | 结果 |
| --- | --- |
| `{"id":1}` | `Request(1, "new", 3)` |
| `{"id":1,"label":null}` | `Request(1, null, 3)` |
| `{"label":"ready"}` | 拒绝：缺少必需参数 `id` |
| `{"id":1,"retries":null}` | 拒绝：`retries` 不可空 |

可空性与默认值相互独立：没有默认值的可空参数仍要求 JSON 中存在对应成员。默认值仍是可执行的 Kotlin 表达式，在构造对象需要它时求值。初始化块和构造函数中的校验逻辑也会正常执行。

这一差异同样影响序列化。如果 `label` 为 null，省略该成员会使读取方恢复出 `"new"`。因此，对于值为 null 的可空构造函数属性，Fory 会显式写出 null，使其在相同配置下往返转换后保留原值。

可空性检查会延伸到容器元素和嵌套泛型模型。关于次构造函数、显式创建器和类体中声明的属性，请参阅 [Kotlin 指南](/docs/json/kotlin#immutable-classes-and-compiler-defaults)。

## 值类与无符号类型 {#preserving-domain-types}

值类可以在应用代码中区分不同的领域标识符，同时在 JSON 中保留标量表示。使用前面创建的运行时：

```kotlin
@JvmInline
value class AccountId(val value: ULong) {
  init {
    require(value > 0uL)
  }
}

val idType = jsonTypeRef<AccountId>()
val text = json.toJson(AccountId(42uL), idType) // 42
val restored = json.fromJson(text, idType)
```

Fory 通过包含校验逻辑的构造操作重建 `AccountId`，因此 `require` 检查仍会执行。即使 JVM 将值类表示为基本类型，类型令牌也会保留其值类身份。

无符号整数保留其十进制表示，包括完整的 `ULong` 范围。如果 API 要求将 64 位整数表示为 JSON 字符串，可以通过 `ForyJsonKotlin.builder().writeLongAsString(true)` 创建运行时。该设置适用于 `Long` 和 `ULong`，也包括受支持的容器和值类；读取器同时接受带引号和不带引号的整数。

透明映射要求 null 的表示没有歧义。如果值类本身可空，且底层值也可空，两个不同状态就会对应同一个 JSON null，因此这种情况需要使用带标签的自定义编解码器。其他 Kotlin 类型及其表示方式见[类型支持表](/docs/json/kotlin#supported-kotlin-types)。

## sealed 层次结构与注解 {#sealed-types-and-json-annotations}

在 sealed 基类型上标注 `JsonSubTypes`，Fory 即可根据 Kotlin 元数据推导出具体子类型：

```kotlin
import org.apache.fory.json.annotation.JsonSubTypes

@JsonSubTypes(property = "kind")
sealed interface Payment

data class CardPayment(val lastFour: String) : Payment
data class BankTransfer(val account: String) : Payment

val paymentType = jsonTypeRef<Payment>()
val text = json.toJson(CardPayment("4242"), paymentType)
// {"kind":"CardPayment","lastFour":"4242"}
val decoded = json.fromJson(text, paymentType)
```

声明类型 `Payment` 决定使用哪个子类型表。`kind` 成员包含子类型的逻辑名称，未知名称会被拒绝；输入不能指定任意 JVM 类。自动推导的名称取自源码类名。如果编码格式中的名称需要在源码重命名后保持稳定，应显式声明子类型表。相同的映射也适用于 `jsonTypeRef<List<Payment>>()`。

Kotlin 属性也可以使用 Fory 共用的 JSON 注解。显式指定注解目标，可以确定哪个 JVM 元素接收注解：

```kotlin
import org.apache.fory.json.annotation.JsonProperty

data class Profile(
  @param:JsonProperty("user_id")
  val id: Long,
  val name: String,
)
```

这里，`id` 映射为 `user_id`。命名、格式化、Mixin 和自定义编解码器均基于同一套注解体系；受支持的 Kotlin 注解目标见[注解指南](/docs/json/annotations#kotlin-use-site-targets)。

## Fory 如何高效映射 Kotlin 模型 {#how-fory-json-achieves-high-performance-in-kotlin}

映射过程将 Kotlin 声明接入共用引擎：

```text
Kotlin 元数据 + 声明的根类型
  → 解析后的构造函数与属性模型
  → 生成的编解码器
  → 共用的 Fory JSON 运行时
```

### 解析 Kotlin 元数据 {#preparing-kotlin-types-once}

准备编解码器时，Kotlin 模块解析构造函数、属性访问器、泛型参数、可空性，以及具有编译器默认值的参数，将它们转换为 Fory 的对象模型。运行时在后续操作中复用该模型。

声明的根类型提供了类在某次具体使用中的类型信息。以 `Box<List<String?>>` 为例，类元数据描述 `Box<T>`，类型令牌则为 `T` 提供 `List<String?>`。两者结合后，映射器便能在对象内部执行正确的类型检查。

### 围绕构造函数生成代码 {#generating-code-for-the-declared-model}

在标准 JDK 上，生成的读取器针对解析后的模型专门处理字段匹配与解码。对于 `Request`，读取器记录哪些参数已出现，拒绝缺少 `id` 的输入，并选择对应的构造函数调用。如果缺少 `label` 或 `retries`，默认参数掩码会告知 Kotlin 编译器生成的构造函数需要计算哪些表达式。显式传入 null 的 `label` 则不会触发默认值逻辑。

生成的写入器同样使用已解析的访问器和字段类型，也遵守可空构造函数属性必须保留 null 的规则。复用这些编解码器可以省去反复解析模型的工作，同时在读取路径中保留正常的 Kotlin 构造和校验过程。无法在运行时编译的环境可以使用解释执行的映射路径。

### 使用共用的 JSON 引擎 {#using-the-shared-json-engine}

这些编解码器使用 Fory 已有的数字编码器、文本处理逻辑、可复用缓冲区，以及直接 UTF-8 读取器和写入器。Kotlin 层提供类型和构造规则，引擎负责 JSON 输入与输出，无需构建中间 JSON 树。[Java JSON 文章](/blog/fory_json_fastest_java_json_framework)详细介绍了这些共用优化。

## 性能 {#performance-on-kotlin-models}

基准测试涵盖一条较小的结构化消息，以及两份约 1 MB 的文档，对比各库在 Kotlin 模型上的完整序列化与反序列化操作。

### 测试方法 {#benchmark-setup}

两组基准测试均在 Apple M5 和 OpenJDK 25.0.3 上运行，对比 Fory JSON for Kotlin 1.7.1、kotlinx.serialization 1.11.0、使用生成式适配器的 Moshi 1.15.2，以及 Jackson Kotlin 2.22.1。

同一负载下，各库处理相同的 Kotlin 模型和输入。正确性检查验证测试样本读取、往返转换和 JSON 输出等价性。String 操作不包含 UTF-8 转换。字节操作中，Fory 和 Jackson 使用直接字节数组 API，kotlinx.serialization 使用流 API，Moshi 使用 Okio 缓冲区；这些路径均不经过中间 String 转换。

图中展示每秒操作数，数值越高越好，并标出 JMH 报告的误差。完整配置、输入哈希、原始测量数据和复现命令见[基准测试报告](https://github.com/chaokunyang/kotlin-json-benchmarks/blob/71399f45a9e6a55c07e127d240019ca9198446db/README.md)。

### MediaContent：结构化消息 {#mediacontent-structured-messages}

Eishay MediaContent 测试样本包含一条媒体记录和图像，涉及字符串、数字、列表和枚举。其 Kotlin 模型包含必需构造函数参数、`val` 属性、可空成员和带编译器默认值的参数。各库的 null 与默认值输出配置保持一致。正确性测试覆盖成员缺失时使用默认值的行为；计时样本并未单独衡量这一行为。

![Kotlin MediaContent String 序列化与反序列化吞吐量](/img/blog/fory-kotlin-json/string_throughput.png)

![Kotlin MediaContent UTF-8 字节序列化与反序列化吞吐量](/img/blog/fory-kotlin-json/utf8_bytes_throughput.png)

### 1 MB Users 和 Clients {#users-and-clients-larger-documents}

大文档测试将 `java-json-benchmark` 中的 Users 和 Clients Schema 移植为 Kotlin 数据类。确定性生成器持续追加完整记录，直到紧凑 UTF-8 输入至少达到 1,000,000 字节。每次操作处理一份完整文档。

#### Users {#users}

Users 包含文本字段、数值、标签和嵌套的朋友记录。文档包含 431 条记录，UTF-8 大小为 1,001,958 字节。

![Kotlin Users String 序列化与反序列化吞吐量](/img/blog/fory-kotlin-json/users_string_throughput.png)

![Kotlin Users UTF-8 字节序列化与反序列化吞吐量](/img/blog/fory-kotlin-json/users_utf8_bytes_throughput.png)

#### Clients {#clients}

Clients 还包含 `UUID`、`BigDecimal`、`LocalDate` 和 `OffsetDateTime`，以及枚举、数组和嵌套的合作伙伴记录。文档包含 379 条记录，UTF-8 大小为 1,000,779 字节。

Fory 使用内置 JDK 编解码器。kotlinx.serialization 和 Moshi 使用显式适配器，将 UUID 和日期表示为字符串，将 `BigDecimal` 表示为不带引号的数字，并保留全部十进制精度。Jackson 注册 `JavaTimeModule`。检查会比较数组内容和完整的 `OffsetDateTime` 值，允许时间戳在小数秒末尾零的数量上存在差异，只要它们表示相同的值。

![Kotlin Clients String 序列化与反序列化吞吐量](/img/blog/fory-kotlin-json/clients_string_throughput.png)

![Kotlin Clients UTF-8 字节序列化与反序列化吞吐量](/img/blog/fory-kotlin-json/clients_utf8_bytes_throughput.png)

### 结果解读 {#interpreting-the-results}

在每种负载的四项操作中，Fory 均取得最高吞吐量。下表汇总了 String 和 UTF-8 序列化与反序列化操作中，Fory 相对于各库的吞吐量倍数范围，按未经四舍五入的原始分数计算：

| Kotlin 模型 | 相对 kotlinx.serialization | 相对 Moshi | 相对 Jackson Kotlin |
| --- | ---: | ---: | ---: |
| MediaContent | 3.63×–11.62× | 6.35×–12.12× | 3.91×–8.37× |
| Users | 3.50×–9.21× | 3.47×–5.53× | 2.78×–5.16× |
| Clients | 4.36×–9.45× | 4.83×–8.99× | 3.31×–9.75× |

MediaContent 展示了映射一个通过构造函数创建的小模型并处理其 JSON 的综合开销。Users 和 Clients 则将比较扩展到更长的文档、嵌套集合和 JDK 值类型。这些结果衡量 Kotlin 映射层与 JSON 引擎共同运行时的性能，没有单独测量每项优化的贡献。

这些测量对应一台机器上选定的模型和配置，未衡量值类、sealed 层次结构以及 Android、Native Image 上的性能。大文档数据集沿用上游的字段大小和数值范围，但使用自身的确定性生成序列，因此不能与独立运行的 Java 基准测试进行受控比较。

## JVM、Android 与 GraalVM {#jvm-and-deployment-support}

该模块面向 Kotlin/JVM，无需依赖 `kotlin-reflect`。[安装指南](/docs/json/kotlin#installation)介绍了兼容性，[运行时指南](/docs/json/getting-started)则涵盖 JDK 25 及更高版本上建议开放的 `java.lang.invoke` 包。

Android API 26 及更高版本使用解释执行的 JSON 映射。启用 R8 或 ProGuard 时，应添加 `fory-json-kotlin-ksp`，并为所需的源码模型标注 `JsonType`，以保留映射信息。GraalVM Native Image 通过 `ForyJsonProvider` 安装 Kotlin 模块，并选择可达模型进行代码生成。[平台指南](/docs/json/kotlin#graalvm-and-android)提供了这两种环境的配置方式。Kotlin/Native、Kotlin/JS 和 Kotlin/Wasm 不在此模块的支持范围内。

## 延伸阅读 {#learn-more}

[Kotlin JSON 指南](/docs/json/kotlin)介绍了类型映射和配置；应用需要特定表示方式时，请参阅[自定义编解码器](/docs/json/custom-codecs)；输入限制见[安全指南](/docs/json/security)。源码和贡献说明位于 [apache/fory](https://github.com/apache/fory)。
