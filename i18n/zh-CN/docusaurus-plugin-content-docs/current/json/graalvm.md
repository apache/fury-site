---
title: GraalVM 原生镜像
sidebar_position: 10
id: graalvm
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

## 可达模型

Fory JSON 使用一个 Native Image Feature。Java 模型通过可达注解发现，Feature 不使用 Java 注解处理器。请为原生可执行文件需要读写的每个可达具体 Java 对象模型添加 `@JsonType`：

```java
import org.apache.fory.json.ForyJson;
import org.apache.fory.json.annotation.JsonType;
import org.apache.fory.json.annotation.JsonValidator;

@JsonType
public final class User {
  public long id;
  public String name;

  @JsonValidator
  public void validate() {
    if (id < 0) {
      throw new IllegalArgumentException("id must not be negative");
    }
  }
}

public class JsonExample {
  public static void main(String[] args) {
    ForyJson json = ForyJson.builder().build();
    User user = json.fromJson("{\"id\":1,\"name\":\"Ada\"}", User.class);
    System.out.println(json.toJson(user));
  }
}
```

这已足以支持正确的原生执行。构建镜像期间，Fory JSON 保留模型元数据，准备字段、属性、creator、Record 和 `JsonAnySetter` 的访问方式，并为默认配置下的可达模型生成编解码器。运行时，`ForyJson.builder().build()` 使用这些生成的编解码器；没有匹配的生成编解码器时回退到解释执行，无需应用提供反射配置、包 exports/opens 或构建期初始化。

配置为构建期初始化的应用类可以在镜像堆中保留静态 `ForyJson`。如果运行时处理器数量可能与构建机器不同，请显式设置 `withConcurrencyLevel`。该 `ForyJson` 保留的任何自定义编解码器或模块实例，也必须能够安全地在构建期创建和存储。

如果自定义配置只能在运行时实例化，请从可达的 `@ForyJsonProvider` 返回一个等价的临时配置，供镜像构建阶段生成代码，然后在镜像启动后创建应用实际使用的 `ForyJson`。provider 自身在镜像分析期间运行，并不负责创建运行时实例。

## 生成的 Codec

默认配置的编解码器会自动生成。要为自定义配置增加生成的编解码器，请从可达的 `@ForyJsonProvider` 返回该完整配置：

```java
import org.apache.fory.json.ForyJson;
import org.apache.fory.json.PropertyNamingStrategy;
import org.apache.fory.json.annotation.ForyJsonProvider;

@ForyJsonProvider
public final class JsonConfigs {
  private final ForyJson api =
      ForyJson.builder()
          .writeNullFields(true)
          .withPropertyNamingStrategy(PropertyNamingStrategy.SNAKE_CASE)
          .registerCodec(Money.class, new MoneyCodec())
          .build();

  public JsonConfigs() {}

  public ForyJson api() {
    return api;
  }
}
```

provider 类必须是公共具体类，且拥有公共无参构造函数。provider 成员必须是公共、非静态、无参的实例方法，并且精确返回类型为 `ForyJson`。继承的父类方法和公共接口默认方法也包括在内。一个 provider 可返回多个配置，也可同时存在多个可达 provider。

Provider 对象仅在镜像构建期间存在。建议像上例一样使用带有实例字段和方法的专用配置类；不需要应用添加 `native-image.properties` 条目，也不需要将 provider package export 或 open 给 Fory。不支持 static provider 方法和字段。

存在 provider 时，默认配置的编解码器仍然可用，每个可达 provider 还会为其配置增加编解码器。启用代码生成的运行时在找不到匹配的生成编解码器时使用解释执行编解码器。两种情况下都保留反射元数据。

`withCodegen(false)` 显式选择解释执行编解码器，不查找生成的编解码器。原生可执行文件中禁用异步编译。

### Kotlin 配置 {#kotlin-configurations}

Kotlin Native Image 支持使用相同的 Feature 和 provider API。添加 Kotlin 运行时，然后返回安装了 `ForyJsonKotlin` 且启用代码生成的配置：

```kotlin
import org.apache.fory.json.ForyJson
import org.apache.fory.json.annotation.ForyJsonProvider
import org.apache.fory.json.kotlin.ForyJsonKotlin

@ForyJsonProvider
class JsonConfigs {
  fun api(): ForyJson = ForyJsonKotlin.builder().build()
}
```

为每个可达具体 Kotlin 模型标注 `@JsonType`，或为第三方目标注册精确且可达的 Mixin。Fory 在构建镜像时读取并验证 Kotlin 元数据，然后为每个可达、启用 Kotlin 的 provider 配置生成编解码器。如果 provider 配置禁用代码生成，或使用不支持的元数据 ABI，镜像构建会失败。启用 Kotlin 的运行时配置若没有匹配的生成编解码器，则使用已准备的解释执行编解码器。

精确的 Kotlin 泛型根类型只有在其完整绑定通过可达具体根类型的属性、构造函数参数、容器/Map 子类型或封闭子类型可达时才可用。直接调用根操作时仍使用 `jsonTypeRef<T>()`，不需要公共根类型注册表或反射配置。

## Mixin

对于无法修改的模型，请使用 Fory JSON Mixin：

```java
import org.apache.fory.json.ForyJson;
import org.apache.fory.json.annotation.JsonMixin;
import org.apache.fory.json.annotation.JsonProperty;

@JsonMixin(target = ThirdPartyUser.class)
public abstract class ThirdPartyUserMixin {
  @JsonProperty("user_id")
  long id;
}

public class JsonExample {
  public static void main(String[] args) {
    ForyJson json =
        ForyJson.builder().registerMixin(ThirdPartyUserMixin.class).build();
    ThirdPartyUser user = json.fromJson("{\"user_id\":1}", ThirdPartyUser.class);
    System.out.println(json.toJson(user));
  }
}
```

`JsonMixin` 是其明确声明目标的构建时入口，因此目标类不需要仅为了使用 Mixin 而添加 `JsonType`。已注册的 Mixin 类字面量必须从应用代码中可达。Native Image Feature 会保留目标元数据，并准备与直接 `JsonType` 模型相同的访问方式。仅当返回的 `ForyJson` 中注册了该明确的 Mixin 时，provider 配置才会为 Mixin 的目标生成代码。

在构建出的一个 `ForyJson` 中，一个明确的目标只能启用一个源。后续注册会替换先前的源，并影响之后的 `build()` 调用；每个构建完成的 `ForyJson` 实例都会保留构建时生成的不可变快照。

## 类型发现与构造

无需额外配置 Native Image Feature。`@JsonType` 不会被继承，因此每个具体应用模型都要单独标注。带有 class literal `@JsonSubTypes` 表的已标注基类型会自动注册其显式或推导子类型。可达的 Java、Kotlin 和 Scala 3 sealed Schema 支持空表。其他可达的具体 `Collection` 和 `Map` 根类型需要公共无参构造函数。仅通过运行时解析类名引用的类不可达，因此原生镜像不支持 `JsonSubTypes.Type.className`。

不要添加应用反射配置。原生可执行文件使用与 JVM 相同的有效注解。Kotlin 应用使用上面的 provider 流程，也应避免包级 opens。

## 注解与自定义 Codec

有效的 `JsonValidator` 方法必须是 public、无参数、返回类型为 `void` 的实例方法。直接声明 validator 的模型必须使用 `JsonType`。由已注册 Mixin 提供的 validator 使用该明确的 Mixin 与目标配对，因此目标类不需要再添加 `JsonType`。Native Image Feature 会为解释执行的配置准备 validator 访问，而 provider 生成的 Codec 会调用相同的有效 validator。不要为 validator 添加反射配置。完整自定义 Codec、完整 `JsonValue` 表示，以及自身实施验证的 creator 会自行执行验证。

支持在类型、字段、有效的普通 getter、setter 值参数和 `JsonCreator` 参数上使用 `@JsonCodec` 注解。Feature 会保留每个选定的完整值、元素、内容、Map 键和 Map 值 Codec 的构造函数。这与 JVM 和 Android 使用的注解模型相同。

支持 `JsonValue` 字段和有效的 public 无参数方法，包括匹配的单 String `JsonCreator` 构造函数和 public static factory。固定的 `JsonRawValue` 字段和 getter 支持可信的原始 String 值；固定的 `JsonBase64` 字段和 getter 与 JVM 上一样支持 Base64 `byte[]` 值。`JsonFormat` 日期/时间字段使用与 JVM 相同的直接字段、单层包装和 `timezone` 行为。对于直接放在目标类上的注解，请使用 `JsonType` 标注每个可达的所属模型，以便 Native Image 保留这些成员和 Base64 Codec 构造函数。
直接标注的 `JsonValue` Record 会使用生成的 component accessor 和 canonical constructor 操作。由 Mixin 提供的有效声明则使用上述 Mixin 工作流。

`JsonAnyProperty` 和 `JsonAnyGetter` 会将其 Map 展平到外层对象中。可以在该字段或 getter 上使用 `@JsonCodec(valueCodec = ...)` 来定制每个动态值。`JsonAnySetter` 的第二个参数可以对自身的值结构使用常规配置。

`JsonUnwrapped` 使用与 JVM 相同的行为。对于直接放在目标类上的注解，请使用 `JsonType` 标注包含它的模型以及每个 unwrapped 子对象或中间对象。Mixin 会保留其有效 Schema 能够到达的 unwrapped 模型；只有当子对象的注解也需要 overlay 时，才为该子对象注册单独的明确 Mixin。

子 Codec 只作用于一个直接层级。`elementCodec` 支持 `Collection`、Java 数组和 `AtomicReferenceArray`；`contentCodec` 支持 `Optional` 和 `AtomicReference`；`keyCodec` 和 `valueCodec` 支持 Map 的键和值。完整的 `value` Codec 不能与子 Codec 组合使用。

注解 Codec 必须具有 public 无参数构造函数。Fory 会在 Native Image 构建期间准备该构造函数，因此应用模块无需 export 或 open Codec package。通过 `registerCodec` 提供的 Codec 实例由应用构造，不需要注解构造函数元数据。
