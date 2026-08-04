---
title: 跨语言序列化
sidebar_position: 1
id: xlang
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

Apache Fory™ C# 支持与其他 Fory 实现进行跨语言序列化。

## 跨语言 Fory 实例

C# 始终写入和读取 xlang 帧头。它没有模式开关，因此互操作代码只需配置兼容模式和引用跟踪等其余设置。

```csharp
Fory fory = Fory.Builder()
    .Build();
```

## 使用稳定 ID 注册

```csharp
[ForyStruct]
public sealed class Person
{
    public string Name { get; set; } = string.Empty;
    public int Age { get; set; }
}

Fory fory = Fory.Builder()
    .Build();

fory.Register<Person>(100);
```

所有语言使用相同的 ID 映射。

第三方 class、struct 和 enum 可以使用[外部类型序列化](external-types.md)。请使用其他语言通信方所用的相同 ID 或名称注册目标类型，而不是本地序列化器声明。

## 按名称注册

```csharp
fory.Register<Person>("com.example.Person");
```

## 跨语言示例

### C#（序列化端）

```csharp
Person person = new() { Name = "Alice", Age = 30 };
byte[] payload = fory.Serialize(person);
```

### Java（反序列化端）

```java
Fory fory = Fory.builder()
        .withXlang(true)
        .withRefTracking(true)
    .build();

fory.register(Person.class, 100);
Person value = (Person) fory.deserialize(payloadFromCSharp);
```

### Python（反序列化端）

```python
import pyfory

fory = pyfory.Fory(xlang=True, ref=True)
fory.register_type(Person, type_id=100)
value = fory.deserialize(payload_from_csharp)
```

## 类型映射参考

完整映射参见[跨语言指南](../xlang/index.md)。

对于低精度数值载荷，使用 `Half` / `Half[]` 或 `List<Half>` 表示 xlang `float16`，使用 `BFloat16` / `BFloat16[]` 或 `List<BFloat16>` 表示 xlang `bfloat16`。

## 列表和密集数组

C# `List<T>` 映射到 Fory `list<T>`。请使用 Schema 标记 `Apache.Fory.Schema.Types.Array<T>` 表示密集 `array<T>` 字段。

| Fory Schema       | C# Schema 标记示意    |
| ----------------- | --------------------- |
| `list<int32>`     | `S.List<S.Int32>`     |
| `array<bool>`     | `S.Array<S.Bool>`     |
| `array<int8>`     | `S.Array<S.Int8>`     |
| `array<int16>`    | `S.Array<S.Int16>`    |
| `array<int32>`    | `S.Array<S.Int32>`    |
| `array<int64>`    | `S.Array<S.Int64>`    |
| `array<uint8>`    | `S.Array<S.UInt8>`    |
| `array<uint16>`   | `S.Array<S.UInt16>`   |
| `array<uint32>`   | `S.Array<S.UInt32>`   |
| `array<uint64>`   | `S.Array<S.UInt64>`   |
| `array<float16>`  | `S.Array<S.Float16>`  |
| `array<bfloat16>` | `S.Array<S.BFloat16>` |
| `array<float32>`  | `S.Array<S.Float32>`  |
| `array<float64>`  | `S.Array<S.Float64>`  |

## 最佳实践

1. 保持类型 ID 稳定并记录在文档中。
2. 滚动升级期间保持启用兼容模式。
3. 在读写双方注册所有用户类型。
4. 使用真实载荷的往返测试验证集成。

## 相关主题

- [类型注册](type-registration.md)
- [外部类型](external-types.md)
- [Schema 演进](schema-evolution.md)
- [支持的类型](supported-types.md)
