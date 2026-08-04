---
title: 类型注册
sidebar_position: 6
id: type-registration
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

Fory 需要知道序列化消息中的类型分别对应哪个类。请在序列化或反序列化每个类之前完成注册。

## 选择注册策略

Fory 提供两种策略。请选择一种，并在读写该类型的每种语言中保持一致。

### 策略 1：数字 ID

紧凑且快速，适合小型团队能够跨服务协调 ID 的场景。

```dart
ModelsForyModule.register(fory, User, id: 100);
```

其他每种语言必须使用相同数字：

```java
// Java side
fory.register(User.class, 100);
```

### 策略 2：名称

自描述性更强，适合多个团队或包独立定义类型、难以协调数字 ID 的场景。

```dart
ModelsForyModule.register(
  fory,
  User,
  name: 'example.User',
);
```

读写此类型的每个通信方必须使用相同名称。使用 `.` 在 `name` 中添加命名空间前缀。

> **不要为同一类型混用策略。** 如果一端使用数字 ID，另一端使用名称，反序列化将失败。

## 注册生成类型

调用生成的 `register` 函数，它位于 `.fory.dart` 文件中。该函数会安装全部序列化器元数据：

```dart
UserModelsForyModule.register(fory, User, id: 100);
```

对于普通继承类型，请注册带注解的具体子类。其生成序列化器已经拥有完整的扁平子类 Schema；父类或 mixin 仅仅提供字段时，Fory 不要求在运行时注册它们。

仅当运行时类型为独立带注解具体父类的值也会被序列化时，才注册该父类。仅作为提供方的 `@ForyStruct(exposePrivateFields: true)` 边界提供生成字段访问，自身没有注册条目。边界和子类 Schema 选项参见 [Struct 继承](inheritance.md)。

外部结构化序列化器使用相同的生成注册 API。请传入外部目标类型：

```dart
ExternalSerializersForyModule.register(
  fory,
  third_party.User,
  id: 100,
);
```

声明方式参见[外部类型序列化](external-types.md)。

## 注册自定义序列化器

类型需要自定义编码或构造逻辑时，直接传入序列化器实例：

```dart
fory.registerSerializer(
  ExternalType,
  const ExternalTypeSerializer(),
  name: 'example.ExternalType',
);
```

如何实现序列化器参见[自定义序列化器](custom-serializers.md)。

## 应遵循的规则

- 在首次调用 `serialize`、`serializeTo`、`serializeBuiltin`、`serializeBuiltinTo`、`deserialize` 或 `deserializeFrom` **之前**完成注册。首次根操作会永久关闭该 `Fory` 实例的注册，即使操作失败也是如此；需要不同注册表时，请创建新实例。
- 注册消息中可能出现的**每个**类，而不只是根类型。
- 不要注册生成的私有字段访问配套类型；只注册具体序列化类型。
- 一旦载荷开始持久化或跨服务交换，请保持 ID（或名称）**稳定**。修改它们会破坏旧消息的反序列化。
- 不要让一端对同一类型使用数字 ID，而另一端使用名称。

## 跨语言要求

读写该类型的每个通信方必须使用相同数字 ID 或名称。示例参见[跨语言序列化](xlang.md)。

## 相关主题

- [Struct 继承](inheritance.md)
- [代码生成](code-generation.md)
- [外部类型序列化](external-types.md)
- [跨语言序列化](xlang.md)
- [自定义序列化器](custom-serializers.md)
