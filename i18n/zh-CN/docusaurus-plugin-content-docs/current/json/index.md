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

Fory JSON 是 Apache Fory 提供的线程安全 Java JSON 编解码器。它为 Java 对象、record、
基于 creator 的不可变类、常见 JDK 类型、泛型容器、自定义完整值 codec，以及通过注解声明的
有限多态提供解释执行和运行时生成的 codec。

Fory JSON 与 Fory 的 native 和 xlang 二进制协议是不同的数据格式。当系统需要与浏览器、API、
日志、配置或其他 JSON 实现交换普通 JSON 时，请使用 Fory JSON。需要跨语言 Schema 元数据、
引用标识、循环对象图或 Fory 仅二进制协议支持的功能时，请使用 Fory 二进制协议。

## 文档导航

| 目标                                      | 页面                               |
| ----------------------------------------- | ---------------------------------- |
| 运行第一个 JSON 往返示例                  | [快速开始](getting-started.md)     |
| 了解 Java 对象映射和配置                  | [对象映射](object-mapping.md)      |
| 配置属性、creator、值、validator 和子类型 | [注解](annotations.md)             |
| 扩展完整值、子值和 Map 键                 | [自定义 Codec](custom-codecs.md)   |
| 部署到 Android                            | [Android](android.md)              |
| 构建 GraalVM Native Image                 | [GraalVM Native Image](graalvm.md) |
| 安全解码输入                              | [安全](security.md)                |
| 诊断故障                                  | [故障排查](troubleshooting.md)     |

## 限制和不支持的功能

Fory JSON 有意提供比 Fory 二进制协议和通用 Jackson 对象映射更小的语义范围：

- 不支持共享引用标识或循环引用协议；
- 不支持开放多态、JSON 类名 ID、运行时子类型发现，也不支持在运行时扩展子类型表；
- 不提供 `InputStream` 解析器或增量式 `OutputStream` writer；这些能力不在 `ForyJson` 根 API 中；
- 不提供美化输出配置；
- 不提供 Jackson/Gson 注解兼容层；
- 不支持别名、view、filter、注入、managed/back reference、对象标识注解或根包装；
- 不处理 Fory core 的 `Expose`。

循环对象图最终会因 `maxDepth` 而失败，不会被重建。需要引用标识或循环引用时，请使用
Fory core 的 native 或 xlang 二进制协议。

## 相关 Java 指南

二进制序列化请从 [Java 对象序列化](../object-serialization/java/index.md)开始，并选择
[xlang](../object-serialization/java/xlang.md) 或 [native](../object-serialization/java/native.md)。
二进制 builder 选项另见 [Java 配置](../object-serialization/java/configuration.md)。
