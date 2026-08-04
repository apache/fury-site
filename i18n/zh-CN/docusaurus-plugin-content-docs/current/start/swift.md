---
title: Swift 设置
sidebar_position: 8
id: swift
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

Fory Swift 提供 xlang 对象序列化和编译器生成的模型。它通过 Swift Package Manager 分发，使用 Swift tools 6.0，目标平台为 macOS 13 及更高版本和 iOS 16 及更高版本。

## 验证工具链

```bash
swift --version
```

## 对象序列化

创建可执行软件包：

```bash
swift package init --type executable --name ForyExample
```

在生成的 `Package.swift` 中添加已发布的软件包和 `Fory` 产品：

```swift title="Package.swift"
dependencies: [
    .package(url: "https://github.com/apache/fory.git", exact: "1.5.0")
],
targets: [
    .executableTarget(
        name: "ForyExample",
        dependencies: [.product(name: "Fory", package: "fory")]
    )
]
```

将 `Sources/main.swift` 替换为：

```swift title="Sources/main.swift"
import Fory

@ForyStruct
struct User: Equatable {
    var id: Int64 = 0
    var name: String = ""
}

let fory = Fory()
try fory.register(User.self, id: 1)

let input = User(id: 1, name: "Alice")
let bytes = try fory.serialize(input)
let decoded: User = try fory.deserialize(bytes)
assert(input == decoded)
```

```bash
swift run
```

Swift 使用 xlang 模式。接下来可阅读 [Swift 对象序列化](../object-serialization/swift/index.md)、[xlang 类型](../object-serialization/swift/xlang.md)、[配置](../object-serialization/swift/configuration.md)和 [Schema 演进](../object-serialization/swift/schema-evolution.md)。

## 其他能力

- **Fory IDL 与编译器** 生成 Swift 模型和注册辅助代码。请参阅[编译器快速入门](../compiler/getting-started.md)和 [Swift 生成代码指南](../compiler/generated-code/swift.md)。
