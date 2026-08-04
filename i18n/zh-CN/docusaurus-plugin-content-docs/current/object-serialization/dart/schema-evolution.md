---
title: Schema 演进
sidebar_position: 7
id: schema-evolution
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

Schema 演进允许应用的不同版本安全交换消息：v2 写入端可以生成 v1 读取端仍能解码的消息，反之亦然。

## 兼容模式

兼容模式是 Dart 的默认设置。当服务可能同时运行不同版本时，请保留此默认值，例如滚动部署期间或客户端未立即更新时。

```dart
final fory = Fory();
```

在兼容模式下，Fory 会在每条消息中包含足够的字段元数据，使读取端可以跳过未知字段，并对缺失字段使用默认值。使用稳定字段 ID（见下文）在变更期间固定 Schema。

当值可以无损转换时，兼容读取端还允许部分标量字段类型变化。只要转换后的逻辑值相同，匹配字段就可以在 `bool`、`String`、数值标量和 `Decimal` 之间读取。例如，`"true"` 和 `"false"` 可以读取为布尔值；`"123"` 可以读取为能够容纳 `123` 的数值字段；数值和 decimal 可以读取为规范字符串；数值拓宽或收窄仅在不损失精度或范围时成功。标量转换仅适用于匹配的兼容字段，不适用于根值或集合元素。字符串转数值只接受有限 ASCII 十进制字面量，不允许空白、前导 `+`、Unicode 数字、下划线、`NaN` 或 `Infinity`。可空字段仍可与这些转换组合，但启用引用跟踪的标量类型变化不兼容。无效字符串、超出范围的值和有损转换会在反序列化期间以 `InvalidDataException` 失败。

## 配置 Schema 演进

为了安全使用兼容模式，请用 `@ForyStruct(evolving: true)`（默认设置）标记 struct，并在**发布首个载荷前**为每个字段分配稳定的 `@ForyField(id: ...)`：

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

如果在载荷投入生产后才添加字段 ID，已有存储消息不会包含这些 ID，Schema 演进将无法正常工作。

对于普通继承 struct，请为具体子类扁平 Schema 纳入的每个字段分配 ID。子类不能复用已由纳入的父类或 mixin 字段使用的 ID。

对于[外部结构化序列化器](external-types.md)，本地序列化器声明提供演进 Schema，每个声明字段必须与对应目标属性匹配。

## 可以安全进行的变更

**安全变更**（双方都兼容）：

- 使用新的未占用字段 ID 添加可选字段。
- 重命名字段，但保持 `@ForyField(id: ...)` 不变。
- 删除字段；通信方会忽略缺失值并使用 Dart 默认值。
- 当所有已部署值转换后不会损失精度或范围时，更改部分标量字段类型。

**不安全变更**（可能破坏现有消息）：

- 为其他字段复用现有字段 ID。
- 将字段类型改为不兼容类型，或无法精确表示通信方值的标量类型。
- 消息投入生产后修改类型的注册标识（`id` 或 `name`）。
- 不修改 ID，却改变字段的逻辑含义。
- 引入字段隐藏，同时保留祖先和子类存储槽；代码生成会拒绝这种结构，因为无法准确寻址两个存储槽。

## 跨语言说明

只有交换消息的**所有**通信方就以下内容达成一致时，演进才能工作：

1. 相同的 `compatible` 设置。
2. 相同的类型注册标识（数字 ID 或 `name`）。
3. 字段 ID 的逻辑含义。

部署前使用真实往返测试滚动升级场景。

## 相同 Schema 优化

仅当每个读取端和写入端始终使用相同 Schema，并且希望获得更快序列化和更小体积时，才使用 `compatible: false`。对于 xlang 载荷，只有确认每种语言使用相同 Schema，或原生类型由 Fory Schema IDL 生成时，才设置 `compatible: false`。

```dart
final fory = Fory(compatible: false);
```

## 重新生成继承 Schema

新增继承存储或者修改父类或 mixin 后，请重新生成每个受影响的 `.fory.dart` part；修改 `exposePrivateFields` 或 `ignoreInheritedPrivateFields` 后也需要重新生成。构建纳入依赖包私有字段的消费方前，请先生成该依赖包的提供方 part。

启用 `ignoreInheritedPrivateFields` 会从该具体子类的生成 Schema 中删除每个私有祖先字段和所应用 mixin 字段。禁用它会将这些字段加回，并可能需要提供方配套类型。兼容 Schema 使用普通的缺失字段和未知字段行为。由于生成的字段列表不同，固定 Schema 通信方必须同步变更。父类注解不会将此设置传播给子类。

此选项只改变生成字段选择，不会改变运行时引用协议或添加兼容读取器。

## 相关主题

- [Struct 继承](inheritance.md)
- [配置](configuration.md)
- [外部类型序列化](external-types.md)
- [Schema 元数据](schema-metadata.md)
- [跨语言序列化](basic-serialization.md#cross-language-interoperability)
