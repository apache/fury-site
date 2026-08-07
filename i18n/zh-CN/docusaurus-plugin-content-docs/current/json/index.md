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
基于 creator 的不可变类、常见 JDK 类型、泛型容器和自定义完整值 codec 提供解释执行和
运行时生成的 codec。

Fory JSON 与 Fory 的 native 和 xlang 二进制协议是不同的数据格式。当系统需要与浏览器、API、
日志、配置或其他 JSON 实现交换普通 JSON 时，请使用 Fory JSON。需要跨语言 Schema 元数据、
引用标识、循环对象图或 Fory 仅二进制协议支持的功能时，请使用 Fory 二进制协议。

## 文档导航

| 目标                                      | 页面                               |
| ----------------------------------------- | ---------------------------------- |
| 运行第一个 JSON 往返示例                  | [快速开始](getting-started.md)     |
| 了解 Java 对象映射和配置                  | [对象映射](object-mapping.md)      |
| 配置属性、creator、值、validator 和 Mixin  | [注解](annotations.md)             |
| 扩展完整值、子值和 Map 键                 | [自定义 Codec](custom-codecs.md)   |
| 部署到 Android                            | [Android](android.md)              |
| 构建 GraalVM Native Image                 | [GraalVM Native Image](graalvm.md) |
| 安全解码输入                              | [安全](security.md)                |
| 诊断故障                                  | [故障排查](troubleshooting.md)     |

## 性能

Java JSON 基准测试使用相同数据对比 fory-json、Jackson 和 Gson。以下结果是在 Apple M4 Pro
与 JDK 26.0.1 上测得的单线程吞吐量，数值越高越好。完整命令、环境和测量配置请参阅
[完整基准测试报告](../benchmarks/json/java/README.md)。

![Java JSON String 基准测试吞吐量](../benchmarks/json/java/string_throughput.png)

![Java JSON UTF-8 字节基准测试吞吐量](../benchmarks/json/java/utf8_bytes_throughput.png)

| 表示形式   | 操作       | fory-json ops/sec | jackson ops/sec | gson ops/sec |
| ---------- | ---------- | ----------------: | --------------: | -----------: |
| String     | 序列化     |         7,387,465 |       2,049,368 |    1,084,042 |
| String     | 反序列化   |         2,897,955 |       1,074,885 |      902,772 |
| UTF-8 字节 | 序列化     |        10,375,498 |       1,868,614 |    1,037,211 |
| UTF-8 字节 | 反序列化   |         3,077,158 |       1,268,397 |      933,079 |

## 相关 Java 指南

二进制序列化请从 [Java 对象序列化](../object-serialization/java/index.md)开始，并选择
[xlang](../object-serialization/java/basic-serialization.md#cross-language-interoperability) 或 [native](../object-serialization/java/native.md)。
二进制 builder 选项另见 [Java 配置](../object-serialization/java/configuration.md)。
