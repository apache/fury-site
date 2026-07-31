---
title: Schema 元信息
sidebar_position: 7
id: schema_metadata
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

本页说明如何在 Python 中为序列化配置字段级元信息。

## 概览

Apache Fory™ 通过以下方式提供字段级配置：

- **`pyfory.field()`**：配置字段元信息（id、nullable、ref、ignore、dynamic）
- **类型注解**：控制整数编码（varint、fixed、tagged）
- **`Optional[T]`**：将字段标记为可空

这些配置支持：

- **Tag ID**：分配紧凑的数字 ID，降低 struct 字段元信息大小开销
- **可空性**：控制字段是否可以为 null
- **引用跟踪**：为共享对象启用引用跟踪
- **跳过字段**：从序列化中排除字段
- **编码控制**：指定整数的编码方式（varint、fixed、tagged）
- **多态**：控制是否为 struct 字段写入类型信息

## 基本语法

将 `@dataclass` 装饰器与类型注解和 `pyfory.field()` 配合使用：

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

使用 `pyfory.field()` 配置字段级元信息：

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
| `default`         | Any      | `MISSING` | 字段的默认值         |
| `default_factory` | Callable | `MISSING` | 默认值的工厂函数     |

## 字段 ID（`id`）

为字段分配数字 ID，以最小化 struct 字段元信息大小开销：

```python
@dataclass
class User:
    id: pyfory.Int64 = pyfory.field(id=0, default=0)
    name: str = pyfory.field(id=1, default="")
    age: pyfory.Int32 = pyfory.field(id=2, default=0)
```

**优点**：

- 序列化尺寸更小（元信息中使用数字 ID，而不是字段名）
- 降低 struct 字段元信息开销
- 允许重命名字段而不破坏二进制兼容性

**建议**：在兼容模式下建议配置字段 ID，因为它可以降低序列化成本。

**注意事项**：

- ID 在同一个类内必须唯一
- ID 必须 >= 0
- 如果未指定，元信息会使用字段名（开销更大）

**不使用字段 ID**（元信息中使用字段名）：

```python
@dataclass
class User:
    id: pyfory.Int64 = 0
    name: str = ""
```

## 可空字段（`nullable`）

对可以为 `None` 的字段使用 `nullable=True`：

```python
from typing import Optional

@dataclass
class Record:
    # 可空字符串字段
    optional_name: Optional[str] = pyfory.field(id=0, nullable=True, default=None)

    # 可空整数字段
    optional_count: Optional[pyfory.Int32] = pyfory.field(id=1, nullable=True, default=None)
```

**注意事项**：

- `Optional[T]` 字段必须设置 `nullable=True`
- 非 optional 字段默认 `nullable=False`

## 引用跟踪（`ref`）

为可能共享的字段启用引用跟踪。循环 Python 对象图需要启用全局引用跟踪的 Python 原生模式。

```python
@dataclass
class RefOuter:
    # 两个字段都可能指向同一个内部对象
    inner1: Optional[RefInner] = pyfory.field(id=0, ref=True, nullable=True, default=None)
    inner2: Optional[RefInner] = pyfory.field(id=1, ref=True, nullable=True, default=None)


@dataclass
class CircularRef:
    name: str = pyfory.field(id=0, default="")
    # 用于循环引用的自引用字段
    self_ref: Optional["CircularRef"] = pyfory.field(id=1, ref=True, nullable=True, default=None)
```

**使用场景**：

- 为可能形成循环或共享的字段启用
- 同一个对象被多个字段引用时启用

**注意事项**：

- 必须启用全局 `Fory(ref=True)`。
- 对于 schema 字段，字段级 `ref=True` 和全局 `ref=True` 都必须启用。

## 跳过字段（`ignore`）

从序列化中排除字段：

```python
@dataclass
class User:
    id: pyfory.Int64 = pyfory.field(id=0, default=0)
    name: str = pyfory.field(id=1, default="")
    # 不会被序列化
    _cache: dict = pyfory.field(ignore=True, default_factory=dict)
    _internal_state: str = pyfory.field(ignore=True, default="")
```

## 动态字段（`dynamic`）

控制是否为 struct 字段写入类型信息。这对多态支持至关重要：

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
    # 抽象类：dynamic 始终为 True（写入类型信息）
    shape: Shape = pyfory.field(id=0)

    # 为具体类型强制写入类型信息（支持运行时子类型）
    circle: Circle = pyfory.field(id=1, dynamic=True)

    # 对具体类型跳过类型信息（直接使用声明类型）
    fixed_circle: Circle = pyfory.field(id=2, dynamic=False)
```

**默认行为**：

| 模式       | 抽象类 | 具体对象类型 | 数值/str/time 类型 |
| ---------- | ------ | ------------ | ------------------ |
| 原生模式   | `True` | `True`       | `False`            |
| Xlang 模式 | `True` | `False`      | `False`            |

**注意事项**：

- **抽象类**：`dynamic` 始终为 `True`（必须写入类型信息）
- **原生模式**：对象类型的 `dynamic` 默认为 `True`，数值/str/time 类型默认为 `False`
- **Xlang 模式**：具体类型的 `dynamic` 默认为 `False`
- 当具体字段可能保存子类实例时，使用 `dynamic=True`
- 当类型已知且需要性能优化时，使用 `dynamic=False`

## 整数类型注解

Fory 提供类型注解来控制整数编码：

### 有符号整数

```python
@dataclass
class SignedIntegers:
    byte_val: pyfory.Int8 = 0      # 8 位有符号
    short_val: pyfory.Int16 = 0    # 16 位有符号
    int_val: pyfory.Int32 = 0      # 32 位有符号（varint 编码）
    long_val: pyfory.Int64 = 0     # 64 位有符号（varint 编码）
```

### 无符号整数

```python
@dataclass
class UnsignedIntegers:
    # 定长编码
    u8_val: pyfory.UInt8 = 0       # 8 位无符号（fixed）
    u16_val: pyfory.UInt16 = 0     # 16 位无符号（fixed）

    # 变长编码（u32/u64 的默认值）
    u32_var: pyfory.UInt32 = 0     # 32 位无符号（varint）
    u64_var: pyfory.UInt64 = 0     # 64 位无符号（varint）

    # 显式定长编码
    u32_fixed: pyfory.FixedUInt32 = 0   # 32 位无符号（fixed 4 字节）
    u64_fixed: pyfory.FixedUInt64 = 0   # 64 位无符号（fixed 8 字节）

    # Tagged 编码（包含类型 tag）
    u64_tagged: pyfory.TaggedUInt64 = 0  # 64 位无符号（tagged）
```

### 浮点数

```python
@dataclass
class FloatingPoint:
    float_val: pyfory.Float32 = 0.0   # 32 位浮点数
    double_val: pyfory.Float64 = 0.0  # 64 位双精度浮点数
```

### 编码汇总

| 类型                  | 编码     | 大小      |
| --------------------- | -------- | --------- |
| `pyfory.Int8`         | fixed    | 1 字节    |
| `pyfory.Int16`        | fixed    | 2 字节    |
| `pyfory.Int32`        | varint   | 1-5 字节  |
| `pyfory.Int64`        | varint   | 1-10 字节 |
| `pyfory.FixedInt32`   | fixed    | 4 字节    |
| `pyfory.FixedInt64`   | fixed    | 8 字节    |
| `pyfory.TaggedInt64`  | tagged   | 1-9 字节  |
| `pyfory.UInt8`        | fixed    | 1 字节    |
| `pyfory.UInt16`       | fixed    | 2 字节    |
| `pyfory.UInt32`       | varint   | 1-5 字节  |
| `pyfory.UInt64`       | varint   | 1-10 字节 |
| `pyfory.FixedUInt32`  | fixed    | 4 字节    |
| `pyfory.FixedUInt64`  | fixed    | 8 字节    |
| `pyfory.TaggedUInt64` | tagged   | 1-9 字节  |
| `pyfory.Float32`      | fixed    | 4 字节    |
| `pyfory.Float64`      | fixed    | 8 字节    |

**使用时机**：

- `varint`：最适合经常较小的值（int32/int64/uint32/uint64 的默认值）
- `fixed`：最适合使用完整范围的值（例如时间戳、哈希）
- `tagged`：需要保留类型信息时使用（仅 int64/uint64）

## 嵌套容器类型注解

整数编码别名可以在声明的集合 schema 内使用。无论在纯 Python 还是 Cython 模式中，Fory 都会对每个嵌套元素、键和值使用声明的字段 schema：

```python
from dataclasses import dataclass, field
from typing import Dict, List
import pyfory


@dataclass
class Counters:
    values: Dict[pyfory.FixedInt32, List[pyfory.TaggedInt64]] = field(default_factory=dict)
```

对于 `values`，map 的键会写成定长 int32 值，每个嵌套 list 元素会写成 tagged int64。运行时类型推断仅用于动态或未知的容器 schema。

在兼容模式下，读取端使用远端 schema 元信息消费字段字节。只有在解码值能够安全满足本地声明 schema 时，Python 才会赋值。相同符号性和宽度范围内的不同整数编码是兼容的；相同符号性的窄化转换只会在范围校验后赋值。

## 完整示例

```python
from dataclasses import dataclass
from typing import Optional, List, Dict, Set
import pyfory


@dataclass
class Document:
    # 带 tag ID 的字段（兼容模式推荐）
    title: str = pyfory.field(id=0, default="")
    version: pyfory.Int32 = pyfory.field(id=1, default=0)

    # 可空字段
    description: Optional[str] = pyfory.field(id=2, nullable=True, default=None)

    # 集合字段
    tags: List[str] = pyfory.field(id=3, default_factory=list)
    metadata: Dict[str, str] = pyfory.field(id=4, default_factory=dict)
    categories: Set[str] = pyfory.field(id=5, default_factory=set)

    # 使用不同编码的无符号整数
    view_count: pyfory.UInt64 = pyfory.field(id=6, default=0)           # varint 编码
    file_size: pyfory.FixedUInt64 = pyfory.field(id=7, default=0)       # fixed 编码
    checksum: pyfory.TaggedUInt64 = pyfory.field(id=8, default=0)       # tagged 编码

    # 用于共享/循环引用的引用跟踪字段
    parent: Optional["Document"] = pyfory.field(id=9, ref=True, nullable=True, default=None)

    # 被忽略的字段（不序列化）
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

    # 序列化
    data = fory.serialize(doc)

    # 反序列化
    decoded = fory.deserialize(data)
    assert decoded.title == doc.title
    assert decoded.version == doc.version


if __name__ == "__main__":
    main()
```

## 跨语言兼容性

当序列化的数据需要被其他语言（Java、Rust、C++、Go）读取时，请使用字段 ID 和匹配的类型注解：

```python
@dataclass
class CrossLangData:
    # 使用字段 ID 实现跨语言兼容性
    int_var: pyfory.Int32 = pyfory.field(id=0, default=0)
    long_fixed: pyfory.FixedUInt64 = pyfory.field(id=1, default=0)
    long_tagged: pyfory.TaggedUInt64 = pyfory.field(id=2, default=0)
    optional_value: Optional[str] = pyfory.field(id=3, nullable=True, default=None)
```

## Schema 演进

兼容模式支持 Schema 演进。建议配置字段 ID 以降低序列化成本：

```python
# 版本 1
@dataclass
class DataV1:
    id: pyfory.Int64 = pyfory.field(id=0, default=0)
    name: str = pyfory.field(id=1, default="")


# 版本 2：新增字段
@dataclass
class DataV2:
    id: pyfory.Int64 = pyfory.field(id=0, default=0)
    name: str = pyfory.field(id=1, default="")
    email: Optional[str] = pyfory.field(id=2, nullable=True, default=None)  # 新字段
```

使用 V1 序列化的数据可以用 V2 反序列化（新字段会是 `None`）。

也可以省略字段 ID（元信息中会使用字段名，开销更大）：

```python
@dataclass
class Data:
    id: pyfory.Int64 = 0
    name: str = ""
```

## 原生模式与 Xlang 模式

字段配置的行为取决于序列化模式：

### 原生模式（仅 Python）

原生模式使用**更宽松的默认值**以获得最大兼容性：

- **可空性**：`str` 和数值类型默认不可空，除非使用 `Optional`
- **引用跟踪**：默认对对象引用启用（`str` 和数值类型除外）

在原生模式中，通常**不需要配置字段注解**，除非你希望：

- 通过使用字段 ID 降低序列化尺寸
- 通过禁用不必要的引用跟踪来优化性能

```python
# 原生模式：不需要 schema 元信息也能工作
@dataclass
class User:
    id: int = 0
    name: str = ""
    tags: List[str] = None
```

### Xlang 模式（跨语言）

由于语言之间的类型系统差异，Xlang 模式使用**更严格的默认值**：

- **可空性**：字段默认不可空（`nullable=False`）
- **引用跟踪**：默认禁用（`ref=False`）

在 xlang 模式中，当出现以下情况时，你**需要配置字段**：

- 字段可以为 None（使用带 `nullable=True` 的 `Optional[T]`）
- 字段需要为共享/循环对象启用引用跟踪（使用 `ref=True`）
- 整数类型需要用于跨语言兼容性的特定编码
- 你希望降低元信息大小（使用字段 ID）

```python
# Xlang 模式：可空/ref 字段需要显式配置
@dataclass
class User:
    id: pyfory.Int64 = pyfory.field(id=0, default=0)
    name: str = pyfory.field(id=1, default="")
    email: Optional[str] = pyfory.field(id=2, nullable=True, default=None)  # 必须声明可空
    friend: Optional["User"] = pyfory.field(id=3, ref=True, nullable=True, default=None)  # 必须声明 ref
```

### 默认值汇总

| 选项       | 原生模式默认值                             | Xlang 模式默认值    |
| ---------- | ------------------------------------------ | ------------------- |
| `nullable` | `str`/数值类型为 `False`；其他类型默认可空 | `False`             |
| `ref`      | `True`（`str` 和数值类型除外）             | `False`             |
| `dynamic`  | `True`（数值/str/time 类型除外）           | `False`（具体类型） |

## 最佳实践

1. **配置字段 ID**：在兼容模式下推荐使用，可降低序列化成本
2. **使用带 `nullable=True` 的 `Optional[T]`**：xlang 模式中可空字段必需
3. **为共享对象启用引用跟踪**：当对象共享或形成循环时使用 `ref=True`
4. **对敏感数据使用 `ignore=True`**：密码、令牌、内部状态
5. **选择合适的编码**：小值使用 `varint`，完整范围值使用 `fixed`
6. **保持 ID 稳定**：一旦分配，不要更改字段 ID

## 选项参考

| 配置                                       | 说明                             |
| ------------------------------------------ | -------------------------------- |
| `pyfory.field(id=N)`                       | 用于降低元信息大小的字段 tag ID  |
| `pyfory.field(nullable=True)`              | 将字段标记为可空                 |
| `pyfory.field(ref=True)`                   | 启用引用跟踪                     |
| `pyfory.field(ignore=True)`                | 从序列化中排除字段               |
| `pyfory.field(dynamic=True)`               | 强制写入类型信息                 |
| `pyfory.field(dynamic=False)`              | 跳过类型信息（使用声明类型）     |
| `Optional[T]`                              | 可空字段的类型提示               |
| `pyfory.Int32`, `pyfory.Int64`             | 有符号整数（varint 编码）        |
| `pyfory.FixedInt32`, `pyfory.FixedInt64`   | 定长有符号整数                   |
| `pyfory.TaggedInt64`                       | int64 的 tagged 编码             |
| `pyfory.UInt32`, `pyfory.UInt64`           | 无符号整数（varint 编码）        |
| `pyfory.FixedUInt32`, `pyfory.FixedUInt64` | 定长无符号整数                   |
| `pyfory.TaggedUInt64`                      | uint64 的 tagged 编码            |

## 相关主题

- [基本序列化](basic-serialization.md) - Fory 序列化入门
- [Schema 演进](schema-evolution.md) - 兼容模式和 Schema 演进
- [Xlang 序列化](xlang-serialization.md) - 与 Java、Rust、C++、Go 互操作
