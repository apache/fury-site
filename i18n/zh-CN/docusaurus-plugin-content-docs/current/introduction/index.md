---
title: 概述
sidebar_position: 1
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

**Apache Fory™** 是一个速度极快的多语言序列化框架，面向符合语言习惯的领域对象、
Schema IDL 和跨语言数据交换。

Fory 专为跨语言、跨执行平台的紧凑高吞吐序列化而设计。它可以直接处理应用对象，在需要稳定
契约时支持共享 Schema，并保留共享引用、循环引用和多态值的具体类型等对象图特性。

## 快速示例

跨语言序列化——使用 Rust 序列化，使用 Python 反序列化：

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

### 高效的跨语言编码

**[Xlang 序列化格式](../specification/xlang_serialization_spec.md)**可在受支持的语言之间
交换紧凑的二进制载荷：

- **紧凑元数据**：对类型元数据和字段信息进行紧凑编码，减小载荷体积。
- **Schema 演进**：兼容模式支持应用 Schema 向前和向后演进。
- **对象图语义**：跨语言保留共享引用、循环引用和多态值的具体类型。
- **类型映射**：通过共享的[类型映射](../specification/xlang_type_mapping.md)转换语言特定值。

### 领域对象优先

Fory 直接序列化原生领域对象，不强制应用使用包装类型：

- Java class、Scala/Kotlin 类型和 GraalVM native image 工作负载。
- Python dataclass 和 Python 原生对象图。
- Go struct、Rust struct、C++ struct、C# 模型、Swift 类型、Dart 模型以及 JavaScript/TypeScript 值。
- 需要共享契约时使用生成类型或带注解类型。

### 支持引用的 Schema IDL

**[Fory IDL 和编译器](../compiler/index.md)**让团队只需定义一次 Schema，即可为每种目标语言
生成原生领域对象：

- 建模数值、字符串、list、map、array、enum、struct 和 union。
- 直接在 Schema 中表达共享引用和循环引用。
- 生成符合宿主语言习惯的代码，无需在用户代码中引入传输特定的包装类型。
- 服务需要在独立维护的 Fory 实现之间建立稳定契约时，使用 Schema IDL。

### Row Format 随机访问

缓存友好的 **[Row Format](../specification/row_format_spec.md)** 针对分析和部分读取工作负载
进行了优化：

- **零拷贝随机访问**：无需重建完整对象即可读取字段、array 和嵌套值。
- **部分操作**：只读取查询或 pipeline 阶段所需的值。
- **Apache Arrow 集成**：转换为列式数据，供分析 pipeline 使用。
- **多语言支持**：在 Java、Python、C++ 和 Rust 之间交换 Standard Row Format 数据。

### 优化的 Fory 实现

Fory 保持热路径高效，同时不强制每个 Fory 实现使用相同策略：

- **Java JIT 序列化器**：运行时代码生成消除反射开销，并内联热路径。
- **生成序列化器和静态序列化器**：其他 Fory 实现根据需要使用生成或静态序列化器。
- **零拷贝路径**：Row Format 和带外缓冲区避免对大值进行不必要的复制。
- **元数据共享**：共享或紧凑编码重复的类型信息，降低序列化开销。
