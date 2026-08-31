---
title: 默认值
sidebar_position: 4
id: default-values
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

启用兼容模式时，Fory 在原生模式反序列化过程中支持 Kotlin 数据类默认值。该功能可在数据类 Schema 演进时实现向前/向后兼容。

## 概述

当 Kotlin 数据类包含具有默认值的参数时，Fory 可以：

1. 使用 Kotlin 反射**检测默认值**
2. 当序列化数据中缺少字段时，在反序列化过程中**应用默认值**
3. 允许添加带默认值的新字段而不破坏现有序列化数据，从而**支持 Schema 演进**

## 使用方式

以下情况下可以使用此功能：

- 原生模式 Fory 实例启用了兼容模式。使用 `withXlang(false)` 时默认如此。
- 通过 `ForyKotlin.builder()` 或 `Fory.builder().withModule(ForyKotlin)` 构建 Fory 实例，
  并启用了原生模式
- 序列化数据中缺少某个字段，但该字段存在于目标类中且具有默认值

## 示例

```kotlin
import org.apache.fory.kotlin.ForyKotlin

// Original data class
data class User(val name: String, val age: Int)

// Evolved data class with new field and default value
data class UserV2(val name: String, val age: Int, val email: String = "default@example.com")

fun main() {
    val fory = ForyKotlin.builder().withXlang(false)
        .build()
    fory.register(User::class.java)
    fory.register(UserV2::class.java)

    // Serialize with old schema
    val oldUser = User("John", 30)
    val serialized = fory.serialize(oldUser)

    // Deserialize with new schema - missing field gets default value
    val newUser = fory.deserialize(serialized) as UserV2
    println(newUser) // UserV2(name=John, age=30, email=default@example.com)
}
```

## 支持的默认值类型

默认值支持以下类型：

- **基本类型**：`Int`、`Long`、`Double`、`Float`、`Boolean`、`Byte`、`Short`、`Char`
- **无符号类型**：`UInt`、`ULong`、`UByte`、`UShort`
- **字符串**：`String`
- **集合**：`List`、`Set`、`Map`（带默认实例）
- **自定义对象**：任何可以通过反射实例化的对象

## 复杂默认值

默认值可以是复杂表达式：

```kotlin
data class ConfigV1(val name: String)

data class ConfigV2(
    val name: String,
    val settings: Map<String, String> = mapOf("default" to "value"),
    val tags: List<String> = listOf("default"),
    val enabled: Boolean = true,
    val retryCount: Int = 3
)

val fory = ForyKotlin.builder().withXlang(false)
    .build()

val original = ConfigV1("myConfig")
val serialized = fory.serialize(original)

val deserialized = fory.deserialize(serialized) as ConfigV2
// deserialized.name == "myConfig"
// deserialized.settings == mapOf("default" to "value")
// deserialized.tags == listOf("default")
// deserialized.enabled == true
// deserialized.retryCount == 3
```

## 带默认值的可空字段

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
// deserialized.nickname == null (default)
// deserialized.age == null (default)
```

## 相关主题

- [Schema 演进](../java/schema-evolution.md) - Java 中的向前/向后兼容性
- [配置](configuration.md) - 使用兼容模式设置 Fory
