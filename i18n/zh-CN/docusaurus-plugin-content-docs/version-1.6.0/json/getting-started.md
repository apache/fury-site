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

Fory JSON 已发布到 Maven Central。

Maven:

```xml
<dependency>
  <groupId>org.apache.fory</groupId>
  <artifactId>fory-json</artifactId>
  <version>1.6.0</version>
</dependency>
```

Gradle:

```kotlin
implementation("org.apache.fory:fory-json:1.6.0")
```

同一应用中的所有 Fory 模块应使用相同版本。

### JDK 25 及更高版本

在 JDK 25 及更高版本中，需要向 Fory core 开放 `java.lang.invoke`。对于 classpath 应用：

```bash
--add-opens=java.base/java.lang.invoke=ALL-UNNAMED
```

对于 module-path 应用：

```bash
--add-opens=java.base/java.lang.invoke=org.apache.fory.core
```

Fory JSON 的 JPMS 模块名是 `org.apache.fory.json`。

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

Fory JSON 支持 String 和 UTF-8 字节的输入输出，目前不提供 `InputStream` 解析 API。

| 操作                 | 运行时类型                | 声明的 `Class`                  | 声明的 `TypeRef`                   |
| -------------------- | ------------------------- | ------------------------------- | ---------------------------------- |
| String 输出          | `toJson(value)`           | `toJson(value, type)`           | `toJson(value, typeRef)`           |
| UTF-8 字节           | `toJsonBytes(value)`      | `toJsonBytes(value, type)`      | `toJsonBytes(value, typeRef)`      |
| UTF-8 `OutputStream` | `writeJsonTo(value, out)` | `writeJsonTo(value, type, out)` | `writeJsonTo(value, typeRef, out)` |
| String 输入          | -                         | `fromJson(text, type)`          | `fromJson(text, typeRef)`          |
| UTF-8 输入           | -                         | `fromJson(bytes, type)`         | `fromJson(bytes, typeRef)`         |

每次 `fromJson` 调用只消费一个 JSON 值，并拒绝其后非空白内容。返回的 String 和字节数组
与内部可复用缓冲区相互独立。

`writeJsonTo` 会缓冲完整的 UTF-8 文档，只执行一次 `OutputStream.write`，既不 flush 也不关闭
调用方拥有的流。它是便捷输出 API，并非增量式 JSON 流式写入。I/O 失败会包装为 `ForyJsonException`。

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
