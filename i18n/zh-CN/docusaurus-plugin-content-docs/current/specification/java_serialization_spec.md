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

## 范围

本文档规定 Apache Fory Java 原生二进制格式，即 Java 在配置
`withXlang(false)` 时使用的格式。该格式针对 Java 对象图、Java 集合实现、
Java 基本类型数组、Java 类注册、Java 序列化钩子和可选的 Schema 演进进行了优化。

Java 原生模式和 xlang 模式共享小端序数值载荷、变长整数编码、引用标志、
元字符串编码以及 TypeDef/ClassDef 概念等底层构建块，但二者是不同的编码格式。
在 Java 原生模式下，只有从 `BOOL` 到 `STRING` 的标量类型 ID 与 xlang 共享。
除非本文档另有明确说明，否则集合、映射、结构体、数组、枚举和 Java 原生实现的类型 ID
均为 Java 原生 ID。

跨语言格式请参阅 [Xlang 序列化格式](xlang_serialization_spec.md)。

## 流布局

Java 原生流包含一个头字节，后跟一个或多个根对象。每个根对象都编码为一个普通对象槽：

```text
| header | root_0 | root_1 | ... |

root:
| reference flag | [type metadata] | [value payload] |
```

所有多字节定长值均采用小端序。大端序 Java 实现仍然必须写入和读取小端序载荷。

流是有状态的。类型元信息、类定义和对象引用会在首次遇到时分配索引，
并可在同一流的后续位置通过索引引用。

## 头部

头部为单个字节：

```text
| bits 7..2 reserved | bit 1 out-of-band | bit 0 xlang |
```

- Java 原生模式下，`xlang` 必须为 `0`。
- `out-of-band` 在值为 `1` 时表示已经配置 `BufferCallback`。
- 保留位必须为 `0`。

Java 原生模式不会在头部之后写入语言 ID。

## 引用槽

对象、可空字段和启用引用跟踪的字段使用标准 Fory 引用槽。第一个字节为有符号值：

| 标志                  | 字节 | 后续载荷                                  |
| --------------------- | ---- | ----------------------------------------- |
| `NULL_FLAG`           | `-3` | 无载荷。该槽的值为 `null`。               |
| `REF_FLAG`            | `-2` | 先前对象的 `varuint32` 引用 ID。          |
| `NOT_NULL_VALUE_FLAG` | `-1` | 值载荷。本次出现不会分配引用 ID。         |
| `REF_VALUE_FLAG`      | `0`  | 值载荷。在读取数据之前分配下一个引用 ID。 |

当某个槽禁用引用跟踪时，写入端仅使用 `NULL_FLAG` 和 `NOT_NULL_VALUE_FLAG`。

基本类型字段的快速路径不会用引用槽包裹非空基本类型值。
装箱基本类型和其他可空值使用字段元信息所选择的槽。

## 类型元信息

动态对象槽会先写入类型元信息，再写入值载荷。类型元信息用于标识序列化器，
并在需要时携带类名或 ClassDef 元信息。

```text
| varuint32 type_id | [type-specific metadata] |
```

已注册 Java 类、Java 原生内置类型和 Fory 内部序列化器使用数值类型 ID。
未注册的类或按名称注册的类携带名称元信息。支持 Schema 演进的类可以携带 ClassDef。

### 原生类型 ID 范围

| 范围     | 含义                                                |
| -------- | --------------------------------------------------- |
| `0`      | `UNKNOWN`，在元信息中用于动态位置或对象类型位置。   |
| `1..21`  | 从 `BOOL` 到 `STRING` 的共享标量 ID。               |
| `22..63` | Java 原生模式中为 xlang 内部 ID 范围保留。          |
| `64..68` | 为未来的 Java 原生内部 ID 保留。                    |
| `69..98` | 下文列出的 Java 原生内置类型。                      |
| `99+`    | 由 Java `ClassResolver` 分配的用户类和 Fory 类 ID。 |

共享标量 ID 如下：

| ID  | 名称            | Java 值域                      |
| --- | --------------- | ------------------------------ |
| 1   | `BOOL`          | xlang 元信息中的布尔值         |
| 2   | `INT8`          | 有符号 8 位整数元信息          |
| 3   | `INT16`         | 有符号 16 位整数元信息         |
| 4   | `INT32`         | 定长有符号 32 位整数元信息     |
| 5   | `VARINT32`      | 变长有符号 32 位整数元信息     |
| 6   | `INT64`         | 定长有符号 64 位整数元信息     |
| 7   | `VARINT64`      | 变长有符号 64 位整数元信息     |
| 8   | `TAGGED_INT64`  | 带标签的有符号 64 位整数元信息 |
| 9   | `UINT8`         | 无符号 8 位整数元信息          |
| 10  | `UINT16`        | 无符号 16 位整数元信息         |
| 11  | `UINT32`        | 定长无符号 32 位整数元信息     |
| 12  | `VAR_UINT32`    | 变长无符号 32 位整数元信息     |
| 13  | `UINT64`        | 定长无符号 64 位整数元信息     |
| 14  | `VAR_UINT64`    | 变长无符号 64 位整数元信息     |
| 15  | `TAGGED_UINT64` | 带标签的无符号 64 位整数元信息 |
| 16  | `FLOAT8`        | 保留的 8 位浮点数元信息        |
| 17  | `FLOAT16`       | 半精度浮点数元信息             |
| 18  | `BFLOAT16`      | bfloat16 元信息                |
| 19  | `FLOAT32`       | 32 位浮点数元信息              |
| 20  | `FLOAT64`       | 64 位浮点数元信息              |
| 21  | `STRING`        | Java `String`                  |

Java 原生内置类型从 ID `69` 开始：

| ID  | 名称                         | Java 类型或序列化器所有者            |
| --- | ---------------------------- | ------------------------------------ |
| 69  | `VOID_ID`                    | `java.lang.Void`                     |
| 70  | `CHAR_ID`                    | `java.lang.Character`                |
| 71  | `PRIMITIVE_VOID_ID`          | `void`                               |
| 72  | `PRIMITIVE_BOOL_ID`          | `boolean`                            |
| 73  | `PRIMITIVE_INT8_ID`          | `byte`                               |
| 74  | `PRIMITIVE_CHAR_ID`          | `char`                               |
| 75  | `PRIMITIVE_INT16_ID`         | `short`                              |
| 76  | `PRIMITIVE_INT32_ID`         | `int`                                |
| 77  | `PRIMITIVE_FLOAT32_ID`       | `float`                              |
| 78  | `PRIMITIVE_INT64_ID`         | `long`                               |
| 79  | `PRIMITIVE_FLOAT64_ID`       | `double`                             |
| 80  | `PRIMITIVE_BOOLEAN_ARRAY_ID` | `boolean[]`                          |
| 81  | `PRIMITIVE_BYTE_ARRAY_ID`    | `byte[]`                             |
| 82  | `PRIMITIVE_CHAR_ARRAY_ID`    | `char[]`                             |
| 83  | `PRIMITIVE_SHORT_ARRAY_ID`   | `short[]`                            |
| 84  | `PRIMITIVE_INT_ARRAY_ID`     | `int[]`                              |
| 85  | `PRIMITIVE_FLOAT_ARRAY_ID`   | `float[]`                            |
| 86  | `PRIMITIVE_LONG_ARRAY_ID`    | `long[]`                             |
| 87  | `PRIMITIVE_DOUBLE_ARRAY_ID`  | `double[]`                           |
| 88  | `STRING_ARRAY_ID`            | `String[]`                           |
| 89  | `OBJECT_ARRAY_ID`            | `Object[]` 和对象数组序列化器        |
| 90  | `ARRAYLIST_ID`               | `java.util.ArrayList`                |
| 91  | `HASHMAP_ID`                 | `java.util.HashMap`                  |
| 92  | `HASHSET_ID`                 | `java.util.HashSet`                  |
| 93  | `CLASS_ID`                   | `java.lang.Class`                    |
| 94  | `EMPTY_OBJECT_ID`            | 空对象序列化器                       |
| 95  | `LAMBDA_STUB_ID`             | Lambda 替换类型 ID                   |
| 96  | `JDK_PROXY_STUB_ID`          | JDK 代理替换类型 ID                  |
| 97  | `REPLACE_STUB_ID`            | `writeReplace`/`readResolve` 类型 ID |
| 98  | `NONEXISTENT_META_SHARED_ID` | 未知类标记类型 ID                    |

### 已注册类、命名类和未注册类

Java 原生模式支持三种类标识形式：

- ID 注册：类型 ID 为已注册的数值类 ID。
- 名称注册：类型元信息携带命名空间和类型名称字符串。
- 未注册类：类型元信息以包名作为命名空间，并携带 Java 简单类名作为类型名称。

类注册是速度最快、最紧凑的形式。需要稳定名称或禁用类注册时使用基于名称的形式。

### 元信息共享

启用元信息共享后，类元信息只写入一次，随后通过流内局部索引引用：

```text
| varuint32 marker | [class definition bytes if new] |

marker = (index << 1) | flag
flag = 0: new definition, class definition bytes follow
flag = 1: reference to an earlier definition
```

索引按照首次使用顺序分配。

## Schema 模式

Java 原生模式有两种对象 Schema 模式。

### 同 Schema 模式

禁用兼容模式时使用同 Schema 模式。写入端和读取端必须具有匹配的字段及字段顺序。
普通已注册类不需要每个对象都携带 ClassDef。字段值按协议顺序直接写入。

### 兼容模式

兼容模式会为类似结构体的类写入 ClassDef 元信息。读取端按标识符将本地字段与远端
ClassDef 字段匹配，读取匹配字段，并使用远端字段类型元信息跳过未知字段。
兼容模式是 Java 原生格式实现 Schema 演进的路径。

在兼容模式下，如果远端值可以由本地标量 Schema 表示且不改变逻辑值，
匹配字段便可在直接顶层标量 ClassDef Schema 之间读取。这仅是一种读取适配：
写入端仍发出其本地规范字段 Schema 和载荷；ClassDef 元信息、同 Schema 模式、
动态值序列化和未知字段跳过仍将原始字段 Schema 视为不同类型。

该规则仅适用于匹配字段的直接 Schema，不适用于动态根值、映射键、映射值、集合元素、
数组元素、枚举值、时间值、二进制值、结构体或嵌套泛型/容器位置。

标量域包括 Java 布尔类型/装箱布尔类型、`String`、Java 基本类型和装箱数值标量字段、
其 ClassDef 元信息标识更窄数值编码域的 Fory 标量注解，以及作为精确十进制数值标量的
`BigDecimal`。对于不在与 xlang 共享的类型 ID 范围内、仅 Java 原生模式使用的元信息，
仍必须使用 Java ClassDef 元信息标识标量域。兼容标量转换仅在远端和本地顶层 ClassDef
字段元信息的 `trackingRef = false` 时适用；如果任一匹配字段的 `trackingRef = true`，
则在构建兼容布局时，标量类型变更属于 Schema/类型不兼容。顶层 `trackingRef` 和
空值/可选封装匹配的相同标量 ClassDef 字段类型是同 Schema 精确直接读取，
而不是兼容标量转换。顶层 `trackingRef` 封装不同的相同标量 ClassDef 字段类型属于
Schema/类型不兼容，因为其编码封装不同。空值/可选封装不同的相同标量 ClassDef
字段类型，在两个字段均为 `trackingRef = false` 时，仍可使用下文的可空/可选组合规则。

兼容标量转换遵循 xlang 标量转换约定：

- `String` 转布尔类型仅接受 `"0"`、`"1"`、`"false"` 和 `"true"`。
  布尔类型转 `String` 生成 `"false"` 或 `"true"`。
- 数值转布尔类型仅接受精确的零和一。布尔类型转数值会在本地数值域中生成精确的零或一。
- 仅当本地数值域能够表示相同数学值时，数值到数值的转换才会成功；这包括范围检查、
  符号性检查、精确的整数/浮点往返检查、保留浮点有符号零，以及拒绝在不同浮点类型 ID
  之间转换 `NaN`。
- `BigDecimal` 作为精确数值标量参与转换。转换得到的十进制值采用规范 scale：
  零和非零整数使用 scale `0`；有限小数使用能够保留数学值且使 unscaled 值不能被 `10`
  整除的最小非负 scale。在任意精度解析之前，兼容转换会拒绝长度超过 `320` 字节的数值字符串。
  在构造较大的十的幂或格式化普通十进制文本之前，它还会拒绝规范指数或 scale 计算超过
  `256` 位限制的已转换十进制值。同类型 `BigDecimal` 读取保留普通十进制载荷。
- `String` 转数值只接受 xlang 序列化规范中的有限兼容数值字面量语法，
  随后执行相同的无损目标域检查。`NaN`、无穷大、空白字符、前导加号、Unicode 十进制数字、
  下划线、分组分隔符、非十进制进位制和类型后缀都会导致失败。
- 数值转 `String` 会发出规范的有限数值文本：整数使用普通十进制文本；
  浮点值使用带小数点并保留有符号零的精确普通十进制文本；`BigDecimal` 值使用不带指数记法、
  且不含无意义尾随小数零的精确普通十进制文本。

当匹配的顶层字段 Schema 为 `trackingRef = false` 时，可空字段、装箱载体和基本类型默认值
可与标量转换组合使用。读取端首先消费远端 ClassDef 字段元信息描述的远端空值/可选封装。
存在的值在转换后赋值或包装到本地载体中。为 null 或不存在的远端值使用本地字段已有的
兼容模式缺失值/null 处理方式。不支持启用引用跟踪的标量转换。

在构建兼容布局时，标量转换矩阵之外的 Schema 对仍属于 Schema/类型兼容性错误。
一旦匹配字段被接受为标量转换操作，无效载荷值便是反序列化数据错误，必须报告为
`org.apache.fory.exception.DeserializationException`，而不是 Schema 缺失或注册错误。

## 字段顺序

Java 原生对象序列化器使用与当前 xlang 协议相同的确定性字段顺序类别：

1. 非空基本数值和布尔标量字段。
2. 可空基本数值和布尔标量字段，包括 Java 基本类型的装箱类。
3. 非基本类型字段。

基本类型分组沿用基本类型比较器：

1. 定长基本类型编码排在压缩或变长基本类型编码之前。
2. 位宽较大的基本类型排在位宽较小的基本类型之前。
3. 按内部基本类型 ID 升序排列。
4. 字段标识符。

非基本类型字段直接按字段标识符排序。非基本类型 ID、序列化器种类、集合种类、
映射种类和 Java 实现类均不参与字段排序。

字段标识符按以下规则选择：

- 如果字段显式设置了 `@ForyField(id = ...)`，且满足 `0 <= id < 2^29`，该数字 ID 就是字段标识符。
- 注解默认值 `id = -1`，以及未显式指定 `@ForyField` ID 的字段，使用转换为 snake_case 的 Java 字段名。
- 其他注解 ID 均无效；小于 `-1` 或大于等于 `2^29` 的值不会选择基于名称的身份。

标识符比较规则如下：

1. 如果两个字段都有显式 ID，则按数值比较 ID。
2. 如果只有一个字段有显式 ID，基于 ID 的字段排在基于名称的字段之前。
3. 如果两个字段都没有显式 ID，则按字典序比较 snake_case 名称。
4. 如果标识符相同，则使用声明类和原始字段名等确定性决胜条件。
   同一个类中具有相同 snake_case 标识符的无标签字段无效。
   如果子类字段隐藏具有相同 Java 字段名的继承字段，xlang TypeDef 元信息中只保留最近的字段，
   因为继承字段没有不同的无标签标识符。

生成的序列化器可以为基本类型、集合、映射、内置类型和用户定义序列化器保留独立的内部描述符分组，
以便生成专用快速路径。这些内部分组属于实现细节，不得改变编码字段顺序。

## ClassDef 编码

兼容模式和元信息共享将 Java 类定义编码为 TypeDef 记录。TypeDef 由 8 字节头部和类元信息字节组成：

```text
| 8-byte header | [varuint32 extra_size] | class metadata bytes |
```

头部位布局：

```text
| 52-bit hash | 3 reserved bits | 1 compress bit | 8 size bits |
```

- `size`：低 8 位。如果值为 `0xff`，则将 `extra_size` 读取为 `varuint32` 并加到 `0xff` 上。
- `compress`：类元信息字节由所配置的元信息压缩器压缩时置位。
- `reserved`：必须为零。
- `hash`：52 位值，根据 `class_metadata_bytes || header_low12_le` 使用
  MurmurHash3 x64_128（种子为 47）得出。`header_low12_le` 是头部低 12 位编码成的两个小端序字节，
  其中第二个字节的高四位清零。取 MurmurHash3 结果的 lane 0，左移 12 位并采用有符号 64 位回绕，
  应用有符号绝对值，再与 `0xfffffffffffff000` 做掩码运算。

### 类元信息主体

```text
| root_kind_and_layer_count | class_layer_0 | class_layer_1 | ... |

class_layer:
| varuint32 class_header | [registered type IDs or names] | field_info... |
```

`root_kind_and_layer_count` 的高四位存储根 TypeDef 种类，低四位存储
`(num_layers - 1)`。如果低四位为 `0b1111`，则再读取一个 `varuint32` 并加到 `15` 上。

根种类代码：

| 代码  | 种类                             |
| ----- | -------------------------------- |
| 0     | `STRUCT`                         |
| 1     | `COMPATIBLE_STRUCT`              |
| 2     | `NAMED_STRUCT`                   |
| 3     | `NAMED_COMPATIBLE_STRUCT`        |
| 4     | `ENUM`                           |
| 5     | `NAMED_ENUM`                     |
| 6     | `EXT`                            |
| 7     | `NAMED_EXT`                      |
| 8     | `TYPED_UNION`                    |
| 9     | `NAMED_UNION`                    |
| 10-14 | 保留                             |
| 15    | 扩展种类转义，在定义之前予以拒绝 |

`class_header = (num_fields << 1) | registered_flag`。

- 如果 `registered_flag == 1`，则将类类型 ID 写为一个字节。对于用户注册的 `ENUM`、
  `STRUCT`、`COMPATIBLE_STRUCT`、`EXT` 和 `TYPED_UNION`，将用户类型 ID 写为 `varuint32`。
- 如果 `registered_flag == 0`，则将命名空间和类型名称写为元字符串。

类层从父类到叶子类依次编码。每一层中的字段列表使用上文定义的字段顺序。

读取端可以拒绝超过运行时资源限制的 TypeDef，例如元信息主体最大字节数或单个 TypeDef
最大字段数。这些限制属于接收端资源控制，不会改变 TypeDef 编码、类型标识、动态类加载、
未知类处理、注册策略或 Schema 演进语义。

### 字段信息

每个字段编码如下：

```text
| field_header | [extended_name_or_id_size] | [field name bytes] | field_type |
```

`field_header` 位布局：

| 位   | 含义                            |
| ---- | ------------------------------- |
| 0    | `trackingRef`                   |
| 1    | `nullable`                      |
| 2..3 | 字段名称编码                    |
| 4..6 | 编码名称长度减一，或紧凑 tag ID |
| 7    | 保留，必须为零                  |

字段名称编码：

| 代码 | 编码                       |
| ---- | -------------------------- |
| 0    | UTF-8                      |
| 1    | all-to-lower 特殊编码      |
| 2    | lower/upper/digit 特殊编码 |
| 3    | tag ID；省略字段名称字节   |

对于名称编码，位 `4..6` 存储 `encoded_length - 1`，前提是该值小于 `7`。
如果值为 `7`，则再读取一个 `varuint32` 并加到 `7` 上。

在 tag ID 编码中，小于 `7` 的数字字段 ID 存放在位 `4..6`。若该值为 `7`，则读取额外的 `varuint32` 并加上 `7`。字段 ID 必须满足 `0 <= tag_id < 2^29`，最大合法值为 `536870911`。一个 TypeDef 中不允许重复字段 ID。

### 字段类型

字段类型描述兼容读取端如何读取或跳过字段载荷。顶层字段类型只写入类型标签。
嵌套字段类型将 `nullable` 和 `trackingRef` 存储在低位中：

```text
nested_field_type_header = (type_tag << 2) | (nullable << 1) | trackingRef
```

类型标签：

| 标签 | 字段类型            | 载荷                   |
| ---- | ------------------- | ---------------------- |
| 0    | Object/动态         | 无                     |
| 1    | Map                 | 键字段类型、值字段类型 |
| 2    | Collection/List/Set | 元素字段类型           |
| 3    | Java 数组           | 维数、组件字段类型     |
| 4    | Enum                | 无                     |
| 5+   | 已注册或内置类型    | `tag - 5` 为类型 ID    |

## 元字符串

命名空间、类型名称和字段名称使用 xlang 规范定义的元字符串编码。
元字符串头部存储字节长度和编码种类；扩展长度写为 `varuint32`。

包名和命名空间名称使用 UTF-8、all-to-lower 特殊编码或 lower/upper/digit 特殊编码。
类型名称使用 UTF-8、lower/upper/digit 特殊编码、first-to-lower 特殊编码或
all-to-lower 特殊编码。字段名称使用上文的字段信息编码表。

## 基本类型值

当字段序列化器在静态时已知，基本类型值不携带类型元信息：

| Java 类型 | 载荷                                                          |
| --------- | ------------------------------------------------------------- |
| `boolean` | 一个字节：`0` 或 `1`                                          |
| `byte`    | 一个有符号字节                                                |
| `char`    | 两字节 UTF-16 码元，小端序                                    |
| `short`   | 两字节有符号整数，小端序                                      |
| `int`     | 定长 int32 小端序，或配置后使用 ZigZag varint32               |
| `long`    | 定长 int64 小端序、ZigZag varint64，或配置后使用 tagged int64 |
| `float`   | IEEE 754 binary32，小端序                                     |
| `double`  | IEEE 754 binary64，小端序                                     |

装箱基本类型在选定的空值/引用槽之后使用相同的值载荷。

### 大数值范围

Java 原生 `BigInteger` 和 `BigDecimal` 序列化器接受的整数或 unscaled 值的绝对值大小，
最多为 `10_000` 个规范无符号二进制字节。`BigDecimal` 还只接受 `[-10_000, 10_000]`
范围内的 scale。

这些是可接受值限制，并非对原生或 xlang 编码的更改。
Java 有符号二进制补码原生主体中的前导符号字节不计入大小限制。
写入端会在写入值的任何部分之前拒绝超出范围的值。读取端会在分配主体或构造
`BigInteger` 或 `BigDecimal` 之前验证逻辑大小，并保留现有的可读字节数、长度、
溢出和规范性检查。

兼容标量转换继续使用其独立的 `256` 位数字限制和 scale/输出扩展限制。

## 字符串值

Java 字符串编码如下：

```text
| varuint36_small7 header | bytes |

header = (num_bytes << 2) | coder
```

`coder` 值：

| 值  | 编码          |
| --- | ------------- |
| 0   | Latin-1       |
| 1   | UTF-16 小端序 |
| 2   | UTF-8         |

`num_bytes` 是编码载荷的字节长度。

## 枚举值

枚举值载荷取决于配置：

- Ordinal 模式将枚举序号写为 `varuint32`。
- `@ForyEnumId` 模式将配置的非负枚举 tag 写为 `varuint32`。
- Name 模式将枚举常量名称写为元字符串。

根据 Java API 约定，`@ForyEnumId` 可以声明在枚举常量、一个整数字段，
或一个无参数整数 getter 上。重复或负数枚举 tag 无效。

## 数组

### 基本类型数组

基本类型数组写入长度前缀和连续的小端序元素载荷：

```text
| varuint32 byte_length | raw element bytes |
```

压缩的 `int[]` 和 `long[]` 数组使用元素数量，后跟压缩元素：

```text
int[] compressed:
| varuint32 length | varint32... |

long[] compressed:
| varuint32 length | varint64 or tagged_int64... |
```

`byte[]` 使用二进制序列化器，写入 `varuint32 length`，后跟原始字节。

### 对象数组

对象数组写入数组长度和元素类型模式：

```text
| varuint32_small7 (length << 1 | monomorphic_flag) |
| [shared element class metadata] |
| element slots... |
```

- 如果 `monomorphic_flag == 1`，所有非空元素使用同一个元素序列化器，
  共享元素类元信息只写入一次。
- 如果 `monomorphic_flag == 0`，每个非空元素都写入自己的类型元信息。

每个可空或启用引用跟踪的元素，仍在其元素载荷之前由一个引用槽表示。

## 集合

Java 集合序列化器写入集合大小、元素标志、可选的共享元素类型元信息和元素载荷：

```text
| varuint32_small7 size | elements_header | [element type metadata] | elements... |
```

`elements_header` 位布局：

| 位  | 含义                     |
| --- | ------------------------ |
| 0   | 启用元素引用跟踪         |
| 1   | 至少一个元素可能为 null  |
| 2   | 使用声明的元素类型       |
| 3   | 所有非空元素共享一种类型 |

当所有非空元素共享一种类型且不使用声明的元素类型时，
共享元素类型元信息只在元素载荷之前写入一次。否则，每个非空元素都写入自己的类型元信息。
null 和引用标志遵循引用槽规则。

### 集合子类

受支持 JDK 集合子类的专用序列化器会在元素载荷之前写入子类自身的字段层：

```text
| varuint32_small7 size |
| [comparator reference for sorted/priority collections] |
| varuint32_small7 num_class_layers |
| class_layer_fields... |
| elements_header | [element type metadata] | elements... |
```

`num_class_layers` 是载荷中编码的子类字段层的确切数量。
如果载荷的层数与本地序列化器不匹配，读取端必须拒绝该载荷，
因为值载荷没有携带足以跳过不匹配子类布局的层标识信息。

## 映射

映射先写入条目数量，再写入一个或多个分块。每个分块将键和值元信息兼容的条目分组：

```text
| varuint32_small7 size | chunk... |
```

非空分块：

```text
| header | uint8 chunk_size | [key type metadata] | [value type metadata] | entries... |
```

`chunk_size` 的范围为 `1..255`。

`header` 位布局：

| 位  | 含义                 |
| --- | -------------------- |
| 0   | 启用键引用跟踪       |
| 1   | 分块可能包含 null 键 |
| 2   | 使用声明的键类型     |
| 3   | 启用值引用跟踪       |
| 4   | 分块可能包含 null 值 |
| 5   | 使用声明的值类型     |

null 键或 null 值条目编码为单条目特殊分块，不携带 `chunk_size` 字节：

- null 键和非 null 值：特殊 null-key 头部，后跟值载荷。
- 非 null 键和 null 值：特殊 null-value 头部，后跟键载荷。
- null 键和 null 值：仅 `KV_NULL` 头部。

`EnumMap` 写入条目数量、键枚举类元信息，随后写入其普通映射条目载荷：

```text
| varuint32_small7 size | key enum class metadata | chunk... |
```

即使 `size` 为零，也存在键枚举类元信息，因此空 `EnumMap` 可以使用原始键类型重建。

### 映射子类

受支持 JDK 映射子类的专用序列化器会在条目分块之前写入子类自身的字段层：

```text
| varuint32_small7 size |
| [comparator reference for sorted maps] |
| varuint32_small7 num_class_layers |
| class_layer_fields... |
| chunk... |
```

读取端必须拒绝不匹配的 `num_class_layers`，原因与集合子类相同。

## JDK 包装器和视图

Java 原生模式为部分 JDK 包装器和视图提供序列化器：

- 不可修改和同步的集合/映射包装器保留包装器类型元信息，
  并将被包装的源集合或映射写为普通对象载荷。
- 可识别的子列表视图保留子列表类型元信息，并写入一个由序列化器定义的模式字节。
  模式 `0` 将可见元素写为集合载荷。模式 `1` 写入视图偏移量、大小和源列表引用。
- `Collections.newSetFromMap` 写入后备映射载荷。
- 不可变 JDK 集合序列化器保留列表、集合或映射的载荷语义，
  并在读取时具现化等价的不可变或不可修改容器。

Android 和 JVM 实现可以为包装器载荷选择不同的具体公开后备类型，
但以上由序列化器定义的载荷模式决定其编码形态。

## 结构体和对象载荷

类似结构体的对象载荷按协议字段顺序包含字段值。所选序列化器定义确切的字段快速路径：

```text
| field_0 payload | field_1 payload | ... |
```

对于每个字段，字段元信息决定该字段是直接写入基本类型载荷、可空槽、启用引用跟踪的槽、
类型元信息，还是专用的集合/映射/数组载荷。

兼容模式读取端使用远端 ClassDef 字段列表，按标识符映射字段。
未知字段使用其远端字段类型元信息跳过。

生成的序列化器可以拆分大型生成方法，并提升序列化器、字段偏移量、集合元信息或映射元信息。
这些代码生成决策必须保持相同的对象载荷顺序。

## Throwable 载荷

`Throwable` 序列化器保留标准 Java throwable 状态和子类自身的字段：

```text
| stack_trace_ref | cause_ref | message_ref |
| varuint32 suppressed_count | suppressed_ref... |
| varuint32 extra_field_count | extra_field_name/value... |
| varuint32_small7 num_class_layers |
| class_layer_fields... |
```

`extra_field_count` 为序列化器自身的扩展字段保留，当前写入为零。
读取时，`num_class_layers` 必须与本地 throwable 序列化器布局匹配。

## 替换与 Java 序列化钩子

Java 原生模式支持由序列化器处理 Java 对象替换和 Java 序列化钩子：

- `writeReplace`/`readResolve` 值使用替换序列化器定义的替换元信息和载荷。
- JDK 代理和 Lambda 替换使用其已注册的原生类型 ID。
- 需要兼容 Java Object Serialization 的类型可以委托给序列化器，
  由其在 Fory 对象槽内复现所需的 Java 语义。

这些序列化器仍遵循本文档中的流头部、引用槽和类型元信息规则。

## 未知类

启用元信息共享后，如果读取端没有远端 ClassDef 对应的本地类，Java 可以使用
`NONEXISTENT_META_SHARED_ID` 具现化一个未知类值。该值存储足够的字段数据，
使未知类序列化器能够保留和复制该未知值；它不会让用户代码可以使用该未知 Java 类。

## 带外缓冲区

当头部带外位被置位时，序列化器可以写入对外部缓冲区的引用，
而不是将所有字节内联写入。回调用于定义外部缓冲区的传输方式。
主流仍然是有效的 Fory 流，其中在由序列化器定义的载荷位置包含对这些缓冲区的引用。
