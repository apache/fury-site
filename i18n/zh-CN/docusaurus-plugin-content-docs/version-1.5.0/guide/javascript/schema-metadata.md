---
title: Schema 元信息
sidebar_position: 35
id: schema_metadata
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

JavaScript schema 元信息通过 `Type.*` 构建器或 TypeScript 装饰器声明。元信息定义类型身份、字段类型、可空性、引用跟踪、动态字段以及每个 struct 的 Schema 演进行为。

## 类型身份

Struct 和 enum 可以使用数字 ID，也可以使用 namespace/name 对。请为一个类型选择一种身份策略，并在所有读写该载荷的运行时中保持一致。

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
  { namespace: "example", typeName: "user" },
  {
    id: Type.int64(),
    name: Type.string(),
  },
);
```

## 装饰器元信息

装饰器会把 schema 放在 TypeScript 类声明旁边：

```ts
@Type.struct({ typeName: "example.user" })
class User {
  @Type.int64()
  id!: bigint;

  @Type.string()
  name!: string;
}
```

装饰器元信息等价于通过 `fory.register(...)` 注册的构建器元信息。

## 字段类型

使用显式的标量构建器来获得稳定契约：

```ts
Type.int8();
Type.int16();
Type.int32();
Type.int64(); // JavaScript 值是 bigint
Type.uint32();
Type.uint64(); // JavaScript 值是 bigint
Type.float16();
Type.bfloat16();
Type.float32();
Type.float64();
Type.string();
Type.binary();
```

使用集合构建器描述嵌套值：

```ts
Type.list(Type.string());
Type.map(Type.string(), Type.int32());
Type.set(Type.string());
Type.int32Array();
Type.float64Array();
```

## 可空性

字段默认不可空，除非 schema 另有声明：

```ts
const userType = Type.struct("example.user", {
  name: Type.string(),
  email: Type.string().setNullable(true),
});
```

向不可空字段传入 `null` 会抛出异常。

## 引用跟踪

当同一个对象实例可能出现在多个字段中，或者对象图可能形成循环时，请启用全局引用跟踪，并标记需要引用跟踪的字段：

```ts
import Fory, { Type } from "@apache-fory/core";

const fory = new Fory({ ref: true });

const nodeType = Type.struct("example.node", {
  next: Type.struct("example.node").setNullable(true).setTrackingRef(true),
});
```

除非同时设置了 `new Fory({ ref: true })`，否则字段级引用元信息不会生效。

## 动态字段

当字段在运行时可以保存不同的 Fory 值时，使用 `Type.any()`：

```ts
const eventType = Type.struct("example.event", {
  kind: Type.string(),
  payload: Type.any(),
});
```

对于有声明类型的 struct 字段，`.setDynamic(Dynamic.FALSE)` 始终按声明类型处理值，`.setDynamic(Dynamic.TRUE)` 始终写入运行时类型。默认的 `Dynamic.AUTO` 适用于大多数字段。

## 每个 Struct 的 Schema 演进

JavaScript 默认使用兼容 Schema 演进。对于应省略演进元信息的稳定 struct，设置 `evolving: false`：

```ts
const fixedType = Type.struct(
  { typeId: 1002, evolving: false },
  {
    name: Type.string(),
  },
);
```

写入端和读取端都必须约定使用 `evolving: false`。

## 相关主题

- [配置](configuration.md)
- [类型注册](type-registration.md)
- [支持的类型](supported-types.md)
- [Schema 演进](schema-evolution.md)
