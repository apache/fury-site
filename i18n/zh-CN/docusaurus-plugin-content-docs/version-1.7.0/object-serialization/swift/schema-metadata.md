---
title: Schema 元数据
sidebar_position: 7
id: schema-metadata
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

本页介绍 Swift 中宏级别的 Schema 元数据。

## 可用宏属性

- `@ForyStruct`：用于 struct/class 模型和外部结构化序列化器
- `@ForyEnum`：用于 C 风格 enum 模型和外部 enum 序列化器
- `@ForyUnion` 和 `@ForyCase`：用于关联值 enum 模型和外部 union 序列化器
- `@ForyField(encoding: ...)`：用于数值字段
- `@ForyField(with: ...)`：用于精确选择序列化器
- `@ListField`、`@ArrayField`、`@SetField` 和 `@MapField`：用于集合字段元数据

## 外部目标

当序列化器声明与被序列化值的类型不同时，使用 `target:`：

```swift
@ForyStruct(target: ThirdParty.User.self)
struct UserSerializer {
    var name: String
    var age: UInt32
}
```

`@ForyEnum` 和 `@ForyUnion` 也提供等价的目标参数。目标访问和构造要求请参阅
[外部类型序列化](external-types.md)。

## `@ForyField(with:)`

如果未添加注解的字段，其声明类型实现了 `Serializer` 且 `Target == Self`，该字段会隐式
选择声明类型；这也包括有意添加的外部类型追溯遵循。使用 `with` 为确切字段节点选择单独的
序列化器：

```swift
@ForyStruct
struct Account {
    @ForyField(with: UserSerializer.self)
    var owner: ThirdParty.User
}
```

序列化器目标必须与声明的字段类型完全匹配。Optional 和整个载体节点需要显式选择相应的
载体序列化器：

```swift
@ForyField(with: OptionalSerializer<UserSerializer>.self)
var owner: ThirdParty.User?

@ForyField(with: ArraySerializer<UserSerializer>.self)
var users: [ThirdParty.User]
```

`with` 可以与 `id` 组合，但不能在同一节点上与 `encoding`、`type` 或其他类型选择组合。

## `@ForyField(encoding:)`

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

### 支持的组合

| Swift 类型 | 支持的编码值                   | 默认编码  |
| ---------- | ------------------------------ | --------- |
| `Int32`    | `.varint`, `.fixed`            | `.varint` |
| `UInt32`   | `.varint`, `.fixed`            | `.varint` |
| `Int64`    | `.varint`, `.fixed`, `.tagged` | `.varint` |
| `UInt64`   | `.varint`, `.fixed`, `.tagged` | `.varint` |
| `Int`      | `.varint`, `.fixed`, `.tagged` | `.varint` |
| `UInt`     | `.varint`, `.fixed`, `.tagged` | `.varint` |

编译时验证会拒绝不支持的组合（例如 `Int32` 配合 `.tagged`）。

## 嵌套集合字段元数据

当集合字段需要类型特定的编码格式元数据时，使用 `@ListField`、`@ArrayField`、`@SetField` 和
`@MapField`，例如容器内的 fixed 或 tagged 整数编码。密集的非空 bool、整数和浮点数组使用
`@ArrayField`。

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

带定长有符号或无符号整数元数据的非空 `List` 元素，会被分类并编码为匹配的 Fory 基本类型
紧凑数组类型。`Set` 字段仍分类为 Fory set，包括定长整数 set。

如果 Swift 属性类型是别名或因其他原因需要完整提示，请使用 `@ForyField(type:)`：

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

Union 载荷通过 `@ForyCase(payload:)` 使用相同 DSL：

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

外部载荷使用 `.with(...)` 选择序列化器：

```swift
@ForyCase(id: 2, payload: .with(UserSerializer.self))
case user(ThirdParty.User)
```

每个 `@ForyUnion` 都必须声明 `@ForyUnknownCase case unknown(UnknownCase)`，并至少包含一个非
`unknown` case。unknown case 只是 Fory 提供的前向兼容载体，不能作为默认值来源。它不会
出现在 Schema case 表中，因为该标记只选择载体，不会添加 Schema 条目。Schema case 使用
非负 ID。

已知 union case 包含零个或一个关联值。当一个候选项包含多个逻辑字段时，请使用 struct 载荷。

## 模型宏要求

### Struct 和 class 字段

- 存储属性必须声明显式类型
- 忽略计算属性
- 忽略 static/class 属性

### Class 要求

带 `@ForyStruct` 注解的 class 必须提供用于默认构造的 `required init()`。

```swift
@ForyStruct
final class Node {
    var value: Int32 = 0
    var next: Node? = nil

    required init() {}
}
```

外部 class 序列化器使用 class 声明。其目标必须公开可访问的无参初始化器和可写的匹配字段，
使 Fory 能够保留共享引用和循环引用。

## 宏类型中的动态 Any 字段

Fory 模型宏支持动态字段和嵌套容器：

- `Any`、`AnyObject` 和任意 `any Protocol` existential
- `AnyHashable`
- `[Any]`
- `[String: Any]`
- `[Int32: Any]`
- `[AnyHashable: Any]`

如果其他 dictionary 键类型为 `Hashable` 且实现 `Serializer` 并满足 `Target == Self`，也可以
正常使用。对于使用单独序列化器的外部键，请通过
`@MapField(key: .with(KeySerializer.self))` 选择。
