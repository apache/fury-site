---
title: 代码生成
sidebar_position: 3
id: code-generation
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

Fory 在构建时为 Dart 类生成快速序列化器代码。为模型添加注解并运行 `build_runner`，其余工作由 Fory 完成。

## 第 1 步：为模型添加注解

为每个需要序列化的类添加 `@ForyStruct()`。在文件顶部包含生成的 part 指令。

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

同一文件中定义的 enum 会自动纳入生成的注册信息。

对于其他库拥有的类，请使用 `@ForyStruct(target: ExternalType)` 定义[外部结构化序列化器](external-types.md)。

## 继承字段

普通 `@ForyStruct()` 会将具体父类和所应用 mixin 的字段展平到一个生成的子类 Schema 中。公共继承字段不要求父类添加注解。

私有字段、`ignoreInheritedPrivateFields`、跨库访问、构造函数、mixin 和 Schema 兼容性参见 [Struct 继承](inheritance.md)。

## 第 2 步：运行生成器

在包含 `pubspec.yaml` 的目录中运行：

```bash
dart run build_runner build
```

这会在源文件旁生成 `.fory.dart` 文件。每当新增或重命名带注解类型、修改继承层次存储，或修改公开边界或 `ignoreInheritedPrivateFields` 时，请重新运行此命令。

## 第 3 步：注册并使用

生成器会创建以文件命名的 Fory 模块类，并提供 `register` 函数。请在序列化前调用它：

```dart
final fory = Fory();
ModelsForyModule.register(fory, Address, id: 1);
ModelsForyModule.register(fory, User, id: 2);
```

也可以使用稳定名称代替数字 ID，这适合跨语言场景：

```dart
ModelsForyModule.register(
  fory,
  User,
  name: 'example.User',
);
```

如何在 ID 和名称之间选择参见[类型注册](type-registration.md)。

## Schema 演进：`evolving`

`@ForyStruct()` 默认使用 `evolving: true`，适合大多数应用。

- `evolving: true` — Fory 存储足够的元数据，使将来新增或删除字段后，新旧代码仍能交换消息。只要应用或服务的不同版本可能同时运行，就应启用此设置。
- `evolving: false` — 序列化更快、体积更小。仅当每个读取端和写入端始终使用相同 struct Schema 时才使用。

```dart
// evolving: true is the default, you can omit it
@ForyStruct(evolving: true)
class Event {
  Event();

  String name = '';
}
```

使用可演进 struct 时，请在发布首个载荷前通过 `@ForyField(id: ...)` 分配稳定字段 ID；Schema 变化后，Fory 通过这些 ID 匹配字段。

纳入的继承字段和直接字段共享同一个 ID 命名空间。不要在同一个子类 Schema 纳入的字段之间复用 ID。

## 选择生成序列化还是自定义序列化

当其他包的类公开匹配的公共 getter 和安全的公共构造路径时，请使用[外部结构化序列化器](external-types.md)。当编码主体、字段名称、值或构造需要自定义逻辑时，请使用[自定义序列化器](custom-serializers.md)。

## 相关主题

- [Struct 继承](inheritance.md)
- [类型注册](type-registration.md)
- [外部类型序列化](external-types.md)
- [Schema 元数据](schema-metadata.md)
- [Schema 演进](schema-evolution.md)
