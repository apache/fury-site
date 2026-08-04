---
title: 故障排除
sidebar_position: 90
id: troubleshooting
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

本页介绍常见问题及其解决方法。

## 类不一致与类版本检查

如果显式禁用兼容模式后遇到异常的序列化错误，可能是序列化端和反序列化端的类不一致所致。

在这种情况下，可以调用 `ForyBuilder#withClassVersionCheck`，并配合 `withCompatible(false)` 进行验证。如果反序列化抛出 `org.apache.fory.exception.ClassNotCompatibleException`，说明类不一致。除非所有读取端和写入端始终使用相同的类 Schema，否则请移除 `withCompatible(false)` 覆盖。

```java
// Enable class version check to diagnose issues
Fory fory = Fory.builder()
  .withCompatible(false)
  .withClassVersionCheck(true)
  .build();

// If ClassNotCompatibleException is thrown, remove withCompatible(false).
```

**注意**：跨语言模式和原生模式都默认启用兼容模式。仅当所有读取端和写入端始终使用相同的类 Schema，且希望获得更快速度和更小体积时，才使用 `withCompatible(false)`。

## 反序列化使用了错误的 API

`serialize` 应与某个 `deserialize` 重载配对使用：

| 序列化 API       | 反序列化 API       |
| ---------------- | ------------------ |
| `Fory#serialize` | `Fory#deserialize` |

**错误用法示例：**

```java
// Wrong: deserialize with an incompatible target class
byte[] bytes = fory.serialize(struct1);
Struct2 result = fory.deserialize(bytes, Struct2.class);  // May throw ClassCastException
```

**正确用法：**

```java
byte[] bytes = fory.serialize(object);
Object result = fory.deserialize(bytes);

byte[] typedBytes = fory.serialize(object);
MyClass typedResult = fory.deserialize(typedBytes, MyClass.class);
```

## 将 POJO 反序列化为另一种类型

如果希望序列化一个 POJO，再反序列化为不同的 POJO 类型，请使用兼容模式：

```java
public class DeserializeIntoType {
  static class Struct1 {
    int f1;
    String f2;

    public Struct1(int f1, String f2) {
      this.f1 = f1;
      this.f2 = f2;
    }
  }

  static class Struct2 {
    int f1;
    String f2;
    double f3;
  }

  static ThreadSafeFory fory = Fory.builder()
    .buildThreadSafeFory();

  public static void main(String[] args) {
    Struct1 struct1 = new Struct1(10, "abc");
    byte[] data = fory.serialize(struct1);
    Struct2 struct2 = fory.deserialize(data, Struct2.class);
  }
}
```

## Set 元素和 Map 键中的循环引用

Fory 支持对象字段、数组、列表和映射值中的循环引用。但是，参与循环的对象不得用作 `Set` 元素或 `Map` 键。该限制同时适用于基于哈希和有序的容器，例如 `HashSet`、`TreeSet`、`HashMap` 和 `TreeMap`。

解析循环时，Fory 可能在对象所有字段完成反序列化之前公开其标识。因此，容器可能在对象只完成部分初始化时调用 `hashCode()`、`equals()`、`compareTo()` 或比较器。如果后续字段会影响这些方法，容器的哈希桶或排序将失效。对象可能仍会在迭代时出现，但 `contains()` 或 `get()` 无法找到它。

如果需要集合视图，请将循环引用序列化为列表，并在反序列化后派生一个 transient 集合：

```java
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

public final class Node {
  private final List<Node> parentList = new ArrayList<>();
  private transient Set<Node> parents;

  public Set<Node> getParents() {
    if (parents == null) {
      parents = new LinkedHashSet<>(parentList);
    }
    return parents;
  }
}
```

对于派生映射，请序列化有序的键值条目列表，并在反序列化后构建 transient 映射。

## 常见错误消息

### “类未注册”

**原因**：要求类注册，但该类尚未注册。

**解决方法**：在序列化前注册该类：

```java
fory.register(MyClass.class);
// or with explicit ID
fory.register(MyClass.class, 100);
```

### "ClassNotCompatibleException"

**原因**：序列化与反序列化使用的类 Schema 不同。

**解决方法**：保持兼容模式启用：

```java
Fory fory = Fory.builder()
  .build();
```

### “超过最大深度”

**原因**：对象图过深，可能表明存在循环引用攻击。

**解决方法**：如果数据合法，请提高最大深度；否则检查恶意数据：

```java
Fory fory = Fory.builder()
  .withMaxDepth(100)  // Increase from default 50
  .build();
```

### “未找到序列化器”

**原因**：该类型没有注册序列化器。

**解决方法**：注册自定义序列化器：

```java
fory.registerSerializer(MyClass.class, new MyClassSerializer(fory.getTypeResolver()));
```

### JDK25+ 访问错误

在 JDK25+ 上，如果错误中出现 `java.base/java.lang.invoke`，请向 Fory 开放 `java.lang.invoke`。Fory 位于 classpath 时使用 `ALL-UNNAMED`：

```bash
--add-opens=java.base/java.lang.invoke=ALL-UNNAMED
```

Fory 位于模块路径时，使用 Fory core 模块名：

```bash
--add-opens=java.base/java.lang.invoke=org.apache.fory.core
```

Fory 访问私有字段时不要求开放应用包。

## 性能问题

### 首次序列化缓慢

**原因**：首次序列化时发生 JIT 编译。

**解决方法**：启用异步编译：

```java
Fory fory = Fory.builder()
  .withAsyncCompilation(true)
  .build();
```

### 内存用量高

**原因**：对象图较大或引用跟踪开销较高。

**解决方法**：

- 如不需要，禁用引用跟踪：`.withRefTracking(false)`
- 使用自定义内存分配器进行池化
- 大型数据集考虑使用 Row Format

### 序列化体积较大

**原因**：元数据开销或数据未压缩。

**解决方法**：

- 启用压缩：`.withIntCompressed(true)`、`.withLongCompressed(true)`
- 仅在需要时使用兼容模式
- 注册类以避免序列化类名

## 调试技巧

1. **启用类版本检查**以诊断 Schema 问题
2. **检查 API 配对**——确保序列化/反序列化 API 匹配
3. **验证注册顺序**——对等端之间必须保持一致
4. **启用日志**以查看内部操作：

```bash
FORY_LOG_LEVEL=INFO mvn test -Dtest=org.apache.fory.TestClass#testMethod
```

## 相关主题

- [配置](configuration.md) - 所有 ForyBuilder 选项
- [Schema 演进](schema-evolution.md) - 兼容模式详情
- [类型注册](type-registration.md) - 注册最佳实践
- [原生序列化](native.md) - 仅限 Java 的序列化功能
