---
title: 类型注册
sidebar_position: 5
id: type-registration
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

序列化的每个 struct 和 enum 都必须在使用前向 `Fory` 实例注册。注册会告诉 Fory 如何在消息中标识类型，以及如何编码和解码该类型。

## 注册 Struct

可以使用数字 ID 或名称标识 struct。请选择一种策略，并在共享相同消息的所有语言中保持一致。

### 按数字 ID 注册

编码表示更小，适合能够协调 ID 的小型团队。

```ts
const userType = Type.struct(
  { typeId: 1001 },
  {
    id: Type.int64(),
    name: Type.string(),
  },
);

const fory = new Fory();
const { serialize, deserialize } = fory.register(userType);
```

读写此类型的每个通信方必须使用相同数字。

### 按名称注册

更易于跨团队协调，但消息中的元数据略大。

```ts
const userType = Type.struct(
  { typeName: "example.user" },
  {
    id: Type.int64(),
    name: Type.string(),
  },
);

const fory = new Fory();
const { serialize, deserialize } = fory.register(userType);
```

使用 `.` 在 `typeName` 中添加命名空间前缀。Fory 会将命名空间与最后一段类型名称分离。

> **不要让通信双方为同一类型混用标识策略。** 如果一端使用数字 ID，另一端使用名称，反序列化将失败。

## 使用装饰器注册

```ts
@Type.struct({ typeId: 1001 })
class User {
  @Type.int64()
  id!: bigint;

  @Type.string()
  name!: string;
}

const fory = new Fory();
const { serialize, deserialize } = fory.register(User);
```

希望 TypeScript 类声明与 Schema 放在一起时，基于装饰器的注册很方便。

## 注册 Enum

Fory JavaScript 同时支持普通 JavaScript 类 enum 对象和 TypeScript enum。

### JavaScript 对象 enum

```ts
const Color = {
  Red: 1,
  Green: 2,
  Blue: 3,
};

const fory = new Fory();
const colorSerde = fory.register(Type.enum("example.color", Color));
```

### TypeScript enum

```ts
enum Status {
  Pending = "pending",
  Active = "active",
}

const fory = new Fory();
fory.register(Type.enum("example.status", Status));
```

## 注册范围

注册属于单个 `Fory` 实例。如果创建两个实例，需要在两者中都注册 Schema。

## `register` 的返回值

`fory.register(schema)` 返回一对已绑定的序列化器：

```ts
const { serialize, deserialize } = fory.register(orderType);

// serialize returns Uint8Array bytes
const bytes = serialize({ id: 1n, total: 99.99 });

// deserialize returns the decoded value
const order = deserialize(bytes);
```

保存并复用这一对函数，它们是快速路径。

## 字段元数据

字段可空性、引用跟踪、动态字段行为、数值宽度和按 struct 配置的 Schema 演进元数据参见 [Schema 元数据](schema-metadata.md)。

## 选择 ID 还是名称

以下情况使用**数字 ID**：

- 希望消息尽可能小
- 组织能够保持 ID 稳定且全局唯一
- 服务之间协调紧密

以下情况使用**名称**：

- 团队独立定义类型
- Schema 已通过包或模块名称标识
- 可以接受略大的元数据开销

## 跨语言

为了让消息在 JavaScript 和另一种语言之间往返，双方必须为给定类型使用相同标识：相同数字 ID 或相同 `typeName`。使用 `.` 在 `typeName` 中添加命名空间前缀。参见[跨语言序列化](core-api.md#cross-language-interoperability)。

## 相关主题

- [基本序列化](core-api.md)
- [Schema 元数据](schema-metadata.md)
- [Schema 演进](schema-evolution.md)
- [跨语言序列化](core-api.md#cross-language-interoperability)
