---
title: Xlang 类型映射
sidebar_position: 7
id: xlang_type_mapping
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

说明：

- 有关类型定义，请参阅[规范中的类型系统](xlang_serialization_spec.md#type-systems)
- `int16_t[n]/vector<T>` 表示 `int16_t[n]/vector<int16_t>`
- Xlang 序列化是 Java、Python、C++、Go、Rust、JavaScript/TypeScript、C#、Swift、
  Dart、Scala 和 Kotlin 共用的可移植编码格式。请确保所有对等实现的类型 ID、名称、
  Schema 和兼容性设置保持一致。

## 用户类型 ID

注册用户类型（struct/ext/enum/union）时，内部类型 ID 以 8 位类型种类写入，用户类型 ID
则单独以无符号 varint32 写入。两者之间不存在位移或打包操作，`user_type_id` 的取值范围为
`0~0xFFFFFFFE`。

**示例：**

| 用户 ID | 类型              | 内部 ID | 编码后的用户 ID | 十进制值 |
| ------- | ----------------- | ------- | --------------- | -------- |
| 0       | STRUCT            | 27      | 0               | 0        |
| 0       | ENUM              | 25      | 0               | 0        |
| 1       | STRUCT            | 27      | 1               | 1        |
| 1       | COMPATIBLE_STRUCT | 28      | 1               | 1        |
| 2       | NAMED_STRUCT      | 29      | 2               | 2        |

读取类型 ID 时：

- 从类型 ID 字段读取内部类型 ID。
- 如果内部类型属于用户注册的类型种类，则以 varuint32 读取 `user_type_id`。

## 类型映射

第一列给出 Fory Schema 表达式或规范编码标签。`fixed int32` 和 `tagged int64`
等标量编码行并不是 FDL 类型名称；在 FDL 中，它们表示为编码修饰符与语义整数类型的组合。

| Fory Schema / 编码标签             | Fory 类型 ID | Java                                      | Python                            | JavaScript/TypeScript                 | C++                                                 | Go                                             | Rust                              | C#                                 | Swift                    | Dart                    | Scala                     | Kotlin                 |
| ---------------------------------- | ------------ | ----------------------------------------- | --------------------------------- | ------------------------------------- | --------------------------------------------------- | ---------------------------------------------- | --------------------------------- | ---------------------------------- | ------------------------ | ----------------------- | ------------------------- | ---------------------- |
| bool                               | 1            | bool/Boolean                              | bool                              | Boolean                               | bool                                                | bool                                           | bool                              | bool                               | Bool                     | bool                    | Boolean                   | Boolean                |
| int8                               | 2            | byte/Byte                                 | int/pyfory.Int8                   | Type.int8()                           | int8_t                                              | int8                                           | i8                                | sbyte                              | Int8                     | int + `Int8Type`        | Byte                      | Byte                   |
| int16                              | 3            | short/Short                               | int/pyfory.Int16                  | Type.int16()                          | int16_t                                             | int16                                          | i16                               | short                              | Int16                    | int + `Int16Type`       | Short                     | Short                  |
| fixed int32                        | 4            | int/Integer                               | int/pyfory.FixedInt32             | `Type.int32({ encoding: "fixed" })`   | int32_t                                             | int32                                          | i32                               | int + `S.Fixed<S.Int32>`           | Int32 + `.fixed`         | int + 定长元数据        | Int + 定长元数据          | `@Fixed Int`           |
| int32                              | 5            | int/Integer                               | int/pyfory.Int32                  | Type.int32()                          | int32_t                                             | int32                                          | i32                               | int                                | Int32                    | int + `Int32Type`       | Int                       | Int                    |
| fixed int64                        | 6            | long/Long                                 | int/pyfory.FixedInt64             | `Type.int64({ encoding: "fixed" })`   | int64_t                                             | int64                                          | i64                               | long + `S.Fixed<S.Int64>`          | Int64 + `.fixed`         | Int64 + 定长元数据      | Long + 定长元数据         | `@Fixed Long`          |
| int64                              | 7            | long/Long                                 | int/pyfory.Int64                  | Type.int64()                          | int64_t                                             | int64                                          | i64                               | long                               | Int64                    | int / Int64             | Long                      | Long                   |
| tagged int64                       | 8            | long/Long                                 | int/pyfory.TaggedInt64            | `Type.int64({ encoding: "tagged" })`  | int64_t                                             | int64                                          | i64                               | long + `S.Tagged<S.Int64>`         | Int64 + `.tagged`        | Int64 + 标签元数据      | Long + 标签元数据         | `@Tagged Long`         |
| uint8                              | 9            | short/Short                               | int/pyfory.UInt8                  | Type.uint8()                          | uint8_t                                             | uint8                                          | u8                                | byte                               | UInt8                    | int + `Uint8Type`       | Int + 无符号元数据        | UByte                  |
| uint16                             | 10           | int/Integer                               | int/pyfory.UInt16                 | Type.uint16()                         | uint16_t                                            | uint16                                         | u16                               | ushort                             | UInt16                   | int + `Uint16Type`      | Int + 无符号元数据        | UShort                 |
| fixed uint32                       | 11           | long/Long                                 | int/pyfory.FixedUInt32            | `Type.uint32({ encoding: "fixed" })`  | uint32_t                                            | uint32                                         | u32                               | uint + `S.Fixed<S.UInt32>`         | UInt32 + `.fixed`        | int + uint32 定长元数据 | Long + 定长无符号元数据   | `@Fixed UInt`          |
| uint32                             | 12           | long/Long                                 | int/pyfory.UInt32                 | Type.uint32()                         | uint32_t                                            | uint32                                         | u32                               | uint                               | UInt32                   | int + `Uint32Type`      | Long + 无符号元数据       | UInt                   |
| fixed uint64                       | 13           | long/Long                                 | int/pyfory.FixedUInt64            | `Type.uint64({ encoding: "fixed" })`  | uint64_t                                            | uint64                                         | u64                               | ulong + `S.Fixed<S.UInt64>`        | UInt64 + `.fixed`        | Uint64 + 定长元数据     | Long + 定长无符号元数据   | `@Fixed ULong`         |
| uint64                             | 14           | long/Long                                 | int/pyfory.UInt64                 | Type.uint64()                         | uint64_t                                            | uint64                                         | u64                               | ulong                              | UInt64                   | Uint64                  | Long + 无符号元数据       | ULong                  |
| tagged uint64                      | 15           | long/Long                                 | int/pyfory.TaggedUInt64           | `Type.uint64({ encoding: "tagged" })` | uint64_t                                            | uint64                                         | u64                               | ulong + `S.Tagged<S.UInt64>`       | UInt64 + `.tagged`       | Uint64 + 标签元数据     | Long + 带标签无符号元数据 | `@Tagged ULong`        |
| float8                             | 16           | /                                         | /                                 | /                                     | /                                                   | /                                              | /                                 | /                                  | /                        | /                       | /                         | /                      |
| float16                            | 17           | Float16                                   | 原生 float / pyfory.Float16 注解  | `number`                              | `fory::float16_t`                                   | `float16.Float16`                              | `Float16`                         | Half                               | Float16                  | double + `Float16Type`  | Float16                   | Float16                |
| bfloat16                           | 18           | BFloat16                                  | 原生 float / pyfory.BFloat16 注解 | `number`                              | `fory::bfloat16_t`                                  | `bfloat16.BFloat16`                            | `BFloat16`                        | BFloat16                           | BFloat16                 | double + `Bfloat16Type` | BFloat16                  | BFloat16               |
| float32                            | 19           | float/Float                               | float/pyfory.Float32              | Type.float32()                        | float                                               | float32                                        | f32                               | float                              | Float                    | Float32                 | Float                     | Float                  |
| float64                            | 20           | double/Double                             | float/pyfory.Float64              | Type.float64()                        | double                                              | float64                                        | f64                               | double                             | Double                   | double                  | Double                    | Double                 |
| string                             | 21           | String                                    | str                               | String                                | string                                              | string                                         | String/str                        | string                             | String                   | String                  | String                    | String                 |
| list                               | 22           | List/Collection                           | list/tuple                        | array                                 | vector                                              | slice                                          | Vec                               | `List<T>`                          | `[T]`                    | `List<T>`               | `List[T]`                 | `List<T>`              |
| set                                | 23           | Set                                       | set                               | /                                     | set                                                 | fory.Set                                       | Set                               | `HashSet<T>`                       | `Set<T>`                 | `Set<T>`                | `Set[T]`                  | `Set<T>`               |
| map                                | 24           | Map                                       | dict                              | Map                                   | unordered_map                                       | map                                            | HashMap                           | `Dictionary<K,V>`                  | `[K: V]`                 | `Map<K, V>`             | `Map[K, V]`               | `Map<K, V>`            |
| enum                               | 25           | Enum 子类                                 | enum 子类                         | /                                     | enum                                                | /                                              | enum                              | `[ForyEnum]` enum                  | enum                     | enum                    | Scala 3 enum              | enum class             |
| named_enum                         | 26           | Enum 子类                                 | enum 子类                         | /                                     | enum                                                | /                                              | enum                              | `[ForyEnum]` enum                  | enum                     | enum                    | Scala 3 enum              | enum class             |
| struct                             | 27           | pojo/record                               | data class                        | object                                | struct/class                                        | struct                                         | struct                            | `[ForyStruct]` class/struct        | @ForyStruct struct/class | @ForyStruct class       | case class/class          | data class/class       |
| compatible_struct                  | 28           | pojo/record                               | data class                        | object                                | struct/class                                        | struct                                         | struct                            | `[ForyStruct]` class/struct        | @ForyStruct struct/class | @ForyStruct class       | case class/class          | data class/class       |
| named_struct                       | 29           | pojo/record                               | data class                        | object                                | struct/class                                        | struct                                         | struct                            | `[ForyStruct]` class/struct        | @ForyStruct struct/class | @ForyStruct class       | case class/class          | data class/class       |
| named_compatible_struct            | 30           | pojo/record                               | data class                        | object                                | struct/class                                        | struct                                         | struct                            | `[ForyStruct]` class/struct        | @ForyStruct struct/class | @ForyStruct class       | case class/class          | data class/class       |
| ext                                | 31           | pojo/record                               | data class                        | object                                | struct/class                                        | struct                                         | struct                            | `[ForyStruct]` class/struct        | @ForyStruct struct/class | @ForyStruct class       | case class/class          | data class/class       |
| named_ext                          | 32           | pojo/record                               | data class                        | object                                | struct/class                                        | struct                                         | struct                            | `[ForyStruct]` class/struct        | @ForyStruct struct/class | @ForyStruct class       | case class/class          | data class/class       |
| union                              | 33           | Union                                     | typing.Union                      | /                                     | `std::variant<Ts...>`                               | /                                              | tagged union enum                 | `[ForyUnion]` ADT record           | tagged enum              | @ForyUnion class        | ADT enum                  | sealed class           |
| none                               | 36           | null                                      | None                              | null                                  | `std::monostate`                                    | nil                                            | `()`                              | null                               | nil                      | null                    | null                      | null                   |
| duration                           | 37           | Duration                                  | timedelta                         | Number                                | fory::Duration                                      | Duration                                       | Duration                          | TimeSpan                           | Duration                 | Duration                | java.time.Duration        | kotlin.time.Duration   |
| timestamp                          | 38           | Instant                                   | datetime                          | Number                                | fory::Timestamp                                     | Time                                           | Timestamp                         | DateTime/DateTimeOffset            | Date                     | Timestamp               | java.time.Instant         | java.time.Instant      |
| date                               | 39           | LocalDate                                 | datetime.date                     | Date                                  | fory::Date                                          | fory.Date                                      | Date                              | DateOnly                           | LocalDate                | LocalDate               | java.time.LocalDate       | java.time.LocalDate    |
| decimal                            | 40           | BigDecimal                                | Decimal                           | Decimal                               | fory::serialization::Decimal                        | fory.Decimal                                   | fory::Decimal                     | decimal                            | Decimal                  | Decimal                 | java.math.BigDecimal      | java.math.BigDecimal   |
| binary                             | 41           | byte[]                                    | bytes                             | /                                     | `uint8_t[n]/vector<T>`                              | `[n]uint8/[]T`                                 | `Vec<u8>`                         | byte[]                             | Data                     | Uint8List               | Array[Byte]               | ByteArray              |
| `array<bool>` (bool_array)         | 43           | bool[]                                    | BoolArray / ndarray(np.bool\_)    | BoolArray / Type.boolArray()          | `bool[n]`                                           | `[n]bool/[]T`                                  | `Vec<bool>`                       | bool[]                             | [Bool] + @ArrayField     | BoolList                | Array[Boolean]            | BooleanArray           |
| `array<int8>` (int8_array)         | 44           | `@Int8Type byte[]`                        | Int8Array / ndarray(int8)         | Type.int8Array()                      | `int8_t[n]/vector<T>`                               | `[n]int8/[]T`                                  | `Vec<i8>`                         | sbyte[]                            | [Int8] + @ArrayField     | Int8List                | Array[Byte] + 元数据      | ByteArray + @ArrayType |
| `array<int16>` (int16_array)       | 45           | short[]                                   | Int16Array / ndarray(int16)       | Type.int16Array()                     | `int16_t[n]/vector<T>`                              | `[n]int16/[]T`                                 | `Vec<i16>`                        | short[]                            | [Int16] + @ArrayField    | Int16List               | Array[Short]              | ShortArray             |
| `array<int32>` (int32_array)       | 46           | int[]                                     | Int32Array / ndarray(int32)       | Type.int32Array()                     | `int32_t[n]/vector<T>`                              | `[n]int32/[]T`                                 | `Vec<i32>`                        | int[]                              | [Int32] + @ArrayField    | Int32List               | Array[Int]                | IntArray               |
| `array<int64>` (int64_array)       | 47           | long[]                                    | Int64Array / ndarray(int64)       | Type.int64Array()                     | `int64_t[n]/vector<T>`                              | `[n]int64/[]T`                                 | `Vec<i64>`                        | long[]                             | [Int64] + @ArrayField    | Int64List               | Array[Long]               | LongArray              |
| `array<uint8>` (uint8_array)       | 48           | `@UInt8Type byte[]`                       | UInt8Array / ndarray(uint8)       | Type.uint8Array()                     | `uint8_t[n]/vector<T>`                              | `[n]uint8/[]T`                                 | `Vec<u8>`                         | byte[]                             | [UInt8] + @ArrayField    | Uint8List               | Array[Byte] + 元数据      | UByteArray             |
| `array<uint16>` (uint16_array)     | 49           | `@UInt16Type short[]`                     | UInt16Array / ndarray(uint16)     | Type.uint16Array()                    | `uint16_t[n]/vector<T>`                             | `[n]uint16/[]T`                                | `Vec<u16>`                        | ushort[]                           | [UInt16] + @ArrayField   | Uint16List              | Array[Short] + 元数据     | UShortArray            |
| `array<uint32>` (uint32_array)     | 50           | `@UInt32Type int[]`                       | UInt32Array / ndarray(uint32)     | Type.uint32Array()                    | `uint32_t[n]/vector<T>`                             | `[n]uint32/[]T`                                | `Vec<u32>`                        | uint[]                             | [UInt32] + @ArrayField   | Uint32List              | Array[Int] + 元数据       | UIntArray              |
| `array<uint64>` (uint64_array)     | 51           | `@UInt64Type long[]`                      | UInt64Array / ndarray(uint64)     | Type.uint64Array()                    | `uint64_t[n]/vector<T>`                             | `[n]uint64/[]T`                                | `Vec<u64>`                        | ulong[]                            | [UInt64] + @ArrayField   | Uint64List              | Array[Long] + 元数据      | ULongArray             |
| `array<float8>` (float8_array)     | 52           | /                                         | /                                 | /                                     | /                                                   | /                                              | /                                 | /                                  | /                        | /                       | /                         | /                      |
| `array<float16>` (float16_array)   | 53           | `Float16Array` / `@Float16Type short[]`   | Float16Array / ndarray(float16)   | Float16Array / Type.float16Array()    | `fory::float16_t[n]/std::vector<fory::float16_t>`   | `[N]float16.Float16` / `[]float16.Float16`     | `Vec<Float16>` / `[Float16; N]`   | Half[] / `S.Array<S.Float16>`      | [Float16] + @ArrayField  | Float16List             | Array[Short] + 元数据     | Float16Array           |
| `array<bfloat16>` (bfloat16_array) | 54           | `BFloat16Array` / `@BFloat16Type short[]` | BFloat16Array / ndarray(bfloat16) | BFloat16Array / Type.bfloat16Array()  | `fory::bfloat16_t[n]/std::vector<fory::bfloat16_t>` | `[N]bfloat16.BFloat16` / `[]bfloat16.BFloat16` | `Vec<BFloat16>` / `[BFloat16; N]` | BFloat16[] / `S.Array<S.BFloat16>` | [BFloat16] + @ArrayField | Bfloat16List            | Array[Short] + 元数据     | BFloat16Array          |
| `array<float32>` (float32_array)   | 55           | float[]                                   | Float32Array / ndarray(float32)   | Type.float32Array()                   | `float[n]/vector<T>`                                | `[n]float32/[]T`                               | `Vec<f32>`                        | float[]                            | [Float] + @ArrayField    | Float32List             | Array[Float]              | FloatArray             |
| `array<float64>` (float64_array)   | 56           | double[]                                  | Float64Array / ndarray(float64)   | Type.float64Array()                   | `double[n]/vector<T>`                               | `[n]float64/[]T`                               | `Vec<f64>`                        | double[]                           | [Double] + @ArrayField   | Float64List             | Array[Double]             | DoubleArray            |

说明：

- C# 外部类型序列化通过本地的 `ForyStruct(Target = typeof(...))` 或
  `ForyEnum(Target = typeof(...))` 序列化器声明映射第三方 class/struct 或 enum。
  目标类型仍采用上表所示的 C# 映射；声明的归属方不会造成编码格式上的差异。
- Python 的 `pyfory.Float16` 和 `pyfory.BFloat16` 是预留的注解标记；标量值反序列化为 Python 原生 `float`。
- Python 的 `BoolArray`、`Int8Array`、`Int16Array`、`Int32Array`、`Int64Array`、`UInt8Array`、`UInt16Array`、`UInt32Array`、`UInt64Array`、`Float16Array`、`BFloat16Array`、`Float32Array` 和 `Float64Array` 是公开的稠密数组包装器，具有类似列表的序列行为。
- JavaScript 的 `BoolArray`、回退实现 `Float16Array` 和 `BFloat16Array` 是基于 `Uint8Array` 或 `Uint16Array` 的公开稠密数组包装器。`float16` 和 `bfloat16` 标量值使用 `number`。原生支持 `Float16Array` 的 JavaScript 环境可以为 `array<float16>` 返回该原生载体。
- Java 中不带注解的 `byte[]` 映射到 `binary`。数值字节数组使用类型使用位置注解：
  `@Int8Type byte[]` 用于 `array<int8>`，`@UInt8Type byte[]` 用于 `array<uint8>`。
- Dart 使用 `double` 加 `Float16Type` 或 `Bfloat16Type` 元数据表示 `float16` 和 `bfloat16`
  标量，使用 `BoolList` 表示 `array<bool>`，使用类型化数据列表表示整数、float32 和 float64
  数组，并使用 `Float16List` / `Bfloat16List` 表示 `array<float16>` / `array<bfloat16>`。
  普通 Dart `List<bool>` 映射到 `list<bool>`，除非字段使用
  `@ArrayField(element: BoolType())`，或使用 `@ForyField(type: ArrayType(element: BoolType()))`
  并以 `BoolList` 作为载体。
- 在 xlang 模式下，`Float16[]` 和 `BFloat16[]` 仍是对象数组，并使用 `list` 编码类型序列化。
- `ARRAY (42)` 预留给未来专用的多维数组编码，不属于当前 xlang 类型映射范围。
- 当前 xlang 对一维原始类型数组使用 `*_ARRAY`，对多维数组使用嵌套的 `list`。
- C++ xlang 的 `date`、`timestamp` 和 `duration` 分别映射到 `fory::Date`、
  `fory::Timestamp` 和 `fory::Duration`，用于生成的 Schema 和动态 `std::any` 值。
  `std::chrono` 时间类型只能作为显式的 C++ 序列化和反序列化目标。
- Kotlin KSP xlang 将 `UByte`、`UShort`、`UInt` 和 `ULong` 分别映射到 `uint8`、
  `uint16`、`uint32` 和 `uint64`。Kotlin 原始类型数组和无符号数组载体映射为稠密数组。
  `ByteArray` 默认映射到 `binary`；当其映射到 `array<int8>` 时，类型使用位置标有 Fory
  `ArrayType`。`array<float16>` 和 `array<bfloat16>` 使用 Java 核心的 `Float16Array`
  和 `BFloat16Array`。
- Kotlin xlang 的 `duration` 使用 `kotlin.time.Duration`。xlang duration 载荷无法表示无穷值，
  遇到此类值时必须抛出序列化错误。
- `list<T>` 与 `array<T>` 始终是不同的 Schema 类型。仅在兼容 Schema 的 struct/class
  字段匹配中，顶层直接 `list<T>` 字段可以读取为顶层直接 `array<T>` 字段，顶层直接
  `array<T>` 字段也可以读取为顶层直接 `list<T>` 字段，前提是 `T` 属于稠密 bool/数值数组的
  元素域。具有相同有符号性和位宽的整数列表元素编码，与相应的
  稠密数组元素域匹配。该规则不适用于嵌套 collection、map、array、union 或泛型位置。
  对等端的 `list<T?>` 元素 Schema 对本地 `array<T>` 字段仍属于兼容的 Schema 匹配；如果实际
  载荷包含 null 元素，稠密数组读取器会抛出兼容读取错误，而不会强制转换该值。列表元素的引用
  跟踪帧与可空元素 Schema 相互独立；如果本地匹配字段为 `array<T>`，且 Fory 实现无法在不使用泛型
  或引用路径的情况下将其物化，则可以在兼容字段分类阶段拒绝引用跟踪的列表元素帧。
- `binary` 与 `array<uint8>` 始终是不同的 Schema 类型。仅在兼容 Schema 的 struct/class
  字段匹配中，顶层直接 `binary` 字段可以读取为顶层直接 `array<uint8>` 字段，反向读取也会得到
  相同的字节序列。该规则不适用于嵌套 collection、map、array、union 或泛型位置，也不包含
  `array<int8>`。
- 上表始终是规范的 xlang Schema 映射。在兼容 Schema 的 struct/class 字段匹配期间，兼容读取器
  可以应用 `xlang_serialization_spec.md` 定义的标量字段适配规则。这些规则不会改变 TypeDef 元数据、
  动态根类型映射、同 Schema 模式或嵌套 collection/map/array/union/泛型位置。

### Scala IDL 映射

Scala Schema IDL 目标仅生成 Scala 3 源代码。`fory-scala` 构件仍同时为 Scala 2.13 和
Scala 3 交叉构建。

| Fory Schema 类型                      | 生成的 Scala 载体                                                       |
| ------------------------------------- | ----------------------------------------------------------------------- |
| `optional T`                          | `Option[T]`                                                             |
| `bool`                                | `Boolean`                                                               |
| `int8`, `int16`, `int32`, `int64`     | `Byte`, `Short`, `Int`, `Long`                                          |
| `uint8`, `uint16`, `uint32`, `uint64` | `Int`、`Int`、`Long`、`Long`，并附带 Fory 无符号类型元数据              |
| `float16`, `bfloat16`                 | JVM `Float16` 和 `BFloat16` 载体                                        |
| `float32`, `float64`                  | `Float`, `Double`                                                       |
| `string`                              | `String`                                                                |
| `binary`                              | `Array[Byte]`                                                           |
| `list<T>`, `set<T>`, `map<K, V>`      | `List[T]`, `Set[T]`, `Map[K, V]`                                        |
| `array<bool>`                         | `Array[Boolean]`                                                        |
| `array<int8>`, `array<uint8>`         | 带有符号/无符号描述符元数据的 `Array[Byte]`                             |
| `array<int16>`, `array<uint16>`       | 带有符号/无符号描述符元数据的 `Array[Short]`                            |
| `array<int32>`, `array<uint32>`       | 带有符号/无符号描述符元数据的 `Array[Int]`                              |
| `array<int64>`, `array<uint64>`       | 带有符号/无符号描述符元数据的 `Array[Long]`                             |
| `array<float16>`, `array<bfloat16>`   | 带低精度描述符元数据的 `Array[Short]`                                   |
| `array<float32>`, `array<float64>`    | `Array[Float]`, `Array[Double]`                                         |
| `date`, `timestamp`, `duration`       | `java.time.LocalDate`, `java.time.Instant`, `java.time.Duration`        |
| `decimal`                             | `java.math.BigDecimal`                                                  |
| `message`                             | 默认生成 Scala 3 `case class`；仅 message/union 构造循环使用普通 class  |
| `enum`                                | Scala 3 `enum`；稳定的 Fory enum ID 通过 case 级 `@ForyEnumId` 注解指定 |
| `union`                               | Scala 3 ADT `enum derives ForySerializer`                               |
| `any`                                 | `AnyRef`                                                                |

生成的 Scala 描述符元数据由 Scala 3 宏根据 Scala 编译期类型派生，其中包括嵌套泛型、
`Option`、数组、标量编码注解、可空性和 `@Ref`。Java 反射并不是生成 Scala TypeDef 元数据的
事实来源。Scala `@Ref` 元数据由共享的 `org.apache.fory.annotation.Ref` 注解表示；`@Ref`
是 JVM 引用跟踪元数据的归属方。

## 类型信息

由于各语言的类型系统存在差异，这些类型无法在语言之间一一映射。

如果一种宿主语言类型对应多种 Fory 标量编码，例如 Java `long` 可以表示定长、varint 或带标签的
`int64`，那么当默认值并非所需 Schema 时，用户必须提供编码元数据。

## 类型注解

如果某个类型是另一个类的字段，用户可以为该类型的字段或整个类型提供元信息提示。
其他语言也可以提供此类信息：

- Java：使用注解。
- C++：使用宏和模板。
- Go：使用 struct tag。
- Python：使用类型提示。
- Rust：使用宏。

示例如下：

- Java:

  ```java
  class Foo {
    private @Int32Type int f1;
    private List<@Int32Type Integer> f2;
  }
  ```

- Python:

  ```python
  class Foo:
      f1: pyfory.Int32
      f2: List[pyfory.Int32]
  ```
