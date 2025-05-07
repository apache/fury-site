---
title: Fury Xlang Serialization Format
sidebar_position: 0
id: fury_xlang_serialization_spec
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

> 格式版本历史：
>
> - 版本 0.1 - 正式确定序列化规范

Fury 跨语言序列化（xlang serialization）是一个支持引用和多态的自动对象序列化框架。  
Fury 会将对象与 Fury 跨语言序列化二进制格式相互转换。  
Fury 跨语言序列化有两个核心概念：

- **Fury 跨语言二进制格式**
- **不同语言实现的框架，用于对象与 Fury 跨语言二进制格式之间的转换**

该序列化格式是**动态二进制格式**。动态性、引用和多态支持使得 Fury 更加灵活、易用，但也因此相比静态序列化框架复杂得多，因此格式也更加复杂。


## 类型系统

### 数据类型

- bool：布尔值（true 或 false）。
- int8：8 位有符号整数。
- int16：16 位有符号整数。
- int32：32 位有符号整数。
- var_int32：使用 Fury var_int32 编码的 32 位有符号整数。
- int64：64 位有符号整数。
- var_int64：使用 Fury PVL 编码的 64 位有符号整数。
- sli_int64：使用 Fury SLI 编码的 64 位有符号整数。
- float16：16 位浮点数。
- float32：32 位浮点数。
- float64：64 位浮点数，支持 NaN 和 Infinity。
- string：使用 Latin1/UTF16/UTF-8 编码的字符串。
- enum：由一组命名值组成的数据类型。不支持字段值不预定义的 Rust 枚举作为 enum。
- named_enum：值以注册名称序列化的枚举。
- struct：通过 Fury Struct 序列化器序列化的“单态（final）”类型，即没有子类。  
  比如序列化 `List<SomeClass>` 时，可以避免动态选择序列化器，因为 `SomeClass` 是 final 类型。
- compatible_struct：通过 Fury 兼容 Struct 序列化器序列化的 final 类型。
- named_struct：以名称方式编码类型映射的 struct。
- named_compatible_struct：以名称方式编码类型映射的 compatible_struct。
- ext：通过自定义序列化器进行序列化的类型。
- named_ext：以名称方式编码类型映射的 ext。
- list：对象序列。
- set：无序且元素唯一的集合。
- map：键值对映射。不允许可变类型（如 list/map/set/array/tensor/arrow）作为 map 的 key。
- duration：独立于任何日历或时区的一段时间长度，以纳秒计数。
- timestamp：独立于任何日历或时区的时间点，以纳秒计数，参考时间为 UTC 1970 年 1 月 1 日午夜。
- local_date：无时区的本地日期，以天数计数，参考时间为 UTC 1970 年 1 月 1 日午夜。
- decimal：以二进制补码表示的精确十进制数值。
- binary：变长字节数组。
- array：仅允许基本数值类型组成的数组。其他类型的数组将视为 List。  
  各语言实现需要支持 array 与 list 之间的互操作。
- array：多维数组，每个子数组可以有不同大小，但所有元素类型相同。
- bool_array：一维 int16 数组。
- int8_array：一维 int8 数组。
- int16_array：一维 int16 数组。
- int32_array：一维 int32 数组。
- int64_array：一维 int64 数组。
- float16_array：一维半精度浮点（float16）数组。
- float32_array：一维 float32 浮点数组。
- float64_array：一维 float64 浮点数组。
- arrow record batch: an arrow [record batch](https://arrow.apache.org/docs/cpp/tables.html#record-batches) object.
- arrow table: an arrow [table](https://arrow.apache.org/docs/cpp/tables.html#tables) object.

注意:

- 未列出无符号整数类型（unsigned int/long），因为并非所有语言都支持它们。

### 多模态支持

针对多态，如果注册了一个非 final 类，并且仅注册了一个子类，那么可以假设 List/Map 中的元素类型相同，从而减少运行时类型检查的开销。

集合（Collection）/数组（Array）的多态并未完全支持，因为像 Go 语言等只存在一种集合类型。  
如果用户想要反序列化后得到精确的类型，需要在反序列化时提供目标类型，或者在结构体字段上标注类型信息。

### 类型消歧

由于不同语言的类型系统差异，有些类型无法一一对应。  
Fury 在反序列化时，会结合**目标数据结构的类型**和**数据中的类型信息**，共同决定如何反序列化并填充目标结构。示例如下：

```java
class Foo {
  int[] intArray;
  Object[] objects;
  List<Object> objectList;
}

class Foo2 {
  int[] intArray;
  List<Object> objects;
  List<Object> objectList;
}
```

`intArray` 的类型是 `int32_array`。但在序列化数据中，`objects` 和 `objectList` 字段的数据类型都是 `list`。在反序列化时，`objects` 字段会被解析为 `Object` 数组，而 `objectList` 字段会被解析为 `ArrayList` 并填充其元素。同时，`Foo` 的序列化数据也可以反序列化为 `Foo2`。

用户还可以为某个类型的字段，或者整个类型，提供元信息提示。以下是一个在 Java 中使用注解提供这类信息的示例：


```java
@FuryObject(fieldsNullable = false, trackingRef = false)
class Foo {
  @FuryField(trackingRef = false)
  int[] intArray;
  @FuryField(polymorphic = true)
  Object object;
  @FuryField(tagId = 1, nullable = true)
  List<Object> objectList;
}
```

在其他语言中也可以提供类似的信息：

- cpp: use macro and template.
- golang: use struct tag.
- python: use typehint.
- rust: use macro.

### Type ID

All internal data types are expressed using an ID in range `0~64`. Users can use `0~4096` for representing their
types.

### Type mapping

See [Type mapping](../guide/xlang_type_mapping.md)

## Spec overview

Here is the overall format:

```
| fury header | object ref meta | object type meta | object value data |
```

The data are serialized using little endian byte order overall. If bytes swap is costly for some object,
Fury will write the byte order for that object into the data instead of converting it to little endian.

## Fury header

Fury header consists starts one byte:

```
|    2 bytes   |     4 bits    | 1 bit | 1 bit | 1 bit  | 1 bit |   1 byte   |          optional 4 bytes          |
+--------------+---------------+-------+-------+--------+-------+------------+------------------------------------+
| magic number | reserved bits |  oob  | xlang | endian | null  |  language  | unsigned int for meta start offset |
```

- magic number: used to identify fury serialization protocol, current version use `0x62d4`.
- null flag: 1 when object is null, 0 otherwise. If an object is null, other bits won't be set.
- endian flag: 1 when data is encoded by little endian, 0 for big endian.
- xlang flag: 1 when serialization uses xlang format, 0 when serialization uses Fury java format.
- oob flag: 1 when passed `BufferCallback` is not null, 0 otherwise.
- language: the language when serializing objects, such as JAVA, PYTHON, GO, etc. Fury can use this flag to determine whether spend more time on serialization to make the deserialization faster for dynamic languages.

If meta share mode is enabled, an uncompressed unsigned int is appended to indicate the start offset of metadata.

## Reference Meta

Reference tracking handles whether the object is null, and whether to track reference for the object by writing
corresponding flags and maintaining internal state.

Reference flags:

| Flag                | Byte Value | Description                                                                                                                                             |
|---------------------|------------|---------------------------------------------------------------------------------------------------------------------------------------------------------|
| NULL FLAG           | `-3`       | This flag indicates the object is a null value. We don't use another byte to indicate REF, so that we can save one byte.                                |
| REF FLAG            | `-2`       | This flag indicates the object is already serialized previously, and fury will write a ref id with unsigned varint format instead of serialize it again |
| NOT_NULL VALUE FLAG | `-1`       | This flag indicates the object is a non-null value and fury doesn't track ref for this type of object.                                                  |
| REF VALUE FLAG      | `0`        | This flag indicates the object is referencable and the first time to serialize.                                                                         |

When reference tracking is disabled globally or for specific types, or for certain types within a particular
context(e.g., a field of a type), only the `NULL` and `NOT_NULL VALUE` flags will be used for reference meta.

For languages which doesn't support reference such as rust, reference tracking must be disabled for correct
deserialization by fury rust implementation.

For languages whose object values are not null by default:

- In rust, Fury takes `Option:None` as a null value
- In c++, Fury takes `std::nullopt` as a null value
- In golang, Fury takes `null interface/pointer` as a null value

If one want to deserialize in languages like `Java/Python/JavaScript`, he should mark the type with all fields
not-null by default, or using schema-evolution mode to carry the not-null fields info in the data.

## Type Meta

For every type to be serialized, it must be registered with an optional ID first. The registered type will have a
user-provided or an auto-growing unsigned int i.e. `type_id`. The registration can be used for security check and type
identification. The id of user registered type will be added by `64` to make space for Fury internal data types.

Depending on whether meta share mode and registration is enabled for current type, Fury will write type meta
differently.

### Schema consistent

- If schema consistent mode is enabled globally when creating fury, type meta will be written as a fury unsigned varint
  of `type_id`. Schema evolution related meta will be ignored.
- If schema evolution mode is enabled globally when creating fury, and current class is configured to use schema
  consistent mode like `struct` vs `table` in flatbuffers:
  - Type meta will be add to `captured_type_defs`: `captured_type_defs[type def stub] = map size` ahead when
      registering type.
  - Get index of the meta in `captured_type_defs`, write that index as `| unsigned varint: index |`.

### Schema evolution

If schema evolution mode is enabled globally when creating fury, and enabled for current type, type meta will be written
using one of the following mode. Which mode to use is configured when creating fury.

- Normal mode(meta share not enabled):
  - If type meta hasn't been written before, add `type def`
      to `captured_type_defs`: `captured_type_defs[type def] = map size`.
  - Get index of the meta in `captured_type_defs`, write that index as `| unsigned varint: index |`.
  - After finished the serialization of the object graph, fury will start to write `captured_type_defs`:
    - Firstly, set current to `meta start offset` of fury header
    - Then write `captured_type_defs` one by one:

      ```python
      buffer.write_var_uint32(len(writting_type_defs) - len(schema_consistent_type_def_stubs))
      for type_meta in writting_type_defs:
          if not type_meta.is_stub():
              type_meta.write_type_def(buffer)
      writing_type_defs = copy(schema_consistent_type_def_stubs)
      ```

- Meta share mode: the writing steps are same as the normal mode, but `captured_type_defs` will be shared across
  multiple serializations of different objects. For example, suppose we have a batch to serialize:

    ```python
    captured_type_defs = {}
    stream = ...
    # add `Type1` to `captured_type_defs` and write `Type1`
    fury.serialize(stream, [Type1()])
    # add `Type2` to `captured_type_defs` and write `Type2`, `Type1` is written before.
    fury.serialize(stream, [Type1(), Type2()])
    # `Type1` and `Type2` are written before, no need to write meta.
    fury.serialize(stream, [Type1(), Type2()])
    ```

- Streaming mode(streaming mode doesn't support meta share):
  - If type meta hasn't been written before, the data will be written as:

      ```
      | unsigned varint: 0b11111111 | type def |
      ```

  - If type meta has been written before, the data will be written as:

      ```
      | unsigned varint: written index << 1 |
      ```

      `written index` is the id in `captured_type_defs`.
  - With this mode, `meta start offset` can be omitted.

> The normal mode and meta share mode will forbid streaming writing since it needs to look back for update the start
> offset after the whole object graph writing and meta collecting is finished. Only in this way we can ensure
> deserialization failure in meta share mode doesn't lost shared meta.

#### Type Def

Here we mainly describe the meta layout for schema evolution mode:

```
|      8 bytes meta header      |   variable bytes   |  variable bytes   | variable bytes |
+-------------------------------+--------------------+-------------------+----------------+
| 7 bytes hash + 1 bytes header |  current type meta |  parent type meta |      ...       |
```

Type meta are encoded from parent type to leaf type, only type with serializable fields will be encoded.

##### Meta header

Meta header is a 64 bits number value encoded in little endian order.

- Lowest 4 digits `0b0000~0b1110` are used to record num classes. `0b1111` is preserved to indicate that Fury need to
  read more bytes for length using Fury unsigned int encoding. If current type doesn't has parent type, or parent
  type doesn't have fields to serialize, or we're in a context which serialize fields of current type
  only, num classes will be 1.
- The 5th bit is used to indicate whether this type needs schema evolution.
- Other 56 bits are used to store the unique hash of `flags + all layers type meta`.

##### Single layer type meta

```
| unsigned varint | var uint |  field info: variable bytes   | variable bytes  | ... |
+-----------------+----------+-------------------------------+-----------------+-----+
|   num_fields    | type id  | header + type id + field name | next field info | ... |
```

- num fields: encode `num fields` as unsigned varint.
  - If the current type is schema consistent, then num_fields will be `0` to flag it.
  - If the current type isn't schema consistent, then num_fields will be the number of compatible fields. For example,
      users can use tag id to mark some fields as compatible fields in schema consistent context. In such cases, schema
      consistent fields will be serialized first, then compatible fields will be serialized next. At deserialization,
      Fury will use fields info of those fields which aren't annotated by tag id for deserializing schema consistent
      fields, then use fields info in meta for deserializing compatible fields.
- type id: the registered id for the current type, which will be written as an unsigned varint.
- field info:
  - header(8
      bits): `4 bits size + 2 bits field name encoding + nullability flag + ref tracking flag`.
      Users can use annotation to provide those info.
    - 2 bits field name encoding:
      - encoding: `UTF8/ALL_TO_LOWER_SPECIAL/LOWER_UPPER_DIGIT_SPECIAL/TAG_ID`
      - If tag id is used, i.e. field name is written by an unsigned varint tag id. 2 bits encoding will be `11`.
    - size of field name:
      - The `4 bits size: 0~14`  will be used to indicate length `1~15`, the value `15` indicates to read more bytes,
              the encoding will encode `size - 15` as a varint next.
      - If encoding is `TAG_ID`, then num_bytes of field name will be used to store tag id.
    - ref tracking: when set to 1, ref tracking will be enabled for this field.
    - nullability: when set to 1, this field can be null.
  - field name: If tag id is set, tag id will be used instead. Otherwise meta string encoding `[length]` and data will
      be written instead.
  - type id:
    - Format: `id << 1 | polymorphic flag`. If field type is polymorphic, this flag is set to `0b1`, otherwise it's
      `0b0`
    - For registered type-consistent classes, it will be the registered type id.
    - For struct type it will be written as `STRUCT`.
    - The meta for struct type is written separately instead of inlining here is to reduce meta space cost if object of
      this type is serialized in current object graph multiple times, and the field value may be null too.
    - For enum type, it will be written as `ENUM`.
    - For collection type, it will be written as `COLLECTION`, then write element type recursively.
    - For map type, it will be written as `MAP`, then write key and value type recursively.

Field order are left as implementation details, which is not exposed to specification, the deserialization need to
resort fields based on Fury field comparator. In this way, fury can compute statistics for field names or types and
using a more compact encoding.

##### Other layers type meta

Same encoding algorithm as the previous layer.

## Meta String

Meta string is mainly used to encode meta strings such as field names.

### Encoding Algorithms

String binary encoding algorithm:

| Algorithm                 | Pattern       | Description                                                                                                                                                                                                                                                                              |
|---------------------------|---------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| LOWER_SPECIAL             | `a-z._$\|`    | every char is written using 5 bits, `a-z`: `0b00000~0b11001`, `._$\|`: `0b11010~0b11101`, prepend one bit at the start to indicate whether strip last char since last byte may have 7 redundant bits(1 indicates strip last char)                                                        |
| LOWER_UPPER_DIGIT_SPECIAL | `a-zA-Z0~9._` | every char is written using 6 bits, `a-z`: `0b00000~0b11001`, `A-Z`: `0b11010~0b110011`, `0~9`: `0b110100~0b111101`, `._`: `0b111110~0b111111`,  prepend one bit at the start to indicate whether strip last char since last byte may have 7 redundant bits(1 indicates strip last char) |
| UTF-8                     | any chars     | UTF-8 encoding                                                                                                                                                                                                                                                                           |

Encoding flags:

| Encoding Flag             | Pattern                                                  | Encoding Algorithm                                                                                                                                          |
|---------------------------|----------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------|
| LOWER_SPECIAL             | every char is in `a-z._\|`                               | `LOWER_SPECIAL`                                                                                                                                             |
| FIRST_TO_LOWER_SPECIAL    | every char is in `a-z._` except first char is upper case | replace first upper case char to lower case, then use `LOWER_SPECIAL`                                                                                       |
| ALL_TO_LOWER_SPECIAL      | every char is in `a-zA-Z._`                              | replace every upper case char by `\|` + `lower case`, then use `LOWER_SPECIAL`, use this encoding if it's smaller than Encoding `LOWER_UPPER_DIGIT_SPECIAL` |
| LOWER_UPPER_DIGIT_SPECIAL | every char is in `a-zA-Z._`                              | use `LOWER_UPPER_DIGIT_SPECIAL` encoding if it's smaller than Encoding `FIRST_TO_LOWER_SPECIAL`                                                             |
| UTF8                      | any utf-8 char                                           | use `UTF-8` encoding                                                                                                                                        |
| Compression               | any utf-8 char                                           | lossless compression                                                                                                                                        |

Notes:

- Depending on cases, one can choose encoding `flags + data` jointly, uses 3 bits of first byte for flags and other
  bytes
  for data.

## Value Format

### Basic types

#### bool

- size: 1 byte
- format: 0 for `false`, 1 for `true`

#### int8

- size: 1 byte
- format: write as pure byte.

#### int16

- size: 2 byte
- byte order: raw bytes of little endian order

#### unsigned int32

- size: 4 byte
- byte order: raw bytes of little endian order

#### unsigned varint32

- size: 1~5 byte
- Format: The most significant bit (MSB) in every byte indicates whether to have the next byte. If first bit is set
  i.e. `b & 0x80 == 0x80`, then
  the next byte should be read until the first bit of the next byte is unset.

#### signed int32

- size: 4 byte
- byte order: raw bytes of little endian order

#### signed varint32

- size: 1~5 byte
- Format: First convert the number into positive unsigned int by `(v << 1) ^ (v >> 31)` ZigZag algorithm, then encode
  it as an unsigned varint.

#### unsigned int64

- size: 8 byte
- byte order: raw bytes of little endian order

#### unsigned varint64

- size: 1~9 byte
- Fury SLI(Small long as int) Encoding:
  - If long is in `[0, 2147483647]`, encode as 4 bytes int: `| little-endian: ((int) value) << 1 |`
  - Otherwise write as 9 bytes: `| 0b1 | little-endian 8 bytes long |`
- Fury PVL(Progressive Variable-length Long) Encoding:
  - positive long format: first bit in every byte indicates whether to have the next byte. If first bit is set
      i.e. `b & 0x80 == 0x80`, then the next byte should be read until the first bit is unset.

#### signed int64

- size: 8 byte
- byte order: raw bytes of little endian order

#### signed varint64

- size: 1~9 byte
- Fury SLI(Small long as int) Encoding:
  - If long is in `[-1073741824, 1073741823]`, encode as 4 bytes int: `| little-endian: ((int) value) << 1 |`
  - Otherwise write as 9 bytes: `| 0b1 | little-endian 8 bytes long |`
- Fury PVL(Progressive Variable-length Long) Encoding:
  - First convert the number into positive unsigned long by `(v << 1) ^ (v >> 63)` ZigZag algorithm to reduce cost of
      small negative numbers, then encoding it as an unsigned long.

#### float32

- size: 4 byte
- format: encode the specified floating-point value according to the IEEE 754 floating-point "single format" bit layout,
  preserving Not-a-Number (NaN) values, then write as binary by little endian order.

#### float64

- size: 8 byte
- format: encode the specified floating-point value according to the IEEE 754 floating-point "double format" bit layout,
  preserving Not-a-Number (NaN) values. then write as binary by little endian order.

### string

Format:

```
| unsigned varint64: size << 2 `bitor` 2 bits encoding flags | binary data |
```

- `size + encoding` will be concat as a long and encoded as an unsigned varint64. The little 2 bits is used for
  encoding:
  0 for `latin1(ISO-8859-1)`, 1 for `utf-16`, 2 for `utf-8`.
- encoded string binary data based on encoding: `latin/utf-16/utf-8`.

Which encoding to choose:

- For JDK8: fury detect `latin` at runtime, if string is `latin` string, then use `latin` encoding, otherwise
  use `utf-16`.
- For JDK9+: fury use `coder` in `String` object for encoding, `latin`/`utf-16` will be used for encoding.
- If the string is encoded by `utf-8`, then fury will use `utf-8` to decode the data. Cross-language string
  serialization of fury uses `utf-8` by default.

### list

Format:

```
| unsigned varint64: length << 4 `bitor` 4 bits elements header | elements data |
```

#### elements header

In most cases, all elements are same type and not null, elements header will encode those homogeneous
information to avoid the cost of writing it for every element. Specifically, there are four kinds of information
which will be encoded by elements header, each use one bit:

- If track elements ref, use the first bit `0b1` of the header to flag it.
- If the elements have null, use the second bit `0b10` of the header to flag it. If ref tracking is enabled for this
  element type, this flag is invalid.
- If the element types are not the declared type, use the 3rd bit `0b100` of the header to flag it.
- If the element types are different, use the 4rd bit `0b1000` header to flag it.

By default, all bits are unset, which means all elements won't track ref, all elements are same type, not null and
the actual element is the declared type in the custom type field.

The implementation can generate different deserialization code based read header, and look up the generated code from
a linear map/list.

#### elements data

Based on the elements header, the serialization of elements data may skip `ref flag`/`null flag`/`element type info`.

```python
fury = ...
buffer = ...
elems = ...
if element_type_is_same:
    if not is_declared_type:
        fury.write_type(buffer, elem_type)
    elem_serializer = get_serializer(...)
    if track_ref:
        for elem in elems:
            if not ref_resolver.write_ref_or_null(buffer, elem):
                elem_serializer.write(buffer, elem)
    elif has_null:
        for elem in elems:
            if elem is None:
                buffer.write_byte(null_flag)
            else:
                buffer.write_byte(not_null_flag)
                elem_serializer.write(buffer, elem)
    else:
        for elem in elems:
            elem_serializer.write(buffer, elem)
else:
    if track_ref:
        for elem in elems:
            fury.write_ref(buffer, elem)
    elif has_null:
        for elem in elems:
            fury.write_nullable(buffer, elem)
    else:
        for elem in elems:
            fury.write_value(buffer, elem)
```

[`CollectionSerializer#writeElements`](https://github.com/apache/fury/blob/20a1a78b17a75a123a6f5b7094c06ff77defc0fe/java/fury-core/src/main/java/org/apache/fury/serializer/collection/AbstractCollectionSerializer.java#L302)
can be taken as an example.

### array

#### primitive array

Primitive array are taken as a binary buffer, serialization will just write the length of array size as an unsigned int,
then copy the whole buffer into the stream.

Such serialization won't compress the array. If users want to compress primitive array, users need to register custom
serializers for such types or mark it as list type.

#### object array

Object array is serialized using the list format. Object component type will be taken as list element
generic type.

### map

> All Map serializers must extend `AbstractMapSerializer`.

Format:

```
| length(unsigned varint) | key value chunk data | ... | key value chunk data |
```

#### map key-value chunk data

Map iteration is too expensive, Fury won't compute the header like for list since it introduce
[considerable overhead](https://github.com/apache/fury/issues/925).
Users can use `MapFieldInfo` annotation to provide the header in advance. Otherwise Fury will use first key-value pair
to predict header optimistically, and update the chunk header if the prediction failed at some pair.

Fury will serialize the map chunk by chunk, every chunk has 255 pairs at most.

```
|    1 byte      |     1 byte     | variable bytes  |
+----------------+----------------+-----------------+
|    KV header   | chunk size: N  |   N*2 objects   |
```

KV header:

- If track key ref, use the first bit `0b1` of the header to flag it.
- If the key has null, use the second bit `0b10` of the header to flag it. If ref tracking is enabled for this
  key type, this flag is invalid.
- If the actual key type of map is not the declared key type, use the 3rd bit `0b100` of the header to flag it.
- If track value ref, use the 4th bit `0b1000` of the header to flag it.
- If the value has null, use the 5th bit `0b10000` of the header to flag it. If ref tracking is enabled for this
  value type, this flag is invalid.
- If the value type of map is not the declared value type, use the 6rd bit `0b100000` of the header to flag it.
- If key or value is null, that key and value will be written as a separate chunk, and chunk size writing will be
  skipped too.

If streaming write is enabled, which means Fury can't update written `chunk size`. In such cases, map key-value data
format will be:

```
|    1 byte      | variable bytes  |
+----------------+-----------------+
|    KV header   |   N*2 objects   |
```

`KV header` will be a header marked by `MapFieldInfo` in java. For languages such as golang, this can be computed in
advance for non-interface types most times. The implementation can generate different deserialization code based read
header, and look up the generated code from a linear map/list.

#### Why serialize chunk by chunk?

When fury will use first key-value pair to predict header optimistically, it can't know how many pairs have same
meta(tracking kef ref, key has null and so on). If we don't write chunk by chunk with max chunk size, we must write at
least `X` bytes to take up a place for later to update the number which has same elements, `X` is the num_bytes for
encoding varint encoding of map size.

And most map size are smaller than 255, if all pairs have same data, the chunk will be 1. This is common in golang/rust,
which object are not reference by default.

Also, if only one or two keys have different meta, we can make it into a different chunk, so that most pairs can share
meta.

The implementation can accumulate read count with map size to decide whether to read more chunks.

### enum

Enums are serialized as an unsigned var int. If the order of enum values change, the deserialized enum value may not be
the value users expect. In such cases, users must register enum serializer by make it write enum value as an enumerated
string with unique hash disabled.

### decimal

Not supported for now.

### struct

Struct means object of `class/pojo/struct/bean/record` type.
Struct will be serialized by writing its fields data in fury order.

Depending on schema compatibility, structs will have different formats.

#### field order

Field will be ordered as following, every group of fields will have its own order:

- primitive fields: larger size type first, smaller later, variable size type last.
- boxed primitive fields: same order as primitive fields
- final fields: same type together, then sorted by field name lexicographically.
- list fields: same order as final fields
- map fields: same order as final fields
- other fields: same order as final fields

#### schema consistent

Object will be written as:

```
|    4 byte     |  variable bytes  |
+---------------+------------------+
|   type hash   |   field values   |
```

Type hash is used to check the type schema consistency across languages. Type hash will be the first 32 bits of 56 bits
value of the type meta.

Object fields will be serialized one by one using following format:

```
not null primitive field value:
|   var bytes    |
+----------------+
|   value data   |
+----------------+
nullable primitive field value:
| one byte  |   var bytes   |
+-----------+---------------+
| null flag |  field value  |
+-----------+---------------+
field value of final type with ref tracking:
| var bytes | var objects |
+-----------+-------------+
| ref meta  | value data  |
+-----------+-------------+
field value of final type without ref tracking:
| one byte  | var objects |
+-----------+-------------+
| null flag | field value |
+-----------+-------------+
field value of non-final type with ref tracking:
| one byte  | var bytes | var objects |
+-----------+-------------+-------------+
| ref meta  | type meta  | value data  |
+-----------+-------------+-------------+
field value of non-final type without ref tracking:
| one byte  | var bytes | var objects |
+-----------+------------+------------+
| null flag | type meta | value data |
+-----------+------------+------------+
```

#### Schema evolution

Schema evolution have similar format as schema consistent mode for object except:

- For the object type, `schema consistent` mode will write type by id only, but `schema evolution` mode will
  write type consisting of field names, types and other meta too, see [Type meta](#type-meta).
- Type meta of `final custom type` needs to be written too, because peers may not have this type defined.

### Type

Type will be serialized using type meta format.

## Implementation guidelines

### How to reduce memory read/write code

- Try to merge multiple bytes into an int/long write before writing to reduce memory IO and bound check cost.
- Read multiple bytes as an int/long, then split into multiple bytes to reduce memory IO and bound check cost.
- Try to use one varint/long to write flags and length together to save one byte cost and reduce memory io.
- Condition branches are less expensive compared to memory IO cost unless there are too many branches.

### Fast deserialization for static languages without runtime codegen support

For type evolution, the serializer will encode the type meta into the serialized data. The deserializer will compare
this meta with class meta in the current process, and use the diff to determine how to deserialize the data.

For java/javascript/python, we can use the diff to generate serializer code at runtime and load it as class/function for
deserialization. In this way, the type evolution will be as fast as type consist mode.

For C++/Rust, we can't generate the serializer code at runtime. So we need to generate the code at compile-time using
meta programming. But at that time, we don't know the type schema in other processes, so we can't generate the
serializer code for such inconsistent types. We may need to generate the code which has a loop and compare field name
one by one to decide whether to deserialize and assign the field or skip the field value.

One fast way is that we can optimize the string comparison into `jump` instructions:

- Assume the current type has `n` fields, and the peer type has `n1` fields.
- Generate an auto growing `field id` from `0` for every sorted field in the current type at the compile time.
- Compare the received type meta with current type, generate same id if the field name is same, otherwise generate an
  auto growing id starting from `n`, cache this meta at runtime.
- Iterate the fields of received type meta, use a `switch` to compare the `field id` to deserialize data
  and `assign/skip` field value. **Continuous** field id will be optimized into `jump` in `switch` block, so it will
  very fast.

Here is an example, suppose process A has a class `Foo` with version 1 defined as `Foo1`, process B has a class `Foo`
with version 2 defined as `Foo2`:

```c++
// class Foo with version 1
class Foo1 {
  int32_t v1; // id 0
  std::string v2; // id 1
};
// class Foo with version 2
class Foo2 {
  // id 0, but will have id 2 in process A
  bool v0;
  // id 1, but will have id 0 in process A
  int32_t v1;
  // id 2, but will have id 3 in process A
  int64_t long_value;
  // id 3, but will have id 1 in process A
  std::string v2;
  // id 4, but will have id 4 in process A
  std::vector<std::string> list;
};
```

When process A received serialized `Foo2` from process B, here is how it deserialize the data:

```c++
Foo1 foo1 = ...;
const std::vector<fury::FieldInfo> &field_infos = type_meta.field_infos;
for (const auto &field_info : field_infos) {
  switch (field_info.field_id) {
    case 0:
      foo1.v1 = buffer.read_varint32();
      break;
    case 1:
      foo1.v2 = fury.read_string();
      break;
    default:
      fury.skip_data(field_info);
  }
}
```
