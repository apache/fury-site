---
title: 原生序列化
sidebar_position: 3
id: native
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

原生序列化使用特定于实现的编码格式和宿主语言的原生类型系统。当所有写入端和读取端都使用
同一个 Fory 实现家族，并且载荷需要保留语言特定的类型或行为时，应选择原生序列化。不同实现
家族的原生载荷不能互换。

只要使用不同原生编码格式的对等端需要读取这些字节，就应使用 [xlang 序列化](xlang.md)。
Xlang 使用共享的类型系统和编码格式；原生模式则有意贴近该实现家族的原生对象模型。

原生模式与 xlang 支持的类型存在重叠。本页列出的类型不一定只能用于原生模式；只要具有可移植
映射，许多语言原生载体也可以用于 xlang。应先根据数据边界和所需编码契约选择模式，再检查相应
语言对具体模型的类型映射。

## 何时使用原生模式

以下场景适合使用原生模式：

- 所有生产端和消费端都使用同一个 Fory 实现家族；
- 对象图包含超出可移植 xlang 类型映射范围的语言特定类型或行为；
- 应用从现有同语言序列化器迁移，并希望保留当前对象模型，而不是引入跨语言 Schema；或者
- 存储或传输的数据只在一个实现家族内流转，而不是作为多个实现家族共享的契约。

当通信方使用不同的 Fory 实现家族、契约必须与语言无关，或可移植性比完整原生对象范围更重要时，
应改用 xlang。

| 场景                                             | 推荐模式 |
| ------------------------------------------------ | -------- |
| 一个实现家族使用语言特定类型                     | Native   |
| 替换现有同语言对象序列化器                       | Native   |
| 数据在多个 Fory 实现家族之间交换                 | Xlang    |
| 长期维护且希望保持语言无关的契约                 | Xlang    |

## Java

仅供 Java/JVM 使用的载荷若需要比可移植 xlang 映射更广的 Java 对象范围，请选择
[Java 原生序列化](java/native.md)。这包括普通 Java 对象、record、enum、基本类型与对象数组、
常见 JDK 集合和包装类型、接口、继承、共享引用和循环对象图。

Java 原生模式还支持使用 JDK 序列化钩子的类：

- `writeObject` 和 `readObject`；
- `writeReplace` 和 `readResolve`；
- `readObjectNoData`；
- `Externalizable`。

Fory 在写入 Fory 原生字节时遵循这些钩子，但不会生成 Java `ObjectOutputStream` 字节。准确语义
请参阅 [JDK 自定义序列化](java/jdk-serialization.md)。

如果要替换仅供 Java 使用的 Kryo、FST、Hessian 或 JDK serialization，并希望继续以现有 Java
对象模型作为序列化模型，请使用 Java 原生模式。

## Python

仅供 Python 使用的载荷若需要超出可移植 xlang 范围的 Python 对象，请选择
[Python 原生序列化](python/native.md)。原生模式支持 class、全局和局部函数、lambda、closure、
实例方法、类方法、静态方法、共享引用和循环对象图。

它还支持 Python 对象构造和状态钩子，包括：

- `__getstate__` 和 `__setstate__`；
- `__getnewargs__` 和 `__getnewargs_ex__`；
- `__reduce__` 和 `__reduce_ex__`。

替换仅供 Python 使用的 Pickle 或 cloudpickle 对象图时应使用此模式。如果 MessagePack 边界仅供
Python 使用，并且两端都迁移到 Fory、应用希望直接序列化 Python 对象，也可以使用原生模式。
如果 MessagePack 当前被用作与语言无关的交换格式，则应使用 xlang。

支持的 Python 对象形状和重建行为请参阅[函数、类和方法](python/functions-classes-methods.md)以及
[序列化钩子](python/serialization-hooks.md)。

## Rust

当所有端点都是 Rust，并且载荷应使用 Rust 特定的编码格式时，请选择
[Rust 原生序列化](rust/native.md)。这并不表示常见 Rust 容器、`Rc<T>`、`Arc<T>`、trait object
或 `dyn Any` 不能用于 xlang；只要选定具体类型具有可移植映射，这些载体也可以参与 xlang。
准确模型请查阅 [Xlang 类型映射](../specification/xlang_type_mapping.md)和 Rust 语言指南。

一种原生模式特有的形状是携带数据、采用 struct 风格且 variant 直接包含多个字段的 enum。在原生
模式中，带有 `#[derive(ForyUnion)]` 的 enum 可以同时包含 unit variant、含一个或多个字段的
tuple variant，以及含一个或多个字段的 named variant：

```rust
use fory::ForyUnion;

#[derive(ForyUnion)]
enum Command {
    #[fory(default)]
    Idle,
    Move(i32, i32),
    Create { id: u128, label: String },
}
```

一个 xlang UNION 备选项最多携带一个已声明的载荷值。Xlang 中的多个逻辑字段必须包装在显式声明的
struct 中，而 Rust 原生模式可以直接编码 tuple 或 named 字段。本地和第三方 enum 形状请参阅
[Rust Enum 支持](rust/schema-evolution.md#enum-support)和
[外部类型序列化](rust/external-types.md#native-struct-style-enums)。

## C++

当所有端点都是 C++，并且数据模型应使用 C++ 特定的编码格式时，请选择
[C++ 原生序列化](cpp/native.md)。标准容器、struct 和 class、`std::optional`、`std::variant`、
tuple-like 值、智能指针和受支持的标量载体并非都只能用于原生模式；只要存在对应的可移植映射，
它们也可以用于 xlang。

应当因为边界仅供 C++ 使用或具体模型需要 C++ 特定表示而选择原生模式，而不能仅仅因为模型使用了
C++ 标准库类型。准确的原生和 xlang 映射请参阅[支持的类型](cpp/supported-types.md)。

## 从其他序列化器迁移

原生模式是一条替代序列化路径，并不是其他库编码格式的解码器。Kryo、FST、Hessian、JDK
serialization、Pickle、cloudpickle 和 MessagePack 字节不会自动变成 Fory 原生字节。

应将写入端和读取端一起迁移到对应的 Fory 实现家族。如果迁移期间仍需读取已有存储数据，请在该
边界保留先前的解码器，并在数据迁移时用 Fory 重新序列化。只要某个边界仍有读取端使用不同的原生
编码格式，就不要使用原生模式。

## 启用原生模式

| 语言   | 原生模式配置                              |
| ------ | ----------------------------------------- |
| Java   | `Fory.builder().withXlang(false).build()` |
| Python | `pyfory.Fory(xlang=False)`                |
| C++    | `Fory::builder().xlang(false).build()`    |
| Rust   | `Fory::builder().xlang(false).build()`    |

## 语言指南

- [Java](java/native.md)
- [Python](python/native.md)
- [C++](cpp/native.md)
- [Go](go/native.md)
- [Rust](rust/native.md)
- [Scala](scala/native.md)
- [Kotlin](kotlin/native.md)

每份语言指南分别说明其准确的支持类型、配置、Schema 行为、扩展 API 和诊断方式。
