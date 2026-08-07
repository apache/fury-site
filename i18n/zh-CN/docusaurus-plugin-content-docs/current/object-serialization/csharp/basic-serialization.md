---
title: 基础序列化
sidebar_position: 1
id: basic-serialization
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

本页介绍 Apache Fory™ C# 默认 xlang 模式下的类型化序列化 API。

## 对象图序列化

在 class/struct 上使用 `[ForyStruct]`，并在使用前注册它们。

```csharp
using Apache.Fory;

[ForyStruct]
public sealed class Address
{
    public string Street { get; set; } = string.Empty;
    public int Zip { get; set; }
}

[ForyStruct]
public sealed class Person
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Nickname { get; set; }
    public List<int> Scores { get; set; } = [];
    public List<Address> Addresses { get; set; } = [];
}

Fory fory = Fory.Builder().Build();
fory.Register<Address>(100);
fory.Register<Person>(101);

Person person = new()
{
    Id = 42,
    Name = "Alice",
    Nickname = null,
    Scores = [10, 20, 30],
    Addresses = [new Address { Street = "Main", Zip = 94107 }],
};

byte[] payload = fory.Serialize(person);
Person decoded = fory.Deserialize<Person>(payload);
```

## 类继承 {#class-inheritance}

带注解的类会将其带注解基类所声明的受支持成员纳入同一个扁平 Schema。请直接为继承层次中的每个类添加注解；`[ForyStruct]` 不会被继承。

```csharp
[ForyStruct]
public abstract class Entity
{
    [ForyField(1)]
    private long _id;

    public long Id => _id;
}

[ForyStruct]
public sealed class User : Entity
{
    [ForyField(2)]
    public string Name { get; set; } = string.Empty;
}
```

公共以及程序集可访问的可变成员会自动纳入。私有、仅 protected 或其他不可访问的字段和属性，必须在声明它们的类中添加 `[ForyField]`。带注解的抽象基类会为具体派生类发布 Schema 信息，但不会被注册或作为根值序列化。

具体派生类型仍只需注册一次：

```csharp
fory.Register<User>(102);
```

对于来自不可修改包的基类，请按[外部类型](external-types.md)所述显式声明其字段。

## 类型化 API

### 使用字节数组序列化和反序列化

```csharp
byte[] payload = fory.Serialize(value);
MyType decoded = fory.Deserialize<MyType>(payload);
```

### 从 `ReadOnlySpan<byte>` 反序列化

```csharp
ReadOnlySpan<byte> span = payload;
MyType decoded = fory.Deserialize<MyType>(span);
```

## 通过通用对象 API 处理动态载荷

当编译期类型未知或类型异构时，请配合 `object?` 使用通用 API。

```csharp
Dictionary<object, object?> value = new()
{
    ["k1"] = 7,
    [2] = "v2",
    [true] = null,
};

byte[] payload = fory.Serialize<object?>(value);
object? decoded = fory.Deserialize<object?>(payload);
```

没有 null key 时，动态 map 通常会解码为 `Dictionary<object, object?>`。如果载荷对动态 map 本身使用引用跟踪，C# 会返回 `NullableKeyDictionary<object, object?>`，使嵌套引用和 null key 指向解码后的 map 所有者。

## 缓冲区写入 API

直接序列化到 `IBufferWriter<byte>` 目标。

```csharp
using System.Buffers;

ArrayBufferWriter<byte> writer = new();
fory.Serialize(writer, value);

ArrayBufferWriter<byte> dynamicWriter = new();
fory.Serialize<object?>(dynamicWriter, value);
```

## 注意事项

- 复用同一个 `Fory` 或 `ThreadSafeFory` 实例以获得更好性能。
- 原始类型和集合不需要用户注册。
- 显式注册由 `[ForyStruct]`、`[ForyEnum]`、`[ForyUnion]`、外部结构化序列化器或自定义序列化器处理的用户类型。

## 跨语言互操作 {#cross-language-interoperability}

所有 Fory 实现都共用默认 xlang 格式。以下内容说明它的跨语言类型映射、类型标识和互操作要求。

Apache Fory™ C# 支持与其他 Fory 实现进行跨语言序列化。

### Xlang 配置

C# 始终写入和读取 xlang 帧头。它没有模式开关，因此互操作代码只需配置兼容模式和引用跟踪等其余设置。

```csharp
Fory fory = Fory.Builder()
    .Build();
```

### 使用稳定 ID 注册

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

### 按名称注册

```csharp
fory.Register<Person>("com.example.Person");
```

### 跨语言示例

#### C#（序列化端）

```csharp
Person person = new() { Name = "Alice", Age = 30 };
byte[] payload = fory.Serialize(person);
```

#### Java（反序列化端）

```java
Fory fory = Fory.builder()
        .withXlang(true)
        .withRefTracking(true)
    .build();

fory.register(Person.class, 100);
Person value = (Person) fory.deserialize(payloadFromCSharp);
```

#### Python（反序列化端）

```python
import pyfory

fory = pyfory.Fory(xlang=True, ref=True)
fory.register_type(Person, type_id=100)
value = fory.deserialize(payload_from_csharp)
```

### 类型映射参考

完整映射参见[跨语言指南](../xlang.md)。

对于低精度数值载荷，使用 `Half` / `Half[]` 或 `List<Half>` 表示 xlang `float16`，使用 `BFloat16` / `BFloat16[]` 或 `List<BFloat16>` 表示 xlang `bfloat16`。

### 列表和密集数组

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

### 互操作最佳实践

1. 保持类型 ID 稳定并记录在文档中。
2. 滚动升级期间保持启用兼容模式。
3. 在读写双方注册所有用户类型。
4. 使用真实载荷的往返测试验证集成。

### 相关指南

- [类型注册](type-registration.md)
- [外部类型](external-types.md)
- [Schema 演进](schema-evolution.md)
- [支持的类型](supported-types.md)

## 相关主题

- [类型注册](type-registration.md)
- [支持的类型](supported-types.md)
- [引用](references.md)
