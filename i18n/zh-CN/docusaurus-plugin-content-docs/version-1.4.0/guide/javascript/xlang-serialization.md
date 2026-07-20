---
title: Xlang 序列化
sidebar_position: 2
id: xlang_serialization
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

Fory JavaScript 与 Java、Python、Go、Rust、Swift 和 C++ 的 Fory 运行时使用相同的二进制格式进行序列化。你可以在 JavaScript 中写入消息，再在 Java 中读取它，反过来也一样，无需额外的转换层。

需要注意：

- Fory JavaScript 运行时只读写跨语言载荷，不支持任何语言原生格式。
- 当前暂不支持 out-of-band mode。

## 成功完成往返的要求

要让一条消息能在 JavaScript 与另一种运行时之间稳定往返，双方必须满足：

1. 两端具有**相同的类型标识**，即相同的数值 ID，或相同的 `namespace + typeName`
2. **字段类型兼容**，例如 JavaScript 中的 `Type.int32()` 字段应对应 Java `int`、Go `int32`、C# `int`
3. **可空性一致**，如果一侧把字段标记为可空，另一侧也应如此
4. 如果使用 Schema 演进，双方的 `compatible` 模式必须一致
5. 如果数据包含共享引用或循环引用，双方的引用跟踪配置也必须一致

## 分步说明：从 JavaScript 到其他运行时

1. 在 JavaScript 中使用与其他运行时相同的类型名称或数值 ID 定义 schema
2. 在两端都注册该 schema
3. 对齐字段类型、可空性和 `compatible` 设置
4. 在发布前对真实载荷做端到端测试

JavaScript 侧：

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

在另一侧，请使用对应运行时的 API 注册同一个 `example.message` 类型，即相同的名称或相同的数值 ID：

- [Java guide](../java/index.md)
- [Python guide](../python/index.md)
- [Go guide](../go/index.md)
- [Rust guide](../rust/index.md)

## 字段命名

Fory 按字段名匹配字段。当模型在多种语言中定义时，应保持字段名一致，或者至少采用能够在不同语言间无歧义映射的命名方案，例如统一使用 `snake_case`。

当使用 `compatible: true` 进行 Schema 演进时，字段顺序的差异是允许的，但字段名本身仍必须一致。

## 数值类型

JavaScript 的 `number` 是 64 位浮点数，无法与其他语言中的所有整数类型一一对应。因此应使用显式 schema 类型：

- `Type.int32()`：用于 32 位整数，对应 Java `int`、Go `int32`、C# `int`
- `Type.int64()`：配合 `bigint` 值使用，用于 64 位整数，对应 Java `long`、Go `int64`
- `Type.float32()` 或 `Type.float64()`：用于浮点数

## 日期与时间

- `Type.timestamp()`：表示一个时间点；往返后仍是 JavaScript `Date`
- `Type.date()`：表示不带时间的日期；反序列化结果为 `Date`
- `Type.duration()`：在 JavaScript 中暴露为毫秒数

## 多态字段

`Type.any()` 允许字段在运行时承载不同类型的值，但它在跨语言场景中更难保持一致。只要可能，就应优先使用显式字段 schema。

```ts
const wrapperType = Type.struct(
  { typeId: 3001 },
  {
    payload: Type.any(),
  },
);
```

## 枚举

枚举成员的**顺序**必须在不同语言间保持一致。Fory 按 ordinal position 而不是按枚举值对枚举进行编码。

```ts
const Color = { Red: 1, Green: 2, Blue: 3 };
const fory = new Fory();
fory.register(Type.enum({ typeId: 210 }, Color));
```

在每个对端运行时中都应使用相同的类型 ID 或类型名。

## 安全限制

`maxDepth`、`maxBinarySize` 和 `maxCollectionSize` 这些选项用于保护 JavaScript 运行时，防止接收过大载荷。它们不会改变二进制格式，只决定本地运行时愿意接受什么样的数据。

## 相关主题

- [支持的类型](supported-types.md)
- [Schema 演进](schema-evolution.md)
- [Xlang 序列化规范](../../specification/xlang_serialization_spec.md)
