---
title: Python 行格式
sidebar_position: 4
id: python
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

Apache Fory™ 提供一种支持随机访问的行格式，无需完整反序列化即可从二进制数据中读取嵌套字段。

## 概述

在处理仅需访问部分数据的大型对象时，行格式可大幅降低开销。它还支持内存映射文件，从而实现极低的内存占用。

**主要优势：**

| 特性         | 说明                                          |
| ------------ | --------------------------------------------- |
| 零拷贝访问   | 无需反序列化整个对象即可读取嵌套字段          |
| 内存效率     | 直接从磁盘对大型数据集进行内存映射            |
| 跨语言       | 二进制格式在 Python、Java、C++、Rust 之间兼容 |
| 部分反序列化 | 仅反序列化所需的特定元素                      |
| 高性能       | 为分析工作负载跳过不必要的数据解析            |

## 基本用法

```python
from dataclasses import dataclass
from typing import Dict, List

import pyfory

@dataclass
class Bar:
    f1: str
    f2: List[pyfory.Int64]

@dataclass
class Foo:
    f1: pyfory.Int32
    f2: List[pyfory.Int32]
    f3: Dict[str, pyfory.Int32]
    f4: List[Bar]

# Create encoder for row format
encoder = pyfory.encoder(Foo)

# Create large dataset
foo = Foo(
    f1=10,
    f2=list(range(1_000_000)),
    f3={f"k{i}": i for i in range(1_000_000)},
    f4=[Bar(f1=f"s{i}", f2=list(range(10))) for i in range(1_000_000)]
)

# Encode to row format
binary: bytes = encoder.to_row(foo).to_bytes()

# Zero-copy access - no full deserialization needed!
foo_row = pyfory.RowData(encoder.schema, binary)
print(foo_row.f2[100000])              # Access 100,000th element directly
print(foo_row.f4[100000].f1)           # Access nested field directly
print(foo_row.f4[200000].f2[5])        # Access deeply nested field directly
```

## PyArrow Schema 转换

行格式可通过 `pyfory.format` 转换 PyArrow Schema，前提是已安装 `format` 可选依赖：

```python
import pyarrow as pa
from pyfory.format import from_arrow_schema, to_arrow_schema

arrow_schema = pa.schema(
    [
        pa.field("id", pa.int32(), nullable=False),
        pa.field("scores", pa.list_(pa.float64())),
    ]
)

fory_schema = from_arrow_schema(arrow_schema)
roundtrip_arrow_schema = to_arrow_schema(fory_schema)
```

通过行编码器将 Python 值直接转换为 Arrow 批次或表：

```python
encoder = pyfory.encoder(Foo)
record_batch = encoder.to_arrow_record_batch([foo] * 10_000)
table = encoder.to_arrow_table([foo] * 10_000)
```

此 PyArrow 转换接口与跨语言稠密数组字段注解相互独立。在对象序列化中，`pyfory.PyArray[T]` 表示 Python 标准库中的 `array.array` 载体，而不是 PyArrow。

## 跨语言兼容性

行格式可在多种语言之间无缝使用。同一份二进制数据可通过 Java、C++ 和 Rust 访问。

### Java

```java
public class Bar {
  String f1;
  List<Long> f2;
}

public class Foo {
  int f1;
  List<Integer> f2;
  Map<String, Integer> f3;
  List<Bar> f4;
}

RowEncoder<Foo> encoder = Encoders.bean(Foo.class);

// Encode to row format (cross-language compatible with Python)
BinaryRow binaryRow = encoder.toRow(foo);

// Zero-copy random access without full deserialization
BinaryArray f2Array = binaryRow.getArray(1);              // Access f2 list
BinaryArray f4Array = binaryRow.getArray(3);              // Access f4 list
BinaryRow bar10 = f4Array.getStruct(10);                  // Access 11th Bar
long value = bar10.getArray(1).getInt64(5);               // Access 6th element of bar.f2

// Partial deserialization - only deserialize what you need
RowEncoder<Bar> barEncoder = Encoders.bean(Bar.class);
Bar bar1 = barEncoder.fromRow(f4Array.getStruct(10));     // Deserialize 11th Bar only
Bar bar2 = barEncoder.fromRow(f4Array.getStruct(20));     // Deserialize 21st Bar only
```

### C++

```cpp
#include "fory/encoder/row_encoder.h"
#include "fory/row/writer.h"

struct Bar {
  std::string f1;
  std::vector<int64_t> f2;
  FORY_STRUCT(Bar, f1, f2);
};

struct Foo {
  int32_t f1;
  std::vector<int32_t> f2;
  std::map<std::string, int32_t> f3;
  std::vector<Bar> f4;
  FORY_STRUCT(Foo, f1, f2, f3, f4);
};

fory::row::encoder::RowEncoder<Foo> encoder;
encoder.encode(foo);
auto row = encoder.get_writer().to_row();

// Zero-copy random access without full deserialization
auto f2_array = row->get_array(1);                   // Access f2 list
auto f4_array = row->get_array(3);                   // Access f4 list
auto bar10 = f4_array->get_struct(10);               // Access 11th Bar
int64_t value = bar10->get_array(1)->get_int64(5);   // Access 6th element of bar.f2
std::string str = bar10->get_string(0);              // Access bar.f1
```

## 安装

行格式依赖 Apache Arrow：

```bash
pip install pyfory[format]
```

## 何时使用行格式

- **分析工作负载**：仅需访问特定字段时
- **大型数据集**：完整反序列化成本过高时
- **内存映射文件**：处理大于内存容量的数据时
- **数据管道**：无需完整重建对象即可处理数据
- **跨语言数据共享**：需要从多种语言访问数据时

## 相关主题

- [Xlang 序列化](../object-serialization/python/xlang.md) - xlang 模式
- [基本序列化](../object-serialization/python/core-api.md) - 对象序列化
- [行格式规范](https://fory.apache.org/docs/specification/row_format_spec) - 协议详情
