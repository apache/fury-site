---
title: Java 对象序列化
sidebar_position: 0
id: index
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

Apache Fory Java 提供高性能二进制对象序列化。与其他受支持运行时共享的载荷使用跨语言模式，仅供 Java/JVM 使用的对象图则使用原生模式。

本运行时指南仅介绍二进制对象序列化。其他 Java 能力参见 [Row Format](../../row-format/java.md)、[Fory JSON](../../json/index.md)、[Fory IDL 与编译器](../../compiler/index.md)或 [Fory gRPC](../../grpc/java.md)。

## 二进制对象序列化

### 功能特性 {#features}

- **生成的编解码器**：JIT 生成的序列化器减少热点路径上的虚调用、分支和元数据查找。
- **原生与跨语言模式**：可选择 Java 原生对象语义，或与其他 Fory 实现共享的可移植编码格式。
- **紧凑编码**：变长整数、元数据共享、字符串压缩和可选的数字数组压缩可减小载荷体积。
- **对象图语义**：保留共享引用、循环引用、多态、Schema 演进和深拷贝对象标识。

### 原生模式功能

- **替代现有框架**：在仅限 Java 的系统中替代 JDK 序列化、Kryo、FST、Hessian 或仅限 Java 的 Protocol Buffers 载荷。
- **JDK 语义**：原生模式支持 JDK 自定义序列化行为和 `Externalizable`。
- **安全控制**：通过类注册、类型检查、深度限制和可配置的反序列化策略保护解码边界。

### 安装

添加 `fory-core` 以使用二进制对象序列化。同一应用中的所有 Fory 模块应保持相同版本。

Fory core 支持 Java 8 及更高版本。Java Record 序列化需要 Java 17 或更高版本。

#### Maven

```xml
<!-- Binary object serialization -->
<dependency>
  <groupId>org.apache.fory</groupId>
  <artifactId>fory-core</artifactId>
  <version>1.6.1</version>
</dependency>
```

#### Gradle

```kotlin
// Binary object serialization
implementation("org.apache.fory:fory-core:1.6.1")
```

#### JDK 25 及更高版本

在 JDK 25 及更高版本上，需要向 Fory 开放 `java.lang.invoke`。Fory 位于 classpath 时使用 `ALL-UNNAMED`：

```bash
--add-opens=java.base/java.lang.invoke=ALL-UNNAMED
```

Fory 位于模块路径时，使用 Fory core 模块名：

```bash
--add-opens=java.base/java.lang.invoke=org.apache.fory.core
```

### 快速入门

请注意，创建 Fory 的开销较大，**应在多次序列化之间复用 Fory 实例**，而不是每次重新创建。应将 Fory 保存为静态全局变量，或某个单例对象、少量对象的实例变量。

#### 单线程用法

```java
import java.util.List;
import java.util.Arrays;

import org.apache.fory.*;
import org.apache.fory.config.*;

public class Example {
  public static void main(String[] args) {
    SomeClass object = new SomeClass();
    // Note that Fory instances should be reused between
    // multiple serializations of different objects.
    Fory fory = Fory.builder()
      .withXlang(true)
      .requireClassRegistration(true)
      .build();
    // Registering types can reduce class name serialization overhead, but not mandatory.
    // If class registration enabled, all custom types must be registered.
    // Registration order must be consistent if id is not specified
    fory.register(SomeClass.class);
    byte[] bytes = fory.serialize(object);
    System.out.println(fory.deserialize(bytes));
  }
}
```

#### 多线程用法

```java
import org.apache.fory.*;
import org.apache.fory.config.*;

public class Example {
  public static void main(String[] args) {
    SomeClass object = new SomeClass();
    ThreadSafeFory fory = Fory.builder()
      .withXlang(true)
      .buildThreadSafeFory();
    fory.register(SomeClass.class, 1);
    byte[] bytes = fory.serialize(object);
    System.out.println(fory.deserialize(bytes));
  }
}
```

#### Fory 实例复用模式

```java
import org.apache.fory.*;
import org.apache.fory.config.*;

public class Example {
  private static final ThreadSafeFory fory = Fory.builder()
    .withXlang(true)
    .buildThreadSafeFory();

  static {
    fory.register(SomeClass.class, 1);
  }

  public static void main(String[] args) {
    SomeClass object = new SomeClass();
    byte[] bytes = fory.serialize(object);
    System.out.println(fory.deserialize(bytes));
  }
}
```

### 跨语言模式与原生模式

跨语言载荷以及与非 Java 实现共享的 Schema 应使用跨语言模式。它是 Java 默认的编码模式；使用该模式的 Java 示例会显式设置 `.withXlang(true)`，以清楚表达模式选择。

仅限 Java 的流量应使用原生模式。通过 `.withXlang(false)` 选择原生模式；该模式负责 JDK 序列化钩子、`Externalizable`、动态对象图、对象复制和 Java 原生模式零拷贝缓冲区等 Java 专用对象行为。它针对 JVM 类型系统优化，支持比跨语言模式更广泛的 Java 对象。兼容模式默认启用。仅当每个读取端和写入端都使用相同的类 Schema，且希望获得更快速度和更小体积时，才设置 `.withCompatible(false)`。如果要替换 JDK 序列化、Kryo、FST、Hessian 或仅限 Java 的 Protocol Buffers 载荷，请从原生模式开始。

仅限 Java 的序列化详情参见[原生序列化](native.md)，Java 跨语言注册与互操作规则参见[跨语言序列化](basic-serialization.md#cross-language-interoperability)。

### 线程安全

Fory 提供两种线程安全的 Fory 实例形式：

#### `buildThreadSafeFory`

这是默认选择。它使用固定大小的共享 `ThreadPoolFory`，池大小为 `4 * availableProcessors()`，也是虚拟线程工作负载的首选实例形式：

```java
ThreadSafeFory fory = Fory.builder()
  .withXlang(true)
  .withRefTracking(false)
  .withAsyncCompilation(true)
  .buildThreadSafeFory();
```

更多详情参见[虚拟线程](virtual-threads.md)。

#### ThreadLocalFory

仅当使用 `buildThreadLocalFory()` 明确要求每个长期运行的平台线程拥有一个 `Fory` 实例，或希望无论 JDK 版本如何都固定采用该选择时，才使用此方式：

```java
ThreadSafeFory fory = Fory.builder()
  .withXlang(true)
  .buildThreadLocalFory();
fory.register(SomeClass.class, 1);
byte[] bytes = fory.serialize(object);
System.out.println(fory.deserialize(bytes));
```

#### `buildThreadSafeForyPool`

如需显式设置固定共享池大小，请使用 `buildThreadSafeForyPool(poolSize)`。它会预先创建 `poolSize` 个 `Fory` 实例，将其保存在共享固定槽位中，并允许任意调用者通过与线程无关的快速路径借用实例。只有池中所有实例均被占用时调用才会阻塞；该池不会按线程标识缓存实例：

```java
ThreadSafeFory fory = Fory.builder()
  .withXlang(true)
  .withRefTracking(false)
  .withAsyncCompilation(true)
  .buildThreadSafeForyPool(poolSize);
```

#### 构建器方法

```java
// Single-thread Fory
Fory fory = Fory.builder()
  .withXlang(true)
  .withRefTracking(false)
  .withAsyncCompilation(true)
  .build();

// Thread-safe Fory (thread-safe Fory backed by a pool of Fory instances)
ThreadSafeFory fory = Fory.builder()
  .withXlang(true)
  .withRefTracking(false)
  .withAsyncCompilation(true)
  .buildThreadSafeFory();

// Explicit thread-local Fory instance
ThreadSafeFory threadLocalFory = Fory.builder()
  .withXlang(true)
  .buildThreadLocalFory();
```

## 平台支持

- [Android](android.md) 介绍 Fory Core、静态生成的序列化器、Kotlin 集成、R8、`ByteBuffer` 以及 Android 对象模型限制。
- [GraalVM 原生镜像](graalvm.md)介绍构建时序列化器生成、注册、初始化、代理、框架集成和诊断。

Fory JSON 具有独立的 [Android](../../json/android.md) 和 [GraalVM 原生镜像](../../json/graalvm.md)部署指南，因为其生成代码和模型发现工作流与 Fory Core 不同。

## 文档导航

| 分组          | 页面                                                                                                                                                                                                                  |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 序列化模式    | [基础序列化](basic-serialization.md)、[原生序列化](native.md)                                                                                                                                                                    |
| 通用          | [配置](configuration.md)、[类型注册](type-registration.md)、[Schema 演进](schema-evolution.md)、[Schema 元数据](schema-metadata.md)、[自定义序列化器](custom-serializers.md)                                          |
| Java 专用功能 | [高级功能](advanced-features.md)、[压缩](compression.md)、[对象复制](object-copy.md)、[JDK 自定义序列化](jdk-serialization.md)、[静态生成的序列化器](static-generated-serializers.md)、[虚拟线程](virtual-threads.md) |
| 平台与运维    | [Android](android.md)、[GraalVM 原生镜像](graalvm.md)、[故障排除](troubleshooting.md)                                                                                                                                 |

解码外部提供的二进制载荷前，请阅读 [Java 安全](security.md)。
