---
title: 结构体继承
sidebar_position: 4
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

普通 Dart `@ForyStruct()` 类会将其具体超类和已应用 mixin 的存储序列化为一个扁平视图。
生成的子类 Schema 不会嵌套或调用父类序列化器。

## 公共字段 {#public-fields}

继承的公共字段不需要在父类上添加注解：

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

生成的 `TextMessage` Schema 同时包含 `sequence` 和 `text`。
接口、抽象 getter、静态字段和 mixin 的 `on` 约束不会添加存储。

## 字段包含规则 {#field-inclusion}

Fory 首先发现完整的具体超类和已应用 mixin 的存储链。
它先应用字段声明方指定的排除规则，再应用具体子类选项：

| 配置                                              | 作用范围                                                         |
| ------------------------------------------------- | ---------------------------------------------------------------- |
| `@ForyField(ignore: true)`                        | 从所有子类 Schema 中排除声明该注解的字段                         |
| `@ForyStruct(ignoreInheritedPrivateFields: true)` | 从该具体子类的 Schema 中排除祖先或已应用 mixin 声明的所有私有字段 |

其余每个字段都必须具有受支持的类型、明确的访问路径和有效的重建路径。
对于无法解析的状态，Fory 会报告代码生成错误，而不是将其静默丢弃。

这两个排除选项都在代码生成期间生效，不会增加运行时 flag、分支或父类序列化器。

## 忽略继承的私有字段 {#ignoring-inherited-private-fields}

`ignoreInheritedPrivateFields` 默认为 `false`。当某个具体子类的编码 Schema
有意排除所有祖先私有状态时，可在该子类上设置此选项：

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

`PublicMessage` Schema 包含 `_localState`、`text` 和 `publicLabel`，但不包含 `_cache`。

该选项的确切作用范围如下：

- 它适用于直接或间接超类以及已应用 mixin 所声明的私有字段。
- 它以相同方式处理同库和跨库私有字段。
- 它绝不会排除由带注解子类直接声明的私有字段。
- 它绝不会排除继承的公共字段。
- 它仅属于带注解的具体子类。父类上的注解不会改变子类的设置。
- 它会在解析私有访问方式之前过滤匹配的字段。即使存在访问 companion，
  被排除的字段也不需要该 companion。
- 它不能用于 `ForyStruct.target` 声明，也不能用于仅作为 provider 的抽象声明、
  开放泛型声明或 mixin 声明。

具体类可以同时设置 `exposePrivateFields: true` 和
`ignoreInheritedPrivateFields: true`。该类自身的序列化器会排除其祖先私有字段，
而生成的访问 companion 仍可供其他子类库使用。

## 包含跨库私有字段 {#including-cross-library-private-fields}

使用默认的 `ignoreInheritedPrivateFields: false` 时，其他 Dart 库中声明的私有字段
仍属于子类 Schema。声明这些字段的库必须通过一个公共继承边界将它们公开：

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

消费方使用常规注解：

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

请先生成并发布 `base.fory.dart`，再为依赖它的消费方生成代码。
直接 import 或 barrel export 必须同时公开该公共边界及其生成的
`$AccountBaseForyFieldAccess` companion。如果私有字段来自多个库，
每个声明字段的库都需要自己的公共边界和 companion。

与子类在同一 Dart 库中声明的继承私有字段不需要父类注解或 companion。

## 构造函数与 final 字段 {#constructors-and-final-fields}

每个包含在 Schema 中的 `final` 或 `late final` 字段，都必须通过选定的具体子类
生成式构造函数原样接收其解码值。Fory 可以跟踪初始化形式参数、super 形式参数、
重定向以及直接构造函数初始化器。如果某个同名参数的值被忽略或转换，
仅仅名称相同不足以证明该参数能够完成重建。

过滤私有字段并不意味着 Fory 可以凭空创建构造函数输入。
如果必需的子类构造函数参数不再有对应的序列化字段来源，代码生成就会失败。
请使用能够完成重建的构造函数、在适当位置使用由声明方指定的
`@ForyField(ignore: true)`，或者使用自定义序列化器。

## Mixin、泛型与字段 ID {#mixins-generics-and-field-ids}

已应用 mixin 的存储会像超类存储一样扁平化。
生成 Schema 元信息之前，泛型字段类型会针对具体子类进行特化。
所有包含的子类、超类和 mixin 字段共享一个字段 ID 命名空间和一种规范排序。

如果字段隐藏导致生成的访问代码无法访问某个包含在 Schema 中的物理存储位置，
代码生成就会拒绝该结构。排除祖先私有存储不会放宽对保留的公共字段或子类声明字段的验证。

## 引用与对象图内存 {#references-and-graph-memory}

包含在 Schema 中的继承 `ref: true` 字段和嵌套容器引用元信息，
与直接在子类上声明的等效字段具有相同的引用行为。
被排除的字段不会进入生成的引用分析。继承不会增加新的引用模式或父类级引用状态。

即使被排除，继承的物理存储仍会计入浅层对象图内存统计，
其行为与 `@ForyField(ignore: true)` 相同。

## 外部类型 {#external-types}

`ForyStruct.target` 声明会保留其显式字段列表。Fory 不会自动扫描外部目标类型的继承层次，
并且 `exposePrivateFields` 和 `ignoreInheritedPrivateFields` 都不能与 `target` 一起使用。

外部声明可以显式列出其目标类型继承的可访问属性。
请参阅[外部类型序列化](external-types.md)。

## 重新生成与兼容性 {#regeneration-and-compatibility}

修改继承层次中的存储、`exposePrivateFields` 或 `ignoreInheritedPrivateFields` 后，
请重新生成受影响的 `.fory.dart` 文件。

修改 `ignoreInheritedPrivateFields` 会改变生成的字段集合。
兼容模式会按常规方式处理缺失字段和未知字段。
使用固定 Schema 的通信端必须同步更新。

## 相关主题 {#related-topics}

- [代码生成](code-generation.md)
- [Schema 元信息](schema-metadata.md)
- [Schema 演进](schema-evolution.md)
- [类型注册](type-registration.md)
- [故障排查](troubleshooting.md)
