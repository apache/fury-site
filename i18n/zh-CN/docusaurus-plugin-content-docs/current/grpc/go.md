---
title: Go gRPC
sidebar_position: 7
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

对于定义了服务的 schema，Fory 可以生成配套的 Go gRPC 服务代码。生成的代码使用 grpc-go 进行传输，并使用基于 Fory 的 `CodecV2` 编解码请求与响应载荷。

当所有 RPC 对端都从同一份 Fory IDL、protobuf IDL 或 FlatBuffers IDL 生成，并且希望结合 gRPC 传输语义与 Fory 载荷编码时，请使用此模式。如果客户端或工具必须直接处理 protobuf 消息字节，请使用标准的 protobuf gRPC 代码生成方式。

## 添加依赖

将 grpc-go 添加到模块中。Fory Go 包不会将 gRPC 作为强制依赖引入。

```bash
go get google.golang.org/grpc
```

生成的代码还会导入 Fory Go 模块：

```bash
go get github.com/apache/fory/go/fory
```

## 定义服务

服务定义可以来自 Fory IDL、protobuf IDL 或 FlatBuffers 的 `rpc_service` 定义。Fory IDL 服务如下所示：

```protobuf
package demo.greeter;

message HelloRequest {
  string name = 1;
}

message HelloReply {
  string reply = 1;
}

service Greeter {
  rpc SayHello (HelloRequest) returns (HelloReply);
}
```

使用 `--grpc` 生成 Go 模型和配套的 gRPC 代码：

```bash
foryc service.fdl --go_out=./generated/go --grpc
```

对于此 schema，Go 生成器会生成：

| 文件                           | 用途                                 |
| ------------------------------ | ------------------------------------ |
| `greeter/demo_greeter.go`      | Fory 模型类型和注册辅助函数          |
| `greeter/demo_greeter_grpc.go` | grpc-go 客户端、服务端接口和编解码器 |

生成的 Go 方法使用导出的 PascalCase 名称，例如 `SayHello`。底层 gRPC 方法路径会原样保留 schema 中的方法名，因此 `sayHello` 或 `say_hello` 等名称仍按其在 schema 中的拼写进行路由。

## 实现服务端

实现生成的 `GreeterServer` 接口，使用生成的 Fory 编解码器创建 grpc-go 服务端，然后注册服务。

```go
package main

import (
    "context"
    "log"
    "net"

    "google.golang.org/grpc"

    "example.com/app/generated/go/greeter"
)

type greeterService struct {
    greeter.UnimplementedGreeterServer
}

func (greeterService) SayHello(
    ctx context.Context,
    request *greeter.HelloRequest,
) (*greeter.HelloReply, error) {
    return &greeter.HelloReply{Reply: "Hello, " + request.Name}, nil
}

func main() {
    listener, err := net.Listen("tcp", ":50051")
    if err != nil {
        log.Fatal(err)
    }

    server := grpc.NewServer(
        grpc.ForceServerCodecV2(greeter.CodecV2{}),
    )
    greeter.RegisterGreeterServer(server, greeterService{})

    if err := server.Serve(listener); err != nil {
        log.Fatal(err)
    }
}
```

必须使用 `grpc.ForceServerCodecV2(...)`，这样服务端才能使用生成的 Fory 编解码器而不是默认的 protobuf 编解码器来解码传入帧。

对服务 schema 使用生成的 `CodecV2{}` 零值即可。生成的客户端方法会为传出调用强制使用同一编解码器。

## 创建客户端

生成的客户端构造函数接收 grpc-go 连接。生成的客户端方法会为每次调用强制使用生成的 Fory 编解码器。

```go
package main

import (
    "context"
    "fmt"
    "log"
    "time"

    "google.golang.org/grpc"
    "google.golang.org/grpc/credentials/insecure"

    "example.com/app/generated/go/greeter"
)

func main() {
    conn, err := grpc.NewClient(
        "localhost:50051",
        grpc.WithTransportCredentials(insecure.NewCredentials()),
    )
    if err != nil {
        log.Fatal(err)
    }
    defer conn.Close()

    client := greeter.NewGreeterClient(conn)

    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    reply, err := client.SayHello(ctx, &greeter.HelloRequest{Name: "Fory"})
    if err != nil {
        log.Fatal(err)
    }
    fmt.Println(reply.Reply)
}
```

## 流式 RPC

Fory 服务定义可以使用一元、服务端流式、客户端流式和双向流式 RPC 形式：

```protobuf
service Greeter {
  rpc SayHello (HelloRequest) returns (HelloReply);
  rpc LotsOfReplies (HelloRequest) returns (stream HelloReply);
  rpc LotsOfGreetings (stream HelloRequest) returns (HelloReply);
  rpc Chat (stream HelloRequest) returns (stream HelloReply);
}
```

生成的 Go 代码遵循 grpc-go 的惯例：

- 一元方法接收 `context.Context` 和请求指针，并返回响应指针与 `error`。
- 服务端流式客户端方法返回生成的流式客户端。
- 客户端流式服务端方法接收生成的流式服务端。
- 双向流式方法使用生成的流式客户端和流式服务端接口。
- 每个消息帧（包括流式帧）都使用生成的编解码器。

## gRPC 运行行为

生成的配套服务代码只负责提供 Fory 序列化。运行行为仍遵循标准的 grpc-go 行为：

- 截止时间与取消
- TLS 与凭据
- 一元与流式拦截器
- 状态码与元数据
- 名称解析与负载均衡
- 连接生命周期与退避

## 故障排除

### 缺少 `google.golang.org/grpc` 包

将 grpc-go 添加到模块中：

```bash
go get google.golang.org/grpc
```

### `grpc: error while marshaling`

请确认客户端与服务端都使用了生成的 `CodecV2{}`，并且生成的模型文件与配套的 gRPC 代码编译在同一个包中。

### `UNIMPLEMENTED`

请确认已使用 `RegisterGreeterServer(...)` 注册生成的服务，并且客户端与服务端是根据相同的包名、服务名和方法名生成的。

### Protobuf 客户端无法解码服务

Fory gRPC 配套代码不会对消息使用 protobuf 编码格式。对于 Fory 生成的服务，请使用 Fory 生成的客户端；如需支持通用 protobuf 客户端，请另行提供 protobuf 服务端点。
