---
title: 字段可空性
sidebar_position: 40
id: field_nullability
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

本页说明 Fory 在跨语言（xlang）序列化模式下如何处理字段可空性。

## 默认行为

在 xlang 模式下，**字段默认不可空**。这意味着：

- 值必须始终存在（非 null）
- 不会为字段写入 null 标记字节
- 序列化结果更紧凑

以下类型默认可空：

- `Optional<T>` (Java, C++)
- Java boxed types (`Integer`, `Long`, `Double`, etc.)
- Go pointer types (`*int32`, `*string`, etc.)
- Rust `Option<T>`
- Python `Optional[T]`

| 字段类型 | 默认可空 | 写入 Null 标记 |
| ------------------------------------------ | ---------------- | ----------------- |
| 基本类型（`int`、`bool`、`float` 等） | 否 | 否 |
| `String` | 否 | 否 |
| `List<T>`、`Map<K,V>`、`Set<T>` | 否 | 否 |
| 自定义结构体 | 否 | 否 |
| 枚举 | 否 | 否 |
| Java 装箱类型（`Integer`、`Long` 等） | 是 | 是 |
| Go 指针类型（`*int32`、`*string`） | 是 | 是 |
| `Optional<T>` / `Option<T>` | 是 | 是 |

## 编码格式

可空标记控制是否在字段值之前写入 **null 标记字节**：

```
Non-nullable field: [value data]
Nullable field:     [null_flag] [value data if not null]
```

其中 `null_flag` 为：

- `-1` (NULL_FLAG)：值为 null
- `-2` (NOT_NULL_VALUE_FLAG)：值存在

## 可空性与引用跟踪

二者相关但概念不同：

| 概念 | 目的 | 标记值 |
| ---------------------- | ------------------------------------ | ------------------------------------------- |
| **可空性** | 允许字段为 null | `-1`（null）、`-2`（非 null） |
| **引用跟踪** | 对共享对象引用去重 | `-1`（null）、`-2`（非 null）、`≥0`（引用 ID） |

关键区别：

- **仅可空**：写入 `-1` 或 `-2` 标记，不做引用去重
- **引用跟踪**：在可空语义上扩展引用 ID（`≥0`），表示此前出现过的对象
- 两者使用同一个标记字节位置；引用跟踪是可空性的超集

When `refTracking=true`, the null flag byte doubles as a ref flag:

```
ref_flag = -1  → null value
ref_flag = -2  → new object (first occurrence)
ref_flag >= 0  → reference to object at index ref_flag
```

关于引用跟踪的详细行为，请参见[引用跟踪](field-reference-tracking.md)。

## 各语言示例

### Java

```java
public class Person {
    // Non-nullable by default in xlang mode
    String name;           // Must not be null
    int age;              // Primitive, always non-nullable
    List<String> tags;    // Must not be null

    // Explicitly nullable
    @ForyField(nullable = true)
    String nickname;      // Can be null

    // Optional wrapper - nullable by default
    Optional<String> bio; // Can be empty/null
}

Fory fory = Fory.builder()
    .withLanguage(Language.XLANG)
    .build();
fory.register(Person.class, "example.Person");
```

### Python

```python
from dataclasses import dataclass
from typing import Optional, List
import pyfory

@dataclass
class Person:
    # Non-nullable by default
    name: str              # Must have a value
    age: pyfory.int32      # Primitive
    tags: List[str]        # Must not be None

    # Optional makes it nullable
    nickname: Optional[str] = None  # Can be None
    bio: Optional[str] = None       # Can be None

fory = pyfory.Fory(xlang=True)
fory.register_type(Person, typename="example.Person")
```

### Rust

```rust
use fory::Fory;

#[derive(Fory)]
#[tag("example.Person")]
struct Person {
    // Non-nullable by default
    name: String,
    age: i32,
    tags: Vec<String>,

    // Option<T> is nullable
    nickname: Option<String>,  // Can be None
    bio: Option<String>,       // Can be None
}
```

### Go

```go
type Person struct {
    // Non-nullable by default
    Name string
    Age  int32
    Tags []string

    // Pointer types for nullable fields
    Nickname *string  // Can be nil
    Bio      *string  // Can be nil
}

fory := forygo.NewFory()
fory.RegisterTagType("example.Person", Person{})
```

### C++

```cpp
struct Person {
    // Non-nullable by default
    std::string name;
    int32_t age;
    std::vector<std::string> tags;

    // std::optional for nullable
    std::optional<std::string> nickname;
    std::optional<std::string> bio;
};
FORY_STRUCT(Person, name, age, tags, nickname, bio);
```

## 自定义可空性

### Java：@ForyField 注解

```java
public class Config {
    @ForyField(nullable = true)
    String optionalSetting;  // Explicitly nullable

    @ForyField(nullable = false)
    String requiredSetting;  // Explicitly non-nullable (default)
}
```

### C++：fory::field 包装器

```cpp
struct Config {
    // Explicitly mark as nullable
    fory::field<std::string, 1, fory::nullable<true>> optional_setting;

    // Explicitly mark as non-nullable (default)
    fory::field<std::string, 2, fory::nullable<false>> required_setting;
};
FORY_STRUCT(Config, optional_setting, required_setting);
```

## Null 值处理

当不可空字段收到 null 值时：

| 语言 | 行为 |
| -------- | ---------------------------------------------------- |
| Java | 抛出 `NullPointerException` 或序列化错误 |
| Python | 抛出 `TypeError` 或序列化错误 |
| Rust | 编译期错误（非 Option 类型不能为 None） |
| Go | 使用零值（空字符串、0 等） |
| C++ | 默认构造值或未定义行为 |

## Schema 兼容性

可空标记是结构体 schema 指纹的一部分。修改字段可空性是**破坏性变更**，会导致 schema 版本不匹配错误。

```
Schema A: { name: String (non-nullable) }
Schema B: { name: String (nullable) }
// These have different fingerprints and are incompatible
```

## 最佳实践

1. **Use non-nullable by default**: Only make fields nullable when null is a valid semantic value
2. **Use Optional/Option wrappers**: Instead of raw types with nullable annotation
3. **Be consistent across languages**: Use the same nullability for corresponding fields
4. **Document nullable fields**: Make it clear which fields can be null in your API

## See Also

- [Reference Tracking](field-reference-tracking.md) - Shared and circular reference handling
- [Serialization](serialization.md) - Basic cross-language serialization
- [Type Mapping](https://fory.apache.org/docs/specification/xlang_type_mapping) - Cross-language type mapping reference
- [Xlang Specification](https://fory.apache.org/docs/specification/fory_xlang_serialization_spec) - Binary protocol details
