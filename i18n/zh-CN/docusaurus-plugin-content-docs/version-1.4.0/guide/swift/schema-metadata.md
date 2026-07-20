---
title: Schema 元数据
sidebar_position: 4
id: schema_metadata
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

本页介绍 Swift 中宏级别的 schema 元数据。

## 可用的宏属性 {#available-macro-attributes}

- 结构体/类模型上的 `@ForyStruct`
- C 风格枚举模型上的 `@ForyEnum`
- 带关联值枚举模型上的 `@ForyUnion` 和 `@ForyCase`
- 数值字段上的 `@ForyField(encoding: ...)`
- 用于集合字段元数据的 `@ListField`、`@ArrayField`、`@SetField` 和 `@MapField`

## `@ForyField(encoding:)` {#foryfieldencoding}

使用 `@ForyField` 覆盖整数编码策略。

```swift
@ForyStruct
struct Metrics: Equatable {
    @ForyField(encoding: .fixed)
    var u32Fixed: UInt32 = 0

    @ForyField(encoding: .tagged)
    var u64Tagged: UInt64 = 0
}
```

### 支持的组合 {#supported-combinations}

| Swift type | 支持的 encoding 值             | 默认 encoding |
| ---------- | ------------------------------ | ------------- |
| `Int32`    | `.varint`, `.fixed`            | `.varint`     |
| `UInt32`   | `.varint`, `.fixed`            | `.varint`     |
| `Int64`    | `.varint`, `.fixed`, `.tagged` | `.varint`     |
| `UInt64`   | `.varint`, `.fixed`, `.tagged` | `.varint`     |
| `Int`      | `.varint`, `.fixed`, `.tagged` | `.varint`     |
| `UInt`     | `.varint`, `.fixed`, `.tagged` | `.varint`     |

编译期校验会拒绝不支持的组合（例如 `Int32` 搭配 `.tagged`）。

## 嵌套集合字段元数据 {#nested-collection-field-metadata}

当集合字段需要类型特定的编码格式元数据时，例如容器内部使用定长或带 tag 的整数编码，请使用 `@ListField`、`@ArrayField`、`@SetField` 和 `@MapField`。密集的非空 bool、整数和浮点数组使用 `@ArrayField`。

```swift
@ForyStruct
struct NestedMetrics: Equatable {
    @ListField(element: .encoding(.fixed))
    var values: [Int32?] = []

    @ArrayField(element: .int32())
    var denseValues: [Int32] = []

    @SetField(element: .encoding(.fixed))
    var ids: Set<UInt32?> = []

    @MapField(key: .encoding(.fixed), value: .encoding(.tagged))
    var byId: [Int32: UInt64] = [:]

    @MapField(value: .list(element: .encoding(.fixed)))
    var groups: [String: [Int32?]] = [:]
}
```

带有定长有符号或无符号整数元数据的非空 `List` 元素，会被分类并编码为匹配的 Fory primitive packed-array 类型。`Set` 字段仍分类为 Fory set，包括定长整数 set。

当 Swift 属性类型是别名，或因其他原因需要完整提示时，请使用 `@ForyField(type:)`：

```swift
typealias MetricsMap = [String: [Int32?]]

@ForyStruct
struct AliasMetrics: Equatable {
    @ForyField(type: .map(
        key: .string,
        value: .list(.int32(nullable: true, encoding: .fixed))
    ))
    var metrics: MetricsMap = [:]
}
```

Union 载荷通过 `@ForyCase(payload:)` 使用同一套 DSL：

```swift
@ForyUnion
enum Event: Equatable {
    @ForyCase(id: 1)
    case created(String)

    @ForyCase(id: 2, payload: .uint64(encoding: .fixed))
    case deleted(UInt64)
}
```

## 模型宏要求 {#model-macro-requirements}

### 结构体和类字段 {#struct-and-class-fields}

- 存储属性必须声明显式类型
- 计算属性会被忽略
- 静态/类属性会被忽略

### 类要求 {#class-requirement}

标注 `@ForyStruct` 的类必须提供 `required init()` 以进行默认构造。

```swift
@ForyStruct
final class Node {
    var value: Int32 = 0
    var next: Node? = nil

    required init() {}
}
```

## 宏类型中的动态 Any 字段 {#dynamic-any-fields-in-macro-types}

Fory 模型宏支持动态字段和嵌套容器：

- `Any`, `AnyObject`, `any Serializer`
- `AnyHashable`
- `[Any]`
- `[String: Any]`
- `[Int32: Any]`
- `[AnyHashable: Any]`

当前限制：

- 仅当 `K` 为 `String`、`Int32` 或 `AnyHashable` 时，才支持 `Dictionary<K, Any>`
