---
title: 基础序列化
sidebar_position: 1
id: basic_serialization
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

本页介绍 Apache Fory™ C# 的强类型序列化 API。

## 对象图序列化

在类或结构体上使用 `[ForyStruct]`，并在使用前完成注册。

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

带注解的类会将其带注解基类所声明的受支持成员纳入同一个扁平化 Schema。
需要直接为继承层次中的每个类添加注解；`[ForyStruct]` 不会被继承。

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

public 以及在程序集内可访问的可变成员会自动纳入 Schema。private、仅 protected
以及其他不可访问的字段或属性，必须在声明它们的类上添加 `[ForyField]`。
带注解的抽象基类会为具体派生类提供 Schema 信息，但不会作为根类型注册或序列化。

具体派生类型仍然只需注册一次：

```csharp
fory.Register<User>(102);
```

如果基类来自不可修改的包，请按[外部类型](external-types.md)中的说明显式声明其字段。

## 强类型 API

### 使用字节数组进行 Serialize / Deserialize

```csharp
byte[] payload = fory.Serialize(value);
MyType decoded = fory.Deserialize<MyType>(payload);
```

### 从 `ReadOnlySpan<byte>` 反序列化

```csharp
ReadOnlySpan<byte> span = payload;
MyType decoded = fory.Deserialize<MyType>(span);
```

### 以流式方式消费帧

```csharp
using System.Buffers;

ReadOnlySequence<byte> sequence = GetFramedSequence();
MyType first = fory.Deserialize<MyType>(ref sequence);
MyType second = fory.Deserialize<MyType>(ref sequence);
```

## 通过泛型对象 API 处理动态载荷

当编译期类型未知或载荷包含异构对象时，可以配合 `object?` 使用泛型 API。

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

如果动态 map 不含 null 键，通常会解码为 `Dictionary<object, object?>`。如果载荷对动态 map 本身启用了引用跟踪，C# 会返回 `NullableKeyDictionary<object, object?>`，以便嵌套引用和 null 键指向解码后的 map 所有者。

## Buffer Writer API

直接序列化到 `IBufferWriter<byte>` 目标。

```csharp
using System.Buffers;

ArrayBufferWriter<byte> writer = new();
fory.Serialize(writer, value);

ArrayBufferWriter<byte> dynamicWriter = new();
fory.Serialize<object?>(dynamicWriter, value);
```

## 说明

- 复用同一个 `Fory` 或 `ThreadSafeFory` 实例可以获得更好的性能。
- 基础类型和集合类型不需要用户手动注册。
- 对通过 `[ForyStruct]`、`[ForyEnum]`、`[ForyUnion]`、外部结构序列化器
  或自定义序列化器处理的用户类型进行显式注册。

## 相关主题

- [类型注册](type-registration.md)
- [支持的类型](supported-types.md)
- [引用](references.md)
