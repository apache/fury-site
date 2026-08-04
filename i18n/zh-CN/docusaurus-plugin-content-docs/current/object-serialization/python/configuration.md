---
title: 配置
sidebar_position: 4
id: configuration
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

本页介绍 Python Fory 实例配置。`pyfory.Fory()` 默认使用支持兼容 Schema 演进的跨语言模式。通过 `xlang=False` 显式选择原生模式；该模式也默认支持兼容 Schema 演进。

## Fory 类

主要序列化接口：

```python
class Fory:
    def __init__(
        self,
        xlang: bool = True,
        ref: bool = False,
        strict: bool = True,
        compatible: Optional[bool] = None,
        max_depth: int = 50,
        max_type_fields: int = 512,
        max_type_meta_bytes: int = 4096,
        max_schema_versions_per_type: int = 10,
        max_average_schema_versions_per_type: int = 3,
        max_graph_memory_bytes: int = 128 * 1024 * 1024,
        max_unbacked_container_items: int = 8192,
        policy: DeserializationPolicy = None,
        field_nullable: bool = False,
        meta_compressor=None,
    )
```

## ThreadSafeFory 类

使用池化包装器的线程安全序列化接口：

```python
class ThreadSafeFory:
    def __init__(
        self, fory_factory=None, **kwargs
    )
```

## 参数

| 参数                                   | 类型                            | 默认值      | 说明                                                                                                                 |
| -------------------------------------- | ------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------- |
| `xlang`                                | `bool`                          | `True`      | 使用跨语言模式。Python 原生模式设置为 `False`。                                                                      |
| `ref`                                  | `bool`                          | `False`     | 为共享引用/循环引用启用引用跟踪。如果数据没有共享引用，禁用可获得更好性能。                                          |
| `strict`                               | `bool`                          | `True`      | 加载应用类前要求注册。兼容的未知 Struct 使用纯数据 `UnknownStruct` 载体。                                            |
| `compatible`                           | `bool \| None`                  | `None`      | Schema 演进模式。`None` 在跨语言和原生模式中都启用兼容模式。仅当每个读取端和写入端使用相同 Schema 时才设置 `False`。 |
| `max_depth`                            | `int`                           | `50`        | 安全用途的最大反序列化深度，用于防止栈溢出攻击。                                                                     |
| `max_type_fields`                      | `int`                           | `512`       | 单个已接收远程结构体元数据正文可接受的最大字段数。                                                                   |
| `max_type_meta_bytes`                  | `int`                           | `4096`      | 单个已接收 TypeDef 正文可接受的最大编码字节数，不含 8 字节头部和扩展长度 varint。                                    |
| `max_schema_versions_per_type`         | `int`                           | `10`        | 每个逻辑类型可接受的远程元数据版本上限。                                                                             |
| `max_average_schema_versions_per_type` | `int`                           | `3`         | 所有已接受远程类型的平均远程元数据版本数。有效的全局下限为 `8192` 个 Schema。                                        |
| `max_graph_memory_bytes`               | `int`                           | `134217728` | 单次根反序列化的近似对象图内存门限。显式非正值会被拒绝。                                                             |
| `max_unbacked_container_items`         | `int`                           | `8192`      | 重复读取没有相应输入进度支撑的集合元素和映射条目的最大数量。零表示严格限制。                                         |
| `policy`                               | `DeserializationPolicy \| None` | `None`      | 用于安全检查的反序列化策略。设置 `strict=False` 时强烈建议配置。                                                     |
| `field_nullable`                       | `bool`                          | `False`     | 默认将 dataclass 字段视为可空。                                                                                      |
| `meta_compressor`                      | `Any`                           | `None`      | 用于兼容模式元数据编码的可选元数据压缩器。                                                                           |
| `fory_factory`                         | `Callable \| None`              | `None`      | `ThreadSafeFory` 工厂钩子。设置后，`ThreadSafeFory` 通过该回调创建实例；否则将 `**kwargs` 转发给 `Fory` 构造过程。   |

## 主要方法

```python
# Serialization (serialize/deserialize are identical to dumps/loads)
data: bytes = fory.serialize(obj)
obj = fory.deserialize(data)

# Alternative API (aliases)
data: bytes = fory.dumps(obj)
obj = fory.loads(data)

# Type registration by id
fory.register(MyClass, type_id=123)
fory.register(MyClass, type_id=123, serializer=custom_serializer)

# Type registration by name
fory.register(MyClass, name="my.package.MyClass")
fory.register(MyClass, name="my.package.MyClass", serializer=custom_serializer)
```

## 跨语言模式与原生模式对比

| 功能             | 原生模式（`xlang=False`） | 跨语言模式（默认）                                                            |
| ---------------- | ------------------------- | ----------------------------------------------------------------------------- |
| 使用场景         | 仅限 Python 的应用        | 多语言系统                                                                    |
| 兼容性           | 仅 Python                 | Java、C++、Go、Rust、JavaScript/TypeScript、C#、Swift、Dart、Scala、Kotlin 等 |
| 支持的类型       | Python 对象范围           | 跨语言兼容类型                                                                |
| 函数/lambda      | 通过可信动态反序列化支持  | 不允许                                                                        |
| 本地类           | 通过可信动态反序列化支持  | 不允许                                                                        |
| 动态类           | 通过可信动态反序列化支持  | 不允许                                                                        |
| 默认 Schema 模式 | 兼容                      | 兼容                                                                          |

## 跨语言模式

跨语言模式是默认模式，将载荷限制为不同 Fory 实现之间兼容的类型：

```python
import pyfory

fory = pyfory.Fory(xlang=True, ref=True)
fory.register(MyDataClass, name="com.example.MyDataClass")
data = fory.serialize(MyDataClass(field1="value", field2=42))
```

仅当每个读取端和写入端始终使用相同 Schema，并且希望获得更快速度和更小体积时，才对跨语言载荷使用 `compatible=False`。只有在确认每种语言都使用该 Schema，或原生类型由 Fory Schema IDL 生成时才使用它。

## 原生模式

```python
import pyfory

fory = pyfory.Fory(xlang=False, ref=True, strict=False)
```

原生模式支持函数、本地类、方法、`__reduce__` 和 `__getstate__` 等 Python 专用对象功能。兼容模式仍默认启用。仅当每个读取端和写入端始终使用相同的 Python 类 Schema，并且希望获得更快速度和更小体积时，才设置 `compatible=False`。

## 兼容模式

跨语言模式和原生模式都默认启用兼容模式。当 Python 类可能独立演进、服务分别部署，或不同语言手写跨语言 Schema 时，请保留该默认设置。

对于跨语言载荷，只有在确认每种语言使用相同 Schema，或原生类型由 Fory Schema IDL 生成时，才设置 `compatible=False`。

## 配置示例

### 跨语言服务

```python
import pyfory

fory = pyfory.Fory(
    xlang=True,
    ref=False,
    strict=True,
    max_depth=20,
)

fory.register(UserModel, name="example.User")
```

### 带动态类型的原生模式

```python
import pyfory

fory = pyfory.Fory(
    xlang=False,
    ref=True,
    strict=False,
    max_depth=1000,
)
```

仅对可信数据使用 `strict=False`，并最好同时配置 `policy=` 反序列化策略。

## 安全

有关信任边界、安全的读取端配置和验证方法，请参阅 [Python 安全](security.md)。

## 相关主题

- [基础序列化](basic-serialization.md) - 使用配置后的 Fory
- [类型注册](type-registration.md) - 注册模式
- [原生序列化](native.md) - 仅限 Python 的对象序列化
