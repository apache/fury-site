---
title: 基础序列化
sidebar_position: 1
id: basic-serialization
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

本指南介绍 Apache Fory JavaScript 默认 xlang 模式下的核心序列化 API。

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

## 跨语言互操作 {#cross-language-interoperability}

以下内容说明默认 xlang 格式的跨语言类型映射、类型标识和互操作要求。

Fory JavaScript 序列化为与 Java、Python、C++、Go、Rust、C#、Swift、Dart、Scala 和 Kotlin Fory 实现相同的二进制格式。无需转换层，即可在 JavaScript 中写入消息并在 Java 中读取，也支持任意其他方向。

注意事项：

- Fory JavaScript 只读写跨语言载荷，不支持任何原生模式格式。
- JavaScript 不支持带外模式。

### 成功往返的要求

要让消息在 JavaScript 和另一种语言之间成功往返：

1. 双方使用**相同类型标识**：相同数字 ID 或相同 `typeName`。
2. 使用**兼容字段类型**：JavaScript 中的 `Type.int32()` 字段匹配 Java `int`、Go `int32`、C# `int`。
3. 使用**相同可空性**：如果一端将字段标记为可空，另一端也应如此。
4. 双方都使用兼容 Schema 演进。JavaScript 默认启用此模式。
5. 如果数据包含共享引用或循环引用，使用**相同引用跟踪配置**。

### 分步操作：从 JavaScript 到其他通信方

1. 使用与通信方相同的类型名称或数字 ID 定义 JavaScript Schema。
2. 在双方注册 Schema。
3. 对齐字段类型、可空性和 Schema 演进设置。
4. 发布前使用真实载荷进行端到端测试。

JavaScript 端：

```ts
import Fory, { Type } from "@apache-fory/core";

const messageType = Type.struct(
  { typeName: "example.message" },
  {
    id: Type.int64(),
    content: Type.string(),
  },
);

const fory = new Fory();
const { serialize } = fory.register(messageType);

const bytes = serialize({
  id: 1n,
  content: "hello from JavaScript",
});
```

在另一端，使用通信方语言的 API 注册相同的 `example.message` 类型（相同名称或相同数字 ID）：

- [Java 指南](../java/index.md)
- [Python 指南](../python/index.md)
- [Go 指南](../go/index.md)
- [Rust 指南](../rust/index.md)

### 字段命名

Fory 按名称匹配字段。在多种语言中定义模型时，请保持字段名称一致；至少应使用能够跨语言明确映射的命名方案，例如全部使用 `snake_case`。

默认兼容 Schema 演进可以容忍字段顺序差异，但名称本身仍必须匹配。

### 数值类型

JavaScript `number` 是 64 位浮点数，无法清晰地映射到其他语言中的每种整数类型。请使用显式 Schema 类型：

- `Type.int32()` 用于 32 位整数（Java `int`、Go `int32`、C# `int`）
- `Type.int64()` 配合 `bigint` 值用于 64 位整数（Java `long`、Go `int64`）
- 浮点值使用 `Type.float32()` 或 `Type.float64()`

### 列表和密集数组

使用 `Type.list(T)` 表示普通 JavaScript `Array<T>` 值和 Fory `list<T>` Schema。密集 bool/数值向量使用下面列出的显式数组构建器。

| Fory Schema       | JavaScript/TypeScript Schema 构建器 |
| ----------------- | ----------------------------------- |
| `list<int32>`     | `Type.list(Type.int32())`           |
| `array<bool>`     | `Type.boolArray()`                  |
| `array<int8>`     | `Type.int8Array()`                  |
| `array<int16>`    | `Type.int16Array()`                 |
| `array<int32>`    | `Type.int32Array()`                 |
| `array<int64>`    | `Type.int64Array()`                 |
| `array<uint8>`    | `Type.uint8Array()`                 |
| `array<uint16>`   | `Type.uint16Array()`                |
| `array<uint32>`   | `Type.uint32Array()`                |
| `array<uint64>`   | `Type.uint64Array()`                |
| `array<float16>`  | `Type.float16Array()`               |
| `array<bfloat16>` | `Type.bfloat16Array()`              |
| `array<float32>`  | `Type.float32Array()`               |
| `array<float64>`  | `Type.float64Array()`               |

### 日期和时间

- `Type.timestamp()` — 时间点；往返后为 JavaScript `Date`
- `Type.date()` — 不含时间的日期；反序列化为 `Date`
- `Type.duration()` — 在 JavaScript 中公开为数值毫秒值

### 多态字段

`Type.any()` 允许字段容纳不同具体类型，但更难以跨语言保持一致。请尽可能优先使用显式字段 Schema。

```ts
const wrapperType = Type.struct(
  { typeId: 3001 },
  {
    payload: Type.any(),
  },
);
```

### Enum

Enum 成员的**顺序**必须跨语言匹配。Fory 按序号位置而不是按值编码 enum。

```ts
const Color = { Red: 1, Green: 2, Blue: 3 };
const fory = new Fory();
fory.register(Type.enum({ typeId: 210 }, Color));
```

每个通信方使用相同类型 ID 或类型名称。

### 安全限制

`maxDepth` 选项限制嵌套载荷。它不会改变二进制格式，只控制本地 `Fory` 实例接受的内容。

### 相关指南

- [支持的类型](supported-types.md)
- [Schema 演进](schema-evolution.md)
- [跨语言序列化规范](../../specification/xlang_serialization_spec.md)

### 内置值

```javascript
import Fory from "@apache-fory/core";

const fory = new Fory();
const input = fory.serialize("hello fory");
const result = fory.deserialize(input);
console.log(result);
```

### 自定义值

```javascript
import Fory, { Type } from "@apache-fory/core";

// Describe data structures using JSON schema
const description = Type.struct(
  { typeName: "example.foo" },
  {
    foo: Type.string(),
  },
);
const fory = new Fory();
const { serialize, deserialize } = fory.register(description);
const input = serialize({ foo: "hello fory" });
const result = deserialize(input);
console.log(result);
```

### 共享引用与循环引用

```javascript
import Fory, { Type } from "@apache-fory/core";

const description = Type.struct("example.foo", {
  foo: Type.string(),
  bar: Type.struct("example.foo").setTrackingRef(true),
});

const fory = new Fory({ ref: true });
const { serialize, deserialize } = fory.register(description);
const data: any = {
  foo: "hello fory",
};
data.bar = data;
const input = serialize(data);
const result = deserialize(input);
console.log(result.bar.foo === result.foo);
```

## 相关主题

- [类型注册](type-registration.md)
- [支持的类型](supported-types.md)
- [引用](references.md)
