---
title: Xlang 序列化
sidebar_position: 3
id: xlang_serialization
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

Fory Swift 可以通过 xlang 协议与其他 Fory 实现交换载荷。

## 推荐的 Xlang 配置

```swift
let fory = Fory()
```

## 用共享身份注册类型

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

- 在不同语言之间保持一致的类型注册映射
- 当各端 Schema 独立演进时，保持启用兼容模式。Swift 默认启用该模式
- 注册动态字段和应用协议值使用的所有用户定义具体目标类型
- 对于由其他模块拥有的类型，使用外部结构化序列化器、单独定义的自定义序列化器，或有意添加的
  目标为自身的追溯遵循

## List 与密集数组

除非字段元数据显式要求使用密集的 `array<T>`，否则 Swift `Array<T>` 字段会映射为 Fory
`list<T>`。`array<T>` 仅用于一维 bool 或数值数据。

| Fory Schema        | Swift 字段元数据示例                                     |
| ------------------ | -------------------------------------------------------- |
| `list<int32>`      | `@ListField(element: .int32()) var ids: [Int32]`         |
| `array<bool>`      | `@ArrayField(element: .bool) var flags: [Bool]`          |
| `array<int8>`      | `@ArrayField(element: .int8) var values: [Int8]`         |
| `array<int16>`     | `@ArrayField(element: .int16) var values: [Int16]`       |
| `array<int32>`     | `@ArrayField(element: .int32()) var values: [Int32]`     |
| `array<int64>`     | `@ArrayField(element: .int64()) var values: [Int64]`     |
| `array<uint8>`     | `@ArrayField(element: .uint8) var values: [UInt8]`       |
| `array<uint16>`    | `@ArrayField(element: .uint16) var values: [UInt16]`     |
| `array<uint32>`    | `@ArrayField(element: .uint32()) var values: [UInt32]`   |
| `array<uint64>`    | `@ArrayField(element: .uint64()) var values: [UInt64]`   |
| `array<float16>`   | `@ArrayField(element: .float16) var values: [Float16]`   |
| `array<bfloat16>`  | `@ArrayField(element: .bfloat16) var values: [BFloat16]` |
| `array<float32>`   | `@ArrayField(element: .float32) var values: [Float]`     |
| `array<float64>`   | `@ArrayField(element: .float64) var values: [Double]`    |

使用单独元素序列化器的数组仍采用普通的 list 编码。`@ArrayField` 仅用于受支持的密集 bool 或
数值数组。

## 外部目标类型

外部结构化序列化器生成的 xlang STRUCT、ENUM 或 UNION Schema 及值字节，与等效的普通
Swift 模型相同：

```swift
@ForyStruct(target: ThirdParty.Order.self)
struct OrderSerializer {
    var id: Int64
    var amount: Double
}

try fory.register(OrderSerializer.self, id: 100)
```

在字段元数据中使用 `.with(...)`，在根值上使用 `with:`。详见
[外部类型序列化](external-types.md)。

由于结构化序列化器是单独的声明，因此必须显式选择它。如果外部类型有一个有意添加且
`Target == Self` 的追溯遵循，则会改用常规的根值、字段和容器。

Swift 不提供原生序列化模式。一个已知的 `@ForyUnion` case 包含零个或一个关联值。如果一个联合
类型备选项包含多个逻辑字段，请使用结构体载荷。

## Swift IDL 工作流

可直接从 Fory IDL、Proto 或 FBS 输入生成 Swift 模型：

```bash
foryc schema.fdl --swift_out ./Sources/Generated
```

生成的 Swift 代码包括：

- `@ForyStruct`、`@ForyEnum`、`@ForyUnion` 以及字段和 case 元数据
- 带 tag 的联合类型枚举（带关联值的枚举 case）
- 支持传递式安装导入模块的 `ForyModule.install(_:)` 辅助方法
- 生成类型上的 `toBytes` / `fromBytes` 帮助方法

在 xlang 序列化之前，请先安装生成的模块：

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

这会执行 Swift roundtrip 矩阵测试以及 Java 对端 roundtrip 检查（`IDL_PEER_LANG=swift`）。

## 调试 Xlang 测试

运行 xlang 测试时可以开启调试输出：

```bash
ENABLE_FORY_DEBUG_OUTPUT=1 FORY_SWIFT_JAVA_CI=1 mvn -T16 test -Dtest=org.apache.fory.xlang.SwiftXlangTest
```
