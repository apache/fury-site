---
title: 多态和动态类型
sidebar_position: 9
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

Fory Swift 支持对 `Any`、`AnyObject`、任意应用 protocol existential 和受支持的异构集合
进行动态序列化。`Any` 和 `AnyObject` 根值使用直接便利 API。应用 protocol 和递归组合的
载体显式选择 `DynamicSerializer`。

## 动态根值

```swift
let fory = Fory()

let dynamic: Any = Int32(7)
let data = try fory.serialize(dynamic)
let decoded: Any = try fory.deserialize(data)
```

等效的显式形式是 `with: DynamicSerializer<Any>.self`。它在组合序列化器时很有用，但
`Any` 根值不需要它。`AnyObject` 提供相同的直接根值 API。

作为 `Any` 传入的具体外部值可以使用其已注册序列化器。对于具名类型根值和字段，使用
`with:` 显式选择单独序列化器。

异构容器组合载体序列化器：

```swift
typealias AnyArraySerializer =
    ArraySerializer<DynamicSerializer<Any>>

typealias StringAnyMapSerializer = DictionarySerializer<
    String,
    DynamicSerializer<Any>
>
```

类型擦除的动态 dictionary 键使用 `DynamicSerializer<AnyHashable>`。

动态 list 和 map 使用精确的异构结构：`[Any]`、`[String: Any]`、`[Int32: Any]` 或
`[AnyHashable: Any]`。例如，先写成 `["a", "b"] as [Any]`，再将该异构 list 存入 `Any`。
同构 list 和 map 保持使用其普通具体类型。

## 应用 Protocol

注册可能出现的每个具体目标。无需 Fory 专用标记 protocol：

```swift
protocol Animal {
    var name: String { get }
}

@ForyStruct
struct Dog: Animal {
    var name: String = ""
}

@ForyStruct(target: ThirdParty.Cat.self)
struct CatSerializer {
    var name: String
}

let fory = Fory()
try fory.register(Dog.self, id: 100)
try fory.register(CatSerializer.self, id: 101)

let input: any Animal = Dog(name: "Rex")
let data = try fory.serialize(
    input,
    with: DynamicSerializer<any Animal>.self
)
let output = try fory.deserialize(
    data,
    with: DynamicSerializer<any Animal>.self
)
```

每个具体目标都必须遵循所请求的应用 protocol。目标未注册或未遵循该 protocol 时，
反序列化会失败。

## Protocol 字段

应用 protocol 字段是动态的：

```swift
@ForyStruct
struct Zoo {
    var featured: any Animal
    var animals: [any Animal]
}
```

注册 `Zoo` 和可能出现的每个具体目标。

字段需要 nil 默认值时使用 optional：

```swift
@ForyStruct
struct OptionalZoo {
    var featured: (any Animal)? = nil
}
```

## Protocol 根载体

将 `DynamicSerializer<T>` 用作根载体的子项：

```swift
typealias AnimalArraySerializer =
    ArraySerializer<DynamicSerializer<any Animal>>

let data = try fory.serialize(
    animals,
    with: AnimalArraySerializer.self
)

let decoded = try fory.deserialize(
    data,
    with: AnimalArraySerializer.self
)
```

Optional 和 map 根值以相同方式组合：

```swift
typealias FeaturedSerializer =
    OptionalSerializer<DynamicSerializer<any Animal>>

typealias AnimalMapSerializer = DictionarySerializer<
    String,
    DynamicSerializer<any Animal>
>
```

Swift 的普通 `Hashable` 规则仍适用于 set 元素和 dictionary 键。类型擦除的动态键使用
`AnyHashable`。

## 显式多态 Class 节点

class 类型字段必须保留其具体子类时，选择 `DynamicSerializer<Base>`：

```swift
@ForyField(with: DynamicSerializer<AnimalBase>.self)
var animal: AnimalBase
```

注册可能出现的每个具体子类。

## 动态 `Any` 字段

```swift
@ForyStruct
struct DynamicHolder {
    var value: Any = ForyAnyNullValue()
    var list: [Any] = []
    var byName: [String: Any] = [:]
    var byId: [Int32: Any] = [:]
    var byDynamicKey: [AnyHashable: Any] = [:]
}
```

## 仍需注册具体类型

如果动态值包含用户定义类型，请注册这些具体类型。

```swift
@ForyStruct
struct Address {
    var street: String = ""
    var zip: Int32 = 0
}

let fory = Fory()
try fory.register(Address.self, id: 100)
```

## Null 语义

- `Any` null 表示：`ForyAnyNullValue`
- `AnyObject` null 表示：`NSNull`
- `AnyHashable` 动态 null 键表示：
  `AnyHashable(ForyAnyNullValue())`
- 解码时，optional 动态值映射到相应 null 表示

## `AnyHashable` 键

`AnyHashable` 键必须包装同时满足 `Hashable` 且受 Fory 动态序列化支持的值。
