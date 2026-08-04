---
title: Schema 演进
sidebar_position: 6
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

Schema 演进允许不同版本的服务安全交换消息：v2 写入端可以生成 v1 读取端仍能理解的消息，反之亦然。

## 兼容模式

兼容模式是默认设置。它会写入额外的字段元数据，使读取端可以跳过未知字段并容忍缺失字段。独立部署、滚动升级和 xlang 服务应保留此模式。对于读写 Schema 永远相同的载荷，请参见[各模式的适用场景](#when-to-use-each-mode)。

当转换无损时，兼容读取端还允许部分标量字段类型变化。只要转换后的逻辑值相同，匹配字段就可以在 `boolean`、`string`、数值标量和 `Decimal` 之间读取。例如，`"true"`、`"false"`、`"1"` 和 `"0"` 可以读取为布尔值；精确且有限的 ASCII 数值字符串可以读取为能够容纳它们的数值字段；数值和 decimal 可以读取为规范字符串；数值拓宽或收窄仅在不损失精度或范围时成功。无效字符串和有损转换会在反序列化期间失败。可空字段仍可与这些转换组合，但启用引用跟踪的标量类型变化不兼容。

## 默认兼容模式

```ts
const fory = new Fory();
```

以下情况使用此模式：

- 服务独立部署 Schema 变更
- 旧读取端可能收到新载荷
- 新读取端可能收到新增字段之前生成的旧载荷

## 示例

写入端 Schema：

```ts
const writerType = Type.struct(
  { typeId: 1001 },
  {
    name: Type.string(),
    age: Type.int32(),
  },
);
```

字段更少的读取端 Schema：

```ts
const readerType = Type.struct(
  { typeId: 1001 },
  {
    name: Type.string(),
  },
);
```

在兼容模式下，读取端会忽略不了解的字段，并用默认值填充未知字段。

## 各模式的适用场景 {#when-to-use-each-mode}

| 需求                              | 相同 Schema 退出设置 | 兼容模式 |
| --------------------------------- | -------------------- | -------- |
| 每个读取端和写入端使用相同 Schema | 可用                 | 可用     |
| 独立部署                          | 不安全               | 推荐     |
| 相同 Schema 数据的最佳体积和速度  | 是                   | 否       |
| 滚动升级                          | 不安全               | 推荐     |

对于 xlang 载荷，只有确认每种语言使用相同 Schema，或原生类型由 Fory Schema IDL 生成时，才设置 `compatible: false`。

## 按 Struct 退出相同 Schema 元数据

即使在 `compatible: true` 实例中，也可以为特定 struct 禁用演进元数据：

```ts
const fixedType = Type.struct(
  { typeId: 1002, evolving: false },
  {
    name: Type.string(),
  },
);
```

对该 struct 而言，`evolving: false` 可以更快、体积更小。仅当每个读取端和写入端始终使用相同 struct Schema 时才使用它。如果一端使用 `evolving: false` 写入，而另一端期望兼容元数据进行读取，反序列化将失败。

## 跨语言要求

兼容模式只能处理类型*字段*之间的 Schema 差异。各方仍需使用相同的类型标识（相同数字 ID 或相同 `typeName`）。参见[跨语言序列化](basic-serialization.md#cross-language-interoperability)。

## 相关主题

- [类型注册](type-registration.md)
- [跨语言序列化](basic-serialization.md#cross-language-interoperability)
