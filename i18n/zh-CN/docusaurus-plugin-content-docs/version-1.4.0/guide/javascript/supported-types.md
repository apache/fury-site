---
title: 支持的类型
sidebar_position: 40
id: supported_types
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

本页列出 Fory 支持的 JavaScript 和 TypeScript 类型，并说明在跨语言兼容场景下何时需要对类型选择保持明确和谨慎。

## 原始类型与标量类型

| JavaScript 值      | Fory schema                                                                         | 说明                                           |
| ------------------ | ----------------------------------------------------------------------------------- | ---------------------------------------------- |
| `boolean`          | `Type.bool()`                                                                       |                                                |
| `number`           | `Type.int8()` / `Type.int16()` / `Type.int32()` / `Type.float32()` / `Type.float64()` | 选择与对端语言一致的位宽                      |
| `bigint`           | `Type.int64()` / `Type.varInt64()` / `Type.uint64()`                               | 64 位整数应使用 `bigint`                      |
| `string`           | `Type.string()`                                                                     |                                                |
| `Uint8Array`       | `Type.binary()`                                                                     | 二进制 blob                                    |
| `Date`             | `Type.timestamp()`                                                                  | 序列化/反序列化结果均为 `Date`                |
| `Date`             | `Type.date()`                                                                       | 只包含日期，不包含时间；反序列化结果为 `Date` |
| duration（毫秒）   | `Type.duration()`                                                                   | 在 JavaScript 中暴露为毫秒数                  |
| `number`           | `Type.float16()`                                                                    | 半精度浮点数                                   |
| `BFloat16` / `number` | `Type.bfloat16()`                                                                | 反序列化结果为 `BFloat16`                     |

## 整数类型

JavaScript 的 `number` 是 64 位浮点数，无法安全表示所有 64 位整数，超过 `Number.MAX_SAFE_INTEGER` 的整数会丢失精度。请使用显式 schema，使其与对端语言期望的位宽一致：

```ts
Type.int8(); // -128 to 127
Type.int16(); // -32,768 to 32,767
Type.int32(); // matches Java int, Go int32, C# int
Type.varInt32(); // variable-length encoding; smaller for small values
Type.int64(); // use with bigint; matches Java long, Go int64
Type.varInt64();
Type.sliInt64();
Type.uint8();
Type.uint16();
Type.uint32();
Type.varUInt32();
Type.uint64(); // use with bigint
Type.varUInt64();
Type.taggedUInt64();
```

**经验法则**：凡是在其他语言中映射为 64 位整数的值，在 JavaScript 侧都应使用 `Type.int64()` 或 `Type.uint64()`，并以 `bigint` 形式传入。

## 浮点类型

```ts
Type.float16();
Type.float32();
Type.float64();
Type.bfloat16();
```

当需要与使用低精度数值格式的运行时或载荷互操作时，`float16` 和 `bfloat16` 会很有用。

## 数组与 Typed Array

### 通用数组

```ts
Type.array(Type.string());
Type.array(
  Type.struct("example.item", {
    id: Type.int64(),
  }),
);
```

它们会映射为 JavaScript 数组。

## 优化过的数值数组

对于数值数组，请使用专门的 typed array schema。它们更紧凑，并且会映射到原生 typed array：

```ts
Type.boolArray(); // boolean[] in JS
Type.int16Array(); // Int16Array
Type.int32Array(); // Int32Array
Type.int64Array(); // BigInt64Array
Type.float32Array(); // Float32Array
Type.float64Array(); // Float64Array
Type.float16Array(); // number[]
Type.bfloat16Array(); // BFloat16[]
```

对于非数值数组或 struct 数组，应改用 `Type.array(elementType)`。

## Map 与 Set

```ts
Type.map(Type.string(), Type.int32());
Type.set(Type.string());
```

它们会映射为 JavaScript `Map` 和 `Set`。

## Struct

```ts
Type.struct("example.user", {
  id: Type.int64(),
  name: Type.string(),
  tags: Type.array(Type.string()),
});
```

Struct 可以以内联方式声明，也可以通过 decorator 声明，或者嵌套在其他 schema 中。

## 枚举

```ts
Type.enum("example.color", {
  Red: 1,
  Green: 2,
  Blue: 3,
});
```

Fory 按对象中的 ordinal position 编码枚举值，而不是按它们的取值进行编码。两端都必须以相同顺序声明枚举成员。与其他语言互操作时，必须保证成员顺序一致，而不仅仅是值相同。

## 可空字段

当字段可能为 `null` 时，请使用 `.setNullable(true)`。

```ts
Type.string().setNullable(true);
```

## 动态字段

当字段在运行时可能承载不同类型的值时，请使用 `Type.any()`。

```ts
const eventType = Type.struct("example.event", {
  kind: Type.string(),
  payload: Type.any(),
});
```

如果字段类型是已知的，应优先使用显式字段 schema，因为 `Type.any()` 更难在不同语言间保持对齐。

## 引用跟踪字段

当同一个对象实例可能出现在多个字段中，或者你的对象图存在循环时，应为对应字段单独启用引用跟踪：

```ts
Type.struct("example.node").setTrackingRef(true).setNullable(true);
```

这需要同时配置 `new Fory({ ref: true })`。参见 [引用](references.md)。

## 扩展类型

对于需要完全自定义编码的类型，可以使用 `Type.ext(...)`，并向 `fory.register(...)` 传入自定义序列化器。这属于高级用法；大多数场景下，标准的 `Type.struct` 已经足够。

## 相关主题

- [基础序列化](basic-serialization.md)
- [引用](references.md)
- [跨语言](xlang-serialization.md)
