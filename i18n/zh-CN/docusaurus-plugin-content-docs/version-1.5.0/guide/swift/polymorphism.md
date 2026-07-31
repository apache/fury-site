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

Fory Swift 支持对 `Any`、`AnyObject`、任意应用协议存在类型以及受支持的异构集合进行动态序列化。
以 `Any` 和 `AnyObject` 为根值时，可直接使用便捷 API；应用协议和递归组合的容器则需要显式选择
`DynamicSerializer`。

## 动态根值

```swift
let fory = Fory()

let dynamic: Any = Int32(7)
let data = try fory.serialize(dynamic)
let decoded: Any = try fory.deserialize(data)
```

等价的显式形式为 `with: DynamicSerializer<Any>.self`。组合序列化器时可以使用这种形式，但对于
`Any` 根值并不需要。`AnyObject` 也提供相同的直接根值 API。

以 `Any` 传入的具体外部类型值可以使用其已注册的序列化器。对于有类型的根值和字段，请通过
`with:` 显式选择单独定义的序列化器。

异构容器通过组合容器序列化器实现：

```swift
typealias AnyArraySerializer =
    ArraySerializer<DynamicSerializer<Any>>

typealias StringAnyMapSerializer = DictionarySerializer<
    String,
    DynamicSerializer<Any>
>
```

对于类型擦除的动态字典键，请使用 `DynamicSerializer<AnyHashable>`。

动态 list 和 map 应使用准确的异构类型：`[Any]`、`[String: Any]`、`[Int32: Any]` 或
`[AnyHashable: Any]`。例如，在将异构 list 存入 `Any` 前，应写成 `["a", "b"] as [Any]`。
同构 list 和 map 则应继续使用其常规具体类型。

## 应用协议

注册所有可能出现的具体目标类型。无需使用 Fory 专用的标记协议：

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

每个具体目标类型都必须遵循所请求的应用协议。目标类型未注册或不遵循该协议时，反序列化会失败。

## 协议字段

应用协议字段是动态的：

```swift
@ForyStruct
struct Zoo {
    var featured: any Animal
    var animals: [any Animal]
}
```

请注册 `Zoo` 以及所有可能出现的具体目标类型。

字段需要以 nil 作为默认值时，请使用可选类型：

```swift
@ForyStruct
struct OptionalZoo {
    var featured: (any Animal)? = nil
}
```

## 协议根值容器

将 `DynamicSerializer<T>` 作为根值容器的子序列化器：

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

可选类型和 map 根值也以同样的方式组合：

```swift
typealias FeaturedSerializer =
    OptionalSerializer<DynamicSerializer<any Animal>>

typealias AnimalMapSerializer = DictionarySerializer<
    String,
    DynamicSerializer<any Animal>
>
```

对于 set 元素和字典键，Swift 常规的 `Hashable` 规则仍然适用。类型擦除的动态键应使用
`AnyHashable`。

## 显式多态类节点

当类类型字段需要保留其具体子类时，请选择 `DynamicSerializer<Base>`：

```swift
@ForyField(with: DynamicSerializer<AnimalBase>.self)
var animal: AnimalBase
```

请注册所有可能出现的具体子类。

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

如果动态值中包含用户定义的类型，请注册这些具体类型。

```swift
@ForyStruct
struct Address {
    var street: String = ""
    var zip: Int32 = 0
}

let fory = Fory()
try fory.register(Address.self, id: 100)
```

## 空值语义

- `Any` 的空值表示：`ForyAnyNullValue`
- `AnyObject` 的空值表示：`NSNull`
- `AnyHashable` 动态空键的表示：`AnyHashable(ForyAnyNullValue())`
- 可选动态值在反序列化后会映射到相应的空值表示

## `AnyHashable` 键

`AnyHashable` 键所包装的值必须同时满足 `Hashable` 要求，并且受 Fory 动态序列化支持。
