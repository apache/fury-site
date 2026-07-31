---
title: 线程安全
sidebar_position: 10
id: thread_safety
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

Apache Fory™ C# 提供两种运行时形态，它们的线程保证不同。

## `Fory`（单线程运行时）

`Fory` 针对单线程复用做了优化，不能被多个线程并发使用。

```csharp
Fory fory = Fory.Builder().Build();
```

如果你显式管理线程亲和性，可以为每个线程分配一个 `Fory` 实例。

## `ThreadSafeFory`（并发封装）

`ThreadSafeFory` 为每个线程封装一个 `Fory` 实例，并对外提供线程安全 API。

```csharp
using Apache.Fory;

using ThreadSafeFory fory = Fory.Builder()
    .Compatible(true)
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

- `ThreadSafeFory.Register(...)` 会集中保存注册信息。
- 已存在的线程内运行时会被更新。
- 新线程会自动收到此前所有注册信息。

## 释放资源

`ThreadSafeFory` 实现了 `IDisposable`，在不再使用时应及时释放。

```csharp
using ThreadSafeFory fory = Fory.Builder().BuildThreadSafe();
```

## 相关主题

- [配置](configuration.md)
- [类型注册](type-registration.md)
- [引用](references.md)
