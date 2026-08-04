---
title: 基础序列化
sidebar_position: 3
id: core-api
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

本页介绍 Python 跨语言模式快速入门。`pyfory.Fory()` 默认使用支持兼容 Schema 演进的跨语言模式；示例会显式设置 `xlang=True`，以清楚表达模式选择。

## 基础对象序列化

使用简单的 API 序列化和反序列化 Python 对象：

```python
import pyfory

fory = pyfory.Fory(xlang=True)

# Serialize xlang-compatible values
data = fory.dumps({"name": "Alice", "age": 30, "scores": [95, 87, 92]})

# Deserialize back to Python object
obj = fory.loads(data)
print(obj)  # {'name': 'Alice', 'age': 30, 'scores': [95, 87, 92]}
```

**注意**：`dumps()`/`loads()` 是 `serialize()`/`deserialize()` 的别名。两组 API 完全相同，可选择更直观的一组。

## 自定义类序列化

使用 dataclass 和类型注解构建稳定的跨语言载荷：

```python
import pyfory
from dataclasses import dataclass
from typing import List, Dict

@dataclass
class Person:
    name: str
    age: pyfory.Int32
    scores: List[pyfory.Int32]
    metadata: Dict[str, str]

fory = pyfory.Fory(xlang=True, ref=True)
fory.register(Person, name="example.Person")
person = Person("Bob", 25, [88, 92, 85], {"team": "engineering"})
data = fory.serialize(person)
result = fory.deserialize(data)
print(result)  # Person(name='Bob', age=25, ...)
```

## 引用跟踪与循环引用

载荷使用跨语言兼容类型时，可以安全处理重复引用：

```python
import pyfory

f = pyfory.Fory(xlang=True, ref=True)

shared = ["shared"]
value = [shared, shared]

data = f.serialize(value)
result = f.deserialize(data)
assert result[0] is result[1]
```

任意 Python 对象图、本地类、函数和方法应使用[原生序列化](native.md)。

## 性能技巧

1. **不需要时禁用 `ref=True`**：引用跟踪存在开销
2. **使用 type_id 而非 name**：整数 ID 比字符串名称更快
3. **复用 Fory 实例**：创建一次，多次使用
4. **启用 Cython**：确保设置 `ENABLE_FORY_CYTHON_SERIALIZATION=1`

```python
# Good: Reuse instance
fory = pyfory.Fory(xlang=True)
for obj in objects:
    data = fory.dumps(obj)

# Bad: Create new instance each time
for obj in objects:
    fory = pyfory.Fory(xlang=True)  # Wasteful!
    data = fory.dumps(obj)
```

## 相关主题

- [配置](configuration.md) - Fory 参数
- [类型注册](type-registration.md) - 注册模式
- [原生序列化](native.md) - 函数与 lambda
- [带外序列化](out-of-band.md) - 缓冲区回调 API
