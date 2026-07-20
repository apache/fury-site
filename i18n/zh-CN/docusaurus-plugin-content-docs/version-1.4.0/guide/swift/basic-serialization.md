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

在结构体、类或枚举上使用 `@ForyObject`，注册类型后即可进行序列化和反序列化。

```swift
import Foundation
import Fory

@ForyObject
struct Address: Equatable {
    var street: String = ""
    var zip: Int32 = 0
}

@ForyObject
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
fory.register(Address.self, id: 100)
fory.register(Person.self, id: 101)

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
- `ForyDate`
- `ForyTimestamp`

### 集合类型

- `[T]`，其中 `T: Serializer`
- `Set<T>`，其中 `T: Serializer & Hashable`
- `[K: V]`，其中 `K: Serializer & Hashable`、`V: Serializer`
- 可选值变体 `T?`

### 动态类型

- `Any`
- `AnyObject`
- `any Serializer`
- `AnyHashable`
- `[Any]`
- `[String: Any]`
- `[Int32: Any]`
- `[AnyHashable: Any]`
