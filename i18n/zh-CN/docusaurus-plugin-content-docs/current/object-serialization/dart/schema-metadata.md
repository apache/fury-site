---
title: Schema 元数据
sidebar_position: 8
id: schema-metadata
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

将 `@ForyField(...)` 添加到 `@ForyStruct()` 类的字段上，可以改变该字段的序列化方式。

对于普通继承，元数据归属于存储声明，并在任意带注解具体子类发现该字段时应用。子类重新声明不会替换或合并祖先字段的元数据。继承字段纳入规则参见 [Struct 继承](inheritance.md)。

相同注解也适用于[外部结构化序列化器声明](external-types.md)中的字段。

## 快速参考

```dart
@ForyField(
  ignore: false,    // include the field; set true to exclude it
  id: 10,           // stable field ID for schema evolution
  nullable: true,   // override nullability detection
  ref: true,        // enable reference tracking for this field
  dynamic: false,   // control whether the concrete type is written
)
```

## `ignore`

从序列化中完全排除声明字段。这是唯一由声明负责的字段级省略设置，适用于发现该字段的每个具体子类。常见用途包括不应进入持久化或传输消息的缓存值、计算值或仅 UI 使用的值。

如果要在特定子类中省略所有私有祖先字段，请参见 [`ignoreInheritedPrivateFields`](inheritance.md#ignoring-inherited-private-fields)。被省略的物理存储仍会计入浅层对象图内存。由于声明忽略的字段没有编码表示，请勿将 `ignore` 与其他 `ForyField` 选项组合使用。

```dart
@ForyField(ignore: true)
String cachedDisplayName = '';
```

## `id`

为字段分配稳定标识，使 Fory 能在 Schema 变化（字段重命名或重排）后按 ID 匹配字段。**如果计划将来新增、删除或重命名字段，现在就应为所有字段分配 ID**，并在发布首个载荷前完成。

```dart
@ForyField(id: 1)
String name = '';
```

载荷开始跨服务共享后，绝不要为其他字段复用 `id`。

普通子类只有一个扁平字段命名空间。因此，在子类、父类和所应用 mixin 声明中纳入的所有字段之间，ID 必须唯一。

## `nullable`

显式将字段标记为可空或不可空，覆盖 Fory 从 Dart 类型推断的结果。当 Dart 类型不可空，但希望 Fory 接受编码中的 `null` 时使用此选项，例如读取可能省略该字段的旧生成方消息。

```dart
@ForyField(nullable: true)
String nickname = '';
```

在跨语言场景中，请确保可空性契约也与通信方语言的预期匹配。

## `ref`

为特定字段启用引用跟踪。当对象图中的多个对象可能指向同一个实例，或字段类型可能形成循环时使用此选项。如果没有 `ref: true`，同一个对象值出现在两个字段中时，Fory 会序列化两次。

```dart
@ForyField(ref: true)
List<Object?> sharedNodes = <Object?>[];
```

注意：`int`、`double` 和 `bool` 等标量类型永远不会从引用跟踪中获益，即使设置了 `ref: true` 也是如此。

纳入的继承 `ref` 注解与直接在具体子类字段上声明的相同注解行为完全一致。参见 [Struct 继承](inheritance.md#references-and-graph-memory)。

## `dynamic`

控制 Fory 是否将字段值的具体类型写入载荷。

- `null`（默认）— Fory 根据声明类型自动决定。
- `false` — 始终使用声明字段类型；更加紧凑，但反序列化器必须知道精确类型。
- `true` — 始终写入实际具体类型；当字段声明为 `Object?` 或基类，却可以容纳不同具体类型（多态）时需要此设置。

```dart
@ForyField(dynamic: true)
Object? payload;  // can hold any registered type
```

## 数值字段类型

Dart `int` 存储 64 位值。与 Java、Go 或 C# 交换消息时，接收端可能期望更窄的整数。使用 `@ForyField(type: ...)` 固定精确编码格式：

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

对于嵌套容器，请使用 `ListField`、`SetField`、`MapField` 或完整的 `ForyField(type: ...)` 树：

```dart
@MapField(
  value: ListType(
    element: Int32Type(encoding: Encoding.fixed),
  ),
)
Map<String, List<int?>> metrics = <String, List<int?>>{};
```

即使指定原始元素类型，泛型 `List<int>` 仍使用 `list` 编码类型。紧凑的 `*_array` 编码类型来自 `Int32List`、`Uint32List`、`Int64List` 和 `Uint64List` 等专用载体。如果用不可空定长原始元素规格标注泛型 `List<int>`，代码生成会拒绝它，并提示使用匹配的类型化列表载体。

## 跨语言对齐字段

在多种语言中定义同一个模型时：

- 为每个可能随时间变化的字段分配稳定 `id` 值。
- 对真正多态的字段使用 `dynamic: true`。
- 跨语言保持每个字段的逻辑含义一致；Fory 按名称或 ID 匹配字段，但无法协调语义差异。

## 相关主题

- [Struct 继承](inheritance.md)
- [代码生成](code-generation.md)
- [外部类型序列化](external-types.md)
- [Schema 演进](schema-evolution.md)
- [跨语言序列化](xlang.md)
