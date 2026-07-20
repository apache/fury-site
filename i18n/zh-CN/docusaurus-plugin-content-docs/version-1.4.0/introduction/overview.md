---
id: overview
title: 概述
sidebar_position: 1
---

**Apache Fory™** 是一个高性能多语言序列化框架，面向原生对象序列化和跨语言二进制编解码，支持 Schema IDL、对象引用、Schema 演进、Row Format 随机访问与零拷贝读取。

Fory 面向跨语言、跨运行时的紧凑高吞吐序列化而构建。它可以直接处理应用中的对象；当需要稳定契约时，也可以使用共享 Schema；同时保留对象图中的共享引用、循环引用和多态运行时类型等语义。

## 快速示例

跨语言序列化，在 Rust 中序列化，在 Python 中反序列化：

**Rust**

```rust
use fory::{Fory, ForyObject};

#[derive(ForyObject, Debug, PartialEq)]
struct User {
    name: String,
    age: i32,
}

fn main() {
    let mut fory = Fory::default().xlang(true);
    fory.register::<User>(1);

    let user = User { name: "Alice".to_string(), age: 30 };
    let bytes = fory.serialize(&user).unwrap();
    let decoded: User = fory.deserialize(&bytes).unwrap();
    println!("{:?}", decoded);  // User { name: "Alice", age: 30 }
}
```

**Python**

```python
import pyfory
from dataclasses import dataclass

@dataclass
class User:
    name: str
    age: pyfory.int32

fory = pyfory.Fory(xlang=True)
fory.register(User, type_id=1)

user = User(name="Alice", age=30)
data = fory.serialize(user)
decoded = fory.deserialize(data)
print(decoded)  # User(name='Alice', age=30)
```

## 核心特性

### 高效跨语言编码

**[xlang 序列化格式](../specification/xlang_serialization_spec.md)** 可以在支持的语言之间交换紧凑二进制载荷：

- **紧凑元数据**：打包类型元信息和字段信息，降低载荷体积。
- **Schema 演进**：兼容模式支持应用 Schema 的向前和向后演进。
- **对象图语义**：跨运行时保留共享引用、循环引用和多态运行时类型。
- **类型映射**：语言特定值通过共享的[类型映射](../specification/xlang_type_mapping.md)进行转换。

### 领域对象优先

Fory 直接序列化原生领域对象，而不是要求应用引入包装类型：

- Java 类、Scala/Kotlin 类型，以及 GraalVM native image 工作负载。
- Python dataclass 和 Python 原生对象图。
- Go struct、Rust struct、C++ struct、C# 模型、Swift 类型、Dart 模型，以及 JavaScript/TypeScript 值。
- 当需要共享契约时，也支持生成或注解过的类型。

### 原生支持引用的 Schema IDL

**[Fory IDL 和编译器](../compiler/index.md)** 允许团队一次定义 Schema，并为每种目标语言生成原生领域对象：

- 建模数字、字符串、list、map、array、enum、struct 和 union。
- 在 Schema 中直接表达共享引用和循环引用。
- 生成惯用的宿主语言代码，不把传输专用包装类型引入用户代码。
- 当服务需要在独立维护的运行时之间共享稳定契约时，可以使用 Schema IDL。

### 行格式随机访问

缓存友好的 **[行格式](../specification/row_format_spec.md)** 面向分析和部分读取工作负载优化：

- **零拷贝随机访问**：无需重建完整对象即可读取字段、数组和嵌套值。
- **部分操作**：只读取查询或流水线阶段需要的值。
- **Apache Arrow 集成**：转换为列式数据，用于分析流水线。
- **多语言支持**：可在 Java、Python、Rust 和 C++ 中使用行格式。

### 优化运行时

Fory 让热点路径保持高速，同时不要求所有运行时采用相同实现策略：

- **Java JIT 序列化器**：运行时代码生成消除反射开销，并内联热点路径。
- **生成式和静态序列化器**：其他运行时在合适场景下使用生成式或静态序列化器。
- **零拷贝路径**：行格式和带外 buffer 可避免大值的不必要复制。
- **元数据共享**：复用或打包重复类型信息，降低序列化开销。
