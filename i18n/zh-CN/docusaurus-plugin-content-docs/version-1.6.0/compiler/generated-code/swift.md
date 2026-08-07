---
title: Swift
sidebar_position: 9
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

## 输出布局

Swift 输出为每个 Schema 生成一个 `.swift` 文件，例如：

- `<swift_out>/addressbook/addressbook.swift`

## 类型生成

生成器使用拆分模型宏和稳定字段/case ID 创建 Swift 模型。类型化联合必须包含
`@ForyUnknownCase case unknown(UnknownCase)` 和至少一个非 `unknown` case；
`unknown(UnknownCase)` 只是 Fory 提供的向前兼容载体。该标记只选择载体，不会向 Schema
case 表添加条目。

当包/命名空间非空时，命名空间形状由 `swift_namespace_style` 控制：

- `enum`（默认）：嵌套枚举命名空间包装器。
- `flatten`：顶层类型名称使用从包派生的前缀（例如 `Demo_Foo_User`）。

当包/命名空间为空时，不应用枚举包装器或扁平化前缀。

对于使用默认 `enum` 风格的非空包：

```swift
public enum Addressbook {
    @ForyUnion
    public enum Animal {
        @ForyUnknownCase
        case unknown(UnknownCase)
        @ForyCase(id: 0)
        case dog(Addressbook.Dog)
        @ForyCase(id: 1)
        case cat(Addressbook.Cat)
    }

    @ForyStruct
    public struct Person: Equatable {
        @ForyField(id: 1)
        public var name: String = ""
        @ForyField(id: 8)
        public var pet: Addressbook.Animal =
            Addressbook.Animal.dog(Addressbook.Dog())
    }
}
```

对于使用 `flatten` 风格的非空包：

```swift
@ForyStruct
public struct Addressbook_Person: Equatable { ... }
```

两者都设置时，CLI flag `--swift_namespace_style` 会覆盖 Schema 选项 `swift_namespace_style`。

联合生成为带关联载荷值的 tagged Swift 枚举。递归联合生成为 `indirect` 枚举。第一个已知
联合 case 必须具有有限、可递归构造的默认值；编译器会拒绝第一个 case 的默认值环，而
不是生成不会终止的初始化器。带 `ref`/`weak_ref` 字段的消息生成为 `final class` 模型，
以保留引用语义。直接存储的消息环必须将至少一条环边标记为 `ref`；否则编译器会拒绝
Schema，因为 Swift 值类型无法表示这种结构。list/map 字段中的固定或 tagged 整数编码
生成为 Swift 字段类型提示，例如 `@ListField(element: .encoding(.fixed))` 或
`@MapField(value: .encoding(.tagged))`。对于非空固定宽度整数 list 元素，Swift 将字段
分类为对应的 Fory 基本类型 packed-array 类型；固定宽度整数 set 仍为 Fory set。

## 模块安装

每个 Schema 都包含一个具有传递导入安装能力的 `ForyModule` 所有者：

```swift
public enum ForyModule {
    public static func install(_ fory: Fory) throws {
        try ComplexPb.ForyModule.install(fory)
        try fory.register(Addressbook.Person.self, id: 100)
        try fory.register(Addressbook.Animal.self, id: 106)
    }
}
```

对于非空包和 `flatten` 风格，辅助类型也会添加前缀（例如 `Addressbook_ForyModule`）。

对于没有显式 `[id=...]` 的 Schema，安装代码使用计算得到的数字 ID。如果设置了
`option enable_auto_type_id = false;`，生成的代码使用基于名称的注册 API。
