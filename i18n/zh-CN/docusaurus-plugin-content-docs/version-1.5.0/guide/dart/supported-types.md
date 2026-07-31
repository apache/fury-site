---
title: 支持的类型
sidebar_position: 9
id: supported_types
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

本页列出可在 Fory 消息中使用的 Dart 类型，并指出跨语言兼容性方面需要特别注意的地方。

## 内置原始类型

以下 Dart 类型可以直接序列化，无需特殊处理：

| Dart 类型            | 跨语言说明                                                                                                                                                         |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `bool`               | 直接映射                                                                                                                                                           |
| `int`                | 默认按 64 位序列化。如果对端期望更窄的整数，请使用 `@ForyField(type: Int8Type/Int16Type/Int32Type/Uint8Type/Uint16Type/Uint32Type)`                                 |
| `double`             | 映射为 64 位浮点数。如果对端期望 32 位浮点数，请使用 `Float32` 包装类型                                                                                            |
| `String`             | 直接映射                                                                                                                                                           |
| `Uint8List`          | 二进制 blob                                                                                                                                                        |
| `List`, `Set`, `Map` | 支持，但元素类型也必须是受支持的类型                                                                                                                               |
| `DateTime`           | 如需明确语义，请使用 `Timestamp` 或 `LocalDate` 包装类型                                                                                                          |

## 整数字段

Dart VM/原生平台的 `int` 可以表示有符号 64 位值，而 Dart Web 的 `int` 受限于 JavaScript 的安全整数精度。如果对端语言期望 32 位整数（Java `int`、Go `int32`、C# `int`），而发送的是 Dart `int`，反序列化可能失败或发生静默截断。有关浏览器和 Flutter Web 的精度规则，请参阅 [Web 平台支持](web-platform-support.md)。

使用字段元信息为 8/16/32 位字段显式选择编码类型：

```dart
@ForyStruct()
class Metrics {
  Metrics();

  @ForyField(type: Int8Type())
  int tiny = 0;

  @ForyField(type: Int32Type(encoding: Encoding.fixed))
  int age = 0;

  @ForyField(type: Uint32Type())
  int count = 0;

  Int64 sequence = Int64(0);
  Uint64 offset = Uint64(0);
}
```

生成的序列化器会在写入前检查带注解的 `int` 值是否在有效范围内。当需要完整范围的 64 位值时，请使用 `Int64` 和 `Uint64`，尤其是在 Web 平台上。普通的根 `int` 值会序列化为跨语言 `int64`；精确的 8/16/32 位编码宽度通过字段元信息或底层 `Buffer` API 选择。

在 Dart VM 上，`Int64` 和 `Uint64` 是基于 `int` 的扩展类型。一旦值通过 `Object` 类型的动态或根边界传递，VM 就无法判断它最初是普通 `int`、`Int64` 还是 `Uint64`。当原生 VM 载荷需要跨动态边界保留无符号 64 位标识时，请使用生成的字段元信息或显式的 `Buffer` API。Dart Web 使用包装类，因此 Web 根值 `Uint64` 会保留 `varuint64` 元信息。

## 浮点类型

Dart `double` 默认映射为 64 位浮点数。如果对端使用低精度浮点值，请将 Dart 字段保持为 `double`，并通过字段元信息标记精确的编码类型：

- `Float32` — 32 位浮点数（对应 Java `float`、C# `float`、Go `float32`）
- `@ForyField(type: Float16Type()) double value` — 半精度标量
- `@ForyField(type: Bfloat16Type()) double value` — bfloat16 标量

对于连续的 16 位浮点数组，当 Schema 为 `array<float16>` 或 `array<bfloat16>` 时，请使用 `Float16List` 和 `Bfloat16List`，不要使用 `Uint16List`。

## 时间和日期类型

避免跨语言发送原始 `DateTime`，因为时区处理和 epoch 差异会因语言而异。请改用以下显式包装类型：

- `Timestamp` — 具有纳秒精度的 UTC 时间点（秒数 + 纳秒数）
- `LocalDate` — 不包含时间或时区的日历日期
- `Duration` — 使用 Dart 内置 `Duration` 表示的持续时间

```dart
final now = Timestamp.fromDateTime(DateTime.now().toUtc());
final birthday = LocalDate(1990, 12, 1);
final timeout = const Duration(seconds: 30);
```

这些时间类型包装器提供以下转换辅助方法：

- `Timestamp.fromDateTime(...)` 和 `timestamp.toDateTime()`
- `LocalDate.fromEpochDay(Int64(...))`；`date.toEpochDay()` 返回 `Int64`
- `LocalDate.fromDateTime(...)` 和 `date.toDateTime()`

Dart 对 `Duration` 的支持精确到微秒。对于使用亚微秒纳秒值的跨语言 duration 载荷，Fory 会拒绝读取，而不是静默截断。

## Struct 和 Enum

给类添加 `@ForyStruct()`，然后运行 `build_runner`，即可使其支持序列化。同一文件中的枚举会自动纳入。

```dart
@ForyStruct()
class User {
  User();

  String name = '';

  @ForyField(type: Int32Type())
  int age = 0; // 当对端期望 32 位整数时，使用显式字段元信息
}
```

普通的带注解类可以扩展其他类并应用 mixin。Fory 会从该继承层次结构中发现具体实例的所有存储字段（包括泛型特化后的继承字段），然后构建一个子类 Schema。有关私有字段访问和排除规则，请参阅[结构体继承](inheritance.md)。

抽象 getter、接口、静态成员以及其他不包含实例存储的声明都不属于字段。显式排除后保留的每个字段都必须具有受支持的类型、无歧义的访问路径和有效的重建路径，否则代码生成会失败。特别是，每个纳入的 `final` 或 `late final` 字段都必须通过具体子类的构造函数链原样接收解码后的值。

有关生成器配置，请参阅[代码生成](code-generation.md)。

当其他库拥有的类，其公共字段和构造方式与本地 Fory Schema 声明相匹配时，可以使用[外部结构化序列化器](external-types.md)。外部声明会显式列出 Schema 字段，而不会扫描目标类型的继承层次结构。

## 集合

Fory 支持 `List<T>`、`Set<T>` 和 `Map<K, V>`。元素类型和键类型本身也必须可序列化。请避免使用可变对象作为 map 键。

带有原始元素元信息的泛型 `List<int>` 仍使用 `list<T>` Schema。专用的紧凑数组 Schema 来自专用承载类型：

- `BoolList` 配合 `@ArrayField(element: BoolType())` 表示 `array<bool>`。普通 `List<bool>` 映射为 `list<bool>`。
- `Int8List`、`Int16List`、`Int32List`、`Int64List`
- `Uint8List`、`Uint16List`、`Uint32List`、`Uint64List`
- `Float16List`、`Bfloat16List`、`Float32List`、`Float64List`

## 兼容性提示

如果不确定某个 Dart 类型是否与对端的预期一致，请通过 `@ForyField(type: ...)` 明确指定宽度。猜错数值宽度是最常见的跨语言问题之一。

## 相关主题

- [结构体继承](inheritance.md)
- [Schema 元信息](schema-metadata.md)
- [Xlang 序列化](xlang-serialization.md)
- [Schema 演进](schema-evolution.md)
