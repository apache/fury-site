---
title: Dart 设置
sidebar_position: 9
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

Fory Dart 提供 xlang 对象序列化、生成的模型以及 Fory gRPC。它发布在 pub.dev，需要 Dart 3.7 或更高版本，并使用 `build_runner` 生成序列化器。

## 验证工具链

```bash
dart --version
dart pub --help
```

## 对象序列化

在 `pubspec.yaml` 中添加 Fory 和生成器：

```yaml
dependencies:
  fory: 1.5.0

dev_dependencies:
  build_runner: ^2.4.0
```

创建 `lib/person.dart`：

```dart
import 'package:fory/fory.dart';

part 'person.fory.dart';

@ForyStruct()
class Person {
  Person();

  @ForyField(type: Int64Type())
  int id = 0;
  String name = '';
}

void main() {
  final fory = Fory();
  PersonForyModule.register(fory, Person, name: 'example.Person');

  final input = Person()
    ..id = 1
    ..name = 'Alice';
  final bytes = fory.serialize(input);
  final decoded = fory.deserialize<Person>(bytes);
  print(decoded.name);
}
```

生成序列化器并运行示例：

```bash
dart pub get
dart run build_runner build
dart run lib/person.dart
```

Dart 使用 xlang 模式。接下来可阅读 [Dart 对象序列化](../object-serialization/dart/index.md)、[代码生成](../object-serialization/dart/code-generation.md)、[Web 支持](../object-serialization/dart/web-platform-support.md)和 [Schema 演进](../object-serialization/dart/schema-evolution.md)。

## 其他能力

- **Fory IDL 与编译器** 生成 Dart 模型和注册辅助代码。请参阅[编译器快速入门](../compiler/getting-started.md)和 [Dart 生成代码指南](../compiler/generated-code/dart.md)。
- **Fory gRPC** 通过 package:grpc 传输使用 Fory 编码的消息。请参阅 [Dart gRPC](../grpc/dart.md)。
