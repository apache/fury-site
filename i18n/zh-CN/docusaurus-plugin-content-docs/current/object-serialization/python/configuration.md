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

应像对待不可信 pickle 字节一样对待来自不可信来源的原生模式字节。设置 `strict=False` 时，原生模式可以重建 Python 对象、导入模块、调用归约钩子以及重建动态类或函数。

### 生产配置

生产载荷应保持 `strict=True`，除非整个数据来源都可信，并由 `DeserializationPolicy` 负责其余信任决策：

```python
import pyfory

fory = pyfory.Fory(
    xlang=True,
    ref=False,
    strict=True,
    max_depth=50,
    max_type_fields=512,
    max_type_meta_bytes=4096,
    max_schema_versions_per_type=10,
    max_average_schema_versions_per_type=3,
    max_graph_memory_bytes=128 * 1024 * 1024,
)

fory.register(UserModel, name="example.User")
fory.register(OrderModel, name="example.Order")
```

仅对可信的仅限 Python 载荷使用动态原生模式反序列化（`strict=False`）：

```python
import pyfory

fory = pyfory.Fory(
    xlang=False,
    ref=True,
    strict=False,
    max_depth=100,
)
```

接收的远程元数据也受到限制：

- `max_type_fields` 限制单个已接收结构体元数据正文可接受的字段数。
- `max_type_meta_bytes` 限制单个已接收 TypeDef 正文可接受的编码正文字节数。
- `max_schema_versions_per_type` 限制每个逻辑类型可接受的远程元数据版本。
- `max_average_schema_versions_per_type` 限制所有已接受远程类型的平均值。
- `max_graph_memory_bytes` 为单次根反序列化期间实例化的对象图内存设置近似门限。估算主要覆盖列表、元组、集合、字典、对象数组、结构体和 Python 对象。它会跳过字符串、二进制数据、原始标量和稠密原始类型数组等叶子值，因此实际进程内存可能高于该值。叶子值仍受字节可用性检查保护：如果未读取的输入没有足够字节，Fory 不会读取或创建该叶子值。所有根输入形式的默认值固定为 `128 MiB`。可信载荷确实需要更大或更小门限时，请设置正数字节值。
- `max_unbacked_container_items` 限制单次根反序列化中重复读取正文没有消耗相应输入的集合元素和映射条目。默认值为 `8192`；零表示严格限制。

这些限制不会改变 `strict`、`policy`、动态加载、未知类处理或 Schema 演进语义。

### DeserializationPolicy

必须使用 `strict=False` 时，请使用 `DeserializationPolicy` 限制反序列化期间接受的动态类型和钩子：

```python
import pyfory
from pyfory import DeserializationPolicy

dangerous_modules = {"subprocess", "os", "__builtin__"}

class SafeDeserializationPolicy(DeserializationPolicy):
    def validate_class(self, cls, is_local, **kwargs):
        if cls.__module__ in dangerous_modules:
            raise ValueError(f"Blocked dangerous class: {cls.__module__}.{cls.__name__}")

    def intercept_reduce_call(self, callable_obj, args, **kwargs):
        if getattr(callable_obj, "__name__", "") == "Popen":
            raise ValueError("Blocked attempt to invoke subprocess.Popen")
        return None

    def intercept_setstate(self, obj, state, **kwargs):
        if isinstance(state, dict) and "password" in state:
            state["password"] = "***REDACTED***"
        return None

policy = SafeDeserializationPolicy()
fory = pyfory.Fory(xlang=False, ref=True, strict=False, policy=policy)
```

可用的策略钩子包括：

引用验证钩子通过抛出异常拒绝输入；不拒绝时，保持反序列化后的引用不变。

| 钩子                                         | 说明                                   |
| -------------------------------------------- | -------------------------------------- |
| `validate_class(cls, is_local)`              | 验证或阻止类类型                       |
| `validate_module(module_name, is_local)`     | 验证或阻止模块导入                     |
| `validate_function(func, is_local)`          | 验证或阻止函数引用                     |
| `validate_method(method, is_local)`          | 验证或阻止方法引用                     |
| `intercept_reduce_call(callable_obj, args)`  | 拦截 `__reduce__` 调用                 |
| `inspect_reduced_object(obj)`                | 检查或替换通过 `__reduce__` 创建的对象 |
| `intercept_setstate(obj, state)`             | 在 `__setstate__` 前清理状态           |
| `authorize_instantiation(cls, args, kwargs)` | 控制类实例化                           |

### 安全检查清单

- 对不可信数据保持 `strict=True`。
- 反序列化前注册所有预期的应用类型。
- 使用 `DeserializationPolicy` 约束必须设置 `strict=False` 的场景。
- 将 `max_depth` 保持在足以拒绝异常深度载荷的较低值。
- 对多数输入，将 `max_graph_memory_bytes` 保持为固定的 `128 MiB` 默认值；对于合法集合/映射/结构体大小不同的可信工作负载，则设置显式正数门限。
- 不要将跨语言/原生模式选择视为安全控制。

## 相关主题

- [基础序列化](core-api.md) - 使用配置后的 Fory
- [类型注册](type-registration.md) - 注册模式
- [原生序列化](native.md) - 仅限 Python 的对象序列化
