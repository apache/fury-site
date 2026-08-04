---
title: Xlang 序列化
sidebar_position: 2
id: xlang
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

Xlang 是 Fory 默认的对象序列化模式。Java、Python、C++、Go、Rust、
JavaScript/TypeScript、C#、Swift、Dart、Scala 和 Kotlin 共用同一种可移植二进制格式。
各运行时的[基础序列化](#runtime-guides)页面负责介绍 API 和模型示例；本页说明所有通信方必须
共同遵循的规则。

请先阅读[核心概念](core-concepts.md)，了解 xlang 和原生模式共用的对象图、Schema、引用和多态概念。

## 概述 {#overview}

当字节需要跨运行时传输时，应使用 xlang 序列化，例如多语言服务、数据管道以及前后端通信。
它提供以下能力：

- 直接序列化各语言的原生模型，无需预先定义 IDL。
- 通过协调一致的数字 ID 或名称标识应用类型。
- 使用兼容模式支持独立部署的通信方演进 Schema。
- 按需保留共享引用和循环引用。
- 当每个具体类型都有可移植映射时支持多态值。
- 在运行时支持的情况下，通过带外缓冲区传输大型二进制和数值数据。

如果写入端和读取端始终使用同一种受支持的运行时，并且对象图需要 Java 序列化钩子、Python
pickle 兼容对象等语言特有行为，请改用[原生序列化](native.md)。

### 支持的运行时 {#supported-runtimes}

| 运行时                | 包或目标                                  | 模式         |
| --------------------- | ----------------------------------------- | ------------ |
| Java                  | `org.apache.fory:fory-core`               | xlang/native |
| Python                | `pyfory`                                  | xlang/native |
| C++                   | Fory C++ CMake 或 Bazel 目标              | xlang/native |
| Go                    | `github.com/apache/fory/go/fory`          | xlang/native |
| Rust                  | `fory` crate                              | xlang/native |
| JavaScript/TypeScript | `@apache-fory/core`                       | xlang        |
| C#                    | `Apache.Fory`                             | xlang        |
| Swift                 | `Fory` Swift Package Manager 目标         | xlang        |
| Dart                  | `fory` package                            | xlang        |
| Scala                 | `org.apache.fory:fory-scala`              | xlang/native |
| Kotlin                | `org.apache.fory:fory-kotlin` 和 Java API | xlang/native |

### 第一次跨语言往返 {#first-cross-language-round-trip}

每个通信方都必须为同一个逻辑类型注册相同的类型标识和兼容字段。下面的示例使用共享类型名称。

Java 写入端：

```java
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
```

Python 读取端：

```python
from dataclasses import dataclass
import pyfory

@dataclass
class Person:
    name: str
    age: pyfory.Int32

fory = pyfory.Fory(xlang=True)
fory.register_type(Person, name="example.Person")
person = fory.deserialize(bytes_from_java)
```

虽然 xlang 是默认模式，示例通常仍会显式选择它，以便在应用代码中明确表达传输约定。

### 原生模型还是 Fory IDL {#native-models-or-fory-idl}

| 方式                             | 适用场景                                   |
| -------------------------------- | ------------------------------------------ |
| 各语言的原生模型                 | 契约较小，希望无需编译步骤即可开始         |
| [Fory IDL](../compiler/index.md) | 多个消息或团队需要统一 Schema 和生成的模型 |
| 先用原生模型，再迁移到 IDL       | 小型契约逐渐成为长期维护、跨团队的服务边界 |

一个最小的 Fory IDL 消息如下：

```protobuf
package example;

message Person {
  string name = 1;
  int32 age = 2;
  optional string email = 3;
}
```

使用 `foryc` 生成所需的运行时目标；生成的模型在这些目标之间使用一致的字段和类型元数据。

## 类型系统和类型标识 {#type-system-and-type-identity}

### 内置类型和自定义类型 {#built-in-and-custom-types}

原始数值、字符串、二进制、时间类型、列表、集合、映射、稠密数值数组、枚举、结构体和联合类型
都有共享的 xlang Schema。内置值无需用户注册；应用结构体、枚举、联合和扩展类型则需要协调一致的
类型标识。

规范性的[类型映射](../specification/xlang_type_mapping.md)定义了每个 xlang 类型在各宿主语言中的
准确载体。需要特别注意：

- 当 Python 原生类型无法表达所需位宽时，使用 `pyfory.Int32`、`pyfory.Float16`、
  `pyfory.BFloat16` 等标记。
- 当一个宿主类型能够表示多个 xlang 类型时，Java、Dart 等运行时使用注解或 Schema 元数据区分。
- `float16`、`bfloat16` 及其稠密数组使用运行时特有的载体。
- `list<T>` 和稠密 `array<T>` 是不同的 Schema。在兼容模式下，如果元素域兼容，直接结构体字段
  可以在列表和稠密布尔值/数值数组之间适配，但实际列表不能包含目标数组无法表示的 null 或
  引用跟踪元素。

不要根据宿主语言中相似的类型名称推断兼容性，应以类型映射规范为准。

### 协调类型标识 {#coordinate-type-identity}

每个通信方都必须使用相同的数字 ID，或者相同的命名空间和类型名称注册自定义类型。数字 ID 的
元数据更小；名称则更适合由不同团队独立维护的服务。不要让同一契约的一端按 ID 注册、另一端按
名称注册。

注册必须在第一次根序列化或反序列化操作之前完成。当多个团队共同维护通信方时，应维护一个小型
契约注册表，或者使用 Fory IDL 生成的模块。

### 静态字段和动态字段 {#static-and-dynamic-fields}

静态已知字段直接使用声明类型的序列化器，不写入具体运行时类型；动态字段则携带足够的类型信息，
用于选择已注册的具体类型。接口、抽象类型、trait object 和其他多态位置需要动态元数据；原始类型
和准确的 final 类型不需要。

| 运行时 | 动态字段模型                                         |
| ------ | ---------------------------------------------------- |
| Java   | `@ForyField(dynamic = ...)` 控制自动或强制写入元数据 |
| Python | `pyfory.field(dynamic=...)` 控制对象字段元数据       |
| C++    | `fory::F(...).dynamic(...)` 覆盖自动检测             |
| Go     | interface 字段表达动态值                             |
| Rust   | trait object 载体表达动态值                          |

写入动态元数据会增加空间和类型解析开销。只有在字段绝不可能包含其他具体类型时才能禁用它。准确的
注解和注册示例请参阅各运行时的 Schema 元数据、类型注册和多态文档。

## 可空性和引用跟踪 {#nullability-and-reference-tracking}

可空性和引用跟踪解决的是不同问题：

| 关注点   | 作用                         |
| -------- | ---------------------------- |
| 可空性   | 允许字段或值位置不包含值     |
| 引用跟踪 | 保留重复对象身份并支持对象环 |

线格式帧由 [xlang 序列化规范](../specification/xlang_serialization_spec.md)定义。应用应通过运行时 API
配置语义行为，不要依赖具体的标志值。

### 可空性 {#nullability}

Xlang 结构体字段默认不可为空。不可空字段体积更小，也能明确表达必填数据。常见的可空或可选载体
包括 Java 装箱类型或注解字段、Python `Optional[T]`、C++ `std::optional<T>`、Go 指针、
Rust `Option<T>` 和 Scala `Option[T]`。

对应字段在各通信方之间应保持一致的可空性。在同 Schema 模式下，修改可空性会改变 Schema，
因此不兼容。兼容模式支持文档中定义的可空和标量适配，但如果本地类型没有有效的 null 或缺失值
行为，远端 null 仍然无法物化。

### 共享引用和循环引用 {#shared-and-circular-references}

当对象图中同一个对象出现多次或包含环时，应启用引用跟踪。对于值形数据应保持禁用，以避免身份表
开销。

```java
import org.apache.fory.Fory;
import org.apache.fory.annotation.Ref;

public class Node {
  public String value;
  @Ref public Node next;
}

Node first = new Node();
Node second = new Node();
first.next = second;
second.next = first;

Fory fory = Fory.builder()
    .withXlang(true)
    .withRefTracking(true)
    .build();
```

全局引用跟踪启用运行时机制，字段元数据决定哪些位置参与跟踪。常见的字段级控制包括 Java 和
Scala `@Ref`、Go `fory:"ref"` 标签、Rust `#[fory(ref = true)]`，以及 C++ 智能指针或
`fory::F().ref()` 元数据。不同语言和载体的默认行为不同，请参阅对应运行时指南。

引用支持还受宿主语言所有权模型约束。例如 Rust 可以保留受支持的共享引用载体，但循环引用必须
使用可表达的所有权和弱引用形状。

## 多态 {#polymorphism}

当字段、集合元素或根值声明为更宽泛的类型时，xlang 多态会保留值的具体已注册类型。每个读取端都
必须：

1. 注册相同的具体类型标识。
2. 为该具体类型提供兼容字段 Schema。
3. 当运行时无法推断时，将该位置标记或建模为动态。
4. 使用具有可移植 xlang 映射的具体类型。

仅有宿主语言继承关系并不能让类型自动变得可移植。如果某种形状没有 xlang 映射，请为同语言流量
使用原生模式，或者定义可移植模型。接口、trait object、联合和生成代码的语法请参阅各运行时的
多态文档。

## Schema 演进 {#schema-evolution}

兼容模式是 xlang 的默认模式。它携带 Schema 元数据，使独立部署的读取端能够容忍受支持的字段
新增、删除、重排和文档中定义的兼容类型适配。

当通信方可能独立部署时，应保留兼容模式。只有在每个读写端都使用以下完全相同的契约时，才能选择
同 Schema 模式：

- 类型标识以及字段 ID 或名称。
- 字段类型和嵌套泛型形状。
- 可空性和引用元数据。
- 多态候选类型。

同 Schema 模式减少元数据和载荷体积，但任何差异都可能产生 Schema hash 或类型错误。当所有
通信方一起发布时，Fory IDL 生成的模型更容易保证准确协调。规范性的兼容行为请参阅
[xlang 序列化规范](../specification/xlang_serialization_spec.md)。

## 零拷贝序列化 {#zero-copy-serialization}

部分运行时可以把大型二进制或数值缓冲区移出主序列化字节流，从而避免将这些缓冲区复制到一个连续
载荷中。

传输流程如下：

1. 序列化对象图，并通过回调收集选中的缓冲区对象。
2. 分别发送主元数据字节和收集到的缓冲区。
3. 反序列化时按照相同顺序提供缓冲区。

Java：

```java
Collection<BufferObject> objects = new ArrayList<>();
byte[] metadata = fory.serialize(value, object -> !objects.add(object));
List<MemoryBuffer> buffers = objects.stream()
    .map(BufferObject::toBuffer)
    .toList();
Object decoded = fory.deserialize(metadata, buffers);
```

Python：

```python
objects = []
metadata = fory.serialize(value, buffer_callback=objects.append)
buffers = [obj.to_buffer() for obj in objects]
decoded = fory.deserialize(metadata, buffers=buffers)
```

Go 通过其序列化和缓冲区 API 提供等价的回调缓冲区流程。当前方法名和支持的缓冲区载体请以运行时
文档为准。

当缓冲区很大并且传输层能够避免额外复制时，带外序列化收益明显。对于小数组，回调和多缓冲区传输
的开销可能高于复制。应用负责缓冲区顺序、生命周期和传输帧。Python 和 NumPy 的详细用法请参阅
[Python 带外序列化](python/out-of-band.md)。

## 故障排除 {#troubleshooting}

| 现象                   | 可能原因                              | 解决方法                                          |
| ---------------------- | ------------------------------------- | ------------------------------------------------- |
| 类型未注册             | 缺少注册或注册过晚                    | 在第一次根操作前注册所有自定义类型                |
| 类型 ID 或名称不匹配   | 通信方使用了不同标识                  | 使用相同数字 ID，或相同命名空间和类型名称         |
| 整数溢出或浮点精度损失 | 宿主载体使用了不同数值位宽            | 遵循类型映射并使用显式位宽元数据                  |
| 字段解码错误           | 字段 ID、名称或类型不同               | 对齐字段元数据，或从同一份 IDL 重新生成所有通信方 |
| 循环对象图出现栈溢出   | 未启用引用跟踪                        | 启用全局和字段级引用跟踪                          |
| 共享对象被复制         | 值位置不跟踪引用                      | 为对应载体或字段启用引用跟踪                      |
| 宿主类型不受支持       | 类型没有可移植的 xlang 表示           | 改用可移植模型，或为同语言流量使用原生模式        |
| Schema/hash 不匹配     | 同 Schema 通信方使用了不同 Schema     | 对齐所有通信方，或恢复兼容模式                    |
| 升级后失败             | 通信方运行了不兼容的协议版本          | 对齐受支持的 Fory 版本并查看发布说明              |
| 载荷立即被拒绝         | 一端写入原生字节，另一端按 xlang 读取 | 跨语言契约的所有通信方都应使用 xlang              |

### 诊断清单 {#diagnostic-checklist}

1. 确认每个通信方都使用 xlang 模式和相互支持的 Fory 版本。
2. 比较注册的类型标识、字段 ID 或名称、数值位宽、可空性和引用元数据。
3. 在测试跨运行时方向前，先复现同运行时往返。
4. 对生产环境使用的每一种语言组合测试双向传输。
5. 将值缩减为一个类型和一个字段，然后逐步恢复字段，直到差异再次出现。
6. 对于生成代码、平台或 API 错误，请查看对应运行时的故障排除页面。

诊断二进制布局时，应使用规范和运行时调试工具。不要把十六进制转储或内部标志值当作稳定的应用
API。

## 运行时指南 {#runtime-guides}

- [Java](java/basic-serialization.md#cross-language-interoperability)
- [Python](python/basic-serialization.md#cross-language-interoperability)
- [C++](cpp/basic-serialization.md#cross-language-interoperability)
- [Go](go/basic-serialization.md#cross-language-interoperability)
- [Rust](rust/basic-serialization.md#cross-language-interoperability)
- [JavaScript/TypeScript](javascript/basic-serialization.md#cross-language-interoperability)
- [C#](csharp/basic-serialization.md#cross-language-interoperability)
- [Swift](swift/basic-serialization.md#cross-language-interoperability)
- [Dart](dart/basic-serialization.md#cross-language-interoperability)
- [Scala](scala/basic-serialization.md#cross-language-interoperability)
- [Kotlin](kotlin/basic-serialization.md#cross-language-interoperability)

## 相关文档 {#related-documentation}

- [Xlang 序列化格式](../specification/xlang_serialization_spec.md) — 规范性的线格式
- [Xlang 类型映射](../specification/xlang_type_mapping.md) — 各运行时准确的载体映射
- [Fory IDL 和编译器](../compiler/index.md) — Schema 优先的模型和代码生成
- [快速开始](../start/index.md) — 各运行时的安装和第一次序列化
- [行格式](../row-format/index.md) — 用于可信分析数据的随机访问行

## 运维最佳实践 {#operational-best-practices}

1. 在所有通信方之间协调统一的类型标识和字段契约。
2. 除非所有读写端总是同时部署相同 Schema，否则保留兼容模式。
3. 只为具有对象身份或包含环的对象图启用引用跟踪。
4. 复用已配置的 Fory 实例，不要为每次操作重新创建。
5. 部署前，双向验证生产环境使用的每一种语言组合。
6. 当契约包含大量消息、服务或由不同团队维护时，优先采用 Fory IDL。
