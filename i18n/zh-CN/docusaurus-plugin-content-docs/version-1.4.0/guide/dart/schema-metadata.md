---
title: Schema 元信息
sidebar_position: 5
id: schema_metadata
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

在 `@ForyStruct()` 类中的字段上添加 `@ForyField(...)`，即可改变该字段的序列化方式。

## 快速参考

```dart
@ForyField(
  skip: false,      // 包含该字段；设为 true 可排除它
  id: 10,           // 用于 Schema 演进的稳定字段 ID
  nullable: true,   // 覆盖可空性检测
  ref: true,        // 为该字段启用引用跟踪
  dynamic: false,   // 控制是否写入运行时类型
)
```

## `skip`

完全排除某个字段，不参与序列化。适用于缓存值、计算值或仅 UI 使用且不应落入持久化消息或传输消息的值。

```dart
@ForyField(skip: true)
String cachedDisplayName = '';
```

## `id`

为字段分配稳定身份，使 Fory 能在 schema 变更（字段重命名或重排序）后按 ID 匹配字段。**如果你计划将来新增、删除或重命名字段，请现在就为所有字段分配 ID**，也就是在交付第一个载荷之前完成。

```dart
@ForyField(id: 1)
String name = '';
```

一旦载荷已在服务之间共享，就不要把同一个 `id` 复用于另一个字段。

## `nullable`

显式将字段标记为可空或不可空，覆盖 Fory 从 Dart 类型推断出的结果。当 Dart 类型不可空，但你希望 Fory 接受编码格式中的 `null` 时使用它，例如读取来自较旧生产者且可能省略字段的消息。

```dart
@ForyField(nullable: true)
String nickname = '';
```

在跨语言场景中，确保可空性契约也符合对端运行时的预期。

## `ref`

为特定字段启用引用跟踪。当图中的多个对象可能指向同一个实例，或者字段类型可能形成循环时使用它。如果没有 `ref: true`，同一个对象值出现在两个字段中时，Fory 会序列化两次。

```dart
@ForyField(ref: true)
List<Object?> sharedNodes = <Object?>[];
```

注意：即使设置了 `ref: true`，`int`、`double` 和 `bool` 等标量类型也不会从引用跟踪中受益。

## `dynamic`

控制 Fory 是否把字段值的具体运行时类型写入载荷。

- `null`（默认）- Fory 根据声明类型自动决定。
- `false` - 始终使用声明的字段类型；更紧凑，但反序列化器必须知道精确类型。
- `true` - 始终写入实际运行时类型；当字段声明为 `Object?` 或基类，但运行时可以保存不同具体类型时需要它（多态）。

```dart
@ForyField(dynamic: true)
Object? payload;  // 运行时可以保存任何已注册类型
```

## 数值字段类型

Dart `int` 在运行时是 64 位值。与 Java、Go 或 C# 交换消息时，接收端可能期望更窄的整数。使用 `@ForyField(type: ...)` 固定精确的编码格式：

```dart
@ForyStruct()
class Sample {
  Sample();

  @ForyField(type: Int32Type(encoding: Encoding.fixed))
  int fixedWidthInt = 0;

  @ForyField(type: Int64Type(encoding: Encoding.tagged))
  Int64 compactLong = Int64(0);

  @ForyField(type: Uint32Type())
  int smallUnsigned = 0;
}
```

可用的标量类型节点包括 `Int8Type`、`Int16Type`、`Int32Type`、`Int64Type`、`Uint8Type`、`Uint16Type`、`Uint32Type`、`Uint64Type`、`Float16Type`、`Bfloat16Type` 和 `Float32Type`。

对于嵌套容器，使用 `ListField`、`SetField`、`MapField`，或完整的 `ForyField(type: ...)` 树：

```dart
@MapField(
  value: ListType(
    element: Int32Type(encoding: Encoding.fixed),
  ),
)
Map<String, List<int?>> metrics = <String, List<int?>>{};
```

即使指定了原始元素规格，泛型 `List<int>` 仍使用 `list` 编码格式类型。打包的 `*_array` 编码格式种类来自专用承载类型，例如 `Int32List`、`Uint32List`、`Int64List` 和 `Uint64List`。如果你为泛型 `List<int>` 标注非空定长原始元素规格，代码生成会拒绝它，并提示你使用匹配的类型化 list 承载类型。

## 跨语言对齐字段

当同一个模型在多种语言中定义时：

- 为每个可能随时间变化的字段分配稳定的 `id` 值。
- 对真正多态的字段使用 `dynamic: true`。
- 保持每个字段的逻辑含义在各语言中一致。Fory 会按名称或 ID 匹配字段，但无法协调语义差异。

## 相关主题

- [代码生成](code-generation.md)
- [Schema 演进](schema-evolution.md)
- [Xlang 序列化](xlang-serialization.md)
