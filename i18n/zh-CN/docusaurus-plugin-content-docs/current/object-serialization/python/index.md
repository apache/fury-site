---
title: Python 对象序列化
sidebar_position: 0
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

**Apache Fory™** 是由 **JIT 编译**和**零拷贝**技术驱动的高速多语言序列化框架，在保持易用性与安全性的同时提供**卓越性能**。

`pyfory` 是 Apache Fory™ 的 Python 实现，为跨语言载荷提供跨语言模式，也为仅限 Python 的对象序列化提供原生模式。

## 主要功能

### 灵活的序列化模式

- **跨语言模式**：默认的跨语言编码格式，支持兼容 Schema 演进
- **Python 原生模式**：同语言模式，可直接替代 pickle/cloudpickle

### 丰富的序列化功能

- **引用跟踪**：支持共享的跨语言 Schema 对象和 Python 原生模式循环对象图
- **多态支持**：为自定义类型提供自动类型分派
- **Schema 演进**：跨语言模式使用 dataclass 时支持向后/向前兼容
- **带外缓冲区支持**：兼容 pickle 协议 5，可对 NumPy 数组和 Pandas DataFrame 等大型数据结构进行零拷贝序列化

### 高速性能

- 与其他序列化框架相比具有**极高性能**
- 通过**运行时代码生成**和 **Cython 加速**的核心实现获得最佳性能

### 紧凑的数据体积

- **紧凑的对象图协议**将空间开销降至最低——与 pickle/cloudpickle 相比，体积最多缩小 3 倍
- **元数据打包与共享**尽量降低类型向前/向后兼容的空间开销

### 安全性

- **严格模式**通过类型注册与检查阻止反序列化不可信类型。
- **引用跟踪**用于安全处理循环引用

## 安装

### 基本安装

```bash
pip install pyfory
```

可选的 Apache Arrow 依赖和 Row API 参见 [Python Row Format 指南](../../row-format/python.md)。

如需从源码开发，请克隆仓库并安装开发附加依赖：

```bash
git clone https://github.com/apache/fory.git
cd fory/python
pip install -e ".[dev]"
```

### 环境要求

- **Python**：3.8 或更高版本
- **操作系统**：Linux、macOS、Windows

## 线程安全

`pyfory` 提供 `ThreadSafeFory`，通过池化包装器实现线程安全序列化：

```python
import pyfory
import threading
from dataclasses import dataclass

@dataclass
class Person:
    name: str
    age: int

# Create a thread-safe xlang Fory instance
fory = pyfory.ThreadSafeFory(xlang=True, ref=True)
fory.register(Person)

# Use in multiple threads safely
def serialize_in_thread(thread_id):
    person = Person(name=f"User{thread_id}", age=25 + thread_id)
    data = fory.serialize(person)
    result = fory.deserialize(data)
    print(f"Thread {thread_id}: {result}")

threads = [threading.Thread(target=serialize_in_thread, args=(i,)) for i in range(10)]
for t in threads: t.start()
for t in threads: t.join()
```

**主要功能：**

- **实例池**：维护由锁保护的 `Fory` 实例池，以保证线程安全
- **共享配置**：所有注册都必须预先完成，并应用到全部实例
- **相同 API**：方法完全相同，可直接替代 `Fory` 类
- **注册安全**：首次使用后禁止注册，以保证一致性

**使用场景：**

- **多线程应用**：Web 服务器、并发工作进程、并行处理
- **共享 Fory 实例**：多个线程需要序列化/反序列化数据时
- **线程池**：使用线程池或 concurrent.futures 的应用

## 快速入门

```python
import pyfory
from dataclasses import dataclass

@dataclass
class Person:
    name: str
    age: int

# Create an xlang Fory instance
fory = pyfory.Fory(xlang=True, ref=True)
fory.register(Person)

person = Person("Alice", 30)
data = fory.serialize(person)
result = fory.deserialize(data)
print(result)  # Person(name='Alice', age=30)
```

## 跨语言模式与原生模式

跨语言载荷以及与其他 Fory 实现共享的 dataclass Schema 使用跨语言模式。跨语言模式是 Python 默认编码模式；相关 Python 示例会显式设置 `xlang=True`，以清楚表达模式选择。

仅限 Python 的流量使用原生模式。通过 `xlang=False` 选择原生模式；该模式负责函数、lambda、类、方法、`__reduce__`、`__getstate__` 以及 pickle 协议 5 带外缓冲区等 pickle/cloudpickle 风格行为。它针对 Python 类型系统优化，支持比跨语言模式更广泛的 Python 对象，因此适合替代 pickle 或 cloudpickle。兼容模式默认启用。仅当每个读取端和写入端都使用相同的 Python 类 Schema，并且希望获得更快速度和更小体积时，才设置 `compatible=False`。

仅限 Python 的序列化详情参见[原生序列化](native.md)，Python 跨语言注册与互操作规则参见[跨语言序列化](core-api.md#cross-language-interoperability)。

## 后续阅读

- [基础序列化](core-api.md) - 基本使用模式
- [原生序列化](native.md) - 仅限 Python 的序列化
- [配置](configuration.md) - Fory 参数、模式与安全
- [类型注册](type-registration.md) - 用户定义类型注册
- [自定义序列化器](custom-serializers.md) - 扩展序列化行为
- [Row Format](../../row-format/python.md) - 零拷贝行格式
- [gRPC 支持](../../grpc/python.md) - 通过 grpcio 传输 Fory 载荷

## 链接

- **文档**：https://fory.apache.org/docs/object-serialization/python/
- **GitHub**: https://github.com/apache/fory
- **PyPI**: https://pypi.org/project/pyfory/
- **问题跟踪**：https://github.com/apache/fory/issues
- **Slack**: https://join.slack.com/t/fory-project/shared_invite/zt-36g0qouzm-kcQSvV_dtfbtBKHRwT5gsw
