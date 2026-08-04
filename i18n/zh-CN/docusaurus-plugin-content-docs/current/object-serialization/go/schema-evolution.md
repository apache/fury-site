---
title: Schema 演进
sidebar_position: 6
id: schema-evolution
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

Schema 演进允许数据结构随时间变化，同时与之前序列化的数据保持兼容。Fory Go 通过兼容模式支持这一能力；跨语言模式和原生模式都默认使用兼容模式。

## 兼容模式默认设置

对于跨语言载荷，使用默认跨语言设置创建 Fory 实例：

```go
f := fory.New(fory.WithXlang(true))
```

对于需要 Schema 演进的 Go 专属原生模式载荷，请使用原生模式并保留兼容默认设置：

```go
f := fory.New(fory.WithXlang(false))
```

## 工作原理

### 使用兼容模式

- 将类型元数据写入序列化数据
- 支持添加、删除和重排字段
- 支持向前和向后兼容

### 相同 Schema 优化

- 不含演进元数据的紧凑序列化
- 反序列化期间检查结构体哈希
- 任何 Schema 变更都会导致 `ErrKindHashMismatch`

## 支持的 Schema 变更

### 添加字段

可以添加新字段；反序列化旧数据时，这些字段获得零值：

```go
// Version 1
type UserV1 struct {
    ID   int64
    Name string
}

// Version 2 (added Email)
type UserV2 struct {
    ID    int64
    Name  string
    Email string  // New field
}

f := fory.New(fory.WithXlang(true))
f.RegisterStruct(UserV1{}, 1)

// Serialize with V1
userV1 := &UserV1{ID: 1, Name: "Alice"}
data, _ := f.Serialize(userV1)

// Deserialize with V2
f2 := fory.New(fory.WithXlang(true))
f2.RegisterStruct(UserV2{}, 1)

var userV2 UserV2
f2.Deserialize(data, &userV2)
// userV2.Email = "" (zero value)
```

### 删除字段

反序列化期间会跳过已删除字段：

```go
// Version 1
type ConfigV1 struct {
    Host     string
    Port     int32
    Timeout  int64
    Debug    bool  // Will be removed
}

// Version 2 (removed Debug)
type ConfigV2 struct {
    Host    string
    Port    int32
    Timeout int64
    // Debug field removed
}

f := fory.New(fory.WithXlang(true))
f.RegisterStruct(ConfigV1{}, 1)

// Serialize with V1
config := &ConfigV1{Host: "localhost", Port: 8080, Timeout: 30, Debug: true}
data, _ := f.Serialize(config)

// Deserialize with V2
f2 := fory.New(fory.WithXlang(true))
f2.RegisterStruct(ConfigV2{}, 1)

var configV2 ConfigV2
f2.Deserialize(data, &configV2)
// Debug field data is skipped
```

### 重排字段

字段顺序可以在版本之间变化：

```go
// Version 1
type PersonV1 struct {
    FirstName string
    LastName  string
    Age       int32
}

// Version 2 (reordered)
type PersonV2 struct {
    Age       int32   // Moved up
    LastName  string
    FirstName string  // Moved down
}
```

兼容模式通过按名称匹配字段自动处理这种变化。

### 兼容的标量字段变更

如果序列化值可以在不改变逻辑值的情况下转换，兼容模式还可以读取匹配顶层结构体字段的部分标量类型变更：

- `bool` 字段可以从严格等于 `"0"`、`"1"`、`"true"` 或 `"false"` 的字符串读取。布尔值读取为字符串时变为 `"true"` 或 `"false"`，数值 `0` 和 `1` 可以读取为布尔值。
- 只有目标字段类型可以精确表示该值时，整数、无符号整数、浮点数和十进制字段才能跨数字标量类型读取。
- 只有字符串是有限 ASCII 十进制字面量，且不包含空白、前导 `+`、Unicode 数字、分隔符、进制前缀或 `NaN` 和 `Infinity` 等特殊值时，才能将其读取为数字字段。
- 数字字段读取为字符串时使用规范输出：整数使用普通十进制文本，浮点值使用带小数点的精确普通十进制文本，十进制省略无意义的末尾小数零。

当匹配的顶层标量字段未启用引用跟踪时，标量转换可以与指针和 `optional.Optional[T]` 字段组合。如果远端可空或可选字段不存在，本地字段遵循兼容模式下常规的缺失/null 行为。启用引用跟踪的标量类型变更不兼容。如果存在的值无法无损转换，反序列化会因数据错误而失败，而不会将字段视为缺失。

## 不兼容变更

即使在兼容模式中，某些变更也不受支持：

### 类型变更

```go
// NOT SUPPORTED
type V1 struct {
    Value []int32  // list of int32
}

type V2 struct {
    Value []string  // Element type changed - INCOMPATIBLE
}
```

### 重命名字段

```go
// NOT SUPPORTED (treated as remove + add)
type V1 struct {
    UserName string
}

type V2 struct {
    Username string  // Different name - NOT a rename
}
```

这会被视为删除 `UserName` 并添加 `Username`，从而导致数据丢失。

## 最佳实践

### 1. 持久化数据使用兼容模式

```go
// Default xlang payloads already use compatible mode.
f := fory.New(fory.WithXlang(true))
```

对于存储在数据库、文件或缓存中的 Go 专属原生模式数据，请使用兼容模式：

```go
f := fory.New(fory.WithXlang(false))
```

### 2. 提供默认值

```go
type ConfigV2 struct {
    Host    string
    Port    int32
    Timeout int64
    Retries int32  // New field
}

func NewConfigV2() *ConfigV2 {
    return &ConfigV2{
        Retries: 3,  // Default value
    }
}

// After deserialize, apply defaults
if config.Retries == 0 {
    config.Retries = 3
}
```

## 跨语言 Schema 演进

Schema 演进可以跨语言工作：

### Go（生产端）

```go
type MessageV1 struct {
    ID      int64
    Content string
}

f := fory.New(fory.WithXlang(true))
f.RegisterStruct(MessageV1{}, 1)
data, _ := f.Serialize(&MessageV1{ID: 1, Content: "Hello"})
```

### Java（使用较新 Schema 的消费端）

```java
public class Message {
    long id;
    String content;
    String author;  // New field in Java
}

Fory fory = Fory.builder().withXlang(true).build();
fory.register(Message.class, 1);
Message msg = fory.deserialize(data, Message.class);
// msg.author will be null
```

## 性能注意事项

兼容模式主要影响序列化大小：

| 方面          | `WithCompatible(false)` | 兼容模式                               |
| ------------- | ----------------------- | -------------------------------------- |
| 序列化大小    | 更小                    | 更大（包含元数据，尤其没有字段 ID 时） |
| 速度          | 快                      | 相近（元数据只是 memcpy）              |
| Schema 灵活性 | 要求相同 Schema         | 可添加、删除和重排字段                 |

**注意**：使用字段 ID（`fory:"id=N"`）可减小兼容模式中的元数据大小。

**建议**：以下场景使用兼容模式：

- 持久化存储
- 跨服务通信
- 长期缓存

只有每个读取端和写入端始终使用相同 Go 结构体 Schema，并且希望获得更快序列化和更小体积时，才使用 `WithCompatible(false)`。对于跨语言载荷，只有确认每种语言都使用相同 Schema，或原生类型由 Fory Schema IDL 生成时才使用 `WithCompatible(false)`。相同 Schema 的使用场景包括：

- 内存操作
- 相同 Schema 通信
- 更快序列化和更小体积

### 按结构体选择退出

对于单个结构体，可以通过实现 `ForyEvolving` 并返回 `false` 来退出演进元数据：

```go
type SameSchemaMessage struct {
    ID int64
}

func (SameSchemaMessage) ForyEvolving() bool {
    return false
}
```

## 错误处理

### 哈希不匹配（原生相同 Schema 模式）

```go
f := fory.New(fory.WithXlang(false), fory.WithCompatible(false))

// Schema changed without compatible mode
err := f.Deserialize(oldData, &newStruct)
// Error: ErrKindHashMismatch
```

### 未知字段

在兼容模式中，会静默跳过未知字段。要检测它们：

```go
// Currently, Fory skips unknown fields automatically
// No explicit API for detecting unknown fields
```

## 完整示例

```go
package main

import (
    "fmt"
    "github.com/apache/fory/go/fory"
)

// V1: Initial schema
type ProductV1 struct {
    ID    int64
    Name  string
    Price float64
}

// V2: Added fields
type ProductV2 struct {
    ID          int64
    Name        string
    Price       float64
    Description string  // New
    InStock     bool    // New
}

func main() {
    // Serialize with V1
    f1 := fory.New(fory.WithXlang(true))
    f1.RegisterStruct(ProductV1{}, 1)

    product := &ProductV1{ID: 1, Name: "Widget", Price: 9.99}
    data, _ := f1.Serialize(product)
    fmt.Printf("V1 serialized: %d bytes\n", len(data))

    // Deserialize with V2
    f2 := fory.New(fory.WithXlang(true))
    f2.RegisterStruct(ProductV2{}, 1)

    var productV2 ProductV2
    if err := f2.Deserialize(data, &productV2); err != nil {
        panic(err)
    }

    fmt.Printf("ID: %d\n", productV2.ID)
    fmt.Printf("Name: %s\n", productV2.Name)
    fmt.Printf("Price: %.2f\n", productV2.Price)
    fmt.Printf("Description: %q (zero value)\n", productV2.Description)
    fmt.Printf("InStock: %v (zero value)\n", productV2.InStock)
}
```

## 相关主题

- [配置](configuration.md)
- [跨语言序列化](xlang.md)
- [故障排查](troubleshooting.md)
