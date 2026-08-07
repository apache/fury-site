---
title: Schema 演进
sidebar_position: 6
id: schema-evolution
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

本页介绍 Schema 演进、元数据共享以及不存在/未知类的处理方式。

## 处理类 Schema 演进

在许多系统中，用于序列化的类 Schema 会随时间变化，例如类中的字段可能增加或删除。当序列化和反序列化进程使用不同版本的 JAR 时，反序列化类的 Schema 可能与序列化时使用的 Schema 不同。

### 默认模式

Java 原生模式（`xlang=false`）和跨语言模式均默认使用兼容模式。对于独立部署的服务，该默认设置更安全，因为滚动升级期间或不同语言的 Fory 实现之间，写入端和读取端的 Schema 可能不同。

如果载荷的读取端和写入端 Schema 永远相同，请参见[相同 Schema 优化](#same-schema-optimization)。

### 兼容模式

兼容模式默认启用，因此只要元数据保持兼容，反序列化就能容忍字段的新增、删除或重排。

在兼容模式下，反序列化可以处理字段缺失或多余等 Schema 变化，因此即使序列化和反序列化进程使用不同的类 Schema，也能成功完成。

当转换无损时，兼容读取器也能容忍部分标量字段类型变化。匹配字段在转换后保持相同逻辑值时，可以在 `boolean`、`String`、数字标量和 `BigDecimal` 之间读取。例如，`"true"` 和 `"false"` 可读取为布尔值，`"123"` 可读取到能容纳 `123` 的数字字段，数字和小数可读取为规范字符串；只有不损失精度或范围时，数字扩宽或收窄才会成功。数字字符串使用有限 ASCII 十进制语法。可空字段和装箱字段仍可与这些转换组合，但启用引用跟踪的标量类型变化不兼容。无效字符串和有损转换会在反序列化期间失败。

没有匹配本地字段的额外写入端字段会被跳过。如果字段按 tag ID 或名称匹配，但 Schema 不兼容，则不会被视为缺失字段，而是导致反序列化失败。

```java
Fory fory = Fory.builder().withXlang(false)
  .build();

byte[] bytes = fory.serialize(object);
System.out.println(fory.deserialize(bytes));
```

兼容模式会将类元数据写入序列化输出。尽管 Fory 使用先进的压缩技术尽量降低开销，类元数据仍会带来一定的额外空间成本。

## 元数据共享

为了进一步降低元数据成本，Fory 引入类元数据共享机制，使元数据只需向反序列化进程发送一次。

Fory 支持在一个上下文（例如 TCP 连接）中的多次序列化之间共享类型元数据（类名、字段名、final 字段类型信息等）。这些信息会在该上下文的首次序列化时发送给对等端。对等端可根据元数据重建相同的反序列化器，后续序列化无需再次传输元数据，从而减轻网络流量压力，并自动支持类型的向前/向后兼容。

### 使用元数据共享

```java
// Fory.builder()
//   .withXlang(false)
//   .withRefTracking(false)
//   // share meta across serialization.
//   .withMetaShare(true)

// Not thread-safe fory.
MetaWriteContext writeContext = xxx;
fory.setMetaWriteContext(writeContext);
byte[] bytes = fory.serialize(o);

// Not thread-safe fory.
MetaReadContext readContext = xxx;
fory.setMetaReadContext(readContext);
fory.deserialize(bytes);
```

### 线程安全的元数据共享

```java
// Thread-safe fory
byte[] serialized = fory.execute(
  f -> {
    f.setMetaWriteContext(writeContext);
    return f.serialize(beanA);
  }
);

// Thread-safe fory
Object newObj = fory.execute(
  f -> {
    f.setMetaReadContext(readContext);
    return f.deserialize(serialized);
  }
);
```

**注意**：`MetaWriteContext` 和 `MetaReadContext` 不是线程安全的，不能跨 Fory 实例或多个线程复用。在多线程场景中，每个 Fory 实例都必须创建一对独立的元数据上下文。如需使用不同的类加载器，请创建配置了该加载器的独立 `Fory` 或 `ThreadSafeFory`，不要在现有实例上切换加载器。

更多详情参见[元数据共享规范](https://fory.apache.org/docs/specification/java_serialization_spec#meta-sharing)。

## 反序列化未知类

Fory 支持反序列化不存在或未知的类。可通过 `ForyBuilder#deserializeUnknownClass(true)` 启用该功能。

同时启用该功能和元数据共享后，Fory 会将该类型的反序列化数据存储在 Map 的延迟子类中。使用 Fory 实现的延迟映射可避免反序列化填充映射时的再平衡成本，进一步提升性能。

如果将该数据发送到另一个存在对应类的进程，数据会无损地反序列化为该类型的对象。

如果未启用元数据共享，新类数据会被跳过，Fory 返回一个 `UnknownEmptyStruct` 标记对象。

## 在不同类型之间复制/映射对象

Fory 支持将对象从一种类型映射到另一种类型。

**注意事项：**

1. 此映射会执行深拷贝。所有映射字段都会序列化为二进制，再从该二进制反序列化并映射到另一类型。
2. 所有结构体类型必须使用相同 ID 注册，否则 Fory 无法映射到正确的结构体类型。使用 `Fory#register(Class)` 时请特别注意：Fory 会分配自动递增的 ID，如果不同 Fory 实例采用不同的类注册顺序，ID 可能不一致。

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

  static ThreadSafeFory fory1 = Fory.builder().withXlang(false)
    .buildThreadSafeFory();
  static ThreadSafeFory fory2 = Fory.builder().withXlang(false)
    .buildThreadSafeFory();

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

Fory 允许序列化一个 POJO，再反序列化为另一个 POJO。不同 POJO 意味着 Schema 不一致，因此应使用兼容模式。

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

  static ThreadSafeFory fory = Fory.builder().withXlang(false)
    .buildThreadSafeFory();

  public static void main(String[] args) {
    Struct1 struct1 = new Struct1(10, "abc");
    byte[] data = fory.serialize(struct1);
    Struct2 struct2 = fory.deserialize(data, Struct2.class);
  }
}
```

## 相同 Schema 优化 {#same-schema-optimization}

仅当每个载荷反序列化时使用的类 Schema 始终与序列化时相同，并且希望获得更快速度和更小体积时，才使用 `ForyBuilder#withCompatible(false)`。对于跨语言载荷，只有在确认每种语言使用相同 Schema，或原生类型由 Fory Schema IDL 生成时，才调用 `withCompatible(false)`。

```java
Fory fory = Fory.builder()
    .withXlang(false)
    .withCompatible(false)
    .build();
```

### 按类选择退出

`@ForyStruct` 可以按类设置演进策略：

- `Evolution.INHERIT`：遵循 Fory 实例的兼容/元数据共享配置，为默认值。
- `Evolution.ENABLED`：要求该类使用 Schema 演进元数据。如果 Fory 实例无法输出该元数据，注册或类型解析会失败。
- `Evolution.DISABLED`：即使已启用兼容元数据，也强制使用固定 Schema 的 `STRUCT/NAMED_STRUCT` 编码。

仅对相同 Schema 的类使用 `@ForyStruct(evolution = Evolution.DISABLED)`。也支持使用布尔简写 `@ForyStruct(evolving = false)` 选择退出。

```java
import org.apache.fory.annotation.ForyStruct;
import org.apache.fory.annotation.ForyStruct.Evolution;

@ForyStruct(evolution = Evolution.DISABLED)
public class SameSchemaMessage {
  public int id;
  public String name;
}
```

## 配置

| 选项                      | 说明                                                                   | 默认值                   |
| ------------------------- | ---------------------------------------------------------------------- | ------------------------ |
| `compatibleMode`          | 控制 Fory 是否写入 Schema 演进元数据；相同 Schema 模式要求 Schema 匹配 | `COMPATIBLE`             |
| `checkClassVersion`       | 检查相同 Schema 载荷的 Schema 哈希                                     | `false`                  |
| `metaShareEnabled`        | 启用元数据共享                                                         | 兼容模式下为 `true`      |
| `scopedMetaShareEnabled`  | 每次序列化使用作用域元数据共享                                         | 兼容模式下为 `true`      |
| `deserializeUnknownClass` | 处理不存在或未知的类                                                   | 兼容模式下为 `true`      |
| `metaCompressor`          | 元数据压缩器                                                           | `DeflaterMetaCompressor` |

## 最佳实践

1. **演进中的 Schema 使用 COMPATIBLE 模式**：适用于类可能随版本变化的情况
2. **网络通信启用元数据共享**：减少重复序列化所需带宽
3. **结构体映射使用一致的类型 ID**：确保注册顺序相同或使用显式 ID
4. **考虑空间开销**：兼容模式会添加元数据，应结合需求权衡

## 相关主题

- [配置](configuration.md) - 所有 ForyBuilder 选项
- [跨语言序列化](basic-serialization.md#cross-language-interoperability) - 跨语言模式
- [故障排除](troubleshooting.md) - 常见 Schema 问题
