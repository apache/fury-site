---
title: Native 序列化
sidebar_position: 3
id: native_serialization
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

Go native 序列化是通过 `fory.WithXlang(false)` 选择的 Go 专用编码模式。当所有写入方和读取方都是 Go 服务，并且载荷应遵循 Go 类型系统而不是可移植的 xlang 类型系统时使用它。

当字节需要由 Java、Python、C++、Rust、JavaScript 或其他非 Go Fory 运行时读取时，请使用 Go 默认模式
[Xlang 序列化](xlang-serialization.md)。

## 何时使用 Native 序列化

在以下场景使用 native 序列化：

- 载荷只由 Go 应用生成和消费。
- 数据模型使用 Go 特有行为，例如原生 `int`/`uint`、nil slice、nil map、指针、interface，或仅 Go 使用的动态值。
- 你需要 schema 一致的 Go 载荷，并希望同 schema 场景下的元信息面尽可能小。
- 你希望为仅 Go 的滚动部署使用兼容的 Schema 演进，但不承诺跨语言类型映射。
- 你正在为永远不会离开 Go 的 Go struct 使用 Go 快速序列化器。

## 创建 Native 运行时

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

复用已配置的 `Fory` 实例。默认实例持有可复用缓冲区，并且不是线程安全的；并发 goroutine 场景请使用线程安全封装。

```go
import (
    "github.com/apache/fory/go/fory"
    "github.com/apache/fory/go/fory/threadsafe"
)

f := threadsafe.New(fory.WithXlang(false), fory.WithTrackRef(true))
_ = f.RegisterStruct(Order{}, 100)
```

## Schema 演进

Native 序列化默认使用 schema 一致模式。如果未设置 `WithCompatible(true)`，写入方和读取方的 struct 应保持一致。

当仅 Go 服务独立滚动升级时，启用兼容模式：

```go
writer := fory.New(fory.WithXlang(false), fory.WithCompatible(true))
reader := fory.New(fory.WithXlang(false), fory.WithCompatible(true))
```

兼容模式会写入 schema 元信息；当字段名或显式字段 ID 保持兼容时，读取方可以容忍字段新增、删除或重排。参见
[Schema 演进](schema-evolution.md)。

## 注册

在序列化 struct 前先注册它们。对于长期存在的载荷，优先使用显式数字 ID：

```go
_ = f.RegisterStruct(Order{}, 100)
_ = f.RegisterStruct(LineItem{}, 101)
```

当 ID 协调较困难时，基于名称的注册很有用：

```go
_ = f.RegisterStructByName(Order{}, "example.Order")
```

如果注册时没有稳定 ID，每个写入方和读取方都必须做出相同的注册选择。

## Go 对象范围

Native 序列化让 Go 数据保持在 Go 运行时路径上：

- 基础数字类型，包括 Go 原生 `int` 和 `uint`。
- 带导出字段的 struct。
- Slice、array、map 和 Fory set。
- 指针和 nil 值，包括 nil slice 和 map。
- 当已注册序列化器能够解析具体类型时支持 interface 和动态值。
- `time.Time` 和 `time.Duration` 等时间值。
- 快速序列化器。

完整类型范围和 xlang 映射细节请参见[支持的类型](supported-types.md)。

## 引用与指针

为共享对象身份或循环启用引用跟踪：

```go
f := fory.New(fory.WithXlang(false), fory.WithTrackRef(true))

type Node struct {
    Value int32
    Next  *Node `fory:"ref"`
}
```

对于值形态的数据，可以关闭引用跟踪。这样更快、体积更小，但重复指针会反序列化为独立值，且不支持循环图。

## 缓冲区所有权

默认 `Fory` 实例会复用内部缓冲区。如果序列化后的字节需要在下一次序列化调用后继续存在，请复制它们：

```go
data, _ := f.Serialize(value)
stable := append([]byte(nil), data...)
```

线程安全封装会在返回前复制字节。对于高吞吐单线程代码，可以序列化到调用方持有的 `ByteBuffer`：

```go
buf := fory.NewByteBuffer(nil)
err := f.SerializeTo(buf, value)
data := buf.GetByteSlice(0, buf.WriterIndex())
_ = err
_ = data
```

## 性能建议

- 复用 `Fory` 或线程安全封装，不要为每个请求构造运行时。
- 对同步发布的 Go 服务保持 schema 一致模式；只有在需要 Schema 演进时才启用兼容模式。
- 使用显式数字 ID 注册 struct。
- 除非对象图需要身份或循环，否则关闭引用跟踪。
- 只有当数据必须在下一次序列化调用后继续存在时，才复制返回的字节。

## Native 与 Xlang 对比

| 需求                                     | 使用 native 序列化 | 使用 xlang 序列化 |
| ---------------------------------------- | ------------------ | ----------------- |
| 仅 Go 载荷                               | 是                 | 可选              |
| 非 Go 读取方或写入方                     | 否                 | 是                |
| Go 原生 `int`、`uint`、nil slice/map     | 是                 | 有限              |
| 同语言 schema 一致载荷                   | 是                 | 否                |
| 默认兼容的 Schema 演进                   | 否                 | 是                |
| 跨运行时的可移植类型映射                 | 否                 | 是                |

## 故障排查

### 非 Go 运行时无法读取载荷

写入方正在使用 native 序列化。使用 `fory.WithXlang(true)` 重新构建它，并与每个对端运行时对齐类型注册。

### 字段变更后滚动部署失败

Native 序列化默认使用 schema 一致模式。当 struct 定义可能不同时，在写入方和读取方都使用 `fory.WithCompatible(true)`。

### nil slice 或 map 的形态发生变化

对于必须保留 Go nil slice/map 语义的仅 Go 载荷，请使用 native 序列化。跨语言 schema 应显式建模可空性。

### 另一次序列化后返回的字节发生变化

默认运行时会复用缓冲区。复制该字节 slice，或使用 `threadsafe.New(...)`。

## 相关主题

- [Xlang 序列化](xlang-serialization.md) - 跨运行时 Go 载荷
- [配置](configuration.md) - Go 运行时选项
- [类型注册](type-registration.md) - Struct 和 enum 注册
- [引用](references.md) - 共享引用和循环引用
- [Schema 演进](schema-evolution.md) - 兼容模式
