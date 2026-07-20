---
title: 自定义序列化器
sidebar_position: 4
id: custom_serializers
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

对于不适合使用 `@ForyObject` 的类型，或需要特殊编码逻辑的场景，可以手动实现 `Serializer`。

## 适用场景

- 外部类型需要严格的编码兼容性
- 需要更紧凑或特殊的编码布局
- 旧载荷迁移路径
- 性能敏感的热点路径

## 实现 `Serializer`

```swift
import Foundation
import Fory

struct UUIDBox: Serializer, Equatable {
    var value: UUID = UUID(uuidString: "00000000-0000-0000-0000-000000000000")!

    static func foryDefault() -> UUIDBox {
        UUIDBox()
    }

    static var staticTypeId: ForyTypeId {
        .ext
    }

    func foryWriteData(_ context: WriteContext, hasGenerics: Bool) throws {
        _ = hasGenerics
        try value.uuidString.foryWriteData(context, hasGenerics: false)
    }

    static func foryReadData(_ context: ReadContext) throws -> UUIDBox {
        let raw = try String.foryReadData(context)
        guard let uuid = UUID(uuidString: raw) else {
            throw ForyError.invalidData("invalid UUID string: \\(raw)")
        }
        return UUIDBox(value: uuid)
    }
}
```

## 注册并使用

```swift
let fory = Fory()
fory.register(UUIDBox.self, id: 300)

let input = UUIDBox(value: UUID())
let data = try fory.serialize(input)
let output: UUIDBox = try fory.deserialize(data)

assert(input == output)
```

## 如何选择 `staticTypeId`

手动实现的自定义类型，需要让 `staticTypeId` 与实际编码形态匹配。

常见选择：

- `.structType`：常规结构化对象
- `.enumType` / `.typedUnion`：枚举或联合类型
- `.ext`：扩展或自定义类型
