---
title: 注解
sidebar_position: 4
id: annotations
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

Fory JSON 在 `org.apache.fory.json.annotation` 中提供以下映射和验证注解：`JsonAnyGetter`、`JsonAnyProperty`、`JsonAnySetter`、`JsonBase64`、`JsonCodec`、`JsonCreator`、`JsonFormat`、`JsonIgnore`、`JsonProperty`、`JsonPropertyOrder`、`JsonRawValue`、`JsonSubTypes`、`JsonUnwrapped`、`JsonValidator` 和 `JsonValue`。`JsonType` 是独立的构建期模型标记。这些属于 Fory JSON API，不是 Jackson、Gson 或 Fory 二进制协议兼容注解。

`JsonType` 不会被继承，因此每个需要参与平台构建流程且符合要求的具体模型都必须单独标注。Java 源码需要使用 `fory-annotation-processor`。未标注的普通 Java 类仍可使用反射；在 Android 上，它们需要由应用编写精确 R8 规则。经过 Android 脱糖处理的 Record 必须直接声明 `JsonType`，或使用已编译的精确 `JsonMixin` 配对。在 Native Image 之外，直接标注的 Java 模型如果使用默认对象编解码器却未运行注解处理器，会在创建编解码器时失败。

Kotlin/JVM 模型使用 Kotlin JSON 模块。平台设置见 [Kotlin 指南](kotlin.md)、[GraalVM 指南](graalvm.md)和 [Android 指南](android.md)。

## Kotlin 注解使用位置 {#kotlin-use-site-targets}

Kotlin 注解与对应 Java 字段、访问器或选定构造函数参数合并为同一个逻辑属性。请显式指定使用位置，避免依赖 Kotlin 的默认目标策略：

| Kotlin 使用位置 | 逻辑声明 |
| ------------ | ---------------------------------------------- |
| `@field:` | 后备字段 |
| `@get:` | getter |
| `@set:` | setter |
| `@param:` | 选定构造函数的参数 |
| `@setparam:` | 支持参数注解的 setter 值参数 |

不支持 `@property:`，因为 Fory JSON 注解不以 Kotlin 专有的属性元数据为目标。`@setparam:JsonProperty` 会被拒绝，因为 setter 参数命名不属于 JSON 属性名契约。`@setparam:JsonIgnore`、`@setparam:JsonCodec` 和 `@setparam:JsonUnwrapped` 作用于对应的单参数 setter 属性，也直接支持有效的 `@set:JsonCodec`。

当显式值一致时，`JsonProperty` 的各成员分别合并；名称、索引或包含策略冲突会导致失败。`JsonIgnore` 的读写方向按单调规则合并，重复的 `JsonCodec` 声明必须完全一致。Mixin 的替换或移除先于合并执行。符合 Kotlin 习惯的示例见 [Kotlin](kotlin.md#annotations-and-use-site-targets)。

## Mixin

使用 JSON Mixin，无需修改目标类即可为其应用 Fory JSON 映射和校验注解：

```java
import org.apache.fory.json.ForyJson;
import org.apache.fory.json.annotation.JsonMixin;
import org.apache.fory.json.annotation.JsonProperty;
import org.apache.fory.json.annotation.JsonUnwrapped;

@JsonMixin(target = ThirdPartyUser.class)
abstract class ThirdPartyUserMixin {
  @JsonProperty("user_id")
  long id;

  @JsonUnwrapped(prefix = "address_")
  Address address;
}

ForyJson json = ForyJson.builder().registerMixin(ThirdPartyUserMixin.class).build();
```

Mixin 源必须是具名抽象类或接口，不能是局部类或匿名类，不能扩展或实现其他类型，也不会被实例化。
其中带注解的字段、方法、构造函数和参数用于选择精确目标上的既有声明。所有 Java 类型、值、访问方式和
构造过程仍由目标类所有。为基类注册的 Mixin 不会影响子类，为接口注册的 Mixin 也不会影响其实现类。

源可以应用上面列出的任意映射或校验注解。在匹配的源声明上添加注解，会整体替换目标上同类型的注解，
而不会合并各个注解成员。Mixin 不能添加或移除 `JsonType`。

如果不希望目标上的某个注解在当前配置中生效，请使用 `JsonMixinRemove`：

```java
import org.apache.fory.json.annotation.JsonMixin;
import org.apache.fory.json.annotation.JsonMixinRemove;
import org.apache.fory.json.annotation.JsonRawValue;

@JsonMixin(target = ThirdPartyMessage.class)
abstract class QuotedMessageMixin {
  @JsonMixinRemove(JsonRawValue.class)
  String body;
}
```

即使仅移除注解，源选择器也必须恰好匹配一个目标声明。在同一构建器上为相同目标注册不同的 Mixin，
会替换先前的注册；重复注册同一源不会产生副作用。每次 `build()` 都会对当前“最后注册者生效”的映射
创建快照，因此之后修改构建器不会改变已经存在的 `ForyJson`。空源本身不执行任何操作；若随后为同一
目标注册空源，则会清除先前的源。

Mixin 提供的 `JsonCodec` 会成为目标的有效注解。精确的 `registerCodec` 注册仍具有更高优先级，
而有效的类型注解优先于内置映射。

在 Android 上，纯 Java Mixin 配对需要 `fory-annotation-processor`，涉及 Kotlin 的配对需要 `fory-json-kotlin-ksp`。Kotlin 源码中的 Mixin 若为 Java sealed 目标添加推导式 `JsonSubTypes`，则需要两个处理器，并且必须在 JDK 17 或更新版本上编译。详情见上方平台指南。

## `JsonProperty`

`JsonProperty` 配置一个完整逻辑属性的规范名称、序列化索引和 null 包含策略。字段、getter 或 setter
上的注解会应用于合并后的字段/getter/setter 属性组。

```java
import org.apache.fory.json.annotation.JsonProperty;

public final class User {
  @JsonProperty("user_id")
  private long id;

  @JsonProperty(include = JsonProperty.Include.ALWAYS)
  private String displayName;

  @JsonProperty(index = 10)
  private String email;

  public long getId() {
    return id;
  }

  public void setId(long id) {
    this.id = id;
  }
}
```

支持以下包含策略：

- `DEFAULT`：使用 `ForyJsonBuilder.writeNullFields`。
- `ALWAYS`：即使选中的值为 null，也写入该属性。
- `NON_NULL`：省略 null 值。

包含策略只影响写入。对于没有写入来源、仅供创建器使用的属性，非默认包含策略无效。可以重复相同声明；
同一逻辑属性中相互冲突的显式名称、索引或非默认包含策略会被拒绝。规范化为同一最终 JSON 名称的两个
属性也会被拒绝。

`index` 控制相对序列化顺序。有索引的属性会按索引升序写在无索引属性之前。索引必须为非负数，允许不连续，
且在可写属性中必须唯一。`-1` 表示未指定，更小的值无效。不能为仅有 setter、仅供创建器使用或忽略写入的
属性指定索引。

不支持 `NON_EMPTY`、别名、格式化以及相互独立的读写名称。`JsonProperty` 不能与 Any 逻辑属性组合，
也不能声明在 `JsonAnySetter` 上。

## `JsonPropertyOrder`

`JsonPropertyOrder` 将具名序列化前缀、属性索引和按最终名称的字母顺序排序结合起来：

```java
import org.apache.fory.json.annotation.JsonProperty;
import org.apache.fory.json.annotation.JsonPropertyOrder;

@JsonPropertyOrder(value = {"id", "display_name"}, alphabetic = true)
public final class User {
  @JsonProperty(index = 20)
  public String name;

  @JsonProperty(value = "display_name", index = 10)
  public String displayName;

  public long id;
  public int age;
  public String address;
}
```

输出顺序依次为 `id`、`display_name`、`name`、`address` 和 `age`。具名前缀最先写入，剩余的有索引属性
按索引升序写入；`alphabetic = true` 会按最终 JSON 名称对其余无索引属性排序。未启用 `alphabetic` 时，
这些属性保持原有相对顺序。不需要具名前缀时，请使用 `@JsonPropertyOrder(alphabetic = true)`。
字母比较采用 Java 自然的、区分大小写的 String 顺序，与区域设置无关。

顺序条目会先匹配最终 JSON 名称，再匹配 Java 逻辑属性名称。仅当 `alphabetic` 为 true 时列表才可以为空。
每个条目必须非空，并对应唯一的可写属性；构建对象元数据时，未知或重复条目会导致失败。

子类声明会整体替换父类的两项设置。如果子类没有声明，则使用最近父类的声明，并针对子类属性进行解析。
接口声明不参与处理。排序只影响序列化；反序列化仍按名称进行，子类型判别字段仍位于用户属性之前。

展开的属性组同样占据一个位置，通过该组的 Java 逻辑属性名称选择。其子成员保持相邻，并保留子对象自身的顺序。

启用写入的 `JsonAnyProperty` 或 `JsonAnyGetter` 会作为一个位置参与排序，并以其 Java 逻辑属性名称标识。
该位置按 Map 迭代顺序输出所有动态条目：

```java
import java.util.Map;
import org.apache.fory.json.annotation.JsonAnyProperty;
import org.apache.fory.json.annotation.JsonPropertyOrder;

@JsonPropertyOrder({"id", "properties", "timestamp"})
public final class Event {
  public String id;

  @JsonAnyProperty
  public Map<String, Object> properties;

  public long timestamp;
}
```

如果 `properties` 包含 `x` 和 `y`，输出顺序为 `id`、`x`、`y`，最后是 `timestamp`；不会写入名为
`properties` 的成员。命名策略不会转换 Any 的排序名称。仅用于输入的 Any 字段和 `JsonAnySetter` 没有
写入位置。动态键不能列入 `JsonPropertyOrder`，字母顺序也不会对 Map 内部的条目排序。

## 属性命名策略

为没有显式非空 `JsonProperty` 名称的逻辑属性配置命名风格：

```java
import org.apache.fory.json.PropertyNamingStrategy;

ForyJson json =
    ForyJson.builder()
        .withPropertyNamingStrategy(PropertyNamingStrategy.SNAKE_CASE)
        .build();
```

默认的 `LOWER_CAMEL_CASE` 会保留发现的 Java 逻辑属性名称。`SNAKE_CASE` 会处理首字母缩写和数字边界，
例如：

- `userName` 变为 `user_name`；
- `URLValue` 变为 `url_value`；
- `version2FA` 变为 `version2_fa`。

非空的 `@JsonProperty("...")` 值、参数局部创建器名称、子类型判别属性和动态 Any 键本身已经是 JSON
名称，因此不会被转换。

## `JsonIgnore`

`JsonIgnore` 以字段为目标，用于控制完整逻辑属性的读写方向：

```java
import org.apache.fory.json.annotation.JsonIgnore;

@JsonIgnore(ignoreRead = false, ignoreWrite = true)
private String serverManagedValue;
```

两个标志默认为 true。同名 getter 或 setter 无法恢复已忽略的方向，`JsonProperty` 也不能覆盖该设置。
Fory core 的 `Expose` 注解对 Fory JSON 无效。

## `JsonValue`

`JsonValue` 选择一个精确的 `String` 字段或无参数 public 方法，作为所属类型的完整 JSON 表示。
Fory 不再写入所属对象的属性，而是将选中的值作为普通 JSON 字符串写入，并使用引号和常规转义：

```java
import org.apache.fory.json.annotation.JsonCreator;
import org.apache.fory.json.annotation.JsonValue;

public final class UserId {
  private final String value;

  @JsonCreator
  public UserId(String value) {
    this.value = value;
  }

  @JsonValue
  public String value() {
    return value;
  }
}
```

`json.toJson(new UserId("user-1"))` 返回 `"user-1"`。该方法不必采用 JavaBean getter 名称，但必须是
public、非 static、无参数的方法，并且返回类型必须恰好为 `String`；字段则必须是符合条件的非 static
实例字段。每个类型只能有一个有效的值成员。没有注解的方法重写会屏蔽继承的声明。

`JsonValue` 可独立控制序列化。反序列化还需要一个 `JsonCreator` 构造函数或 public static 工厂方法：
它必须恰好有一个 `String` 参数，`JsonCreator.value()` 必须为空，且该参数不能标注 `JsonProperty`。
Fory 会将这种形式识别为反向 String 构造器，无需指定创建器模式。现有的属性列表形式和参数局部创建器形式
保持不变。若缺少匹配的创建器，写入仍可正常工作，但读取所属类型时会给出明确错误。

值为 null 的所属对象会直接按 JSON `null` 读写，不会调用值成员或创建器。非 null 所属对象的值成员若返回
null，也会写为 JSON `null`。`JsonValue` 不会改变 Map 键的编码方式。

## `JsonRawValue`

`JsonRawValue` 标记一个固定的普通 `String` 属性。Fory 会在值的位置直接写入该 String，不添加引号，
也不进行转义、解析或校验：

```java
import org.apache.fory.json.annotation.JsonRawValue;

public final class Response {
  public int status;

  @JsonRawValue
  public String body;
}
```

当 `status = 200` 且 `body = "{\"id\":1}"` 时，输出包含 `{"status":200,"body":{"id":1}}`。
原始 String 可以是任意完整 JSON 值，包括对象、数组、数字、布尔值、带引号的 JSON 字符串或 `null` 标记。

该注解是仅用于可信内容的只写旁路机制。无效内容或攻击者可控内容可能使外围输出失效或改变其结构。Java null
仍遵循属性的常规包含策略；如果包含，则写为 JSON `null`。

读取仍按普通 String 属性处理。例如，`{"body":"text"}` 可以填充该字段，但无法将
`{"body":{"id":1}}` 这样的对象读回该字段。`JsonRawValue` 不是类型使用注解，不适用于容器元素或
Map 值。它不能放在 setter、创建器参数或 Any 声明上，也不能与 `JsonCodec` 出现在同一次属性声明中。
作为声明位置局部的表示方式，即使值类型具有构建器精确注册的编解码器，它仍会保持原始 String 形式。

`JsonRawValue` 不会收集未知的同级字段。除非已有 `JsonAnyProperty` 或
`JsonAnyGetter`/`JsonAnySetter` 所有者捕获这些字段，否则未知字段会被跳过。原始值功能和 Any 属性功能
彼此独立。

`JsonValue` 和 `JsonRawValue` 可以组合在同一个 String 成员上，将所属对象写为可信的原始根值。
这种组合仅支持序列化：普通的单 String 参数 `JsonCreator` 无法将输入对象或数组转换为 String。

## `JsonBase64`

`JsonBase64` 为一个精确的 `byte[]` 字段或 getter 选择带引号的标准 Base64 JSON 字符串表示：

```java
import org.apache.fory.json.annotation.JsonBase64;

public final class Attachment {
  @JsonBase64
  public byte[] content;
}
```

字节 `{1, 2, 3}` 会写为 `{"content":"AQID"}`，并可解码回原始数组。Fory 会将 Base64 字符直接写入
JSON 输出，也会直接从 JSON 输入解码，不创建中间 String。标准 Base64 填充会被保留。Java null 遵循
属性的常规包含规则，从 JSON null 读取时也得到 null。

该注解不是类型使用注解，不会改变普通的未标注 `byte[]` 属性、容器元素或 Map 值。它不能与
`JsonRawValue`、声明位置上的 `JsonCodec`、`JsonFormat` 或 Any 声明共用于同一逻辑属性。等效的显式
编解码器为 `@JsonCodec(Base64ByteArrayCodec.class)`。

## `JsonFormat`

在日期/时间字段上使用 `JsonFormat`，可为读写两个方向选择 JSON 文本格式。格式采用
`DateTimeFormatter` 语法和根语言环境：

```java
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.apache.fory.json.annotation.JsonFormat;

public final class Schedule {
  @JsonFormat(pattern = "dd/MM/uuuu")
  public LocalDate day;

  @JsonFormat(pattern = "dd/MM/uuuu")
  public Optional<LocalDate> optionalDay;

  @JsonFormat(pattern = "dd/MM/uuuu")
  public List<LocalDate> days;

  @JsonFormat(pattern = "dd/MM/uuuu")
  public Map<String, LocalDate> daysByName;

  @JsonFormat(pattern = "uuuu-MM-dd HH:mm:ss XXX", timezone = "Asia/Shanghai")
  public Instant timestamp;
}
```

对于 `day = LocalDate.of(2024, 1, 2)`，该属性会写为 `"day":"02/01/2024"`，相同文本也会读回该日期。
字段值属于受支持的日期/时间类型时，该注解会应用于字段值。对于一层直接包装，它可应用于数组或集合元素、
`AtomicReferenceArray` 元素、`Optional` 或 `AtomicReference` 的内容值，以及 Map 值。其中包括 `List`、
`Set` 及其具体 `Collection` 实现。null 的处理仍遵循属性的常规包含规则。

支持的值必须恰好是 `LocalDate`、`LocalTime`、`LocalDateTime`、`Instant`、`ZonedDateTime`、`Year`、
`YearMonth`、`MonthDay`、`OffsetTime`、`OffsetDateTime`、`HijrahDate`、`JapaneseDate`、`MinguoDate`
或 `ThaiBuddhistDate` 类型。`Instant` 使用 UTC；带时区和偏移量的类型使用值自身携带的时区或偏移量。
格式必须包含足以重建声明类型的信息。

将 `timezone` 设为有效的 `ZoneId` 标识符，即可在指定时区格式化和解析 `Instant`、`ZonedDateTime` 或
`OffsetDateTime`。例如，上面的 `timestamp` 字段会将 `Instant.parse("2024-01-02T03:04:05Z")` 写为
`"2024-01-02 11:04:05 +08:00"`。对于匹配的时区文本，解析后的值保持同一时刻。解析期间，配置的时区会
补充缺失的时区或偏移量信息；JSON 文本中的显式时区或偏移量会参与常规 `DateTimeFormatter` 解析。
如果必须在夏令时重叠期间保留精确时刻，请在格式中包含偏移量。省略 `timezone` 时保留上述默认行为。
无效的时区标识符，以及在其他受支持日期/时间类型上使用非空 `timezone`，都会被拒绝。

`JsonFormat` 是字段注解，而不是类型使用注解。Record 组件通过其生成字段生效。嵌套包装、Map 键、
原始类型或通配符直接子元素、JSON Any 值以及展开值会被有意拒绝。不支持格式化语义模糊的类型，包括
旧版和 SQL 日期类型、`Duration`、`Period`、`TimeZone`、`ZoneId` 和 `ZoneOffset`。具有完整注册表示、
注解选择表示、多态表示或 `JsonValue` 表示的包装类型也会被拒绝，因为这些表示方式拥有整个包装对象。
`JsonFormat` 不能与 `JsonCodec`、`JsonBase64`、`JsonRawValue`、`JsonAnyProperty`、`JsonUnwrapped` 或
`JsonValue` 共用于同一字段。

## `JsonUnwrapped`

使用 `JsonUnwrapped` 可将对象值属性的成员直接放入外围 JSON 对象：

```java
import org.apache.fory.json.annotation.JsonUnwrapped;

public final class Person {
  public int age;

  @JsonUnwrapped(prefix = "name_")
  public Name name;
}

public final class Name {
  public String first;
  public String last;
}
```

这会将 `Person` 映射为 `{"age":18,"name_first":"Ada","name_last":"Lovelace"}`。可选的前缀和后缀
会应用于每个子属性经 `JsonProperty` 和已配置命名策略处理后的最终 JSON 名称。嵌套展开属性会从内向外
组合这些转换。

null 子对象不会写入任何成员。读取时，Fory 只有在遇到至少一个展开成员后才会创建并赋值该子对象。
因此，完全缺失的属性组会保留可变父对象的初始化值；Record 或创建器参数则保持常规的缺失属性默认值。
对于部分输入，子对象的其他属性使用普通默认值完成构造。

可变类、Record 和 `JsonCreator` 类都可以作为父对象或子对象。参数局部创建器参数可以声明只读展开组；
其必需的 `JsonProperty` 值用于命名 Java 创建器参数，不会被接受为 JSON 包装名称。允许参数化父类型，
但每个展开子对象和中间对象都必须是使用 Fory 标准对象映射的精确原始非泛型类。

展开组在父对象的写入顺序中占据一个位置。可以使用 `JsonProperty.index` 定位它，`JsonPropertyOrder`
则通过 Java 逻辑属性名称选择它。子对象自身的属性顺序保持不变。匹配顺序依次为父字段、展开字段和动态
Any 处理。

Fory 会拒绝重复的最终名称、仅由展开属性构成的递归链、参数化子对象、JSON Any 子对象、多态或自定义
编解码器子对象根，以及标量、数组、集合或 Map 子对象。若要展开 Map，请使用 `JsonAnyProperty`、
`JsonAnyGetter` 或 `JsonAnySetter`。展开属性不能使用 `JsonProperty.value`、非默认的
`JsonProperty.include`、`JsonCodec` 和 `JsonFormat`；普通子叶属性仍可使用这些配置。

## 动态对象成员

如果要使用 `JsonAnyProperty` 让一个 `Map<String, V>` 字段保存其他未知 JSON 成员，该 Map 会展开到
外围对象中，而不是出现在字段名称之下：

```java
import java.util.LinkedHashMap;
import java.util.Map;
import org.apache.fory.json.annotation.JsonAnyProperty;

public final class Event {
  public String id;

  @JsonAnyProperty
  public Map<String, Object> properties = new LinkedHashMap<>();
}
```

当 `properties` 包含 `"source" -> "mobile"` 时，Fory 会写入 `{"id":"7","source":"mobile"}`，
而不是嵌套的 `properties` 成员。未知输入成员会插入 Map。该字段默认可读可写；`JsonIgnore` 可以只启用
一个方向：

```java
import org.apache.fory.json.annotation.JsonIgnore;

@JsonAnyProperty
@JsonIgnore(ignoreRead = true, ignoreWrite = false)
public Map<String, Object> outputOnly;
```

读取时会复用现有 Map。非 final 的 null 字段会在遇到第一个未知成员时初始化。普通可变对象上的可读 final
字段必须已经包含可变 Map。Record 和属性列表形式的 `JsonCreator` 类型则通过构造参数接收累计得到的 Map。
如果不存在未知成员，Fory 不会初始化 null 字段。

使用 `JsonAnyGetter` 和 `JsonAnySetter` 可通过方法实现写入和读取：

```java
import java.util.LinkedHashMap;
import java.util.Map;
import org.apache.fory.json.annotation.JsonAnyGetter;
import org.apache.fory.json.annotation.JsonAnySetter;

public final class Event {
  private final Map<String, Object> properties = new LinkedHashMap<>();

  @JsonAnyGetter
  public Map<String, Object> getProperties() {
    return properties;
  }

  @JsonAnySetter
  public void putProperty(String name, Object value) {
    properties.put(name, value);
  }
}
```

any-getter 必须是无参数、返回 `Map<String, V>` 的 public 实例方法。any-setter 必须是签名为
`void method(String, V)` 的 public 实例方法。两种方法均可单独使用。配对使用时，其解析后的值类型必须在
基本类型装箱后相同。any-setter 的基本类型值参数会拒绝 JSON null。Record 或使用 `JsonCreator` 的类型
不支持 any-setter。

Record 组件上启用读取的 `JsonAnyProperty` 会使用未知输入成员为该组件赋值。在属性列表形式的
`JsonCreator` 模式中，启用读取的 Any 字段必须对应一个列出的创建器参数；参数局部创建器模式不能绑定
字段注解。只写 Any 字段或 any-getter 不能占用创建器参数。如果只写 Any 字段或 any-getter 声明了某个
Record 组件，读取时该组件会得到常规 Java 默认值。

any-getter 会声明其 Java 逻辑属性：`getProperties()` 和 `properties()` 都声明 `properties`。同名字段、
普通 getter 或普通 setter 不会再映射为固定成员。Fory 不会推断名称不同的后备字段，因此如果该字段不应
单独映射，请使用 `JsonIgnore` 标注。`JsonAnySetter` 没有逻辑属性名称，也不会声明后备字段。

Any 逻辑名称仅用于属性分组和 `JsonPropertyOrder`，它本身并不是固定 JSON 成员。具有该名称的输入成员
属于普通动态条目，而非嵌套聚合；只要不与其他固定属性冲突，同名动态输出键仍然有效。

一个有效类型层次结构只能使用一个 `JsonAnyProperty` 字段，或者最多一个有效 `JsonAnyGetter` 和一个有效
`JsonAnySetter`；两种形式不能混用。没有注解的方法重写会禁用继承的方法注解。字段模式下不能使用基于方法
的 Any 注解。Any setter 以及被 Any 字段或 getter 声明的逻辑属性的所有成员都不能使用 `JsonProperty`。
同名字段不能通过 `JsonIgnore` 禁用 any-getter 的写入方向，其 `ignoreRead` 标志也不会禁用独立的
any-setter。

动态键就是精确的 JSON 成员名称，并保留 Map 迭代顺序。null Map 不写入任何成员；无论固定属性的 null
设置如何，null Map 值都会写为 JSON null。null 输出键和非 String 输出键会被拒绝。原始 Map、通配符键、
未解析键以及非 String 键类型均无效。已声明的固定成员（包括禁止读取的成员）不会交给 Any 输入处理。
与固定属性冲突的输出键会被拒绝。Fory 不会检查 Any Map 中是否存在与内联子类型判别字段重复的键；
这种键会写出重复的 JSON 成员。应用必须确保动态键与当前判别字段不同。重复的未知输入名称会替换先前的
Map 值，而 any-setter 会针对每次出现都被调用。转义的输入名称会先解码再交付。

## `JsonCreator`

对于具有一个 public 构造函数或 public static 工厂方法的不可变类，请使用 `JsonCreator`。创建器构成完整
的读取 Schema；未被其选中的普通属性只能写入，构造完成后也不会调用 setter。

紧凑形式按参数顺序列出现有 Java 逻辑属性名称，并复用其规范化后的 JSON 元数据：

```java
import org.apache.fory.json.annotation.JsonCreator;

public final class User {
  public final long id;
  public final String name;

  @JsonCreator({"id", "name"})
  public User(long id, String name) {
    this.id = id;
    this.name = name;
  }
}
```

参数局部形式为每个参数提供显式 JSON 名称，也可以引入仅供创建器读取的输入属性：

```java
@JsonCreator
public static User create(
    @JsonProperty("user_id") long id,
    @JsonProperty("display_name") String name) {
  return new User(id, name);
}
```

参数局部名称不会经过命名策略处理。两种模式不能混用。紧凑模式下，名称必须非空且唯一，名称数量必须
等于参数数量，并且参数不能同时声明 `JsonProperty`。参数局部模式下，每个参数都必须具有非空且唯一的
`JsonProperty` 名称。

对于带有 `JsonValue` 的类型，空形式还接受恰好一个 `String` 参数，且该参数未标注 `JsonProperty`，
并从其 JSON 字符串重建所属值。这种值形式与两种基于属性的形式都不同，且仅因目标具有 `JsonValue`
而被推断出来。

创建器必须至少有一个参数，且不能使用可变参数或泛型。构造函数必须是 public。工厂方法必须是 public
且 static，其精确返回类型必须声明为目标类，并返回非 null 值，且该值的运行时类必须恰好是目标类。
缺失的引用参数使用 null，缺失的基本类型参数使用 Java 零值，重复成员采用最后一个值；基本类型参数若
显式接收 null 则会被拒绝。Record 不能声明基于属性的 `JsonCreator`；带有 `JsonValue` 的 Record 可以在
其单 String 参数的规范构造函数上标注值形式。

## `JsonValidator`

如果应用校验必须在对象完成构造和填充后运行，请使用 `JsonValidator`：

```java
import org.apache.fory.json.annotation.JsonValidator;

public final class Account {
  public String id;
  public long balance;

  @JsonValidator
  public void validate() {
    if (id == null || id.isEmpty()) {
      throw new IllegalArgumentException("id must not be empty");
    }
    if (balance < 0) {
      throw new IllegalArgumentException("balance must not be negative");
    }
  }
}
```

校验器必须是无参数、返回 `void` 的 public 实例方法。该方法可以声明异常。每个有效校验器都会在所属对象
完成后恰好运行一次，包括由 `JsonCreator` 创建的对象、Record、嵌套对象、展开对象和选中的子类型。
JSON null 值不会调用校验器。一个类若有多个校验器，其相对顺序未指定，并会在第一次失败时停止校验。
`JsonValidator` 没有索引或排序成员。

Fory JSON 准备类型时会拒绝无效的校验器声明。`Error` 会直接传播；其他所有校验器调用失败都会报告为
`ForyJsonException`，并保留原始原因。`JsonCreator` 构造函数或工厂也可以在构造期间执行校验；如果创建器
已经强制执行完整不变量，请省略 `JsonValidator`。

Mixin 可以为精确目标上匹配的 public 方法添加校验：

```java
import org.apache.fory.json.annotation.JsonMixin;
import org.apache.fory.json.annotation.JsonValidator;

@JsonMixin(target = ThirdPartyAccount.class)
abstract class ThirdPartyAccountMixin {
  @JsonValidator
  public abstract void checkValid();
}
```

Mixin 方法采用与其他 Mixin 方法相同的精确方法签名匹配规则。若要在某项配置中移除目标校验器，请在匹配
的 Mixin 方法上添加 `@JsonMixinRemove(JsonValidator.class)`。没有注解的重写方法是有效声明，不会继承
被重写方法上的校验器注解。

`JsonValidator` 适用于 Fory JSON 的默认对象映射。精确注册的编解码器、完整的类型级 `JsonCodec` 或完整
的 `JsonValue` 表示必须自行执行所需校验。

在 Android 上，应使用 `JsonType` 和 Fory 注解处理器编译直接标注校验器的模型。Mixin 提供的校验器会
使用该精确 Mixin-目标配对的处理器输出。GraalVM Native Image 会发现直接的 `JsonType` 或已注册 Mixin，
并在不使用注解处理器输出的情况下准备其有效校验器。两个平台都不需要应用为校验器配置反射。

## `JsonSubTypes`

`JsonSubTypes` 为接口或抽象类声明有限的子类型表。非空 `value` 即完整的显式表，每个条目包含一个区分大小写的逻辑 JSON 名称，并且恰好指定一个可信 Java 类型来源：

- `value = Circle.class`；或者
- 使用精确 Java 二进制名称的 `className = "com.example.shape.Circle"`。

当 API JAR 不能依赖实现 JAR 时，`className` 很有用。构建子类型表时，它由固定的构建器类加载器解析。
JSON 输入绝不会提供 Java 类名，也无法添加条目。不支持构建后的子类型注册和开放式子类型发现。

将 `value` 留空即可推导 sealed 层次结构：

```java
@JsonSubTypes(property = "kind")
public sealed interface Shape permits Circle, Polygon {}

public final class Circle implements Shape {}

public sealed interface Polygon extends Shape permits Rectangle {}

public final class Rectangle implements Polygon {}
```

Fory 递归遍历 sealed 抽象类和接口，以源码中的简单名称添加每个具体类，包括本身也是 sealed 的具体类，并继续遍历具体 sealed 类的子类型。具体的 open 或 non-sealed 类仅作为一个精确条目加入，不包含其后代。开放抽象类或接口会导致推导失败，因为该分支不是封闭的。重复名称和逻辑名称哈希冲突也会失败。推导出的名称属于编码名称，不受属性命名策略转换。

Java sealed 类型要求 JDK 17 或更新版本。在 Android 上，Java sealed 推导还需要 `fory-annotation-processor`，启用代码压缩的 Kotlin 模型需要 `fory-json-kotlin-ksp`。如果 Kotlin 源码中的 Mixin 为 Java sealed 目标添加推导，则需要两个处理器。Scala 3 sealed 类型使用 `derives ScalaJsonCodec` 或 builder 推导；不推导 Scala 2 sealed trait 和类。

默认的 `PROPERTY` 包含方式会将内联判别字段写为第一个输出成员：

```java
import org.apache.fory.json.annotation.JsonSubTypes;

@JsonSubTypes(
    property = "kind",
    value = {
      @JsonSubTypes.Type(value = Circle.class, name = "circle"),
      @JsonSubTypes.Type(
          className = "com.example.shape.Rectangle",
          name = "rectangle")
    })
public interface Shape {}
```

```json
{ "kind": "circle", "radius": 2 }
```

属性形式的输入允许判别字段出现在任意直接对象成员位置，但它必须恰好出现一次、类型为字符串，并命名一个
已配置的子类型。判别属性不经过命名策略处理，也不能与子类型的普通 JSON 属性冲突。属性包含方式要求
子类型使用普通对象表示。

`WRAPPER_OBJECT` 使用一个外层成员：

```java
@JsonSubTypes(
    inclusion = JsonSubTypes.Inclusion.WRAPPER_OBJECT,
    value = {@JsonSubTypes.Type(value = Circle.class, name = "circle")})
public interface Shape {}
```

```json
{ "circle": { "radius": 2 } }
```

`WRAPPER_ARRAY` 恰好使用两个数组元素：

```java
@JsonSubTypes(
    inclusion = JsonSubTypes.Inclusion.WRAPPER_ARRAY,
    value = {@JsonSubTypes.Type(value = Circle.class, name = "circle")})
public interface Shape {}
```

```json
["circle", { "radius": 2 }]
```

配置规则十分严格：

| 包含方式         | `property` | 子类型表示                          |
| ---------------- | ---------- | ----------------------------------- |
| `PROPERTY`       | 必填且非空 | 普通对象成员与判别字段内联          |
| `WRAPPER_OBJECT` | 必须为空   | 完整子类型值位于单成员对象中        |
| `WRAPPER_ARRAY`  | 必须为空   | 完整子类型值作为索引为 1 的数组元素 |

两种包装形式都可以委托给精确的自定义子类型编解码器。三种包含方式都会将 null 写为普通 JSON null；
唯一例外是编解码器优先级为声明的基类型选择了自定义完整值编解码器，从而替代该注解。

基类型必须是接口或抽象类。每个有效条目都必须是唯一、具体且可赋值给基类型的类；序列化仅接受表中的精确成员。在显式表中，列出父类不会隐式允许其后代。注解从声明的基类型自身读取，不会继承另一个已标注接口或抽象类上的注解。读取器仅接受已配置的包含形式；改变包含形式会改变编码格式，不提供同时读取两种形式的回退机制。

选定的顶层基类型授权使用其推导出的静态 sealed 闭包。如果只应开放更小的子集，请使用显式表，或配置 `JsonTypeChecker` 过滤精确的推导候选类型。完整的推导闭包都必须通过固定禁用列表检查。显式表保持精确匹配，条目与 checker 冲突时会失败。

对于 GraalVM Native Image，如果基类型未通过 provider 根类型可达，请为其标注 `JsonType`。可达的 Java、Kotlin 和 Scala 3 sealed Schema 支持空表。显式表必须使用 class literal 条目，不能使用 `className`。
