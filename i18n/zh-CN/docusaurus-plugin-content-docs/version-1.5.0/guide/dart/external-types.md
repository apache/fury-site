---
title: 外部类型序列化
sidebar_position: 5
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

外部类型序列化可以为其他 Dart 库或 package 所拥有的类生成 Fory 结构体序列化器。
在本地定义一个具有相同字段的序列化器声明，并通过 `ForyStruct.target` 指定外部类。

## 定义外部结构体序列化器 {#define-an-external-structural-serializer}

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

在你的 package 中添加序列化器声明：

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

该声明必须是 `abstract final`，不能带类型参数，并且必须将每个 Schema 字段声明为
没有初始化器的 `late final`。每个序列化字段的名称和 Dart 类型，包括可空性与泛型参数，
都必须与目标上可访问的 getter 完全匹配。

声明中的字段列表就是完整的外部 Schema。Fory 不会自动加入目标、其超类或 mixin 中的字段。
你可以像声明其他 Schema 字段一样，显式声明目标上可访问的继承属性。
`exposePrivateFields` 和 `ignoreInheritedPrivateFields` 仅适用于普通 Dart 继承层次，
不能与 `ForyStruct.target` 一起使用。

目标的公共字段会自动计入对象图内存限制，但该统计不会把它们加入序列化 Schema。
如果需要统计其他存储但不进行序列化，可在额外的声明字段上使用
`@ForyField(ignore: true)`。

像往常一样运行生成器：

```bash
dart run build_runner build
```

## 注册并使用目标类型 {#register-and-use-the-target}

通过生成的模块注册外部目标类型：

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

应注册目标类型 `third_party.User`，而不是 `UserSerializer`。

## 构造函数与可变目标类型 {#constructors-and-mutable-targets}

如果未指定 `constructor` 选项，代码生成会使用目标类型的公共未命名生成式构造函数。
构造函数参数按名称映射到 Schema 字段，并且必须使用完全相同的 Dart 类型。

例如，假设依赖公开了以下不可变类：

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

在序列化器声明中选择其公共命名生成式构造函数：

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

字段解码完成后，生成的序列化器会调用
`third_party.Money.fromParts(currency: ..., units: ...)`。

对于可变目标类型，使用一个没有必需参数的公共生成式构造函数，并提供匹配的 setter，
即可让 Fory 先构造目标对象，再给字段赋值。启用引用跟踪后，这种方式还支持循环引用。
例如，假设依赖公开了以下类型：

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

生成的序列化器可以调用 `third_party.Node.empty()`，发布新节点供引用跟踪使用，
然后为 `label` 和 `next` 赋值。

基于构造函数的目标类型无法解码静态已知且启用了引用跟踪、最终指回自身的路径，
因为读取完构造函数参数之前目标对象尚不存在。这也包括目标类型作为 `List` 或 `Set`
的元素，或者作为 `Map` 的键或值进行嵌套的情况。代码生成会拒绝这类 Schema。
需要循环引用时，请使用可变的两阶段目标类型或自定义序列化器。
对于基于构造函数的目标类型，从声明中无法确定的间接循环同样不受支持。

工厂构造函数、私有构造函数、抽象目标类型、外部枚举、外部联合类型、record、
扩展类型以及内置集合类型都不能作为外部结构体目标类型。

## 字段与集合 {#fields-and-collections}

注册后，目标类型可以用在普通已注册结构体能够出现的任何位置。
包含该目标类型的生成类不需要选择序列化器声明：

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

嵌套的 list、set 和 map 会递归解析已注册的目标类型。
动态字段和异构集合也会通过已注册类型解析每个具体目标类型：

```dart
@ForyField(dynamic: true)
Object? value;
```

请注册所有可能动态出现的具体外部类型。

非空的根 list、set 和 map 会将其元素、键和值解码为已注册的外部目标类型。
Dart 根集合会保留其现有运行时形态，因此请先将根集合读取为 `Object?`，
再转换其最外层容器：

```dart
final decoded =
    fory.deserialize<Object?>(
          fory.serialize(<third_party.User>[user]),
        )
        as List<Object?>;
final first = decoded.first as third_party.User;
```

空的根集合不包含元素类型身份。

## 闭合泛型目标类型 {#closed-generic-targets}

假设依赖公开了以下泛型类：

```dart
final class Box<T> {
  const Box(this.value);

  final T value;
}
```

由于 `T` 尚未解析，`Box<T>` 是开放泛型。提供具体类型参数（例如 `Box<String>`）
后，会得到代码生成可以分析的闭合泛型实例：

```dart
@ForyStruct(target: third_party.Box<String>)
abstract final class StringBoxSerializer {
  late final String value;
}
```

生成的序列化器使用 `third_party.Box<String>(...)` 重建值，
并且仅适用于 `Box<String>`。请直接注册并使用这个精确的目标类型：

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

应注册 `third_party.Box<String>`，而不是 `StringBoxSerializer`。
其他实例（例如 `Box<int>`）需要单独的序列化器声明与注册；
一个声明不会覆盖所有 `Box<T>`。

## Schema 演进 {#schema-evolution}

`evolving` 和字段 ID 的行为与普通生成结构体完全相同：

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

请在通信各端之间保持字段 ID 和已注册类型身份稳定。
字段名仍然必须与本地目标类上的相应属性匹配。

## 何时使用自定义序列化器 {#when-to-use-a-custom-serializer}

如果目标类型需要自定义编码主体、字段名转换、值转换、只能通过工厂构造、
包含私有状态，或者需要任何无法通过匹配公共 getter、构造函数参数和 setter
表达的重建规则，请使用[自定义序列化器](custom-serializers.md)。

## 相关主题 {#related-topics}

- [结构体继承](inheritance.md)
- [代码生成](code-generation.md)
- [类型注册](type-registration.md)
- [Schema 元信息](schema-metadata.md)
- [Schema 演进](schema-evolution.md)
- [自定义序列化器](custom-serializers.md)
