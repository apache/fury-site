---
title: 类型注册
sidebar_position: 5
id: type-registration
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

类型注册告诉 Fory 如何标识并序列化自定义类型。结构体、枚举和扩展类型都必须注册。

## 为什么注册类型？

1. **类型标识**：Fory 需要在反序列化期间识别实际类型
2. **多态**：反序列化接口类型时，Fory 必须知道要创建哪种具体类型
3. **跨语言兼容性**：其他语言需要能够识别并反序列化这些类型

## 结构体注册

### 按 ID 注册

使用数字类型 ID 注册结构体，以获得紧凑序列化：

```go
type User struct {
    ID   int64
    Name string
}

f := fory.New(fory.WithXlang(true))
err := f.RegisterStruct(User{}, 1)
if err != nil {
    panic(err)
}
```

**ID 指南**：

- ID 在应用程序中必须唯一
- 跨语言序列化时，ID 必须在所有语言中保持一致
- 序列化器和反序列化器中的同一类型应使用相同 ID

### 按名称注册

使用类型名称字符串注册结构体。这种方式更灵活，但序列化成本更高：

```go
f := fory.New(fory.WithXlang(true))
err := f.RegisterStructByName(User{}, "example.User")
if err != nil {
    panic(err)
}
```

**名称指南**：

- 使用遵循 `namespace.TypeName` 约定的完全限定名称
- 名称必须唯一，并在所有语言中保持一致
- 名称区分大小写

## 枚举注册

Go 没有原生枚举，但可以将整数类型注册为枚举：

### 按 ID 注册

```go
type Status int32

const (
    StatusPending  Status = 0
    StatusActive   Status = 1
    StatusComplete Status = 2
)

f := fory.New(fory.WithXlang(true))
err := f.RegisterEnum(Status(0), 1)
```

### 按名称注册

```go
err := f.RegisterEnumByName(Status(0), "example.Status")
```

## 扩展类型

对于需要自定义序列化逻辑的类型，请使用自定义序列化器将其注册为扩展类型：

```go
f := fory.New(fory.WithXlang(true))

// Register by ID
err := f.RegisterExtension(CustomType{}, 1, &CustomSerializer{})

// Or register by name
err = f.RegisterExtensionByName(CustomType{}, "example.Custom", &CustomSerializer{})
```

实现 `ExtensionSerializer` 接口的详情参见[自定义序列化器](custom-serializers.md)。

## 注册作用域

类型注册以 Fory 实例为作用域：

```go
f1 := fory.New(fory.WithXlang(true))
f2 := fory.New(fory.WithXlang(true))

// Types registered on f1 are NOT available on f2
f1.RegisterStruct(User{}, 1)

// f2 cannot deserialize User unless also registered
f2.RegisterStruct(User{}, 1)
```

## 注册时机

创建 Fory 实例后、进行任何序列化或反序列化调用前注册类型：

```go
f := fory.New(fory.WithXlang(true))

// Register before use
f.RegisterStruct(User{}, 1)
f.RegisterStruct(Order{}, 2)

// Now serialize/deserialize
data, _ := f.Serialize(&User{ID: 1, Name: "Alice"})
```

## 嵌套类型注册

注册对象图中的所有结构体类型，包括嵌套类型：

```go
type Address struct {
    City    string
    Country string
}

type Person struct {
    Name    string
    Address Address
}

f := fory.New(fory.WithXlang(true))

// Register ALL struct types used in the object graph
f.RegisterStruct(Address{}, 1)
f.RegisterStruct(Person{}, 2)
```

## 跨语言注册

对于跨语言序列化，类型必须在所有语言中保持一致注册。

### 使用 ID

所有语言使用相同的数字 ID：

**Go**:

```go
f.RegisterStruct(User{}, 1)
```

**Java**:

```java
fory.register(User.class, 1);
```

**Python**:

```python
fory.register(User, type_id=1)
```

### 使用名称

所有语言使用相同的类型名称：

**Go**:

```go
f.RegisterStructByName(User{}, "example.User")
```

**Java**:

```java
fory.register(User.class, "example.User");
```

**Python**:

```python
fory.register_type(User, name="example.User")
```

**Rust**:

```rust
use fory::{Fory, ForyStruct};

#[derive(ForyStruct)]
struct User {
    id: i64,
    name: String,
}

let mut fory = Fory::default();
fory.register_by_name::<User>("example.User")?;
```

## 最佳实践

1. **尽早注册**：在应用程序启动时、任何序列化前注册所有类型
2. **保持一致**：所有语言和实例使用相同的 ID 或名称
3. **注册所有类型**：不仅注册顶层类型，也包括嵌套结构体类型
4. **性能优先时使用 ID**：数字 ID 的序列化开销低于名称
5. **灵活性优先时使用名称**：名称更易管理，也不容易冲突

## 常见错误

### 类型未注册

```
error: unknown type encountered
```

**解决方案**：在序列化或反序列化前注册类型。

### ID/名称不匹配

如果使用不同的 ID 或名称注册，则无法反序列化用某个 ID 或名称序列化的数据。

**解决方案**：序列化器和反序列化器使用一致的 ID 或名称。

### 重复注册

使用相同 ID 注册的两个类型会发生冲突。

**解决方案**：确保每个类型的 ID 唯一。

## 相关主题

- [基本序列化](core-api.md)
- [跨语言序列化](xlang.md)
- [支持的类型](supported-types.md)
- [故障排查](troubleshooting.md)
