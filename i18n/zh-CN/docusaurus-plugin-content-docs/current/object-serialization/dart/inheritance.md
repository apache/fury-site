---
title: Struct 继承
sidebar_position: 5
id: inheritance
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

普通 Dart `@ForyStruct()` 类会序列化具体父类和所应用 mixin 存储的单个扁平视图。生成的子类 Schema 不会嵌套或调用父类序列化器。

## 公共字段

公共继承字段无需为父类添加注解：

```dart
class MessageBase {
  int sequence = 0;
}

@ForyStruct()
class TextMessage extends MessageBase {
  TextMessage();

  String text = '';
}
```

生成的 `TextMessage` Schema 同时包含 `sequence` 和 `text`。Interface、抽象 getter、静态字段和 mixin `on` 约束不会增加存储。

## 字段纳入

Fory 首先发现完整的具体父类和所应用 mixin 存储链。它先应用由声明负责的字段省略，再应用具体子类选项：

| 配置                                              | 范围                                                                  |
| ------------------------------------------------- | --------------------------------------------------------------------- |
| `@ForyField(ignore: true)`                        | 从每个子类 Schema 中省略该声明字段                                    |
| `@ForyStruct(ignoreInheritedPrivateFields: true)` | 从当前具体子类的 Schema 中省略由祖先或所应用 mixin 声明的每个私有字段 |

保留的每个字段都必须具有受支持的类型、明确的访问路径和有效的重建路径。Fory 会报告生成错误，而不是静默丢弃未解析状态。

两个省略选项都在代码生成期间应用，不会增加运行时标志、分支或父类序列化器。

## 忽略继承的私有字段 {#ignoring-inherited-private-fields}

`ignoreInheritedPrivateFields` 默认为 `false`。当子类的编码 Schema 有意排除所有私有祖先状态时，请在具体子类上设置它：

```dart
class FrameworkBase {
  String _cache = '';
  String publicLabel = '';
}

@ForyStruct(ignoreInheritedPrivateFields: true)
class PublicMessage extends FrameworkBase {
  PublicMessage();

  String _localState = '';
  String text = '';
}
```

`PublicMessage` Schema 包含 `_localState`、`text` 和 `publicLabel`，不包含 `_cache`。

该选项具有以下精确范围：

- 适用于直接或传递父类以及所应用 mixin 声明的私有字段。
- 同等处理同库和跨库私有字段。
- 绝不会省略由带注解子类直接声明的私有字段。
- 绝不会省略继承的公共字段。
- 只属于带注解的具体子类。父类注解不会改变子类设置。
- 在解析私有访问前过滤匹配字段。即使存在访问配套类型，被省略字段也不需要它。
- 对 `ForyStruct.target` 声明和仅作为提供方的抽象、开放泛型或 mixin 声明无效。

具体类可以同时设置 `exposePrivateFields: true` 和 `ignoreInheritedPrivateFields: true`。自身序列化器会省略其私有祖先字段，而生成的访问配套类型仍可供其他子类库使用。

## 纳入跨库私有字段

使用默认的 `ignoreInheritedPrivateFields: false` 时，其他 Dart 库声明的私有字段仍属于子类 Schema。声明库必须通过公共继承层次边界公开这些字段：

```dart
// package:model_owner/base.dart
import 'package:fory/fory.dart';

part 'base.fory.dart';

@ForyStruct(exposePrivateFields: true)
abstract class AccountBase {
  String _tenant = '';

  String get tenant => _tenant;
}
```

消费方使用普通注解：

```dart
// lib/account.dart
import 'package:fory/fory.dart';
import 'package:model_owner/base.dart';

part 'account.fory.dart';

@ForyStruct()
class Account extends AccountBase {
  Account();
}
```

生成依赖消费方前，请先生成并发布 `base.fory.dart`。直接 import 或 barrel export 必须同时公开公共边界及其生成的 `$AccountBaseForyFieldAccess` 配套类型。如果私有字段来自多个库，每个声明库都需要自己的公共边界和配套类型。

与子类在同一个 Dart 库中声明的私有继承字段不需要父类注解或配套类型。

## 构造函数和 Final 字段 {#constructors-and-final-fields}

纳入的每个 `final` 或 `late final` 字段都必须通过所选具体子类生成式构造函数原样接收解码值。Fory 可以跟踪初始化形式参数、super 形式参数、重定向和直接构造函数初始化器。如果值被忽略或转换，仅有同名参数不足以证明可以重建。

过滤私有字段不会让 Fory 虚构构造函数输入。如果必需的子类构造函数参数不再有序列化字段来源，代码生成会失败。请使用可重建构造函数、在适当位置使用由声明负责的 `@ForyField(ignore: true)`，或使用自定义序列化器。

## Mixin、泛型和字段 ID

所应用 mixin 的存储会像父类存储一样被展平。生成 Schema 元数据前，会针对具体子类特化泛型字段类型。纳入的所有子类、父类和 mixin 字段共享一个字段 ID 命名空间和一个规范顺序。

如果字段隐藏导致生成的访问无法到达纳入的物理存储槽，则会被拒绝。省略私有祖先存储不会放宽对保留的公共字段或子类声明字段的验证。

## 引用和对象图内存 {#references-and-graph-memory}

纳入的继承 `ref: true` 字段和嵌套容器引用元数据，与直接在子类上声明的等效字段使用相同引用行为。被省略字段不会进入生成的引用分析。继承不会增加引用模式或父类级引用状态。

物理继承存储即使被省略，仍会计入浅层对象图内存，与 `@ForyField(ignore: true)` 行为一致。

## 外部类型

`ForyStruct.target` 声明保留其显式字段列表。Fory 不会自动扫描外部目标继承层次，`exposePrivateFields` 和 `ignoreInheritedPrivateFields` 都不能与 `target` 一起使用。

外部声明可以显式列出其目标继承的可访问属性。参见[外部类型序列化](external-types.md)。

## 重新生成和兼容性

修改继承层次存储后，请重新生成受影响的 `.fory.dart` 文件；修改 `exposePrivateFields` 或 `ignoreInheritedPrivateFields` 后也需要重新生成。

修改 `ignoreInheritedPrivateFields` 会改变生成字段集合。兼容模式使用普通的缺失字段和未知字段行为。固定 Schema 通信方必须同步更新。

## 相关主题

- [代码生成](code-generation.md)
- [Schema 元数据](schema-metadata.md)
- [Schema 演进](schema-evolution.md)
- [类型注册](type-registration.md)
- [故障排查](troubleshooting.md)
