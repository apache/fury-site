---
title: Android
sidebar_position: 6
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

## 安装与运行时模型

将 Fory JSON 添加到应用中：

```kotlin
dependencies {
  implementation("org.apache.fory:fory-json:${foryVersion}")
}
```

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

## 生成的访问代码与 R8 规则

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

同一个处理器也支持 Fory JSON Mixin。Mixin 声明一个明确的目标，并在需要使用它的运行时上注册：

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

使用 `fory-annotation-processor` 编译每个非空 Mixin 源。处理器会生成精确的 R8 规则，以及运行时可使用的、特定于该 Mixin 与目标配对的操作。已注册的 Codec、有效的类型 Codec 和内置映射仍遵循其常规的运行时优先级。空 Mixin 不会生成任何输出。

Mixin 可以将 `JsonValidator` 放在一个 public abstract、无参数、返回 `void` 的方法上，该方法必须与目标类中的一个 public 方法完全匹配。生成的配对代码会直接调用该目标方法。目标类不需要仅为了 Mixin validator 而添加 `JsonType`。

目标类也不需要仅因为拥有 Mixin 而添加 `JsonType`。`JsonMixin` 本身就是该配对的处理器入口。如果目标类同时使用 `JsonType`，运行时会为已注册的非空 Mixin 选择特定于该配对的 companion，而不是将 overlay 与目标类的直接 companion 组合起来。

在一次构建出的运行时中，一个明确的目标只能启用一个源。在 builder 上，针对该目标的后续注册会替换先前注册，`build()` 会对选定映射生成快照。处理器可以为多个候选源生成 artifact；运行时只使用最后注册的源。

对于非空 Mixin，请使用处理器生成的 R8 规则，而不要使用宽泛的 package keep 规则。

## 基于反射的模型

未使用 `JsonType` 的普通非 Record 类可以自行提供等效的精确规则，但声明了 `JsonValidator` 的类除外。直接 validator 需要 `JsonType` 生成的处理器调用；不要用反射规则替代它们。需要保留 Fory JSON 使用的每个模型构造函数、字段、方法、泛型签名、声明注解和参数注解，以及每个由注解选中的 Codec 的 public 无参数构造函数。对于没有 validator 的模型：

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

对于 `@JsonType` 模型，生成的操作和 R8 规则还会覆盖有效的 `JsonValidator` 方法、`JsonValue` 字段和有效方法、固定的 `JsonRawValue` 和 `JsonBase64` 字段及 getter、`JsonFormat` 日期/时间字段、它们的运行时注解，以及 Base64 Codec 构造函数。如果不使用 `@JsonType`，value、raw、Base64、format 和 Codec 注解仍可通过反射工作，但经过 release 混淆压缩的应用必须保留精确的被注解成员、注解属性和 Codec 构造函数本身。`JsonValue` 方法可以使用非 JavaBean 名称，因此其手动规则必须明确写出该方法名。`JsonFormat` 保持与 JVM 相同的直接字段和单层包装行为，包括 `timezone` 对 `Instant`、`ZonedDateTime` 和 `OffsetDateTime` 的支持。

Android Fory JSON 要求为普通可变类保留无参数构造函数；当 Android 反射可以使其可访问时，该构造函数可以不是 public。由 `JsonCreator` 构造函数支持的类遵循常规 creator 规则。请保留所有通过反射使用的字段和方法；如果模型无法满足这些要求，请使用应用自定义 Codec。`JsonUnwrapped` 通过各自正常的属性和构造路径支持可变类、由 creator 支持的类和 Record。当包含它的模型及其 unwrapped 子对象都使用 `JsonType` 时，它们生成的 companion 会提供这些操作。

## Record

经过 Android desugaring 的 Record 需要由直接的 `@JsonType` 声明或已编译的精确 `@JsonMixin` 配对生成处理器操作。仅靠手动 R8 规则无法重建 Record component 的顺序，因为 Android 不提供 Java Record 反射 API。这也适用于完整表示形式为 `JsonValue` String 的 Record：生成的 companion 会识别传播的 component accessor，并直接调用带注解的单 String canonical constructor。生成的子 Codec 与 JVM 上一样只作用于一个层级。`JsonUnwrapped` 路径中的每个 Record 都需要自己的直接 `JsonType` 声明或已编译的精确 `JsonMixin` 配对。对于更深层的嵌套行为，请使用完整值 Codec。
