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

Fory 在使用兼容模式时支持在反序列化期间使用 Scala 类默认值。此特性在 case 类或常规 Scala 类具有默认参数时支持前向/后向兼容性。

## 概述

当 Scala 类具有默认参数时，Scala 编译器会在伴生对象中（对于 case 类）或在类本身中（对于常规 Scala 类）生成诸如 `apply$default$1`、`apply$default$2` 等方法来返回默认值。Fory 可以检测这些方法，并在反序列化对象时，当某些字段在序列化数据中缺失时使用它们。

## 支持的类类型

Fory 支持以下类型的默认值：

- 具有默认参数的 **Case 类**
- 在主构造函数中具有默认参数的**常规 Scala 类**
- 具有默认参数的**嵌套 case 类**

## 工作原理

1. **检测**：Fory 通过检查是否存在默认值方法（`apply$default$N` 或 `$default$N`）来检测类是否为 Scala 类。

2. **默认值发现**：
   - 对于 case 类：Fory 扫描伴生对象中名为 `apply$default$1`、`apply$default$2` 等的方法。
   - 对于常规 Scala 类：Fory 扫描类本身中名为 `$default$1`、`$default$2` 等的方法。

3. **字段映射**：在反序列化期间，Fory 识别目标类中存在但序列化数据中缺失的字段。

4. **值应用**：从序列化数据中读取所有可用字段后，Fory 将默认值应用于任何缺失的字段。

## 使用方法

当满足以下条件时，此特性会自动启用：

- 启用兼容模式（`withCompatibleMode(CompatibleMode.COMPATIBLE)`）
- 目标类被检测为具有默认值的 Scala 类
- 序列化数据中缺少某个字段，但该字段存在于目标类中

无需额外配置。

## 示例

### 具有默认值的 Case 类

```scala
import org.apache.fory.Fory
import org.apache.fory.config.CompatibleMode
import org.apache.fory.serializer.scala.ScalaSerializers

// 没有默认值的类（用于序列化）
case class PersonV1(name: String)

// 有默认值的类（用于反序列化）
case class PersonV2(name: String, age: Int = 25, city: String = "Unknown")

val fory = Fory.builder()
  .withCompatibleMode(CompatibleMode.COMPATIBLE)
  .withScalaOptimizationEnabled(true)
  .build()

ScalaSerializers.registerSerializers(fory)

// 使用没有默认值的类进行序列化
val original = PersonV1("John")
val serialized = fory.serialize(original)

// 反序列化到有默认值的类
// 缺失的字段将使用默认值
val deserialized = fory.deserialize(serialized).asInstanceOf[PersonV2]
// deserialized.name == "John"
// deserialized.age == 25（默认值）
// deserialized.city == "Unknown"（默认值）
```

### 具有默认值的常规 Scala 类

```scala
// 没有默认值的类（用于序列化）
class EmployeeV1(val name: String)

// 有默认值的类（用于反序列化）
class EmployeeV2(
  val name: String,
  val age: Int = 30,
  val department: String = "Engineering"
)

val fory = Fory.builder()
  .withCompatibleMode(CompatibleMode.COMPATIBLE)
  .withScalaOptimizationEnabled(true)
  .build()

ScalaSerializers.registerSerializers(fory)

// 使用没有默认值的类进行序列化
val original = new EmployeeV1("Jane")
val serialized = fory.serialize(original)

// 反序列化到有默认值的类
val deserialized = fory.deserialize(serialized).asInstanceOf[EmployeeV2]
// deserialized.name == "Jane"
// deserialized.age == 30（默认值）
// deserialized.department == "Engineering"（默认值）
```

### 复杂默认值

默认值可以是复杂表达式：

```scala
// 没有默认值的类（用于序列化）
case class ConfigV1(name: String)

// 有默认值的类（用于反序列化）
case class ConfigV2(
  name: String,
  settings: Map[String, String] = Map("default" -> "value"),
  tags: List[String] = List("default"),
  enabled: Boolean = true
)

val fory = Fory.builder()
  .withCompatibleMode(CompatibleMode.COMPATIBLE)
  .withScalaOptimizationEnabled(true)
  .build()

ScalaSerializers.registerSerializers(fory)

val original = ConfigV1("myConfig")
val serialized = fory.serialize(original)

val deserialized = fory.deserialize(serialized).asInstanceOf[ConfigV2]
// deserialized.name == "myConfig"
// deserialized.settings == Map("default" -> "value")
// deserialized.tags == List("default")
// deserialized.enabled == true
```

### 嵌套 Case 类

```scala
object Models {
  // 没有默认值的类（用于序列化）
  case class PersonV1(name: String)

  // 有默认值的类（用于反序列化）
  case class Address(street: String, city: String = "DefaultCity")
  case class PersonV2(name: String, address: Address = Address("DefaultStreet"))
}

val fory = Fory.builder()
  .withCompatibleMode(CompatibleMode.COMPATIBLE)
  .withScalaOptimizationEnabled(true)
  .build()

ScalaSerializers.registerSerializers(fory)

val original = Models.PersonV1("Alice")
val serialized = fory.serialize(original)

val deserialized = fory.deserialize(serialized).asInstanceOf[Models.PersonV2]
// deserialized.name == "Alice"
// deserialized.address == Address("DefaultStreet", "DefaultCity")
```

## 相关主题

- [Schema 演化](../java/schema-evolution.md) - Java 中的前向/后向兼容性
- [Fory 创建](configuration.md) - 使用兼容模式设置 Fory
