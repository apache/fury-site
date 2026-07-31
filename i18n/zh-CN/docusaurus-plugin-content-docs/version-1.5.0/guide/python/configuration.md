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

本页介绍 Python Fory 实例的配置。`pyfory.Fory()` 默认使用跨语言模式，并启用兼容
Schema 演进。通过显式设置 `xlang=False` 可选择原生模式，该模式同样默认启用兼容
Schema 演进。

## Fory 类

主要的序列化接口：

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
        policy: DeserializationPolicy = None,
        field_nullable: bool = False,
        meta_compressor=None,
    )
```

## ThreadSafeFory 类

使用对象池封装的线程安全序列化接口：

```python
class ThreadSafeFory:
    def __init__(
        self, fory_factory=None, **kwargs
    )
```

## 参数

| 参数                                   | 类型                            | 默认值      | 描述                                                                                                                                                            |
| -------------------------------------- | ------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `xlang`                                | `bool`                          | `True`      | 使用跨语言模式。设置为 `False` 时使用 Python 原生模式。                                                                                                         |
| `ref`                                  | `bool`                          | `False`     | 为共享引用和循环引用启用引用跟踪。如果数据中没有共享引用，禁用此选项可获得更好的性能。                                                                           |
| `strict`                               | `bool`                          | `True`      | 出于安全考虑，要求类型必须注册。生产环境应保持启用，除非由策略负责信任决策。                                                                                     |
| `compatible`                           | `bool \| None`                  | `None`      | Schema 演进模式。`None` 会在跨语言模式和原生模式中启用兼容模式。仅当每个读取端和写入端都使用相同 Schema 时才设置为 `False`。                                      |
| `max_depth`                            | `int`                           | `50`        | 出于安全考虑设置的最大反序列化深度，用于防止栈溢出攻击。                                                                                                        |
| `max_type_fields`                      | `int`                           | `512`       | 一个接收到的远端结构体元数据主体允许包含的最大字段数。                                                                                                          |
| `max_type_meta_bytes`                  | `int`                           | `4096`      | 一个接收到的 TypeDef 主体允许包含的最大编码字节数，不包括 8 字节头部和任何扩展大小 varint。                                                                       |
| `max_schema_versions_per_type`         | `int`                           | `10`        | 一个逻辑类型允许接收的远端元数据版本数上限。                                                                                                                    |
| `max_average_schema_versions_per_type` | `int`                           | `3`         | 所有已接收远端类型平均允许的远端元数据版本数。有效的全局下限为 `8192` 个 Schema。                                                                                |
| `max_graph_memory_bytes`               | `int`                           | `134217728` | 单次根对象反序列化的近似对象图内存阈值。显式传入的非正数值会被拒绝。                                                                                            |
| `policy`                               | `DeserializationPolicy \| None` | `None`      | 用于安全检查的反序列化策略。使用 `strict=False` 时强烈建议设置此参数。                                                                                           |
| `field_nullable`                       | `bool`                          | `False`     | 默认将数据类字段视为可空字段。                                                                                                                                  |
| `meta_compressor`                      | `Any`                           | `None`      | 可选的元数据压缩器，用于兼容模式的元数据编码。                                                                                                                  |
| `fory_factory`                         | `Callable \| None`              | `None`      | `ThreadSafeFory` 的工厂钩子。设置后，`ThreadSafeFory` 会通过此回调创建实例；否则会将 `**kwargs` 转发给 `Fory` 构造函数。                                          |

## 核心方法

```python
# 序列化（serialize/deserialize 与 dumps/loads 完全相同）
data: bytes = fory.serialize(obj)
obj = fory.deserialize(data)

# 替代 API（别名）
data: bytes = fory.dumps(obj)
obj = fory.loads(data)

# 按 ID 注册类型
fory.register(MyClass, type_id=123)
fory.register(MyClass, type_id=123, serializer=custom_serializer)

# 按名称注册类型
fory.register(MyClass, name="my.package.MyClass")
fory.register(MyClass, name="my.package.MyClass", serializer=custom_serializer)
```

## 跨语言模式与原生模式对比

| 特性                | 原生模式（`xlang=False`）          | 跨语言模式（默认）                                                              |
| ------------------- | ---------------------------------- | ------------------------------------------------------------------------------- |
| 使用场景            | 仅使用 Python 的应用               | 多语言系统                                                                      |
| 兼容性              | 仅限 Python                        | Java、C++、Go、Rust、JavaScript/TypeScript、C#、Swift、Dart、Scala、Kotlin 等   |
| 支持的类型          | Python 对象范围                    | 跨语言兼容类型                                                                  |
| 函数/lambda         | 受信任的动态反序列化支持           | 不允许                                                                          |
| 本地类              | 受信任的动态反序列化支持           | 不允许                                                                          |
| 动态类              | 受信任的动态反序列化支持           | 不允许                                                                          |
| Schema 模式默认值   | 兼容模式                           | 兼容模式                                                                        |

## 跨语言模式

跨语言模式是默认模式，它将载荷限制为各 Fory 实现之间兼容的类型：

```python
import pyfory

fory = pyfory.Fory(xlang=True, ref=True)
fory.register(MyDataClass, name="com.example.MyDataClass")
data = fory.serialize(MyDataClass(field1="value", field2=42))
```

仅当每个读取端和写入端始终使用相同的 Schema，并且需要更快的序列化速度和更小的数据体积时，
才为跨语言载荷设置 `compatible=False`。请先验证所有语言都使用该 Schema，或确认原生类型由
Fory Schema IDL 生成，再使用此设置。

## 原生模式

```python
import pyfory

fory = pyfory.Fory(xlang=False, ref=True, strict=False)
```

原生模式支持函数、本地类、方法、`__reduce__` 和 `__getstate__` 等 Python 特有的对象特性。
兼容模式仍然默认启用。仅当每个读取端和写入端始终使用相同的 Python 类 Schema，并且需要
更快的序列化速度和更小的数据体积时，才设置 `compatible=False`。

## 兼容模式

跨语言模式和原生模式都默认启用兼容模式。当 Python 类可能独立演进、服务单独部署，或者
不同语言手写跨语言 Schema 时，请保留此默认设置。

对于跨语言载荷，仅当确认所有语言都使用相同的 Schema，或原生类型由 Fory Schema IDL 生成
时，才设置 `compatible=False`。

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

### 使用动态类型的原生模式

```python
import pyfory

fory = pyfory.Fory(
    xlang=False,
    ref=True,
    strict=False,
    max_depth=1000,
)
```

仅对受信任的数据使用 `strict=False`，并且最好同时通过 `policy=` 设置反序列化策略。

## 安全

处理来自不可信来源的原生模式字节时，应像处理不可信的 pickle 字节一样谨慎。使用
`strict=False` 时，原生模式可以重建 Python 对象、导入模块、调用 reduction 钩子，以及
重建动态类或函数。

### 生产环境配置

生产环境应保持 `strict=True`，除非整个数据源都可信，并且由 `DeserializationPolicy`
负责其余的信任决策：

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

仅对受信任、只供 Python 使用的载荷启用动态原生模式反序列化（`strict=False`）：

```python
import pyfory

fory = pyfory.Fory(
    xlang=False,
    ref=True,
    strict=False,
    max_depth=100,
)
```

接收到的远端元数据也会受到以下限制：

- `max_type_fields` 限制一个接收到的结构体元数据主体允许包含的字段数。
- `max_type_meta_bytes` 限制一个接收到的 TypeDef 主体允许包含的编码字节数。
- `max_schema_versions_per_type` 限制一个逻辑类型允许接收的远端元数据版本数。
- `max_average_schema_versions_per_type` 限制所有已接收远端类型的平均版本数。
- `max_graph_memory_bytes` 为单次根对象反序列化期间实际创建的对象图内存设置近似阈值。
  估算主要涵盖 list、tuple、set、dict、object array、struct 和 Python object。它不包含
  string、binary data、primitive scalar 和紧凑 primitive array 等叶子值，因此实际的
  进程内存可能高于这个值。叶子值仍受可用字节数检查保护：如果未读输入没有足够的字节，
  Fory 就不会读取或创建该叶子值。对于所有根输入形式，默认值固定为 `128 MiB`。对于确实
  需要更大或更小阈值的可信载荷，请设置一个正数形式的字节值。

这些限制不会改变 `strict`、`policy`、动态加载、未知类处理或 Schema 演进语义。

### DeserializationPolicy

必须使用 `strict=False` 时，请使用 `DeserializationPolicy` 限制反序列化期间允许的动态类型
和钩子：

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

引用验证钩子通过抛出异常来拒绝引用；未抛出异常时，反序列化后的引用保持不变。

| 钩子                                         | 描述                                          |
| -------------------------------------------- | --------------------------------------------- |
| `validate_class(cls, is_local)`              | 验证或阻止类类型                              |
| `validate_module(module_name, is_local)`     | 验证或阻止模块导入                            |
| `validate_function(func, is_local)`          | 验证或阻止函数引用                            |
| `validate_method(method, is_local)`          | 验证或阻止方法引用                            |
| `intercept_reduce_call(callable_obj, args)`  | 拦截 `__reduce__` 调用                        |
| `inspect_reduced_object(obj)`                | 检查或替换通过 `__reduce__` 创建的对象        |
| `intercept_setstate(obj, state)`             | 在调用 `__setstate__` 前清理状态              |
| `authorize_instantiation(cls, args, kwargs)` | 控制类实例化                                  |

### 安全检查清单

- 对不可信数据保持 `strict=True`。
- 在反序列化之前注册所有预期的应用类型。
- 必须使用 `strict=False` 时，请使用 `DeserializationPolicy`。
- 将 `max_depth` 保持在足以拒绝异常深载荷的较低值。
- 对于大多数输入，保持 `max_graph_memory_bytes` 固定的 `128 MiB` 默认值；如果可信工作负载
  具有其他合理的 collection、map 或 struct 大小，请设置显式的正数阈值。
- 不要把跨语言模式或原生模式的选择视为安全控制。

## 相关主题

- [基础序列化](basic-serialization.md) - 使用已配置的 Fory
- [类型注册](type-registration.md) - 注册模式
- [原生序列化](native-serialization.md) - 仅使用 Python 的对象序列化
