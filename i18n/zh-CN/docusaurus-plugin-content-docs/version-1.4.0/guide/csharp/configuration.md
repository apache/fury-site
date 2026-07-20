---
title: 配置
sidebar_position: 2
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

本页介绍 Apache Fory™ C# 的 `ForyBuilder` 选项和默认配置值。
`Config` 是由 `ForyBuilder` 创建的不可变运行时快照。

## 构建运行时

```csharp
using Apache.Fory;

Fory fory = Fory.Builder().Build();
ThreadSafeFory threadSafe = Fory.Builder().BuildThreadSafe();
```

## 默认配置

`Fory.Builder().Build()` 使用以下默认值：

| 选项                              | 默认值      | 说明                                           |
| --------------------------------- | ----------- | ---------------------------------------------- |
| `TrackRef`                        | `false`     | 默认关闭引用跟踪                               |
| `Compatible`                      | `true`      | 默认启用兼容的 Schema 演进元数据               |
| `CheckStructVersion`              | `false`     | 默认关闭结构体 schema hash 校验                |
| `MaxDepth`                        | `20`        | 动态对象图的最大嵌套深度                       |
| `MaxGraphMemoryBytes`             | `134217728` | 每次读取根对象时的近似对象图内存限制           |
| `MaxTypeFields`                   | `512`       | 一个收到的 struct metadata body 最大字段数     |
| `MaxTypeMetaBytes`                | `4096`      | 一个收到的 metadata body 最大编码字节数        |
| `MaxSchemaVersionsPerType`        | `10`        | 一个逻辑类型最大远端 metadata 版本数            |
| `MaxAverageSchemaVersionsPerType` | `3`         | 所有远端类型的平均 metadata 版本数              |

## 构建器选项

C# 始终使用与 xlang 兼容的帧头，因此 `ForyBuilder` 不提供单独的 `Xlang(...)` 开关。

### `TrackRef(bool enabled = false)`

为共享对象图和循环对象图启用引用跟踪。

```csharp
Fory fory = Fory.Builder()
    .TrackRef(true)
    .Build();
```

### `Compatible(bool enabled = false)`

启用 Schema 演进模式。C# 仅使用 xlang 编码格式，因此默认启用兼容模式，以支持独立部署的通信端。默认情况下直接调用 `.Build()` 即可，不需要调用此方法。传入 `false`，或不带参数调用 `Compatible()`，会改用同 Schema 载荷；只有每个读写端始终使用相同 Schema，并且需要更快的序列化速度和更小的体积时，才这样设置。对于跨语言载荷，只有确认每个通信端都使用相同 Schema，或 native 类型由 Fory schema IDL 生成后，才调用 `Compatible(false)`。

```csharp
Fory fory = Fory.Builder()
    .Compatible(false)
    .Build();
```

### `CheckStructVersion(bool enabled = false)`

在有意使用同 Schema 载荷时校验 schema hash。

```csharp
Fory fory = Fory.Builder()
    .Compatible(false)
    .CheckStructVersion(true)
    .Build();
```

### `MaxDepth(int value)`

设置动态对象图允许的最大嵌套深度。

```csharp
Fory fory = Fory.Builder()
    .MaxDepth(32)
    .Build();
```

`value` 必须大于 `0`。

### `MaxGraphMemoryBytes(long value)`

为单次根对象反序列化设置近似的对象图内存限制。该估算主要涵盖实例化后的 collection、map、array、struct 和 object。string、binary、基础标量和基础类型稠密数组等叶子值不计入其中，因此实际进程内存可能高于该值。

```csharp
Fory fory = Fory.Builder()
    .MaxGraphMemoryBytes(64L * 1024 * 1024)
    .Build();
```

所有根输入形式的默认限制均固定为 `128 MiB`。正数值会覆盖默认值；显式传入非正数时，运行时创建会失败。不计入对象图内存限制的叶子值仍受剩余输入字节数约束：如果未读取的输入没有足够字节，Fory 就不会读取或创建该叶子值。

### `MaxTypeFields(int value)`

设置一个收到的远端 struct metadata body 中可接受的最大字段数。

```csharp
Fory fory = Fory.Builder()
    .MaxTypeFields(512)
    .Build();
```

### `MaxTypeMetaBytes(int value)`

设置一个收到的 TypeMeta body 可接受的最大编码 body 字节数，不包含 8 字节 header 和扩展 size varint。

```csharp
Fory fory = Fory.Builder()
    .MaxTypeMetaBytes(4096)
    .Build();
```

### `MaxSchemaVersionsPerType(int value)`

设置一个逻辑类型可接受的最大远端 metadata 版本数。

```csharp
Fory fory = Fory.Builder()
    .MaxSchemaVersionsPerType(10)
    .Build();
```

### `MaxAverageSchemaVersionsPerType(int value)`

设置所有已接受远端类型的平均 metadata 版本数限制。有效全局下限为 `8192` 个 schema。

```csharp
Fory fory = Fory.Builder()
    .MaxAverageSchemaVersionsPerType(3)
    .Build();
```

## 常见配置

### 兼容服务

```csharp
Fory fory = Fory.Builder()
    .TrackRef(true)
    .Build();
```

### 同 Schema 优化

只有每个读写端始终使用相同 Schema 时才使用此配置。

```csharp
Fory fory = Fory.Builder()
    .Compatible(false)
    .Build();
```

### 线程安全的服务实例

```csharp
ThreadSafeFory fory = Fory.Builder()
    .TrackRef(true)
    .BuildThreadSafe();
```

## 安全

安全相关配置：

- 在反序列化不可信 payload 前，只注册预期的类型。
- 对 intentional same-schema payload，将 `CheckStructVersion(true)` 与 `Compatible(false)` 配合使用。
- 设置 `MaxDepth(...)` 以拒绝异常深的动态对象图。
- 使用 `MaxGraphMemoryBytes(...)` 近似限制 collection、map、array、struct 和 object 较多的载荷。它不是精确的堆内存上限；叶子值由剩余输入字节数约束。
- 除非数据不是恶意输入，且可信 peer 会发送更大的 metadata 或大量 schema 版本，否则保持远端 schema metadata 限制的默认值。
- 对不可信输入，优先使用生成或已注册的具体 model，避免宽泛的动态字段。

## 相关主题

- [基础序列化](basic_serialization)
- [Schema 演进](schema_evolution)
- [线程安全](thread_safety)
