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

Fory JavaScript 是仅支持 xlang 的实现。`new Fory()` 写入 xlang 载荷，并默认使用兼容 Schema 演进。JavaScript API 中不存在原生模式开关。

## 基本配置

```ts
import Fory from "@apache-fory/core";

const fory = new Fory();
```

为每个应用区域创建并复用一个 `Fory` 实例。注册会为每个 Schema 生成并缓存序列化器代码。

## 构造函数选项

```ts
import Fory from "@apache-fory/core";
import hps from "@apache-fory/hps";

const fory = new Fory({
  ref: true,
  compatible: true,
  maxDepth: 100,
  maxGraphMemoryBytes: 128 * 1024 * 1024,
  maxUnbackedContainerItems: 8192,
  maxTypeFields: 512,
  maxTypeMetaBytes: 4096,
  maxSchemaVersionsPerType: 10,
  maxAverageSchemaVersionsPerType: 3,
  hps,
});
```

| 选项                              | 默认值    | 说明                                                            |
| --------------------------------- | --------- | --------------------------------------------------------------- |
| `ref`                             | `false`   | 为共享引用或循环对象图启用引用跟踪                              |
| `compatible`                      | `true`    | 允许新增或删除字段而不破坏现有消息                              |
| `maxDepth`                        | `50`      | 最大嵌套深度。必须为 `>= 2`。深层嵌套结构可提高此值             |
| `maxGraphMemoryBytes`             | `128 MiB` | 单次根值反序列化允许的近似对象图内存限制                        |
| `maxUnbackedContainerItems`       | `8192`    | 单次根值反序列化允许的无输入支撑集合元素和 map 条目数           |
| `maxTypeFields`                   | `512`     | 单个已接收远程 struct 元数据主体允许的最大字段数                |
| `maxTypeMetaBytes`                | `4096`    | 单个已接收 TypeMeta 主体允许的最大编码主体字节数                |
| `maxSchemaVersionsPerType`        | `10`      | 单个逻辑类型允许的最大远程元数据版本数                          |
| `maxAverageSchemaVersionsPerType` | `3`       | 所有已接受远程类型允许的平均远程元数据版本数                    |
| `useSliceString`                  | `false`   | 可选的 Node.js 字符串读取优化。除非已经基准测试，否则保留默认值 |
| `hps`                             | 未设置    | 来自 `@apache-fory/hps` 的可选快速字符串辅助模块（Node.js 20+） |
| `hooks.afterCodeGenerated`        | 未设置    | 检查生成的序列化器代码的回调，适用于调试                        |

## 引用跟踪

必须先启用全局引用跟踪，字段级引用元数据才能生效：

```ts
const fory = new Fory({ ref: true });
```

然后在 Schema 中标记启用引用跟踪的字段，例如使用 `Type.struct("example.node").setTrackingRef(true)`。参见[引用](references.md)和 [Schema 元数据](schema-metadata.md)。

## 兼容 Schema 演进

默认使用兼容模式。要获得更快序列化和更小体积：

```ts
const fory = new Fory({ compatible: false });
```

滚动升级、独立部署服务和跨语言载荷应使用兼容模式。仅当每个读取端和写入端始终使用相同 struct Schema，并且希望获得更快序列化和更小体积时，才使用 `compatible: false`。对于单个 struct，`evolving: false` 会对该 struct 应用相同的退出设置。对于跨语言载荷，只有确认每种语言使用相同 Schema，或原生类型由 Fory Schema IDL 生成时，才设置 `compatible: false`。参见 [Schema 演进](schema-evolution.md)。

## 对象图内存预算

`maxGraphMemoryBytes` 设置单次根值反序列化的近似对象图内存限制。该估算主要覆盖物化的 array、set、map、struct 和 object。它会跳过 string、binary data、primitive scalar 和 dense primitive array 等叶子值，因此实际 JavaScript 堆使用量可能高于此值。叶子值仍受可用字节检查保护：如果未读输入不包含足够字节，Fory 不会读取或创建该叶子值。默认值固定为 `128 MiB`，不会根据输入大小推导。

使用正字节数显式设置更低或更高的限制：

```ts
const fory = new Fory({
  maxGraphMemoryBytes: 32 * 1024 * 1024,
});
```

创建 Fory 实例时会拒绝显式的非正值。

String、binary 和专用 dense primitive array 载荷保留普通字节大小检查，不消费此对象图预算。仅对确实包含非常紧凑对象图的可信工作负载提高限制。

## 无输入支撑容器工作预算

`maxUnbackedContainerItems` 限制一次根值反序列化中，重复读取主体不按比例消费输入的集合元素和 map 条目。默认值为 `8192`；零表示严格限制。仅对有意使用紧凑零字节 codec 的可信载荷提高此值。

## 可选 HPS 字符串路径

`@apache-fory/hps` 提供可选的 Node.js 字符串快速路径：

```ts
import hps from "@apache-fory/hps";

const fory = new Fory({ hps });
```

除非运行在 Node.js 20+ 上且已经对工作负载进行基准测试，否则不要设置此项。

## 安全

有关信任边界、安全的读取端配置和验证方法，请参阅 [JavaScript/TypeScript 安全](security.md)。

## 相关主题

- [基本序列化](basic-serialization.md)
- [Schema 元数据](schema-metadata.md)
- [Schema 演进](schema-evolution.md)
- [引用](references.md)
