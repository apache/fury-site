---
slug: fory_kotlin_json
title: "Apache Fory™ JSON：面向 Kotlin 的高性能 JSON 序列化"
description: "Apache Fory JSON 为 Kotlin/JVM 提供高性能 JSON 序列化，支持普通类、数据类、值类和密封类型，并遵循 Kotlin 的构造函数默认值和可空性规则。"
authors: [chaokunyang]
tags: [fory, kotlin, java, json, serialization, performance]
---

**摘要**：Apache Fory JSON 为 Kotlin/JVM 提供高性能 JSON 序列化，支持普通类、数据类、值类和密封类型，并遵循模型中声明的默认值和可空性规则。在涵盖小消息和大文档的基准测试中，Fory 的吞吐量为 kotlinx.serialization、Moshi 和 Jackson Kotlin 的 **2.78–12.12 倍**。

<img src="/img/fory-logo-light.png" width="50%"/>

## 面向 Kotlin 的 JSON 映射 {#kotlin-json-mapping}

在 Kotlin 中，JSON 映射并不只是读写对象字段。默认参数和可空类型会影响对象的构造方式，值类和密封类型也有自己的类型语义。要正确处理这些模型，JSON 库需要理解 Kotlin 的类型信息和构造规则。

Apache Fory JSON 为 Kotlin/JVM 提供了专门的对象映射层。它通过 Kotlin 元数据解析类型、属性和构造参数，再由 Fory 的高性能 JSON 引擎完成 JSON 的解析与编码。

## 快速开始 {#getting-started}

先在 Kotlin/JVM 项目中添加依赖。该模块已发布到 Maven Central，项目中的 Fory 依赖应使用相同版本：

```kotlin title="build.gradle.kts"
dependencies {
  implementation("org.apache.fory:fory-json-kotlin:1.7.1")
}
```

接着创建 `json` 实例，并用 `jsonTypeRef<Account>()` 指定模型类型。`json` 是线程安全的，建议复用 `json` 和 `accountType`，避免每次读写都重新创建：

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

在标准 JVM 上，上面的示例无需给模型添加注解，也不需要序列化编译器插件。`ForyJsonKotlin.builder()` 会自动安装 Kotlin 模块。`jsonTypeRef<T>()` 保留声明的根类型中的泛型参数、可空性，以及无符号类型和值类等 Kotlin 类型信息。例如，`jsonTypeRef<List<Account?>>()` 允许列表包含 null 元素，`jsonTypeRef<List<Account>>()` 则要求所有元素非空。

如果 HTTP 客户端、消息队列或存储接口本来就使用字节传递数据，可以直接调用字节 API 读写 UTF-8，省去将整份文档转换为字符串的开销。

## 构造函数默认值与可空性 {#constructor-defaults-and-nullability}

下面的请求模型有一个必需参数和两个带默认值的参数：

```kotlin
data class Request(
  val id: Long,
  val label: String? = "new",
  val retries: Int = 3,
)
```

Fory 会自动使用主构造函数创建 `Request`。JSON 中缺少某个字段时，如果对应参数有默认值，就使用该默认值；如果字段明确写为 null，则检查参数是否允许为 null：

| JSON 输入 | 结果 |
| --- | --- |
| `{"id":1}` | `Request(1, "new", 3)` |
| `{"id":1,"label":null}` | `Request(1, null, 3)` |
| `{"label":"ready"}` | 拒绝：缺少必需参数 `id` |
| `{"id":1,"retries":null}` | 拒绝：`retries` 不可空 |

参数可空，并不意味着这个字段可以省略。如果参数没有默认值，JSON 中仍必须提供该字段。字段缺失且参数声明了默认值时，Fory 会通过 Kotlin 的默认参数机制调用构造函数，由 Kotlin 计算默认值。`init` 块和构造函数中的校验也会照常执行。

序列化时也要区分 null 和字段缺失。例如，`label` 的值是 null，如果输出时省略了这个字段，再读取时就会得到默认值 `"new"`。因此，对于声明在构造函数中的可空属性，Fory 会把 null 值写入 JSON，确保在相同配置下序列化后再反序列化，得到的仍是原来的值。

可空性检查也覆盖容器元素和嵌套泛型中的类型。如果需要使用次构造函数、通过 `JsonCreator` 指定构造函数或工厂方法，或处理类体中声明的属性，可参阅 [Kotlin 指南](/docs/json/kotlin#immutable-classes-and-compiler-defaults)。

## 值类与无符号类型 {#preserving-domain-types}

用值类封装账户 ID，可以在 Kotlin 中把它与普通整数区分开来，而在 JSON 中仍然表示为一个数字。下面继续使用前面的 `json` 实例：

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

反序列化 `AccountId` 时，Fory 会执行其构造和校验逻辑，包括 `require` 检查。无论 `AccountId` 在 JVM 上被装箱，还是用底层值表示，`jsonTypeRef<AccountId>()` 都会保留其声明的 Kotlin 类型。

无符号整数会按十进制数字写入 JSON，完整支持 `ULong` 的取值范围。如果 API 要求将 64 位整数写成 JSON 字符串，可以在创建实例时使用 `ForyJsonKotlin.builder().writeLongAsString(true)`。该设置适用于 `Long` 和 `ULong`，也适用于受支持的容器和值类中的这两种类型。反序列化时，整数带不带引号都可以读取。

如果可空值类的表示会让 JSON null 产生歧义，Fory 会拒绝自动映射，需要使用带标签的自定义编解码器；具体规则见[类型支持表](/docs/json/kotlin#supported-kotlin-types)。

## 密封类型与注解 {#sealed-types-and-json-annotations}

在密封类或密封接口（`sealed`）上添加 `JsonSubTypes` 注解后，Fory 可以根据 Kotlin 的密封类型信息推导出允许的具体子类型：

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

Fory 根据声明的 `Payment` 类型确定可用的子类型，并用 `kind` 字段记录子类型名称。这里只接受映射中已有的名称，未知名称会被拒绝，JSON 输入无法任意指定 JVM 类。默认名称来自源码中的类名；如果希望重命名类后 JSON 中的名称不变，就需要显式配置子类型与名称的映射。列表中的 `Payment` 也适用这套规则，使用 `jsonTypeRef<List<Payment>>()` 即可。

Fory 的 JSON 注解同样适用于 Kotlin 属性。可以用 `@param:` 等注解目标明确指定注解作用的位置，例如下面的构造函数参数：

```kotlin
import org.apache.fory.json.annotation.JsonProperty

data class Profile(
  @param:JsonProperty("user_id")
  val id: Long,
  val name: String,
)
```

这个注解把 Kotlin 中的 `id` 对应到 JSON 中的 `user_id`。属性命名、格式设置、Mixin 和自定义编解码器都沿用 Fory 的注解机制。支持哪些 Kotlin 注解目标，可参阅[注解指南](/docs/json/annotations#kotlin-use-site-targets)。

## Fory 如何高效映射 Kotlin 模型 {#how-fory-json-achieves-high-performance-in-kotlin}

Fory 先从 Kotlin 类型中解析出构造函数和属性信息，再通过相应的编解码器调用底层 JSON 引擎完成读写：

```text
Kotlin 元数据 + 声明的根类型
  → 构造函数和属性模型
  → 生成或解释执行的编解码器
  → Fory JSON 引擎
```

### 解析 Kotlin 元数据 {#preparing-kotlin-types-once}

准备编解码器时，Kotlin 模块会解析模型的构造函数、属性访问方式、泛型参数和可空性，并记录哪些参数有默认值。Fory 会将这些信息整理为内部对象模型，后续读写直接复用，无需重复解析。

只看类本身的元数据，还不足以确定泛型的实际类型。例如，`Box` 的元数据只能描述 `Box<T>`，而 `jsonTypeRef<Box<List<String?>>>()` 进一步指明了 `T` 是 `List<String?>`。结合这两部分信息，Fory 才能确定列表元素的类型，以及是否允许为 null。

### 按模型生成读写代码 {#generating-code-for-the-declared-model}

如果运行环境支持且启用了运行时代码生成，Fory 会根据解析得到的模型生成 JSON 读取代码，直接完成字段匹配和解码。以 `Request` 为例，读取代码会记录 JSON 中提供了哪些参数，拒绝缺少 `id` 的输入，再选择相应的构造函数调用。缺少 `label` 或 `retries` 时，代码会通过默认参数掩码，告诉 Kotlin 编译器生成的构造函数需要计算哪些默认值。如果 `label` 明确传入了 null，就直接使用 null，不会触发默认值逻辑。

生成的写入代码使用已确定的属性访问方式和字段类型。对于构造函数中声明的可空属性，也会按前文的规则写出 null。模型解析完成后，编解码器可以反复使用；反序列化时，Kotlin 正常的构造和校验逻辑仍然会执行。运行时无法生成代码或未启用代码生成时，也可以使用解释执行的编解码器。

### 复用 Fory 的 JSON 引擎 {#using-the-shared-json-engine}

这些编解码器沿用 Fory 已有的数字编码和文本处理实现，通过复用缓冲区减少临时分配，并支持直接读写 UTF-8 字节。Kotlin 模块负责类型规则和对象构造，JSON 引擎负责解析与输出，整个过程不需要先构建一棵 JSON 树。这些底层优化的具体实现，可参阅 [Java JSON 文章](/blog/fory_json_fastest_java_json_framework)。

## 性能 {#performance-on-kotlin-models}

基准测试分别使用一条较小的结构化消息和两份约 1 MB 的文档，对比各库处理 Kotlin 模型时的序列化与反序列化吞吐量。

### 测试方法 {#benchmark-setup}

两组基准测试都在 Apple M5 和 OpenJDK 25.0.3 上运行，参与对比的是 Fory JSON for Kotlin 1.7.1、kotlinx.serialization 1.11.0、Moshi 1.15.2（使用代码生成的适配器）和 Jackson Kotlin 2.22.1。

每个测试场景下，各库使用相同的 Kotlin 模型和输入数据。正确性测试会检查能否正确读取样本、序列化后能否还原原对象，以及各库输出的 JSON 是否等价。模型、输入数据及各库的序列化器、适配器和读写器都在计时前准备好，Fory 的编解码器编译也在计时前完成。

字符串测试不包含 UTF-8 编解码的开销。字节测试中，Fory 和 Jackson 使用字节数组 API，kotlinx.serialization 使用流 API，Moshi 使用 Okio 缓冲区；这些接口都直接处理字节，不会先把整份文档转成字符串。字节测试还包括各接口所需的缓冲区或流创建，以及输出字节数组的提取开销。

图中的吞吐量以每秒操作数表示，越高越好；误差范围来自 JMH 报告。完整配置、输入数据的哈希值、原始测量结果和复现命令见[基准测试报告](https://github.com/chaokunyang/kotlin-json-benchmarks/blob/71399f45a9e6a55c07e127d240019ca9198446db/README.md)。

### MediaContent：结构化消息 {#mediacontent-structured-messages}

Eishay MediaContent 样本包含一条媒体记录及其图像信息，用到了字符串、数字、列表和枚举。对应的 Kotlin 模型包含必需的构造函数参数、`val` 属性、可空属性和带默认值的参数。各库使用一致的 null 和默认值输出设置。正确性测试也会检查字段缺失时是否使用默认值，但性能测试没有单独测量这一行为的开销。

![Kotlin MediaContent String 序列化与反序列化吞吐量](/img/blog/fory-kotlin-json/string_throughput.png)

![Kotlin MediaContent UTF-8 字节序列化与反序列化吞吐量](/img/blog/fory-kotlin-json/utf8_bytes_throughput.png)

### Users 和 Clients：约 1 MB 的大文档 {#users-and-clients-larger-documents}

大文档测试沿用 `java-json-benchmark` 中 Users 和 Clients 的数据结构，并将它们改写为 Kotlin 数据类。生成器按固定规则逐条生成并追加完整记录，直到 JSON 文档以紧凑格式编码为 UTF-8 后达到至少 1,000,000 字节。每次序列化或反序列化都处理整份文档。

#### Users {#users}

Users 包含文本、数值、标签和嵌套的好友信息。测试文档共有 431 条记录，编码为 UTF-8 后占 1,001,958 字节。

![Kotlin Users String 序列化与反序列化吞吐量](/img/blog/fory-kotlin-json/users_string_throughput.png)

![Kotlin Users UTF-8 字节序列化与反序列化吞吐量](/img/blog/fory-kotlin-json/users_utf8_bytes_throughput.png)

#### Clients {#clients}

Clients 还用到了 `UUID`、`BigDecimal`、`LocalDate` 和 `OffsetDateTime`，以及枚举、数组和嵌套的合作伙伴信息。测试文档共有 379 条记录，编码为 UTF-8 后占 1,000,779 字节。

Fory 使用内置的 JDK 类型编解码器。测试为 kotlinx.serialization 和 Moshi 配置了适配器，将 UUID 和日期写成字符串，将 `BigDecimal` 写成不带引号的数字，并保留完整的十进制精度。Jackson 则注册了 `JavaTimeModule`。正确性检查会比较数组中的元素和完整的 `OffsetDateTime` 值。时间戳中，秒的小数部分可以保留不同数量的末尾零，只要表示的值相同即可。

![Kotlin Clients String 序列化与反序列化吞吐量](/img/blog/fory-kotlin-json/clients_string_throughput.png)

![Kotlin Clients UTF-8 字节序列化与反序列化吞吐量](/img/blog/fory-kotlin-json/clients_utf8_bytes_throughput.png)

### 结果解读 {#interpreting-the-results}

三个模型都分别测试了 String 和 UTF-8 的序列化与反序列化，Fory 在这些测试中的吞吐量都最高。下表列出每个模型四项测试中，Fory 相对于各库的吞吐量倍数范围，按未经四舍五入的原始结果计算：

| Kotlin 模型 | 相对 kotlinx.serialization | 相对 Moshi | 相对 Jackson Kotlin |
| --- | ---: | ---: | ---: |
| MediaContent | 3.63×–11.62× | 6.35×–12.12× | 3.91×–8.37× |
| Users | 3.50×–9.21× | 3.47×–5.53× | 2.78×–5.16× |
| Clients | 4.36×–9.45× | 4.83×–8.99× | 3.31×–9.75× |

MediaContent 反映了小对象的构造、类型映射和 JSON 处理的整体开销。Users 和 Clients 进一步考察大文档、嵌套集合及 JDK 类型的处理性能。这些结果衡量的是 Kotlin 映射层和 JSON 引擎的整体性能，没有单独测量各项优化带来的提升。

以上结果来自同一台机器上的这些模型和配置，未测试值类、密封类型，也未测试 Android 或 Native Image 的性能。大文档数据沿用了上游的字段长度和数值范围，但具体记录由本测试按固定规则单独生成。因此，不能将这些结果与单独运行的 Java 基准测试直接比较。

## JVM、Android 与 GraalVM {#jvm-and-deployment-support}

该模块可用于 Kotlin/JVM 项目，支持 Android 和 GraalVM Native Image，且不依赖 `kotlin-reflect`。兼容性说明见[安装指南](/docs/json/kotlin#installation)。使用 JDK 25 及更高版本时，建议按[运行时配置指南](/docs/json/getting-started)开放 `java.lang.invoke` 包的访问权限。

在 Android API 26 及更高版本上，Fory 通过解释执行处理 JSON 映射。启用 R8 或 ProGuard 时，需要添加 `fory-json-kotlin-ksp`，并为压缩后仍需保留映射信息的 Kotlin 源码模型添加 `JsonType` 注解。第三方类型则可通过应用源码中精确指定目标类型的 Mixin 保留这些信息。

在 GraalVM Native Image 中，通过 `ForyJsonProvider` 注册 Kotlin 模块，并为应用可访问到的模型配置代码生成。这两种环境的配置方法见[平台指南](/docs/json/kotlin#graalvm-and-android)。该模块不支持 Kotlin/Native、Kotlin/JS 和 Kotlin/Wasm。

## 延伸阅读 {#learn-more}

完整的类型映射与配置说明见 [Kotlin JSON 指南](/docs/json/kotlin)。需要自定义 JSON 表示时，可参考[自定义编解码器](/docs/json/custom-codecs)；输入限制的配置见[安全指南](/docs/json/security)。源码和贡献说明见 [apache/fory](https://github.com/apache/fory)。
