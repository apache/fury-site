---
title: 故障排查
sidebar_position: 90
id: troubleshooting
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

本页介绍使用 Fory JavaScript 时常见的问题。

## 无法反序列化非跨语言载荷

Fory JavaScript 运行时只能读取 Fory 的跨语言载荷。如果生产端是 Java 或 Go 服务，并且使用的是语言原生格式，那么 JavaScript 侧无法解码。

修复方式：把生产端切换到跨语言模式。Java 请使用 `.withLanguage(Language.XLANG)`，Go 请使用 `WithXlang(true)`。

## `maxDepth must be an integer >= 2`

这表示你传入了无效的 `maxDepth` 值。它必须是大于等于 2 的正整数。

```ts
new Fory({ maxDepth: 100 });
```

只有当你的数据确实存在很深的嵌套时，才应提高这个值。

## `Binary size ... exceeds maxBinarySize`

某个二进制字段或整条消息超过了安全限制。如果这个大小符合预期，且数据源可信，可以提高限制：

```ts
new Fory({ maxBinarySize: 128 * 1024 * 1024 });
```

## `Collection size ... exceeds maxCollectionSize`

某个 list、set 或 map 的元素数量超过了配置上限。这通常意味着数据异常地大。如果这是合法场景，可以提高限制：

```ts
new Fory({ maxCollectionSize: 2_000_000 });
```

## `Field "..." is not nullable`

你向一个未声明为可空的字段传入了 `null`。修复方式：在字段 schema 上添加 `.setNullable(true)`：

```ts
const userType = Type.struct("example.user", {
  name: Type.string(),
  email: Type.string().setNullable(true), // ← this field can be null
});
```

## 反序列化后对象不是同一个实例

默认情况下，Fory 不保留对象身份。两个字段如果指向同一个对象，反序列化后会变成两个彼此独立的副本。

修复方式：同时启用以下**两个**开关：

1. 在实例上配置 `new Fory({ ref: true })`
2. 在具体字段上调用 `.setTrackingRef(true)`

参见 [引用](references.md)。

## 大整数会以 `bigint` 返回

这是预期行为。对于任何 64 位整数字段，例如 `Type.int64()`、`Type.uint64()`，Fory 都会使用 `bigint`。如果你确实需要 `number`，请使用更小的整数类型，比如 `Type.int32()`，但前提是该值确实能装进 32 位。

## 查看生成的序列化器代码

如果你需要排查 Fory 在底层生成了什么，可以通过 hook 查看生成后的序列化器代码：

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

## `@apache-fory/hps` 安装失败

`@apache-fory/hps` 是一个可选的 Node.js 加速模块。如果它安装失败，例如当前平台不支持原生模块，只需把它从依赖中移除即可。即使没有它，Fory 也能正常工作。

## 相关主题

- [基础序列化](basic-serialization.md)
- [引用](references.md)
- [跨语言](xlang-serialization.md)
