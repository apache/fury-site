---
title: Schema 元数据
sidebar_position: 7
id: schema-metadata
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

JavaScript Schema 元数据使用 `Type.*` 构建器或 TypeScript 装饰器声明。元数据定义类型标识、字段类型、可空性、引用跟踪、动态字段，以及每个 struct 的 Schema 演进行为。

## 类型标识

Struct 和 enum 可以使用数字 ID 或名称。请为每个类型选择一种标识策略，并在读写载荷的每个实现中保持一致。

```ts
import { Type } from "@apache-fory/core";

const byId = Type.struct(
  { typeId: 1001 },
  {
    id: Type.int64(),
    name: Type.string(),
  },
);

const byName = Type.struct(
  { typeName: "example.user" },
  {
    id: Type.int64(),
    name: Type.string(),
  },
);
```

使用 `.` 在 `typeName` 中添加命名空间前缀。

## 装饰器元数据

装饰器可以让 Schema 与 TypeScript 类声明放在一起：

```ts
@Type.struct({ typeName: "example.user" })
class User {
  @Type.int64()
  id!: bigint;

  @Type.string()
  name!: string;
}
```

装饰器元数据等同于通过 `fory.register(...)` 注册的构建器元数据。

## 字段类型

稳定契约应使用显式标量构建器：

```ts
Type.int8();
Type.int16();
Type.int32();
Type.int64(); // JavaScript value is bigint
Type.uint32();
Type.uint64(); // JavaScript value is bigint
Type.float16();
Type.bfloat16();
Type.float32();
Type.float64();
Type.string();
Type.binary();
```

嵌套值使用集合构建器：

```ts
Type.list(Type.string());
Type.map(Type.string(), Type.int32());
Type.set(Type.string());
Type.int32Array();
Type.float64Array();
```

## 可空性

除非 Schema 另有声明，否则字段不可空：

```ts
const userType = Type.struct("example.user", {
  name: Type.string(),
  email: Type.string().setNullable(true),
});
```

向不可空字段传入 `null` 会抛出异常。

## 引用跟踪

当同一个对象实例可能出现在多个字段中，或对象图可能形成循环时，请启用全局引用跟踪，并标记启用引用跟踪的字段：

```ts
import Fory, { Type } from "@apache-fory/core";

const fory = new Fory({ ref: true });

const nodeType = Type.struct("example.node", {
  next: Type.struct("example.node").setNullable(true).setTrackingRef(true),
});
```

除非同时设置 `new Fory({ ref: true })`，否则字段级引用元数据不会生效。

## 动态字段

当字段可以容纳不同具体 Fory 类型的值时，请使用 `Type.any()`：

```ts
const eventType = Type.struct("example.event", {
  kind: Type.string(),
  payload: Type.any(),
});
```

对于具有声明类型的 struct 字段，`.setDynamic(Dynamic.FALSE)` 始终将值视为声明类型，而 `.setDynamic(Dynamic.TRUE)` 始终写入具体类型。默认的 `Dynamic.AUTO` 适用于大多数值。

## 按 Struct 配置 Schema 演进

JavaScript 默认使用兼容 Schema 演进。对于需要省略演进元数据的相同 Schema struct，请设置 `evolving: false`：

```ts
const fixedType = Type.struct(
  { typeId: 1002, evolving: false },
  {
    name: Type.string(),
  },
);
```

仅当每个读取端和写入端始终使用相同 struct Schema 时才使用 `evolving: false`。

## 相关主题

- [配置](configuration.md)
- [类型注册](type-registration.md)
- [支持的类型](supported-types.md)
- [Schema 演进](schema-evolution.md)
