---
title: 对象序列化安全性
sidebar_position: 4
id: security
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

本指南定义 Fory 二进制对象序列化在 xlang 和原生模式下的信任边界与安全运行模型。面向贡献者的分类规则位于[反序列化安全模型](deserialization-security-model.md)。

Fory 是进程内序列化库。应用将 Fory 链接到自身进程中，配置序列化器和类型策略，并调用
Fory API 序列化应用拥有的对象或反序列化已编码的 Fory 数据。Fory 不提供独立的网络
服务、守护进程、身份验证系统或传输协议。

## 信任边界

Fory 的主要安全边界是从不可信或部分可信来源传给反序列化 API 的编码字节或流。嵌入
Fory 的应用负责这些字节的来源，以及读取它们时使用的 Fory 配置、已注册类型、Schema
和策略。

不可信反序列化的对手模型是：发送方可以构造提交给 Fory 读取 API 的编码字节或流行为。
除非应用本身公开了相关控制，否则不假设发送方能够更改嵌入应用的 Fory 配置、已注册类型
集合、`TypeChecker` 或等价白名单策略、Schema 定义、classloader 或其他活动策略对象。

Fory 安全边界包括：

- 运行时安全，包括避免崩溃、panic、未定义行为和越界内存访问。
- 资源所有权，包括内存、CPU 进度、流缓冲区、原生内存分配、回调和保留的读取端状态。
- 显式 Fory 策略检查，例如限制可实体化内容的类、类型、函数、方法、注册或反序列化策略。
- 清理边界，即失败的根操作中创建的状态不得泄漏到后续操作。

运行时序列化器代码生成和 JIT 编译不是执行编码输入的路径。它们在当前注册检查、
`TypeChecker`、Schema 检查或策略检查接受类型范围后，对类型和 Schema 进行操作。禁用
类注册时，`TypeChecker` 或等价白名单策略就是相关关卡。生成的序列化器代码派生自经过
检查的类型描述符，而不是攻击者控制的字节内容。

[反序列化安全模型](deserialization-security-model.md)定义了如何为不可信反序列化路径
分类这些边界。

## 非目标

Fory 不提供：

- 编码数据的真实性、完整性、机密性、签名、MAC 或加密。
- 传输安全，也不保护字节在 Fory 外部存储或移动时的安全。
- 对成功反序列化值的业务含义进行应用级授权或验证。
- 为用户注册的类、函数、构造函数、setter、finalizer 或其他应用拥有的逻辑提供沙箱。

从不可信来源接收 Fory 数据的应用，如果需要保证真实性或防篡改，应在将字节传给 Fory
之前进行身份验证或完整性检查。

## 下游责任

应用负责：

- 判断字节来源对于所配置的反序列化模式是否足够可信。
- 对不可信数据保持启用类或类型注册，除非另一个显式 Fory 策略负责可接受类型范围。
- 仅注册对应用信任边界安全的类型和序列化器。
- 根据应用准备接受的最大数据形状配置深度和资源限制。
- 将跨语言对端和 Schema 视为应用信任关系的一部分。

对可信数据禁用注册或使用动态反序列化属于配置选择。对于不可信数据，绕过显式 Fory
策略、崩溃、泄漏资源、保留攻击者控制的状态或不成比例地分配资源，仍然属于
[反序列化安全模型](deserialization-security-model.md)所述的安全问题。

## 资源限制

### 深度限制

将运行时深度限制设置为应用有意接受的最深对象图。某些运行时将此限制应用于每个嵌套值；
其他运行时则应用单独的动态对象深度限制。确切范围和默认值请参阅所选运行时的配置页面。
深度限制可防止过度嵌套的输入导致无界递归，但它不是字节或内存配额。

### 对象图内存限制

`maxGraphMemoryBytes` 或运行时等价选项，是对一次根反序列化操作所实体化对象图所有者的
近似限制。固定默认值为 128 MiB，显式值必须为正数。每次根操作都以完整配置预算开始，
包括读取失败后的下一次根操作。

该预算根据每个实现的存储模型，涵盖运行时拥有的集合、map、数组、结构体和对象。它不是
精确的堆内存核算、输入大小限制，也不能替代可读字节检查。实际进程内存可能更高。请在
接收字节的边界上保留外部请求体或文件大小限制。

### 远端 Schema 元数据限制

兼容模式可能会为读取端尚未知的类型接收远端元数据（`TypeDef` 或 `TypeMeta`）。Fory 会
限制可接受的不同远端元数据版本数量，也会限制每个接收元数据主体的大小：

- `maxSchemaVersionsPerType`：一个逻辑类型可接受的最大远端元数据版本数。默认值为 `10`。
- `maxAverageSchemaVersionsPerType`：所有已接受远端类型中，每个类型可接受的平均远端
  元数据版本数。默认值为 `3`；有效全局下限为 `8192` 个元数据条目。
- `maxTypeFields`：一个接收的结构体元数据主体可声明的最大字段数。默认值为 `512`。
- `maxTypeMetaBytes`：一个接收的 TypeDef 或 TypeMeta 主体中，编码元数据主体的最大字节数，
  不包括 8 字节头部和任何扩展大小 varint。默认值为 `4096`。

这些限制用于保护资源。它们不会改变编码格式、注册要求、动态类型加载、未知类型处理或
Schema 演进兼容性。

只有在已知对端有意发送更大的元数据或许多 Schema 版本时，才提高这些值。

### 由计数驱动的容器工作量限制

每个运行时都会限制重复读取主体未消耗相应输入的集合元素和 map 条目。默认根操作余量为
`8192`。零表示严格限制，负值会被拒绝。只有可信载荷有意使用紧凑的零字节元素 codec
或空 Struct 主体时，才提高此限制。这是读取端资源限制，不会改变编码格式或写入端行为。

## 配置运行时

对于不可信输入，请保持启用注册，显式选择编码模式，并根据端点接受的模型设置限制值。
最小 Java 边界如下：

```java
Fory fory =
    Fory.builder()
        .withXlang(true)
        .requireClassRegistration(true)
        .withMaxDepth(50)
        .withMaxGraphMemoryBytes(128L * 1024 * 1024)
        .withMaxUnbackedContainerItems(8192)
        .build();
```

仅注册端点接受的应用类型。如果禁用了注册，请在读取外部数据之前配置运行时的显式类型
检查器或白名单。

确切的选项名称、默认值和模式特有行为请参阅各运行时配置指南：

| 运行时                | 配置                                           |
| --------------------- | ---------------------------------------------- |
| Java                  | [Java 配置](java/configuration.md)             |
| Python                | [Python 配置](python/configuration.md)         |
| C++                   | [C++ 配置](cpp/configuration.md)               |
| Go                    | [Go 配置](go/configuration.md)                 |
| Rust                  | [Rust 配置](rust/configuration.md)             |
| JavaScript/TypeScript | [JavaScript 配置](javascript/configuration.md) |
| C#                    | [C# 配置](csharp/configuration.md)             |
| Swift                 | [Swift 配置](swift/configuration.md)           |
| Dart                  | [Dart 配置](dart/configuration.md)             |
| Scala                 | [Scala 配置](scala/configuration.md)           |
| Kotlin                | [Kotlin 配置](kotlin/configuration.md)         |

## 验证边界

在正常往返测试之外添加负向测试。验证配置的读取端会拒绝：

- 未注册或不允许的应用类型；
- 深度超过可接受模型的对象图；
- 超过所配置内存预算的对象图；
- 兼容 xlang 模式下过多的远端 Schema 版本或过大的元数据；
- 过多由计数驱动的容器工作量；
- 同一个可复用运行时中格式错误的根之后紧跟的有效根。

还应独立于 Fory 验证应用的外部身份验证、完整性、请求大小、超时和领域验证控制。
