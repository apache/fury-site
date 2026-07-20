---
title: Schema 演进
sidebar_position: 8
id: dart_schema_evolution
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

Schema 演进让应用的不同版本之间也能安全交换消息。例如，v2 写出的消息仍然可以被 v1 读取，反过来也一样。

## 两种模式

### 兼容模式（推荐给会演进的服务）

当服务可能同时运行不同版本时启用它，例如滚动发布期间，或者客户端无法立即升级时。

```dart
final fory = Fory(compatible: true);
```

在兼容模式下，Fory 会在每条消息中写入足够的字段元信息，使读端能够跳过未知字段，并为缺失字段使用默认值。请用稳定字段 ID 来锚定跨版本 Schema。

### Schema 一致模式（默认）

通信双方必须拥有同一个模型。Fory 会校验双方 Schema 是否一致，并拒绝来自其他 Schema 版本的消息。适用于所有服务总是一起升级，并且你希望尽早把 Schema 不匹配直接报错的场景。

```dart
final fory = Fory(); // compatible: false by default
```

## 为演进做好准备

为了安全地使用兼容模式，请给结构体添加 `@ForyStruct(evolving: true)`（默认值），并在第一次对外发送载荷之前，为每个字段都分配稳定的 `@ForyField(id: ...)`：

```dart
@ForyStruct(evolving: true)
class UserProfile {
  UserProfile();

  @ForyField(id: 1)
  String name = '';

  @ForyField(id: 2, nullable: true)
  String? nickname;
}
```

如果载荷已经在生产环境中存在之后你才补加字段 ID，那么旧消息里不会包含这些 ID，Schema 演进也就无法正确工作。

## 哪些变更是安全的

**安全变更**（双方兼容）：

- 新增一个带新字段 ID 的可选字段
- 重命名字段，只要 `@ForyField(id: ...)` 保持不变
- 删除字段，对端会忽略缺失值并使用 Dart 默认值

**危险变更**（可能破坏已有消息）：

- 把一个已有字段 ID 复用给另一个不同字段
- 将字段类型改为不兼容类型，例如 `Int32` 改成 `String`
- 在消息进入生产环境后修改某个类型的注册身份，即 `id`、`namespace` 或 `typeName`
- 不改字段 ID，却改变字段的逻辑含义

## 跨语言说明

只有在**所有**交换消息的运行时都一致满足以下条件时，Schema 演进才会生效：

1. 使用相同的 `compatible` 设置。
2. 使用相同的类型注册身份，即相同的数字 ID，或者相同的 `namespace + typeName`。
3. 对字段 ID 的逻辑含义有相同理解。

部署前请用真实 round trip 覆盖滚动升级场景。

## 相关主题

- [配置](configuration.md)
- [字段配置](schema-metadata.md)
- [跨语言](xlang-serialization.md)
