---
title: 行格式
sidebar_position: 11
id: row_format
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

Apache Fory™ 提供随机访问行格式，可以在不完全反序列化的情况下从二进制数据中读取嵌套字段。

## 概述

当只需要部分数据访问时，行格式可以大幅减少处理大型对象的开销。它还支持内存映射文件，实现超低内存占用。

**核心优势：**

| 特性         | 描述                                     |
| ------------ | ---------------------------------------- |
| 零拷贝访问   | 无需反序列化整个对象即可读取嵌套字段     |
| 内存效率     | 直接从磁盘内存映射大型数据集             |
| 跨语言       | Python、Java、C++ 之间的二进制格式兼容   |
| 部分反序列化 | 仅反序列化所需的特定元素                 |
| 高性能       | 跳过不必要的数据解析，适用于分析工作负载 |

## 基础用法

```python
import pyfory
import pyarrow as pa
from dataclasses import dataclass
from typing import List, Dict

@dataclass
class Bar:
    f1: str
    f2: List[pa.int64]

@dataclass
class Foo:
    f1: pa.int32
    f2: List[pa.int32]
    f3: Dict[str, pa.int32]
    f4: List[Bar]

# 为行格式创建编码器
encoder = pyfory.encoder(Foo)

# 创建大型数据集
foo = Foo(
    f1=10,
    f2=list(range(1_000_000)),
    f3={f"k{i}": i for i in range(1_000_000)},
    f4=[Bar(f1=f"s{i}", f2=list(range(10))) for i in range(1_000_000)]
)

# 编码为行格式
binary: bytes = encoder.to_row(foo).to_bytes()

# 零拷贝访问 - 无需完全反序列化！
foo_row = pyfory.RowData(encoder.schema, binary)
print(foo_row.f2[100000])              # 直接访问第 100,000 个元素
print(foo_row.f4[100000].f1)           # 直接访问嵌套字段
print(foo_row.f4[200000].f2[5])        # 直接访问深层嵌套字段
```

## 跨语言兼容性

行格式可以跨语言无缝工作。相同的二进制数据可以从 Java 和 C++ 访问。

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

// 编码为行格式（与 Python 跨语言兼容）
BinaryRow binaryRow = encoder.toRow(foo);

// 零拷贝随机访问，无需完全反序列化
BinaryArray f2Array = binaryRow.getArray(1);              // 访问 f2 列表
BinaryArray f4Array = binaryRow.getArray(3);              // 访问 f4 列表
BinaryRow bar10 = f4Array.getStruct(10);                  // 访问第 11 个 Bar
long value = bar10.getArray(1).getInt64(5);               // 访问 bar.f2 的第 6 个元素

// 部分反序列化 - 仅反序列化所需内容
RowEncoder<Bar> barEncoder = Encoders.bean(Bar.class);
Bar bar1 = barEncoder.fromRow(f4Array.getStruct(10));     // 仅反序列化第 11 个 Bar
Bar bar2 = barEncoder.fromRow(f4Array.getStruct(20));     // 仅反序列化第 21 个 Bar
```

### C++

```cpp
#include "fory/encoder/row_encoder.h"
#include "fory/row/writer.h"

struct Bar {
  std::string f1;
  std::vector<int64_t> f2;
};

FORY_FIELD_INFO(Bar, f1, f2);

struct Foo {
  int32_t f1;
  std::vector<int32_t> f2;
  std::map<std::string, int32_t> f3;
  std::vector<Bar> f4;
};

FORY_FIELD_INFO(Foo, f1, f2, f3, f4);

fory::encoder::RowEncoder<Foo> encoder;
encoder.Encode(foo);
auto row = encoder.GetWriter().ToRow();

// 零拷贝随机访问，无需完全反序列化
auto f2_array = row->GetArray(1);                    // 访问 f2 列表
auto f4_array = row->GetArray(3);                    // 访问 f4 列表
auto bar10 = f4_array->GetStruct(10);                // 访问第 11 个 Bar
int64_t value = bar10->GetArray(1)->GetInt64(5);    // 访问 bar.f2 的第 6 个元素
std::string str = bar10->GetString(0);               // 访问 bar.f1
```

## 安装

行格式需要 Apache Arrow：

```bash
pip install pyfory[format]
```

## 何时使用行格式

- **分析工作负载**：当您只需要访问特定字段时
- **大型数据集**：当完全反序列化成本太高时
- **内存映射文件**：处理大于 RAM 的数据
- **数据管道**：在不完全对象重建的情况下处理数据
- **跨语言数据共享**：当数据需要从多种语言访问时

## 相关主题

- [跨语言序列化](xlang-serialization.md) - XLANG 模式
- [基础序列化](basic-serialization.md) - 对象序列化
- [行格式规范](https://fory.apache.org/docs/specification/row_format_spec) - 协议详情
