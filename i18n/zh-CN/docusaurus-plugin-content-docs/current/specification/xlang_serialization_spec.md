---
title: Xlang 序列化格式
sidebar_position: 0
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

Apache Fory™ xlang 序列化支持自动进行跨语言对象序列化，并支持共享引用、循环引用和多态。传统序列化框架要求定义 IDL 并编译 Schema，而 Fory 无需任何中间步骤即可直接序列化对象。

主要特性：

- **自动化**：无需定义 IDL、无需编译 Schema、无需手动将对象转换为协议数据
- **跨语言**：同一种二进制格式适用于 Java、Python、C++、Go、Rust、JavaScript/TypeScript、C#、Swift、Dart、Scala 和 Kotlin
- **感知引用**：处理共享引用和循环引用，不会重复写入或无限递归
- **多态**：支持解析具体类型的对象多态

本规范定义 Fory xlang 二进制格式。该格式是动态格式而非静态格式，以编码格式更复杂为代价，提供了灵活性和易用性。

## 类型系统 {#type-systems}

### 数据类型

- bool：布尔值（true 或 false）。
- int8：8 位有符号整数。
- int16：16 位有符号整数。
- int32：32 位有符号整数。标量类型表达式可以使用定长编码或 varint 编码。
- int64：64 位有符号整数。标量类型表达式可以使用定长编码、varint/PVL 编码或 tagged 编码。
- uint8：8 位无符号整数。
- uint16：16 位无符号整数。
- uint32：32 位无符号整数。标量类型表达式可以使用定长编码或 varint 编码。
- uint64：64 位无符号整数。标量类型表达式可以使用定长编码、varint/PVL 编码或 tagged 编码。
- float8：8 位浮点数。
- float16：16 位浮点数。
- bfloat16：16 位脑浮点数。
- float32：32 位浮点数。
- float64：64 位浮点数，包括 NaN 和 Infinity。
- string：使用 Latin1/UTF16/UTF-8 编码的文本字符串。
- enum：由一组命名值构成的数据类型。携带数据的 Rust enum 不是 xlang enum。仅当每个 case 都能表示为一个 union 备选值或无值时，它才可以映射为 union；包含多个字段的 tuple variant 或 named variant 仍属于宿主语言原生结构。
- named_enum：其值将按注册名称序列化的 enum。
- struct：由 Fory Struct 序列化器序列化的 dynamic(final) 类型，即该类型没有子类。假设要反序列化 `List<SomeClass>`，由于 `SomeClass` 是 dynamic(final)，可以省去动态序列化器分派。
- compatible_struct：由 Fory compatible Struct 序列化器序列化的 dynamic(final) 类型。
- named_struct：类型映射会编码为名称的 `struct`。
- named_compatible_struct：类型映射会编码为名称的 `compatible_struct`。
- ext：由自定义序列化器序列化的类型。
- named_ext：类型映射会编码为名称的 `ext` 类型。
- list：对象序列。
- set：由唯一元素构成的无序集合。
- map：键值对映射。Map 的键不允许使用二进制值、浮点值、decimal 值，也不允许使用 `list`、`map`、`set` 和 `array` 等集合结构值。
- duration：与任何日历或时区无关的绝对时间长度，以纳秒数表示。
- timestamp：与任何日历或时区无关的时间点，编码为秒数（int64）和纳秒数（uint32）；起算纪元为 UTC 午夜，即一月 1 日（1970 年）。
- date：不带时区的朴素日期，编码为自 Unix 纪元起的天数，使用有符号 varint64。
- decimal：精确十进制值，编码为有符号 `scale` 和精确的 `unscaled` 整数。
- binary：变长字节数组。
- array：`array<T>` 表示稠密的一维 bool 或数值数据。当前 xlang 为每个受支持的元素域写入规范的专用 `*_ARRAY` 类型 ID。`ARRAY (42)` 保留给未来的通用数组编码，当前 xlang 格式不会写入该类型。`list<T>` 仍是独立的 Schema 类型。
  - bool_array：`array<bool>` 的规范编码标签。
  - int8_array：`array<int8>` 的规范编码标签。
  - int16_array：`array<int16>` 的规范编码标签。
  - int32_array：`array<int32>` 的规范编码标签。
  - int64_array：`array<int64>` 的规范编码标签。
  - uint8_array：`array<uint8>` 的规范编码标签。
  - uint16_array：`array<uint16>` 的规范编码标签。
  - uint32_array：`array<uint32>` 的规范编码标签。
  - uint64_array：`array<uint64>` 的规范编码标签。
  - float8_array：为 `array<float8>` 保留的规范编码标签。
  - float16_array：`array<float16>` 的规范编码标签。
  - bfloat16_array：`array<bfloat16>` 的规范编码标签。
  - float32_array：`array<float32>` 的规范编码标签。
  - float64_array：`array<float64>` 的规范编码标签。
- union：可容纳多种备选类型之一的带标签联合类型。当前备选类型由非负 case ID 标识。
- typed_union：带有已注册数值 union 类型 ID 的 union 值。
- named_union：嵌入 union 类型名称或共享 TypeDef 的 union 值。
- none：表示没有数据的空值/单元值（例如用于空的 union 备选项）。

注意：

- 无符号整数类型与对应的有符号整数类型占用相同的字节数，二者的差异在于如何解释值。各语言的类型映射请参阅[类型映射](xlang_type_mapping.md)。

### 宿主语言外部类型序列化

语言绑定 MAY 将提供序列化行为的宿主类型与被序列化的宿主值类型分离。这种分离不属于编码身份。

- 外部结构化序列化器 MUST 写出与等价的、由宿主语言直接支持的类型相同的 STRUCT、ENUM 或 UNION Schema 及值字节。
- 没有 xlang 映射的宿主原生结构不在本规范范围内，语言绑定 MAY 在单独的 native 模式中支持它。启用 xlang 模式时，语言绑定 MUST 拒绝这种结构；它 MUST NOT 丢弃字段、将其强制转换为 ENUM 或 UNION、合成未声明的 struct 备选项，或静默编码为 EXT。包含多个 tuple 字段或 named 字段的 Rust enum variant 就属于这种宿主原生结构。
- 对现有 transparent、LIST、SET、MAP、宿主定长数组或异构 tuple/product 结构，由语言绑定拥有并通过子序列化器递归参数化的静态载体序列化器，MUST 写出与对应直接支持的组合相同的外层类型 ID、现有泛型 `FieldType` 结构、类型元信息、引用帧和值字节。载体序列化器不是用户编码身份；只有选定的用户类型子项使用其注册 ID 或名称。
- 这种等价性也包括规范的专用载体映射。例如，基于规范 `i32` 序列化器的 Rust vector 载体序列化器使用 `INT32_ARRAY`，基于规范 `u8` 序列化器的载体使用 BINARY，基于外部结构化序列化器或自定义序列化器的载体使用 LIST。嵌套载体 MUST 保留所选子项的类型 ID 和递归 `FieldType`；序列化器组合 MUST NOT 用 LIST 替换规范的原始类型数组或二进制映射。相对地，Swift `Array` 载体序列化器 MUST 保持为 LIST，因为这是 Swift 静态选择 `Array` 时的规范映射。Swift 稠密 `@ArrayField` 映射和动态精确原始类型数组映射是彼此独立的规范选择；序列化器的目标恰好是数值类型，并不会使其获得其中任何一种映射。
- 异构 tuple/product 载体序列化器 MUST 保留该语言绑定现有的直接 tuple 编码和现有的 xlang LIST 编码。所选子项位置 MUST NOT 增加序列化器名称、位置索引、泛型 Schema 节点或直接支持的 tuple 不会编码的其他标记。缺失或额外的兼容位置遵循该语言绑定通常的 tuple 规则。
- 对通常不会访问子项身份或注册元数据的缺失或空载体分支，MUST NOT 仅为验证所选序列化器而添加合成的子项元数据。仅当正常的 Schema 路径或值路径确实使用了已注册的子项身份时，才需要注册。声明类型的子项 body 继续使用静态选择的行为，不增加编码身份，也不重复查找注册信息；所属的 Schema 元数据负责此前的身份验证。无论何种情况，载体序列化器自身都保持未注册状态。
- 如果自定义序列化器不是运行时对现有内置类型的规范实现，则 MUST 使用现有 EXT 或 NAMED_EXT 形式。序列化器提供者与目标值分离的机制不会取代运行时拥有的内置映射。
- 序列化器提供者、外部结构化序列化器或代码生成类型的名称 MUST NOT 改变编码后的类型 ID、注册的用户 ID 或名称、TypeDef、字段顺序、Schema 哈希、引用帧或值字节。
- 即使序列化行为由另一个宿主类型提供，注册和多态分派仍 MUST 标识被序列化的目标值。

### 多态

对于多态，如果注册了一个非 final 类，并且只注册了它的一个子类，就可以认定 List/Map 中的所有元素都具有相同类型，从而减少逐元素的类型检查。

Collection/Array 多态未得到完整支持，因为 golang 等部分语言只有一种集合类型。如果用户希望得到与传入值完全相同的类型，必须在反序列化时传入该类型，或在 struct 字段上标注该类型。

### 类型消歧

由于各语言类型系统存在差异，类型无法在语言之间一一映射。反序列化时，Fory 会结合目标数据结构的类型和数据中的数据类型，确定如何反序列化并填充目标数据结构。例如：

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

`intArray` 使用 `array<int32>` Schema 和 `int32_array` 编码标签。`objects` 和 `objectList` 均使用 `list` Schema。这些 Schema 类型彼此不同；实现不得将普通对象数组视为稠密数值数组。

### List 与 Array 语义

`list<T>` 和 `array<T>` 是不同的 Schema 类型。

普通有序集合应使用 `list<T>`，其中的元素可能需要集合语义、可空元素处理、引用处理或对象/字符串/字节载荷。原始类型 `list<T>` 在内部仍可使用优化的同构元素区段，但载荷归 list 协议所有，并携带 list 元数据。

动态长度的稠密一维 bool 或数值数据应使用 `array<T>`。根据 array 契约，`array<T>` 元素始终非空、不进行引用跟踪，并且为定长编码。`array<bool>` 的每个值占一个字节。即使标量 `int32`、`int64`、`uint32` 或 `uint64` 在标量位置或 list 位置默认使用 varint/PVL 编码，整数数组的元素载荷仍使用定长小端序编码。

有效的 `array<T>` 元素域如下：

```text
bool
int8, int16, int32, int64
uint8, uint16, uint32, uint64
float16, bfloat16, float32, float64
```

无效的数组 Schema 包括 `array<fixed int32>`、`array<optional int32>`、`array<ref T>`、`array<string>`、`array<bytes>`、`array<map<...>>`，以及由 struct、union、enum、时间值、decimal 或动态 `any` 值构成的数组。

当前编码格式保留专用原始类型数组的类型 ID，将其作为 `array<T>` 的规范动态标签：

| Schema            | 动态编码标签     |
| ----------------- | ---------------- |
| `array<bool>`     | `BOOL_ARRAY`     |
| `array<int8>`     | `INT8_ARRAY`     |
| `array<int16>`    | `INT16_ARRAY`    |
| `array<int32>`    | `INT32_ARRAY`    |
| `array<int64>`    | `INT64_ARRAY`    |
| `array<uint8>`    | `UINT8_ARRAY`    |
| `array<uint16>`   | `UINT16_ARRAY`   |
| `array<uint32>`   | `UINT32_ARRAY`   |
| `array<uint64>`   | `UINT64_ARRAY`   |
| `array<float16>`  | `FLOAT16_ARRAY`  |
| `array<bfloat16>` | `BFLOAT16_ARRAY` |
| `array<float32>`  | `FLOAT32_ARRAY`  |
| `array<float64>`  | `FLOAT64_ARRAY`  |

`ARRAY (42)` 保留给未来的通用数组描述符或带形状数组描述符，不会用于稠密原始类型数组。

仅在 Schema 兼容模式下，匹配的 struct/class 字段可以在直接的顶层 `list<T>` 与直接的顶层 `array<T>` Schema 之间进行读取，前提是 `T` 属于上述有效稠密数组元素域。具有相同有符号性和位宽域的整数 list 元素编码与相应稠密数组元素域匹配。这是一种读取适配，并不是合并 Schema 类型：写入方仍会写出本地规范的 `list<T>` 或 `array<T>` 载荷；TypeDef/ClassDef 编码、指纹、动态根序列化、相同 Schema 模式以及未知字段跳过仍会将 `list<T>` 与 `array<T>` 视为不同类型。

该适配仅限于匹配兼容字段的直接 Schema。当 `list<T>` 或 `array<T>` 出现在另一个字段类型内部时，不适用该适配；这包括集合元素、map 键或值、数组元素、union 备选项或其他泛型/容器位置。对端 `list<T?>` 的 TypeDef 元素 Schema 对于本地匹配的 `array<T>` 字段不会立即构成 Schema 不兼容。如果元素域匹配且元素 Schema 之间唯一的差异是可空元数据，分类阶段必须接受该匹配字段。读取器必须根据集合载荷作出判断：如果载荷实际包含空元素，本地 `array<T>` 字段必须抛出兼容读取错误。不得将 list 中的空元素强制转换为稠密数组默认值。进行引用跟踪的 list 元素帧与可空元素 Schema 是两个不同概念。如果某运行时无法在不经过泛型/引用路径的情况下将引用跟踪的 list 元素具体化为稠密数组，它可以在兼容分类时拒绝该字段；如果接受了该字段，则无法表示为稠密数组元素值的引用载荷必须在读取时失败。

上述稠密数组错误规则适用于稠密数组目标。将匹配的 `list<T?>` 字段读入本地 `list<T?>` 目标时，必须继续使用 list 语义并保留实际的空元素；实现不得让该载荷经过会拒绝空值的稠密原始类型数组具体化路径。

仅在 Schema 兼容模式下，匹配的 struct/class 字段可以在直接的顶层 `binary` 和直接的顶层 `array<uint8>` Schema 之间读取。这只是字节序列适配：它不会合并 TypeDef/ClassDef 类型 ID、Schema 指纹、动态根序列化、相同 Schema 模式，或嵌套的 collection/map/array/union/generic 位置。`array<int8>` 不属于该适配。

仅在 Schema 兼容模式下，如果远端值能由本地标量 Schema 表示且不改变其逻辑值，匹配的 struct/class 字段还可以在直接的顶层标量 Schema 之间读取。这只是一种兼容读取适配：写入方仍会写出本地规范的 Schema 和载荷；TypeDef/ClassDef 编码、指纹、动态根序列化、相同 Schema 模式、未知字段跳过和容器元素 Schema 仍会将原标量类型视为彼此不同的类型。

标量转换规则仅适用于匹配兼容字段的直接 Schema。它不适用于动态根值、`any`、map 键、map 值、list 元素、set 元素、array 元素、union 备选项、enum 值、time/date/duration 值、binary 值、struct、ext 值或嵌套的泛型/容器位置。它还仅适用于远端和本地顶层字段 Schema 均满足 `trackingRef = false` 的情况；如果任一匹配字段的 Schema 为 `trackingRef = true`，标量转换就不在兼容布局矩阵之内，标量类型变更仍与 Schema/类型不兼容。相同标量类型 ID 在顶层 `trackingRef` 与 null/optional 帧都匹配时属于相同 Schema 的精确直接读取，而非兼容标量转换。相同标量类型 ID 如果顶层 `trackingRef` 帧不同，则因为编码帧不同而与 Schema/类型不兼容。相同标量类型 ID 如果顶层 null/optional 帧不同，但两个字段均为 `trackingRef = false`，则仍可使用下述 nullable/optional 组合规则。

可转换的标量域为 `bool`、`string` 和数值标量。数值标量包括有符号整数（`int8`、`int16`、`int32`、`int64`）、无符号整数（`uint8`、`uint16`、`uint32`、`uint64`）、浮点数（`float16`、`bfloat16`、`float32`、`float64`）和 `decimal`。整数编码变体与其基本位宽属于同一个语义域：定长、变长和 tagged 整数编码不会形成额外的转换域。

兼容标量转换 MUST 遵循以下规则：

- `string` 转 `bool` 只接受精确的 `"0"`、`"1"`、`"false"` 和 `"true"`。匹配按 ASCII 逐字节进行；读取器 MUST NOT 去除空白、接受前导符号、接受其他大小写或使用与 locale 相关的文本。
- `bool` 转 `string` 产生规范的小写 `"false"` 或 `"true"`。
- 数值转 `bool` 只接受精确的数值零和精确的数值一。`NaN` 和无穷值转换失败。浮点负零视为零。Decimal 的 scale 不影响零/一检查。
- `bool` 转数值在本地数值域中产生精确的零或一。
- 数值转数值仅在本地数值域能表示同一个数学值时成功。整数转换检查目标范围和有符号性；整数转浮点数检查能否在目标浮点域中精确表示；浮点数转整数要求值有限、为整数且在范围内；浮点数转浮点数要求转换到目标类型再转回源类型后精确保留原值，包括零的符号。仅当目标浮点域保留相同的无穷值时，才可转换浮点无穷值。`NaN` 不能在不同的浮点类型 ID 之间转换。
- decimal 是精确的数值标量。整数转 decimal 使用 scale `0`；decimal 转整数要求值为整数且在范围内；浮点数转 decimal 要求值有限，并将精确的二进制浮点值转换为规范 decimal 形式；decimal 转浮点数要求能在目标浮点域中精确表示。同类型 decimal 读取保留普通 decimal 载荷。转换产生的 Decimal 值使用下述规范转换形式。
- `string` 转数值只接受下述兼容数值字面量语法，然后应用相同的无损目标域检查。`"NaN"`、`"Infinity"`、`"-Infinity"` 及其拼写变体会失败，因为数值字符串只允许有限值。
- 数值转 `string` 会生成规范的有限数值文本。整数源生成十进制文本，除 `"0"` 外不含前导零。浮点源生成与源值相等且能解析回相同源浮点类型的精确普通十进制文本；该文本包含小数点和至少一位小数，保留负零为 `"-0.0"`，绝不使用指数表示法，并拒绝 `NaN` 和无穷值。Decimal 源生成不使用指数且没有无意义尾随小数零的精确普通十进制文本；decimal 零为 `"0"`。

兼容数值字面量语法有意比宿主语言解析器更严格：

- 不允许前导或尾随空白；
- 不允许前导加号；
- 仅使用 ASCII 语法：符号、数字、小数点和指数标记只能是 ASCII 字节 `-`、`0` 到 `9`、`.`、`e` 和 `E`；
- 不允许 Unicode 十进制数字、下划线、分组分隔符、locale 特定数字、十六进制、八进制、二进制或类型后缀；
- 整数字面量：`-?(0|[1-9][0-9]*)`；
- 十进制浮点字面量：`-?(0|[1-9][0-9]*)\.[0-9]+([eE]-?(0|[1-9][0-9]*))?` 或 `-?(0|[1-9][0-9]*)[eE]-?(0|[1-9][0-9]*)`。

读取器 MUST 使用精确 decimal、rational 或等价的受检算法解析数值字符串。先通过宿主浮点类型解析再进行类型转换是无效做法，除非实现还能证明转换结果相对于原始字面量保持精确。

规范的转换后 decimal 形式如下：

- 零：`unscaled = 0`、`scale = 0`；
- 非零整数：`scale = 0`，且该整数作为 `unscaled`；
- 有限小数值：取满足 `unscaled * 10^-scale` 等于该值且 `unscaled` 不能被 `10` 整除的最小非负 scale。

如果原始数值字符串长度大于 `320`，兼容标量转换 MUST 在任意精度解析前将其拒绝。在构造较大的十的幂或格式化普通十进制文本之前，如果转换后 decimal 的规范形式需要 `[-256, 256]` 范围外的指数或 scale、需要大于 `256` 的正 scale、unscaled decimal 的有效数字超过 `256` 位，或负 scale 格式化后的整数位数会超过 `256`，也 MUST 拒绝该转换后 decimal。这些限制仅适用于兼容标量转换生成的值，包括 string 转 decimal、decimal 转 string 和 floating 转 decimal。同类型 decimal 读取保留普通 decimal 载荷。有范围限制的公共 decimal 载体如果无法精确表示某个更小的值，也可以拒绝该值。

对于顶层字段 Schema 为 `trackingRef = false` 的匹配标量对，支持 nullable、boxed、optional 和 nullable-field 的组合。读取器首先使用远端字段元数据描述的方式消费远端 null/optional 帧。如果存在值，读取器转换解包后的标量值，然后将其赋给本地载体或包装到本地载体中。如果远端值为 null 或 absent，读取器使用它已对该本地字段采用的同一条 missing/null 兼容字段规则；此功能不会引入第二套 null 策略。不支持进行引用跟踪的标量转换。

转换失败属于数据错误，而不是 Schema 缺失。构建兼容布局时，转换矩阵之外的 Schema 对仍属于 Schema/类型兼容性错误。一旦某个匹配字段被接受为标量转换操作，无效载荷值 MUST 通过实现的数据错误路径报告；如果该路径具备相应信息，错误中应包含足以标识远端类型、本地类型和字段的上下文。

仅当远端字段没有匹配的本地字段身份时，才适用未知字段跳过。如果本地字段通过 tag ID 或名称匹配，但其 Schema 不在精确读取和兼容适配规则范围内，读取器 MUST 拒绝兼容布局，而不能将该字段视为缺失字段、仅远端字段或可跳过字段。

用户还可以为某个类型的字段或整个类型提供元信息提示。以下 Java 示例使用注解提供此类信息。

```java
@ForyStruct
class Foo {
  @ArrayType
  @ForyField(id = 0)
  int[] intArray;

  @ForyField(id = 1, dynamic = ForyField.Dynamic.TRUE)
  Object object;

  @Nullable
  @ForyField(id = 2)
  List<Object> objectList;
}
```

其他语言也可以提供此类信息：

- cpp：使用 macro 和 template。
- golang：使用 struct tag。
- python：使用 typehint。
- rust：使用 macro。

### 类型 ID

所有内部数据类型都使用 8 位内部 ID（`0~255`，其中 `0~56` 已在此处定义）。用户可以用数值 ID 注册类型（当前实现支持 `0~0xFFFFFFFE`）。用户 ID 与内部类型 ID 分开编码，不进行位移或打包。

命名类型（`NAMED_*`）不嵌入用户 ID；其名称由元数据携带。

#### 内部类型 ID 表

| 类型 ID | 名称                    | 描述                                     |
| ------- | ----------------------- | ---------------------------------------- |
| 0       | UNKNOWN                 | 未知类型，用于动态类型                   |
| 1       | BOOL                    | 布尔值                                   |
| 2       | INT8                    | 8 位有符号整数                           |
| 3       | INT16                   | 16 位有符号整数                          |
| 4       | INT32                   | 32 位有符号整数                          |
| 5       | VARINT32                | 变长编码的 32 位有符号整数               |
| 6       | INT64                   | 64 位有符号整数                          |
| 7       | VARINT64                | 变长编码的 64 位有符号整数               |
| 8       | TAGGED_INT64            | 混合编码的 64 位有符号整数               |
| 9       | UINT8                   | 8 位无符号整数                           |
| 10      | UINT16                  | 16 位无符号整数                          |
| 11      | UINT32                  | 32 位无符号整数                          |
| 12      | VAR_UINT32              | 变长编码的 32 位无符号整数               |
| 13      | UINT64                  | 64 位无符号整数                          |
| 14      | VAR_UINT64              | 变长编码的 64 位无符号整数               |
| 15      | TAGGED_UINT64           | 混合编码的 64 位无符号整数               |
| 16      | FLOAT8                  | 8 位浮点数（float8）                     |
| 17      | FLOAT16                 | 16 位浮点数（半精度）                    |
| 18      | BFLOAT16                | 16 位脑浮点数                            |
| 19      | FLOAT32                 | 32 位浮点数（单精度）                    |
| 20      | FLOAT64                 | 64 位浮点数（双精度）                    |
| 21      | STRING                  | 使用 UTF-8/UTF-16/Latin1 编码的字符串    |
| 22      | LIST                    | 有序集合（List、Array、Vector）          |
| 23      | SET                     | 由唯一元素构成的无序集合                 |
| 24      | MAP                     | 键值映射                                 |
| 25      | ENUM                    | 通过数值 ID 注册的 Enum                  |
| 26      | NAMED_ENUM              | 通过 namespace + 类型名称注册的 Enum     |
| 27      | STRUCT                  | 通过数值 ID 注册的 Struct（相同 Schema） |
| 28      | COMPATIBLE_STRUCT       | 支持 Schema 演进的 Struct（通过 ID）     |
| 29      | NAMED_STRUCT            | 通过 namespace + 类型名称注册的 Struct   |
| 30      | NAMED_COMPATIBLE_STRUCT | 通过名称进行 Schema 演进的 Struct        |
| 31      | EXT                     | 通过数值 ID 注册的扩展类型               |
| 32      | NAMED_EXT               | 通过 namespace + 类型名称注册的扩展类型  |
| 33      | UNION                   | 不嵌入 Schema 身份的 Union 值            |
| 34      | TYPED_UNION             | 带有已注册数值类型 ID 的 Union 值        |
| 35      | NAMED_UNION             | 嵌入类型名称/TypeDef 的 Union 值         |
| 36      | NONE                    | 空/单元类型（无数据）                    |
| 37      | DURATION                | 时间长度（秒 + 纳秒）                    |
| 38      | TIMESTAMP               | 时间点（自纪元起的秒数 + 纳秒数）        |
| 39      | DATE                    | 不带时区的日期（有符号 varint64 天数）   |
| 40      | DECIMAL                 | 任意精度 decimal（scale + unscaled）     |
| 41      | BINARY                  | 原始二进制数据                           |
| 42      | ARRAY                   | 保留给未来专用的多维数组                 |
| 43      | BOOL_ARRAY              | 1D 布尔数组                              |
| 44      | INT8_ARRAY              | 1D int8 数组                             |
| 45      | INT16_ARRAY             | 1D int16 数组                            |
| 46      | INT32_ARRAY             | 1D int32 数组                            |
| 47      | INT64_ARRAY             | 1D int64 数组                            |
| 48      | UINT8_ARRAY             | 1D uint8 数组                            |
| 49      | UINT16_ARRAY            | 1D uint16 数组                           |
| 50      | UINT32_ARRAY            | 1D uint32 数组                           |
| 51      | UINT64_ARRAY            | 1D uint64 数组                           |
| 52      | FLOAT8_ARRAY            | 1D float8 数组                           |
| 53      | FLOAT16_ARRAY           | 1D float16 数组                          |
| 54      | BFLOAT16_ARRAY          | 1D bfloat16 数组                         |
| 55      | FLOAT32_ARRAY           | 1D float32 数组                          |
| 56      | FLOAT64_ARRAY           | 1D float64 数组                          |

#### 用户类型的类型 ID 编码

注册用户类型（struct/ext/enum/union）时，内部类型 ID 以 8 位 kind 写入。用户类型 ID 作为无符号 varint32（small7）单独写入；不进行位移或打包。

**示例：**

| 用户 ID | 类型              | 内部 ID | 编码后的用户 ID | 十进制 |
| ------- | ----------------- | ------- | --------------- | ------ |
| 0       | STRUCT            | 27      | 0               | 0      |
| 0       | ENUM              | 25      | 0               | 0      |
| 1       | STRUCT            | 27      | 1               | 1      |
| 1       | COMPATIBLE_STRUCT | 28      | 1               | 1      |
| 2       | NAMED_STRUCT      | 29      | 2               | 2      |

读取类型 ID 时：

- 从类型 ID 字段读取内部类型 ID。
- 如果内部类型属于用户注册类型，则将 `user_type_id` 作为 varuint32 读取。

### 类型映射

请参阅[类型映射](xlang_type_mapping.md)

## 规范概览

整体格式如下：

```
| fory header | object ref meta | object type meta | object value data |
```

所有类型的数据均使用小端字节序进行序列化。

## Fory Header（头部）

xlang 序列化的 Fory header 格式：

```
|        1 byte bitmap           |
+--------------------------------+
|            flags               |
```

详细的字节布局：

```
Byte 0:   Bitmap flags
          - Bit 0: xlang flag (0x01)
          - Bit 1: oob flag (0x02)
          - Bits 2-7: reserved
```

- **xlang flag**（bit 0）：使用 Fory xlang 格式序列化时为 1，使用 Fory native 模式格式时为 0。
- **oob flag**（bit 1）：启用带外序列化（BufferCallback 不为 null）时为 1，否则为 0。
- **reserved bits**（bits 2-7）：必须为零。

所有数据均使用小端序编码。

## 引用元信息

引用跟踪通过写入相应的 flag 并维护内部状态，处理对象是否为 null，以及是否要跟踪对象引用。

### 引用 Flag

| Flag                | 字节值（int8） | 十六进制 | 描述                                                                    |
| ------------------- | -------------- | -------- | ----------------------------------------------------------------------- |
| NULL FLAG           | `-3`           | `0xFD`   | 对象为 null。不会再为该对象写入任何字节。                               |
| REF FLAG            | `-2`           | `0xFE`   | 对象已序列化。后跟无符号 varint32 引用 ID。                             |
| NOT_NULL VALUE FLAG | `-1`           | `0xFF`   | 对象非空，但已为该类型禁用引用跟踪。对象数据紧随其后。                  |
| REF VALUE FLAG      | `0`            | `0x00`   | 对象可被引用，且这是首次出现。对象数据紧随其后。为其分配下一个引用 ID。 |

### 引用跟踪算法

**写入：**

```
function write_ref_or_null(buffer, obj):
    if obj is null:
        buffer.write_int8(NULL_FLAG)      // -3
        return true  // done, no more data to write

    if reference_tracking_enabled:
        ref_id = lookup_written_objects(obj)
        if ref_id exists:
            buffer.write_int8(REF_FLAG)   // -2
            buffer.write_varuint32(ref_id)
            return true  // done, reference written
        else:
            buffer.write_int8(REF_VALUE_FLAG)  // 0
            add_to_written_objects(obj, next_ref_id++)
            return false  // continue to serialize object data
    else:
        buffer.write_int8(NOT_NULL_VALUE_FLAG)  // -1
        return false  // continue to serialize object data
```

**读取：**

```
function read_ref_or_null(buffer):
    flag = buffer.read_int8()
    switch flag:
        case NULL_FLAG (-3):
            return (null, true)  // null object, done
        case REF_FLAG (-2):
            ref_id = buffer.read_varuint32()
            obj = get_from_read_objects(ref_id)
            return (obj, true)  // referenced object, done
        case NOT_NULL_VALUE_FLAG (-1):
            return (null, false)  // non-null, continue reading
        case REF_VALUE_FLAG (0):
            reserve_ref_slot()  // will be filled after reading
            return (null, false)  // non-null, continue reading
```

### 引用 ID 分配

- 引用 ID 从 `0` 开始按顺序分配
- 写入 `REF_VALUE_FLAG`（首次出现）时分配 ID
- 对象存储在按引用 ID 索引的 list/map 中
- 读取时，在反序列化对象前预留引用槽位，之后再填充该槽位

### 禁用引用跟踪时

在全局或特定类型上禁用引用跟踪后，引用元信息只会使用 `NULL` 和 `NOT_NULL VALUE` flag。对于已知不会包含引用的类型，这可以降低开销。

### 语言特定注意事项

**默认使用可空类型和引用类型的语言（Java、Python、JavaScript）：**

为了实现跨语言兼容，在 xlang 模式下：

- 默认将所有字段视为**非空**
- 默认**禁用**引用跟踪
- 用户可以通过注解将字段显式标记为可空，或启用引用跟踪
- `Optional` 类型（例如 `java.util.Optional`、`typing.Optional`）视为可空

**注解示例：**

```java
// Java: use @Ref for reference tracking
public class MyClass {
    @Nullable
    @Ref
    private Object refField;

    private String requiredField;
}
```

```python
# Python: use typing with fory field descriptors
from pyfory import ForyField, Ref

class MyClass:
    ref_field: ForyField(Ref[SomeType], nullable=True)
    required_field: ForyField(str, nullable=False)
```

**默认使用不可空类型的语言：**

| 语言 | Null 表示                 | 引用跟踪支持                             |
| ---- | ------------------------- | ---------------------------------------- |
| Rust | `Option::None`            | 通过 `Rc<T>`、`Arc<T>`、`Weak<T>`        |
| C++  | `std::nullopt`、`nullptr` | 通过 `std::shared_ptr<T>`、`weak_ptr<T>` |
| Go   | `nil` interface/pointer   | 通过 pointer/interface 类型              |

**重要：**对于 Rust 等没有隐式引用语义的语言，引用跟踪必须使用显式智能指针（`Rc`、`Arc`）。

## 类型元信息 {#type-meta}

每个非原始类型值的开头都是一个标识其具体类型的类型 ID。类型 ID 后跟可选的类型特定元数据。

### 类型 ID 编码

- 类型 ID 作为无符号 varint32（small7）写入。
- 内部类型直接使用其内部类型 ID（低 8 位）。
- 用户注册类型先写入内部类型 ID，再将 `user_type_id` 作为 varuint32 写入。
  - `user_type_id` 是数值 ID（当前实现支持 0~0xFFFFFFFE）。
  - `internal_type_id` 是 `ENUM`、`STRUCT`、`COMPATIBLE_STRUCT`、`EXT` 或 `TYPED_UNION` 之一。
- 命名类型不嵌入用户 ID。它们使用 `NAMED_*` 内部类型 ID，并携带 namespace 和类型名称（或共享 TypeDef）。

### 类型元信息载荷

类型 ID 之后：

- **ENUM / STRUCT / EXT / TYPED_UNION**：除 `user_type_id` 外没有额外字节（两端都必须按 ID 注册）。
- **COMPATIBLE_STRUCT**：
  - 如果启用元信息共享，则写入共享 TypeDef 条目（见下文）。
  - 如果禁用元信息共享，则没有额外字节。
- **NAMED_ENUM / NAMED_STRUCT / NAMED_COMPATIBLE_STRUCT / NAMED_EXT / NAMED_UNION**：
  - 如果禁用元信息共享，则将 `namespace` 和 `type_name` 作为元字符串写入。
  - 如果启用元信息共享，则写入共享 TypeDef 条目（见下文）。
- **UNION**：此层没有额外字节。
- **LIST / SET / MAP / 原始类型**：此层没有额外字节。

因此，完全基于 ID 的 enum、ext 和 typed-union 值不携带 TypeDef body。接收端的 TypeDef 资源限制只在数据流实际携带共享 TypeDef 元数据时适用。

`ARRAY (42)` 保留给未来专用多维数组的 xlang 扩展，不在当前 xlang 数据流中使用。

未注册类型按命名类型序列化：

- Enum -> `NAMED_ENUM`
- 类 Struct 的 class -> `NAMED_STRUCT`（启用元信息共享时为 `NAMED_COMPATIBLE_STRUCT`）
- 自定义扩展类型 -> `NAMED_EXT`
- Union -> `NAMED_UNION`

namespace 是 package/module 名称，类型名称是简单类名。

### 共享类型元信息（流式传输）

启用元信息共享后，首次遇到某个类型时内联写入 TypeDef 元数据，后续出现时只引用该元数据。

编码：

- `marker = (index << 1) | flag`
- `flag = 0`：后跟新的类型定义
- `flag = 1`：引用此前写入的类型定义
- `index` 是分配给该类型的顺序索引（从 0 开始）。

写入算法：

1. 在每个数据流的元信息上下文 map 中查找 class。
2. 如果找到，写入 `(index << 1) | 1`。
3. 如果未找到：
   - 分配 `index = next_id`
   - 写入 `(index << 1)`
   - 紧接着写入编码后的 TypeDef 字节

读取算法：

1. 将 `marker` 作为 varuint32 读取。
2. `flag = marker & 1`，`index = marker >>> 1`。
3. 如果 `flag == 1`，使用 `index` 处缓存的 TypeDef。
4. 如果 `flag == 0`，读取 TypeDef，将其缓存在 `index` 处并使用它。

TypeDef 字节包括 8 字节全局 header 和可选的大小扩展。

### TypeDef（Schema 演进元数据）

TypeDef 描述类 struct 类型（或命名 enum/ext），用于 Schema 演进和名称解析。其编码如下：

```
|    8-byte global header   | [optional size varuint] | TypeDef body |
```

#### 全局 Header

8 字节 header 是小端序 uint64：

- 低 8 位：元信息大小（TypeDef body 的字节数）。
  - 如果元信息大小 >= 0xFF，则将低 8 位设为 0xFF，并紧接在 header 后写入额外的 `varuint32(meta_size - 0xFF)`。
- Bit 8：`COMPRESS_META` 保留给未来的 xlang 元数据压缩扩展。当前 xlang 写入器 MUST 保持该位未设置，当前 xlang 读取器 MUST 将设置了该位的输入视为不受支持。
- Bits 9-11：保留给未来扩展（必须为零）。
- 高 52 位：存储的哈希位，来源是对 `TypeDef body || header_low12_le` 计算的 MurmurHash3 x64_128，seed 为 47。`header_low12_le` 是包含 header 低 12 位（大小、压缩位和保留位）的两个小端序字节；第二个字节的高四位为零。从 MurmurHash3 结果中取 lane 0（这是一个 128 位结果），将其视为有符号 int64，左移 12 位并采用二进制补码 64 位回绕语义，应用有符号绝对值（`INT64_MIN` 保持不变），然后以 `0xfffffffffffff000` 进行掩码。最终 header 由掩码后的哈希位与 header 低 12 位执行 OR 得到。

#### TypeDef 主体

TypeDef body 只有一层（字段按 class 层次结构顺序展开）：

```
| meta header (1 byte) | type spec | field info ... |
```

struct TypeDef 的元信息 header 字节：

- Bit 7：`IS_STRUCT`（1）。
- Bit 6：`COMPATIBLE`。
- Bit 5：`REGISTER_BY_NAME`（1 = namespace + 类型名称，0 = 数值用户类型 ID）。
- Bits 0-4：`num_fields`（0-30）。
  - 如果 `num_fields == 31`，读取额外的 `varuint32` 并加到该值上。

非 struct TypeDef 的元信息 header 字节：

- Bit 7：`IS_STRUCT`（0）。
- Bits 4-6：保留（必须为零）。
- Bits 0-3：kind code。

读取器可以拒绝超过运行时资源限制的已接收 TypeDef，例如单个 struct TypeDef 的最大元数据 body 字节数或最大字段数。这些限制是接收端资源控制，不会改变 TypeDef 编码格式、类型身份、动态加载、未知类型处理、注册策略或 Schema 演进语义。

非 struct kind code：

- `0`：`ENUM`
- `1`：`NAMED_ENUM`
- `2`：`EXT`
- `3`：`NAMED_EXT`
- `4`：`TYPED_UNION`
- `5`：`NAMED_UNION`
- `6-14`：保留
- `15`：扩展 kind escape，在定义之前均应拒绝

类型规范：

- 如果设置了 `REGISTER_BY_NAME`：
  - `namespace` 元字符串
  - `type_name` 元字符串
- 否则：
  - 用户类型 ID，编码为 `varuint32`

字段信息列表：

每个字段的编码如下：

```
| field header (1 byte) | field type info | [field name bytes] |
```

字段 header 布局：

- Bits 6-7：字段名称编码（`UTF8`、`ALL_TO_LOWER_SPECIAL`、`LOWER_UPPER_DIGIT_SPECIAL` 或 `TAG_ID`）
- Bits 2-5：大小
  - 对于名称编码：`size = (name_bytes_length - 1)`
  - 对于 tag ID：`size = tag_id`
  - 如果 `size == 0b1111`，读取 `varuint32(size - 15)` 并加到该值上
- Bit 1：nullable flag
- Bit 0：引用跟踪 flag

字段类型信息：

- 顶层字段类型以不带 flag 的 `varuint32(type_id)`（small7）写入。
- 对于 `LIST` / `SET`，后跟元素类型，编码为 `(nested_type_id << 2) | (nullable << 1) | tracking_ref`。
- 对于 `MAP`，后跟键类型和值类型，两者采用相同方式编码。
- 一维原始类型数组使用 `*_ARRAY` 类型 ID；其他数组编码为 `LIST`。

字段名称：

- 如果使用 `TAG_ID` 编码，则不写入名称字节。
- 否则，将编码后的字段名称字节作为元字符串写入。
- 对于 xlang，字段名称在编码前转换为 `snake_case`，以实现跨语言兼容。

字段顺序：

TypeDef 字段列表使用[字段顺序](#field-order)中定义的相同顺序。兼容解码器仍必须按名称或 tag ID 匹配字段，而不能只依赖位置。

## 元字符串

元字符串是字段名称、类型名称和 namespace 等元数据字符串的压缩编码。这种压缩可以显著减小序列化数据中类型元数据的大小。

### 编码类型 ID

| ID  | 名称                      | 位数/字符 | 字符集                          |
| --- | ------------------------- | --------- | ------------------------------- |
| 0   | UTF8                      | 8         | 任意 UTF-8 字符                 |
| 1   | LOWER_SPECIAL             | 5         | `a-z . _ $ \|`                  |
| 2   | LOWER_UPPER_DIGIT_SPECIAL | 6         | `a-z A-Z 0-9 . _`               |
| 3   | FIRST_TO_LOWER_SPECIAL    | 5         | 首字符大写，其余为 `a-z . _`    |
| 4   | ALL_TO_LOWER_SPECIAL      | 5         | `a-z A-Z . _`（大写字符需转义） |

### 字符映射表

#### LOWER_SPECIAL（每个字符 5 位）

| 字符 | 编码（二进制） | 编码（十进制） |
| ---- | -------------- | -------------- |
| a-z  | 00000-11001    | 0-25           |
| .    | 11010          | 26             |
| \_   | 11011          | 27             |
| $    | 11100          | 28             |
| \|   | 11101          | 29             |

**注意：**`|` 字符在 ALL_TO_LOWER_SPECIAL 编码中用作转义序列。

#### LOWER_UPPER_DIGIT_SPECIAL（每个字符 6 位）

| 字符 | 编码（二进制） | 编码（十进制） |
| ---- | -------------- | -------------- |
| a-z  | 000000-011001  | 0-25           |
| A-Z  | 011010-110011  | 26-51          |
| 0-9  | 110100-111101  | 52-61          |
| .    | 111110         | 62             |
| \_   | 111111         | 63             |

### 编码算法

#### LOWER_SPECIAL 编码

对于仅包含 `a-z`、`.`、`_`、`$`、`|` 的字符串：

```
function encode_lower_special(str):
    bits = []
    for char in str:
        bits.append(lookup_lower_special[char])  // 5 bits each

    // Pad to byte boundary
    total_bits = len(str) * 5
    padding_bits = (8 - (total_bits % 8)) % 8

    // First bit indicates if last char should be stripped (due to padding)
    strip_last = (padding_bits >= 5)
    if strip_last:
        prepend bit 1
    else:
        prepend bit 0

    return pack_bits_to_bytes(bits)
```

#### FIRST_TO_LOWER_SPECIAL 编码

对于类似 `MyFieldName`、只有第一个字符大写的字符串：

```
function encode_first_to_lower_special(str):
    // Convert first char to lowercase
    modified = str[0].lower() + str[1:]
    // Then use LOWER_SPECIAL encoding
    return encode_lower_special(modified)
```

#### ALL_TO_LOWER_SPECIAL 编码

对于类似 `MyTypeName`、包含多个大写字符的字符串：

```
function encode_all_to_lower_special(str):
    result = ""
    for char in str:
        if char.is_upper():
            result += "|" + char.lower()  // Escape uppercase with |
        else:
            result += char
    return encode_lower_special(result)
```

示例：`MyType` → `|my|type` → 使用 LOWER_SPECIAL 编码

### 编码选择算法

```
function choose_encoding(str):
    if all chars in str are in [a-z . _ $ |]:
        return LOWER_SPECIAL

    if first char is uppercase AND rest are in [a-z . _]:
        return FIRST_TO_LOWER_SPECIAL

    if all chars are in [a-z A-Z . _]:
        lower_special_size = encode_all_to_lower_special(str).size
        luds_size = encode_lower_upper_digit_special(str).size
        if lower_special_size <= luds_size:
            return ALL_TO_LOWER_SPECIAL
        else:
            return LOWER_UPPER_DIGIT_SPECIAL

    if all chars are in [a-z A-Z 0-9 . _]:
        return LOWER_UPPER_DIGIT_SPECIAL

    return UTF8
```

### 元字符串 Header 格式

元字符串写入时带有包含编码类型的 header：

```
| 3 bits encoding | 5+ bits length | encoded bytes |
```

对于较大的字符串：

```
| varuint: (length << 3) | encoding | encoded bytes |
```

### 不同上下文中的特殊字符集

不同上下文使用不同的特殊字符：

| 上下文    | 特殊字符  | 说明                          |
| --------- | --------- | ----------------------------- |
| 字段名称  | . \_ $ \| | $ 用于内部 class，\| 用于转义 |
| Namespace | . \_      | Package/module 分隔符         |
| 类型名称  | $ \_      | $ 用于 Java 内部 class        |

### 去重

元字符串在一次序列化会话中会被去重：

```
First occurrence:  | (length << 1) | [hash if large] | encoding | bytes |
Reference:         | ((id + 1) << 1) | 1 |
```

- header 的 Bit 0 表示：0 = 新字符串，1 = 对此前字符串的引用
- 大字符串（> 16 字节）包含用于按内容去重的 64 位哈希
- 小字符串使用精确字节比较

## 值格式

### 基本类型

#### bool

- 大小：1 字节
- 格式：`false` 为 0，`true` 为 1

#### int8

- 大小：1 字节
- 格式：直接写为纯字节。

#### int16

- 大小：2 字节
- 字节序：小端序的原始字节

#### unsigned int32

- 大小：4 字节
- 字节序：小端序的原始字节

#### unsigned varint32

- 大小：1~5 字节
- 格式：每个字节的最高有效位（MSB）表示是否还有下一个字节。如果 continuation bit 已设置（即 `b & 0x80 == 0x80`），应继续读取下一个字节，直到读到 continuation bit 未设置的字节。

**编码算法：**

```
function write_varuint32(value):
    while value >= 0x80:
        buffer.write_byte((value & 0x7F) | 0x80)  // 7 bits of data + continuation bit
        value = value >> 7
    buffer.write_byte(value)  // final byte without continuation bit
```

**解码算法：**

```
function read_varuint32():
    result = 0
    shift = 0
    while true:
        byte = buffer.read_byte()
        result = result | ((byte & 0x7F) << shift)
        if (byte & 0x80) == 0:
            break
        shift = shift + 7
    return result
```

**不同值范围对应的字节数：**

| 值范围                 | 字节数 |
| ---------------------- | ------ |
| 0 ~ 127                | 1      |
| 128 ~ 16383            | 2      |
| 16384 ~ 2097151        | 3      |
| 2097152 ~ 268435455    | 4      |
| 268435456 ~ 4294967295 | 5      |

#### signed int32

- 大小：4 字节
- 字节序：小端序的原始字节

#### signed varint32

- 大小：1~5 字节
- 格式：首先使用 ZigZag 编码将数字转换为正的 unsigned int，然后按 unsigned varint 编码。

**ZigZag 编码：**

```
// Encode: convert signed to unsigned
zigzag_value = (value << 1) ^ (value >> 31)

// Decode: convert unsigned back to signed
original = (zigzag_value >> 1) ^ (-(zigzag_value & 1))
// Or equivalently:
original = (zigzag_value >> 1) ^ (~(zigzag_value & 1) + 1)
```

ZigZag 编码将有符号整数映射为无符号整数，使绝对值较小的值（无论正负）具有较小的编码值：

| 原始值 | ZigZag 编码值 |
| ------ | ------------- |
| 0      | 0             |
| -1     | 1             |
| 1      | 2             |
| -2     | 3             |
| 2      | 4             |
| ...    | ...           |

#### unsigned int64

- 大小：8 字节
- 字节序：小端序的原始字节

#### unsigned varint64

- 大小：1~9 字节

使用 PVL（Progressive Variable-Length，渐进变长）编码：

```
function write_varuint64(value):
    while value >= 0x80:
        buffer.write_byte((value & 0x7F) | 0x80)
        value = value >> 7
    buffer.write_byte(value)
```

| 值范围        | 字节数 |
| ------------- | ------ |
| 0 ~ 127       | 1      |
| 128 ~ 16383   | 2      |
| ...           | ...    |
| 2^56 ~ 2^63-1 | 9      |

#### unsigned hybrid int64（TAGGED_UINT64）

- 大小：4 或 9 字节

针对能用 31 位表示的无符号值（ID、大小、计数等常见场景）进行了优化：

```
if value in [0, 2147483647]:  // fits in 31 bits (2^31 - 1), full unsigned range
    write 4 bytes: ((int32) value) << 1  // bit 0 is 0, indicating 4-byte encoding
else:
    write 1 byte:  0x01                  // bit 0 is 1, indicating 9-byte encoding
    write 8 bytes: value as little-endian uint64
```

读取：

```
first_int32 = read_int32_le()
if (first_int32 & 1) == 0:
    return (uint64)(first_int32 >> 1)  // 4-byte encoding, unsigned
else:
    return read_uint64_le()            // read remaining 8 bytes
```

注意：TAGGED_UINT64 将完整的 31 位用于正值 [0, 2^31-1]，而 TAGGED_INT64 会在有符号值 [-2^30, 2^30-1] 之间拆分该范围。

#### VarUint36Small

一种用于字符串 header 的专用编码，将大小（最多 36 位）与编码 flag 组合起来：

```
// Write: encodes (size << 2) | encoding_flags
function write_varuint36_small(value):
    if value < 0x80:
        buffer.write_byte(value)
    else:
        // Standard varint encoding for values >= 128
        write_varuint64(value)
```

该编码针对字符串长度可用 7 位表示（字符串 < 32 个字符）的常见情况进行了优化。

#### signed int64

- 大小：8 字节
- 字节序：小端序的原始字节

#### signed varint64

- 大小：1~9 字节

首先使用 ZigZag 编码，然后使用 PVL varint：

```
// Encode
zigzag_value = (value << 1) ^ (value >> 63)
write_varuint64(zigzag_value)

// Decode
zigzag_value = read_varuint64()
value = (zigzag_value >> 1) ^ (-(zigzag_value & 1))
```

#### signed hybrid int64（TAGGED_INT64）

- 大小：4 或 9 字节

针对较小的有符号值进行了优化：

```
if value in [-1073741824, 1073741823]:  // fits in 30 bits + sign ([-2^30, 2^30-1])
    write 4 bytes: ((int32) value) << 1  // bit 0 is 0, indicating 4-byte encoding
else:
    write 1 byte:  0x01                  // bit 0 is 1, indicating 9-byte encoding
    write 8 bytes: value as little-endian int64
```

读取：

```
first_int32 = read_int32_le()
if (first_int32 & 1) == 0:
    return (int64)(first_int32 >> 1)  // 4-byte encoding, sign-extended
else:
    return read_int64_le()            // read remaining 8 bytes
```

注意：TAGGED_INT64 使用 30 位 + 符号位表示 [-2^30, 2^30-1] 范围内的值，而 TAGGED_UINT64 使用完整的 31 位表示 [0, 2^31-1] 范围内的无符号值。

#### float8

- 大小：1 字节
- 格式：
  - float8 有 4 种：float8 kind enum 包括 float8_e4m3fn、float8_e4m3fnuz、float8_e5m2、float8_e5m2fnuz
  - 作为字段序列化时，将原始 8 位直接写为一个字节
  - 作为对象序列化时：先将 type kind 写为一个字节，再写入值字节

#### float16

- 大小：2 字节
- 格式：根据 IEEE 754 标准 binary16 格式对指定浮点值进行编码，保留 NaN 值，然后以小端序写为二进制数据。

#### bfloat16

- 大小：2 字节
- 格式：根据 IEEE 754 标准 bfloat16 格式对指定浮点值进行编码，保留 NaN 值，然后以小端序写为二进制数据。

#### float32

- 大小：4 字节
- 格式：根据 IEEE 754 浮点数“single format”位布局对指定浮点值进行编码，保留非数值（NaN），然后以小端序写为二进制数据。

#### float64

- 大小：8 字节
- 格式：根据 IEEE 754 浮点数“double format”位布局对指定浮点值进行编码，保留非数值（NaN），然后以小端序写为二进制数据。

### string

格式：

```
| varuint36_small: (size << 2) | encoding | binary data |
```

#### 字符串 Header

header 使用 `varuint36_small` 格式编码，将字节长度和编码类型组合在一起：

```
header = (byte_length << 2) | encoding_type
```

| 编码类型 | 值  | 描述                                 |
| -------- | --- | ------------------------------------ |
| LATIN1   | 0   | ISO-8859-1 单字节编码                |
| UTF16    | 1   | UTF-16 编码（每个 code unit 2 字节） |
| UTF8     | 2   | UTF-8 变长编码                       |
| Reserved | 3   | 保留给未来使用                       |

#### 编码算法

**写入：**

```
function write_string(str):
    bytes = encode_to_bytes(str, chosen_encoding)
    header = (bytes.length << 2) | encoding_type
    buffer.write_varuint36_small(header)
    buffer.write_bytes(bytes)
```

**读取：**

```
function read_string():
    header = buffer.read_varuint36_small()
    encoding = header & 0x03
    byte_length = header >> 2
    bytes = buffer.read_bytes(byte_length)
    return decode_bytes(bytes, encoding)
```

#### 各语言的编码选择

**写入：**

| 语言         | 编码策略                                                 |
| ------------ | -------------------------------------------------------- |
| Java (JDK8)  | 运行时检测：所有字符 < 256 时使用 LATIN1，否则使用 UTF16 |
| Java (JDK9+) | 使用 String 的内部 coder：LATIN1 或 UTF16                |
| Python       | 可以根据字符串内容写入 LATIN1、UTF16 或 UTF8             |
| C++          | UTF8（`std::string`）或 UTF16（`std::u16string`）        |
| Rust         | UTF8（`String`）                                         |
| Go           | UTF8（`string`）                                         |
| JavaScript   | UTF8                                                     |

**读取：**所有语言都支持解码三种编码（LATIN1、UTF16、UTF8）。

**建议：**根据最高性能选择编码——使用与语言原生字符串表示匹配的编码，以避免转换开销。

#### 空字符串

空字符串编码为 header `0`（长度为 0，编码类型任意），之后不写入数据字节。

### duration

Duration 是与任何日历或时区无关的绝对时间长度，以秒数和纳秒数表示。

格式：

```
| signed varint64: seconds | signed int32: nanoseconds |
```

- `seconds`：duration 的秒数，使用有符号 varint64 编码。可以为正，也可以为负。
- `nanoseconds`：duration 的纳秒调整量，使用有符号 int32 编码。

注意：

- Duration 存储为两个独立字段，以保持精度并避免溢出问题。
- 秒数使用 varint64 编码，以紧凑地表示常见 duration 值。
- 纳秒数使用定长 int32 存储，因为其范围有限。

#### 规范规则

- 写入器 MUST 对 duration 进行规范化，使 `nanoseconds` 始终处于 `[0, 1_000_000_000)`。
- 零 MUST 编码为 `seconds = 0` 和 `nanoseconds = 0`。
- 负的亚秒 duration MUST 借用一秒，并使用正的纳秒调整量。例如：`-0.5s` 编码为 `seconds = -1`、`nanoseconds = 500_000_000`。
- 更一般地，编码后的数值对 MUST 满足：
  - `duration = seconds + nanoseconds / 1_000_000_000`
  - `0 <= nanoseconds < 1_000_000_000`

#### 最终值

解码 `seconds` 和 `nanoseconds` 后，duration 值重建为以下表达式表示的精确时长：

`seconds + nanoseconds / 1_000_000_000`

### collection/list

格式：

```
| varuint32: length | 1 byte elements header | [optional type info] | elements data |
```

#### 元素 Header

元素 header 是一个字节，其中编码了集合元素的元数据，用于优化序列化：

```
| bit 7-4 (reserved) |    bit 3    |      bit 2       |   bit 1  |   bit 0   |
+--------------------+-------------+------------------+----------+-----------+
|      reserved      | is_same_type| is_decl_elem_type| has_null | track_ref |
```

| Bit | 名称              | 值   | SET（1）时的含义           | UNSET（0）时的含义           |
| --- | ----------------- | ---- | -------------------------- | ---------------------------- |
| 0   | track_ref         | 0x01 | 跟踪元素引用               | 不跟踪元素引用               |
| 1   | has_null          | 0x02 | 载荷包含空元素标记         | 没有空元素（跳过 null 检查） |
| 2   | is_decl_elem_type | 0x04 | 元素属于声明的泛型类型     | 元素类型不同于声明类型       |
| 3   | is_same_type      | 0x08 | 所有元素具有相同的具体类型 | 元素具有不同的具体类型       |

**常见 header 值：**

| Header | Hex | 含义                                           |
| ------ | --- | ---------------------------------------------- |
| 0x0C   | 12  | 声明类型 + 相同类型、非空、不跟踪引用（最优）  |
| 0x0D   | 13  | 声明类型 + 相同类型、非空、跟踪引用            |
| 0x0E   | 14  | 声明类型 + 相同类型、可能有空值、不跟踪引用    |
| 0x08   | 8   | 类型相同但不是声明类型（类型信息只写入一次）   |
| 0x00   | 0   | 类型不同、非空、不跟踪引用（每个元素都写类型） |

#### Header 后的类型信息

如果未设置 `is_decl_elem_type`（bit 2），但设置了 `is_same_type`（bit 3），则在 header 后写入一次元素类型信息：

```
| header (0x08) | type_id (varuint32) | elements... |
```

如果 `is_decl_elem_type` 和 `is_same_type` 都未设置，则逐元素写入类型信息。

#### 基于 Header 的元素序列化

header 决定每个元素的序列化方式：

#### 元素数据

根据元素 header，元素数据序列化可以跳过 `ref flag`/`null flag`/`element type info`。

```python
fory = ...
buffer = ...
elems = ...
if element_type_is_same:
    if not is_declared_type:
        fory.write_type(buffer, elem_type)
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
            fory.write_ref(buffer, elem)
    elif has_null:
        for elem in elems:
            fory.write_nullable(buffer, elem)
    else:
        for elem in elems:
            fory.write(buffer, elem)
```

可以参考 [`CollectionSerializer#writeElements`](https://github.com/apache/fory/blob/20a1a78b17a75a123a6f5b7094c06ff77defc0fe/java/fory-core/src/main/java/org/apache/fory/serializer/collection/CollectionLikeSerializer.java#L302)。

### array

#### 原始类型数组

原始类型数组视为二进制 buffer，序列化时只需将数组长度写为 unsigned int，然后将整个 buffer 复制到数据流中。多字节元素数组始终以小端元素顺序编码；原生 typed-array 存储使用其他字节序的实现必须交换字节，或显式写入元素，不能原样复制原生存储字节。

这种序列化不会压缩数组。如果用户希望压缩原始类型数组，需要为相应类型注册自定义序列化器，或将其标记为 list 类型。

浮点数组细节：

- float16/bfloat16 数组：写入 `varuint` 长度，然后按小端序写入原始字节。
- float8 数组：将元素 type kind 写为一个字节，再写入 `varuint` 长度，然后按小端序写入原始字节。

#### 多维数组

当前 xlang 未定义专用的多维数组/tensor 编码。多维数组序列化为嵌套 list，而一维原始类型数组使用 `*_ARRAY` 类型 ID。内部类型 ID `ARRAY (42)` 保留给未来专用的多维数组编码，不在当前 xlang 数据流中使用。

#### 对象数组

对象数组使用 list 格式序列化。对象的 component type 会作为 list 元素的泛型类型。

### map

Map 使用基于 chunk 的格式，以高效处理异构键值对：

```
| varuint32: total_size | chunk_1 | chunk_2 | ... | chunk_n |
```

#### Map Chunk 格式

每个 chunk 最多包含 255 个元数据特征相同的键值对：

```
|    1 byte    |     1 byte     |        variable bytes        |
+--------------+----------------+------------------------------+
|  KV header   |  chunk size N  |  N key-value pairs (N*2 obj) |
```

#### KV Header 位

KV header 是一个字节，对键和值的元数据进行编码：

```
|  bit 7-6   |     bit 5     |     bit 4    |     bit 3     |     bit 2     |     bit 1    |     bit 0     |
+------------+---------------+--------------+---------------+---------------+--------------+---------------+
|  reserved  | val_decl_type | val_has_null | val_track_ref | key_decl_type | key_has_null | key_track_ref |
```

| Bit | 名称          | 值   | SET（1）时的含义                  |
| --- | ------------- | ---- | --------------------------------- |
| 0   | key_track_ref | 0x01 | 跟踪键的引用                      |
| 1   | key_has_null  | 0x02 | 键可能为 null（很少见，通常无效） |
| 2   | key_decl_type | 0x04 | 键属于声明的泛型类型              |
| 3   | val_track_ref | 0x08 | 跟踪值的引用                      |
| 4   | val_has_null  | 0x10 | 值可能为 null                     |
| 5   | val_decl_type | 0x20 | 值属于声明的泛型类型              |

**常见 KV header 值：**

| Header | Hex | 含义                                          |
| ------ | --- | --------------------------------------------- |
| 0x24   | 36  | 键 + 值均为声明类型、非空、不跟踪引用（最优） |
| 0x2C   | 44  | 键 + 值均为声明类型，值跟踪引用               |
| 0x34   | 52  | 键 + 值均为声明类型，值可能为 null            |
| 0x00   | 0   | 键 + 值均非声明类型、非空、不跟踪引用         |

#### Chunk 大小

- 非空 chunk 的大小为 1 到 255 个键值对（可用 1 字节表示）；零无效
- 键或值为 null 时，该条目序列化为隐式大小为 1 的独立 chunk（省略 chunk size 字节）
- 对于只有一侧为 null 的条目，非空一侧采用完整字段顺序：如果存在引用 envelope，先写入它，再写入 header 未声明的所有类型信息，最后写入 body
- 读取器根据 map 总大小跟踪累计计数，以确定何时停止读取 chunk

#### 为什么使用基于 Chunk 的格式？

Map 迭代开销很大。为所有键值对计算同一个 header 需要遍历两次。基于 chunk 的方式支持：

1. **乐观预测**：使用第一个键值对预测 header
2. **自适应分块**：如果某个键值对不符合预测，则开始新的 chunk
3. **高效读取**：大多数 map 只需一个 chunk（< 255 个键值对）
4. **内存效率**：常见的同构 map 仅有极少开销

#### 为什么要逐个 Chunk 序列化？

Fory 使用第一个键值对乐观预测 header 时，无法知道有多少键值对具有相同的元信息（是否跟踪键引用、键是否为 null 等）。如果不设置最大 chunk 大小并逐个 chunk 写入，就必须预留至少 `X` 个字节，以便稍后更新相同元素的数量，其中 `X` 是 map 大小采用 varint 编码时的 num_bytes。

而大多数 map 的大小小于 255；如果所有键值对都具有相同数据，chunk 数量就是 1。这在默认不引用对象的 golang/rust 中很常见。

此外，如果只有一两个键的元信息不同，可以将它们划入另一个 chunk，使大多数键值对能够共享元信息。

实现可以结合 map 大小累计读取计数，以确定是否还要读取更多 chunk。

### enum

Enum 序列化为无符号 varint enum ID。

- 如果 enum 定义为某个值提供了显式 enum ID / variant ID / 稳定数值 tag，则 MUST 使用该 ID。
- 如果没有指定显式 enum ID，则默认使用声明序号作为 enum ID。

这意味着编码契约始终是 enum ID。当 enum ID 来自声明顺序时，重新排列 enum 值会改变编码 ID，并可能改变反序列化结果。对于跨语言或长期使用的 Schema，用户应优先选择显式的稳定 enum ID。

### timestamp

Timestamp 表示与任何日历或时区无关的时间点。其编码如下：

- `seconds`（int64）：自 Unix 纪元（1970-01-01T00:00:00Z）起的秒数
- `nanos`（uint32）：一秒内的纳秒调整量

写入时，实现必须规范化负 timestamp，使 `nanos` 始终处于 `[0, 1_000_000_000)`。这是定长 12 字节载荷（8 字节 seconds + 4 字节 nanos）。

### date

Date 表示不带时区的日期。其编码如下：

- `days`（varint64）：自 Unix 纪元（`1970-01-01`）起的有符号天数

该值重建为 `LocalDate.ofEpochDay(days)`，或目标语言实现中等价的日历日期构造结果。

此 `varint64` 编码仅适用于 xlang 序列化。特定语言的原生本地日期编码保持不变。

### decimal

Decimal 值的编码如下：

1. `scale`：有符号 varint32
2. `unscaledHeader`：无符号 varint64
3. 可选的 `payload`：仅较大的 unscaled 值会携带

其数学值为：

`value = unscaled × 10^-scale`

#### Scale（小数位数）

- `scale` 编码为有符号 varint32。
- `scale` 不携带额外 flag 或 mode bit。
- 任意精度 decimal 载体只接受 `-10_000 <= scale <= 10_000`。

#### Unscaled Header（未缩放值头部）

`unscaledHeader` 选择 `unscaled` 的编码：

- 如果 `(unscaledHeader & 1) == 0`，该值使用小值编码。
- 如果 `(unscaledHeader & 1) == 1`，该值使用大值编码。

#### 小值编码

对于较小的值，`unscaled` 必须能用有符号 64 位范围表示，且 zigzag 编码后的值必须能用 63 位表示。

编码：

- `unscaledHeader = zigzag(unscaled) << 1`
- 不写入 payload

解码：

- `unscaled = zigzagDecode(unscaledHeader >>> 1)`

#### 大值编码

对于较大的值，`unscaled` 编码为符号加 magnitude 字节。

编码：

- `sign = 0`（如果 `unscaled >= 0`），否则为 `1`
- `magnitude = abs(unscaled)`
- `len = byte length of magnitude in canonical minimal little-endian form`
- `meta = (len << 1) | sign`
- `unscaledHeader = (meta << 1) | 1`
- `payload = magnitude as canonical minimal little-endian bytes`

对于任意精度 decimal 载体，`len` 不得超过 `10_000`。此限制只计算 `abs(unscaled)` 的规范无符号二进制字节，不计算 header、十进制位数或文本表示。

解码：

- `meta = unscaledHeader >>> 1`
- `sign = meta & 1`
- `len = meta >>> 1`
- 将 `len` 个字节读取为小端序无符号 magnitude
- `unscaled = magnitude`（如果 `sign == 0`），否则为 `-magnitude`

#### 规范规则

- 零必须使用小值编码。
- 大值编码不得用于零。
- 在大值编码中，`payload` 必须是最小的小端序表示。
- 因此，在大值编码中，`len > 0` 且 `payload[len - 1] != 0`。

#### 最终值

解码 `scale` 和 `unscaled` 后，decimal 值重建为：

`value = unscaled × 10^-scale`

scale 和 magnitude 上限是可接受值的限制，并不改变编码格式。写入器必须拒绝超出限制的值；读取器必须在分配 magnitude 或构造 decimal 前拒绝这些值，同时仍要检查可接受的 body 是否可读并采用规范编码。使用定长范围 decimal 载体的目标可以施加更严格的原生范围限制。

本规范前文所述的兼容标量转换限制彼此独立。特别是，对普通文本进行格式化、rescale、quantize 或以其他方式扩展输出的转换，必须保留其自身预期的输出长度检查；普通 decimal scale 上限不能取代这些检查。

### struct

Struct 指 `class/pojo/struct/bean/record` 类型的对象。Struct 值按 Fory 顺序写入字段进行序列化。值之前的类型元信息按照[类型元信息](#type-meta)中的规则写入。

#### 字段顺序 {#field-order}

字段顺序必须是确定性的，并且在所有语言中保持一致。本节定义与语言无关的排序算法；实现必须遵循此处规则，而不是任何特定语言的辅助 class。

##### 第 1 步：字段标识符

对每个字段计算用于排序的稳定标识符：

- 如果配置了非负 tag ID（例如 `@ForyField(id=...)`），则使用该 tag ID。
- 否则，使用转换为 `snake_case` 的字段名称。

配置的 tag ID 必须为非负值。配置负 tag ID 无效；语言只能将负值用作表示“未配置 tag ID”的默认值或内部 sentinel，此时回退到 `snake_case` 字段名称，该负值不是 tag ID。tag ID 在一个类型内必须唯一；重复的 tag ID 无效。

字段标识符按以下规则比较：

1. 如果两个字段都有 tag ID，则按数值比较 ID。
2. 如果只有一个字段有 tag ID，则带 tag 的字段排在前面。
3. 如果两个字段都没有 tag ID，则按字典序比较 `snake_case` 名称。
4. 如果字段比较后仍然相等，则使用确定性的语言本地 tie-breaker，例如声明 class 名称、原始字段名称或原始字段索引。

##### 第 2 步：分组

按照以下顺序，将每个字段恰好分配到一个组：

1. **原始类型（非空）**：不带 nullable 元数据的原始或 boxed 数值/布尔类型。
2. **原始类型（可空）**：带 nullable 元数据的原始或 boxed 数值/布尔类型。
3. **非原始类型**：所有其他字段，包括字符串、time/date/duration/decimal/binary 值、union、原始类型数组、collection、map、enum、struct、ext/用户定义类型、UNKNOWN 字段、对象数组和所有其他非原始 Schema。

##### 第 3 步：组内排序

在每个组内，依次应用以下排序键，直到发现差异：

**原始类型组（1 和 2）：**

1. **压缩类别**：定长数值和布尔类型在前，压缩数值类型（`VARINT32`、`VAR_UINT32`、`VARINT64`、`VAR_UINT64`、`TAGGED_INT64`、`TAGGED_UINT64`）在后。
2. **原始类型大小**（降序）：8 字节 > 4 字节 > 2 字节 > 1 字节。
3. **内部类型 ID**（升序），作为大小相同时的 tie-breaker。
4. **字段标识符**，使用第 1 步中的比较器。

**非原始类型组（3）：**

1. **字段标识符**，使用第 1 步中的比较器。

如果应用上述规则后两个字段仍相等，则先比较声明 class 名称，再比较原始字段名称，以保持确定顺序。该 tie-breaker 只应在无效 Schema（例如 tag ID 重复）中触发。

##### 注意事项

- 上述排序用于序列化顺序和 TypeDef 字段列表。Schema 哈希使用 Schema 哈希小节所述的字段标识符排序。
- 非原始类型 ID 和 codec 类别不得影响字段顺序。实现可以保留内部类别，以维持优化的序列化器和代码生成路径，但这些类别不是排序键。
- 压缩数值规则对于跨语言一致性至关重要：压缩整数字段始终位于所有定长整数字段之后。

#### 相同 Schema 模式（禁用元信息共享）

对象值布局：

```
| [optional 4-byte schema hash] | field values |
```

仅在启用 class 版本检查时写入 Schema 哈希。它取 struct 指纹字符串对应哈希的低 32 位，该哈希为 MurmurHash3 x64_128：

- 对每个字段构造 `<field_id_or_name>,<field_type_fingerprint>;`。
- 如果存在 tag ID，字段标识符就是 tag ID，否则为 snake_case 字段名称。
- 拼接前按照[字段顺序](#field-order)中的字段标识符比较器排序。
- `field_type_fingerprint` 采用递归形式：
  - 叶节点：`<type_id>,<ref>,<nullable>`
  - `LIST` / `SET`：`<type_id>,<ref>,<nullable>[<element_fingerprint>]`
  - `MAP`：`<type_id>,<ref>,<nullable>[<key_fingerprint>|<value_fingerprint>]`
- 嵌套容器元素/键/值的指纹包含嵌套类型 ID、容器结构和实际整数编码，但嵌套 `nullable` 和 `ref` 策略始终按 `0` 参与哈希。只有根字段的 `nullable` 和 `ref` 位参与 Schema 哈希，因为嵌套读取会直接遵循编码中的 null/ref flag。
- 该 Schema 哈希规则只适用于不带 TypeDef 元数据的相同 Schema 模式。它不允许兼容模式下的匹配字段分类接受嵌套的 nullability 或引用跟踪不匹配。

字段值按 Fory 顺序序列化。原始类型字段写为原始值（可空原始类型包含 null flag）。非原始类型字段按需写入 ref/null flag，然后写入值；多态字段包含类型元信息。

#### 兼容模式（启用元信息共享）

字段值布局与相同 Schema 模式相同，但 `COMPATIBLE_STRUCT` 和 `NAMED_COMPATIBLE_STRUCT` 的类型元信息使用共享 TypeDef 条目。反序列化器使用 TypeDef 按名称或 tag ID 映射字段，并遵循元数据中的 nullable/ref flag；未知字段会被跳过。

### Union

Union 值使用三个 union 类型 ID 进行编码，使 union Schema 身份位于类型元信息中（与 `STRUCT/ENUM/EXT` 类似），并易于在 `Any` 中携带。

#### IDL 语法

```fdl
union Contact [id=0] {
  string email = 0;
  int32  phone = 1;
}
```

规则：

- union Schema MUST 声明至少一个由 Schema 定义的备选项。某些语言绑定使用的 unknown-case 载体由实现提供，不包含在 Schema 的备选表中。
- 每个由 Schema 定义的备选项都包含恰好一种声明的值类型或 `none`。多个逻辑字段需要显式声明 struct 值；语言绑定 MUST NOT 从宿主 enum variant 合成该 struct。
- 每个 union 备选项 MUST 具有稳定的非负 tag 编号（`= 0`、`= 1` 等）。
- tag 编号在 union 内 MUST 唯一且 MUST NOT 被复用。
- 语言绑定公开的 unknown-case 载体没有自身的本地 Schema tag；重新序列化时，它们会重放原始对端 Schema tag。

#### 类型 ID 与类型元信息

| 类型 ID | 名称        | 含义                                  |
| ------: | ----------- | ------------------------------------- |
|      33 | UNION       | 不嵌入 Schema 身份的 Union 值         |
|      34 | TYPED_UNION | 带有已注册数值类型 ID 的 Union 值     |
|      35 | NAMED_UNION | 嵌入类型名称/共享 TypeDef 的 Union 值 |

类型元信息编码：

- `UNION (33)`：没有额外的类型元信息载荷。
- `TYPED_UNION (34)`：在类型 ID 后将 `user_type_id` 写为 varuint32。
- `NAMED_UNION (35)`：后跟命名类型元信息（namespace + 类型名称，或共享 TypeDef marker/body）。

字段 TypeDef 元数据 MUST 对静态类型 union 字段使用 `UNION`，包括生成的 typed ADT union 字段。在此处 MUST NOT 使用 `TYPED_UNION` 或 `NAMED_UNION`，因为字段所有者已经提供 union Schema。

#### Union 值载荷

Union 载荷如下：

```
| case_id (varuint32) | case_value (Any-style value) |
```

`case_id` 是 union 备选项的 tag 编号。运行时 APIs MAY 为通用 union 载体公开从零开始的 ordinal index；当这些 ordinal 是 Schema 的备选项 ID 时，就是有效的编码 `case_id` 值。

`case_value` MUST 编码为完整的 xlang 值：

```
| field_ref_meta | field_value_type_meta | field_value_bytes |
```

即使是原始类型，也必须采用这种编码，以便安全跳过未知备选项。

如果读取器看到本地 union Schema 中不存在的 `case_id`，并且目标语言为其提供语言无关的载体，则 SHOULD 保留未知 case。该载体 MUST 公开原始 case ID 和解码后的值，并且 MUST 只保留重新序列化所需的实现内部编码类型 ID 状态。它 MUST NOT 存储 resolver 拥有的类型元数据或其他上下文拥有的状态。写入器 MUST 将存储的原始 case ID 用于 union envelope，而不是任何生成的载体 marker。unknown-case 载荷写入器 MUST 按编码顺序写入 Any 风格的 payload body：先写引用元数据，再写完整的值类型元数据，最后写值字节。对于内部数值类型 ID，类型 ID 字节就是完整的值类型元数据；当解码值具有预期的具体值类型时，载荷写入器 MAY 使用存储的编码类型 ID 保留定长、变长或 tagged 整数编码。这些标量数值载荷不进行引用跟踪，因此其引用元数据为 `NotNullValue`。否则，它 MUST 回退到语言实现普通的多态 Any 值写入器。未知载体是由实现提供的前向兼容容器，而不是本地 Schema case 表中的条目；由 Schema 定义的 union case MAY 使用 `0..N`。写回未知载体时，union envelope MUST 原样使用载体中来自原始对端 Schema 的 case ID，包括原始对端 Schema case ID 为 `0` 的情况。

#### 编码布局

**UNION（从上下文中获知 Schema）**

```
| ... outer ref meta ... | type_id=UNION(33) | case_id | case_value |
```

**TYPED_UNION（通过数值 ID 标识 Schema）**

```
| ... outer ref meta ... | type_id=TYPED_UNION(34) | user_type_id | case_id | case_value |
```

user_type_id：union Schema 的 varuint32 数值注册 ID。

**NAMED_UNION（通过名称/typedef 嵌入 Schema）**

```
| ... outer ref meta ... | type_id=NAMED_UNION(35) | name_or_typedef | case_id | case_value |
```

#### 解码规则

1. 读取外层引用元信息和 `type_id`。
2. 如果是 `TYPED_UNION`，读取 `user_type_id` 并按 ID 解析 union Schema。
3. 如果是 `NAMED_UNION`，读取命名类型元信息并解析 union Schema。
4. 读取 `case_id`。
5. 将 `case_value` 作为 Any 风格的值读取（引用元信息 + 类型元信息 + 值）。

如果 `case_id` 未知，解码器仍 MUST 使用 `field_value_type_meta` 和标准 `skipValue(type_id)` 消费 case 值。

#### 各类型 ID 的适用场景

- 当可以从上下文中获知 union Schema 时，使用 `UNION`。这包括静态类型的生成 union 字段：所属字段元数据已经提供 union Schema，因此字段类型 ID 仍保持为 `UNION`，即使根值或动态值形式会将 union 标识为 `TYPED_UNION` 或 `NAMED_UNION`。
- 当数值注册可用时，动态容器使用 `TYPED_UNION`。
- 优先或必须按名称解析时，使用 `NAMED_UNION`。

#### 兼容性注意事项

- `case_id` 是稳定标识符；新增备选项保持前向兼容，可以跳过未知 case。

### Type

Type 将使用类型元信息格式序列化。

## 常见陷阱

1. **字节序**：多字节值始终使用小端序
2. **Varint 符号扩展**：确保正确处理有符号与无符号 varint
3. **引用 ID 顺序**：必须按序列化顺序分配 ID
4. **字段顺序一致性**：在相同 Schema 模式下，各语言必须完全一致；在兼容模式下，按 TypeDef 字段名称或 tag ID 匹配
5. **字符串编码**：使用最适合当前语言的编码
6. **Null 处理**：不同语言采用不同方式表示 null
7. **空集合**：仍需写入长度（0）和 header 字节
8. **Schema 哈希计算**：启用时，各语言必须使用相同的指纹和 MurmurHash3 算法

## 语言实现指南

请参阅 [Xlang 实现指南](xlang_implementation_guide.md)文档。
