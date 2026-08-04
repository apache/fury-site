---
title: 外部类型序列化
sidebar_position: 10
id: external-types
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

外部类型序列化让应用无需修改其他 Swift 模块拥有的类型，即可序列化该类型。

如果目标公开了 Fory 可以直接访问和构造的 Schema，请使用外部结构化序列化器。如果目标
需要自定义编码或具有 private 构造不变量，请使用[自定义序列化器](custom-serializers.md)。

外部结构化序列化器是单独声明。请先注册它，再在根值、字段和载体子项处显式选择。

对于应用拥有的单个全局实现，Swift 也允许外部类型追溯遵循 `Serializer` 并满足
`Target == Self`。这种形式在所有位置使用普通隐式选择，并存在进程级全局遵循风险。请参阅
[自定义序列化器](custom-serializers.md)。

## 外部 Struct

声明具有相同序列化字段的本地序列化器，并选择外部目标：

```swift
import Fory
import ThirdParty

@ForyStruct(target: ThirdParty.User.self)
struct UserSerializer {
    var name: String
    var age: UInt32
}
```

注册并使用序列化器：

```swift
let fory = Fory()
try fory.register(UserSerializer.self, id: 100)

let user = ThirdParty.User(name: "Alice", age: 32)
let bytes = try fory.serialize(user, with: UserSerializer.self)
let decoded = try fory.deserialize(bytes, with: UserSerializer.self)
```

目标 struct 必须公开可读属性和可访问的初始化器，其标签和值类型要与序列化器声明匹配。
public struct 的合成逐成员初始化器不会自动成为 public。

## 外部 Class

对于 class 目标，请使用 class 序列化器声明：

```swift
@ForyStruct(target: ThirdParty.Node.self)
final class NodeSerializer {
    var value: Int32 = 0

    @ForyField(with: OptionalSerializer<NodeSerializer>.self)
    var next: ThirdParty.Node? = nil
}
```

目标 class 必须具有可访问的无参初始化器和可写的序列化属性。这些要求使 Fory 能够保留
共享引用和循环引用。

Swift 只为此声明中列出的字段计算预算。对于大量但被忽略的存储，请添加
`@ForyField(ignore: true)` 字段；它们计入对象图预算，但不会被序列化。

如果 class 不可变、需要构造参数，或在所有字段完成赋值前无法安全观察，请使用自定义
序列化器。

## 外部 Enum

对于不含关联值的 enum，使用 `@ForyEnum(target:)`：

```swift
@ForyEnum(target: ThirdParty.Status.self)
enum StatusSerializer {
    case active
    case disabled
}
```

来自其他模块的 enum 必须能够进行穷尽 switch。具备演进能力的 non-frozen public enum
需要自定义序列化器。

## 外部 Union

对于 xlang union 值，使用 `@ForyUnion(target:)`：

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

目标必须提供匹配的 case 和无损的 `unknown(UnknownCase)` case。无 Fory 依赖的第三方模块
可以声明泛型未知载荷，例如 `Command<UnknownPayload>`，序列化器则可以以其
`Command<UnknownCase>` 特化为目标。如果第三方 union 使用不同的未知 case 表示，或无法
保留未知载荷，请使用自定义序列化器。

已知 Swift union case 包含零个或一个关联值。当候选项包含多个逻辑字段时，请使用显式
struct 载荷。

## 为字段选择序列化器

使用 `@ForyField(with:)` 选择确切的字段节点：

```swift
@ForyStruct
struct Account {
    @ForyField(with: UserSerializer.self)
    var owner: ThirdParty.User
}
```

对于 optional 字段，请选择 optional 载体：

```swift
@ForyField(with: OptionalSerializer<UserSerializer>.self)
var owner: ThirdParty.User?
```

所选序列化器的 `Target` 必须与声明的字段类型完全匹配。

## 在载体内部选择序列化器

在集合字段注解内使用 `.with(...)`：

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

选择整个载体的效果等价：

```swift
@ForyField(with: ArraySerializer<UserSerializer>.self)
var users: [ThirdParty.User]
```

在同一字段节点上，`with` 不能与编码或其他类型选择组合，但可以与 `id` 组合。

## 根载体组合

Swift 为受支持的泛型载体提供以下载体序列化器：

| 载体序列化器                   | 目标                     |
| ------------------------------ | ------------------------ |
| `OptionalSerializer<S>`        | `S.Target?`              |
| `ArraySerializer<S>`           | `[S.Target]`             |
| `SetSerializer<S>`             | `Set<S.Target>`          |
| `DictionarySerializer<KS, VS>` | `[KS.Target: VS.Target]` |

载体序列化器可以递归组合：

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

`SetSerializer` 要求目标元素可哈希。`DictionarySerializer` 要求目标键可哈希。

载体序列化器使用与普通 Swift 值相同的 optional、array、set 和 dictionary 编码。

## Buffer API

所有有类型根值形式都支持显式选择序列化器：

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

已注册外部目标可以通过动态 `Any`、`AnyObject` 和应用 protocol 值使用：

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

对于包含 protocol 值的根载体，请显式组合 `DynamicSerializer`：

```swift
typealias AnimalArraySerializer =
    ArraySerializer<DynamicSerializer<any Animal>>

let bytes = try fory.serialize(
    animals,
    with: AnimalArraySerializer.self
)
```

## 类型别名

支持序列化器别名和根载体别名。

如果字段类型别名隐藏了集合结构，请提供完整的递归字段提示：

```swift
typealias Users = [ThirdParty.User]

@ForyField(type: .list(element: .with(UserSerializer.self)))
var users: Users
```
