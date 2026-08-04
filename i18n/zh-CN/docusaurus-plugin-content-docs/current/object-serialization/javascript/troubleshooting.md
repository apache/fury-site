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

本页介绍使用 Fory JavaScript 时的常见问题。

## 无法反序列化非跨语言载荷

Fory JavaScript 只能读取 Fory 跨语言载荷。如果生成方是使用原生模式格式的 Java 或 Go 服务，JavaScript 端无法解码。

解决方法：将生成方切换为 xlang 载荷。Java 和 Go 默认使用 xlang；除非每个通信方使用相同 Schema，否则应使用兼容模式。

## `maxDepth must be an integer >= 2`

这表示传入了无效的 `maxDepth` 值。它必须是至少为 2 的正整数。

```ts
new Fory({ maxDepth: 100 });
```

仅当数据确实深度嵌套时才提高此值。

## `Field "..." is not nullable`

你正在向未声明为可空的字段传入 `null`。解决方法：在字段 Schema 上添加 `.setNullable(true)`：

```ts
const userType = Type.struct("example.user", {
  name: Type.string(),
  email: Type.string().setNullable(true), // ← this field can be null
});
```

## 反序列化后的对象不是同一个实例

Fory 默认不保留对象标识。指向同一个对象的两个字段会变成两个独立副本。

解决方法：同时启用以下两项：

1. 在实例上使用 `new Fory({ ref: true })`
2. 在具体字段上使用 `.setTrackingRef(true)`

参见[引用](references.md)。

## 大整数返回为 `bigint`

这是预期行为。Fory 使用 `bigint` 处理所有 64 位整数字段（`Type.int64()`、`Type.uint64()`）。如果需要 `number`，请使用 `Type.int32()` 等较小的整数类型，但前提是该值确实可以放入 32 位。

## 检查生成的序列化器代码

如果需要调试 Fory 的内部行为，可以通过 hook 检查生成的序列化器代码：

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

`@apache-fory/hps` 是可选的 Node.js 加速器。如果安装失败（例如平台不支持原生模块），只需将它从依赖中移除。没有它，Fory 仍能正常工作。

## 相关主题

- [基本序列化](basic-serialization.md)
- [引用](references.md)
- [跨语言序列化](basic-serialization.md#cross-language-interoperability)
