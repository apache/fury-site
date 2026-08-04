---
title: Schema 元数据
sidebar_position: 7
id: schema-metadata
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

本页介绍如何为 Java 序列化配置字段级元数据。

## 概述

Apache Fory™ 通过注解提供字段级配置：

- **`@ForyField`**：配置字段元数据（id、dynamic）
- **`@Nullable`**：将字段类型或嵌套类型位置标记为可空
- **`@Ref`**：启用字段或嵌套元素的引用跟踪
- **`@Ignore`**：从序列化中排除字段
- **整数类型注解**：控制整数编码（varint、定长、tagged、无符号）

这些注解可以实现：

- **Tag ID**：分配紧凑的数字 ID，降低兼容模式下结构体字段元数据的体积开销
- **可空性**：控制字段是否可以为 null
- **引用跟踪**：为共享对象启用引用跟踪
- **字段跳过**：从序列化中排除字段
- **编码控制**：指定整数编码方式
- **多态控制**：控制结构体字段是否写入类型信息

## 基本语法

在字段上使用注解：

```java
import org.apache.fory.annotation.ForyField;
import org.apache.fory.annotation.Nullable;

public class Person {
    @ForyField(id = 0)
    private String name;

    @ForyField(id = 1)
    private int age;

    @Nullable
    @ForyField(id = 2)
    private String nickname;
}
```

## `@ForyField` 注解

使用 `@ForyField` 配置字段级元数据：

```java
public class User {
    @ForyField(id = 0)
    private long id;

    @ForyField(id = 1)
    private String name;

    @Nullable
    @ForyField(id = 2)
    private String email;

    @ForyField(id = 3)
    private List<@Ref User> friends;

    @ForyField(id = 4, dynamic = ForyField.Dynamic.TRUE)
    private Object data;
}
```

### 参数

| 参数      | 类型      | 默认值 | 说明                         |
| --------- | --------- | ------ | ---------------------------- |
| `id`      | `int`     | `-1`   | 非负字段 tag ID，或不设置 ID |
| `dynamic` | `Dynamic` | `AUTO` | 控制结构体字段的多态行为     |

在字段类型或嵌套类型位置使用 `@Nullable` 表示可空 Schema 元数据，使用 `@Ref` 表示引用跟踪。`@ForyField` 本身不包含这两项设置。

## 字段 ID（`id`）

为字段分配数字 ID，以尽量降低兼容模式下结构体字段元数据的体积开销：

```java
public class User {
    @ForyField(id = 0)
    private long id;

    @ForyField(id = 1)
    private String name;

    @ForyField(id = 2)
    private int age;
}
```

**优点**：

- 序列化体积更小（元数据中的数字 ID 相比字段名更紧凑）
- 降低结构体字段元数据开销
- 允许在不破坏二进制兼容性的情况下重命名字段

**建议**：兼容模式建议配置字段 ID，以降低序列化成本。

**注意事项**：

- ID 在类中必须唯一
- 配置的 ID 必须 >= 0
- 如果未指定，注解默认值 `-1` 会被忽略，元数据改用字段名（开销更大）

**不使用字段 ID**（元数据使用字段名）：

```java
public class User {
    private long id;
    private String name;
}
```

## 可空字段（`@Nullable`）

字段使用 `@Nullable` 后可以为 `null`：

```java
public class Record {
    // Nullable string field
    @Nullable
    @ForyField(id = 0)
    private String optionalName;

    // Nullable Integer field (boxed type)
    @Nullable
    @ForyField(id = 1)
    private Integer optionalCount;

    // Non-nullable field (default)
    @ForyField(id = 2)
    private String requiredName;
}
```

**注意事项**：

- 跨语言字段默认不可空。
- 字段不可空时，Fory 会跳过 null 标志的写入。
- 可为 null 的装箱类型（`Integer`、`Long` 等）应使用 `@Nullable`。

## 引用跟踪（`@Ref`）

可能共享或形成循环的字段应启用引用跟踪：

```java
public class RefOuter {
    // Both fields may point to the same inner object
    @Nullable
    @ForyField(id = 0)
    @Ref
    private RefInner inner1;

    @Nullable
    @ForyField(id = 1)
    @Ref
    private RefInner inner2;
}

public class CircularRef {
    @ForyField(id = 0)
    private String name;

    // Self-referencing field for circular references
    @Nullable
    @ForyField(id = 1)
    @Ref
    private CircularRef selfRef;
}
```

**使用场景**：

- 字段可能参与循环或被共享
- 多个字段引用同一对象

**注意事项**：

- 没有 `@Ref` 的字段不使用字段包装层的引用跟踪
- 值不会共享或形成循环时避免使用 `@Ref`，这样 Fory 可跳过引用标志
- 只有启用全局引用跟踪时，引用跟踪才会生效

## Dynamic（多态控制）

控制跨语言序列化中结构体字段的多态行为：

```java
public class Container {
    // AUTO: Interface/abstract types are dynamic, concrete types are not
    @ForyField(id = 0, dynamic = ForyField.Dynamic.AUTO)
    private Animal animal;  // Interface - type info written

    // FALSE: No type info written, uses declared type's serializer
    @ForyField(id = 1, dynamic = ForyField.Dynamic.FALSE)
    private Dog dog;  // Concrete - no type info

    // TRUE: Type info written to support subtypes
    @ForyField(id = 2, dynamic = ForyField.Dynamic.TRUE)
    private Object data;  // Force polymorphic
}
```

**选项**：

| 值      | 说明                                        |
| ------- | ------------------------------------------- |
| `AUTO`  | 自动检测：接口/抽象类型为动态，具体类型不是 |
| `FALSE` | 不写入类型信息，直接使用声明类型的序列化器  |
| `TRUE`  | 写入类型信息以支持子类型                    |

## 跳过字段

### 使用 `@Ignore`

从序列化中排除字段：

```java
import org.apache.fory.annotation.Ignore;

public class User {
    @ForyField(id = 0)
    private long id;

    @ForyField(id = 1)
    private String name;

    @Ignore
    private String password;  // Not serialized

    @Ignore
    private Object internalState;  // Not serialized
}
```

### 使用 `transient`

Java 的 `transient` 关键字也会排除字段：

```java
public class User {
    @ForyField(id = 0)
    private long id;

    private transient String password;  // Not serialized
    private transient Object cache;     // Not serialized
}
```

## 整数类型注解

Fory 提供用于控制整数编码的注解，以实现跨语言兼容。整数 Schema 注解是 Java 类型使用注解。请将其放在字段类型上、所有字段修饰符之后；同时存在 `@ForyField` 时与其配合使用。

### 有符号 32 位整数（`@Int32Type`）

```java
import org.apache.fory.annotation.Int32Type;
import org.apache.fory.config.Int32Encoding;

public class MyStruct {
    // Variable-length encoding (default) - compact for small values
    private @Int32Type(encoding = Int32Encoding.VARINT) int compactId;

    // Fixed 4-byte encoding - consistent size
    private @Int32Type(encoding = Int32Encoding.FIXED) int fixedId;
}
```

### 有符号 64 位整数（`@Int64Type`）

```java
import org.apache.fory.annotation.Int64Type;
import org.apache.fory.config.Int64Encoding;

public class MyStruct {
    // Variable-length encoding (default)
    private @Int64Type(encoding = Int64Encoding.VARINT) long compactId;

    // Fixed 8-byte encoding
    private @Int64Type(encoding = Int64Encoding.FIXED) long fixedTimestamp;

    // Tagged encoding (4 bytes for small values, 9 bytes otherwise)
    private @Int64Type(encoding = Int64Encoding.TAGGED) long taggedValue;
}
```

### 无符号整数

```java
import org.apache.fory.annotation.UInt8Type;
import org.apache.fory.annotation.UInt16Type;
import org.apache.fory.annotation.UInt32Type;
import org.apache.fory.annotation.UInt64Type;
import org.apache.fory.config.Int32Encoding;
import org.apache.fory.config.Int64Encoding;

public class UnsignedStruct {
    // Unsigned 8-bit [0, 255]
    private @UInt8Type int flags;

    // Unsigned 16-bit [0, 65535]
    private @UInt16Type int port;

    // Unsigned 32-bit with varint encoding (default)
    private @UInt32Type(encoding = Int32Encoding.VARINT) long compactCount;

    // Unsigned 32-bit with fixed encoding
    private @UInt32Type(encoding = Int32Encoding.FIXED) long fixedCount;

    // Unsigned 64-bit with various encodings
    private @UInt64Type(encoding = Int64Encoding.VARINT) long varintU64;

    private @UInt64Type(encoding = Int64Encoding.FIXED) long fixedU64;

    private @UInt64Type(encoding = Int64Encoding.TAGGED) long taggedU64;
}
```

### 编码汇总

| 注解                             | 类型 ID | 编码   | 大小        |
| -------------------------------- | ------- | ------ | ----------- |
| `@Int32Type(encoding = VARINT)`  | 5       | varint | 1-5 bytes   |
| `@Int32Type(encoding = FIXED)`   | 4       | fixed  | 4 bytes     |
| `@Int64Type(encoding = VARINT)`  | 7       | varint | 1-10 bytes  |
| `@Int64Type(encoding = FIXED)`   | 6       | fixed  | 8 bytes     |
| `@Int64Type(encoding = TAGGED)`  | 8       | tagged | 4 或 9 字节 |
| `@UInt8Type`                     | 9       | fixed  | 1 byte      |
| `@UInt16Type`                    | 10      | fixed  | 2 bytes     |
| `@UInt32Type(encoding = VARINT)` | 12      | varint | 1-5 bytes   |
| `@UInt32Type(encoding = FIXED)`  | 11      | fixed  | 4 bytes     |
| `@UInt64Type(encoding = VARINT)` | 14      | varint | 1-10 bytes  |
| `@UInt64Type(encoding = FIXED)`  | 13      | fixed  | 8 bytes     |
| `@UInt64Type(encoding = TAGGED)` | 15      | tagged | 4 或 9 字节 |

**使用时机**：

- `varint`：最适合通常较小的值（默认）
- `fixed`：最适合使用完整范围的值（例如时间戳、哈希）
- `tagged`：在体积与性能之间取得良好平衡
- 无符号类型：用于与 Rust、Go、C++ 的跨语言兼容

无符号 Java 标量载体是 `int`/`Integer`，用于 `@UInt8Type` 和 `@UInt16Type`；`long`/`Long` 则用于 `@UInt32Type` 和 `@UInt64Type`。将 `byte` 注解为 `@UInt8Type` 是无效的，因为 Java `byte` 无法表示无符号范围。

整数注解也可应用于嵌套泛型类型参数：

```java
import java.util.List;
import java.util.Map;
import org.apache.fory.annotation.Int64Type;
import org.apache.fory.annotation.UInt32Type;
import org.apache.fory.config.Int32Encoding;
import org.apache.fory.config.Int64Encoding;

public class NestedStruct {
    private Map<
            @UInt32Type(encoding = Int32Encoding.FIXED) Long,
            List<@Int64Type(encoding = Int64Encoding.TAGGED) Long>>
        values;
}
```

专用无符号列表载体默认使用 `list<T>` Schema，因此其元素注解会保留在列表元数据中。仅当字段需要使用 `@ArrayType` 指定稠密 `array<T>` Schema 时才添加该注解。

无符号原始类型数组可以使用标量元素注解表示稠密 `array<T>` 元数据：

```java
import org.apache.fory.annotation.UInt32Type;

public class IdBatch {
    private @UInt32Type int[] ids;
}
```

## 完整示例

```java
import org.apache.fory.Fory;
import org.apache.fory.annotation.ForyField;
import org.apache.fory.annotation.Ignore;
import org.apache.fory.annotation.Int64Type;
import org.apache.fory.annotation.Nullable;
import org.apache.fory.annotation.UInt64Type;
import org.apache.fory.config.Int64Encoding;

import java.util.List;
import java.util.Map;
import java.util.Set;

public class Document {
    // Fields with tag IDs (recommended for compatible mode)
    @ForyField(id = 0)
    private String title;

    @ForyField(id = 1)
    private int version;

    // Nullable field
    @Nullable
    @ForyField(id = 2)
    private String description;

    // Collection fields
    @ForyField(id = 3)
    private List<String> tags;

    @ForyField(id = 4)
    private Map<String, String> metadata;

    @ForyField(id = 5)
    private Set<String> categories;

    // Integer with different encodings
    @ForyField(id = 6)
    private @UInt64Type(encoding = Int64Encoding.VARINT) long viewCount;  // varint encoding

    @ForyField(id = 7)
    private @UInt64Type(encoding = Int64Encoding.FIXED) long fileSize;   // fixed encoding

    @ForyField(id = 8)
    private @UInt64Type(encoding = Int64Encoding.TAGGED) long checksum;   // tagged encoding

    // Reference-tracked field for shared/circular references
    @Nullable
    @ForyField(id = 9)
    @Ref
    private Document parent;

    // Ignored field (not serialized)
    private transient Object cache;

    // Getters and setters...
}

// Usage
public class Main {
    public static void main(String[] args) {
        Fory fory = Fory.builder()
            .withXlang(true)
            .withRefTracking(true)
            .build();

        fory.register(Document.class, 100);

        Document doc = new Document();
        doc.setTitle("My Document");
        doc.setVersion(1);
        doc.setDescription("A sample document");

        // Serialize
        byte[] data = fory.serialize(doc);

        // Deserialize
        Document decoded = (Document) fory.deserialize(data);
    }
}
```

## 跨语言兼容性

序列化将由其他语言（Python、Rust、C++、Go）读取的数据时，请使用字段 ID 和匹配的类型注解：

```java
public class CrossLangData {
    // Use field IDs for cross-language compatibility
    @ForyField(id = 0)
    private @Int32Type(encoding = Int32Encoding.VARINT) int intVar;

    @ForyField(id = 1)
    private @UInt64Type(encoding = Int64Encoding.FIXED) long longFixed;

    @ForyField(id = 2)
    private @UInt64Type(encoding = Int64Encoding.TAGGED) long longTagged;

    @Nullable
    @ForyField(id = 3)
    private String optionalValue;
}
```

## Schema 演进

兼容模式支持 Schema 演进。建议配置字段 ID 以降低序列化成本：

```java
// Version 1
public class DataV1 {
    @ForyField(id = 0)
    private long id;

    @ForyField(id = 1)
    private String name;
}

// Version 2: Added new field
public class DataV2 {
    @ForyField(id = 0)
    private long id;

    @ForyField(id = 1)
    private String name;

    @Nullable
    @ForyField(id = 2)
    private String email;  // New field
}
```

使用 V1 序列化的数据可以用 V2 反序列化（新字段为 `null`）。

也可以省略字段 ID（元数据将使用字段名，开销更大）：

```java
public class Data {
    private long id;
    private String name;
}
```

## 枚举元数据

跨语言模式使用数字 tag 序列化 Java 枚举，默认 tag 是声明序号。如果枚举需要不依赖声明顺序的稳定 ID，请用 `@ForyEnumId` 注解唯一一个 ID 来源，或使用显式 tag 值注解每个枚举常量。

```java
import org.apache.fory.annotation.ForyEnumId;

enum Status {
    Unknown(10),
    Running(20),
    Finished(30);

    private final int id;

    Status(int id) {
        this.id = id;
    }

    @ForyEnumId
    public int getId() {
        return id;
    }
}
```

Java 也支持用 `@ForyEnumId` 注解一个枚举实例字段，或直接注解每个枚举常量，例如 `@ForyEnumId(10) Unknown`。

`@ForyEnumId` 仅支持三种配置方式：

1. 注解一个枚举实例字段，并在其中存储数字 ID。
2. 注解一个无参数公共实例方法，例如 `getId()`。
3. 使用 `@ForyEnumId(10) Unknown` 这样的显式值直接注解每个枚举常量。

验证规则：

1. 每个枚举只能使用上述三种方式中的一种。
2. 字段和方法注解必须将 `value()` 保持为默认值 `-1`。
3. 一旦任何常量使用 `@ForyEnumId`，所有枚举常量都必须使用该注解。
4. 所有 ID 必须非负、唯一且能由 Java `int` 容纳。

查找行为：

1. 没有 `@ForyEnumId` 时，Fory 写入声明序号。
2. 使用 `@ForyEnumId` 时，Fory 改为写入配置的稳定数字 tag。
3. 小而稠密的 tag 在内部使用数组查找；较大且稀疏的 tag 回退到映射。

仅当 Java 原生模式对等端应按名称而非数字 tag 匹配枚举常量时，才使用 `serializeEnumByName(true)`：

```java
Fory fory = Fory.builder()
    .withXlang(false)
    .serializeEnumByName(true)
    .build();
```

该 Java 原生模式选项不会改变跨语言枚举编码；跨语言模式使用数字枚举 tag。跨语言载荷或任何要求数字编码 ID 保持稳定的 Schema 应优先使用 `@ForyEnumId`。

## 原生模式与跨语言模式

字段配置会因序列化模式而异：

### 原生模式（仅限 Java）

原生模式采用**宽松的默认值**，以获得最大兼容性：

- **可空**：引用类型默认可空
- **引用跟踪**：对象引用默认启用（`String`、装箱类型和时间类型除外）
- **多态**：所有非 final 类默认支持多态

在原生模式下，通常**不需要配置字段注解**，除非希望：

- 使用字段 ID 减小序列化体积
- 禁用不必要的引用跟踪以优化性能
- 控制特定字段的整数编码

```java
// Native mode: works without any annotations
public class User {
    private long id;
    private String name;
    private List<String> tags;  // Nullable and ref-tracked by default
}
```

### 跨语言模式

由于不同语言的类型系统存在差异，跨语言模式采用**更严格的默认值**：

- **可空**：字段默认不可空
- **引用跟踪**：默认禁用，除非字段类型使用 `@Ref`
- **多态**：具体类型默认不支持多态

在跨语言模式下，以下情况**需要配置字段**：

- 字段可以为 null（使用 `@Nullable`）
- 字段需要跟踪共享/循环对象的引用（使用 `@Ref`）
- 整数类型需要特定编码以实现跨语言兼容
- 希望减小元数据体积（使用字段 ID）

```java
// Xlang mode: explicit configuration required for nullable/ref fields
public class User {
    @ForyField(id = 0)
    private long id;

    @ForyField(id = 1)
    private String name;

    @Nullable
    @ForyField(id = 2) // Must declare @Nullable
    private String email;

    @Nullable
    @ForyField(id = 3)
    @Ref // Must declare @Ref for shared objects
    private User friend;
}
```

### 默认值汇总

| 选项       | 原生模式默认值           | 跨语言模式默认值             |
| ---------- | ------------------------ | ---------------------------- |
| `nullable` | `true` (reference types) | `false`                      |
| `ref`      | `true`                   | `false`                      |
| `dynamic`  | `true`（非 final）       | `AUTO`（具体类型视为 final） |

## 最佳实践

1. **配置字段 ID**：兼容模式推荐使用，以降低序列化成本
2. **可空字段使用 `@Nullable`**：字段可以为 null 时必须使用
3. **为共享对象启用引用跟踪**：对象共享或形成循环时使用 `@Ref`
4. **敏感数据使用 `@Ignore` 或 `transient`**：例如密码、令牌、内部状态
5. **选择合适的编码**：较小值使用 `varint`，完整范围值使用 `fixed`
6. **保持 ID 稳定**：字段 ID 一经分配不要更改
7. **为跨语言兼容配置无符号类型**：与 Rust、Go、C++ 的无符号数互操作时使用

## 注解参考

| 注解                          | 说明                            |
| ----------------------------- | ------------------------------- |
| `@ForyField(id = N)`          | 用于减小元数据体积的字段 tag ID |
| `@Nullable`                   | 将字段或嵌套类型标记为可空      |
| `@Ref`                        | 启用引用跟踪                    |
| `@ForyField(dynamic = ...)`   | 控制结构体字段的多态行为        |
| `@Ignore`                     | 从序列化中排除字段              |
| `@Int32Type(encoding = ...)`  | 32 位有符号整数编码             |
| `@Int64Type(encoding = ...)`  | 64 位有符号整数编码             |
| `@UInt8Type`                  | 8 位无符号整数                  |
| `@UInt16Type`                 | 16 位无符号整数                 |
| `@UInt32Type(encoding = ...)` | 32 位无符号整数编码             |
| `@UInt64Type(encoding = ...)` | 64 位无符号整数编码             |

## 相关主题

- [基础序列化](core-api.md) - Fory 序列化入门
- [配置](configuration.md) - `ForyBuilder` 选项
- [Schema 演进](schema-evolution.md) - 兼容模式与 Schema 演进
- [跨语言序列化](core-api.md#cross-language-interoperability) - 与 Python、Rust、C++、Go 互操作
