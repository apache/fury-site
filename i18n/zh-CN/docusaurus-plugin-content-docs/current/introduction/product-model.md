---
title: 产品模型
sidebar_position: 3
id: product-model
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

Apache Fory 提供三种序列化产品和一套 Schema 工具链。请先确定所需的数据契约，再选择
运行时 API。

## 序列化产品

| 产品                          | 数据模型                    | 互操作边界                                                           |
| ----------------------------- | --------------------------- | -------------------------------------------------------------------- |
| 二进制对象序列化：xlang 模式  | 可移植对象图                | 受支持运行时共享编码格式                                             |
| 二进制对象序列化：native 模式 | 运行时原生对象图            | 仅限同一运行时家族                                                   |
| Row Format                    | 支持随机访问的二进制行      | Java、Python、C++ 和 Rust 共享 Standard Row；Compact Row 仅支持 Java |
| Fory JSON                     | 映射到 Java 对象的标准 JSON | 具有文本互操作能力的 Java API                                        |

Xlang 和 native 是二进制对象序列化的并列模式。Row Format 和 Fory JSON 是独立产品，二者都
不是第三种对象序列化模式。

## Schema 与服务

[Fory IDL 和编译器](../compiler/index.md)为受支持的运行时生成原生模型。服务定义还可以生成
[Fory gRPC](../grpc/index.md)配套代码。编译器和 gRPC 集成不会定义额外的序列化格式。

## 规范格式

协议实现者应使用保持不变的[规范](../specification/xlang_serialization_spec.md)页面。用户指南
负责说明任务并链接到确切规范，而不是重复编码格式层面的规则。
