---
title: Dart
sidebar_position: 10
id: dart
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

Dart 为每个 Schema 输出两个文件：包含注解类型和 IDL 模块所有者的主 `.dart` 文件，以及包含生成序列化器和元数据的 `.fory.dart` part 文件。

- `<dart_out>/package/package.dart`
- `<dart_out>/package/package.fory.dart`

## 类型生成

消息生成带 `@ForyStruct` 注解的 `final class` 声明，每个字段都带有 `@ForyField`：

```dart
@ForyStruct()
final class Person {
  Person();

  @ForyField(id: 1)
  String name = '';

  @ForyField(id: 2, type: Int32Type())
  int id = 0;

  @ForyField(id: 7)
  List<Person_PhoneNumber> phones = <Person_PhoneNumber>[];

  @ForyField(id: 8)
  Animal pet = Animal._empty();
}
```

枚举生成 Dart `enum` 声明，并提供 `rawValue` getter 和 `fromRawValue` 工厂：

```dart
enum Person_PhoneType {
  mobile,
  home,
  work;

  int get rawValue => switch (this) {
    Person_PhoneType.mobile => 0,
    Person_PhoneType.home => 1,
    Person_PhoneType.work => 2,
  };

  static Person_PhoneType fromRawValue(int value) => switch (value) {
    0 => Person_PhoneType.mobile,
    1 => Person_PhoneType.home,
    2 => Person_PhoneType.work,
    _ => throw StateError('Unknown Person_PhoneType raw value $value.'),
  };
}
```

联合生成带 `@ForyUnion` 注解的类，其中包含工厂构造函数、case 枚举和自定义序列化器：

```dart
enum AnimalCase {
  dog,
  cat;

  int get id => switch (this) {
    AnimalCase.dog => 1,
    AnimalCase.cat => 2,
  };
}

@ForyUnion()
final class Animal {
  final AnimalCase _case;
  final Object? _value;

  const Animal._(this._case, this._value);

  factory Animal.dog(Dog value) => Animal._(AnimalCase.dog, value);
  factory Animal.cat(Cat value) => Animal._(AnimalCase.cat, value);

  bool get isDog => _case == AnimalCase.dog;
  Dog get dogValue => _value as Dog;
  // ...
}
```

嵌套类型使用扁平下划线命名（例如 `Person_PhoneNumber`、`Person_PhoneType`）。

`list<T>` 字段生成有序集合载体并使用 Fory list 协议。`array<T>` 字段生成一维稠密 bool
或数值载体，并使用专用稠密数组协议。生成的代码不得仅仅因为某种语言具有优化的类 list
载体就选择 `array<T>`；Schema 种类来自 IDL。

| IDL Schema          | Dart 生成的载体 | 说明                       |
| ------------------- | --------------- | -------------------------- |
| `list<int32>`       | `List<int>`     | List 协议，varint 元素编码 |
| `list<fixed int32>` | `List<int>`     | List 协议，固定宽度元素段  |
| `array<bool>`       | `BoolList`      | 每个 bool 一个字节         |
| `array<int8>`       | `Int8List`      | 稠密有符号字节             |
| `array<int16>`      | `Int16List`     | 稠密小端 int16             |
| `array<int32>`      | `Int32List`     | 稠密小端 int32             |
| `array<int64>`      | `Int64List`     | 稠密小端 int64             |
| `array<uint8>`      | `Uint8List`     | 稠密无符号字节             |
| `array<uint16>`     | `Uint16List`    | 稠密小端 uint16            |
| `array<uint32>`     | `Uint32List`    | 稠密小端 uint32            |
| `array<uint64>`     | `Uint64List`    | 稠密小端 uint64            |
| `array<float16>`    | `Float16List`   | 稠密 binary16 存储         |
| `array<bfloat16>`   | `Bfloat16List`  | 稠密 bfloat16 存储         |
| `array<float32>`    | `Float32List`   | 稠密小端 float32           |
| `array<float64>`    | `Float64List`   | 稠密小端 float64           |

使用 `ArrayType(element: BoolType())` 的生成 Dart 字段必须使用 `BoolList`；普通
`List<bool>` 仍是 `list<bool>` 的生成和手写载体。

list 元素或 map 值的引用跟踪使用容器语法糖注解：

```dart
@ListField(element: DeclaredType(ref: true))
@ForyField(id: 3)
List<Node> children = <Node>[];

@MapField(value: DeclaredType(ref: true))
@ForyField(id: 2)
Map<String, Node> byName = <String, Node>{};
```

## 模块安装

每个生成的 Dart IDL 库都包含根据输入文件命名的模块所有者，例如 `AddressbookForyModule`
对应 `addressbook.dart`。该模块先安装导入的模块，再使用默认 IDL 身份注册每个本地
Schema 类型：

```dart
abstract final class AddressbookForyModule {
  static void install(Fory fory) {
    complex_pb.ComplexPbForyModule.install(fory);
    _registerType(fory, Person);
    _registerType(fory, Dog);
  }

  static Fory getFory() { ... }

  static void _registerType(Fory fory, Type type) {
    if (type == Person) {
      registerGeneratedStruct(fory, _personForySchema, id: 100, namespace: null, typeName: null);
      return;
    }
    // ... other types
  }
}
```

## 使用方式

```dart
import 'package:fory/fory.dart';
import 'generated/addressbook/addressbook.dart';

void main() {
  final fory = Fory();
  AddressbookForyModule.install(fory);

  final person = Person()
    ..name = 'Alice'
    ..id = 1;

  final bytes = fory.serialize(person);
  final roundTrip = fory.deserialize<Person>(bytes);
}
```

## gRPC 服务配套代码

使用 `--grpc` 时，Dart 为每个 Schema 生成一个 `<stem>_grpc.dart`，其中包含 `<Service>Client` 和 `<Service>ServiceBase`。服务基类会注册自己的方法描述符，因此不会生成单独的 registrar。生成模块命名、Fory 安装和使用方式请参阅 [Dart gRPC](../../grpc/dart.md)。
