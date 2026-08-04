---
title: Java 原生序列化
sidebar_position: 2
id: native
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

Java 原生序列化是通过 `withXlang(false)` 选择的仅限 Java 编码格式。当所有写入端和读取端都是 Java/JVM 进程，并且载荷应遵循 JVM 类型系统而非可移植的跨语言类型系统时，请使用该模式。对于仅限 Java/JVM、用于替代 JDK 序列化、Kryo、FST、Hessian 或仅限 Java 的 Protocol Buffers 载荷的场景，原生序列化是合适的起点。

本页所称原生序列化是指 Fory 的 `xlang=false` 编码模式，与 GraalVM 原生镜像支持不同；后者参见 [GraalVM 原生镜像](graalvm.md)。

如果字节需要由非 Java Fory 实现读取，请使用 Java 默认的[跨语言序列化](core-api.md#cross-language-interoperability)模式。

## 何时使用原生序列化

以下情况使用原生序列化：

- 载荷仅由 Java/JVM 应用生成和使用。
- 对象模型使用 Java 专用类型、JDK 集合、包装类型、继承、接口或多态，并且不需要跨语言 Schema。
- 现有类依赖 `writeObject`、`readObject`、
  `writeReplace`、`readResolve`、`readObjectNoData` 或 `Externalizable`。
- 需要通过 `Fory.copy(...)` 复制 Java 对象。
- 大型原始类型数组或二进制载荷应使用原生模式带外缓冲区。
- 正在替代仅限 Java 的序列化框架，并希望支持最广泛的 Java 对象。

如果载荷必须由 Python、C++、Go、Rust、JavaScript/TypeScript、C#、Swift、Dart、Scala、Kotlin 或其他非 Java 实现读取，请改用跨语言序列化。

## 创建原生模式 Fory 实例

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

为每种配置创建并复用一个 `Fory` 或 `ThreadSafeFory` 实例。Fory 会缓存类元数据、序列化器和生成代码，因此创建实例的开销不低。

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

在启动期间、并发序列化开始前注册类和序列化器。类加载器、注册、安全、Schema 演进或引用跟踪设置不同时，应使用独立的 Fory 实例。

## Schema 演进

原生序列化默认使用兼容模式，因此只要 Schema 元数据保持兼容，读取端就能容忍滚动发布期间的 Schema 变化：

```java
Fory fory = Fory.builder()
    .withXlang(false)
    .build();
```

兼容模式允许读取端在 Schema 元数据保持兼容时容忍字段新增、删除或重排，并且默认启用元数据共享。字段 ID、类版本检查、元数据共享和未知类处理参见 [Schema 演进](schema-evolution.md)。

仅当每个读取端和写入端始终使用相同的类 Schema 时，才设置 `.withCompatible(false)` 以获得更快速度和更小体积。

## 注册与安全

类注册默认启用。在服务边界保持启用，并显式注册应用类：

```java
Fory fory = Fory.builder()
    .withXlang(false)
    .requireClassRegistration(true)
    .build();

fory.register(Order.class, 100);
fory.register(LineItem.class, 101);
```

显式数字 ID 可以避免注册顺序漂移。如果使用不带 ID 的 `fory.register(MyClass.class)`，每个写入端和读取端都必须按相同顺序注册类。类型 ID 难以协调时，也可按名称注册：

```java
fory.register(Order.class, "com.example", "Order");
```

仅在可信环境中禁用类注册。如果需要动态类加载，请安装 `TypeChecker` 或 `AllowListChecker`，让反序列化能够拒绝意外类：

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

对不可信或外部提供的载荷使用 `withMaxDepth(...)` 限制对象图深度。完整安全配置参见[类型注册](type-registration.md)。

## Java 对象支持范围

原生序列化负责以下 Java 专用对象能力：

- POJO、record、枚举、原始类型数组、对象数组和常见 JDK 集合。
- 继承、接口、多态字段、共享引用和循环对象图。
- 无需映射为可移植跨语言类型的 Java 包装器和集合行为。
- 需要 Java 序列化兼容性的类所使用的 JDK 序列化钩子。
- 通过 `registerSerializer(...)` 或 `registerSerializerAndType(...)` 注册的自定义序列化器。

对于普通应用类，Fory 可以使用生成的序列化器并避免 JDK `ObjectOutputStream` 语义。需要 JDK 序列化钩子的类可以使用 Java 序列化兼容路径；如果基于钩子的路径开销过大，热点类应优先使用 Fory 自定义序列化器。

## JDK 自定义序列化

依赖 JDK 序列化钩子的类参见专门的 [JDK 自定义序列化](jdk-serialization.md)指南。Fory 在原生模式下遵循这些对象钩子，但 Fory 字节不是 `ObjectOutputStream` 字节。

## 对象图与引用跟踪

启用引用跟踪时，原生模式支持共享引用和循环引用：

```java
Fory fory = Fory.builder()
    .withXlang(false)
    .withRefTracking(true)
    .build();
```

仅对对象标识和循环不属于数据模型的值形对象图禁用引用跟踪：

```java
Fory fory = Fory.builder()
    .withXlang(false)
    .withRefTracking(false)
    .build();
```

引用跟踪是一项语义选择。关闭它可以提升性能并减小载荷体积，但重复引用会反序列化为不同对象，而且不支持循环。

## 对象复制

Fory 可以在不实例化字节数组的情况下深拷贝 Java 对象。完整复制语义、自定义复制钩子和故障排除参见[对象复制](object-copy.md)。

```java
Fory fory = Fory.builder()
    .withXlang(false)
    .withRefCopy(true)
    .build();

MyClass copy = fory.copy(original);
```

`withRefCopy(true)` 控制复制操作的引用保留，与控制序列化和反序列化的 `withRefTracking(...)` 相互独立。

## 零拷贝序列化

原生模式支持将大型二进制值和原始类型数组作为带外 `BufferObject` 载荷：

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

对于应带外发送的缓冲区，回调返回 `false`。主字节数组仍包含根对象图，并按回调顺序引用这些缓冲区。

当传输层可以分别承载主载荷和缓冲区时使用此方式。如果流作为单个字节数组存储或发送，请省略回调，让 Fory 将缓冲区内容保留在带内。

原生序列化还支持字节数组、`MemoryBuffer`、`ByteBuffer`、`OutputStream`、`ForyInputStream` 和 `ForyReadableChannel` API。请选择与现有边界匹配的 API；已有缓冲区或流时，应避免通过 `byte[]` 复制。

## 类加载器

```java
ClassLoader loader = Thread.currentThread().getContextClassLoader();

Fory fory = Fory.builder()
    .withXlang(false)
    .withClassLoader(loader)
    .build();
```

由于类元数据和序列化器会被缓存，每个 `Fory` 实例都绑定到一个类加载器。应为每个应用、插件或租户类加载器构建独立 Fory 实例，不要在现有实例上切换加载器。

## 性能指南

- 复用 `Fory` 或 `ThreadSafeFory` 实例，不要为每个请求重新构建。
- 使用显式数字 ID 注册类，以获得紧凑的类型元数据和稳定的部署。
- 仅当每个读取端和写入端始终使用相同的类 Schema，并且应用希望获得更快速度和更小体积时，才使用 `.withCompatible(false)`。
- 对不包含对象标识或循环的值形对象图禁用引用跟踪。
- 普通 JVM 的启动延迟可以容忍先使用解释器序列化时，可使用异步编译：

  ```java
  Fory fory = Fory.builder()
      .withXlang(false)
      .withAsyncCompilation(true)
      .build();
  ```

- 在普通 JVM 上保持运行时代码生成启用。GraalVM 原生镜像和 Android 流程使用静态生成的序列化器。
- 传输层支持拆分载荷时，为大型原始类型数组或二进制字段使用零拷贝带外缓冲区。
- 对象契约允许时，为热点类使用 Fory 自定义序列化器替代昂贵的 JDK 序列化钩子。

## 原生模式与跨语言模式对比

| 需求                   | 使用原生序列化 | 使用跨语言序列化 |
| ---------------------- | -------------- | ---------------- |
| 仅限 Java/JVM 的载荷   | 是             | 可选             |
| 非 Java 读取端或写入端 | 否             | 是               |
| 广泛的 Java 对象支持   | 是             | 仅限跨语言类型   |
| JDK 序列化钩子         | 是             | 否               |
| Java 对象复制          | 是             | 否               |
| 跨语言可移植类型映射   | 否             | 是               |
| 默认兼容 Schema 演进   | 是             | 是               |
| 相同 Schema 性能优化   | 是             | 否               |

## 故障排除

### 非 Java 实现无法读取载荷

写入端正在使用原生序列化。请使用 `.withXlang(true)` 重新构建写入端，并与每个对等端对齐类型注册。

### 反序列化期间类被拒绝

保持类注册启用，并在写入端和读取端都注册该类。如果确实需要动态类加载，仅在使用 `requireClassRegistration(false)` 的同时配置允许列表 `TypeChecker`。

### 字段变更后滚动发布失败

原生序列化默认使用兼容模式。写入端和读取端版本可能不同时，请保留该默认设置，并为长期使用的 Schema 添加稳定字段元数据。

### 未保留对象标识

为序列化和反序列化启用 `.withRefTracking(true)`；对于 `Fory.copy(...)`，启用 `.withRefCopy(true)`。

### 迁移边界同时接收 JDK 和 Fory 字节

仅在混合格式边界使用 `JavaSerializer.serializedByJDK(...)`，随后将 JDK 字节交给 `ObjectInputStream`，将 Fory 原生字节交给 `fory.deserialize(...)`。

## 相关主题

- [基础序列化](core-api.md) - 跨语言优先的 Java 快速入门
- [跨语言序列化](core-api.md#cross-language-interoperability) - 跨语言 Java 载荷
- [配置](configuration.md) - Java 构建器选项
- [Schema 演进](schema-evolution.md) - 兼容模式与相同 Schema 优化
- [类型注册](type-registration.md) - 注册与安全
- [对象复制](object-copy.md) - 深拷贝语义
- [自定义序列化器](custom-serializers.md) - 自定义 Java 序列化器
- [静态生成的序列化器](static-generated-serializers.md) - 构建时生成的序列化器
- [GraalVM 原生镜像](graalvm.md) - 原生镜像平台支持
