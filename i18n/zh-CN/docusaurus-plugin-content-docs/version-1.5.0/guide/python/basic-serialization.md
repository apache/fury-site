---
title: 基础序列化
sidebar_position: 2
id: basic_serialization
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

本页介绍 pyfory 中的基础序列化模式。

## 基础对象序列化

使用简单的 API 序列化和反序列化 Python 对象：

```python
import pyfory

# 创建 Fory 实例
fory = pyfory.Fory(xlang=True)

# 序列化任何 Python 对象
data = fory.dumps({"name": "Alice", "age": 30, "scores": [95, 87, 92]})

# 反序列化回 Python 对象
obj = fory.loads(data)
print(obj)  # {'name': 'Alice', 'age': 30, 'scores': [95, 87, 92]}
```

**注意**：`dumps()`/`loads()` 是 `serialize()`/`deserialize()` 的别名。两个 API 完全相同，使用任何一个都可以。

## 自定义类序列化

Fory 自动处理 dataclass 和自定义类型：

```python
import pyfory
from dataclasses import dataclass
from typing import List, Dict

@dataclass
class Person:
    name: str
    age: int
    scores: List[int]
    metadata: Dict[str, str]

# Python 模式 - 支持所有 Python 类型，包括 dataclass
fory = pyfory.Fory(xlang=False, ref=True)
fory.register(Person)
person = Person("Bob", 25, [88, 92, 85], {"team": "engineering"})
data = fory.serialize(person)
result = fory.deserialize(data)
print(result)  # Person(name='Bob', age=25, ...)
```

## 引用跟踪和循环引用

安全处理共享引用和循环依赖：

```python
import pyfory

f = pyfory.Fory(ref=True)  # 启用引用跟踪

# 安全处理循环引用
class Node:
    def __init__(self, value):
        self.value = value
        self.children = []
        self.parent = None

root = Node("root")
child = Node("child")
child.parent = root  # 循环引用
root.children.append(child)

# 序列化不会导致无限递归
data = f.serialize(root)
result = f.deserialize(data)
assert result.children[0].parent is result  # 引用被保留
```

## API 参考

### 序列化方法

```python
# 序列化为字节
data: bytes = fory.serialize(obj)
data: bytes = fory.dumps(obj)  # 别名

# 从字节反序列化
obj = fory.deserialize(data)
obj = fory.loads(data)  # 别名
```

### 使用带外缓冲区

```python
# 使用缓冲区回调序列化
buffer_objects = []
data = fory.serialize(obj, buffer_callback=buffer_objects.append)

# 使用缓冲区反序列化
buffers = [obj.getbuffer() for obj in buffer_objects]
obj = fory.deserialize(data, buffers=buffers)
```

## 性能提示

1. **如果不需要则禁用 `ref=True`**：引用跟踪有开销
2. **使用 type_id 而不是 typename**：整数 ID 比字符串名称更快
3. **重用 Fory 实例**：创建一次，多次使用
4. **启用 Cython**：确保 `ENABLE_FORY_CYTHON_SERIALIZATION=1`

```python
# 好：重用实例
fory = pyfory.Fory()
for obj in objects:
    data = fory.dumps(obj)

# 坏：每次创建新实例
for obj in objects:
    fory = pyfory.Fory()  # 浪费！
    data = fory.dumps(obj)
```

## 相关主题

- [配置](configuration.md) - Fory 参数
- [类型注册](type-registration.md) - 注册模式
- [Python 原生模式](native-serialization.md) - 函数和 lambda
