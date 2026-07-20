---
title: Swift 序列化指南
sidebar_position: 0
id: serialization_index
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

Apache Fory Swift 提供高性能对象图序列化，同时具备强类型安全、基于宏的代码生成、Schema 演进能力以及跨语言兼容性。

## 为什么选择 Fory Swift？

- 面向 Swift 值类型和引用类型的高性能二进制序列化
- 使用 `@ForyObject` 宏，几乎无需样板代码即可让模型支持序列化
- 通过 `xlang` 协议与 Java、Rust、Go、Python 等运行时互通
- 通过兼容模式支持跨版本 Schema 演进
- 内置支持动态值，例如 `Any`、`AnyObject`、`any Serializer`、`AnyHashable`
- 支持共享引用和循环引用跟踪，类类型还支持 `weak` 引用场景

## 安装

通过 Apache Fory GitHub 仓库将 Fory Swift 添加到 Swift Package Manager：

```swift
dependencies: [
    .package(url: "https://github.com/apache/fory.git", exact: "$version")
],
targets: [
    .target(
        name: "MyApp",
        dependencies: [
            .product(name: "Fory", package: "fory")
        ]
    )
]
```

## 指南目录

- [配置](configuration.md)
- [基础序列化](basic-serialization.md)
- [类型注册](type-registration.md)
- [自定义序列化器](custom-serializers.md)
- [字段配置](schema-metadata.md)
- [共享引用与循环引用](references.md)
- [多态与动态类型](polymorphism.md)
- [Schema 演进](schema-evolution.md)
- [跨语言序列化](xlang-serialization.md)
- [Row Format 状态](../xlang/row_format.md)
- [故障排查](troubleshooting.md)

## 快速示例

```swift
import Fory

@ForyObject
struct User: Equatable {
    var name: String = ""
    var age: Int32 = 0
}

let fory = Fory()
fory.register(User.self, id: 1)

let input = User(name: "alice", age: 30)
let data = try fory.serialize(input)
let output: User = try fory.deserialize(data)

assert(input == output)
```
