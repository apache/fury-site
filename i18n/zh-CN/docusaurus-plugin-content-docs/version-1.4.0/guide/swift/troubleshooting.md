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

原因：当前 `Fory` 实例没有注册用户类型。

修复方式：

```swift
fory.register(MyType.self, id: 100)
```

### `Type mismatch: expected ..., got ...`

原因：对端之间的注册映射或字段类型信息不一致。

修复方式：

- 确保两端使用相同的 type ID 或名称映射
- 检查字段类型是否兼容

### `Invalid data: xlang bitmap mismatch`

原因：序列化端和反序列化端使用了不同的 `xlang` 配置。

修复方式：确保双方使用相同的 `xlang` 模式。

### `Invalid data: class version hash mismatch`

原因：在 `compatible=false` 下发生了 schema 变更。

修复方式：

- 为需要演进的 schema 启用兼容模式
- 或保持严格的 schema 一致性

## 常见宏阶段错误

### `@ForyObject requires explicit types for stored properties`

为所有存储属性补充显式类型声明。

### `@ForyObject enum associated values cannot have default values`

移除枚举关联值上的默认值。

### `Set<...> with Any elements is not supported by @ForyObject yet`

改用 `[Any]` 或明确元素类型的集合。

### `Dictionary<..., ...> with Any values is only supported for String, Int32, or AnyHashable keys`

把 key 类型改为 `String`、`Int32` 或 `AnyHashable`，或者避免在 map value 中使用动态 `Any`。

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
