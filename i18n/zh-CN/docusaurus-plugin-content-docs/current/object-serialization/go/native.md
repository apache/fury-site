---
title: 原生序列化
sidebar_position: 2
id: native
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

Go 原生序列化是通过 `fory.WithXlang(false)` 选择、仅限 Go 的编码模式。当每个写入端和读取端都是 Go 服务，并且载荷应遵循 Go 类型系统而非可移植的跨语言类型系统时，请使用该模式。

如果字节需要由 Java、Python、C++、Rust、JavaScript/TypeScript、C#、Swift、Dart、Scala、Kotlin 或其他非 Go Fory 实现读取，请使用 Go 默认模式[跨语言序列化](xlang.md)。

## 何时使用原生序列化

以下场景使用原生序列化：

- 载荷仅由 Go 应用程序生成和消费。
- 数据模型使用原生 `int`/`uint`、nil 切片、nil 映射、指针、接口或仅限 Go 的动态值等 Go 专属行为。
- 希望获得更快序列化和更小体积，并且每个读取端都使用与写入端相同的结构体 Schema。
- 仅限 Go 的滚动部署需要兼容 Schema 演进，但不希望采用跨语言类型映射。
- 正在为永远不离开 Go 的结构体使用 Go 快速序列化器。

## 创建原生模式 Fory 实例

```go
package main

import "github.com/apache/fory/go/fory"

type Order struct {
    ID     int64
    Amount float64
}

func main() {
    f := fory.New(fory.WithXlang(false))
    if err := f.RegisterStruct(Order{}, 100); err != nil {
        panic(err)
    }

    data, err := f.Serialize(&Order{ID: 1, Amount: 42.5})
    if err != nil {
        panic(err)
    }

    var decoded Order
    if err := f.Deserialize(data, &decoded); err != nil {
        panic(err)
    }
}
```

复用已配置的 `Fory` 实例。默认实例拥有可复用缓冲区且不是线程安全的；并发 goroutine 请使用线程安全包装器。

```go
import (
    "github.com/apache/fory/go/fory"
    "github.com/apache/fory/go/fory/threadsafe"
)

f := threadsafe.New(fory.WithXlang(false), fory.WithTrackRef(true))
_ = f.RegisterStruct(Order{}, 100)
```

## Schema 演进

原生序列化默认使用兼容模式。当仅限 Go 的服务独立滚动部署时，请保留该默认设置：

```go
writer := fory.New(fory.WithXlang(false))
reader := fory.New(fory.WithXlang(false))
```

兼容模式写入 Schema 元数据，因此在字段名称或显式字段 ID 保持兼容时，读取端可以容忍字段新增、删除或重排。参见 [Schema 演进](schema-evolution.md)。

只有每个读取端和写入端始终使用相同的 Go 结构体 Schema 时，才设置 `WithCompatible(false)` 以获得更快序列化和更小体积。

## 注册

序列化结构体前先注册。对于长期存在的载荷，优先使用显式数字 ID：

```go
_ = f.RegisterStruct(Order{}, 100)
_ = f.RegisterStruct(LineItem{}, 101)
```

难以协调 ID 时，按名称注册很有用：

```go
_ = f.RegisterStructByName(Order{}, "example.Order")
```

如果注册时不使用稳定 ID，则每个写入端和读取端都必须采用相同的注册选择。

## Go 对象范围

原生序列化以 Go 原生形式保留 Go 数据：

- 原始数值类型，包括 Go 原生 `int` 和 `uint`。
- 包含导出字段的结构体。
- 切片、数组、映射和 Fory 集合。
- 指针和 nil 值，包括 nil 切片与映射。
- 已注册序列化器能够解析具体类型时的接口和动态值。
- `time.Time` 和 `time.Duration` 等时间值。
- 快速序列化器。

完整类型范围和跨语言映射详情参见[支持的类型](supported-types.md)。

## 引用与指针

对于共享对象标识或循环引用，请启用引用跟踪：

```go
f := fory.New(fory.WithXlang(false), fory.WithTrackRef(true))

type Node struct {
    Value int32
    Next  *Node `fory:"ref"`
}
```

对值形态数据禁用引用跟踪。这样更快且体积更小，但重复指针会反序列化为独立值，并且不支持循环对象图。

## 缓冲区所有权

默认 `Fory` 实例会复用内部缓冲区。如果序列化字节需要在下一次序列化调用之后继续存在，请进行复制：

```go
data, _ := f.Serialize(value)
stable := append([]byte(nil), data...)
```

线程安全包装器会在返回字节前进行复制。对于高吞吐单线程代码，请序列化到调用方拥有的 `ByteBuffer`：

```go
buf := fory.NewByteBuffer(nil)
err := f.SerializeTo(buf, value)
data := buf.GetByteSlice(0, buf.WriterIndex())
_ = err
_ = data
```

## 性能指南

- 复用 `Fory` 或线程安全包装器，不要为每个请求构造 Fory 实例。
- 只有每个读取端和写入端始终使用相同 Go 结构体 Schema，并且希望获得更快序列化和更小体积时，才使用 `WithCompatible(false)`。
- 使用显式数字 ID 注册结构体。
- 除非对象图需要标识或循环引用，否则禁用引用跟踪。
- 只有数据必须在下一次序列化调用后继续存在时，才复制返回字节。

## 原生模式与跨语言模式对比

| 需求                                 | 使用原生序列化 | 使用跨语言序列化 |
| ------------------------------------ | -------------- | ---------------- |
| 仅限 Go 的载荷                       | 是             | 可选             |
| 非 Go 读取端或写入端                 | 否             | 是               |
| Go 原生 `int`、`uint`、nil 切片/映射 | 是             | 有限             |
| 相同 Schema 的紧凑载荷               | 是             | 否               |
| 默认支持兼容 Schema 演进             | 是             | 是               |
| 跨语言可移植类型映射                 | 否             | 是               |

## 故障排查

### 非 Go 实现无法读取载荷

写入端使用了原生序列化。请使用 `fory.WithXlang(true)` 重新构建，并与每个对等端对齐类型注册。

### 字段变更后滚动部署失败

原生序列化默认使用兼容模式。当结构体定义可能不同时，请保留该默认设置。

### nil 切片或映射改变形态

必须保留 Go nil 切片/映射语义的 Go 专属载荷应使用原生序列化。跨语言 Schema 应显式建模可空性。

### 再次序列化后返回字节发生变化

默认 `Fory` 实例会复用缓冲区。请复制字节切片或使用 `threadsafe.New(...)`。

## 相关主题

- [跨语言序列化](xlang.md) - 跨语言 Go 载荷
- [配置](configuration.md) - Go 选项
- [类型注册](type-registration.md) - 结构体和枚举注册
- [引用](references.md) - 共享引用与循环引用
- [Schema 演进](schema-evolution.md) - 兼容模式
