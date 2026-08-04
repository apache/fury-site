---
title: 支持的类型
sidebar_position: 11
id: supported-types
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

本页列出可在 Fory 消息中使用的 Dart 类型，并标明为了跨语言兼容需要注意的地方。

## 内置原始类型

以下 Dart 类型无需特殊处理即可直接序列化：

| Dart 类型            | 跨语言说明                                                                                                                    |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `bool`               | 直接映射                                                                                                                      |
| `int`                | 默认序列化为 64 位。通信方期望更窄整数时使用 `@ForyField(type: Int8Type/Int16Type/Int32Type/Uint8Type/Uint16Type/Uint32Type)` |
| `double`             | 映射到 64 位浮点数。通信方期望 32 位时使用 `Float32` 包装器                                                                   |
| `String`             | 直接映射                                                                                                                      |
| `Uint8List`          | 二进制数据块                                                                                                                  |
| `List`, `Set`, `Map` | 支持；元素类型也必须受支持                                                                                                    |
| `DateTime`           | 使用 `Timestamp` 或 `LocalDate` 包装器表达明确语义                                                                            |

## 整数字段

Dart VM/native `int` 可以表示有符号 64 位值，而 Dart Web `int` 受 JavaScript 安全整数精度限制。如果通信方语言期望 32 位整数（Java `int`、Go `int32`、C# `int`），而你发送 Dart `int`，反序列化可能失败或静默截断。浏览器和 Flutter Web 精度规则参见 [Web 平台支持](web-platform-support.md)。

使用字段元数据为 8/16/32 位字段显式选择编码类型：

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

生成的序列化器会在写入带注解的 `int` 值前检查范围。请使用 `Int64` 和 `Uint64` 表示完整范围的 64 位值，尤其是在 Web 上。普通根 `int` 值序列化为 xlang `int64`；精确的 8/16/32 位编码宽度通过字段元数据或底层 `Buffer` API 选择。

在 Dart VM 上，`Int64` 和 `Uint64` 是基于 `int` 的扩展类型。值一旦经过 `Object` 类型的动态/根边界，VM 就无法恢复它最初是普通 `int`、`Int64` 还是 `Uint64`。原生 VM 载荷必须跨动态边界保留无符号 64 位标识时，请使用生成的字段元数据或显式 `Buffer` API。Dart Web 使用包装类，因此 Web 根 `Uint64` 值会保留 `varuint64` 元数据。

## 浮点类型

Dart `double` 默认映射到 64 位浮点数。如果通信方使用低精度浮点值，请保持 Dart 字段为 `double`，并通过字段元数据标记精确编码类型：

- `Float32` — 32 位浮点数（匹配 Java `float`、C# `float`、Go `float32`）
- `@ForyField(type: Float16Type()) double value` — 半精度标量
- `@ForyField(type: Bfloat16Type()) double value` — bfloat16 标量

对于连续 16 位浮点数组，请使用 `Float16List` 和 `Bfloat16List`，而不是 `Uint16List`；对应 Schema 为 `array<float16>` 或 `array<bfloat16>`。

## 时间和日期类型

避免跨语言发送原始 `DateTime`，因为时区处理和 epoch 差异各不相同。请改用显式包装器：

- `Timestamp` — 具有纳秒精度的 UTC 时间点（秒 + 纳秒）
- `LocalDate` — 不含时间或时区的日历日期
- `Duration` — 使用 Dart 内置 `Duration` 的已用时间值

```dart
final now = Timestamp.fromDateTime(DateTime.now().toUtc());
final birthday = LocalDate(1990, 12, 1);
final timeout = const Duration(seconds: 30);
```

时间包装器提供转换辅助方法：

- `Timestamp.fromDateTime(...)` 和 `timestamp.toDateTime()`
- `LocalDate.fromEpochDay(Int64(...))`, `date.toEpochDay()` returns `Int64`
- `LocalDate.fromDateTime(...)` 和 `date.toDateTime()`

Dart 中的 `Duration` 支持精确到微秒。使用小于微秒纳秒值的传入 xlang duration 载荷会被拒绝，而不是静默截断。

## Struct 和 Enum

为类添加 `@ForyStruct()` 注解并运行 `build_runner`，使其可序列化。同一文件中的 enum 会自动纳入。

```dart
@ForyStruct()
class User {
  User();

  String name = '';

  @ForyField(type: Int32Type())
  int age = 0; // use explicit field metadata when peers expect a 32-bit integer
}
```

普通带注解类可以继承类并应用 mixin。Fory 会从该继承层次中发现每个具体实例存储字段，包括特化后的继承泛型字段，然后构建一个子类 Schema。私有字段访问和省略规则参见 [Struct 继承](inheritance.md)。

抽象 getter、interface、静态成员和其他没有实例存储的声明不是字段。显式省略后保留的每个字段都必须具有受支持的类型、明确的访问路径和有效的重建路径，否则代码生成会失败。尤其是，纳入的每个 `final` 或 `late final` 字段必须通过具体子类的构造函数链原样接收解码值。

生成器设置参见[代码生成](code-generation.md)。

当其他库拥有的类，其公共字段和构造方式与本地 Fory Schema 声明匹配时，可以使用[外部结构化序列化器](external-types.md)。外部声明显式列出其 Schema 字段，不会扫描目标继承层次。

## 集合

Fory 支持 `List<T>`、`Set<T>` 和 `Map<K, V>`。元素和 key 类型也必须可序列化。避免将可变对象用作 map key。

带原始元素元数据的泛型 `List<int>` 仍使用 `list<T>` Schema。专用密集数组 Schema 来自专用载体：

- `BoolList` 配合 `@ArrayField(element: BoolType())` 表示 `array<bool>`。普通 `List<bool>` 映射到 `list<bool>`。
- `Int8List`, `Int16List`, `Int32List`, `Int64List`
- `Uint8List`, `Uint16List`, `Uint32List`, `Uint64List`
- `Float16List`, `Bfloat16List`, `Float32List`, `Float64List`

## 兼容性提示

无法确定 Dart 类型是否与通信方预期匹配时，请使用 `@ForyField(type: ...)` 显式指定宽度。猜错数值宽度是最常见的跨语言错误之一。

## 相关主题

- [Struct 继承](inheritance.md)
- [Schema 元数据](schema-metadata.md)
- [跨语言序列化](xlang.md)
- [Schema 演进](schema-evolution.md)
