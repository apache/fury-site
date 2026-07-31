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

## `[ForyStruct]` 和 `[ForyField]` {#forystruct-and-foryfield}

使用 `[ForyStruct]` 启用源码生成的序列化器。使用 `[ForyField]` 分配一个可选、稳定、非负的字段 ID，或覆盖字段使用的 Fory schema 类型。

外部类型序列化会在本地抽象序列化器声明上设置 `Target`。声明中的属性定义字段名称、
ID、Schema 描述符和可空性。独立声明还定义自身的 `Evolving` 设置。外部 `BaseOnly`
声明不能设置 `Evolving`；该设置由每个具体派生类自行定义。目标类型提供运行时值和
直接访问的成员。

```csharp
[ForyStruct(Target = typeof(ThirdParty.User))]
internal abstract class UserSerializer
{
    [ForyField(
        1,
        TargetDeclaringType = typeof(ThirdParty.User),
        TargetMemberName = "<Name>k__BackingField")]
    public abstract string Name { get; }
}
```

## 继承字段

具体 class 的序列化器只有一个字段列表，其中包含自身字段以及每个带注解基类所选取的
字段。同一个扁平化列表决定字段顺序、Schema hash 和兼容元数据。

属性 override 只形成一个逻辑字段。距离派生类最近且带有 `[ForyField]` 的 override
提供 ID 和 Schema 描述符。通过 `new` 隐藏的字段和成员仍然彼此独立，必须使用唯一 ID
或唯一的规范化名称。ID 重复和基于名称的标识重复都会产生代码生成错误。

更改带注解基类上的编码成员会更改每个派生类的 Schema。更新基类包后，需要重新构建
包含派生类序列化器的程序集。

```csharp
using Apache.Fory;
using S = Apache.Fory.Schema.Types;

[ForyStruct]
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

[ForyStruct]
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

## `[ForyUnion]` 和 `[ForyCase]`

生成的 union case 使用 `[ForyCase]` 同时声明稳定的 case ID 和可选的 case 载荷
Schema 类型。不要在 union case 载荷成员上添加 `[ForyField]`。已知 case 的 record
名称使用 PascalCase 形式的 FDL case 名称；需要避免名称冲突时，载荷类型使用限定引用。
强类型 union 必须声明至少一个非 `Unknown` case；`Unknown(UnknownCase)` 只是由 Fory
提供的向前兼容载体。该标记只选择载体，不会在 Schema case 表中增加条目。

```csharp
using Apache.Fory;
using S = Apache.Fory.Schema.Types;

[ForyUnion]
public abstract partial record Shape
{
    private Shape() {}

    [ForyUnknownCase]
    public sealed partial record Unknown(UnknownCase Value) : Shape;

    [ForyCase(0)]
    public sealed partial record Circle(global::example.Circle Value) : Shape;

    [ForyCase(1, Type = typeof(S.Fixed<S.Int32>))]
    public sealed partial record Code(int Value) : Shape;
}
```

## 可空性和引用跟踪 {#nullability-and-reference-tracking}

- 字段可空性来自 C# 类型可空性（`string?`、可空值类型等）。
- 引用跟踪由运行时的 `ForyBuilder.TrackRef(...)` 控制。

## 相关主题 {#related-topics}

- [配置](configuration.md)
- [外部类型](external-types.md)
- [Schema 演进](schema-evolution.md)
- [支持的类型](supported-types.md)
