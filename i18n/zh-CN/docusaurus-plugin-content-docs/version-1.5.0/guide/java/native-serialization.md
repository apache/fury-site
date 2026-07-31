---
title: 原生序列化
sidebar_position: 3
id: native_serialization
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

Java 原生序列化是通过 `withXlang(false)` 选择的 Java 专用编码格式。当所有写入方和读取方都是 Java/JVM 进程，并且载荷应遵循 JVM 类型系统而不是可移植的 xlang 类型系统时，请使用它。对于仅面向 Java/JVM、用于替代 JDK serialization、Kryo、FST、Hessian 或 Java-only Protocol Buffers 载荷的场景，原生序列化是合适的起点。

本页中的原生序列化指 Fory 的 `xlang=false` 编码模式。它不同于 GraalVM native image 支持；后者请参阅 [GraalVM 支持](graalvm-support.md)。

当字节必须由非 Java Fory 运行时读取时，请使用默认 Java 模式 [Xlang 序列化](xlang-serialization.md)。

## 何时使用原生序列化

在以下情况下使用原生序列化：

- 载荷只由 Java/JVM 应用产生和消费。
- 对象模型使用 Java 特有类型、JDK 集合、包装类型、继承、接口或多态，并且不需要跨语言 Schema。
- 现有类依赖 JDK 序列化钩子，例如 `writeObject`、`readObject`、`writeReplace`、`readResolve`、`readObjectNoData` 或 `Externalizable`。
- 你需要通过 `Fory.copy(...)` 进行 Java 对象复制。
- 大型基本类型数组或二进制载荷应使用原生模式的带外缓冲区。
- 你正在替换 Java-only 序列化框架，并希望覆盖最广泛的 Java 对象表面。

当载荷必须由 Python、C++、Go、Rust、JavaScript/TypeScript、C#、Swift、Dart 或其他非 Java 运行时读取时，请改用 xlang 序列化。

## 创建原生运行时

```java
import org.apache.fory.Fory;

Fory fory = Fory.builder()
    .withXlang(false)
    .requireClassRegistration(true)
    .withRefTracking(true)
    .build();

byte[] bytes = fory.serialize(object);
Object decoded = fory.deserialize(bytes);
```

为每种配置创建并复用一个 `Fory` 或 `ThreadSafeFory` 实例。创建 Fory 的成本不低，因为运行时会缓存类元数据、序列化器和生成的代码。

```java
import org.apache.fory.Fory;
import org.apache.fory.ThreadSafeFory;

ThreadSafeFory fory = Fory.builder()
    .withXlang(false)
    .requireClassRegistration(true)
    .withRefTracking(true)
    .buildThreadSafeFory();

fory.register(Order.class, 100);
```

在并发序列化开始前，应在启动阶段注册类和序列化器。当类加载器、注册、安全、Schema 演进或引用跟踪设置不同时，请使用单独的运行时。

## Schema 演进

原生序列化默认使用 schema-consistent 模式。在 schema-consistent 模式下，写入方和读取方的类应具有相同 Schema。这是原生模式下最直接的路径，也是同步部署的合适默认值。

当 Java 类可能在写入方和读取方部署之间独立演进时，请启用兼容模式：

```java
Fory fory = Fory.builder()
    .withXlang(false)
    .withCompatible(true)
    .build();
```

兼容模式允许读取方在 Schema 元数据仍兼容时容忍字段的新增、删除或重排。它还会默认启用元数据共享。字段 ID、类版本检查、元信息共享以及未知类处理，请参阅 [Schema 演进](schema-evolution.md)。

## 注册与安全

类注册默认启用。对于服务边界，请保持启用并显式注册应用类：

```java
Fory fory = Fory.builder()
    .withXlang(false)
    .requireClassRegistration(true)
    .build();

fory.register(Order.class, 100);
fory.register(LineItem.class, 101);
```

显式数值 ID 可以避免注册顺序漂移。如果使用不带 ID 的 `fory.register(MyClass.class)`，每个写入方和读取方都必须按相同顺序注册类。当类型 ID 协调更困难时，也可以使用基于名称的注册：

```java
fory.register(Order.class, "com.example", "Order");
```

只有在可信环境中才应禁用类注册。如果需要动态类加载，请安装 `TypeChecker` 或 `AllowListChecker`，使反序列化能够拒绝非预期类：

```java
import org.apache.fory.Fory;
import org.apache.fory.resolver.AllowListChecker;

AllowListChecker checker = new AllowListChecker(AllowListChecker.CheckLevel.STRICT);
checker.allowClass("com.example.*");

Fory fory = Fory.builder()
    .withXlang(false)
    .requireClassRegistration(false)
    .withTypeChecker(checker)
    .withMaxDepth(100)
    .build();
```

使用 `withMaxDepth(...)` 限制不可信或外部提供载荷的对象图深度。完整安全配置请参阅 [类型注册](type-registration.md)。

## Java 对象表面

原生序列化负责 Java 特有的对象表面：

- POJO、record、枚举、基本类型数组、对象数组以及常见 JDK 集合。
- 继承、接口、多态字段、共享引用和循环对象图。
- 不需要映射到可移植 xlang 类型的 Java 包装类型和集合行为。
- 需要 Java serialization 兼容性的类所使用的 JDK 序列化钩子。
- 通过 `registerSerializer(...)` 或 `registerSerializerAndType(...)` 注册的自定义序列化器。

对于普通应用类，Fory 可以使用生成的序列化器，并避免 JDK `ObjectOutputStream` 语义。需要 JDK 序列化钩子的类可能会使用 Java serialization 兼容路径；当基于钩子的路径成本过高时，应优先为热点类使用 Fory 自定义序列化器。

## JDK 序列化钩子

Java 原生模式支持许多现有 Java 对象模型中的 JDK 序列化钩子：

- `writeObject` 和 `readObject`
- `writeReplace` 和 `readResolve`
- `readObjectNoData`
- `Externalizable`

```java
import java.io.IOException;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.io.Serializable;

public class MyClass implements Serializable {
  private void writeObject(ObjectOutputStream out) throws IOException {
    // 自定义序列化逻辑。
  }

  private void readObject(ObjectInputStream in) throws IOException {
    // 自定义反序列化逻辑。
  }

  private Object writeReplace() {
    return this;
  }

  private Object readResolve() {
    return this;
  }
}
```

Fory 原生载荷不是 JDK `ObjectOutputStream` 载荷。这些钩子会为了 Java 对象兼容性而被遵循，但新的载荷应由 Fory 写入和读取。

## 从 Java 序列化框架迁移

替换 JDK serialization、Kryo、FST、Hessian 或 Java-only Protocol Buffers 管线时：

1. 从 `.withXlang(false)` 开始，因为数据仅面向 Java。
2. 保持 `requireClassRegistration(true)`，并使用显式 ID 注册应用类。
3. 如果写入方和读取方部署会独立滚动，请使用 `.withCompatible(true)`。
4. 只有当身份或循环引用很重要时，才启用 `.withRefTracking(true)`。
5. 为那些否则会使用昂贵 JDK 序列化钩子的热点类添加自定义序列化器。
6. 尽可能将旧字节流和新字节流分开。

当应用必须读取可能是 JDK `ObjectOutputStream` 字节或 Fory 原生模式字节的数据时，`JavaSerializer.serializedByJDK` 可以在回退到 Fory 前识别 JDK 载荷：

```java
import java.io.ByteArrayInputStream;
import java.io.ObjectInputStream;
import org.apache.fory.serializer.JavaSerializer;

if (JavaSerializer.serializedByJDK(bytes)) {
  ObjectInputStream objectInputStream = new ObjectInputStream(new ByteArrayInputStream(bytes));
  return objectInputStream.readObject();
}
return fory.deserialize(bytes);
```

只在确实接受两种格式的边界使用这个桥接方式。除此之外，原生模式 Fory 载荷应由 Fory 直接写入和读取。

## 对象图与引用跟踪

启用引用跟踪时，原生模式支持共享引用和循环引用：

```java
Fory fory = Fory.builder()
    .withXlang(false)
    .withRefTracking(true)
    .build();
```

只有对于身份和循环都不是数据模型组成部分的值形对象图，才应禁用引用跟踪：

```java
Fory fory = Fory.builder()
    .withXlang(false)
    .withRefTracking(false)
    .build();
```

引用跟踪是一项语义选择。关闭它可以提升性能并减小载荷大小，但重复引用会反序列化为不同对象，并且不支持循环。

## 对象复制

Fory 可以在不物化字节数组的情况下深拷贝 Java 对象。完整复制语义、自定义复制钩子和故障排查，请参阅 [对象复制](object-copy.md)。

```java
Fory fory = Fory.builder()
    .withXlang(false)
    .withRefCopy(true)
    .build();

MyClass copy = fory.copy(original);
```

`withRefCopy(true)` 控制复制操作中的引用保留。它不同于控制序列化和反序列化的 `withRefTracking(...)`。

## 零拷贝序列化

原生模式支持将大型二进制值和基本类型数组作为带外 `BufferObject` 载荷：

```java
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;
import org.apache.fory.Fory;
import org.apache.fory.memory.MemoryBuffer;
import org.apache.fory.serializer.BufferObject;

Fory fory = Fory.builder()
    .withXlang(false)
    .build();

List<Object> value = Arrays.asList("str", new byte[1000], new int[100], new double[100]);
Collection<BufferObject> bufferObjects = new ArrayList<>();
byte[] bytes = fory.serialize(value, bufferObject -> !bufferObjects.add(bufferObject));
List<MemoryBuffer> buffers = bufferObjects.stream()
    .map(BufferObject::toBuffer)
    .collect(Collectors.toList());

Object decoded = fory.deserialize(bytes, buffers);
```

对于应以带外方式发送的缓冲区，回调返回 `false`。主字节数组仍包含根对象图，并按回调顺序引用这些缓冲区。

当传输层能够分别携带主载荷和缓冲区时，请使用这种方式。如果流会作为一个字节数组存储或发送，请省略回调，让 Fory 将缓冲区内容保留在带内。

原生序列化还支持字节数组、`MemoryBuffer`、`ByteBuffer`、`OutputStream`、`ForyInputStream` 和 `ForyReadableChannel` API。选择与你已有边界匹配的 API；当缓冲区或流已经可用时，避免再通过 `byte[]` 复制。

## 类加载器

```java
ClassLoader loader = Thread.currentThread().getContextClassLoader();

Fory fory = Fory.builder()
    .withXlang(false)
    .withClassLoader(loader)
    .build();
```

每个 `Fory` 实例都绑定到一个类加载器，因为类元数据和序列化器会被缓存。对于每个应用、插件或租户类加载器，请构建单独的运行时，而不是在已有运行时上切换加载器。

## 性能指南

- 复用 `Fory` 或 `ThreadSafeFory` 实例，不要为每个请求重新构建。
- 使用显式数值 ID 注册类，以获得紧凑的类型元数据和稳定的部署。
- 对同步部署的 Java 服务保持 schema-consistent 模式；只有在 Schema 演进需要时才启用兼容模式。
- 对于没有身份或循环的值形对象图，禁用引用跟踪。
- 当启动延迟可以接受先解释执行再序列化时，在普通 JVM 上使用异步编译：

  ```java
  Fory fory = Fory.builder()
      .withXlang(false)
      .withAsyncCompilation(true)
      .build();
  ```

- 在普通 JVM 上保持运行时代码生成启用。对于 GraalVM native image 和 Android 流程，使用静态生成的序列化器。
- 当传输层支持拆分载荷时，对大型基本类型数组或二进制字段使用零拷贝带外缓冲区。
- 当对象约定允许时，为热点类使用 Fory 自定义序列化器来替换昂贵的 JDK 序列化钩子。

## 原生与 Xlang 对比

| 需求                         | 使用原生序列化 | 使用 xlang 序列化 |
| ---------------------------- | -------------- | ----------------- |
| 仅 Java/JVM 的载荷           | 是             | 可选              |
| 非 Java 读取方或写入方       | 否             | 是                |
| 广泛的 Java 对象表面         | 是             | 仅限 xlang 类型   |
| JDK 序列化钩子               | 是             | 否                |
| Java 对象复制                | 是             | 否                |
| 跨运行时的可移植类型映射     | 否             | 是                |
| 默认兼容 Schema 演进         | 否             | 是                |
| Schema 一致的同语言性能      | 是             | 否                |

## 故障排查

### 非 Java 运行时无法读取载荷

写入方正在使用原生序列化。请使用 `.withXlang(true)` 重新构建写入方，并让类型注册与每个对等运行时保持一致。

### 反序列化期间类被拒绝

保持类注册启用，并在写入方和读取方都注册该类。如果确实需要动态类加载，请只在配合 allow-listing `TypeChecker` 时使用 `requireClassRegistration(false)`。

### 滚动部署在字段变更后失败

原生序列化默认使用 schema-consistent 模式。当写入方和读取方版本可能不同时，请使用 `.withCompatible(true)`，并为长期存在的 Schema 添加稳定字段元数据。

### 对象身份未被保留

为序列化和反序列化启用 `.withRefTracking(true)`。对于 `Fory.copy(...)`，启用 `.withRefCopy(true)`。

### 迁移后的边界同时收到 JDK 和 Fory 字节

只在混合格式边界使用 `JavaSerializer.serializedByJDK(...)`，然后将 JDK 字节路由到 `ObjectInputStream`，将 Fory 原生字节路由到 `fory.deserialize(...)`。

## 相关主题

- [基础序列化](basic-serialization.md) - 以 Xlang 优先的 Java 快速入门
- [Xlang 序列化](xlang-serialization.md) - 跨运行时 Java 载荷
- [配置](configuration.md) - Java 构建器选项
- [Schema 演进](schema-evolution.md) - 兼容模式和 schema-consistent 模式
- [类型注册](type-registration.md) - 注册和安全
- [对象复制](object-copy.md) - 深拷贝语义
- [自定义序列化器](custom-serializers.md) - 自定义 Java 序列化器
- [静态生成序列化器](static-generated-serializers.md) - 构建时生成的序列化器
- [GraalVM 支持](graalvm-support.md) - Native-image 平台支持
