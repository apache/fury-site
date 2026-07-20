---
title: Xlang 序列化
sidebar_position: 2
id: xlang_serialization
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

Fory Go 支持与 Java、Python、C++、Rust、JavaScript 无缝交换数据。本指南介绍跨语言兼容与类型映射要点。

## 启用xlang 模式

需要显式开启跨语言（xlang）模式：

```go
f := fory.New(fory.WithXlang(true))
```

## 跨语言类型注册

在所有语言中使用一致的类型 ID：

### Go

```go
type User struct {
    ID   int64
    Name string
}

f := fory.New(fory.WithXlang(true))
f.RegisterStruct(User{}, 1)
data, _ := f.Serialize(&User{ID: 1, Name: "Alice"})
```

### Java

```java
public class User {
    public long id;
    public String name;
}
Fory fory = Fory.builder().withXlang(true).build();
fory.register(User.class, 1);
User user = fory.deserialize(data, User.class);
```

### Python

```python
from dataclasses import dataclass
import pyfory

@dataclass
class User:
    id: pyfory.Int64Type
    name: str

fory = pyfory.Fory()
fory.register(User, type_id=1)
user = fory.deserialize(data)
```

## 类型映射

不同语言间完整类型映射请参考 [类型映射规范](https://fory.apache.org/docs/specification/xlang_type_mapping)。

## 字段顺序

xlang 序列化要求字段顺序一致。Fory 会将字段名转为 snake_case 后按字母序排序。

Go 字段名会先转 snake_case：

```go
type Example struct {
    UserID    int64   // -> user_id
    FirstName string  // -> first_name
    Age       int32   // -> age
}

// Sorted order: age, first_name, user_id
```

请确保其他语言使用能产生相同 snake_case 顺序的字段名；或通过字段 ID 显式控制：

```go
type Example struct {
    UserID    int64  `fory:"id=0"`
    FirstName string `fory:"id=1"`
    Age       int32  `fory:"id=2"`
}
```

## 示例

### Go 到 Java

**Go（序列化端）**：

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

**Java（反序列化端）**：

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

### Python 到 Go

**Python（序列化端）**：

```python
from dataclasses import dataclass
import pyfory

@dataclass
class Message:
    id: pyfory.Int64Type
    content: str
    timestamp: pyfory.Int64Type

fory = pyfory.Fory()
fory.register(Message, type_id=1)

msg = Message(id=1, content="Hello from Python", timestamp=1234567890)
data = fory.serialize(msg)
```

**Go（反序列化端）**：

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

### 嵌套结构

跨语言嵌套结构要求相关类型全部注册：

**Go**：

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

**Java**：

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

## 常见问题

### 字段名不匹配

Go 常用 PascalCase，其他语言可能是 camelCase 或 snake_case。Fory 按 snake_case 转换结果做字段匹配：

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

### 类型语义差异

Go 的无符号类型在 Java 中会映射到相同比特位的有符号类型：

```go
var value uint64 = 18446744073709551615  // Max uint64
```

Java `long` 持有相同比特位，但按有符号解释为 `-1`。若需无符号语义，可在 Java 中使用 `Long.toUnsignedString()`。

### Nil 与 Null

Go 的 nil slice/map 在不同配置下序列化方式不同：

```go
var slice []string = nil
// In xlang mode: serializes based on nullable configuration
```

请确保其他语言端能正确处理 null。

## 最佳实践

1. **统一 type ID**：同一类型在所有语言中使用相同数值 ID
2. **完整注册类型**：包括嵌套结构体类型
3. **统一字段顺序**：使用一致 snake_case，或使用显式字段 ID
4. **尽早做跨语言集成测试**：持续验证兼容性
5. **注意类型语义差异**：特别是有符号/无符号解释差异

## 相关主题

- [类型注册](type-registration.md)
- [支持类型](supported-types.md)
- [Schema 演进](schema-evolution.md)
