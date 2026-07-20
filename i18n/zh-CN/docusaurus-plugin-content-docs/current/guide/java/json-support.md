---
title: JSON 支持
sidebar_position: 19
id: json_support
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

Fory JSON 是 Apache Fory 中线程安全的 Java JSON 序列化框架。它通过解释执行和运行时代码生成的 codec，
支持 Java 对象、record、基于 creator 的不可变类、常用 JDK 类型、泛型容器、可处理完整值的自定义
codec，以及通过注解声明的有限多态。

Fory JSON 独立于 Fory 的 native 和 xlang 二进制协议。对于 HTTP API、浏览器流量、日志和配置等需要
互操作的文本载荷，请使用 JSON；如果需要引用标识、循环对象图、跨语言 Schema 元数据或 Fory 独有的
二进制功能，请使用二进制协议。

## 要求与安装

Fory JSON 在标准 JDK、GraalVM Native Image 和 Android 上支持 Java 8 及更高版本；Java record
需要 Java 17 或更高版本。

Fory JSON 已发布到 Maven Central。

Maven：

```xml
<dependency>
  <groupId>org.apache.fory</groupId>
  <artifactId>fory-json</artifactId>
  <version>1.4.0</version>
</dependency>
```

Gradle：

```kotlin
implementation("org.apache.fory:fory-json:1.4.0")
```

请让所有 Fory 模块使用相同版本。

### JDK 25 及更高版本

需要向 Fory core 开放 `java.lang.invoke`。在 classpath 上使用：

```bash
--add-opens=java.base/java.lang.invoke=ALL-UNNAMED
```

在 module path 上使用：

```bash
--add-opens=java.base/java.lang.invoke=org.apache.fory.core
```

Fory JSON 的 JPMS 模块名是 `org.apache.fory.json`。

## 快速开始

创建一个 `ForyJson` 实例并复用它。它是线程安全的，也没有需要关闭的生命周期。

```java
import java.nio.charset.StandardCharsets;
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

    System.out.println(text);
    System.out.println(new String(utf8, StandardCharsets.UTF_8));
    System.out.println(fromText.name + " / " + fromUtf8.name);
  }
}
```

未知的输入属性会被跳过，除非启用了读取的 Any 字段或 any-setter 接收它们。默认省略值为 null 的对象
属性。默认 JSON 成员发现顺序不属于兼容性约定；如果输出成员的顺序必须明确，请使用
`JsonPropertyOrder` 或 `JsonProperty.index`。

## 读取与写入

Fory JSON 支持 String 和 UTF-8 字节输入/输出，不提供 `InputStream` 解析 API。

| 操作                | 运行时类型                  | 声明的 `Class`                  | 声明的 `TypeRef`                   |
| ------------------- | --------------------------- | ------------------------------- | ---------------------------------- |
| String 输出         | `toJson(value)`             | `toJson(value, type)`           | `toJson(value, typeRef)`           |
| UTF-8 字节          | `toJsonBytes(value)`        | `toJsonBytes(value, type)`      | `toJsonBytes(value, typeRef)`      |
| UTF-8 `OutputStream` | `writeJsonTo(value, out)`   | `writeJsonTo(value, type, out)` | `writeJsonTo(value, typeRef, out)` |
| String 输入         | -                           | `fromJson(text, type)`          | `fromJson(text, typeRef)`          |
| UTF-8 输入          | -                           | `fromJson(bytes, type)`         | `fromJson(bytes, typeRef)`         |

解析操作只消费一个值，并拒绝尾部非空白内容。String 和字节数组输出都与内部缓冲区相互独立。

`writeJsonTo` 会缓冲完整文档，只执行一次 `OutputStream.write`，且既不 flush 也不关闭流。它不是
增量流式写入；I/O 失败会包装为 `ForyJsonException`。

### 泛型与声明类型

对泛型根类型使用 `TypeRef`：

```java
import java.util.List;
import org.apache.fory.reflect.TypeRef;

TypeRef<List<User>> usersType = new TypeRef<List<User>>() {};
List<User> users = json.fromJson("[{\"id\":7,\"name\":\"Alice\"}]", usersType);
String encoded = json.toJson(users, usersType);
```

带类型的写入要求类型完全绑定，不接受通配符和类型变量。值必须可赋给声明的原始类型。声明的 Schema
决定序列化方式，包括嵌套泛型的元素类型和封闭的子类型元数据。

当声明的基类型拥有 `JsonSubTypes` 时，请使用该基类型：

```java
Shape shape = new Circle(2);

json.toJson(shape);              // Concrete runtime representation
json.toJson(shape, Shape.class); // Configured Shape subtype representation
```

对于 `List<Shape>`，请使用 `new TypeRef<List<Shape>>() {}`，使每个元素保留声明的子类型 Schema。

## 线程安全与代码生成

`ForyJson` 在 `build()` 后不可变且线程安全。已注册以及通过注解选择的 `JsonValueCodec` 实例和类型
检查器会被共享，因此也必须线程安全。

代码生成和异步编译默认启用。排查问题或处于禁止运行时编译的环境时，可以将它们禁用：

```java
ForyJson json =
    ForyJson.builder()
        .withCodegen(false)
        .withAsyncCompilation(false)
        .build();
```

`withConcurrencyLevel` 控制可复用的操作状态数量，并非调用方数量上限。超出该数量的并发操作会使用
临时状态，而不是争用一个全局锁。

## 对象映射

默认发现机制会将 Java 逻辑属性名相同的成员合并：

- 类层次结构中符合条件的实例字段，不受 Java 可见性影响；
- public、非 static 的 `getX()` getter 和布尔型 `isX()` getter；
- public、非 static 且返回 void 的 `setX(value)` setter。

static、transient、synthetic 以及 `Class<?>` 字段会被排除。返回 Class 的访问器和 `getClass()`
也会被排除。在不符合条件的成员上使用注解会失败，而不会成为静默的无操作。

普通 final 字段可以作为写入来源，但不能作为可变的读取目标。不可变对象的构造应使用 record、
`JsonCreator` 或自定义 codec。record 使用其规范构造器。

按以下方式启用仅字段发现：

```java
ForyJson json = ForyJson.builder().withFieldMode(true).build();
```

在字段模式下，getter/setter 上的注解无效。对于普通属性，未知成员会被跳过，重复成员采用最后一个值。
多态判别字段的规则更严格，必须且只能出现一次。原始类型目标拒绝 JSON null。大多数引用类型目标返回
null，但选中的内置或自定义 codec 可以定义其他结果；声明为 Optional 的目标返回对应的空 Optional。

有无参构造器的普通类会先执行构造器，再为可读属性赋值，因此缺失的属性会保留字段初始化器或构造器
设置的值。在普通 JVM 上，没有这类构造器的类会在不执行构造器或字段初始化器的情况下分配，缺失属性
保留 JVM 的零值或 null。Android 无法构造没有可用无参构造器的普通类。JDK 25 及更高版本上的
GraalVM Native Image 对大多数普通类也要求无参构造器；唯一受支持的例外是首个非 Serializable
超类为 `Object` 的 `Serializable` 类。

为了实现可移植构造，请使用 record、`JsonCreator` 或无参构造器。不要将普通构造器用作反序列化
完成钩子：无参构造器执行后还会继续属性赋值，而绕过构造器的路径根本不会执行它。

## 支持的 Java 类型

| 分组       | 类型与行为 |
| ---------- | ---------- |
| 标量       | 原始类型及装箱的布尔值、数字、字符，字符串和字符串构建器，`BigInteger`、`BigDecimal`、Fory 半精度数、枚举 |
| 容器       | 原始类型/装箱类型/对象数组；collection、list、set、queue、deque、blocking、sorted、navigable 接口；map、sorted-map、navigable-map、concurrent-map 接口；受支持的具体实现；`EnumSet`；`EnumMap`；各类 `Optional`；原子值和原子数组 |
| 时间       | `Date`、`Calendar`、`TimeZone`、Java 时间类型、受支持的 chronology date，以及可选的 `java.sql.Date`、`Time` 和 `Timestamp` |
| 其他 JDK 类型 | `UUID`、`URI`、`File`、`Path`、`Locale`、`Charset`、`Currency`、`Pattern`、`BitSet`、`ByteBuffer` |
| 可选库     | 存在 Guava 时支持 `ImmutableList`、`ImmutableSet`、`ImmutableSortedSet`、`ImmutableMap`、`ImmutableBiMap`、`ImmutableSortedMap` 和 `ImmutableIntArray` |
| 对象       | 可变具体类、record、creator 类、`JsonObject`、`JsonArray` |

接口会使用合适的标准可变实现重建。`ArrayBlockingQueue`、`Arrays.asList` 的结果、JDK 不可变集合、
空/单例/不可修改包装器、构造受限的实现以及未列出的 Guava 不可变实现无法重建。Guava 始终是可选依赖。

非有限 float/double 值使用带引号的 `"NaN"`、`"Infinity"` 和 `"-Infinity"` token。

### 内置表示

| Java 类型 | JSON 表示 |
| --------- | --------- |
| 枚举 | 枚举常量名称字符串 |
| `Date`、`Calendar`、`java.sql.Date`、`Time`、`Timestamp` | Unix epoch 毫秒数 |
| `TimeZone` | 时区 ID 字符串 |
| Java 时间类型和受支持的 chronology date 类型 | 标准文本字符串 |
| `UUID`、`URI`、`File`、`Path`、`Locale`、`Charset`、`Currency`、`Pattern` | 类型特定的文本字符串；`File` 和 `Path` 使用路径文本，`Locale` 使用语言标签，`Pattern` 会丢失 flags |
| `BitSet` | 有符号 `long` word 数组 |
| `ByteBuffer` | 从 position 到 limit 的有符号字节值数组 |
| Optional 和原子包装器 | 直接使用其中的标量、数组或值 |

`Calendar` 会重建为新的 `GregorianCalendar`，因此不会保留原始子类型、时区和其他配置。值为 null
的 Optional 引用和空 Optional 都写为 JSON null；将 JSON null 读取为声明的 Optional 类型时，返回
对应的空 Optional。

### 动态 JSON 树

读取 `Object.class` 会生成自然的 JSON 值：

| JSON | Java |
| ---- | ---- |
| Object | `JsonObject` |
| Array | `JsonArray` |
| String/boolean/null | `String`、`Boolean`、null |
| Integer | `Long`，超出 long 范围时为 `BigInteger` |
| Fraction/exponent | `Double` |

`JsonObject` 保留插入顺序，`JsonArray` 可变。

### Map key

声明的 key 支持 String、byte、short、int、long、对应的装箱类型和枚举。`Object` key 可写入
String、number、boolean、character 和 enum 值，但读回时都是字符串。null key 会被拒绝。

## Builder 配置

| 方法                         | 默认值                                       | 作用 |
| ---------------------------- | -------------------------------------------- | ---- |
| `writeNullFields`            | `false`                                      | 默认是否包含 null 属性 |
| `withCodegen`                | `true`                                       | 生成对象 codec |
| `withAsyncCompilation`       | `true`                                       | 异步编译生成的代码 |
| `withFieldMode`              | `false`                                      | 为 true 时仅发现字段 |
| `withPropertyNamingStrategy` | `LOWER_CAMEL_CASE`                           | 未显式命名属性的命名方式 |
| `withClassLoader`            | 构建时快照的 context loader，随后为 Fory loader | 解析注解中的子类型类名 |
| `maxDepth`                   | `20`                                         | 对象/数组最大嵌套深度 |
| `withMaxCachedFieldNames`    | `DEFAULT_MAX_CACHED_FIELD_NAMES`（`8192`）   | 每个 reader 的字段名缓存条目数；零表示禁用 |
| `withConcurrencyLevel`       | `max(1, 2 * processors)`                     | 可复用操作状态数量 |
| `withBufferSizeLimitBytes`   | 2 MiB                                        | 每个池化 writer 保留的可复用容量 |
| `registerCodec`              | 无                                           | 精确类的完整值 codec |
| `registerMixin`              | 无                                           | 精确声明目标的注解 Mixin |
| `withTypeChecker`            | 无                                           | 在 Fory 禁止列表之外追加应用策略 |

深度、并发和保留缓冲区限制必须为正数。缓存字段名上限分别作用于每个 reader；零会禁用缓存，此设置不会
限制可接受的输入。缓冲区设置也不限制输出大小。`build()` 之后修改 builder 不会改变已有运行时。

在 GraalVM Native Image 中，运行时代码生成和异步编译会自动禁用；其余 builder 选项的行为与上述
说明一致。

## 注解

Fory JSON 在 `org.apache.fory.json.annotation` 下提供 `JsonProperty`、`JsonPropertyOrder`、
`JsonIgnore`、`JsonAnyProperty`、`JsonAnyGetter`、`JsonAnySetter`、`JsonCreator`、`JsonCodec`、
`JsonValue`、`JsonRawValue`、`JsonBase64`、`JsonUnwrapped` 和 `JsonSubTypes` 等映射注解。
`JsonType` 是独立的构建时生成标记。这些注解并非 Jackson、Gson 或 Fory 二进制协议注解。

```java
import java.util.LinkedHashMap;
import java.util.Map;
import org.apache.fory.json.PropertyNamingStrategy;
import org.apache.fory.json.annotation.JsonAnyGetter;
import org.apache.fory.json.annotation.JsonAnyProperty;
import org.apache.fory.json.annotation.JsonAnySetter;
import org.apache.fory.json.annotation.JsonBase64;
import org.apache.fory.json.annotation.JsonCodec;
import org.apache.fory.json.annotation.JsonCreator;
import org.apache.fory.json.annotation.JsonIgnore;
import org.apache.fory.json.annotation.JsonMixin;
import org.apache.fory.json.annotation.JsonMixinRemove;
import org.apache.fory.json.annotation.JsonProperty;
import org.apache.fory.json.annotation.JsonPropertyOrder;
import org.apache.fory.json.annotation.JsonRawValue;
import org.apache.fory.json.annotation.JsonSubTypes;
import org.apache.fory.json.annotation.JsonType;
import org.apache.fory.json.annotation.JsonValue;
import org.apache.fory.json.annotation.JsonUnwrapped;
```

`JsonType` 请求注解处理器生成直接属性和 creator 操作，并为符合条件的具体对象模型生成准确的
保留规则。直接注解的 `JsonValue` record 也会获得一个 companion，使其值访问器和规范构造器在
Android desugaring 后仍能工作。JVM、Android 和 GraalVM Native Image 使用同一个生成的
companion。该注解不会继承；具体子类型必须直接添加该注解才能获得 companion。设置方式请参阅
[GraalVM 支持](graalvm-support.md)和 [Android 支持](android-support.md)。使用默认对象 codec 的
直接注解模型必须具有生成的 companion；如果缺少处理器输出，运行时会报告配置错误。

### Mixin

Mixin 可以在不修改现有类源码的情况下配置该类：

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

源必须是具名 abstract class 或 interface，不能是 local 或 anonymous，也不能 extend 或 implement
其他类型，而且永远不会被实例化。带注解的源字段、方法、构造器或参数根据 Java 签名选择目标中已有的
声明。源不能虚构 Java 字段、方法、构造器、泛型类型、子类型实现或可执行方法体。它可以为目标上已存在
的匹配声明分配受支持的 JSON 角色，例如 property、creator、factory、子类型表或值表示。所有 Java
类型、访问操作、调用和运行时值仍来自目标。

注册只作用于精确目标。基类注册不会改变子类，接口注册也不会改变实现类。子类 Mixin 可以选择子类继承
的成员，但生成的注解只在映射该精确子类时生效。

支持全部 Fory JSON 映射注解：`JsonAnyGetter`、`JsonAnyProperty`、`JsonAnySetter`、`JsonBase64`、
`JsonCodec`、`JsonCreator`、`JsonIgnore`、`JsonProperty`、`JsonPropertyOrder`、`JsonRawValue`、
`JsonSubTypes`、`JsonUnwrapped` 和 `JsonValue`。不能添加或移除 `JsonType`，因为它控制的是构建时
生成，而不是 JSON Schema。

源注解会替换匹配声明上相同类型的目标注解。注解会被整体替换，因此源注解中省略的成员使用其声明的
默认值，而不是继承目标注解中的值。该目标声明上的其他注解类型仍然有效。

使用 `JsonMixinRemove` 可使选中的目标注解失效：

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

移除只影响精确目标配置中匹配的声明。移除 `JsonRawValue` 会恢复普通的带引号 String 输出；移除
`JsonBase64` 会恢复普通 `byte[]` 表示；移除 `JsonUnwrapped` 会恢复嵌套对象属性。类型级移除可为
精确目标屏蔽继承的 `JsonCodec` 或 `JsonPropertyOrder` 声明。移除不存在的注解没有副作用，但 selector
仍必须精确匹配一个目标声明。源不能在同一声明上同时声明和移除同一种注解。

一个已构建运行时中，每个精确目标只启用一个源。为同一目标注册不同源时，后注册的替换先前注册；再次
注册同一个源是幂等的。`build()` 对当前“最后注册者生效”的映射制作快照；之后在 builder 上注册不会
改变此前构建的 `ForyJson`。没有映射注解的源是无操作；若在同一目标的其他源之后注册它，则会为后续
构建清除之前的 overlay。

Mixin 提供的 `JsonCodec` 是目标的有效注解，并遵循下文的普通 codec 优先级。特别是，精确的
`registerCodec` 注册优先于类型级 Mixin codec，而类型级 Mixin codec 又优先于该目标的内置映射。

record 使用其已有字段、访问器和规范构造器参数声明。Mixin 不会引入独立的 record component 模型。
应使用源 selector 选择这些真实声明，并按照普通 record 属性映射的要求保持重复注解一致。

在 Android 和 GraalVM Native Image 上，请使用 Fory 注解处理器编译非空 Mixin 源，以提供所需的
生成操作和平台配置。请参阅 [Android 支持](android-support.md)和
[GraalVM 支持](graalvm-support.md)。

### `JsonProperty`

字段、getter 或 setter 上的注解配置完整的合并逻辑属性：

```java
@JsonProperty("user_id")
private long id;

@JsonProperty(include = JsonProperty.Include.ALWAYS)
private String displayName;

@JsonProperty(index = 10)
private String email;
```

支持的包含策略为：

- `DEFAULT`：继承 `writeNullFields`；
- `ALWAYS`：包含 null；
- `NON_NULL`：省略 null。

`index` 控制相对序列化顺序。有 index 的属性按 index 升序写在无 index 属性之前。index 必须非负、
可以有间隔，并且在可写属性中必须唯一。`-1` 表示未指定；更小的值无效。setter-only、creator-only
或忽略写入的属性不能设置 index。

包含策略只影响写入。允许内容相同的重复声明；显式名称、index 或非默认策略冲突时会失败。两个属性不能
规范化为同一个 JSON 名称。`JsonProperty` 不能与 Any 逻辑属性组合，也不能在 `JsonAnySetter` 上声明。
不支持 `NON_EMPTY`、alias 和格式设置。

### `JsonPropertyOrder`

使用 `JsonPropertyOrder` 可组合具名的前缀、属性 index 和按最终名称的字母顺序：

```java
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

输出顺序为 `id`、`display_name`、`name`、`address`、`age`：

```json
{ "id": 1, "display_name": "Alice", "name": "alice", "address": "x", "age": 30 }
```

具名前缀最先写入；其余有 index 的属性按 index 升序排列。当 `alphabetic = true` 时，剩余的无 index
属性按最终 JSON 名称排序，否则保持原有相对顺序。不需要具名前缀时使用
`@JsonPropertyOrder(alphabetic = true)`。字母比较使用 Java 自然的、区分大小写的 String 顺序，
不依赖 locale。

列表项优先匹配最终 JSON 名称，其次匹配 Java 逻辑属性名。因此，`display_name` 可以匹配显式的
`JsonProperty` 名称，而未注解的 `displayName` 既可通过 `SNAKE_CASE` 下的 `display_name` 寻址，
也可通过其 Java 名称 `displayName` 寻址。

仅当 `alphabetic` 为 true 时，列表才可以为空。列表项必须是非空且唯一的可写属性；构建对象元数据时，
未知项和重复项会失败。子类声明会整体替换超类的两个设置，不会合并。如果子类没有声明，则使用最近超类
的声明，并相对于子类属性进行解析。接口声明不予考虑。

属性顺序只影响序列化。反序列化仍按名称进行，并接受任意顺序的成员。子类型判别字段仍位于用户属性之前。

unwrapped 组也只占一个位置，通过该组的 Java 逻辑属性名选择；其子成员保持相邻并保留子对象自身的顺序。

启用写入的 `JsonAnyProperty` 或 `JsonAnyGetter` 作为一个位置参与排序，以其 Java 逻辑属性名标识：

```java
@JsonPropertyOrder({"id", "properties", "timestamp"})
public final class Event {
  public String id;

  @JsonAnyProperty
  public Map<String, Object> properties;

  public long timestamp;
}
```

该位置会在 `id` 和 `timestamp` 之间按 Map 迭代顺序输出 `properties` 的每个条目；它不会输出名为
`properties` 的成员。命名策略不会转换 Any 排序名称。仅输入的 Any 字段和 `JsonAnySetter` 没有写入
位置。动态 key 不能出现在 `JsonPropertyOrder` 中，字母排序也不会对 Map 内部条目排序。

### 命名策略

```java
ForyJson json =
    ForyJson.builder()
        .withPropertyNamingStrategy(PropertyNamingStrategy.SNAKE_CASE)
        .build();
```

默认的 `LOWER_CAMEL_CASE` 保留发现到的 Java 逻辑属性名。`SNAKE_CASE` 将 `userName` 映射为
`user_name`、`URLValue` 映射为 `url_value`、`version2FA` 映射为 `version2_fa`。显式的
`JsonProperty` 名称、参数局部的 creator 名称和子类型判别属性不受该策略影响。动态 Any key 也不受影响。

### `JsonIgnore`

`JsonIgnore` 以字段为目标，控制整个逻辑属性的两个方向：

```java
@JsonIgnore(ignoreRead = false, ignoreWrite = true)
private String serverManagedValue;
```

两个 flag 默认均为 true。访问器不能恢复已忽略的方向，`JsonProperty` 也不能覆盖它。Fory core 的
`Expose` 在 Fory JSON 中不起作用。

### `JsonValue`

当某一精确的 `String` 成员是其所属类型的完整 JSON 表示时，使用 `JsonValue`。Fory 会将其写为普通的
带引号且已转义的 JSON 字符串，而不是对象：

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

方法名称任意，但必须为 public、非 static、零参数，并且返回精确的 `String`。字段必须是符合条件的
非 static 实例字段。只允许一个有效成员；未注解的 override 会抑制继承的方法注解。

该注解自身即可控制写入。读取需要一个 `JsonCreator` 构造器或 public static factory，它必须有且只有
一个精确的 `String` 参数、空的 `JsonCreator.value()`，且参数上没有 `JsonProperty`。这种形状会被
推断为反向 String 构造器，无需指定 creator mode。已有的基于属性的 creator 形式保持不变。JSON null
会直接映射为 Java null，不调用 value 成员或 creator。

### `JsonRawValue`

当固定的普通 `String` 属性内容已经是一个完整 JSON 值时，使用 `JsonRawValue`：

```java
import org.apache.fory.json.annotation.JsonRawValue;

public final class Response {
  public int status;

  @JsonRawValue
  public String body;
}
```

当 `body = "{\"id\":1}"` 时，Fory 会直接在 `body` 的值位置输出该对象。它不会给 String 加引号、
转义、解析、校验或规范化。这是只用于受信任写入的逃生口；无效或由攻击者控制的内容可能使整个输出无效，
或改变其结构。Java null 遵循属性已有的包含规则；被包含时写为 JSON null。

读取行为不变，仍要求 JSON 字符串。通过该属性写入的原始对象或数组无法读回此 `String`。该注解不适用于
setter、creator 参数、Any 声明、容器元素或 Map value，也不能与 `JsonCodec` 出现在同一位置。它是
局部位置的表示方式，因此即使值类型具有 builder 注册的精确 codec，仍保持原始 String 形状。

这两个注解都不会收集未知的同级字段。未知字段会被跳过，除非已有 `JsonAnyProperty` 或
`JsonAnyGetter`/`JsonAnySetter` 映射接收它们。在同一个 String 成员上组合 `JsonValue` 和
`JsonRawValue`，会把所属对象写为受信任的原始根值，但不会增加读取原始片段的约定。

### `JsonBase64`

在一个精确的 `byte[]` 字段或 getter 上使用 `JsonBase64`，可将它表示为带引号的标准 Base64 JSON 字符串：

```java
import org.apache.fory.json.annotation.JsonBase64;

public final class Attachment {
  @JsonBase64
  public byte[] content;
}
```

字节 `{1, 2, 3}` 会写为 `{"content":"AQID"}`，并解码回原数组。编码和解码不会创建中间 String。
null 处理遵循属性的普通包含规则。

该注解不是 type-use 注解，不影响普通 `byte[]` 属性、容器元素或 Map value。它不能与 `JsonRawValue`、
位置级 `JsonCodec` 或 Any 声明共用一个逻辑属性。等价的显式 codec 为
`@JsonCodec(Base64ByteArrayCodec.class)`。

### `JsonUnwrapped`

当对象值属性需要保留其 Java 对象边界、但希望将其成员放入外层 JSON 对象时，使用 `JsonUnwrapped`：

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

它会写出 `{"age":18,"name_first":"Ada","name_last":"Lovelace"}`，而不是嵌套的 `name` 对象。
`prefix` 和 `suffix` 应用于 `JsonProperty` 和所配置命名策略处理后的每个最终子名称。嵌套组从内向外
组合这些转换。

值为 null 的子对象不输出任何成员。读取时，只有至少一个扁平化成员存在才会创建子对象。缺失的组会保留
可变父对象的初始化值，并让 record 或 creator 参数保持普通的缺失属性默认值。输入不完整时会创建子对象，
其余成员使用普通默认值。

父对象和子对象均支持可变类、record 和 `JsonCreator` 类。参数局部的 creator 参数可以定义只读组；其
必需的 `JsonProperty` 值标识 Java 参数，而不是包装器名称。外层父对象可以参数化，但每个 unwrapped
子对象及中间对象都必须是精确的、非泛型 raw class，并使用标准 Fory 对象映射。

整个组在父对象序列化顺序中占一个位置。可使用 `JsonProperty.index` 定位，或在 `JsonPropertyOrder`
中列出其 Java 逻辑属性名。组内保持子对象顺序。输入匹配顺序依次为父对象固定属性、扁平化属性和动态 Any
成员。

Fory 会拒绝最终名称或名称 hash 冲突、仅由 unwrapped 属性组成的递归链、参数化子对象、JSON Any
子对象、多态或自定义 codec 子对象根，以及标量、数组、collection 或 Map 子对象。Map 应通过
`JsonAnyProperty`、`JsonAnyGetter` 或 `JsonAnySetter` 扁平化。unwrapped 属性不能使用
`JsonProperty.value`、非默认 `JsonProperty.include` 或 `JsonCodec`；子对象内部的普通叶子属性
仍保留其普通注解。

### 动态对象成员

使用 `JsonAnyProperty` 可将 `Map<String, V>` 字段扁平化到外层 JSON 对象，并存储输入中其他未知成员：

```java
public final class Event {
  public String id;

  @JsonAnyProperty
  public Map<String, Object> properties = new LinkedHashMap<>();
}
```

当 `properties` 包含 `"source" -> "mobile"` 时，结果会在 `id` 旁包含 `"source":"mobile"`，
而不会写入嵌套的 `properties` 成员。该字段默认同时读取和写入。`JsonIgnore` 可以选择一个方向，但不能
同时禁用两个方向。读取时，Fory 会复用已有 Map；若非 final 字段为 null，则在遇到第一个未知成员时
初始化它。普通可变对象上可读的 final 字段必须已包含可变 Map。record 和属性列表 `JsonCreator`
类型会改为通过构造参数接收累积的 Map。

使用 `JsonAnyGetter` 和 `JsonAnySetter` 支持基于方法的写入和读取：

```java
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

any-getter 必须是 public 实例方法，无参数，并返回 `Map<String, V>`。any-setter 必须是签名为
`void method(String, V)` 的 public 实例方法。两者可以各自独立使用。配对时，将原始类型装箱后解析的
value 类型必须一致。原始类型的 any-setter value 拒绝 JSON null。record 或使用 `JsonCreator`
的类型不支持 any-setter。

record component 上启用读取的 `JsonAnyProperty` 会从未知输入为该 component 提供值。在属性列表
creator 模式下，启用读取的 Any 字段必须对应于一个列出的 creator 参数；参数局部 creator 模式无法
绑定它。只写 Any 字段或 any-getter 不能占用 creator 参数。若它声明了 record component，该
component 在读取时获得普通 Java 默认值。

any-getter 会声明其完整的 Java 逻辑属性：`getProperties()` 和 `properties()` 都声明 `properties`，
因此同名普通字段和访问器不会再次映射为固定成员。Fory 不会推断名称不同的 backing field；如果该字段
不应单独映射，请使用 `JsonIgnore`。any-setter 没有逻辑属性名，也不会声明字段。

逻辑名称只用于分组和 `JsonPropertyOrder`，并非固定 JSON 成员。与其同名的输入成员是动态条目，而非
嵌套 aggregate。只要不与其他固定属性冲突，同一个输出 key 仍然有效。

一个有效类型层次结构可以使用一个 Any 字段，或者至多一个 any-getter 和一个 any-setter。字段形式与
方法形式不能混用，字段模式下方法注解无效。未注解的 override 会禁用继承的方法注解。Any 字段或 getter
声明的所有成员以及 any-setter 上都不能使用 `JsonProperty`。同名字段不能通过 `JsonIgnore` 禁用
any-getter 的写入方向，其 `ignoreRead` flag 也不会禁用单独的 any-setter。

动态 key 按 Map 迭代顺序原样输出。null Map 不输出内容，而 null Map value 无论固定属性的 null 设置
如何都会输出 JSON null。null 和非 String 输出 key 会被拒绝。raw Map、通配符或未解析 key，以及非
String key 类型均无效。声明的固定成员（包括排除读取的成员）不会交给 Any 输入。输出 key 若与固定属性
的 Fory 字段名 hash 冲突，会被拒绝，包括拼写不同但 hash 冲突的情况。Fory 不会检查 Any Map 中的 key
是否与内联子类型判别字段在名称或 Fory 字段名 hash 上冲突。同名输出 key 会生成重复 JSON 成员；输入时，
拼写不同但 hash 冲突的名称会被子字段表归为判别字段。应用必须保证动态 key 与当前判别字段的名称和 hash
都不同。重复的未知名称会替换 Map value；any-setter 则会为每次出现都调用。固定输入查找也基于 hash，
因此拼写不同但冲突的名称会走固定成员，而不是 Any 处理。转义的输入名称会先解码再交付。

### `JsonCreator`

紧凑模式按参数顺序列出现有 Java 逻辑属性名，并复用其规范化元数据：

```java
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

参数局部模式为每个参数提供显式 JSON 名称，并允许只有 creator 的输入：

```java
@JsonCreator
public static User create(
    @JsonProperty("user_id") long id,
    @JsonProperty("display_name") String name) {
  return new User(id, name);
}
```

两种模式不能混用。紧凑名称必须非空且唯一，数量必须与参数数量相同，紧凑参数也不能声明
`JsonProperty`。参数局部模式要求每个参数都有非空且唯一的 `JsonProperty` 名称。creator 是完整的
读取 Schema，执行后不会再调用 setter。

对于带有 `JsonValue` 的类型，空形式还接受有且只有一个不带 `JsonProperty` 的 `String` 参数，并从
其普通 JSON 字符串表示重建所属值。

只允许一个 creator。它必须为 public、至少有一个参数、不能是 varargs 或 generic。factory 还必须是
static，声明精确的目标类作为返回类型，并返回运行时类恰好为该目标的非 null 值。缺失引用使用 null，
缺失原始类型使用零值，重复成员使用最后一个值，显式原始类型 null 会失败。record 不能声明基于属性的
`JsonCreator`；带 `JsonValue` 的 record 可以在其单 String 规范构造器上标注值形式。

### `JsonSubTypes`

`JsonSubTypes` 在 interface 或 abstract 基类上定义完整且有限的表。每项都有区分大小写的逻辑名称，
以及唯一的 Java 来源：class literal 或受信任的二进制 `className`。JSON 永远不会提供类名或扩展此表。

默认的属性包含方式：

```java
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

判别字段最先输出，但输入时可以出现在任意直接成员位置。它必须且只能出现一次，包含已知的 String 名称，
且不能与子类型属性冲突。

包装对象：

```java
@JsonSubTypes(
    inclusion = JsonSubTypes.Inclusion.WRAPPER_OBJECT,
    value = {@JsonSubTypes.Type(value = Circle.class, name = "circle")})
public interface Shape {}
```

```json
{ "circle": { "radius": 2 } }
```

包装数组：

```java
@JsonSubTypes(
    inclusion = JsonSubTypes.Inclusion.WRAPPER_ARRAY,
    value = {@JsonSubTypes.Type(value = Circle.class, name = "circle")})
public interface Shape {}
```

```json
["circle", { "radius": 2 }]
```

| Inclusion        | `property`     | 值规则 |
| ---------------- | -------------- | ------ |
| `PROPERTY`       | 必需且非空     | 普通子类型对象成员 |
| `WRAPPER_OBJECT` | 必须为空       | 完整子类型值 |
| `WRAPPER_ARRAY`  | 必须为空       | 作为索引 1 元素的完整子类型值 |

wrapper inclusion 支持精确的自定义子类型 codec。逻辑名称必须唯一，解析后的具体且可赋值的类也必须唯一。
只接受明确列出的精确运行时类；列出父类不会接纳其后代。注解从声明的基类本身读取，不从其他已注解基类
继承。null 是普通 JSON null，除非 codec 优先级为声明的基类选择了自定义完整值 codec，从而替换该注解。
reader 只接受配置的形状，因此更改 inclusion 属于编码格式变更。在 GraalVM native-image 运行时，
请为基类添加 `JsonType`，并使用 class literal 而不是 `className`。列出的 class-literal 子类型会自动注册。

## 自定义 codec

`JsonValueCodec<T>` 通过 Fory 的具体 String/UTF-8 writer 和 Latin-1/UTF-16/UTF-8 reader 读取和
写入一个完整 JSON 值（包括 null）。它是直接的流式值 SPI，而非 JSON 抽象语法树（AST）codec。它从不
处理 Map key；JSON 对象成员名称由 `MapKeyCodec` 负责。

对于在各种表示中语义一致的应用 codec，可继承 `AbstractJsonValueCodec<T>`，只实现一次 JSON 形状：

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

`AbstractJsonValueCodec` 每次操作增加一次虚方法调用。对于性能敏感的 codec，或者行为依赖具体 reader
或 writer 时，请直接实现 `JsonValueCodec<T>`，并提供全部五个特定表示的方法。

注册一次即可：

```java
import org.apache.fory.json.ForyJson;

ForyJson json =
    ForyJson.builder()
        .registerCodec(Money.class, new MoneyCodec())
        .build();
```

在 codec 运行前，父属性仍控制其名称、忽略方向和 null 包含策略。已输出的属性以及每个数组、collection、
Map value、Optional 或原子引用位置，都会把完整值（包括 null）委托给 codec。注册的 codec 实例会被
并发共享，必须线程安全。子类型上的自定义 codec 与 wrapper inclusion 兼容，但不兼容内联 property
inclusion。基类上的 codec 会替换其 `JsonSubTypes` 注解。

### 使用 `JsonCodec` 选择 codec

在 class、record、enum 或 interface 上使用 `@JsonCodec`，可声明其默认完整值 codec。位置形式是
`value` 的简写：

```java
@JsonCodec(MoneyCodec.class)
public final class Money {}

@JsonCodec(AccountCodec.class)
public interface Account {}

public final class RetailAccount implements Account {}
```

类型声明会通过超类和接口继承，最具体的声明优先。不相关声明使用同一 codec 时视为一致；使用不同 codec
时则失败，而不会依赖反射顺序。

在字段或有效普通 getter 上，`value` 替换完整属性值。有效 setter 的 value 参数、`JsonCreator` 构造器
或 factory 参数，以及通过 Java 的字段、访问器和构造器参数传播的 record component，也支持同一注解：

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

当标准容器仍应负责外层，而仅直接子元素需要自定义 codec 时，请使用 child member：

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

child member 含义如下：

| 成员           | 当前支持的值                                      | 由 codec 处理的直接子元素 |
| -------------- | ------------------------------------------------- | ------------------------- |
| `elementCodec` | `Collection<E>`、`E[]`、`AtomicReferenceArray<E>` | `E` |
| `contentCodec` | `Optional<T>`、`AtomicReference<T>`               | `T` |
| `keyCodec`     | `Map<K, V>`                                       | `K` 对应的 JSON 成员名称 |
| `valueCodec`   | `Map<K, V>`                                       | 直接的 `V` 值 |

自定义 Map-key codec 在声明的 key 和 JSON 成员名称之间转换：

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

使用已移除的 type-use 形式的代码应将 codec 移到所属声明上：

```java
// Before
List<@JsonCodec(MoneyCodec.class) Money> items;

// Now
@JsonCodec(elementCodec = MoneyCodec.class)
List<Money> items;
```

对 `Optional` 或 `AtomicReference` 使用 `contentCodec`，对 Map value 使用 `valueCodec`，对数组或
`AtomicReferenceArray` 元素使用 `elementCodec`。

非 `Collection<E>` 的 `Iterable<E>` 值不支持 `elementCodec`。如果完整 codec 应负责整个值，
请使用 `value`。

child 配置有意只深入一层。对于 `List<List<Money>>`，`elementCodec` 处理每个完整的 `List<Money>`；
对于 `Money[][]`，它处理每个 `Money[]`。如需自定义更深层的后代，请为完整当前值实现 codec，并通过
`value` 选择它。

`value` 与所有 child member 互斥，因为它已经负责完整当前值。空注解、不受支持的 child member，或
外层完整 codec 与 child member 组合，都会在模型构建期间失败。配置的直接子元素必须解析为具体类型；
raw container、直接通配符和未解析的直接类型变量都会被拒绝。

`JsonAnyProperty` 和 `JsonAnyGetter` 会将其 Map 扁平化到外层对象。用 `valueCodec` 配置其动态值：

```java
@JsonAnyProperty
@JsonCodec(valueCodec = MoneyCodec.class)
public Map<String, Money> extra;
```

`JsonAnySetter` 的第一个参数是 String 属性名；第二个参数可以使用 `@JsonCodec(value = ...)`，或适用于
该参数自身形状的其他配置。

### Codec 优先级与重复声明

Fory 按以下顺序解析每个当前值：

| 优先级 | 来源 |
| -----: | ---- |
| 1 | 当前属性或参数的 `JsonCodec` |
| 2 | 精确的 `registerCodec` 注册 |
| 3 | 应用 Mixin overlay 后，精确目标类型的 `JsonCodec` |
| 4 | inherited-frontier 类型的 `JsonCodec` 声明 |
| 5 | 内置或默认 JSON 映射 |

一个逻辑属性可以从字段、getter、setter 参数、creator 参数或 record 传播中暴露注解。重复配置必须
完全相同；Fory 不会合并不同声明中的部分配置。未注解的有效 override 会抑制继承的方法注解。

child member 只替换该直接子元素。未配置的 Map sibling 继续使用正常优先级。如果精确注册或类型声明
为外层容器提供完整 codec，则属性 child member 不可达，因此会被拒绝。

Map key 是 JSON 对象成员名，使用 `MapKeyCodec` 而不是 `JsonValueCodec`。自定义 key codec 类遵循
与 value codec 相同的构造规则。null Map key 会被拒绝，解码后的 key 必须匹配声明的 key 类型。

### Codec 构造与平台支持

注解 codec 类必须是 public、具体的顶级类或 static nested class，并具有 public 无参构造器。构建后的
`ForyJson` 会在所有注解位置和并发操作间共享一个实例，因此它必须线程安全。如果完整值 codec 需要配置，
请使用 `registerCodec(Target.class, instance)`。

在具名 Java 模块中，请将 codec package export 或 open 给 `org.apache.fory.json`。继承的类型声明 codec
用于更具体目标时，所有解码值都必须为 null 或可赋给该目标。

该注解在 JVM、Android 和 GraalVM Native Image 上具有相同的 FIELD、METHOD 和 PARAMETER 行为。
普通 Android 类可以省略 `JsonType`，并提供等价的精确规则。Android desugaring 后的 record（包括
`JsonValue` record）要求由直接 `JsonType` 声明或已编译的精确 `JsonMixin` 对生成操作。GraalVM
对象模型遵循 [GraalVM 支持](graalvm-support.md)中的构建时工作流。

## 类型校验与不受信任的输入

Fory JSON 始终应用固定禁止列表。可通过以下方式添加应用策略：

```java
ForyJson json =
    ForyJson.builder()
        .withTypeChecker(
            (className, context) ->
                className.startsWith("com.example.model.")
                    || className.equals("java.util.List")
                    || className.equals("java.util.Map"))
        .build();
```

需要允许声明 Schema 所使用的每个应用模型和非内置容器类型。检查器在为序列化和解析准备应用类型时执行，
且必须线程安全。内置标量通常会跳过自定义检查器，但为内置目标选择应用 codec 后，该目标也会受检查器
约束。自定义 codec 无法绕过固定禁止列表。

`withClassLoader` 固定子类型 `className` 的解析方式。否则 `build()` 会对线程 context class loader
制作快照，并回退到 Fory JSON loader。

`maxDepth` 不是输入大小或内存配额。请在传输边界强制执行请求大小、超时和资源限制。默认不支持
`Class`、`URL`、`InetAddress` 和 `InetSocketAddress`。URL 以及任意不受支持的 Number/CharSequence
子类需要精确的自定义 codec。

## 限制与不支持的功能

- 不支持共享引用标识或循环引用协议；有此需求时请使用 Fory 二进制协议。
- 不支持开放多态、JSON 类名 ID、子类型发现或运行时扩展子类型表。
- 根 `ForyJson` API 不支持 InputStream parser、增量 `OutputStream` writer 或 pretty-print 配置。
- 不兼容 Jackson/Gson 注解。
- 不支持 alias、view、filter、injection、managed/back reference、对象标识注解、根包装或格式注解。
- 忽略 Fory core 的 `Expose`。

循环对象图最终会因 `maxDepth` 失败，不会被重建。

## 错误与故障排查

| 症状 | 处理方式 |
| ---- | -------- |
| `ForyJsonException` | 检查 JSON 语法、目标类型、映射支持、深度、尾部内容或输出原因 |
| `InsecureException` | 检查 Fory 的禁止列表和所配置的类型检查器 |
| Builder `IllegalArgumentException` | 检查配置的深度、并发、保留缓冲区和缓存字段名限制 |
| 声明类型写入失败 | 移除通配符/类型变量，并传入可赋值的值；原始类型声明拒绝 null |
| 不可变值为空 | 使用 record、有效 creator 或自定义 codec |
| `JsonValue` 读取失败 | 添加一个普通 `String` creator，或注册精确自定义 codec |
| 原始 JSON 输出无效 | 为 `JsonRawValue` 属性提供一个受信任的完整 JSON 值 |
| 无法创建普通对象 | 添加可用的无参构造器、使用 record 或 creator，或注册 codec |
| 普通访问器注解失败 | 使用符合条件的 public JavaBean 访问器，并禁用字段模式 |
| Any 注解失败 | 使用一种字段形式，或使用解析为 `Map<String, V>` 类型的有效方法对 |
| Codec 注解失败 | 解决同一节点或层次结构冲突、隐藏的嵌套覆盖或 codec 构造器访问问题 |
| 子类型失败 | 使用声明的基类型写入，列出精确运行时类，并使用配置的编码形状 |
| Collection 失败 | 以受支持接口/常用实现为目标，或注册 codec |

除 `Error` 外的 creator 失败会连同其原始 cause 一起包装。用户 codec 代码仍可能抛出自己的运行时异常。

## 相关 Java 指南

- [Java 序列化概述](index.md)
- [Native 二进制序列化](native-serialization.md)
- [Xlang 二进制序列化](xlang-serialization.md)
- [Java 配置](configuration.md)
- [故障排查](troubleshooting.md)
