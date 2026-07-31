---
title: Schema 演进
sidebar_position: 60
id: schema_evolution
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

Schema 演进允许不同版本的服务安全地交换消息。也就是说，v2 写入端生成的消息，v1 读取端仍然可以理解，反之亦然。

## 两种模式

- **Schema-consistent 模式**（默认）：更紧凑，但双方必须拥有完全相同的 schema。适合所有服务统一升级的场景。
- **兼容模式**：会写入额外的字段元信息，使读取端能够跳过未知字段并容忍缺失字段。适合独立部署或滚动升级场景。

## 启用兼容模式

```ts
const fory = new Fory({ compatible: true });
```

以下情况建议使用：

- 服务会独立发布 schema 变更
- 较旧的读取端可能会看到较新的载荷
- 较新的读取端可能会看到字段尚未添加之前产生的旧载荷

## 示例

写入端 schema：

```ts
const writerType = Type.struct(
  { typeId: 1001 },
  {
    name: Type.string(),
    age: Type.int32(),
  },
);
```

字段更少的读取端 schema：

```ts
const readerType = Type.struct(
  { typeId: 1001 },
  {
    name: Type.string(),
  },
);
```

启用 `compatible: true` 后，读取端会忽略自己不认识的字段，并为未知字段填充默认值。

## 为单个 Struct 关闭演进

即使实例启用了 `compatible: true`，你仍然可以为某个特定 struct 关闭演进元信息：

```ts
const fixedType = Type.struct(
  { typeId: 1002, evolving: false },
  {
    name: Type.string(),
  },
);
```

`evolving: false` 会让该 struct 的消息更小，但**写入端和读取端必须在这个设置上保持一致**。如果一侧以 `evolving: false` 写入，而另一侧按兼容元信息读取，反序列化将失败。

## 何时使用每种模式

|                                 | Schema-consistent | Compatible          |
| ------------------------------- | ----------------- | ------------------- |
| 服务总是同时更新                | ✔ 最佳选择        | 可用，但有浪费      |
| 独立部署                        | 会出错            | ✔ 最佳选择          |
| 需要尽可能小的消息              | ✔                 | 稍大一些            |
| 滚动升级                        | 有风险            | ✔ 安全              |

## 跨语言要求

兼容模式只能帮你处理类型**字段**层面的 schema 差异。对于类型标识本身，你仍然需要在各端保持一致，即相同的数值 ID 或相同的 `namespace + typeName`。参见 [跨语言](xlang-serialization.md)。

## 相关主题

- [类型注册](type-registration.md)
- [跨语言](xlang-serialization.md)
