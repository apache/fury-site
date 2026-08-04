---
title: 基础序列化
sidebar_position: 1
id: core-api
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

本页介绍 Java 跨语言模式快速入门。跨语言模式是 Java 的默认编码格式，也是处理跨语言载荷时的首选。

## 创建 Fory 实例

创建单线程跨语言 Fory 实例时，请显式设置模式：

```java
import org.apache.fory.Fory;

Fory fory = Fory.builder()
    .withXlang(true)
    .requireClassRegistration(true)
    .build();
```

创建线程安全的 Fory 实例时，使用同一个构建器构建 `ThreadSafeFory`：

```java
import org.apache.fory.ThreadSafeFory;

ThreadSafeFory fory = Fory.builder()
    .withXlang(true)
    .requireClassRegistration(true)
    .buildThreadSafeFory();
```

Java 默认的跨语言模式也默认启用兼容 Schema 模式，因此独立部署的服务可以在 Schema 元数据保持兼容时增删字段。仅当所有读取端和写入端始终使用相同 Schema，并且希望获得更快的序列化速度和更小的体积时，才使用 `withCompatible(false)`。只有在确认所有语言使用相同的跨语言 Schema，或原生类型由 Fory Schema IDL 生成时，才应选择 `compatible=false`。

## 注册自定义类型

在每个对等端以相同的类型标识注册应用类。数字 ID 紧凑且快速，而名称注册更便于在独立维护的服务之间协调。

```java
import org.apache.fory.annotation.ForyField;

public class User {
  @ForyField(id = 0)
  public String name;

  @ForyField(id = 1)
  public int age;
}

Fory fory = Fory.builder()
    .withXlang(true)
    .requireClassRegistration(true)
    .build();

fory.register(User.class, "example", "User");
```

长期使用的 Schema 应采用字段 ID，这样即使 Java 字段名发生变化，字段标识仍保持稳定。Java 注解、可空性、引用跟踪和枚举元数据参见 [Schema 元数据](schema-metadata.md)。

## 序列化与反序列化

```java
User user = new User();
user.name = "Alice";
user.age = 30;

byte[] bytes = fory.serialize(user);
User decoded = fory.deserialize(bytes, User.class);
```

跨语言字节在不同语言之间传递时，每个对等端都必须注册相同的类型标识和兼容的字段元数据。
共享规则参见[跨语言序列化](../xlang/index.md)，Java 特定的互操作要求见下文。

## 对仅限 Java 的流量使用原生序列化

对于同语言的 Java/JVM 流量，原生模式通常更合适：

```java
Fory fory = Fory.builder()
    .withXlang(false)
    .build();
```

原生模式支持广泛的 Java 对象序列化能力，包括 JDK 序列化钩子、对象复制和原生模式零拷贝缓冲区。参见[原生序列化](native.md)。

## 常用选项

- `withRefTracking(true)` 保留共享引用和循环引用。
- `requireClassRegistration(true)` 保持默认的已注册类型策略。
- 原生模式和跨语言载荷默认启用兼容模式。仅当所有读取端和写入端使用相同 Schema，且希望获得更快速度和更小体积时，才使用 `withCompatible(false)`。对于跨语言载荷，只有在确认所有语言使用相同 Schema，或原生类型由 Fory Schema IDL 生成时，才应选择 `compatible=false`。
- `withAsyncCompilation(true)` 在受支持的平台上启用异步序列化器编译。

## 最佳实践

1. **复用 Fory 实例**：创建 Fory 的开销较大，应始终复用实例
2. **选择合适的线程安全方式**：根据需求选择单线程或线程安全实现
3. **注册类**：在每个跨语言对等端保持稳定的类型标识
4. **配置引用跟踪**：仅当对象图需要保持对象标识或循环引用时启用

## 跨语言互操作 {#cross-language-interoperability}

以下内容说明默认 xlang 格式的跨语言类型映射、类型标识和互操作要求。

Apache Fory™ 跨语言序列化是 Java 为必须由 Python、Rust、Go、JavaScript/TypeScript、C++、C#、Swift、Dart、Scala、Kotlin 或其他非 Java Fory 实现读取的载荷提供的编码模式。Java 默认使用支持兼容 Schema 演进的跨语言模式，但示例会显式设置模式，以便在代码中清楚表达载荷契约。

### Xlang 配置

每种配置使用一个长期存活的 `Fory` 或 `ThreadSafeFory` 实例。Fory 会缓存类型元数据和生成的序列化器，因此创建实例开销较高。

```java
import org.apache.fory.Fory;

Fory fory = Fory.builder()
    .withXlang(true)
    .requireClassRegistration(true)
    .withRefTracking(true)
    .build();
```

仅当跨语言数据模型包含共享对象标识或循环时，才需要 `withRefTracking(true)`。值形 Schema 应将其禁用。

如果所有写入端和读取端都是 Java，并且载荷需要保留 Java 专用对象行为，请改用[原生序列化](native.md)。

### 注册类型

所有语言都必须使用一致的 ID 或名称注册类型。Fory 支持两种注册方法。

#### 按 ID 注册（追求性能时推荐）

```java
public record Person(String name, int age) {}

// Numeric ID registration is compact and fast.
fory.register(Person.class, 1);

Person person = new Person("Alice", 30);
byte[] bytes = fory.serialize(person);
// bytes can be deserialized by Python, Rust, Go, etc.
```

优点：序列化更快，二进制体积更小。

权衡：每个服务都必须协调 ID，确保同一逻辑类型使用相同数字。

#### 按名称注册（追求灵活性时推荐）

```java
public record Person(String name, int age) {}

// Namespace/type-name registration is easier to coordinate across teams.
fory.register(Person.class, "example", "Person");

Person person = new Person("Alice", 30);
byte[] bytes = fory.serialize(person);
// bytes can be deserialized by Python, Rust, Go, etc.
```

优点：数字 ID 冲突风险较低，更便于跨独立维护的服务进行管理。

权衡：载荷包含字符串标识，因此比按 ID 注册更大。

Java API 也支持单个字符串类型名，例如 `fory.register(Person.class, "example.Person")`。每个对等端都应使用相同的逻辑标识。

### Java 到 Python 示例

#### Java（序列化端）

```java
import org.apache.fory.Fory;
import java.nio.file.Files;
import java.nio.file.Path;

public record Person(String name, int age) {}

public class Example {
  public static void main(String[] args) throws Exception {
    Fory fory = Fory.builder()
        .withXlang(true)
        .withRefTracking(true)
        .build();

    // Register with the same logical name used by Python.
    fory.register(Person.class, "example.Person");

    Person person = new Person("Bob", 25);
    byte[] bytes = fory.serialize(person);
    Files.write(Path.of("person.bin"), bytes);
  }
}
```

#### Python（反序列化端）

```python
import pyfory
from dataclasses import dataclass

@dataclass
class Person:
    name: str
    age: pyfory.Int32

fory = pyfory.Fory(xlang=True, ref=True)

# Register with the same name as Java.
fory.register_type(Person, name="example.Person")

with open("person.bin", "rb") as input_file:
    person = fory.deserialize(input_file.read())
print(f"{person.name}, {person.age}")  # Output: Bob, 25
```

### 处理循环引用和共享引用

启用引用跟踪时，跨语言模式支持循环引用和共享引用：

```java
public class Node {
  public String value;
  public Node next;
  public Node parent;
}

Fory fory = Fory.builder()
    .withXlang(true)
    .withRefTracking(true)
    .build();

fory.register(Node.class, "example.Node");

Node node1 = new Node();
node1.value = "A";
Node node2 = new Node();
node2.value = "B";
node1.next = node2;
node2.parent = node1;

byte[] bytes = fory.serialize(node1);
// Python/Rust/Go can correctly deserialize this with circular references preserved
```

### 类型映射注意事项

并非所有 Java 类型在其他语言中都有对应类型。使用跨语言模式时：

- 为获得最佳兼容性，使用原始类型（`int`、`long`、`double`、`String`）。
- 使用标准集合（`List`、`Map`、`Set`），不要使用语言专用集合。
- 使用低精度载体（`Float16`、`BFloat16`、`Float16List`、`BFloat16List`）处理 16 位浮点载荷。
- 默认将 `Float16[]`、`BFloat16[]`、`Float16List` 和 `BFloat16List` 视为 `list<T>` 载体；使用 `@ArrayType` 可让 Schema 变为 `array<float16>` 或 `array<bfloat16>`。
- 除非每种目标语言都有约定的映射，否则避免使用 `Optional`、`BigDecimal` 和 `EnumSet` 等 Java 专用类型。
- 完整兼容性矩阵参见[类型映射指南](../../specification/xlang_type_mapping.md)。

#### 列表与稠密数组

Java 原始类型数组是稠密 `array<T>` 载体，但普通 `byte[]` 默认映射为 `bytes`。常规 Java 集合以及 `Int32List`、`Float16List`、`BFloat16List` 等 Fory 原始类型列表载体使用 `list<T>`，除非字段具有显式 `@ArrayType` 元数据。

| Fory Schema       | Java 字段形态                              |
| ----------------- | ------------------------------------------ |
| `list<int32>`     | `List<Integer>` 或 `Int32List`             |
| `array<bool>`     | `boolean[]`                                |
| `array<int8>`     | `@Int8Type byte[]` 类型注解                |
| `array<int16>`    | `short[]`                                  |
| `array<int32>`    | `int[]`                                    |
| `array<int64>`    | `long[]`                                   |
| `array<uint8>`    | `@UInt8Type byte[]` 类型注解               |
| `array<uint16>`   | `@UInt16Type short[]` 类型注解             |
| `array<uint32>`   | `@UInt32Type int[]` 类型注解               |
| `array<uint64>`   | `@UInt64Type long[]` 类型注解              |
| `array<float16>`  | `Float16Array` 或 `@Float16Type short[]`   |
| `array<bfloat16>` | `BFloat16Array` 或 `@BFloat16Type short[]` |
| `array<float32>`  | `float[]`                                  |
| `array<float64>`  | `double[]`                                 |

原始类型数组注解优先使用类型使用语法：

```java
private @UInt32Type int[] ids;
private @BFloat16Type short[] values;
```

#### 兼容类型

```java
public record UserData(
    String name,           // compatible
    int age,               // compatible
    List<String> tags,     // compatible
    Map<String, Integer> scores  // compatible
) {}
```

#### 可能有问题的类型

```java
public record UserData(
    Optional<String> name,    // not cross-language compatible
    BigDecimal balance,       // limited support
    EnumSet<Status> statuses  // Java-specific collection
) {}
```

### 性能注意事项

与 Java 原生模式相比，跨语言模式存在额外开销：

- **类型元数据编码**：为每种类型增加额外字节
- **类型解析**：反序列化期间需要查找名称/ID

**为获得最佳性能**：

- 尽可能使用**按 ID 注册**（编码更小）
- 如果不需要循环引用，**禁用引用跟踪**（`withRefTracking(false)`）
- 仅需要 Java 序列化时，**使用原生模式**（`withXlang(false)`）

### 互操作最佳实践

1. 为每个用户类型使用显式类型 ID 或命名空间/类型名称。
2. 独立部署的服务保持兼容模式启用。
3. 在生产环境依赖某个 Schema 之前，通过每个对等端测试载荷。
4. 需要 Java 专用对象行为的仅限 Java 流量使用原生序列化。

### 互操作故障排除

#### “类型未注册”错误

- 验证两端是否使用相同 ID/名称注册类型
- 检查类型名是否有拼写错误或大小写差异

#### “类型不匹配”错误

- 确保不同语言中的字段类型兼容
- 查看[类型映射指南](../../specification/xlang_type_mapping.md)

#### 数据损坏或值不符合预期

- 验证两端都使用跨语言载荷
- 确保两端使用兼容的 Fory 版本

### 规范与参考

- [跨语言序列化规范](../../specification/xlang_serialization_spec.md)
- [类型映射参考](../../specification/xlang_type_mapping.md)
- [Python 跨语言序列化指南](../python/core-api.md#cross-language-interoperability)
- [Rust 跨语言序列化指南](../rust/core-api.md#cross-language-interoperability)

### 相关指南

- [Schema 演进](schema-evolution.md) - 兼容模式
- [类型注册](type-registration.md) - 注册方法
- [原生序列化](native.md) - 仅限 Java 的序列化功能
- [Row Format](../../row-format/java.md) - 跨语言行格式

### 内置值

```java
import org.apache.fory.*;
import org.apache.fory.config.*;

import java.util.*;

public class Example1 {
  public static void main(String[] args) {
    Fory fory = Fory.builder().withXlang(true).build();
    List<Object> list = ofArrayList(true, false, "str", -1.1, 1, new int[100], new double[20]);
    byte[] bytes = fory.serialize(list);
    // bytes can be deserialized by other languages
    fory.deserialize(bytes);
    Map<Object, Object> map = new HashMap<>();
    map.put("k1", "v1");
    map.put("k2", list);
    map.put("k3", -1);
    bytes = fory.serialize(map);
    // bytes can be deserialized by other languages
    fory.deserialize(bytes);
  }
}
```

### 自定义值

```java
import org.apache.fory.*;
import org.apache.fory.config.*;
import java.util.*;

public class Example2 {
  public static class SomeClass1 {
    Object f1;
    Map<Byte, Integer> f2;
  }

  public static class SomeClass2 {
    Object f1;
    String f2;
    List<Object> f3;
    Map<Byte, Integer> f4;
    Byte f5;
    Short f6;
    Integer f7;
    Long f8;
    Float f9;
    Double f10;
    short[] f11;
    List<Short> f12;
  }

  public static Object createObject() {
    SomeClass1 obj1 = new SomeClass1();
    obj1.f1 = true;
    obj1.f2 = ofHashMap((byte) -1, 2);
    SomeClass2 obj = new SomeClass2();
    obj.f1 = obj1;
    obj.f2 = "abc";
    obj.f3 = ofArrayList("abc", "abc");
    obj.f4 = ofHashMap((byte) 1, 2);
    obj.f5 = Byte.MAX_VALUE;
    obj.f6 = Short.MAX_VALUE;
    obj.f7 = Integer.MAX_VALUE;
    obj.f8 = Long.MAX_VALUE;
    obj.f9 = 1.0f / 2;
    obj.f10 = 1 / 3.0;
    obj.f11 = new short[]{(short) 1, (short) 2};
    obj.f12 = ofArrayList((short) -1, (short) 4);
    return obj;
  }

  // mvn exec:java -Dexec.mainClass="org.apache.fory.examples.Example2"
  public static void main(String[] args) {
    Fory fory = Fory.builder().withXlang(true).build();
    fory.register(SomeClass1.class, "example.SomeClass1");
    fory.register(SomeClass2.class, "example.SomeClass2");
    byte[] bytes = fory.serialize(createObject());
    // bytes can be deserialized by other languages
    System.out.println(fory.deserialize(bytes));
  }
}
```

## 相关主题

- [配置](configuration.md) - 所有 ForyBuilder 选项
- [原生序列化](native.md) - 仅限 Java 的序列化功能
- [Schema 元数据](schema-metadata.md) - 字段 ID、可空性、引用跟踪和枚举 ID
- [故障排除](troubleshooting.md) - 常见 API 使用问题
