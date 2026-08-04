---
title: 基础序列化
sidebar_position: 3
id: core-api
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

本页介绍 Java 跨语言模式快速入门。跨语言模式是 Java 的默认编码格式，也是处理跨语言载荷时的首选。

## 创建 Fory 实例

创建单线程跨语言 Fory 实例时，请显式设置模式：

```java
import org.apache.fory.Fory;

Fory fory = Fory.builder()
    .withXlang(true)
    .requireClassRegistration(true)
    .build();
```

创建线程安全的 Fory 实例时，使用同一个构建器构建 `ThreadSafeFory`：

```java
import org.apache.fory.ThreadSafeFory;

ThreadSafeFory fory = Fory.builder()
    .withXlang(true)
    .requireClassRegistration(true)
    .buildThreadSafeFory();
```

Java 默认的跨语言模式也默认启用兼容 Schema 模式，因此独立部署的服务可以在 Schema 元数据保持兼容时增删字段。仅当所有读取端和写入端始终使用相同 Schema，并且希望获得更快的序列化速度和更小的体积时，才使用 `withCompatible(false)`。只有在确认所有语言使用相同的跨语言 Schema，或原生类型由 Fory Schema IDL 生成时，才应选择 `compatible=false`。

## 注册自定义类型

在每个对等端以相同的类型标识注册应用类。数字 ID 紧凑且快速，而名称注册更便于在独立维护的服务之间协调。

```java
import org.apache.fory.annotation.ForyField;

public class User {
  @ForyField(id = 0)
  public String name;

  @ForyField(id = 1)
  public int age;
}

Fory fory = Fory.builder()
    .withXlang(true)
    .requireClassRegistration(true)
    .build();

fory.register(User.class, "example", "User");
```

长期使用的 Schema 应采用字段 ID，这样即使 Java 字段名发生变化，字段标识仍保持稳定。Java 注解、可空性、引用跟踪和枚举元数据参见 [Schema 元数据](schema-metadata.md)。

## 序列化与反序列化

```java
User user = new User();
user.name = "Alice";
user.age = 30;

byte[] bytes = fory.serialize(user);
User decoded = fory.deserialize(bytes, User.class);
```

跨语言字节在不同语言之间传递时，每个对等端都必须注册相同的类型标识和兼容的字段元数据。共享规则参见[跨语言序列化](../xlang/index.md)，Java 专用 API 调用参见 [Java 跨语言序列化](xlang.md)。

## 对仅限 Java 的流量使用原生序列化

对于同语言的 Java/JVM 流量，原生模式通常更合适：

```java
Fory fory = Fory.builder()
    .withXlang(false)
    .build();
```

原生模式支持广泛的 Java 对象序列化能力，包括 JDK 序列化钩子、对象复制和原生模式零拷贝缓冲区。参见[原生序列化](native.md)。

## 常用选项

- `withRefTracking(true)` 保留共享引用和循环引用。
- `requireClassRegistration(true)` 保持默认的已注册类型策略。
- 原生模式和跨语言载荷默认启用兼容模式。仅当所有读取端和写入端使用相同 Schema，且希望获得更快速度和更小体积时，才使用 `withCompatible(false)`。对于跨语言载荷，只有在确认所有语言使用相同 Schema，或原生类型由 Fory Schema IDL 生成时，才应选择 `compatible=false`。
- `withAsyncCompilation(true)` 在受支持的平台上启用异步序列化器编译。

## 最佳实践

1. **复用 Fory 实例**：创建 Fory 的开销较大，应始终复用实例
2. **选择合适的线程安全方式**：根据需求选择单线程或线程安全实现
3. **注册类**：在每个跨语言对等端保持稳定的类型标识
4. **配置引用跟踪**：仅当对象图需要保持对象标识或循环引用时启用

## 相关主题

- [配置](configuration.md) - 所有 ForyBuilder 选项
- [原生序列化](native.md) - 仅限 Java 的序列化功能
- [Schema 元数据](schema-metadata.md) - 字段 ID、可空性、引用跟踪和枚举 ID
- [跨语言序列化](xlang.md) - Java 跨语言互操作
- [故障排除](troubleshooting.md) - 常见 API 使用问题
