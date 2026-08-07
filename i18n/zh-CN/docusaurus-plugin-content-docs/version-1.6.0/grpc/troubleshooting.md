---
title: 故障排查
sidebar_position: 20
id: troubleshooting
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

依赖和 API 相关诊断请参阅所选语言指南。

## `UNIMPLEMENTED`

确认 client 与 server 使用相同的生成服务名称和方法描述符，并确认生成的服务已注册到 server。

## protobuf 客户端无法解码服务

Fory gRPC 使用 Fory 消息字节。请基于同一契约生成 Fory gRPC 对端，或另行提供普通 protobuf 服务。

## 生成文件无法编译

检查语言页面要求的 gRPC 软件包和版本，然后使用同一编译器版本重新生成所有模型和服务文件。
