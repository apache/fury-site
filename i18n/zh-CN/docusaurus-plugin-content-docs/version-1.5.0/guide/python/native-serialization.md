---
title: 原生序列化
sidebar_position: 3
id: native_serialization
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

`pyfory` 提供了 Python 原生序列化模式，提供与 pickle/cloudpickle 相同的功能，但具有**显著更好的性能、更小的数据大小和增强的安全特性**。

## 概述

二进制协议和 API 与 Fory 的 xlang 模式类似，但 Python 原生模式可以序列化任何 Python 对象——包括全局函数、局部函数、lambda、局部类以及使用 `__getstate__/__reduce__/__reduce_ex__` 自定义序列化的类型，这些在 xlang 模式中是不允许的。

要使用 Python 原生模式，创建 `Fory` 时设置 `xlang=False`：

```python
import pyfory
fory = pyfory.Fory(xlang=False, ref=False, strict=True)
```

## 可直接替代 Pickle/Cloudpickle

`pyfory` 可以使用以下配置序列化任何 Python 对象：

- **对于循环引用**：设置 `ref=True` 启用引用跟踪
- **对于函数/类**：设置 `strict=False` 允许反序列化动态类型

**⚠️ 安全警告**：当 `strict=False` 时，Fory 将反序列化任意类型，如果数据来自不受信任的源，这可能带来安全风险。仅在完全信任数据源的受控环境中使用 `strict=False`。

### 常见用法

```python
import pyfory

# 创建 Fory 实例
fory = pyfory.Fory(xlang=False, ref=True, strict=False)

# 序列化常见 Python 对象
data = fory.dumps({"name": "Alice", "age": 30, "scores": [95, 87, 92]})
print(fory.loads(data))

# 序列化自定义对象
from dataclasses import dataclass

@dataclass
class Person:
    name: str
    age: int

person = Person("Bob", 25)
data = fory.dumps(person)
print(fory.loads(data))  # Person(name='Bob', age=25)
```

## 序列化全局函数

捕获并序列化在模块级别定义的函数。Fory 反序列化并返回相同的函数对象：

```python
import pyfory

fory = pyfory.Fory(xlang=False, ref=True, strict=False)

def my_global_function(x):
    return 10 * x

data = fory.dumps(my_global_function)
print(fory.loads(data)(10))  # 100
```

## 序列化局部函数/Lambda

序列化带闭包的函数和 lambda 表达式。Fory 自动捕获闭包变量：

```python
import pyfory

fory = pyfory.Fory(xlang=False, ref=True, strict=False)

# 带闭包的局部函数
def my_function():
    local_var = 10
    def local_func(x):
        return x * local_var
    return local_func

data = fory.dumps(my_function())
print(fory.loads(data)(10))  # 100

# Lambda
data = fory.dumps(lambda x: 10 * x)
print(fory.loads(data)(10))  # 100
```

## 序列化全局类/方法

序列化类对象、实例方法、类方法和静态方法：

```python
from dataclasses import dataclass
import pyfory
fory = pyfory.Fory(xlang=False, ref=True, strict=False)

@dataclass
class Person:
    name: str
    age: int

    def f(self, x):
        return self.age * x

    @classmethod
    def g(cls, x):
        return 10 * x

    @staticmethod
    def h(x):
        return 10 * x

# 序列化全局类
print(fory.loads(fory.dumps(Person))("Bob", 25))  # Person(name='Bob', age=25)

# 序列化实例方法
print(fory.loads(fory.dumps(Person("Bob", 20).f))(10))  # 200

# 序列化类方法
print(fory.loads(fory.dumps(Person.g))(10))  # 100

# 序列化静态方法
print(fory.loads(fory.dumps(Person.h))(10))  # 100
```

## 序列化局部类/方法

序列化在函数内定义的类及其方法：

```python
from dataclasses import dataclass
import pyfory
fory = pyfory.Fory(xlang=False, ref=True, strict=False)

def create_local_class():
    class LocalClass:
        def f(self, x):
            return 10 * x

        @classmethod
        def g(cls, x):
            return 10 * x

        @staticmethod
        def h(x):
            return 10 * x
    return LocalClass

# 序列化局部类
data = fory.dumps(create_local_class())
print(fory.loads(data)().f(10))  # 100

# 序列化局部类实例方法
data = fory.dumps(create_local_class()().f)
print(fory.loads(data)(10))  # 100

# 序列化局部类方法
data = fory.dumps(create_local_class().g)
print(fory.loads(data)(10))  # 100

# 序列化局部类静态方法
data = fory.dumps(create_local_class().h)
print(fory.loads(data)(10))  # 100
```

## 性能比较

```python
import pyfory
import pickle
import timeit

fory = pyfory.Fory(xlang=False, ref=True, strict=False)

obj = {f"key{i}": f"value{i}" for i in range(10000)}
print(f"Fory: {timeit.timeit(lambda: fory.dumps(obj), number=1000):.3f}s")
print(f"Pickle: {timeit.timeit(lambda: pickle.dumps(obj), number=1000):.3f}s")
```

## 相关主题

- [配置](configuration.md) - Python 模式配置
- [带外序列化](out-of-band.md) - 零拷贝缓冲区
- [安全性](configuration.md) - DeserializationPolicy
