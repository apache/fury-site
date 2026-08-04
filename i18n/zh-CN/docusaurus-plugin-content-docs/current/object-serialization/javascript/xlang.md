---
title: 跨语言序列化
sidebar_position: 1
id: xlang
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

Fory JavaScript 序列化为与 Java、Python、C++、Go、Rust、C#、Swift、Dart、Scala 和 Kotlin Fory 实现相同的二进制格式。无需转换层，即可在 JavaScript 中写入消息并在 Java 中读取，也支持任意其他方向。

注意事项：

- Fory JavaScript 只读写跨语言载荷，不支持任何原生模式格式。
- JavaScript 不支持带外模式。

## 成功往返的要求

要让消息在 JavaScript 和另一种语言之间成功往返：

1. 双方使用**相同类型标识**：相同数字 ID 或相同 `typeName`。
2. 使用**兼容字段类型**：JavaScript 中的 `Type.int32()` 字段匹配 Java `int`、Go `int32`、C# `int`。
3. 使用**相同可空性**：如果一端将字段标记为可空，另一端也应如此。
4. 双方都使用兼容 Schema 演进。JavaScript 默认启用此模式。
5. 如果数据包含共享引用或循环引用，使用**相同引用跟踪配置**。

## 分步操作：从 JavaScript 到其他通信方

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

## 字段命名

Fory 按名称匹配字段。在多种语言中定义模型时，请保持字段名称一致；至少应使用能够跨语言明确映射的命名方案，例如全部使用 `snake_case`。

默认兼容 Schema 演进可以容忍字段顺序差异，但名称本身仍必须匹配。

## 数值类型

JavaScript `number` 是 64 位浮点数，无法清晰地映射到其他语言中的每种整数类型。请使用显式 Schema 类型：

- `Type.int32()` 用于 32 位整数（Java `int`、Go `int32`、C# `int`）
- `Type.int64()` 配合 `bigint` 值用于 64 位整数（Java `long`、Go `int64`）
- 浮点值使用 `Type.float32()` 或 `Type.float64()`

## 列表和密集数组

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

## 日期和时间

- `Type.timestamp()` — 时间点；往返后为 JavaScript `Date`
- `Type.date()` — 不含时间的日期；反序列化为 `Date`
- `Type.duration()` — 在 JavaScript 中公开为数值毫秒值

## 多态字段

`Type.any()` 允许字段容纳不同具体类型，但更难以跨语言保持一致。请尽可能优先使用显式字段 Schema。

```ts
const wrapperType = Type.struct(
  { typeId: 3001 },
  {
    payload: Type.any(),
  },
);
```

## Enum

Enum 成员的**顺序**必须跨语言匹配。Fory 按序号位置而不是按值编码 enum。

```ts
const Color = { Red: 1, Green: 2, Blue: 3 };
const fory = new Fory();
fory.register(Type.enum({ typeId: 210 }, Color));
```

每个通信方使用相同类型 ID 或类型名称。

## 安全限制

`maxDepth` 选项限制嵌套载荷。它不会改变二进制格式，只控制本地 `Fory` 实例接受的内容。

## 相关主题

- [支持的类型](supported-types.md)
- [Schema 演进](schema-evolution.md)
- [跨语言序列化规范](../../specification/xlang_serialization_spec.md)

## 内置值

```javascript
import Fory from "@apache-fory/core";

const fory = new Fory();
const input = fory.serialize("hello fory");
const result = fory.deserialize(input);
console.log(result);
```

## 自定义值

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

## 共享引用与循环引用

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
