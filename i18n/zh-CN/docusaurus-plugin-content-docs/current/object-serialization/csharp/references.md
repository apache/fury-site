---
title: 引用
sidebar_position: 8
id: references
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

启用 `TrackRef(true)` 后，Apache Fory™ C# 可以保留共享引用和循环引用。

## 启用引用跟踪

```csharp
Fory fory = Fory.Builder()
    .TrackRef(true)
    .Build();
```

启用后：

- 保留共享对象标识。
- 可以安全地序列化和反序列化循环对象图。

由[外部类型序列化](external-types.md)处理的可变类使用相同的引用跟踪。外部结构体仍是内联值。

## 循环引用示例

```csharp
using Apache.Fory;

[ForyStruct]
public sealed class Node
{
    public int Value { get; set; }
    public Node? Next { get; set; }
}

Fory fory = Fory.Builder()
    .TrackRef(true)
    .Build();
fory.Register<Node>(200);

Node node = new() { Value = 7 };
node.Next = node;

byte[] payload = fory.Serialize(node);
Node decoded = fory.Deserialize<Node>(payload);

// The cycle is preserved.
System.Diagnostics.Debug.Assert(object.ReferenceEquals(decoded, decoded.Next));
```

## 何时使用 `TrackRef(false)`

对于不关心引用标识的树形无环数据，`TrackRef(false)` 可以更快。

C# union 包装器不可变，并在读取其 case 载荷后创建。不支持从 union case 载荷返回包含该载荷的 union 的引用环；Fory 会拒绝未解析引用，而不是返回不完整的 union。

## 相关主题

- [配置](configuration.md)
- [基本序列化](core-api.md)
- [外部类型](external-types.md)
- [线程安全](thread-safety.md)
