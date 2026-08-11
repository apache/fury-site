---
slug: fory_json_fastest_java_json_framework
title: "Apache Fory™ JSON：面向 Java 的极速 JSON 序列化框架"
description: "Apache Fory JSON 以高性能将 Java 对象与标准 JSON 文本或 UTF-8 字节相互转换，并提供灵活的对象映射与受控多态。"
authors: [chaokunyang]
tags: [fory, java, json, serialization, performance]
---

**TL;DR**：Apache Fory JSON 是一款高性能序列化框架，可将 Java 对象与标准 JSON 文本或 UTF-8 字节相互转换。它支持常见 Java 模型，并可运行于 JDK 8+、Android 和 GraalVM Native Image。在已发布的基准测试中，Fory JSON 是速度最快的 Java JSON 序列化框架：处理 1000 KB 载荷时，吞吐量最高可达 **Jackson 的 10.91 倍和 Gson 的 10.89 倍**；在 `jvm-serializers` MediaContent 基准测试中，最高可达 **Jackson 的 5.55 倍和 Gson 的 10.00 倍**。

- GitHub：[apache/fory](https://github.com/apache/fory)
- 文档：[Fory JSON](/docs/json/)
- 更完整的 1000 KB 基准测试背景：[java-json-benchmark](https://github.com/fabienrenaud/java-json-benchmark/pull/129)

<img src="/img/fory-logo-light.png" width="50%"/>

---

## JSON 性能为何重要

JSON 位于许多 Java 服务的关键路径上：HTTP API、浏览器流量、事件载荷、日志、配置，以及与不共享二进制协议的系统集成。解析和序列化成本会随请求反复发生，消耗 CPU 并产生临时对象。

Fory 已经提供紧凑的二进制对象序列化和跨语言协议，Fory JSON 则面向另一类使用场景，将 Java 对象映射为标准 JSON 文本或 UTF-8 字节。浏览器、命令行工具和任何符合标准的 JSON 实现都能读取输出结果。

## 快速开始

Fory JSON 1.6.0 已发布到 Maven Central：

```xml
<dependency>
  <groupId>org.apache.fory</groupId>
  <artifactId>fory-json</artifactId>
  <version>1.6.0</version>
</dependency>
```

创建一个 `ForyJson` 实例并重复使用。构建完成的实例不可变且线程安全。

```java
import org.apache.fory.json.ForyJson;

public final class JsonExample {
  private static final ForyJson JSON = ForyJson.builder().build();

  public static final class User {
    public long id;
    public String name;

    public User() {}

    User(long id, String name) {
      this.id = id;
      this.name = name;
    }
  }

  public static void main(String[] args) {
    User input = new User(7, "Alice");

    String text = JSON.toJson(input);
    byte[] utf8 = JSON.toJsonBytes(input);

    User fromText = JSON.fromJson(text, User.class);
    User fromUtf8 = JSON.fromJson(utf8, User.class);

    System.out.println(text);              // {"id":7,"name":"Alice"}
    System.out.println(fromText.name);      // Alice
    System.out.println(fromUtf8.name);      // Alice
  }
}
```

Fory JSON 原生支持 String 和字节数组 API。对于泛型根类型，`TypeRef<List<User>>` 可在反序列化和按声明类型序列化时保留元素类型。Fory JSON 还可以将完整的 UTF-8 文档写入 `OutputStream`，且不会接管该流的所有权。

## Fory JSON 如何实现高性能

Fory JSON 的高性能主要来自四项关键实现。

**尽量减少临时对象分配。** `ForyJson` 实例会复用已经准备好的类型元数据、执行状态和保留的写入缓冲区。对于大多数基本标量值，除调用方要求的输出外，序列化热路径基本可以做到零分配：Fory 将值直接写入输出缓冲区，而不是先转换为 Java `String`。返回 `String` 或 `byte[]` 仍会创建结果对象，缓冲区扩容或冷路径回退也可能产生分配。

**高度优化的基本类型写入。** 整数和长整数使用直接数字编码器；JDK 提供相应能力时，浮点数也通过直接格式化路径写入。布尔值、数值和带引号的字符串会直接进入当前使用的 String 或 UTF-8 写入器。热路径不需要为每个值执行一次 `String.valueOf(...)` 往返转换。

**批量内存操作。** 常见的 Latin-1 和 ASCII 文本会以 8 字节或 16 字节为一组进行扫描和复制。生成的写入器还可以使用预打包的属性前缀和对象边界标记，从而减少逐字符分支和重复写入。

**运行时代码生成。** Fory JSON 会为遇到的每种 Java 类型准备一个编解码器。在标准 JDK 上，代码生成和异步编译默认启用。生成的编解码器会针对目标类专门处理字段访问、属性名、对象边界和基本类型操作，而不必在每次调用时重新发现同一套属性模型。对于受限环境和诊断场景，仍可使用解释执行路径。

公共 API 同样保留这些快速路径。需要 UTF-8 输出的应用可以直接调用 `toJsonBytes` 和 `fromJson(byte[], type)`；面向文本的代码可以使用 String API。自定义编解码器也直接通过 Fory 的读取器和写入器进行流式处理，无需构建中间 JSON 树。

## 性能基准测试

下面的结果覆盖两类负载：大载荷 `java-json-benchmark` 和对象较小的 `jvm-serializers` MediaContent 基准测试。两者都以每秒操作数报告吞吐量，因此数值越高越好。每个小节分别说明其测试配置。

表格仅比较 Fory JSON、Jackson 和 Gson。更广泛的大载荷对比、完整的载荷设置以及基准测试集成方式，请参阅 [java-json-benchmark](https://github.com/fabienrenaud/java-json-benchmark/pull/129)。

### `java-json-benchmark`：1000 KB 载荷

1000 KB 测试衡量每次调用都需要完成大量解析、对象遍历和输出工作时的性能。

该测试使用 Fory JSON 1.6.0、Jackson Databind 2.17.1 和 Gson 2.11.0，三者均采用数据绑定 API。JMH 运行两个 fork 和三个线程；每个 fork 包含五轮 3 秒预热迭代和五轮 3 秒测量迭代。Users 与 Clients 载荷每次调用都包含一个 1000 KB 对象。

![Fory JSON、Jackson 和 Gson 对 1000 KB Users 载荷进行序列化与反序列化时的吞吐量](/img/blog/fory-json/users-throughput.png)

![Fory JSON、Jackson 和 Gson 对 1000 KB Clients 载荷进行序列化与反序列化时的吞吐量](/img/blog/fory-json/clients-throughput.png)

| 载荷    | 操作       | Fory JSON ops/s      | Jackson ops/s        | Gson ops/s           | 相对 Jackson | 相对 Gson |
| ------- | ---------- | -------------------: | -------------------: | -------------------: | -----------: | --------: |
| Users   | 序列化     | 11,867.566 ± 136.846 | 2,225.296 ± 687.106  | 1,674.083 ± 12.558   |        5.33× |     7.09× |
| Users   | 反序列化   | 6,872.876 ± 46.998   | 1,940.172 ± 58.242   | 1,217.513 ± 12.358   |        3.54× |     5.65× |
| Clients | 序列化     | 11,895.269 ± 183.251 | 1,706.314 ± 36.263   | 1,298.288 ± 27.405   |        6.97× |     9.16× |
| Clients | 反序列化   | 6,442.262 ± 627.116  | 590.656 ± 10.849     | 591.350 ± 6.444      |       10.91× |    10.89× |

在这四项大载荷测试中，Fory JSON 的吞吐量达到 Jackson 的 3.54 至 10.91 倍、Gson 的 5.65 至 10.89 倍。

### `jvm-serializers` MediaContent 基准测试

第二项基准测试使用 [`jvm-serializers` MediaContent 模型](https://github.com/eishay/jvm-serializers/blob/master/tpc/src/data/media/MediaContent.java)。该模型包含一个媒体对象和一个图像列表。与 1000 KB 测试相比，这项基准处理的对象要小得多，并分别测试 Java String API 与 UTF-8 字节数组 API。

`jvm-serializers` 基准测试运行于搭载 JDK 26.0.1 的 Apple M4 Pro，使用一个 JMH fork 和一个线程，先执行三轮 2 秒预热迭代，再执行五轮 2 秒测量迭代。

![Java JSON String 基准测试吞吐量](../../../docs/benchmarks/json/java/string_throughput.png)

![Java JSON UTF-8 字节基准测试吞吐量](../../../docs/benchmarks/json/java/utf8_bytes_throughput.png)

| 表示形式   | 操作       | Fory JSON ops/s | Jackson ops/s | Gson ops/s | 相对 Jackson | 相对 Gson |
| ---------- | ---------- | --------------: | ------------: | ---------: | -----------: | --------: |
| String     | 序列化     |       7,387,465 |     2,049,368 |  1,084,042 |        3.60× |     6.81× |
| String     | 反序列化   |       2,897,955 |     1,074,885 |    902,772 |        2.70× |     3.21× |
| UTF-8 字节 | 序列化     |      10,375,498 |     1,868,614 |  1,037,211 |        5.55× |    10.00× |
| UTF-8 字节 | 反序列化   |       3,077,158 |     1,268,397 |    933,079 |        2.43× |     3.30× |

Fory JSON 的吞吐量在四项测试中均为最高。它在 UTF-8 序列化上的优势最大：每秒操作数超过 1000 万，吞吐量达到 Jackson 的 5.55 倍、Gson 的 10.00 倍。

String 与 UTF-8 两组测试有意分开。String 组不包含 UTF-8 转换；字节组则在库提供直接字节数组 API 时使用该接口，Gson 的结果包含其必需的 String 与字节之间的转换。

结果会随负载变化，但在这里展示的两组基准测试配置中，Fory JSON 都是速度最快的框架。

## Java 对象映射

Fory JSON 可以直接映射现有 Java 应用模型，无需手写传输对象：

- 普通可变类和继承字段；
- Java record，以及通过 `JsonCreator` 构建的不可变类；
- 通过 `TypeRef` 表示的泛型集合和 Map；
- Java 时间类型、Optional、原子类型、UUID、路径、大数、枚举和常用集合类型；
- 用于动态目标的 `JsonObject` 和 `JsonArray` 树模型。

属性发现既可以组合字段与 JavaBean getter/setter，也可以切换为仅字段模式。有限的 `JsonSubTypes` 表可以处理应用声明的多态模型，同时不接受输入中的任意类名。

## 基于注解的对象映射

Fory JSON 在 `org.apache.fory.json.annotation` 中提供自己的注解。Jackson 用户会对这套注解模型感到熟悉：它涵盖属性命名和排序、构造器、格式化、多态和校验。不过，这些是独立的 Fory JSON API，并不兼容 Jackson 注解。

其他注解还支持仅在序列化或反序列化时忽略属性、Base64 字节数组、原始值或完整值表示形式、对象展开和动态成员。完整参考请参阅 [Fory JSON 注解指南](/docs/json/annotations)。

下面的模型组合了多种注解：它会重命名固定属性、格式化日期、展开 owner 对象、捕获动态成员，并在读取完成后校验对象：

```java
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;
import org.apache.fory.json.annotation.JsonAnyProperty;
import org.apache.fory.json.annotation.JsonFormat;
import org.apache.fory.json.annotation.JsonProperty;
import org.apache.fory.json.annotation.JsonUnwrapped;
import org.apache.fory.json.annotation.JsonValidator;

public final class Event {
  @JsonProperty("event_id")
  public long id;

  @JsonFormat(pattern = "dd/MM/uuuu")
  public LocalDate day;

  @JsonUnwrapped(prefix = "owner_")
  public Owner owner;

  @JsonAnyProperty
  public Map<String, Object> attributes = new LinkedHashMap<>();

  @JsonValidator
  public void validate() {
    if (id <= 0) {
      throw new IllegalArgumentException("event_id must be positive");
    }
  }

  public static final class Owner {
    public String name;
  }
}
```

`JsonCreator` 支持不可变类，`JsonPropertyOrder` 可显式指定输出顺序。`JsonValue`、`JsonRawValue` 和 `JsonBase64` 可以处理特殊值表示形式，而无需改变对象其余部分的映射方式。

对于无法直接添加注解的第三方类型，Mixin 可以在不修改或包装目标类的情况下应用同一套 Fory JSON 注解：

```java
import org.apache.fory.json.ForyJson;
import org.apache.fory.json.annotation.JsonMixin;
import org.apache.fory.json.annotation.JsonProperty;

@JsonMixin(target = ThirdPartyUser.class)
abstract class ThirdPartyUserMixin {
  @JsonProperty("user_id")
  long id;
}

ForyJson json =
    ForyJson.builder()
        .registerMixin(ThirdPartyUserMixin.class)
        .build();
```

当内置映射和注解仍不足以满足需求时，`JsonValueCodec<T>` 可以处理一个完整 JSON 值，并通过 Fory 的读取器和写入器进行流式处理。子 Codec 配置还可以定制集合元素、Optional 内容以及 Map 的键或值，而无需替换外围容器的映射逻辑。详情请参阅 [自定义 Codec 指南](/docs/json/custom-codecs)。

## 使用 `JsonSubTypes` 实现封闭多态

`JsonSubTypes` 将声明的基类型映射到一组完整且有限的允许实现类及其逻辑名称。JSON 中的判别字段只能从这张表中选择类型，不会提供 Java 类名。

```java
import org.apache.fory.json.ForyJson;
import org.apache.fory.json.annotation.JsonSubTypes;

public final class PaymentExample {
  @JsonSubTypes(
      property = "kind",
      value = {
        @JsonSubTypes.Type(value = CardPayment.class, name = "card"),
        @JsonSubTypes.Type(value = BankTransfer.class, name = "bank_transfer")
      })
  public interface Payment {}

  public static final class CardPayment implements Payment {
    public String lastFour;
  }

  public static final class BankTransfer implements Payment {
    public String iban;
  }

  public static void main(String[] args) {
    ForyJson json = ForyJson.builder().build();

    CardPayment card = new CardPayment();
    card.lastFour = "4242";

    String text = json.toJson(card, Payment.class);
    Payment copy = json.fromJson(text, Payment.class);

    System.out.println(text);              // {"kind":"card","lastFour":"4242"}
    System.out.println(copy.getClass());   // class PaymentExample$CardPayment
  }
}
```

按声明的 `Payment` 类型序列化时，Fory JSON 会启用其子类型表。读取时，`kind` 必须匹配 `card` 或 `bank_transfer`，未知名称会被拒绝。对于容器，`TypeRef<List<Payment>>` 会为每个元素携带相同的声明基类型。[注解指南](/docs/json/annotations)还介绍了其他包装表示方式和完整校验规则。

## JDK、Android 与 GraalVM Native Image 支持

同一个 `fory-json` artifact 支持 Java 8 及更高版本；Java record 需要 Java 17 或更高版本。

在 Android API 26+ 上，由于运行时编译不可用，Fory JSON 会自动使用解释执行的对象映射。Fory 注解处理器可以为 `JsonType` 类和 Mixin 生成直接模型访问代码以及精确的 R8 规则。

GraalVM Native Image 提供独立的构建期集成。使用 `JsonType` 标记可达模型后，构建过程可以准备其访问元数据。要让某个 `ForyJson` 配置在原生可执行文件中使用生成的编解码器，请通过一个可达的 `ForyJsonProvider` 暴露构建完成的配置。其他已准备的配置仍使用解释执行编解码器。

因此，应用可以在 JVM、Android 和原生可执行文件中复用同一套映射模型，并根据每种运行环境的代码生成能力选择执行方式。

## 面向不可信 JSON 的安全控制

高性能解析器同样需要严格的类型边界。Fory JSON 只会反序列化为应用声明的类型；JSON 输入无法选择任意 Java 类。Fory JSON 采用封闭多态：`JsonSubTypes` 声明定义一组完整且有限的允许子类型，输入只能选择表中的逻辑名称。Fory JSON 还会始终应用固定的类型禁止列表，并提供 `JsonTypeChecker` 供应用定义允许列表。这些控制共同避免开放多态反序列化根据不可信 JSON 选择并实例化任意类。

输入深度默认为 20。另有一项独立的对象图内存限制，默认每次根读取最多 128 MiB，用于估算数组、集合、Map、record 和应用对象所创建并保留的对象图。`JsonValidator` 方法可以在对象映射完成后执行领域规则校验。

这些控制不能取代 HTTP 请求体大小限制、身份认证、授权、超时或端点专属校验。它们为 JSON 层提供清晰边界，以便与外部控制配合使用。[Fory JSON 安全指南](/docs/json/security)详细介绍了对象图计量模型和推荐的负向测试。

## Fory JSON 与二进制序列化如何选择

当应用必须交换标准 JSON，例如用于公共 API、浏览器客户端、配置、日志或现有 JSON 集成时，应选择 Fory JSON。它在保持格式互操作性的同时，为 Java 提供基于生成编解码器和可复用状态设计的高性能实现。

如果通信双方都可以使用二进制协议，并且应用需要 JSON 无法表达的能力，例如跨语言 Schema 元数据、共享引用标识或循环对象图，则应选择 Fory 的二进制对象序列化。两种格式解决不同问题，也可以在同一服务中共存。

## 了解更多

评估 Fory JSON 时，可以在实际模型和 JDK 配置下，将一条具有代表性的 Jackson 或 Gson 往返路径替换为 Fory JSON，复用同一个 `ForyJson` 实例进行基准测试。公开结果展示了潜在的性能提升空间，应用自身的负载决定了其中有多少能够转化为实际收益。

- 阅读 [Fory JSON 概览](/docs/json/)。
- 运行 [快速开始示例](/docs/json/getting-started)。
- 查看 [完整的 `jvm-serializers` MediaContent 基准测试](/docs/benchmarks/json/java/)。
- 阅读 [1000 KB 基准测试及更广泛的对比矩阵](https://github.com/fabienrenaud/java-json-benchmark/pull/129)。
- 在 [apache/fory](https://github.com/apache/fory) 参与开发。

Fory JSON 在保持标准 JSON 互操作性的同时，为 Java 服务提供高性能实现。
