---
slug: fory_1_5_0_release
title: Fory v1.5.0 Released
authors: [chaokunyang]
tags: [fory, java, rust, csharp, swift, dart]
---

The Apache Fory team is pleased to announce the 1.5.0 release. This release includes [25 PRs](https://github.com/apache/fory/compare/v1.4.0...v1.5.0). See the [Install](https://fory.apache.org/docs/start/install) page to get the libraries for your platform.

## Highlights

* Fory JSON is now up to 5× faster than Jackson and 10× faster than Gson.
* External-type serialization now covers Rust, Dart, Swift, and C#, allowing generated serializers for third-party structural types while preserving normal xlang wire identities and encodings.
* C# and Dart now support class inheritance, with Dart also supporting intentional omission of inherited private fields.

## Faster Fory JSON

Fory 1.5.0 delivers a major performance leap for Fory JSON, with deep optimizations across both serialization and deserialization. It is now up to 5× faster than Jackson and 10× faster than Gson.

<img src="/img/blog/fory_1_5_0_release/string_throughput.png" width="90%"/>

<img src="/img/blog/fory_1_5_0_release/utf8_bytes_throughput.png" width="90%"/>

| Representation | Operation   | fory-json ops/sec | Jackson ops/sec | Gson ops/sec | vs. Jackson | vs. Gson |
| -------------- | ----------- | ----------------: | --------------: | -----------: | ----------: | -------: |
| String         | Serialize   |         7,387,465 |       2,049,368 |    1,084,042 |       3.60× |    6.81× |
| String         | Deserialize |         2,897,955 |       1,074,885 |      902,772 |       2.70× |    3.21× |
| UTF-8 bytes    | Serialize   |        10,375,498 |       1,868,614 |    1,037,211 |       5.55× |   10.00× |
| UTF-8 bytes    | Deserialize |         3,077,158 |       1,268,397 |      933,079 |       2.43× |    3.30× |

## External-Type Serialization For Rust/Swift/CSharp/Dart

Fory 1.5.0 adds external-type serialization to Rust, Dart, Swift, and C#. Applications can define a local serializer or schema declaration for a third-party structural type that cannot be modified to carry Fory annotations. Fory then reads and writes the target value directly—without requiring a wrapper or intermediate mirror object.

The generated declaration preserves the runtime's normal registration and wire model. In xlang mode, external structs, enums, and unions use the same applicable identities and encodings as directly supported types. Private, opaque, or invariant-bearing targets can still use a custom serializer when structural generation is not appropriate.

In Rust, the local derive names the target type and is selected explicitly for root values:

```rust
use fory::{Fory, ForyStruct};

#[derive(ForyStruct)]
#[fory(target = third_party::User)]
struct UserSerializer {
    name: String,
    age: u32,
}

let mut fory = Fory::builder().xlang(true).build();
fory.register::<UserSerializer>(100)?;
let bytes = fory.serialize_with::<UserSerializer>(&user)?;
let decoded =
    fory.deserialize_with::<UserSerializer>(&bytes)?;
```

Dart generates a serializer from a local `target` declaration, then registers the third-party target through the generated module:

```dart
@ForyStruct(target: third_party.User)
abstract final class UserSerializer {
  @ForyField(id: 1)
  late final String name;

  @ForyField(id: 2, type: Int32Type())
  late final int age;
}

ExternalSerializersForyModule.register(
  fory,
  third_party.User,
  id: 100,
);
```

Swift registers and selects the external serializer while the application continues to pass `ThirdParty.User` values:

```swift
@ForyStruct(target: ThirdParty.User.self)
struct UserSerializer {
    var name: String
    var age: UInt32
}

try fory.register(UserSerializer.self, id: 100)
let bytes = try fory.serialize(user, with: UserSerializer.self)
let decoded = try fory.deserialize(bytes, with: UserSerializer.self)
```

C# source generation uses a local abstract declaration and registers the target type through the normal API:

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

fory.Register<ThirdParty.User>(100);
byte[] bytes = fory.Serialize(user);
```

For construction requirements, nested containers, dynamic values, and advanced mappings, see the dedicated guides for [Rust](/docs/guide/rust/external_types), [Dart](/docs/guide/dart/external_types), [Swift](/docs/guide/swift/external_types), and [C#](/docs/guide/csharp/external_types).

## Class Inheritance for C# and Dart

Fory 1.5.0 adds class inheritance support to C# and Dart. In both runtimes, inherited and child storage is represented as one flattened schema rather than a nested base object, so ordinary field ordering, schema evolution, reference tracking, and graph-memory checks continue to apply to the concrete type.

In C#, annotate every participating class directly because `[ForyStruct]` is not inherited. Abstract annotated bases provide schema fields for their concrete descendants, while only the concrete derived type is registered:

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

fory.Register<User>(102);
```

Dart generation discovers superclass and applied-mixin storage. Public inherited fields need no annotation on the parent, and a concrete child can intentionally omit inherited private fields:

```dart
class MessageBase {
  int sequence = 0;
  String _cache = '';
}

@ForyStruct(ignoreInheritedPrivateFields: true)
class TextMessage extends MessageBase {
  TextMessage();

  String text = '';
}
```

The generated `TextMessage` schema contains `sequence` and `text`, but not the inherited private `_cache`. The option does not omit inherited public fields or private fields declared by the child itself.

See [C# class inheritance](/docs/guide/csharp/basic_serialization#class-inheritance) and [Dart inheritance](/docs/guide/dart/inheritance) for constructor rules, private-field access across packages, mixins, generics, references, and schema compatibility.

## Features

* feat(java): add configurable JSON benchmark reports by @chaokunyang in https://github.com/apache/fory/pull/3870
* feat(java): optimize json perf by @chaokunyang in https://github.com/apache/fory/pull/3871
* feat(rust): support external-type serialization by @chaokunyang in https://github.com/apache/fory/pull/3881
* feat(dart): add external-type serialization by @chaokunyang in https://github.com/apache/fory/pull/3886
* feat(swift): support external-type serialization by @chaokunyang in https://github.com/apache/fory/pull/3888
* feat(csharp): support external type serialization by @chaokunyang in https://github.com/apache/fory/pull/3889
* feat(xlang): harden external type support by @chaokunyang in https://github.com/apache/fory/pull/3890
* feat(csharp): support generated class inheritance by @chaokunyang in https://github.com/apache/fory/pull/3893
* feat(dart): add dart inheriance support by @chaokunyang in https://github.com/apache/fory/pull/3892
* feat(dart): allow omitting inherited private fields by @chaokunyang in https://github.com/apache/fory/pull/3894

## Bug Fix

* fix(cpp): validate tagged struct field reads by @chaokunyang in https://github.com/apache/fory/pull/3884
* fix(xlang): reject malformed meta strings by @chaokunyang in https://github.com/apache/fory/pull/3885
* fix(cpp): validate polymorphic smart pointer reads by @chaokunyang in https://github.com/apache/fory/pull/3887
* fix: fix release errors by @chaokunyang in https://github.com/apache/fory/pull/3891

## Other Improvements

* chore: fix release script by @chaokunyang in https://github.com/apache/fory/pull/3867
* chore: Bump protobufjs from 7.6.2 to 7.6.3 in /javascript by @dependabot[bot] in https://github.com/apache/fory/pull/3868
* chore: Bump com.fasterxml.jackson.core:jackson-databind from 2.22.0 to 2.22.1 in /benchmarks/java by @dependabot[bot] in https://github.com/apache/fory/pull/3869
* chore(release): bump versions for 1.4.0 by @chaokunyang in https://github.com/apache/fory/pull/3874
* docs: add java json serialization doc by @chaokunyang in https://github.com/apache/fory/pull/3875
* chore: fix package metadata links by @chaokunyang in https://github.com/apache/fory/pull/3876
* chore: Bump protobufjs from 7.6.3 to 7.6.5 in /javascript by @dependabot[bot] in https://github.com/apache/fory/pull/3878
* chore: Bump tar from 7.5.16 to 7.5.20 in /javascript by @dependabot[bot] in https://github.com/apache/fory/pull/3879
* chore: Bump com.fasterxml.jackson.core:jackson-core from 2.18.6 to 2.18.8 in /java/fory-testsuite by @dependabot[bot] in https://github.com/apache/fory/pull/3880
* chore: Bump tar from 7.5.20 to 7.5.22 in /javascript by @dependabot[bot] in https://github.com/apache/fory/pull/3882
* chore(deps): upgrade test deps by @chaokunyang in https://github.com/apache/fory/pull/3883

**Full Changelog**: https://github.com/apache/fory/compare/v1.4.0...v1.5.0
