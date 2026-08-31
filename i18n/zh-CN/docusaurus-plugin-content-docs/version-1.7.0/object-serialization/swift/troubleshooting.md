---
title: 故障排查
sidebar_position: 90
id: troubleshooting
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

本页介绍常见 Swift 问题及其调试方法。

## 常见运行时错误

### `Type not registered: ...`

原因：所选用户序列化器尚未注册到当前 `Fory` 实例。

修复方法：

```swift
try fory.register(MyType.self, id: 100)
```

对于外部目标，请注册对应序列化器：

```swift
try fory.register(UserSerializer.self, id: 100)
```

### `Type mismatch: expected ..., got ...`

原因：对等端之间的注册映射或字段类型信息不一致。

修复方法：

- 确保双方注册相同的类型 ID/名称映射
- 验证字段类型兼容性

### `Invalid data: xlang bitmap mismatch`

原因：输入由未写入 Swift 所期望 xlang 编码格式的对等端生成。

修复方法：配置对等端序列化器写入 xlang 格式。Swift 已使用 xlang 格式，没有原生模式开关。

### `Invalid data: class version hash mismatch`

原因：在 `compatible: false` 时更改了 Schema。

修复方法：

- 对演进的 Schema 保持启用兼容模式。
- 或者，只有每个读取端和写入端使用相同 Schema 时才使用 `compatible: false`。

## 常见宏展开时错误

### `@ForyStruct requires explicit types for stored properties`

为存储属性添加显式类型注解。

### `Fory enum associated values cannot have default values`

移除 enum case 关联值的默认值。

### 所选序列化器目标与字段类型不匹配

由 `with` 选择的序列化器必须以确切字段节点为目标。对于 optional 或集合字段，请选择匹配的
载体：

```swift
@ForyField(with: OptionalSerializer<UserSerializer>.self)
var user: ThirdParty.User?
```

### 外部目标构造错误

外部 struct 需要可读取的匹配属性和可访问的匹配初始化器。外部 class 需要可访问的无参
初始化器和可写的匹配属性。

如果目标未公开这样的构造接口，请使用[自定义序列化器](custom-serializers.md)。

### Union case 包含多个关联值

Swift 使用 xlang union 格式，其中已知 case 包含零个或一个值。请将多个逻辑字段移入显式
`@ForyStruct` 载荷。

## 调试命令

运行 Swift 测试：

```bash
cd swift
ENABLE_FORY_DEBUG_OUTPUT=1 swift test
```

运行由 Java 驱动的 Swift xlang 测试：

```bash
cd java/fory-core
ENABLE_FORY_DEBUG_OUTPUT=1 FORY_SWIFT_JAVA_CI=1 mvn -T16 test -Dtest=org.apache.fory.xlang.SwiftXlangTest
```
