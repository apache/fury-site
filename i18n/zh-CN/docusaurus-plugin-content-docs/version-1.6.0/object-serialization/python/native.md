---
title: Python 原生序列化
sidebar_position: 2
id: native
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

Python 原生序列化是通过 `xlang=False` 选择的仅限 Python 编码模式。当所有写入端和读取端都是 Python，并且载荷应遵循 Python 对象模型而非可移植的跨语言类型系统时，请使用该模式。

如果字节必须由 Java、C++、Go、Rust、JavaScript/TypeScript、C#、Swift、Dart、Scala、Kotlin 或其他非 Python Fory 实现读取，请使用 Python 默认的[跨语言序列化](basic-serialization.md#cross-language-interoperability)模式。

## 何时使用原生序列化

以下情况使用原生序列化：

- 载荷仅由 Python 应用生成和使用。
- 正在为仅限 Python 的对象图替代 `pickle` 或 `cloudpickle`。
- 数据模型包含函数、lambda、本地类、方法或 Python 归约钩子。
- 对象图可能包含需要 Python 引用跟踪的共享对象或循环。
- 大型 Python 数据对象需要 pickle 协议 5 风格的带外缓冲区。

原生模式可以序列化全局函数、本地函数、lambda、本地类、方法，以及使用 `__getstate__`、`__setstate__`、`__reduce__` 或 `__reduce_ex__` 自定义的对象等 Python 专用值。这些值不是有效的跨语言载荷。

## 创建原生模式 Fory 实例

创建 `Fory` 时设置 `xlang=False`：

```python
import pyfory
fory = pyfory.Fory(xlang=False, ref=False, strict=True)
```

对于已注册且可信的类型范围，请保持 `strict=True`。仅当原生模式载荷需要函数、本地类或由归约钩子重建的对象等动态 Python 类型时，才使用 `strict=False`。

## 常见用法

```python
import pyfory

fory = pyfory.Fory(xlang=False, ref=True, strict=False)

data = fory.dumps({"name": "Alice", "age": 30, "scores": [95, 87, 92]})
print(fory.loads(data))

from dataclasses import dataclass

@dataclass
class Person:
    name: str
    age: int

person = Person("Bob", 25)
data = fory.dumps(person)
print(fory.loads(data))  # Person(name='Bob', age=25)
```

需要 pickle 风格 API 时使用 `dumps`/`loads`；在显式切换模式的代码中需要与跨语言 API 形式保持一致时，则使用 `serialize`/`deserialize`。

## 安全与动态类型

原生模式可以重建会在反序列化期间执行导入和构造逻辑的 Python 对象。应像对待不可信 pickle 字节一样对待不可信原生模式字节。

- 反序列化只应包含已注册或内置类型的数据时，保持 `strict=True`。
- 仅对需要动态 Python 类或函数的可信载荷使用 `strict=False`。
- 需要动态类型但仍应限制可接受类型范围时，提供 `policy=` 反序列化策略。
- 不要将跨语言/原生模式选择用作安全控制。应根据载荷来源应用严格模式、策略、注册和资源限制。

## Python 专用值与钩子

可调用对象和类型值参见[函数、类与方法](functions-classes-methods.md)，归约、状态、构造和 pickle/cloudpickle 迁移参见[序列化钩子](serialization-hooks.md)。

## 引用与循环

需要往返保留对象标识、共享引用或循环时，启用 `ref=True`：

```python
import pyfory

fory = pyfory.Fory(xlang=False, ref=True, strict=True)

node = {}
node["self"] = node
data = fory.dumps(node)
decoded = fory.loads(data)
assert decoded["self"] is decoded
```

不需要保留对象标识的值形载荷应禁用引用跟踪，这样可以减小载荷并简化热点路径。

## 带外缓冲区

对于大型二进制载荷和由外部内存支撑的数据结构，Python 原生模式可以使用 pickle 协议 5 风格的带外缓冲区：

```python
import pickle
import pyfory

data = b"Large binary data"
pickle_buffer = pickle.PickleBuffer(data)

buffer_objects = []
fory = pyfory.Fory(xlang=False, ref=True, strict=False)
serialized = fory.dumps(pickle_buffer, buffer_callback=buffer_objects.append)
buffers = [obj.getbuffer() for obj in buffer_objects]
decoded = fory.loads(serialized, buffers=buffers)
assert bytes(decoded.raw()) == data
```

载荷只在 Python 中使用，并且大型缓冲区应避免额外复制时，使用此方式。参见[带外序列化](out-of-band.md)。

## 原生模式与跨语言模式对比

| 需求                                   | 使用原生序列化 | 使用跨语言序列化 |
| -------------------------------------- | -------------- | ---------------- |
| 仅限 Python 的载荷                     | 是             | 可选             |
| 非 Python 读取端或写入端               | 否             | 是               |
| 函数、lambda、本地类                   | 是             | 否               |
| `__reduce__` / `__getstate__` 对象钩子 | 是             | 否               |
| 替代 Pickle/cloudpickle                | 是             | 否               |
| 跨语言可移植类型映射                   | 否             | 是               |

## 性能对比

```python
import pyfory
import pickle
import timeit

fory = pyfory.Fory(xlang=False, ref=True, strict=False)

obj = {f"key{i}": f"value{i}" for i in range(10000)}
print(f"Fory: {timeit.timeit(lambda: fory.dumps(obj), number=1000):.3f}s")
print(f"Pickle: {timeit.timeit(lambda: pickle.dumps(obj), number=1000):.3f}s")
```

## 故障排除

### 其他语言无法读取载荷

写入端正在使用原生序列化。请使用 `xlang=True` 重新构建，在每个对等端注册可移植 Schema，并避免使用 lambda 或本地类等仅限 Python 的值。

### 动态类或函数反序列化失败

对可信载荷使用 `strict=False`；只应接受选定动态类型时，提供反序列化 `policy=`。

### 循环无法往返保留

创建 `Fory` 实例时设置 `ref=True`。

### 值依赖 pickle 钩子

保持载荷使用原生模式。跨语言模式不会执行 Python `__reduce__`、`__reduce_ex__`、`__getstate__` 或 `__setstate__` 对象重建钩子。

## 相关主题

- [跨语言序列化](basic-serialization.md#cross-language-interoperability) - 跨语言 Python 载荷
- [配置](configuration.md) - Python `Fory` 选项
- [带外序列化](out-of-band.md) - 零拷贝缓冲区支持
- [Python 安全](security.md) - 反序列化策略
