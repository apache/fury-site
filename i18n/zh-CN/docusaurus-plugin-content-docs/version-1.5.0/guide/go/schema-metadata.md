---
title: Schema 元数据
sidebar_position: 5
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

Fory Go 使用 struct tag 自定义字段级序列化行为。这样可以细粒度控制各个字段的序列化方式。

## Tag 语法

Fory struct tag 的通用语法如下：

```go
type MyStruct struct {
    Field Type `fory:"option1,option2=value"`
}
```

多个选项用逗号（`,`）分隔。

## 可用 Tag

### 字段 ID

使用 `id=N` 为字段分配数字 ID，以便进行紧凑编码：

```go
type User struct {
    ID   int64  `fory:"id=0"`
    Name string `fory:"id=1"`
    Age  int32  `fory:"id=2"`
}
```

**优势**：

- 序列化尺寸更小（数字 ID 相比字段名更紧凑）
- 序列化/反序列化更快
- 这是获得最佳跨语言兼容性的必要条件

**说明**：

- ID 在同一个 struct 内必须唯一
- ID 必须大于等于 0
- 如果未指定，将使用字段名（载荷更大）

### 忽略字段

使用 `-` 将字段排除在序列化之外：

```go
type User struct {
    ID       int64
    Name     string
    Password string `fory:"-"`  // 不序列化
}
```

`Password` 字段不会包含在序列化输出中，反序列化后会保持零值。

### 可空

使用 `nullable` 控制是否为指针、slice、map 或 interface 字段写入空值标志：

```go
type Record struct {
    // 为此字段写入空值标志（允许 nil 值）
    OptionalData *Data `fory:"nullable"`

    // 跳过空值标志（字段不能为 nil）
    RequiredData *Data `fory:"nullable=false"`
}
```

**说明**：

- 仅适用于指针、slice、map 和 interface 字段
- 当 `nullable=false` 时，序列化 nil 值会导致错误
- Xlang 模式下，顶层 struct 字段默认只会让指针和 `optional` carrier 字段可空。Native 模式下，指针、slice、map 和 interface 字段默认可空。

### 引用跟踪

控制 slice、map 或指向 struct 的指针字段的逐字段引用跟踪：

```go
type Container struct {
    // 为此字段启用引用跟踪
    SharedData *Data `fory:"ref"`

    // 为此字段禁用引用跟踪
    SimpleData *Data `fory:"ref=false"`
}
```

**说明**：

- 适用于 slice、map 和指向 struct 的指针字段
- 指向基本类型的指针（例如 `*int`、`*string`）不能使用此 tag
- 默认值为 `ref=false`（不启用引用跟踪）
- 设置全局 `WithTrackRef(false)` 时，字段 ref tag 会被忽略
- 设置全局 `WithTrackRef(true)` 时，可用 `ref=false` 为特定字段禁用引用跟踪

**使用场景**：

- 可能存在循环引用或共享引用的字段应启用
- 始终唯一的字段可禁用（优化）

### 编码

使用 `encoding` 控制数字字段的编码方式：

```go
type Metrics struct {
    // 变长编码（默认，小数值更小）
    Count int64 `fory:"encoding=varint"`

    // 定长编码（尺寸固定）
    Timestamp int64 `fory:"encoding=fixed"`

    // 带 tag 编码（包含类型 tag）
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

**何时使用**：

- `varint`：最适合经常较小的值（默认）
- `fixed`：最适合使用完整取值范围的值（例如时间戳、哈希）
- `tagged`：需要保留类型信息时使用

### 类型覆盖

使用 `type=` 覆盖推断得到的 carrier 语义或嵌套值编码：

```go
type Foo struct {
    // 强制使用通用 list 协议。
    Values []int32 `fory:"type=list"`

    // 为通用 list 覆盖内部整数编码
    FixedValues []int32 `fory:"type=list(element=int32(encoding=fixed))"`

    // 覆盖嵌套 map/list 的整数编码
    Nested map[string][]*uint64 `fory:"type=map(value=list(element=uint64(encoding=tagged)))"`

    // 显式声明密集数字数组 schema。
    Dense []int32 `fory:"type=array(element=int32)"`

    // 在 map 值中使用 array schema。
    Packed map[string][]int32 `fory:"type=map(value=array(element=int32))"`
}
```

**说明**：

- `list(...)`、`array(...)`、`set(...)` 和 `map(...)` 是显式容器覆盖
- `list(...)` 始终使用 list schema，绝不会折叠为密集 array schema
- `array(element=...)` 要求元素域为 bool 或数字类型，并拒绝可空元素和标量编码修饰符

## 组合 Tag

多个 tag 可以用逗号分隔符组合：

```go
type Document struct {
    ID      int64  `fory:"id=0,encoding=fixed"`
    Content string `fory:"id=1"`
    Author  *User  `fory:"id=2,nullable=false,ref"`
}
```

## 与其他 Tag 集成

Fory tag 可以与其他 struct tag 共存：

```go
type User struct {
    ID       int64  `json:"id" fory:"id=0"`
    Name     string `json:"name,omitempty" fory:"id=1"`
    Password string `json:"-" fory:"-"`
}
```

每个 tag 命名空间都是独立的。

## 字段可见性

只会考虑**导出字段**（以大写字母开头）：

```go
type User struct {
    ID       int64  // 会序列化
    Name     string // 会序列化
    password string // 不会序列化（未导出，无需 tag）
}
```

无论是否带 tag，未导出字段都会被忽略。

## 字段排序

字段按以下规则以一致顺序序列化：

1. 字段名（按 snake_case 字母序）
2. 字段类型

这能在字段顺序重要的场景中保证跨语言兼容性。

## Struct 哈希

Fory 会计算 struct 字段的哈希，用于版本检查：

- 哈希包含字段名和类型
- 哈希会写入序列化数据
- 不匹配会触发 `ErrKindHashMismatch`

Struct 字段变更会影响哈希：

```go
// 这些会产生不同的哈希
type V1 struct {
    UserID int64
}

type V2 struct {
    UserId int64  // 字段名不同 = 哈希不同
}
```

## 示例

### API 响应 Struct

```go
type APIResponse struct {
    Status    int32  `json:"status" fory:"id=0"`
    Message   string `json:"message" fory:"id=1"`
    Data      any    `json:"data" fory:"id=2"`
    Internal  string `json:"-" fory:"-"`  // 在 JSON 和 Fory 中都忽略
}
```

### 使用共享引用进行缓存

```go
type CacheEntry struct {
    Key       string
    Value     *CachedData `fory:"ref"`      // 可能被共享
    Metadata  *Metadata   `fory:"ref=false"` // 始终唯一
    ExpiresAt int64
}
```

### 带循环引用的 Document

```go
type Document struct {
    ID       int64
    Title    string
    Parent   *Document   `fory:"ref"`  // 可能引用自身或兄弟节点
    Children []*Document `fory:"ref"`
}
```

## Tag 解析错误

无效 tag 会在注册期间产生错误：

```go
type BadStruct struct {
    Field int `fory:"invalid=option=format"`
}

f := fory.New(fory.WithXlang(true))
err := f.RegisterStruct(BadStruct{}, 1)
// 错误：ErrKindInvalidTag
```

## Native 模式与 Xlang 模式

字段配置会因序列化模式而异：

**Native 模式**：

- **可空**：指针、slice、map 和 interface 类型默认可空
- **引用跟踪**：默认禁用（未设置 `ref` tag）

**Xlang 模式**：

- **可空**：指针和 `optional.Optional[T]` 字段默认可空（slice、map 和 interface 除非带 tag，否则不可空）
- **引用跟踪**：默认禁用（未设置 `ref` tag）

在以下场景中，你**需要配置字段**：

- 字段可能为 nil（使用 `*string`、`*int32` 等指针类型）
- 字段需要为共享/循环对象启用引用跟踪（使用 `fory:"ref"`）
- 想减少元数据尺寸（使用 `fory:"id=N"` 字段 ID）

```go
// Xlang 模式：需要显式配置
type User struct {
    ID    int64   `fory:"id=0"`
    Name  string  `fory:"id=1"`
    Email *string `fory:"id=2"`           // 用指针类型表示可空
    Friend *User  `fory:"id=3,ref"`       // 共享对象必须声明 ref
}
```

### 默认值摘要

| 选项       | 默认值                                                                                                             | 启用方式                                         |
| ---------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------ |
| `nullable` | Xlang 模式中的指针和 `optional.Optional[T]` 字段；native 模式中的指针、slice、map 和 interface 字段                | 使用 `fory:"nullable"` 或 `fory:"nullable=false"` |
| `ref`      | `false`                                                                                                            | 添加 `fory:"ref"` tag                            |
| `id`       | 省略                                                                                                               | 添加 `fory:"id=N"` tag                           |

## 最佳实践

1. **对敏感数据使用 `-`**：密码、token、内部状态
2. **为共享对象启用引用跟踪**：当同一个指针出现多次时
3. **为简单字段禁用引用跟踪**：当你知道字段唯一时可作为优化
4. **保持名称一致**：跨语言名称应保持一致
5. **记录 tag 用法**：尤其是非显而易见的配置

## 常见模式

### 忽略计算字段

```go
type Rectangle struct {
    Width  float64
    Height float64
    Area   float64 `fory:"-"`  // 计算值，不序列化
}

func (r *Rectangle) ComputeArea() {
    r.Area = r.Width * r.Height
}
```

### 带 Parent 的循环结构

```go
type TreeNode struct {
    Value    string
    Parent   *TreeNode   `fory:"ref"`  // 循环反向引用
    Children []*TreeNode `fory:"ref"`
}
```

### 混合序列化需求

```go
type Session struct {
    ID        string
    UserID    int64
    Token     string    `fory:"-"`           // 安全：不要序列化
    User      *User     `fory:"ref"`    // 可能跨 session 共享
    CreatedAt int64
}
```

## 相关主题

- [引用](references.md)
- [基础序列化](basic-serialization.md)
- [Schema 演进](schema-evolution.md)
