---
title: 外部类型序列化
sidebar_position: 9
id: external_types
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

外部类型序列化允许应用在不修改类型的情况下，序列化由其他 Swift 模块拥有的类型。

当目标类型公开了 Fory 可以直接访问和构造的 Schema 时，请使用外部结构化序列化器。当目标类型需要自定义编码或具有私有构造不变量时，请使用[自定义序列化器](custom-serializers.md)。

外部结构化序列化器是一个独立声明。注册后，需要在根值、字段和容器子项上显式选择它。

对于由应用拥有的单个全局实现，Swift 也允许外部类型通过追溯遵循（retroactive conformance）实现 `Serializer`，并令 `Target == Self`。这种形式会在所有位置使用常规的隐式选择，但存在进程级全局遵循带来的风险。详见[自定义序列化器](custom-serializers.md)。

## 外部结构体

声明一个具有相同序列化字段的本地序列化器，并选择外部目标：

```swift
import Fory
import ThirdParty

@ForyStruct(target: ThirdParty.User.self)
struct UserSerializer {
    var name: String
    var age: UInt32
}
```

注册并使用该序列化器：

```swift
let fory = Fory()
try fory.register(UserSerializer.self, id: 100)

let user = ThirdParty.User(name: "Alice", age: 32)
let bytes = try fory.serialize(user, with: UserSerializer.self)
let decoded = try fory.deserialize(bytes, with: UserSerializer.self)
```

目标结构体必须公开可读属性，以及标签和值类型与序列化器声明匹配的可访问初始化器。`public` 结构体自动合成的成员初始化器并不会自动成为 `public`。

## 外部类

为类目标使用类序列化器声明：

```swift
@ForyStruct(target: ThirdParty.Node.self)
final class NodeSerializer {
    var value: Int32 = 0

    @ForyField(with: OptionalSerializer<NodeSerializer>.self)
    var next: ThirdParty.Node? = nil
}
```

目标类必须具有可访问的无参数初始化器，并且序列化属性必须可写。这些要求使 Fory 能够保留共享引用和循环引用。

Swift 只对该声明中列出的字段计入预算。对于占用大量存储但被省略的字段，请添加带 `@ForyField(ignore: true)` 的对应字段；它们会计入对象图预算，但不会被序列化。

如果类不可变、需要构造参数，或在所有字段完成赋值前无法安全地被访问，请使用自定义序列化器。

## 外部枚举

对于不含关联值的枚举，使用 `@ForyEnum(target:)`：

```swift
@ForyEnum(target: ThirdParty.Status.self)
enum StatusSerializer {
    case active
    case disabled
}
```

必须能够对来自其他模块的枚举执行穷尽式 `switch`。对于具有韧性且未标记为 frozen 的 `public` 枚举，需要使用自定义序列化器。

## 外部联合类型

对于 xlang 联合类型值，使用 `@ForyUnion(target:)`：

```swift
@ForyUnion(target: ThirdParty.Command<UnknownCase>.self)
enum CommandSerializer {
    @ForyUnknownCase
    case unknown(UnknownCase)

    @ForyCase(id: 0)
    case rename(String)

    @ForyCase(id: 1, payload: .with(UserSerializer.self))
    case replace(ThirdParty.User)
}
```

目标必须公开匹配的 case，以及一个无损的 `unknown(UnknownCase)` case。没有 Fory 依赖的第三方模块可以声明泛型未知载荷，例如 `Command<UnknownPayload>`，而序列化器可以将其 `Command<UnknownCase>` 特化作为目标。当第三方联合类型使用不同的未知 case 表示方式，或无法保留未知载荷时，请使用自定义序列化器。

一个已知的 Swift 联合类型 case 包含零个或一个关联值。如果某个备选项具有多个逻辑字段，请使用显式的结构体载荷。

## 为字段选择序列化器

使用 `@ForyField(with:)` 为一个确定的字段节点选择序列化器：

```swift
@ForyStruct
struct Account {
    @ForyField(with: UserSerializer.self)
    var owner: ThirdParty.User
}
```

对于可选字段，选择可选值容器：

```swift
@ForyField(with: OptionalSerializer<UserSerializer>.self)
var owner: ThirdParty.User?
```

所选序列化器的 `Target` 必须与声明的字段类型完全匹配。

## 在容器内部选择序列化器

在集合字段注解中使用 `.with(...)`：

```swift
@ForyStruct
struct Directory {
    @ListField(element: .with(UserSerializer.self))
    var users: [ThirdParty.User]

    @SetField(element: .with(KeySerializer.self))
    var keys: Set<ThirdParty.Key>

    @MapField(
        key: .with(KeySerializer.self),
        value: .with(UserSerializer.self)
    )
    var usersByKey: [ThirdParty.Key: ThirdParty.User]

    @MapField(
        value: .list(element: .with(UserSerializer.self))
    )
    var groups: [String: [ThirdParty.User]]
}
```

选择整个容器的方式与之等效：

```swift
@ForyField(with: ArraySerializer<UserSerializer>.self)
var users: [ThirdParty.User]
```

在同一个字段节点上，`with` 不能与编码配置或另一种类型选择组合使用，但可以与 `id` 组合使用。

## 根值容器组合

Swift 为其支持的泛型容器提供了对应的容器序列化器：

| 容器序列化器                   | 目标                     |
| ------------------------------ | ------------------------ |
| `OptionalSerializer<S>`        | `S.Target?`              |
| `ArraySerializer<S>`           | `[S.Target]`             |
| `SetSerializer<S>`             | `Set<S.Target>`          |
| `DictionarySerializer<KS, VS>` | `[KS.Target: VS.Target]` |

容器序列化器可以递归组合：

```swift
typealias DirectorySerializer = DictionarySerializer<
    String,
    ArraySerializer<OptionalSerializer<UserSerializer>>
>

let bytes = try fory.serialize(
    directory,
    with: DirectorySerializer.self
)

let decoded = try fory.deserialize(
    bytes,
    with: DirectorySerializer.self
)
```

`SetSerializer` 要求目标元素可哈希。
`DictionarySerializer` 要求目标键可哈希。

容器序列化器使用与普通 Swift 值相同的可选值、数组、集合和字典编码。

## Buffer API

所有有类型根值形式都可以显式选择序列化器：

```swift
var output = Data()
try fory.serialize(user, with: UserSerializer.self, to: &output)

let input = ByteBuffer(data: output)
let decoded = try fory.deserialize(
    from: input,
    with: UserSerializer.self
)
```

`with` 标签始终用于选择序列化器。

## 动态值

已注册的外部目标可以通过动态 `Any`、`AnyObject` 和应用协议值工作：

```swift
protocol Animal {
    var name: String { get }
}

let animal: any Animal = cat
let bytes = try fory.serialize(
    animal,
    with: DynamicSerializer<any Animal>.self
)
let decoded = try fory.deserialize(
    bytes,
    with: DynamicSerializer<any Animal>.self
)
```

通过普通序列化器、外部结构化序列化器或自定义序列化器注册每个具体目标。

对于包含协议值的根值容器，显式组合 `DynamicSerializer`：

```swift
typealias AnimalArraySerializer =
    ArraySerializer<DynamicSerializer<any Animal>>

let bytes = try fory.serialize(
    animals,
    with: AnimalArraySerializer.self
)
```

## 类型别名

支持序列化器别名和根值容器别名。

当字段类型别名隐藏了集合结构时，请提供完整的递归字段提示：

```swift
typealias Users = [ThirdParty.User]

@ForyField(type: .list(element: .with(UserSerializer.self)))
var users: Users
```
