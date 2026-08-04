---
title: Python 设置
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

`pyfory` 提供二进制对象序列化和 Row Format。Fory IDL 还可以生成 Python 模型和 gRPC 配套代码。该软件包在 Linux、macOS 和 Windows 上支持 Python 3.8 及更高版本。

## 验证工具链

```bash
python --version
python -m pip --version
```

## 对象序列化

安装已发布的软件包：

```bash
python -m pip install pyfory==1.5.0
```

运行 xlang 往返示例：

```python
from dataclasses import dataclass

import pyfory


@dataclass
class User:
    name: str
    age: pyfory.Int32


fory = pyfory.Fory(xlang=True, ref=True)
fory.register(User, type_id=1)

data = fory.serialize(User("Alice", 30))
decoded = fory.deserialize(data)
print(decoded)
```

跨语言数据请使用 [xlang 模式](../object-serialization/python/xlang.md)。仅供 Python 使用的对象（包括 Python 可调用对象和序列化钩子）请使用 [native 模式](../object-serialization/python/native.md)。接下来可阅读 [Python 指南](../object-serialization/python/index.md)、[配置](../object-serialization/python/configuration.md)和[类型注册](../object-serialization/python/type-registration.md)。

## 其他能力

- **Row Format** 为可信分析数据提供零拷贝字段访问。请参阅 [Python Row Format](../row-format/python.md)。
- **Fory IDL 与编译器** 生成 Python 模型和注册辅助代码。请参阅[编译器快速入门](../compiler/getting-started.md)和 [Python 生成代码指南](../compiler/generated-code/python.md)。
- **Fory gRPC** 通过 grpcio 传输使用 Fory 编码的消息。请参阅 [Python gRPC](../grpc/python.md)。
