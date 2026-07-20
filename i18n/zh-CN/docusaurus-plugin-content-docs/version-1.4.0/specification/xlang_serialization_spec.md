---
title: Xlang 序列化格式
sidebar_position: 4
id: xlang_serialization_spec
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

## 跨语言序列化规范

本文定义 Apache Fory xlang 二进制协议的通用线格式，适用于多语言互操作场景。

目标：

- 二进制布局跨语言稳定
- 支持引用跟踪、类型元信息和 schema 演进
- 在流式序列化中支持增量写入共享元信息

## 类型系统

### 数据类型

xlang 类型分为：

- 基础类型：bool、整数、浮点、string、binary
- 容器类型：list、set、map、array
- 结构类型：enum、struct、union、ext
- 时间类型：duration、timestamp、date

### Polymorphisms

协议支持多态对象。解码端可依据 type meta 判断运行时真实类型，并选择对应 serializer。

### Type disambiguation

当某语言类型可映射到多个 Fory 类型（如 fixed/varint/tagged 整数）时，必须通过字段元信息或类型注解消歧。

### Type ID

类型由 `internal_type_id` 与（可选）`user_type_id` 共同表达：

- 内建类型通常直接由 internal ID 唯一表示
- 用户类型通过 internal kind + user ID（或命名类型）表示

#### Internal Type ID Table

核心 internal IDs（示例）：

| ID  | 类型                |
| --- | ------------------- |
| 1   | bool                |
| 2-20| 各类数字类型        |
| 21  | string              |
| 22  | list                |
| 23  | set                 |
| 24  | map                 |
| 25  | enum                |
| 27  | struct              |
| 28  | compatible_struct   |
| 31  | ext                 |
| 33  | union               |
| 36  | none                |
| 37  | duration            |
| 38  | timestamp           |
| 39  | date                |
| 40+ | decimal/binary/array 等 |

完整映射见 [Xlang 类型映射](xlang_type_mapping.md)。

#### Type ID Encoding for User Types

用户类型采用拆分编码：

- 先写 internal type ID（8-bit kind）
- 再写 `user_type_id`（varuint32）

不做 bit packing，便于实现与调试。

### Type mapping

跨语言类型映射总表见 [xlang_type_mapping.md](xlang_type_mapping.md)。

## 规范概览

顶层布局：

```
| fory header | reference meta | type meta | value payload |
```

协议默认 little-endian。

## Fory 头部

头部是 1-byte bitmap：

```
| reserved(5) | oob(1) | xlang(1) | null(1) |
```

- `null=1` 时值为空，不再写值数据
- `xlang=1` 表示采用 xlang 格式
- `oob=1` 表示存在 out-of-band 缓冲区引用

## Reference Meta

### Reference Flags

| 标记                 | 值   | 含义                                      |
| -------------------- | ---- | ----------------------------------------- |
| NULL_FLAG            | -3   | null                                      |
| REF_FLAG             | -2   | 已出现对象，后接 ref id                   |
| NOT_NULL_VALUE_FLAG  | -1   | 非空但不跟踪引用                          |
| REF_VALUE_FLAG       | 0    | 首次出现的可引用对象                      |

### Reference Tracking Algorithm

写侧：

1. 先判断 null
2. 若可引用且已出现，写 `REF_FLAG + ref_id`
3. 若可引用且首次出现，写 `REF_VALUE_FLAG` 并登记
4. 若不可引用，写 `NOT_NULL_VALUE_FLAG`

读侧：

1. 读取标记
2. `REF_FLAG` 时按 ref_id 回表
3. `REF_VALUE_FLAG` 时先构造对象再登记
4. `NOT_NULL_VALUE_FLAG` 时直接读值

### Reference ID Assignment

ref id 按对象首次出现顺序递增分配，从 0 开始。

### When Reference Tracking is Disabled

禁用引用跟踪时，仅使用 null / not-null 两类标记，不维护 ref 表。

### Language-Specific Considerations

不同语言应保证：

- 对象身份判定一致（身份而非值相等）
- 容器元素引用语义一致
- 循环引用场景先占位后填充

## Type Meta

### Type ID encoding

type id 使用 varuint 编码写入。

### Type meta payload

在以下情况写额外 type meta：

- 命名类型（`NAMED_*`）
- compatible struct 需要 TypeDef
- 运行时未声明类型需要动态 type info

### Shared Type Meta (streaming)

共享 type meta 采用“索引 + 可选定义体”流式写法：

```
index_marker = (index << 1) | is_ref
```

- `is_ref=1`：引用已有 type
- `is_ref=0`：新 type，后接定义体

### TypeDef (schema evolution metadata)

TypeDef 用于描述 compatible 模式的字段元信息（字段名/tag、nullable/ref、字段类型）。

#### Global header

TypeDef 头部包含：

- payload size
- flags（如 compress、has_fields_meta）
- payload hash

#### TypeDef body

主体包含：

- class 层次信息（父类到子类）
- 每层字段数量与类型标识
- 字段级元信息（名称编码/tag、nullable/ref、field type）

Reader 可以拒绝超过运行时资源限制的 TypeDef，例如 metadata body 字节数上限或一个 struct
TypeDef 中的最大字段数。这些限制是接收侧资源控制，不改变 TypeDef 编码格式、类型标识、
动态加载、unknown-type handling、注册策略或 Schema 演进语义。

纯 id-based enum、ext 和 typed-union value 不携带 TypeDef body。接收侧 TypeDef 资源限制只在
stream 实际携带 shared TypeDef metadata 时适用。

## Meta String

meta string 用于 namespace、typename、fieldname 的压缩表示。

### Encoding Type IDs

常见编码族：

- UTF8
- LOWER_SPECIAL
- LOWER_UPPER_DIGIT_SPECIAL
- FIRST_TO_LOWER_SPECIAL
- ALL_TO_LOWER_SPECIAL

### Character Mapping Tables

#### LOWER_SPECIAL (5 bits per character)

适用于小写字母 + 高频特殊字符集合。

#### LOWER_UPPER_DIGIT_SPECIAL (6 bits per character)

适用于大小写字母、数字与特殊字符混合场景。

### Encoding Algorithms

#### LOWER_SPECIAL Encoding

按 5-bit 映射逐字符编码，无法映射的字符需回退至其他编码。

#### FIRST_TO_LOWER_SPECIAL Encoding

首字符单独处理，其余字符按 LOWER_SPECIAL 编码。

#### ALL_TO_LOWER_SPECIAL Encoding

先归一化，再按 LOWER_SPECIAL 编码。

### Encoding Selection Algorithm

编码选择策略：

1. 尝试最紧凑编码
2. 若字符集合不满足则降级
3. 必要时回退 UTF8

### Meta String Header Format

```
| size_bits | encoding_bits |
```

当 `size` 超过短头范围时追加 varuint 扩展长度。

### Special Character Sets by Context

不同上下文（包名、类型名、字段名）允许字符集合可不同，编码器需按上下文选择合法表。

### Deduplication

meta string 可按会话去重，减少重复写入。

## Value Format

### Basic types

#### bool

1 字节：`0x00/0x01`。

#### int8

1 字节有符号整型。

#### int16

2 字节 little-endian。

#### unsigned int32

固定 4 字节无符号整型。

#### unsigned varint32

varint32（无符号）编码。

#### signed int32

固定 4 字节有符号整型。

#### signed varint32

ZigZag + varint32。

#### unsigned int64

固定 8 字节无符号整型。

#### unsigned varint64

varint64（无符号）编码。

#### unsigned hybrid int64 (TAGGED_UINT64)

tagged 编码，兼顾小值空间效率与大值表示范围。

#### VarUint36Small

用于字符串头等场景的紧凑长度编码。

#### signed int64

固定 8 字节有符号整型。

#### signed varint64

ZigZag + varint64。

#### signed hybrid int64 (TAGGED_INT64)

tagged int64 编码。

#### float8

预留/实验类型，生产互操作需谨慎。

#### float16

16-bit 浮点。

#### bfloat16

bfloat16 表示。

#### float32

IEEE 754 float32 little-endian。

#### float64

IEEE 754 float64 little-endian。

### string

字符串编码：

```
| header(varuint36_small) | bytes |
```

header 中包含 byte length 与 coder 信息。

#### String Header

`(byte_length << 2) | coder`，coder 表示 UTF8/LATIN1/UTF16 等。

#### Encoding Algorithm

按候选编码尝试，优先选择更紧凑且可无损表示的编码。

#### Encoding Selection by Language

各语言实现可按本地字符串内部表示优化，但线上编码结果必须与规范一致。

#### Empty String

空串长度为 0，仍应写合法 header。

### duration

通常写 `seconds + nanos`。

### collection/list

列表布局：

1. 长度
2. elements header
3. （可选）元素类型信息
4. 元素数据

#### Elements Header

header 位用于表达：

- 是否跟踪元素引用
- 是否含 null
- 是否同构
- 是否使用声明类型

#### Type Info After Header

在同构且非声明类型场景，可在 header 后一次性写 element type info。

#### Element Serialization Based on Header

根据 header 走不同元素序列化路径（同构快路径 / 异构慢路径）。

#### elements data

元素数据按顺序编码；null 与 ref 标记按配置插入。

### array

#### primitive array

基础类型数组可直接按内存块拷贝（注意 endian 与对齐）。

#### Multi-dimensional arrays

多维数组按嵌套 array/list 递归表达。

#### object array

对象数组元素逐个编码，支持引用与多态。

### map

map 使用分块编码（chunk-based）。

#### Map Chunk Format

```
| map_size | chunk_1 | chunk_2 | ... |
```

#### KV Header Bits

header 位描述 key/value 的：

- 是否跟踪引用
- 是否含 null
- 是否使用声明类型

#### Chunk Size

每个 chunk 大小上限通常为 255 entries。

#### Why Chunk-Based Format?

减少每个 entry 重复写 type info 的成本，提升吞吐。

#### Why serialize chunk by chunk?

在 key/value 类型局部一致时可批量走快路径，并简化解码分支。

### enum

enum 以无符号 varint tag 进行序列化。对于普通 enum，这个 tag 通常就是声明顺序对应的 ordinal。某些实现或代码生成出的 enum 形式也可能改用显式的稳定 enum value 或 variant ID。若编码依赖声明顺序，重新排列 enum 值会导致反序列化结果不再符合用户预期。在这种情况下，用户应优先采用基于显式稳定 ID 的编码，或注册自定义 enum serializer，在禁用 unique hash 的前提下写入稳定的字符串表示。

### timestamp

通常写 `seconds + nanos` 或统一 epoch 精度表示。

### date

通常写 epoch day。

### decimal

decimal 由 scale + unscaled value 表示（实现可用大整数）。

### struct

struct 编码：字段按稳定顺序写入。

#### Field order

推荐使用规范定义的稳定分组排序，避免语言实现差异导致 hash 不一致。

##### Step 1: Field identifier

字段标识优先使用 tag ID；否则使用标准化字段名（如 snake_case）。

##### Step 2: Group assignment

按字段类别分组（primitive、builtin、collection/map、other）。

##### Step 3: Intra-group ordering

组内使用稳定比较器（type + name/tag）排序。

##### Notes

实现必须保证排序确定性（deterministic）。

#### Schema consistent (meta share disabled)

不共享 meta 时，双方 schema 需一致；通常直接按固定顺序写字段值。

#### Compatible mode (meta share enabled)

共享 TypeDef 后可按字段名/tag 做映射，未知字段跳过。

### Union

#### IDL syntax

```protobuf
union Animal {
  Dog dog = 1;
  Cat cat = 2;
}
```

#### Type IDs and type meta

union 本体有独立 type id，case 使用 case id 区分分支。

#### Union value payload

```
| case_id | case_value |
```

#### Wire layouts

根据 case 类型是否需要引用/类型元信息决定具体布局。

#### Decoding rules

先读 case_id，再按 case 类型规则读 payload；未知 case 可按兼容策略跳过或报错。

#### When to use each type ID

- 结构稳定、跨语言常驻类型：建议固定数值 type id
- 动态类型/未注册类型：使用命名类型路径

#### Compatibility notes

新增 union case 应使用新 case id，不应复用旧 id。

### Type

动态 `type` 值应携带足够 type meta，确保接收端可判别并解码。

## Common Pitfalls

常见问题：

1. 字段排序不稳定导致 schema/hash 不一致
2. varint 与 fixed/tagged 配置不一致
3. null 与空值语义混淆
4. 引用跟踪开关两端不一致
5. 命名类型 namespace/typename 不稳定

## Language Implementation Guidelines

- 统一 little-endian
- 明确对象身份语义（用于 ref tracking）
- 对所有 offset/size 做边界与溢出检查
- 维护跨版本回归用例（含演进、循环引用、复杂容器）
- 与 Java/Python/C++/Rust/Go 做双向互测
