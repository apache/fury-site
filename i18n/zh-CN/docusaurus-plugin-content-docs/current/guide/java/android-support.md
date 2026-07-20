---
title: Android 支持
sidebar_position: 15
id: android_support
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

## Android 运行时

Fory Java 通过常规的 `fory-core` 构件支持 Android 8.0+（API level 26+）。核心对象序列化不需要单独的 Android 构件。

在 Android 上使用核心对象序列化：

- `Fory#serialize(Object)` 和 `Fory#deserialize(byte[])`。
- `BaseFory#deserialize(ByteBuffer)`，用于堆、直接和只读 `ByteBuffer` 输入。
- Stream、channel 和 out-of-band buffer API，可通过 byte-array、heap-buffer 或 `ByteBuffer` 复制路径使用。
- Java collections/maps 和 xlang collections/maps。

`java/fory-format` row-format API 仅适用于 JVM，不支持 Android。

## 运行时代码生成

Android 上会禁用运行时序列化器代码生成。如果设置了 `withCodegen(true)`，Fory 会让 Android 序列化保持在非代码生成路径，并记录一条警告日志。

需要生成序列化器的 Android 应用应改用构建时静态生成序列化器。

## Fory JSON

Fory JSON 通过常规的 `fory-json` 构件支持 Android API level 26 及以上版本中的普通类。运行时 JSON 代码生成和异步编译会自动禁用，因此 `ForyJson.builder().build()` 使用解释执行的对象映射器。

在应用中添加 Fory JSON：

```kotlin
dependencies {
  implementation("org.apache.fory:fory-json:${foryVersion}")
}
```

`@JsonCodec` 在 Android 和 JVM 上具有相同的声明行为。它支持完整值、直接的 collection 和数组元素、`Optional` 和 `AtomicReference` 的内容、Map 的 key 和 value、普通 getter、setter 的 value 参数，以及 `JsonCreator` 参数：

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

子 codec 只作用于直接的一层。例如，`Money[][]` 上的 `elementCodec` 会处理每个 `Money[]`，而 `AtomicReferenceArray<Money>` 上的 `elementCodec` 会处理每个 `Money`。如果需要更深层的自定义行为，请使用完整的 `value` codec。

添加注解处理器，并使用 `JsonType` 标注应用的对象模型，以生成直接的字段、getter、setter、Record 构造函数和 `JsonCreator` 操作，以及精确的 R8 规则：

```kotlin
dependencies {
  annotationProcessor("org.apache.fory:fory-annotation-processor:${foryVersion}")
}
```

```java
import org.apache.fory.json.annotation.JsonType;

@JsonType
public final class Invoice {
  // ...
}
```

同一个处理器也支持 Fory JSON Mixin。Mixin 声明一个确定的目标，并注册到要使用它的运行时：

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

每个非空 Mixin 源都必须使用 `fory-annotation-processor` 编译。处理器会生成精确的 R8 规则，以及运行时可以使用的配对专用目标操作。已注册的 codec、有效类型 codec 和内置映射仍遵循常规的运行时优先级。空 Mixin 不会生成任何输出。

目标不必仅仅因为拥有 Mixin 就添加 `JsonType`；`JsonMixin` 本身就是该配对的处理器入口。如果目标同时使用 `JsonType`，运行时会为已注册的非空 Mixin 选择配对专用 companion，而不会把 overlay 与目标自身的 companion 合并。

在一个构建完成的运行时中，一个确定的目标只能启用一个源。在 builder 上，后续针对同一目标的注册会替换之前的注册，`build()` 会对所选映射建立快照。处理器可以为多个候选源生成构件，但运行时只使用最后注册的源。

对于非空 Mixin，应使用处理器生成的 R8 规则，而不是宽泛的 package keep 规则。

未使用 `JsonType` 的普通非 Record 类可以自行提供等效的精确规则。请保留 Fory JSON 使用的每个模型构造函数、字段、方法、泛型签名、声明注解和参数注解，以及每个通过注解选择的 codec 的 public 无参构造函数。对于前面的 `Invoice` 示例：

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

同一套精确规则适用于每一种 `JsonCodec` 成员，并不限于完整值 codec。普通类无需使用 `JsonType` 即可完成 codec 选择。

对于 `@JsonType` 模型，生成的 R8 规则还会保留 `JsonValue` 字段和有效方法、固定的 `JsonRawValue` 和 `JsonBase64` 字段与 getter、它们的运行时注解，以及 Base64 codec 构造函数。如果没有 `@JsonType`，这些注解仍可通过反射工作，但经过 release 混淆压缩的应用必须自行保留对应的注解成员、注解属性和 codec 构造函数。`JsonValue` 方法可能使用非 JavaBean 名称，因此手写规则必须显式写出该方法名。

Android Fory JSON 要求保留普通可变类的无参构造函数；只要 Android 反射能够使其可访问，该构造函数可以不是 public。由 `JsonCreator` 构造函数支持的类则遵循常规的 creator 规则。请保留反射使用的每个字段和方法；如果模型无法满足这些要求，请使用应用提供的 codec。`JsonUnwrapped` 通过各自常规的属性与构造路径支持可变类、creator-backed 类和 Record。当外层模型及其 unwrapped 子对象使用 `JsonType` 时，生成的 companion 会提供这些操作。

经 Android desugar 的 Record 必须使用处理器生成的操作，这些操作可以来自直接的 `@JsonType` 声明，也可以来自已编译的确定 `@JsonMixin` 配对。仅靠手写 R8 规则无法还原 Record component 的顺序，因为 Android 不提供 Java Record 反射 API。对于完整表示为 `JsonValue` String 的 Record 也是如此：生成的 companion 会识别传播后的 component accessor，并直接调用带注解的单 String canonical 构造函数。生成的子 codec 与 JVM 上一样，只作用于一层。`JsonUnwrapped` 路径中的每个 Record 都需要自身直接声明 `JsonType`，或拥有已编译的确定 `JsonMixin` 配对。如需处理更深的嵌套行为，请使用完整值 codec。

## 静态生成序列化器

Android 应用类应使用 `@ForyStruct` 静态生成序列化器。它们由 javac 在应用构建期间生成，无需运行时字节码生成即可工作。

### 安装注解处理器

将 `fory-annotation-processor` 添加到编译 Android 模型类的模块的注解处理器路径中：

```xml
<build>
  <plugins>
    <plugin>
      <groupId>org.apache.maven.plugins</groupId>
      <artifactId>maven-compiler-plugin</artifactId>
      <configuration>
        <annotationProcessorPaths>
          <path>
            <groupId>org.apache.fory</groupId>
            <artifactId>fory-annotation-processor</artifactId>
            <version>${fory.version}</version>
          </path>
        </annotationProcessorPaths>
      </configuration>
    </plugin>
  </plugins>
</build>
```

然后使用 `@ForyStruct` 标注 Android 模型类。

当被序列化类使用 Fory type-use 注解时，Android 上必须使用静态生成序列化器，例如：

```java
import java.util.List;
import org.apache.fory.annotation.ForyStruct;
import org.apache.fory.annotation.UInt8Type;

@ForyStruct
public class ImageBlock {
  public List<@UInt8Type Integer> pixels;
}
```

如果没有生成的静态描述符，Android 反射可能无法暴露 `@Ref`、`@Int8Type`、`@UInt8Type`、`@Float16Type` 或 `@BFloat16Type` 等注解所需的嵌套 type-use 元信息。这些类的序列化将无法获得 Fory 所需的 Schema 信息。

设置说明见[静态生成序列化器](static-generated-serializers.md)。

## 对象模型要求

Android 序列化器使用公开的 Android 运行时能力。对于应用类，优先使用：

- 可访问的无参构造函数，或带受支持构造函数的 records。
- public、protected 或 package-private 的序列化字段。
- 用于 private 序列化字段的非 private getter 和 setter。
- Android 模型类的 `@ForyStruct` 静态生成序列化器。

普通类中的 final 字段不适合生成的 read/copy 方法。基于构造函数的不可变值应使用 records。

## 不支持的功能

Android 不支持以下 JVM 功能：

- 运行时序列化器代码生成和异步编译。
- Lambda 和 `SerializedLambda` 序列化。
- 原生地址序列化 API 和原生地址 `MemoryBuffer` 包装。
- 原始 unsafe 内存复制 API。
- `java/fory-format` row-format API。

## ByteBuffer

`BaseFory#deserialize(ByteBuffer)` 通过将剩余字节复制到 Fory 拥有的堆缓冲区，在 Android 上支持堆、直接和只读缓冲区。调用方缓冲区的 position 和 limit 不会改变。

原始 direct-buffer 地址包装是仅限 JVM 的快速路径，Android 上不会使用。

## Collections、Maps 和 Proxies

Android 支持常见的 JDK collection 和 map 实现。在 xlang 模式下，collection 和 map 序列化使用 xlang 协议，不编码 Java wrapper/view 内部结构。

`java.lang.reflect.Proxy` 序列化支持普通代理用法。代理仍在反序列化时，不要调用、记录或将其作为 map/set key 使用；此时 invocation handler 可能尚未准备好。
