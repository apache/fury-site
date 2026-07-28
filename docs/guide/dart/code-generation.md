---
title: Code Generation
sidebar_position: 3
id: code_generation
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

Fory generates fast serializer code for your Dart classes at build time. You annotate your models, run `build_runner`, and Fory takes care of the rest.

## Step 1 — Annotate Your Models

Add `@ForyStruct()` to each class you want to serialize. Include the generated part directive at the top of the file.

```dart
import 'package:fory/fory.dart';

part 'models.fory.dart';

@ForyStruct()
class Address {
  Address();

  String city = '';
  String street = '';
}

@ForyStruct()
class User {
  User();

  String name = '';

  @ForyField(type: Int32Type())
  int age = 0;
  Address address = Address();
}
```

Enums defined in the same file are automatically included in the generated registration.

For a class owned by another library, define an
[external structural serializer](external-types.md) with
`@ForyStruct(target: ExternalType)`.

## Inherited Fields

For an ordinary struct, Fory follows the concrete superclass and applied-mixin
storage chain. All non-static instance storage is flattened into the concrete
child's one generated schema, globally ordered with fields declared directly
on the child. Interfaces and abstract accessors do not add storage.

Field annotations belong to the field declaration. In particular,
`@ForyField(ignore: true)` on the declaring field is the only way to omit
ordinary storage. Fory reports a generation error instead of silently omitting
a field that is inaccessible, hidden, unsupported, or cannot be reconstructed.

| Inherited field                         | Requirement                                                               |
| --------------------------------------- | ------------------------------------------------------------------------- |
| Public field                            | No parent annotation; generated child code accesses it directly           |
| Private field in the child's library    | No parent annotation; the generated part accesses it directly             |
| Private field in another Dart library   | A public boundary in that declaring library uses `exposePrivateFields`    |
| Field marked `@ForyField(ignore: true)` | Omitted from the schema; no access or construction requirement is checked |

To expose private state from a library that owns a base class:

```dart
// package:model_owner/base.dart
import 'package:fory/fory.dart';

part 'base.fory.dart';

@ForyStruct(exposePrivateFields: true)
abstract class AccountBase {
  AccountBase(String tenantId) : _tenantId = tenantId;

  final String _tenantId;

  String get tenantId => _tenantId;
}
```

The consumer annotates only its concrete type:

```dart
// lib/account.dart
import 'package:fory/fory.dart';
import 'package:model_owner/base.dart';

part 'account.fory.dart';

@ForyStruct()
final class Account extends AccountBase {
  Account(String tenantId) : super(tenantId);
}
```

`exposePrivateFields` defaults to `false` and authorizes only the generated
private-field access companion owned by that library. It does not control field
discovery or same-library private access. Placing it on `Account` cannot expose
private fields owned by `model_owner`. If a hierarchy contains private fields
from several libraries, each declaring library needs its own public opted-in
boundary.

The child source must import the provider namespace without hiding the
generated companion. A barrel is valid when it re-exports both the public
boundary and the companion. Across packages, generate and publish the
provider's `.fory.dart` part before building a consumer.

For example, a restrictive barrel for the model above must include both names:

```dart
export 'base.dart'
    show AccountBase, $AccountBaseForyFieldAccess;
```

Non-ignored `final` and `late final` fields require an identity-preserving path
from a parameter of the concrete child's selected generative constructor to
the exact field. Initializing formals, super formals, redirects, and direct
constructor initializers are supported. A parameter with the same name is not
proof if the constructor ignores or transforms it. Use
`@ForyField(ignore: true)` or a manual serializer when the object cannot be
reconstructed without custom logic.

The concrete child is registered independently and owns the only serializer
for its flattened schema. Parent serializers are not nested or invoked.
Inherited reference annotations feed the existing reference behavior exactly
like fields declared directly on the child.

## Step 2 — Run the Generator

From the directory that contains your `pubspec.yaml`:

```bash
dart run build_runner build
```

This emits a `.fory.dart` file next to your source file. Re-run this command any
time you add or rename annotated types, change hierarchy storage, or change an
exposure boundary.

## Step 3 — Register and Use

The generator creates a Fory module class (named after your file) with a `register` function. Call it before serializing:

```dart
final fory = Fory();
ModelsForyModule.register(fory, Address, id: 1);
ModelsForyModule.register(fory, User, id: 2);
```

Or use a stable name instead of a numeric ID (useful for cross-language scenarios):

```dart
ModelsForyModule.register(
  fory,
  User,
  name: 'example.User',
);
```

See [Type Registration](type-registration.md) for guidance on choosing between IDs and names.

## Schema Evolution: `evolving`

`@ForyStruct()` defaults to `evolving: true`, which is the right choice for most applications.

- `evolving: true` — Fory stores enough metadata so that if you add or remove fields later, old and new code can still exchange messages. Enable this whenever different versions of your app or service may be running at the same time.
- `evolving: false` — Faster serialization and smaller size. Use only when every reader and writer always uses the same struct schema.

```dart
// evolving: true is the default, you can omit it
@ForyStruct(evolving: true)
class Event {
  Event();

  String name = '';
}
```

When using evolving structs, also assign stable field IDs with `@ForyField(id: ...)` before you ship your first payload — those IDs are how Fory matches fields after a schema change.

Inherited and direct fields share this one ID namespace. Do not reuse an ID in
another superclass, mixin, or child field.

## Choosing Generated or Manual Serialization

Use an [external structural serializer](external-types.md) when another
package's class exposes matching public getters and a safe public construction
path. Use a [manual serializer](custom-serializers.md) when the wire body,
field names, values, or construction need custom logic.

## Related Topics

- [Type Registration](type-registration.md)
- [External-Type Serialization](external-types.md)
- [Schema Metadata](schema-metadata.md)
- [Schema Evolution](schema-evolution.md)
