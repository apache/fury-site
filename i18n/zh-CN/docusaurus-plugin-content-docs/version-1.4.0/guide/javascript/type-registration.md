---
title: 类型注册
sidebar_position: 30
id: type_registration
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

你要序列化的每个 struct 和 enum，在使用前都必须先注册到 `Fory` 实例中。注册会告诉 Fory：如何在消息中标识该类型，以及如何对其进行编码和解码。

## 注册 Struct

你可以使用数值 ID 或名称来标识一个 struct。选择一种策略，并在所有共享这类消息的语言中保持一致。

### 按数值 ID 注册

编码更紧凑。当团队规模较小、可以协调 ID 分配时，这是很好的选择。

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

所有读写该类型的运行时都必须使用同一个数值。

### 按名称注册

更容易跨团队协同，但消息中的元信息会稍大一些。

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

你也可以显式拆分 `namespace` 和类型名：

```ts
const userType = Type.struct(
  { namespace: "example", typeName: "user" },
  {
    id: Type.int64(),
    name: Type.string(),
  },
);
```

> **同一个类型不要在不同运行时中混用两种策略。** 如果一侧使用数值 ID，另一侧使用名称，反序列化会失败。

## 使用 Decorator 注册

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

当你希望 TypeScript 类声明与 schema 定义放在一起时，基于 decorator 的注册会很方便。

## 注册 Enum

Fory JavaScript 同时支持普通 JavaScript 风格的枚举对象和 TypeScript enum。

### JavaScript 对象枚举

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

## 注册作用域

注册是以 `Fory` 实例为作用域的。如果你创建了两个实例，就需要在两个实例中都注册 schema。

## `register` 的返回值

`fory.register(schema)` 会返回一个绑定后的序列化器对：

```ts
const { serialize, deserialize } = fory.register(orderType);

// serialize returns Uint8Array bytes
const bytes = serialize({ id: 1n, total: 99.99 });

// deserialize returns the decoded value
const order = deserialize(bytes);
```

把这个返回对保存起来并重复复用，它就是性能最优的调用路径。

## 字段选项

### 可空字段

如果字段可能为 `null`，请显式标记。向不可空字段传入 `null` 会抛出异常。

```ts
Type.string().setNullable(true);
```

### 字段上的引用跟踪

当同一个对象实例可能出现在多个字段中时，需要启用字段级引用跟踪，详见 [引用](references.md)：

```ts
Type.struct("example.node").setTrackingRef(true);
```

只有在同时设置了 `new Fory({ ref: true })` 时，这个选项才会生效。

### 多态字段

当字段在运行时可能承载不同类型的值时，可以使用 `Type.any()`：

```ts
const eventType = Type.struct("example.event", {
  kind: Type.string(),
  payload: Type.any(),
});
```

如果你需要更细粒度地控制某个 struct 字段如何处理运行时类型，可以调用 `.setDynamic(Dynamic.FALSE)`，表示始终按声明类型处理；或者调用 `.setDynamic(Dynamic.TRUE)`，表示始终写入运行时类型。默认值 `Dynamic.AUTO` 适用于绝大多数场景。

## 如何选择 ID 与名称

以下情况适合使用**数值 ID**：

- 你希望消息尽可能小
- 你的组织能够保证 ID 稳定且全局唯一
- 服务之间协同非常紧密

以下情况适合使用**名称**：

- 不同团队独立定义类型
- schema 本身已经通过 package/module name 标识
- 可以接受稍大的元信息开销

## 跨语言

如果要让消息在 JavaScript 与其他运行时之间往返，双方必须对某个类型使用相同的类型标识：相同的数值 ID，或相同的 `namespace + typeName`。参见 [跨语言](xlang-serialization.md)。

## 相关主题

- [基础序列化](basic-serialization.md)
- [Schema 演进](schema-evolution.md)
- [跨语言](xlang-serialization.md)
