---
title: 配置
sidebar_position: 2
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

Fory JavaScript 是仅支持 xlang 的运行时。`new Fory()` 会写入 xlang 载荷，并默认使用兼容 Schema 演进。JavaScript API 中没有原生模式开关。

## 基本配置

```ts
import Fory from "@apache-fory/core";

const fory = new Fory();
```

每个应用区域创建一个 `Fory` 实例并复用它。注册会为每个 schema 生成并缓存序列化器代码。

## 构造函数选项

```ts
import Fory from "@apache-fory/core";
import hps from "@apache-fory/hps";

const fory = new Fory({
  ref: true,
  compatible: true,
  maxDepth: 100,
  maxGraphMemoryBytes: 128 * 1024 * 1024,
  maxTypeFields: 512,
  maxTypeMetaBytes: 4096,
  maxSchemaVersionsPerType: 10,
  maxAverageSchemaVersionsPerType: 3,
  maxBinarySize: 64 * 1024 * 1024,
  maxCollectionSize: 1_000_000,
  hps,
});
```

| 选项                              | 默认值      | 说明                                                             |
| --------------------------------- | ----------- | ---------------------------------------------------------------- |
| `ref`                             | `false`     | 为共享或循环对象图启用引用跟踪                                   |
| `compatible`                      | `true`      | 允许新增或删除字段而不破坏现有消息                               |
| `maxDepth`                        | `50`        | 最大嵌套深度。必须 `>= 2`。对于深度嵌套结构可以调大              |
| `maxGraphMemoryBytes`             | 128 MiB     | 单次根对象反序列化可接受的近似对象图内存阈值                     |
| `maxTypeFields`                   | `512`       | 一个收到的远端 struct metadata body 最大字段数                   |
| `maxTypeMetaBytes`                | `4096`      | 一个收到的 TypeMeta body 最大编码字节数                          |
| `maxSchemaVersionsPerType`        | `10`        | 一个逻辑类型最大远端 metadata 版本数                             |
| `maxAverageSchemaVersionsPerType` | `3`         | 所有远端类型的平均 metadata 版本数                               |
| `maxBinarySize`                   | 64 MiB      | 任意单个二进制字段可接受的最大字节数                             |
| `maxCollectionSize`               | `1_000_000` | 任意 list、set 或 map 可接受的最大元素数                         |
| `useSliceString`                  | `false`     | Node.js 的可选字符串读取优化。除非已做基准测试，否则保持默认值   |
| `hps`                             | 未设置      | 来自 `@apache-fory/hps` 的可选快速字符串辅助库（Node.js 20+）    |
| `hooks.afterCodeGenerated`        | 未设置      | 用于检查生成的序列化器代码的回调，便于调试                       |

## 引用跟踪

必须先启用全局引用跟踪，字段级引用元信息才会生效：

```ts
const fory = new Fory({ ref: true });
```

然后在 schema 中标记需要引用跟踪的字段，例如 `Type.struct("example.node").setTrackingRef(true)`。参见[引用](references.md)和 [Schema 元信息](schema-metadata.md)。

## 兼容 Schema 演进

兼容模式是默认设置：

```ts
const fory = new Fory();
```

对于滚动升级、独立部署的服务以及跨语言载荷，请使用该默认设置。你可以通过 `evolving: false` 为某个稳定 struct 关闭它；参见 [Schema 演进](schema-evolution.md)。

## 对象图内存预算

`maxGraphMemoryBytes` 为单次根对象反序列化设置近似的对象图内存阈值。
估算主要涵盖实际创建的 array、set、map、struct 和 object；它不包含 string、
binary data、primitive scalar 和紧凑 primitive array 等叶子值，因此实际的
JavaScript heap 使用量可能高于这个值。叶子值仍受可用字节数检查保护：如果未读
输入没有足够的字节，Fory 就不会读取或创建该叶子值。默认值固定为 `128 MiB`，
不会根据输入大小推导。

可以用一个正数形式的字节值显式设置更低或更高的限制：

```ts
const fory = new Fory({
  maxGraphMemoryBytes: 32 * 1024 * 1024,
});
```

创建运行时时，显式传入非正数值会被拒绝。

string、binary 以及专用的紧凑 primitive array 载荷仍使用常规的字节大小检查，
不占用这项对象图预算。只有可信工作负载确实包含非常紧凑的对象图时才应提高限制。

## 可选 HPS 字符串路径

`@apache-fory/hps` 提供可选的 Node.js 字符串快速路径：

```ts
import hps from "@apache-fory/hps";

const fory = new Fory({ hps });
```

除非你运行在 Node.js 20+ 且已经对工作负载做过基准测试，否则保持未设置。

## 安全

安全相关配置：

- 在反序列化不可信载荷前，只注册预期的 schema。
- 根据服务可接受的最大嵌套深度设置 `maxDepth`。
- 将 `maxGraphMemoryBytes` 用作 collection、map、array、struct 和 object 密集型载荷的
  近似阈值。它不是精确的 heap 上限；叶子值受剩余输入字节数限制。
- 除非数据不是恶意输入，且可信 peer 会发送更大的远端 metadata，否则保持 `maxTypeFields` 和 `maxTypeMetaBytes` 的默认值。
- 除非数据不是恶意输入，且可信 peer 会发送大量远端 schema 版本，否则保持 `maxSchemaVersionsPerType` 和 `maxAverageSchemaVersionsPerType` 的默认值。
- 对不可信输入，优先使用显式的 `Type.struct(...)` schema，而不是 `Type.any()`。
- 只传入与你部署的运行时版本配套的官方包中的 `hps`。

## 相关主题

- [基本序列化](basic-serialization.md)
- [Schema 元信息](schema-metadata.md)
- [Schema 演进](schema-evolution.md)
- [引用](references.md)
