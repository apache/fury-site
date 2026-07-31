---
title: Schema 元数据
sidebar_position: 4
id: schema_metadata
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

本页介绍 Swift 中宏级别的 schema 元数据。

## 可用的宏属性 {#available-macro-attributes}

- 用于结构体/类模型和外部结构化序列化器的 `@ForyStruct`
- 用于 C 风格枚举模型和外部枚举序列化器的 `@ForyEnum`
- 用于带关联值枚举模型和外部联合类型序列化器的 `@ForyUnion` 和 `@ForyCase`
- 数值字段上的 `@ForyField(encoding: ...)`
- 用于精确选择序列化器的 `@ForyField(with: ...)`
- 用于集合字段元数据的 `@ListField`、`@ArrayField`、`@SetField` 和 `@MapField`

## 外部目标 {#external-targets}

当序列化器声明与被序列化的值类型不同时，请使用 `target:`：

```swift
@ForyStruct(target: ThirdParty.User.self)
struct UserSerializer {
    var name: String
    var age: UInt32
}
```

`@ForyEnum` 和 `@ForyUnion` 也提供等价的目标参数。有关目标访问和构造要求，请参阅
[外部类型序列化](external-types.md)。

## `@ForyField(with:)` {#foryfieldwith}

如果一个类型实现了 `Serializer` 且 `Target == Self`，未添加注解的字段会隐式选择其声明
类型，其中也包括有意为外部类型添加的追溯遵循。使用 `with` 为一个确定的字段节点选择
单独定义的序列化器：

```swift
@ForyStruct
struct Account {
    @ForyField(with: UserSerializer.self)
    var owner: ThirdParty.User
}
```

序列化器的目标必须与声明的字段类型完全匹配。可选节点和整个容器节点需要显式选择其容器
序列化器：

```swift
@ForyField(with: OptionalSerializer<UserSerializer>.self)
var owner: ThirdParty.User?

@ForyField(with: ArraySerializer<UserSerializer>.self)
var users: [ThirdParty.User]
```

`with` 可以与 `id` 组合使用，但不能与 `encoding`、`type` 或同一节点上的另一种类型选择
组合使用。

## `@ForyField(encoding:)` {#foryfieldencoding}

使用 `@ForyField` 覆盖整数编码策略。

```swift
@ForyStruct
struct Metrics: Equatable {
    @ForyField(encoding: .fixed)
    var u32Fixed: UInt32 = 0

    @ForyField(encoding: .tagged)
    var u64Tagged: UInt64 = 0
}
```

### 支持的组合 {#supported-combinations}

| Swift type | 支持的 encoding 值             | 默认 encoding |
| ---------- | ------------------------------ | ------------- |
| `Int32`    | `.varint`, `.fixed`            | `.varint`     |
| `UInt32`   | `.varint`, `.fixed`            | `.varint`     |
| `Int64`    | `.varint`, `.fixed`, `.tagged` | `.varint`     |
| `UInt64`   | `.varint`, `.fixed`, `.tagged` | `.varint`     |
| `Int`      | `.varint`, `.fixed`, `.tagged` | `.varint`     |
| `UInt`     | `.varint`, `.fixed`, `.tagged` | `.varint`     |

编译期校验会拒绝不支持的组合（例如 `Int32` 搭配 `.tagged`）。

## 嵌套集合字段元数据 {#nested-collection-field-metadata}

当集合字段需要类型特定的编码格式元数据时，例如容器内部使用定长或带 tag 的整数编码，请使用 `@ListField`、`@ArrayField`、`@SetField` 和 `@MapField`。密集的非空 bool、整数和浮点数组使用 `@ArrayField`。

```swift
@ForyStruct
struct NestedMetrics: Equatable {
    @ListField(element: .encoding(.fixed))
    var values: [Int32?] = []

    @ArrayField(element: .int32())
    var denseValues: [Int32] = []

    @SetField(element: .encoding(.fixed))
    var ids: Set<UInt32?> = []

    @MapField(key: .encoding(.fixed), value: .encoding(.tagged))
    var byId: [Int32: UInt64] = [:]

    @MapField(value: .list(element: .encoding(.fixed)))
    var groups: [String: [Int32?]] = [:]

    @ListField(element: .with(UserSerializer.self))
    var users: [ThirdParty.User] = []

    @MapField(
        key: .with(KeySerializer.self),
        value: .list(element: .with(UserSerializer.self))
    )
    var usersByKey: [ThirdParty.Key: [ThirdParty.User]] = [:]
}
```

带有定长有符号或无符号整数元数据的非空 `List` 元素，会被分类并编码为匹配的 Fory primitive packed-array 类型。`Set` 字段仍分类为 Fory set，包括定长整数 set。

当 Swift 属性类型是别名，或因其他原因需要完整提示时，请使用 `@ForyField(type:)`：

```swift
typealias MetricsMap = [String: [Int32?]]

@ForyStruct
struct AliasMetrics: Equatable {
    @ForyField(type: .map(
        key: .string,
        value: .list(.int32(nullable: true, encoding: .fixed))
    ))
    var metrics: MetricsMap = [:]
}
```

Union 载荷通过 `@ForyCase(payload:)` 使用同一套 DSL：

```swift
@ForyUnion
enum Event {
    @ForyUnknownCase
    case unknown(UnknownCase)

    @ForyCase(id: 0)
    case created(String)

    @ForyCase(id: 1, payload: .uint64(encoding: .fixed))
    case deleted(UInt64)
}
```

外部载荷通过 `.with(...)` 选择序列化器：

```swift
@ForyCase(id: 2, payload: .with(UserSerializer.self))
case user(ThirdParty.User)
```

每个 `@ForyUnion` 都必须声明 `@ForyUnknownCase case unknown(UnknownCase)`，并至少包含一个
非 `unknown` case。unknown case 仅作为由 Fory 管理的前向兼容载体，不能作为默认值来源。
它不会出现在 Schema case 表中，因为该标记仅用于指定载体，不会增加 Schema 项。Schema
case 使用非负 ID。

一个已知的联合类型 case 包含零个或一个关联值。如果某个备选项包含多个逻辑字段，请使用
结构体载荷。

## 模型宏要求 {#model-macro-requirements}

### 结构体和类字段 {#struct-and-class-fields}

- 存储属性必须声明显式类型
- 计算属性会被忽略
- 静态/类属性会被忽略

### 类要求 {#class-requirement}

标注 `@ForyStruct` 的类必须提供 `required init()` 以进行默认构造。

```swift
@ForyStruct
final class Node {
    var value: Int32 = 0
    var next: Node? = nil

    required init() {}
}
```

外部类序列化器使用类声明。其目标必须公开可访问的无参数初始化器和可写的匹配字段，Fory
才能保留共享引用和循环引用。

## 宏类型中的动态 Any 字段 {#dynamic-any-fields-in-macro-types}

Fory 模型宏支持动态字段和嵌套容器：

- `Any`、`AnyObject` 和任意 `any Protocol` 存在类型
- `AnyHashable`
- `[Any]`
- `[String: Any]`
- `[Int32: Any]`
- `[AnyHashable: Any]`

其他字典键类型也可使用，前提是键实现 `Hashable` 和 `Serializer`，且 `Target == Self`。
如果外部键使用单独定义的序列化器，请通过
`@MapField(key: .with(KeySerializer.self))` 选择它。
