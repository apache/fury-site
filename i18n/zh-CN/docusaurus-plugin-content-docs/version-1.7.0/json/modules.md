---
title: Modules
sidebar_position: 6
id: modules
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

`ForyJsonModule` 将一组相关的 Fory JSON 注册打包为可复用扩展。模块可以由语言集成、第三方库、框架或应用提供。需要让使用者通过一次 builder 调用安装整套扩展时，应使用模块；对于无需独立分发的应用专用编解码器，可直接在 builder 上注册。

## 创建与安装模块 {#creating-and-installing-a-module}

实现[自定义编解码器指南](custom-codecs.md)中的 `MoneyCodec` 等编解码器后，库可以将其注册打包为模块分发：

```java
import org.apache.fory.json.ForyJson;
import org.apache.fory.json.ForyJsonModule;
import org.apache.fory.json.ModuleContext;

public final class MoneyJsonModule implements ForyJsonModule {
  public static final MoneyJsonModule INSTANCE = new MoneyJsonModule();

  private MoneyJsonModule() {}

  @Override
  public void install(ModuleContext context) {
    context.registerCodec(Money.class, new MoneyCodec());
  }
}

ForyJson json =
    ForyJson.builder()
        .withModule(MoneyJsonModule.INSTANCE)
        .build();
```

安装在 `build()` 创建不可变运行时配置期间执行。模块加入 builder 后，应将其配置视为不可变。注册的编解码器实例会被并发操作共享，因此必须线程安全。

## 模块注册 {#module-registrations}

`ModuleContext` 提供可复用集成所需的注册操作：

| 注册方式 | 用途 |
| --------------------------------- | ---------------------------------------------- |
| `registerCodec(Class, JsonValueCodec)` | 为一个精确类提供共享的完整编解码器 |
| `registerCodec(Class, JsonCodecFactory)` | 为一个精确类提供由 resolver 持有的完整编解码器 |
| `registerMixin(Class)` | 为声明的目标提供带注解的 Mixin |
| `registerCodecFactory(JsonCodecFactory)` | 根据参数化目标类型选择一组编解码器 |

编解码器实现和 `JsonCodecFactory` 行为见[自定义编解码器](custom-codecs.md)。模块仅将这些注册打包以便安装。精确模块注册同样拒绝该文档列出的专用标量和数组类型；这些类型需要不同表示时，应使用具体使用位置的注解或语义映射。

直接在 `ForyJsonBuilder` 上进行的应用注册优先于模块精确注册。模块注册发生冲突时，`build()` 会失败，而不是依赖安装顺序决定结果。

## Kotlin 模块 {#kotlin-module}

`ForyJsonKotlin` 是面向 Kotlin/JVM 模型的可选模块。应用使用 Kotlin 模型时，建议使用它的 builder：

```kotlin
import org.apache.fory.json.kotlin.ForyJsonKotlin

val json = ForyJsonKotlin.builder().build()
```

这等价于 `ForyJson.builder().withModule(ForyJsonKotlin)`，不会扫描类路径或注册应用模型。精确的应用编解码器注册保持常规优先级。类型令牌和可选的 Android 代码压缩设置见 [Kotlin](kotlin.md)。

## 模块标识 {#module-identity}

`moduleKey()` 标识模块配置，用于检查安装冲突。默认 key 为模块类名，足以满足无配置模块的需要。

可配置模块必须返回确定性的 key，包含所有会影响其所安装 JSON 行为的选项。不要包含秘密信息、可变进程状态或无关值。

```java
public final class ConfiguredJsonModule implements ForyJsonModule {
  private final boolean compactNames;

  public ConfiguredJsonModule(boolean compactNames) {
    this.compactNames = compactNames;
  }

  @Override
  public String moduleKey() {
    return getClass().getName() + ":compactNames=" + compactNames;
  }

  @Override
  public void install(ModuleContext context) {
    // Register the codecs, factories, or Mixins selected by this configuration.
  }
}
```

将第三方枚举的派生编解码器打包为模块的 Scala 示例见[将派生编解码器打包到模块](scala.md#packaging-derived-codecs-in-a-module)。
