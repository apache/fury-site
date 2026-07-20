---
title: Schema 演进
sidebar_position: 7
id: schema_evolution
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

Apache Fory™ C# 在 `Compatible(true)` 模式下支持 Schema 演进。

## 兼容模式

```csharp
Fory fory = Fory.Builder()
    .Compatible(true)
    .Build();
```

兼容模式会写入类型元信息，使结构体定义不同的读写端也能互操作。

## 示例：新增一个字段

```csharp
using Apache.Fory;

[ForyObject]
public sealed class OneStringField
{
    public string? F1 { get; set; }
}

[ForyObject]
public sealed class TwoStringField
{
    public string F1 { get; set; } = string.Empty;
    public string F2 { get; set; } = string.Empty;
}

Fory fory1 = Fory.Builder().Compatible(true).Build();
fory1.Register<OneStringField>(200);

Fory fory2 = Fory.Builder().Compatible(true).Build();
fory2.Register<TwoStringField>(200);

byte[] payload = fory1.Serialize(new OneStringField { F1 = "hello" });
TwoStringField evolved = fory2.Deserialize<TwoStringField>(payload);

// F2 falls back to default value on reader side.
System.Diagnostics.Debug.Assert(evolved.F1 == "hello");
System.Diagnostics.Debug.Assert(evolved.F2 == string.Empty);
```

## 带版本校验的 Schema 一致模式

如果你需要严格的 Schema 身份校验，而不是演进行为：

```csharp
Fory strict = Fory.Builder()
    .Compatible(false)
    .CheckStructVersion(true)
    .Build();
```

这种模式会在 schema hash 不匹配时抛出异常。

## 最佳实践

1. 对独立部署的服务启用 `Compatible(true)`。
2. 在不同版本之间保持稳定的 type ID。
3. 新增字段时提供安全的默认值。
4. 如果要求严格匹配，使用 `CheckStructVersion(true)`。

## 相关主题

- [配置](configuration.md)
- [类型注册](type-registration.md)
- [故障排查](troubleshooting.md)
