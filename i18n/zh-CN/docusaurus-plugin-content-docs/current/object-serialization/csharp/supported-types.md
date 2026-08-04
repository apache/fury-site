---
title: 支持的类型
sidebar_position: 12
id: supported-types
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

本页汇总 Apache Fory™ C# 对内置类型和生成类型的支持。

## 原始类型

| C# 类型                           | 说明 |
| --------------------------------- | ---- |
| `bool`                            | 支持 |
| `sbyte`, `short`, `int`, `long`   | 支持 |
| `byte`, `ushort`, `uint`, `ulong` | 支持 |
| `float`, `double`                 | 支持 |
| `Half`, `BFloat16`                | 支持 |
| `string`                          | 支持 |
| `byte[]`                          | 支持 |
| 可空原始类型（例如 `int?`）       | 支持 |

## 数组

- 原始数值数组（`bool[]`、`int[]`、`ulong[]` 等）
- 使用 `Half[]`、`List<Half>` 和 `S.Array<S.Float16>` 表示 `array<float16>`
- 使用 `BFloat16[]`、`List<BFloat16>` 和 `S.Array<S.BFloat16>` 表示 `array<bfloat16>`
- `byte[]`
- 通过集合序列化器支持通用数组（`T[]`）

## 集合

### 类列表类型

- `List<T>`
- `LinkedList<T>`
- `Queue<T>`
- `Stack<T>`

### 类 set 类型

- `HashSet<T>`
- `SortedSet<T>`
- `ImmutableHashSet<T>`

### 类 map 类型

- `Dictionary<TKey, TValue>`
- `SortedDictionary<TKey, TValue>`
- `SortedList<TKey, TValue>`
- `ConcurrentDictionary<TKey, TValue>`
- `NullableKeyDictionary<TKey, TValue>`

## 时间类型

| C# 类型          | 编码类型    |
| ---------------- | ----------- |
| `DateOnly`       | `Date`      |
| `DateTime`       | `Timestamp` |
| `DateTimeOffset` | `Timestamp` |
| `TimeSpan`       | `Duration`  |

## 用户类型

- 通过源码生成序列化器支持带 `[ForyStruct]` 的 class/struct
- 当每个第一方类都直接添加注解时支持普通类继承层次；具体序列化器使用一个扁平 Schema
- 使用 `[ForyField]` 选择私有或 protected 的普通基类成员
- 通过一个显式外部声明描述未修改的第三方基类继承层次
- 带 `[ForyEnum]` 的 enum 和带 `[ForyUnion]` 的 ADT record
- 通过序列化器声明支持外部 class、struct 和 enum 目标
- 通过 `Register<T, TSerializer>(...)` 注册的自定义序列化器类型
- 支持 `Union` / `Union2<...>` 类型化 union

`[ForyEnum]` 数值是无符号 32 位编码标签，必须位于 `0..uint.MaxValue` 范围内。

不支持开放泛型生成目标。如果外部声明描述了精确的封闭第三方泛型基类，非泛型普通类可以继承该基类。在 .NET 8 上，不支持声明类型或签名为泛型的私有编码成员；可见成员和显式的仅存储字段声明仍受支持。

## 动态类型

通过 `Serialize<object?>` / `Deserialize<object?>` 处理的动态对象载荷支持：

- 原始值和 object 值
- 动态 list/set/map
- 嵌套动态结构

## 注意事项

- 应显式注册用户定义类型。
- 跨语言用法请遵循[跨语言指南](../xlang.md)。

## 相关主题

- [基本序列化](core-api.md)
- [外部类型](external-types.md)
- [类型注册](type-registration.md)
- [跨语言序列化](core-api.md#cross-language-interoperability)
