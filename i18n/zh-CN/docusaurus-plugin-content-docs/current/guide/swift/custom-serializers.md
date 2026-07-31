---
title: 自定义序列化器
sidebar_position: 10
id: custom_serializers
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

当目标类型需要自定义编码，或无法满足[外部结构化序列化器](external-types.md)的直接访问要求时，请使用自定义序列化器。

自定义序列化器并非只能用于外部类型：

- 如果目标类型自身遵循 `Serializer`，并且 `Target == Self`，则该实现会在所有位置被隐式选中。
- 如果单独定义的序列化器以另一种类型作为 `Target`，则必须在每个需要它的位置显式选择该序列化器。

根值、生成字段、可选值、数组、集合和字典都遵循相同的选择规则。请注册单独定义的序列化器，并在使用它的位置显式选择它。

## 何时使用自定义序列化器

- 目标类型包含私有或不可变状态。
- 目标类型必须强制执行构造不变量。
- 目标类型需要专用的紧凑编码。
- 目标类型需要自定义校验或构造逻辑。
- 外部枚举无法进行穷尽式 `switch`。
- 外部联合类型无法表示 `UnknownCase`。

## 用户自有的目标类型

如果目标类型由你维护，请让目标类型自身实现 `Serializer`，并将 `Target` 设为相同类型：

```swift
import Fory

struct AccountID: Serializer, Equatable {
    typealias Target = AccountID

    let rawValue: UInt64

    static var staticTypeId: TypeId {
        .ext
    }

    static func writeData(
        _ value: AccountID,
        _ context: WriteContext
    ) throws {
        try UInt64.writeData(value.rawValue, context)
    }

    static func readData(
        _ context: ReadContext
    ) throws -> AccountID {
        AccountID(rawValue: try UInt64.readData(context))
    }
}
```

通过常规的根值 API 注册并使用该类型：

```swift
let fory = Fory()
try fory.register(AccountID.self, id: 300)

let input = AccountID(rawValue: 42)
let data = try fory.serialize(input)
let output: AccountID = try fory.deserialize(data)

assert(input == output)
```

由于 `AccountID.Target == AccountID`，因此不需要 `with:` 参数。

## 为外部类型定义一个全局序列化器

Swift 允许应用通过追溯遵循（retroactive conformance）让外部类型实现 `Serializer`：

```swift
import Foundation
import Fory

extension UUID: @retroactive Serializer {
    public typealias Target = UUID

    public static var staticTypeId: TypeId {
        .ext
    }

    public static func defaultValue(
        _ context: ReadContext
    ) throws -> UUID {
        _ = context
        return UUID(
            uuidString: "00000000-0000-0000-0000-000000000000"
        )!
    }

    public static func writeData(
        _ value: UUID,
        _ context: WriteContext
    ) throws {
        try String.writeData(value.uuidString, context)
    }

    public static func readData(
        _ context: ReadContext
    ) throws -> UUID {
        let raw = try String.readData(context)
        guard let uuid = UUID(uuidString: raw) else {
            throw ForyError.invalidData("invalid UUID string: \(raw)")
        }
        return uuid
    }
}
```

注册外部类型本身：

```swift
try fory.register(UUID.self, id: 300)

let input = UUID()
let data = try fory.serialize(input)
let output: UUID = try fory.deserialize(data)
```

由于 `UUID.Target == UUID`，没有添加注解的生成字段和普通容器也会选用该实现：

```swift
@ForyStruct
struct Request {
    var requestID: UUID
}

let input = [UUID(), UUID()]
let data = try fory.serialize(input)
let output: [UUID] = try fory.deserialize(data)
```

追溯遵循会作用于整个进程。对于一个给定类型，Swift 只允许存在一个 `Serializer` 遵循；`@retroactive` 只是表明你已知晓编译器警告，并不能让相互冲突的多个遵循变得安全。只有当应用有意选择唯一的全局实现时，才应采用这种形式。公共库通常应改为提供单独定义的序列化器。

## 单独定义的序列化器

当公共库不应声明作用于整个进程的遵循，或应用需要多个实现或替代实现时，请单独定义序列化器。目标类型既可以是外部类型，也可以是用户自有类型：

```swift
import Foundation
import Fory

public enum UUIDStringSerializer: Serializer {
    public typealias Target = UUID

    public static var staticTypeId: TypeId {
        .ext
    }

    public static func defaultValue(
        _ context: ReadContext
    ) throws -> UUID {
        _ = context
        return UUID(
            uuidString: "00000000-0000-0000-0000-000000000000"
        )!
    }

    public static func writeData(
        _ value: UUID,
        _ context: WriteContext
    ) throws {
        try String.writeData(value.uuidString, context)
    }

    public static func readData(
        _ context: ReadContext
    ) throws -> UUID {
        let raw = try String.readData(context)
        guard let uuid = UUID(uuidString: raw) else {
            throw ForyError.invalidData("invalid UUID string: \(raw)")
        }
        return uuid
    }
}
```

注册单独定义的序列化器，并在根值处显式选择它：

```swift
let fory = Fory()
try fory.register(UUIDStringSerializer.self, id: 300)

let input = UUID()
let data = try fory.serialize(input, with: UUIDStringSerializer.self)
let output = try fory.deserialize(data, with: UUIDStringSerializer.self)

assert(input == output)
```

另一个声明（例如 `UUIDBytesSerializer`）可以使用不同的主体编码处理同一目标类型。Fory 无法自动在多个单独定义的序列化器中进行选择。请在根值处通过 `with:` 选择所需的序列化器，并在字段上使用与之匹配的注解。一个 `Fory` 实例只能为该目标类型注册一种实现。

直接以 `Any` 和 `AnyObject` 作为根值的便捷 API 仍然是动态操作。以 `Any` 形式传入具体值时，可能会使用已经注册的序列化器，但使用静态类型的根值和字段仍然需要通过 `with:` 指定单独定义的序列化器。

## 字段和容器

如果字段类型直接实现了 `Serializer`，并且 `Target == Self`，则无需指定选择器：

```swift
@ForyStruct
struct Request {
    var accountID: AccountID
}
```

单独定义的序列化器必须显式选择：

```swift
@ForyStruct
struct ExternalRequest {
    @ForyField(with: UUIDStringSerializer.self)
    var requestID: UUID
}
```

如果普通容器所包含的类型直接实现了 `Serializer`，则无需指定选择器。这也包括有意添加的追溯遵循：

```swift
let accountIDs = [
    AccountID(rawValue: 1),
    AccountID(rawValue: 2),
]
let data = try fory.serialize(accountIDs)
let output: [AccountID] = try fory.deserialize(data)
```

如果元素使用单独定义的序列化器，请在容器注解中指定该序列化器：

```swift
@ListField(element: .with(UUIDStringSerializer.self))
var requestIDs: [UUID]
```

在根值处，请使用与之匹配的容器序列化器：

```swift
let data = try fory.serialize(
    requestIDs,
    with: ArraySerializer<UUIDStringSerializer>.self
)
```

## 自定义序列化器规则

自定义序列化器的 `staticTypeId` 必须返回 `.ext`。`.structType`、`.enumType` 和 `.typedUnion` 分别保留给 `@ForyStruct`、`@ForyEnum` 和 `@ForyUnion`。

`writeData` 和 `readData` 只处理目标值的编码主体。请勿在这两个操作中调用根值的 `serialize` 或 `deserialize` 方法。

## 默认值

仅当目标类型存在可用于空字段或缺失字段的有效值时，才实现 `defaultValue(_:)`。

## 输入校验

请使用适当的 `ForyError` 拒绝无效输入。

## 自定义类序列化器

对于存在循环引用的类，请重写读取完整值的 `read` 操作，并使用 Fory 的引用 API，以确保重复引用解析为同一个对象。
