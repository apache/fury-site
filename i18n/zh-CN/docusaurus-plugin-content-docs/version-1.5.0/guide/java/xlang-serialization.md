---
title: Xlang 序列化
sidebar_position: 2
id: xlang_serialization
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

Apache Fory™ 通过 xlang 序列化格式支持 Java 和其他语言（Python、Rust、Go、JavaScript 等）之间的无缝数据交换。这使得多语言微服务、多语言数据管道和跨平台数据共享成为可能。

## 启用xlang 模式

要序列化供其他语言使用的数据，使用 `Language.XLANG` 模式：

```java
import org.apache.fory.*;
import org.apache.fory.config.*;

// 使用 XLANG 模式创建 Fory 实例
Fory fory = Fory.builder()
    .withLanguage(Language.XLANG)
    .withRefTracking(true)  // 为复杂图启用引用跟踪
    .build();
```

## 为跨语言兼容性注册类型

类型必须使用**一致的 ID 或名称**在所有语言中注册。Fory 支持两种注册方法：

### 按 ID 注册（推荐用于性能）

```java
public record Person(String name, int age) {}

// 使用数字 ID 注册 - 更快更紧凑
fory.register(Person.class, 1);

Person person = new Person("Alice", 30);
byte[] bytes = fory.serialize(person);
// bytes 可以被 Python、Rust、Go 等反序列化。
```

**优点**：更快的序列化，更小的二进制大小
**权衡**：需要协调以避免跨团队/服务的 ID 冲突

### 按名称注册（推荐用于灵活性）

```java
public record Person(String name, int age) {}

// 使用字符串名称注册 - 更灵活
fory.register(Person.class, "example.Person");

Person person = new Person("Alice", 30);
byte[] bytes = fory.serialize(person);
// bytes 可以被 Python、Rust、Go 等反序列化。
```

**优点**：不容易冲突，跨团队管理更容易，无需协调
**权衡**：由于字符串编码，二进制大小稍大

## 跨语言示例：Java ↔ Python

### Java（序列化器）

```java
import org.apache.fory.*;
import org.apache.fory.config.*;

public record Person(String name, int age) {}

public class Example {
    public static void main(String[] args) {
        Fory fory = Fory.builder()
            .withLanguage(Language.XLANG)
            .withRefTracking(true)
            .build();

        // 使用一致的名称注册
        fory.register(Person.class, "example.Person");

        Person person = new Person("Bob", 25);
        byte[] bytes = fory.serialize(person);

        // 通过网络/文件/队列将 bytes 发送到 Python 服务
    }
}
```

### Python（反序列化器）

```python
import pyfory
from dataclasses import dataclass

@dataclass
class Person:
    name: str
    age: pyfory.int32

# 在 xlang 模式下创建 Fory
fory = pyfory.Fory(ref_tracking=True)

# 使用与 Java 相同的名称注册
fory.register_type(Person, typename="example.Person")

# 从 Java 反序列化 bytes
person = fory.deserialize(bytes_from_java)
print(f"{person.name}, {person.age}")  # 输出：Bob, 25
```

## 处理循环引用和共享引用

启用引用跟踪时，xlang 模式支持循环引用和共享引用：

```java
public class Node {
    public String value;
    public Node next;
    public Node parent;
}

Fory fory = Fory.builder()
    .withLanguage(Language.XLANG)
    .withRefTracking(true)  // 循环引用需要
    .build();

fory.register(Node.class, "example.Node");

// 创建循环引用
Node node1 = new Node();
node1.value = "A";
Node node2 = new Node();
node2.value = "B";
node1.next = node2;
node2.parent = node1;  // 循环引用

byte[] bytes = fory.serialize(node1);
// Python/Rust/Go 可以正确反序列化这个，并保留循环引用
```

## 类型映射考虑

并非所有 Java 类型在其他语言中都有等价物。使用 xlang 模式时：

- 使用**原始类型**（`int`、`long`、`double`、`String`）以获得最大兼容性
- 使用**标准集合**（`List`、`Map`、`Set`）而不是特定于语言的集合
- 避免 **Java 特定类型**，如 `Optional`、`BigDecimal`（除非目标语言支持它们）
- 查看[类型映射指南](https://fory.apache.org/docs/specification/xlang_type_mapping)获取完整的兼容性矩阵

### 兼容类型

```java
public record UserData(
    String name,           // ✅ 兼容
    int age,               // ✅ 兼容
    List<String> tags,     // ✅ 兼容
    Map<String, Integer> scores  // ✅ 兼容
) {}
```

### 有问题的类型

```java
public record UserData(
    Optional<String> name,    // ❌ 不跨语言兼容
    BigDecimal balance,       // ❌ 支持有限
    EnumSet<Status> statuses  // ❌ Java 特定集合
) {}
```

## 性能考虑

xlang 模式相比仅 Java 模式有额外的开销：

- **类型元数据编码**：每个类型添加额外字节
- **类型解析**：在反序列化期间需要名称/ID 查找

**为了最佳性能**：

- 尽可能使用**基于 ID 的注册**（更小的编码）
- 如果不需要循环引用，**禁用引用跟踪**（`withRefTracking(false)`）
- 当只需要 Java 序列化时**使用 Java 模式**（`Language.JAVA`）

## 跨语言最佳实践

1. **一致的注册**：确保所有服务使用相同的 ID/名称注册类型
2. **版本兼容性**：使用兼容模式跨服务进行 schema 演化

## xlang 序列化故障排除

### "Type not registered" 错误

- 验证类型在两端都使用相同的 ID/名称注册
- 检查类型名称是否有拼写错误或大小写差异

### "Type mismatch" 错误

- 确保字段类型在语言之间兼容
- 查看[类型映射指南](https://fory.apache.org/docs/next/specification/xlang_type_mapping)

### 数据损坏或意外值

- 验证两端都使用 `Language.XLANG` 模式
- 确保两端具有兼容的 Fory 版本

## 另请参阅

- [xlang 序列化规范](https://fory.apache.org/docs/next/specification/fory_xlang_serialization_spec)
- [类型映射参考](https://fory.apache.org/docs/next/specification/xlang_type_mapping)
- [Python 跨语言指南](../python/xlang-serialization.md)
- [Rust 跨语言指南](../rust/xlang-serialization.md)

## 相关主题

- [Schema 演化](schema-evolution.md) - 兼容模式
- [类型注册](type-registration.md) - 注册方法
- [行格式](row-format.md) - 跨语言行格式
