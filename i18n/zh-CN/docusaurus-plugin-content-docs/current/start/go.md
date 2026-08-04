---
title: Go 环境配置
sidebar_position: 4
id: go
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

Fory Go 以 Go module `github.com/apache/fory/go/fory` 发布，需要 Go 1.24 或更高版本。一个
应用的所有对等端应使用同一兼容的 Fory 发行版。

## 验证工具链

```bash
go version
go env GOPROXY
```

如果 Go proxy 尚未获取新的 submodule tag，请稍后重试，或暂时使用 `GOPROXY=direct`。

## 选择能力

| 能力              | Module 或工具                    | 后续文档                                                                                                                                                      |
| ----------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 对象序列化        | `github.com/apache/fory/go/fory` | [Go 对象序列化](../object-serialization/go/index.md)，然后选择 [xlang](../object-serialization/go/xlang.md) 或 [native](../object-serialization/go/native.md) |
| Schema 和生成模型 | `fory-compiler`                  | [Fory IDL 和编译器](../compiler/index.md)                                                                                                                     |
| Fory gRPC         | 生成的配套代码加 grpc-go         | [Go gRPC](../grpc/go.md)                                                                                                                                      |

每个能力指南都会提供确切的 module 命令和首个可运行示例。
