---
title: 基本序列化
sidebar_position: 3
id: core-api
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

本指南介绍 Apache Fory JavaScript 的核心序列化 API。

## 创建 `Fory` 实例

```ts
import Fory from "@apache-fory/core";

const fory = new Fory();
```

创建一个实例，注册 Schema 后复用它。Fory 会在首次调用 `register` 后缓存生成的序列化器，因此每次请求都重新创建实例会浪费这些工作。

## 使用 `Type.struct` 定义 Schema

最常用的方式是定义并注册 Schema。

```ts
import Fory, { Type } from "@apache-fory/core";

const accountType = Type.struct(
  { typeName: "example.account" },
  {
    id: Type.int64(),
    owner: Type.string(),
    active: Type.bool(),
    nickname: Type.string().setNullable(true),
  },
);

const fory = new Fory();
const { serialize, deserialize } = fory.register(accountType);
```

## 序列化和反序列化

```ts
const bytes = serialize({
  id: 42n,
  owner: "Alice",
  active: true,
  nickname: null,
});

const value = deserialize(bytes);
console.log(value);
// { id: 42n, owner: 'Alice', active: true, nickname: null }
```

返回的 `bytes` 值是 `Uint8Array`/平台缓冲区，可以通过网络发送或写入存储。

## 根级动态序列化

`Fory` 也可以直接序列化动态根值，无需预先绑定特定 Schema 的序列化器。

```ts
const fory = new Fory();

const bytes = fory.serialize(
  new Map([
    ["name", "Alice"],
    ["age", 30],
  ]),
);

const value = fory.deserialize(bytes);
```

这对于动态载荷很方便，但对于稳定接口和跨语言契约，显式 Schema 通常更合适。

## 原始值

```ts
const fory = new Fory();

fory.deserialize(fory.serialize(true));
// true

fory.deserialize(fory.serialize("hello"));
// 'hello'

fory.deserialize(fory.serialize(123));
// 123

fory.deserialize(fory.serialize(123n));
// 123n

fory.deserialize(fory.serialize(new Date("2021-10-20T09:13:00Z")));
// Date
```

### Number 和 `bigint`

JavaScript `number` 是 64 位浮点数，无法精确表示所有 64 位整数。对于跨语言契约或任何需要精确整数宽度的场景，请在 Schema 中使用显式字段类型：

- `Type.int32()` — 32 位整数；使用 JavaScript `number`
- `Type.int64()` — 64 位整数；使用 JavaScript `bigint`
- `Type.float32()` / `Type.float64()` — 浮点数

动态根值序列化（不提供 Schema 而调用 `fory.serialize(someNumber)`）会推断类型，但 API 不保证推断出的类型。任何稳定契约都应使用 Schema。

## Array、Map 和 Set

```ts
const inventoryType = Type.struct("example.inventory", {
  tags: Type.list(Type.string()),
  counts: Type.map(Type.string(), Type.int32()),
  labels: Type.set(Type.string()),
});

const fory = new Fory({ ref: true });
const { serialize, deserialize } = fory.register(inventoryType);

const bytes = serialize({
  tags: ["hot", "new"],
  counts: new Map([
    ["apple", 3],
    ["pear", 8],
  ]),
  labels: new Set(["featured", "seasonal"]),
});

const value = deserialize(bytes);
```

## 嵌套 Struct

```ts
const addressType = Type.struct("example.address", {
  city: Type.string(),
  country: Type.string(),
});

const userType = Type.struct("example.user", {
  name: Type.string(),
  address: Type.struct("example.address", {
    city: Type.string(),
    country: Type.string(),
  }),
});

const fory = new Fory();
const { serialize, deserialize } = fory.register(userType);

const bytes = serialize({
  name: "Alice",
  address: { city: "Hangzhou", country: "CN" },
});

const user = deserialize(bytes);
```

如果嵌套值可能缺失，请将其标记为可空：

```ts
const wrapperType = Type.struct("example.wrapper", {
  child: Type.struct("example.child", {
    name: Type.string(),
  }).setNullable(true),
});
```

## 基于装饰器的注册

也支持 TypeScript 装饰器。

```ts
import Fory, { Type } from "@apache-fory/core";

@Type.struct("example.user")
class User {
  @Type.int64()
  id!: bigint;

  @Type.string()
  name!: string;
}

const fory = new Fory();
const { serialize, deserialize } = fory.register(User);

const user = new User();
user.id = 1n;
user.name = "Alice";

const copy = deserialize(serialize(user));
console.log(copy instanceof User); // true
```

## 可空性

基于 Schema 的 struct 会显式声明字段可空性。

```ts
const nullableType = Type.struct("example.optional_user", {
  name: Type.string(),
  email: Type.string().setNullable(true),
});
```

如果字段未标记为可空却尝试写入 `null`，序列化会抛出异常。

## 调试生成代码

可以使用 `hooks.afterCodeGenerated` 检查生成的序列化器代码。

```ts
const fory = new Fory({
  hooks: {
    afterCodeGenerated(code) {
      console.log(code);
      return code;
    },
  },
});
```

这有助于调试 Schema 行为、字段顺序或生成的快速路径。

## 相关主题

- [类型注册](type-registration.md)
- [支持的类型](supported-types.md)
- [引用](references.md)
