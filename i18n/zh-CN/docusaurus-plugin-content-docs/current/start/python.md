---
title: Python 环境配置
sidebar_position: 2
id: python
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

Python 软件包发布在 PyPI。`pyfory` 在 Linux、macOS 和 Windows 上支持 Python 3.8 及更高
版本。一个应用的所有对等端应使用同一兼容的 Fory 发行版。

## 验证工具链

```bash
python --version
python -m pip --version
```

## 选择能力

| 能力              | 软件包或 extra       | 后续文档                                                                                                                                                                      |
| ----------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 对象序列化        | `pyfory`             | [Python 对象序列化](../object-serialization/python/index.md)，然后选择 [xlang](../object-serialization/python/xlang.md) 或 [native](../object-serialization/python/native.md) |
| Row Format        | `pyfory[format]`     | [Python Row Format](../row-format/python.md)                                                                                                                                  |
| Schema 和生成模型 | `fory-compiler`      | [Fory IDL 和编译器](../compiler/index.md)                                                                                                                                     |
| Fory gRPC         | `pyfory` 加 `grpcio` | [Python gRPC](../grpc/python.md)                                                                                                                                              |

每个能力指南都会提供确切的安装命令和首个可运行示例。
