---
title: Dart 对象序列化
sidebar_position: 0
id: index
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

Apache Fory™ Dart 可以将 Dart 对象序列化为字节并反序列化，也能跨使用 Java、Python、C++、Go、Rust、JavaScript/TypeScript、C#、Swift、Scala、Kotlin 及其他 Fory 支持语言编写的服务使用。

## 为什么选择 Fory Dart？

- **跨语言**：在 Dart 中序列化，在 Java、Go、C# 等语言中反序列化，无需编写粘合代码
- **平台支持**：在 Dart VM/AOT、Flutter 和 Web 上使用相同的生成序列化器 API
- **快速**：序列化期间使用生成的序列化器代码替代反射
- **继承**：普通 struct 将具体父类和 mixin 存储展平到一个 Schema 中
- **Schema 演进**：新增或删除字段而不破坏现有消息
- **循环引用**：可选引用跟踪可以处理共享引用或递归对象图
- **扩展途径**：为任何无法添加注解的类型编写自定义序列化器

## 快速入门

### 环境要求

- Dart SDK 3.7 或更高版本
- `build_runner`（生成序列化器代码）

### 安装

将依赖添加到 `pubspec.yaml`：

```yaml
dependencies:
  fory: ^1.7.1

dev_dependencies:
  build_runner: ^2.4.0
```

### 基本示例

定义模型，运行一次生成器，然后序列化：

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

运行程序前生成配套文件：

```bash
dart run build_runner build
```

`PersonForyModule` 由 `build_runner` 生成。其他语言的通信方通过 `name` 值标识同一类型；服务投入生产后请保持该值稳定。使用 `.` 在 `name` 中添加命名空间前缀。

普通带注解类会纳入其具体父类和应用的 mixin 存储。公共继承字段和同库私有继承字段无需为父类添加注解。私有字段、构造函数、mixin 和字段纳入选项参见 [Struct 继承](inheritance.md)。

## API 概览

- `Fory(...)` — 创建序列化器实例；创建一次并复用
- `fory.serialize(value)` — 返回 `Uint8List` 字节
- `fory.deserialize<T>(bytes)` — 返回 `T`
- `@ForyStruct()` — 标记需要代码生成的类
- `@ForyStruct(exposePrivateFields: true)` — 允许其他库生成的子序列化器访问本库拥有的私有状态
- `@ForyStruct(ignoreInheritedPrivateFields: true)` — 从当前具体子类的 Schema 中省略父类和所应用 mixin 的所有私有存储
- `@ForyStruct(target: Type)` — 生成外部结构化序列化器
- `@ForyField(...)` — 字段级选项和规范的 `type:` 覆盖
- `@ListField(...)`、`@SetField(...)`、`@MapField(...)` — 用于嵌套 `type:` 树的容器简写
- 精确值包装器：`Int64`、`Uint64`、`Float32`
- 低精度标量字段：将 `double` 与 `Float16Type` 或 `Bfloat16Type` 结合使用
- 16 位浮点数组：`Float16List`、`Bfloat16List`
- 时间类型：`LocalDate`、`Timestamp`、`Duration`

## 文档

| 主题                                    | 说明                                           |
| --------------------------------------- | ---------------------------------------------- |
| [配置](configuration.md)                | Fory 选项、兼容模式和安全限制                  |
| [基本序列化](basic-serialization.md)               | `serialize`、`deserialize`、生成注册和根对象图 |
| [代码生成](code-generation.md)          | `@ForyStruct`、build runner 和生成模块         |
| [Struct 继承](inheritance.md)           | 父类、mixin、私有字段和构造函数                |
| [外部类型序列化](external-types.md)     | 为其他包拥有的类生成序列化器                   |
| [Schema 元数据](schema-metadata.md)     | `@ForyField`、字段 ID、可空性、引用和多态      |
| [类型注册](type-registration.md)        | 基于 ID 与基于名称的注册及注册规则             |
| [自定义序列化器](custom-serializers.md) | 自定义 `Serializer<T>` 实现和 union            |
| [支持的类型](supported-types.md)        | 内置 xlang 值、包装器、集合和 struct           |
| [Schema 演进](schema-evolution.md)      | 兼容 struct 和演进 Schema                      |
| [Web 平台支持](web-platform-support.md) | Dart VM/AOT、Flutter 和 Web 支持、限制与验证   |
| [gRPC 支持](../../grpc/dart.md)         | 生成由 Fory 支持的 gRPC 服务配套类型           |
| [故障排查](troubleshooting.md)          | 常见错误、诊断和验证步骤                       |

## 相关资源

- [跨语言序列化规范](../../specification/xlang_serialization_spec.md)
- [跨语言实现指南](../../specification/xlang_implementation_guide.md)
- [跨语言指南](../xlang.md)
- [Dart 实现源码目录](https://github.com/apache/fory/tree/main/dart)

解码来自应用信任边界之外的字节之前，请阅读 [Dart 安全](security.md)。
