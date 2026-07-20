---
title: Android 支持
sidebar_position: 6
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

Apache Fory Kotlin 支持 Kotlin/JVM 和 Android。Android 支持建立在现有 Fory
Java 运行时以及 `fory-kotlin` 提供的 Kotlin 运行时序列化器之上。Kotlin schema
序列化器由 `fory-kotlin-ksp` 在构建时生成。

本页说明 Android 设置和 release 构建约束。Kotlin KSP 序列化器模型本身请参见
[静态生成序列化器](static-generated-serializers.md)。如果你的 Android 项目也包含
Java `@ForyStruct` 类，请使用
[Java 静态生成序列化器](../java/static-generated-serializers.md)中记录的 Java
注解处理器。

## 依赖

将 `fory-kotlin` 添加到使用 Fory 的 Android 模块。将 `fory-kotlin-ksp` 添加到
编译 Kotlin `@ForyStruct` 模型类的模块。

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

对于 Android 库模块，请在拥有这些带注解 Kotlin 类的库模块中应用 KSP。生成的
序列化器和生成的 consumer R8 规则必须随该库产物一起打包。

## 运行时设置

使用 `ForyKotlin.builder().withXlang(true)` 创建运行时，然后通过 Kotlin
`register<T>` 扩展或普通 Fory Java 注册 API 注册应用类。

```kotlin
import org.apache.fory.kotlin.ForyKotlin
import org.apache.fory.kotlin.register

val fory = ForyKotlin.builder()
    .withXlang(true)
    .requireClassRegistration(true)
    .build()

fory.register<User>("example", "User")
```

不要在应用代码中引用生成的序列化器类。运行时会从已注册的目标类解析生成的
序列化器。

## Xlang Schema 模式

参与 Fory 跨语言 schema 序列化的 Android Kotlin 结构体应使用 KSP 生成序列化器。
生成序列化器会避免把运行时反射作为 Kotlin schema 元数据来源，并调用与其他
生成序列化器相同的 Fory Java 运行时基础设施。

Kotlin KSP 生成序列化器只用于 xlang/schema 序列化。它们不会替代 Java 原生对象
序列化器，也不会保留具体 JVM 集合实现身份。例如，Kotlin `List<String>` 字段的
schema 是 `list<string>`；反序列化只保证得到的值可以赋给声明的字段类型。

## Minified Release 构建

请使用 minified release 构建验证 Fory Android 行为。Debug 构建不能证明生成的
序列化器、生成的构造函数入口点或 Kotlin 元数据能在 R8 后保留下来。

KSP 会在 `META-INF/proguard/` 下输出生成的 consumer R8/ProGuard 规则，用于
Fory 所需的生成序列化器构造函数和 Kotlin 元数据。Android 应用不应需要为生成的
Kotlin 序列化器手写宽泛 keep 规则。如果自定义打包设置丢弃了生成的
`META-INF/proguard/` 资源，应修复打包路径，而不是为每个生成序列化器添加宽泛
keep 规则。

Apache Fory 仓库通过 `integration_tests/android_tests` 验证这条路径，其中包括
release-minified instrumented tests。

## Android 应用中的 Java 模型

Kotlin KSP 只处理 Kotlin 源码。如果 Android 应用包含带 `@ForyStruct` 注解的
Java 类，请为这些 Java 源码配置 Java `fory-annotation-processor`。

当 Java 模型类在嵌套类型上使用 Fory 类型使用位置注解（例如
`List<@UInt8Type Integer>`）时，静态生成的 Java 序列化器在 Android 上也很重要。
这条路径请参见
[Java 静态生成序列化器](../java/static-generated-serializers.md)。

## 不支持的目标

`fory-kotlin` 和 `fory-kotlin-ksp` 只面向 Kotlin/JVM 和 Android。不支持
Kotlin/Native 和 Kotlin/JS。
