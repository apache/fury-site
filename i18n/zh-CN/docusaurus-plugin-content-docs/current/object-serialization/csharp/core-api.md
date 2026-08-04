---
title: 基本序列化
sidebar_position: 3
id: core-api
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

本页介绍 Apache Fory™ C# 的类型化序列化 API。

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

## 相关主题

- [类型注册](type-registration.md)
- [支持的类型](supported-types.md)
- [引用](references.md)
