---
title: Row 格式
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

Apache Fory Row Format 是面向高性能数据处理的二进制布局，目标是“可随机访问 + 低拷贝 + 跨语言一致”。

相较于必须整对象反序列化的格式，Row Format 支持：

- **随机字段读取**：只读目标字段
- **零拷贝访问**：在可行场景直接基于内存切片读取
- **缓存友好布局**：降低 CPU cache miss
- **跨语言一致性**：Java/C++/Python 可共享标准格式

Fory 提供两种变体：

| 格式             | 支持语言             | 典型用途                         |
| ---------------- | -------------------- | -------------------------------- |
| Standard Format  | Java、C++、Python    | 跨语言一致、实现简单             |
| Compact Format   | 仅 Java              | 更小体积、更高局部性             |

## 格式对比

| 特性                   | Standard Format                   | Compact Format                         |
| ---------------------- | --------------------------------- | -------------------------------------- |
| 字段槽位大小           | 固定 8 字节                       | 按自然宽度（1/2/4/8 字节）             |
| Null Bitmap            | 8 字节对齐                        | 字节对齐，可借用尾部 padding           |
| Null Bitmap 位置       | 字段槽位之前                      | 字段槽位之后（尾部）                   |
| 固定大小 struct        | 放在 variable region（offset+size） | 可内联到 fixed region                |
| 字段顺序               | 按 schema 定义顺序                | 按对齐规则排序                         |
| 全非空字段             | 仍保留 bitmap                     | 可完全省略 bitmap                      |
| 对齐策略               | 严格 8 字节                       | 放宽（2/4/8 字节）                     |

## 标准 Row 格式

标准格式强调跨语言统一与实现稳定：字段槽位统一 8 字节。

### 设计原则

1. **8 字节对齐**：主要结构按 8-byte 对齐
2. **固定槽位**：每字段固定 8-byte slot，便于常数时间寻址
3. **位图标记 null**：通过 bitset 跟踪空值
4. **相对偏移**：变长数据通过相对偏移定位

### Row 二进制布局

```
+----------------+------------------+------------------+-----+------------------+------------------+
|  Null Bitmap   |  Field 0 Slot    |  Field 1 Slot    | ... |  Field N-1 Slot  |  Variable Data   |
+----------------+------------------+------------------+-----+------------------+------------------+
|  B bytes       |     8 bytes      |     8 bytes      |     |     8 bytes      |  Variable size   |
```

#### Null Bitmap

- 大小：`((num_fields + 63) / 64) * 8` 字节（向上取整到 8-byte word）
- 编码：每 bit 对应一个字段
- bit=1 表示 null，bit=0 表示非 null
- 第一字节 bit0 对应 field0

#### 字段槽位

- 任意字段都占 8 字节 slot
- 槽位偏移：`bitmap_size + field_index * 8`
- 固定区总大小：`bitmap_size + num_fields * 8`

槽位内容：

| 字段类别         | 槽位内容                                  |
| ---------------- | ----------------------------------------- |
| 定长类型         | 值直接写入（不足补零）                    |
| 变长类型         | `offset + size` 打包                      |

#### 变长字段编码

变长字段（string/array/map/nested struct）在 slot 中写入：

```
+---------------------------+---------------------------+
|    Relative Offset        |         Size              |
|       (32 bits)           |       (32 bits)           |
+---------------------------+---------------------------+
```

- 高 32 位：相对 row 起始地址偏移
- 低 32 位：数据长度（字节）

编码：

```
offset_and_size = (relative_offset << 32) | size
```

解码：

```
relative_offset = (offset_and_size >> 32) & 0xFFFFFFFF
size = offset_and_size & 0xFFFFFFFF
```

#### Variable Data 区

- 位于 fixed region 之后
- 变长字段按写入顺序顺排
- 每个条目按 8-byte 对齐
- padding 字节清零，保证输出确定性

### Array 二进制布局

```
+------------------+------------------+------------------+
|  Element Count   |   Null Bitmap    |   Element Data   |
+------------------+------------------+------------------+
|     8 bytes      |     B bytes      |   Variable size  |
```

#### Array Header

| 字段            | 大小                            | 说明                    |
| --------------- | ------------------------------- | ----------------------- |
| Element Count   | 8 字节                          | 元素数量（uint64）      |
| Null Bitmap     | `((count + 63) / 64) * 8` 字节 | 每元素 null 标记        |

#### Array Element Data

- 定长元素按自然宽度连续存储
- 变长元素存 8-byte `offset+size`
- 元素偏移：`header_size + element_index * element_size`
- 数据区总大小按 8-byte 对齐

#### Array 元素大小

| 元素类型         | 元素占用                   |
| ---------------- | -------------------------- |
| bool/int8        | 1 byte                     |
| int16            | 2 bytes                    |
| int32/float32    | 4 bytes                    |
| int64/float64    | 8 bytes                    |
| string/binary    | 8 bytes（offset+size）     |

### Map 二进制布局

Map 在 Row Format 中可视为键值对数组，并包含类型信息与可空位图。

#### Map 结构

推荐逻辑结构：

1. entry count
2. key/value null bitmap（按实现可拆分）
3. key data
4. value data

#### 嵌套 Struct 布局

嵌套 struct 在标准格式中作为变长字段处理：

- slot 写 `offset+size`
- value region 中存其完整 row 二进制
- 可递归嵌套

## Compact Row Format（仅 Java）

Compact 格式针对 Java 本地执行链路做体积与局部性优化，不保证与标准格式完全同布局。

### 设计原则

1. 字段槽按自然宽度缩小
2. 字段重排以减少 padding
3. null bitmap 可省略或压缩
4. 定长嵌套 struct 尽可能内联

### Compact Row Binary Layout

总体仍是“fixed + variable”双区结构，但 fixed region 更紧凑，null bitmap 可能后置。

#### 与标准格式的关键差异

- slot 宽度非固定 8 字节
- bitmap 可后置
- 全非空时 bitmap 可省略
- 可内联定长 nested struct

#### Null Bitmap（Compact）

- 按字节对齐
- 可能复用尾部 padding
- 无可空字段时可完全移除

#### 字段排序算法

典型排序目标：

- 优先高对齐需求字段
- 次序兼顾读取热度与 padding 最小化
- 保持可重复计算（deterministic）

#### 定长 Struct 内联

若嵌套 struct 满足定长条件，可直接内联到 fixed region，减少一次间接寻址。

#### 定宽计算

定宽字段总大小由字段类型宽度与对齐约束共同决定，实际布局由编译器/运行时规划器输出。

### Compact Array Binary Layout

与标准数组类似，但 header 与元素布局可采用更紧凑表示。

#### Compact Array Header

包含：元素数量、null 信息（可选）、元素布局元信息（按实现）。

#### 与标准数组关键差异

- 头部更短
- 元素存储更贴近自然宽度
- 在 Java 热路径下更节省内存带宽

## 通用规范

### 类型编码

#### Primitive Types

基础类型按既定宽度和 endian 读写（默认 little-endian）。

#### Temporal Types

- `date`：通常以 epoch day 表示
- `timestamp`：通常以 epoch 纳秒或秒+纳秒表示

#### String 与 Binary

都属于变长类型，使用 `offset+size` 指向真实 payload。

### Null 处理

#### Row Null 处理

由 row bitmap 标记字段 null 状态，null 字段对应 slot 内容可忽略。

#### Array Null 处理

由数组 bitmap 标记每个元素是否为 null。

#### 变长 null 语义

null 与空值（如空字符串、空数组）必须区分；空值应写长度为 0 的实体。

### 对齐与 Padding

#### Standard 对齐

以 8-byte 为主，保证跨语言一致实现简单。

#### Compact 对齐

允许 2/4/8 灵活对齐，目标是减少浪费。

#### Padding 字节

padding 建议写 0，避免未初始化内存泄露并提高可重复性。

## 大小计算

### Standard Row 大小

```
row_size = bitmap_size + num_fields * 8 + aligned(variable_region_size)
```

### Compact Row 大小

```
row_size = compact_fixed_size + optional_bitmap + aligned(variable_region_size)
```

### Standard Array 大小

```
array_size = header_size + aligned(element_data_size)
```

### Compact Array 大小

```
array_size = compact_header_size + aligned(compact_element_data_size)
```

### Map 大小

```
map_size = map_header + aligned(keys_region) + aligned(values_region)
```

## 汇总表

### 布局总结

| 结构            | Standard                         | Compact (Java)                   |
| --------------- | -------------------------------- | -------------------------------- |
| Row             | bitmap + 8-byte slots + var data | compact fixed + optional bitmap + var data |
| Array           | count + bitmap + elements        | compact header + elements        |
| Map             | count + key/value data regions   | 依实现可紧凑化                   |

### 类型宽度总结

| 类型族                 | 典型宽度                    |
| ---------------------- | --------------------------- |
| bool/int8              | 1 byte                      |
| int16                  | 2 bytes                     |
| int32/float32          | 4 bytes                     |
| int64/float64          | 8 bytes                     |
| string/binary/复杂类型 | slot 中 8-byte offset+size  |

## 实现说明

### Endianness

统一使用 little-endian，跨语言实现必须一致。

### 内存安全

- 读取前先做边界检查
- 对 offset/size 做溢出检查
- 避免使用未初始化 padding

### 性能建议

- 批量顺序写入，减少随机写
- 热字段优先放 fixed region 前部
- 通过 profile 决定是否启用 compact

### 何时选择哪种格式

- **Standard**：跨语言互通、调试友好、长期兼容
- **Compact**：Java 单语言链路、内存敏感、高吞吐场景
