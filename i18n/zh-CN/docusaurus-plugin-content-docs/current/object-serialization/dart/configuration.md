---
title: 配置
sidebar_position: 4
id: configuration
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

本页说明 `Fory` 构造函数选项。

## 创建 `Fory` 实例

将选项直接传给构造函数：

```dart
import 'package:fory/fory.dart';

// defaults: xlang wire format with compatible schema evolution
final fory = Fory();

// customize limits while keeping default compatible mode
final fory = Fory(
  maxDepth: 512,
  maxTypeFields: 512,
  maxTypeMetaBytes: 4096,
  maxSchemaVersionsPerType: 10,
  maxAverageSchemaVersionsPerType: 3,
  maxGraphMemoryBytes: 64 * 1024 * 1024,
  maxUnbackedContainerItems: 8192,
);
```

每个应用创建并复用一个实例；每个请求都创建新的 `Fory` 没有任何好处。

## 选项

### `compatible`

兼容模式默认启用。当服务需要处理同一模型不同版本的载荷时，请保持启用，例如滚动部署或客户端与服务端版本不一致期间。

当 `compatible: true` 时：

- 一端新增或删除字段不会破坏另一端。
- 通信方仍必须使用相同 `name`（或数字 `id`）标识类型。

当 `compatible: false` 时：

- 双方必须具有完全相同的 Schema。仅当每个读取端和写入端始终使用该 Schema，并且希望获得更快序列化和更小体积时，才使用此设置。对于跨语言载荷，只有确认每种语言使用相同 Schema，或原生类型由 Fory Schema IDL 生成时，才设置 `compatible: false`。

```dart
final fory = Fory(compatible: false);
```

### `checkStructVersion`

仅在 `compatible: false` 时相关。当设为 `true` 时，Fory 会验证载荷中的 Schema 版本是否与接收端已知版本匹配，从而发现有意使用相同 Schema 的载荷中的意外不匹配。

```dart
final fory = Fory(
  compatible: false,
  checkStructVersion: true, // default
);
```

当 `compatible: true` 时，此选项无效。

### `maxDepth`

限制对象图的嵌套深度。数据确实包含深层树时提高此值；降低此值可以快速拒绝深度超出预期的载荷。

```dart
final fory = Fory(maxDepth: 128);
```

### 远程 Schema 元数据限制

兼容模式可以接收用于 Schema 演进的远程元数据。以下限制约束元数据大小和允许的 Schema 版本数：

```dart
final fory = Fory(
  maxTypeFields: 512,
  maxTypeMetaBytes: 4096,
  maxSchemaVersionsPerType: 10,
  maxAverageSchemaVersionsPerType: 3,
);
```

- `maxTypeFields` 限制单个已接收 struct 元数据主体中的字段数。
- `maxTypeMetaBytes` 限制单个已接收 TypeMeta 主体中的编码主体字节数，不包括 8 字节头部和任何扩展大小 varint。
- `maxSchemaVersionsPerType` 限制单个逻辑类型允许的远程元数据版本数。
- `maxAverageSchemaVersionsPerType` 限制所有已接受远程类型的平均值。有效的全局下限为 `8192` 个 Schema。

### `maxGraphMemoryBytes`

设置单次根值反序列化的近似对象图内存限制。该估算主要覆盖物化的 list、set、map、array、struct 和 object。它会跳过 string、binary data、primitive scalar 和 dense typed-array 载荷等叶子值，因此实际进程内存可能高于此值。叶子值仍受可用字节检查保护：如果未读输入不包含足够字节，Fory 不会读取或创建该叶子值。

默认值固定为 `128 MiB`，不会根据输入大小推导。

当可信工作负载确实需要更大或更小的 collection/map/struct 限制时，请设置正值：

```dart
final fory = Fory(maxGraphMemoryBytes: 256 * 1024 * 1024);
```

创建运行时时会拒绝显式的非正值。

### `maxUnbackedContainerItems`

限制一次根值反序列化中，重复读取主体不按比例消费输入的集合元素和 map 条目。默认值为 `8192`；零表示严格限制。

```dart
final fory = Fory(maxUnbackedContainerItems: 8192);
```

## 默认值

| 选项                              | 默认值    |
| --------------------------------- | --------- |
| `compatible`                      | `true`    |
| `checkStructVersion`              | `false`   |
| `maxDepth`                        | 256       |
| `maxTypeFields`                   | 512       |
| `maxTypeMetaBytes`                | 4096      |
| `maxSchemaVersionsPerType`        | 10        |
| `maxAverageSchemaVersionsPerType` | 3         |
| `maxGraphMemoryBytes`             | 134217728 |
| `maxUnbackedContainerItems`       | 8192      |

## 跨语言说明

使用 Fory 在不同语言编写的服务之间通信时：

- 如果任意一端需要 Schema 演进，请在所有端保持启用兼容模式。
- 所有端使用相同数字 ID 或 `name` 值。
- 写入端和读取端的 `compatible` 设置必须匹配；模式不匹配会失败。

## 安全

安全相关配置：

- 反序列化不可信载荷前，只注册预期的生成模型。
- 对有意使用的相同 Schema 载荷，将 `checkStructVersion: true` 与 `compatible: false` 结合使用。
- 设置 `maxDepth`，拒绝深度超出预期的载荷结构。
- 对大多数输入保持 `maxGraphMemoryBytes` 默认值；对于已知可信且包含大量 collection/map/struct 的载荷，也可以设置显式正字节数限制。
- 保持远程 Schema 元数据限制的默认值，除非数据可信且可信通信方会发送更大的元数据或大量 Schema 版本。
- 对不可信输入，优先使用生成的 Schema 和显式字段元数据，而不是宽泛的动态字段。

## 相关主题

- [基本序列化](core-api.md)
- [Schema 演进](schema-evolution.md)
- [跨语言序列化](core-api.md#cross-language-interoperability)
