---
title: 故障排查
sidebar_position: 13
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

本指南介绍使用 Fory Go 时的常见问题和解决方案。

## 错误类型

Fory Go 使用带有具体错误种类的类型化错误：

```go
type Error struct {
    kind    ErrorKind
    message string
    // 额外上下文字段
}

func (e Error) Kind() ErrorKind { return e.kind }
func (e Error) Error() string   { return e.message }
```

### 错误种类

| 种类                           | 值    | 说明                         |
| ------------------------------ | ----- | ---------------------------- |
| `ErrKindOK`                    | 0     | 无错误                       |
| `ErrKindBufferOutOfBound`      | 1     | 读/写超出 buffer 边界        |
| `ErrKindTypeMismatch`          | 2     | 类型 ID 不匹配               |
| `ErrKindUnknownType`           | 3     | 遇到未知类型                 |
| `ErrKindSerializationFailed`   | 4     | 一般序列化失败               |
| `ErrKindDeserializationFailed` | 5     | 一般反序列化失败             |
| `ErrKindMaxDepthExceeded`      | 6     | 超过递归深度限制             |
| `ErrKindNilPointer`            | 7     | 意外的 nil 指针              |
| `ErrKindInvalidRefId`          | 8     | 无效引用 ID                  |
| `ErrKindHashMismatch`          | 9     | Struct 哈希不匹配            |
| `ErrKindInvalidTag`            | 10    | 无效的 fory struct tag       |

## 常见错误和解决方案

### ErrKindUnknownType

**错误**：`unknown type encountered`

**原因**：序列化/反序列化前未注册类型。

**解决方案**：

```go
f := fory.New()

// 使用前注册类型
f.RegisterStruct(User{}, 1)

// 现在可以序列化
data, _ := f.Serialize(&User{ID: 1})
```

### ErrKindTypeMismatch

**错误**：`type mismatch: expected X, got Y`

**原因**：序列化数据的类型与预期类型不同。

**解决方案**：

1. **使用正确的目标类型**：

```go
// 错误：将 User 反序列化为 Order
var order Order
f.Deserialize(userData, &order)  // 错误！

// 正确
var user User
f.Deserialize(userData, &user)
```

2. **确保注册一致**：

```go
// 序列化端
f1 := fory.New()
f1.RegisterStruct(User{}, 1)

// 反序列化端必须使用相同 ID
f2 := fory.New()
f2.RegisterStruct(User{}, 1)  // 相同 ID！
```

### ErrKindHashMismatch

**错误**：`hash X is not consistent with Y for type Z`

**原因**：序列化和反序列化之间 struct 定义发生变化。

**解决方案**：

1. **启用兼容模式**：

```go
// 在每个对端的同一组选项中添加 WithCompatible(true)。
f := fory.New(/* 现有选项 */, fory.WithCompatible(true))
```

2. **确保 struct 定义匹配**：

```go
// 序列化端和反序列化端必须使用相同 struct
type User struct {
    ID   int64
    Name string
}
```

### ErrKindMaxDepthExceeded

**错误**：`max depth exceeded`

**原因**：数据嵌套超过最大深度限制。

**可能原因**：

- 深层嵌套的数据结构超过默认限制（20）
- 未启用引用跟踪时出现非预期的循环引用
- **恶意数据**：攻击者可能构造深层嵌套载荷来耗尽资源

**解决方案**：

1. **增加最大深度**（默认值为 20）：

```go
f := fory.New(fory.WithMaxDepth(50))
```

2. **启用引用跟踪**（用于循环数据）：

```go
f := fory.New(fory.WithTrackRef(true))
```

3. **检查数据中是否存在非预期的循环引用**。

4. **验证不可信数据**：从不可信来源反序列化数据时，不要盲目提高最大深度。应考虑在反序列化前验证输入尺寸和结构。

### ErrKindBufferOutOfBound

**错误**：`buffer out of bound: offset=X, need=Y, size=Z`

**原因**：读取超出可用数据范围。

**解决方案**：

1. **确保完整传输数据**：

```go
// 错误：截断数据
data := fullData[:100]
f.Deserialize(data, &target)  // 如果原始数据更大则会报错

// 正确：使用完整数据
f.Deserialize(fullData, &target)
```

2. **检查数据损坏**：验证传输过程中的数据完整性。

### ErrKindInvalidRefId

**错误**：`invalid reference ID`

**原因**：序列化数据中引用了不存在或未知的对象。

**解决方案**：

1. **确保引用跟踪设置一致**：

```go
// 序列化端和反序列化端必须使用相同设置
f1 := fory.New(fory.WithTrackRef(true))
f2 := fory.New(fory.WithTrackRef(true))  // 必须匹配！
```

2. **检查数据损坏**。

### ErrKindInvalidTag

**错误**：`invalid fory struct tag`

**原因**：struct tag 配置无效。

**常见原因**：

1. **无效 tag ID**：ID 必须为非负数

```go
// 错误：负 ID
type Bad struct {
    Field int `fory:"id=-5"`
}

// 正确
type Good struct {
    Field int `fory:"id=0"`
}
```

2. **重复 tag ID**：同一个 struct 内每个字段都必须有唯一 ID

```go
// 错误：重复 ID
type Bad struct {
    Field1 int `fory:"id=0"`
    Field2 int `fory:"id=0"`  // 重复！
}

// 正确
type Good struct {
    Field1 int `fory:"id=0"`
    Field2 int `fory:"id=1"`
}
```

## Xlang 问题

### 字段顺序不匹配

**症状**：数据可以反序列化，但字段值错误。

**原因**：不同语言之间字段排序不同。在 schema-consistent 模式中，字段按其 snake_case 名称排序。CamelCase 字段名（例如 `FirstName`）会转换为 snake_case（例如 `first_name`）再参与排序。

**解决方案**：

1. **确保转换后的 snake_case 名称一致**：跨语言字段名必须产生相同的 snake_case 排序：

```go
type User struct {
    FirstName string  // Go: FirstName -> first_name
    LastName  string  // Go: LastName -> last_name
    // 按 snake_case 字母序排序：first_name, last_name
}
```

2. **使用字段 ID 获得一致排序**：字段 ID（非负整数）作为字段名别名，在反序列化期间同时用于排序和字段匹配：

```go
type User struct {
    FirstName string `fory:"id=0"`
    LastName  string `fory:"id=1"`
}
```

确保所有语言中对应字段使用相同的字段 ID。

### 名称注册不匹配

**症状**：其他语言中出现 `unknown type`。

**解决方案**：使用完全相同的名称：

```go
// Go
f.RegisterStructByName(User{}, "example.User")

// Java - 必须完全匹配
fory.register(User.class, "example.User");

// Python
fory.register(User, typename="example.User")
```

## 性能问题

### 序列化慢

**可能原因**：

1. **大型对象图**：减少数据尺寸或增量序列化。

2. **过度引用跟踪**：不需要时禁用：

```go
f := fory.New(fory.WithTrackRef(false))
```

3. **深层嵌套**：尽可能扁平化数据结构。

### 内存使用高

**可能原因**：

1. **大型序列化数据**：分块处理。

2. **引用跟踪开销**：不需要时禁用。

3. **Buffer 未释放**：复用 buffer：

```go
buf := fory.NewByteBuffer(nil)
f.SerializeTo(buf, value)
// 处理数据
buf.Reset()  // 复用于下一次序列化
```

### 线程竞争

**症状**：并发负载下变慢。

**解决方案**：

1. **热路径使用每 goroutine 一个实例**：

```go
func worker() {
    f := fory.New()  // 每个 worker 都有自己的实例
    for task := range tasks {
        f.Serialize(task)
    }
}
```

2. **分析线程安全包装器的池使用情况**。

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
fmt.Printf("Header: %x\n", data[:4])  // Magic + 标志
```

### 检查类型注册

```go
// 验证类型已注册
f := fory.New()
err := f.RegisterStruct(User{}, 1)
if err != nil {
    fmt.Printf("Registration failed: %v\n", err)
}
```

### 比较 Struct 哈希

如果遇到哈希不匹配，请比较 struct 定义：

```go
// 打印 struct 信息用于调试
t := reflect.TypeOf(User{})
for i := 0; i < t.NumField(); i++ {
    f := t.Field(i)
    fmt.Printf("Field: %s, Type: %s\n", f.Name, f.Type)
}
```

## 测试提示

### 测试往返

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

### 测试 Xlang

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

如果遇到本文未覆盖的问题：

1. **查看 GitHub Issues**：[github.com/apache/fory/issues](https://github.com/apache/fory/issues)
2. **启用调试输出**：`ENABLE_FORY_DEBUG_OUTPUT=1`
3. **创建最小复现**：隔离问题
4. **报告问题**：包含 Go 版本、Fory 版本和最小代码

## 相关主题

- [配置](configuration.md)
- [Xlang 序列化](xlang-serialization.md)
- [Schema 演进](schema-evolution.md)
- [线程安全](thread-safety.md)
