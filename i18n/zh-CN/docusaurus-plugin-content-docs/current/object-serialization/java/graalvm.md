---
title: GraalVM 原生镜像
sidebar_position: 15
id: graalvm
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

## GraalVM 原生镜像

GraalVM Native Image 会提前编译 Java 应用。由于原生镜像无法在运行时发现所有反射访问或生成序列化器，Fory 会在构建镜像时准备序列化器和所需元数据。

`fory-core` 包含 Fory 的 GraalVM Feature，并会自动激活。应用不需要额外的 Fory 构件或 `--features` 选项。

## 工作原理

在构建时类初始化期间准备每个 Fory 实例：

1. 将 Fory 实例存储在静态字段中。
2. 注册原生可执行文件将要序列化的每个应用类。
3. 注册完成后调用 `fory.ensureSerializersCompiled()`。
4. 配置持有该实例的类，使其在构建时初始化。

Feature 会根据这些注册提供 Fory 所需的 Native Image 元数据，包括私有构造器、record、序列化器构造器和已注册代理形状的元数据。在编译序列化器之前，应用类仍需向 Fory 注册。

由于原生镜像不支持运行时即时编译，Fory 会禁用异步序列化器编译。

## 基本用法

### 创建 Fory 并注册类

```java
import org.apache.fory.Fory;

public class Example {
  private static final Fory FORY;

  static {
    FORY = Fory.builder().withXlang(false).build();
    FORY.register(MyClass.class);
    FORY.register(AnotherClass.class);
    FORY.ensureSerializersCompiled();
  }

  public static void main(String[] args) {
    byte[] bytes = FORY.serialize(new MyClass());
    MyClass obj = (MyClass) FORY.deserialize(bytes);
  }
}
```

### 配置构建时初始化

创建 `resources/META-INF/native-image/your-group/your-artifact/native-image.properties`：

```properties
Args = --initialize-at-build-time=com.example.Example
```

## 已注册的类

构建 native-image 期间，Fory 会自动注册已注册类所需的元数据，包括：

- 具有私有构造器的类
- 私有嵌套类和 record
- 序列化器构造器
- 通过 `GraalvmSupport` 注册的动态代理形状

对于 Fory，应用元数据只需配置在构建时初始化的引导类，例如：

```properties
Args = --initialize-at-build-time=com.example.Example
```

### 私有 Record 示例

```java
import org.apache.fory.Fory;

public class Example {
  private record PrivateRecord(int id, String name) {}

  private static final Fory FORY;

  static {
    FORY = Fory.builder().withXlang(false).build();
    FORY.register(PrivateRecord.class);
    FORY.ensureSerializersCompiled();
  }
}
```

### 动态代理示例

```java
import org.apache.fory.Fory;
import org.apache.fory.platform.GraalvmSupport;

public class ProxyExample {
  public interface MyService {
    String execute();
  }

  public interface Audited {
    String traceId();
  }

  private static final Fory FORY;

  static {
    FORY = Fory.builder().withXlang(false).build();
    GraalvmSupport.registerProxySupport(MyService.class, Audited.class);
    FORY.ensureSerializersCompiled();
  }
}
```

单接口代理使用 `registerProxySupport(MyService.class)`。对于实现多个接口的代理，请按创建代理时的相同顺序传入完整接口列表。应在 `ensureSerializersCompiled()` 之前调用此方法。

## 线程安全的 Fory

多线程应用使用 `ThreadLocalFory`：

```java
import java.util.List;
import org.apache.fory.Fory;
import org.apache.fory.ThreadLocalFory;
import org.apache.fory.ThreadSafeFory;

public class ThreadSafeExample {
  public record Foo(int f1, String f2, List<String> f3) {}

  private static final ThreadSafeFory FORY;

  static {
    FORY =
        new ThreadLocalFory(
            builder -> {
              Fory f = builder.build();
              f.register(Foo.class);
              f.ensureSerializersCompiled();
              return f;
            });
  }

  public static void main(String[] args) {
    Foo foo = new Foo(10, "abc", List.of("str1", "str2"));
    byte[] bytes = FORY.serialize(foo);
    Foo result = (Foo) FORY.deserialize(bytes);
  }
}
```

## 故障排除

### “类型通过反射实例化但从未注册”

如果看到以下错误：

```
Type com.example.MyClass is instantiated reflectively but was never registered
```

请在编译序列化器前注册该类：

```java
fory.register(MyClass.class);
fory.ensureSerializersCompiled();
```

如果注册带有条件，请确保构建时初始化期间执行相同分支。

## 框架集成

框架开发者集成 Fory 时：

1. 提供配置文件，让用户列出可序列化类。
2. 加载这些类，并逐个调用 `fory.register(Class<?>)`。
3. 完成所有注册后调用 `fory.ensureSerializersCompiled()`。
4. 配置集成类，使其在构建时初始化。
