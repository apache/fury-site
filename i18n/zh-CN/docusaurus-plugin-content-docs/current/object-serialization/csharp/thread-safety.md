---
title: 线程安全
sidebar_position: 13
id: thread-safety
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

Apache Fory™ C# 提供两种具有不同线程安全保证的 Fory 实例形式。

## `Fory`（单线程实例）

`Fory` 针对单线程复用进行了优化，不得由多个线程并发使用。

```csharp
Fory fory = Fory.Builder().Build();
```

显式管理线程亲和性时，每个线程使用一个 `Fory` 实例。

## `ThreadSafeFory`（并发包装器）

`ThreadSafeFory` 为每个线程包装一个 `Fory` 实例，并公开线程安全 API。

```csharp
using Apache.Fory;

using ThreadSafeFory fory = Fory.Builder()
    .TrackRef(true)
    .BuildThreadSafe();

fory.Register<MyType>(100);

Parallel.For(0, 64, i =>
{
    byte[] payload = fory.Serialize(i);
    int decoded = fory.Deserialize<int>(payload);
});
```

## 注册行为

- `ThreadSafeFory.Register(...)` 集中存储注册信息。
- 更新已有的各线程 Fory 实例。
- 新线程会自动获得所有既有注册信息。

## 释放资源

`ThreadSafeFory` 实现了 `IDisposable`，不再需要时应将其释放。

```csharp
using ThreadSafeFory fory = Fory.Builder().BuildThreadSafe();
```

## 相关主题

- [配置](configuration.md)
- [类型注册](type-registration.md)
- [引用](references.md)
