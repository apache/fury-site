---
title: 故障排除
sidebar_position: 90
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

本页介绍 Dart 中的常见问题及其解决方法。

## `Only xlang payloads are supported by the Dart implementation.`

写入端发送了原生模式载荷。请确保所有对端都写入 xlang 编码格式：

- **Java**：将对端配置为 xlang 模式，而不是原生模式。
- **Go**：将对端配置为 xlang 模式。
- **其他语言**：查阅相应指南中的 xlang 模式说明。

## `Type ... is not registered.`

Fory 不知道如何序列化或反序列化此类型。请按以下步骤修复：

1. 如果尚未运行代码生成，请执行：`dart run build_runner build`
2. 为该类型调用生成的 `register` 函数（或 `registerSerializer`），而且必须在调用 `serialize` 或 `deserialize` **之前**完成注册。
3. 注册消息中出现的**所有**类型，而不只是根类型。例如，如果 `Order` 包含 `Address`，则两者都要注册。

## 生成的 part 文件缺失或已过期

重新生成代码：

```bash
dart run build_runner build
```

请在拥有该源代码的软件包中运行命令。如果某个依赖项公开了层次结构中的私有字段，
请先为提供这些字段的软件包生成代码，并确保其发布的源代码包含生成的 `.fory.dart`
part 文件，然后再为使用方重新生成。如果移动了文件、重命名了类型或更改了层次结构，
请在重新运行分析或测试之前执行构建。

## 无法访问继承的私有字段

常规的层次结构发现会包含私有存储，即使它是在另一个 Dart 库中声明的。私有性会影响
生成代码的访问方式，但不会决定该字段是否存在于 Schema 中。

同一库中的私有字段不需要父类注解。对于跨库字段，请在其声明库中使用
`exposePrivateFields: true` 将其公开，并让生成的伴随代码对子类可见。如果子类有意
排除祖先类的所有私有状态，则应在该子类上设置
`ignoreInheritedPrivateFields: true`。

完整的访问、省略和多库规则请参阅[结构体继承](inheritance.md)。

## 无法重建继承的 final 字段

保留在 Schema 中的 final 或 `late final` 字段，必须从具体子类所选生成式构造函数的
某个参数中原样接收解码后的值。Fory 可以跨层次结构跟踪初始化形式参数、super 形式
参数、重定向和直接构造函数初始化器。

如果同名同类型的参数未被使用，或其值经过类型转换、变换或函数处理，那么仅有这个
参数仍然不够。请将解码后的值直接传给对应字段、在字段声明上标记
`@ForyField(ignore: true)`，或使用自定义序列化器。如果
`ignoreInheritedPrivateFields` 移除了必需构造函数参数唯一的序列化来源，Fory 仍会
报告此错误，而不会凭空生成一个值。请参阅
[构造函数与 Final 字段](inheritance.md#constructors-and-final-fields)。

## 继承字段被隐藏

子类字段或访问器可能会隐藏一个已包含的祖先类存储槽，但对象上仍同时存在两个物理
存储槽。Fory 会拒绝这种结构，而不会选择其中一个并丢失另一个。请重命名或移除产生
隐藏的成员、在祖先字段声明处忽略该字段，或使用自定义序列化器。对于祖先类的私有
状态，设置 `ignoreInheritedPrivateFields: true` 会从该子类的 Schema 中省略所有祖先
类私有存储。

## 外部目标代码生成失败

外部结构化序列化器要求：

- 使用 `abstract final` 声明序列化器，并包含 `late final` Schema 字段；
- 一个已导入的具体目标类；
- 每个字段都具有名称相同且 Dart 类型完全一致的可访问目标 getter；
- 一个参数能映射到字段的公共生成式构造函数，或者一个无必需参数的构造函数加上匹配
  的 setter。

使用 `@ForyStruct(target: Type, constructor: 'name')` 选择公共命名构造函数。如果目标
需要工厂构造函数、私有状态、字段转换或名称转换，请使用
[自定义序列化器](custom-serializers.md)。

## `Deserialized value has type ..., expected ...`

载荷描述了不同于 `T` 的类型，而该类型参数由 `deserialize<T>` 指定。常见原因包括：

- 写入端注册该类型时使用的 ID 或名称与读取端不同。
- 载荷由另一条代码路径生成，该路径序列化了不同的根对象。
- 你正在尝试反序列化异构容器——请先将其解码为 `Object?` 或 `List<Object?>`，然后再进行类型转换。

## 反序列化后的对象不是同一个实例

Fory 默认不跟踪对象身份，因此指向同一对象的两个字段在往返处理后会生成两个独立副本。

如需保留对象身份：

- 对于 `@ForyStruct` 中的字段，为这些字段添加 `@ForyField(ref: true)`。
- 对于顶层集合，将 `trackRef: true` 传给 `fory.serialize(...)`。
- 在自定义序列化器中，使用 `context.writeRef` / `context.readRef`，并在读取嵌套字段前调用 `context.reference(obj)`。

## 跨语言字段不匹配（数据缺失或值错误）

症状：与另一种语言进行往返处理后，字段返回默认值或错误类型。

检查清单：

1. 两端使用相同的注册身份（相同的数字 ID **或**相同的 `name`）。
2. 在生成第一个载荷之前分配稳定的 `@ForyField(id: ...)` 值。
3. 使用兼容的数值宽度——在 Dart 中使用 `@ForyField(type: Int32Type())` 来对应 `int`（Java）、`int32`（Go）或 `int`（C#）字段。
4. 日期/时间字段使用 `Timestamp` / `LocalDate`，而不是原始 `DateTime`。
5. 两端都采用兼容的 Schema 演进。Dart 默认启用该功能；请确保对端没有显式选择 `compatible: false`。

## Int64 或 Uint64 值在 Web 上失败

在 Dart VM 构建中，Dart `int` 可以表示有符号 64 位值。在 Dart Web 构建中，Dart
`int` 值由 JavaScript 数字承载，只有在 JS 安全整数范围内才能保持精确：

```text
-9007199254740991 <= value <= 9007199254740991
```

如果生成的序列化器写入 `int64` 字段，而该字段声明为 Dart `int`，Web 构建会拒绝超出该范围
的值，而不是悄然写入损坏的字节。若要在 Web 上交换完整范围的有符号 64 位值，请将
字段声明为 Fory 的 `Int64` 包装类型：

```dart
@ForyStruct()
class LedgerEntry {
  LedgerEntry();

  Int64 sequence = Int64(0); // full signed 64-bit range on VM and web
}
```

对于无符号 64 位值，请优先使用 `Uint64`，而不是 Dart `int`。无论在 VM 还是 Web
上，Dart `int` 都无法表示完整的 `uint64` 范围：

```dart
@ForyStruct()
class FileBlock {
  FileBlock();

  Uint64 offset = Uint64(0); // full unsigned 64-bit range
}
```

`@ForyField(type: Int64Type(...))` 会更改 Dart `int` 字段的编码格式，但不会消除 Web
整数精度限制。完整范围的有符号值请使用 `Int64`，完整范围的无符号值请使用 `Uint64`。
完整的浏览器支持矩阵和平台指南请参阅
[Web 平台支持](web-platform-support.md)。

## 在本地运行测试

Dart 主软件包：

```bash
dart run build_runner build
dart analyze
dart test
```

集成测试软件包：

```bash
cd dart/packages/fory-test
dart run build_runner build
dart test
```

## 生成的 gRPC 文件找不到 `package:grpc` 类型

**原因**：gRPC 软件包是应用依赖项。`fory` 软件包不会将 gRPC 添加为硬依赖项。

**解决方法**：将 `grpc` 添加到 `pubspec.yaml`（并添加 `build_runner` 开发依赖项），
然后运行 `dart pub get`。请参阅 [gRPC 支持](../../grpc/dart.md)。

## protobuf 客户端无法解码 Fory gRPC 服务

**原因**：Fory gRPC 伴随代码使用 gRPC 传输 Fory 编码的消息体，而不是 protobuf 编码格式。

**解决方法**：对 Fory 生成的服务使用 Fory 生成的客户端，或为通用 protobuf 客户端
公开单独的 protobuf 服务端点。

## 相关主题

- [结构体继承](inheritance.md)
- [跨语言互操作](core-api.md#cross-language-interoperability)
- [代码生成](code-generation.md)
- [自定义序列化器](custom-serializers.md)
- [Web 平台支持](web-platform-support.md)
- [gRPC 支持](../../grpc/dart.md)
