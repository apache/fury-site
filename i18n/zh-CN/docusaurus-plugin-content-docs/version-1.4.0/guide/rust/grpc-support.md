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

Fory 可以为包含 service 定义的 schema 生成 Rust gRPC service companion。生成代码使用
`tonic` 负责传输，使用 Fory 序列化 request 和 response payload。

当 RPC 两端都由同一份 Fory IDL、protobuf IDL 或 FlatBuffers IDL 生成，并且你希望使用
gRPC 的传输语义与 Fory payload 编码时，可以使用这种模式。如果客户端或工具必须直接读取
protobuf message bytes，请继续使用标准 protobuf gRPC 代码生成。

## 添加依赖

编译生成 service 文件的 crate 需要添加 `tonic` 和 `bytes`。Fory Rust crate 不会将
gRPC 作为硬依赖。异步 server/client 还需要 `tokio`；如果 service 实现需要构造
streaming response 或 request stream，可添加 `tokio-stream`。

```toml
[dependencies]
fory = "1.4.0"
bytes = "1"
tonic = { version = "0.14", features = ["transport"] }
tokio = { version = "1", features = ["macros", "rt-multi-thread"] }
tokio-stream = "0.1"
```

请使用与应用服务栈兼容的依赖版本。

## 定义 Service

Service 定义可以来自 Fory IDL、protobuf IDL 或 FlatBuffers `rpc_service`。例如：

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

使用 `--grpc` 生成 Rust model 和 gRPC companion：

```bash
foryc service.fdl --rust_out=./generated/rust --grpc
```

该 schema 会生成：

| 文件                           | 用途                                       |
| ------------------------------ | ------------------------------------------ |
| `demo_greeter.rs`              | Fory model 类型和注册辅助逻辑              |
| `demo_greeter_service.rs`      | 异步 service trait 与 gRPC path 常量       |
| `demo_greeter_service_grpc.rs` | tonic client、server wrapper 和 Fory codec |

将生成文件加入 crate root：

```rust
pub mod demo_greeter;
pub mod demo_greeter_service;
pub mod demo_greeter_service_grpc;
```

## 实现 Server

实现生成的异步 trait，并把生成的 server wrapper 添加到普通 `tonic` server：

```rust
use demo_greeter::{HelloReply, HelloRequest};
use demo_greeter_service::Greeter;
use demo_greeter_service_grpc::greeter_server::GreeterServer;
use tonic::{Request, Response, Status};

#[derive(Default)]
struct MyGreeter;

#[tonic::async_trait]
impl Greeter for MyGreeter {
    async fn say_hello(
        &self,
        request: Request<HelloRequest>,
    ) -> Result<Response<HelloReply>, Status> {
        let request = request.into_inner();
        Ok(Response::new(HelloReply {
            reply: format!("Hello, {}", request.name),
        }))
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let addr = "[::1]:50051".parse()?;
    tonic::transport::Server::builder()
        .add_service(GreeterServer::new(MyGreeter::default()))
        .serve(addr)
        .await?;
    Ok(())
}
```

生成的 service code 会负责序列化 request 和 response 类型，service 实现中不需要手动注册 Fory。

## 创建 Client

使用生成的 tonic client：

```rust
use demo_greeter::HelloRequest;
use demo_greeter_service_grpc::greeter_client::GreeterClient;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let mut client = GreeterClient::connect("http://[::1]:50051").await?;
    let response = client
        .say_hello(HelloRequest {
            name: "Fory".to_string(),
        })
        .await?;
    println!("{}", response.into_inner().reply);
    Ok(())
}
```

Channel 配置、TLS、deadline、metadata、interceptor 和传输生命周期仍由 `tonic` 管理。

## Streaming RPC

Fory service 支持 unary、server-streaming、client-streaming 和 bidirectional streaming：

```protobuf
service Greeter {
  rpc SayHello (HelloRequest) returns (HelloReply);
  rpc LotsOfReplies (HelloRequest) returns (stream HelloReply);
  rpc LotsOfGreetings (stream HelloRequest) returns (HelloReply);
  rpc Chat (stream HelloRequest) returns (stream HelloReply);
}
```

生成 Rust 代码遵循 tonic 约定：

- Unary 方法使用 `tonic::Request<T>`，返回 `tonic::Response<U>`。
- Server-streaming 方法返回内部值为 stream 的 response。
- Client-streaming 和 bidirectional 方法接收 `tonic::Streaming<T>`。
- 生成的 client module 暴露与 service 方法对应的异步方法。
- 每个 message frame 都使用生成 codec，包括 streaming frame。

生成 trait 签名是 service 实现中具体 associated stream type 的准确信息来源：

```rust
use demo_greeter::{HelloReply, HelloRequest};
use demo_greeter_service::Greeter;
use std::pin::Pin;
use tokio_stream::{self as stream, Stream, StreamExt};
use tonic::{Request, Response, Status};

#[derive(Default)]
struct MyGreeter;

type ReplyStream =
    Pin<Box<dyn Stream<Item = Result<HelloReply, Status>> + Send + 'static>>;

#[tonic::async_trait]
impl Greeter for MyGreeter {
    type LotsOfRepliesStream = ReplyStream;
    type ChatStream = ReplyStream;

    async fn lots_of_replies(
        &self,
        request: Request<HelloRequest>,
    ) -> Result<Response<Self::LotsOfRepliesStream>, Status> {
        let name = request.into_inner().name;
        let replies = vec![
            Ok(HelloReply {
                reply: format!("Hello, {name}"),
            }),
            Ok(HelloReply {
                reply: format!("Welcome, {name}"),
            }),
        ];
        Ok(Response::new(Box::pin(stream::iter(replies))))
    }

    async fn lots_of_greetings(
        &self,
        request: Request<tonic::Streaming<HelloRequest>>,
    ) -> Result<Response<HelloReply>, Status> {
        let mut requests = request.into_inner();
        let mut names = Vec::new();
        while let Some(request) = requests.next().await {
            names.push(request?.name);
        }
        Ok(Response::new(HelloReply {
            reply: names.join(", "),
        }))
    }

    async fn chat(
        &self,
        request: Request<tonic::Streaming<HelloRequest>>,
    ) -> Result<Response<Self::ChatStream>, Status> {
        let replies = request.into_inner().map(|request| {
            request.map(|request| HelloReply {
                reply: format!("Hello, {}", request.name),
            })
        });
        Ok(Response::new(Box::pin(replies)))
    }
}
```

生成的 client 返回 tonic streaming response：

```rust
use demo_greeter::HelloRequest;
use demo_greeter_service_grpc::greeter_client::GreeterClient;
use tokio_stream as stream;

let mut client = GreeterClient::connect("http://[::1]:50051").await?;

let mut replies = client
    .lots_of_replies(HelloRequest {
        name: "Fory".to_string(),
    })
    .await?
    .into_inner();
while let Some(reply) = replies.message().await? {
    println!("{}", reply.reply);
}

let greetings = stream::iter(vec![
    HelloRequest {
        name: "Ada".to_string(),
    },
    HelloRequest {
        name: "Grace".to_string(),
    },
]);
let summary = client.lots_of_greetings(greetings).await?.into_inner();
println!("{}", summary.reply);

let chat_requests = stream::iter(vec![
    HelloRequest {
        name: "Fory".to_string(),
    },
    HelloRequest {
        name: "RPC".to_string(),
    },
]);
let mut chat = client.chat(chat_requests).await?.into_inner();
while let Some(reply) = chat.message().await? {
    println!("{}", reply.reply);
}
```

生成 descriptor 会保留 IDL 中的 service 和 method 名称作为 gRPC path。

## 线程安全与 Payload 类型

Rust gRPC payload 必须满足 `Send + 'static`，这样 tonic 才能在线程间移动 request/response。
如果 request 或 response schema 使用非线程安全的引用元信息，Rust gRPC 生成会拒绝该 service。

## gRPC 运行时行为

生成的 service companion 只提供 Fory 序列化和 tonic binding。deadline、取消、TLS、认证、
Tower middleware、interceptor、status code、metadata、channel/server 生命周期和 backpressure
仍遵循标准 tonic 行为。

## 故障排查

### 缺少 `tonic` 或 `bytes`

在编译生成 service 文件的 crate 中添加上述依赖。

### `UNIMPLEMENTED`

确认已通过 `Server::builder().add_service(...)` 添加生成的 server wrapper，并且 client 与
server 来自相同的 package、service 和 method 名称。

### 生成时报非线程安全引用错误

Rust gRPC payload 必须满足 `Send + 'static`。请调整 request/response schema 使用线程安全
引用形态，或不要把非线程安全类型放在 RPC 边界上。

### Protobuf Client 无法解码 Service

Fory gRPC companion 不使用 protobuf wire encoding。请使用 Fory 生成的 client 调用 Fory 生成的
service，或为通用 protobuf client 提供单独的 protobuf service endpoint。
