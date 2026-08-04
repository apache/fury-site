---
title: 外部类型
sidebar_position: 10
id: external-types
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

外部类型序列化为无法添加自身 Fory 注解的 class、struct 或 enum 生成序列化器。目标可以来自被引用的包、生成代码或其他不可修改的源码。本地声明提供 Schema，Fory 则直接读写目标值。

## Class 和 Struct 目标

假设另一个包定义了以下类：

```csharp
namespace ThirdParty;

public sealed class User
{
    public string Name { get; set; } = string.Empty;

    public int Age { get; set; }
}
```

在项目中声明其外部结构化序列化器：

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

`Name` 和 `Age` 是逻辑编码名称。每个声明直接映射到目标的后备字段，因此同一个声明也会计算其浅层对象存储。公共目标字段可以使用默认的同名映射。

该声明仅作为生成器输入。不要实例化或注册 `UserSerializer`。

相同形式也支持外部结构体：

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

默认情况下，声明属性会绑定名称相同且区分大小写的可见目标字段或属性。对于外部 class 目标，请同时设置 `TargetDeclaringType` 和 `TargetMemberName`，以绑定由目标或其某个非 `object` 基类声明的精确字段：

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

声明属性名称仍是逻辑 Schema 名称：

- 精确字段映射既是编码成员，也是物理存储字段。
- `Ignore = true` 将精确字段计入浅层存储，但不会将其加入编码 Schema。
- 每个非公共实例字段必须且只能列出一次，使浅层对象图内存估算覆盖目标的完整实例存储。静态字段不属于实例存储。

Fory 不会检查被引用包中的私有成员。精确私有映射是由应用负责的包 ABI 声明。请将包版本与声明一起固定并测试。如果映射的私有字段发生变化，生成的精确访问器会以 CLR 缺少字段错误失败；Fory 不会回退到反射或其他成员。被忽略的私有字段没有运行时访问器，因此请对照固定的包构建验证该存储声明。

外部 struct 目标仅支持可见字段和属性映射。精确映射和 `Ignore` 仅适用于 class，因为值存储属于物化该 struct 的持有者。不可访问的指针字段也会被拒绝：生成器不读取私有包布局，因而无法区分指针存储和固定缓冲区。对于这些结构，请使用自定义序列化器。

## 第三方基类

普通 `[ForyStruct]` 类可以继承不可修改的第三方类。请为其直接第三方基类声明一个外部继承层次提供方，并设置 `BaseOnly = true`。

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

共享 Schema 程序集可以声明完整的第三方前缀：

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

应用类随后直接添加自己的注解：

```csharp
[ForyStruct]
public sealed class LocalRecord : ThirdParty.VendorRecord
{
    [ForyField(4)]
    public string Label { get; set; } = string.Empty;
}
```

注册 `LocalRecord`。不要注册 `ThirdParty.VendorRecord`；`BaseOnly` 声明仅用于支持带注解的派生类。

提供方声明可以列出其目标的每个第三方祖先中的精确字段。Fory 不会发现包中的私有字段。如果多个消费方程序集继承同一个第三方基类，请在共享的被引用程序集中放置公共 `BaseOnly` 声明。

只要每个带注解的具体子类都具有合法的无参构造路径，`BaseOnly` 目标就可以是抽象类或缺少无参构造函数。

第一方基类应改为直接使用 `[ForyStruct]` 注解。参见[类继承](core-api.md#class-inheritance)。

## 声明和目标要求

外部结构化声明必须是非泛型抽象类，并且只能包含抽象的只读声明属性。每个编码属性：

- 绑定同名可见成员或显式命名的精确字段；
- 具有目标成员的 CLR 类型和泛型结构；
- 当目标元数据提供显式可空性时与其匹配；
- 可以使用标准 `ForyField` ID 和 Schema 描述符选项。

当目标元数据不感知可空性时，由声明选择 Schema 可空性。未声明为编码字段的成员在反序列化后保留其构造函数或派生行为。

独立外部目标必须是可访问的具体 class 或 struct，具有合法的无参构造路径和可写的已声明编码状态。受构造函数约束、只能通过工厂创建、readonly、init-only、需要转换或采用自定义编码的目标需要[自定义序列化器](custom-serializers.md)。

支持 `ThirdParty.Box<string>` 等封闭泛型目标。在 .NET 8 上，声明类型或签名为泛型的私有编码成员需要自定义序列化器。可见泛型成员和精确的被忽略 class 字段映射仍受支持。不支持开放泛型目标。

## Enum 目标

为 enum 使用空的静态序列化器声明：

```csharp
[ForyEnum(Target = typeof(ThirdParty.Status))]
internal static class StatusSerializer
{
}
```

以目标 enum 的数值为准。不要将其常量复制到声明中。每个序列化数值都必须位于 Fory 无符号 32 位 enum 标签范围内。跨语言通信方必须使用匹配的显式 enum 标签，例如 Java 的 `@ForyEnumId`。

## 注册和根值

通过普通 API 注册目标：

```csharp
Fory fory = Fory.Builder().Build();
fory.Register<ThirdParty.User>(100);
fory.Register<ThirdParty.Status>("example.Status");

ThirdParty.User user = new() { Name = "Alice", Age = 30 };
byte[] bytes = fory.Serialize(user);
ThirdParty.User decoded = fory.Deserialize<ThirdParty.User>(bytes);
```

分离命名空间/名称的重载以及 `ThreadSafeFory` 注册具有相同用法。不存在单独的外部类型注册或根值 API。

## 字段和载体

在生成模型中直接使用目标类型：

```csharp
[ForyStruct]
public sealed class Group
{
    public ThirdParty.User Owner { get; set; } = new();

    public List<ThirdParty.User> Users { get; set; } = [];

    public Dictionary<string, ThirdParty.User> UsersByName { get; set; } = [];
}
```

根载体组合也使用普通类型化 API：

```csharp
ThirdParty.User user = new() { Name = "Alice", Age = 30 };
byte[] bytes = fory.Serialize(new List<ThirdParty.User> { user });

List<ThirdParty.User> decoded =
    fory.Deserialize<List<ThirdParty.User>>(bytes);
```

通过 C# 运行时已经支持的具体载体类型，可以支持外部子项：

- 外部 struct 使用 `Nullable<T>`，一维数组使用 `T[]`；
- `List<T>`、`LinkedList<T>`、`Queue<T>` 和 `Stack<T>`；
- `HashSet<T>`、`SortedSet<T>` 和 `ImmutableHashSet<T>`；
- `Dictionary<TKey, TValue>`、`SortedDictionary<TKey, TValue>`、`SortedList<TKey, TValue>`、`ConcurrentDictionary<TKey, TValue>` 和 `NullableKeyDictionary<TKey, TValue>`。

目标可以作为 map key 或 value，也可以出现在递归嵌套载体中。不支持将集合接口类型用作生成字段或类型化根值。

## Schema 演进

在独立外部序列化器声明上设置 `Evolving`：

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

字段 ID、字段名称、Schema 描述符和 `Evolving` 来自声明。除此之外，兼容模式和 Schema 一致模式的行为与普通生成的 C# 类型完全相同。

`BaseOnly` 声明不能设置 `Evolving`；它不会创建根值序列化器。每个带注解的具体派生类型负责自己的 `Evolving` 设置。

## 动态值和引用

注册目标后，它可以出现在基于 `object` 的动态根值、字段、集合和 map 中。请注册每个可能动态出现的具体目标。

启用引用跟踪时，可变外部类保留对共享引用和循环引用的支持。外部结构体仍是内联值。

此功能不会增加任意接口或基类多态支持。

## 相关主题

- [Schema 元数据](schema-metadata.md)
- [类型注册](type-registration.md)
- [自定义序列化器](custom-serializers.md)
- [引用](references.md)
- [Schema 演进](schema-evolution.md)
