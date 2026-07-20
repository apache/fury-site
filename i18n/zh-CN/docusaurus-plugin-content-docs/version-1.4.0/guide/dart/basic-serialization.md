---
title: 基础序列化
sidebar_position: 2
id: dart_basic_serialization
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

本页介绍如何使用 Apache Fory™ Dart 对值进行序列化和反序列化。

## 创建 `Fory` 实例

创建一个实例并复用它。每次调用都新建 `Fory` 只会浪费资源。

```dart
import 'package:fory/fory.dart';

final fory = Fory();
```

## 序列化和反序列化带注解的类型

```dart
import 'package:fory/fory.dart';

part 'person.fory.dart';

@ForyStruct()
class Person {
  Person();

  String name = '';
  Int32 age = Int32(0);
}

void main() {
  final fory = Fory();
  PersonFory.register(
    fory,
    Person,
    namespace: 'example',
    typeName: 'Person',
  );

  final person = Person()
    ..name = 'Ada'
    ..age = Int32(36);

  final bytes = fory.serialize(person);
  final roundTrip = fory.deserialize<Person>(bytes);
  print(roundTrip.name);
}
```

`deserialize<T>` 会返回并转换为 `T` 的解码结果。如果载荷描述的类型与 `T` 不一致，就会抛出异常。

## Null 值

支持直接序列化 `null`：

```dart
final fory = Fory();
final bytes = fory.serialize(null);
final value = fory.deserialize<Object?>(bytes);
```

## 序列化集合和动态载荷

你可以直接序列化集合值：

```dart
final fory = Fory();
final bytes = fory.serialize(<Object?>[
  'hello',
  Int32(42),
  true,
]);
final value = fory.deserialize<List<Object?>>(bytes);
```

对于异构集合，请反序列化为 `Object?`、`List<Object?>` 或 `Map<Object?, Object?>`。

## 引用跟踪

默认情况下，Fory 不会跟踪对象标识。如果同一个对象在列表中出现两次，它会被序列化两次。当数据包含共享引用或循环结构时，请启用引用跟踪。

对于顶层集合：

```dart
final fory = Fory();
final shared = String.fromCharCodes('shared'.codeUnits);
final bytes = fory.serialize(<Object?>[shared, shared], trackRef: true);
final roundTrip = fory.deserialize<List<Object?>>(bytes);
print(identical(roundTrip[0], roundTrip[1])); // true
```

对于生成结构体中的字段，请改用该字段上的 `@ForyField(ref: true)`。

## 复用缓冲区

如果你想避免每次调用都分配新的 `Uint8List`，可以配合显式 `Buffer` 使用 `serializeTo` 和 `deserializeFrom`：

```dart
final fory = Fory();
final buffer = Buffer();

fory.serializeTo(Int32(42), buffer);
final value = fory.deserializeFrom<Int32>(buffer);
```

这是性能优化手段。对大多数应用来说，默认的 `serialize` / `deserialize` 就足够了。

## 在序列化前注册类型

在序列化自定义类或枚举之前，必须先把它注册到 `Fory` 中。生成代码会让这件事变得很简单：

```dart
PersonFory.register(
  fory,
  Person,
  id: 100,
);
```

如果跳过注册，运行时会得到 `Type ... is not registered` 错误。参见 [类型注册](type-registration.md) 和 [代码生成](code-generation.md)。

## 相关主题

- [配置](configuration.md)
- [类型注册](type-registration.md)
- [字段配置](schema-metadata.md)
