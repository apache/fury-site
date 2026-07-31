---
title: 引用
sidebar_position: 50
id: references
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

默认情况下，Fory 会把每个值都当作独立副本处理。如果同一个对象出现在两个字段中，它会被序列化两次；反序列化后，你得到的也是两个彼此独立的副本。以下情况应启用引用跟踪：

- 同一个对象实例会在对象图中的多个位置被引用
- 数据中包含循环结构，例如一个节点指向自己
- 往返之后必须保留对象身份

对于普通的树状数据，应保持引用跟踪关闭，因为它会引入少量额外开销。

## 第一步：在 `Fory` 实例上启用引用跟踪

```ts
const fory = new Fory({ ref: true });
```

## 第二步：标记可能出现共享引用或循环引用的字段

对于每个值可能被共享或形成循环的字段，都需要在字段 schema 上调用 `.setTrackingRef(true)`：

```ts
const nodeType = Type.struct("example.node", {
  value: Type.string(),
  next: Type.struct("example.node").setNullable(true).setTrackingRef(true),
});
```

全局开关和字段级开关必须**同时**启用。缺少任何一个，值都会被复制，而不是按引用恢复。

## 循环自引用示例

```ts
import Fory, { Type } from "@apache-fory/core";

const nodeType = Type.struct("example.node", {
  name: Type.string(),
  selfRef: Type.struct("example.node").setNullable(true).setTrackingRef(true),
});

const fory = new Fory({ ref: true });
const { serialize, deserialize } = fory.register(nodeType);

const node: any = { name: "root", selfRef: null };
node.selfRef = node;

const copy = deserialize(serialize(node));
console.log(copy.selfRef === copy); // true
```

## 共享嵌套引用示例

```ts
const innerType = Type.struct(501, {
  value: Type.string(),
});

const outerType = Type.struct(502, {
  left: Type.struct(501).setNullable(true).setTrackingRef(true),
  right: Type.struct(501).setNullable(true).setTrackingRef(true),
});

const fory = new Fory({ ref: true });
const { serialize, deserialize } = fory.register(outerType);

const shared = { value: "same-object" };
const copy = deserialize(serialize({ left: shared, right: shared }));
console.log(copy.left === copy.right); // true
```

## 何时启用

以下情况建议启用引用跟踪：

- 同一个对象实例会被多个字段重复引用
- 你的对象图可能存在环
- 反序列化后对象身份是否保持一致很重要

以下情况建议关闭：

- 数据是普通树结构
- 你希望获得最低开销
- 对象身份并不重要

## 跨语言说明

引用跟踪是 Fory 二进制协议的一部分，并且可以跨运行时工作。为了让行为一致，两端都必须启用引用跟踪，并把相同字段标记为引用跟踪字段。

## 相关主题

- [基础序列化](basic-serialization.md)
- [Schema 演进](schema-evolution.md)
- [跨语言](xlang-serialization.md)
