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

本页介绍常见的 C# 运行时问题及其解决方法。

## `TypeNotRegisteredException`

**现象**：`Type not registered: ...`

**原因**：用户类型在没有注册的情况下被序列化或反序列化。

**修复方式**：

```csharp
Fory fory = Fory.Builder().Build();
fory.Register<MyType>(100);
```

请确保读写两端使用相同的 type-ID 或名称映射。

## `InvalidDataException: xlang bitmap mismatch`

**原因**：载荷不是 xlang Fory 帧，或者它来自不输出 C# 所要求 xlang 头的对端或运行时模式。

**修复方式**：确保载荷由与 xlang 兼容的 Fory 运行时生成。C# 始终要求 xlang 头，并且不提供单独的 `Xlang(...)` 构建器选项。

```csharp
Fory writer = Fory.Builder().Compatible(true).Build();
Fory reader = Fory.Builder().Compatible(true).Build();
```

## 严格模式下的 Schema 版本不匹配

**现象**：反序列化生成的结构体类型时抛出 `InvalidDataException`。

**原因**：`Compatible(false)` 配合 `CheckStructVersion(true)` 时会要求 schema hash 完全一致。

**可选修复方式**：

- 启用 `Compatible(true)` 以支持 Schema 演进。
- 保持写端和读端的模型定义同步。

## 循环引用失败

**现象**：类似栈溢出的递归问题，或者对象图重建异常。

**原因**：循环对象图在 `TrackRef(false)` 下运行。

**修复方式**：

```csharp
Fory fory = Fory.Builder().TrackRef(true).Build();
```

## 并发问题

**原因**：在多个线程之间共享同一个 `Fory` 实例。

**修复方式**：改用 `BuildThreadSafe()`。

## 验证命令

从仓库根目录运行 C# 测试：

```bash
cd csharp
dotnet test Fory.sln -c Release
```

## 相关主题

- [配置](configuration)
- [Schema 演进](schema_evolution)
- [线程安全](thread_safety)
