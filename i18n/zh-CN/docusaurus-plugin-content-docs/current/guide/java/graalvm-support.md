---
title: GraalVM 支持
sidebar_position: 14
id: graalvm_support
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

## GraalVM Native Image

GraalVM Native Image 提前编译 Java 应用。由于原生镜像无法发现所有反射访问，也无法在运行时生成序列化器，Fory 会在镜像构建期间准备序列化器及所需的元数据。

`fory-core` 已包含 Fory 的 GraalVM Feature，并会自动激活它。应用不需要额外的 Fory 构件，也不需要指定 `--features` 选项。

## 工作原理

在构建时类初始化期间准备每个 Fory 实例：

1. 将 Fory 实例保存在静态字段中。
2. 注册原生可执行文件将要序列化的所有应用类。
3. 完成注册后调用 `fory.ensureSerializersCompiled()`。
4. 将持有该实例的类配置为在构建时初始化。

Feature 会根据这些注册信息提供 Fory 所需的 Native Image 元数据，包括私有构造函数、Record、序列化器构造函数和已注册代理形状的元数据。在编译序列化器之前，应用类仍需先注册到 Fory。

由于原生镜像无法使用运行时即时编译，Fory 会在其中禁用异步序列化器编译。

## Fory JSON

Fory JSON 使用独立的 Native Image 工作流。请将 Fory 注解处理器添加到应用的编译器路径：

```xml
<annotationProcessorPaths>
  <path>
    <groupId>org.apache.fory</groupId>
    <artifactId>fory-annotation-processor</artifactId>
    <version>${fory.version}</version>
  </path>
</annotationProcessorPaths>
```

然后为原生可执行文件读写的每个具体对象模型添加 `@JsonType`：

```java
import org.apache.fory.json.ForyJson;
import org.apache.fory.json.annotation.JsonType;

@JsonType
public final class User {
  public long id;
  public String name;
}

public class JsonExample {
  public static void main(String[] args) {
    ForyJson json = ForyJson.builder().build();
    User user = json.fromJson("{\"id\":1,\"name\":\"Ada\"}", User.class);
    System.out.println(json.toJson(user));
  }
}
```

该处理器也支持为无法修改的模型使用 Fory JSON Mixin：

```java
import org.apache.fory.json.ForyJson;
import org.apache.fory.json.annotation.JsonMixin;
import org.apache.fory.json.annotation.JsonProperty;

@JsonMixin(target = ThirdPartyUser.class)
public abstract class ThirdPartyUserMixin {
  @JsonProperty("user_id")
  long id;
}

public class JsonExample {
  public static void main(String[] args) {
    ForyJson json =
        ForyJson.builder().registerMixin(ThirdPartyUserMixin.class).build();
    ThirdPartyUser user = json.fromJson("{\"user_id\":1}", ThirdPartyUser.class);
    System.out.println(json.toJson(user));
  }
}
```

`JsonMixin` 是其确定声明目标的构建时入口，因此目标不必仅仅为了使用 Mixin 而添加 `JsonType`。已注册的 Mixin class literal 必须对应用可达。处理器会为每个非空 Mixin 生成可用的目标操作，Fory JSON Native Image Feature 则保留有效的运行时元数据。表示形式仍由常规的运行时 codec 优先级决定。空 Mixin 不会生成任何输出。

在一个构建完成的 `ForyJson` 中，一个确定的目标只能启用一个源。后续注册会替换之前的源，并作用于之后的 `build()` 调用；已构建的运行时则保留其不可变快照。如果目标还有直接的 `JsonType` companion，注册非空 Mixin 后会选择配对专用构件，而不会将 overlay 与直接 companion 合并。

不要添加应用反射配置来替代生成的配置。原生可执行文件会解析与 JVM 相同的有效注解。

处理器会生成直接的属性和 creator 操作。`fory-json` 构件会自动激活其 Native Image Feature，并保留生成的 factory 和必要的模型元数据。`@JsonType` 不会被继承，因此请标注每个具体运行时模型。带注解的基类如果通过 class literal 形式的 `@JsonSubTypes` 表列出子类型，会自动注册这些子类型；但每个具体对象子类型仍需直接添加 `@JsonType`，才能获得生成的操作。可达的具体 `Collection` 和 `Map` 根类型也受支持，但它们必须具有 Fory JSON 所需的 public 无参构造函数。可达的 `@JsonCodec` 声明即使并非位于对象模型上，也会注册其 codec 构造函数。仅由运行时字符串引用的类不可达，因此原生镜像不支持 `JsonSubTypes.Type.className`。

原生执行使用 Fory JSON 的解释执行 reader 和 writer，以及生成的属性和 creator 操作。`ForyJson.builder()` 会在原生可执行文件中自动禁用运行时代码生成和异步编译，其他所有 builder 选项仍保持常规行为。应用可以在运行时创建采用不同配置的 `ForyJson` 实例，无需构建时初始化或反射配置。

支持在类型、字段、有效的普通 getter、setter value 参数和 `JsonCreator` 参数上声明 `@JsonCodec`。Feature 会注册每个被选中的完整值、element、content、Map key 和 Map value codec 构造函数。这与 JVM 和 Android 使用的是同一套注解模型。

支持 `JsonValue` 字段和有效的 public 无参方法，包括匹配的单 String `JsonCreator` 构造函数和 public static factory。固定的 `JsonRawValue` 字段和 getter 支持受信任的原始 String 值；固定的 `JsonBase64` 字段和 getter 与 JVM 一样支持 Base64 `byte[]` 值。对于直接标注在目标上的注解，请为每个可达的所属模型添加 `JsonType`，使 Native Image 保留这些成员和 Base64 codec 构造函数。直接标注的 `JsonValue` Record 会使用生成的 component accessor 和 canonical 构造函数操作。由 Mixin 提供的有效声明则使用上述 Mixin 工作流。

`JsonAnyProperty` 和 `JsonAnyGetter` 会将其 Map 展开到外层对象中。可以在该字段或 getter 上使用 `@JsonCodec(valueCodec = ...)` 来自定义每个动态 value。`JsonAnySetter` 的第二个参数可以按常规方式配置自己的 value 形状。

`JsonUnwrapped` 使用与 JVM 相同的解释执行行为。对于直接标注在目标上的注解，请为外层模型以及每个 unwrapped 子对象或中间对象添加 `JsonType`，使每个模型获得生成的属性和 creator 操作。Mixin 会保留由其有效 Schema 触达的 unwrapped 模型；只有当子对象的注解也需要 overlay 时，才需为该子对象另行注册确定的 Mixin。

子 codec 只作用于直接的一层。`elementCodec` 支持 `Collection`、Java 数组和 `AtomicReferenceArray`；`contentCodec` 支持 `Optional` 和 `AtomicReference`；`keyCodec` 与 `valueCodec` 分别支持 Map 的 key 和 value。完整的 `value` codec 不能与子 codec 组合使用。

注解 codec 必须具有与 JVM 上相同的 public 无参构造函数。在具名模块中，请将其 package export 或 open 给 `org.apache.fory.json`。通过 `registerCodec` 提供的 codec 实例由应用自行构造，不需要注解构造函数元数据。

## 基础用法

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

在 native-image 构建期间，Fory 会自动注册已注册类所需的元数据，包括：

- 具有私有构造函数的类
- 私有嵌套类和 Record
- 序列化器构造函数
- 通过 `GraalvmSupport` 注册的动态代理形状

对 Fory 而言，应用元数据只需配置在构建时初始化的引导类，例如：

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

对于单接口代理，请使用 `registerProxySupport(MyService.class)`。如果代理实现多个接口，请按照创建代理时的相同顺序传入完整接口列表。请在 `ensureSerializersCompiled()` 之前调用此方法。

## 线程安全的 Fory

对于多线程应用程序，使用 `ThreadLocalFory`：

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

### "Type is instantiated reflectively but was never registered"

如果您看到此错误：

```
Type com.example.MyClass is instantiated reflectively but was never registered
```

请在编译序列化器之前注册该类：

```java
fory.register(MyClass.class);
fory.ensureSerializersCompiled();
```

如果注册是条件性的，请确保构建时初始化期间会执行相同的分支。

## 框架集成

对于集成 Fory 的框架开发者：

1. 为用户提供配置文件，用于列出可序列化的类。
2. 加载这些类，并为每个类调用 `fory.register(Class<?>)`。
3. 完成所有注册后调用 `fory.ensureSerializersCompiled()`。
4. 将集成类配置为在构建时初始化。

## 基准测试

Fory 与 GraalVM JDK 序列化的性能比较：

| 类型   | 压缩 | 速度      | 大小 |
| ------ | ---- | --------- | ---- |
| Struct | 关闭 | 46 倍更快 | 43%  |
| Struct | 开启 | 24 倍更快 | 31%  |
| Pojo   | 关闭 | 12 倍更快 | 56%  |
| Pojo   | 开启 | 12 倍更快 | 48%  |

查看 [Benchmark.java](https://github.com/apache/fory/blob/main/integration_tests/graalvm_tests/src/main/java/org/apache/fory/graalvm/Benchmark.java) 获取基准测试代码。

### Struct 基准测试

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

无压缩：

```
Benchmark repeat number: 400000
Object type: class org.apache.fory.graalvm.Struct
Compress number: false
Fory size: 76.0
JDK size: 178.0
Fory serialization took mills: 49
JDK serialization took mills: 2254
Compare speed: Fory is 45.70x speed of JDK
Compare size: Fory is 0.43x size of JDK
```

数字压缩：

```
Benchmark repeat number: 400000
Object type: class org.apache.fory.graalvm.Struct
Compress number: true
Fory size: 55.0
JDK size: 178.0
Fory serialization took mills: 130
JDK serialization took mills: 3161
Compare speed: Fory is 24.16x speed of JDK
Compare size: Fory is 0.31x size of JDK
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

无压缩：

```
Benchmark repeat number: 400000
Object type: class org.apache.fory.graalvm.Foo
Compress number: false
Fory size: 541.0
JDK size: 964.0
Fory serialization took mills: 1663
JDK serialization took mills: 16266
Compare speed: Fory is 12.19x speed of JDK
Compare size: Fory is 0.56x size of JDK
```

数字压缩：

```
Benchmark repeat number: 400000
Object type: class org.apache.fory.graalvm.Foo
Compress number: true
Fory size: 459.0
JDK size: 964.0
Fory serialization took mills: 1289
JDK serialization took mills: 15069
Compare speed: Fory is 12.11x speed of JDK
Compare size: Fory is 0.48x size of JDK
```
