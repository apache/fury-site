---
slug: fory_kotlin_json
title: "Apache Fory™ JSON Kotlin：极速 Kotlin JSON 序列化框架"
description: "Fory JSON 将 Kotlin 模型映射为标准 JSON，同时保留构造函数默认值、可空性、值类和 sealed 层次结构。本文介绍其使用方式、性能原理，以及 Kotlin MediaContent 和 1000 KB 文档的基准测试结果。"
authors: [chaokunyang]
tags: [fory, kotlin, java, json, serialization, performance]
---

**摘要**：Apache Fory JSON for Kotlin 在提供标准 JSON 互操作能力的同时，保留 Kotlin 构造函数默认值、可空性、值类和 sealed 层次结构的语义。该 JVM 模块支持 String API 和直接处理 UTF-8 的 API，无需依赖 `kotlin-reflect`。在本文展示的基准测试中，Fory JSON Kotlin 1.7.1 处理 MediaContent 时，吞吐量为 kotlinx.serialization、Moshi 和 Jackson Kotlin 的 **3.63–12.12 倍**；处理 1000 KB 的 Users 和 Clients 文档时，吞吐量为这些库的 **2.78–9.75 倍**。

- GitHub：[apache/fory](https://github.com/apache/fory)
- 文档：[Fory JSON for Kotlin](/docs/json/kotlin)
- 测试数据：[Kotlin JSON 基准测试报告](https://github.com/chaokunyang/kotlin-json-benchmarks/blob/71399f45a9e6a55c07e127d240019ca9198446db/README.md)

<img src="/img/fory-logo-light.png" width="50%"/>

---

## 以 Kotlin 模型定义 JSON 契约 {#kotlin-models-as-json-contracts}

Kotlin 数据类既描述对象包含哪些值，也定义对象应当如何构造。必需参数必须提供，缺失成员可以使用默认值，可空性则决定显式 null 是否有效。将 JSON 文档还原为应用对象时，这些规则同样需要得到遵守。

Apache Fory JSON 将这些模型映射为标准 JSON 文本和 UTF-8 字节。Kotlin 模块解析声明的 Kotlin 类型，并通过正常的构造过程创建对象，保留初始化和校验逻辑。因此，应用可以直接使用依赖构造函数的模型，包括具有必需 `val` 属性的类。

该模块在 Fory 现有的 JSON 运行时上增加 Kotlin 类型处理能力。应用与 Java 实现共用解析和输出引擎，对象构造则由 Kotlin 元数据指导。

## 快速开始 {#getting-started}

添加 Kotlin JSON 模块，并确保所有 Fory 依赖使用相同版本：

```kotlin title="build.gradle.kts"
plugins {
  kotlin("jvm") version "2.3.20"
}

repositories {
  mavenCentral()
}

dependencies {
  implementation("org.apache.fory:fory-json-kotlin:1.7.1")
}
```

创建运行时和模型的类型令牌。运行时不可变且线程安全；应保留这两个对象以便重复使用：

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

  val fromText = json.fromJson(text, accountType)
  val fromUtf8 = json.fromJson(utf8, accountType)

  check(fromText == input)
  check(fromUtf8 == input)
  println(fromText.name) // Alice
}
```

在标准 JVM 上，这个示例不需要模型注解或序列化编译器插件。`ForyJsonKotlin.builder()` 会安装 Kotlin 模块，`jsonTypeRef<Account>()` 则保留声明模型中的无符号类型和可空类型信息。仅靠 Java `Class` 无法表达所有这些区别。

String 方法和字节数组方法生成相同的 JSON 表示。字节方法直接处理 UTF-8，因此当 HTTP 客户端、消息传输或存储 API 已经使用字节交换数据时，可以避免中间 String 转换。

## 构造函数默认值与可空性 {#constructor-defaults-and-nullability}

声明的类型决定如何处理缺失成员。在下面的请求模型中，`id` 是必需参数，`label` 和 `retries` 则具有编译器支持的默认值：

```kotlin
data class Request(
  val id: Long,
  val label: String? = "new",
  val retries: Int = 3,
)
```

Fory 自动选择主构造函数。成员缺失且存在默认值时，会使用该默认值；对于显式 JSON null，则根据参数的可空性进行检查：

| JSON 输入 | 结果 |
| --- | --- |
| `{"id":1}` | `Request(1, "new", 3)` |
| `{"id":1,"label":null}` | `Request(1, null, 3)` |
| `{"label":"ready"}` | 拒绝：缺少必需参数 `id` |
| `{"id":1,"retries":null}` | 拒绝：`retries` 不可空 |

这一差异也影响序列化。如果 `label` 为 null，省略该成员会使读取方恢复出 `"new"`。因此，对于值为 null 的可空构造函数属性，Fory 会显式写出 null，使输出在相同配置下能够还原为相同的值。

可空性与默认值相互独立：没有默认值的可空参数仍要求 JSON 中存在对应成员。相同的类型信息也会延伸到容器内部。`jsonTypeRef<List<Account?>>()` 允许 null 元素，而 `jsonTypeRef<List<Account>>()` 会拒绝 null 元素。保留完整的声明类型，可以让这些规则在嵌套泛型模型中继续生效。

关于次构造函数、显式创建器和类体中声明的属性，请参阅 [Kotlin 指南](/docs/json/kotlin#immutable-classes-and-compiler-defaults)。

## 保留领域类型 {#preserving-domain-types}

值类让应用能够区分不同的领域标识符，同时无需在 JSON 文档中增加一层对象。Fory 将符合条件的值类映射为底层值，并在重建时执行其初始化检查：

```kotlin
import org.apache.fory.json.kotlin.ForyJsonKotlin
import org.apache.fory.json.kotlin.jsonTypeRef

@JvmInline
value class AccountId(val value: ULong) {
  init {
    require(value > 0uL)
  }
}

val json = ForyJsonKotlin.builder().build()
val idType = jsonTypeRef<AccountId>()

val text = json.toJson(AccountId(42uL), idType) // 42
val restored = json.fromJson(text, idType)
```

这里，`AccountId` 在应用中仍是独立的类型，其 JSON 表示则是数字 `42`。即使 JVM 使用基本类型作为该值的底层载体，类型令牌仍会保留它的类型身份。

无符号整数保留其十进制表示，包括完整的 `ULong` 取值范围。当 API 要求将 64 位整数表示为 JSON 字符串时，`ForyJsonKotlin.builder().writeLongAsString(true)` 会将该表示方式应用于 `Long` 和 `ULong`，也包括受支持的容器和值类。读取器同时接受带引号和不带引号的整数。

自动映射要求 JSON 表示没有歧义。如果一个值类本身可空，且其底层值也可空，两个不同的状态就会对应同一个 JSON null，因此这种情况需要使用带标签的自定义编解码器。其他 Kotlin 类型及其表示方式见[类型支持表](/docs/json/kotlin#supported-kotlin-types)。

## sealed 类型与 JSON 注解 {#sealed-types-and-json-annotations}

某些 API 值可能具有多种结构。Kotlin sealed 层次结构将这些可能的类型直接定义在模型中。在基类型上标注 `JsonSubTypes`，Fory 即可推导出具体的变体：

```kotlin
import org.apache.fory.json.annotation.JsonSubTypes
import org.apache.fory.json.kotlin.ForyJsonKotlin
import org.apache.fory.json.kotlin.jsonTypeRef

@JsonSubTypes(property = "kind")
sealed interface Payment

data class CardPayment(val lastFour: String) : Payment
data class BankTransfer(val account: String) : Payment

val json = ForyJsonKotlin.builder().build()
val paymentType = jsonTypeRef<Payment>()

val text = json.toJson(CardPayment("4242"), paymentType)
// {"kind":"CardPayment","lastFour":"4242"}
val decoded = json.fromJson(text, paymentType)
```

使用声明类型 `Payment` 时，会选用对应的子类型表。`kind` 属性包含变体的逻辑名称，未知名称会被拒绝。JSON 输入无法指定任意 JVM 类。推导出的名称取自源码类名；如果 API 中的名称需要独立于源码重命名而保持稳定，可以显式声明子类型表。相同的映射也适用于 `jsonTypeRef<List<Payment>>()`。

注解还可以将单个 Kotlin 属性映射到现有的 JSON 契约。显式指定注解的使用位置目标，可以确定哪个 JVM 元素应接收该注解：

```kotlin
import org.apache.fory.json.annotation.JsonProperty

data class Profile(
  @param:JsonProperty("user_id")
  val id: Long,
  val name: String,
)
```

在这个示例中，构造函数参数 `id` 映射为 JSON 成员 `user_id`。命名、格式化、Mixin 和自定义编解码器使用 Fory 共用的注解体系。[注解指南](/docs/json/annotations#kotlin-use-site-targets)介绍了受支持的 Kotlin 使用位置目标及其组合规则。

## Fory JSON 如何在 Kotlin 中实现高性能 {#how-fory-json-achieves-high-performance-in-kotlin}

Fory 的 Kotlin 支持将遵循语言语义的对象映射与经过优化的 JSON 引擎结合起来。Kotlin 模块确定声明类型的表示和构造方式，共用运行时则针对这种表示的反复读写生成专用处理逻辑。这一设计在保留 Kotlin 构造规则的同时，减少了模型解析、调用分派、文本处理和临时分配的开销。

### 预先解析并复用 Kotlin 类型信息 {#preparing-kotlin-types-once}

准备编解码器时，Kotlin 模块会读取类元数据，解析构造函数、属性访问器、精确的泛型绑定、可空性，以及哪些参数具有编译器支持的默认值，并将这些信息转换为运行时的对象模型。保留运行时和 `jsonTypeRef<T>()`，后续操作便可复用已解析的编解码器，无需重复分析元数据。

以前文的 `Request` 为例，准备好的模型已经确定 `id` 是必需参数，并记录了如何调用 `label` 和 `retries` 的默认值逻辑。每次读取仍会检查哪些成员存在，以及它们的值是否有效。构造过程需要默认值时，仍会执行默认值表达式，其计算结果不会被缓存。被省去的是反复解析规则的工作，规则本身仍在反序列化过程中生效。

### 为声明模型生成专用代码 {#generating-code-for-the-declared-model}

在标准 JDK 上，Fory 会为目标模型生成并编译专用编解码器。生成的写入器使用已知的属性访问器和具体的基本类型操作。属性名、引号、冒号和分隔符可以预先编码为前缀，使 `"id":` 这样的字段前缀通过打包写入输出，无需反复转义或逐个字符写入。

生成的读取器也会针对声明的 Schema 专门处理属性匹配和值解码。它们读取构造函数参数，记录缺失参数，并调用选定的构造函数或编译器生成的默认参数构造形式。常见属性通过预先准备的名称和对输入的直接检查进行匹配，从而减少重复的名称解码和通用查找。其他字段顺序及带转义的名称仍可通过回退路径处理。

这些专用代码为 JVM 提供了可进一步优化的具体操作，同时保留正常的 Kotlin 初始化和校验逻辑。标准 JDK 默认启用运行时代码生成；无法在运行时编译的环境则可以使用解释执行路径。

### 直接处理数字和文本 {#processing-numbers-and-text-directly}

整数和长整数写入器将十进制数字直接编码到输出缓冲区，也支持 Kotlin 使用的无符号表示。JDK 提供相应能力时，浮点数写入器采用直接格式化路径。因此，常见标量的写入无需为每个值创建临时 String。整数读取器也直接从输入中解析数字，并执行语法和溢出检查，无需先分配用于表示该数字的子字符串。

在常见的 ASCII 和 Latin-1 路径上，文本通过批量操作处理。例如，UTF-8 写入器以 8 字节或 16 字节为一组扫描 ASCII 文本，检测需要转义的字符，再批量复制符合条件的片段。转义字符和非 ASCII 字符则由相应的编码路径处理。结合预先准备的属性前缀，这些操作可以降低结构化 JSON 中重复名称和文本值的逐字符分支与复制开销。

### 复用缓冲区并直接处理 UTF-8 {#reusing-buffers-and-keeping-utf-8-direct}

可复用的 `ForyJson` 运行时会保留执行状态，其中包含读取器、写入器、类型解析器缓存和输出缓冲区。每个执行中的操作独占其借用的状态。后续调用可以复用这些工作内存，减少临时分配和垃圾回收压力。返回 String 或字节数组时，仍需为结果分配内存；缓冲区扩容和反序列化对象图的构建也需要内存。

字节 API 在整个操作中保留这些处理路径。`toJsonBytes` 直接将 JSON 写入 UTF-8 缓冲区，`fromJson` 则直接读取 UTF-8 字节并构造声明的 Kotlin 模型。按类型进行对象映射无需构建中间 JSON 树，也无需将完整文档转换为 String。对于本身就以字节收发数据的服务，这一点尤为重要，下文较大的 Users 和 Clients 文档便属于此类场景。

## Kotlin 模型的性能表现 {#performance-on-kotlin-models}

下面的基准测试衡量这些机制在 Kotlin 模型上共同运行时的性能。MediaContent 覆盖较小的结构化消息；Users 和 Clients 则通过约 1 MB 的文档，测试重复记录、集合和 JDK 值类型。结果反映各库完整操作的性能，并未单独测量每项优化的贡献。

### 基准测试配置 {#benchmark-setup}

Kotlin 测试比较 Fory JSON Kotlin 1.7.1、kotlinx.serialization 1.11.0、使用生成式适配器的 Moshi 1.15.2，以及 Jackson Kotlin 2.22.1。两次测试均使用 Apple M5 和 OpenJDK 25.0.3。JMH 1.37 运行一个 fork 和一个线程，包含三轮 2 秒预热迭代和五轮 2 秒测量迭代。

所有库处理相同的 Kotlin 模型，这些模型均包含必需的构造函数参数；同一负载下，各库也使用相同的输入。编解码器、序列化器、适配器和具有明确类型的读取器、写入器均在计时前准备完成，包括 Fory 的运行时代码生成。准备阶段验证测试样本的读取、往返转换和 JSON 输出的等价性，遵循 [Apache Fory Kotlin 基准测试方法](/docs/benchmarks/json/kotlin/)。

String 操作不包含 UTF-8 转换。字节操作中，Fory 和 Jackson 使用直接字节数组 API，kotlinx.serialization 使用 `encodeToStream` 和 `decodeFromStream`，Moshi 使用 Okio `Buffer`。流与缓冲区的创建、字节数组的提取均计入测量；这些路径都不经过中间 String 转换。

表格以每秒操作数（ops/s）报告吞吐量，四舍五入到整数，数值越高越好。图中展示 JMH 报告的误差。完整测量数据、环境记录和复现命令见[基准测试报告](https://github.com/chaokunyang/kotlin-json-benchmarks/blob/71399f45a9e6a55c07e127d240019ca9198446db/README.md)。

### MediaContent：结构化消息 {#mediacontent-structured-messages}

Eishay MediaContent 测试样本包含一条媒体记录和图像，涉及字符串、数字、列表和枚举。其 Kotlin 模型使用必需构造函数参数和 `val` 属性，同时涵盖可空成员和构造函数默认值。各库的 null 与默认值输出配置保持一致。

![Kotlin MediaContent String 序列化与反序列化吞吐量](/img/blog/fory-kotlin-json/string_throughput.png)

![Kotlin MediaContent UTF-8 字节序列化与反序列化吞吐量](/img/blog/fory-kotlin-json/utf8_bytes_throughput.png)

| 表示形式 | 操作 | Fory JSON Kotlin ops/s | kotlinx.serialization ops/s | Moshi ops/s | Jackson Kotlin ops/s |
| --- | --- | ---: | ---: | ---: | ---: |
| String | 序列化 | 8,463,544 | 2,331,337 | 1,009,654 | 2,166,486 |
| String | 反序列化 | 3,963,797 | 631,164 | 513,445 | 508,099 |
| UTF-8 字节 | 序列化 | 12,314,484 | 1,059,643 | 1,015,884 | 1,954,090 |
| UTF-8 字节 | 反序列化 | 4,449,742 | 729,606 | 701,187 | 531,665 |

Fory 在四项操作中均取得最高吞吐量，UTF-8 序列化达到**每秒 1,231 万次**。其序列化优势在字节 API 上最为明显：吞吐量分别为 kotlinx.serialization 的 11.62 倍和 Moshi 的 12.12 倍。字节反序列化吞吐量则为 Jackson Kotlin 的 8.37 倍。

### Users 和 Clients：更大的文档 {#users-and-clients-larger-documents}

大文档测试将 `java-json-benchmark` 中的 Users 和 Clients Schema 移植为 Kotlin 数据类。Users 包含文本字段、数值、标签和嵌套的朋友记录。Clients 还包含 `UUID`、`BigDecimal`、`LocalDate` 和 `OffsetDateTime` 等 JDK 值类型，以及枚举、数组和嵌套的合作伙伴记录。

每次操作处理一份完整文档。确定性生成器持续追加记录，直到紧凑 UTF-8 输入至少达到 1,000,000 字节：

| Kotlin 模型 | UTF-8 文档大小 | 记录数 |
| --- | ---: | ---: |
| Users | 1,001,958 字节 | 431 |
| Clients | 1,000,779 字节 | 379 |

Fory 使用内置 JDK 编解码器。kotlinx.serialization 和 Moshi 使用显式适配器，将 UUID 和日期表示为字符串，将 `BigDecimal` 表示为不带引号的数字，并保留全部十进制精度。Jackson 注册 `JavaTimeModule` 2.22.1。正确性检查比较数组内容和完整的 `OffsetDateTime` 值，允许时间戳在小数秒末尾零的数量上存在差异，只要它们表示相同的值。

#### Users {#users}

![Kotlin Users String 序列化与反序列化吞吐量](/img/blog/fory-kotlin-json/users_string_throughput.png)

![Kotlin Users UTF-8 字节序列化与反序列化吞吐量](/img/blog/fory-kotlin-json/users_utf8_bytes_throughput.png)

| 表示形式 | 操作 | Fory JSON Kotlin ops/s | kotlinx.serialization ops/s | Moshi ops/s | Jackson Kotlin ops/s |
| --- | --- | ---: | ---: | ---: | ---: |
| String | 序列化 | 3,132 | 520 | 625 | 1,128 |
| String | 反序列化 | 1,782 | 509 | 443 | 371 |
| UTF-8 字节 | 序列化 | 3,536 | 384 | 639 | 1,003 |
| UTF-8 字节 | 反序列化 | 2,046 | 480 | 590 | 396 |

在 Users 测试中，Fory 的 UTF-8 序列化吞吐量分别为 kotlinx.serialization 的 9.21 倍、Moshi 的 5.53 倍和 Jackson Kotlin 的 3.52 倍。Fory 在两项反序列化操作中也取得最高吞吐量，这些操作包含嵌套记录与集合的构造工作。

#### Clients {#clients}

![Kotlin Clients String 序列化与反序列化吞吐量](/img/blog/fory-kotlin-json/clients_string_throughput.png)

![Kotlin Clients UTF-8 字节序列化与反序列化吞吐量](/img/blog/fory-kotlin-json/clients_utf8_bytes_throughput.png)

| 表示形式 | 操作 | Fory JSON Kotlin ops/s | kotlinx.serialization ops/s | Moshi ops/s | Jackson Kotlin ops/s |
| --- | --- | ---: | ---: | ---: | ---: |
| String | 序列化 | 2,393 | 549 | 496 | 724 |
| String | 反序列化 | 1,955 | 258 | 217 | 200 |
| UTF-8 字节 | 序列化 | 3,947 | 418 | 499 | 621 |
| UTF-8 字节 | 反序列化 | 2,070 | 256 | 253 | 215 |

在 Clients 的 String 反序列化测试中，Fory 的吞吐量分别为 **kotlinx.serialization 的 7.59 倍、Moshi 的 8.99 倍和 Jackson Kotlin 的 9.75 倍**。这些测量将比较范围扩展到同时包含 JDK 值类型、数组、文本和集合的模型。Users 和 Clients 的全部 32 个测试用例均已完成，共产生 160 个测量样本。

### 结果解读 {#interpreting-the-results}

在每种负载的四项操作中，Fory 相对于其他库的吞吐量倍数分布如下。倍数根据未经四舍五入的原始分数计算：

| Kotlin 模型 | 相对 kotlinx.serialization | 相对 Moshi | 相对 Jackson Kotlin |
| --- | ---: | ---: | ---: |
| MediaContent | 3.63×–11.62× | 6.35×–12.12× | 3.91×–8.37× |
| Users | 3.50×–9.21× | 3.47×–5.53× | 2.78×–5.16× |
| Clients | 4.36×–9.45× | 4.83×–8.99× | 3.31×–9.75× |

在 1000 KB Kotlin 测试中，Fory 的吞吐量为对比库的 **2.78–9.75 倍**。这些结果对应所选模型和配置；测试负载并未测量值类和 sealed 层次结构的性能。

Users 和 Clients 数据集沿用上游的字段长度、数值范围和集合大小，但采用自身的确定性生成序列。其[输入哈希与环境记录](https://github.com/chaokunyang/kotlin-json-benchmarks/blob/71399f45a9e6a55c07e127d240019ca9198446db/results/users-clients/environment.json)标识了实际测试的文档。较小的 MediaContent 测试另有独立的[环境记录](https://github.com/chaokunyang/kotlin-json-benchmarks/blob/71399f45a9e6a55c07e127d240019ca9198446db/results/environment.json)。

### Java 基准测试背景 {#java-benchmark-context}

共用引擎也有已发布的 Java 测量结果。下表汇总了各负载已报告操作中，Fory JSON 相对于 Jackson 和 Gson 的吞吐量倍数：

| Java 负载 | 相对 Jackson | 相对 Gson |
| --- | ---: | ---: |
| [MediaContent：String 和 UTF-8](/docs/benchmarks/json/java/) | 2.43×–5.55× | 3.21×–10.00× |
| [Users：1000 KB](https://github.com/fabienrenaud/java-json-benchmark/pull/129) | 3.54×–5.33× | 5.65×–7.09× |
| [Clients：1000 KB](https://github.com/fabienrenaud/java-json-benchmark/pull/129) | 6.97×–10.91× | 9.16×–10.89× |

这些 Java 测试独立运行，采用不同的库版本和测量配置。Java 大文档报告使用 Fory JSON 1.6.0；Java MediaContent 报告中，Gson 的字节测量包含其必需的 String 转换。链接中的报告保留了完整分数和配置。这些结果用于补充说明共用引擎的性能背景，不能作为 Kotlin 与 Java 的性能比较。

## JVM 与部署支持 {#jvm-and-deployment-support}

该模块面向 Kotlin/JVM，无需依赖 `kotlin-reflect`。运行时使用 Kotlin 2.3.20 构建，接受 Kotlin 严格元数据读取器所支持的模型元数据。[入门指南](/docs/json/getting-started)介绍了运行时配置，包括在 JDK 25 及更高版本上建议开放的 `java.lang.invoke` 包。

在 Android API 26 及更高版本上，Fory 使用解释执行的 JSON 映射。启用 R8 或 ProGuard 时，应添加 `fory-json-kotlin-ksp`，并为所需的源码模型标注 `JsonType`，以保留映射所需的信息。GraalVM Native Image 采用 `ForyJsonProvider` 流程：安装 Kotlin 模块，并选择可达模型进行代码生成。[Kotlin 平台指南](/docs/json/kotlin#graalvm-and-android)提供了这两种环境的配置方式。Kotlin/Native、Kotlin/JS 和 Kotlin/Wasm 不在此模块的支持范围内。

## 进一步了解 {#learn-more}

Fory JSON 让 Kotlin 应用在交换标准 JSON 的同时，保留模型声明的语义。构造函数默认值、可空性、值类身份和 sealed 变体都参与映射，同一个可复用运行时提供 String API 和 UTF-8 API。

[Kotlin JSON 指南](/docs/json/kotlin)提供了完整的映射与平台参考。应用需要特定表示方式时，请参阅[自定义编解码器](/docs/json/custom-codecs)；输入限制与类型控制见[安全指南](/docs/json/security)。源码和贡献说明位于 [apache/fory](https://github.com/apache/fory)。
