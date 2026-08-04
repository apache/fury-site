---
title: 静态生成的序列化器
sidebar_position: 13
id: static-generated-serializers
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

静态生成的序列化器是在应用构建期间由 javac 生成的 Java 序列化器，适用于运行时代码生成被禁用或不可用的场景。

以下情况应使用静态生成的序列化器：

- 在 Android 上运行。
- 在普通 JVM 上使用 `ForyBuilder#withCodegen(false)`，但仍希望使用生成的序列化器。
- Android 模型类使用 `@Ref`、`@UInt8Type` 或
  `@Float16Type`.

对于 GraalVM 原生镜像，请改为遵循 [GraalVM 原生镜像](graalvm.md)中的说明。

## 安装注解处理器

将 `fory-annotation-processor` 添加到编译可序列化类的模块的注解处理器路径：

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

生成的序列化器在运行时依赖 `fory-core`。应用通过添加注解处理器主动启用该功能；`fory-core` 本身不依赖它。

## 为类添加注解

为每个可序列化类添加 `@ForyStruct` 注解：

```java
import org.apache.fory.annotation.ForyStruct;

@ForyStruct
public class Order {
  public long id;
  public String note;

  public Order() {}
}
```

处理器会在与注解类相同的 Java 包中生成序列化器类。对于 `Order`，生成的类为：

- 跨语言模式使用 `Order_ForySerializer`。
- Java 原生模式使用 `Order_ForyNativeSerializer`。

对于 `Outer.Inner` 这样的静态嵌套类型，生成的顶层类为 `Outer_d_Inner_ForySerializer` 和 `Outer_d_Inner_ForyNativeSerializer`。

## 字段调试跟踪

如果需要生成的序列化器包含字段级调试跟踪钩子，请添加 `@ForyDebug`，并与 `@ForyStruct` 配合使用。生成的代码仅在 `ENABLE_FORY_DEBUG_OUTPUT=1` 时输出这些跟踪信息。

```java
import org.apache.fory.annotation.ForyDebug;
import org.apache.fory.annotation.ForyStruct;

@ForyStruct
@ForyDebug
public class DebugOrder {
  public long id;
  public String note;

  public DebugOrder() {}
}
```

## 运行时使用

在以下环境中，静态生成的序列化器可用时，Fory 会使用它们：

- Android。
- 使用 `ForyBuilder#withCodegen(false)` 的普通 JVM。
- 目标结构体具有生成的序列化器时进行兼容模式读取。

在设置 `codegen=true` 的普通 JVM 上，Fory 仍优先使用运行时生成的序列化器。

Fory 根据已注册的目标类名解析生成的序列化器。应用代码不应直接引用生成的序列化器类。

## 字段访问规则

生成的序列化器必须能在编译时访问序列化字段或其访问器。

- 当 Java 包访问权限允许同包生成的序列化器使用字段时，可以直接访问 public、protected 和包私有字段。
- 私有序列化字段必须具有可访问的非私有 getter 和 setter 方法，或使用 `transient` 或 Fory `@Ignore` 排除。
- 如果生成的序列化器包可以访问 public、protected 和包私有 getter/setter 方法，则这些方法可用。
- 普通可变类不支持 final 字段，因为生成的读取和复制方法必须为字段赋值。基于构造器的不可变值请使用 record。

对于 record，生成的序列化器使用公共 record 访问器，并通过规范构造器创建值。序列化和复制会跳过被忽略的 record 组件；生成的读取/复制代码会为其构造器参数使用 Java 默认值。

## Android 上的类型使用注解

在 Android 上，如果类对嵌套类型使用 Fory 类型使用注解，则必须使用静态生成的序列化器：

```java
import java.util.List;
import org.apache.fory.annotation.ForyStruct;
import org.apache.fory.annotation.UInt8Type;

@ForyStruct
public class ImageBlock {
  public List<@UInt8Type Integer> pixels;
}
```

如果没有生成的序列化器元数据，Android 可能无法提供足够的嵌套类型信息，Fory 因而无法保留 `@Ref`、`@Int8Type`、`@UInt8Type`、`@Float16Type` 或 `@BFloat16Type` 等注解。

注解处理器会在 `META-INF/proguard/` 下为 Fory 实际使用的序列化器构造器生成 consumer R8/ProGuard 规则。Android 应用不应手动添加宽泛的生成序列化器保留规则。

## 兼容读取

静态生成的序列化器同时支持常规序列化和兼容模式读取。兼容读取会将远程字段与本地字段匹配，跳过本地已不存在的字段，并为远程载荷中缺失的字段保留 Java 默认值。
