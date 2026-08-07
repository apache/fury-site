---
title: 基础序列化
sidebar_position: 1
id: basic-serialization
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

本指南介绍 Fory Go 默认 xlang 模式下的核心序列化 API。

## 创建 Fory 实例

在序列化前创建 Fory 实例并注册类型：

```go
import "github.com/apache/fory/go/fory"

f := fory.New(fory.WithXlang(true))

// Register struct with a type ID
f.RegisterStruct(User{}, 1)
f.RegisterStruct(Order{}, 2)

// Or register with a name (more flexible, less prone to ID conflicts, but higher serialization cost)
f.RegisterStructByName(User{}, "example.User")

// Register enum types
f.RegisterEnum(Color(0), 3)
```

`fory.New()` 使用带兼容 Schema 演进的跨语言模式。示例显式设置 `fory.WithXlang(true)`，以清楚展示模式选择。对于需要原生模式的 Go 专属载荷，请在原生模式示例中显式配置 `fory.WithXlang(false)`。

**重要**：应在多次序列化调用间复用 Fory 实例。创建新实例需要分配内部缓冲区、类型缓存和解析器，成本较高。默认 Fory 实例不是线程安全的；并发使用时请使用线程安全包装器（参见[线程安全](thread-safety.md)）。

更多详情参见[类型注册](type-registration.md)。

## 核心 API

### 序列化与反序列化

主要序列化 API：

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

`Serialize` 和 `Deserialize` 的别名（Go 开发者更熟悉）：

```go
data, err := f.Marshal(value)
err = f.Unmarshal(data, &result)
```

## 序列化原始类型

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

## 序列化集合

### 切片

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

### 映射

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

### 基本结构体序列化

只序列化**导出字段**（以大写字母开头）：

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
f := fory.New(fory.WithXlang(true), fory.WithTrackRef(true))
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

适用于需要控制缓冲区的场景：

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

Fory Go 提供用于类型安全序列化的泛型函数：

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

泛型 API：

- 在编译期推断类型
- 提供更好的类型安全性
- 可能带来性能收益

## 错误处理

始终检查序列化操作返回的错误：

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

- `ErrKindBufferOutOfBound`：读写超出缓冲区边界
- `ErrKindTypeMismatch`：反序列化期间类型 ID 不匹配
- `ErrKindUnknownType`：遇到未知类型
- `ErrKindMaxDepthExceeded`：超出递归深度限制
- `ErrKindHashMismatch`：结构体哈希不匹配（Schema 已更改）

错误解决方法参见[故障排查](troubleshooting.md)。

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
    f := fory.New(fory.WithXlang(true))
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

## 跨语言互操作 {#cross-language-interoperability}

所有 Fory 实现都共用默认 xlang 格式。以下内容说明它的跨语言类型映射、类型标识和互操作要求。

Fory Go 支持与 Java、Python、C++、Rust、JavaScript/TypeScript、C#、Swift、Dart、Scala 和 Kotlin 无缝交换数据。本指南介绍跨语言兼容性和类型映射。

### Xlang 配置

Go 默认使用带兼容 Schema 演进的跨语言模式。跨语言示例中应显式设置模式：

```go
f := fory.New(fory.WithXlang(true))
```

### 跨语言类型注册

所有语言使用一致的类型 ID：

#### Go

```go
type User struct {
    ID   int64
    Name string
}

f := fory.New(fory.WithXlang(true))
f.RegisterStruct(User{}, 1)
data, _ := f.Serialize(&User{ID: 1, Name: "Alice"})
```

#### Java

```java
public class User {
    public long id;
    public String name;
}
Fory fory = Fory.builder().withXlang(true).build();
fory.register(User.class, 1);
User user = fory.deserialize(data, User.class);
```

#### Python

```python
from dataclasses import dataclass
import pyfory

@dataclass
class User:
    id: pyfory.Int64
    name: str

fory = pyfory.Fory(xlang=True)
fory.register(User, type_id=1)
user = fory.deserialize(data)
```

### 类型映射

各语言的详细类型映射参见[类型映射规范](../../specification/xlang_type_mapping.md)。

### 字段顺序

跨语言序列化要求字段顺序一致。Fory 按字段的 snake_case 名称以字母顺序排序。

Go 字段名称会转换为 snake_case 后排序：

```go
type Example struct {
    UserID    int64   // -> user_id
    FirstName string  // -> first_name
    Age       int32   // -> age
}

// Sorted order: age, first_name, user_id
```

确保其他语言使用能够产生相同 snake_case 顺序的匹配字段名称，或使用字段 ID 显式控制：

```go
type Example struct {
    UserID    int64  `fory:"id=0"`
    FirstName string `fory:"id=1"`
    Age       int32  `fory:"id=2"`
}
```

### 示例

#### Go 到 Java

**Go（序列化器）**：

```go
type Order struct {
    ID       int64
    Customer string
    Total    float64
    Items    []string
}

f := fory.New(fory.WithXlang(true))
f.RegisterStruct(Order{}, 1)

order := &Order{
    ID:       12345,
    Customer: "Alice",
    Total:    99.99,
    Items:    []string{"Widget", "Gadget"},
}
data, _ := f.Serialize(order)
// Send 'data' to Java service
```

**Java（反序列化器）**：

```java
public class Order {
    public long id;
    public String customer;
    public double total;
    public List<String> items;
}

Fory fory = Fory.builder().withXlang(true).build();
fory.register(Order.class, 1);

Order order = fory.deserialize(data, Order.class);
```

#### Python 到 Go

**Python（序列化器）**：

```python
from dataclasses import dataclass
import pyfory

@dataclass
class Message:
    id: pyfory.Int64
    content: str
    timestamp: pyfory.Int64

fory = pyfory.Fory(xlang=True)
fory.register(Message, type_id=1)

msg = Message(id=1, content="Hello from Python", timestamp=1234567890)
data = fory.serialize(msg)
```

**Go（反序列化器）**：

```go
type Message struct {
    ID        int64
    Content   string
    Timestamp int64
}

f := fory.New(fory.WithXlang(true))
f.RegisterStruct(Message{}, 1)

var msg Message
f.Deserialize(data, &msg)
fmt.Println(msg.Content)  // "Hello from Python"
```

#### 嵌套结构

跨语言嵌套结构要求注册所有类型：

### 列表与稠密数组

Go 切片通常是 `list<T>` 载体，除非字段标签显式请求稠密 `array<T>` Schema。`array<T>` 仅用于一维布尔或数值数据。

| Fory Schema       | Go 载体和标签示例                                      |
| ----------------- | ------------------------------------------------------ |
| `list<int32>`     | `[]int32` / `fory:"type=list(element=int32)"`          |
| `array<bool>`     | `[]bool` / `fory:"type=array(element=bool)"`           |
| `array<int8>`     | `[]int8` / `fory:"type=array(element=int8)"`           |
| `array<int16>`    | `[]int16` / `fory:"type=array(element=int16)"`         |
| `array<int32>`    | `[]int32` / `fory:"type=array(element=int32)"`         |
| `array<int64>`    | `[]int64` / `fory:"type=array(element=int64)"`         |
| `array<uint8>`    | `[]uint8` / `fory:"type=array(element=uint8)"`         |
| `array<uint16>`   | `[]uint16` / `fory:"type=array(element=uint16)"`       |
| `array<uint32>`   | `[]uint32` / `fory:"type=array(element=uint32)"`       |
| `array<uint64>`   | `[]uint64` / `fory:"type=array(element=uint64)"`       |
| `array<float16>`  | `[]float16.Float16` / `type=array(element=float16)`    |
| `array<bfloat16>` | `[]bfloat16.BFloat16` / `type=array(element=bfloat16)` |
| `array<float32>`  | `[]float32` / `fory:"type=array(element=float32)"`     |
| `array<float64>`  | `[]float64` / `fory:"type=array(element=float64)"`     |

**Go**:

```go
type Address struct {
    Street  string
    City    string
    Country string
}

type Company struct {
    Name    string
    Address Address
}

f := fory.New(fory.WithXlang(true))
f.RegisterStruct(Address{}, 1)
f.RegisterStruct(Company{}, 2)
```

**Java**:

```java
public class Address {
    public String street;
    public String city;
    public String country;
}

public class Company {
    public String name;
    public Address address;
}

fory.register(Address.class, 1);
fory.register(Company.class, 2);
```

### 常见问题

#### 字段名称不匹配

Go 使用 PascalCase，其他语言可能使用 camelCase 或 snake_case。字段按转换后的 snake_case 名称匹配：

```go
// Go
type User struct {
    FirstName string  // -> first_name
}

// Java - field name converted to snake_case must match
public class User {
    public String firstName;  // -> first_name (matches)
}
```

#### 类型解释

Go 无符号类型映射到位模式相同的 Java 有符号类型：

```go
var value uint64 = 18446744073709551615  // Max uint64
```

Java 的 `long` 保存相同位，但解释为 -1。如果需要无符号解释，请在 Java 中使用 `Long.toUnsignedString()`。

#### Nil 与 Null

Go nil 切片或映射会根据配置采用不同方式序列化：

```go
var slice []string = nil
// In xlang mode: serializes based on nullable configuration
```

确保其他语言正确处理 null。

### 互操作最佳实践

1. **使用一致的类型 ID**：所有语言中的同一类型使用相同数字 ID
2. **注册所有类型**：包括嵌套结构体类型
3. **匹配字段顺序**：使用相同 snake_case 名称或显式字段 ID
4. **测试跨语言互操作**：尽早并经常运行集成测试
5. **处理类型差异**：注意有符号和无符号解释差异

### 相关指南

- [类型注册](type-registration.md)
- [支持的类型](supported-types.md)
- [Schema 演进](schema-evolution.md)
- [跨语言序列化规范](../../specification/xlang_serialization_spec.md)
- [类型映射规范](../../specification/xlang_type_mapping.md)

### 内置值

```go
package main

import forygo "github.com/apache/fory/go/fory"
import "fmt"

func main() {
  list := []any{true, false, "str", -1.1, 1, make([]int32, 10), make([]float64, 20)}
  fory := forygo.NewFory(forygo.WithXlang(true))
  bytes, err := fory.Marshal(list)
  if err != nil {
    panic(err)
  }
  var newValue any
  // bytes can be deserialized by other languages
  if err := fory.Unmarshal(bytes, &newValue); err != nil {
    panic(err)
  }
  fmt.Println(newValue)
  dict := map[string]any{
    "k1": "v1",
    "k2": list,
    "k3": -1,
  }
  bytes, err = fory.Marshal(dict)
  if err != nil {
    panic(err)
  }
  // bytes can be deserialized by other languages
  if err := fory.Unmarshal(bytes, &newValue); err != nil {
    panic(err)
  }
  fmt.Println(newValue)
}
```

### 自定义值

```go
package main

import forygo "github.com/apache/fory/go/fory"
import "fmt"

func main() {
  type SomeClass1 struct {
    F1 any
    F2 map[int8]int32
  }

  type SomeClass2 struct {
    F1  any
    F2  string
    F3  []any
    F4  map[int8]int32
    F5  int8
    F6  int16
    F7  int32
    F8  int64
    F9  float32
    F10 float64
    F11 []int16
    F12 []int16
  }
  serializer := forygo.NewFory(forygo.WithXlang(true))
  if err := serializer.RegisterStructByName(SomeClass1{}, "example.SomeClass1"); err != nil {
    panic(err)
  }
  if err := serializer.RegisterStructByName(SomeClass2{}, "example.SomeClass2"); err != nil {
    panic(err)
  }
  obj1 := &SomeClass1{F1: true, F2: map[int8]int32{-1: 2}}
  obj := &SomeClass2{
    F1:  obj1,
    F2:  "abc",
    F3:  []any{"abc", "abc"},
    F4:  map[int8]int32{1: 2},
    F5:  127,
    F6:  32767,
    F7:  2147483647,
    F8:  9223372036854775807,
    F9:  1.0 / 2,
    F10: 1.0 / 3.0,
    F11: []int16{1, 2},
    F12: []int16{-1, 4},
  }
  bytes, err := serializer.Marshal(obj)
  if err != nil {
    panic(err)
  }
  var newValue any
  // bytes can be deserialized by other languages
  if err := serializer.Unmarshal(bytes, &newValue); err != nil {
    panic(err)
  }
  fmt.Println(newValue)
}
```

### 共享引用与循环引用

```go
package main

import forygo "github.com/apache/fory/go/fory"
import "fmt"

func main() {
  type SomeClass struct {
    F1 *SomeClass
    F2 map[string]string
    F3 map[string]string
  }
  fory := forygo.NewFory(forygo.WithXlang(true), forygo.WithTrackRef(true))
  if err := fory.RegisterStruct(SomeClass{}, 65); err != nil {
    panic(err)
  }
  value := &SomeClass{F2: map[string]string{"k1": "v1", "k2": "v2"}}
  value.F3 = value.F2
  value.F1 = value
  bytes, err := fory.Marshal(value)
  if err != nil {
    panic(err)
  }
  var newValue any
  // bytes can be deserialized by other languages
  if err := fory.Unmarshal(bytes, &newValue); err != nil {
    panic(err)
  }
  fmt.Println(newValue)
}
```

## 相关主题

- [配置](configuration.md)
- [类型注册](type-registration.md)
- [支持的类型](supported-types.md)
- [引用](references.md)
