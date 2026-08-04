---
title: Go 对象序列化
sidebar_position: 0
id: index
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

Apache Fory Go 是面向 Go 的高性能序列化库。它支持用于跨语言载荷的跨语言模式和用于 Go 专属载荷的原生模式，并提供快速对象图序列化、循环引用、多态和 Schema 感知的结构体处理。

## 为什么选择 Fory Go？

- **高性能**：快速序列化和优化的二进制协议
- **跨语言**：与 Java、Python、C++、Rust、JavaScript/TypeScript、C#、Swift、Dart、Scala 和 Kotlin 无缝交换数据
- **自动序列化**：使用快速序列化器序列化 Go 结构体
- **引用跟踪**：内置支持循环引用和共享对象
- **类型安全**：使用 Schema 感知的序列化器提供强类型能力
- **Schema 演进**：兼容模式支持向前和向后兼容
- **线程安全选项**：基于池的线程安全包装器支持并发使用

## 快速入门

### 安装

**要求**：Go 1.24 或更高版本

```bash
go get github.com/apache/fory/go/fory
```

### 基本用法

```go
package main

import (
    "fmt"
    "github.com/apache/fory/go/fory"
)

type User struct {
    ID   int64
    Name string
    Age  int32
}

func main() {
    // Create an xlang Fory instance.
    f := fory.New(fory.WithXlang(true))

    // Register struct with a type ID
    if err := f.RegisterStruct(User{}, 1); err != nil {
        panic(err)
    }

    // Serialize
    user := &User{ID: 1, Name: "Alice", Age: 30}
    data, err := f.Serialize(user)
    if err != nil {
        panic(err)
    }

    // Deserialize
    var result User
    if err := f.Deserialize(data, &result); err != nil {
        panic(err)
    }

    fmt.Printf("Deserialized: %+v\n", result)
    // Output: Deserialized: {ID:1 Name:Alice Age:30}
}
```

## 跨语言模式与原生模式

跨语言载荷以及与其他 Fory 实现共享的 Schema 应使用跨语言模式。跨语言模式是 Go 的默认编码模式；使用该模式的 Go 示例会显式设置 `fory.WithXlang(true)`，以清楚展示模式选择。

仅限 Go 的通信应使用原生模式。通过 `fory.WithXlang(false)` 选择原生模式，它会让 Go 对象序列化保持 Go 原生形式。该模式针对不需要可移植跨语言映射的 Go 结构体、指针、接口和 Go 专属类型行为进行了优化。兼容模式默认启用。只有每个读取端和写入端都使用相同的 Go 结构体 Schema，并且希望获得更快序列化和更小体积时，才设置 `fory.WithCompatible(false)`。

Go 跨语言注册和互操作规则参见[跨语言序列化](core-api.md#cross-language-interoperability)，仅限 Go 的载荷参见[原生序列化](native.md)。

## 配置

Fory Go 使用函数式选项模式进行配置：

```go
f := fory.New(
    fory.WithXlang(true),
    fory.WithTrackRef(true),      // Enable reference tracking
    fory.WithMaxDepth(20),       // Set max nesting depth
)
```

所有可用选项参见[配置](configuration.md)。

## 支持的类型

Fory Go 支持多种类型：

- **原始类型**：`bool`、`int8`-`int64`、`uint8`-`uint64`、`float32`、`float64`、`string`
- **集合**：切片、映射、集合
- **时间**：`time.Time`、`time.Duration`
- **指针**：自动处理 nil 的指针类型
- **结构体**：任何包含导出字段的结构体

完整类型映射参见[支持的类型](supported-types.md)。

## 跨语言序列化

Fory Go 与其他 Fory 实现完全兼容。在 Go 中序列化的数据可以在 Java、Python、C++、Rust、JavaScript/TypeScript、C#、Swift、Dart、Scala 或 Kotlin 中反序列化：

```go
// Go serialization
f := fory.New(fory.WithXlang(true))
f.RegisterStruct(User{}, 1)
data, _ := f.Serialize(&User{ID: 1, Name: "Alice"})
// 'data' can be deserialized by Java, Python, etc.
```

类型映射和兼容性详情参见[跨语言序列化](core-api.md#cross-language-interoperability)。

## 文档

| 主题                                    | 说明                        |
| --------------------------------------- | --------------------------- |
| [基本序列化](core-api.md)               | 核心 API 和使用模式         |
| [原生序列化](native.md)                 | 仅限 Go 的序列化            |
| [配置](configuration.md)                | 选项和设置                  |
| [Schema 元数据](schema-metadata.md)     | 字段级配置                  |
| [类型注册](type-registration.md)        | 注册用于序列化的类型        |
| [支持的类型](supported-types.md)        | 完整类型支持参考            |
| [引用](references.md)                   | 循环引用和共享对象          |
| [Schema 演进](schema-evolution.md)      | 向前和向后兼容              |
| [自定义序列化器](custom-serializers.md) | 扩展序列化行为              |
| [线程安全](thread-safety.md)            | 并发使用模式                |
| [gRPC 支持](../../grpc/go.md)           | 通过 grpc-go 传输 Fory 载荷 |
| [故障排查](troubleshooting.md)          | 常见问题和解决方案          |

## 相关资源

- [跨语言序列化规范](../../specification/xlang_serialization_spec.md)
- [跨语言类型映射](../../specification/xlang_type_mapping.md)
- [GitHub 仓库](https://github.com/apache/fory)
