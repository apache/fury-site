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

本文定义 Apache Fory xlang 二进制协议的通用编码格式，适用于多语言互操作场景。

目标：

- 二进制布局跨语言稳定
- 支持引用跟踪、类型元信息和 schema 演进
- 在流式序列化中支持增量写入共享元信息

## 类型系统 {#type-systems}

### 数据类型

xlang 类型分为：

- 基础类型：bool、整数、浮点、string、binary
- 容器类型：list、set、map、array
- 结构类型：enum、struct、union、ext
- 时间类型：duration、timestamp、date

- Rust 中携带数据的 enum 并不是 xlang enum。只有当每个 case 都能表示为一个
  union alternative value 或 `none` 时，它才能映射为联合类型；包含多个 tuple 字段
  或多个命名字段的 variant 仍是宿主语言原生结构。
- `ext` 表示由自定义序列化器进行序列化的类型。

### 宿主外部类型序列化

语言绑定可以将提供序列化行为的宿主类型与被序列化的宿主值类型分开，但这种分离并不构成
编码格式中的类型标识。

- 外部结构序列化器必须生成与直接支持的等价宿主类型相同的 STRUCT、ENUM 或 UNION Schema
  及值字节。
- 不具备 xlang 映射的宿主语言原生结构不属于本规范。语言绑定可以在独立的原生模式中支持
  这种结构，但在启用 xlang 模式时必须拒绝它；不得丢弃字段、将其强制转换为 ENUM 或 UNION、
  合成未声明的 struct alternative，也不得静默编码为 EXT。包含多个 tuple 字段或多个命名
  字段的 Rust enum variant 就属于这种宿主语言原生结构。
- 对于现有的透明载体、LIST、SET、MAP、宿主定长数组或异构 tuple/product 结构，语言绑定
  拥有的静态载体序列化器可以递归地以子序列化器作为参数，但必须生成与直接支持的对应组合
  相同的外层 type ID、现有泛型 `FieldType` 结构、类型元信息、引用帧和值字节。载体序列化器
  不是用户编码格式标识；只有选中的用户类型子节点使用已注册的 ID 或名称。
- 这种等价性包括规范定义的专用载体映射。例如，使用规范 `i32` 序列化器的 Rust vector
  载体序列化器使用 `INT32_ARRAY`，使用规范 `u8` 序列化器时使用 BINARY，使用外部结构
  序列化器或自定义序列化器时使用 LIST。嵌套载体必须保留选中的子 type ID 和递归
  `FieldType`；序列化器组合不得将规范的基本类型数组或 binary 映射替换为 LIST。
  相反，Swift `Array` 载体序列化器必须保持 LIST，因为这是 Swift 静态选择的规范
  `Array` 映射。Swift 稠密 `@ArrayField` 映射与动态精确基本类型数组映射是独立的规范选择；
  序列化器的 target 恰好是数值类型并不会使其获得其中任何一种映射。
- 异构 tuple/product 载体序列化器必须保留语言绑定已有的直接 tuple 编码及其已有的 xlang
  LIST 编码。选中的子位置不得增加直接支持的 tuple 未编码的序列化器名称、位置索引、
  泛型 Schema 节点或其他标记。缺少或多出的兼容位置遵循该语言绑定的普通 tuple 规则。
- 如果缺失或为空的载体分支通常不会访问子类型标识或注册表支持的元数据，则不得仅为验证
  选中的序列化器而添加合成的子元数据。只有常规 Schema 或值路径实际使用已注册的子类型
  标识时才要求注册。声明类型的子节点 body 继续使用静态选择的行为，不增加编码格式标识，
  也不重复查询注册表；此前的类型标识验证由包含它的 Schema 元数据负责。载体序列化器本身
  在所有情况下都不注册。
- 如果自定义序列化器不是运行时中某个现有内建类型的规范实现，则必须使用现有的 EXT 或
  NAMED_EXT 形式。序列化器提供者与 target 的分离不能取代运行时拥有的内建映射。
- 序列化器提供者、外部结构序列化器或生成代码的类型名称不得改变编码后的 type ID、已注册
  的用户 ID 或名称、TypeDef、字段顺序、Schema hash、引用帧或值字节。
- 即使序列化行为由另一个宿主类型提供，注册和多态分派也必须标识被序列化的 target value。

### 多态

协议支持多态对象。解码端可依据 type meta 判断运行时真实类型，并选择对应 serializer。

### 类型消歧

当某语言类型可映射到多个 Fory 类型（如 fixed/varint/tagged 整数）时，必须通过字段元信息或类型注解消歧。

### 类型 ID

类型由 `internal_type_id` 与（可选）`user_type_id` 共同表达：

- 内建类型通常直接由 internal ID 唯一表示
- 用户类型通过 internal kind + user ID（或命名类型）表示

#### 内部类型 ID 表 {#internal-type-id-table}

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

#### 用户类型的 Type ID 编码

用户类型采用拆分编码：

- 先写 internal type ID（8-bit kind）
- 再写 `user_type_id`（varuint32）

不做 bit packing，便于实现与调试。

### 类型映射

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

## 引用元信息

### 引用标记

| 标记                 | 值   | 含义                                      |
| -------------------- | ---- | ----------------------------------------- |
| NULL_FLAG            | -3   | null                                      |
| REF_FLAG             | -2   | 已出现对象，后接 ref id                   |
| NOT_NULL_VALUE_FLAG  | -1   | 非空但不跟踪引用                          |
| REF_VALUE_FLAG       | 0    | 首次出现的可引用对象                      |

### 引用跟踪算法

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

### 引用 ID 分配

ref id 按对象首次出现顺序递增分配，从 0 开始。

### 禁用引用跟踪时

禁用引用跟踪时，仅使用 null / not-null 两类标记，不维护 ref 表。

### 语言特定注意事项

不同语言应保证：

- 对象身份判定一致（身份而非值相等）
- 容器元素引用语义一致
- 循环引用场景先占位后填充

## 类型元信息

### Type ID 编码

type id 使用 varuint 编码写入。

### 类型元信息载荷

在以下情况写额外 type meta：

- 命名类型（`NAMED_*`）
- compatible struct 需要 TypeDef
- 运行时未声明类型需要动态 type info

### 共享类型元信息（流式）

共享 type meta 采用“索引 + 可选定义体”流式写法：

```
index_marker = (index << 1) | is_ref
```

- `is_ref=1`：引用已有 type
- `is_ref=0`：新 type，后接定义体

### TypeDef（Schema 演进元数据）

TypeDef 用于描述 compatible 模式的字段元信息（字段名/tag、nullable/ref、字段类型）。

#### 全局头部

TypeDef 头部包含：

- payload size
- flags（如 compress、has_fields_meta）
- payload hash

#### TypeDef 主体

主体包含：

- class 层次信息（父类到子类）
- 每层字段数量与类型标识
- 字段级元信息（名称编码/tag、nullable/ref、field type）

Reader 可以拒绝超过运行时资源限制的 TypeDef，例如 metadata body 字节数上限或一个 struct
TypeDef 中的最大字段数。这些限制是接收侧资源控制，不改变 TypeDef 编码格式、类型标识、
动态加载、unknown-type handling、注册策略或 Schema 演进语义。

纯 id-based enum、ext 和 typed-union value 不携带 TypeDef body。接收侧 TypeDef 资源限制只在
stream 实际携带 shared TypeDef metadata 时适用。

## 元字符串

meta string 用于 namespace、typename、fieldname 的压缩表示。

### 编码类型 ID

常见编码族：

- UTF8
- LOWER_SPECIAL
- LOWER_UPPER_DIGIT_SPECIAL
- FIRST_TO_LOWER_SPECIAL
- ALL_TO_LOWER_SPECIAL

### 字符映射表

#### LOWER_SPECIAL（每个字符 5 位）

适用于小写字母 + 高频特殊字符集合。

#### LOWER_UPPER_DIGIT_SPECIAL（每个字符 6 位）

适用于大小写字母、数字与特殊字符混合场景。

### 编码算法

#### LOWER_SPECIAL 编码

按 5-bit 映射逐字符编码，无法映射的字符需回退至其他编码。

#### FIRST_TO_LOWER_SPECIAL 编码

首字符单独处理，其余字符按 LOWER_SPECIAL 编码。

#### ALL_TO_LOWER_SPECIAL 编码

先归一化，再按 LOWER_SPECIAL 编码。

### 编码选择算法

编码选择策略：

1. 尝试最紧凑编码
2. 若字符集合不满足则降级
3. 必要时回退 UTF8

### 元字符串头部格式

```
| size_bits | encoding_bits |
```

当 `size` 超过短头范围时追加 varuint 扩展长度。

### 各上下文的特殊字符集

不同上下文（包名、类型名、字段名）允许字符集合可不同，编码器需按上下文选择合法表。

### 去重

meta string 可按会话去重，减少重复写入。

## 值格式

### 基础类型

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

#### String 头部

`(byte_length << 2) | coder`，coder 表示 UTF8/LATIN1/UTF16 等。

#### 编码算法

按候选编码尝试，优先选择更紧凑且可无损表示的编码。

#### 按语言选择编码

各语言实现可按本地字符串内部表示优化，但线上编码结果必须与规范一致。

#### 空字符串

空串长度为 0，仍应写合法 header。

### duration

通常写 `seconds + nanos`。

### collection/list

列表布局：

1. 长度
2. elements header
3. （可选）元素类型信息
4. 元素数据

#### 元素头部

header 位用于表达：

- 是否跟踪元素引用
- 是否含 null
- 是否同构
- 是否使用声明类型

#### 头部后的类型信息

在同构且非声明类型场景，可在 header 后一次性写 element type info。

#### 根据头部序列化元素

根据 header 走不同元素序列化路径（同构快路径 / 异构慢路径）。

#### 元素数据

元素数据按顺序编码；null 与 ref 标记按配置插入。当元素的具体类型不同时，如果不跟踪引用
且载荷不含 null，则每个元素都必须通过完整的 `fory.write` 路径写入。

### array

#### 基本类型数组

基础类型数组可直接按内存块拷贝（注意 endian 与对齐）。

#### 多维数组

多维数组按嵌套 array/list 递归表达。

#### 对象数组

对象数组元素逐个编码，支持引用与多态。

### map

map 使用分块编码（chunk-based）。

#### Map 分块格式

```
| map_size | chunk_1 | chunk_2 | ... |
```

#### KV 头部位

header 位描述 key/value 的：

- 是否跟踪引用
- 是否含 null
- 是否使用声明类型

#### 分块大小

- 非 null chunk 包含 1 到 255 个键值对；0 无效。
- key 或 value 为 null 时，该 entry 单独构成一个隐式大小为 1 的 chunk，并省略 chunk size
  字节。
- entry 中恰好一侧为 null 时，非 null 一侧按照完整字段顺序编码：先写引用 envelope（若有），
  再写 header 中未声明的类型信息，最后写 body。
- Reader 根据相对于 map 总大小的累计读取数量判断何时停止读取 chunk。

#### 为什么使用分块格式？

减少每个 entry 重复写 type info 的成本，提升吞吐。

#### 为什么逐块序列化？

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

#### 字段顺序

推荐使用规范定义的稳定分组排序，避免语言实现差异导致 hash 不一致。

##### 步骤 1：字段标识

字段标识优先使用 tag ID；否则使用标准化字段名（如 snake_case）。

##### 步骤 2：分组

按字段类别分组（primitive、builtin、collection/map、other）。

##### 步骤 3：组内排序

组内使用稳定比较器（type + name/tag）排序。

##### 注意事项

实现必须保证排序确定性（deterministic）。

#### Schema 一致模式（禁用元信息共享）

不共享 meta 时，双方 schema 需一致；通常直接按固定顺序写字段值。

#### 兼容模式（启用元信息共享）

共享 TypeDef 后可按字段名/tag 做映射，未知字段跳过。

### Union

#### IDL 语法

```protobuf
union Animal {
  Dog dog = 1;
  Cat cat = 2;
}
```

#### Type ID 与类型元信息

union 本体有独立 type id，case 使用 case id 区分分支。

每个 Schema 中定义的 alternative 必须只包含一个声明值类型或 `none`。如果一个逻辑分支
需要多个字段，必须显式声明一个 struct value；语言绑定不得根据宿主 enum variant 合成该
struct。

#### Union 值载荷

```
| case_id | case_value |
```

#### 编码布局

根据 case 类型是否需要引用/类型元信息决定具体布局。

#### 解码规则

先读 case_id，再按 case 类型规则读 payload；未知 case 可按兼容策略跳过或报错。

#### 各 Type ID 的适用场景

- 结构稳定、跨语言常驻类型：建议固定数值 type id
- 动态类型/未注册类型：使用命名类型路径

#### 兼容性说明

新增 union case 应使用新 case id，不应复用旧 id。

### Type

动态 `type` 值应携带足够 type meta，确保接收端可判别并解码。

## 常见陷阱

常见问题：

1. 字段排序不稳定导致 schema/hash 不一致
2. varint 与 fixed/tagged 配置不一致
3. null 与空值语义混淆
4. 引用跟踪开关两端不一致
5. 命名类型 namespace/typename 不稳定

## 语言实现指南

- 统一 little-endian
- 明确对象身份语义（用于 ref tracking）
- 对所有 offset/size 做边界与溢出检查
- 维护跨版本回归用例（含演进、循环引用、复杂容器）
- 与 Java/Python/C++/Rust/Go 做双向互测
