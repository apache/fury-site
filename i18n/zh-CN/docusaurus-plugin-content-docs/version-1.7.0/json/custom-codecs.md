---
title: 自定义编解码器
sidebar_position: 5
id: custom-codecs
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

`JsonValueCodec<T>` 是 Fory JSON 用于处理单个完整 JSON 值的流式编解码器 SPI。它直接写入
Fory 的 String 或 UTF-8 写入器，并直接从 Fory 的 Latin-1、UTF-16 或 UTF-8 读取器读取。
它不是 JSON 抽象语法树（AST）或 `JsonNode` 编解码器。它负责处理包含 JSON null 在内的完整值，
但绝不处理 Map 键；JSON 对象成员名称仍由 `MapKeyCodec` 负责。

如果应用编解码器在每种表示形式下都采用相同语义，请继承 `AbstractJsonValueCodec<T>`，
只需实现一次 JSON 结构：

```java
import java.math.BigDecimal;
import org.apache.fory.json.codec.AbstractJsonValueCodec;
import org.apache.fory.json.reader.JsonReader;
import org.apache.fory.json.writer.JsonWriter;

public final class MoneyCodec extends AbstractJsonValueCodec<Money> {
  @Override
  public void write(JsonWriter writer, Money value) {
    if (value == null) {
      writer.writeNull();
    } else {
      writer.writeBigDecimal(value.amount);
    }
  }

  @Override
  public Money read(JsonReader reader) {
    return reader.tryReadNullToken() ? null : new Money(reader.readBigDecimal());
  }
}

final class Money {
  final BigDecimal amount;

  Money(BigDecimal amount) {
    this.amount = amount;
  }
}
```

`AbstractJsonValueCodec` 会为每次操作增加一次虚方法调用。对于性能敏感的编解码器，
或者行为依赖具体读取器或写入器的情况，请直接实现 `JsonValueCodec<T>`，并提供全部五个
针对特定表示形式的方法。

```java
import org.apache.fory.json.ForyJson;

ForyJson json =
    ForyJson.builder()
        .registerCodec(Money.class, new MoneyCodec())
        .build();
```

对拥有专用读取/写入操作的类型，不允许精确 `registerCodec` 注册或精确类工厂注册：

- `boolean`、`byte`、`short`、`int`、`long`、`float`、`double` 和 `char`，以及各自的装箱类型
- `String`、`CharSequence`、`Number`、`BigInteger`、`BigDecimal` 和 `UUID`
- `LocalDate`、`LocalTime`、`LocalDateTime`、`Instant`、`Duration`、`ZoneOffset`、`ZonedDateTime`、`Year`、`YearMonth`、`MonthDay`、`Period`、`OffsetTime` 和 `OffsetDateTime`
- `byte[]`、`String[]` 和 `long[]`

该限制仅匹配精确类型，不包括应用子类，也不禁用具体使用位置上的 `JsonCodec`、`JsonFormat` 或其他语义映射。如果这些类型的字段或参数需要不同表示，请使用上述机制。

`ObjectCodec` 实例属于创建它的 resolver，不能直接注册。语言模块需要提供对象模型时，应使用精确的 `JsonCodecFactory`。

当一个工厂负责一组声明类型或参数化类型时，使用 `JsonCodecFactory`：

```java
import org.apache.fory.json.JsonCodecFactory;

JsonCodecFactory factory =
    (type, resolver, runtimeType) ->
        type.getRawType() == Money.class ? new MoneyCodec() : null;

ForyJson json =
    ForyJson.builder()
        .withModule(context -> context.registerCodecFactory(factory))
        .build();
```

可配置工厂必须重写 `factoryKey()`，返回一个确定性值，覆盖所有可能改变生成编解码器类、对象模型或生成操作的选项。默认的工厂类名仅适用于无配置工厂。

仅当工厂在动态写入期间为值的实际类选择编解码器时，`runtimeType` 才为 `true`；声明的根类型和复合子类型收到的是 `false`。复合编解码器如果在构造后仍需此区分，必须保留该标志供后续 `resolveTypes` 调用使用，不能从 resolver 状态推断。

外层属性仍控制其名称、忽略方向和 null 包含策略。如果 null 属性被省略，就不会调用值编解码器。
如果属性会被输出，或者该值是数组元素、集合元素、Map 值、Optional 值或原子引用值，
编解码器就会接收并负责处理 null。注册的实例会在并发操作之间共享，因此必须是线程安全的。

会物化复合对象图所有者的自定义编解码器，在创建每个所有者之前，必须使用应用定义的字节估算值
调用 `JsonReader.reserveGraphMemory`。这适用于复合应用对象、集合、Map 和引用数组。
在可能使集合或 Map 增长的修改操作之前，必须预留其引用存储空间。自定义标量或其他专用叶子表示，
例如上面的 `MoneyCodec`，无需预留对象图内存。完整编解码器还必须自行执行应用校验；
Fory JSON 不会使用目标类型的 `JsonValidator` 方法来包装完整的自定义表示。

为 `JsonSubTypes` 基类注册自定义编解码器，会取代该基类的子类型注解。对于列出的子类型，
两种包装器包含方式支持注册自定义编解码器，但内联属性包含方式不支持。

## 使用 `JsonCodec` 选择编解码器

在类、record、枚举或接口上使用 `@JsonCodec`，可声明其默认的完整值编解码器。
位置参数形式是 `value` 的简写：

```java
import org.apache.fory.json.annotation.JsonCodec;

@JsonCodec(MoneyCodec.class)
public final class Money {}

@JsonCodec(AccountCodec.class)
public interface Account {}

public final class RetailAccount implements Account {}
```

类型声明会通过超类和接口继承，最具体的声明优先。使用同一编解码器的无关声明彼此一致；
使用不同编解码器的无关声明会直接失败，而不是依赖反射顺序。

在字段或实际生效的普通 getter 上，`value` 会替换完整的属性值。实际生效的 setter 值参数、
`JsonCreator` 构造函数或工厂参数同样支持该注解；通过 Java 对字段、访问器和构造函数参数的
注解传播，record 组件也支持该注解：

```java
public final class Invoice {
  @JsonCodec(MoneyCodec.class)
  public Money total;
  private Money tax;
  private Money discount;

  @JsonCodec(MoneyCodec.class)
  public Money getTax() {
    return tax;
  }

  public void setDiscount(@JsonCodec(MoneyCodec.class) Money discount) {
    this.discount = discount;
  }

  @JsonCreator
  public Invoice(@JsonProperty("total") @JsonCodec(MoneyCodec.class) Money total) {
    this.total = total;
  }
}
```

如果标准容器仍应掌控处理流程，只有其直接子项需要自定义编解码器，请使用子成员配置：

```java
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;
import java.util.concurrent.atomic.AtomicReferenceArray;

public final class InvoiceGroup {
  @JsonCodec(elementCodec = MoneyCodec.class)
  public List<Money> items;

  @JsonCodec(elementCodec = MoneyCodec.class)
  public Money[] itemArray;

  @JsonCodec(elementCodec = MoneyCodec.class)
  public AtomicReferenceArray<Money> atomicItems;

  @JsonCodec(contentCodec = MoneyCodec.class)
  public Optional<Money> optional;

  @JsonCodec(contentCodec = MoneyCodec.class)
  public AtomicReference<Money> current;

  @JsonCodec(keyCodec = CurrencyKeyCodec.class, valueCodec = MoneyCodec.class)
  public Map<Currency, Money> byCurrency;
}
```

各子成员的含义如下：

| 成员           | 支持的当前值                                      | 由编解码器处理的直接子项 |
| -------------- | ------------------------------------------------- | ------------------------ |
| `elementCodec` | `Collection<E>`、`E[]`、`AtomicReferenceArray<E>` | `E`                      |
| `contentCodec` | `Optional<T>`、`AtomicReference<T>`               | `T`                      |
| `keyCodec`     | `Map<K, V>`                                       | `K` 对应的 JSON 成员名称 |
| `valueCodec`   | `Map<K, V>`                                       | 直接的 `V` 值            |

### Kotlin 类型使用位置 {#kotlin-occurrences}

Kotlin 使用相同的编解码器注册机制和 `JsonCodec` 注解。请将属性注解放在显式支持的使用位置，例如：

```kotlin
import org.apache.fory.json.annotation.JsonCodec

data class Ledger(
  @field:JsonCodec(value = MoneyCodec::class)
  val total: Money,
  @field:JsonCodec(elementCodec = MoneyCodec::class)
  val entries: List<Money>,
)
```

完整值编解码器负责整个 JSON 值；子编解码器则保留标准数组、集合、Optional/原子类型或 Map 的外层表示。选定应用编解码器后，Kotlin 可空性仍是该类型使用位置的契约：对于非 null JSON token，编解码器必须返回精确的声明类型，并且不得为非空位置返回 null。

无符号类型或符合条件的值类作为 Map 键时，无需注解即可使用内置成员名映射。如果键需要不同的带标签文本表示，请使用显式 `keyCodec` 或完整 Map 编解码器。精确的应用注册仍优先于 Kotlin 模块默认映射。

自定义 Map 键编解码器负责在声明的键与 JSON 成员名称之间转换：

```java
import java.util.Locale;
import org.apache.fory.json.codec.MapKeyCodec;

public final class CurrencyKeyCodec implements MapKeyCodec {
  @Override
  public String toName(Object key) {
    return ((Currency) key).name().toLowerCase(Locale.ROOT);
  }

  @Override
  public Object fromName(String name) {
    return Currency.valueOf(name.toUpperCase(Locale.ROOT));
  }
}
```

使用已移除的类型使用形式的代码，应将编解码器移至所属声明：

```java
// Before
List<@JsonCodec(MoneyCodec.class) Money> items;

// Now
@JsonCodec(elementCodec = MoneyCodec.class)
List<Money> items;
```

`contentCodec` 用于 `Optional` 或 `AtomicReference`，`valueCodec` 用于 Map 值，
而 `elementCodec` 用于数组或 `AtomicReferenceArray` 元素。

`Iterable<E>` 值如果不属于 `Collection<E>`，就不支持 `elementCodec`。如果完整编解码器需要负责
此类值，请使用 `value`。

子项配置有意只深入一层。对于 `List<List<Money>>`，`elementCodec` 处理每个完整的
`List<Money>`；对于 `Money[][]`，它处理每个 `Money[]`。如需自定义更深层的后代，
请为完整的当前值实现编解码器，并通过 `value` 选择它。

`value` 与所有子成员互斥，因为它已经负责完整的当前值。空注解、不受支持的子成员，
或者将外层完整编解码器与子成员组合使用，都会在模型构建期间失败。配置的直接子项必须能
解析为具体类型；原始容器、直接通配符和未解析的直接类型变量均会被拒绝。

`JsonAnyProperty` 和 `JsonAnyGetter` 会将其 Map 展开到外层对象中。使用 `valueCodec`
配置其动态值：

```java
@JsonAnyProperty
@JsonCodec(valueCodec = MoneyCodec.class)
public Map<String, Money> extra;
```

`JsonAnySetter` 的第一个参数是 String 属性名称。其第二个参数可以使用
`@JsonCodec(value = ...)`，也可以使用对该参数自身结构有效的其他配置。

## 编解码器优先级与重复声明

Fory 按以下顺序解析每个当前值：

| 优先级 | 来源                                        |
| -----: | ------------------------------------------- |
|      1 | 当前属性或参数上的 `JsonCodec`              |
|      2 | 精确的 `registerCodec` 注册                 |
|      3 | 应用 Mixin 覆盖后的精确目标类型 `JsonCodec` |
|      4 | 继承边界上的类型 `JsonCodec` 声明           |
|      5 | 内置或默认 JSON 映射                        |

一个逻辑属性可能从字段、getter、setter 参数、creator 参数或 record 注解传播中公开该注解。
重复配置必须完全相同；Fory 不会合并来自不同声明的局部配置。实际生效且未添加注解的覆盖方法，
会抑制继承的方法注解。

子成员只会替换对应的直接子项。未配置的 Map 同级项仍按正常优先级处理。如果精确注册或
类型声明为外层容器提供了完整编解码器，那么属性子成员将不可达，因此会被拒绝。

Map 键是 JSON 对象成员名称，使用 `MapKeyCodec` 而不是 `JsonValueCodec`。自定义键编解码器类
遵循与值编解码器相同的构造规则。null Map 键会被拒绝，解码后的键必须与声明的键类型匹配。

## 编解码器构造与平台支持

注解指定的编解码器类必须是公共、具体的顶层类或静态嵌套类，并拥有公共无参构造函数。构建后的 `ForyJson` 会在所有注解位置和并发操作之间共享同一个实例，因此该实例必须线程安全。对于允许注册的类型，如果完整值编解码器需要配置，请使用 `registerCodec(Target.class, instance)`。

在 GraalVM Native Image 之外，具名 Java 模块必须将编解码器包导出或开放给
`org.apache.fory.json`。Native Image 会在镜像构建期间准备注解编解码器的构造函数，
因此不需要此包访问权限。如果继承的类型声明编解码器用于更具体的目标，则每个解码值都必须
为 null，或者可赋值给该目标。

在 JVM、Android 和 GraalVM Native Image 上，该注解对 FIELD、METHOD 和 PARAMETER
具有相同行为。普通 Android 类可以省略 `JsonType`，并提供等效的精确规则。
经过 Android desugar 的 Record（包括 `JsonValue` Record）需要处理器生成的操作；
这些操作必须来自直接的 `JsonType` 声明或一对已编译的精确 `JsonMixin`。
GraalVM 对象模型遵循 [GraalVM 指南](graalvm.md)中的构建时工作流。
