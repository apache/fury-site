---
title: 配置
sidebar_position: 4
id: configuration
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

Fory Go 使用函数式选项模式进行配置，既能自定义序列化行为，又能保留合理的默认设置。

## 创建 Fory 实例

### 默认配置

```go
import "github.com/apache/fory/go/fory"

f := fory.New(fory.WithXlang(true))
```

默认设置：

| 选项                            | 默认值    | 说明                                    |
| ------------------------------- | --------- | --------------------------------------- |
| TrackRef                        | false     | 禁用引用跟踪                            |
| MaxDepth                        | 20        | 最大嵌套深度                            |
| IsXlang                         | true      | 启用跨语言模式                          |
| Compatible                      | true      | 启用兼容 Schema 演进元数据              |
| MaxGraphMemoryBytes             | 134217728 | 每次根读取的近似对象图内存限制          |
| MaxUnbackedContainerItems       | 8192      | 每次根读取中无输入支撑的集合/映射工作量 |
| MaxTypeFields                   | 512       | 一个已接收结构体元数据主体的最大字段数  |
| MaxTypeMetaBytes                | 4096      | 一个已接收元数据主体的最大编码字节数    |
| MaxSchemaVersionsPerType        | 10        | 一个逻辑类型的最大远端元数据版本数      |
| MaxAverageSchemaVersionsPerType | 3         | 各类型的平均远端元数据版本数            |

### 使用选项

```go
f := fory.New(
    fory.WithXlang(true),
    fory.WithTrackRef(true),
    fory.WithMaxDepth(10),
    fory.WithMaxGraphMemoryBytes(128 * 1024 * 1024),
    fory.WithMaxUnbackedContainerItems(8192),
    fory.WithMaxTypeFields(512),
    fory.WithMaxTypeMetaBytes(4096),
    fory.WithMaxSchemaVersionsPerType(10),
    fory.WithMaxAverageSchemaVersionsPerType(3),
)
```

## 配置项

### WithTrackRef

启用引用跟踪以处理循环引用和共享对象：

```go
f := fory.New(fory.WithTrackRef(true))
```

**启用时：**

- 多次出现的对象只序列化一次
- 正确处理循环引用
- 字段级 `fory:"ref"` 标签生效
- 跟踪对象标识会增加开销

**禁用时（默认）：**

- 每次出现的对象都独立序列化
- 循环引用会导致栈溢出或最大深度错误
- 忽略字段级 `fory:"ref"` 标签
- 对简单数据结构性能更好

**以下情况使用引用跟踪：**

- 数据包含循环引用
- 同一对象被多次引用
- 序列化图结构（带父指针的树、包含环的链表）

详情参见[引用](references.md)。

### WithCompatible

跨语言模式和原生模式都默认启用兼容模式。只有每个读取端和写入端始终使用相同 Schema，并且希望获得更快序列化和更小体积时，才设置 `WithCompatible(false)`：

```go
f := fory.New(fory.WithCompatible(false))
```

**启用时：**

- 将类型元数据写入序列化数据
- 支持在版本之间添加或删除字段
- 使用字段名称或 ID 匹配（与顺序无关）
- 元数据会增大序列化输出

**禁用时：**

- 序列化更快，体积更小
- 按排序后的顺序匹配字段
- 要求所有服务的结构体定义一致

对于跨语言载荷，只有确认每种语言都使用相同 Schema，或原生类型由 Fory Schema IDL 生成时才使用 `WithCompatible(false)`。详情参见 [Schema 演进](schema-evolution.md)。

### WithMaxDepth

设置最大嵌套深度以防止栈溢出：

```go
f := fory.New(fory.WithMaxDepth(30))
```

- 默认值：20
- 防范深层嵌套、递归结构或恶意数据
- 超出限制时序列化失败并返回错误

### WithMaxGraphMemoryBytes

为一次根反序列化设置近似对象图内存限制：

```go
f := fory.New(fory.WithMaxGraphMemoryBytes(256 * 1024 * 1024))
```

该估算主要覆盖实例化的切片、映射、集合、数组、结构体和对象。字符串、二进制数据、原始标量和原始稠密数组等叶值不计入，因此实际进程内存可能高于此值。

所有根输入形式的默认限制固定为 `128 MiB`。正值会覆盖默认值；运行时创建时会拒绝显式设置的非正值。对象图内存预留是字节可用性检查的补充，而不是替代。未计入的叶值仍受剩余输入字节限制：如果未读输入没有足够字节，Fory 不会读取或创建该叶值。

### WithMaxUnbackedContainerItems

限制一次根反序列化中重复读取主体未按比例消耗输入的集合元素和映射条目：

```go
f := fory.New(fory.WithMaxUnbackedContainerItems(8192))
```

默认值为 `8192`；零表示严格限制。

### WithMaxTypeFields

设置一个已接收远端结构体元数据主体可接受的最大字段数：

```go
f := fory.New(fory.WithMaxTypeFields(512))
```

### WithMaxTypeMetaBytes

设置一个已接收 TypeDef 主体可接受的最大编码字节数，不包括 8 字节头部和任何扩展大小变长整数：

```go
f := fory.New(fory.WithMaxTypeMetaBytes(4096))
```

### WithMaxSchemaVersionsPerType

设置一个逻辑类型可接受的远端元数据版本上限：

```go
f := fory.New(fory.WithMaxSchemaVersionsPerType(10))
```

### WithMaxAverageSchemaVersionsPerType

设置已接受远端类型的平均可接受远端元数据版本数。有效的全局下限为 `8192` 个 Schema：

```go
f := fory.New(fory.WithMaxAverageSchemaVersionsPerType(3))
```

### WithXlang

选择编码模式：

```go
native := fory.New(fory.WithXlang(false))
xlang := fory.New(fory.WithXlang(true))
```

**启用时：**

- 使用跨语言类型系统
- 与 Java、Python、C++、Rust、JavaScript/TypeScript、C#、Swift、Dart、Scala 和 Kotlin 兼容
- 类型 ID 遵循跨语言规范

**禁用时：**

- Go 原生序列化模式
- 支持更多 Go 原生类型行为
- 与其他语言实现不兼容

## 线程安全

默认 `Fory` 实例**不是线程安全的**。并发使用时请使用线程安全包装器：

```go
import "github.com/apache/fory/go/fory/threadsafe"

// Create thread-safe Fory with same options
f := threadsafe.New(
    fory.WithXlang(true),
    fory.WithTrackRef(true),
)

// Safe for concurrent use from multiple goroutines
go func() {
    data, _ := f.Serialize(value1)
    // data is already copied, safe to use after return
}()
go func() {
    data, _ := f.Serialize(value2)
}()
```

线程安全包装器：

- 内部使用 `sync.Pool` 高效复用实例
- 返回前自动复制序列化数据
- 接受与 `fory.New()` 相同的配置选项

### 全局线程安全实例

为方便使用，threadsafe 包提供全局函数：

```go
import "github.com/apache/fory/go/fory/threadsafe"

// Uses a global thread-safe instance with default configuration
data, err := threadsafe.Marshal(&myValue)
err = threadsafe.Unmarshal(data, &result)
```

详情参见[线程安全](thread-safety.md)。

## 缓冲区管理

### 零拷贝行为

默认 `Fory` 实例会复用内部缓冲区：

```go
f := fory.New(fory.WithXlang(true))

data1, _ := f.Serialize(value1)
// WARNING: data1 becomes invalid after next Serialize call!
data2, _ := f.Serialize(value2)
// data1 now points to invalid memory

// To keep the data, copy it:
safeCopy := make([]byte, len(data1))
copy(safeCopy, data1)
```

线程安全包装器会自动复制数据，因此无需担心此问题：

```go
f := threadsafe.New(fory.WithXlang(true))
data1, _ := f.Serialize(value1)
data2, _ := f.Serialize(value2)
// Both data1 and data2 are valid
```

### 手动控制缓冲区

高吞吐场景可以手动管理缓冲区：

```go
f := fory.New(fory.WithXlang(true))
buf := fory.NewByteBuffer(nil)

// Serialize to existing buffer
err := f.SerializeTo(buf, value)

// Get serialized data
data := buf.GetByteSlice(0, buf.WriterIndex())

// Process data...

// Reset for next use
buf.Reset()
```

## 配置示例

### 简单跨语言数据

对于不含循环引用的简单结构体：

```go
f := fory.New(fory.WithXlang(true))

type Config struct {
    Host string
    Port int32
}

f.RegisterStruct(Config{}, 1)
data, _ := f.Serialize(&Config{Host: "localhost", Port: 8080})
```

### 图结构

对于包含循环引用的数据：

```go
f := fory.New(fory.WithXlang(true), fory.WithTrackRef(true))

type Node struct {
    Value int32
    Next  *Node `fory:"ref"`
}

f.RegisterStruct(Node{}, 1)
n1 := &Node{Value: 1}
n2 := &Node{Value: 2}
n1.Next = n2
n2.Next = n1  // Circular reference

data, _ := f.Serialize(n1)
```

### Schema 演进

对于可能随时间演进的数据：

```go
// V1: original struct
type UserV1 struct {
    ID   int64
    Name string
}

// V2: added Email field
type UserV2 struct {
    ID    int64
    Name  string
    Email string  // New field
}

// Serialize with V1 in native mode. Compatible mode is the default.
f1 := fory.New(fory.WithXlang(false))
f1.RegisterStruct(UserV1{}, 1)
data, _ := f1.Serialize(&UserV1{ID: 1, Name: "Alice"})

// Deserialize into V2 - Email will have zero value
f2 := fory.New(fory.WithXlang(false))
f2.RegisterStruct(UserV2{}, 1)
var user UserV2
f2.Deserialize(data, &user)
```

### 高性能并发

对于并发高吞吐场景：

```go
type Request struct {
    ID      int64
    Payload string
}

f := threadsafe.New(
    fory.WithXlang(true),
    fory.WithMaxDepth(30),
)
f.RegisterStruct(Request{}, 1)

// Process requests concurrently
for req := range requests {
    go func(r Request) {
        data, _ := f.Serialize(&r)
        sendResponse(data)
    }(req)
}
```

## 最佳实践

1. **复用 Fory 实例**：创建 Fory 实例会产生初始化开销。应创建一次并复用。

2. **并发时使用线程安全包装器**：切勿在 goroutine 之间共享非线程安全 Fory 实例。

3. **仅在需要时启用引用跟踪**：跟踪对象标识会增加开销。

4. **需要保留时复制序列化数据**：使用默认 Fory 时，返回的字节切片会在下一次操作时失效。

5. **设置合适的最大深度**：深层嵌套结构可提高限制，但要注意内存用量。

6. **演进 Schema 保持兼容模式**：结构体定义可能在服务版本间变化时使用默认设置。

## 安全

安全相关配置：

- 反序列化不可信数据前，只注册预期的结构体。
- 使用 `WithMaxDepth(...)` 拒绝意外过深的载荷。
- 除非数据确定无恶意且可信对等端会发送更大的元数据或大量 Schema 版本，否则请保留远端 Schema 元数据限制的默认值。
- 对不可信输入，优先使用具体结构体字段，而非宽泛的 `any` 或接口类型字段。

## 相关主题

- [基本序列化](core-api.md)
- [引用](references.md)
- [Schema 演进](schema-evolution.md)
- [线程安全](thread-safety.md)
