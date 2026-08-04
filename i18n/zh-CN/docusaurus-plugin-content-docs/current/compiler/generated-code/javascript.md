---
title: JavaScript/TypeScript
sidebar_position: 8
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

## 输出布局

JavaScript/TypeScript 输出为每个 Schema 生成一个 `.ts` 文件，例如：

- `<javascript_out>/addressbook.ts`

当 Schema 包含服务时，JavaScript 还可以生成服务配套代码：

- `<javascript_out>/addressbook_grpc.ts`（使用 `--grpc` 生成）
- `<javascript_out>/addressbook_grpc_web.ts`（使用 `--grpc-web` 生成）

## 类型生成

消息生成字段名称为 camelCase 的 `export interface` 声明：

```typescript
export interface Person {
  name: string;
  id: number;
  phones: PhoneNumber[];
  pet?: Animal | null;
}
```

枚举生成 `export enum` 声明：

```typescript
export enum PhoneType {
  MOBILE = 0,
  HOME = 1,
  WORK = 2,
}
```

联合生成带 case 枚举的可辨识联合：

```typescript
export enum AnimalCase {
  DOG = 1,
  CAT = 2,
}

export type Animal =
  { case: AnimalCase.DOG; value: Dog } | { case: AnimalCase.CAT; value: Cat };
```

## Schema 辅助方法

每个生成的模型文件都会导出用于自定义 `Fory` 实例的注册辅助方法和根序列化辅助方法。
公共 API 如下：

```typescript
import type Fory, { Serializer } from "@apache-fory/core";

export function registerAddressbookTypes(fory: Fory): {
  person: {
    serialize: (value: Person | null) => Uint8Array;
    deserialize: (bytes: Uint8Array) => Person;
    serializer: Serializer;
  };
};
export const serializePerson: (value: Person | null) => Uint8Array;
export const deserializePerson: (bytes: Uint8Array) => Person;
```

导入的 Schema 模块由 `registerXxxTypes(fory)` 自动注册。生成的默认序列化路径请使用
`serializeX` 和 `deserializeX`。当应用自行管理实例时，调用
`registerXxxTypes(fory)` 并传入应用的 `Fory` 实例。生成的 gRPC 配套代码会自动导入生成的辅助方法。

## gRPC 服务配套代码

`--grpc` 生成 `<module>_grpc.ts`，其中包含服务和路径常量、handler 接口、服务定义和注册辅助方法，以及 `<Service>Client` 类和 `create<Service>Client` 工厂。`--grpc-web` 生成 `<module>_grpc_web.ts`，其中包含回调客户端以及一元 RPC 的 promise 客户端；两种客户端类及其工厂函数都会导出。Node.js 和浏览器用法请参阅 [JavaScript gRPC](../../grpc/javascript.md)。
