---
title: External Types
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

External-type serialization generates a serializer for a class, struct, or
enum that cannot carry its own Fory annotation. The target can come from a
referenced assembly or from generated or otherwise unmodifiable source in the
consumer project. A local serializer declaration supplies the schema, while
Fory reads and writes the target value directly.

## Class and Struct Targets

Suppose another package defines this class:

```csharp
namespace ThirdParty;

public sealed class User
{
    public User()
    {
    }

    public string Name { get; set; } = string.Empty;

    public int Age { get; set; }
}
```

Declare its external structural serializer in your project:

```csharp
using Apache.Fory;
using S = Apache.Fory.Schema.Types;

[ForyStruct(Target = typeof(ThirdParty.User))]
internal abstract class UserSerializer
{
    [ForyField(1)]
    public abstract string Name { get; }

    [ForyField(2, Type = typeof(S.Int32))]
    public abstract int Age { get; }
}
```

The declaration is generator input only. Do not instantiate or register
`UserSerializer`.

The same form supports an external struct:

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

## Enum Targets

Use an empty static serializer declaration for an enum:

```csharp
[ForyEnum(Target = typeof(ThirdParty.Status))]
internal static class StatusSerializer
{
}
```

The target enum's numeric values are authoritative. Do not copy its constants
into the declaration. Every serialized numeric value must fit in the unsigned
32-bit Fory enum tag range.

## Registration and Root Values

Register the target through the normal APIs:

```csharp
Fory fory = Fory.Builder().Build();
fory.Register<ThirdParty.User>(100);
fory.Register<ThirdParty.Status>("example.Status");

byte[] bytes = fory.Serialize(user);
ThirdParty.User decoded = fory.Deserialize<ThirdParty.User>(bytes);
```

The split namespace/name overloads and `ThreadSafeFory` registration work the
same way. There is no separate external-type registration or root API.

## Fields and Carriers

Use the target type directly in generated models:

```csharp
[ForyStruct]
public sealed class Group
{
    public ThirdParty.User Owner { get; set; } = new();

    public List<ThirdParty.User> Users { get; set; } = [];

    public Dictionary<string, ThirdParty.User> UsersByName { get; set; } = [];
}
```

Root carrier composition also uses the ordinary typed API:

```csharp
byte[] bytes = fory.Serialize(new List<ThirdParty.User> { user });

List<ThirdParty.User> decoded =
    fory.Deserialize<List<ThirdParty.User>>(bytes);
```

External children are supported through the concrete carrier types already
supported by the C# runtime:

- `Nullable<T>` for external structs and one-dimensional `T[]`;
- `List<T>`, `LinkedList<T>`, `Queue<T>`, and `Stack<T>`;
- `HashSet<T>`, `SortedSet<T>`, and `ImmutableHashSet<T>`;
- `Dictionary<TKey, TValue>`, `SortedDictionary<TKey, TValue>`,
  `SortedList<TKey, TValue>`, `ConcurrentDictionary<TKey, TValue>`, and
  `NullableKeyDictionary<TKey, TValue>`.

Targets can appear as map keys or values and inside recursively nested
carriers. Collection interface types are not supported as generated fields or
typed roots.

## Declaration and Target Requirements

An external structural serializer declaration must be a non-generic abstract
class containing only abstract get-only schema properties. Each property:

- matches an accessible target field or property with the same case-sensitive
  name;
- has the same CLR type and generic shape;
- has matching explicit nullability when the target metadata provides it;
- can be read and assigned directly by generated code;
- may use the standard `ForyField` ID and schema descriptor options.

When target metadata is nullable-oblivious, the declaration selects schema
nullability. Only members declared by the serializer are serialized; other
target state keeps its normal default or derived behavior after
deserialization.

The target must be an accessible concrete class or struct with a legal
parameterless construction path and writable state. Closed generic targets,
such as `ThirdParty.Box<string>`, are supported; open generic targets are not.

Targets that require private access, readonly or init-only assignment,
constructor arguments, factories, member renaming, or value conversion require
a [manual serializer](manual-serializers.md).

## Schema Evolution

Set `Evolving` on the serializer declaration:

```csharp
[ForyStruct(
    Target = typeof(ThirdParty.User),
    Evolving = false)]
internal abstract class UserSerializer
{
    public abstract string Name { get; }
}
```

Field IDs, field names, schema descriptors, and `Evolving` come from the
declaration. Compatible and schema-consistent modes otherwise behave exactly as
they do for an ordinary generated C# type.

## Dynamic Values and References

After registering the target, it can appear in `object`-based dynamic
roots, fields, collections, and maps. Register every concrete target that can
appear dynamically.

Mutable external classes retain shared-reference and cycle support when
reference tracking is enabled. External structs remain inline values.

This feature does not add arbitrary interface or base-class polymorphism.

## Related Topics

- [Schema Metadata](schema-metadata.md)
- [Type Registration](type-registration.md)
- [Manual Serializers](manual-serializers.md)
- [References](references.md)
- [Schema Evolution](schema-evolution.md)
