---
title: 多语言序列化的类型映射
sidebar_position: 3
id: xlang_type_mapping
---

注意：

- 有关类型定义，请参阅 [Spec 中的类型系统](https://fury.apache.org/docs/specification/fury_xlang_serialization_spec#type-systems)
- `int16_t[n]/vector<T>` 表示 `int16_t[n]/vector<int16_t>`.
- 跨语言序列化并不稳定，请勿在生产环境中使用。

## Type Mapping

| Fury 类型          | Fury 类型 ID | Java            | Python               | Javascript      | C++                            | Golang           | Rust             |
|--------------------|--------------|-----------------|----------------------|-----------------|--------------------------------|------------------|------------------|
| bool               | 1            | bool/Boolean    | bool                 | Boolean         | bool                           | bool             | bool             |
| int8               | 2            | byte/Byte       | int/pyfury.Int8      | Type.int8()     | int8_t                         | int8             | i8               |
| int16              | 3            | short/Short     | int/pyfury.Int16     | Type.int16()    | int16_t                        | int16            | i6               |
| int32              | 4            | int/Integer     | int/pyfury.Int32     | Type.int32()    | int32_t                        | int32            | i32              |
| var_int32          | 5            | int/Integer     | int/pyfury.VarInt32  | Type.varint32() | fury::varint32_t               | fury.varint32    | fury::varint32   |
| int64              | 6            | long/Long       | int/pyfury.Int64     | Type.int64()    | int64_t                        | int64            | i64              |
| var_int64          | 7            | long/Long       | int/pyfury.VarInt64  | Type.varint64() | fury::varint64_t               | fury.varint64    | fury::varint64   |
| sli_int64          | 8            | long/Long       | int/pyfury.SliInt64  | Type.sliint64() | fury::sliint64_t               | fury.sliint64    | fury::sliint64   |
| float16            | 9            | float/Float     | float/pyfury.Float16 | Type.float16()  | fury::float16_t                | fury.float16     | fury::f16        |
| float32            | 10           | float/Float     | float/pyfury.Float32 | Type.float32()  | float                          | float32          | f32              |
| float64            | 11           | double/Double   | float/pyfury.Float64 | Type.float64()  | double                         | float64          | f64              |
| string             | 12           | String          | str                  | String          | string                         | string           | String/str       |
| enum               | 13           | Enum subclasses | enum subclasses      | /               | enum                           | /                | enum             |
| list               | 14           | List/Collection | list/tuple           | array           | vector                         | slice            | Vec              |
| set                | 15           | Set             | set                  | /               | set                            | fury.Set         | Set              |
| map                | 16           | Map             | dict                 | Map             | unordered_map                  | map              | HashMap          |
| duration           | 17           | Duration        | timedelta            | Number          | duration                       | Duration         | Duration         |
| timestamp          | 18           | Instant         | datetime             | Number          | std::chrono::nanoseconds       | Time             | DateTime         |
| decimal            | 19           | BigDecimal      | Decimal              | bigint          | /                              | /                | /                |
| binary             | 20           | byte[]          | bytes                | /               | `uint8_t[n]/vector<T>`         | `[n]uint8/[]T`   | `Vec<uint8_t>`   |
| array              | 21           | array           | np.ndarray           | /               | /                              | array/slice      | Vec              |
| bool_array         | 22           | bool[]          | ndarray(np.bool_)    | /               | `bool[n]`                      | `[n]bool/[]T`    | `Vec<bool>`      |
| int8_array         | 23           | byte[]          | ndarray(int8)        | /               | `int8_t[n]/vector<T>`          | `[n]int8/[]T`    | `Vec<i18>`       |
| int16_array        | 24           | short[]         | ndarray(int16)       | /               | `int16_t[n]/vector<T>`         | `[n]int16/[]T`   | `Vec<i16>`       |
| int32_array        | 25           | int[]           | ndarray(int32)       | /               | `int32_t[n]/vector<T>`         | `[n]int32/[]T`   | `Vec<i32>`       |
| int64_array        | 26           | long[]          | ndarray(int64)       | /               | `int64_t[n]/vector<T>`         | `[n]int64/[]T`   | `Vec<i64>`       |
| float16_array      | 27           | float[]         | ndarray(float16)     | /               | `fury::float16_t[n]/vector<T>` | `[n]float16/[]T` | `Vec<fury::f16>` |
| float32_array      | 28           | float[]         | ndarray(float32)     | /               | `float[n]/vector<T>`           | `[n]float32/[]T` | `Vec<f32>`       |
| float64_array      | 29           | double[]        | ndarray(float64)     | /               | `double[n]/vector<T>`          | `[n]float64/[]T` | `Vec<f64>`       |
| tensor             | 30           | /               | /                    | /               | /                              | /                | /                |
| sparse tensor      | 31           | /               | /                    | /               | /                              | /                | /                |
| arrow record batch | 32           | /               | /                    | /               | /                              | /                | /                |
| arrow table        | 33           | /               | /                    | /               | /                              | /                | /                |

### 类型信息（目前尚未实现）

由于语言类型系统之间的差异，这些类型无法在语言之间一对一地映射。

如果用户看到一种语言中的一种类型对应 Apache Fury 类型系统中的多种类型。

例如：java 中的 `long` 类型对应 `int64/varint64/sliint64` 类型。类型为 `int64/varint64/sliint64` 这意味着该语言缺少某些类型，用户在使用 Fury 时必须提供额外的类型信息。

### 类型注解

如果类型是另一个类的字段，用户可以为类型的字段或整个类型提供 meta hints。
这些信息也可以用其他语言提供：

- java：使用注解；
- cpp：使用宏和模板；
- golang：使用 struct tag；
- python: 使用 typehint；
- rust：使用宏。

下面是一个例子：

- Java:

    ```java
    class Foo {
      @Int32Type(varint = true)
      int f1;
      List<@Int32Type(varint = true) Integer> f2;
    }
    ```

- Python:

    ```python
    class Foo:
        f1: Int32Type(varint=True)
        f2: List[Int32Type(varint=True)]
    ```

## 类型包装器

如果类型不是类的字段，用户必须用 Fury 类型来包装该类型，以传递额外的类型信息。

例如：假设 Apache Fury Java 提供了 `VarInt64` 类型，当用户调用 `fury.serialize(long_value)` 时，需要像下面这样调用
调用 `fury.serialize(new VarInt64(long_value))`。
