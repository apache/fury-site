---
title: JavaScript/TypeScript 对象序列化
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

Apache Fory JavaScript 可以将 JavaScript 和 TypeScript 对象序列化为字节并反序列化，也能跨使用 Java、Python、C++、Go、Rust、C#、Swift、Dart、Scala、Kotlin 及其他 Fory 支持语言编写的服务使用。

## 为什么选择 Fory JavaScript？

- **跨语言**：在 JavaScript/TypeScript 中序列化，在任意受支持的 Fory 库中反序列化，无需编写粘合代码
- **快速**：首次注册 Schema 时生成并缓存序列化器代码，而不是每次调用都生成
- **支持引用**：启用后支持共享引用和循环对象图
- **显式 Schema**：使用 `Type.*` 构建器或 TypeScript 装饰器一次性声明字段类型、可空性和多态
- **安全默认值**：可配置的深度检查会拒绝深度超出预期的载荷
- **现代类型**：支持 `bigint`、typed array、`Map`、`Set`、`Date`、`float16` 和 `bfloat16`

## 安装

从 npm 安装 JavaScript 包：

```bash
npm install @apache-fory/core
```

可以通过 `@apache-fory/hps` 获得可选的 Node.js 字符串快速路径支持：

```bash
npm install @apache-fory/core @apache-fory/hps
```

`@apache-fory/hps` 依赖 Node.js 20+，但它是可选的。如果无法使用，Fory 仍能正常工作；只需从配置中省略 `hps`。

## 快速入门

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

## 通过 Fory IDL 生成代码

也可以在 Fory IDL 中定义 Schema，并生成 TypeScript 模型文件：

```protobuf
package example;

message Person {
  string name = 1;
  int32 age = 2;
}
```

生成 JavaScript/TypeScript 代码：

```bash
foryc person.fdl --javascript_out=./generated
```

生成的模型文件会导出 TypeScript interface、enum、union、注册辅助函数和根值序列化辅助函数：

```ts
import {
  Person,
  deserializePerson,
  registerPersonTypes,
  serializePerson,
} from "./generated/person";

const bytes = serializePerson({ name: "Alice", age: 30 });
const person: Person = deserializePerson(bytes);
```

自行管理 `Fory` 实例时，请先注册生成的 Schema 模块，再使用该实例序列化值：

```ts
import Fory from "@apache-fory/core";
import { registerPersonTypes } from "./generated/person";

const fory = new Fory();
const { person } = registerPersonTypes(fory);

const bytes = person.serialize({ name: "Alice", age: 30 });
const copy = person.deserialize(bytes);
```

## 工作原理

Fory 由 Schema 驱动。先使用 `Type.*` 构建器（或 TypeScript 装饰器）描述一次数据结构，再调用 `fory.register(schema)`。该方法返回 `{ serialize, deserialize }`，可以高效地重复调用。

```ts
// 1. Define the schema
const personType = Type.struct("example.person", {
  name: Type.string(),
  email: Type.string().setNullable(true),
});

// 2. Register once
const fory = new Fory();
const { serialize, deserialize } = fory.register(personType);

// 3. Use as many times as needed
const bytes = serialize({ name: "Alice", email: null });
const person = deserialize(bytes);
```

每个应用创建并复用一个 `Fory` 实例；每次请求都创建新实例会浪费 Schema 注册工作。

## 配置

Fory JavaScript 仅支持 xlang。`new Fory()` 默认使用兼容 Schema 演进。通过构造函数选项配置引用跟踪、最大读取深度和可选 Node.js 字符串加速；参见[配置](configuration.md)。

## 文档

| 主题                                       | 说明                                      |
| ------------------------------------------ | ----------------------------------------- |
| [基本序列化](core-api.md)                  | 核心 API 和日常用法                       |
| [配置](configuration.md)                   | Fory 选项、兼容模式、限制和 HPS           |
| [类型注册](type-registration.md)           | 数字 ID、名称、装饰器和 Schema 注册       |
| [Schema 元数据](schema-metadata.md)        | 类型构建器、字段选项和装饰器              |
| [支持的类型](supported-types.md)           | 原始类型、集合、时间、enum 和 struct 映射 |
| [引用](references.md)                      | 共享引用和循环对象图                      |
| [Schema 演进](schema-evolution.md)         | 兼容模式和可演进 struct                   |
| [跨语言序列化](xlang.md)                   | 互操作指南和映射规则                      |
| [Fory IDL 编译器](../../compiler/index.md) | 从 `.fdl` Schema 生成 TypeScript 模型     |
| [gRPC 支持](../../grpc/javascript.md)      | Node.js gRPC 和浏览器 gRPC-Web 生成客户端 |
| [故障排查](troubleshooting.md)             | 常见问题、限制和调试技巧                  |

## 相关资源

- [跨语言序列化规范](../../specification/xlang_serialization_spec.md)
- [跨语言类型映射](../../specification/xlang_type_mapping.md)
