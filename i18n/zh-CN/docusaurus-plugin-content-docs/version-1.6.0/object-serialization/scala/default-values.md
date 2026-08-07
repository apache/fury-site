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

启用兼容模式时，Fory 在原生模式反序列化过程中支持 Scala 类默认值。当 case class 或普通 Scala 类具有默认参数时，该功能可以实现向前/向后兼容。

## 概述

当 Scala 类具有默认参数时，Scala 编译器会在伴生对象中（对于 case class）或类本身中（对于普通 Scala 类）生成 `apply$default$1`、`apply$default$2` 等返回默认值的方法。Fory 可以检测这些方法，并在反序列化缺少部分字段的序列化数据时使用它们。

## 支持的类类型

Fory 支持以下类的默认值：

- 具有默认参数的 **case class**
- 主构造函数具有默认参数的**普通 Scala 类**
- 具有默认参数的**嵌套 case class**

## 工作原理

1. **检测**：Fory 通过检查默认值方法（`apply$default$N` 或 `$default$N`）是否存在，判断一个类是否为 Scala 类。

2. **发现默认值**：
   - 对于 case class：Fory 会在伴生对象中扫描名为 `apply$default$1`、`apply$default$2` 等的方法。
   - 对于普通 Scala 类：Fory 会在类本身中扫描名为 `$default$1`、`$default$2` 等的方法。

3. **字段映射**：在反序列化过程中，Fory 会识别存在于目标类中但在序列化数据中缺失的字段。

4. **应用值**：从序列化数据读取所有可用字段后，Fory 会为所有缺失字段应用默认值。

## 使用方式

以下情况下可以使用此功能：

- 原生模式 Fory 实例启用了兼容模式。使用 `withXlang(false)` 时默认如此。
- 目标类被检测为具有默认值的 Scala 类
- 序列化数据中缺少某个字段，但该字段存在于目标类中

无需其他配置。

## 示例

### 带默认值的 Case Class

```scala
import org.apache.fory.scala.ForyScala

// Class WITHOUT default values (for serialization)
case class PersonV1(name: String)

// Class WITH default values (for deserialization)
case class PersonV2(name: String, age: Int = 25, city: String = "Unknown")

val fory = ForyScala.builder().withXlang(false)
  .build()

// Serialize using class without default values
val original = PersonV1("John")
val serialized = fory.serialize(original)

// Deserialize into class with default values
// Missing fields will use defaults
val deserialized = fory.deserialize(serialized).asInstanceOf[PersonV2]
// deserialized.name == "John"
// deserialized.age == 25 (default)
// deserialized.city == "Unknown" (default)
```

### 带默认值的普通 Scala 类

```scala
// Class WITHOUT default values (for serialization)
class EmployeeV1(val name: String)

// Class WITH default values (for deserialization)
class EmployeeV2(
  val name: String,
  val age: Int = 30,
  val department: String = "Engineering"
)

val fory = ForyScala.builder().withXlang(false)
  .build()

// Serialize using class without default values
val original = new EmployeeV1("Jane")
val serialized = fory.serialize(original)

// Deserialize into class with default values
val deserialized = fory.deserialize(serialized).asInstanceOf[EmployeeV2]
// deserialized.name == "Jane"
// deserialized.age == 30 (default)
// deserialized.department == "Engineering" (default)
```

### 复杂默认值

默认值可以是复杂表达式：

```scala
// Class WITHOUT default values (for serialization)
case class ConfigV1(name: String)

// Class WITH default values (for deserialization)
case class ConfigV2(
  name: String,
  settings: Map[String, String] = Map("default" -> "value"),
  tags: List[String] = List("default"),
  enabled: Boolean = true
)

val fory = ForyScala.builder().withXlang(false)
  .build()

val original = ConfigV1("myConfig")
val serialized = fory.serialize(original)

val deserialized = fory.deserialize(serialized).asInstanceOf[ConfigV2]
// deserialized.name == "myConfig"
// deserialized.settings == Map("default" -> "value")
// deserialized.tags == List("default")
// deserialized.enabled == true
```

### 嵌套 Case Class

```scala
object Models {
  // Class WITHOUT default values (for serialization)
  case class PersonV1(name: String)

  // Classes WITH default values (for deserialization)
  case class Address(street: String, city: String = "DefaultCity")
  case class PersonV2(name: String, address: Address = Address("DefaultStreet"))
}

val fory = ForyScala.builder().withXlang(false)
  .build()

val original = Models.PersonV1("Alice")
val serialized = fory.serialize(original)

val deserialized = fory.deserialize(serialized).asInstanceOf[Models.PersonV2]
// deserialized.name == "Alice"
// deserialized.address == Address("DefaultStreet", "DefaultCity")
```

## 相关主题

- [Schema 演进](../java/schema-evolution.md) - Java 中的向前/向后兼容性
- [配置](configuration.md) - 使用兼容模式设置 Fory
