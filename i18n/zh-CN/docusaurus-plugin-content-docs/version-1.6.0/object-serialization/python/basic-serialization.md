---
title: 基础序列化
sidebar_position: 1
id: basic-serialization
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

## 跨语言互操作 {#cross-language-interoperability}

所有受支持的 Fory 实现都共用默认 xlang 格式。以下内容说明它的跨语言类型映射、类型标识和互操作要求。

`pyfory` 支持跨语言对象图序列化，可以在 Python 中序列化数据，再由 Java、C++、Go、Rust、JavaScript/TypeScript、C#、Swift、Dart、Scala、Kotlin 或其他受支持语言进行反序列化。

### Xlang 配置

Python 默认使用支持兼容 Schema 演进的跨语言模式。跨语言示例会显式设置该模式：

```python
import pyfory
fory = pyfory.Fory(xlang=True, ref=False, strict=True)
```

### 跨语言示例

#### Python（序列化端）

```python
import pyfory
from dataclasses import dataclass

f = pyfory.Fory(xlang=True, ref=True)

# Register type for xlang compatibility
@dataclass
class Person:
    name: str
    age: pyfory.Int32

f.register(Person, name="example.Person")

person = Person("Charlie", 35)
binary_data = f.serialize(person)
# binary_data can now be sent to Java, Go, etc.
```

#### Java（反序列化端）

```java
import org.apache.fory.*;

public class Person {
    public String name;
    public int age;
}

Fory fory = Fory.builder()
    .withXlang(true)
    .withRefTracking(true)
    .build();

fory.register(Person.class, "example.Person");
Person person = (Person) fory.deserialize(binaryData);
```

#### Rust（反序列化端）

```rust
use fory::Fory;
use fory::ForyStruct;

#[derive(ForyStruct)]
struct Person {
    name: String,
    age: i32,
}

let mut fory = Fory::builder().xlang(true).build();

fory.register_by_name::<Person>("example.Person");
let person: Person = fory.deserialize(&binary_data)?;
```

### 跨语言类型注解

使用 pyfory 类型注解显式指定跨语言类型映射：

请直接在 Python 类型注解中使用这些标记。字段值仍是普通 Python `int` 或 `float` 值，Fory 会使用指定的跨语言数字宽度和编码对其进行序列化。

```python
from dataclasses import dataclass
from typing import Dict, List
import pyfory

@dataclass
class TypedData:
    int_value: pyfory.Int32       # 32-bit integer
    long_value: pyfory.Int64      # 64-bit integer
    float_value: pyfory.Float32   # 32-bit float
    double_value: pyfory.Float64  # 64-bit float
    values: Dict[pyfory.Int32, List[pyfory.Int64]]
```

嵌套集合注解是字段 Schema 的一部分。兼容模式读取会根据远程 Schema 元数据消费字节，并且只有在解码值能够安全满足本地 Schema 时才进行赋值。

### 低精度类型

`pyfory.Float16` 和 `pyfory.BFloat16` 是为跨语言低精度字段保留的注解标记，并非值包装类；标量值会反序列化为原生 Python `float`。

稠密低精度数组使用具有类列表序列行为的公共稠密包装器。通过 `pyfory.Float16Array.from_values([...])` 或 `pyfory.BFloat16Array.from_values([...])` 从 Python 数字值构造。仅在使用 `from_buffer(...)` 和 `to_buffer()` 处理已经需要的打包小端序 `uint16` 存储，并希望走原始缓冲区快速路径时采用该方式。

### 类型映射

| Python 标记/载体       | Java           | Rust            | Go                    |
| ---------------------- | -------------- | --------------- | --------------------- |
| `str`                  | `String`       | `String`        | `string`              |
| `int`                  | `long`         | `i64`           | `int64`               |
| `pyfory.Int32`         | `int`          | `i32`           | `int32`               |
| `pyfory.Int64`         | `long`         | `i64`           | `int64`               |
| `float`                | `double`       | `f64`           | `float64`             |
| `pyfory.Float32`       | `float`        | `f32`           | `float32`             |
| `pyfory.Float16`       | `Float16`      | `Float16`       | `float16.Float16`     |
| `pyfory.BFloat16`      | `BFloat16`     | `BFloat16`      | `bfloat16.BFloat16`   |
| `pyfory.Float16Array`  | `Float16List`  | `Vec<Float16>`  | `[]float16.Float16`   |
| `pyfory.BFloat16Array` | `BFloat16List` | `Vec<BFloat16>` | `[]bfloat16.BFloat16` |
| `list`                 | `List`         | `Vec`           | `[]T`                 |
| `dict`                 | `Map`          | `HashMap`       | `map[K]V`             |

#### 列表与稠密数组

Python `List[T]` 映射到 Fory `list<T>`。仅当需要使用 `pyfory.Array[T]`、`pyfory.NDArray[T]` 或 `pyfory.PyArray[T]` 表示稠密一维 `array<T>` Schema 时，才采用这些注解。

| Fory Schema       | Python 注解和默认载体                              |
| ----------------- | -------------------------------------------------- |
| `list<int32>`     | `List[pyfory.Int32]`                               |
| `array<bool>`     | `pyfory.Array[bool]` -> `BoolArray`                |
| `array<int8>`     | `pyfory.Array[pyfory.Int8]` -> `Int8Array`         |
| `array<int16>`    | `pyfory.Array[pyfory.Int16]` -> `Int16Array`       |
| `array<int32>`    | `pyfory.Array[pyfory.Int32]` -> `Int32Array`       |
| `array<int64>`    | `pyfory.Array[pyfory.Int64]` -> `Int64Array`       |
| `array<uint8>`    | `pyfory.Array[pyfory.UInt8]` -> `UInt8Array`       |
| `array<uint16>`   | `pyfory.Array[pyfory.UInt16]` -> `UInt16Array`     |
| `array<uint32>`   | `pyfory.Array[pyfory.UInt32]` -> `UInt32Array`     |
| `array<uint64>`   | `pyfory.Array[pyfory.UInt64]` -> `UInt64Array`     |
| `array<float16>`  | `pyfory.Array[pyfory.Float16]` -> `Float16Array`   |
| `array<bfloat16>` | `pyfory.Array[pyfory.BFloat16]` -> `BFloat16Array` |
| `array<float32>`  | `pyfory.Array[pyfory.Float32]` -> `Float32Array`   |
| `array<float64>`  | `pyfory.Array[pyfory.Float64]` -> `Float64Array`   |

`pyfory.*Array` 包装器接受 `pyfory.Float32Array([1, 2, 3])` 等可迭代对象构造器，并在自有稠密存储上提供类列表序列行为。

`pyfory.Array[T]`、`pyfory.NDArray[T]` 和 `pyfory.PyArray[T]` 都描述相同的 Fory `array<T>` Schema，区别仅在于 Python 载体契约：

| Python 字段注解     | 该字段接受的值                                          | 反序列化载体         |
| ------------------- | ------------------------------------------------------- | -------------------- |
| `pyfory.Array[T]`   | `pyfory.*Array`, `numpy.ndarray`, `array.array`, `list` | `pyfory.*Array`      |
| `pyfory.NDArray[T]` | `numpy.ndarray`                                         | `numpy.ndarray`      |
| `pyfory.PyArray[T]` | Python `array.array`                                    | Python `array.array` |

在兼容模式下，只要两个注解都归一为相同的 Fory `array<T>` Schema，写入端和读取端就可以为同名字段使用不同的 Python 载体。例如，声明为 `pyfory.Array[pyfory.Int32]` 的写入端字段，可以由匹配字段声明为 `pyfory.NDArray[pyfory.Int32]` 的 Python 类读取，读取端会得到 NumPy `int32` ndarray。反向模式同样适用于 `pyfory.PyArray[T]`；该名称始终表示 Python `array.array`。

PyArrow 是独立的行式/列式格式能力，不是 `pyfory.PyArray` 载体。使用 `pyfory.format.from_arrow_schema(...)` 和 `pyfory.format.to_arrow_schema(...)` 在 PyArrow Schema 与 Fory Row Format Schema 之间转换。

### 与 Python 原生模式的区别

二进制协议和 API 与 `pyfory` 的 Python 原生模式相似，但 Python 原生模式可以序列化任意 Python 对象，包括全局函数、本地函数、lambda、本地类，以及使用 `__getstate__/__reduce__/__reduce_ex__` 自定义序列化的类型；这些值在跨语言模式中**不允许使用**。

### 规范与参考

- [跨语言序列化规范](../../specification/xlang_serialization_spec.md)
- [类型映射参考](../../specification/xlang_type_mapping.md)
- [Java 跨语言序列化指南](../java/basic-serialization.md#cross-language-interoperability)
- [Rust 跨语言序列化指南](../rust/basic-serialization.md#cross-language-interoperability)

### 相关指南

- [配置](configuration.md) - 跨语言模式设置
- [Schema 演进](schema-evolution.md) - 兼容模式
- [类型注册](type-registration.md) - 注册模式

### 读取 Java 文件示例

```python
import pyfory
from dataclasses import dataclass

@dataclass
class Person:
    name: str
    age: pyfory.Int32

fory = pyfory.Fory(xlang=True)
fory.register_type(Person, name="example.Person")

with open("person.bin", "rb") as f:
    data = f.read()

person = fory.deserialize(data)
print(f"Name: {person.name}, Age: {person.age}")
# Output: Name: Alice, Age: 30
```

### 内置值

```python
import pyfory
import numpy as np

fory = pyfory.Fory(xlang=True)
object_list = [True, False, "str", -1.1, 1,
               np.full(100, 0, dtype=np.int32), np.full(20, 0.0, dtype=np.double)]
data = fory.serialize(object_list)
# bytes can be deserialized by other languages
new_list = fory.deserialize(data)
object_map = {"k1": "v1", "k2": object_list, "k3": -1}
data = fory.serialize(object_map)
# bytes can be deserialized by other languages
new_map = fory.deserialize(data)
print(new_map)
```

### 自定义值

```python
from dataclasses import dataclass
from typing import List, Dict, Any
import pyfory, array


@dataclass
class SomeClass1:
    f1: Any
    f2: Dict[pyfory.Int8, pyfory.Int32]


@dataclass
class SomeClass2:
    f1: Any = None
    f2: str = None
    f3: List[str] = None
    f4: Dict[pyfory.Int8, pyfory.Int32] = None
    f5: pyfory.Int8 = None
    f6: pyfory.Int16 = None
    f7: pyfory.Int32 = None
    # int type will be taken as `pyfory.Int64`.
    # use `pyfory.Int32` for type hint if peer uses more narrow type.
    f8: int = None
    f9: pyfory.Float32 = None
    # float type will be taken as `pyfory.Float64`
    f10: float = None
    f11: pyfory.Array[pyfory.Int16] = None
    f12: List[pyfory.Int16] = None


if __name__ == "__main__":
    f = pyfory.Fory(xlang=True)
    f.register_type(SomeClass1, name="example.SomeClass1")
    f.register_type(SomeClass2, name="example.SomeClass2")
    obj1 = SomeClass1(f1=True, f2={-1: 2})
    obj = SomeClass2(
        f1=obj1,
        f2="abc",
        f3=["abc", "abc"],
        f4={1: 2},
        f5=2 ** 7 - 1,
        f6=2 ** 15 - 1,
        f7=2 ** 31 - 1,
        f8=2 ** 63 - 1,
        f9=1.0 / 2,
        f10=1 / 3.0,
        f11=array.array("h", [1, 2]),
        f12=[-1, 4],
    )
    data = f.serialize(obj)
    # bytes can be deserialized by other languages
    print(f.deserialize(data))
```

### 共享引用与循环引用

```python
from typing import Dict
import pyfory

class SomeClass:
    f1: "SomeClass"
    f2: Dict[str, str]
    f3: Dict[str, str]

fory = pyfory.Fory(xlang=True, ref=True)
fory.register_type(SomeClass, name="example.SomeClass")
obj = SomeClass()
obj.f2 = {"k1": "v1", "k2": "v2"}
obj.f1, obj.f3 = obj, obj.f2
data = fory.serialize(obj)
# bytes can be deserialized by other languages
print(fory.deserialize(data))
```

## 相关主题

- [配置](configuration.md) - Fory 参数
- [类型注册](type-registration.md) - 注册模式
- [原生序列化](native.md) - 函数与 lambda
- [带外序列化](out-of-band.md) - 缓冲区回调 API
