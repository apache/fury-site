---
title: 字段可空性
sidebar_position: 4
id: nullability
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

本文说明 Fory 在跨语言序列化模式中如何处理字段可空性。

## 默认行为

在跨语言模式中，**字段默认不可空**。这意味着：

- 值必须始终存在（非 null）
- 不会为字段写入 null 标志字节
- 序列化结果更紧凑

以下类型默认可空：

- `Optional<T>` (Java, C++)
- Java 装箱类型（`Integer`、`Long`、`Double` 等）
- Go 指针类型（`*int32`、`*string` 等）
- Rust `Option<T>`
- Python `Optional[T]`
- Scala `Option[T]`

| 字段类型                              | 默认可空 | 写入 null 标志 |
| ------------------------------------- | -------- | -------------- |
| 原始类型（`int`、`bool`、`float` 等） | 否       | 否             |
| `String`                              | 否       | 否             |
| `List<T>`、`Map<K,V>`、`Set<T>`       | 否       | 否             |
| 自定义结构体                          | 否       | 否             |
| 枚举                                  | 否       | 否             |
| Java 装箱类型（`Integer`、`Long` 等） | 是       | 是             |
| Go 指针类型（`*int32`、`*string`）    | 是       | 是             |
| `Optional<T>` / `Option<T>`           | 是       | 是             |

## 编码格式

可空标志控制是否在字段值之前写入 **null 标志字节**：

```
Non-nullable field: [value data]
Nullable field:     [null_flag] [value data if not null]
```

其中 `null_flag` 为：

- `-1` (NULL_FLAG)：值为 null
- `-2` (NOT_NULL_VALUE_FLAG)：值存在

## 可空性与引用跟踪

二者相关，但属于不同概念：

| 概念         | 用途                 | 标志值                                         |
| ------------ | -------------------- | ---------------------------------------------- |
| **可空**     | 允许字段使用 null 值 | `-1`（null）、`-2`（非 null）                  |
| **引用跟踪** | 去重共享对象引用     | `-1`（null）、`-2`（非 null）、`≥0`（引用 ID） |

主要区别：

- **仅可空**：写入 `-1` 或 `-2` 标志，不进行引用去重
- **引用跟踪**：使用引用 ID（`≥0`）扩展可空语义，以表示之前出现过的对象
- 两者使用相同的标志字节位置——引用跟踪是可空语义的超集

当 `refTracking=true` 时，null 标志字节同时用作引用标志：

```
ref_flag = -1  → null value
ref_flag = -2  → new object (first occurrence)
ref_flag >= 0  → reference to object at index ref_flag
```

引用跟踪的详细行为参见[引用跟踪](references.md)。

## 各语言示例

### Java

```java
public class Person {
    // Non-nullable by default in xlang mode
    String name;           // Must not be null
    int age;              // Primitive, always non-nullable
    List<String> tags;    // Must not be null

    // Explicitly nullable
    @Nullable
    String nickname;      // Can be null

    // Optional wrapper - nullable by default
    Optional<String> bio; // Can be empty/null
}

Fory fory = Fory.builder()
        .withXlang(true)
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
    age: pyfory.Int32      # Primitive
    tags: List[str]        # Must not be None

    # Optional makes it nullable
    nickname: Optional[str] = None  # Can be None
    bio: Optional[str] = None       # Can be None

fory = pyfory.Fory(xlang=True)
fory.register_type(Person, name="example.Person")
```

### Rust

```rust
use fory::{Fory, ForyStruct};

#[derive(ForyStruct)]
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

fory := forygo.NewFory(forygo.WithXlang(true))
fory.RegisterStructByName(Person{}, "example.Person")
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

### Java：@Nullable 注解

```java
public class Config {
    @Nullable
    String optionalSetting;  // Explicitly nullable

    String requiredSetting;  // Explicitly non-nullable (default)
}
```

### C++：FORY_STRUCT 字段配置

```cpp
struct Config {
    std::optional<std::string> optional_setting;
    std::string required_setting;
};

FORY_STRUCT(Config,
    (optional_setting, fory::F(1)),
    (required_setting, fory::F(2))
);
```

对于可空指针载体，使用 `.nullable()` 显式启用：

```cpp
struct ConfigRef {
    std::shared_ptr<std::string> optional_setting;
    std::shared_ptr<std::string> required_setting;
};

FORY_STRUCT(ConfigRef,
    (optional_setting, fory::F(1).nullable()),
    (required_setting, fory::F(2))
);
```

## null 值处理

不可空字段收到 null 值时：

| 语言   | 行为                                     |
| ------ | ---------------------------------------- |
| Java   | 抛出 `NullPointerException` 或序列化错误 |
| Python | 抛出 `TypeError` 或序列化错误            |
| Rust   | 编译期错误（非 Option 类型不能为 None）  |
| Go     | 使用零值（空字符串、0 等）               |
| C++    | 使用默认构造值或产生未定义行为           |

## Schema 兼容性

可空标志是结构体 Schema 指纹的一部分。禁用兼容模式时，更改字段可空性属于**破坏性变更**，会导致 Schema 版本不匹配错误。

```
Schema A: { name: String (non-nullable) }
Schema B: { name: String (nullable) }
// These have different fingerprints when compatible mode is disabled
```

在兼容模式中，如果顶层标量字段的标量类型在其他方面兼容，即使可空性或可选包装器不同，仍可匹配。存在的值通过兼容标量转换读取，并且必须满足常规的无损转换检查。远端 null 值遵循本地字段的兼容读取 null/默认值行为。

## 最佳实践

1. **默认使用不可空字段**：仅当 null 是有效的语义值时才将字段设为可空
2. **使用 Optional/Option 包装器**：避免使用带可空注解的原始类型
3. **保持跨语言一致**：对应字段使用相同的可空性
4. **记录可空字段**：在 API 中明确说明哪些字段可以为 null

## 另请参阅

- [引用跟踪](references.md) - 共享引用和循环引用处理
- [跨语言概述](index.md) - 跨语言序列化工作流和运行时指南
- [类型映射](../../specification/xlang_type_mapping.md) - 跨语言类型映射参考
- [跨语言规范](../../specification/xlang_serialization_spec.md) - 二进制协议详情
