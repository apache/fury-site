---
title: 行格式
sidebar_position: 9
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

Apache Fory™ 提供了一种随机访问行格式，能够在不完全反序列化的情况下从二进制数据中读取嵌套字段。当处理大对象且只需要部分数据访问时，这大大减少了开销。

## 概述

行格式是一种缓存友好的二进制随机访问格式，支持：

- **零拷贝访问**：直接从二进制读取字段，无需分配对象
- **部分反序列化**：只访问你需要的字段
- **跳过序列化**：跳过不需要的字段的序列化
- **跨语言兼容性**：在 Python、Java、C++ 和其他语言之间工作
- **列格式转换**：可以自动转换为 Apache Arrow 列格式

## 基本使用

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

// 创建大型数据集
Foo foo = new Foo();
foo.f1 = 10;
foo.f2 = IntStream.range(0, 1_000_000).boxed().collect(Collectors.toList());
foo.f3 = IntStream.range(0, 1_000_000).boxed().collect(Collectors.toMap(i -> "k" + i, i -> i));
List<Bar> bars = new ArrayList<>(1_000_000);
for (int i = 0; i < 1_000_000; i++) {
  Bar bar = new Bar();
  bar.f1 = "s" + i;
  bar.f2 = LongStream.range(0, 10).boxed().collect(Collectors.toList());
  bars.add(bar);
}
foo.f4 = bars;

// 编码为行格式（跨语言兼容 Python/C++）
BinaryRow binaryRow = encoder.toRow(foo);

// 零拷贝随机访问，无需完全反序列化
BinaryArray f2Array = binaryRow.getArray(1);              // 访问 f2 列表
BinaryArray f4Array = binaryRow.getArray(3);              // 访问 f4 列表
BinaryRow bar10 = f4Array.getStruct(10);                  // 访问第 11 个 Bar
long value = bar10.getArray(1).getInt64(5);               // 访问 bar.f2 的第 6 个元素

// 部分反序列化 - 只反序列化你需要的
RowEncoder<Bar> barEncoder = Encoders.bean(Bar.class);
Bar bar1 = barEncoder.fromRow(f4Array.getStruct(10));     // 只反序列化第 11 个 Bar
Bar bar2 = barEncoder.fromRow(f4Array.getStruct(20));     // 只反序列化第 21 个 Bar

// 需要时完全反序列化
Foo newFoo = encoder.fromRow(binaryRow);
```

## 主要优势

| 特性         | 描述                                   |
| ------------ | -------------------------------------- |
| 零拷贝访问   | 读取嵌套字段而无需反序列化整个对象     |
| 内存效率     | 直接从磁盘内存映射大数据集             |
| 跨语言       | Java、Python、C++ 之间的二进制格式兼容 |
| 部分反序列化 | 只反序列化你需要的特定元素             |
| 高性能       | 跳过不必要的数据解析用于分析工作负载   |

## 何时使用行格式

行格式适用于：

- **分析工作负载**：当你只需要访问特定字段时
- **大数据集**：当完全反序列化成本太高时
- **内存映射文件**：处理大于 RAM 的数据
- **数据管道**：无需完整对象重建即可处理数据
- **跨语言数据共享**：当数据需要从多种语言访问时

## 跨语言兼容性

行格式在语言之间无缝工作。相同的二进制数据可以从以下语言访问：

### Python

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

encoder = pyfory.encoder(Foo)
binary: bytes = encoder.to_row(foo).to_bytes()

# 零拷贝访问
foo_row = pyfory.RowData(encoder.schema, binary)
print(foo_row.f2[100000])
print(foo_row.f4[100000].f1)
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

// 零拷贝随机访问
auto f2_array = row->GetArray(1);
auto f4_array = row->GetArray(3);
auto bar10 = f4_array->GetStruct(10);
int64_t value = bar10->GetArray(1)->GetInt64(5);
std::string str = bar10->GetString(0);
```

## 性能比较

| 操作         | 对象格式           | 行格式             |
| ------------ | ------------------ | ------------------ |
| 完全反序列化 | 分配所有对象       | 零分配             |
| 单字段访问   | 需要完全反序列化   | 直接偏移读取       |
| 内存使用     | 完整对象图在内存中 | 仅访问的字段       |
| 适用于       | 小对象，完全访问   | 大对象，选择性访问 |

## 相关主题

- [跨语言序列化](xlang-serialization.md) - XLANG 模式
- [高级特性](advanced-features.md) - 零拷贝序列化
- [行格式规范](https://fory.apache.org/docs/specification/row_format_spec) - 协议详情
