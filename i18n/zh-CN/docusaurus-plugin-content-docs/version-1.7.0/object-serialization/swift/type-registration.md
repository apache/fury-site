---
title: 类型注册
sidebar_position: 5
id: type-registration
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

## 为什么需要注册

在序列化或反序列化前注册用户定义的 struct、class、enum、union 和外部目标。

如果类型未注册，反序列化会失败并报告：

- `Type not registered: ...`

## 按数字 ID 注册

使用序列化端和反序列化端共同约定的稳定 ID。

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

如果应用有意让外部类型追溯遵循一个 `Serializer`，且 `Target == Self`，请注册目标类型本身：

```swift
try fory.register(UUID.self, id: 2)
```

注册单独序列化器后，在每个需要它的根值、字段或载体子项处显式选择。

## 按名称注册

### 完全限定名称

```swift
try fory.register(User.self, name: "com.example.User")
```

`name` 按最后一个 `.` 分割：

- 命名空间：`com.example`
- 类型名称：`User`

`User` 等简单名称使用空命名空间。空名称以及以 `.` 结尾的名称无效。

## 一致性规则

在所有对等端保持注册映射一致：

- ID 模式：同一类型在所有对等端使用相同数字 ID
- 名称模式：同一类型在所有对等端使用相同命名空间和类型名称
- 不要让同一逻辑类型在不同服务中混用 ID 映射和名称映射
- 在一个 `Fory` 实例上，每个目标类型只注册一个序列化器

首次根序列化或反序列化后，注册将永久关闭。请在首次根操作前完成所有注册。

## 动态类型和注册

序列化 `Any`、`AnyObject` 或应用 protocol 值时，请通过普通序列化器、外部结构化序列化器
或自定义序列化器注册每个具体目标。`Any` 和 `AnyObject` 使用直接根值 API；应用 protocol
显式选择 `DynamicSerializer<T>`。
