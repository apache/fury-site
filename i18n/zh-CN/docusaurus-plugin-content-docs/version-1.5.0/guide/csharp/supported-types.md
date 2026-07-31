---
title: 支持的类型
sidebar_position: 9
id: supported_types
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

本页汇总 Apache Fory™ C# 的内置类型支持和生成类型支持。

## 基础类型

| C# 类型 | 说明 |
| ------- | ---- |
| `bool` | 支持 |
| `sbyte`, `short`, `int`, `long` | 支持 |
| `byte`, `ushort`, `uint`, `ulong` | 支持 |
| `float`, `double` | 支持 |
| `string` | 支持 |
| `byte[]` | 支持 |
| 可空基础类型，例如 `int?` | 支持 |

## 数组

- 基础数值数组，例如 `bool[]`、`int[]`、`ulong[]`
- `byte[]`
- 通过集合序列化器支持的一般数组 `T[]`

## 集合

### 类 List

- `List<T>`
- `LinkedList<T>`
- `Queue<T>`
- `Stack<T>`

### 类 Set

- `HashSet<T>`
- `SortedSet<T>`
- `ImmutableHashSet<T>`

### 类 Map

- `Dictionary<TKey, TValue>`
- `SortedDictionary<TKey, TValue>`
- `SortedList<TKey, TValue>`
- `ConcurrentDictionary<TKey, TValue>`
- `NullableKeyDictionary<TKey, TValue>`

## 时间类型

| C# 类型 | 编码类型 |
| ------- | -------- |
| `DateOnly` | `Date` |
| `DateTime` | `Timestamp` |
| `DateTimeOffset` | `Timestamp` |
| `TimeSpan` | `Duration` |

## 用户类型

- 通过 source generator 生成序列化器的 `[ForyStruct]` class 和 struct
- 每个第一方 class 都直接添加注解的普通 class 继承层次；具体序列化器使用一个扁平化 Schema
- 使用 `[ForyField]` 选取的 private 或 protected 普通基类成员
- 由一个显式外部声明描述的、未经修改的第三方基类继承层次
- `[ForyEnum]` enum 和 `[ForyUnion]` ADT record
- 通过序列化器声明支持的外部 class、struct 和 enum 目标
- 通过 `Register<T, TSerializer>(...)` 注册的自定义序列化器类型
- `Union` / `Union2<...>` 强类型联合支持

`[ForyEnum]` 的数值是无符号 32 位编码 tag，取值范围必须为
`0..uint.MaxValue`。

不支持开放泛型的生成目标。当外部声明描述了一个完全匹配的封闭第三方泛型基类时，
非泛型普通 class 可以继承该基类。在 .NET 8 上，不支持声明所在类型或签名使用泛型的
private 编码成员；可见成员和显式的仅存储字段声明仍受支持。

## 动态类型

通过 `Serialize<object?>` / `Deserialize<object?>` 处理动态对象载荷时，支持：

- 基础值和对象值
- 动态列表、集合、映射
- 嵌套的动态结构

## 说明

- 用户自定义类型应显式注册。
- 跨语言使用时，请遵循 [xlang 指南](../xlang/index.md)。

## 相关主题

- [基础序列化](basic-serialization.md)
- [外部类型](external-types.md)
- [类型注册](type-registration.md)
- [跨语言](xlang-serialization.md)
