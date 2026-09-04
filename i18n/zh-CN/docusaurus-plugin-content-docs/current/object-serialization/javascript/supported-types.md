---
title: 支持的类型
sidebar_position: 12
id: supported-types
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

本页列出 Fory 支持的 JavaScript 和 TypeScript 类型，并说明为了跨语言兼容应在何时谨慎选择类型。

## 原始类型和标量类型

| JavaScript 值    | Fory Schema                                                                           | 说明                              |
| ---------------- | ------------------------------------------------------------------------------------- | --------------------------------- |
| `boolean`        | `Type.bool()`                                                                         |                                   |
| `number`         | `Type.int8()` / `Type.int16()` / `Type.int32()` / `Type.float32()` / `Type.float64()` | 选择与通信方语言匹配的宽度        |
| `bigint`         | `Type.int64()` / `Type.uint64()`                                                      | 64 位整数使用 `bigint`            |
| `string`         | `Type.string()`                                                                       |                                   |
| `Uint8Array`     | `Type.binary()`                                                                       | 二进制数据块                      |
| `Date`           | `Type.timestamp()`                                                                    | 序列化和反序列化为 `Date`         |
| `Date`           | `Type.date()`                                                                         | 不含时间的日期；反序列化为 `Date` |
| 时间长度（毫秒） | `Type.duration()`                                                                     | 在 JavaScript 中公开为数值毫秒值  |
| `number`         | `Type.float16()`                                                                      | 半精度浮点数                      |
| `number`         | `Type.bfloat16()`                                                                     | 脑浮点数                          |

## 整数类型

JavaScript `number` 是 64 位浮点数，无法安全表示所有 64 位整数（超过 `Number.MAX_SAFE_INTEGER` 的整数会丢失精度）。请使用显式 Schema 与通信方语言所需的宽度匹配：

```ts
Type.int8(); // -128 to 127
Type.int16(); // -32,768 to 32,767
Type.int32(); // variable-length int32; default for semantic int32
Type.int32({ encoding: "fixed" });
Type.int64(); // variable-length int64; use with bigint
Type.int64({ encoding: "fixed" });
Type.int64({ encoding: "tagged" });
Type.uint8();
Type.uint16();
Type.uint32(); // variable-length uint32
Type.uint32({ encoding: "fixed" });
Type.uint64(); // variable-length uint64; use with bigint
Type.uint64({ encoding: "fixed" });
Type.uint64({ encoding: "tagged" });
```

**经验法则**：任何在其他语言中映射到 64 位整数的值，都应在 JavaScript 端使用 `Type.int64()` 或 `Type.uint64()`，并以 `bigint` 值传入。

## 浮点类型

```ts
Type.float16();
Type.float32();
Type.float64();
Type.bfloat16();
```

与使用低精度数值格式的语言或载荷互操作时，`float16` 和 `bfloat16` 很有用。

`Type.float16()` 会将数值舍入为最接近的半精度值；输入恰好位于两个值的中点时，选择最低有效位为偶数的值。Float16 数组转换使用相同的舍入规则。带符号零、无穷大和 NaN 会被保留；数值可能下溢为带符号零，也可能上溢为带符号无穷大。

## Array 和 Typed Array

### 列表

```ts
Type.list(Type.string());
Type.list(
  Type.struct("example.item", {
    id: Type.int64(),
  }),
);
```

这些类型映射到 JavaScript array，并使用 Fory `list<T>` Schema。

## 优化的数值数组

对于 bool 和 number 的密集数组，请使用特定元素类型的数组构建器。它们更加紧凑，并在 JavaScript 提供对应类型时映射到原生 typed array：

```ts
Type.boolArray(); // boolean[] in JS
Type.int16Array(); // Int16Array
Type.int32Array(); // Int32Array
Type.int64Array(); // BigInt64Array
Type.float32Array(); // Float32Array
Type.float64Array(); // Float64Array
Type.float16Array(); // number[]
Type.bfloat16Array(); // BFloat16Array
```

非数值、struct、可空元素或启用引用跟踪的有序集合使用 `Type.list(elementType)`。

## Map 和 Set

```ts
Type.map(Type.string(), Type.int32());
Type.set(Type.string());
```

这些类型映射到 JavaScript `Map` 和 `Set` 值。

## Struct

```ts
Type.struct("example.user", {
  id: Type.int64(),
  name: Type.string(),
  tags: Type.list(Type.string()),
});
```

Struct 可以内联声明、通过装饰器声明，或嵌套在其他 Schema 中。

## Enum

```ts
Type.enum("example.color", {
  Red: 1,
  Green: 2,
  Blue: 3,
});
```

Fory 按 enum 值在对象中的序号位置进行编码，而不是按其值编码。双方必须以相同顺序声明 enum 成员。与其他语言互操作时，请确保成员顺序匹配，而不仅是值匹配。

## 可空字段

字段可能为空时使用 `.setNullable(true)`，此时可以传入 `null`。

```ts
Type.string().setNullable(true);
```

## 动态字段

字段可以容纳不同具体类型的值时使用 `Type.any()`。

```ts
const eventType = Type.struct("example.event", {
  kind: Type.string(),
  payload: Type.any(),
});
```

类型已知时优先使用显式字段 Schema；`Type.any()` 更难以跨语言保持一致。

## 启用引用跟踪的字段

当同一个对象实例可能出现在多个字段中，或对象图形成循环时，请为各个字段启用引用跟踪：

```ts
Type.struct("example.node").setTrackingRef(true).setNullable(true);
```

这要求使用 `new Fory({ ref: true })`。参见[引用](references.md)。

## 扩展类型

对于需要完全自定义编码的类型，请使用 `Type.ext(...)`，并向 `fory.register(...)` 传入自定义序列化器。这是高级用法；标准 `Type.struct` 可以覆盖大多数场景。

## 相关主题

- [基本序列化](basic-serialization.md)
- [引用](references.md)
- [跨语言序列化](basic-serialization.md#cross-language-interoperability)
