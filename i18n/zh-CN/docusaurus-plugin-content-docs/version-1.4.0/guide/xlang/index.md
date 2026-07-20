---
title: Xlang 序列化指南
sidebar_position: 0
id: serialization_index
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

Apache Fory™ xlang 序列化是跨语言载荷的默认编码格式。你可以在一种语言中序列化数据，并在另一种语言中反序列化，无需手动转换。对于小型契约，可以直接使用语言模型类型；当更适合 schema-first 工作流时，也可以使用 Fory IDL 和代码生成。

## 特性

- **无需 IDL**：直接使用语言模型类型序列化对象。
- **多语言支持**：Java、Python、C++、Go、Rust、JavaScript/TypeScript、C#、Swift、Dart、Scala 和 Kotlin 可通过同一 xlang 格式互操作。
- **引用支持**：在各语言运行时启用引用跟踪后，共享引用和循环引用可以跨语言边界工作。
- **Schema 演进**：兼容模式是 xlang 的默认设置，因此读取方可以容忍字段新增、删除或重排。
- **带外缓冲区**：语言运行时可以为大型二进制数据暴露零拷贝缓冲区路径。
- **高性能**：可用时，运行时会使用生成的序列化器、JIT 序列化器或优化代码路径。

## 支持的语言

| 语言                  | 状态 | 包或目标                         |
| --------------------- | ---- | -------------------------------- |
| Java                  | 支持 | `org.apache.fory:fory-core`      |
| Python                | 支持 | `pyfory`                         |
| C++                   | 支持 | Bazel/CMake build                |
| Go                    | 支持 | `github.com/apache/fory/go/fory` |
| Rust                  | 支持 | `fory` crate                     |
| JavaScript/TypeScript | 支持 | `@apache-fory/core`              |
| C#                    | 支持 | `Apache.Fory`                    |
| Swift                 | 支持 | Swift Package Manager target     |
| Dart                  | 支持 | `fory` package                   |
| Scala                 | 支持 | `org.apache.fory:fory-scala`     |
| Kotlin                | 支持 | `org.apache.fory:fory-kotlin`    |

## 何时使用 Xlang 模式

在以下场景使用 xlang 模式：

- 构建多语言微服务
- 创建多语言数据管道
- 在前端 JavaScript/TypeScript 与 Java、Python、Go、C#、Scala 或 Kotlin 等后端运行时之间共享数据

对于 Java、Scala、Kotlin、Python、C++、Go 或 Rust 中的同语言流量，请使用原生模式：

- 所有序列化/反序列化都发生在同一语言中
- 需要 Python pickle 风格对象或 Java 序列化钩子等语言特定功能
- 希望为同语言服务使用原生模式的 schema-consistent 载荷

## 快速示例

### Java（生产者）

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

### Python（消费者）

```python
import pyfory
from dataclasses import dataclass

@dataclass
class Person:
    name: str
    age: pyfory.Int32

fory = pyfory.Fory(xlang=True)
fory.register_type(Person, typename="example.Person")

# Receive bytes from Java
person = fory.deserialize(bytes_from_java)
print(f"{person.name}, {person.age}")  # Alice, 30
```

## Fory IDL

对于 schema-first 项目，Fory 还提供 **Fory IDL** 和代码生成。

- 编译器文档：[Fory IDL Overview](../../compiler/index.md)
- 最适合大型多语言消息契约和长期维护的 schema

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

这会生成原生语言类型，并在所有目标语言之间保持一致的字段/类型映射。

## 何时使用 Fory IDL

| 选项                               | 适用场景                                   | 原因                                                       |
| ---------------------------------- | ------------------------------------------ | ---------------------------------------------------------- |
| 原生 xlang 类型（无 IDL）          | 只有少量消息类型，并且希望快速推进         | 避免引入和运维编译器带来的集成/设置成本                   |
| Fory IDL（schema-first + codegen） | 有大量消息，跨多个语言/团队/服务使用       | 提供单一契约、更强一致性，并让长期演进更容易              |
| 混合方式（先原生，后迁移到 IDL）  | 项目初期较小，但消息数量和跨团队依赖在增长 | 保持早期迭代速度，等 schema 复杂度上升后再标准化          |

## 文档

| 主题                                                      | 描述                                     |
| --------------------------------------------------------- | ---------------------------------------- |
| [入门指南](getting-started.md)                           | 所有语言的安装和基本设置                 |
| [类型映射](../../specification/xlang_type_mapping.md)    | Xlang 类型映射参考                       |
| [序列化](serialization.md)                               | 内置类型、自定义类型、引用处理           |
| [零拷贝](zero-copy.md)                                   | 大型数据的带外序列化                     |
| [行格式](row_format.md)                                  | 支持随机访问的缓存友好二进制格式         |
| [故障排查](troubleshooting.md)                           | 常见问题和解决方案                       |

## 特定语言指南

有关特定语言的详细信息和 API 参考：

- [Java Xlang 序列化指南](../java/xlang-serialization.md)
- [Python Xlang 序列化指南](../python/xlang-serialization.md)
- [C++ Xlang 序列化指南](../cpp/xlang-serialization.md)
- [Go Xlang 序列化指南](../go/xlang-serialization.md)
- [Rust Xlang 序列化指南](../rust/xlang-serialization.md)
- [JavaScript/TypeScript Xlang 序列化指南](../javascript/xlang-serialization.md)
- [C# Xlang 序列化指南](../csharp/xlang-serialization.md)
- [Swift Xlang 序列化指南](../swift/xlang-serialization.md)
- [Dart Xlang 序列化指南](../dart/xlang-serialization.md)
- [Scala Schema IDL 与 Xlang 指南](../scala/schema-idl.md)
- [Kotlin 静态生成序列化器指南](../kotlin/static-generated-serializers.md)

## 规范

- [Xlang 序列化规范](../../specification/xlang_serialization_spec.md) - 二进制协议细节
- [类型映射规范](../../specification/xlang_type_mapping.md) - 完整类型映射参考
