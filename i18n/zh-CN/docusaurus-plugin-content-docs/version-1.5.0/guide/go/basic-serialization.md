---
title: 基本序列化
sidebar_position: 20
id: basic_serialization
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

本指南介绍 Fory Go 的核心序列化 API。

## 创建 Fory 实例

在序列化前先创建 Fory 实例并注册类型：

```go
import "github.com/apache/fory/go/fory"

f := fory.New()

// Register struct with a type ID
f.RegisterStruct(User{}, 1)
f.RegisterStruct(Order{}, 2)

// Or register with a name (more flexible, less prone to ID conflicts, but higher serialization cost)
f.RegisterNamedStruct(User{}, "example.User")

// Register enum types
f.RegisterEnum(Color(0), 3)
```

**重要**：应在多次序列化调用间复用同一个 Fory 实例。创建新实例会分配内部缓冲区、类型缓存和解析器，开销较高。默认实例不是线程安全的；并发场景请使用线程安全封装（见 [线程安全](thread-safety.md)）。

更多内容请参考 [类型注册](type-registration.md)。

## 核心 API

### Serialize 与 Deserialize

最主要的序列化接口：

```go
// Serialize any value
data, err := f.Serialize(value)
if err != nil {
    // Handle error
}

// Deserialize into target
var result MyType
err = f.Deserialize(data, &result)
if err != nil {
    // Handle error
}
```

### Marshal 与 Unmarshal

`Serialize` 和 `Deserialize` 的别名（对 Go 开发者更熟悉）：

```go
data, err := f.Marshal(value)
err = f.Unmarshal(data, &result)
```

## 序列化基础类型

```go
// Integers
data, _ := f.Serialize(int64(42))
var i int64
f.Deserialize(data, &i)  // i = 42

// Floats
data, _ = f.Serialize(float64(3.14))
var fl float64
f.Deserialize(data, &fl)  // fl = 3.14

// Strings
data, _ = f.Serialize("hello")
var s string
f.Deserialize(data, &s)  // s = "hello"

// Booleans
data, _ = f.Serialize(true)
var b bool
f.Deserialize(data, &b)  // b = true
```

## 序列化集合类型

### Slice

```go
// String slice
strs := []string{"a", "b", "c"}
data, _ := f.Serialize(strs)

var result []string
f.Deserialize(data, &result)
// result = ["a", "b", "c"]

// Integer slice
nums := []int64{1, 2, 3}
data, _ = f.Serialize(nums)

var intResult []int64
f.Deserialize(data, &intResult)
// intResult = [1, 2, 3]
```

### Map

```go
// String to string map
m := map[string]string{"key": "value"}
data, _ := f.Serialize(m)

var result map[string]string
f.Deserialize(data, &result)
// result = {"key": "value"}

// String to int map
m2 := map[string]int64{"count": 42}
data, _ = f.Serialize(m2)

var result2 map[string]int64
f.Deserialize(data, &result2)
// result2 = {"count": 42}
```

## 序列化结构体

### 基础结构体序列化

只有**导出字段**（首字母大写）会被序列化：

```go
type User struct {
    ID       int64   // Serialized
    Name     string  // Serialized
    password string  // NOT serialized (unexported)
}

f.RegisterStruct(User{}, 1)

user := &User{ID: 1, Name: "Alice", password: "secret"}
data, _ := f.Serialize(user)

var result User
f.Deserialize(data, &result)
// result.ID = 1, result.Name = "Alice", result.password = ""
```

### 嵌套结构体

```go
type Address struct {
    City    string
    Country string
}

type Person struct {
    Name    string
    Address Address
}

f.RegisterStruct(Address{}, 1)
f.RegisterStruct(Person{}, 2)

person := &Person{
    Name: "Alice",
    Address: Address{City: "NYC", Country: "USA"},
}

data, _ := f.Serialize(person)

var result Person
f.Deserialize(data, &result)
// result.Address.City = "NYC"
```

### 指针字段

```go
type Node struct {
    Value int32
    Child *Node
}

// Use WithTrackRef for pointer fields
f := fory.New(fory.WithTrackRef(true))
f.RegisterStruct(Node{}, 1)

root := &Node{
    Value: 1,
    Child: &Node{Value: 2, Child: nil},
}

data, _ := f.Serialize(root)

var result Node
f.Deserialize(data, &result)
// result.Child.Value = 2
```

## 流式 API

当你希望自行管理缓冲区时可使用流式接口。

### SerializeTo

序列化到现有缓冲区：

```go
buf := fory.NewByteBuffer(nil)

// Serialize multiple values to same buffer
f.SerializeTo(buf, value1)
f.SerializeTo(buf, value2)

// Get all serialized data
data := buf.GetByteSlice(0, buf.WriterIndex())
```

### DeserializeFrom

从现有缓冲区反序列化：

```go
buf := fory.NewByteBuffer(data)

var result1, result2 MyType
f.DeserializeFrom(buf, &result1)
f.DeserializeFrom(buf, &result2)
```

## 泛型 API（类型安全）

Fory Go 提供了泛型函数用于类型安全的序列化：

```go
import "github.com/apache/fory/go/fory"

type User struct {
    ID   int64
    Name string
}

// Type-safe serialization
user := &User{ID: 1, Name: "Alice"}
data, err := fory.Serialize(f, user)

// Type-safe deserialization
var result User
err = fory.Deserialize(f, data, &result)
```

泛型 API 的优势：

- 在编译期推断类型
- 提供更好的类型安全
- 在某些场景下可获得性能收益

## 错误处理

务必检查序列化/反序列化返回的错误：

```go
data, err := f.Serialize(value)
if err != nil {
    switch e := err.(type) {
    case fory.Error:
        fmt.Printf("Fory error: %s (kind: %d)\n", e.Error(), e.Kind())
    default:
        fmt.Printf("Unknown error: %v\n", err)
    }
    return
}

err = f.Deserialize(data, &result)
if err != nil {
    // Handle deserialization error
}
```

常见错误类型：

- `ErrKindBufferOutOfBound`：读写越界
- `ErrKindTypeMismatch`：反序列化时类型 ID 不匹配
- `ErrKindUnknownType`：遇到未知类型
- `ErrKindMaxDepthExceeded`：超过递归深度限制
- `ErrKindHashMismatch`：结构体哈希不一致（schema 已变更）

排查建议见 [故障排查](troubleshooting.md)。

## Nil 处理

### Nil 指针

```go
var ptr *User = nil
data, _ := f.Serialize(ptr)

var result *User
f.Deserialize(data, &result)
// result = nil
```

### 空集合

```go
// Nil slice
var slice []string = nil
data, _ := f.Serialize(slice)

var result []string
f.Deserialize(data, &result)
// result = nil

// Empty slice (different from nil)
empty := []string{}
data, _ = f.Serialize(empty)

f.Deserialize(data, &result)
// result = [] (empty, not nil)
```

## 完整示例

```go
package main

import (
    "fmt"
    "github.com/apache/fory/go/fory"
)

type Order struct {
    ID       int64
    Customer string
    Items    []Item
    Total    float64
}

type Item struct {
    Name     string
    Quantity int32
    Price    float64
}

func main() {
    f := fory.New()
    f.RegisterStruct(Order{}, 1)
    f.RegisterStruct(Item{}, 2)

    order := &Order{
        ID:       12345,
        Customer: "Alice",
        Items: []Item{
            {Name: "Widget", Quantity: 2, Price: 9.99},
            {Name: "Gadget", Quantity: 1, Price: 24.99},
        },
        Total: 44.97,
    }

    // Serialize
    data, err := f.Serialize(order)
    if err != nil {
        panic(err)
    }
    fmt.Printf("Serialized %d bytes\n", len(data))

    // Deserialize
    var result Order
    if err := f.Deserialize(data, &result); err != nil {
        panic(err)
    }

    fmt.Printf("Order ID: %d\n", result.ID)
    fmt.Printf("Customer: %s\n", result.Customer)
    fmt.Printf("Items: %d\n", len(result.Items))
    fmt.Printf("Total: %.2f\n", result.Total)
}
```

## 相关主题

- [配置](configuration.md)
- [类型注册](type-registration.md)
- [支持类型](supported-types.md)
- [引用](references.md)
