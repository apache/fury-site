---
title: 对象映射
sidebar_position: 3
id: object-mapping
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

## 线程安全、复用与代码生成

`ForyJson` 在调用 `build()` 后不可变且线程安全。应复用同一个实例，而不是为每次操作都创建
builder 和运行时。已注册及通过注解选定的 `JsonValueCodec` 实例和 `JsonTypeChecker` 可能被
并发调用，因此也必须是线程安全的。

默认启用代码生成和异步编译。在诊断问题或运行环境禁止运行时编译时，可以禁用代码生成：

```java
ForyJson json =
    ForyJson.builder()
        .withCodegen(false)
        .withAsyncCompilation(false)
        .build();
```

`withConcurrencyLevel` 设置可并发执行的根操作数量上限。其他调用方需要等待，直至某个固定的
执行状态可用。同一个 `ForyJson` 实例上的根 API 不可重入：自定义编解码器必须继续使用传入的
具体 reader 或 writer，而不能在该实例上调用 `toJson`、`toJsonBytes`、`writeJsonTo` 或
`fromJson`。

## Java 对象映射

### 默认属性发现

默认情况下，Fory JSON 会把 Java 属性名相同的成员合并为一个逻辑属性：

- 类层次结构中符合条件的实例字段，包括 private、protected、包私有和 public 字段；
- 名为 `getX()` 的 public 非 static JavaBean getter；
- 名为 `isX()` 的 public 非 static boolean getter；
- 名为 `setX(value)` 的 public 非 static void setter。

static、transient、synthetic 和 `Class<?>` 字段会被排除。`getClass()` 以及值类型为 `Class<?>`
的访问器也会被排除。在不符合条件的成员上放置注解会直接报错，而不是被静默忽略。

普通 final 字段可以写出，但不会作为反序列化时的可变写入目标。不可变对象应使用 record、
`JsonCreator` 或自定义编解码器来构造。

### 字段模式

字段模式会停用 getter 和 setter 发现，但仍保留符合条件的字段：

```java
ForyJson json = ForyJson.builder().withFieldMode(true).build();
```

字段模式下，方法不属于 JSON 属性模型，因此在方法上使用注解是无效的。

### 构造与输入行为

Fory JSON 支持普通具体类、Java record，以及显式声明 `JsonCreator` 构造函数或工厂方法的类。

- record 使用其规范构造函数。
- 基于 creator 的类仅使用声明的 creator 读取 Schema，之后不会调用 setter。
- 未知的对象成员会被跳过。
- 带无参构造函数的普通类会先运行该构造函数，再为可读属性赋值。因此，缺失属性会保留字段
  初始化器或该构造函数设定的值。
- 在普通 JVM 上，不带无参构造函数的类会在不运行构造函数或字段初始化器的情况下完成分配。
  其缺失属性会保留 JVM 的零值或 null 值。
- creator 的引用类型参数默认为 null，基本类型参数默认为零。
- 重复的普通属性以最后一个值为准。多态鉴别字段的要求更严格，必须且只能出现一次。
- 基本类型目标不接受 JSON null。大多数引用类型目标会返回 null，但选定的内置或自定义编解码器
  可以定义不同的结果；例如，声明为 `Optional` 的目标会返回 `Optional.empty()`。

Android 无法构造不具备可用无参构造函数的普通类。JDK 25 及更高版本上的 GraalVM native image
对大多数普通类也有这一要求；唯一受支持的例外是：某个 `Serializable` 类的第一个不可序列化
超类为 `Object`。如需可移植的构造约定，请使用 record、`JsonCreator` 或无参构造函数。不要把
普通构造函数的副作用用作反序列化完成钩子：即使无参构造函数会运行，属性赋值也发生在其后；
而绕过构造函数的路径根本不会运行它。

## 支持的 Java 类型

下列类型组具有内置映射。具体编码表示形式都是稳定的 JSON 值，但在精度或构造方式很重要时，应用
Schema 仍应声明预期的 Java 类型。

| 类型组            | 支持的类型与行为                                                                                                                                                                                                                                      |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 核心标量          | `boolean`、数值基本类型、`char`、对应的装箱类型、`String`、`CharSequence`、`StringBuilder`、`StringBuffer`                                                                                                                                            |
| 数值              | `Number`、`BigInteger`、`BigDecimal`、Fory `Float16` 和 `BFloat16`、`AtomicInteger`、`AtomicLong`                                                                                                                                                     |
| 枚举              | 枚举常量名表示为 JSON 字符串                                                                                                                                                                                                                          |
| 数组              | 基本类型数组、装箱类型数组、String 数组、对象数组和多维数组                                                                                                                                                                                           |
| 集合              | `Collection`、`List`、`Set`、`Queue`、deque、blocking、sorted 和 navigable 接口；对应的抽象基类；`EnumSet`；以及具有可访问无参构造函数的具体实现                                                                                                      |
| Map               | `Map`、sorted、navigable 和 concurrent 接口；`AbstractMap`；`EnumMap`；以及具有可访问无参构造函数的具体实现                                                                                                                                           |
| Optional 与原子类 | `Optional`、`OptionalInt`、`OptionalLong`、`OptionalDouble`、`AtomicBoolean`、`AtomicReference` 和原子数组                                                                                                                                            |
| 时间              | `Date`、`Calendar`、`TimeZone`、`LocalDate`、`LocalTime`、`LocalDateTime`、`Instant`、`Duration`、`ZoneOffset`、`ZoneId`、`ZonedDateTime`、`Year`、`YearMonth`、`MonthDay`、`Period`、`OffsetTime`、`OffsetDateTime` 以及受支持的 chronology 日期类型 |
| 其他 JDK 类型     | `UUID`、`URI`、`File`、`Path`、`Locale`、`Charset`、`Currency`、`Pattern`、`BitSet`、`ByteBuffer`                                                                                                                                                     |
| 可选模块          | `java.sql.Date`、`Time` 和 `Timestamp`；存在 Guava 时还支持 Guava `ImmutableList`、`ImmutableSet`、`ImmutableSortedSet`、`ImmutableMap`、`ImmutableBiMap`、`ImmutableSortedMap` 和 `ImmutableIntArray`                                                |
| 对象              | 可变具体类、record、基于 creator 的类、`JsonObject` 和 `JsonArray`                                                                                                                                                                                    |

集合接口会根据声明的接口使用标准可变实现进行重建，例如 `ArrayList`、`LinkedHashSet`、
`ArrayDeque`、`LinkedBlockingQueue`、`LinkedBlockingDeque` 或 `TreeSet`。Map 接口同样会使用
`LinkedHashMap`、`TreeMap`、`ConcurrentHashMap` 或 `ConcurrentSkipListMap`。无法重建
`ArrayBlockingQueue`、`Arrays.asList` 的结果、JDK 不可变集合、空集合/单例集合/不可修改包装器、
受构造函数约束的实现，以及未列出的 Guava 不可变实现。Guava 支持是可选的，并不会使 Guava
成为必需的运行时依赖。

非有限 float 和 double 值使用带引号的字符串 `"NaN"`、`"Infinity"` 和 `"-Infinity"`。
需要保留任意精度时，请使用显式的 `BigInteger` 或 `BigDecimal` 目标类型。

### 内置表示形式

这些内置值使用以下常规 JSON 形式：

| Java 类型                                                                 | JSON 表示形式                                                                                      |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Enum                                                                      | 常量名称字符串                                                                                     |
| `Date`、`Calendar`、`java.sql.Date`、`Time`、`Timestamp`                  | 表示 epoch 毫秒数的数值                                                                            |
| `TimeZone`                                                                | 时区 ID 字符串                                                                                     |
| Java 时间类型以及受支持的 chronology 日期类型                             | 对应的标准文本形式字符串                                                                           |
| `UUID`、`URI`、`File`、`Path`、`Locale`、`Charset`、`Currency`、`Pattern` | 对应类型的文本字符串；`File` 和 `Path` 使用路径文本，`Locale` 使用语言标签，`Pattern` 不保留 flags |
| `BitSet`                                                                  | 由有符号 `long` 字组成的数组，来源为 `BitSet.toLongArray()`                                        |
| `ByteBuffer`                                                              | 从 position 到 limit 的剩余范围所对应的有符号字节值数组                                            |
| Optional 和原子包装类型                                                   | 直接使用其中包含的标量、数组或值                                                                   |

`Calendar` 会把 epoch 毫秒数读入新的 `GregorianCalendar`；不会保留原始日历子类型、时区和其他配置。
null `Optional` 引用和空 `Optional` 都会写为 JSON null；将 JSON null 读取为声明的 Optional 类型时，
会得到相应的空 Optional。

### 动态 JSON 树

以 `Object` 类型读取时，会使用自然的 JSON 值：

| JSON 值                | Java 值      |
| ---------------------- | ------------ |
| 对象                   | `JsonObject` |
| 数组                   | `JsonArray`  |
| 字符串                 | `String`     |
| 布尔值                 | `Boolean`    |
| `long` 范围内的整数    | `Long`       |
| 更大的整数             | `BigInteger` |
| 小数或带指数形式的数值 | `Double`     |
| Null                   | `null`       |

`JsonObject` 会保留成员插入顺序，`JsonArray` 可变。也可以直接创建并写出它们。

```java
import org.apache.fory.json.JsonArray;
import org.apache.fory.json.JsonObject;

JsonObject object = new JsonObject();
JsonArray items = new JsonArray();
items.add(1);
items.add("two");
object.put("items", items);

String encoded = json.toJson(object);
```

### Map 键

JSON 对象成员名都是字符串。声明的 Map 键支持 `String`、`byte`、`short`、`int`、`long`、
对应的装箱类型和枚举。声明使用 `Object` 键的 Map 可以写出 String、数值、boolean、字符和
枚举键，但读取时都会得到字符串，因为 JSON 不保留原始键类型。不接受 null Map 键。

## Builder 配置

| Builder 方法                           | 默认值                                    | 用户可见的效果                                 |
| -------------------------------------- | ----------------------------------------- | ---------------------------------------------- |
| `writeNullFields(boolean)`             | `false`                                   | 是否默认包含值为 null 的对象属性               |
| `withCodegen(boolean)`                 | `true`                                    | 启用生成的对象编解码器                         |
| `withAsyncCompilation(boolean)`        | `true`                                    | 异步编译生成的编解码器                         |
| `withFieldMode(boolean)`               | `false`                                   | 为 true 时，仅发现字段而不使用 getter/setter   |
| `withPropertyNamingStrategy(strategy)` | `LOWER_CAMEL_CASE`                        | 为未显式指定 `JsonProperty` 名称的属性命名     |
| `withMaxCachedFieldNames(int)`         | `DEFAULT_MAX_CACHED_FIELD_NAMES` (`8192`) | 每个 reader 的字段名缓存条目数；零表示禁用缓存 |
| `withConcurrencyLevel(int)`            | `max(1, 2 * processors)`                  | 根操作的最大并发数                             |
| `withBufferSizeLimitBytes(int)`        | 2 MiB                                     | 每个池化 writer 可保留的最大复用容量           |
| `registerCodec(type, codec)`           | None                                      | 替换该精确类的完整 JSON 编解码器               |
| `registerMixin(mixinType)`             | None                                      | 将一个注解 Mixin 应用于其精确声明的目标        |

并发级别和缓冲区保留限制必须为正数。字段名缓存上限分别应用于每个 reader；零会禁用该缓存。该上限
只限制缓存的字段名数量，不限制输入中可接受的名称。缓冲区保留设置不会限制 JSON 输入或输出大小，
只限制一次操作结束后保留以供复用的 writer 存储空间。

有关类加载、类型策略、嵌套深度、对象图内存限制和外部输入控制，请参阅
[Fory JSON 安全](security.md)。

调用 `build()` 之后再修改 builder，不会改变已有的 `ForyJson` 运行时。

在 Android 上，运行时代码生成和异步编译会被禁用。在 GraalVM native image 中，运行时编译不可用；
可达 `ForyJsonProvider` 返回的配置会使用构建 image 时生成的编解码器，其他配置则使用带有构建时
预处理访问元数据的解释型编解码器。其他所有 builder 选项仍保持上述行为。
