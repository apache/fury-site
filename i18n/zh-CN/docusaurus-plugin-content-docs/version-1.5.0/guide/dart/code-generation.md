---
title: 代码生成
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

Fory 会在构建阶段为你的 Dart 类生成高性能序列化代码。你只需要给模型加注解、运行 `build_runner`，剩下的由 Fory 处理。

## 第一步：给模型加注解

为每个需要序列化的类添加 `@ForyStruct()`。同时在文件顶部加入生成的 `part` 指令。

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

定义在同一文件中的枚举会自动包含到生成的注册代码里。

对于其他库拥有的类，请使用 `@ForyStruct(target: ExternalType)` 定义
[外部结构化序列化器](external-types.md)。

## 继承字段

普通的 `@ForyStruct()` 会把具体父类和所应用 mixin 中的字段展平到同一个
子类 Schema 中。父类中的 public 继承字段无需添加注解。

有关 private 字段、`ignoreInheritedPrivateFields`、跨库访问、构造函数、
mixin 和 Schema 兼容性的说明，请参阅[结构体继承](inheritance.md)。

## 第二步：运行生成器

在包含 `pubspec.yaml` 的目录下运行：

```bash
dart run build_runner build
```

这会在源文件旁边生成一个 `.fory.dart` 文件。每当新增或重命名带注解的类型、
改变继承层次中的存储、改变暴露边界或修改 `ignoreInheritedPrivateFields` 时，
都需要重新运行此命令。

## 第三步：注册并使用

生成器会创建一个以源文件命名的 Fory 模块类，并提供 `register` 函数。请在序列化前调用它：

```dart
final fory = Fory();
ModelsForyModule.register(fory, Address, id: 1);
ModelsForyModule.register(fory, User, id: 2);
```

也可以用稳定名称代替数字 ID，这在跨语言场景中更有用：

```dart
ModelsForyModule.register(
  fory,
  User,
  name: 'example.User',
);
```

关于如何在 ID 和名称之间做选择，见 [类型注册](type-registration.md)。

## Schema 演进：`evolving`

`@ForyStruct()` 默认使用 `evolving: true`，这对大多数应用都是正确选择。

- `evolving: true`：Fory 会保存足够的元信息，因此当你之后新增或删除字段时，旧代码与新代码仍然可以交换消息。只要你的应用或服务可能存在多个版本同时运行，就应该启用它。
- `evolving: false`：序列化速度更快，体积也更小。只有在所有读端和写端始终使用相同结构体 Schema 时才能使用。

```dart
// evolving: true 是默认值，可以省略
@ForyStruct(evolving: true)
class Event {
  Event();

  String name = '';
}
```

使用 evolving 结构体时，也要在首次对外发送载荷之前通过 `@ForyField(id: ...)` 为字段分配稳定 ID，因为 Fory 会依赖这些 ID 在 Schema 变化后匹配字段。

被包含的继承字段和直接字段共享同一个 ID 命名空间。不要为同一子类 Schema
中的字段重复使用 ID。

## 选择生成序列化还是自定义序列化

如果另一个包中的类提供了匹配的 public getter 和安全的 public 构造路径，
请使用[外部结构化序列化器](external-types.md)。如果需要自定义编码数据体、
字段名、字段值或构造逻辑，请使用[自定义序列化器](custom-serializers.md)。

## 相关主题

- [结构体继承](inheritance.md)
- [类型注册](type-registration.md)
- [外部类型序列化](external-types.md)
- [Schema 元信息](schema-metadata.md)
- [Schema 演进](schema-evolution.md)
