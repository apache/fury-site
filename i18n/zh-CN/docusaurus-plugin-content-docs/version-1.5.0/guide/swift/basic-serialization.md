---
title: 基础序列化
sidebar_position: 1
id: basic_serialization
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

## 与已有缓冲区配合使用

你可以把序列化结果追加到现有 `Data`，也可以从 `ByteBuffer` 反序列化。

```swift
var output = Data()
try fory.serialize(person, to: &output)

let inputBuffer = ByteBuffer(data: output)
let fromBuffer: Person = try fory.deserialize(from: inputBuffer)
assert(fromBuffer == person)
```

## 选择序列化器

实现 `Serializer` 且满足 `Target == Self` 的类型会选择自身作为序列化器：

```swift
let data = try fory.serialize(person)
let decoded: Person = try fory.deserialize(data)
```

这种隐式选择可以穿过生成字段以及普通可选值、数组、集合和字典进行组合。应用有意为外部类型添加 `Target == Self` 的追溯遵循时，同样适用。

当使用单独定义的序列化器处理目标值时，通过 `with` 选择它：

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

相同的选择方式也适用于已有缓冲区：

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

有关结构化序列化器和递归组合的根值容器，请参阅[外部类型序列化](external-types.md)。有关由类型自身实现的序列化器、追溯遵循和单独定义的自定义序列化器，请参阅[自定义序列化器](custom-serializers.md)。

## 内置支持的类型

### 基础标量类型

- `Bool`
- `Int8`、`Int16`、`Int32`、`Int64`、`Int`
- `UInt8`、`UInt16`、`UInt32`、`UInt64`、`UInt`
- `Float`、`Double`
- `String`
- `Data`

### 日期与时间类型

- `Date`
- `LocalDate`
- `Duration`

时间戳值使用 `Date`，仅包含日期的值使用 `LocalDate`。`LocalDate` 可通过 `fromEpochDay(_:)`、`toEpochDay()`、`init(utcDate:)` 和 `toUTCDate()` 在纪元日与 `Date` 之间转换。

### 集合类型

- 值直接实现 `Serializer` 的可选值和数组
- 元素直接实现 `Serializer` 且遵循 `Hashable` 的集合
- 键和值直接实现 `Serializer`，且键遵循 `Hashable` 的字典

使用单独定义的序列化器处理子项时，通过以下类型进行组合：

- `OptionalSerializer<S>`
- `ArraySerializer<S>`
- `SetSerializer<S>`
- `DictionarySerializer<KS, VS>`

### 动态类型

- `Any` 和 `AnyObject`
- `AnyHashable`
- 任意应用协议值
- 支持的异构数组和字典

以 `Any` 和 `AnyObject` 为根值时使用直接的根值 API。以任意应用协议值为根值时，以及动态值嵌套在容器中时，通过 `with:` 显式选择序列化器。详见[多态与动态类型](polymorphism.md)。
