---
title: C#
sidebar_position: 7
id: csharp
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

## 输出布局

C# 输出为每个 Schema 生成一个 `.cs` 文件，例如：

- `<csharp_out>/addressbook/Addressbook.cs`

C# 模型文件名使用规范化的 PascalCase 源文件主名（stem）。例如，`service.fdl` 生成
`Service.cs`，`order-events.fdl` 生成 `OrderEvents.cs`，`123-schema.fdl` 生成
`Schema123Schema.cs`。

## 类型生成

消息生成带 C# 属性和字节辅助方法的 `[ForyStruct]` 类：

```csharp
[ForyStruct]
public sealed partial class Person
{
    public string Name { get; set; } = string.Empty;
    public int Id { get; set; }
    public List<Person.PhoneNumber> Phones { get; set; } = new();
    public Animal Pet { get; set; } = null!;

    public byte[] ToBytes() { ... }
    public static Person FromBytes(byte[] data) { ... }
}
```

联合生成 `[ForyUnion]` ADT。`Unknown(UnknownCase)` 是 Fory 提供的向前兼容载体，使用
`[ForyUnknownCase]` 标记。该标记只选择载体，不会向 Schema case 表添加条目。Schema
定义的 case 使用非负 `[ForyCase]` ID。如果 case 需要非默认 Schema 编码，生成的
`[ForyCase]` 会携带 `Type`。已知 case record 名称采用 PascalCase FDL case 名称；需要
避免名称冲突时，载荷类型生成为限定引用。类型化联合必须至少包含一个非 `Unknown` case。

```csharp
[ForyUnion]
public abstract partial record Animal
{
    private Animal() {}

    [ForyUnknownCase]
    public sealed partial record Unknown(UnknownCase Value) : Animal;

    [ForyCase(0)]
    public sealed partial record Dog(global::addressbook.Dog Value) : Animal;

    [ForyCase(1)]
    public sealed partial record Cat(global::addressbook.Cat Value) : Animal;
}
```

## 模块安装

每个 Schema 都会生成一个模块类，该类先安装导入的模块，再注册本地 Schema 类型：

```csharp
public static class AddressbookForyModule
{
    public static void Install(Fory fory)
    {
        fory.Register<addressbook.Animal>((uint)106);
        fory.Register<addressbook.Person>((uint)100);
        // ...
    }
}
```

C# 模型文件的基础文件名和模块类都使用规范化的源文件主名。它们不使用
`csharp_namespace`，也不使用 gRPC 服务名称。例如，`service.fdl` 生成 `Service.cs` 和
`ServiceForyModule`，而 `order-events.fdl` 生成 `OrderEvents.cs` 和
`OrderEventsForyModule`。名为 `Greeter` 的 gRPC 服务生成服务配套文件 `GreeterGrpc.cs`；
它不会更改 Schema 模块名称。要获得 `GreeterForyModule`，请将 Schema 文件命名为
`greeter.fdl` 或 `Greeter.fdl`。

此源文件规则允许多个 Schema 指向同一个 C# 命名空间而不发生冲突。不会生成从命名空间
或服务派生的模块别名。

未提供显式类型 ID 时，生成的安装代码使用计算得到的数字 ID（与其他目标行为相同）。

## gRPC 服务配套代码

使用 `--grpc` 时，C# 为每个服务生成一个 `<ServiceName>Grpc.cs`。其静态服务持有者包含描述符、`<ServiceName>Base`、`<ServiceName>Client` 和两个 `BindService` 重载。托管、客户端、依赖项和流式处理请参阅 [C# gRPC](../../grpc/csharp.md)。
