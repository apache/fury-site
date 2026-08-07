---
title: 函数、类与方法
sidebar_position: 9
id: functions-classes-methods
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

Python 原生模式可以序列化跨语言类型系统之外的 Python 专用可调用对象和类型值。仅对可信载荷使用 `strict=False`；需要限制可接受的动态范围时，请应用反序列化策略。

## 序列化全局函数

捕获并序列化在模块级定义的函数。Fory 反序列化后会返回同一个函数对象：

```python
import pyfory

fory = pyfory.Fory(xlang=False, ref=True, strict=False)

def my_global_function(x):
    return 10 * x

data = fory.dumps(my_global_function)
print(fory.loads(data)(10))  # 100
```

## 序列化本地函数与 Lambda

序列化带闭包的函数和 lambda 表达式。Fory 会自动捕获闭包变量：

```python
import pyfory

fory = pyfory.Fory(xlang=False, ref=True, strict=False)

# Local functions with closures
def my_function():
    local_var = 10
    def local_func(x):
        return x * local_var
    return local_func

data = fory.dumps(my_function())
print(fory.loads(data)(10))  # 100

# Lambdas
data = fory.dumps(lambda x: 10 * x)
print(fory.loads(data)(10))  # 100
```

## 序列化全局类与方法

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

# Serialize global class
print(fory.loads(fory.dumps(Person))("Bob", 25))  # Person(name='Bob', age=25)

# Serialize instance method
print(fory.loads(fory.dumps(Person("Bob", 20).f))(10))  # 200

# Serialize class method
print(fory.loads(fory.dumps(Person.g))(10))  # 100

# Serialize static method
print(fory.loads(fory.dumps(Person.h))(10))  # 100
```

## 序列化本地类与方法

序列化函数内部定义的类及其方法：

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

# Serialize local class
data = fory.dumps(create_local_class())
print(fory.loads(data)().f(10))  # 100

# Serialize local class instance method
data = fory.dumps(create_local_class()().f)
print(fory.loads(data)(10))  # 100

# Serialize local class method
data = fory.dumps(create_local_class().g)
print(fory.loads(data)(10))  # 100

# Serialize local class static method
data = fory.dumps(create_local_class().h)
print(fory.loads(data)(10))  # 100
```
