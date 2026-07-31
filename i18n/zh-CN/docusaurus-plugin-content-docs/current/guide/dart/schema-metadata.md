---
title: Schema 元信息
sidebar_position: 7
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

对于普通继承，元信息归属于存储字段的声明，并在任何带注解的具体子类发现该字段时生效。子类重新声明字段不会替换或合并祖先字段的元信息。有关继承字段的纳入规则，请参阅[结构体继承](inheritance.md)。

相同的注解也适用于[外部结构化序列化器声明](external-types.md)中的字段。

## 快速参考

```dart
@ForyField(
  ignore: false,    // 包含该字段；设为 true 可排除它
  id: 10,           // 用于 Schema 演进的稳定字段 ID
  nullable: true,   // 覆盖可空性检测
  ref: true,        // 为该字段启用引用跟踪
  dynamic: false,   // 控制是否写入具体类型
)
```

## `ignore`

从序列化中完全排除声明该注解的字段。这是唯一由字段声明自身控制的逐字段排除方式，并会应用于发现该字段的每个具体子类。典型场景包括不应写入持久化消息或传输消息的缓存值、计算值或仅供 UI 使用的值。

如果需要针对特定子类排除祖先类的全部私有字段，请参阅 [`ignoreInheritedPrivateFields`](inheritance.md#ignoring-inherited-private-fields)。被排除的物理存储仍会计入浅层对象图内存统计。由于声明为忽略的字段没有编码表示，请勿将 `ignore` 与其他 `ForyField` 选项组合使用。

```dart
@ForyField(ignore: true)
String cachedDisplayName = '';
```

## `id`

为字段分配稳定标识，使 Fory 能在 Schema 变更（字段重命名或重排序）后按 ID 匹配字段。**如果计划将来新增、删除或重命名字段，请现在就为所有字段分配 ID**，也就是在发送第一个载荷之前完成。

```dart
@ForyField(id: 1)
String name = '';
```

一旦载荷已在服务之间共享，就不要把同一个 `id` 复用于其他字段。

普通子类只有一个扁平化的字段命名空间。因此，子类、超类和已应用 mixin 声明中纳入的所有字段，其 ID 必须保持唯一。

## `nullable`

显式将字段标记为可空或不可空，覆盖 Fory 从 Dart 类型推断出的结果。当 Dart 类型不可空，但希望 Fory 接受编码格式中的 `null` 时使用它，例如读取来自较旧生产者且可能省略该字段的消息。

```dart
@ForyField(nullable: true)
String nickname = '';
```

在跨语言场景中，请确保可空性契约也符合对端语言的预期。

## `ref`

为特定字段启用引用跟踪。当对象图中的多个对象可能指向同一个实例，或者字段类型可能形成循环时使用它。如果没有 `ref: true`，同一个对象值出现在两个字段中时，Fory 会将它序列化两次。

```dart
@ForyField(ref: true)
List<Object?> sharedNodes = <Object?>[];
```

注意：即使设置了 `ref: true`，`int`、`double` 和 `bool` 等标量类型也不会从引用跟踪中受益。

纳入的继承字段上的 `ref` 注解，其行为与直接声明在具体子类字段上的相同注解完全一致。请参阅[结构体继承](inheritance.md#references-and-graph-memory)。

## `dynamic`

控制 Fory 是否将字段值的具体类型写入载荷。

- `null`（默认）— Fory 根据声明类型自动决定。
- `false` — 始终使用声明的字段类型；更紧凑，但反序列化器必须知道精确类型。
- `true` — 始终写入实际的具体类型；当字段声明为 `Object?` 或基类，但可以保存不同的具体类型（多态）时需要此设置。

```dart
@ForyField(dynamic: true)
Object? payload;  // 可以保存任何已注册类型
```

## 数值字段类型

Dart `int` 存储 64 位值。与 Java、Go 或 C# 交换消息时，接收端可能期望更窄的整数。使用 `@ForyField(type: ...)` 固定精确的编码格式：

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

对于嵌套容器，请使用 `ListField`、`SetField`、`MapField`，或完整的 `ForyField(type: ...)` 树：

```dart
@MapField(
  value: ListType(
    element: Int32Type(encoding: Encoding.fixed),
  ),
)
Map<String, List<int?>> metrics = <String, List<int?>>{};
```

即使指定了原始元素规格，泛型 `List<int>` 仍使用 `list` 编码类型。紧凑的 `*_array` 编码类型来自 `Int32List`、`Uint32List`、`Int64List` 和 `Uint64List` 等专用承载类型。如果为泛型 `List<int>` 标注不可空的定长原始元素规格，代码生成会拒绝它，并提示使用匹配的类型化列表承载类型。

## 跨语言对齐字段

当同一个模型以多种语言定义时：

- 为每个可能随时间变化的字段分配稳定的 `id` 值。
- 对真正多态的字段使用 `dynamic: true`。
- 保持每个字段的逻辑含义在各语言中一致。Fory 会按名称或 ID 匹配字段，但无法协调语义差异。

## 相关主题

- [结构体继承](inheritance.md)
- [代码生成](code-generation.md)
- [外部类型序列化](external-types.md)
- [Schema 演进](schema-evolution.md)
- [Xlang 序列化](xlang-serialization.md)
