---
title: 故障排查
sidebar_position: 11
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

本页介绍 Swift 中常见的问题及调试方法。

## 常见运行时错误

### `Type not registered: ...`

原因：当前 `Fory` 实例没有注册所选的用户序列化器。

修复方式：

```swift
try fory.register(MyType.self, id: 100)
```

对于外部目标类型，请注册其序列化器：

```swift
try fory.register(UserSerializer.self, id: 100)
```

### `Type mismatch: expected ..., got ...`

原因：对端之间的注册映射或字段类型信息不一致。

修复方式：

- 确保两端使用相同的 type ID 或名称映射
- 检查字段类型是否兼容

### `Invalid data: xlang bitmap mismatch`

原因：输入由未写入 Swift 所期望的 xlang 编码格式的对端生成。

修复方式：将对端序列化器配置为写入 xlang 格式。Swift 始终使用 xlang 格式，不提供原生模式开关。

### `Invalid data: class version hash mismatch`

原因：在 `compatible: false` 时发生了 Schema 变更。

修复方式：

- 对于持续演进的 Schema，保持启用兼容模式
- 或者，仅当每个读端和写端都使用相同 Schema 时才使用 `compatible: false`

## 常见宏阶段错误

### `@ForyStruct requires explicit types for stored properties`

为所有存储属性补充显式类型声明。

### `Fory enum associated values cannot have default values`

移除枚举关联值上的默认值。

### 所选序列化器的目标与字段类型不匹配

通过 `with` 选择的序列化器，其目标必须与该字段节点完全匹配。对于可选字段或集合字段，请选择
与之匹配的容器序列化器：

```swift
@ForyField(with: OptionalSerializer<UserSerializer>.self)
var user: ThirdParty.User?
```

### 外部目标类型构造错误

外部结构体需要提供可读且匹配的属性，以及可访问的匹配初始化器。外部类需要提供可访问的无参数
初始化器，以及可写且匹配的属性。

如果目标类型未提供上述构造接口，请使用[自定义序列化器](custom-serializers.md)。

### 联合类型 case 包含多个关联值

Swift 使用 xlang 联合类型格式，其中已知 case 只能包含零个或一个值。如果一个备选项包含多个逻辑
字段，请将这些字段放入显式的 `@ForyStruct` 载荷中。

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
