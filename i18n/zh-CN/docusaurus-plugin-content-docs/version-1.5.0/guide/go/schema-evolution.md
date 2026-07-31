---
title: Schema 演进
sidebar_position: 9
id: schema_evolution
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

Schema 演进允许数据结构随时间变化，同时保持与先前序列化数据的兼容性。Fory Go 通过兼容模式支持这一点。Xlang 模式默认使用兼容的 Schema 演进；native 模式默认使用 schema-consistent 载荷，并显式启用兼容模式。

## 兼容模式默认值

对于跨语言和默认 Go 载荷，请使用默认运行时：

```go
f := fory.New(fory.WithXlang(true))
```

对于需要 Schema 演进的仅 Go native-mode 载荷，请显式启用兼容模式：

```go
f := fory.New(fory.WithXlang(false), fory.WithCompatible(true))
```

## 工作方式

### Schema-Consistent Native 模式

- 紧凑序列化，不写入元数据
- 反序列化期间会检查 struct 哈希
- 任何 schema 变更都会导致 `ErrKindHashMismatch`

### 使用兼容模式

- 类型元数据会写入序列化数据
- 支持添加、移除和重排字段
- 启用向前和向后兼容

### 为稳定 Struct 禁用演进

如果 struct schema 稳定且不会变化，可以为该 struct 禁用演进，以避免兼容元数据开销。实现 `ForyEvolving` 接口并返回 `false`：

```go
type StableMessage struct {
    ID int64
}

func (StableMessage) ForyEvolving() bool {
    return false
}
```

## 支持的 Schema 变更

### 添加字段

可以添加新字段；反序列化旧数据时，这些字段会获得零值：

```go
// 版本 1
type UserV1 struct {
    ID   int64
    Name string
}

// 版本 2（添加 Email）
type UserV2 struct {
    ID    int64
    Name  string
    Email string  // 新字段
}

f := fory.New(fory.WithXlang(true))
f.RegisterStruct(UserV1{}, 1)

// 使用 V1 序列化
userV1 := &UserV1{ID: 1, Name: "Alice"}
data, _ := f.Serialize(userV1)

// 使用 V2 反序列化
f2 := fory.New(fory.WithXlang(true))
f2.RegisterStruct(UserV2{}, 1)

var userV2 UserV2
f2.Deserialize(data, &userV2)
// userV2.Email = ""（零值）
```

### 移除字段

反序列化时会跳过被移除的字段：

```go
// 版本 1
type ConfigV1 struct {
    Host     string
    Port     int32
    Timeout  int64
    Debug    bool  // 将被移除
}

// 版本 2（移除 Debug）
type ConfigV2 struct {
    Host    string
    Port    int32
    Timeout int64
    // Debug 字段已移除
}

f := fory.New(fory.WithXlang(true))
f.RegisterStruct(ConfigV1{}, 1)

// 使用 V1 序列化
config := &ConfigV1{Host: "localhost", Port: 8080, Timeout: 30, Debug: true}
data, _ := f.Serialize(config)

// 使用 V2 反序列化
f2 := fory.New(fory.WithXlang(true))
f2.RegisterStruct(ConfigV2{}, 1)

var configV2 ConfigV2
f2.Deserialize(data, &configV2)
// Debug 字段数据会被跳过
```

### 重排字段

字段顺序可以在版本之间变化：

```go
// 版本 1
type PersonV1 struct {
    FirstName string
    LastName  string
    Age       int32
}

// 版本 2（重新排序）
type PersonV2 struct {
    Age       int32   // 上移
    LastName  string
    FirstName string  // 下移
}
```

兼容模式会通过按名称匹配字段自动处理这种变化。

## 不兼容变更

即使在兼容模式中，也不支持某些变更：

### 类型变更

```go
// 不支持
type V1 struct {
    Value int32  // int32
}

type V2 struct {
    Value string  // 改为 string，不兼容
}
```

### 重命名字段

```go
// 不支持（会被视为移除 + 添加）
type V1 struct {
    UserName string
}

type V2 struct {
    Username string  // 名称不同，不是重命名
}
```

这会被视为移除 `UserName` 并添加 `Username`，从而导致数据丢失。

## 最佳实践

### 1. 对持久化数据使用兼容模式

```go
// 默认 xlang 载荷已经使用兼容模式。
f := fory.New(fory.WithXlang(true))
```

对于存储在数据库、文件或缓存中的仅 Go native-mode 数据，请启用兼容模式：

```go
f := fory.New(fory.WithXlang(false), fory.WithCompatible(true))
```

### 2. 提供默认值

```go
type ConfigV2 struct {
    Host    string
    Port    int32
    Timeout int64
    Retries int32  // 新字段
}

func NewConfigV2() *ConfigV2 {
    return &ConfigV2{
        Retries: 3,  // 默认值
    }
}

// 反序列化后，应用默认值
if config.Retries == 0 {
    config.Retries = 3
}
```

## Xlang Schema 演进

Schema 演进可跨语言工作：

### Go（生产者）

```go
type MessageV1 struct {
    ID      int64
    Content string
}

f := fory.New(fory.WithXlang(true))
f.RegisterStruct(MessageV1{}, 1)
data, _ := f.Serialize(&MessageV1{ID: 1, Content: "Hello"})
```

### Java（使用较新 schema 的消费者）

```java
public class Message {
    long id;
    String content;
    String author;  // Java 中的新字段
}

Fory fory = Fory.builder().withXlang(true).build();
fory.register(Message.class, 1);
Message msg = fory.deserialize(data, Message.class);
// msg.author 将为 null
```

## 性能注意事项

兼容模式主要影响序列化尺寸：

| 方面            | Schema Consistent | 兼容模式                                      |
| --------------- | ----------------- | --------------------------------------------- |
| 序列化尺寸      | 更小              | 更大（包含元数据，尤其是没有字段 ID 时）      |
| 速度            | 快                | 类似（元数据只是 memcpy）                     |
| Schema 灵活性   | 无                | 完整                                          |

**说明**：在兼容模式中使用字段 ID（`fory:"id=N"`）可以减少元数据尺寸。

**建议**：以下场景使用兼容模式：

- 持久化存储
- 跨服务通信
- 长期缓存

以下场景使用 native schema-consistent 模式：

- 内存内操作
- 同版本通信
- 最小序列化尺寸

## 错误处理

### 哈希不匹配（Native Schema-Consistent 模式）

```go
f := fory.New(fory.WithXlang(false))  // 兼容模式禁用

// 未启用兼容模式时 schema 发生变化
err := f.Deserialize(oldData, &newStruct)
// 错误：ErrKindHashMismatch
```

### 未知字段

在兼容模式中，未知字段会被静默跳过。要检测它们：

```go
// 目前，Fory 会自动跳过未知字段
// 没有用于检测未知字段的显式 API
```

## 完整示例

```go
package main

import (
    "fmt"
    "github.com/apache/fory/go/fory"
)

// V1：初始 schema
type ProductV1 struct {
    ID    int64
    Name  string
    Price float64
}

// V2：添加字段
type ProductV2 struct {
    ID          int64
    Name        string
    Price       float64
    Description string  // 新增
    InStock     bool    // 新增
}

func main() {
    // 使用 V1 序列化
    f1 := fory.New(fory.WithXlang(true))
    f1.RegisterStruct(ProductV1{}, 1)

    product := &ProductV1{ID: 1, Name: "Widget", Price: 9.99}
    data, _ := f1.Serialize(product)
    fmt.Printf("V1 serialized: %d bytes\n", len(data))

    // 使用 V2 反序列化
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
- [Xlang 序列化](xlang-serialization.md)
- [故障排查](troubleshooting.md)
