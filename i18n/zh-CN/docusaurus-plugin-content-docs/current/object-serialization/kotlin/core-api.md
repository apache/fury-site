---
title: 基础序列化
sidebar_position: 1
id: core-api
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

Xlang 是 Fory Kotlin 的默认序列化模式。本页介绍该默认模式的基础序列化 API 和互操作规则。

## 跨语言互操作 {#cross-language-interoperability}

以下内容介绍默认 xlang 模式的模型生成、注册和跨语言往返。

Kotlin xlang 序列化通过 `ForyKotlin` 使用 JVM Fory 实现。当 Kotlin 载荷需要由其他受支持
的 Fory 运行时读取时，请使用该模式。在所有对端使用相同身份和字段 Schema 注册可移植
模型类型。

Kotlin 数据类、枚举和密封类模型会在适用时使用 Kotlin 集成与生成的序列化器。确切的
可移植载体映射仍由 [xlang 类型映射](../../specification/xlang_type_mapping.md)定义。

### 创建 Fory 实例

```kotlin
import org.apache.fory.kotlin.ForyKotlin

val fory = ForyKotlin.builder()
    .withXlang(true)
    .build()
```

### 第一次往返处理

```kotlin
import org.apache.fory.ThreadSafeFory
import org.apache.fory.kotlin.ForyKotlin

data class Person(val name: String, val age: Int)

fun main() {
    val fory: ThreadSafeFory = ForyKotlin.builder()
        .withXlang(true)
        .requireClassRegistration(true)
        .buildThreadSafeFory()
    fory.register(Person::class.java)

    val bytes = fory.serialize(Person("chaokunyang", 28))
    val result = fory.deserialize(bytes) as Person
    println("${result.name} ${result.age}")
}
```
