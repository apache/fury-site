---
title: Swift 对象序列化
sidebar_position: 0
id: index
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

Apache Fory Swift 提供高性能对象图序列化，具备强类型安全、基于宏的代码生成、Schema 演进和跨语言兼容性。

## 为什么选择 Fory Swift？

- 面向 Swift 值类型和引用类型的快速二进制序列化
- 使用 `@ForyStruct`、`@ForyEnum` 和 `@ForyUnion` 宏实现无样板代码的模型序列化
- Xlang 协议兼容 Java、Rust、Go、Python 等语言
- 使用兼容模式实现跨版本 Schema 演进
- 支持外部结构化序列化器、自定义序列化器和递归组合的载体序列化器
- 内置支持动态值和任意应用 protocol existential
- 对共享/循环对象图进行引用跟踪，包括 class 上的弱引用

## 安装

从 Apache Fory GitHub 仓库添加 Fory Swift：

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
- [基本序列化](core-api.md)
- [Xlang 序列化](xlang.md)
- [Schema 元数据](schema-metadata.md)
- [类型注册](type-registration.md)
- [外部类型序列化](external-types.md)
- [自定义序列化器](custom-serializers.md)
- [共享引用和循环引用](references.md)
- [多态和动态类型](polymorphism.md)
- [Schema 演进](schema-evolution.md)
- [故障排查](troubleshooting.md)

## 快速示例

```swift
import Fory

@ForyStruct
struct User: Equatable {
    var name: String = ""
    var age: Int32 = 0
}

let fory = Fory()
try fory.register(User.self, id: 1)

let input = User(name: "alice", age: 30)
let data = try fory.serialize(input)
let output: User = try fory.deserialize(data)

assert(input == output)
```
