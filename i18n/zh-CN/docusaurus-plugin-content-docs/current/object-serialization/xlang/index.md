---
title: 跨语言序列化指南
sidebar_position: 0
id: index
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

Apache Fory™ 跨语言序列化是跨语言载荷的默认编码格式。数据可以在一种语言中序列化，并在另一种语言中反序列化，无需手动转换。对于小型契约，可以直接使用语言模型类型；更适合 Schema 优先工作流时，也可以使用 Fory IDL 和代码生成。

## 功能特性

- **无需 IDL**：直接使用语言模型类型序列化对象。
- **多语言支持**：Java、Python、C++、Go、Rust、JavaScript/TypeScript、C#、Swift、Dart、Scala 和 Kotlin 可通过相同的跨语言格式互操作。
- **引用支持**：每个对等端启用引用跟踪后，共享引用和循环引用可以跨语言工作。
- **Schema 演进**：兼容模式是跨语言序列化的默认模式，因此读取端可以容忍字段新增、删除或重排。
- **带外缓冲区**：各语言实现可以为大型二进制数据提供零拷贝缓冲区路径。
- **高性能**：Fory 实现在可用时使用生成的序列化器、JIT 序列化器或优化代码路径。

## 支持的语言

| 语言                  | 状态 | 软件包或构建目标                 |
| --------------------- | ---- | -------------------------------- |
| Java                  | 支持 | `org.apache.fory:fory-core`      |
| Python                | 支持 | `pyfory`                         |
| C++                   | 支持 | Bazel/CMake 构建                 |
| Go                    | 支持 | `github.com/apache/fory/go/fory` |
| Rust                  | 支持 | `fory` crate                     |
| JavaScript/TypeScript | 支持 | `@apache-fory/core`              |
| C#                    | 支持 | `Apache.Fory`                    |
| Swift                 | 支持 | Swift Package Manager 目标       |
| Dart                  | 支持 | `fory` package                   |
| Scala                 | 支持 | `org.apache.fory:fory-scala`     |
| Kotlin                | 支持 | `org.apache.fory:fory-kotlin`    |

## 何时使用跨语言模式

以下场景使用跨语言模式：

- 构建多语言微服务
- 创建多语言数据流水线
- 在前端 JavaScript/TypeScript 与 Java、Python、Go、C#、Scala 或 Kotlin 等后端服务之间共享数据

对于 Java、Scala、Kotlin、Python、C++、Go 或 Rust 的同语言通信，请使用原生模式：

- 所有序列化和反序列化都在同一种语言中完成
- 需要 Python pickle 风格对象或 Java 序列化钩子等语言专属功能
- 希望同语言服务使用原生模式载荷

## 快速示例

### Java（生产端）

```java
import org.apache.fory.*;
import org.apache.fory.config.*;

public class Person {
    public String name;
    public int age;
}

Fory fory = Fory.builder().withXlang(true).build();
fory.register(Person.class, "example.Person");

Person person = new Person();
person.name = "Alice";
person.age = 30;
byte[] bytes = fory.serialize(person);
// Send bytes to Python, Go, Rust, etc.
```

### Python（消费端）

```python
import pyfory
from dataclasses import dataclass

@dataclass
class Person:
    name: str
    age: pyfory.Int32

fory = pyfory.Fory(xlang=True)
fory.register_type(Person, name="example.Person")

# Receive bytes from Java
person = fory.deserialize(bytes_from_java)
print(f"{person.name}, {person.age}")  # Alice, 30
```

## Fory IDL

对于 Schema 优先的项目，Fory 还提供 **Fory IDL** 和代码生成。

- 编译器文档：[Fory IDL 概述](../../compiler/index.md)
- 最适合大型多语言消息契约和长期维护的 Schema

### 最小 IDL 示例

创建 `person.fdl`：

```protobuf
package example;

message Person {
    string name = 1;
    int32 age = 2;
    optional string email = 3;
}
```

生成代码：

```bash
foryc person.fdl --lang java,python,cpp,go,rust,javascript,csharp,swift,dart,scala,kotlin --output ./generated
```

这会为所有目标生成字段和类型映射一致的原生语言类型。

## 何时使用 Fory IDL

| 选项                               | 适用场景                                     | 原因                                                 |
| ---------------------------------- | -------------------------------------------- | ---------------------------------------------------- |
| 原生跨语言类型（无 IDL）           | 只有少量消息类型，并希望快速推进             | 避免引入和运行编译器的集成与设置成本                 |
| Fory IDL（Schema 优先 + 代码生成） | 多种语言、团队或服务之间存在大量消息         | 提供统一契约、更强的一致性，并使长期演进更容易       |
| 混合模式（先原生，后迁移到 IDL）   | 项目初期较小，但消息数量和跨团队依赖不断增长 | 保持早期开发速度，并在 Schema 复杂度提高后实现标准化 |

## 文档

| 主题                                                  | 说明                                 |
| ----------------------------------------------------- | ------------------------------------ |
| [快速入门](../../start/index.md)                      | 所有语言的安装和基本设置             |
| [类型映射](../../specification/xlang_type_mapping.md) | 跨语言类型映射参考                   |
| [类型系统](type-system.md)                            | 内置类型和跨运行时类型行为           |
| [类型标识](type-identity.md)                          | 在对等端之间协调名称和数字 ID        |
| [可空性](nullability.md)                              | 可空字段的行为和配置                 |
| [引用](references.md)                                 | 共享引用和循环对象引用               |
| [多态](polymorphism.md)                               | 运行时类型选择和注册                 |
| [Schema 演进](schema-evolution.md)                    | 兼容模式和相同 Schema 模式的选择     |
| [零拷贝](zero-copy.md)                                | 大型数据的带外序列化                 |
| [行格式](../../row-format/index.md)                   | 支持随机访问且对缓存友好的二进制格式 |
| [故障排查](troubleshooting.md)                        | 常见问题和解决方案                   |

## 各语言指南

有关各语言的详细信息和 API 参考，请参阅：

- [Java 跨语言序列化指南](../java/xlang.md)
- [Python 跨语言序列化指南](../python/xlang.md)
- [C++ 跨语言序列化指南](../cpp/xlang.md)
- [Go 跨语言序列化指南](../go/xlang.md)
- [Rust 跨语言序列化指南](../rust/xlang.md)
- [JavaScript/TypeScript 跨语言序列化指南](../javascript/xlang.md)
- [C# 跨语言序列化指南](../csharp/xlang.md)
- [Swift 跨语言序列化指南](../swift/xlang.md)
- [Dart 跨语言序列化指南](../dart/xlang.md)
- [Scala 跨语言序列化指南](../scala/xlang.md)
- [Kotlin 跨语言序列化指南](../kotlin/xlang.md)

## 规范

- [跨语言序列化规范](../../specification/xlang_serialization_spec.md) - 二进制协议详情
- [类型映射规范](../../specification/xlang_type_mapping.md) - 完整的类型映射参考

## 运行最佳实践

1. **使用一致的类型名称**：确保所有语言使用相同的类型名称或 ID
2. **启用引用跟踪**：数据包含循环引用或共享引用时启用
3. **复用 Fory 实例**：创建 Fory 的成本较高，应复用实例
4. **使用类型注解**：在 Python 中使用 `pyfory.Int32` 等标记实现精确类型映射
5. **测试跨语言互操作**：验证序列化可在所有目标语言之间正常工作
