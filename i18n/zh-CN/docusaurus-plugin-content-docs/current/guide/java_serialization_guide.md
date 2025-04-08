---
title: Java 序列化指南
sidebar_position: 0
id: java_object_graph_guide
---

## Java 对象图序列化

当只需要 Java 对象序列化时，其相比跨语言的图序列化拥有更好的性能。

## 快速开始

注意：Fury 对象创建的代价很高， 因此 **Fury 对象应该尽可能被复用**，而不是每次都重新创建。

您应该为 Fury 创建一个全局的静态变量，或者有限的的 Fury 实例对象。Fury本身占用一定内存，请不要创建上万个Fury对象

使用单线程版本 Fury:

```java
import java.util.List;
import java.util.Arrays;

import org.apache.fury.*;
import org.apache.fury.config.*;

public class Example {
  public static void main(String[] args) {
    SomeClass object = new SomeClass();
    // Note that Fury instances should be reused between
    // multiple serializations of different objects.
    Fury fury = Fury.builder().withLanguage(Language.JAVA)
      .requireClassRegistration(true)
      .build();
    // Registering types can reduce class name serialization overhead, but not mandatory.
    // If class registration enabled, all custom types must be registered.
    fury.register(SomeClass.class);
    byte[] bytes = fury.serialize(object);
    System.out.println(fury.deserialize(bytes));
  }
}
```

使用多线程版本 Fury：

```java
import java.util.List;
import java.util.Arrays;

import org.apache.fury.*;
import org.apache.fury.config.*;

public class Example {
  public static void main(String[] args) {
    SomeClass object = new SomeClass();
    // Note that Fury instances should be reused between
    // multiple serializations of different objects.
    ThreadSafeFury fury = new ThreadLocalFury(classLoader -> {
      Fury f = Fury.builder().withLanguage(Language.JAVA)
        .withClassLoader(classLoader).build();
      f.register(SomeClass.class);
      return f;
    });
    byte[] bytes = fury.serialize(object);
    System.out.println(fury.deserialize(bytes));
  }
}
```

Fury 对象复用示例：

```java
import java.util.List;
import java.util.Arrays;

import org.apache.fury.*;
import org.apache.fury.config.*;

public class Example {
  // reuse fury.
  private static final ThreadSafeFury fury = new ThreadLocalFury(classLoader -> {
    Fury f = Fury.builder().withLanguage(Language.JAVA)
      .withClassLoader(classLoader).build();
    f.register(SomeClass.class);
    return f;
  });

  public static void main(String[] args) {
    SomeClass object = new SomeClass();
    byte[] bytes = fury.serialize(object);
    System.out.println(fury.deserialize(bytes));
  }
}
```

## FuryBuilder 参数选项

| 参数选项名                         | 描述                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | 默认值                                                  |
|-------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------|
| `timeRefIgnored`                    | 启用 reference tracking 时，是否忽略在 `TimeSerializers` 中注册的所有时间类型及其子类的引用跟踪。如果忽略，则可以通过调用 `Fury#registerSerializer(Class, Serializer)` 来启用对每种时间类型的引用跟踪。例如，`fury.registerSerializer(Date.class, new DateSerializer(fury, true))`。请注意，启用 ref tracking 功能应在任何包含时间字段的类型的序列化程序编码之前进行。否则，这些字段仍将跳过 reference tracking。 | `true`                                                         |
| `compressInt`                       | 启用或禁用 int 压缩，减小数据体积。                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `true`                                                         |
| `compressLong`                      | 启用或禁用 long 压缩，减小数据体积。                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | `true`                                                         |
| `compressString`                    | 启用或禁用 String 压缩，减小数据体积。                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | `true`                                                         |
| `classLoader`                       | 关联到当前 Fury 的类加载器，每个 Fury 会关联一个不可变的类加载器，用于缓存类元数据。如果需要切换类加载器，请使用 `LoaderBinding` 或 `ThreadSafeFury` 进行更新。                                                                                                                                                                                                                                                                                                                                                                                               | `Thread.currentThread().getContextClassLoader()`               |
| `compatibleMode`                    | 类型的向前/向后兼容性配置。也与 `checkClassVersion` 配置相关。`schema_consistent`： 类的Schema信息必须在序列化对等节点和反序列化对等节点之间保持一致。`COMPATIBLE`： 序列化对等节点和反序列化对等节点之间的类模式可以不同。它们可以独立添加/删除字段。                                                                                                                                                                                    | `CompatibleMode.SCHEMA_CONSISTENT`                             |
| `checkClassVersion`                 | 决定是否检查类模式的一致性。如果启用，Fury 将写入 `classVersionHash` 和基于其检查类型一致性。当启用 `CompatibleMode#COMPATIBLE` 时，它将自动禁用。除非能确保类不会演化，否则不建议禁用。                                                                                                                                                                                                                  | `false`                                                        |
| `checkJdkClassSerializable`         | 启用或禁用 `java.*` 下类的 `Serializable` 接口检查。如果 `java.*` 下的类不是 `Serializable`，Fury 将抛出 `UnsupportedOperationException`。                                                                                                                                                                                                                                                                                                                                         | `true`                                                         |
| `registerGuavaTypes`                | 是否预先注册 Guava 类型，如 `RegularImmutableMap`/`RegularImmutableList`。这些类型不是公共 API，但似乎非常稳定。                                                                                                                                                                                                                                                                                                                                                                                 | `true`                                                         |
| `requireClassRegistration`          | 禁用可能会允许未知类被反序列化，从而带来潜在的安全风险。                                                                                                                                                                                                                                                                                                                                                                                                                                       | `true`                                                         |
| `suppressClassRegistrationWarnings` | 是否抑制类注册警告。这些警告可用于安全审计，但可能会较琐碎，默认情况下将启用此抑制功能。                                                                                                                                                                                                                                                                                                                                                                    | `true`                                                         |
| `metaShareEnabled`                  | 是否否开启原元数据共享。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | `false`                                                        |
| `scopedMetaShareEnabled`            | 范围元数据共享侧重于单一序列化流程。在此过程中创建或识别的元数据为该过程独有，不会与其他序列化过程共享。                                                                                                                                                                                                                                                                                                                                                | `false`                                                        |
| `metaCompressor`                    | 元数据压缩器。请注意，传递的元压缩器应是线程安全的。默认情况下，将使用基于 `Deflater` 的压缩器 `DeflaterMetaCompressor`。用户可以使用其他压缩器，如 `zstd` 以获得更好的压缩率。                                                                                                                                                                                                                                                                    | `DeflaterMetaCompressor`                                       |
| `deserializeNonexistentClass`       | 启用或禁用反序列化/跳转不存在类的数据。                                                                                                                                                                                                                                                                                                                                                                                                                                                    | `true`， 如果设置了 `CompatibleMode.Compatible`，将会变为 `false`。 |
| `codeGenEnabled`                    | 禁用后，初始序列化速度会加快，但后续序列化速度会减慢。                                                                                                                                                                                                                                                                                                                                                                                                                                        | `true`                                                         |
| `asyncCompilationEnabled`           | 如果启用，序列化会首先使用解释器模式，并在类的异步序列化 JIT 完成后切换到 JIT 序列化。                                                                                                                                                                                                                                                                                                                                                                                       | `false`                                                        |
| `scalaOptimizationEnabled`          | 启用或禁用特定于 Scala 的序列化优化。                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | `false`                                                        |
| `copyRef`                           | 禁用后，复制性能会更好。但 Fury 深度复制将忽略循环引用和共享引用。对象图中的相同引用将在一次 `Fury#copy` 中复制到不同的对象中。                                                                                                                                                                                                                                                                                                                     | `true`                                                         |

## 高级用法

### Fury 创建

单线程 Fury 创建:

```java
Fury fury=Fury.builder()
  .withLanguage(Language.JAVA)
  // enable reference tracking for shared/circular reference.
  // Disable it will have better performance if no duplicate reference.
  .withRefTracking(false)
  .withCompatibleMode(CompatibleMode.SCHEMA_CONSISTENT)
  // enable type forward/backward compatibility
  // disable it for small size and better performance.
  // .withCompatibleMode(CompatibleMode.COMPATIBLE)
  // enable async multi-threaded compilation.
  .withAsyncCompilation(true)
  .build();
  byte[]bytes=fury.serialize(object);
  System.out.println(fury.deserialize(bytes));
```

多线程 Fury 创建:

```java
ThreadSafeFury fury=Fury.builder()
  .withLanguage(Language.JAVA)
  // enable reference tracking for shared/circular reference.
  // Disable it will have better performance if no duplicate reference.
  .withRefTracking(false)
  // compress int for smaller size
  // .withIntCompressed(true)
  // compress long for smaller size
  // .withLongCompressed(true)
  .withCompatibleMode(CompatibleMode.SCHEMA_CONSISTENT)
  // enable type forward/backward compatibility
  // disable it for small size and better performance.
  // .withCompatibleMode(CompatibleMode.COMPATIBLE)
  // enable async multi-threaded compilation.
  .withAsyncCompilation(true)
  .buildThreadSafeFury();
  byte[]bytes=fury.serialize(object);
  System.out.println(fury.deserialize(bytes));
```

### 配置Fury生成更小的序列化体积：

`FuryBuilder#withIntCompressed`/`FuryBuilder#withLongCompressed` 可用于压缩 `int/long`，使其体积更小。通常压缩 int 类型就足够了。

这两个压缩属性默认启用。如果序列化大小不重要，比如你之前使用flatbuffers进行序列化，flatbuffers不会压缩任何东西，那么这种情况下建议关闭压缩。如果数据都是数字，压缩可能会带来 80%以上的性能损耗。

对于 int 压缩，Fury 使用 1~5 字节进行编码。每个字节的第一位表示是否有下一个字节位，如果下一个字节位被设置，则将读取下一个字节，直到下一个字节位未被设置时停止。

对于 long 压缩，Fury 支持两种编码方式：

- Fury SLI（Small long as int）编码（**默认使用**）：
  - 如果 long 在 [-1073741824, 1073741823] 范围内，则编码为 4 字节 int：`| little-endian: ((int) value) << 1 |`
  - 否则写成 9 字节： `| 0b1 | little-endian 8 bit long |`
- Fury PVL（渐进可变长）编码：
  - 每个字节的第一位表示是否有下一个字节。如果第一位被设置，则将读取下一个字节。
      直到下一字节的第一位未设置。
  - 负数将通过 `(v << 1) ^ (v >> 63)` 转换为正数，以减少小负数的编码空间占用。

如果一个数字是 `Long` 类型，大多不能用更小的字节表示，压缩效果就不够好。
与占用的性能开销相比，这是不值得的。如果您发现`Long`类型压缩并没有带来多少好处，也许您应该尝试关闭`Long`类型压缩，以提升性能。

### 对象深拷贝

深度拷贝示例:

```java
Fury fury=Fury.builder()
  ...
  .withRefCopy(true).build();
  SomeClass a=xxx;
  SomeClass copied=fury.copy(a)
```

使 Fury 深度复制忽略循环引用和共享引用，此配置会将对象图中的相同引用在一次 `Fury#copy` 之后会被复制到不同的对象中。

```java
Fury fury=Fury.builder()
  ...
  .withRefCopy(false).build();
  SomeClass a=xxx;
  SomeClass copied=fury.copy(a)
```

### 实现自定义的序列化器

在某些情况下，您可能希望为您的自定义类型实现一个序列化器，特别是某些通过
 JDK `writeObject/writeReplace/readObject/readResolve` 实现序列化的类，JDK序列化的性能和空间效率很低。比如说，如果您不想下面的 `Foo#writeObject` 被调用，你可以实现类型下面的 `FooSerializer` ：

```java
class Foo {
  public long f1;

  private void writeObject(ObjectOutputStream s) throws IOException {
    System.out.println(f1);
    s.defaultWriteObject();
  }
}

class FooSerializer extends Serializer<Foo> {
  public FooSerializer(Fury fury) {
    super(fury, Foo.class);
  }

  @Override
  public void write(MemoryBuffer buffer, Foo value) {
    buffer.writeInt64(value.f1);
  }

  @Override
  public Foo read(MemoryBuffer buffer) {
    Foo foo = new Foo();
    foo.f1 = buffer.readInt64();
    return foo;
  }
}
```

注册序列化器:

```java
Fury fury=getFury();
  fury.registerSerializer(Foo.class,new FooSerializer(fury));
```

### 安全与类注册

可以使用 `FuryBuilder#requireClassRegistration` 来禁用类注册，这将允许反序列化未知类型的对象，使用更灵活。**但如果类中包含恶意代码，就会出现安全漏洞**。

**除非能确保运行环境和外部交互环境安全，否则请勿禁用类注册检查**。

如果禁用此选项，在反序列化未知/不可信任的类型时，可能会执行`init/equals/hashCode`中的恶意代码。
禁用。

类注册不仅可以降低安全风险，还可以避免类名序列化成本。

您可以使用 `Fury#register` API 来注册类。

> 请注意：类注册顺序很重要，序列化和反序列化对，应具有相同的注册顺序。

```java
Fury fury=xxx;
  fury.register(SomeClass.class);
  fury.register(SomeClass1.class,200);
```

如果调用 `FuryBuilder#requireClassRegistration(false)` 来禁用类注册检查、
可以通过 `ClassResolver#setClassChecker` 设置 `org.apache.fury.resolver.ClassChecker` 来控制哪些类是允许序列化。例如，可以通过以下方式允许以 `org.example.*` 开头的类：

```java
Fury fury=xxx;
  fury.getClassResolver().setClassChecker((classResolver,className)->className.startsWith("org.example."));
```

```java
AllowListChecker checker=new AllowListChecker(AllowListChecker.CheckLevel.STRICT);
  ThreadSafeFury fury=new ThreadLocalFury(classLoader->{
  Fury f=Fury.builder().requireClassRegistration(true).withClassLoader(classLoader).build();
  f.getClassResolver().setClassChecker(checker);
  checker.addListener(f.getClassResolver());
  return f;
  });
  checker.allowClass("org.example.*");
```

Aapche Fury 还提供了一个 `org.apache.fury.resolver.AllowListChecker`，它是一个基于允许/禁止列表的检查器，用于简化类检查机制的定制。您可以使用此检查器或自行实现更复杂的检查器。

### 序列化器注册

您还可以通过 `Fury#registerSerializer` API 为类注册自定义序列化器。或者为类实现 `java.io.Externalizable`。

### 零拷贝序列化

```java
import org.apache.fury.*;
import org.apache.fury.config.*;
import org.apache.fury.serializers.BufferObject;
import org.apache.fury.memory.MemoryBuffer;

import java.util.*;
import java.util.stream.Collectors;

public class ZeroCopyExample {
  // Note that fury instance should be reused instead of creation every time.
  static Fury fury = Fury.builder()
    .withLanguage(Language.JAVA)
    .build();

  // mvn exec:java -Dexec.mainClass="io.ray.fury.examples.ZeroCopyExample"
  public static void main(String[] args) {
    List<Object> list = Arrays.asList("str", new byte[1000], new int[100], new double[100]);
    Collection<BufferObject> bufferObjects = new ArrayList<>();
    byte[] bytes = fury.serialize(list, e -> !bufferObjects.add(e));
    List<MemoryBuffer> buffers = bufferObjects.stream()
      .map(BufferObject::toBuffer).collect(Collectors.toList());
    System.out.println(fury.deserialize(bytes, buffers));
  }
}
```

### Meta 共享

Apache Fury 支持在同一个上下文（例如：`TCP Connection`）中的多个序列中共享类型元数据（例如：类名称，字段名称，字段类型信息 等），这些信息将在上下文中第一次序列化时发送给 对端。根据这些元数据，对端方可重建相同的反序列化器，从而避免为后续序列化传输元数据，减少网络流量压力，并支持类型向前/向后兼容。

```java
// Fury.builder()
//   .withLanguage(Language.JAVA)
//   .withRefTracking(false)
//   // share meta across serialization.
//   .withMetaContextShare(true)
// Not thread-safe fury.
MetaContext context=xxx;
  fury.getSerializationContext().setMetaContext(context);
  byte[]bytes=fury.serialize(o);
// Not thread-safe fury.
  MetaContext context=xxx;
  fury.getSerializationContext().setMetaContext(context);
  fury.deserialize(bytes)

// Thread-safe fury
  fury.setClassLoader(beanA.getClass().getClassLoader());
  byte[]serialized=fury.execute(
  f->{
  f.getSerializationContext().setMetaContext(context);
  return f.serialize(beanA);
  }
  );
// thread-safe fury
  fury.setClassLoader(beanA.getClass().getClassLoader());
  Object newObj=fury.execute(
  f->{
  f.getSerializationContext().setMetaContext(context);
  return f.deserialize(serialized);
  }
  );
```

### 反序列化不存在的类

Apache Fury 支持反序列化不存在的类，通过`FuryBuilder#deserializeNonexistentClass(true)` 选项开启。当此选项开启的时候，同时也会开启元数据共享。Apache Fury 会将该类型的反序列化数据存储在 lazy Map 子类中。通过使用 Fury 实现的 lazy Map，可以避免在反序列化过程中填充 map 时 map 内部节点的rebalance来下，从而进一步提高性能。如果这些数据被发送到另一个进程，而该进程中存在该类，那么数据将被反序列化为该类型的对象，而不会丢失任何信息。

如果未启用元数据共享，新类数据将被跳过，并返回一个 `NonexistentSkipClass` 的stub 对象。

## 序列化库迁移

### JDK 迁移

如果您之前使用 JDK 序列化，并且没有同时升级 client 和 server。这在线上应用很常见，Apache Fury 提供了一个 `org.apache.fury.serializer.JavaSerializer.serializedByJDK` 工具方法来检查二进制文件是否由 JDK 序列化生成。您可以使用以下模式使已有的序列化具有探测运行协议的能力、然后以异步滚动升级的方式将序列化器逐步升级至 Apache Fury：

```java
if(JavaSerializer.serializedByJDK(bytes)){
  ObjectInputStream objectInputStream=xxx;
  return objectInputStream.readObject();
  }else{
  return fury.deserialize(bytes);
  }
```

### Apache Fury 更新

当前只保证小版本之间的兼容性。例如：您使用的 Fury 版本为 `0.9.0`，当升级到 Fury `0.8.1` 版本，可以确保二进制协议的兼容性。但是，如果更新到 Fury `0.9.0` 版本，二进制协议兼容性能力不能得到保证。我们计划在1.0.0版本开始提供大版本内的二进制兼容性。

## 常见问题排查

### 类不一致和类版本检查

如果您在创建 fury 时未将 `CompatibleMode` 设置为 `org.apache.fury.config.CompatibleMode.COMPATIBLE` 而出现奇怪的序列化错误，可能是由于序列化对和反序列化对之间的类不一致造成的。

在这种情况下，您可以调用 `FuryBuilder#withClassVersionCheck` 来创建 Fury 以验证它，如果反序列化时抛出`org.apache.fury.exception.ClassNotCompatibleException`，则表明类是不一致的，您应该通过
`FuryBuilder#withCompaibleMode(CompatibleMode.COMPATIBLE)` 创建 Fury 对象。

`CompatibleMode.COMPATIBLE` 会带来更多的性能和空间代价，如果您的类在序列化和反序列化之间保持一致，请不要设置此选项。

### 使用错误的 API 反序列化

如果您调用 `Fury#serialize` 来序列化对象，则应调用 `Fury#deserialize` 来反序列化对象，而不是使用 `Fury#deserializeJavaObject`。

如果调用 `Fury#serializeJavaObject` 来序列化对象，则应调用 `Fury#deserializeJavaObject` 来进行反序列化。而不是使用`Fury#deserializeJavaObjectAndClass` 或者 `Fury#deserialize`。

如果调用 `Fury#serializeJavaObjectAndClass` 来序列化对象，则应
调用 `Fury#deserializeJavaObjectAndClass` 进行反序列化，而不是使用`Fury#deserializeJavaObject` 或者 `Fury#deserialize`。
