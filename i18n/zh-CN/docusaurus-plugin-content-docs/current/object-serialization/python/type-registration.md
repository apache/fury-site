---
title: 类型注册
sidebar_position: 5
id: type-registration
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

本页介绍 Python 类型注册 API。严格模式策略、最大深度限制和可信数据指南参见
[Python 安全](security.md)。

## 类型注册

按类型名注册跨语言类，使其他语言能够解析相同的 Schema 标识：

```python
from dataclasses import dataclass
import pyfory

fory = pyfory.Fory(xlang=True, strict=True)

@dataclass
class User:
    name: str
    age: pyfory.Int32

fory.register(User, name="example.User")
```

对于 Python 原生模式，数字类型 ID 是紧凑的同语言注册方式：

```python
import pyfory

fory = pyfory.Fory(xlang=False, strict=True)
fory.register(MyClass, type_id=100)
```

## 注册模式

使用与载荷契约匹配的注册形式：

```python
# Xlang: stable name identity
fory.register(MyClass, name="com.example.MyClass")

# Native mode: compact numeric identity
fory.register(MyClass, type_id=100)

# Custom serializer
fory.register(MyClass, type_id=100, serializer=MySerializer(fory.type_resolver, MyClass))

# Batch registration
type_id = 100
for model_class in [User, Order, Product, Invoice]:
    fory.register(model_class, type_id=type_id)
    type_id += 1
```

## 与严格模式的关系

设置 `strict=True` 后，Fory 只加载并实例化已注册的应用类。请在序列化或反序列化载荷前注册应用类，并在共享这些载荷的每个对等端保持相同的注册 ID 或名称。

兼容元数据有一个仅数据例外：远程 Struct 没有本地注册时，反序列化会返回框架固定的 `pyfory.UnknownStruct` 值，而不是加载或生成发送端的类。应用需要具体应用对象时，请在本地注册该类。

## 相关主题

- [配置](configuration.md) - Fory 参数
- [Python 安全](security.md) - 严格模式、反序列化策略和最大读取深度
- [自定义序列化器](custom-serializers.md) - 自定义序列化
