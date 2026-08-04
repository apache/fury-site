---
title: 外部类型序列化
sidebar_position: 9
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

外部类型序列化为其他 Dart 库或包拥有的类生成 Fory struct 序列化器。请定义包含相同字段的本地序列化器声明，并使用 `ForyStruct.target` 指定外部类。

## 定义外部结构化序列化器

假设某个依赖拥有以下类：

```dart
final class User {
  const User({
    required this.name,
    required this.age,
  });

  final String name;
  final int age;
}
```

在包中添加序列化器声明：

```dart
import 'package:fory/fory.dart';
import 'package:third_party/models.dart' as third_party;

part 'external_serializers.fory.dart';

@ForyStruct(target: third_party.User)
abstract final class UserSerializer {
  @ForyField(id: 1)
  late final String name;

  @ForyField(id: 2, type: Int32Type())
  late final int age;
}
```

声明必须是 `abstract final`，不能包含类型参数，并且必须将每个 Schema 字段声明为不带初始化器的 `late final`。每个序列化字段的名称和 Dart 类型（包括可空性和泛型参数）都必须与目标上可访问的 getter 完全匹配。

声明的字段列表就是完整的外部 Schema。Fory 不会自动添加目标、其父类或其 mixin 中的字段。可以像声明其他 Schema 字段一样，显式声明可访问的继承目标属性。`exposePrivateFields` 和 `ignoreInheritedPrivateFields` 仅适用于普通 Dart 继承层次，不能与 `ForyStruct.target` 一起使用。

公共目标字段会自动计入对象图内存预算，但该计算不会将它们添加到序列化 Schema。请在额外声明字段上使用 `@ForyField(ignore: true)`，以便将其他存储计入预算而不序列化。

照常运行生成器：

```bash
dart run build_runner build
```

## 注册并使用目标

通过生成模块注册外部目标：

```dart
final fory = Fory();
ExternalSerializersForyModule.register(
  fory,
  third_party.User,
  name: 'example.User',
);

final bytes = fory.serialize(
  const third_party.User(name: 'Ada', age: 36),
);
final user = fory.deserialize<third_party.User>(bytes);
```

数字 ID 的用法相同：

```dart
ExternalSerializersForyModule.register(
  fory,
  third_party.User,
  id: 100,
);
```

注册目标 `third_party.User`，不要注册 `UserSerializer`。

## 构造函数和可变目标

未指定 `constructor` 选项时，代码生成使用目标的公共未命名生成式构造函数。构造函数参数按名称映射到 Schema 字段，并且必须使用完全相同的 Dart 类型。

例如，假设依赖公开以下不可变类：

```dart
final class Money {
  const Money.fromParts({
    required this.currency,
    required this.units,
  });

  final String currency;
  final int units;
}
```

在序列化器声明中选择其公共具名生成式构造函数：

```dart
@ForyStruct(
  target: third_party.Money,
  constructor: 'fromParts',
)
abstract final class MoneySerializer {
  late final String currency;

  @ForyField(type: Int64Type())
  late final int units;
}
```

解码字段后，生成的序列化器会调用 `third_party.Money.fromParts(currency: ..., units: ...)`。

对于可变目标，使用不含必需参数的公共生成式构造函数并提供匹配 setter，Fory 就能先构造目标，再为字段赋值。启用引用跟踪时，这也支持循环引用。例如，假设依赖公开：

```dart
final class Node {
  Node.empty();

  late String label;
  Node? next;
}
```

在序列化器声明中选择 `Node.empty`：

```dart
@ForyStruct(
  target: third_party.Node,
  constructor: 'empty',
)
abstract final class NodeSerializer {
  late final String label;

  @ForyField(ref: true)
  late final third_party.Node? next;
}
```

生成的序列化器可以调用 `third_party.Node.empty()`，发布新节点用于引用跟踪，然后为 `label` 和 `next` 赋值。

基于构造函数的目标无法解码静态已知、启用引用跟踪并返回自身的路径，因为读取完构造函数参数之前目标并不存在。这包括将目标嵌套为 `List` 或 `Set` 元素，或作为 `Map` key 或 value。代码生成会拒绝这些 Schema。需要循环引用时，请使用可变两阶段目标或自定义序列化器。对于基于构造函数的目标，也不支持无法从声明中确定的间接循环。

工厂构造函数、私有构造函数、抽象目标、外部 enum、外部 union、record、扩展类型和内置集合类型不能作为外部 struct 目标。

## 字段和集合

注册后，普通已注册 struct 可以使用的任何位置都可以使用该目标。包含它的生成类无需选择序列化器声明：

```dart
@ForyStruct()
final class Group {
  Group();

  third_party.User? owner;

  @ListField(element: DeclaredType())
  List<third_party.User> users = <third_party.User>[];

  @MapField(value: DeclaredType())
  Map<String, third_party.User> usersByName =
      <String, third_party.User>{};
}
```

嵌套 list、set 和 map 会递归解析已注册目标。动态字段和异构集合也会按注册类型解析每个具体目标：

```dart
@ForyField(dynamic: true)
Object? value;
```

注册每个可能动态出现的具体外部类型。

非空根 list、set 和 map 会将其元素、key 和 value 解码为已注册外部目标。Dart 根集合保留现有运行时结构，因此请将根集合作为 `Object?` 读取，再转换其外层载体：

```dart
final decoded =
    fory.deserialize<Object?>(
          fory.serialize(<third_party.User>[user]),
        )
        as List<Object?>;
final first = decoded.first as third_party.User;
```

空根集合不包含元素类型标识。

## 封闭泛型目标

假设依赖公开以下泛型类：

```dart
final class Box<T> {
  const Box(this.value);

  final T value;
}
```

`Box<T>` 是开放类型，因为 `T` 尚未解析。提供 `Box<String>` 等具体类型参数后，会生成代码生成可以分析的封闭泛型实例：

```dart
@ForyStruct(target: third_party.Box<String>)
abstract final class StringBoxSerializer {
  late final String value;
}
```

生成的序列化器使用 `third_party.Box<String>(...)` 重建值，并且只适用于 `Box<String>`。请直接注册和使用该精确目标类型：

```dart
final fory = Fory();
ExternalSerializersForyModule.register(
  fory,
  third_party.Box<String>,
  id: 102,
);

final input = const third_party.Box<String>('hello');
final bytes = fory.serialize(input);
final output = fory.deserialize<third_party.Box<String>>(bytes);

print(output.value); // hello
```

注册 `third_party.Box<String>`，不要注册 `StringBoxSerializer`。`Box<int>` 等其他实例需要自己的序列化器声明和注册；一个声明不会覆盖每个 `Box<T>`。

## Schema 演进

`evolving` 和字段 ID 的工作方式与普通生成 struct 完全相同：

```dart
@ForyStruct(
  target: third_party.User,
  evolving: true,
)
abstract final class UserSerializer {
  @ForyField(id: 1)
  late final String name;
}
```

跨通信方保持字段 ID 和已注册类型标识稳定。字段名称仍必须与本地目标类上的对应属性匹配。

## 何时使用自定义序列化器

当目标需要自定义编码主体、字段名称转换、值转换、只能通过工厂构造、私有状态，或任何无法通过匹配公共 getter、构造函数参数和 setter 表达的重建规则时，请使用[自定义序列化器](custom-serializers.md)。

## 相关主题

- [Struct 继承](inheritance.md)
- [代码生成](code-generation.md)
- [类型注册](type-registration.md)
- [Schema 元数据](schema-metadata.md)
- [Schema 演进](schema-evolution.md)
- [自定义序列化器](custom-serializers.md)
