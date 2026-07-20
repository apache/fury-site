---
title: gRPC 支持
sidebar_position: 12
id: grpc_support
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

Fory 可以为包含 service 定义的 schema 生成 Go gRPC service companion。生成代码使用
grpc-go 负责传输，并使用 Fory-backed `CodecV2` 编码 request 和 response payload。

当 RPC 两端都由同一份 Fory IDL、protobuf IDL 或 FlatBuffers IDL 生成，并且你希望使用
gRPC 传输语义与 Fory payload 编码时，可以使用这种模式。如果客户端或工具必须直接消费
protobuf message bytes，请使用标准 protobuf gRPC 代码生成。

## 添加依赖

向 Go module 添加 grpc-go。Fory Go package 不会把 gRPC 作为硬依赖。

```bash
go get google.golang.org/grpc
```

生成代码也会导入 Fory Go module：

```bash
go get github.com/apache/fory/go/fory
```

## 定义 Service

Service 定义可以来自 Fory IDL、protobuf IDL 或 FlatBuffers `rpc_service`：

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

使用 `--grpc` 生成 Go model 和 gRPC companion：

```bash
foryc service.fdl --go_out=./generated/go --grpc
```

输出包含：

| 文件                           | 用途                                      |
| ------------------------------ | ----------------------------------------- |
| `greeter/demo_greeter.go`      | Fory model 类型和注册辅助逻辑             |
| `greeter/demo_greeter_grpc.go` | grpc-go client、server interface 和 codec |

生成的 Go 方法使用导出的 PascalCase 名称，例如 `SayHello`。底层 gRPC method path 保留
schema 中的原始方法名，因此 `sayHello` 或 `say_hello` 等名称仍按 schema 拼写路由。

## 实现 Server

实现生成的 `GreeterServer` interface，使用生成的 Fory codec 创建 grpc-go server，并注册 service：

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

`grpc.ForceServerCodecV2(...)` 是必需的，它让 server 使用生成的 Fory codec 解码 frame，而不是默认 protobuf codec。

## 创建 Client

生成的 client constructor 接收 grpc-go connection。生成的 client 方法会为每次调用强制使用匹配的 Fory codec。

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

## Streaming RPC

Fory service 支持 unary、server-streaming、client-streaming 和 bidirectional streaming。生成 Go 代码遵循 grpc-go 约定：

- Unary 方法接收 `context.Context` 和 request pointer，返回 response pointer 与 `error`。
- Server-streaming client 方法返回生成的 stream client。
- Client-streaming server 方法接收生成的 stream server。
- Bidirectional streaming 使用生成的 stream client/server interface。
- 每个 message frame 都使用生成 codec。

## gRPC 运行时行为

生成的 service companion 只提供 Fory 序列化。deadline、取消、TLS、credential、unary/stream
interceptor、status code、metadata、名称解析、负载均衡、连接生命周期和 backoff 等 Service 行为都遵循标准 grpc-go。

## 故障排查

### 缺少 `google.golang.org/grpc`

向 module 添加 grpc-go：

```bash
go get google.golang.org/grpc
```

### `grpc: error while marshaling`

确认 client 和 server 都使用生成的 `CodecV2{}`，并且生成的 model 文件与 gRPC companion 编译在同一个 package 中。
