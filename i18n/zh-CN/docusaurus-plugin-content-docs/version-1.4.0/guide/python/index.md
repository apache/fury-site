---
title: Python 序列化指南
sidebar_position: 0
id: serialization_index
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

**Apache Fory™** 是一个极速的多语言序列化框架，基于 **JIT 编译**和**零拷贝**技术，在保持易用性和安全性的同时提供**超高性能**。

`pyfory` 提供 Apache Fory™ 的 Python 实现，为数据处理任务提供高性能对象序列化和先进的行格式能力。

## 核心特性

### 灵活的序列化模式

- **Python 原生模式**：完全 Python 兼容，可替代 pickle/cloudpickle
- **跨语言模式**：针对多语言数据交换优化
- **行格式**：用于分析工作负载的零拷贝行格式

### 多功能序列化特性

- **共享/循环引用支持**：在 Python 原生和跨语言模式中支持复杂对象图
- **多态支持**：自定义类型的自动类型分发
- **Schema 演化支持**：在跨语言模式下使用 dataclass 时的向后/向前兼容性
- **带外缓冲区支持**：零拷贝序列化大型数据结构（如 NumPy 数组和 Pandas DataFrame），兼容 pickle 协议 5

### 极速性能

- **超快性能**：相比其他序列化框架
- **运行时代码生成**和 **Cython 加速**的核心实现，实现最优性能

### 紧凑数据大小

- **紧凑的对象图协议**：最小空间开销——相比 pickle/cloudpickle 减少高达 3 倍大小
- **元数据打包与共享**：最小化类型向前/向后兼容性的空间开销

### 安全性与安全

- **严格模式**：通过类型注册和检查防止反序列化不受信任的类型
- **引用跟踪**：安全处理循环引用

## 安装

### 基础安装

```bash
pip install pyfory
```

### 可选依赖

```bash
# 安装行格式支持（需要 Apache Arrow）
pip install pyfory[format]

# 从源码安装用于开发
git clone https://github.com/apache/fory.git
cd fory/python
pip install -e ".[dev,format]"
```

### 系统要求

- **Python**：3.8 或更高版本
- **操作系统**：Linux、macOS、Windows

## 线程安全

`pyfory` 提供 `ThreadSafeFory` 用于线程安全序列化，使用线程本地存储：

```python
import pyfory
import threading
from dataclasses import dataclass

@dataclass
class Person:
    name: str
    age: int

# 创建线程安全的 Fory 实例
fory = pyfory.ThreadSafeFory(xlang=False, ref=True)
fory.register(Person)

# 在多线程中安全使用
def serialize_in_thread(thread_id):
    person = Person(name=f"User{thread_id}", age=25 + thread_id)
    data = fory.serialize(person)
    result = fory.deserialize(data)
    print(f"Thread {thread_id}: {result}")

threads = [threading.Thread(target=serialize_in_thread, args=(i,)) for i in range(10)]
for t in threads: t.start()
for t in threads: t.join()
```

**核心特性：**

- **实例池**：维护一个受锁保护的 `Fory` 实例池，确保线程安全
- **共享配置**：所有注册必须预先完成，并应用于所有实例
- **相同 API**：与 `Fory` 类相同的方法，可直接替换
- **注册安全**：防止首次使用后注册，确保一致性

**适用场景：**

- **多线程应用程序**：Web 服务器、并发工作线程、并行处理
- **共享 Fory 实例**：当多个线程需要序列化/反序列化数据时
- **线程池**：使用线程池或 concurrent.futures 的应用程序

## 快速开始

```python
import pyfory
from dataclasses import dataclass

@dataclass
class Person:
    name: str
    age: int

# 创建 Fory 实例
fory = pyfory.Fory(xlang=False, ref=True)
fory.register(Person)

person = Person("Alice", 30)
data = fory.serialize(person)
result = fory.deserialize(data)
print(result)  # Person(name='Alice', age=30)
```

## 后续步骤

- [配置](configuration.md) - Fory 参数和模式
- [基础序列化](basic-serialization.md) - 基础使用模式
- [Python 原生模式](native-serialization.md) - 函数、lambda、类
- [跨语言](xlang-serialization.md) - XLANG 模式
- [行格式](row-format.md) - 零拷贝行格式
- [安全性](configuration.md) - 安全最佳实践

## 链接

- **文档**：https://fory.apache.org/docs/latest/python_guide/
- **GitHub**：https://github.com/apache/fory
- **PyPI**：https://pypi.org/project/pyfory/
- **问题反馈**：https://github.com/apache/fory/issues
- **Slack**：https://join.slack.com/t/fory-project/shared_invite/zt-36g0qouzm-kcQSvV_dtfbtBKHRwT5gsw
