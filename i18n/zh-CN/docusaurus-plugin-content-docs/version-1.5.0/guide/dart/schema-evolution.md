---
title: Schema 演进
sidebar_position: 10
id: schema_evolution
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

Schema 演进让应用的不同版本可以安全地交换消息。例如，v2 写入方生成的消息仍可由 v1 读取方解码，反之亦然。

## 兼容模式

兼容模式是 Dart 的默认模式。当服务可能同时运行不同版本时，请保持这一默认设置，例如滚动发布期间或客户端无法立即更新时。

```dart
final fory = Fory();
```

在兼容模式下，Fory 会在每条消息中包含足够的字段元信息，使读取方能够跳过未知字段，并为缺失字段使用默认值。请使用稳定的字段 ID（见下文）来锚定随版本变化的 Schema。

当转换无损时，兼容模式的读取方也允许部分标量字段类型发生变化。对于匹配的字段，只要转换后的逻辑值相同，就可以在 `bool`、`String`、数值标量和 `Decimal` 之间读取。例如，`"true"` 和 `"false"` 可以读取为布尔值，`"123"` 可以读取为能够容纳 `123` 的数值字段，数值和十进制数可以读取为规范字符串，而数值拓宽或收窄仅在不损失精度且不超出范围时成功。标量转换只适用于兼容模式下匹配的字段，不适用于根值或集合元素。从字符串转换为数值时，只接受不含空白的有限 ASCII 十进制字面量；不接受前导 `+`、Unicode 数字、下划线、`NaN` 或 `Infinity`。可空字段仍可与这些转换配合使用，但启用引用跟踪的标量字段类型变更不兼容。无效字符串、超出范围的值和有损转换会在反序列化期间抛出 `InvalidDataException`。

## 为演进做好准备

为了安全地使用兼容模式，请给结构体添加 `@ForyStruct(evolving: true)`（默认值），并在**发送第一个载荷之前**为每个字段分配稳定的 `@ForyField(id: ...)`：

```dart
@ForyStruct(evolving: true)
class UserProfile {
  UserProfile();

  @ForyField(id: 1)
  String name = '';

  @ForyField(id: 2, nullable: true)
  String? nickname;
}
```

如果在载荷已进入生产环境后才添加字段 ID，已有的存储消息不会包含这些 ID，Schema 演进也将无法正常工作。

对于普通的继承结构体，请在具体子类扁平化 Schema 包含的所有字段之间分配 ID。父类或 mixin 中已包含字段使用的 ID 不能被子类复用。

对于[外部结构化序列化器](external-types.md)，本地序列化器声明提供可演进的 Schema，并且声明中的每个字段都必须与对应的目标属性匹配。

## 可以安全进行的变更

**安全变更**（双方兼容）：

- 使用新的、未使用过的字段 ID 添加一个新的可选字段。
- 重命名字段，但必须保持 `@ForyField(id: ...)` 不变。
- 删除字段，对端会直接忽略缺失值并使用 Dart 默认值。
- 当所有已部署的值都可以在不损失精度且不超出范围的情况下转换时，更改部分标量字段类型。

**不安全变更**（可能破坏已有消息）：

- 将已有字段 ID 复用于其他字段。
- 将字段类型更改为不兼容的类型，或更改为无法精确表示对端值的标量类型。
- 消息进入生产环境后，更改类型的注册标识（`id` 或 `name`）。
- 在不更改字段 ID 的情况下改变字段的逻辑含义。
- 引入字段隐藏，导致祖先类与子类各自保留一个存储槽；代码生成会拒绝这种结构，因为无法准确寻址两个存储槽。

## Xlang 说明

只有在交换消息的**所有**对端都满足以下条件时，Schema 演进才能正常工作：

1. 使用相同的 `compatible` 设置。
2. 使用相同的类型注册标识（数字 ID 或 `name`）。
3. 对字段 ID 的逻辑含义有一致理解。

部署前，请使用真实的往返序列化测试覆盖滚动升级场景。

## 同 Schema 优化

只有当所有读取方和写入方始终使用相同的 Schema，并且希望获得更快的序列化速度和更小的体积时，才应使用 `compatible: false`。对于跨语言载荷，仅在确认所有语言都使用相同的 Schema，或原生类型由 Fory Schema IDL 生成后，才设置 `compatible: false`。

```dart
final fory = Fory(compatible: false);
```

## 重新生成继承 Schema

添加继承的存储字段、更改超类或 mixin、更改 `exposePrivateFields`，或更改 `ignoreInheritedPrivateFields` 后，请重新生成所有受影响的 `.fory.dart` part。在构建需要包含依赖包私有字段的使用方之前，先生成依赖包的 provider part。

启用 `ignoreInheritedPrivateFields` 会从该具体子类生成的 Schema 中移除所有祖先类和已应用 mixin 的私有字段。禁用它会重新加入这些字段，并且可能需要 provider companion。兼容 Schema 沿用常规的缺失字段和未知字段处理方式。由于生成的字段列表不同，固定 Schema 的各端必须同步变更。父类上的注解不会把此设置传播给子类。

此选项只会改变生成时对字段的选择，不会改变运行时引用协议，也不会添加兼容性读取器。

## 相关主题

- [结构体继承](inheritance.md)
- [配置](configuration.md)
- [外部类型序列化](external-types.md)
- [Schema 元信息](schema-metadata.md)
- [Xlang 序列化](xlang-serialization.md)
