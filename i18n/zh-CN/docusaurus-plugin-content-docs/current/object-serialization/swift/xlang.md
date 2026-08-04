---
title: Xlang 序列化
sidebar_position: 1
id: xlang
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

Fory Swift 可以使用 xlang 协议与其他 Fory 实现交换载荷。

## 推荐的 Xlang 配置

```swift
let fory = Fory()
```

## 使用共享标识注册类型

### 基于 ID 的注册

```swift
@ForyStruct
struct Order {
    var id: Int64 = 0
    var amount: Double = 0
}

let fory = Fory()
try fory.register(Order.self, id: 100)
```

### 基于名称的注册

```swift
try fory.register(Order.self, name: "com.example.Order")
```

## Xlang 规则

- 在不同语言间保持类型注册映射一致
- 独立演进 Schema 时保持启用兼容模式。Swift 默认启用兼容模式。
- 注册动态字段和应用 protocol 值所使用的所有用户定义具体目标
- 对其他模块拥有的类型，使用外部结构化序列化器、单独的自定义序列化器，或一个有意添加的
  追溯自目标遵循

## List 和密集数组

Swift `Array<T>` 字段映射为 Fory `list<T>`，除非字段元数据显式请求密集 `array<T>`。
`array<T>` 只用于一维 bool 或数值数据。

| Fory Schema       | Swift 字段元数据示意                                     |
| ----------------- | -------------------------------------------------------- |
| `list<int32>`     | `@ListField(element: .int32()) var ids: [Int32]`         |
| `array<bool>`     | `@ArrayField(element: .bool) var flags: [Bool]`          |
| `array<int8>`     | `@ArrayField(element: .int8) var values: [Int8]`         |
| `array<int16>`    | `@ArrayField(element: .int16) var values: [Int16]`       |
| `array<int32>`    | `@ArrayField(element: .int32()) var values: [Int32]`     |
| `array<int64>`    | `@ArrayField(element: .int64()) var values: [Int64]`     |
| `array<uint8>`    | `@ArrayField(element: .uint8) var values: [UInt8]`       |
| `array<uint16>`   | `@ArrayField(element: .uint16) var values: [UInt16]`     |
| `array<uint32>`   | `@ArrayField(element: .uint32()) var values: [UInt32]`   |
| `array<uint64>`   | `@ArrayField(element: .uint64()) var values: [UInt64]`   |
| `array<float16>`  | `@ArrayField(element: .float16) var values: [Float16]`   |
| `array<bfloat16>` | `@ArrayField(element: .bfloat16) var values: [BFloat16]` |
| `array<float32>`  | `@ArrayField(element: .float32) var values: [Float]`     |
| `array<float64>`  | `@ArrayField(element: .float64) var values: [Double]`    |

使用单独元素序列化器的 array 仍使用普通 list 编码。只对受支持的密集 bool 或数值数组使用
`@ArrayField`。

## 外部目标

外部结构化序列化器生成的 xlang STRUCT、ENUM 或 UNION Schema 和值字节，与等效普通 Swift
模型相同：

```swift
@ForyStruct(target: ThirdParty.Order.self)
struct OrderSerializer {
    var id: Int64
    var amount: Double
}

try fory.register(OrderSerializer.self, id: 100)
```

在字段元数据中使用 `.with(...)`，在根值处使用 `with:`。请参阅
[外部类型序列化](external-types.md)。

由于结构化序列化器是单独声明，因此必须显式选择。相反，如果外部类型有一个有意添加的
追溯 `Target == Self` 遵循，则使用普通根值、字段和载体。

Swift 没有原生序列化模式。已知 `@ForyUnion` case 包含零个或一个关联值。如果 union 候选项
包含多个逻辑字段，请使用 struct 载荷。

## Swift IDL 工作流

直接从 Fory IDL/Proto/FBS 输入生成 Swift 模型：

```bash
foryc schema.fdl --swift_out ./Sources/Generated
```

生成的 Swift 代码包括：

- `@ForyStruct`、`@ForyEnum`、`@ForyUnion` 以及字段/case 元数据
- Tagged union enum（关联值 enum case）
- 支持传递安装 import 的 `ForyModule.install(_:)` 辅助方法
- 生成类型上的 `toBytes` / `fromBytes` 辅助方法

进行 xlang 序列化前安装生成模块：

```swift
let fory = Fory(ref: true)
try Addressbook.ForyModule.install(fory)

let payload = try fory.serialize(book)
let decoded: Addressbook.AddressBook = try fory.deserialize(payload)
```

### 运行 Swift IDL 集成测试

```bash
cd integration_tests/idl_tests
./run_swift_tests.sh
```

该命令运行 Swift 往返矩阵测试和 Java 对等端往返检查（`IDL_PEER_LANG=swift`）。

## 调试 Xlang 测试

运行 xlang 测试时启用调试输出：

```bash
ENABLE_FORY_DEBUG_OUTPUT=1 FORY_SWIFT_JAVA_CI=1 mvn -T16 test -Dtest=org.apache.fory.xlang.SwiftXlangTest
```

## 首次往返

```swift
import Fory

@ForyStruct
struct Person: Equatable {
    var name: String = ""
    var age: Int32 = 0
}

let fory = Fory()
fory.register(Person.self, id: 1)

let person = Person(name: "chaokunyang", age: 28)
let data = try fory.serialize(person)
let result: Person = try fory.deserialize(data)

print("\(result.name) \(result.age)")
```

更多跨语言规则和示例请参阅：

- [跨语言序列化指南](../xlang/index.md)
- [Java 指南](../java/index.md)
- [Python 指南](../python/index.md)
- [Dart 指南](../dart/index.md)
- [Go 指南](../go/index.md)
- [Rust 指南](../rust/index.md)
- [C++ 指南](../cpp/index.md)
- [C# 指南](../csharp/index.md)
- [Swift 指南](../swift/index.md)
