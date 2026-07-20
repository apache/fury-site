---
title: gRPC 支持
sidebar_position: 6
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

Fory 可以为包含 service 定义的 schema 生成 Scala 3 gRPC service companion。生成代码使用普通
grpc-java channel、server、deadline、status code、interceptor 和 transport security，但
request/response 对象使用 Fory 序列化，而不是 protobuf。

当 RPC 两端都由同一份 Fory IDL、protobuf IDL 或 FlatBuffers IDL 生成，并且你希望使用
gRPC 传输语义与 Fory payload 编码时，可以使用这种模式。如果 API 必须被通用 protobuf client
或 reflection 工具消费，请使用标准 protobuf gRPC 代码生成。

## 添加依赖

生成的 Scala service 文件编译时需要 grpc-java。`fory-scala` artifact 不会把 gRPC 作为硬依赖：

```sbt
libraryDependencies ++= Seq(
  "org.apache.fory" %% "fory-scala" % "<fory-version>",
  "io.grpc" % "grpc-api" % "<grpc-version>",
  "io.grpc" % "grpc-stub" % "<grpc-version>",
  "io.grpc" % "grpc-netty-shaded" % "<grpc-version>"
)
```

生成的 Scala model 和 gRPC companion 是 Scala 3 source。`fory-scala` 仍同时 cross-build
Scala 2.13 和 Scala 3。

## 定义 Service

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

生成 Scala model 和 gRPC companion：

```bash
foryc service.fdl --scala_out=./generated/scala --grpc
```

输出包含：

| 文件                      | 用途                               |
| ------------------------- | ---------------------------------- |
| `HelloRequest.scala`      | request 的 Fory model type         |
| `HelloReply.scala`        | response 的 Fory model type        |
| `GreeterForyModule.scala` | 生成类型的 Fory 注册 module        |
| `GreeterGrpc.scala`       | grpc-java service base、client 和 codec |

## 实现 Server

继承生成的 `GreeterGrpc.GreeterImplBase`，并注册到标准 grpc-java `Server`：

```scala
package demo.greeter

import io.grpc.ServerBuilder

final class GreeterService extends GreeterGrpc.GreeterImplBase {
  override def sayHello(request: HelloRequest): HelloReply =
    HelloReply(s"Hello, ${request.name}")
}

@main def runServer(): Unit = {
  val server = ServerBuilder
    .forPort(50051)
    .addService(new GreeterService)
    .build()
    .start()
  server.awaitTermination()
}
```

生成代码会注册 request/response 类型，service 实现不需要手动注册 serializer。

## 创建 Client

使用普通 grpc-java channel 和生成 client：

```scala
package demo.greeter

import io.grpc.ManagedChannelBuilder
import scala.concurrent.Await
import scala.concurrent.duration.DurationInt

@main def runClient(): Unit = {
  val channel = ManagedChannelBuilder
    .forAddress("localhost", 50051)
    .usePlaintext()
    .build()
  try {
    val client = GreeterGrpc.newClient(channel)
    val call = client.sayHello(HelloRequest("Fory"))
    val reply = Await.result(call.asFuture, 30.seconds)
    println(reply.reply)
  } finally {
    channel.shutdownNow()
  }
}
```

Unary Scala-friendly 方法返回 `RpcFuture[A]`。调用者可以通过 `asFuture` 与 Scala `Future` 组合，
并在需要提前取消 RPC 时调用 `cancel()`。

## Streaming RPC

Fory service 支持与 grpc-java 相同的 streaming shape：

```protobuf
service Greeter {
  rpc SayHello (HelloRequest) returns (HelloReply);
  rpc LotsOfReplies (HelloRequest) returns (stream HelloReply);
  rpc LotsOfGreetings (stream HelloRequest) returns (HelloReply);
  rpc Chat (stream HelloRequest) returns (stream HelloReply);
}
```

| IDL shape               | Scala client convenience | grpc-java-style 方法                         |
| ----------------------- | ------------------------ | -------------------------------------------- |
| Unary                   | `RpcFuture[Resp]`        | async observer、blocking、`ListenableFuture` |
| Server streaming        | `RpcIterator[Resp]`      | async observer 和 blocking iterator          |
| Client streaming        | 无                       | `StreamObserver` request stream              |
| Bidirectional streaming | 无                       | request/response `StreamObserver`            |

Server-streaming 的 `RpcIterator[A]` 扩展 Scala `Iterator[A]` 和 `AutoCloseable`。如果调用者提前停止消费，
应调用 `close()` 或 `cancel()` 释放底层 gRPC call。

Client-streaming 和 bidirectional streaming 保持 grpc-java `StreamObserver` API，因为 request
stream lifecycle、completion、cancellation 和 flow-control 规则都属于 grpc-java。

## 故障排查

### 缺少 grpc-java 类

添加 `grpc-api`、`grpc-stub` 和一个 transport，例如 `grpc-netty-shaded`。

### Protobuf Client 无法读取响应

Fory gRPC 使用 Fory 二进制协议 payload。请在两端使用同一份 schema 生成的 Fory gRPC companion。
