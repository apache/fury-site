---
title: 类型注册
sidebar_position: 8
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

Fory 需要知道序列化消息中的类型与哪个类对应。你需要在序列化或反序列化之前注册每个类。

## 选择注册策略

Fory 提供两种策略。请选择其中一种，并在读写该类型的每种语言中保持一致。

### 策略一：数字 ID

这种方式紧凑且速度快，适合小团队能够跨服务协调 ID 的场景。

```dart
ModelsForyModule.register(fory, User, id: 100);
```

其他每种语言都必须使用相同的数字：

```java
// Java side
fory.register(User.class, 100);
```

### 策略二：名称

这种方式的自描述性更强，适合多个团队或 package 独立定义类型、
难以协调数字 ID 的场景。

```dart
ModelsForyModule.register(
  fory,
  User,
  name: 'example.User',
);
```

读写此类型的每个对端都必须使用相同的名称。可以在 `name` 中使用 `.`
添加 namespace 前缀。

> **不要为同一类型混用两种策略。** 如果一端使用数字 ID，另一端使用名称，
> 反序列化将会失败。

## 注册生成的类型

调用 `.fory.dart` 文件中生成的 `register` 函数。它会为你安装所有序列化器元数据：

```dart
UserModelsForyModule.register(fory, User, id: 100);
```

对于常规的继承类型，注册带注解的具体子类即可。生成的序列化器已经拥有完整且扁平化的
子类 Schema；父类或 mixin 仅仅贡献了字段时，Fory 不要求在运行时注册它们。

只有当运行时类型为某个独立注解的具体父类的值也需要序列化时，才注册该父类。
仅用于提供字段访问的 `@ForyStruct(exposePrivateFields: true)` 边界没有自己的注册项。
有关边界和子类 Schema 选项，请参见 [Struct 继承](inheritance.md)。

外部结构化序列化器使用相同的生成注册 API。请传入外部目标类型：

```dart
ExternalSerializersForyModule.register(
  fory,
  third_party.User,
  id: 100,
);
```

声明方式请参见 [外部类型序列化](external-types.md)。

## 注册自定义序列化器

当类型需要自定义编码格式或构造逻辑时，直接传入序列化器实例：

```dart
fory.registerSerializer(
  ExternalType,
  const ExternalTypeSerializer(),
  name: 'example.ExternalType',
);
```

如何实现序列化器请参见 [自定义序列化器](custom-serializers.md)。

## 必须遵守的规则

- 在第一次调用 `serialize` 或 `deserialize` **之前**完成注册。
- 注册消息中可能出现的**每一个**类，而不仅仅是根类型。
- 不要注册生成的私有字段访问 companion；只注册实际序列化的具体类型。
- 一旦载荷已经持久化或在服务间交换，就必须保持 ID（或名称）**稳定**。修改它们将导致旧消息无法反序列化。
- 不要为同一类型在一端使用数字 ID、另一端使用名称。

## Xlang 要求

读写该类型的每个对端都必须使用相同的数字 ID 或名称。
示例请参见 [Xlang 序列化](xlang-serialization.md)。

## 相关主题

- [Struct 继承](inheritance.md)
- [代码生成](code-generation.md)
- [外部类型序列化](external-types.md)
- [Xlang 序列化](xlang-serialization.md)
- [自定义序列化器](custom-serializers.md)
