---
title: 配置
sidebar_position: 4
id: configuration
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

本页介绍 Apache Fory™ C# 的 `ForyBuilder` 选项和默认配置值。`Config` 是由 `ForyBuilder` 创建的不可变配置快照。

## 构建 Fory 实例

```csharp
using Apache.Fory;

Fory fory = Fory.Builder().Build();
ThreadSafeFory threadSafe = Fory.Builder().BuildThreadSafe();
```

## 默认配置

`Fory.Builder().Build()` 使用以下配置：

| 选项                              | 默认值      | 说明                                               |
| --------------------------------- | ----------- | -------------------------------------------------- |
| `TrackRef`                        | `false`     | 禁用引用跟踪                                       |
| `Compatible`                      | `true`      | 启用兼容的 Schema 演进元数据                       |
| `CheckStructVersion`              | `false`     | 禁用结构体 Schema 哈希检查                         |
| `MaxDepth`                        | `20`        | 最大动态嵌套深度                                   |
| `MaxGraphMemoryBytes`             | `134217728` | 每次根值读取的近似对象图内存限制                   |
| `MaxUnbackedContainerItems`       | `8192`      | 每次根值读取允许的无输入支撑 collection/map 工作量 |
| `MaxTypeFields`                   | `512`       | 单个已接收结构体元数据主体的最大字段数             |
| `MaxTypeMetaBytes`                | `4096`      | 单个已接收元数据主体的最大编码字节数               |
| `MaxSchemaVersionsPerType`        | `10`        | 单个逻辑类型的最大远程元数据版本数                 |
| `MaxAverageSchemaVersionsPerType` | `3`         | 所有类型的平均远程元数据版本数                     |

## 构建器选项

C# 始终使用兼容 xlang 的帧格式，因此 `ForyBuilder` 不提供模式切换选项。

### `TrackRef(bool enabled = false)`

为共享引用和循环对象图启用引用跟踪。

```csharp
Fory fory = Fory.Builder()
    .TrackRef(true)
    .Build();
```

### `Compatible(bool enabled = false)`

启用 Schema 演进模式。C# 仅使用 xlang 编码格式，因此对于独立部署的通信方，默认启用兼容模式。要使用默认兼容模式，请直接调用 `.Build()`，不要调用此方法。传入 `false`，或不带参数调用 `Compatible()`，会改用相同 Schema 载荷。仅当每个读取端和写入端始终使用相同 Schema，并且希望获得更快序列化和更小体积时，才这样设置。对于跨语言载荷，只有确认每个通信方使用相同 Schema，或原生类型由 Fory Schema IDL 生成时，才调用 `Compatible(false)`。

```csharp
Fory fory = Fory.Builder()
    .Compatible(false)
    .Build();
```

### `CheckStructVersion(bool enabled = false)`

有意使用相同 Schema 载荷时，检查 Schema 哈希。

```csharp
Fory fory = Fory.Builder()
    .Compatible(false)
    .CheckStructVersion(true)
    .Build();
```

### `MaxDepth(int value)`

设置动态对象图的最大嵌套深度。

```csharp
Fory fory = Fory.Builder()
    .MaxDepth(32)
    .Build();
```

`value` 必须大于 `0`。

### `MaxGraphMemoryBytes(long value)`

设置单次根值反序列化的近似对象图内存限制。该估算主要覆盖物化的 collection、map、array、struct 和 object。它会跳过 string、binary data、primitive scalar 和 dense primitive array 等叶子值，因此实际进程内存可能高于此值。

```csharp
Fory fory = Fory.Builder()
    .MaxGraphMemoryBytes(64L * 1024 * 1024)
    .Build();
```

所有根输入形式的默认限制固定为 `128 MiB`。正值会覆盖默认值。创建 Fory 实例时会拒绝显式的非正值。被排除在对象图内存估算之外的叶子值仍受剩余输入字节限制：如果未读输入不包含足够字节，Fory 不会读取或创建该叶子值。

### `MaxUnbackedContainerItems(long value)`

限制一次根值反序列化中，重复读取主体不按比例消费输入的 collection 元素和 map 条目。默认值为 `8192`；零表示严格限制。

```csharp
Fory fory = Fory.Builder()
    .MaxUnbackedContainerItems(8192)
    .Build();
```

### `MaxTypeFields(int value)`

设置单个已接收远程结构体元数据主体允许的最大字段数。

```csharp
Fory fory = Fory.Builder()
    .MaxTypeFields(512)
    .Build();
```

### `MaxTypeMetaBytes(int value)`

设置单个已接收 TypeMeta 主体允许的最大编码主体字节数，不包括 8 字节头部和任何扩展大小 varint。

```csharp
Fory fory = Fory.Builder()
    .MaxTypeMetaBytes(4096)
    .Build();
```

### `MaxSchemaVersionsPerType(int value)`

设置单个逻辑类型允许的最大远程元数据版本数。

```csharp
Fory fory = Fory.Builder()
    .MaxSchemaVersionsPerType(10)
    .Build();
```

### `MaxAverageSchemaVersionsPerType(int value)`

设置所有已接受远程类型允许的平均远程元数据版本数。有效的全局下限为 `8192` 个 Schema。

```csharp
Fory fory = Fory.Builder()
    .MaxAverageSchemaVersionsPerType(3)
    .Build();
```

## 常用配置

### 兼容模式服务

```csharp
Fory fory = Fory.Builder()
    .TrackRef(true)
    .Build();
```

### 相同 Schema 优化

仅当每个读取端和写入端始终使用相同 Schema 时才使用此配置。

```csharp
Fory fory = Fory.Builder()
    .Compatible(false)
    .Build();
```

### 线程安全服务实例

```csharp
ThreadSafeFory fory = Fory.Builder()
    .TrackRef(true)
    .BuildThreadSafe();
```

## 安全

有关信任边界、安全的读取端配置和验证方法，请参阅 [C# 安全](security.md)。

## 相关主题

- [基本序列化](basic-serialization.md)
- [Schema 演进](schema-evolution.md)
- [线程安全](thread-safety.md)
