---
title: Dart 序列化指南
sidebar_position: 0
id: dart_serialization_index
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

Apache Fory™ Dart 可以把 Dart 对象序列化为字节，再从字节反序列化回来，并且支持与 Java、Go、C#、Python 以及其他 Fory 支持语言编写的服务进行互通。

## 为什么选择 Fory Dart？

- **跨语言**：在 Dart 中序列化，在 Java、Go、C# 等语言中反序列化，无需额外胶水代码
- **高性能**：生成的序列化代码会替代运行时反射
- **Schema 演进**：可以新增或删除字段，而不破坏已有消息
- **循环引用**：可选的引用跟踪可处理共享或递归对象图
- **逃生口**：对任何无法加注解的类型，你都可以手写序列化器

## 快速开始

### 要求

- Dart SDK 3.6 或更高版本
- `build_runner`，用于生成序列化代码

### 安装

把依赖加入你的 `pubspec.yaml`：

```yaml
dependencies:
  fory: ^1.4.0

dev_dependencies:
  build_runner: ^2.4.0
```

### 基础示例

定义模型，先运行一次生成器，然后进行序列化：

```dart
import 'package:fory/fory.dart';

part 'person.fory.dart';

enum Color {
  red,
  blue,
}

@ForyStruct()
class Person {
  Person();

  String name = '';
  Int32 age = Int32(0);
  Color favoriteColor = Color.red;
  List<String> tags = <String>[];
}

void main() {
  final fory = Fory();
  PersonFory.register(
    fory,
    Color,
    namespace: 'example',
    typeName: 'Color',
  );
  PersonFory.register(
    fory,
    Person,
    namespace: 'example',
    typeName: 'Person',
  );

  final person = Person()
    ..name = 'Ada'
    ..age = Int32(36)
    ..favoriteColor = Color.blue
    ..tags = <String>['engineer', 'mathematician'];

  final bytes = fory.serialize(person);
  final roundTrip = fory.deserialize<Person>(bytes);
  print(roundTrip.name);
}
```

在运行程序之前，先生成配套文件：

```bash
dart run build_runner build --delete-conflicting-outputs
```

`PersonFory` 由 `build_runner` 生成。`namespace` 和 `typeName` 是其他语言中的对端识别同一类型的方式，一旦服务进入生产环境，就应保持稳定。

## API 概览

- `Fory(...)`：创建序列化实例；创建一次并复用
- `fory.serialize(value)`：返回 `Uint8List` 字节
- `fory.deserialize<T>(bytes)`：返回一个 `T`
- `@ForyStruct()`：标记需要生成代码的类
- `@ForyField(...)`：字段级选项，例如跳过、ID、可空性、引用
- 整数包装类型：`Int8`、`Int16`、`Int32`、`UInt8`、`UInt16`、`UInt32`
- 浮点包装类型：`Float16`、`Float32`
- 时间包装类型：`LocalDate`、`Timestamp`

## 文档

| 主题                                          | 说明                                 |
| --------------------------------------------- | ------------------------------------ |
| [配置](configuration.md)                      | 运行时选项、兼容模式和安全限制       |
| [基础序列化](basic-serialization.md)          | `serialize`、`deserialize`、生成注册、根对象图 |
| [代码生成](code-generation.md)                | `@ForyStruct`、build runner 和生成命名空间 |
| [类型注册](type-registration.md)              | 基于 ID 与基于名称的注册，以及注册规则 |
| [自定义序列化器](custom-serializers.md)       | 手写 `Serializer<T>` 实现与 union    |
| [字段配置](schema-metadata.md)            | `@ForyField`、字段 ID、可空性、引用、多态 |
| [支持的类型](supported-types.md)              | 内置 xlang 值、包装类型、集合和结构体 |
| [Schema 演进](schema-evolution.md)            | 兼容结构体与可演进 Schema            |
| [跨语言](xlang-serialization.md)                   | 互操作规则与字段对齐                 |
| [故障排查](troubleshooting.md)                | 常见错误、诊断方法和验证步骤         |

## 相关资源

- [Xlang 序列化规范](../../specification/xlang_serialization_spec.md)
- [Xlang 实现指南](../../specification/xlang_implementation_guide.md)
- [跨语言指南](../xlang/index.md)
- [Dart 运行时源码目录](https://github.com/apache/fory/tree/main/dart)
