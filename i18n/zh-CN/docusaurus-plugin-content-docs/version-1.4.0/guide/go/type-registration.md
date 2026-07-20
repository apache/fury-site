---
title: 类型注册
sidebar_position: 30
id: type_registration
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

类型注册用于告知 Fory 如何识别并序列化你的自定义类型。对于结构体、枚举和扩展类型，注册是必需的。

## 为什么要注册类型？

1. **类型识别**：反序列化时，Fory 需要知道实际类型
2. **多态支持**：反序列化接口类型时，Fory 需要知道要创建哪个具体类型
3. **跨语言兼容**：其他语言实现需要识别并反序列化你的类型

## 结构体注册

### 通过 ID 注册

使用数值类型 ID 注册结构体，可获得更紧凑的序列化结果：

```go
type User struct {
    ID   int64
    Name string
}

f := fory.New()
err := f.RegisterStruct(User{}, 1)
if err != nil {
    panic(err)
}
```

**ID 使用建议**：

- ID 在应用内必须唯一
- 若用于跨语言，所有语言中的 ID 必须一致
- 序列化端和反序列化端必须为同一类型使用同一 ID

### 通过名称注册

使用类型名字符串注册结构体。该方式更灵活，但序列化开销更高：

```go
f := fory.New()
err := f.RegisterNamedStruct(User{}, "example.User")
if err != nil {
    panic(err)
}
```

**名称使用建议**：

- 使用 `namespace.TypeName` 约定的全限定名
- 名称在所有语言中必须唯一且一致
- 名称区分大小写

## 枚举注册

Go 没有原生枚举类型，但可以把整数类型按枚举注册。

### 通过 ID 注册

```go
type Status int32

const (
    StatusPending  Status = 0
    StatusActive   Status = 1
    StatusComplete Status = 2
)

f := fory.New()
err := f.RegisterEnum(Status(0), 1)
```

### 通过名称注册

```go
err := f.RegisterNamedEnum(Status(0), "example.Status")
```

## 扩展类型

对于需要自定义序列化逻辑的类型，可将其注册为扩展类型，并提供自定义序列化器：

```go
f := fory.New()

// Register by ID
err := f.RegisterExtension(CustomType{}, 1, &CustomSerializer{})

// Or register by name
err = f.RegisterNamedExtension(CustomType{}, "example.Custom", &CustomSerializer{})
```

关于 `ExtensionSerializer` 接口实现，请参考 [自定义序列化器](custom-serializers.md)。

## 注册作用域

类型注册是 **Fory 实例级别** 的：

```go
f1 := fory.New()
f2 := fory.New()

// Types registered on f1 are NOT available on f2
f1.RegisterStruct(User{}, 1)

// f2 cannot deserialize User unless also registered
f2.RegisterStruct(User{}, 1)
```

## 注册时机

应在创建 Fory 实例后、首次序列化/反序列化之前完成类型注册：

```go
f := fory.New()

// Register before use
f.RegisterStruct(User{}, 1)
f.RegisterStruct(Order{}, 2)

// Now serialize/deserialize
data, _ := f.Serialize(&User{ID: 1, Name: "Alice"})
```

## 嵌套类型注册

对象图中的所有结构体类型（包括嵌套类型）都应注册：

```go
type Address struct {
    City    string
    Country string
}

type Person struct {
    Name    string
    Address Address
}

f := fory.New()

// Register ALL struct types used in the object graph
f.RegisterStruct(Address{}, 1)
f.RegisterStruct(Person{}, 2)
```

## 跨语言注册

进行跨语言序列化时，必须在所有语言中保持一致注册。

### 使用 ID

所有语言使用同一个数值 ID：

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

所有语言使用同一个类型名：

**Go**:

```go
f.RegisterNamedStruct(User{}, "example.User")
```

**Java**:

```java
fory.register(User.class, "example.User");
```

**Python**:

```python
fory.register(User, typename="example.User")
```

**Rust**:

```rust
#[derive(Fory)]
struct User {
    id: i64,
    name: String,
}

let mut fory = Fory::default();
fory.register_by_name::<User>("example.User")?;
```

## 最佳实践

1. **尽早注册**：应用启动后、任何序列化操作前完成全部类型注册
2. **保持一致**：所有语言与实例中使用一致的 ID 或名称
3. **注册完整**：不仅注册顶层类型，也要注册嵌套结构体
4. **性能优先时用 ID**：数值 ID 比名称开销更低
5. **灵活性优先时用名称**：名称更易维护，也更不易冲突

## 常见错误

### 类型未注册

```
error: unknown type encountered
```

**解决方式**：在序列化/反序列化前先注册类型。

### ID/名称不匹配

用某个 ID/名称序列化的数据，若在反序列化端使用不同 ID/名称注册，将无法正确反序列化。

**解决方式**：确保序列化端与反序列化端使用一致的 ID 或名称。

### 重复注册

两个类型使用同一 ID 会发生冲突。

**解决方式**：确保每个类型使用唯一 ID。

## 相关主题

- [基本序列化](basic-serialization.md)
- [跨语言序列化](xlang-serialization.md)
