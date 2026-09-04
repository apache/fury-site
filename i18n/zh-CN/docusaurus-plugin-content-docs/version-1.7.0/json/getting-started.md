---
title: 快速开始
sidebar_position: 2
id: getting-started
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

## 要求与安装

Fory JSON 在标准 JDK、GraalVM Native Image 和 Android 上支持 Java 8 及更高版本。
Java record 需要 Java 17 或更高版本。

已发布的 Fory JSON 制品可从 Maven Central 获取，开发快照可从 Apache 快照仓库获取。以下仓库声明同时支持两者。所有 Fory 模块应使用依赖坐标中显示的同一版本。

Maven:

```xml
<repositories>
  <repository>
    <id>apache-snapshots</id>
    <url>https://repository.apache.org/snapshots/</url>
    <releases><enabled>false</enabled></releases>
    <snapshots><enabled>true</enabled></snapshots>
  </repository>
</repositories>

<dependency>
  <groupId>org.apache.fory</groupId>
  <artifactId>fory-json</artifactId>
  <version>1.7.1</version>
</dependency>
```

Gradle:

```kotlin
repositories {
  maven("https://repository.apache.org/snapshots/") {
    mavenContent { snapshotsOnly() }
  }
  mavenCentral()
}

implementation("org.apache.fory:fory-json:1.7.1")
```

### Kotlin

Kotlin/JVM 应用添加可选的 Kotlin JSON 运行时，并使用其统一 builder 入口：

```kotlin title="build.gradle.kts"
dependencies {
  implementation("org.apache.fory:fory-json-kotlin:1.7.1")
}
```

```kotlin
import org.apache.fory.json.kotlin.ForyJsonKotlin
import org.apache.fory.json.kotlin.jsonTypeRef

data class User(val id: Long, val name: String)

val json = ForyJsonKotlin.builder().build()
val userType = jsonTypeRef<User>()
val text = json.toJson(User(7, "Alice"), userType)
val decoded = json.fromJson(text, userType)
```

Kotlin 模块不需要 `kotlin-reflect`。在 Android 上，启用 R8 或 ProGuard 时，或 Kotlin 源码中的 Mixin 为 Java sealed 目标添加推导式 `JsonSubTypes` 时，请添加 `fory-json-kotlin-ksp`。后一种情况还需要 `fory-annotation-processor` 和 JDK 17 或更新版本。GraalVM Native Image 使用常规 `@ForyJsonProvider` 流程。完整设置和 Kotlin 类型行为见 [Kotlin JSON 指南](kotlin.md)。

### JDK 25 及更高版本

在 JDK 25 及更高版本中，需要向 Fory core 开放 `java.lang.invoke`。对于 classpath 应用：

```bash
--add-opens=java.base/java.lang.invoke=ALL-UNNAMED
```

对于 module-path 应用：

```bash
--add-opens=java.base/java.lang.invoke=org.apache.fory.core
```

Fory JSON 的 Java Platform Module System（JPMS）模块名为 `org.apache.fory.json`，Kotlin 集成模块名为 `org.apache.fory.json.kotlin`。

## 快速上手

创建一个 `ForyJson` 实例并重复使用。该实例线程安全，无需关闭。

```java
import java.nio.charset.StandardCharsets;
import org.apache.fory.json.ForyJson;

public final class JsonExample {
  private static final ForyJson JSON = ForyJson.builder().build();

  public static final class User {
    public long id;
    public String name;

    public User() {}

    User(long id, String name) {
      this.id = id;
      this.name = name;
    }
  }

  public static void main(String[] args) {
    User input = new User(7, "Alice");

    String text = JSON.toJson(input);
    byte[] utf8 = JSON.toJsonBytes(input);

    User fromText = JSON.fromJson(text, User.class);
    User fromUtf8 = JSON.fromJson(utf8, User.class);

    System.out.println(text);
    System.out.println(new String(utf8, StandardCharsets.UTF_8));
    System.out.println(fromText.name + " / " + fromUtf8.name);
  }
}
```

未知输入属性默认会被跳过，除非由启用读取的 Any 字段或 any-setter 接收。
对象中的 null 属性默认省略。默认 JSON 属性发现顺序不属于兼容性契约；如果必须明确输出属性顺序，
请使用 `JsonPropertyOrder` 或 `JsonProperty.index`。

## 读写 API

Fory JSON 支持 String 输入/输出、UTF-8 字节输入/输出，以及通过 `ByteBuffer` 分块提供的增量 UTF-8 输入。目前不提供阻塞式 `InputStream` 解析 API。

| 操作 | 运行时类型 | 声明的 `Class` | 声明的 `TypeRef` |
| -------------------- | ------------------------- | ---------------------------- | ------------------------------ |
| String 输出 | `toJson(value)` | `toJson(value, type)` | `toJson(value, typeRef)` |
| UTF-8 字节 | `toJsonBytes(value)` | `toJsonBytes(value, type)` | `toJsonBytes(value, typeRef)` |
| UTF-8 `OutputStream` | `writeJsonTo(value, out)` | `writeJsonTo(value, type, out)` | `writeJsonTo(value, typeRef, out)` |
| String 输入 | - | `fromJson(text, type)` | `fromJson(text, typeRef)` |
| UTF-8 输入 | - | `fromJson(bytes, type)` | `fromJson(bytes, typeRef)` |
| UTF-8 字节范围 | - | `fromJson(bytes, offset, length, type)` | `fromJson(bytes, offset, length, typeRef)` |

每次 `fromJson` 调用恰好消费一个 JSON 值，并拒绝其后的非空白内容。字节范围重载只解析指定范围，忽略范围之前和之后的字节。返回的 String 和字节数组与内部可复用缓冲区相互独立。

`writeJsonTo` 会缓冲完整的 UTF-8 文档，只执行一次 `OutputStream.write`，既不 flush 也不关闭
调用方拥有的流。它是便捷输出 API，并非增量式 JSON 流式写入。I/O 失败会包装为 `ForyJsonException`。

### 增量 JSON 流 {#incremental-json-streams}

`JsonStreamDecoder` 可增量解码一个顶层 JSON 数组中的元素，或换行分隔的 JSON（NDJSON）记录。输入可以是任意边界的 UTF-8 `ByteBuffer` 分块；提供下一个分块之前，必须消费完当前分块：

```java
import java.nio.ByteBuffer;
import org.apache.fory.json.ForyJson;
import org.apache.fory.json.JsonStreamDecoder;

ForyJson json = ForyJson.builder().build();
JsonStreamDecoder<User> decoder =
    json.newArrayStreamDecoder(User.class, 64 * 1024 * 1024);

for (ByteBuffer chunk : chunks) {
  while (decoder.decodeNext(chunk)) {
    User user = decoder.value();
    consume(user);
  }
}
decoder.finish();
```

对于以 LF 或 CRLF 分隔的记录，使用 `newNdjsonStreamDecoder`。最后一条 NDJSON 记录可以没有行结束符；`finish()` 解码出该记录时返回 `true`：

```java
JsonStreamDecoder<User> decoder =
    json.newNdjsonStreamDecoder(User.class, 64 * 1024 * 1024);

for (ByteBuffer chunk : chunks) {
  while (decoder.decodeNext(chunk)) {
    consume(decoder.value());
  }
}
if (decoder.finish()) {
  consume(decoder.value());
}
```

每次 `decodeNext` 调用最多返回一个值。返回 `true` 后，如果缓冲区仍有剩余字节，应继续传入同一缓冲区；返回 `false` 则表示该缓冲区已被消费至 limit。返回 `true` 且 `value() == null` 表示 JSON `null`。

解码器推进传入缓冲区的 position，但不保留该缓冲区，也不改变其 limit 或字节序。支持堆缓冲区、直接缓冲区、切片和只读缓冲区。每个解码器只负责一个流，不具备线程安全性，并且在 `finish()` 或失败后不能复用。必需的 `maxValueBytes` 限制分别应用于每个数组元素或每条 NDJSON 记录，而不是整个流。对于数组，不计外层方括号、逗号和元素前跳过的空白，但计入元素后、逗号或右方括号前的空白。对于 NDJSON，除 LF 或 CRLF 行结束符外的每个字节都计入限制。纯空白行会被跳过，但超出限制的纯空白行仍会失败。

### 泛型类型

根类型包含泛型参数时，请使用 `TypeRef`：

```java
import java.util.List;
import org.apache.fory.json.ForyJson;
import org.apache.fory.reflect.TypeRef;

ForyJson json = ForyJson.builder().build();
TypeRef<List<User>> usersType = new TypeRef<List<User>>() {};

List<User> users = json.fromJson("[{\"id\":7,\"name\":\"Alice\"}]", usersType);
String encoded = json.toJson(users, usersType);
```

使用声明类型写入时，类型必须完全绑定；通配符和类型变量会被拒绝。非 null 值必须可赋给声明的原始类型。

声明的 Schema 控制序列化。例如，声明为具体父类的属性使用父类映射属性，不会自动加入仅子类拥有的字段。
声明为 `Object` 的值在写入时使用运行时分派，在读取时使用自然 JSON 映射。

### 声明类型与多态

不带类型的写入重载根据运行时类分派。基类拥有 `JsonSubTypes` 元数据时，请使用声明类型重载：

```java
Shape shape = new Circle(2);

json.toJson(shape);              // Circle's concrete representation
json.toJson(shape, Shape.class); // Shape's configured subtype representation
json.toJsonBytes(shape, Shape.class);
json.writeJsonTo(shape, Shape.class, outputStream);
```

对于包含多态值的容器，请通过 `TypeRef` 携带声明的基类类型：

```java
TypeRef<List<Shape>> shapesType = new TypeRef<List<Shape>>() {};
String encoded = json.toJson(shapes, shapesType);
```
