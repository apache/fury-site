---
title: JavaScript/TypeScript 环境配置
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

Fory JavaScript/TypeScript 软件包发布在 npm。core 包无需原生加速即可工作；可选的
`@apache-fory/hps` Node.js 快速路径需要 Node.js 20 或更高版本。一个应用中的 Fory 软件包
应保持版本兼容。

## 验证工具链

```bash
node --version
npm --version
```

## 选择能力

| 能力              | 软件包或工具                                 | 后续文档                                                                                                                               |
| ----------------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 对象序列化        | `@apache-fory/core`；可选 `@apache-fory/hps` | [JavaScript/TypeScript 对象序列化](../object-serialization/javascript/index.md)和 [xlang](../object-serialization/javascript/xlang.md) |
| Schema 和生成模型 | `fory-compiler`                              | [Fory IDL 和编译器](../compiler/index.md)                                                                                              |
| Fory gRPC         | 生成的 Node.js 或 gRPC-Web 配套代码          | [JavaScript gRPC](../grpc/javascript.md)                                                                                               |

每个能力指南都会提供确切的安装命令、环境特定配置和首个可运行示例。
