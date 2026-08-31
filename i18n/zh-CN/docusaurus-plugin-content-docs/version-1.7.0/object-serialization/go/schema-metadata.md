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

Fory Go 使用结构体标签自定义字段级序列化行为，从而精细控制各字段的序列化方式。

## 标签语法

Fory 结构体标签的一般语法：

```go
type MyStruct struct {
    Field Type `fory:"option1,option2=value"`
}
```

多个选项使用逗号（`,`）分隔。

## 可用标签

### 字段 ID

使用 `id=N` 为字段分配数字 ID，以获得紧凑编码：

```go
type User struct {
    ID   int64  `fory:"id=0"`
    Name string `fory:"id=1"`
    Age  int32  `fory:"id=2"`
}
```

**优势**：

- 序列化体积更小（数字 ID 相比字段名称）
- 序列化和反序列化更快
- 获得最佳跨语言兼容性所必需

**说明**：

- ID 在结构体中必须唯一
- ID 必须 >= 0
- 未指定时使用字段名称（载荷更大）

### 忽略字段

使用 `-` 将字段排除在序列化之外：

```go
type User struct {
    ID       int64
    Name     string
    Password string `fory:"-"`  // Not serialized
}
```

`Password` 字段不会包含在序列化输出中，反序列化后保持零值。

### 可空性

使用 `nullable` 控制是否为指针、切片、映射或接口字段写入 null 标志：

```go
type Record struct {
    // Write null flag for this field (allows nil values)
    OptionalData *Data `fory:"nullable"`

    // Skip null flag (field must not be nil)
    RequiredData *Data `fory:"nullable=false"`
}
```

**说明**：

- 仅适用于指针、切片、映射和接口字段
- `nullable=false` 时，序列化 nil 值会导致错误
- 跨语言模式中，顶层结构体字段只有指针和 `optional` 载体字段默认可空。原生模式中，指针、切片、映射和接口字段默认可空。

### 引用跟踪

控制切片、映射或结构体指针字段的字段级引用跟踪：

```go
type Container struct {
    // Enable reference tracking for this field
    SharedData *Data `fory:"ref"`

    // Disable reference tracking for this field
    SimpleData *Data `fory:"ref=false"`
}
```

**说明**：

- 适用于切片、映射和结构体指针字段
- 原始类型指针（例如 `*int`、`*string`）不能使用此标签
- 默认值为 `ref=false`（不跟踪引用）
- 全局设置 `WithTrackRef(false)` 时忽略字段引用标签
- 全局设置 `WithTrackRef(true)` 时，可使用 `ref=false` 对特定字段禁用

**使用场景**：

- 对可能形成循环或被共享的字段启用
- 对始终唯一的字段禁用（优化）

### 编码

使用 `encoding` 控制数值字段的编码方式：

```go
type Metrics struct {
    // Variable-length encoding (default, smaller for small values)
    Count int64 `fory:"encoding=varint"`

    // Fixed-length encoding (consistent size)
    Timestamp int64 `fory:"encoding=fixed"`

    // Tagged encoding (includes type tag)
    Value int64 `fory:"encoding=tagged"`
}
```

**支持的编码**：

| 类型     | 选项                        | 默认值   |
| -------- | --------------------------- | -------- |
| `int32`  | `varint`, `fixed`           | `varint` |
| `uint32` | `varint`, `fixed`           | `varint` |
| `int64`  | `varint`, `fixed`, `tagged` | `varint` |
| `uint64` | `varint`, `fixed`, `tagged` | `varint` |

**使用时机**：

- `varint`：最适合通常较小的值（默认）
- `fixed`：最适合使用完整范围的值（例如时间戳、哈希）
- `tagged`：需要保留类型信息时

### 类型覆盖

使用 `type=` 覆盖推断出的载体语义或嵌套值编码：

```go
type Foo struct {
    // Force general list protocol.
    Values []int32 `fory:"type=list"`

    // Override inner integer encoding for a general list
    FixedValues []int32 `fory:"type=list(element=int32(encoding=fixed))"`

    // Override nested map/list integer encoding
    Nested map[string][]*uint64 `fory:"type=map(value=list(element=uint64(encoding=tagged)))"`

    // Declare dense numeric array schema explicitly.
    Dense []int32 `fory:"type=array(element=int32)"`

    // Use array schema inside a map value.
    Packed map[string][]int32 `fory:"type=map(value=array(element=int32))"`
}
```

**说明**：

- `list(...)`、`array(...)`、`set(...)` 和 `map(...)` 是显式容器覆盖
- `list(...)` 始终使用列表 Schema，绝不会折叠为稠密数组 Schema
- `array(element=...)` 要求布尔或数值元素范围，并拒绝可空元素和标量编码修饰符

## 组合标签

多个标签可使用逗号分隔并组合：

```go
type Document struct {
    ID      int64  `fory:"id=0,encoding=fixed"`
    Content string `fory:"id=1"`
    Author  *User  `fory:"id=2,nullable=false,ref"`
}
```

## 与其他标签集成

Fory 标签可以与其他结构体标签共存：

```go
type User struct {
    ID       int64  `json:"id" fory:"id=0"`
    Name     string `json:"name,omitempty" fory:"id=1"`
    Password string `json:"-" fory:"-"`
}
```

每个标签命名空间相互独立。

## 字段可见性

只考虑**导出字段**（以大写字母开头）：

```go
type User struct {
    ID       int64  // Serialized
    Name     string // Serialized
    password string // NOT serialized (unexported, no tag needed)
}
```

无论是否带标签，未导出字段始终会被忽略。

## 字段顺序

字段按以下规则以一致顺序序列化：

1. 字段名称（按 snake_case 字母顺序）
2. 字段类型

这可在字段顺序重要时确保跨语言兼容性。

## 结构体哈希

Fory 计算结构体字段哈希用于版本检查：

- 哈希包含字段名称和类型
- 将哈希写入序列化数据
- 不匹配会触发 `ErrKindHashMismatch`

结构体字段变更会影响哈希：

```go
// These produce different hashes
type V1 struct {
    UserID int64
}

type V2 struct {
    UserId int64  // Different field name = different hash
}
```

## 示例

### API 响应结构体

```go
type APIResponse struct {
    Status    int32  `json:"status" fory:"id=0"`
    Message   string `json:"message" fory:"id=1"`
    Data      any    `json:"data" fory:"id=2"`
    Internal  string `json:"-" fory:"-"`  // Ignored in both JSON and Fory
}
```

### 使用共享引用进行缓存

```go
type CacheEntry struct {
    Key       string
    Value     *CachedData `fory:"ref"`      // May be shared
    Metadata  *Metadata   `fory:"ref=false"` // Always unique
    ExpiresAt int64
}
```

### 包含循环引用的文档

```go
type Document struct {
    ID       int64
    Title    string
    Parent   *Document   `fory:"ref"`  // May reference self or siblings
    Children []*Document `fory:"ref"`
}
```

## 标签解析错误

无效标签会在注册期间产生错误：

```go
type BadStruct struct {
    Field int `fory:"invalid=option=format"`
}

f := fory.New(fory.WithXlang(true))
err := f.RegisterStruct(BadStruct{}, 1)
// Error: ErrKindInvalidTag
```

## 原生模式与跨语言模式

字段配置会根据序列化模式表现出不同的行为：

**原生模式**：

- **可空性**：指针、切片、映射和接口类型默认可空
- **引用跟踪**：默认禁用（未设置 `ref` 标签）

**跨语言模式**：

- **可空性**：指针和 `optional.Optional[T]` 字段默认可空（切片、映射和接口除非带标签，否则不可空）
- **引用跟踪**：默认禁用（未设置 `ref` 标签）

以下情况**需要配置字段**：

- 字段可以为 nil（使用 `*string`、`*int32` 等指针类型）
- 字段需要跟踪共享或循环对象引用（使用 `fory:"ref"`）
- 希望减小元数据大小（通过 `fory:"id=N"` 使用字段 ID）

```go
// Xlang mode: explicit configuration required
type User struct {
    ID    int64   `fory:"id=0"`
    Name  string  `fory:"id=1"`
    Email *string `fory:"id=2"`           // Pointer type for nullable
    Friend *User  `fory:"id=3,ref"`       // Must declare ref for shared objects
}
```

### 默认值摘要

| 选项       | 默认值                                                                                          | 启用方式                                          |
| ---------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| `nullable` | xlang 模式中的指针和 `optional.Optional[T]` 字段；原生模式中的指针、切片、map 和 interface 字段 | 使用 `fory:"nullable"` 或 `fory:"nullable=false"` |
| `ref`      | `false`                                                                                         | 添加 `fory:"ref"` 标签                            |
| `id`       | 省略                                                                                            | 添加 `fory:"id=N"` 标签                           |

## 最佳实践

1. **对敏感数据使用 `-`**：密码、令牌、内部状态
2. **对共享对象启用引用跟踪**：同一指针多次出现时
3. **对简单字段禁用引用跟踪**：确定字段唯一时用于优化
4. **保持名称一致**：跨语言名称应匹配
5. **记录标签用法**：尤其是并不直观的配置

## 常见模式

### 忽略计算字段

```go
type Rectangle struct {
    Width  float64
    Height float64
    Area   float64 `fory:"-"`  // Computed, don't serialize
}

func (r *Rectangle) ComputeArea() {
    r.Area = r.Width * r.Height
}
```

### 带父级的循环结构

```go
type TreeNode struct {
    Value    string
    Parent   *TreeNode   `fory:"ref"`  // Circular back-reference
    Children []*TreeNode `fory:"ref"`
}
```

### 混合序列化需求

```go
type Session struct {
    ID        string
    UserID    int64
    Token     string    `fory:"-"`           // Security: don't serialize
    User      *User     `fory:"ref"`    // May be shared across sessions
    CreatedAt int64
}
```

## 相关主题

- [引用](references.md)
- [基本序列化](basic-serialization.md)
- [Schema 演进](schema-evolution.md)
