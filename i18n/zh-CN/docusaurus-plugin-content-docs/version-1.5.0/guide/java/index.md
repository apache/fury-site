---
title: Java 序列化指南
sidebar_position: 0
id: serialization_index
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

Apache Fory™ Java 提供高性能二进制对象序列化、支持跨语言随机访问的行格式，
以及面向 Java 的 JSON 序列化。二进制序列化支持两种模式：xlang 模式用于跨语言载荷，
native 模式用于仅包含 Java 对象的对象图。[Fory JSON](json-support.md) 是面向 Java
应用的高性能 JSON 序列化框架。

## 选择格式

| 格式 | 适用场景 | 依赖 | 入门文档 |
| --- | --- | --- | --- |
| **二进制对象序列化** | 需要在 Java native 模式或多种受支持语言之间序列化紧凑的对象图 | `org.apache.fory:fory-core` | [基础序列化](basic-serialization.md) |
| **行格式** | 需要零拷贝随机访问、部分读取或与 Arrow 集成 | `org.apache.fory:fory-format` | [行格式](row-format.md) |
| **Fory JSON** | Java 应用需要高吞吐量的标准 JSON | `org.apache.fory:fory-json` | [JSON 支持](json-support.md) |

## 二进制对象序列化

### 特性

- **生成的编解码器**：通过 JIT 生成的序列化器减少热路径上的虚方法分派、条件分支和元数据查找。
- **Native 与 Xlang 模式**：可选择 Java 原生对象语义，也可使用与其他 Fory 实现共享的可移植编码格式。
- **紧凑编码**：通过变长整数、元数据共享、字符串压缩以及可选的数值数组压缩来减小载荷。
- **对象图语义**：保留共享引用和循环引用、多态、Schema 演进以及深拷贝中的对象身份。

### Native 模式特性

- **替代现有框架**：在仅使用 Java 的系统中，可替代 JDK 序列化、Kryo、FST、Hessian，
  或仅由 Java 使用的 Protocol Buffers 载荷。
- **JDK 语义**：在 native 模式下支持 JDK 自定义序列化行为和 `Externalizable`。
- **安全控制**：类注册、类型检查、深度限制和可配置的反序列化策略可保护解码边界。

### 安装

使用 `fory-core` 进行二进制对象序列化。同一应用内的所有 Fory 模块应保持相同版本。

#### Maven

```xml
<!-- Binary object serialization -->
<dependency>
  <groupId>org.apache.fory</groupId>
  <artifactId>fory-core</artifactId>
  <version>1.5.0</version>
</dependency>
```

#### Gradle

```kotlin
// Binary object serialization
implementation("org.apache.fory:fory-core:1.5.0")
```

#### JDK 25 及更高版本

在 JDK 25 及更高版本中，需要向 Fory 开放 `java.lang.invoke`。通过 classpath 使用 Fory 时，
请使用 `ALL-UNNAMED`：

```bash
--add-opens=java.base/java.lang.invoke=ALL-UNNAMED
```

通过 module path 使用 Fory 时，请使用 Fory core 的模块名：

```bash
--add-opens=java.base/java.lang.invoke=org.apache.fory.core
```

### 快速开始

请注意，创建 Fory 的开销不低，**应在多次序列化之间复用 Fory 实例**，而不是每次都重新创建。
可以将 Fory 保存为静态全局变量，也可以作为单例对象或少量对象的实例变量。

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

### Xlang 模式与 Native 模式

xlang 模式适用于跨语言载荷，以及与非 Java 实现共享的 schema。它是 Java 默认的跨语言编码模式；
使用该模式的 Java 示例会显式设置 `.withXlang(true)`，以便清楚展示所选模式。

native 模式适用于仅包含 Java 的数据交换。通过 `.withXlang(false)` 选择 native 模式。
该模式负责处理 JDK 序列化钩子、`Externalizable`、动态对象图、对象拷贝和 Java native
模式零拷贝缓冲区等 Java 特有的对象行为。它针对 JVM 类型系统进行了优化，支持的 Java
对象范围也比 xlang 模式更广。兼容模式默认开启。仅当所有读写端都使用相同的类 schema，
并且希望获得更快的序列化速度和更小的体积时，才设置 `.withCompatible(false)`。
如果需要替代 JDK 序列化、Kryo、FST、Hessian，或仅由 Java 使用的 Protocol Buffers 载荷，
建议从 native 模式开始。

Java 专用序列化的详细信息请参阅 [Native 序列化](native-serialization.md)，Java xlang
注册与互操作规则请参阅 [Xlang 序列化](xlang-serialization.md)。

### 线程安全

Fory 提供以下几种线程安全的实例形式：

#### `buildThreadSafeFory`

这是默认选择。它使用固定大小的共享 `ThreadPoolFory`，默认大小为
`4 * availableProcessors()`，也是虚拟线程工作负载的首选实例形式：

```java
ThreadSafeFory fory = Fory.builder()
  .withXlang(true)
  .withRefTracking(false)
  .withAsyncCompilation(true)
  .buildThreadSafeFory();
```

更多信息请参阅[虚拟线程](virtual-threads.md)。

#### ThreadLocalFory

仅当明确希望每个长期运行的平台线程分别拥有一个 `Fory` 实例，或无论 JDK 版本如何都希望
固定使用这种方式时，才应使用 `buildThreadLocalFory()`：

```java
ThreadSafeFory fory = Fory.builder()
  .withXlang(true)
  .buildThreadLocalFory();
fory.register(SomeClass.class, 1);
byte[] bytes = fory.serialize(object);
System.out.println(fory.deserialize(bytes));
```

#### `buildThreadSafeForyPool`

希望显式设置固定共享池大小时，请使用 `buildThreadSafeForyPool(poolSize)`。它会预先创建
`poolSize` 个 `Fory` 实例，将其保存在固定的共享槽位中，并允许任意调用方通过与线程无关的
快速路径借用实例。只有池中所有实例都在使用时，调用才会阻塞；该池不会以线程身份为键缓存实例：

```java
ThreadSafeFory fory = Fory.builder()
  .withXlang(true)
  .withRefTracking(false)
  .withAsyncCompilation(true)
  .buildThreadSafeForyPool(poolSize);
```

#### Builder 方法

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

## 行格式

Fory 行格式是一种独立、缓存友好的二进制格式，适用于随机访问、部分读取和分析工作负载。

### 特性

- **零拷贝随机访问**：无需重建完整对象即可读取字段和嵌套值。
- **部分读取**：仅解码分析或查询路径所需的数据。
- **Apache Arrow 集成**：在 Fory 行数据与 Arrow 数据之间转换，用于列式处理。

### 安装

#### Maven

```xml
<dependency>
  <groupId>org.apache.fory</groupId>
  <artifactId>fory-format</artifactId>
  <version>1.5.0</version>
</dependency>
```

#### Gradle

```kotlin
implementation("org.apache.fory:fory-format:1.5.0")
```

有关编码、类型化字段访问、部分反序列化、嵌套值和 Arrow 集成，请参阅[行格式](row-format.md)。

## Fory JSON

Fory JSON 是面向 Java 的线程安全 JSON 序列化框架，并针对 JSON 编码、解码和 Java
对象映射的各个环节进行了充分优化，以获得尽可能高的性能。

### 特性

- **出色性能**：经过优化的 reader、writer，以及解释执行和运行时生成的编解码器，
  可保持高效的 JSON 编码与解码。
- **Java 对象映射**：支持普通对象、Java 17 record、基于 creator 构造的不可变类、
  常用 JDK 类型、泛型容器、自定义编解码器，以及通过注解声明的多态类型。

### 安装

`fory-json` 会传递依赖 `fory-core`。如果应用中的其他依赖也引入了 `fory-core`，
请确保两个模块使用相同版本。

#### Maven

```xml
<dependency>
  <groupId>org.apache.fory</groupId>
  <artifactId>fory-json</artifactId>
  <version>1.5.0</version>
</dependency>
```

#### Gradle

```kotlin
implementation("org.apache.fory:fory-json:1.5.0")
```

在 JDK 25 及更高版本中，请使用二进制序列化安装章节所述的相同 `java.lang.invoke`
模块开放选项。

### 快速开始

`ForyJson` 构建完成后不可变且线程安全。应在线程之间复用同一个实例：

```java
import org.apache.fory.json.ForyJson;

public final class JsonExample {
  private static final ForyJson JSON = ForyJson.builder().build();

  public static final class User {
    public long id;
    public String name;

    public User() {}

    public User(long id, String name) {
      this.id = id;
      this.name = name;
    }
  }

  public static void main(String[] args) {
    User input = new User(7, "Alice");

    String text = JSON.toJson(input);
    User fromText = JSON.fromJson(text, User.class);

    byte[] utf8 = JSON.toJsonBytes(input);
    User fromUtf8 = JSON.fromJson(utf8, User.class);

    System.out.println(fromText.name + " / " + fromUtf8.name);
  }
}
```

有关支持的类型、注解、自定义编解码器、安全控制和平台配置，请参阅完整的
[JSON 支持文档](json-support.md)。

## 平台支持

- `fory-core` 和 `fory-json` 支持 Java 8 及更高版本；Java record 需要 Java 17 或更高版本。
- `fory-format` 面向 Java 11 及更高版本，不支持 Android。
- `fory-core` 和 `fory-json` 可运行于标准 JDK、GraalVM native image，
  以及 Android API level 26 及更高版本。

## 后续步骤

- [配置](configuration.md) - 了解 ForyBuilder 选项
- [Schema 元数据](schema-metadata.md) - `@ForyField`、`@Ignore`、整数编码注解、`serializeEnumByName` 和 `@ForyEnumId`
- [基础序列化](basic-serialization.md) - 了解详细的序列化模式
- [对象拷贝](object-copy.md) - 在内存中深拷贝 Java 对象图
- [压缩](compression.md) - 了解整数、long 和数组压缩选项
- [虚拟线程](virtual-threads.md) - 了解虚拟线程用法和池大小设置建议
- [gRPC 支持](grpc-support.md) - 通过 grpc-java 传输 Fory 载荷
- [类型注册](type-registration.md) - 了解类注册和安全性
- [自定义序列化器](custom-serializers.md) - 实现自定义序列化器
- [Xlang 序列化](xlang-serialization.md) - 为其他语言序列化数据
- [Native 序列化](native-serialization.md) - 了解 Java 专用序列化特性
- [JSON 支持](json-support.md) - 完整的 Fory JSON 使用指南
- [静态生成的序列化器](static-generated-serializers.md) - 通过注解处理器为 `@ForyStruct` 静态生成序列化器
- [GraalVM 支持](graalvm-support.md) - 二进制序列化和 JSON 的 Native Image 支持
