---
title: 行格式
sidebar_position: 2
id: row_format_spec
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

## 概述

Apache Fory 行格式是一种缓存友好的随机访问二进制格式，专为高性能数据处理而设计。传统序列化格式通常需要完整反序列化，而行格式支持：

- **随机字段访问**：无需反序列化整行即可读取单个字段
- **零拷贝操作**：无需转换数据即可直接访问内存
- **缓存友好布局**：通过优化内存布局提高 CPU 缓存效率
- **跨语言支持**：Java、C++、Python 和 Rust 使用一致的二进制格式

Fory 提供两种行格式：

| 格式     | 语言                    | 使用场景                 |
| -------- | ----------------------- | ------------------------ |
| 标准格式 | Java、C++、Python、Rust | 跨语言兼容               |
| 紧凑格式 | 仅 Java                 | 提高空间效率，减小行大小 |

## 格式对比

| 功能             | 标准格式              | 紧凑格式                      |
| ---------------- | --------------------- | ----------------------------- |
| 字段槽位大小     | 固定 8 字节           | 自然宽度（1、2、4 或 8 字节） |
| null 位图大小    | 按 8 字节对齐         | 按字节对齐，可利用填充空间    |
| null 位图位置    | 位于字段槽位之前      | 位于字段槽位之后（末尾）      |
| 定长结构体       | 变长区（偏移量+大小） | 内联在定长区                  |
| 字段顺序         | Schema 定义的顺序     | 按对齐要求排序                |
| 所有字段均不可空 | 仍保留位图            | 完全省略位图                  |
| 对齐             | 严格按 8 字节对齐     | 宽松对齐（2、4 或 8 字节）    |

---

## 标准行格式

标准格式使用统一的 8 字节字段槽位，优先保证跨语言兼容性和实现简洁性。

### 设计原则

1. **8 字节对齐**：所有主要结构均按 8 字节边界对齐，以优化内存访问
2. **定长字段槽位**：每个字段使用 8 字节槽位，从而统一偏移量计算
3. **null 位图**：使用位向量紧凑地跟踪 null 值
4. **相对偏移量**：变长数据使用相对偏移量定位子缓冲区

### 行的二进制布局

一行结构化数据采用以下布局：

```
+----------------+------------------+------------------+-----+------------------+------------------+
|  Null Bitmap   |  Field 0 Slot    |  Field 1 Slot    | ... |  Field N-1 Slot  |  Variable Data   |
+----------------+------------------+------------------+-----+------------------+------------------+
|  B bytes       |     8 bytes      |     8 bytes      |     |     8 bytes      |  Variable size   |
```

#### null 位图

null 位图用于标记哪些字段包含 null 值：

- **大小**：`((num_fields + 63) / 64) * 8`字节（向上取整到最接近的 8 字节字）
- **编码**：每一位对应一个字段索引
  - 位值`1`= 字段为 null
  - 位值`0`= 字段非 null
- **位顺序**：第一个字节的第 0 位对应字段 0

**示例**：对于 10 个字段，位图大小 =`((10 + 63) / 64) * 8 = 8`字节

#### 字段槽位

无论实际数据类型如何，每个字段都占用一个固定的 8 字节槽位：

- **槽位偏移量**：`bitmap_size + field_index * 8`
- **定长区总大小**：`bitmap_size + num_fields * 8`字节

**不同类型的字段槽位内容**：

| 类型类别 | 槽位内容                  |
| -------- | ------------------------- |
| 定长     | 直接存储值（以零填充）    |
| 变长     | 编码偏移量+大小（见下文） |

#### 变长数据编码

变长字段（字符串、数组、Map 和嵌套结构体）在槽位中存储一对偏移量和大小。该数据对解释为一个小端序 64 位值：

```
+---------------------------+---------------------------+
|    Relative Offset        |         Size              |
|       (32 bits)           |       (32 bits)           |
+---------------------------+---------------------------+
|<-------------- 64-bit field slot value -------------->|
```

- **相对偏移量**（高 32 位）：相对于行基地址的偏移量
- **大小**（低 32 位）：变长数据的字节数
- **物理字节顺序**：字节 0-3 存放大小，字节 4-7 存放相对偏移量

**编码**：

```
offset_and_size = (relative_offset << 32) | size
```

**解码**：

```
relative_offset = (offset_and_size >> 32) & 0xFFFFFFFF
size = offset_and_size & 0xFFFFFFFF
```

#### 变长数据区

变长数据存储在定长区之后：

- 设置字段时按顺序写入数据
- 每个变长值填充到 8 字节对齐
- 填充字节清零，以确保输出具有确定性

### 数组的二进制布局

数组存储同构元素序列：

```
+------------------+------------------+------------------+
|  Element Count   |   Null Bitmap    |   Element Data   |
+------------------+------------------+------------------+
|     8 bytes      |     B bytes      |   Variable size  |
```

#### 数组头部

| 字段      | 大小                          | 说明               |
| --------- | ----------------------------- | ------------------ |
| 元素数量  | 8 字节                        | 元素个数（uint64） |
| null 位图 | `((count + 63) / 64) * 8`字节 | 各元素的 null 标志 |

**头部大小**：`8 + ((num_elements + 63) / 64) * 8`字节

#### 数组元素数据

元素连续存储在头部之后：

- **定长元素**：按自然宽度存储（1、2、4 或 8 字节）
- **变长元素**：存储为 8 字节的偏移量+大小数据对

**元素偏移量**：`header_size + element_index * element_size`

**数据区大小**：向上取整到最接近的 8 字节边界

#### 数组元素大小

| 元素类型        | 元素大小              |
| --------------- | --------------------- |
| bool            | 1 字节                |
| int8            | 1 字节                |
| int16           | 2 字节                |
| int32           | 4 字节                |
| int64           | 8 字节                |
| float32         | 4 字节                |
| float64         | 8 字节                |
| string/二进制   | 8 字节（偏移量+大小） |
| 数组/map/结构体 | 8 字节（偏移量+大小） |

### Map 的二进制布局

Map 将键值对分别存储在两个数组中：

```
+------------------+------------------+------------------+
|  Keys Array Size |   Keys Array     |   Values Array   |
+------------------+------------------+------------------+
|     8 bytes      |   Variable size  |   Variable size  |
```

#### Map 结构

| 字段       | 大小   | 说明                     |
| ---------- | ------ | ------------------------ |
| 键数组大小 | 8 字节 | 键数组的总字节数         |
| 键数组     | 变长   | 用于存储键的完整数组结构 |
| 值数组     | 变长   | 用于存储值的完整数组结构 |

**键数组偏移量**：`base_offset + 8`
**值数组偏移量**：`base_offset + 8 + keys_array_size`

键数组和值数组都遵循标准数组二进制布局，并且必须包含相同数量的元素。

### 嵌套结构体布局

嵌套结构体以完整行结构的形式存储在变长数据区中：

1. 父字段槽位包含指向嵌套行的偏移量+大小
2. 嵌套行拥有自己的 null 位图和字段槽位
3. 支持任意嵌套深度

```
Parent Row:
+----------------+------------------+------------------+
|  Null Bitmap   |  ... Slots ...   |  Nested Row Data |
+----------------+------------------+------------------+
                        |                    ^
                        |  offset+size       |
                        +------------------->+

Nested Row:
+----------------+------------------+------------------+
|  Null Bitmap   |  Field Slots     |  Variable Data   |
+----------------+------------------+------------------+
```

---

## 紧凑行格式（仅 Java）

紧凑格式通过额外优化提高空间效率，目前仅在 Java 中实现。

> **说明**：紧凑格式仍在开发中，目前可能尚不稳定。

### 设计原则

1. **自然宽度存储**：定长字段使用其自然字节宽度，而不是统一使用 8 字节
2. **按对齐要求排序字段**：根据对齐要求排列字段，以尽量减少填充
3. **条件式 null 位图**：所有字段均不可空时省略 null 位图
4. **内联定长结构体**：所有字段均为定长字段的嵌套结构体以内联方式存储

### 紧凑行的二进制布局

```
+------------------+------------------+-----+------------------+----------------+------------------+
|  Field 0 Value   |  Field 1 Value   | ... |  Field N-1 Value | Null Bitmap    |  Variable Data   |
+------------------+------------------+-----+------------------+----------------+------------------+
|  W0 bytes        |  W1 bytes        |     |  WN-1 bytes      | B bytes (opt)  |  Variable size   |
```

#### 与标准格式的主要区别

1. **字段槽位大小**：每个字段使用其自然宽度（Wi = 类型宽度；变长字段为 8）
2. **null 位图位置**：位于字段槽位之后，可以利用对齐填充空间
3. **字段顺序**：按对齐要求排序（8 字节 → 4 字节 → 2 字节 → 1 字节 → 变长）
4. **条件式位图**：所有字段均不可空时完全省略位图

#### null 位图（紧凑格式）

- **大小**：`(num_nullable_fields + 7) / 8`字节（按字节对齐，而不是按 8 字节对齐）
- **省略条件**：所有字段均为基本类型或不可空字段
- **位置**：位于所有定长字段槽位之后，可以使用对齐填充空间

#### 字段排序算法

字段按以下方式排序，以尽量减少填充并优化对齐：

```
Priority order (highest to lowest):
1. Fields with 8-byte alignment (int64, float64, variable-width)
2. Fields with 4-byte alignment (int32, float32)
3. Fields with 2-byte alignment (int16)
4. Fields with 1-byte alignment (int8, bool)
```

在每个对齐分组内，较大的字段排在前面。

#### 定长结构体内联

所有字段均为定长字段的嵌套结构体以内联方式存储在父行中：

**标准格式**（包含 2 个 int32 字段的嵌套结构体）：

```
Parent slot: [offset (4 bytes) | size (4 bytes)]  → Points to nested row (8+ bytes elsewhere)
```

**紧凑格式**（同一个嵌套结构体）：

```
Parent slot: [int32 field 0 | int32 field 1]  → 8 bytes total, inline
```

这样可以消除定长嵌套结构的偏移量+大小间接寻址。

#### 定长宽度计算

字段的定长宽度通过递归方式确定：

- **基本类型**：自然字节宽度（1、2、4 或 8）
- **结构体类型**：所有子字段定长宽度之和（仅当所有子字段均为定长字段）
- **变长类型**（string、数组、map）：返回 -1（使用 8 字节偏移量+大小槽位）

```
fixed_width(field) =
  if primitive: type_width
  if struct and all_children_fixed: header_bytes + sum(fixed_width(child) for each child)
  else: -1 (variable, uses 8-byte slot)
```

### 紧凑数组的二进制布局

```
+------------------+------------------+------------------+
|  Element Count   |   Null Bitmap    |   Element Data   |
+------------------+------------------+------------------+
|     4 bytes      | B bytes (opt)    |   Variable size  |
```

#### 紧凑数组头部

| 字段      | 大小                          | 说明               |
| --------- | ----------------------------- | ------------------ |
| 元素数量  | 4 字节                        | 元素个数（int32）  |
| null 位图 | `(count + 7) / 8`字节（可选） | 各元素的 null 标志 |

**头部大小计算**：

```
header_size = 4 + (element_nullable ? (num_elements + 7) / 8 : 0)

// Round to 8-byte boundary only if element width is 8-byte aligned
if (fixed_width % 8 == 0):
    header_size = round_to_8_bytes(header_size)
```

#### 与标准数组的主要区别

1. **元素数量**：使用 4 字节，而不是 8 字节
2. **null 位图**：按字节对齐；元素不可空时省略
3. **定长结构体**：定长结构体元素以内联方式存储

---

## 通用规范

以下规范同时适用于标准格式和紧凑格式。

### 类型编码

#### 基本类型

| 类型    | 宽度   | 编码                            |
| ------- | ------ | ------------------------------- |
| bool    | 1 字节 | `0x00`（false）或`0x01`（true） |
| int8    | 1 字节 | 二进制补码                      |
| int16   | 2 字节 | 二进制补码，小端序              |
| int32   | 4 字节 | 二进制补码，小端序              |
| int64   | 8 字节 | 二进制补码，小端序              |
| float32 | 4 字节 | IEEE 754 单精度                 |
| float64 | 8 字节 | IEEE 754 双精度                 |

#### 时间类型

| 类型      | 宽度   | 编码                              |
| --------- | ------ | --------------------------------- |
| timestamp | 8 字节 | 自 Unix epoch 起的微秒数（int64） |
| date32    | 4 字节 | 自 Unix epoch 起的天数（int32）   |
| duration  | 8 字节 | 以微秒表示的时长（int64）         |

#### 字符串与二进制数据

- **编码**：字符串使用 UTF-8，二进制数据使用原始字节
- **存储**：字段槽位存储偏移量+大小数据对，数据存储在变长区
- **填充**：标准格式将数据填充到 8 字节对齐，紧凑格式按自然宽度对齐

### null 处理

#### 行中的 null 处理

- null 字段在 null 位图中的对应位设置为 1
- null 字段的槽位内容在标准格式中未定义，在紧凑格式中清零
- 读取 null 字段会返回 null/空值标志

#### 数组中的 null 处理

- null 元素在数组 null 位图中的对应位设置为 1
- null 元素的元素数据未定义
- 紧凑格式：元素不可空时省略位图

#### 变长数据的 null 语义

从 null 字段读取变长数据时：

- 返回大小 -1 或等价的 null 标志
- 不执行数据访问

### 对齐与填充

#### 标准格式对齐

1. **null 位图**：大小向上取整到 8 字节边界
2. **字段槽位**：每个槽位始终为 8 字节
3. **变长数据**：每个值填充到 8 字节边界
4. **数组数据**：整个数据区填充到 8 字节边界

#### 紧凑格式对齐

1. **字段槽位**：使用自然宽度（1、2、4 或 8 字节）
2. **null 位图**：按字节对齐，位于字段之后
3. **变长数据**：仅在需要时填充到 8 字节边界
4. **头部**：可以使用更宽松的对齐方式以降低开销

#### 填充字节

- 所有填充字节都必须设置为零
- 确保序列化输出具有确定性
- 防止未初始化内存造成信息泄露

## 大小计算

### 标准行大小

```
row_size = bitmap_size + num_fields * 8 + variable_data_size

where:
  bitmap_size = ((num_fields + 63) / 64) * 8
  variable_data_size = sum of (padded_size for each variable field)
  padded_size = ((size + 7) / 8) * 8
```

### 紧凑行大小

```
row_size = fixed_region_size + bitmap_size + variable_data_size

where:
  fixed_region_size = sum of (fixed_width(field) or 8 for each field)
  bitmap_size = all_non_nullable ? 0 : (num_nullable_fields + 7) / 8
  // May be rounded to 8-byte boundary if has variable fields
```

### 标准数组大小

```
array_size = header_size + fixed_data_size + variable_data_size

where:
  header_size = 8 + ((num_elements + 63) / 64) * 8
  element_slot_size = natural width for fixed-width elements, otherwise 8
  fixed_data_size = ((num_elements * element_slot_size + 7) / 8) * 8
  variable_data_size = sum of (padded_size for each non-null variable-width element)
  padded_size = ((size + 7) / 8) * 8
```

### 紧凑数组大小

```
array_size = header_size + data_size

where:
  header_size = 4 + (element_nullable ? (num_elements + 7) / 8 : 0)
  // header_size rounded to 8 if element_width % 8 == 0
  data_size = num_elements * element_width
```

### Map 大小

```
map_size = 8 + keys_array_size + values_array_size
```

## 汇总表

### 布局汇总

| 组成部分          | 标准格式                              | 紧凑格式                            |
| ----------------- | ------------------------------------- | ----------------------------------- |
| 行头部            | `((N + 63) / 64) * 8`字节             | 0 或`(N + 7) / 8`字节（位于末尾）   |
| 行字段槽位        | `N * 8`字节                           | `sum(field_widths)`字节             |
| 数组头部          | `8 + ((E + 63) / 64) * 8`字节         | `4 + (E + 7) / 8`字节（元素可空时） |
| 数组元素          | 按 8 字节对齐的槽位以及变长主体       | `E * element_width`                 |
| Map 头部          | 8 字节                                | 8 字节                              |
| 偏移量+大小数据对 | 8 字节`u64`：`(offset << 32) \| size` | 8 字节（相同）                      |

其中，N = 字段数，E = 元素数。

### 类型宽度汇总

| 类别          | 存储宽度 | 标准槽位 | 紧凑槽位      |
| ------------- | -------- | -------- | ------------- |
| bool          | 1 字节   | 8 字节   | 1 字节        |
| int8          | 1 字节   | 8 字节   | 1 字节        |
| int16         | 2 字节   | 8 字节   | 2 字节        |
| int32         | 4 字节   | 8 字节   | 4 字节        |
| int64         | 8 字节   | 8 字节   | 8 字节        |
| float32       | 4 字节   | 8 字节   | 4 字节        |
| float64       | 8 字节   | 8 字节   | 8 字节        |
| string/二进制 | 变长     | 8 字节   | 8 字节        |
| 数组          | 变长     | 8 字节   | 8 字节        |
| map           | 变长     | 8 字节   | 8 字节        |
| 结构体        | 变长     | 8 字节   | 内联或 8 字节 |

## 实现说明

### 字节序

- 所有多字节整数均以**小端序**格式存储
- 浮点值使用 IEEE 754 位表示形式，并按小端字节序存储

### 内存安全

- 写入器必须将填充字节置零，防止信息泄漏
- 读取器必须在访问数据前验证偏移量和大小
- 行格式仅接受可信输入；偏移量和大小检查用于保证正确性并提供纵深防御，不构成处理不可信输入的安全边界

### 性能注意事项

**标准格式**：

- 固定的 8 字节槽位只需简单的算术运算即可实现 O(1) 字段访问
- 8 字节对齐可以优化 CPU 缓存行的使用
- 最适合跨语言互操作

**紧凑格式**：

- 更小的行可以降低内存带宽占用
- 字段排序可尽量减少填充浪费
- 内联结构体消除了指针追踪
- 在某些架构上，宽松对齐可能产生少量 CPU 开销

### 各格式的适用场景

| 场景                           | 推荐格式 |
| ------------------------------ | -------- |
| 跨语言数据交换                 | 标准格式 |
| 仅使用 Java 且内存受限         | 紧凑格式 |
| 包含许多小型基本类型字段       | 紧凑格式 |
| 包含许多嵌套定长结构体         | 紧凑格式 |
| 要求最高读取性能               | 标准格式 |
| 与 Java/C++/Python/Rust 互操作 | 标准格式 |
