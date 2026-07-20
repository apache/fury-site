---
title: Kotlin 序列化指南
sidebar_position: 0
id: serialization_index
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

Apache Fory™ Kotlin 基于 Fory Java 构建，为 Kotlin 类型提供优化的序列化器。大多数标准 Kotlin 类型都可以直接使用默认的 Fory Java 实现，而 Fory Kotlin 则为 Kotlin 特有类型补充了额外支持。

支持的类型包括：

- `data class` 序列化
- 无符号原始类型：`UByte`、`UShort`、`UInt`、`ULong`
- 无符号数组：`UByteArray`、`UShortArray`、`UIntArray`、`ULongArray`
- 标准库类型：`Pair`、`Triple`、`Result`
- 范围：`IntRange`、`LongRange`、`CharRange` 以及各种 progression
- 集合：`ArrayDeque`、空集合（`emptyList`、`emptyMap`、`emptySet`）
- `kotlin.time.Duration`、`kotlin.text.Regex`、`kotlin.uuid.Uuid`

## 特性

Fory Kotlin 继承了 Fory Java 的全部特性，并增加了 Kotlin 特定优化：

- **高性能**：JIT 代码生成、零拷贝，性能可比传统序列化快 20 到 170 倍
- **Kotlin 类型支持**：为数据类、无符号类型、范围和标准库类型提供优化序列化器
- **默认值支持**：在 Schema 演进期间自动处理 Kotlin 数据类的默认参数
- **Schema 演进**：支持类 Schema 变更时的前向和后向兼容

完整特性列表请参见 [Java 特性](../java/index.md#特性)。

## 安装

### Maven

```xml
<dependency>
  <groupId>org.apache.fory</groupId>
  <artifactId>fory-kotlin</artifactId>
  <version>1.4.0</version>
</dependency>
```

### Gradle

```kotlin
implementation("org.apache.fory:fory-kotlin:1.4.0")
```

## 快速开始

```kotlin
import org.apache.fory.Fory
import org.apache.fory.ThreadSafeFory
import org.apache.fory.serializer.kotlin.KotlinSerializers

data class Person(val name: String, val id: Long, val github: String)
data class Point(val x: Int, val y: Int, val z: Int)

fun main() {
    // 创建 Fory 实例（应复用）
    val fory: ThreadSafeFory = Fory.builder()
        .requireClassRegistration(true)
        .buildThreadSafeFory()

    // 注册 Kotlin 序列化器
    KotlinSerializers.registerSerializers(fory)

    // 注册你的类
    fory.register(Person::class.java)
    fory.register(Point::class.java)

    val p = Person("Shawn Yang", 1, "https://github.com/chaokunyang")
    println(fory.deserialize(fory.serialize(p)))
    println(fory.deserialize(fory.serialize(Point(1, 2, 3))))
}
```

## 基于 Fory Java 构建

Fory Kotlin 基于 Fory Java 构建。Fory Java 中的大多数配置选项、特性和概念都可直接应用于 Kotlin。可参考 Java 文档了解：

- [配置](../java/configuration.md) - 所有 ForyBuilder 选项
- [基础序列化](../java/basic-serialization.md) - 序列化模式与 API
- [类型注册](../java/type-registration.md) - 类注册与安全性
- [Schema 演进](../java/schema-evolution.md) - 前向和后向兼容
- [自定义序列化器](../java/custom-serializers.md) - 实现自定义序列化器
- [压缩](../java/compression.md) - Int、long 和字符串压缩
- [故障排查](../java/troubleshooting.md) - 常见问题与解决方案

## Kotlin 特定文档

- [Fory 创建](configuration.md) - Kotlin 特定的 Fory 设置要求
- [类型序列化](type-serialization.md) - Kotlin 类型的序列化
- [默认值](default-values.md) - Kotlin 数据类默认值支持
