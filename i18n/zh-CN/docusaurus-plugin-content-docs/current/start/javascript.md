---
title: JavaScript/TypeScript 设置
sidebar_position: 6
id: javascript
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

Fory JavaScript/TypeScript 提供 xlang 对象序列化、生成的模型、Node.js gRPC 以及浏览器 gRPC-Web 客户端。相关软件包发布在 npm。core 软件包无需原生加速即可工作；可选的 `@apache-fory/hps` Node.js 快速路径需要 Node.js 20 或更高版本。

## 验证工具链

```bash
node --version
npm --version
```

## 对象序列化

安装 core 软件包：

```bash
npm install @apache-fory/core@1.5.0
```

定义 Schema 并运行 xlang 往返示例：

```js title="example.mjs"
import Fory, { Type } from "@apache-fory/core";

const userType = Type.struct(
  { typeName: "example.User" },
  {
    id: Type.int64(),
    name: Type.string(),
  },
);

const fory = new Fory();
const { serialize, deserialize } = fory.register(userType);

const bytes = serialize({ id: 1n, name: "Alice" });
console.log(deserialize(bytes));
```

```bash
node example.mjs
```

JavaScript 使用 xlang 模式。接下来可阅读 [JavaScript/TypeScript 对象序列化](../object-serialization/javascript/index.md)、[xlang 类型](../object-serialization/javascript/xlang.md)、[配置](../object-serialization/javascript/configuration.md)和 [Schema 演进](../object-serialization/javascript/schema-evolution.md)。

若要使用可选的 Node.js 字符串快速路径，请安装版本匹配的软件包：

```bash
npm install @apache-fory/core@1.5.0 @apache-fory/hps@1.5.0
```

## 其他能力

- **Fory IDL 与编译器** 生成 TypeScript 接口、Schema 和注册辅助代码。请参阅[编译器快速入门](../compiler/getting-started.md)和 [JavaScript 生成代码指南](../compiler/generated-code/javascript.md)。
- **Fory gRPC** 支持通过 Node.js gRPC 和浏览器 gRPC-Web 传输使用 Fory 编码的消息。请参阅 [JavaScript gRPC](../grpc/javascript.md)。
