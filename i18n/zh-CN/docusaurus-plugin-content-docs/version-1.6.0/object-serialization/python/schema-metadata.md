---
title: Schema 元数据
sidebar_position: 7
id: schema-metadata
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

本页介绍如何为 Python 序列化配置字段级元数据。

## 概述

Apache Fory™ 通过以下方式提供字段级配置：

- **`pyfory.field()`**：配置字段元数据（id、nullable、ref、ignore、dynamic）
- **类型注解**：控制整数编码（varint、定长、tagged）
- **`Optional[T]`**：将字段标记为可空

这些配置可以实现：

- **Tag ID**：分配紧凑的数字 ID，降低结构体字段元数据的体积开销
- **可空性**：控制字段是否可以为 null
- **引用跟踪**：为共享对象启用引用跟踪
- **字段跳过**：从序列化中排除字段
- **编码控制**：指定整数编码方式（varint、定长、tagged）
- **多态**：控制是否为结构体字段写入类型信息

## 基本语法

使用 `@dataclass` 装饰器，并配合类型注解和 `pyfory.field()`：

```python
from dataclasses import dataclass
from typing import Optional
import pyfory

@dataclass
class Person:
    name: str = pyfory.field(id=0)
    age: pyfory.Int32 = pyfory.field(id=1, default=0)
    nickname: Optional[str] = pyfory.field(id=2, nullable=True, default=None)
```

## `pyfory.field()` 函数

使用 `pyfory.field()` 配置字段级元数据：

```python
@dataclass
class User:
    id: pyfory.Int64 = pyfory.field(id=0, default=0)
    name: str = pyfory.field(id=1, default="")
    email: Optional[str] = pyfory.field(id=2, nullable=True, default=None)
    friends: List["User"] = pyfory.field(id=3, ref=True, default_factory=list)
    _cache: dict = pyfory.field(ignore=True, default_factory=dict)
```

### 参数

| 参数              | 类型     | 默认值    | 说明                 |
| ----------------- | -------- | --------- | -------------------- |
| `id`              | `int`    | 省略      | 非负字段 tag ID      |
| `nullable`        | `bool`   | `False`   | 字段是否可以为 null  |
| `ref`             | `bool`   | `False`   | 启用引用跟踪         |
| `ignore`          | `bool`   | `False`   | 从序列化中排除字段   |
| `dynamic`         | `bool`   | `None`    | 控制是否写入类型信息 |
| `default`         | Any      | `MISSING` | 字段默认值           |
| `default_factory` | Callable | `MISSING` | 默认值工厂函数       |

## 字段 ID（`id`）

为字段分配数字 ID，以尽量降低结构体字段元数据的体积开销：

```python
@dataclass
class User:
    id: pyfory.Int64 = pyfory.field(id=0, default=0)
    name: str = pyfory.field(id=1, default="")
    age: pyfory.Int32 = pyfory.field(id=2, default=0)
```

**优点**：

- 序列化体积更小（元数据中的数字 ID 相比字段名更紧凑）
- 降低结构体字段元数据开销
- 允许在不破坏二进制兼容性的情况下重命名字段

**建议**：兼容模式建议配置字段 ID，以降低序列化成本。

**注意事项**：

- ID 在类中必须唯一
- ID 必须 >= 0
- 如果未指定，元数据使用字段名（开销更大）

**不使用字段 ID**（元数据使用字段名）：

```python
@dataclass
class User:
    id: pyfory.Int64 = 0
    name: str = ""
```

## 可空字段（`nullable`）

使用 `nullable=True` 标记可以为 `None` 的字段：

```python
from typing import Optional

@dataclass
class Record:
    # Nullable string field
    optional_name: Optional[str] = pyfory.field(id=0, nullable=True, default=None)

    # Nullable integer field
    optional_count: Optional[pyfory.Int32] = pyfory.field(id=1, nullable=True, default=None)
```

**注意事项**：

- `Optional[T]` 字段必须设置 `nullable=True`
- 非 Optional 字段默认为 `nullable=False`

## 引用跟踪（`ref`）

可能被共享的字段应启用引用跟踪。循环 Python 对象图需要使用 Python 原生模式，并启用全局引用跟踪。

```python
@dataclass
class RefOuter:
    # Both fields may point to the same inner object
    inner1: Optional[RefInner] = pyfory.field(id=0, ref=True, nullable=True, default=None)
    inner2: Optional[RefInner] = pyfory.field(id=1, ref=True, nullable=True, default=None)


@dataclass
class CircularRef:
    name: str = pyfory.field(id=0, default="")
    # Self-referencing field for circular references
    self_ref: Optional["CircularRef"] = pyfory.field(id=1, ref=True, nullable=True, default=None)
```

**使用场景**：

- 字段可能参与循环或被共享
- 多个字段引用同一对象

**注意事项**：

- 必须启用全局 `Fory(ref=True)`。
- 对于 Schema 字段，字段级 `ref=True` 和全局 `ref=True` 必须同时启用。

## 跳过字段（`ignore`）

从序列化中排除字段：

```python
@dataclass
class User:
    id: pyfory.Int64 = pyfory.field(id=0, default=0)
    name: str = pyfory.field(id=1, default="")
    # Not serialized
    _cache: dict = pyfory.field(ignore=True, default_factory=dict)
    _internal_state: str = pyfory.field(ignore=True, default="")
```

## 动态字段（`dynamic`）

控制是否为结构体字段写入类型信息。这对多态支持至关重要：

```python
from abc import ABC, abstractmethod

class Shape(ABC):
    @abstractmethod
    def area(self) -> float:
        pass

@dataclass
class Circle(Shape):
    radius: float = 0.0

    def area(self) -> float:
        return 3.14159 * self.radius * self.radius

@dataclass
class Container:
    # Abstract class: dynamic is always True (type info written)
    shape: Shape = pyfory.field(id=0)

    # Force type info for concrete type (support subtypes)
    circle: Circle = pyfory.field(id=1, dynamic=True)

    # Skip type info for concrete type (use declared type directly)
    fixed_circle: Circle = pyfory.field(id=2, dynamic=False)
```

**默认行为**：

| 模式        | 抽象类 | 具体对象类型 | 数字/str/时间类型 |
| ----------- | ------ | ------------ | ----------------- |
| Native mode | `True` | `True`       | `False`           |
| Xlang mode  | `True` | `False`      | `False`           |

**注意事项**：

- **抽象类**：`dynamic` 始终为 `True`（必须写入类型信息）
- **原生模式**：对象类型的 `dynamic` 默认为 `True`，数字/str/时间类型默认为 `False`
- **跨语言模式**：具体类型的 `dynamic` 默认为 `False`
- 具体字段可能持有子类实例时使用 `dynamic=True`
- 类型已知时使用 `dynamic=False` 优化性能

## 整数类型注解

Fory 提供用于控制整数编码的类型注解：

请直接在 Python 类型注解中使用这些标记。字段值仍是普通 Python `int` 或 `float` 值，Fory 会使用指定的跨语言数字宽度和编码对其进行序列化。

### 有符号整数

```python
@dataclass
class SignedIntegers:
    byte_val: pyfory.Int8 = 0      # 8-bit signed
    short_val: pyfory.Int16 = 0    # 16-bit signed
    int_val: pyfory.Int32 = 0      # 32-bit signed (varint encoding)
    long_val: pyfory.Int64 = 0     # 64-bit signed (varint encoding)
```

### 无符号整数

```python
@dataclass
class UnsignedIntegers:
    # Fixed-size encoding
    u8_val: pyfory.UInt8 = 0       # 8-bit unsigned (fixed)
    u16_val: pyfory.UInt16 = 0     # 16-bit unsigned (fixed)

    # Variable-length encoding (default for u32/u64)
    u32_var: pyfory.UInt32 = 0     # 32-bit unsigned (varint)
    u64_var: pyfory.UInt64 = 0     # 64-bit unsigned (varint)

    # Explicit fixed-size encoding
    u32_fixed: pyfory.FixedUInt32 = 0   # 32-bit unsigned (fixed 4 bytes)
    u64_fixed: pyfory.FixedUInt64 = 0   # 64-bit unsigned (fixed 8 bytes)

    # Tagged encoding (includes type tag)
    u64_tagged: pyfory.TaggedUInt64 = 0  # 64-bit unsigned (tagged)
```

### 浮点数

```python
@dataclass
class FloatingPoint:
    float_val: pyfory.Float32 = 0.0   # 32-bit float
    double_val: pyfory.Float64 = 0.0  # 64-bit double
```

### 编码汇总

| 类型                  | 编码   | 大小       |
| --------------------- | ------ | ---------- |
| `pyfory.Int8`         | fixed  | 1 byte     |
| `pyfory.Int16`        | fixed  | 2 bytes    |
| `pyfory.Int32`        | varint | 1-5 bytes  |
| `pyfory.Int64`        | varint | 1-10 bytes |
| `pyfory.FixedInt32`   | fixed  | 4 bytes    |
| `pyfory.FixedInt64`   | fixed  | 8 bytes    |
| `pyfory.TaggedInt64`  | tagged | 1-9 bytes  |
| `pyfory.UInt8`        | fixed  | 1 byte     |
| `pyfory.UInt16`       | fixed  | 2 bytes    |
| `pyfory.UInt32`       | varint | 1-5 bytes  |
| `pyfory.UInt64`       | varint | 1-10 bytes |
| `pyfory.FixedUInt32`  | fixed  | 4 bytes    |
| `pyfory.FixedUInt64`  | fixed  | 8 bytes    |
| `pyfory.TaggedUInt64` | tagged | 1-9 bytes  |
| `pyfory.Float32`      | fixed  | 4 bytes    |
| `pyfory.Float64`      | fixed  | 8 bytes    |

**使用时机**：

- `varint`：最适合通常较小的值（int32/int64/uint32/uint64 的默认编码）
- `fixed`：最适合使用完整范围的值（例如时间戳、哈希）
- `tagged`：需要保留类型信息时使用（仅限 int64/uint64）

## 嵌套容器类型注解

整数编码别名可以在声明的集合 Schema 中使用。在纯 Python 和 Cython 模式下，Fory 对每个嵌套元素、键和值都使用声明的字段 Schema：

```python
from dataclasses import dataclass, field
from typing import Dict, List
import pyfory


@dataclass
class Counters:
    values: Dict[pyfory.FixedInt32, List[pyfory.TaggedInt64]] = field(default_factory=dict)
```

对于 `values`，映射键以定长 int32 值写入，每个嵌套列表元素以 tagged int64 写入。基于值的类型推断仅用于动态或未知容器 Schema。

在兼容模式下，读取端使用远程 Schema 元数据消费字段字节。只有解码值能安全满足本地声明的 Schema 时，Python 才进行赋值。标量转换和整数编码适配仅适用于直接匹配的字段 Schema。除命名与未命名结构体元数据等用户类型族归一化外，嵌套集合元素、映射键和映射值必须保持精确的可空性、引用跟踪和类型形态元数据。

## 完整示例

```python
from dataclasses import dataclass
from typing import Optional, List, Dict, Set
import pyfory


@dataclass
class Document:
    # Fields with tag IDs (recommended for compatible mode)
    title: str = pyfory.field(id=0, default="")
    version: pyfory.Int32 = pyfory.field(id=1, default=0)

    # Nullable field
    description: Optional[str] = pyfory.field(id=2, nullable=True, default=None)

    # Collection fields
    tags: List[str] = pyfory.field(id=3, default_factory=list)
    metadata: Dict[str, str] = pyfory.field(id=4, default_factory=dict)
    categories: Set[str] = pyfory.field(id=5, default_factory=set)

    # Unsigned integers with different encodings
    view_count: pyfory.UInt64 = pyfory.field(id=6, default=0)           # varint encoding
    file_size: pyfory.FixedUInt64 = pyfory.field(id=7, default=0)       # fixed encoding
    checksum: pyfory.TaggedUInt64 = pyfory.field(id=8, default=0)       # tagged encoding

    # Reference-tracked field for shared/circular references
    parent: Optional["Document"] = pyfory.field(id=9, ref=True, nullable=True, default=None)

    # Ignored field (not serialized)
    _cache: dict = pyfory.field(ignore=True, default_factory=dict)


def main():
    fory = pyfory.Fory(xlang=True, ref=True)
    fory.register_type(Document, type_id=100)

    doc = Document(
        title="My Document",
        version=1,
        description="A sample document",
        tags=["tag1", "tag2"],
        metadata={"key": "value"},
        categories={"cat1"},
        view_count=42,
        file_size=1024,
        checksum=123456789,
        parent=None,
    )

    # Serialize
    data = fory.serialize(doc)

    # Deserialize
    decoded = fory.deserialize(data)
    assert decoded.title == doc.title
    assert decoded.version == doc.version


if __name__ == "__main__":
    main()
```

## 跨语言兼容性

序列化将由其他语言（Java、Rust、C++、Go）读取的数据时，请使用字段 ID 和匹配的类型注解：

```python
@dataclass
class CrossLangData:
    # Use field IDs for cross-language compatibility
    int_var: pyfory.Int32 = pyfory.field(id=0, default=0)
    long_fixed: pyfory.FixedUInt64 = pyfory.field(id=1, default=0)
    long_tagged: pyfory.TaggedUInt64 = pyfory.field(id=2, default=0)
    optional_value: Optional[str] = pyfory.field(id=3, nullable=True, default=None)
```

## Schema 演进

兼容模式支持 Schema 演进。建议配置字段 ID 以降低序列化成本：

```python
# Version 1
@dataclass
class DataV1:
    id: pyfory.Int64 = pyfory.field(id=0, default=0)
    name: str = pyfory.field(id=1, default="")


# Version 2: Added new field
@dataclass
class DataV2:
    id: pyfory.Int64 = pyfory.field(id=0, default=0)
    name: str = pyfory.field(id=1, default="")
    email: Optional[str] = pyfory.field(id=2, nullable=True, default=None)  # New field
```

使用 V1 序列化的数据可以用 V2 反序列化（新字段为 `None`）。

也可以省略字段 ID（元数据将使用字段名，开销更大）：

```python
@dataclass
class Data:
    id: pyfory.Int64 = 0
    name: str = ""
```

## 原生模式与跨语言模式

字段配置会因序列化模式而异：

### 原生模式（仅限 Python）

原生模式采用**宽松的默认值**，以获得最大兼容性：

- **可空**：`str` 和数字类型默认不可空，除非使用 `Optional`
- **引用跟踪**：对象引用默认启用（`str` 和数字类型除外）

在原生模式下，通常**不需要配置字段注解**，除非希望：

- 使用字段 ID 减小序列化体积
- 禁用不必要的引用跟踪以优化性能

```python
# Native mode: works without schema metadata
@dataclass
class User:
    id: int = 0
    name: str = ""
    tags: List[str] = None
```

### 跨语言模式

由于不同语言的类型系统存在差异，跨语言模式采用**更严格的默认值**：

- **可空**：字段默认不可空（`nullable=False`）
- **引用跟踪**：默认禁用（`ref=False`）

在跨语言模式下，以下情况**需要配置字段**：

- 字段可以为 None（使用 `Optional[T]` 并设置 `nullable=True`）
- 字段需要跟踪共享/循环对象的引用（使用 `ref=True`）
- 整数类型需要特定编码以实现跨语言兼容
- 希望减小元数据体积（使用字段 ID）

```python
# Xlang mode: explicit configuration required for nullable/ref fields
@dataclass
class User:
    id: pyfory.Int64 = pyfory.field(id=0, default=0)
    name: str = pyfory.field(id=1, default="")
    email: Optional[str] = pyfory.field(id=2, nullable=True, default=None)  # Must declare nullable
    friend: Optional["User"] = pyfory.field(id=3, ref=True, nullable=True, default=None)  # Must declare ref
```

### 默认值汇总

| 选项       | 原生模式默认值                                  | 跨语言模式默认值    |
| ---------- | ----------------------------------------------- | ------------------- |
| `nullable` | `False` 适用于 `str`/数字类型；其他类型默认可空 | `False`             |
| `ref`      | `True`（`str` 和数字类型除外）                  | `False`             |
| `dynamic`  | `True`（数字/str/时间类型除外）                 | `False`（具体类型） |

## 最佳实践

1. **配置字段 ID**：兼容模式推荐使用，以降低序列化成本
2. **使用 `Optional[T]` 并设置 `nullable=True`**：跨语言模式中的可空字段必须使用
3. **为共享对象启用引用跟踪**：对象共享或形成循环时使用 `ref=True`
4. **敏感数据使用 `ignore=True`**：例如密码、令牌、内部状态
5. **选择合适的编码**：较小值使用 `varint`，完整范围值使用 `fixed`
6. **保持 ID 稳定**：字段 ID 一经分配不要更改

## 选项参考

| 配置                                       | 说明                            |
| ------------------------------------------ | ------------------------------- |
| `pyfory.field(id=N)`                       | 用于减小元数据体积的字段 tag ID |
| `pyfory.field(nullable=True)`              | 将字段标记为可空                |
| `pyfory.field(ref=True)`                   | 启用引用跟踪                    |
| `pyfory.field(ignore=True)`                | 从序列化中排除字段              |
| `pyfory.field(dynamic=True)`               | 强制写入类型信息                |
| `pyfory.field(dynamic=False)`              | 跳过类型信息（使用声明类型）    |
| `Optional[T]`                              | 可空字段的类型提示              |
| `pyfory.Int32`, `pyfory.Int64`             | 有符号整数（varint 编码）       |
| `pyfory.FixedInt32`, `pyfory.FixedInt64`   | 定长有符号整数                  |
| `pyfory.TaggedInt64`                       | int64 的 tagged 编码            |
| `pyfory.UInt32`, `pyfory.UInt64`           | 无符号整数（varint 编码）       |
| `pyfory.FixedUInt32`, `pyfory.FixedUInt64` | 定长无符号整数                  |
| `pyfory.TaggedUInt64`                      | uint64 的 tagged 编码           |

## 相关主题

- [基础序列化](basic-serialization.md) - Fory 序列化入门
- [Schema 演进](schema-evolution.md) - 兼容模式与 Schema 演进
- [跨语言序列化](basic-serialization.md#cross-language-interoperability) - 与 Java、Rust、C++、Go 互操作
