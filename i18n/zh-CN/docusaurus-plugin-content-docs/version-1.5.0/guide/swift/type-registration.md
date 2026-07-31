---
title: 类型注册
sidebar_position: 5
id: type_registration
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

本页介绍用户定义类型的注册 API。

## 为什么必须注册

在序列化或反序列化前，请先注册用户定义的结构体、类、枚举、联合类型和外部目标。

如果缺少注册，反序列化会失败，并抛出：

- `Type not registered: ...`

## 按数值 ID 注册

请为序列化端和反序列化端使用同一个稳定 ID。

```swift
@ForyStruct
struct User {
    var name: String = ""
    var age: Int32 = 0
}

let fory = Fory()
try fory.register(User.self, id: 1)
```

对于外部结构化序列化器，请注册单独的序列化器声明：

```swift
@ForyStruct(target: ThirdParty.User.self)
struct UserSerializer {
    var name: String
    var age: UInt32
}

try fory.register(UserSerializer.self, id: 1)
```

如果应用有意为外部类型添加一个 `Target == Self` 的 `Serializer` 追溯遵循，请注册外部
类型本身：

```swift
try fory.register(UUID.self, id: 2)
```

注册单独定义的序列化器后，请在每个需要它的根值、字段或容器子项上显式选择它。

## 按名称注册

### 使用全限定名

```swift
try fory.register(User.self, name: "com.example.User")
```

`name` 会按最后一个 `.` 拆分：

- namespace: `com.example`
- type name: `User`

`User` 这样的简单名称使用空 namespace。空名称和以 `.` 结尾的名称无效。

## 一致性规则

在不同对端之间保持注册映射一致：

- ID 模式：同一个逻辑类型在所有对端都使用相同数值 ID
- 名称模式：同一个逻辑类型在所有对端都使用相同 namespace 和 type name
- 不要对同一逻辑类型在不同服务里混用 ID 映射和名称映射
- 一个 `Fory` 实例只能为每个目标类型注册一个序列化器

第一次根值序列化或反序列化后，注册操作将关闭。请在第一次根值操作前完成所有注册。

## 动态类型与注册

序列化 `Any`、`AnyObject` 或应用协议值时，请通过对应的常规序列化器、外部结构化序列化器
或自定义序列化器注册每个具体目标。`Any` 和 `AnyObject` 使用直接根值 API；应用协议则
显式选择 `DynamicSerializer<T>`。
