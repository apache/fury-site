---
title: Java 设置
sidebar_position: 1
id: java
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

Fory Java 提供二进制对象序列化、Fory JSON、Row Format、生成的模型和 Fory gRPC。相关制品发布在 Maven Central。Fory core 和 Fory JSON 支持 Java 8 及更高版本，Java Record 需要 Java 17 及更高版本，Row Format 需要 Java 11 及更高版本。同一应用中的所有 Fory 制品应使用相同版本。

## 验证工具链

```bash
java -version
mvn -version
# or: ./gradlew --version
```

## 对象序列化

使用对象序列化处理对象图。Xlang 模式生成的数据可由其他 Fory 运行时读取；native 模式支持范围更广的 JVM 对象。

Maven：

```xml
<dependency>
  <groupId>org.apache.fory</groupId>
  <artifactId>fory-core</artifactId>
  <version>1.5.0</version>
</dependency>
```

Gradle：

```kotlin
implementation("org.apache.fory:fory-core:1.5.0")
```

运行下面完整的 xlang 往返示例：

```java
import org.apache.fory.Fory;

public final class ForyExample {
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
    Fory fory = Fory.builder().withXlang(true).build();
    fory.register(User.class, 1);

    byte[] bytes = fory.serialize(new User(1, "Alice"));
    User decoded = (User) fory.deserialize(bytes);
    System.out.println(decoded.name);
  }
}
```

请复用 `Fory` 实例，不要为每个值重新创建实例。接下来可阅读 [Java 对象序列化](../object-serialization/java/index.md)、[xlang 模式](../object-serialization/java/xlang.md)、[native 模式](../object-serialization/java/native.md)或[配置](../object-serialization/java/configuration.md)。

## Fory JSON

Fory JSON 将 Java 对象映射为标准 JSON 文本和 UTF-8 字节。如果应用只需要 JSON，请添加 `fory-json`，无需添加 `fory-core`：

```kotlin
implementation("org.apache.fory:fory-json:1.5.0")
```

在 `ForyExample.java` 中添加 import：

```java
import org.apache.fory.json.ForyJson;
```

然后将 JSON 往返代码放入 `ForyExample.main`：

```java
ForyJson json = ForyJson.builder().build();
String text = json.toJson(new User(1, "Alice"));
User jsonDecoded = json.fromJson(text, User.class);
System.out.println(jsonDecoded.name);
```

Maven 设置、对象映射、注解、Android、GraalVM 和安全相关内容请参阅 [Fory JSON 快速入门](../json/getting-started.md)。

## 其他能力

- **Row Format** 为可信分析数据提供随机和部分字段访问。请参阅 [Java Row Format](../row-format/java.md)。
- **Fory IDL 与编译器** 从 Fory IDL、protobuf IDL 或 FlatBuffers IDL 生成 Java 模型和注册辅助代码。请参阅[编译器快速入门](../compiler/getting-started.md)和 [Java 生成代码指南](../compiler/generated-code/java.md)。
- **Fory gRPC** 通过常规 grpc-java 传输使用 Fory 编码的请求与响应对象。请参阅 [Java gRPC](../grpc/java.md)。

## 运行时说明

- 在 JDK 25 及更高版本上，请按照 [Java 对象序列化](../object-serialization/java/index.md)中的设置操作。
- Android 请参阅 [Java Android 支持](../object-serialization/java/android.md)。
- 原生镜像请参阅 [Java GraalVM 支持](../object-serialization/java/graalvm.md)。
