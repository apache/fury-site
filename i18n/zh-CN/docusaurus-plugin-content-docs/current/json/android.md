---
title: Android
sidebar_position: 9
id: android
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

从 Android API level 26 开始，Fory JSON 可通过常规的 `fory-json` artifact 支持普通类。运行时 JSON 代码生成和异步编译会被自动禁用，因此 `ForyJson.builder().build()` 会使用解释执行的对象映射器。

Kotlin 应用使用常规 `fory-json-kotlin` 运行时。当 R8 或 ProGuard 可能重命名或移除 Kotlin 模型成员，或者 Kotlin 源码中的 Mixin 为 Java sealed 目标添加推导式 `JsonSubTypes` 时，需要使用 Kotlin Symbol Processing（KSP）。

## 安装与 Codec 模型

将 Fory JSON 添加到应用中：

```kotlin
dependencies {
  implementation("org.apache.fory:fory-json:${foryVersion}")
}
```

对于 Kotlin，请使用 Kotlin 2.3.20 并添加 Kotlin JSON 运行时：

```kotlin
plugins {
  kotlin("android") version "2.3.20"
}

dependencies {
  implementation("org.apache.fory:fory-json-kotlin:${foryVersion}")
}
```

如果应用启用 R8 或 ProGuard，或者 Kotlin 源码中的 Mixin 为 Java sealed 目标添加推导式 `JsonSubTypes`，还需使用 KSP 2.3.8：

```kotlin
plugins {
  id("com.google.devtools.ksp") version "2.3.8"
}

dependencies {
  ksp("org.apache.fory:fory-json-kotlin-ksp:${foryVersion}")
}
```

通过 `ForyJsonKotlin.builder()` 创建运行时。对于启用代码压缩的构建，请为每个必需的 Kotlin 源码模型标注 `@JsonType`。对于第三方 Kotlin 目标，应在应用源码中声明匹配该目标的 `@JsonMixin`。如果 Kotlin 源码中的 Mixin 为 Java sealed 目标添加推导式 `JsonSubTypes`，还需使用 `fory-annotation-processor` 并在 JDK 17 或更新版本上编译。

## 自定义 Codec

`@JsonCodec` 在 Android 和 JVM 上具有相同的声明行为。它支持完整值、直接的集合和数组元素、`Optional` 和 `AtomicReference` 的内容、Map 的键和值、普通 getter、setter 的值参数，以及 `JsonCreator` 参数：

```java
import java.util.List;
import org.apache.fory.json.annotation.JsonCodec;

public final class Invoice {
  @JsonCodec(elementCodec = MoneyCodec.class)
  public List<Money> items;
  private Money primary;

  public void setPrimary(@JsonCodec(MoneyCodec.class) Money primary) {
    this.primary = primary;
  }

  public Invoice() {}
}
```

子 Codec 只作用于一个直接层级。例如，`elementCodec` 在 `Money[][]` 上会处理每个 `Money[]`，而 `elementCodec` 在 `AtomicReferenceArray<Money>` 上会处理每个 `Money`。需要更深层的自定义行为时，请使用完整的 `value` Codec。

## Java 生成访问代码与 R8 规则 {#java-generated-access-and-r8-rules}

添加注解处理器，并使用 `JsonType` 标注应用的对象模型，以生成直接的字段、getter、setter、Record 构造函数、`JsonCreator` 和 `JsonValidator` 操作以及精确的 R8 规则：

```kotlin
dependencies {
  annotationProcessor("org.apache.fory:fory-annotation-processor:${foryVersion}")
}
```

```java
import org.apache.fory.json.annotation.JsonType;
import org.apache.fory.json.annotation.JsonValidator;

@JsonType
public final class Invoice {
  public long total;

  @JsonValidator
  public void validate() {
    if (total < 0) {
      throw new IllegalArgumentException("total must not be negative");
    }
  }
}
```

## Mixin

同一个处理器也支持 Fory JSON Mixin。Mixin 声明一个明确的目标，并在需要使用它的 `ForyJson` builder 上注册：

```java
import org.apache.fory.json.ForyJson;
import org.apache.fory.json.annotation.JsonBase64;
import org.apache.fory.json.annotation.JsonMixin;

@JsonMixin(target = ThirdPartyInvoice.class)
public abstract class ThirdPartyInvoiceMixin {
  @JsonBase64 byte[] signature;
}

ForyJson json =
    ForyJson.builder().registerMixin(ThirdPartyInvoiceMixin.class).build();
```

为 Java 目标编写的非空 Java 源码 Mixin 需通过 `fory-annotation-processor` 编译。注册的 Mixin 仅作用于其精确目标类型。已注册编解码器、有效类型编解码器和内置映射仍遵循常规选择优先级。

Mixin 可在与目标公共方法精确匹配的公共抽象无参 `void` 方法上标注 `JsonValidator`。目标无需仅为了 Mixin 验证器而标注 `JsonType`。

目标无需仅因使用 Mixin 而标注 `JsonType`。如果目标同时使用 `JsonType`，该 `ForyJson` 实例的有效注解仍由注册的 Mixin 定义。

一个构建完成的 `ForyJson` 实例中，每个精确目标只能启用一个 Mixin 来源。在 builder 上后注册的同目标 Mixin 会替换此前的注册，`build()` 会冻结选定的映射。

应使用 Fory 处理器，而不是宽泛的包级 keep 规则。纯 Java Mixin 配对需要 `fory-annotation-processor`；涉及 Kotlin 的配对需要 `fory-json-kotlin-ksp`。如果 Kotlin 源码中的 Mixin 为 Java sealed 目标添加推导式 `JsonSubTypes`，则两个处理器都需要，并且必须在 JDK 17 或更新版本上编译。

## 基于反射的模型

未标注 `JsonType` 的普通非 Record 类可以自行提供等效的精确规则，但声明了 `JsonValidator` 的类除外。直接声明的验证器要求使用 `JsonType` 和 `fory-annotation-processor`，手写反射规则不足以支持。请保留 Fory JSON 使用的每个模型构造函数、字段、方法、泛型签名、声明注解和参数注解，以及每个通过注解选择的编解码器的公共无参构造函数。对于没有验证器的模型：

```proguard
-keepattributes Signature,RuntimeVisibleAnnotations,RuntimeVisibleParameterAnnotations
-keepattributes AnnotationDefault,MethodParameters,InnerClasses,EnclosingMethod
-keep,allowoptimization class com.example.Invoice {
  public <init>();
  public java.util.List items;
  public void setPrimary(com.example.Money);
}
-keep,allowoptimization,allowobfuscation class com.example.MoneyCodec {
  public <init>();
}
```

同样的精确规则方法支持每一种 `JsonCodec` 成员，并不局限于完整值 Codec。普通类上的 Codec 选择不要求使用 `JsonType`。

本节的反射规则适用于 Java 模型。Kotlin 模型使用 Kotlin JSON 模块；启用代码压缩的 Android 构建应使用 KSP，而不是编写宽泛的包级 keep 规则。

Java `@JsonType` 模型支持有效的 `JsonValidator`、`JsonValue`、`JsonRawValue`、`JsonBase64` 和 `JsonFormat` 注解。未标注 `@JsonType` 时，这些注解仍可通过反射工作，但经过发布压缩的应用必须自行保留精确的注解成员、注解属性和编解码器构造函数。`JsonValue` 方法可以使用不符合 JavaBean 约定的名称，因此手写规则必须明确指定该方法。

Kotlin 模型使用相同的有效注解。启用代码压缩时，请使用 KSP。`JsonFormat` 与 JVM 上一样支持直接字段和一层包装，包括为 `Instant`、`ZonedDateTime` 和 `OffsetDateTime` 指定 `timezone`。

Android 支持为 Java 和 Kotlin sealed 层次结构推导 `JsonSubTypes`。Java sealed 推导需要 `fory-annotation-processor` 和 JDK 17 或更新版本；启用代码压缩的 Kotlin 模型需要 `fory-json-kotlin-ksp`。如果 Kotlin 源码中的 Mixin 为 Java sealed 目标添加推导式 `JsonSubTypes`，即使未启用压缩，也需要两个处理器。推导仅检查 sealed 层次结构，不支持按包或类路径扫描子类型。

Android Fory JSON 要求普通可变类保留无参构造函数；当 Android 反射能够使其可访问时，该构造函数可以不是公共的。通过 `JsonCreator` 构造的类遵循常规 creator 规则。应保留反射使用的每个字段和方法；模型无法满足这些要求时，应使用应用自定义编解码器。`JsonUnwrapped` 通过常规属性和构造路径支持可变类、creator 构造类及 Record。包含模型与每个展开的子模型均需满足常规 `JsonType` 要求。启用代码压缩的 Kotlin 构建需为每个必需模型添加注解并启用 KSP。

## Record

经过 Android 脱糖处理的 Record 必须直接声明 `@JsonType`，或使用经 `fory-annotation-processor` 处理的精确 `@JsonMixin`。仅有手写 R8 规则不够，因为 Android 不提供 Java Record 反射 API。此要求也适用于完整表示为 `JsonValue` 字符串的 Record。`JsonUnwrapped` 路径中的每个 Record 都需要自己的直接 `JsonType` 声明或已处理的精确 `JsonMixin`。子编解码器与 JVM 上一样仅作用于一层；更深层的嵌套行为应使用完整值编解码器。
