---
title: 外部类型
sidebar_position: 6
id: external_types
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

外部类型序列化可为无法添加 Fory 注解的类、结构体或枚举生成序列化器。目标类型可以来自引用的包，也可以来自生成的或因其他原因无法修改的源代码。本地声明提供 Schema，Fory 则直接读写目标值。

## 类与结构体目标

假设另一个包定义了以下类：

```csharp
namespace ThirdParty;

public sealed class User
{
    public string Name { get; set; } = string.Empty;

    public int Age { get; set; }
}
```

在你的项目中声明它的外部结构序列化器：

```csharp
using Apache.Fory;
using S = Apache.Fory.Schema.Types;

[ForyStruct(Target = typeof(ThirdParty.User))]
internal abstract class UserSerializer
{
    [ForyField(
        1,
        TargetDeclaringType = typeof(ThirdParty.User),
        TargetMemberName = "<Name>k__BackingField")]
    public abstract string Name { get; }

    [ForyField(
        2,
        Type = typeof(S.Int32),
        TargetDeclaringType = typeof(ThirdParty.User),
        TargetMemberName = "<Age>k__BackingField")]
    public abstract int Age { get; }
}
```

`Name` 和 `Age` 是编码格式中的逻辑名称。每个声明都会直接映射到目标类型的后备字段，因此同一声明也涵盖了相应的浅层对象存储。对于公开的目标字段，可以使用默认的同名映射。

该声明只作为生成器输入。不要实例化或注册 `UserSerializer`。

同一形式也支持外部结构体：

```csharp
[ForyStruct(Target = typeof(ThirdParty.Point))]
internal abstract class PointSerializer
{
    [ForyField(1)]
    public abstract int X { get; }

    [ForyField(2)]
    public abstract int Y { get; }
}
```

## 精确成员映射

默认情况下，声明属性会绑定到名称大小写完全相同的可见目标字段或属性。对于外部类目标，可同时设置 `TargetDeclaringType` 和 `TargetMemberName`，以绑定目标类或其某个非 `object` 基类声明的确切字段：

```csharp
[ForyStruct(Target = typeof(ThirdParty.Account))]
internal abstract class AccountSerializer
{
    [ForyField(
        1,
        TargetDeclaringType = typeof(ThirdParty.Account),
        TargetMemberName = "_identifier")]
    public abstract long Id { get; }

    [ForyField(
        2,
        TargetDeclaringType = typeof(ThirdParty.Account),
        TargetMemberName = "<Secret>k__BackingField")]
    public abstract string Credential { get; }

    [ForyField(
        Ignore = true,
        TargetDeclaringType = typeof(ThirdParty.Account),
        TargetMemberName = "_cache")]
    public abstract int CacheStorage { get; }
}
```

声明属性的名称仍然是 Schema 中的逻辑名称：

- 精确字段映射既是编码成员，也是物理存储字段。
- `Ignore = true` 会将精确字段计入浅层存储，但不会将其添加到编码 Schema 中。
- 每个非公开实例字段都必须且只能列出一次，确保浅层对象图内存估算涵盖目标类型的全部实例存储。静态字段不属于实例存储。

Fory 不会检查所引用包中的私有成员。私有字段的精确映射是一项由应用负责维护的包 ABI 声明。请将包版本与该声明一起锁定并进行测试。如果映射的私有字段发生变化，生成的精确访问器会抛出 CLR 的字段缺失错误；Fory 不会回退到反射或其他成员。被忽略的私有字段没有运行时访问器，因此应针对锁定的包构建验证该存储声明。

外部结构体目标只支持可见字段和属性映射。精确映射和 `Ignore` 仅适用于类，因为值存储归属于实例化该结构体的承载对象。无法访问的指针字段同样会被拒绝：在不读取私有包布局的情况下，生成器无法区分指针存储与定长缓冲区。对于这些类型结构，请使用自定义序列化器。

## 第三方基类

普通的 `[ForyStruct]` 类可以继承无法修改的第三方类。需要为它的直接第三方基类声明一个外部继承层次提供者，并设置 `BaseOnly = true`。

例如，假设某个包定义了：

```csharp
namespace ThirdParty;

public class VendorBase
{
    private long _identifier;
    private string Secret { get; set; } = string.Empty;
    private readonly int _cache;
}

public class VendorRecord : VendorBase
{
    public int Revision;
}
```

共享 Schema 程序集可以声明完整的第三方继承链前缀：

```csharp
using Apache.Fory;

[ForyStruct(Target = typeof(ThirdParty.VendorRecord), BaseOnly = true)]
public abstract class VendorRecordHierarchy
{
    [ForyField(
        1,
        TargetDeclaringType = typeof(ThirdParty.VendorBase),
        TargetMemberName = "_identifier")]
    public abstract long Identifier { get; }

    [ForyField(
        2,
        TargetDeclaringType = typeof(ThirdParty.VendorBase),
        TargetMemberName = "<Secret>k__BackingField")]
    public abstract string Secret { get; }

    [ForyField(
        Ignore = true,
        TargetDeclaringType = typeof(ThirdParty.VendorBase),
        TargetMemberName = "_cache")]
    public abstract int CacheStorage { get; }

    [ForyField(3)]
    public abstract int Revision { get; }
}
```

应用类随后添加自己的直接注解：

```csharp
[ForyStruct]
public sealed class LocalRecord : ThirdParty.VendorRecord
{
    [ForyField(4)]
    public string Label { get; set; } = string.Empty;
}
```

注册 `LocalRecord`。不要注册 `ThirdParty.VendorRecord`；`BaseOnly` 声明仅用于支持带注解的派生类。

提供者声明可以列出其目标类型的每个第三方祖先类中的精确字段。Fory 不会发现包中的私有字段。如果多个消费方程序集都继承同一个第三方基类，请将公开的 `BaseOnly` 声明放在它们共同引用的程序集中。

只要每个带注解的具体子类都具有合法的无参数构造路径，`BaseOnly` 目标就可以是抽象类，也可以没有无参数构造函数。

第一方基类应直接使用 `[ForyStruct]` 注解。请参阅[类继承](basic-serialization.md#class-inheritance)。

## 声明与目标类型要求

外部结构声明必须是非泛型抽象类，且只能包含仅有抽象 getter 的声明属性。每个编码属性：

- 绑定到同名的可见成员，或显式指定名称的精确字段；
- 与目标成员具有相同的 CLR 类型和泛型结构；
- 当目标元数据提供显式可空性时，声明的可空性必须与之匹配；并且
- 可以使用标准的 `ForyField` ID 和 Schema 描述符选项。

当目标元数据没有可空性信息时，由声明决定 Schema 的可空性。未声明为编码字段的成员在反序列化后会保留其构造函数行为或派生行为。

独立的外部目标必须是可访问的具体类或结构体，并具有合法的无参数构造路径和可写的已声明编码状态。只能通过构造函数创建、只能通过工厂创建、包含 `readonly` 或 `init-only` 成员、需要类型转换或采用自定义编码格式的目标类型，需要使用[自定义序列化器](custom-serializers.md)。

支持 `ThirdParty.Box<string>` 这类封闭泛型目标。在 .NET 8 上，如果私有编码成员的声明类型或签名使用了泛型，则需要使用自定义序列化器。可见的泛型成员和精确映射但被忽略的类字段仍受支持。不支持开放泛型目标。

## 枚举目标

为枚举使用空的静态序列化器声明：

```csharp
[ForyEnum(Target = typeof(ThirdParty.Status))]
internal static class StatusSerializer
{
}
```

以目标枚举的数值为准。不要将其常量复制到声明中。每个序列化数值都必须处于 Fory 枚举 tag 的 32 位无符号范围内。跨语言通信端必须使用匹配的显式枚举 tag，例如 Java 的 `@ForyEnumId`。

## 注册与根值

通过常规 API 注册目标类型：

```csharp
Fory fory = Fory.Builder().Build();
fory.Register<ThirdParty.User>(100);
fory.Register<ThirdParty.Status>("example.Status");

ThirdParty.User user = new() { Name = "Alice", Age = 30 };
byte[] bytes = fory.Serialize(user);
ThirdParty.User decoded = fory.Deserialize<ThirdParty.User>(bytes);
```

分别传入命名空间和名称的重载以及 `ThreadSafeFory` 注册的工作方式相同。外部类型没有单独的注册 API 或根值 API。

## 字段与承载类型

在生成的模型中直接使用目标类型：

```csharp
[ForyStruct]
public sealed class Group
{
    public ThirdParty.User Owner { get; set; } = new();

    public List<ThirdParty.User> Users { get; set; } = [];

    public Dictionary<string, ThirdParty.User> UsersByName { get; set; } = [];
}
```

根值的承载类型组合也使用常规的类型化 API：

```csharp
ThirdParty.User user = new() { Name = "Alice", Age = 30 };
byte[] bytes = fory.Serialize(new List<ThirdParty.User> { user });

List<ThirdParty.User> decoded =
    fory.Deserialize<List<ThirdParty.User>>(bytes);
```

C# 运行时已支持的以下具体承载类型，也支持将外部类型作为子元素：

- 用于外部结构体的 `Nullable<T>`，以及一维 `T[]`；
- `List<T>`、`LinkedList<T>`、`Queue<T>` 和 `Stack<T>`；
- `HashSet<T>`、`SortedSet<T>` 和 `ImmutableHashSet<T>`；
- `Dictionary<TKey, TValue>`、`SortedDictionary<TKey, TValue>`、
  `SortedList<TKey, TValue>`、`ConcurrentDictionary<TKey, TValue>` 和
  `NullableKeyDictionary<TKey, TValue>`。

目标类型可以用作 map 的键或值，也可以位于递归嵌套的承载类型中。生成字段和类型化根值不支持集合接口类型。

## Schema 演进

在独立的外部序列化器声明上设置 `Evolving`：

```csharp
[ForyStruct(
    Target = typeof(ThirdParty.User),
    Evolving = false)]
internal abstract class UserSerializer
{
    [ForyField(
        TargetDeclaringType = typeof(ThirdParty.User),
        TargetMemberName = "<Name>k__BackingField")]
    public abstract string Name { get; }
}
```

字段 ID、字段名称、Schema 描述符和 `Evolving` 均来自该声明。除此之外，兼容模式和 Schema 一致模式的行为与普通的 C# 生成类型完全相同。

`BaseOnly` 声明不能设置 `Evolving`，因为它不会创建根序列化器。每个带注解的具体派生类都拥有自己的 `Evolving` 设置。

## 动态值与引用

注册目标类型后，它可以出现在基于 `object` 的动态根值、字段、集合和 map 中。请注册每个可能动态出现的具体目标类型。

启用引用跟踪后，可变的外部类仍然支持共享引用和循环引用。外部结构体仍然是内联值。

此功能不会额外支持任意接口或基类多态。

## 相关主题

- [Schema 元数据](schema-metadata.md)
- [类型注册](type-registration.md)
- [自定义序列化器](custom-serializers.md)
- [引用](references.md)
- [Schema 演进](schema-evolution.md)
