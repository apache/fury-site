---
title: 自定义序列化器
sidebar_position: 11
id: custom-serializers
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

目标需要自定义编码，或无法满足[外部结构化序列化器](external-types.md)的直接访问要求时，
请使用自定义序列化器。

自定义序列化器不限于外部类型：

- 目标自身遵循 `Serializer` 且 `Target == Self` 时，会在所有位置隐式选择该实现。
- `Target` 为其他类型的单独序列化器，必须在每个需要的位置显式选择。

相同选择规则适用于根值、生成字段、optional、array、set 和 dictionary。注册单独的
序列化器，并在使用位置显式选择它。

## 何时使用自定义序列化器

- 目标包含 private 或不可变状态。
- 目标必须强制执行构造不变量。
- 目标需要专用的紧凑编码。
- 目标需要自定义验证或构造逻辑。
- 外部 enum 无法进行穷尽 switch。
- 外部 union 无法表示 `UnknownCase`。

## 用户拥有的目标

拥有目标类型时，在目标本身实现 `Serializer`，并将 `Target` 设置为相同类型：

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

通过普通根值 API 注册并使用该类型：

```swift
let fory = Fory()
try fory.register(AccountID.self, id: 300)

let input = AccountID(rawValue: 42)
let data = try fory.serialize(input)
let output: AccountID = try fory.deserialize(data)

assert(input == output)
```

不需要 `with:` 参数，因为 `AccountID.Target == AccountID`。

## 外部类型的单个全局序列化器

Swift 允许应用通过追溯遵循让外部类型实现 `Serializer`：

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

由于 `UUID.Target == UUID`，无注解的生成字段和普通载体也会选择该实现：

```swift
@ForyStruct
struct Request {
    var requestID: UUID
}

let input = [UUID(), UUID()]
let data = try fory.serialize(input)
let output: [UUID] = try fory.deserialize(data)
```

追溯遵循作用于整个进程。Swift 对给定类型只允许一个 `Serializer` 遵循；`@retroactive`
表示已知晓编译器警告，但不会使相互竞争的遵循变得安全。只有应用有意选择单个全局实现时
才使用此形式。公共库通常应改为提供单独序列化器。

## 单独序列化器

公共库不得声明进程级全局遵循，或应用需要多个或替代实现时，请使用单独序列化器。目标
可以是外部类型，也可以由用户拥有：

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

注册单独序列化器，并在根值处显式选择它：

```swift
let fory = Fory()
try fory.register(UUIDStringSerializer.self, id: 300)

let input = UUID()
let data = try fory.serialize(input, with: UUIDStringSerializer.self)
let output = try fory.deserialize(data, with: UUIDStringSerializer.self)

assert(input == output)
```

`UUIDBytesSerializer` 等其他声明可以使用不同主体，以同一类型为目标。Fory 无法自动在
单独序列化器之间进行选择。请在根值处使用 `with:`，并使用匹配的字段注解选择所需
序列化器。在给定 `Fory` 实例上，只为目标注册一个实现。

直接的 `Any` 和 `AnyObject` 根值便利 API 仍是动态操作。作为 `Any` 传入的具体值可以使用
已注册序列化器，但具名类型根值和字段使用单独序列化器时仍需要 `with:`。

## 字段和载体

类型直接实现 `Serializer` 且 `Target == Self` 的字段不需要选择器：

```swift
@ForyStruct
struct Request {
    var accountID: AccountID
}
```

单独序列化器必须显式选择：

```swift
@ForyStruct
struct ExternalRequest {
    @ForyField(with: UUIDStringSerializer.self)
    var requestID: UUID
}
```

包含直接实现 `Serializer` 类型的普通载体不需要选择器，其中包括有意添加的追溯遵循：

```swift
let accountIDs = [
    AccountID(rawValue: 1),
    AccountID(rawValue: 2),
]
let data = try fory.serialize(accountIDs)
let output: [AccountID] = try fory.deserialize(data)
```

对于使用单独序列化器的元素，请在载体注解中指定该序列化器：

```swift
@ListField(element: .with(UUIDStringSerializer.self))
var requestIDs: [UUID]
```

在根值处使用匹配的载体序列化器：

```swift
let data = try fory.serialize(
    requestIDs,
    with: ArraySerializer<UUIDStringSerializer>.self
)
```

## 自定义序列化器规则

自定义序列化器必须返回 `.ext`，该值来自 `staticTypeId`。`.structType`、`.enumType` 和
`.typedUnion` 值保留给 `@ForyStruct`、`@ForyEnum` 和 `@ForyUnion`。

`writeData` 和 `readData` 只处理目标主体。不要在这两个操作中调用根值 `serialize` 或
`deserialize` 方法。

## 默认值

只有目标对于 null 或缺失字段存在有效值时，才实现 `defaultValue(_:)`。

## 输入验证

使用适当的 `ForyError` 拒绝无效输入。

## 自定义 Class 序列化器

对于循环引用 class，请覆盖完整值 `read` 操作，并使用 Fory 引用 API，使重复引用解析为
同一对象。
