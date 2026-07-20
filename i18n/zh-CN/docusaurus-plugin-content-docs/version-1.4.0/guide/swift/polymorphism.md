---
title: 多态与动态类型
sidebar_position: 7
id: polymorphism
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

Fory Swift 支持对 `Any`、`AnyObject` 和 `any Serializer` 进行动态序列化。

## 顶层动态 API

```swift
let fory = Fory()

let dynamic: Any = Int32(7)
let data = try fory.serialize(dynamic)
let decoded: Any = try fory.deserialize(data)
```

还提供了等价重载，可用于：

- `AnyObject`
- `any Serializer`
- `AnyHashable`
- `[Any]`
- `[String: Any]`
- `[Int32: Any]`
- `[AnyHashable: Any]`

## `@ForyObject` 类型中的动态字段

```swift
@ForyObject
struct DynamicHolder {
    var value: Any = ForyAnyNullValue()
    var list: [Any] = []
    var byName: [String: Any] = [:]
    var byId: [Int32: Any] = [:]
    var byDynamicKey: [AnyHashable: Any] = [:]
}
```

## 仍然需要注册具体类型

如果动态值中包含用户定义的运行时类型，仍然需要注册这些具体类型。

```swift
@ForyObject
struct Address {
    var street: String = ""
    var zip: Int32 = 0
}

let fory = Fory()
fory.register(Address.self, id: 100)
```

## 空值语义

- `Any` 的空值表示：`ForyAnyNullValue`
- `AnyObject` 的空值表示：`NSNull`
- 可选动态值在反序列化后会映射到相应的空值表示

## 当前限制

- `AnyHashable` 键所包裹的运行时值，必须同时满足 `Hashable` 和 Fory 动态序列化支持
