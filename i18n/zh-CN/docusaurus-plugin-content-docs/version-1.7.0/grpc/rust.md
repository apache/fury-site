---
title: Rust gRPC
sidebar_position: 8
id: rust
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

对于定义了服务的 Schema，Fory 可以生成 Rust gRPC 服务配套代码。生成的代码使用 `tonic` 进行传输，并使用 Fory 序列化请求和响应载荷。

当每个 RPC 对等方都由同一份 Fory IDL、protobuf IDL 或 FlatBuffers IDL 生成，并且你希望将 gRPC 传输语义与 Fory 载荷编码结合使用时，请使用此模式。当客户端或工具必须直接使用 protobuf 消息字节时，请使用标准的 protobuf gRPC 代码生成方式。

## 添加依赖

在编译生成的服务文件的 crate 中添加 `tonic` 和 `bytes`。Fory Rust crate 不会将 gRPC 添加为硬依赖。异步服务器和客户端需要添加 `tokio`；如果服务实现需要构建流式响应或请求流，还需添加 `tokio-stream`。

```toml
[dependencies]
fory = "1.7.0"
bytes = "1"
tonic = { version = "0.14", features = ["transport"] }
tokio = { version = "1", features = ["macros", "rt-multi-thread"] }
tokio-stream = "0.1"
```

请使用与服务栈其余部分兼容的依赖版本。

## 定义服务

服务定义可以来自 Fory IDL、protobuf IDL 或 FlatBuffers `rpc_service` 定义。Fory IDL 服务如下所示：

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

使用 `--grpc` 生成 Rust 模型和 gRPC 配套代码：

```bash
foryc service.fdl --rust_out=./generated/rust --grpc
```

对于此 Schema，Rust 生成器会输出：

| 文件                           | 用途                                       |
| ------------------------------ | ------------------------------------------ |
| `demo_greeter.rs`              | Fory 模型类型和注册辅助函数                |
| `demo_greeter_service.rs`      | 异步服务 trait 和 gRPC 路径常量            |
| `demo_greeter_service_grpc.rs` | tonic 客户端、服务器包装器和 Fory 编解码器 |

将生成的文件添加到 crate 根模块：

```rust
pub mod demo_greeter;
pub mod demo_greeter_service;
pub mod demo_greeter_service_grpc;
```

## 实现服务器

实现生成的异步 trait，并将生成的服务器包装器添加到普通的 `tonic` 服务器中。

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

生成的服务代码会序列化生成的请求和响应类型，因此服务实现无需手动执行 Fory 注册。

## 创建客户端

使用生成的 tonic 客户端：

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

通道配置、TLS、截止时间、元数据、拦截器和传输生命周期仍由 `tonic` 负责。

## 流式 RPC

Fory 服务定义可以使用一元、服务器流式、客户端流式和双向流式 RPC 形式：

```protobuf
service Greeter {
  rpc SayHello (HelloRequest) returns (HelloReply);
  rpc LotsOfReplies (HelloRequest) returns (stream HelloReply);
  rpc LotsOfGreetings (stream HelloRequest) returns (HelloReply);
  rpc Chat (stream HelloRequest) returns (stream HelloReply);
}
```

生成的 Rust 代码遵循 tonic 约定：

- 一元方法使用 `tonic::Request<T>`，并返回 `tonic::Response<U>`。
- 服务器流式方法返回一个响应，其内部值是由 `Result<U, tonic::Status>` 组成的流。
- 客户端流式和双向流式方法接收 `tonic::Streaming<T>`。
- 生成的客户端模块为每个服务方法公开对应的异步方法。
- 每个消息帧（包括流式消息帧）都使用生成的编解码器。

请以生成的 trait 签名为准，在服务实现中确定具体的关联流类型：

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

生成的客户端会返回 tonic 流式响应：

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

生成的描述符会在 gRPC 路径中保留确切的 IDL 服务名和方法名。

## 线程安全与载荷类型

生成的 Rust gRPC 载荷必须满足 `Send + 'static`，以便 tonic 能够跨异步任务移动请求值和响应值。如果某个 Schema 对请求或响应类型使用了非线程安全的引用元数据，Rust gRPC 代码生成会拒绝该服务。请为 gRPC 载荷使用线程安全的引用形式，或者不要让非线程安全类型跨越 RPC 边界。

## gRPC 栈行为

生成的服务配套代码只提供 Fory 序列化和 tonic 绑定。运行时行为仍遵循标准 tonic 行为：

- 截止时间和取消
- TLS 和身份认证
- Tower 中间件和拦截器
- 状态码和元数据
- 通道和服务器生命周期
- 通过异步流实现的背压

## 故障排查

### 缺少 `tonic` 或 `bytes` Crate

将上面列出的依赖添加到编译生成的服务文件的 crate 中。

### `UNIMPLEMENTED`

确认已通过 `Server::builder().add_service(...)` 添加生成的服务器包装器，并确认客户端和服务器由相同的包名、服务名和方法名生成。

### 代码生成期间出现非线程安全引用错误

Rust gRPC 载荷必须满足 `Send + 'static`。请将请求或响应 Schema 改为使用线程安全的引用形式，或者使用不属于 gRPC 载荷的类型来包装非线程安全数据。

### Protobuf 客户端无法解码服务

Fory gRPC 配套代码不会对消息使用 protobuf 编码格式。Fory 生成的服务应使用 Fory 生成的客户端；如果需要支持通用 protobuf 客户端，请另行提供 protobuf 服务端点。
