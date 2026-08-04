---
title: 引用
sidebar_position: 8
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

默认情况下，Fory 将每个值视为独立副本：如果同一个对象出现在两个字段中，它会被序列化两次，反序列化后得到两个独立副本。以下情况应启用引用跟踪：

- 对象图中的多个位置引用同一个对象实例
- 数据包含循环结构（例如指向自身的节点）
- 往返处理后必须保留对象标识

对于普通树形数据，请关闭引用跟踪；它会带来少量开销。

## 第 1 步：在 `Fory` 实例上启用引用跟踪

```ts
const fory = new Fory({ ref: true });
```

## 第 2 步：标记可能具有共享引用或循环引用的字段

对于值可能被共享或形成循环的每个字段，请在字段 Schema 上调用 `.setTrackingRef(true)`：

```ts
const nodeType = Type.struct("example.node", {
  value: Type.string(),
  next: Type.struct("example.node").setNullable(true).setTrackingRef(true),
});
```

全局标志和字段级标志**缺一不可**。缺少任意一个都会导致值被复制，而不是作为引用处理。

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

以下情况启用引用跟踪：

- 多个字段复用同一个对象实例
- 对象图可能形成循环
- 反序列化后需要保留对象标识

以下情况保持禁用：

- 数据是普通树形结构
- 希望获得最低开销
- 不关心对象标识

## 跨语言说明

引用跟踪是 Fory 二进制协议的一部分，可以跨语言工作。双方必须都启用引用跟踪，并将相同字段标记为启用引用跟踪，行为才能保持一致。

## 相关主题

- [基本序列化](basic-serialization.md)
- [Schema 演进](schema-evolution.md)
- [跨语言序列化](basic-serialization.md#cross-language-interoperability)
