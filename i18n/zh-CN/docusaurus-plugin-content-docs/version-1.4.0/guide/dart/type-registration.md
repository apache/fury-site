---
title: 类型注册
sidebar_position: 4
id: dart_type_registration
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

Fory 需要知道序列化消息中的某个类型对应哪个类。你要做的，就是在序列化或反序列化之前注册每个类。

## 选择注册策略

Fory 提供两种策略。选定一种后，就要在所有读写该类型的语言里保持一致。

### 策略一：数字 ID

更紧凑，也更快。适合小团队在服务间统一协调 ID。

```dart
ModelsFory.register(fory, User, id: 100);
```

其他语言里也必须使用相同的数字：

```java
// Java side
fory.register(User.class, 100);
```

### 策略二：Namespace + Type Name

自描述性更强。适合多个团队或多个包独立定义类型，而协调数字 ID 不现实的场景。

```dart
ModelsFory.register(
  fory,
  User,
  namespace: 'example',
  typeName: 'User',
);
```

每个读写该类型的运行时都必须使用相同的 `namespace` 和 `typeName`。

> **不要对同一个类型混用策略。** 如果一侧使用数字 ID，另一侧使用名称，反序列化会失败。

## 注册生成类型

调用 `.fory.dart` 文件中生成的 `register` 函数，它会为你安装好所需的全部序列化元信息：

```dart
UserModelsFory.register(fory, User, id: 100);
```

## 注册自定义序列化器

对于无法添加 `@ForyStruct()` 的类型，可以直接传入序列化器实例：

```dart
fory.registerSerializer(
  ExternalType,
  const ExternalTypeSerializer(),
  namespace: 'example',
  typeName: 'ExternalType',
);
```

关于如何实现序列化器，见 [自定义序列化器](custom-serializers.md)。

## 必须遵守的规则

- 在第一次调用 `serialize` 或 `deserialize` **之前**完成注册
- 注册消息中可能出现的**每一个**类，而不仅是根类型
- 一旦载荷已经持久化，或已经在服务间交换，就必须保持 ID 或名称**稳定**
- 对同一个类型，不要一侧用数字 ID，另一侧用名称

## 跨语言要求

所有读写该类型的运行时都必须使用相同的数字 ID，或者相同的 `namespace + typeName` 组合。示例见 [跨语言](xlang-serialization.md)。

## 相关主题

- [代码生成](code-generation.md)
- [跨语言](xlang-serialization.md)
- [自定义序列化器](custom-serializers.md)
