---
title: Web 平台支持
sidebar_position: 12
id: web-platform-support
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

Fory Dart 通过生成序列化器和平台特定实现支持 Dart VM/AOT、Flutter、浏览器和 Flutter Web 构建。这些平台使用相同的公共 API 和注册流程，但由于 Dart `int` 由 JavaScript number 表示，Web 构建具有更严格的整数精度规则。

## 支持的目标

Fory Dart 支持：

- Dart VM/JIT 应用。
- Dart AOT/native 应用。
- Flutter 移动端和桌面应用。
- 为浏览器编译为 JavaScript 的 Dart 应用。
- Flutter Web 应用。
- 在所有受支持目标上使用生成的 `@ForyStruct` 序列化器和手动注册的序列化器。
- 普通生成继承，包括类型化跨库私有字段配套类型。
- 使用 `@ForyStruct(target: ...)` 生成的外部结构化序列化器。

## 必须生成代码

Fory Dart 使用显式注册而不是运行时反射。对于带注解 struct，请运行代码生成并注册生成的序列化器，再序列化或反序列化值：

```dart
import 'package:fory/fory.dart';

part 'account.fory.dart';

@ForyStruct()
class Account {
  Account();

  String name = '';
  Int64 sequence = Int64(0);
}

void main() {
  final fory = Fory();
  AccountForyModule.register(
    fory,
    Account,
    name: 'example.Account',
  );

  final bytes = fory.serialize(Account()..name = 'web');
  final account = fory.deserialize<Account>(bytes);
  print(account.name);
}
```

构建或测试前生成配套文件：

```bash
cd dart/packages/fory
dart run build_runner build
```

VM/AOT、Flutter 和 Web 使用相同的注册调用。自定义序列化器使用 `registerSerializer(...)`；生成 struct 使用生成的 `register` 包装器。

纳入的继承字段在每个平台上使用相同的静态生成代码。`ignoreInheritedPrivateFields` 在生成期间应用，不增加运行时分支。跨库提供方设置参见 [Struct 继承](inheritance.md)。

## 64 位整数规则

Dart VM `int` 值是有符号 64 位值。Dart Web `int` 值由 JavaScript number 支持，只在 JS 安全整数范围内保持精确：

```text
-9007199254740991 <= value <= 9007199254740991
```

选择字段类型时遵循此规则：

| 逻辑值                        | Web 上推荐的 Dart 字段类型      | 说明                                                              |
| ----------------------------- | ------------------------------- | ----------------------------------------------------------------- |
| JS 安全范围内的有符号 64 位值 | `int`                           | 适用于默认 `int64` 映射和 `@ForyField(type: Int64Type(...))` 编码 |
| 完整有符号 64 位范围          | `Int64`                         | 保留 JS 安全范围以外的值                                          |
| 无符号 64 位值                | `Uint64`                        | 值无法放入有符号或 JS 安全 Dart `int` 时必须使用                  |
| 8/16/32 位整数                | `int` + `@ForyField(type: ...)` | 使用显式字段元数据与通信方语言精确匹配                            |

`@ForyField(type: Int64Type(...))` 控制 Dart `int` 字段的编码方式：

```dart
@ForyStruct()
class SafeCounter {
  SafeCounter();

  @ForyField(type: Int64Type(encoding: Encoding.tagged))
  int count = 0; // keep web values inside the JS-safe range
}
```

它不会使 Dart `int` 在 Web 上能够存储每个 64 位值。完整范围有符号值使用 `Int64`：

```dart
@ForyStruct()
class FullRangeCounter {
  FullRangeCounter();

  Int64 count = Int64(0);
}
```

无符号值使用 `Uint64`：

```dart
@ForyStruct()
class StorageExtent {
  StorageExtent();

  Uint64 byteOffset = Uint64(0);
}
```

## 自定义序列化器

自定义序列化器可以在 VM/AOT、Flutter 和 Web 上使用相同的 `Buffer`、`WriteContext` 和 `ReadContext` API。对于 64 位值：

- 使用 `buffer.writeInt64(Int64(...))` 和 `buffer.readInt64()` 处理完整范围的有符号 64 位值。
- 使用 `buffer.writeUint64(Uint64(...))` 和 `buffer.readUint64()` 处理完整范围的无符号 64 位值。
- 仅使用 `writeInt64FromInt`、`writeVarInt64FromInt` 和匹配的 `AsInt` 读取方法来处理预期为 Dart `int`、因而在 Web 上必须保持 JS 安全的值。

示例：

```dart
final class OffsetSerializer extends Serializer<StorageExtent> {
  const OffsetSerializer();

  @override
  void write(WriteContext context, StorageExtent value) {
    context.buffer.writeUint64(value.byteOffset);
  }

  @override
  StorageExtent read(ReadContext context) {
    return StorageExtent()..byteOffset = context.buffer.readUint64();
  }
}
```

## 集合和 Typed Array

Web 支持 `List`、`Set`、`Map`、`Uint8List`、数值 typed array、`Int64List` 和 `Uint64List`。`Int64List` 和 `Uint64List` 实现无需依赖 JavaScript 整数精度即可保留 64 位值。当 Schema 为 `array<int64>` 或 `array<uint64>` 时，请使用 Fory 包装列表类型。

## 测试浏览器构建

修改必须在 Web 上工作的代码时，请同时在 VM 和 Chrome 中运行包测试：

```bash
cd dart/packages/fory
dart run build_runner build
dart test
dart test -p chrome
```

对于应用冒烟测试，还应编译并执行实际生成的入口点：

```bash
dart compile js --fatal-warnings bin/app.dart -o build/app.js
node build/app.js
```

验证跨库私有字段时，请使用与生产应用具有相同继承层次和 import 的模型。仅编译通过不足以证明注册和往返执行正常工作。

如果 Chrome 测试因生成文件过期或缺少 part 文件而失败，请重新运行 `build_runner`，然后从 `dart/packages/fory` 重试测试命令。

## 常见 Web 错误

### `Dart int value ... is outside the JS-safe signed int64 range`

序列化器正尝试在 Web 上将 Dart `int` 写为有符号 64 位值，但该值超出了 JavaScript number 可以精确表示的范围。请将字段类型改为 `Int64`，或将值限制在 JS 安全范围内。

### `Int64 value ... is not a JS-safe int`

反序列化器读取了完整范围 `Int64`，但目标字段或自定义序列化器要求 Dart `int`。请将字段类型改为 `Int64`，或使用 `readInt64()` 解码，而不是 `AsInt` 辅助方法。

### `Uint64 value ... is not a JS-safe int`

代码正在 Web 上将 `Uint64` 转换为 Dart `int`。除非应用已经验证该值位于 JS 安全非负范围内，否则请保持为 `Uint64`。

## 相关主题

- [Struct 继承](inheritance.md)
- [支持的类型](supported-types.md)
- [Schema 元数据](schema-metadata.md)
- [代码生成](code-generation.md)
- [故障排查](troubleshooting.md)
