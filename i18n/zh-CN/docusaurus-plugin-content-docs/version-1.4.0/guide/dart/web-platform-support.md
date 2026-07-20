---
title: Web 平台支持
sidebar_position: 10
id: web_platform_support
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

Fory Dart 通过生成的序列化器和平台专用运行时实现，支持 Dart VM/AOT、Flutter、浏览器以及 Flutter web 构建。这些平台上的公开 API 和注册流程相同，但 web 构建有更严格的整数精度规则，因为 Dart `int` 由 JavaScript number 表示。

## 支持的目标

Dart 运行时支持：

- Dart VM/JIT 应用。
- Dart AOT/native 应用。
- Flutter 移动端和桌面端应用。
- 编译为浏览器 JavaScript 的 Dart 应用。
- Flutter web 应用。
- 在所有受支持目标上使用生成的 `@ForyStruct` 序列化器和手动注册的序列化器。

## 必须使用代码生成

Fory Dart 使用显式注册，而不是运行时反射。对于带注解的 struct，请先运行代码生成并注册生成的序列化器，然后再序列化或反序列化值：

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
  AccountFory.register(
    fory,
    Account,
    namespace: 'example',
    typeName: 'Account',
  );

  final bytes = fory.serialize(Account()..name = 'web');
  final account = fory.deserialize<Account>(bytes);
  print(account.name);
}
```

在构建或测试前生成配套文件：

```bash
cd dart/packages/fory
dart run build_runner build --delete-conflicting-outputs
```

注册调用在 VM/AOT、Flutter 和 web 上相同。手写序列化器使用 `registerSerializer(...)`；生成的 struct 使用生成的 `register` 包装器。

## 64 位整数规则

Dart VM 的 `int` 值是有符号 64 位值。Dart web 的 `int` 值由 JavaScript number 支撑，只在 JavaScript 安全整数范围内精确：

```text
-9007199254740991 <= value <= 9007199254740991
```

选择字段类型时使用以下规则：

| 逻辑值                                 | web 上推荐的 Dart 字段类型          | 说明                                                                                 |
| -------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------ |
| JS 安全范围内的有符号 64 位值          | `int`                               | 可用于默认 `int64` 映射以及 `@ForyField(type: Int64Type(...))` 编码。                |
| 完整的有符号 64 位范围                 | `Int64`                             | 保留 JS 安全范围之外的值。                                                           |
| 无符号 64 位值                         | `Uint64`                            | 对无法放入有符号或 JS 安全 Dart `int` 的值是必需的。                                 |
| 8/16/32 位整数                         | `int` + `@ForyField(type: ...)`     | 使用显式字段元信息与对端运行时精确匹配。                                             |

`@ForyField(type: Int64Type(...))` 控制 Dart `int` 字段的编码格式：

```dart
@ForyStruct()
class SafeCounter {
  SafeCounter();

  @ForyField(type: Int64Type(encoding: Encoding.tagged))
  int count = 0; // 将 web 值保持在 JS 安全范围内
}
```

它不会让 Dart `int` 在 web 上能够存储所有 64 位值。对于完整范围的有符号值，请使用 `Int64`：

```dart
@ForyStruct()
class FullRangeCounter {
  FullRangeCounter();

  Int64 count = Int64(0);
}
```

对于无符号值，请使用 `Uint64`：

```dart
@ForyStruct()
class StorageExtent {
  StorageExtent();

  Uint64 byteOffset = Uint64(0);
}
```

## 自定义序列化器

自定义序列化器可以在 VM/AOT、Flutter 和 web 上使用相同的 `Buffer`、`WriteContext` 与 `ReadContext` API。对于 64 位值：

- 对完整范围的有符号 64 位值，使用 `buffer.writeInt64(Int64(...))` 和 `buffer.readInt64()`。
- 对完整范围的无符号 64 位值，使用 `buffer.writeUint64(Uint64(...))` 和 `buffer.readUint64()`。
- 仅当值本来就要作为 Dart `int` 使用，因此在 web 上必须保持 JS 安全时，才使用 `writeInt64FromInt`、`writeVarInt64FromInt` 以及匹配的 `AsInt` 读取方法。

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

## 集合和类型化数组

`List`、`Set`、`Map`、`Uint8List`、数值类型化数组、`Int64List` 和 `Uint64List` 在 web 上都受支持。`Int64List` 和 `Uint64List` 的实现会保留 64 位值，不依赖 JavaScript 整数精度。当 schema 是 `array<int64>` 或 `array<uint64>` 时，请使用 Fory 包装 list 类型。

## 测试浏览器构建

修改必须在 web 上工作的代码时，请同时在 VM 和 Chrome 中运行包测试：

```bash
cd dart/packages/fory
dart run build_runner build --delete-conflicting-outputs
dart test
dart test -p chrome
```

如果 Chrome 测试因生成文件过期或缺少 part 文件而失败，请重新运行 `build_runner`，然后从 `dart/packages/fory` 目录重试测试命令。

## 常见 Web 失败

### `Dart int value ... is outside the JS-safe signed int64 range`

序列化器正尝试在 web 上把 Dart `int` 写成有符号 64 位值，但该值超出了 JavaScript number 可以精确表示的范围。请将字段类型改为 `Int64`，或把值保持在 JS 安全范围内。

### `Int64 value ... is not a JS-safe int`

反序列化器读取了完整范围的 `Int64`，但目标字段或自定义序列化器要求 Dart `int`。请将字段类型改为 `Int64`，或使用 `readInt64()` 解码，而不是使用 `AsInt` 辅助方法。

### `Uint64 value ... is not a JS-safe int`

代码正在 web 上把 `Uint64` 转换为 Dart `int`。除非应用已经验证该值位于 JS 安全的非负范围内，否则请保持为 `Uint64`。

## 相关主题

- [支持的类型](supported-types.md)
- [Schema 元信息](schema-metadata.md)
- [代码生成](code-generation.md)
- [故障排查](troubleshooting.md)
