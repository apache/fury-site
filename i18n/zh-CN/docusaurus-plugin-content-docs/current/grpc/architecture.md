---
title: 架构
sidebar_position: 2
id: architecture
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

生成的服务配套代码使用标准 gRPC server、channel、方法描述符、deadline、状态码、interceptor
和流式 API。Fory 生成的 marshaller 负责对生成的请求和响应模型进行编码和解码。

## 职责边界

Fory 可以为应用提供的 gRPC 运行时生成服务配套代码。这些代码为请求和响应对象提供 Fory 序列化；
listener、channel、credential、身份认证、授权、deadline、重试和传输生命周期仍由应用和 gRPC 技术栈负责。

Fory 软件包不会将某个 gRPC 实现作为强制依赖。应用负责选择和配置运行时的 gRPC 库。

## 生成的服务接口

编译器会生成符合运行时习惯的 service base、client 或 stub、方法元数据和 Fory marshaller。
模型生成详见[生成代码](../compiler/generated-code/index.md)；各运行时页面介绍 server 与 client 集成。
