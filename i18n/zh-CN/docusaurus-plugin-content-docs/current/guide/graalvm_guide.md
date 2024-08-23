---
title: GraalVM 指南
sidebar_position: 6
id: graalvm_guide
---

## GraalVM Native Image 介绍

GraalVM Native Image 能够将 Java 应用代码编译成为原生的本地应用程序代码，以构建更快、更小、更精简的应用程序。
其不能使用 JIT 编译器将字节码编译为机器码，并且在没有配置相关反射文件的前提下不支持反射，在很多情况下使用较为复杂。

Apache Fury 对 GraalVM Native Image 支持非常完善。Apache Fury 在 Graalvm 构建时能够为 `Fury JIT framework` 和 `MethodHandle/LambdaMetafactory` 生成所有的序列化代码。然后在运行时使用这些生成的代码进行序列化，无需任何额外成本，性能非常出色。

为了在 Graalvm Native Images 上使用 Fury，您必须将 Apache Fury 创建为**静态**的类字段，并且在 `enclosing class` 初始化时间期间完成所有的类**注册**。 然后在`resources/META-INF/native-image/$xxx/` 目录下添加 `native-image.properties` 配置文件。指导 GraalVM 在构建 Native Images 时初始化配置的类。

例如，这里我们在配置文件中加入 `org.apache.fury.graalvm.Example` 类：

```properties
Args = --initialize-at-build-time=org.apache.fury.graalvm.Example
```

使用 Apache Fury 的另一个好处是，您不必配置[反射 JSON](https://www.graalvm.org/latest/reference-manual/native-image/metadata/#specifying-reflection-metadata-in-json)和[序列化 JSON](https://www.graalvm.org/latest/reference-manual/native-image/metadata/#serialization)，这非常乏味、繁琐且不方便。使用 Apache Fury 时，您只需为要序列化的每个类型调用 `org.apache.fury.Fury.register(Class<?>, boolean)` 即可。

请注意，由于 GraalVM Native Image 在镜像运行时不支持 JIT，因此 Apache Fury 的 `asyncCompilationEnabled` 选项将在使用 GraalVM Native Image 构建应用时自动禁用。

## 线程不安全

Example：

```java
import org.apache.fury.Fury;
import org.apache.fury.util.Preconditions;

import java.util.List;
import java.util.Map;

public class Example {
  public record Record (
    int f1,
    String f2,
    List<String> f3,
    Map<String, Long> f4) {
  }

  static Fury fury;

  static {
    fury = Fury.builder().build();
    // register and generate serializer code.
    fury.register(Record.class, true);
  }

  public static void main(String[] args) {
    Record record = new Record(10, "abc", List.of("str1", "str2"), Map.of("k1", 10L, "k2", 20L));
    System.out.println(record);
    byte[] bytes = fury.serialize(record);
    Object o = fury.deserialize(bytes);
    System.out.println(o);
    Preconditions.checkArgument(record.equals(o));
  }
}
```

之后在 `native-image.properties` 中加入 `org.apache.fury.graalvm.Example` 配置：

```properties
Args = --initialize-at-build-time=org.apache.fury.graalvm.Example
```

## 线程安全

```java
import org.apache.fury.Fury;
import org.apache.fury.ThreadLocalFury;
import org.apache.fury.ThreadSafeFury;
import org.apache.fury.util.Preconditions;

import java.util.List;
import java.util.Map;

public class ThreadSafeExample {
  public record Foo (
    int f1,
    String f2,
    List<String> f3,
    Map<String, Long> f4) {
  }

  static ThreadSafeFury fury;

  static {
    fury = new ThreadLocalFury(classLoader -> {
      Fury f = Fury.builder().build();
      // register and generate serializer code.
      f.register(Foo.class, true);
      return f;
    });
  }

  public static void main(String[] args) {
    System.out.println(fury.deserialize(fury.serialize("abc")));
    System.out.println(fury.deserialize(fury.serialize(List.of(1,2,3))));
    System.out.println(fury.deserialize(fury.serialize(Map.of("k1", 1, "k2", 2))));
    Foo foo = new Foo(10, "abc", List.of("str1", "str2"), Map.of("k1", 10L, "k2", 20L));
    System.out.println(foo);
    byte[] bytes = fury.serialize(foo);
    Object o = fury.deserialize(bytes);
    System.out.println(o);
  }
}
```

之后在 `native-image.properties` 中加入 `org.apache.fury.graalvm.ThreadSafeExample` 配置：

```properties
Args = --initialize-at-build-time=org.apache.fury.graalvm.ThreadSafeExample
```

## 框架集成

对于框架开发人员，如果您想集成 Apache Fury 进行序列化。您可以提供一个配置文件，让用户列出他们想要序列化的所有类，然后您可以加载这些类并调用 `org.apache.fury.Fury.register(Class<?>, boolean)` 在您的 Fury 集成类中注册这些类，并配置该类在 GraalVM Native Image 构建时进行初始化。

## 基准测试

在这里，我们给出了 Apache Fury 和 Graalvm 序列化之间的两个类基准测试。

禁用 Apache Fury compression 时：

- Struct：Fury 与 `46x speed, 43% size` JDK 进行比较。
- Pojo：Fury 与 `12x speed, 56% size` JDK进行比较。

启用 Apache Fury compression 时：

- Struct：Fury 与 `24x speed, 31% size` JDK进行比较。
- Pojo：Fury 与 `12x speed, 48% size` JDK进行比较。

有关基准测试代码，请参阅 [Benchmark.java](https://github.com/apache/fury/blob/main/integration_tests/graalvm_tests/src/main/java/org/apache/fury/graalvm/Benchmark.java)。

### 结构体基准测试

#### 类字段

```java
public class Struct implements Serializable {
  public int f1;
  public long f2;
  public float f3;
  public double f4;
  public int f5;
  public long f6;
  public float f7;
  public double f8;
  public int f9;
  public long f10;
  public float f11;
  public double f12;
}
```

#### 基准测试结果

不开启压缩时测试结果：

```
Benchmark repeat number: 400000
Object type: class org.apache.fury.graalvm.Struct
Compress number: false
Fury size: 76.0
JDK size: 178.0
Fury serialization took mills: 49
JDK serialization took mills: 2254
Compare speed: Fury is 45.70x speed of JDK
Compare size: Fury is 0.43x size of JDK
```

开启压缩时测试结果：

```
Benchmark repeat number: 400000
Object type: class org.apache.fury.graalvm.Struct
Compress number: true
Fury size: 55.0
JDK size: 178.0
Fury serialization took mills: 130
JDK serialization took mills: 3161
Compare speed: Fury is 24.16x speed of JDK
Compare size: Fury is 0.31x size of JDK
```

### Pojo 基准测试

#### 类字段

```java
public class Foo implements Serializable {
  int f1;
  String f2;
  List<String> f3;
  Map<String, Long> f4;
}
```

#### 基准测试结果

不开启压缩时测试结果：

```
Benchmark repeat number: 400000
Object type: class org.apache.fury.graalvm.Foo
Compress number: false
Fury size: 541.0
JDK size: 964.0
Fury serialization took mills: 1663
JDK serialization took mills: 16266
Compare speed: Fury is 12.19x speed of JDK
Compare size: Fury is 0.56x size of JDK
```

开启压缩时测试结果：

```
Benchmark repeat number: 400000
Object type: class org.apache.fury.graalvm.Foo
Compress number: true
Fury size: 459.0
JDK size: 964.0
Fury serialization took mills: 1289
JDK serialization took mills: 15069
Compare speed: Fury is 12.11x speed of JDK
Compare size: Fury is 0.48x size of JDK
```
