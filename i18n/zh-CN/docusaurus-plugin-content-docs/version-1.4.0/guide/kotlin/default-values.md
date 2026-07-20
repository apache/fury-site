---
title: 默认值
sidebar_position: 3
id: default_values
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

在使用兼容模式时，Fory 支持在反序列化期间处理 Kotlin 数据类的默认值。此特性使得数据类 schema 演化时能够保持前向/后向兼容性。

## 概述

当 Kotlin 数据类具有带默认值的参数时，Fory 可以：

1. **检测默认值**：使用 Kotlin 反射
2. **应用默认值**：当序列化数据中缺少字段时，在反序列化期间应用默认值
3. **支持 schema 演化**：允许添加带默认值的新字段，而不会破坏现有的序列化数据

## 用法

在以下情况下，此特性会自动启用：

- 启用了兼容模式（`withCompatibleMode(CompatibleMode.COMPATIBLE)`）
- 已注册 Kotlin 序列化器（`KotlinSerializers.registerSerializers(fory)`）
- 序列化数据中缺少某个字段，但目标类中该字段存在并具有默认值

## 示例

```kotlin
import org.apache.fory.Fory
import org.apache.fory.config.CompatibleMode
import org.apache.fory.serializer.kotlin.KotlinSerializers

// 原始数据类
data class User(val name: String, val age: Int)

// 演化后的数据类，带有新字段和默认值
data class UserV2(val name: String, val age: Int, val email: String = "default@example.com")

fun main() {
    val fory = Fory.builder()
        .withCompatibleMode(CompatibleMode.COMPATIBLE)
        .build()
    KotlinSerializers.registerSerializers(fory)
    fory.register(User::class.java)
    fory.register(UserV2::class.java)

    // 使用旧 schema 序列化
    val oldUser = User("John", 30)
    val serialized = fory.serialize(oldUser)

    // 使用新 schema 反序列化 - 缺失的字段获得默认值
    val newUser = fory.deserialize(serialized) as UserV2
    println(newUser) // UserV2(name=John, age=30, email=default@example.com)
}
```

## 支持的默认值类型

以下类型支持默认值：

- **原始类型**：`Int`、`Long`、`Double`、`Float`、`Boolean`、`Byte`、`Short`、`Char`
- **无符号类型**：`UInt`、`ULong`、`UByte`、`UShort`
- **字符串**：`String`
- **集合**：`List`、`Set`、`Map`（带默认实例）
- **自定义对象**：任何可以通过反射实例化的对象

## 复杂的默认值

默认值可以是复杂的表达式：

```kotlin
data class ConfigV1(val name: String)

data class ConfigV2(
    val name: String,
    val settings: Map<String, String> = mapOf("default" to "value"),
    val tags: List<String> = listOf("default"),
    val enabled: Boolean = true,
    val retryCount: Int = 3
)

val fory = Fory.builder()
    .withCompatibleMode(CompatibleMode.COMPATIBLE)
    .build()
KotlinSerializers.registerSerializers(fory)

val original = ConfigV1("myConfig")
val serialized = fory.serialize(original)

val deserialized = fory.deserialize(serialized) as ConfigV2
// deserialized.name == "myConfig"
// deserialized.settings == mapOf("default" to "value")
// deserialized.tags == listOf("default")
// deserialized.enabled == true
// deserialized.retryCount == 3
```

## 可空字段与默认值

也支持带默认值的可空字段：

```kotlin
data class PersonV1(val name: String)

data class PersonV2(
    val name: String,
    val nickname: String? = null,
    val age: Int? = null
)

val original = PersonV1("John")
val serialized = fory.serialize(original)

val deserialized = fory.deserialize(serialized) as PersonV2
// deserialized.name == "John"
// deserialized.nickname == null (默认值)
// deserialized.age == null (默认值)
```

## 相关主题

- [Schema 演化](../java/schema-evolution.md) - Java 中的前向/后向兼容性
- [Fory 创建](configuration.md) - 使用兼容模式设置 Fory
