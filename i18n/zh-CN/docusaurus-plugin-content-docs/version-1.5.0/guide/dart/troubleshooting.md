---
title: 故障排查
sidebar_position: 13
id: troubleshooting
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

本页汇总 Dart 中的常见问题及其解决方法。

## `Only xlang payloads are supported by the Dart implementation.`

写入端发送的是原生模式载荷。请确保每个对端都写入跨语言编码格式：

- **Java**：将对端配置为跨语言模式，而不是原生模式。
- **Go**：将对端配置为跨语言模式。
- **其他语言**：查阅相应指南，了解如何启用跨语言模式。

## `Type ... is not registered.`

Fory 不知道如何序列化或反序列化此类型。请按以下步骤修复：

1. 如果尚未生成代码，请运行：`dart run build_runner build`
2. 在调用 `serialize` 或 `deserialize` **之前**，为该类型调用生成的 `register` 函数（或 `registerSerializer`）。
3. 注册消息中出现的**所有**类型，而不仅仅是根类型。例如，如果 `Order` 包含 `Address`，则两者都需要注册。

## 生成的 part 文件缺失或已过期

重新生成代码：

```bash
dart run build_runner build
```

请在拥有源文件的 package 中运行该命令。如果依赖项暴露了继承层次中的私有字段，
请先为提供方 package 生成代码，并确保其发布的源码包含生成的 `.fory.dart` part，
然后再为使用方重新生成代码。如果移动了文件、重命名了类型或修改了继承层次，
请先重新构建，再运行分析或测试。

## 无法访问继承的私有字段

常规的继承层次发现会包含私有存储，即使它声明在另一个 Dart library 中。
私有性影响的是生成代码能否访问字段，而不是该字段是否存在于 Schema 中。

同一 library 中的私有字段不需要为父类添加注解。对于跨 library 字段，请在其声明
library 中使用 `exposePrivateFields: true` 将其暴露，并让子类能够访问生成的
companion。如果子类需要有意排除祖先的所有私有状态，请改为在该子类上设置
`ignoreInheritedPrivateFields: true`。

完整的访问、省略和多 library 规则请参见 [Struct 继承](inheritance.md)。

## 无法重建继承的 final 字段

如果 `final` 或 `late final` 字段仍保留在 Schema 中，其解码值必须通过具体子类所选
生成式构造函数的参数原样赋给该字段。Fory 能够沿着初始化形式参数、super 参数、
重定向以及直接构造函数初始化器跟踪值。

仅有同名同类型的参数还不够：如果该参数未被使用，或者值经过类型转换、变换或函数调用，
都会失败。请将解码值直接传给对应字段、在字段声明上添加
`@ForyField(ignore: true)`，或使用自定义序列化器。如果
`ignoreInheritedPrivateFields` 删除了某个必需构造函数参数唯一的序列化来源，
Fory 仍会报告此错误，而不会凭空构造一个值。请参见
[构造函数与 Final 字段](inheritance.md#constructors-and-final-fields)。

## 继承字段被隐藏

子类字段或访问器可能会隐藏已包含的祖先存储槽，但两个物理存储槽仍同时存在于对象上。
Fory 会拒绝这种结构，而不是任意选择一个存储槽并丢弃另一个。请重命名或删除隐藏成员、
在祖先字段声明处忽略该字段，或者使用自定义序列化器。对于祖先的私有状态，可设置
`ignoreInheritedPrivateFields: true`，从该子类的 Schema 中省略所有祖先私有存储。

## 外部目标代码生成失败

外部结构化序列化器要求：

- 使用带有 `late final` Schema 字段的 `abstract final` 序列化器声明；
- 一个已导入的具体目标类；
- 每个字段都有名称和 Dart 类型完全相同且可访问的目标 getter；
- 一个参数能映射到字段的 public 生成式构造函数，或者一个没有必需参数的构造函数及对应 setter。

使用 `@ForyStruct(target: Type, constructor: 'name')` 选择 public 命名构造函数。
如果目标类型需要 factory、私有状态、字段转换或名称映射，请使用
[自定义序列化器](custom-serializers.md)。

## `Deserialized value has type ..., expected ...`

载荷描述的类型与 `deserialize<T>` 中的 `T` 不同。常见原因包括：

- 写入端注册该类型时使用的 ID 或名称与读取端不同。
- 载荷由另一条代码路径生成，该路径序列化了不同的根对象。
- 你正尝试反序列化异构容器——请先将其解码为 `Object?` 或 `List<Object?>`，再进行类型转换。

## 反序列化后对象不再是同一个实例

默认情况下，Fory 不跟踪对象标识，因此指向同一对象的两个字段经过一次往返后会生成两个独立副本。

如需保留对象标识：

- 对 `@ForyStruct` 中的字段添加 `@ForyField(ref: true)`。
- 对顶层集合，在调用 `fory.serialize(...)` 时传入 `trackRef: true`。
- 在自定义序列化器中使用 `context.writeRef` / `context.readRef`，并在读取嵌套字段之前调用 `context.reference(obj)`。

## 跨语言字段不匹配（数据缺失或值错误）

症状：经过另一种语言往返后，字段变为默认值或错误类型。

检查清单：

1. 两端使用相同的注册标识（相同的数字 ID **或**相同的 `name`）。
2. 在生成第一份载荷之前分配稳定的 `@ForyField(id: ...)`。
3. 数字宽度兼容——当对端字段为 Java `int`、Go `int32` 或 C# `int` 时，在 Dart 中使用 `@ForyField(type: Int32Type())`。
4. 日期/时间字段使用 `Timestamp` / `LocalDate`，而不是原始 `DateTime`。
5. 两端都使用兼容的 Schema 演进。Dart 默认启用兼容模式；请确保对端没有显式选择 `compatible: false`。

## Web 上的 Int64 或 Uint64 值失败

在 Dart VM 构建中，Dart `int` 可以表示有符号 64 位值。在 Dart web 构建中，
Dart `int` 由 JavaScript number 支持，并且只有在 JavaScript 安全整数范围内才精确：

```text
-9007199254740991 <= value <= 9007199254740991
```

如果生成的序列化器将声明为 Dart `int` 的 `int64` 字段写入编码格式，
web 构建会拒绝超出该范围的值，而不是静默写入损坏的字节。如需在 web 上交换
完整范围的有符号 64 位值，请将字段声明为 Fory 的 `Int64` 包装类型：

```dart
@ForyStruct()
class LedgerEntry {
  LedgerEntry();

  Int64 sequence = Int64(0); // full signed 64-bit range on VM and web
}
```

对于无符号 64 位值，应使用 `Uint64`，而不是 Dart `int`。无论在 VM 还是 web 上，
Dart `int` 都无法表示完整的 `uint64` 范围：

```dart
@ForyStruct()
class FileBlock {
  FileBlock();

  Uint64 offset = Uint64(0); // full unsigned 64-bit range
}
```

`@ForyField(type: Int64Type(...))` 会改变 Dart `int` 字段的编码格式，
但不会消除 web 上的整数精度限制。完整范围的有符号值请使用 `Int64`，
完整范围的无符号值请使用 `Uint64`。完整的浏览器支持矩阵和平台指南请参见
[Web 平台支持](web-platform-support.md)。

## 在本地运行测试

主 Dart package：

```bash
dart run build_runner build
dart analyze
dart test
```

集成测试 package：

```bash
cd dart/packages/fory-test
dart run build_runner build
dart test
```

## 生成的 gRPC 文件找不到 `package:grpc` 类型

**原因**：gRPC package 属于应用依赖。`fory` package 不会将 gRPC 添加为硬依赖。

**修复**：将 `grpc` 添加到 `pubspec.yaml`（并添加 `build_runner` dev dependency），
然后运行 `dart pub get`。请参见 [gRPC 支持](grpc-support.md)。

## Protobuf client 无法解码 Fory gRPC service

**原因**：Fory gRPC companion 使用 gRPC 传输和 Fory 编码的 message body，
而不是 protobuf 编码格式。

**修复**：为 Fory 生成的 service 使用 Fory 生成的 client，或者为通用 protobuf client
提供单独的 protobuf service endpoint。

## 相关主题

- [Struct 继承](inheritance.md)
- [Xlang 序列化](xlang-serialization.md)
- [代码生成](code-generation.md)
- [自定义序列化器](custom-serializers.md)
- [Web 平台支持](web-platform-support.md)
- [gRPC 支持](grpc-support.md)
