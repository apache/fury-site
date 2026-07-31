---
title: Dart 序列化指南
sidebar_position: 0
id: serialization_index
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

Apache Fory™ Dart 可以把 Dart 对象序列化为字节，再从字节反序列化回来，
并且支持与 Java、Python、C++、Go、Rust、JavaScript/TypeScript、C#、
Swift、Scala、Kotlin 以及其他 Fory 支持语言编写的服务进行互通。

## 为什么选择 Fory Dart？

- **跨语言**：在 Dart 中序列化，在 Java、Go、C# 等语言中反序列化，无需额外胶水代码
- **平台支持**：在 Dart VM/AOT、Flutter 和 Web 平台上使用相同的生成序列化器 API
- **高性能**：生成的序列化代码会替代运行时反射
- **继承**：普通结构体会把具体父类和 mixin 中的存储展平到同一个 Schema 中
- **Schema 演进**：可以新增或删除字段，而不破坏已有消息
- **循环引用**：可选的引用跟踪可处理共享或递归对象图
- **自定义扩展**：对任何无法加注解的类型，都可以编写自定义序列化器

## 快速开始

### 要求

- Dart SDK 3.7 或更高版本
- `build_runner`，用于生成序列化代码

### 安装

把依赖加入你的 `pubspec.yaml`：

```yaml
dependencies:
  fory: ^1.5.0

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

  @ForyField(type: Int32Type())
  int age = 0;
  Color favoriteColor = Color.red;
  List<String> tags = <String>[];
}

void main() {
  final fory = Fory();
  PersonForyModule.register(
    fory,
    Color,
    name: 'example.Color',
  );
  PersonForyModule.register(
    fory,
    Person,
    name: 'example.Person',
  );

  final person = Person()
    ..name = 'Ada'
    ..age = 36
    ..favoriteColor = Color.blue
    ..tags = <String>['engineer', 'mathematician'];

  final bytes = fory.serialize(person);
  final roundTrip = fory.deserialize<Person>(bytes);
  print(roundTrip.name);
}
```

在运行程序之前，先生成配套文件：

```bash
dart run build_runner build
```

`PersonForyModule` 由 `build_runner` 生成。其他语言中的对端通过 `name`
识别同一类型，因此服务进入生产环境后应保持该值稳定。可以在 `name` 中使用 `.`
添加命名空间前缀。

普通的带注解类会包含其具体父类和所应用 mixin 中的存储。public 继承字段和
同一库中的 private 继承字段无需在父类上添加注解。有关 private 字段、构造函数、
mixin 和字段包含选项的说明，请参阅[结构体继承](inheritance.md)。

## API 概览

- `Fory(...)`：创建序列化实例；创建一次并复用
- `fory.serialize(value)`：返回 `Uint8List` 字节
- `fory.deserialize<T>(bytes)`：返回一个 `T`
- `@ForyStruct()`：标记需要生成代码的类
- `@ForyStruct(exposePrivateFields: true)`：允许另一个库生成的子类序列化器访问本库拥有的 private 状态
- `@ForyStruct(ignoreInheritedPrivateFields: true)`：从当前具体子类的 Schema 中排除父类和所应用 mixin 的全部 private 存储
- `@ForyStruct(target: Type)`：生成外部结构化序列化器
- `@ForyField(...)`：字段级选项以及规范的 `type:` 覆盖
- `@ListField(...)`、`@SetField(...)`、`@MapField(...)`：用于嵌套 `type:` 树的容器简写
- 精确值包装类型：`Int64`、`Uint64`、`Float32`
- 低精度标量字段：配合 `Float16Type` 或 `Bfloat16Type` 使用的 `double`
- 16 位浮点数组：`Float16List`、`Bfloat16List`
- 时间类型：`LocalDate`、`Timestamp`、`Duration`

## 文档

| 主题                                          | 说明                                                      |
| --------------------------------------------- | --------------------------------------------------------- |
| [配置](configuration.md)                      | Fory 选项、兼容模式和安全限制                             |
| [基础序列化](basic-serialization.md)          | `serialize`、`deserialize`、生成式注册和根对象图          |
| [代码生成](code-generation.md)                | `@ForyStruct`、build runner 和生成的模块                   |
| [结构体继承](inheritance.md)                  | 父类、mixin、private 字段和构造函数                       |
| [外部类型序列化](external-types.md)           | 为其他包拥有的类生成序列化器                              |
| [跨语言序列化](xlang-serialization.md)        | 互操作规则和字段对齐                                      |
| [Schema 元信息](schema-metadata.md)           | `@ForyField`、字段 ID、可空性、引用和多态                 |
| [类型注册](type-registration.md)              | 基于 ID 与基于名称的注册及其规则                          |
| [自定义序列化器](custom-serializers.md)       | 自定义 `Serializer<T>` 实现和联合类型                     |
| [支持的类型](supported-types.md)              | 内置 xlang 值、包装类型、集合和结构体                     |
| [Schema 演进](schema-evolution.md)            | 兼容结构体和可演进 Schema                                 |
| [Web 平台支持](web-platform-support.md)       | Dart VM/AOT、Flutter 和 Web 支持、限制及验证               |
| [gRPC 支持](grpc-support.md)                  | 基于 Fory 生成的 gRPC 服务配套代码                        |
| [故障排查](troubleshooting.md)                | 常见错误、诊断和验证步骤                                  |

## 相关资源

- [Xlang 序列化规范](../../specification/xlang_serialization_spec.md)
- [Xlang 实现指南](../../specification/xlang_implementation_guide.md)
- [跨语言指南](../xlang/index.md)
- [Dart 运行时源码目录](https://github.com/apache/fory/tree/main/dart)
