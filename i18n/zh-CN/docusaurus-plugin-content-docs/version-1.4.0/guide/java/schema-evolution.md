---
title: Schema 演进
sidebar_position: 9
id: schema_evolution
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

本页介绍 schema 演化、元数据共享以及处理不存在的类。

## 处理类 Schema 演化

在许多系统中，用于序列化的类的 schema 可能会随时间而改变。例如，类中的字段可能会被添加或删除。当序列化和反序列化过程使用不同版本的 jar 时，被反序列化的类的 schema 可能与序列化期间使用的不同。

### 默认模式：SCHEMA_CONSISTENT

默认情况下，Fory 使用 `CompatibleMode.SCHEMA_CONSISTENT` 模式序列化对象。此模式假设反序列化过程使用与序列化过程相同的类 schema，从而最小化有效负载开销。但是，如果存在 schema 不一致，反序列化将失败。

### 兼容模式

如果预期 schema 会发生变化，为了使反序列化成功（即 schema 前向/后向兼容性），用户必须配置 Fory 使用 `CompatibleMode.COMPATIBLE`。这可以使用 `ForyBuilder#withCompatibleMode(CompatibleMode.COMPATIBLE)` 方法完成。

在此兼容模式下，反序列化可以处理 schema 变更，如缺失或额外的字段，允许在序列化和反序列化过程具有不同类 schema 时也能成功。

```java
Fory fory = Fory.builder()
  .withCompatibleMode(CompatibleMode.COMPATIBLE)
  .build();

byte[] bytes = fory.serialize(object);
System.out.println(fory.deserialize(bytes));
```

此兼容模式涉及将类元数据序列化到序列化输出中。尽管 Fory 使用复杂的压缩技术来最小化开销，但与类元数据相关联的仍有一些额外的空间成本。

## 元数据共享

为了进一步降低元数据成本，Fory 引入了类元数据共享机制，允许元数据只发送到反序列化过程一次。

Fory 支持在上下文（例如 TCP 连接）中的多次序列化之间共享类型元数据（类名、字段名、最终字段类型信息等）。此信息将在上下文中的第一次序列化期间发送到对等端。基于此元数据，对等端可以重建相同的反序列化器，这避免了为后续序列化传输元数据，并降低网络流量压力，同时自动支持类型前向/后向兼容性。

### 使用元数据共享

```java
// Fory.builder()
//   .withLanguage(Language.JAVA)
//   .withRefTracking(false)
//   // 在多次序列化之间共享元数据。
//   .withMetaContextShare(true)

// 非线程安全 fory。
MetaWriteContext writeContext = xxx;
fory.setMetaWriteContext(writeContext);
byte[] bytes = fory.serialize(o);

// 非线程安全 fory。
MetaReadContext readContext = xxx;
fory.setMetaReadContext(readContext);
fory.deserialize(bytes);
```

### 线程安全元数据共享

```java
// 线程安全 fory
byte[] serialized = fory.execute(
  f -> {
    f.setMetaWriteContext(writeContext);
    return f.serialize(beanA);
  }
);

// 线程安全 fory
Object newObj = fory.execute(
  f -> {
    f.setMetaReadContext(readContext);
    return f.deserialize(serialized);
  }
);
```

**注意**：`MetaWriteContext` 和 `MetaReadContext` 都不是线程安全的，不能在多个 Fory 实例或多个线程之间重用。在多线程场景下，必须为每个 Fory 实例创建一对独立的 meta context。如果你需要不同的类加载器，请创建一个配置了该类加载器的独立 `Fory` 或 `ThreadSafeFory`，而不是在已有实例上切换类加载器。

有关更多详细信息，请参阅 [元数据共享规范](https://fory.apache.org/docs/specification/fory_java_serialization_spec#meta-share)。

## 反序列化未知类

Fory 支持反序列化不存在或未知的类。此功能可通过 `ForyBuilder#deserializeUnknownClass(true)` 启用。

启用后，如果同时启用了元数据共享，Fory 会把这类数据存放在 `Map` 的惰性子类中。通过使用 Fory 实现的惰性 map，可以避免反序列化过程中填充 map 的重平衡成本，从而进一步提升性能。

如果这些数据被发送到另一个进程，并且该进程中存在相应类，那么这些数据就会被反序列化为该类型的对象，而不会丢失信息。

如果没有启用元数据共享，新类数据会被跳过，并返回 `UnknownSkipClass` 存根对象。

## 将对象从一种类型复制/映射到另一种类型

Fory 支持将对象从一种类型映射到另一种类型。

**注意：**

1. 此映射将执行深拷贝。所有映射的字段都被序列化为二进制，并从该二进制反序列化以映射到另一种类型。
2. 所有结构体类型必须使用相同的 ID 注册，否则 Fory 无法映射到正确的结构体类型。使用 `Fory#register(Class)` 时要小心，因为 Fory 会分配一个自动增长的 ID，如果你在 Fory 实例之间以不同的顺序注册类，这可能会不一致。

```java
public class StructMappingExample {
  static class Struct1 {
    int f1;
    String f2;

    public Struct1(int f1, String f2) {
      this.f1 = f1;
      this.f2 = f2;
    }
  }

  static class Struct2 {
    int f1;
    String f2;
    double f3;
  }

  static ThreadSafeFory fory1 = Fory.builder()
    .withCompatibleMode(CompatibleMode.COMPATIBLE).buildThreadSafeFory();
  static ThreadSafeFory fory2 = Fory.builder()
    .withCompatibleMode(CompatibleMode.COMPATIBLE).buildThreadSafeFory();

  static {
    fory1.register(Struct1.class);
    fory2.register(Struct2.class);
  }

  public static void main(String[] args) {
    Struct1 struct1 = new Struct1(10, "abc");
    Struct2 struct2 = (Struct2) fory2.deserialize(fory1.serialize(struct1));
    Assert.assertEquals(struct2.f1, struct1.f1);
    Assert.assertEquals(struct2.f2, struct1.f2);
    struct1 = (Struct1) fory1.deserialize(fory2.serialize(struct2));
    Assert.assertEquals(struct1.f1, struct2.f1);
    Assert.assertEquals(struct1.f2, struct2.f2);
  }
}
```

## 将 POJO 反序列化为另一种类型

Fory 允许你序列化一个 POJO，并将其反序列化为另一个不同的 POJO。不同的 POJO 意味着 schema 不一致。用户必须将 Fory 配置为 `CompatibleMode.COMPATIBLE`。

```java
public class DeserializeIntoType {
  static class Struct1 {
    int f1;
    String f2;

    public Struct1(int f1, String f2) {
      this.f1 = f1;
      this.f2 = f2;
    }
  }

  static class Struct2 {
    int f1;
    String f2;
    double f3;
  }

  static ThreadSafeFory fory = Fory.builder()
    .withCompatibleMode(CompatibleMode.COMPATIBLE).buildThreadSafeFory();

  public static void main(String[] args) {
    Struct1 struct1 = new Struct1(10, "abc");
    byte[] data = fory.serialize(struct1);
    Struct2 struct2 = fory.deserialize(data, Struct2.class);
  }
}
```

## 配置选项

| 选项                          | 描述                                | 默认值                    |
| ----------------------------- | ----------------------------------- | ------------------------- |
| `compatibleMode`              | `SCHEMA_CONSISTENT` 或 `COMPATIBLE` | `SCHEMA_CONSISTENT`       |
| `checkClassVersion`           | 检查类 schema 一致性                | `false`                   |
| `metaShareEnabled`            | 启用元数据共享                      | 如果是兼容模式则为 `true` |
| `scopedMetaShareEnabled`      | 每次序列化的作用域元数据共享        | 如果是兼容模式则为 `true` |
| `deserializeUnknownClass`     | 处理不存在或未知的类                | 如果是兼容模式则为 `true` |
| `metaCompressor`              | 元数据压缩的压缩器                  | `DeflaterMetaCompressor`  |

## 最佳实践

1. **对演化的 schema 使用 COMPATIBLE 模式**：当类可能在版本之间更改时
2. **为网络通信启用元数据共享**：减少重复序列化的带宽
3. **对结构体映射使用一致的类型 ID**：确保相同的注册顺序或显式 ID
4. **考虑空间开销**：兼容模式会添加元数据，根据需求平衡

## 相关主题

- [配置选项](configuration.md) - 所有 ForyBuilder 选项
- [跨语言序列化](xlang-serialization.md) - XLANG 模式
- [故障排查](troubleshooting.md) - 常见 Schema 问题
