---
title: Xlang 序列化
sidebar_position: 2
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

Fory Swift 可以通过 xlang 协议与其他 Fory 运行时交换载荷。

## 推荐的跨语言配置

```swift
let fory = Fory(xlang: true, trackRef: false, compatible: true)
```

## 用共享身份注册类型

### 基于 ID 的注册

```swift
@ForyObject
struct Order {
    var id: Int64 = 0
    var amount: Double = 0
}

let fory = Fory(xlang: true, compatible: true)
fory.register(Order.self, id: 100)
```

### 基于名称的注册

```swift
try fory.register(Order.self, namespace: "com.example", name: "Order")
```

## 跨语言规则

- 在不同语言之间保持一致的类型注册映射
- 对独立演进的 Schema 使用兼容模式
- 对动态字段 `Any` 和 `any Serializer` 中涉及的用户定义具体类型，也要完成注册

## Swift IDL 工作流

可直接从 Fory IDL / Proto / FBS 输入生成 Swift 模型：

```bash
foryc schema.fdl --swift_out ./Sources/Generated
```

生成的 Swift 代码包括：

- 带 `@ForyObject` 与 `@ForyField(id: ...)` 元数据的模型
- tagged union 枚举
- 支持传递式导入注册的 `ForyRegistration.register(_:)` 辅助方法
- 生成类型上的 `toBytes` / `fromBytes` 帮助方法

在xlang 序列化之前，先调用生成的注册逻辑：

```swift
let fory = Fory(xlang: true, trackRef: true, compatible: true)
try Addressbook.ForyRegistration.register(fory)

let payload = try fory.serialize(book)
let decoded: Addressbook.AddressBook = try fory.deserialize(payload)
```

### 运行 Swift IDL 集成测试

```bash
cd integration_tests/idl_tests
./run_swift_tests.sh
```

这会执行 Swift 端 roundtrip 矩阵测试，以及与 Java 对端的 roundtrip 校验，使用 `IDL_PEER_LANG=swift`。

## 调试跨语言测试

运行 xlang 测试时可以开启调试输出：

```bash
ENABLE_FORY_DEBUG_OUTPUT=1 FORY_SWIFT_JAVA_CI=1 mvn -T16 test -Dtest=org.apache.fory.xlang.SwiftXlangTest
```
