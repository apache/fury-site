---
title: Android
sidebar_position: 14
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

## Android 运行时

Fory Java 通过常规 `fory-core` 构件支持 Android 8.0+（API 级别 26+）。核心对象序列化无需单独的 Android 构件。

在 Android 上可使用以下核心对象序列化功能：

- `Fory#serialize(Object)` 和 `Fory#deserialize(byte[])`。
- `BaseFory#deserialize(ByteBuffer)` 支持堆、直接和只读 `ByteBuffer` 输入。
- 通过字节数组、堆缓冲区或 `ByteBuffer` 复制路径使用流、通道和带外缓冲区 API。
- Java 集合/映射和跨语言集合/映射。

`java/fory-format` Row Format API 仅限 JVM，不支持 Android。

## 运行时代码生成

Android 上禁用运行时序列化器代码生成。如果设置 `withCodegen(true)`，Fory 仍会让 Android 序列化使用非代码生成路径，并记录警告。

需要生成序列化器的 Android 应用应改用构建时静态生成的序列化器。

## 静态生成的序列化器

Android 应用类使用 `@ForyStruct` 静态生成的序列化器。它们在应用构建期间由 javac 生成，无需运行时字节码生成即可工作。

### 安装注解处理器

将 `fory-annotation-processor` 添加到编译 Android 模型类的模块的注解处理器路径：

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

然后为 Android 模型类添加 `@ForyStruct` 注解。

在 Android 上，如果序列化类使用 Fory 类型使用注解，则必须使用静态生成的序列化器，例如：

```java
import java.util.List;
import org.apache.fory.annotation.ForyStruct;
import org.apache.fory.annotation.UInt8Type;

@ForyStruct
public class ImageBlock {
  public List<@UInt8Type Integer> pixels;
}
```

如果没有生成的静态描述符，Android 反射可能无法提供 `@Ref`、`@Int8Type`、`@UInt8Type`、`@Float16Type` 或 `@BFloat16Type` 等注解所需的嵌套类型使用元数据。序列化这些类时将缺少 Fory 所需的 Schema 信息。

设置说明参见[静态生成的序列化器](static-generated-serializers.md)。

## 对象模型要求

Android 序列化器使用公共 Android API。应用类优先采用：

- 可访问的无参构造器，或具有受支持构造器的 record。
- public、protected 或包私有的序列化字段。
- 私有序列化字段使用非私有 getter 和 setter。
- Android 模型类使用 `@ForyStruct` 静态生成的序列化器。

普通类中的 final 字段不适合生成的读取/复制方法。基于构造器的不可变值请使用 record。

## 不支持的功能

Android 不支持以下 JVM 功能：

- 运行时序列化器代码生成和异步编译。
- Lambda 和 `SerializedLambda` 序列化。
- 原生地址序列化 API 和原生地址 `MemoryBuffer` 包装。
- 原始 unsafe 内存复制 API。
- `java/fory-format` 提供的 Row Format API。

## ByteBuffer

`BaseFory#deserialize(ByteBuffer)` 通过将剩余字节复制到 Fory 持有的堆缓冲区，在 Android 上支持堆、直接和只读缓冲区。调用方缓冲区的位置和限制不会改变。

原始直接缓冲区地址包装是仅限 JVM 的快速路径，Android 不使用该路径。

## 集合、映射与代理

Android 支持常见的 JDK 集合和映射实现。在跨语言模式下，集合和映射序列化使用跨语言协议，不会编码 Java 包装器/视图的内部结构。

正常代理用法支持 `java.lang.reflect.Proxy` 序列化。代理仍在反序列化时，不要调用、记录它，也不要将其用作映射/集合键；此时调用处理器可能尚未就绪。

## Android 上的 Kotlin

Apache Fory Kotlin 支持 Kotlin/JVM 和 Android。Android 支持建立在现有 Fory Java 实现以及 `fory-kotlin` 提供的 Kotlin 序列化器之上。Kotlin Schema 序列化器由 `fory-kotlin-ksp` 在构建时生成。

Android 设置和发布构建限制参见本页。Kotlin KSP 序列化器模型本身参见[静态生成的序列化器](static-generated-serializers.md)。如果 Android 项目还包含 Java `@ForyStruct` 类，请使用 [Java 静态生成的序列化器](../java/static-generated-serializers.md)中介绍的 Java 注解处理器。

## 依赖

将 `fory-kotlin` 添加到使用 Fory 的 Android 模块。将 `fory-kotlin-ksp` 添加到编译 Kotlin `@ForyStruct` 模型类的模块。

```kotlin
plugins {
  id("com.android.application")
  id("org.jetbrains.kotlin.android")
  id("com.google.devtools.ksp")
}

dependencies {
  implementation("org.apache.fory:fory-kotlin:<fory-version>")
  ksp("org.apache.fory:fory-kotlin-ksp:<fory-version>")
}
```

对于 Android 库模块，请在持有已注解 Kotlin 类的库模块中应用 KSP。生成的序列化器和 consumer R8 规则必须随该库构件一起打包。

## Fory 设置

使用 `ForyKotlin.builder().withXlang(true)` 创建 Fory 实例，然后通过 Kotlin `register<T>` 扩展或常规 Fory Java 注册 API 注册应用类。

```kotlin
import org.apache.fory.kotlin.ForyKotlin
import org.apache.fory.kotlin.register

val fory = ForyKotlin.builder()
    .withXlang(true)
    .requireClassRegistration(true)
    .build()

fory.register<User>("example.User")
```

不要在应用代码中引用生成的序列化器类。Fory 会根据已注册的目标类解析生成的序列化器。

## 跨语言 Schema 模式

参与 Fory 跨语言 Schema 序列化的 Android Kotlin 结构体应使用 KSP 生成的序列化器。生成的序列化器不会以运行时反射作为 Kotlin Schema 元数据来源，并调用其他生成序列化器所使用的同一套 Fory Java 序列化器基础设施。

Kotlin KSP 生成的序列化器仅用于跨语言/Schema 序列化。它们不会替代 Java 原生对象序列化器，也不保留具体 JVM 集合实现标识。例如，Kotlin `List<String>` 字段的 Schema 为 `list<string>`；反序列化只保证得到可赋给声明字段类型的值。

## 混淆压缩的发布构建

应使用混淆压缩的发布构建验证 Fory Android 行为。调试构建无法证明生成的序列化器、生成的构造器入口或 Kotlin 元数据能在 R8 后保留。

KSP 会在 `META-INF/proguard/` 下生成 consumer R8/ProGuard 规则，用于 Fory 所需的生成序列化器构造器和 Kotlin 元数据。Android 应用不需要为生成的 Kotlin 序列化器编写宽泛的保留规则。如果自定义打包配置丢弃了生成的 `META-INF/proguard/` 资源，请修复打包路径，而不是为每个生成的序列化器添加宽泛的保留规则。

Apache Fory 仓库通过 `integration_tests/android_tests` 验证该路径，其中包括经过混淆压缩的发布版本插桩测试。

## Android 应用中的 Java 模型

Kotlin KSP 只处理 Kotlin 源码。如果 Android 应用包含带 `@ForyStruct` 注解的 Java 类，请为这些 Java 源码配置 Java `fory-annotation-processor`。

如果 Java 模型类在嵌套类型上使用 Fory 类型使用注解，例如 `List<@UInt8Type Integer>`，静态生成的 Java 序列化器在 Android 上同样很重要。该路径参见 [Java 静态生成的序列化器](../java/static-generated-serializers.md)。

## 不支持的目标

`fory-kotlin` 和 `fory-kotlin-ksp` 仅面向 Kotlin/JVM 和 Android，不支持 Kotlin/Native 与 Kotlin/JS。
