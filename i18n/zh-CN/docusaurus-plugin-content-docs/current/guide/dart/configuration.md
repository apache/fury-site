---
title: 配置
sidebar_position: 1
id: dart_configuration
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

本页介绍 `Fory` 构造函数的可选项。

## 创建 `Fory` 实例

直接把选项传给构造函数：

```dart
import 'package:fory/fory.dart';

// 默认配置：xlang 编码格式并启用兼容的 Schema 演进
final fory = Fory();

// 自定义限制，同时保留默认兼容模式
final fory = Fory(
  maxDepth: 512,
  maxTypeFields: 512,
  maxTypeMetaBytes: 4096,
  maxSchemaVersionsPerType: 10,
  maxAverageSchemaVersionsPerType: 3,
  maxGraphMemoryBytes: 64 * 1024 * 1024,
);
```

每个应用创建一个实例并复用即可。按请求新建 `Fory` 没有任何收益。

## 选项

### `compatible`

兼容模式默认启用。当服务需要处理同一模型不同版本产生的载荷时，例如滚动部署或客户端与服务端版本不一致时，请保持启用。

当 `compatible: true` 时：

- 一侧新增或删除字段不会破坏另一侧。
- 各端仍然必须使用相同的 `name` 或数字 `id` 来标识类型。

当 `compatible: false` 时：

- 双方必须拥有完全相同的 Schema。只有每个读写端始终使用该 Schema，并且需要更快的序列化速度和更小的体积时，才这样设置。对于跨语言载荷，只有确认每种语言都使用相同 Schema，或 native 类型由 Fory schema IDL 生成后，才设置 `compatible: false`。

```dart
final fory = Fory(compatible: false);
```

### `checkStructVersion`

仅在 `compatible: false` 时相关。当它为 `true` 时，Fory 会校验载荷中的 Schema 版本是否与接收端已知版本一致，从而在运行时尽早发现误用的 Schema。

```dart
final fory = Fory(
  compatible: false,
  checkStructVersion: true,
);
```

当 `compatible: true` 时，这个选项不起作用。

### `maxDepth`

限制对象图的最大嵌套深度。如果你的数据确实有很深的树形结构，可以增大它；如果你想快速拒绝异常深的载荷，可以减小它。

```dart
final fory = Fory(maxDepth: 128);
```

### 远端 Schema Metadata 限制

兼容模式可能接收用于 Schema 演进的远端 metadata。以下限制用于约束 metadata 大小和可接受的 schema 版本数：

```dart
final fory = Fory(
  maxTypeFields: 512,
  maxTypeMetaBytes: 4096,
  maxSchemaVersionsPerType: 10,
  maxAverageSchemaVersionsPerType: 3,
);
```

- `maxTypeFields` 限制一个收到的 struct metadata body 中的字段数。
- `maxTypeMetaBytes` 限制一个收到的 TypeMeta body 的编码 body 字节数，不包含 8 字节 header 和扩展 size varint。
- `maxSchemaVersionsPerType` 限制一个逻辑类型可接受的远端 metadata 版本数。
- `maxAverageSchemaVersionsPerType` 限制所有已接受远端类型的平均版本数；有效全局下限为 `8192` 个 schema。

### `maxGraphMemoryBytes`

为单次根对象反序列化设置近似的对象图内存限制。该估算主要涵盖实例化后的 list、set、map、array、struct 和 object。string、binary、基础标量和稠密 typed-array 载荷等叶子值不计入其中，因此实际进程内存可能高于该值。叶子值仍受可用字节数检查保护：如果未读取的输入没有足够字节，Fory 就不会读取或创建该叶子值。

默认值固定为 `128 MiB`，不会根据输入大小推导。

可信工作负载确实需要更大或更小的 collection、map 或 struct 限制时，请设置正数值：

```dart
final fory = Fory(maxGraphMemoryBytes: 256 * 1024 * 1024);
```

显式传入非正数时，运行时创建会失败。

### `maxCollectionSize`

任意单个 list、set 或 map 字段可接受的最大元素数。用于防止畸形消息触发失控的内存分配。

```dart
final fory = Fory(maxCollectionSize: 100000);
```

### `maxBinarySize`

任意单个二进制 blob 字段允许接受的最大字节数。

```dart
final fory = Fory(maxBinarySize: 8 * 1024 * 1024);
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
| `maxCollectionSize`               | 1 048 576 |
| `maxBinarySize`                   | 64 MiB    |

## 跨语言说明

当 Fory 用于不同语言实现的服务之间通信时：

- 如果任意一端需要 Schema 演进，则**所有**端都应设置 `compatible: true`。
- 每一端都要使用相同的数字 ID，或者相同的 `namespace + typeName` 组合。
- 写端和读端的 `compatible` 设置必须一致，模式不匹配会直接失败。
- 对大多数输入保留 `maxGraphMemoryBytes` 的默认值；只有已知可信的载荷确实包含大量 collection、map 或 struct 时，才显式设置其他正数的字节限制。
- 除非数据不是恶意输入，且可信 peer 会发送更大的 metadata 或大量 schema 版本，否则保持远端 schema metadata 限制的默认值。

## 相关主题

- [基础序列化](basic-serialization.md)
- [Schema 演进](schema-evolution.md)
- [跨语言](xlang-serialization.md)
