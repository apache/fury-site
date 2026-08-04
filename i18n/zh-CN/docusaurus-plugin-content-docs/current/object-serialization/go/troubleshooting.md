---
title: 故障排查
sidebar_position: 90
id: troubleshooting
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

本指南介绍使用 Fory Go 时的常见问题及解决方案。

## 错误类型

Fory Go 使用带具体错误种类的类型化错误：

```go
type Error struct {
    kind    ErrorKind
    message string
    // Additional context fields
}

func (e Error) Kind() ErrorKind { return e.kind }
func (e Error) Error() string   { return e.message }
```

### 错误种类

| 种类                           | 值  | 说明                   |
| ------------------------------ | --- | ---------------------- |
| `ErrKindOK`                    | 0   | 无错误                 |
| `ErrKindBufferOutOfBound`      | 1   | 读写超出缓冲区边界     |
| `ErrKindTypeMismatch`          | 2   | 类型 ID 不匹配         |
| `ErrKindUnknownType`           | 3   | 遇到未知类型           |
| `ErrKindSerializationFailed`   | 4   | 常规序列化失败         |
| `ErrKindDeserializationFailed` | 5   | 常规反序列化失败       |
| `ErrKindMaxDepthExceeded`      | 6   | 超出递归深度限制       |
| `ErrKindNilPointer`            | 7   | 意外的 nil 指针        |
| `ErrKindInvalidRefId`          | 8   | 无效的引用 ID          |
| `ErrKindHashMismatch`          | 9   | 结构体哈希不匹配       |
| `ErrKindInvalidTag`            | 10  | 无效的 Fory 结构体标签 |

## 常见错误及解决方案

### ErrKindUnknownType

**错误**：`unknown type encountered`

**原因**：序列化或反序列化前未注册类型。

**解决方案**：

```go
f := fory.New()

// Register type before use
f.RegisterStruct(User{}, 1)

// Now serialization works
data, _ := f.Serialize(&User{ID: 1})
```

### ErrKindTypeMismatch

**错误**：`type mismatch: expected X, got Y`

**原因**：序列化数据的类型与预期不同。

**解决方案**：

1. **使用正确的目标类型**：

```go
// Wrong: Deserializing User into Order
var order Order
f.Deserialize(userData, &order)  // Error!

// Correct
var user User
f.Deserialize(userData, &user)
```

2. **确保注册一致**：

```go
// Serializer
f1 := fory.New()
f1.RegisterStruct(User{}, 1)

// Deserializer - must use same ID
f2 := fory.New()
f2.RegisterStruct(User{}, 1)  // Same ID!
```

### ErrKindHashMismatch

**错误**：`hash X is not consistent with Y for type Z`

**原因**：序列化和反序列化之间结构体定义发生变化。

**解决方案**：

1. **保持启用兼容模式**：

```go
// Remove any WithCompatible(false) override from the peers.
f := fory.New(/* existing options */)
```

2. **确保结构体定义匹配**：

```go
// Both serializer and deserializer must have same struct
type User struct {
    ID   int64
    Name string
}
```

### ErrKindMaxDepthExceeded

**错误**：`max depth exceeded`

**原因**：数据嵌套超过最大深度限制。

**可能原因**：

- 深层嵌套数据结构超过默认限制（20）
- 存在意外循环引用，但未启用引用跟踪
- **恶意数据**：攻击者可能构造深层嵌套载荷以耗尽资源

**解决方案**：

1. **增大最大深度**（默认值为 20）：

```go
f := fory.New(fory.WithMaxDepth(50))
```

2. **启用引用跟踪**（用于循环数据）：

```go
f := fory.New(fory.WithTrackRef(true))
```

3. **检查数据中是否存在意外循环引用**。

4. **验证不可信数据**：反序列化来自不可信来源的数据时，不要盲目增大最大深度。应考虑在反序列化前验证输入大小和结构。

### ErrKindBufferOutOfBound

**错误**：`buffer out of bound: offset=X, need=Y, size=Z`

**原因**：读取超出可用数据范围。

**解决方案**：

1. **确保数据传输完整**：

```go
// Wrong: Truncated data
data := fullData[:100]
f.Deserialize(data, &target)  // Error if data was larger

// Correct: Use full data
f.Deserialize(fullData, &target)
```

2. **检查数据损坏**：验证传输期间的数据完整性。

### ErrKindInvalidRefId

**错误**：`invalid reference ID`

**原因**：序列化数据引用了不存在或未知的对象。

**解决方案**：

1. **确保引用跟踪设置一致**：

```go
// Serializer and deserializer must have same setting
f1 := fory.New(fory.WithTrackRef(true))
f2 := fory.New(fory.WithTrackRef(true))  // Must match!
```

2. **检查数据是否损坏**。

### ErrKindInvalidTag

**错误**：`invalid fory struct tag`

**原因**：结构体标签配置无效。

**常见原因**：

1. **标签 ID 无效**：ID 必须为非负数

```go
// Wrong: negative ID
type Bad struct {
    Field int `fory:"id=-5"`
}

// Correct
type Good struct {
    Field int `fory:"id=0"`
}
```

2. **标签 ID 重复**：结构体中的每个字段必须具有唯一 ID

```go
// Wrong: duplicate IDs
type Bad struct {
    Field1 int `fory:"id=0"`
    Field2 int `fory:"id=0"`  // Duplicate!
}

// Correct
type Good struct {
    Field1 int `fory:"id=0"`
    Field2 int `fory:"id=1"`
}
```

## 跨语言问题

### 字段顺序不匹配

**现象**：数据可以反序列化，但字段值错误。

**原因**：不同语言的字段顺序不同。禁用兼容模式时，字段按 snake_case 名称排序。CamelCase 字段名称（例如 `FirstName`）会转换为 snake_case（例如 `first_name`）后排序。

**解决方案**：

1. **确保转换后的 snake_case 名称一致**：各语言的字段名称必须产生相同的 snake_case 顺序：

```go
type User struct {
    FirstName string  // Go: FirstName -> first_name
    LastName  string  // Go: LastName -> last_name
    // Sorted alphabetically by snake_case: first_name, last_name
}
```

2. **使用字段 ID 保持顺序一致**：字段 ID（非负整数）作为字段名称的别名，同时用于排序和反序列化期间的字段匹配：

```go
type User struct {
    FirstName string `fory:"id=0"`
    LastName  string `fory:"id=1"`
}
```

确保各语言的对应字段使用相同字段 ID。

### 名称注册不匹配

**现象**：其他语言出现 `unknown type`。

**解决方案**：使用完全相同的名称：

```go
// Go
f.RegisterStructByName(User{}, "example.User")

// Java - must match exactly
fory.register(User.class, "example.User");

// Python
fory.register_type(User, name="example.User")
```

## 性能问题

### 序列化缓慢

**可能原因**：

1. **大型对象图**：减小数据大小或增量序列化。

2. **引用跟踪过多**：不需要时禁用：

```go
f := fory.New(fory.WithTrackRef(false))
```

3. **嵌套过深**：尽可能扁平化数据结构。

### 内存用量过高

**可能原因**：

1. **序列化数据过大**：分块处理。

2. **引用跟踪开销**：不需要时禁用。

3. **缓冲区未释放**：复用缓冲区：

```go
buf := fory.NewByteBuffer(nil)
f.SerializeTo(buf, value)
// Process data
buf.Reset()  // Reuse for next serialization
```

### 线程竞争

**现象**：并发负载下速度下降。

**解决方案**：

1. 热路径**每个 goroutine 使用独立实例**：

```go
func worker() {
    f := fory.New()  // Each worker has own instance
    for task := range tasks {
        f.Serialize(task)
    }
}
```

2. 使用线程安全包装器时**分析池使用情况**。

## 调试技巧

### 启用调试输出

设置环境变量：

```bash
ENABLE_FORY_DEBUG_OUTPUT=1 go test ./...
```

### 检查序列化数据

```go
data, _ := f.Serialize(value)
fmt.Printf("Serialized %d bytes\n", len(data))
fmt.Printf("Header: %x\n", data[:4])  // Magic + flags
```

### 检查类型注册

```go
// Verify type is registered
f := fory.New()
err := f.RegisterStruct(User{}, 1)
if err != nil {
    fmt.Printf("Registration failed: %v\n", err)
}
```

### 比较结构体哈希

出现哈希不匹配时，请比较结构体定义：

```go
// Print struct info for debugging
t := reflect.TypeOf(User{})
for i := 0; i < t.NumField(); i++ {
    f := t.Field(i)
    fmt.Printf("Field: %s, Type: %s\n", f.Name, f.Type)
}
```

## 测试技巧

### 测试往返序列化

```go
func TestRoundTrip(t *testing.T) {
    f := fory.New()
    f.RegisterStruct(User{}, 1)

    original := &User{ID: 1, Name: "Alice"}

    data, err := f.Serialize(original)
    require.NoError(t, err)

    var result User
    err = f.Deserialize(data, &result)
    require.NoError(t, err)

    assert.Equal(t, original.ID, result.ID)
    assert.Equal(t, original.Name, result.Name)
}
```

### 测试跨语言互操作

```bash
cd java/fory-core
FORY_GO_JAVA_CI=1 mvn test -Dtest=org.apache.fory.xlang.GoXlangTest
```

### 测试 Schema 演进

```go
func TestSchemaEvolution(t *testing.T) {
    f1 := fory.New()
    f1.RegisterStruct(UserV1{}, 1)

    data, _ := f1.Serialize(&UserV1{ID: 1, Name: "Alice"})

    f2 := fory.New()
    f2.RegisterStruct(UserV2{}, 1)

    var result UserV2
    err := f2.Deserialize(data, &result)
    require.NoError(t, err)
}
```

## 获取帮助

如果遇到本文未涵盖的问题：

1. **查看 GitHub Issue**：[github.com/apache/fory/issues](https://github.com/apache/fory/issues)
2. **启用调试输出**：`ENABLE_FORY_DEBUG_OUTPUT=1`
3. **创建最小复现**：隔离问题
4. **报告问题**：包含 Go 版本、Fory 版本和最小代码

## 相关主题

- [配置](configuration.md)
- [跨语言序列化](basic-serialization.md#cross-language-interoperability)
- [Schema 演进](schema-evolution.md)
- [线程安全](thread-safety.md)
