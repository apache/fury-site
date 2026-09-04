---
title: Schema 元数据
sidebar_position: 7
id: schema-metadata
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

本页介绍 C# 生成序列化器的 Schema 元数据。

## `[ForyStruct]` 和 `[ForyField]`

使用 `[ForyStruct]` 启用源码生成的序列化器。使用 `[ForyField]` 可分配可选的稳定字段 ID，或覆盖字段使用的 Fory Schema 类型。配置的 ID 必须在完整结构体 Schema 内唯一，并满足 `0 <= id < 2^29`（`0` 至 `536870911`）。

外部类型序列化在本地抽象序列化器声明上设置 `Target`。该声明的属性定义字段名称、ID、Schema 描述符和可空性。独立声明还定义其 `Evolving` 设置。外部 `BaseOnly` 声明不能设置 `Evolving`；该设置由每个具体派生类型负责。目标提供目标类型的值和直接访问的成员。

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

具体类序列化器只有一个字段列表，其中包含自身字段以及每个带注解基类中选择的字段。同一个扁平列表决定字段顺序、Schema 哈希和兼容元数据。

属性重写只产生一个逻辑字段。最近的、带有 `[ForyField]` 的重写提供 ID 和 Schema 描述符。使用 `new` 隐藏的字段和成员仍彼此独立，必须使用唯一 ID 或唯一的规范化名称。重复 ID 和重复的名称标识会导致生成错误。

修改带注解基类的编码成员会改变每个派生 Schema。更新基类包后，请重新构建包含派生序列化器的程序集。

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

`Id` 是可选的。省略时，兼容模式仍按字段名匹配。分配 ID 后应保持稳定，不要将其复用于其他字段。

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

## Schema 描述符类型

Schema 描述符位于 `Apache.Fory.Schema.Types` 下，仅作为元数据使用。它们不会替代普通 C# 载体类型。

常用标量描述符包括：

- `S.Int32`, `S.UInt32`
- `S.Int64`, `S.UInt64`
- `S.Float16`, `S.BFloat16`, `S.Float32`, `S.Float64`

容器描述符可以组合：

- `S.Fixed<TScalar>` 和 `S.Tagged<TScalar>` 用于标量整数编码
- `S.List<TElement>`
- `S.Set<TElement>`
- `S.Map<TKey, TValue>`
- `S.Array<TElement>`

密集数组字段使用 `S.Array<TElement>`，例如 `S.Array<S.Int32>` 或 `S.Array<S.BFloat16>`。

可空性来自 C# 载体类型。可空列表元素使用 `List<ulong?>`，map 需要可空 key 时使用 `NullableKeyDictionary<TKey, TValue>`。

## `[ForyUnion]` 和 `[ForyCase]`

生成的 union case 使用 `[ForyCase]` 同时指定稳定 case ID 和可选的 case 载荷 Schema 类型。不要在 union case 载荷成员上添加 `[ForyField]`。已知 case 的 record 名称使用 PascalCase FDL case 名称；需要避免名称冲突时，载荷类型使用限定引用。类型化 union 必须声明至少一个非 `Unknown` case；`Unknown(UnknownCase)` 只是 Fory 提供的向前兼容载体。该标记只选择载体，不会在 Schema case 表中增加条目。

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

## 可空性和引用跟踪

- 字段可空性来自 C# 类型可空性（`string?`、可空值类型等）。
- 使用 `ForyBuilder.TrackRef(...)` 配置引用跟踪。

## 相关主题

- [配置](configuration.md)
- [外部类型](external-types.md)
- [Schema 演进](schema-evolution.md)
- [支持的类型](supported-types.md)
