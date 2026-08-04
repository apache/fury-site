---
title: GraalVM 原生镜像
sidebar_position: 7
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

Fory JSON 拥有自己的 Native Image Feature，不使用 Fory 注解处理器。请为原生可执行文件读写的每个可达具体对象模型添加 `@JsonType`：

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

这样就足以保证原生执行的正确性。构建镜像时，Fory JSON 会保留模型元数据，并准备其字段、属性、creator、record 和 `JsonAnySetter` 访问。因此在运行时，`ForyJson.builder().build()` 可以使用解释执行的 Codec，而无需应用提供反射配置、package export 或 open，也无需进行构建时初始化。

## 生成的 Codec

要为某项配置包含生成的 Codec，请从可达的 `@ForyJsonProvider` 返回该完整配置：

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

provider 类必须是 public 的具体类，并且具有 public 无参数构造函数。Provider 成员是 public、非 static、无参数的实例方法，其精确返回类型为 `ForyJson`。其中也包括继承的父类方法和 public 接口默认方法。一个 provider 可以返回多项配置，也可以存在多个可达 provider。等效配置只会生成一次。

Provider 对象仅在镜像构建期间存在。建议像上例一样使用带有实例字段和方法的专用配置类；不需要应用添加 `native-image.properties` 条目，也不需要将 provider package export 或 open 给 Fory。不支持 static provider 方法和字段。

只有 provider 返回的配置会获得生成的 Codec。默认配置不会隐式生成。如果某项启用了代码生成的运行时配置未被包含，Fory JSON 会使用已准备好的解释执行 Codec，并在整个进程范围内记录一条警告，建议提供可达的 `@ForyJsonProvider`。`withCodegen(false)` 会明确选择解释执行的 Codec，且不会请求查找生成的 Codec。原生可执行文件中会禁用异步编译。

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

在构建出的一个 `ForyJson` 中，一个明确的目标只能启用一个源。后续注册会替换先前的源，并影响之后的 `build()` 调用；运行时会保留构建时生成的不可变快照。

## 类型发现与构造

`fory-json` artifact 会自动激活其 Native Image Feature。`@JsonType` 不会被继承，因此请标注每个具体的运行时模型。带有 class-literal `@JsonSubTypes` 表的已标注基类会自动注册表中列出的子类型。专门支持的容器（包括 `EnumMap` 和 `EnumSet`）使用其内置 factory。其他可达的具体 `Collection` 和 `Map` 根类型需要 public 无参数构造函数。仅由运行时字符串引用的类是不可达的；因此原生镜像不支持 `JsonSubTypes.Type.className`。

不要添加应用反射配置来替代生成的配置。原生可执行文件会解析与 JVM 相同的有效注解。

## 注解与自定义 Codec

有效的 `JsonValidator` 方法必须是 public、无参数、返回类型为 `void` 的实例方法。直接声明 validator 的模型必须使用 `JsonType`。由已注册 Mixin 提供的 validator 使用该明确的 Mixin 与目标配对，因此目标类不需要再添加 `JsonType`。Native Image Feature 会为解释执行的配置准备 validator 访问，而 provider 生成的 Codec 会调用相同的有效 validator。不要为 validator 添加反射配置。完整自定义 Codec、完整 `JsonValue` 表示，以及自身实施验证的 creator 会自行执行验证。

支持在类型、字段、有效的普通 getter、setter 值参数和 `JsonCreator` 参数上使用 `@JsonCodec` 注解。Feature 会保留每个选定的完整值、元素、内容、Map 键和 Map 值 Codec 的构造函数。这与 JVM 和 Android 使用的注解模型相同。

支持 `JsonValue` 字段和有效的 public 无参数方法，包括匹配的单 String `JsonCreator` 构造函数和 public static factory。固定的 `JsonRawValue` 字段和 getter 支持可信的原始 String 值；固定的 `JsonBase64` 字段和 getter 与 JVM 上一样支持 Base64 `byte[]` 值。`JsonFormat` 日期/时间字段使用与 JVM 相同的直接字段、单层包装和 `timezone` 行为。对于直接放在目标类上的注解，请使用 `JsonType` 标注每个可达的所属模型，以便 Native Image 保留这些成员和 Base64 Codec 构造函数。
直接标注的 `JsonValue` Record 会使用生成的 component accessor 和 canonical constructor 操作。由 Mixin 提供的有效声明则使用上述 Mixin 工作流。

`JsonAnyProperty` 和 `JsonAnyGetter` 会将其 Map 展平到外层对象中。可以在该字段或 getter 上使用 `@JsonCodec(valueCodec = ...)` 来定制每个动态值。`JsonAnySetter` 的第二个参数可以对自身的值结构使用常规配置。

`JsonUnwrapped` 使用与 JVM 相同的行为。对于直接放在目标类上的注解，请使用 `JsonType` 标注包含它的模型以及每个 unwrapped 子对象或中间对象。Mixin 会保留其有效 Schema 能够到达的 unwrapped 模型；只有当子对象的注解也需要 overlay 时，才为该子对象注册单独的明确 Mixin。

子 Codec 只作用于一个直接层级。`elementCodec` 支持 `Collection`、Java 数组和 `AtomicReferenceArray`；`contentCodec` 支持 `Optional` 和 `AtomicReference`；`keyCodec` 和 `valueCodec` 支持 Map 的键和值。完整的 `value` Codec 不能与子 Codec 组合使用。

注解 Codec 必须具有 public 无参数构造函数。Fory 会在 Native Image 构建期间准备该构造函数，因此应用模块无需 export 或 open Codec package。通过 `registerCodec` 提供的 Codec 实例由应用构造，不需要注解构造函数元数据。
