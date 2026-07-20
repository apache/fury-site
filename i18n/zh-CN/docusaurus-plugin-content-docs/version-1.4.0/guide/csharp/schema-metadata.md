---
title: Schema 元数据
sidebar_position: 4
id: schema_metadata
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

本页介绍 C# 生成序列化器的字段级序列化器配置。

## `[ForyObject]` 和 `[ForyField]` {#foryobject-and-foryfield}

使用 `[ForyObject]` 启用源码生成的序列化器。使用 `[ForyField]` 分配一个可选、稳定、非负的字段 ID，或覆盖字段使用的 Fory schema 类型。

```csharp
using Apache.Fory;
using S = Apache.Fory.Schema.Types;

[ForyObject]
public sealed class Metrics
{
    [ForyField(Type = typeof(S.UInt32))]
    public uint Count { get; set; }

    [ForyField(Type = typeof(S.Tagged<S.UInt64>))]
    public ulong TraceId { get; set; }

    public long LatencyMicros { get; set; }
}
```

`Id` 是可选的。省略时，兼容模式仍会按名称匹配字段。

```csharp
using Apache.Fory;
using S = Apache.Fory.Schema.Types;

[ForyObject]
public sealed class NestedMetrics
{
    [ForyField(Type = typeof(S.Map<S.Fixed<S.UInt32>, S.List<S.Tagged<S.UInt64>>>))]
    public Dictionary<uint, List<ulong?>?> Values { get; set; } = [];

    [ForyField(3, Type = typeof(S.UInt64))]
    public ulong StableCount { get; set; }
}
```

## Schema 描述符类型 {#schema-descriptor-types}

Schema 描述符位于 `Apache.Fory.Schema.Types` 下，并且只作为元数据使用。它们不会取代普通的 C# 承载类型。

常见标量描述符包括：

- `S.Int32`, `S.UInt32`
- `S.Int64`, `S.UInt64`
- `S.Float16`, `S.BFloat16`, `S.Float32`, `S.Float64`

容器描述符可以组合：

- `S.Fixed<TScalar>` 和 `S.Tagged<TScalar>`，用于标量整数编码
- `S.List<TElement>`
- `S.Set<TElement>`
- `S.Map<TKey, TValue>`
- `S.Array<TElement>`

密集数组字段使用 `S.Array<TElement>`，例如 `S.Array<S.Int32>` 或 `S.Array<S.BFloat16>`。

可空性来自 C# 承载类型。列表元素可空时使用 `List<ulong?>`，map 需要可空键时使用 `NullableKeyDictionary<TKey, TValue>`。

## 可空性和引用跟踪 {#nullability-and-reference-tracking}

- 字段可空性来自 C# 类型可空性（`string?`、可空值类型等）。
- 引用跟踪由运行时的 `ForyBuilder.TrackRef(...)` 控制。

## 相关主题 {#related-topics}

- [配置](configuration.md)
- [Schema 演进](schema-evolution.md)
- [支持的类型](supported-types.md)
