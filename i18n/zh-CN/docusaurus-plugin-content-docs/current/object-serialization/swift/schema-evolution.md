---
title: Schema 演进
sidebar_position: 6
id: schema-evolution
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

Fory 通过兼容模式支持 Schema 演进；Swift 默认启用该模式。

当转换无损时，兼容读取端也允许部分标量字段类型变化。如果转换后的值具有相同逻辑值，
匹配字段可以在 `Bool`、`String`、数值标量和 `Decimal` 之间读取。例如，`"true"` 和
`"false"` 可以读取为布尔值，`"123"` 可以读取为能够容纳 `123` 的数值字段，数值和 decimal
可以读取为规范字符串；数值扩宽或收窄仅在不损失精度或范围时成功。数值字符串使用有限的
ASCII 十进制语法。无效字符串和有损转换会在反序列化期间失败。

标量转换也可以与 optional 字段组合。存在的 optional 值按相同规则转换；缺失的 optional
值为本地字段保留 Swift 正常的兼容模式默认值。启用引用跟踪的标量类型变化不兼容。

## 默认兼容模式

```swift
let fory = Fory()
```

## 示例：演进 Struct

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
    var phone: String? = nil // added field
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

外部结构化序列化器声明定义兼容性所使用的本地 Schema：

```swift
@ForyStruct(target: ThirdParty.User.self)
struct UserV2Serializer {
    var name: String
    var age: Int32
    var phone: String?
}
```

使用对等端采用的相同逻辑 ID 或名称注册序列化器，然后在根值处选择它：

```swift
try reader.register(UserV2Serializer.self, id: 1)
let user = try reader.deserialize(
    bytes,
    with: UserV2Serializer.self
)
```

序列化器声明名称不会影响编码格式 Schema。

## 兼容模式下的安全变更

- 添加新字段
- 移除旧字段
- 重新排列字段
- 如果写入的每个值对读取端都无损，可在 `Bool`、`String`、数值标量或 `Decimal` 之间更改
  匹配的标量字段

## 不安全的变更

- 任意更改现有字段的类型，包括超出范围、经过舍入、非有限值或不被兼容数值字符串语法接受
  的标量值
- 对等端之间的注册映射不一致

## 相同 Schema 优化

只有每个读取端和写入端始终使用相同 Schema，且希望获得更快的序列化速度和更小的体积时，
才设置 `compatible: false`。对于 xlang 载荷，只有确认每种语言使用相同 Schema，或原生类型
由 Fory Schema IDL 生成后，才设置 `compatible: false`。
