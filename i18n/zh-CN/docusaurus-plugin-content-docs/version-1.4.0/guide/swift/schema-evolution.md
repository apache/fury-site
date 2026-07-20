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

Fory 通过兼容模式支持 Schema 演进。

## 启用兼容模式

```swift
let fory = Fory(xlang: true, trackRef: false, compatible: true)
```

## 示例：结构体演进

```swift
import Fory

@ForyObject
struct PersonV1 {
    var name: String = ""
    var age: Int32 = 0
    var address: String = ""
}

@ForyObject
struct PersonV2 {
    var name: String = ""
    var age: Int32 = 0
    var phone: String? = nil // 新增字段
}

let writer = Fory(xlang: true, compatible: true)
writer.register(PersonV1.self, id: 1)

let reader = Fory(xlang: true, compatible: true)
reader.register(PersonV2.self, id: 1)

let v1 = PersonV1(name: "alice", age: 30, address: "main st")
let bytes = try writer.serialize(v1)
let v2: PersonV2 = try reader.deserialize(bytes)

assert(v2.name == "alice")
assert(v2.age == 30)
assert(v2.phone == nil)
```

## 兼容模式下安全的变更

- 新增字段
- 删除旧字段
- 重排字段顺序

## 不安全的变更

- 任意修改既有字段的类型，例如从 `Int32` 改成 `String`
- 对端之间使用不一致的注册映射

## Schema 一致模式的行为

当 `compatible=false` 时，Fory 会校验 schema hash，并在不匹配时快速失败。
