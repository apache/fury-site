---
title: Kotlin 对象序列化
sidebar_position: 0
id: index
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

Apache Fory™ Kotlin 基于 Fory Java，为 Kotlin 类型提供优化的序列化器。它支持用于跨语言载荷的 xlang 模式，也支持仅用于 Kotlin/JVM 对象序列化的原生模式。大多数标准 Kotlin 类型可以直接使用默认的 Fory Java 实现，而 Fory Kotlin 还额外支持 Kotlin 特有类型。

支持的类型包括：

- `data class` 序列化
- 无符号基本类型：`UByte`、`UShort`、`UInt`、`ULong`
- 无符号数组：`UByteArray`、`UShortArray`、`UIntArray`、`ULongArray`
- 标准库类型：`Pair`、`Triple`、`Result`
- 范围：`IntRange`、`LongRange`、`CharRange` 及 progression
- 集合：`ArrayDeque`、空集合（`emptyList`、`emptyMap`、`emptySet`）
- `kotlin.time.Duration`、`kotlin.text.Regex`、`kotlin.uuid.Uuid`

## 功能特性

Fory Kotlin 继承了 Fory Java 的全部功能，并增加了 Kotlin 特有优化：

- **高性能**：JIT 代码生成、零拷贝，性能达到传统序列化的 20-170x
- **Kotlin 类型支持**：为数据类、无符号类型、范围和标准库类型提供优化的序列化器
- **默认值支持**：在 Schema 演进期间自动处理 Kotlin 数据类的默认参数
- **静态 Xlang 序列化器**：由 KSP 为 Kotlin/JVM 和 Android xlang 模式生成 Schema 序列化器
- **Schema IDL 生成**：Fory 编译器可以输出 Kotlin 模型、密封联合和 Schema 模块
- **Kotlin gRPC 支持**：使用 Fory 载荷序列化的协程服务配套代码
- **Schema 演进**：类 Schema 变更的向前/向后兼容性

完整的功能列表请参阅 [Java 功能特性](../java/index.md#features)。

## 安装

### Maven

```xml
<dependency>
  <groupId>org.apache.fory</groupId>
  <artifactId>fory-kotlin</artifactId>
  <version>1.5.0</version>
</dependency>
```

### Gradle

```kotlin
implementation("org.apache.fory:fory-kotlin:1.5.0")
```

### JDK25+

Kotlin 运行时使用 Fory Java 核心。在 JDK25+ 上，需要向 Fory 开放 `java.lang.invoke`。
当 Fory 位于 classpath 上时，使用 `ALL-UNNAMED`：

```bash
--add-opens=java.base/java.lang.invoke=ALL-UNNAMED
```

当 Fory 位于模块路径上时，使用 Fory 核心模块名称：

```bash
--add-opens=java.base/java.lang.invoke=org.apache.fory.core
```

## 快速开始

```kotlin
import org.apache.fory.ThreadSafeFory
import org.apache.fory.kotlin.ForyKotlin

data class Person(val name: String, val id: Long, val github: String)
data class Point(val x: Int, val y: Int, val z: Int)

fun main() {
    // Create Fory instance (should be reused). Kotlin follows the Java default:
    // xlang mode with compatible schema evolution.
    val fory: ThreadSafeFory = ForyKotlin.builder()
        .withXlang(true)
        .requireClassRegistration(true)
        .buildThreadSafeFory()

    fory.register(Person::class.java)
    fory.register(Point::class.java)

    val p = Person("Shawn Yang", 1, "https://github.com/chaokunyang")
    println(fory.deserialize(fory.serialize(p)))
    println(fory.deserialize(fory.serialize(Point(1, 2, 3))))
}
```

## Xlang 模式与原生模式

对于跨语言载荷以及与其他 Fory 实现共享的 Schema，请使用 xlang 模式。通过 JVM builder 创建实例时，xlang 是 Kotlin 的默认编码模式；使用该模式的 Kotlin 示例会显式设置 `.withXlang(true)`，以便清楚展示模式选择。

仅用于 Kotlin/JVM 的通信请使用原生模式。通过 `.withXlang(false)` 选择原生模式；该模式继承 Fory Java 的 JVM 原生模式对象序列化路径，并为数据类、无符号值、范围、标准库类型及生成的序列化器增加 Kotlin 特有支持。它针对 JVM 和 Kotlin 类型系统进行了优化，适合在同语言 Kotlin/JVM 场景中替代其他框架的载荷。兼容模式默认启用。只有在所有读取端和写入端使用相同 Kotlin/JVM Schema，且希望获得更快的序列化速度和更小的体积时，才设置 `.withCompatible(false)`。

Kotlin builder 设置请参阅[配置](configuration.md)，完整的 JVM 原生模式行为请参阅 [Java 原生序列化](../java/native.md)。

## 基于 Fory Java

Fory Kotlin 基于 Fory Java 构建。Fory Java 的大多数配置选项、功能和概念都直接适用于 Kotlin。以下内容请参阅 Java 文档：

- [配置](../java/configuration.md) - 所有 ForyBuilder 选项
- [基本序列化](../java/core-api.md) - 序列化模式和 API
- [类型注册](../java/type-registration.md) - 类注册与安全性
- [Schema 演进](../java/schema-evolution.md) - 向前/向后兼容性
- [自定义序列化器](../java/custom-serializers.md) - 实现自定义序列化器
- [压缩](../java/compression.md) - int、long 和字符串压缩
- [故障排除](../java/troubleshooting.md) - 常见问题及解决方法

## Kotlin 专属文档

- [基础序列化](core-api.md) - 默认 xlang 模式的模型、API 和跨语言互操作
- [配置](configuration.md) - Kotlin 特有的 Fory 设置要求
- [原生序列化](native.md) - 在 JVM 原生模式下序列化 Kotlin 类型
- [Schema 元数据](schema-metadata.md) - Kotlin 注解、可空性、引用和整数元数据
- [默认值](default-values.md) - Kotlin 数据类默认值支持
- [静态生成的序列化器](static-generated-serializers.md) - 通过 KSP 生成 xlang/Schema 序列化器
- [Kotlin gRPC 支持](../../grpc/kotlin.md) - Fory IDL 服务的协程桩和服务基类
- [Android 支持](../java/android.md) - Android 设置、R8 行为和发布构建验证
