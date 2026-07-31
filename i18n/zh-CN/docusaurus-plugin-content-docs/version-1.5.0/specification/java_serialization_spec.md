---
title: Java 序列化格式
sidebar_position: 1
id: java_serialization_spec
license: |
  Licensed to the Apache Software Foundation (ASF) under one or more
  contributor license agreements.  See the NOTICE file distributed with
  this work for additional information regarding copyright ownership.
  The ASF licenses this file to You under the Apache License, Version 2.0
  (the "License"); you may not use this file except in compliance
  with the License.  You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
---

本文定义 Apache Fory Java 原生序列化格式的编码格式细节。

## 规范概览

Fory Java 原生格式面向 Java 对象图，支持：

- 共享引用与循环引用
- 多态对象
- 可选 schema 演进
- 流式写入（共享 type meta 按需内联，不要求预先 meta 区）

Java native 是 xlang 编码格式的扩展，复用相同核心帧与基础编码。

总体布局：

```
| fory header | object ref meta | object type meta | object value data |
```

字节序统一为 little-endian。大端平台实现需在数组等路径做字节序转换，确保线上格式一致。

## Fory 头部

Java 原生序列化头部是 1-byte 位图：

```
|     5 bits    | 1 bit | 1 bit | 1 bit |
+--------------+-------+-------+-------+
| reserved     |  oob  | xlang | null  |
```

含义：

- `null`：对象是否为 null（为 1 时其余位不应置位）
- `xlang`：1 表示 xlang 格式，0 表示 Java native
- `oob`：1 表示存在 `BufferCallback`

头部始终 1 字节，不额外写 language ID。

## 引用元信息

引用跟踪标记与 xlang 一致：

| 标记                 | 字节值 | 说明                                                   |
| -------------------- | ------ | ------------------------------------------------------ |
| NULL FLAG            | `-3`   | 对象为 null，后续不写对象内容                          |
| REF FLAG             | `-2`   | 已出现对象，后接 `varuint32` 的 reference ID           |
| NOT_NULL VALUE FLAG  | `-1`   | 非空但该类型未启用引用跟踪，后接对象内容               |
| REF VALUE FLAG       | `0`    | 可引用对象首次出现，后接对象内容，并分配新 reference ID |

当全局或字段级禁用引用跟踪时，仅使用 `NULL FLAG` 与 `NOT_NULL VALUE FLAG`。

## Type system and type IDs

Java native 使用与 xlang 统一的类型 ID 组合方式：

```
full_type_id = (user_type_id << 8) | internal_type_id
```

- `internal_type_id`：低 8 位，表示类型种类
- `user_type_id`：用户注册数值 ID（适用于用户 enum/struct/ext）
- named 类型使用 `NAMED_*`，其标识来自元信息（命名空间+类型名）

### Shared internal type IDs (0-63)

Java native 与 xlang 共享 `< 64` 的 internal IDs：

- `0~56` 已定义
- `57~63` 预留

详见 [Xlang Serialization Format](xlang_serialization_spec.md#internal-type-id-table)。

### Java native built-in type IDs

Java 专有内建类型从 `Types.BOUND + 5` 开始（`Types.BOUND=64`，预留 5 个）。

| Type ID | Name                       | Description                    |
| ------- | -------------------------- | ------------------------------ |
| 69      | VOID_ID                    | java.lang.Void                 |
| 70      | CHAR_ID                    | java.lang.Character            |
| 71      | PRIMITIVE_VOID_ID          | void                           |
| 72      | PRIMITIVE_BOOL_ID          | boolean                        |
| 73      | PRIMITIVE_INT8_ID          | byte                           |
| 74      | PRIMITIVE_CHAR_ID          | char                           |
| 75      | PRIMITIVE_INT16_ID         | short                          |
| 76      | PRIMITIVE_INT32_ID         | int                            |
| 77      | PRIMITIVE_FLOAT32_ID       | float                          |
| 78      | PRIMITIVE_INT64_ID         | long                           |
| 79      | PRIMITIVE_FLOAT64_ID       | double                         |
| 80      | PRIMITIVE_BOOLEAN_ARRAY_ID | boolean[]                      |
| 81      | PRIMITIVE_BYTE_ARRAY_ID    | byte[]                         |
| 82      | PRIMITIVE_CHAR_ARRAY_ID    | char[]                         |
| 83      | PRIMITIVE_SHORT_ARRAY_ID   | short[]                        |
| 84      | PRIMITIVE_INT_ARRAY_ID     | int[]                          |
| 85      | PRIMITIVE_FLOAT_ARRAY_ID   | float[]                        |
| 86      | PRIMITIVE_LONG_ARRAY_ID    | long[]                         |
| 87      | PRIMITIVE_DOUBLE_ARRAY_ID  | double[]                       |
| 88      | STRING_ARRAY_ID            | String[]                       |
| 89      | OBJECT_ARRAY_ID            | Object[]                       |
| 90      | ARRAYLIST_ID               | java.util.ArrayList            |
| 91      | HASHMAP_ID                 | java.util.HashMap              |
| 92      | HASHSET_ID                 | java.util.HashSet              |
| 93      | CLASS_ID                   | java.lang.Class                |
| 94      | EMPTY_OBJECT_ID            | empty object stub              |
| 95      | LAMBDA_STUB_ID             | lambda stub                    |
| 96      | JDK_PROXY_STUB_ID          | JDK proxy stub                 |
| 97      | REPLACE_STUB_ID            | writeReplace/readResolve stub  |
| 98      | NONEXISTENT_META_SHARED_ID | meta-shared unknown class stub |

### Registration and named types

用户类型可按数值或名称注册：

- 数值注册：`full_type_id = (user_id << 8) | internal_type_id`
- 名称注册：通过 namespace + typename
- 未注册类型按 named 类型写出（namespace=包名，typename=类名）

未注册时命名类型选择：

- enum -> `NAMED_ENUM`
- struct-like -> `NAMED_STRUCT`（兼容模式下 `NAMED_COMPATIBLE_STRUCT`）
- 其他自定义 serializer -> `NAMED_EXT`

## Type meta encoding

每个值写入流程：

1. 写 `type_id`（varuint32 small7）
2. 对 `NAMED_*` / `COMPATIBLE_STRUCT` 等类型按规则写额外元信息
3. 其余类型无需额外 meta

### Shared class meta (streaming)

开启 meta share 时，使用流式共享 class meta：

```
| varuint32: index_marker | [class def bytes if new] |

index_marker = (index << 1) | flag
flag = 1 -> reference
flag = 0 -> new type
```

- `flag=1`：引用历史 type，后续无 class def bytes
- `flag=0`：新 type，后续内联 class def
- index 按首次出现顺序递增

## Schema modes

Java native 支持两种模式：

- **Schema consistent**（compatible 关闭）：字段按固定顺序写，不需要 ClassDef
- **Schema evolution**（compatible 开启）：按 ClassDef 元信息支持演进

## ClassDef format (compatible mode)

ClassDef 是 compatible struct 的演进元信息。

### Binary layout

```
| 8 bytes header | [varuint32 extra size] | class meta bytes |
```

header 位布局：

```
| 50-bit hash | 4 bits reserved | 1 bit compress | 1 bit has_fields_meta | 8-bit size |
```

规则：

- `size` 为低 8 位；若为 `0xFF`，后接扩展长度
- `compress`：payload 是否压缩
- `has_fields_meta`：是否含字段元信息
- `reserved` 必须为 0
- `hash` 为 payload + flags 的 50-bit 哈希

### Class meta bytes

表示线性化继承层次（父 -> 子）与字段信息：

```
| num_classes | class_layer_0 | class_layer_1 | ... |

class_layer:
| num_fields << 1 | registered_flag | [type_id if registered] |
| namespace | type_name | field_infos |
```

Reader 可以拒绝超过运行时资源限制的 TypeDef，例如 metadata body 字节数上限或一个
TypeDef 中的最大字段数。这些限制是接收侧资源控制，不改变 TypeDef 编码格式、类型标识、
动态类加载、unknown-class handling、注册策略或 Schema 演进语义。

### Field info

每个字段：

```
| field_header | [field_name_bytes] | field_type |
```

`field_header`：

- bit0: trackingRef
- bit1: nullable
- bit2-3: 字段名编码
- bit4-6: name length/tag ID（7 表示扩展）
- bit7: reserved=0

字段名编码：

- 0: UTF8
- 1: ALL_TO_LOWER_SPECIAL
- 2: LOWER_UPPER_DIGIT_SPECIAL
- 3: TAG_ID（省略字段名，存 tag）

### Field type encoding

字段类型使用 type tag + 可选嵌套类型信息：

| Tag | 字段类型                                  |
| --- | ----------------------------------------- |
| 0   | Object (ObjectFieldType)                  |
| 1   | Map (MapFieldType)                        |
| 2   | Collection/List/Set (CollectionFieldType) |
| 3   | Array (ArrayFieldType)                    |
| 4   | Enum (EnumFieldType)                      |
| 5+  | Registered type (RegisteredFieldType)     |

嵌套类型头部低位可携带 `nullable/tracking_ref` 标志。

## Meta string encoding

namespace、type name、field name 复用 xlang 的 meta string 编码。

### Package and type names

头部：

```
| 6 bits size | 2 bits encoding |
```

- `size=63` 时追加扩展长度
- package 支持：UTF8 / ALL_TO_LOWER_SPECIAL / LOWER_UPPER_DIGIT_SPECIAL
- type name 支持：UTF8 / LOWER_UPPER_DIGIT_SPECIAL / FIRST_TO_LOWER_SPECIAL / ALL_TO_LOWER_SPECIAL

### Field names

字段名编码与 ClassDef 的 field header 规则一致；若使用 TAG_ID，则不写名字字节。

### Encoding algorithms

具体算法参见 xlang 规范 `#meta-string`。

## Value encodings

以下为 Java native 常见内建 serializer 的值布局。自定义 `EXT` 可定义自身值格式，但必须遵循“引用元信息 + 类型元信息”通道规则。

### Primitives

- boolean: 1 byte（0/1）
- byte: 1 byte
- short: 2 bytes little-endian
- char: 2 bytes little-endian（UTF-16 code unit）
- int: fixed(4 bytes) 或 varint32(ZigZag)
- long: fixed(8 bytes) / varint64(ZigZag) / tagged int64
- float: IEEE754 float32
- double: IEEE754 float64

### String

```
| varuint36_small: (num_bytes << 2) | coder | string bytes |
```

- coder(2 bits)：LATIN1 / UTF16 / UTF8
- UTF16 采用 little-endian code unit

### Enum

- `serializeEnumByName=true`：写 enum 名称（meta string）
- 否则：写 enum tag（`varuint32 small7`）
  - 默认情况下，tag 就是声明顺序对应的 ordinal。
  - 如果 enum 配置了 `@ForyEnumId`，则写入其配置的稳定 ID。Java 支持恰好标注一个 ID 字段、一个无参 ID getter，或为每个 enum 常量显式指定 tag 值。

### Binary (byte[])

```
| varuint32: num_bytes | raw bytes |
```

### Primitive arrays

默认：

```
| varuint32: byte_length | raw bytes |
```

可选压缩：

- `compressIntArray`：`| length | varint32... |`
- `compressLongArray`：`| length | varint64/tagged... |`

### Object arrays

```
| varuint32_small7: (length << 1) | mono_flag |
```

- `mono_flag=1`：单态数组，共享组件 serializer
- `mono_flag=0`：每元素独立 class info + data

### Collections (List/Set)

```
| varuint32_small7: length | elements_header | [elem_class_info] | elements... |
```

`elements_header`：

- bit0: TRACKING_REF
- bit1: HAS_NULL
- bit2: IS_DECL_ELEMENT_TYPE
- bit3: IS_SAME_TYPE

### Maps

```
| varuint32_small7: size | chunk_1 | chunk_2 | ... |

chunk:
| header | chunk_size | [key_class_info] | [value_class_info] | entries... |
```

Map 采用 chunk 编码，每块最多 255 entries；key/value 的引用跟踪与类型声明按 header 位图控制。

#### Null key/value entries

`null key` 或 `null value` 使用特殊单条 chunk，不写 `chunk_size`，只写对应 payload。

### Objects and structs

对象值通道：

```
| ref meta | type meta | field data |
```

标准对象序列化中：

- 字段按稳定顺序（DescriptorGrouper）排序
- compatible 模式可借助 ClassDef 映射字段并跳过未知字段
- 字段是否写 ref/type meta 由 nullable/ref/polymorphic 策略决定

### Extensions (EXT)

EXT 类型值由注册 serializer 定义；但其外层仍遵循统一的引用与类型元信息协议。

## Out-of-band buffers

当提供 `BufferCallback` 时，header 的 `oob` 位置 1。此时 serializer 可输出“缓冲区引用”而非内联字节（如大数组）。
主流中仅保留引用信息，具体 OOB 缓冲区协议由 callback 实现定义。
