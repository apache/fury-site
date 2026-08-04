---
title: 基本序列化
sidebar_position: 2
id: core-api
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

本页介绍如何使用 Apache Fory™ Dart 序列化和反序列化值。

## 创建 `Fory` 实例

创建并复用一个实例；每次调用都创建新的 `Fory` 会浪费资源。

```dart
import 'package:fory/fory.dart';

final fory = Fory();
```

## 序列化和反序列化带注解类型

```dart
import 'package:fory/fory.dart';

part 'person.fory.dart';

@ForyStruct()
class Person {
  Person();

  String name = '';

  @ForyField(type: Int32Type())
  int age = 0;
}

void main() {
  final fory = Fory();
  PersonForyModule.register(
    fory,
    Person,
    name: 'example.Person',
  );

  final person = Person()
    ..name = 'Ada'
    ..age = 36;

  final bytes = fory.serialize(person);
  final roundTrip = fory.deserialize<Person>(bytes);
  print(roundTrip.name);
}
```

`deserialize<T>` 返回转换为 `T` 的解码值。如果载荷描述的类型与 `T` 不同，它会抛出异常。

## Null 值

支持直接序列化 `null`：

```dart
final fory = Fory();
final bytes = fory.serialize(null);
final value = fory.deserialize<Object?>(bytes);
```

## 序列化集合和动态载荷

可以直接序列化集合值：

```dart
final fory = Fory();
final bytes = fory.serialize(<Object?>[
  'hello',
  42,
  true,
]);
final value = fory.deserialize<List<Object?>>(bytes);
```

对于异构集合，请反序列化为 `Object?`、`List<Object?>` 或 `Map<Object?, Object?>`。

## 引用跟踪

默认情况下，Fory 不跟踪对象标识；如果同一个对象在列表中出现两次，它会被序列化两次。当数据包含共享引用或循环结构时，请启用引用跟踪。

对于顶层集合：

```dart
final fory = Fory();
final shared = String.fromCharCodes('shared'.codeUnits);
final bytes = fory.serialize(<Object?>[shared, shared], trackRef: true);
final roundTrip = fory.deserialize<List<Object?>>(bytes);
print(identical(roundTrip[0], roundTrip[1])); // true
```

对于生成 struct 内的字段，请改为在该字段上使用 `@ForyField(ref: true)`。

## 复用缓冲区

如果希望避免每次调用都分配新的 `Uint8List`，请将 `serializeTo` 和 `deserializeFrom` 与显式 `Buffer` 配合使用：

```dart
final fory = Fory();
final buffer = Buffer();

fory.serializeTo('Ada', buffer);
final value = fory.deserializeFrom<String>(buffer);
```

这是一项优化。对于大多数应用，默认的 `serialize`/`deserialize` 组合已经足够。

## 序列化前注册类型

序列化自定义 class 或 enum 前，需要向 `Fory` 注册。生成代码可以简化此操作：

```dart
PersonForyModule.register(
  fory,
  Person,
  id: 100,
);
```

如果跳过注册，反序列化会以 `Type ... is not registered` 失败。参见[类型注册](type-registration.md)和[代码生成](code-generation.md)。

## 相关主题

- [配置](configuration.md)
- [类型注册](type-registration.md)
- [Schema 元数据](schema-metadata.md)
