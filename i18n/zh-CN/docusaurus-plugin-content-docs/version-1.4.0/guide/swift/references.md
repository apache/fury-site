---
title: 共享引用与循环引用
sidebar_position: 6
id: references
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

Swift 中的引用跟踪由 `ForyConfig.trackRef` 控制。

## 启用引用跟踪

```swift
let fory = Fory(xlang: true, trackRef: true, compatible: false)
```

启用后，可跟踪引用的类型会保留对象身份和循环结构。

## 共享引用示例

```swift
import Fory

@ForyObject
final class Animal {
    var name: String = ""

    required init() {}

    init(name: String) {
        self.name = name
    }
}

@ForyObject
final class AnimalPair {
    var first: Animal? = nil
    var second: Animal? = nil

    required init() {}

    init(first: Animal? = nil, second: Animal? = nil) {
        self.first = first
        self.second = second
    }
}

let fory = Fory(xlang: true, trackRef: true)
fory.register(Animal.self, id: 200)
fory.register(AnimalPair.self, id: 201)

let shared = Animal(name: "cat")
let input = AnimalPair(first: shared, second: shared)

let data = try fory.serialize(input)
let decoded: AnimalPair = try fory.deserialize(data)

assert(decoded.first === decoded.second)
```

## 循环引用示例：使用 `weak`

`trackRef` 会保留引用图，但不会改变 ARC 的所有权规则。为了避免内存泄漏，循环边至少有一侧应使用 `weak`。

```swift
import Fory

@ForyObject
final class Node {
    var value: Int32 = 0
    weak var next: Node? = nil

    required init() {}

    init(value: Int32, next: Node? = nil) {
        self.value = value
        self.next = next
    }
}

let fory = Fory(xlang: true, trackRef: true)
fory.register(Node.self, id: 300)

let node = Node(value: 7)
node.next = node

let data = try fory.serialize(node)
let decoded: Node = try fory.deserialize(data)

assert(decoded.next === decoded)
```

## 说明

- 值类型，例如 `struct` 和基础值，不具备对象身份语义
- `trackRef` 控制的是序列化时的引用图身份，而不是 ARC 内存管理
- 纯值载荷可使用 `trackRef=false` 以减少开销
