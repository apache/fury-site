---
title: 类型注册
sidebar_position: 5
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

本页介绍如何注册 Java 类，以及禁用注册时如何限制类。

## 类注册

类注册默认启用，可防止输入选择未注册的应用类。使用 ID 注册还能减小类元数据的体积。

反序列化不可信数据时请保持注册启用。如果将其禁用，请按下文所述配置 `TypeChecker`。

### 按 ID 注册

使用 `Fory#register` 并采用自动分配的 ID 或显式 ID：

```java
Fory fory = Fory.builder().withXlang(false).build();
fory.register(Order.class);        // Automatically assigned ID
fory.register(Customer.class, 10); // Explicit ID
```

自动分配的 ID 取决于注册顺序，因此读取端和写入端必须以相同顺序注册相同的类。使用显式 ID 时顺序可以不同，但每个 ID 在两端都必须映射到同一个类。

请在首次调用 `serialize`、`deserialize` 或 `copy` 前完成类与序列化器注册。之后的注册尝试会被拒绝。

启用类注册时，`registerSerializer(Foo.class, ...)` 足以使用 `Foo`。如果还希望 Fory 分配数字类型 ID，请使用 `registerSerializerAndType(Foo.class, ...)`。一组固定的常见 JDK 接口无需显式注册，包括 `Serializable`、`CharSequence`、`Comparable`、`Cloneable`、`Runnable`、`Callable`、常见时间和集合接口、`Comparator`、`Spliterator`、`Stream`、`Collector` 以及 `java.util.function` 包中的类型。具体实现类仍遵循常规注册规则。

### 按名称注册

数字 ID 产生的类元数据最小。如果不便协调数字 ID，可按名称注册：

```java
fory.register(Foo.class, "demo.Foo");
```

如果类型名称不会重复，可使用不带命名空间前缀的名称来减小序列化体积。

读取端和写入端必须为每个类注册相同名称。名称注册比数字 ID 注册占用更多字节，但不依赖注册顺序。

## 安全配置

### 类型检查器

禁用类注册时，使用 `ForyBuilder#withTypeChecker` 限制 Fory 可以序列化和反序列化的类。仅在需要自定义匹配逻辑时实现 `TypeChecker`。
数组类会以 `Class#getName()` 格式传给自定义检查器，例如 `[[Lorg.example.Foo;`。自定义检查器必须显式处理该格式。`AllowListChecker` 会自动处理数组组件名称。

### 允许列表检查器

`AllowListChecker` 提供基于精确名称和包前缀的允许及禁止规则：

```java
AllowListChecker checker = new AllowListChecker(AllowListChecker.CheckLevel.STRICT);
checker.allowClass("org.example.*");
checker.disallowClass("org.example.internal.*");
Fory fory = Fory.builder().withXlang(false)
  .requireClassRegistration(false)
  .withTypeChecker(checker)
  .build();
```

`STRICT` 拒绝允许列表之外的所有类。`WARN` 拒绝被禁止的类，并针对允许列表之外的类记录警告。`DISABLE` 跳过允许列表检查。

请在首次调用 `serialize`、`deserialize` 或 `copy` 前配置禁止规则。如需在之后使用不同规则，请创建新的 Fory 实例。

## 限制最大反序列化深度

`ForyBuilder#withMaxDepth` 用于限制嵌套反序列化深度，默认值为 50。输入超过配置的深度时，Fory 会抛出 `ForyException`。

```java
Fory fory = Fory.builder()
  .withXlang(false)
  .withMaxDepth(100)
  .build();
```

## 最佳实践

1. 处理不可信输入时保持类注册启用。
2. 读取端和写入端可以共享稳定 ID 映射时，优先使用显式数字 ID。
3. 自动分配 ID 时，两端采用相同的注册顺序。
4. 在首次操作前配置所有类、序列化器和禁止规则。
5. 禁用类注册时配置 `AllowListChecker`。

## 相关主题

- [配置](configuration.md) - ForyBuilder 安全选项
- [自定义序列化器](custom-serializers.md) - 注册自定义序列化器
- [故障排除](troubleshooting.md) - 常见注册问题
