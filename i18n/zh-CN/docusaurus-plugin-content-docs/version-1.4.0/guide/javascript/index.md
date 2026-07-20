---
title: JavaScript 序列化指南
sidebar_position: 0
id: index
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

Apache Fory JavaScript 让你可以把 JavaScript 和 TypeScript 对象序列化为字节，并再把它们反序列化回来，包括与 Java、Python、Go、Rust、Swift 以及其他 Fory 支持的语言编写的服务进行跨语言互通。

## 为什么选择 Fory JavaScript？

- **跨语言**：可以在 JavaScript 中序列化，在 Java、Python、Go 等语言中反序列化，无需编写胶水代码
- **高性能**：序列化器代码会在首次注册 schema 时生成并缓存，而不是每次调用时都重新生成
- **具备引用感知能力**：启用后可支持共享引用和循环对象图
- **显式 schema**：字段类型、可空性和多态行为通过 `Type.*` builder 或 TypeScript decorator 一次性声明
- **安全默认值**：可配置的深度、二进制大小和集合大小限制可以拒绝超出预期的大载荷或深层嵌套载荷
- **现代类型支持**：支持 `bigint`、typed array、`Map`、`Set`、`Date`、`float16` 和 `bfloat16`

## 安装

从 npm 安装 JavaScript 包：

```bash
npm install @apache-fory/core
```

可选的 Node.js 字符串快速路径支持由 `@apache-fory/hps` 提供：

```bash
npm install @apache-fory/core @apache-fory/hps
```

`@apache-fory/hps` 依赖 Node.js 20+，并且是可选的。如果不可用，Fory 仍可正常工作；只需在配置中省略 `hps`。

## 快速开始

```ts
import Fory, { Type } from "@apache-fory/core";

const userType = Type.struct(
  { typeName: "example.user" },
  {
    id: Type.int64(),
    name: Type.string(),
    age: Type.int32(),
  },
);

const fory = new Fory();
const { serialize, deserialize } = fory.register(userType);

const bytes = serialize({
  id: 1n,
  name: "Alice",
  age: 30,
});

const user = deserialize(bytes);
console.log(user);
// { id: 1n, name: 'Alice', age: 30 }
```

## 工作原理

Fory 是由 schema 驱动的。你先用 `Type.*` builder 或 TypeScript decorator 描述一次数据结构，然后调用 `fory.register(schema)`。这会返回一个可高频复用、调用开销较低的 `{ serialize, deserialize }` 对。

```ts
// 1. 定义 schema
const personType = Type.struct("example.person", {
  name: Type.string(),
  email: Type.string().setNullable(true),
});

// 2. 注册一次
const fory = new Fory();
const { serialize, deserialize } = fory.register(personType);

// 3. 按需重复使用
const bytes = serialize({ name: "Alice", email: null });
const person = deserialize(bytes);
```

每个应用创建一个 `Fory` 实例并持续复用即可；如果每个请求都新建实例，就会浪费 schema 注册带来的缓存收益。

## 配置

```ts
import Fory from "@apache-fory/core";
import hps from "@apache-fory/hps";

const fory = new Fory({
  ref: true,
  compatible: true,
  maxDepth: 100,
  maxBinarySize: 64 * 1024 * 1024,
  maxCollectionSize: 1_000_000,
  hps,
});
```

| 选项                       | 默认值      | 说明                                                                                 |
| -------------------------- | ----------- | ------------------------------------------------------------------------------------ |
| `ref`                      | `false`     | 为共享引用或循环对象图启用引用跟踪                                                   |
| `compatible`               | `false`     | 允许在不破坏现有消息的前提下新增或删除字段                                           |
| `maxDepth`                 | `50`        | 最大嵌套深度，必须 `>= 2`。如果结构嵌套很深，可适当调大                              |
| `maxBinarySize`            | 64 MiB      | 任意单个二进制字段可接受的最大字节数                                                 |
| `maxCollectionSize`        | `1_000_000` | 任意 list、set 或 map 中可接受的最大元素数                                           |
| `useSliceString`           | `false`     | Node.js 下的可选字符串读取优化。除非做过基准测试，否则保持默认即可                   |
| `hps`                      | unset       | 来自 `@apache-fory/hps` 的可选快速字符串辅助模块（Node.js 20+）                      |
| `hooks.afterCodeGenerated` | unset       | 用于查看生成后的序列化器代码的回调，对调试很有帮助                                   |

## 文档导航

| 主题                                          | 说明                                                   |
| --------------------------------------------- | ------------------------------------------------------ |
| [基础序列化](basic-serialization.md)          | 核心 API 与日常用法                                    |
| [类型注册](type-registration.md)              | 数值 ID、名称、decorator 与 schema 注册方式            |
| [支持的类型](supported-types.md)              | 原始类型、集合、时间、枚举与 struct 的映射方式         |
| [引用](references.md)                         | 共享引用与循环对象图                                   |
| [Schema 演进](schema-evolution.md)            | 兼容模式与 struct 演进                                 |
| [跨语言](xlang-serialization.md)                   | 互操作指导与类型映射规则                               |
| [故障排查](troubleshooting.md)                | 常见问题、限制项与调试技巧                             |

## 相关资源

- [Xlang 序列化规范](../../specification/xlang_serialization_spec.md)
- [跨语言类型映射](../../specification/xlang_type_mapping.md)
