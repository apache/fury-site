---
title: 支持的类型
sidebar_position: 7
id: dart_supported_types
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

本页列出可在 Fory 消息中使用的 Dart 类型，并标出哪些地方在跨语言兼容性上需要特别小心。

## 内置原始类型

以下 Dart 类型可以直接序列化，不需要特殊处理：

| Dart 类型            | 跨语言说明                                                                                                   |
| -------------------- | ------------------------------------------------------------------------------------------------------------ |
| `bool`               | 直接映射                                                                                                     |
| `int`                | 默认按 64 位序列化。如果对端期望更窄的整数，请使用包装类型或 `@Int32Type` 等注解 |
| `double`             | 映射为 64 位浮点数。如果对端期望 32 位浮点，请使用 `Float32` 包装类型 |
| `String`             | 直接映射                                                                                                     |
| `Uint8List`          | 二进制 blob                                                                                                  |
| `List`, `Set`, `Map` | 支持，但元素类型也必须是受支持类型                                                                           |
| `DateTime`           | 如需明确语义，请使用 `Timestamp` 或 `LocalDate` 包装类型                                                    |

## 整数包装类型

Dart `int` 在运行时是 64 位值。如果对端语言期望 32 位整数，例如 Java `int`、Go `int32`、C# `int`，而你发送的是 Dart `int`，反序列化可能失败，或者静默截断。

使用整数包装类型可以固定精确的编码宽度：

```dart
final Int8 tiny = Int8(-1);        // 8-bit signed
final Int16 shortValue = Int16(7); // 16-bit signed
final Int32 age = Int32(36);       // 32-bit signed — matches Java int, C# int, Go int32
final UInt8 flags = UInt8(255);    // 8-bit unsigned
final UInt16 port = UInt16(65535); // 16-bit unsigned
final UInt32 count = UInt32(4000000000); // 32-bit unsigned
```

每个包装类型都会把存储值限制在目标位宽内。

## 浮点包装类型

Dart `double` 对应 64 位浮点。如果对端使用 32 位浮点，请改用包装类型：

- `Float32`：32 位浮点，对应 Java `float`、C# `float`、Go `float32`
- `Float16`：半精度浮点，适用于专门的数值载荷

## 时间和日期类型

不要直接把原始 `DateTime` 跨语言发送。时区处理和 epoch 差异在不同语言间并不完全一致。请改用下面这些显式包装类型：

- `Timestamp`：带纳秒精度的 UTC 时间点，即秒数加纳秒数
- `LocalDate`：不带时间和时区的日历日期

```dart
final now = Timestamp.fromDateTime(DateTime.now().toUtc());
final birthday = LocalDate(1990, 12, 1);
```

## Struct 和 Enum

给类添加 `@ForyStruct()`，然后运行 `build_runner`，它们就能序列化。定义在同一文件中的枚举会自动包含进去。

```dart
@ForyStruct()
class User {
  User();

  String name = '';
  Int32 age = Int32(0); // use Int32 when peers expect a 32-bit integer
}
```

参见 [代码生成](code-generation.md)。

## 集合

Fory 支持 `List<T>`、`Set<T>` 和 `Map<K, V>`。元素类型和键类型本身也必须可序列化。请避免使用可变对象作为 map 键。

## 兼容性提示

一旦不确定某个 Dart 类型是否与对端预期一致，就优先使用显式包装类型。数字宽度选错，是跨语言场景里最常见的 bug 之一。

## 相关主题

- [字段配置](schema-metadata.md)
- [跨语言](xlang-serialization.md)
- [Schema 演进](schema-evolution.md)
