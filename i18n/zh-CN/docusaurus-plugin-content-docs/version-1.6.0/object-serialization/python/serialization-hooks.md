---
title: 序列化钩子
sidebar_position: 10
id: serialization-hooks
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

Python 原生模式在写入 Fory 原生字节时会遵循 Python 对象自定义协议，但不会输出 Pickle 编码数据。替代 pickle 或 cloudpickle，或由类控制其归约、构造或状态恢复时，请参考本页。

## 替代 Pickle 与 Cloudpickle

现有边界使用 `pickle` 或 `cloudpickle` 时，应选择 Python 原生模式。与 JSON 和跨语言模式相比，它支持更丰富的 Python 值，包括 Python 函数、本地类、闭包和归约钩子。

载荷需要跨越语言边界，或数据模型应是与其他 Fory 实现共享的可移植 Schema 时，请改用跨语言模式。

## 自定义 Python 对象钩子

原生模式遵循常见的 Python 自定义钩子：

```python
import pyfory

class SessionToken:
    def __init__(self, value):
        self.value = value

    def __getstate__(self):
        return {"value": self.value}

    def __setstate__(self, state):
        self.value = state["value"]

fory = pyfory.Fory(xlang=False, strict=False)
token = fory.loads(fory.dumps(SessionToken("abc")))
print(token.value)  # abc
```

这些钩子仅用于 Python 载荷。对于跨语言载荷，请改用带可移植字段注解的 dataclass 建模数据。

## 协议 5 缓冲区

归约钩子可以公开 Pickle 协议 5 缓冲区。传输方式和缓冲区回调流程参见[带外缓冲区](out-of-band.md)。
