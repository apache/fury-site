---
title: 基本序列化
sidebar_position: 3
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

本页介绍 Swift 中的对象图序列化和核心 API 用法。

## 对象图序列化

使用 `@ForyStruct`、`@ForyEnum` 或 `@ForyUnion`，注册类型，然后进行序列化和反序列化。

```swift
import Foundation
import Fory

@ForyStruct
struct Address: Equatable {
    var street: String = ""
    var zip: Int32 = 0
}

@ForyStruct
struct Person: Equatable {
    var id: Int64 = 0
    var name: String = ""
    var nickname: String? = nil
    var tags: Set<String> = []
    var scores: [Int32] = []
    var addresses: [Address] = []
    var metadata: [Int8: Int32?] = [:]
}

let fory = Fory()
try fory.register(Address.self, id: 100)
try fory.register(Person.self, id: 101)

let person = Person(
    id: 42,
    name: "Alice",
    nickname: nil,
    tags: ["swift", "xlang"],
    scores: [10, 20, 30],
    addresses: [Address(street: "Main", zip: 94107)],
    metadata: [1: 100, 2: nil]
)

let data = try fory.serialize(person)
let decoded: Person = try fory.deserialize(data)
assert(decoded == person)
```

## 使用现有缓冲区

将序列化字节追加到现有 `Data`，并从 `ByteBuffer` 反序列化。

```swift
var output = Data()
try fory.serialize(person, to: &output)

let inputBuffer = ByteBuffer(data: output)
let fromBuffer: Person = try fory.deserialize(from: inputBuffer)
assert(fromBuffer == person)
```

## 选择序列化器

实现 `Serializer` 且 `Target == Self` 的类型会选择自身：

```swift
let data = try fory.serialize(person)
let decoded: Person = try fory.deserialize(data)
```

这种隐式选择可以通过生成字段和普通 optional、array、set、dictionary 组合。当应用有意
让外部类型追溯遵循以自身为目标的协议时，也适用此规则。

当单独的序列化器以该值为目标时，使用 `with` 选择它：

```swift
try fory.register(UserSerializer.self, id: 200)

let data = try fory.serialize(
    externalUser,
    with: UserSerializer.self
)
let decoded = try fory.deserialize(
    data,
    with: UserSerializer.self
)
```

同样的选择也适用于现有缓冲区：

```swift
var output = Data()
try fory.serialize(
    externalUser,
    with: UserSerializer.self,
    to: &output
)

let input = ByteBuffer(data: output)
let decoded = try fory.deserialize(
    from: input,
    with: UserSerializer.self
)
```

外部结构化序列化器和递归载体根值请参阅[外部类型序列化](external-types.md)。由类型直接实现
的序列化器、追溯遵循和单独的自定义序列化器请参阅
[自定义序列化器](custom-serializers.md)。

## 内置支持的类型

### 基本类型和标量

- `Bool`
- `Int8`, `Int16`, `Int32`, `Int64`, `Int`
- `UInt8`, `UInt16`, `UInt32`, `UInt64`, `UInt`
- `Float`, `Double`
- `String`
- `Data`

### 日期和时间

- `Date`
- `LocalDate`
- `Duration`

时间戳值使用 `Date`，只包含日期的值使用 `LocalDate`。`LocalDate` 支持纪元日转换和 `Date`
转换，可使用 `fromEpochDay(_:)`、`toEpochDay()`、`init(utcDate:)` 和 `toUTCDate()`。

### 集合

- 值直接实现 `Serializer` 的 optional 和 array
- 元素直接实现 `Serializer` 且为 `Hashable` 的 set
- 键和值直接实现 `Serializer`，且键为 `Hashable` 的 dictionary

使用单独序列化器的子项通过以下类型组合：

- `OptionalSerializer<S>`
- `ArraySerializer<S>`
- `SetSerializer<S>`
- `DictionarySerializer<KS, VS>`

### 动态类型

- `Any` 和 `AnyObject`
- `AnyHashable`
- 任意应用 protocol 值
- 受支持的异构 array 和 dictionary

`Any` 和 `AnyObject` 根值使用直接根值 API。任意应用 protocol 根值和嵌套在载体中的动态值
使用显式 `with:` 选择。请参阅[多态和动态类型](polymorphism.md)。
