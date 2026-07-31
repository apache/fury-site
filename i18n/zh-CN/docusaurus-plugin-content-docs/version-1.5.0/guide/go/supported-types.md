---
title: 支持的类型
sidebar_position: 7
id: supported_types
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

Fory Go 支持序列化多种 Go 类型。本指南覆盖所有支持的类型及其跨语言映射。

## 基本类型

| Go 类型          | Fory TypeId  | 编码                   | 说明                               |
| ---------------- | ------------ | ---------------------- | ---------------------------------- |
| `bool`           | BOOL (1)     | 1 字节                 |                                    |
| `int8`           | INT8 (2)     | 1 字节，有符号         |                                    |
| `int16`          | INT16 (3)    | 2 字节，有符号         | 小端序                             |
| `int32`          | INT32 (4)    | Varint                 | 变长编码                           |
| `int64`          | INT64 (6)    | Varint                 | 变长编码                           |
| `int`            | INT32/INT64  | Varint                 | 依平台而定（32 位或 64 位）        |
| `uint8` / `byte` | UINT8 (9)    | 1 字节，无符号         |                                    |
| `uint16`         | UINT16 (10)  | 2 字节，无符号         | 小端序                             |
| `uint32`         | UINT32 (11)  | Varuint                | 变长编码                           |
| `uint64`         | UINT64 (13)  | Varuint                | 变长编码                           |
| `float32`        | FLOAT32 (17) | 4 字节                 | IEEE 754                           |
| `float64`        | FLOAT64 (18) | 8 字节                 | IEEE 754                           |
| `string`         | STRING (19)  | 长度前缀 UTF-8         |                                    |

### 整数编码

Fory 使用变长整数编码（varint）来获得更好的压缩效果：

- 小数值使用更少字节
- 负数使用 ZigZag 编码
- 平台 `int` 在 32 位系统上映射为 `int32`，在 64 位系统上映射为 `int64`

```go
f := fory.New(fory.WithXlang(true))

// 支持所有整数类型
var i8 int8 = 127
var i16 int16 = 32767
var i32 int32 = 2147483647
var i64 int64 = 9223372036854775807

data, _ := f.Serialize(i64)  // 使用 varint 编码
```

## 集合类型

### 根值和动态 Slice

当 slice 作为根值或动态值序列化时，基本类型 slice 会使用密集 array 编码 tag，以便紧凑传输。在 struct 字段中，未注解的 Go slice 是逻辑 `list<T>` 字段；当 struct 字段是密集数字 `array<T>` 数据时，请使用 `fory:"type=array(element=...)"`。

| Go 类型         | Fory TypeId   | 说明                 |
| --------------- | ------------- | -------------------- |
| `[]bool`        | BOOL_ARRAY    | 优化编码             |
| `[]int8`        | INT8_ARRAY    | 优化编码             |
| `[]int16`       | INT16_ARRAY   | 优化编码             |
| `[]int32`       | INT32_ARRAY   | 优化编码             |
| `[]int64`       | INT64_ARRAY   | 优化编码             |
| `[]float32`     | FLOAT32_ARRAY | 优化编码             |
| `[]float64`     | FLOAT64_ARRAY | 优化编码             |
| `[]string`      | LIST          | 通用 list 编码       |
| `[]T`（任意）   | LIST (20)     | 任意可序列化类型     |
| `[]I`（any/any） | LIST          | 任意 interface 类型   |

```go
f := fory.New(fory.WithXlang(true))

// 基本类型根 slice（优化的密集 array 载荷）
ints := []int32{1, 2, 3, 4, 5}
data, _ := f.Serialize(ints)

// 字符串 slice
strs := []string{"a", "b", "c"}
data, _ = f.Serialize(strs)

// 结构体 slice
users := []User{{ID: 1}, {ID: 2}}
data, _ = f.Serialize(users)

// 动态 slice
dynamic := []any{1, "hello", true}
data, _ = f.Serialize(dynamic)
```

### Map

| Go 类型              | Fory TypeId | 说明              |
| -------------------- | ----------- | ----------------- |
| `map[string]string`  | MAP (22)    | 优化              |
| `map[string]int64`   | MAP         | 优化              |
| `map[string]int32`   | MAP         | 优化              |
| `map[string]int`     | MAP         | 优化              |
| `map[string]float64` | MAP         | 优化              |
| `map[string]bool`    | MAP         | 优化              |
| `map[int32]int32`    | MAP         | 优化              |
| `map[int64]int64`    | MAP         | 优化              |
| `map[int]int`        | MAP         | 优化              |
| `map[string]any`     | MAP         | 动态值            |
| `map[any]any`        | MAP         | 动态键和值        |

```go
f := fory.New(fory.WithXlang(true))

// 字符串键 map
m1 := map[string]string{"key": "value"}
m2 := map[string]int64{"count": 42}

// 整数键 map
m3 := map[int32]int32{1: 100, 2: 200}

// 动态 map
m4 := map[string]any{
    "name": "Alice",
    "age":  int64(30),
}
```

### Set

Fory 提供泛型 `Set[T]` 类型（使用 `map[T]struct{}`，零内存开销）：

```go
// 创建字符串 set
s := fory.NewSet[string]()
s.Add("a", "b", "c")

// 检查成员关系
if s.Contains("a") {
    fmt.Println("found")
}

// 序列化
data, _ := f.Serialize(s)
```

## 时间类型

| Go 类型         | Fory TypeId    | 说明        |
| --------------- | -------------- | ----------- |
| `time.Time`     | TIMESTAMP (34) | 纳秒精度    |
| `time.Duration` | DURATION (33)  | 纳秒精度    |

```go
import "time"

f := fory.New(fory.WithXlang(true))

// 时间戳
t := time.Now()
data, _ := f.Serialize(t)

// 持续时间
d := 5 * time.Second
data, _ = f.Serialize(d)
```

## Struct 类型

| 类别                    | Fory TypeId                  | 说明                    |
| ----------------------- | ---------------------------- | ----------------------- |
| Struct                  | STRUCT (25)                  | 按 ID 注册，无演进      |
| 兼容 Struct             | COMPATIBLE_STRUCT (26)       | 支持 Schema 演进        |
| 命名 Struct             | NAMED_STRUCT (27)            | 按名称注册，无演进      |
| 命名兼容 Struct         | NAMED_COMPATIBLE_STRUCT (28) | 按名称注册并支持演进    |

### Struct 要求

1. **仅导出字段**：以大写字母开头的字段会被序列化
2. **支持的字段类型**：本文档中列出的所有类型
3. **注册**：用于跨语言时应注册 struct

```go
type User struct {
    ID       int64   // 会序列化
    Name     string  // 会序列化
    Age      int32   // 会序列化
    password string  // 不会序列化（未导出）
}

f := fory.New(fory.WithXlang(true))
f.RegisterStruct(User{}, 1)

user := &User{ID: 1, Name: "Alice", Age: 30, password: "secret"}
data, _ := f.Serialize(user)
```

### 嵌套 Struct

```go
type Address struct {
    Street  string
    City    string
    Country string
}

type Company struct {
    Name    string
    Address Address
    Founded int32
}

f := fory.New(fory.WithXlang(true))
f.RegisterStruct(Address{}, 1)
f.RegisterStruct(Company{}, 2)
```

## 指针类型

| Go 类型 | 行为                           |
| ------- | ------------------------------ |
| `*T`    | 可为 nil，可引用跟踪（若启用） |
| `**T`   | 支持嵌套指针                   |

```go
f := fory.New(fory.WithXlang(true), fory.WithTrackRef(true))

type Node struct {
    Value int32
    Left  *Node
    Right *Node
}

f.RegisterStruct(Node{}, 1)

root := &Node{
    Value: 1,
    Left:  &Node{Value: 2},
    Right: &Node{Value: 3},
}

data, _ := f.Serialize(root)
```

### Nil 处理

```go
var ptr *User = nil
data, _ := f.Serialize(ptr)

var result *User
f.Deserialize(data, &result)
// result == nil
```

## Interface 类型

| Go 类型 | Fory TypeId | 说明       |
| ------- | ----------- | ---------- |
| `any`   | UNION (31)  | 多态值     |

```go
f := fory.New(fory.WithXlang(true))

// 序列化 any
var value any = "hello"
data, _ := f.Serialize(value)

var result any
f.Deserialize(data, &result)
// result = "hello"（string）
```

对于 struct interface，需要注册所有可能的具体类型：

```go
type Shape interface {
    Area() float64
}

type Circle struct {
    Radius float64
}

func (c Circle) Area() float64 {
    return 3.14159 * c.Radius * c.Radius
}

f := fory.New(fory.WithXlang(true))
f.RegisterStruct(Circle{}, 1)

var shape Shape = Circle{Radius: 5.0}
data, _ := f.Serialize(shape)
```

## 二进制数据

| Go 类型  | Fory TypeId | 说明       |
| -------- | ----------- | ---------- |
| `[]byte` | BINARY (37) | 变长字节   |

```go
f := fory.New(fory.WithXlang(true))

data := []byte{0x01, 0x02, 0x03, 0x04}
serialized, _ := f.Serialize(data)

var result []byte
f.Deserialize(serialized, &result)
```

## Enum 类型

Go 使用整数类型表示 enum：

```go
type Status int32

const (
    StatusPending  Status = 0
    StatusActive   Status = 1
    StatusComplete Status = 2
)

f := fory.New(fory.WithXlang(true))
f.RegisterEnum(Status(0), 1)

status := StatusActive
data, _ := f.Serialize(status)
```

## Xlang 类型映射

| Go 类型         | Java       | Python    | C++                | Rust           |
| --------------- | ---------- | --------- | ------------------ | -------------- |
| `bool`          | boolean    | bool      | bool               | bool           |
| `int8`          | byte       | int       | int8_t             | i8             |
| `int16`         | short      | int       | int16_t            | i16            |
| `int32`         | int        | int       | int32_t            | i32            |
| `int64`         | long       | int       | int64_t            | i64            |
| `float32`       | float      | float     | float              | f32            |
| `float64`       | double     | float     | double             | f64            |
| `string`        | String     | str       | std::string        | String         |
| `[]T`           | `List<T>`  | list      | `std::vector<T>`   | `Vec<T>`       |
| `map[K]V`       | `Map<K,V>` | dict      | std::unordered_map | `HashMap<K,V>` |
| `time.Time`     | Instant    | datetime  | -                  | -              |
| `time.Duration` | Duration   | timedelta | -                  | -              |

详细映射请参阅 [Xlang 序列化](xlang-serialization.md)。

## 不支持的类型

以下 Go 类型**不支持**：

- Channel（`chan T`）
- 函数（`func()`）
- 复数（`complex64`、`complex128`）
- Unsafe 指针（`unsafe.Pointer`）

尝试序列化这些类型会产生错误。

## 相关主题

- [类型注册](type-registration.md)
- [Xlang 序列化](xlang-serialization.md)
- [引用](references.md)
