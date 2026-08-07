---
title: Go 设置
sidebar_position: 4
id: go
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

Fory Go 提供 xlang 和 native 对象序列化、生成的模型以及 Fory gRPC。它以 `github.com/apache/fory/go/fory` 发布，需要 Go 1.25 或更高版本。

## 验证工具链

```bash
go version
go env GOPROXY
```

## 对象序列化

创建 module 并安装已发布的 Fory module：

```bash
mkdir fory-example
cd fory-example
go mod init example.com/fory-example
go get github.com/apache/fory/go/fory@v1.6.0
```

如果 Go proxy 尚未收录新的 submodule tag，请稍后重试，或者暂时使用 `GOPROXY=direct`。

```go title="main.go"
package main

import (
    "fmt"

    "github.com/apache/fory/go/fory"
)

type User struct {
    ID   int64
    Name string
}

func main() {
    f := fory.New(fory.WithXlang(true))
    if err := f.RegisterStruct(User{}, 1); err != nil {
        panic(err)
    }

    bytes, err := f.Serialize(&User{ID: 1, Name: "Alice"})
    if err != nil {
        panic(err)
    }

    var decoded User
    if err := f.Deserialize(bytes, &decoded); err != nil {
        panic(err)
    }
    fmt.Println(decoded.Name)
}
```

```bash
go run .
```

跨语言数据请使用 [xlang 模式](../object-serialization/go/basic-serialization.md#cross-language-interoperability)，仅供 Go 使用的数据请使用 [native 模式](../object-serialization/go/native.md)。接下来可阅读 [Go 对象序列化](../object-serialization/go/index.md)、[配置](../object-serialization/go/configuration.md)和 [Schema 演进](../object-serialization/go/schema-evolution.md)。

## 其他能力

- **Fory IDL 与编译器** 生成 Go 模型和注册辅助代码。请参阅[编译器快速入门](../compiler/getting-started.md)和 [Go 生成代码指南](../compiler/generated-code/go.md)。
- **Fory gRPC** 通过 grpc-go 传输使用 Fory 编码的消息。请参阅 [Go gRPC](../grpc/go.md)。
