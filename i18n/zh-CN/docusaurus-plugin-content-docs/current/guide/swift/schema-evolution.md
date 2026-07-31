---
title: Schema 演进
sidebar_position: 8
id: schema_evolution
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

Fory 通过兼容模式支持 Schema 演进；Swift 默认启用兼容模式。

在兼容模式下，读取端还允许对部分标量字段类型进行变更，前提是转换无损。当转换后的值
具有相同的逻辑值时，匹配字段可以在 `Bool`、`String`、数值标量和 `Decimal` 之间读取。
例如，`"true"` 和 `"false"` 可以读取为布尔值，`"123"` 可以读取为能够容纳 `123` 的
数值字段，数值和十进制数可以读取为规范字符串，而数值拓宽或缩窄仅在不损失精度且不超出
范围时成功。数值字符串必须使用有限值的 ASCII 十进制语法。无效字符串和有损转换会在
反序列化期间失败。

标量转换也适用于可选字段。存在的可选值按相同规则转换；缺失的可选值则保留 Swift
兼容模式为本地字段提供的正常默认值。启用引用跟踪的标量类型变更不兼容。

## 默认兼容模式

```swift
let fory = Fory()
```

## 示例：结构体演进

```swift
import Fory

@ForyStruct
struct PersonV1 {
    var name: String = ""
    var age: Int32 = 0
    var address: String = ""
}

@ForyStruct
struct PersonV2 {
    var name: String = ""
    var age: Int32 = 0
    var phone: String? = nil // 新增字段
}

let writer = Fory()
try writer.register(PersonV1.self, id: 1)

let reader = Fory()
try reader.register(PersonV2.self, id: 1)

let v1 = PersonV1(name: "alice", age: 30, address: "main st")
let bytes = try writer.serialize(v1)
let v2: PersonV2 = try reader.deserialize(bytes)

assert(v2.name == "alice")
assert(v2.age == 30)
assert(v2.phone == nil)
```

## 外部目标

外部结构化序列化器声明会定义用于兼容性的本地 Schema：

```swift
@ForyStruct(target: ThirdParty.User.self)
struct UserV2Serializer {
    var name: String
    var age: Int32
    var phone: String?
}
```

使用与对端相同的逻辑 ID 或名称注册该序列化器，然后在根值处选择它：

```swift
try reader.register(UserV2Serializer.self, id: 1)
let user = try reader.deserialize(
    bytes,
    with: UserV2Serializer.self
)
```

序列化器声明的名称不会影响编码格式中的 Schema。

## 兼容模式下安全的变更

- 新增字段
- 删除旧字段
- 重排字段顺序
- 在 `Bool`、`String`、数值标量或 `Decimal` 之间更改匹配字段的类型，前提是写入的每个值
  对读取端而言都是无损的

## 不安全的变更

- 任意修改既有字段的类型，包括标量值超出范围、需要舍入、不是有限值，或不符合兼容模式
  数值字符串语法的情况
- 对端之间使用不一致的注册映射

## 相同 Schema 优化

仅当所有读取端和写入端始终使用相同的 Schema，并且需要更快的序列化速度和更小的体积时，
才应设置 `compatible: false`。对于 xlang 载荷，只有在确认所有语言均使用相同的 Schema，
或原生类型由 Fory Schema IDL 生成后，才能设置 `compatible: false`。
