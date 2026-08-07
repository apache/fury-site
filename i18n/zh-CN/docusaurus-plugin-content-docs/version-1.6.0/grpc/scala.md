---
title: Scala gRPC
sidebar_position: 12
id: scala
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

对于定义了服务的 Schema，Fory 可以生成 Scala 3 gRPC 服务配套代码。生成的服务代码使用常规的 grpc-java 通道、服务器、截止时间、状态码、拦截器和传输安全机制，而请求和响应对象则使用 Fory 而非 protobuf 进行序列化。

当 RPC 两端都由同一份 Fory IDL、protobuf IDL 或 FlatBuffers IDL 生成，并且你希望将 gRPC 传输语义与 Fory 载荷编码结合使用时，请使用此模式。当 API 必须供通用 protobuf 客户端、反射工具或需要 protobuf 消息字节的组件使用时，请使用标准的 protobuf gRPC 代码生成方式。

## 添加依赖

生成的 Scala 服务文件依赖 grpc-java 进行编译。`fory-scala` 构件不会将 gRPC 添加为硬依赖，因此请在应用构建中添加 grpc-java 依赖，并使其版本与服务栈其余部分保持一致。

```sbt
libraryDependencies ++= Seq(
  "org.apache.fory" %% "fory-scala" % "<fory-version>",
  "io.grpc" % "grpc-api" % "<grpc-version>",
  "io.grpc" % "grpc-stub" % "<grpc-version>",
  "io.grpc" % "grpc-netty-shaded" % "<grpc-version>"
)
```

生成的 Scala 模型和 gRPC 服务配套代码是 Scala 3 源码。`fory-scala` 构件仍会为 Scala 2.13 和 Scala 3 进行交叉构建，不依赖其他库的 `org.apache.fory.scala.rpc` 句柄 trait 可从共享构件中使用。

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

使用 `--grpc` 生成 Scala 模型和 gRPC 配套代码：

```bash
foryc service.fdl --scala_out=./generated/scala --grpc
```

对于此 Schema，Scala 生成器会输出：

| 文件                      | 用途                                 |
| ------------------------- | ------------------------------------ |
| `HelloRequest.scala`      | 请求对应的 Fory 模型类型             |
| `HelloReply.scala`        | 响应对应的 Fory 模型类型             |
| `GreeterForyModule.scala` | 生成类型对应的 Fory 注册模块         |
| `GreeterGrpc.scala`       | grpc-java 服务基类、客户端和编解码器 |

## 实现服务器

扩展生成的 `GreeterGrpc.GreeterImplBase` 类，并将其注册到标准的 grpc-java `Server`。一元 RPC 可以通过直接将请求转换为响应的方法来实现：

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

生成的代码会注册生成的请求和响应类型，因此服务实现无需执行自定义序列化器注册。

## 创建客户端

通过普通的 grpc-java 通道使用生成的客户端：

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

Scala 风格的一元方法返回 `RpcFuture[A]`。使用 `asFuture` 进行 Scala 组合；如果需要在 RPC 完成前取消它，请调用 `cancel()`。同一个生成的客户端还会公开每个方法对应的 grpc-java 风格变体，例如基于观察者的异步调用、阻塞调用和一元 `ListenableFuture` 调用。

## 流式 RPC

Fory 服务定义可以使用与 grpc-java 相同的 gRPC 流式形式：

```protobuf
service Greeter {
  rpc SayHello (HelloRequest) returns (HelloReply);
  rpc LotsOfReplies (HelloRequest) returns (stream HelloReply);
  rpc LotsOfGreetings (stream HelloRequest) returns (HelloReply);
  rpc Chat (stream HelloRequest) returns (stream HelloReply);
}
```

生成的 Scala 方法使用以下形式：

| IDL 形式   | Scala 客户端便捷接口 | grpc-java 风格方法                        |
| ---------- | -------------------- | ----------------------------------------- |
| 一元       | `RpcFuture[Resp]`    | 异步观察者、阻塞调用和 `ListenableFuture` |
| 服务器流式 | `RpcIterator[Resp]`  | 异步观察者和阻塞迭代器                    |
| 客户端流式 | 无                   | `StreamObserver` 请求流                   |
| 双向流式   | 无                   | `StreamObserver` 请求流和响应流           |

Scala 风格的便捷层涵盖了可以通过直接的 Scala 句柄保留重要生命周期控制的场景。一元调用使用 `RpcFuture[A]`，让调用者可以与 Scala `Future` 组合，同时不会失去取消能力。服务器流式调用使用 `RpcIterator[A]`，让调用者可以按照普通 Scala `Iterator` 约定使用响应，同时仍能关闭底层 RPC。客户端流式和双向流式调用继续使用 grpc-java `StreamObserver` API，因为请求流的生命周期、完成、取消和流量控制规则都遵循 grpc-java 规则。

### 服务器流式客户端

当客户端需要拉取式消费时，请使用 Scala 风格的方法：

```scala
val stream = client.lotsOfReplies(HelloRequest("Fory"))
try {
  while (stream.hasNext) {
    val reply = stream.next()
    println(reply.reply)
  }
} finally {
  stream.close()
}
```

`RpcIterator[A]` 扩展了 Scala `Iterator[A]` 和 `AutoCloseable`。服务器正常完成响应后，已被完全消费的流会随之关闭。如果调用者提前停止消费，请调用 `close()` 或 `cancel()` 释放 gRPC 调用，并通知服务器不再需要该响应流。

当客户端需要 grpc-java 异步回调时，请使用观察者重载：

```scala
import io.grpc.stub.StreamObserver

client.lotsOfReplies(
  HelloRequest("Fory"),
  new StreamObserver[HelloReply] {
    override def onNext(value: HelloReply): Unit =
      println(value.reply)

    override def onError(t: Throwable): Unit =
      t.printStackTrace()

    override def onCompleted(): Unit =
      println("done")
  }
)
```

生成的客户端还会通过 `lotsOfRepliesBlocking(request)` 公开 grpc-java 风格的阻塞迭代器。当需要提前取消时，优先使用 Scala 风格的 `RpcIterator`；只有在适配现有 grpc-java 工作流时，才使用阻塞迭代器。

### 客户端流式客户端

对于客户端流式 RPC，生成的方法接收响应观察者并返回请求观察者。每个请求都通过 `onNext` 发送；客户端发送完毕后，应且仅应调用一次 `onCompleted`：

```scala
import io.grpc.stub.StreamObserver

val requests = client.lotsOfGreetings(
  new StreamObserver[HelloReply] {
    override def onNext(value: HelloReply): Unit =
      println(value.reply)

    override def onError(t: Throwable): Unit =
      t.printStackTrace()

    override def onCompleted(): Unit =
      println("server completed")
  }
)

requests.onNext(HelloRequest("Ada"))
requests.onNext(HelloRequest("Grace"))
requests.onCompleted()
```

如果客户端无法完成请求发送，请通过 `requests.onError(error)` 报告失败。截止时间、取消和调用选项都是标准的 grpc-java stub 功能，因此应在发起调用前在生成的客户端 stub 上配置。

### 双向流式客户端

双向流式调用采用同样的 grpc-java 请求观察者模式，但在客户端仍在发送请求时，响应就可能到达：

```scala
import io.grpc.stub.StreamObserver

val requests = client.chat(
  new StreamObserver[HelloReply] {
    override def onNext(value: HelloReply): Unit =
      println(value.reply)

    override def onError(t: Throwable): Unit =
      t.printStackTrace()

    override def onCompleted(): Unit =
      println("chat closed")
  }
)

requests.onNext(HelloRequest("first"))
requests.onNext(HelloRequest("second"))
requests.onCompleted()
```

当应用需要手动控制入站流量、就绪回调、取消处理器或直接在传输层取消时，请使用 `ClientResponseObserver`、`ClientCallStreamObserver` 或 `ServerCallStreamObserver` 等 grpc-java 观察者子类型。生成的 Scala 方法接收标准的 grpc-java 观察者类型，因此无需额外的 Fory API 即可继续使用这些高级 grpc-java 模式。

### 流式服务器

一元服务器方法可以使用前文所示的 Scala 风格直接重写。流式服务器方法则使用 grpc-java 观察者。服务器流式实现接收一个请求，并写入零个或多个响应：

```scala
import io.grpc.stub.StreamObserver
import scala.util.control.NonFatal

final class GreeterService extends GreeterGrpc.GreeterImplBase {
  override def lotsOfReplies(
      request: HelloRequest,
      responseObserver: StreamObserver[HelloReply]
  ): Unit =
    try {
      responseObserver.onNext(HelloReply(s"Hello, ${request.name}"))
      responseObserver.onNext(HelloReply(s"Welcome, ${request.name}"))
      responseObserver.onCompleted()
    } catch {
      case NonFatal(e) =>
        responseObserver.onError(e)
    }
}
```

客户端流式服务器会返回一个用于接收传入请求的观察者，并在请求流完成时写入单个响应：

```scala
import io.grpc.stub.StreamObserver
import scala.collection.mutable.ArrayBuffer

final class GreeterService extends GreeterGrpc.GreeterImplBase {
  override def lotsOfGreetings(
      responseObserver: StreamObserver[HelloReply]
  ): StreamObserver[HelloRequest] =
    new StreamObserver[HelloRequest] {
      private val names = ArrayBuffer.empty[String]

      override def onNext(value: HelloRequest): Unit =
        names += value.name

      override def onError(t: Throwable): Unit =
        names.clear()

      override def onCompleted(): Unit = {
        responseObserver.onNext(HelloReply(names.mkString("Hello ", ", ", "")))
        responseObserver.onCompleted()
      }
    }
}
```

双向流式服务器同样会返回一个用于接收传入请求的观察者，但可以在每次 `onNext` 调用时发出响应：

```scala
import io.grpc.stub.StreamObserver

final class GreeterService extends GreeterGrpc.GreeterImplBase {
  override def chat(
      responseObserver: StreamObserver[HelloReply]
  ): StreamObserver[HelloRequest] =
    new StreamObserver[HelloRequest] {
      override def onNext(value: HelloRequest): Unit =
        responseObserver.onNext(HelloReply(s"Echo: ${value.name}"))

      override def onError(t: Throwable): Unit = ()

      override def onCompleted(): Unit =
        responseObserver.onCompleted()
    }
}
```

服务器流式、客户端流式和双向流式服务器方法使用 grpc-java `StreamObserver` API，因为流的完成、请求流量控制、取消和背压都遵循 grpc-java 行为。

## gRPC 栈行为

生成的服务代码只会替换请求和响应的序列化方式。所有常规 gRPC 运行功能仍由 grpc-java 负责：

- 截止时间和取消
- TLS 和身份认证
- 名称解析和负载均衡
- 客户端和服务器拦截器
- 状态码和元数据
- 通道池和生命周期管理

## 故障排查

### 缺少 `io.grpc` 或 Guava 类

添加上面列出的 grpc-java 依赖。生成的 Fory 服务文件会导入 grpc-java API，但 `fory-scala` 有意不依赖 gRPC。

### 通用 Protobuf 客户端无法读取载荷

Fory 生成的 gRPC 服务在 gRPC 消息帧内使用 Fory 字节，而不是 protobuf 消息字节。Fory 生成的服务应使用 Fory 生成的客户端；如果需要支持通用 protobuf 客户端，请另行提供 protobuf 服务端点。
