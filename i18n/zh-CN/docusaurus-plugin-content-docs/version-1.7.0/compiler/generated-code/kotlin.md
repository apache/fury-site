---
title: Kotlin
sidebar_position: 11
id: kotlin
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

Kotlin 目标只生成 Kotlin 源代码。编译器不会生成 Java 文件。

## 输出布局

对于源文件 `addressbook.fdl`，当它包含 `package addressbook` 时，Kotlin 输出生成在：

- `<kotlin_out>/addressbook/`
- 类型文件：`AddressBook.kt`、`Person.kt`、`Dog.kt`、`Cat.kt`、`Animal.kt`
- Schema 模块：`AddressbookForyModule.kt`

Schema 模块名称从源文件主名（stem）派生。同一 Kotlin 包中的 Schema 需要不同的生成文件名；
写入文件之前会拒绝重复的生成 Kotlin 文件路径。

如果存在 `option kotlin_package = "...";`，输出路径和 Kotlin 包使用该选项。否则
Kotlin 使用 FDL 包。Kotlin 导入图不能混用默认包 Schema 和命名 Kotlin 包。
注册仍使用 FDL 包，以保持跨语言类型名称稳定。

## 类型生成

消息默认生成 Kotlin `data class` 声明：

```kotlin
@ForyStruct
public data class Person(
  @field:ForyField(id = 1)
  public val name: String,

  @field:ForyField(id = 7)
  public val phones: List<PersonPhoneNumber>,

  @field:ForyField(id = 8)
  public val pet: Animal,
) {
  public fun toBytes(): ByteArray = AddressbookForyModule.getFory().serialize(this)

  public companion object {
    public fun fromBytes(bytes: ByteArray): Person =
      AddressbookForyModule.getFory().deserialize(bytes, Person::class.java)
  }
}
```

参与编译器检测到的构造环的消息会生成普通可变类，使生成的序列化器能够在读取反向引用前
发布实例：

```kotlin
@ForyStruct
public class Node() {
  @ForyField(id = 1)
  public var id: String = ""

  @Ref
  @ForyField(id = 2)
  public var parent: Node? = null
}
```

生成的 Kotlin IDL 源代码使用 Kotlin `?` 表示可空性，而不是 Fory `@Nullable`；为编译器
检测到的构造环生成的可变类也遵循此规则。

枚举生成具有稳定 Fory 枚举 ID 的 Kotlin 枚举类。联合生成带 `@ForyUnion` 的密封类；Fory
提供的 `Unknown(UnknownCase)` 载体使用 `@ForyUnknownCase` 标记。该标记只选择载体，不会
向 Schema case 表添加条目。Schema 定义的 case 可以使用 case ID `0..N`，并保存一个
`value` 属性。类型化联合必须至少包含一个非 `Unknown` case。

```kotlin
package addressbook

import org.apache.fory.annotation.ForyCase
import org.apache.fory.annotation.ForyUnion
import org.apache.fory.annotation.ForyUnknownCase
import org.apache.fory.type.union.UnknownCase

@ForyUnion
public sealed class Animal {
  @ForyUnknownCase
  public data class Unknown(public val value: UnknownCase) : Animal()

  @ForyCase(id = 0)
  public data class Dog(public val value: addressbook.Dog) : Animal()
}
```

当 Schema case 名称与载荷类型具有相同简单名称时，带包的 Kotlin 输出会保留 Schema
case 名称并限定载荷类型。如果目标输出模式无法为冲突表达合法限定名，编译器会在生成的
case 类名后追加 `Case`。

Kotlin `int32`、`int64`、`uint32` 和 `uint64` 字段默认使用 xlang varint 编码，因此生成的
Kotlin 不会为默认情况生成 `@VarInt`。只有 Schema 请求相应非默认编码时，才生成
`@Fixed` 或 `@Tagged`。`duration` 映射到 `kotlin.time.Duration`，编码时会拒绝无限
duration。稠密 `array<float16>` 和 `array<bfloat16>` 使用 Java 核心 `Float16Array` 和
`BFloat16Array` 载体。生成的 Kotlin IDL 使用 `@ArrayType ByteArray` 表示 `array<int8>`，
包括嵌套位置。

## Schema 模块

生成的 Schema 模块注册 Schema 类型，并根据目标类名解析 KSP 生成的序列化器。包拥有
的辅助 Fory 实例使用已安装 Schema 模块的 `ForyKotlin.builder().withXlang(true)`，因此
消息 `toBytes`/`fromBytes` 辅助方法无需调用方管理 Fory 设置即可工作。对于
`addressbook.fdl`：

```kotlin
public object AddressbookForyModule : ForyModule {
  private val fory: ThreadSafeFory by lazy {
    ForyKotlin.builder()
      .withXlang(true)
      .withRefTracking(true)
      .withModule(this)
      .buildThreadSafeFory()
  }

  internal fun getFory(): ThreadSafeFory = fory

  override fun install(fory: Fory) {
    KotlinSerializers.registerType(fory, Person::class.java, 100L)
    KotlinSerializers.registerSerializer(fory, Person::class.java)
    KotlinSerializers.registerUnion(fory, Animal::class.java, 106L)
  }
}
```

`registerUnion` 会发现生成的 `<Target>_ForySerializer`；调用方无需传入序列化器实例。

## gRPC 服务配套代码

使用 `--grpc` 时，Kotlin 为每个服务生成一个 `<ServiceName>GrpcKt.kt`，而不是 Java 配套代码。生成的对象公开 `SERVICE_NAME`、服务和方法描述符、`<ServiceName>CoroutineImplBase` 和 `<ServiceName>CoroutineStub`。依赖项、KSP 设置以及协程和 `Flow` 用法请参阅 [Kotlin gRPC](../../grpc/kotlin.md)。
