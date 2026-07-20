---
title: Schema 元数据
sidebar_position: 7
id: schema_metadata
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

本文说明如何在 Java 中为序列化配置字段级元数据。

## 概览

Apache Fory™ 通过注解提供字段级配置：

- **`@ForyField`**：配置字段元数据（id、dynamic）
- **`@Nullable`**：将字段类型或嵌套类型位置标记为可空
- **`@Ref`**：启用字段或嵌套元素的引用跟踪
- **`@Ignore`**：从序列化中排除字段
- **整数类型注解**：控制整数编码（varint、fixed、tagged、unsigned）

这支持：

- **Tag ID**：分配紧凑的数值 ID，降低兼容模式下 struct 字段元数据大小开销
- **可空性**：控制字段是否可以为 null
- **引用跟踪**：为共享对象启用引用跟踪
- **字段跳过**：从序列化中排除字段
- **编码控制**：指定整数如何编码
- **多态控制**：控制 struct 字段的类型信息写入

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

| 参数      | 类型      | 默认值 | 说明                                  |
| --------- | --------- | ------ | ------------------------------------- |
| `id`      | `int`     | `-1`   | 非负字段 tag ID，或无 ID              |
| `dynamic` | `Dynamic` | `AUTO` | 控制 struct 字段的多态行为            |

在字段类型或嵌套类型位置上使用 `@Nullable` 来配置可空 Schema 元数据，使用 `@Ref` 进行引用跟踪。`@ForyField` 本身不携带这两项设置。

## 字段 ID (`id`)

为字段分配数值 ID，以最小化兼容模式下 struct 字段元数据大小开销：

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

- 序列化大小更小（元数据中使用数值 ID，而不是字段名）
- struct 字段元数据开销更低
- 允许重命名字段而不破坏二进制兼容性

**建议**：建议为兼容模式配置字段 ID，因为它可以降低序列化成本。

**说明**：

- ID 在同一个类内必须唯一
- 配置 ID 时，ID 必须 >= 0
- 如果未指定，注解默认值 `-1` 会被忽略，并在元数据中使用字段名（开销更大）

**没有字段 ID**（元数据中使用字段名）：

```java
public class User {
    private long id;
    private String name;
}
```

## 可空字段 (`@Nullable`)

对可以为 `null` 的字段使用 `@Nullable`：

```java
public class Record {
    // 可空字符串字段
    @Nullable
    @ForyField(id = 0)
    private String optionalName;

    // 可空 Integer 字段（装箱类型）
    @Nullable
    @ForyField(id = 1)
    private Integer optionalCount;

    // 非可空字段（默认）
    @ForyField(id = 2)
    private String requiredName;
}
```

**说明**：

- Xlang 字段默认不可空。
- 当字段不可空时，Fory 会跳过 null 标记的写入。
- 可以为 null 的装箱类型（`Integer`、`Long` 等）应使用 `@Nullable`。

## 引用跟踪 (`@Ref`)

为可能共享或循环的字段启用引用跟踪：

```java
public class RefOuter {
    // 两个字段都可能指向同一个 inner 对象
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

    // 用于循环引用的自引用字段
    @Nullable
    @ForyField(id = 1)
    @Ref
    private CircularRef selfRef;
}
```

**使用场景**：

- 为可能循环或共享的字段启用
- 同一对象会被多个字段引用时启用

**说明**：

- 没有 `@Ref` 的字段不会使用字段包装层面的引用跟踪
- 当值既不共享也不循环时，应避免使用 `@Ref`，这样 Fory 可以跳过引用标记
- 引用跟踪只有在全局引用跟踪启用时才会生效

## Dynamic（多态控制）

控制跨语言序列化中 struct 字段的多态行为：

```java
public class Container {
    // AUTO：接口/抽象类型是 dynamic，具体类型不是
    @ForyField(id = 0, dynamic = ForyField.Dynamic.AUTO)
    private Animal animal;  // 接口 - 写入类型信息

    // FALSE：不写入类型信息，使用声明类型的序列化器
    @ForyField(id = 1, dynamic = ForyField.Dynamic.FALSE)
    private Dog dog;  // 具体类型 - 不写入类型信息

    // TRUE：写入类型信息以支持运行时子类型
    @ForyField(id = 2, dynamic = ForyField.Dynamic.TRUE)
    private Object data;  // 强制多态
}
```

**选项**：

| 值      | 说明                                            |
| ------- | ----------------------------------------------- |
| `AUTO`  | 自动检测：接口/抽象类型是 dynamic，具体类型不是 |
| `FALSE` | 不写入类型信息，直接使用声明类型的序列化器      |
| `TRUE`  | 写入类型信息，以支持运行时子类型                |

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
    private String password;  // 不序列化

    @Ignore
    private Object internalState;  // 不序列化
}
```

### 使用 `transient`

Java 的 `transient` 关键字也会排除字段：

```java
public class User {
    @ForyField(id = 0)
    private long id;

    private transient String password;  // 不序列化
    private transient Object cache;     // 不序列化
}
```

## 整数类型注解

Fory 提供注解来控制整数编码，以实现跨语言兼容性。整数 Schema 注解是 Java 类型使用注解。当字段修饰符存在时，将它们放在字段类型上、字段修饰符之后；如果同时存在 `@ForyField`，则与其配合使用。

### 有符号 32 位整数 (`@Int32Type`)

```java
import org.apache.fory.annotation.Int32Type;
import org.apache.fory.config.Int32Encoding;

public class MyStruct {
    // 变长编码（默认）- 对小值更紧凑
    private @Int32Type(encoding = Int32Encoding.VARINT) int compactId;

    // 固定 4 字节编码 - 大小一致
    private @Int32Type(encoding = Int32Encoding.FIXED) int fixedId;
}
```

### 有符号 64 位整数 (`@Int64Type`)

```java
import org.apache.fory.annotation.Int64Type;
import org.apache.fory.config.Int64Encoding;

public class MyStruct {
    // 变长编码（默认）
    private @Int64Type(encoding = Int64Encoding.VARINT) long compactId;

    // 固定 8 字节编码
    private @Int64Type(encoding = Int64Encoding.FIXED) long fixedTimestamp;

    // Tagged 编码（小值占 4 字节，否则占 9 字节）
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
    // 无符号 8 位 [0, 255]
    private @UInt8Type int flags;

    // 无符号 16 位 [0, 65535]
    private @UInt16Type int port;

    // 使用 varint 编码的无符号 32 位（默认）
    private @UInt32Type(encoding = Int32Encoding.VARINT) long compactCount;

    // 使用 fixed 编码的无符号 32 位
    private @UInt32Type(encoding = Int32Encoding.FIXED) long fixedCount;

    // 使用多种编码的无符号 64 位
    private @UInt64Type(encoding = Int64Encoding.VARINT) long varintU64;

    private @UInt64Type(encoding = Int64Encoding.FIXED) long fixedU64;

    private @UInt64Type(encoding = Int64Encoding.TAGGED) long taggedU64;
}
```

### 编码汇总

| 注解                             | 类型 ID | 编码   | 大小         |
| -------------------------------- | ------- | ------ | ------------ |
| `@Int32Type(encoding = VARINT)`  | 5       | varint | 1-5 字节     |
| `@Int32Type(encoding = FIXED)`   | 4       | fixed  | 4 字节       |
| `@Int64Type(encoding = VARINT)`  | 7       | varint | 1-10 字节    |
| `@Int64Type(encoding = FIXED)`   | 6       | fixed  | 8 字节       |
| `@Int64Type(encoding = TAGGED)`  | 8       | tagged | 4 或 9 字节  |
| `@UInt8Type`                     | 9       | fixed  | 1 字节       |
| `@UInt16Type`                    | 10      | fixed  | 2 字节       |
| `@UInt32Type(encoding = VARINT)` | 12      | varint | 1-5 字节     |
| `@UInt32Type(encoding = FIXED)`  | 11      | fixed  | 4 字节       |
| `@UInt64Type(encoding = VARINT)` | 14      | varint | 1-10 字节    |
| `@UInt64Type(encoding = FIXED)`  | 13      | fixed  | 8 字节       |
| `@UInt64Type(encoding = TAGGED)` | 15      | tagged | 4 或 9 字节  |

**何时使用**：

- `varint`：最适合经常较小的值（默认）
- `fixed`：最适合使用完整范围的值（例如时间戳、哈希）
- `tagged`：在大小和性能之间提供良好平衡
- 无符号类型：用于与 Rust、Go、C++ 中的无符号数字保持跨语言兼容

无符号 Java 标量承载类型是：`@UInt8Type` 和 `@UInt16Type` 使用 `int`/`Integer`，`@UInt32Type` 和 `@UInt64Type` 使用 `long`/`Long`。用 `@UInt8Type` 注解 `byte` 是无效的，因为 Java `byte` 无法表示无符号范围。

整数注解也可以应用到嵌套泛型类型参数上：

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

专用无符号列表承载类型默认使用 `list<T>` Schema，因此其元素注解会保留在列表元数据中。只有当字段应使用紧凑的 `array<T>` Schema 时，才添加 `@ArrayType`。

基本类型无符号数组可以使用标量元素注解来生成紧凑的 `array<T>` 元数据：

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
    // 带 tag ID 的字段（兼容模式推荐）
    @ForyField(id = 0)
    private String title;

    @ForyField(id = 1)
    private int version;

    // 可空字段
    @Nullable
    @ForyField(id = 2)
    private String description;

    // 集合字段
    @ForyField(id = 3)
    private List<String> tags;

    @ForyField(id = 4)
    private Map<String, String> metadata;

    @ForyField(id = 5)
    private Set<String> categories;

    // 使用不同编码的整数
    @ForyField(id = 6)
    private @UInt64Type(encoding = Int64Encoding.VARINT) long viewCount;  // varint 编码

    @ForyField(id = 7)
    private @UInt64Type(encoding = Int64Encoding.FIXED) long fileSize;   // fixed 编码

    @ForyField(id = 8)
    private @UInt64Type(encoding = Int64Encoding.TAGGED) long checksum;   // tagged 编码

    // 为共享/循环引用进行引用跟踪的字段
    @Nullable
    @ForyField(id = 9)
    @Ref
    private Document parent;

    // 被忽略的字段（不序列化）
    private transient Object cache;

    // Getter 和 setter...
}

// 用法
public class Main {
    public static void main(String[] args) {
        Fory fory = Fory.builder()
            .withXlang(true)
            .withCompatible(true)
            .withRefTracking(true)
            .build();

        fory.register(Document.class, 100);

        Document doc = new Document();
        doc.setTitle("My Document");
        doc.setVersion(1);
        doc.setDescription("A sample document");

        // 序列化
        byte[] data = fory.serialize(doc);

        // 反序列化
        Document decoded = (Document) fory.deserialize(data);
    }
}
```

## 跨语言兼容性

当序列化的数据需要由其他语言（Python、Rust、C++、Go）读取时，请使用字段 ID 和匹配的类型注解：

```java
public class CrossLangData {
    // 使用字段 ID 以实现跨语言兼容性
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
// 版本 1
public class DataV1 {
    @ForyField(id = 0)
    private long id;

    @ForyField(id = 1)
    private String name;
}

// 版本 2：新增字段
public class DataV2 {
    @ForyField(id = 0)
    private long id;

    @ForyField(id = 1)
    private String name;

    @Nullable
    @ForyField(id = 2)
    private String email;  // 新字段
}
```

使用 V1 序列化的数据可以用 V2 反序列化（新字段将为 `null`）。

也可以省略字段 ID（元数据中会使用字段名，开销更大）：

```java
public class Data {
    private long id;
    private String name;
}
```

## 枚举元数据

在 xlang 模式下，Java 枚举按数值 tag 序列化。默认 tag 是声明顺序 ordinal。当枚举需要不依赖声明顺序的稳定 ID 时，请用 `@ForyEnumId` 精确注解一个 ID 来源，或为每个枚举常量显式标注 tag 值。

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

Java 还支持在一个枚举实例字段上标注 `@ForyEnumId`，或直接为每个枚举常量标注，例如 `@ForyEnumId(10) Unknown`。

`@ForyEnumId` 只支持三种配置方式：

1. 注解一个枚举实例字段，并在其中存储数值 ID。
2. 注解一个无参数的 public 实例方法，例如 `getId()`。
3. 直接为每个枚举常量标注显式值，例如 `@ForyEnumId(10) Unknown`。

校验规则：

1. 对同一个枚举，只能使用这三种方式中的一种。
2. 字段和方法注解必须让 `value()` 保持默认值 `-1`。
3. 一旦任何常量使用 `@ForyEnumId`，每个枚举常量都必须且只能标注一次。
4. 所有 ID 必须非负、唯一，并且能放入 Java `int`。

查找行为：

1. 没有 `@ForyEnumId` 时，Fory 写入声明顺序 ordinal。
2. 有 `@ForyEnumId` 时，Fory 写入配置的稳定数值 tag。
3. 小而稠密的 tag 在内部使用数组查找；稀疏且较大的 tag 会回退到 map。

只有当 Java 原生模式对等端应按名称而不是数值 tag 匹配枚举常量时，才使用 `serializeEnumByName(true)`：

```java
Fory fory = Fory.builder()
    .withXlang(false)
    .serializeEnumByName(true)
    .build();
```

这个运行时选项不会改变 xlang 枚举编码；xlang 使用数值枚举 tag。对于跨语言载荷，或任何数值编码 ID 必须保持稳定的 Schema，应优先使用 `@ForyEnumId`。

## 原生模式与 Xlang 模式

字段配置会因序列化模式不同而表现不同：

### 原生模式（仅 Java）

为了获得最大兼容性，原生模式具有**更宽松的默认值**：

- **可空**：引用类型默认可空
- **引用跟踪**：对象引用默认启用（`String`、装箱类型和时间类型除外）
- **多态**：所有非 final 类默认支持多态

在原生模式下，通常**不需要配置字段注解**，除非你希望：

- 通过使用字段 ID 减小序列化大小
- 通过禁用不必要的引用跟踪优化性能
- 为特定字段控制整数编码

```java
// 原生模式：没有任何注解也能工作
public class User {
    private long id;
    private String name;
    private List<String> tags;  // 默认可空并进行引用跟踪
}
```

### Xlang 模式（跨语言）

由于不同语言之间类型系统存在差异，xlang 模式具有**更严格的默认值**：

- **可空**：字段默认不可空
- **引用跟踪**：默认禁用，除非字段类型使用 `@Ref`
- **多态**：具体类型默认非多态

在 xlang 模式下，以下情况**需要配置字段**：

- 字段可以为 null（使用 `@Nullable`）
- 字段需要为共享/循环对象启用引用跟踪（使用 `@Ref`）
- 整数类型需要特定编码以实现跨语言兼容性
- 希望减小元数据大小（使用字段 ID）

```java
// Xlang 模式：可空/引用字段需要显式配置
public class User {
    @ForyField(id = 0)
    private long id;

    @ForyField(id = 1)
    private String name;

    @Nullable
    @ForyField(id = 2) // 必须声明 @Nullable
    private String email;

    @Nullable
    @ForyField(id = 3)
    @Ref // 共享对象必须声明 @Ref
    private User friend;
}
```

### 默认值汇总

| 选项       | 原生模式默认值         | Xlang 模式默认值               |
| ---------- | ---------------------- | ------------------------------ |
| `nullable` | `true`（引用类型）     | `false`                        |
| `ref`      | `true`                 | `false`                        |
| `dynamic`  | `true`（非 final）     | `AUTO`（具体类型为 final）     |

## 最佳实践

1. **配置字段 ID**：兼容模式推荐使用，以降低序列化成本
2. **对可空字段使用 `@Nullable`**：可以为 null 的字段必须使用
3. **为共享对象启用引用跟踪**：当对象共享或循环时使用 `@Ref`
4. **对敏感数据使用 `@Ignore` 或 `transient`**：密码、令牌、内部状态
5. **选择合适的编码**：小值使用 `varint`，全范围值使用 `fixed`
6. **保持 ID 稳定**：字段 ID 一旦分配就不要更改
7. **为跨语言兼容配置无符号类型**：与 Rust、Go、C++ 中的无符号数字互操作时使用

## 注解参考

| 注解                          | 说明                         |
| ----------------------------- | ---------------------------- |
| `@ForyField(id = N)`          | 用于减小元数据大小的字段 tag ID |
| `@Nullable`                   | 将字段或嵌套类型标记为可空   |
| `@Ref`                        | 启用引用跟踪                 |
| `@ForyField(dynamic = ...)`   | 控制 struct 字段的多态       |
| `@Ignore`                     | 从序列化中排除字段           |
| `@Int32Type(encoding = ...)`  | 32 位有符号整数编码          |
| `@Int64Type(encoding = ...)`  | 64 位有符号整数编码          |
| `@UInt8Type`                  | 无符号 8 位整数              |
| `@UInt16Type`                 | 无符号 16 位整数             |
| `@UInt32Type(encoding = ...)` | 无符号 32 位整数编码         |
| `@UInt64Type(encoding = ...)` | 无符号 64 位整数编码         |

## 相关主题

- [基础序列化](basic-serialization.md) - Fory 序列化入门
- [配置](configuration.md) - 运行时构建器选项
- [Schema 演进](schema-evolution.md) - 兼容模式和 Schema 演进
- [Xlang 序列化](xlang-serialization.md) - 与 Python、Rust、C++、Go 的互操作
