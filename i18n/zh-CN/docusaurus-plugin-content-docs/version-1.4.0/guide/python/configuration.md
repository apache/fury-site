---
title: 配置
sidebar_position: 1
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

本页介绍 Fory 配置参数和语言模式。

## Fory 类

主要序列化接口：

```python
class Fory:
    def __init__(
        self,
        xlang: bool = False,
        ref: bool = False,
        strict: bool = True,
        compatible: bool = False,
        max_depth: int = 50,
        max_type_fields: int = 512,
        max_type_meta_bytes: int = 4096,
        max_schema_versions_per_type: int = 10,
        max_average_schema_versions_per_type: int = 3,
        max_graph_memory_bytes: int = 128 * 1024 * 1024,
    )
```

## ThreadSafeFory 类

使用线程本地存储的线程安全序列化接口：

```python
class ThreadSafeFory:
    def __init__(
        self,
        xlang: bool = False,
        ref: bool = False,
        strict: bool = True,
        compatible: bool = False,
        max_depth: int = 50,
        max_type_fields: int = 512,
        max_type_meta_bytes: int = 4096,
        max_schema_versions_per_type: int = 10,
        max_average_schema_versions_per_type: int = 3,
        max_graph_memory_bytes: int = 128 * 1024 * 1024,
    )
```

## 参数

| 参数                                   | 类型   | 默认值  | 描述                                                                                                                                    |
| -------------------------------------- | ------ | ------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `xlang`                                | `bool` | `False` | 启用跨语言序列化。当为 `False` 时，启用 Python 原生模式，支持所有 Python 对象。当为 `True` 时，启用跨语言模式，兼容 Java、Go、Rust 等。 |
| `ref`                                  | `bool` | `False` | 启用引用跟踪以支持共享/循环引用。如果数据没有共享引用，禁用此选项可获得更好性能。                                                       |
| `strict`                               | `bool` | `True`  | 出于安全考虑需要类型注册。**生产环境强烈推荐**。仅在受信任的环境中禁用。                                                                |
| `compatible`                           | `bool` | `False` | 在跨语言模式中启用 schema 演化，允许在保持兼容性的同时添加/删除字段。                                                                   |
| `max_depth`                            | `int`  | `50`    | 反序列化的最大深度，用于安全防护，防止栈溢出攻击。                                                                                      |
| `max_type_fields`                      | `int`  | `512`   | 一个收到的远端 struct metadata body 中可接受的最大字段数。                                                                              |
| `max_type_meta_bytes`                  | `int`  | `4096`  | 一个收到的 TypeDef body 可接受的最大编码 body 字节数，不包含 8 字节 header 和扩展 size varint。                                         |
| `max_schema_versions_per_type`         | `int`  | `10`    | 一个逻辑类型可接受的最大远端 metadata 版本数。                                                                                          |
| `max_average_schema_versions_per_type` | `int`  | `3`     | 所有已接受远端类型的平均 metadata 版本数限制；有效全局下限为 `8192` 个 schema。                                                         |
| `max_graph_memory_bytes`               | `int`  | `134217728` | 单次根对象反序列化的近似对象图内存阈值。显式传入非正数值会被拒绝。                                                                   |

## 核心方法

```python
# 序列化（serialize/deserialize 与 dumps/loads 完全相同）
data: bytes = fory.serialize(obj)
obj = fory.deserialize(data)

# 替代 API（别名）
data: bytes = fory.dumps(obj)
obj = fory.loads(data)

# 按 ID 注册类型（用于 Python 模式）
fory.register(MyClass, type_id=123)
fory.register(MyClass, type_id=123, serializer=custom_serializer)

# 按名称注册类型（用于跨语言模式）
fory.register(MyClass, typename="my.package.MyClass")
fory.register(MyClass, typename="my.package.MyClass", serializer=custom_serializer)
```

## 语言模式比较

| 特性            | Python 模式 (`xlang=False`)      | 跨语言模式 (`xlang=True`)          |
| --------------- | -------------------------------- | ---------------------------------- |
| **使用场景**    | 纯 Python 应用                   | 多语言系统                         |
| **兼容性**      | 仅限 Python                      | Java、Go、Rust、C++、JavaScript 等 |
| **支持的类型**  | 所有 Python 类型                 | 仅限跨语言兼容类型                 |
| **函数/Lambda** | ✓ 支持                           | ✗ 不允许                           |
| **本地类**      | ✓ 支持                           | ✗ 不允许                           |
| **动态类**      | ✓ 支持                           | ✗ 不允许                           |
| **Schema 演化** | ✓ 支持（需要 `compatible=True`） | ✓ 支持（需要 `compatible=True`）   |
| **性能**        | 极快                             | 非常快                             |
| **数据大小**    | 紧凑                             | 紧凑（带类型元数据）               |

## Python 模式 (`xlang=False`)

Python 模式支持所有 Python 类型，包括函数、类和闭包：

```python
import pyfory

# 完全 Python 兼容模式
fory = pyfory.Fory(xlang=False, ref=True, strict=False)

# 支持所有 Python 对象：
data = fory.dumps({
    'function': lambda x: x * 2,        # 函数和 lambda
    'class': type('Dynamic', (), {}),    # 动态类
    'method': str.upper,                # 方法
    'nested': {'circular_ref': None}    # 循环引用（当 ref=True 时）
})

# 可直接替代 pickle/cloudpickle
import pickle
obj = [1, 2, {"nested": [3, 4]}]
assert fory.loads(fory.dumps(obj)) == pickle.loads(pickle.dumps(obj))
```

## 跨语言模式 (`xlang=True`)

跨语言模式将类型限制为所有 Fory 实现间兼容的类型：

```python
import pyfory

# 跨语言兼容模式
f = pyfory.Fory(xlang=True, ref=True)

# 仅支持跨语言兼容类型
f.register(MyDataClass, typename="com.example.MyDataClass")

# 数据可以被 Java、Go、Rust 等读取
data = f.serialize(MyDataClass(field1="value", field2=42))
```

## 示例配置

### 生产环境配置

```python
import pyfory

# 生产环境推荐设置
fory = pyfory.Fory(
    xlang=False,        # 如果需要跨语言支持则使用 True
    ref=False,          # 如果有共享/循环引用则启用
    strict=True,        # 关键：生产环境始终为 True
    compatible=False,   # 仅在需要 schema 演化时启用
    max_depth=20,       # 根据数据结构深度调整
    max_type_fields=512,
    max_type_meta_bytes=4096,
    max_schema_versions_per_type=10,
    max_average_schema_versions_per_type=3,
    max_graph_memory_bytes=128 * 1024 * 1024,
)

# 预先注册所有类型
fory.register(UserModel, type_id=100)
fory.register(OrderModel, type_id=101)
fory.register(ProductModel, type_id=102)
```

收到的远端 metadata 也会受到限制：

- `max_type_fields` 限制一个收到的 struct metadata body 中的字段数。
- `max_type_meta_bytes` 限制一个收到的 TypeDef body 可接受的编码 body 字节数。
- `max_schema_versions_per_type` 限制一个逻辑类型可接受的远端 metadata 版本数。
- `max_average_schema_versions_per_type` 限制所有已接受远端类型的平均版本数。
- `max_graph_memory_bytes` 为单次根对象反序列化期间实际创建的对象图内存设置近似阈值。
  估算主要涵盖 list、tuple、set、dict、object array、struct 和 Python object；它不包含
  string、binary data、primitive scalar 和紧凑 primitive array 等叶子值，因此实际的
  进程内存可能高于这个值。叶子值仍受可用字节数检查保护：如果未读输入没有足够的
  字节，Fory 就不会读取或创建该叶子值。对于所有根输入形式，默认值固定为 `128 MiB`。
  对于确实需要更大或更小阈值的可信载荷，可以设置一个正数形式的字节值。

这些限制不会改变 `strict`、policy、动态加载、unknown-class handling 或 Schema 演进语义。

### 开发环境配置

```python
import pyfory

# 开发设置（更宽松）
fory = pyfory.Fory(
    xlang=False,
    ref=True,
    strict=False,    # 开发时允许任何类型
    max_depth=1000   # 开发时更高的限制
)
```

## 安全

- 对不可信数据保持 `strict=True`。
- 在反序列化之前注册所有预期的应用类型。
- 必须使用 `strict=False` 时，请使用 `DeserializationPolicy`。
- 将 `max_depth` 保持在足以拒绝异常深载荷的较低值。
- 对于大多数输入，保持 `max_graph_memory_bytes` 固定的 `128 MiB` 默认值；如果可信
  工作负载具有不同且合理的 collection、map 或 struct 大小，请设置显式的正数阈值。
- 不要把 xlang/native 模式的选择视为安全控制。

## 相关主题

- [基础序列化](basic-serialization.md) - 使用已配置的 Fory
- [类型注册](type-registration.md) - 注册模式
- [安全性](configuration.md) - 安全最佳实践
