---
title: 对象复制
sidebar_position: 11
id: object-copy
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

本页介绍如何使用 `Fory#copy(Object)` 在内存中复制 Java 对象图。

`Fory.copy` 在内存中创建 Java 对象图的深拷贝，不会生成序列化输出。

## 何时使用对象复制

需要现有 Java 对象图的独立内存克隆时，请使用对象复制。

典型使用场景：

- 修改前克隆请求或响应模型
- 为乐观更新复制缓存状态
- 复制包含集合、映射、数组或嵌套 Bean 的对象图
- 克隆期间保留共享引用和循环引用

需要用于传输、存储或跨进程交换的字节时，请改用序列化。

| 操作               | `Fory.copy`        | `serialize` / `deserialize` |
| ------------------ | ------------------ | --------------------------- |
| 结果               | Java 对象图        | 二进制数据或重建的对象      |
| 主要用途           | 内存深拷贝         | 传输、持久化、互操作        |
| 引用选项           | `withRefCopy(...)` | `withRefTracking(...)`      |
| 跨语言支持         | 否                 | 是，使用跨语言模式          |
| 是否使用序列化数据 | 否                 | 是                          |

## 快速入门

对于通用对象图，请启用 `withRefCopy(true)`，以正确处理共享引用和循环：

```java
import org.apache.fory.Fory;

public class Example {
  public static void main(String[] args) {
    Fory fory = Fory.builder()
      .withXlang(false)
      .withRefCopy(true)
      .build();

    Order original = new Order();
    Order copied = fory.copy(original);
  }
}
```

`copy(null)` 返回 `null`。

## 引用语义

最重要的复制选项是 `ForyBuilder#withRefCopy(boolean)`。

### `withRefCopy(true)`

这是通用对象图的推荐设置。共享引用在复制后的对象图中仍保持共享，循环引用也能正确复制。

```java
import org.apache.fory.Fory;

public class Example {
  static final class Address {
    String city;
  }

  static final class Pair {
    Address left;
    Address right;
  }

  public static void main(String[] args) {
    Fory fory = Fory.builder()
      .withXlang(false)
      .withRefCopy(true)
      .build();

    Address address = new Address();
    address.city = "Shanghai";

    Pair pair = new Pair();
    pair.left = address;
    pair.right = address;

    Pair copied = fory.copy(pair);
    System.out.println(copied.left == copied.right); // true
  }
}
```

### `withRefCopy(false)`

仅当确定对象图呈树形且不依赖共享引用或循环引用时，才禁用复制引用跟踪。这可能更快，但重复引用会被复制为不同对象。

```java
import org.apache.fory.Fory;

public class Example {
  static final class Address {
    String city;
  }

  static final class Pair {
    Address left;
    Address right;
  }

  public static void main(String[] args) {
    Fory fory = Fory.builder()
      .withXlang(false)
      .withRefCopy(false)
      .build();

    Address address = new Address();
    Pair pair = new Pair();
    pair.left = address;
    pair.right = address;

    Pair copied = fory.copy(pair);
    System.out.println(copied.left == copied.right); // false
  }
}
```

如果禁用 `withRefCopy`，而对象图包含循环，复制可能因栈溢出而失败。

## `withRefCopy` 与 `withRefTracking`

这两个选项控制不同的操作：

- `withRefCopy(true)` 影响 `Fory.copy(...)`
- `withRefTracking(true)` 影响序列化和反序列化

启用其中一个不会自动启用另一个。如果应用既要序列化又要复制包含共享引用或循环引用的对象图，请显式配置两个选项。

```java
Fory fory = Fory.builder().withXlang(false)
  .withRefTracking(true)
  .withRefCopy(true)
  .build();
```

## 不可变值与可变值

对于不可变值，Fory 可能复用原始实例；对于可变值，则会创建新的对象图。

实际表现为：

- `String`、装箱原始类型、枚举和许多不可变 JDK 值类型可能原样返回
- 原始类型数组、字符串数组、集合、映射、Bean、日期和其他可变结构会被复制为不同对象

不要仅根据对象标识判断复制是否成功，应依据被复制值的可变性契约进行判断。

## 类注册

启用类注册时，请在复制应用类的对象图前注册这些类。

```java
import org.apache.fory.Fory;

public class Example {
  public static void main(String[] args) {
    Fory fory = Fory.builder().withXlang(false)
      .requireClassRegistration(true)
      .withRefCopy(true)
      .build();

    fory.register(Order.class);
    Order copied = fory.copy(new Order());
  }
}
```

## 线程安全复制

`ThreadSafeFory` 同样支持 `copy(...)`。

通用多线程用法如下：

```java
import org.apache.fory.Fory;
import org.apache.fory.ThreadSafeFory;

public class Example {
  public static void main(String[] args) {
    ThreadSafeFory fory = Fory.builder()
      .withXlang(false)
      .withRefCopy(true)
      .buildThreadSafeFory();

    Order copied = fory.copy(new Order());
  }
}
```

同一 API 也适用于 `buildThreadLocalFory()` 和 `buildThreadSafeForyPool(poolSize)`。

## 内置支持范围

Fory 已为许多常见 Java 平台类型提供复制支持，包括：

- 原始值和装箱原始类型
- 字符串和原始类型数组
- 常见 JDK 集合和映射
- Java 时间和日期/时间值
- Bean、record 和嵌套对象图

可变类型的自定义序列化器必须实现 `Serializer.copy(...)` 才能支持对象复制。

## 使用 `ForyCopyable` 自定义复制

如果类型需要自定义复制逻辑，请实现 `ForyCopyable<T>`。

如果应由类自身控制嵌套字段的复制方式，这是最简单的方法：

```java
import java.util.ArrayList;
import java.util.List;
import org.apache.fory.ForyCopyable;
import org.apache.fory.context.CopyContext;

public final class Node implements ForyCopyable<Node> {
  private String name;
  private final List<Node> neighbors = new ArrayList<>();

  @Override
  public Node copy(CopyContext copyContext) {
    Node copied = new Node();
    copyContext.reference(this, copied);
    copied.name = name;
    for (Node neighbor : neighbors) {
      copied.neighbors.add(copyContext.copyObject(neighbor));
    }
    return copied;
  }
}
```

使用准则：

- 如果类型可能参与循环或共享引用对象图，请在创建复合可变对象后立即调用 `copyContext.reference(origin, copy)`
- 对嵌套值使用 `copyContext.copyObject(...)`，不要手动重复嵌套复制逻辑
- 保持复制逻辑与该类型的常规 Java 语义一致

## 在序列化器中自定义复制

类型已经使用自定义序列化器时，请为可变值覆盖 `Serializer.copy(...)`。

```java
import org.apache.fory.config.Config;
import org.apache.fory.context.CopyContext;
import org.apache.fory.context.ReadContext;
import org.apache.fory.context.WriteContext;
import org.apache.fory.serializer.Serializer;

public final class EnvelopeSerializer extends Serializer<Envelope> {
  public EnvelopeSerializer(Config config) {
    super(config, Envelope.class);
  }

  @Override
  public Envelope copy(CopyContext copyContext, Envelope value) {
    Envelope copied = new Envelope();
    copyContext.reference(value, copied);
    copied.header = copyContext.copyObject(value.header);
    copied.payload = copyContext.copyObject(value.payload);
    return copied;
  }

  @Override
  public void write(WriteContext writeContext, Envelope value) {
    throw new UnsupportedOperationException("omitted");
  }

  @Override
  public Envelope read(ReadContext readContext) {
    throw new UnsupportedOperationException("omitted");
  }
}
```

当复制行为应属于序列化器而非领域类时，使用此方式。

## 最佳实践

- 复用 `Fory` 或 `ThreadSafeFory` 实例，不要为每次复制重新构建
- 除非确定对象图无环且不依赖共享引用，否则启用 `withRefCopy(true)`
- 将 `withRefCopy(false)` 视为树形数据的性能优化，而非默认设置
- 使用共享引用和循环对象图测试自定义复制实现
- 为使用自定义序列化器的每个可变类型实现 `Serializer.copy(...)`

## 故障排除

### 循环对象图发生栈溢出或复制失败

如果复制循环对象图失败，请启用 `withRefCopy(true)`：

```java
Fory fory = Fory.builder().withXlang(false)
  .withRefCopy(true)
  .build();
```

只有无环对象图才能安全禁用复制引用跟踪。

### 未保留共享引用

如果同一源对象被复制为多个不同的目标对象，说明 `withRefCopy` 已禁用。请将其启用：

```java
Fory fory = Fory.builder().withXlang(false)
  .withRefCopy(true)
  .build();
```

仅设置 `withRefTracking(true)` 不会改变 `Fory.copy(...)` 的行为。

### `Copy for ... is not supported`

这表示该类型尚未实现对象复制。

可通过以下任一方式修复：

- 在类上实现 `ForyCopyable<T>`，或
- 在已注册的序列化器中覆盖 `Serializer.copy(CopyContext, T)`

## 相关主题

- [基础序列化](basic-serialization.md) - Fory 实例创建和核心 API
- [配置](configuration.md) - 包括 `withRefCopy` 在内的构建器选项
- [自定义序列化器](custom-serializers.md) - 序列化器设计与注册
- [虚拟线程](virtual-threads.md) - 线程安全的 Fory 使用指南
