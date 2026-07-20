---
title: Kotlin gRPC 支持
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

Fory IDL 可以生成 Kotlin coroutine gRPC companion。生成的 gRPC 文件使用普通 grpc-java 和
grpc-kotlin API，每个 request/response message 使用 Fory 序列化。

当 RPC 两端都由同一份 Fory IDL、protobuf IDL 或 FlatBuffers IDL 生成，并且两端都期望
Fory 编码的 message body 时，可以使用这种模式。如果 API 必须被通用 protobuf client、
reflection 工具或期望 protobuf message bytes 的组件消费，请使用标准 protobuf gRPC 代码生成。

## 添加依赖

在编译生成源码的应用或 service module 中添加 Fory Kotlin、KSP、grpc-java、grpc-kotlin、
coroutines 和一个 grpc-java transport：

```kotlin
plugins {
  id("com.google.devtools.ksp") version "<ksp-version>"
}

dependencies {
  implementation("org.apache.fory:fory-kotlin:<fory-version>")
  ksp("org.apache.fory:fory-kotlin-ksp:<fory-version>")

  implementation("io.grpc:grpc-api:<grpc-version>")
  implementation("io.grpc:grpc-stub:<grpc-version>")
  implementation("io.grpc:grpc-kotlin-stub:<grpc-kotlin-version>")
  implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:<coroutines-version>")

  runtimeOnly("io.grpc:grpc-netty-shaded:<grpc-version>")
}
```

如果应用已经统一使用其他 grpc-java transport，可以替换 `grpc-netty-shaded`。生成的 Kotlin
Fory gRPC 不需要 `grpc-protobuf` 来编码 payload。

## 定义 Service

Service 定义可以来自 Fory IDL、protobuf IDL 或 FlatBuffers `rpc_service`。Fory IDL service
示例如下：

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

使用 `--grpc` 生成 Kotlin model 和 gRPC companion：

```bash
foryc service.fdl --kotlin_out=./generated/kotlin --grpc
```

该 schema 会生成：

| 文件                | 用途                                  |
| ------------------- | ------------------------------------- |
| `HelloRequest.kt`   | request 的 Fory model 类型            |
| `HelloReply.kt`     | response 的 Fory model 类型           |
| `ServiceForyModule` | 生成类型的 Fory 注册 module           |
| `GreeterGrpcKt.kt`  | Coroutine service base、stub 和 codec |

编译生成 model 文件时需要运行 KSP，以便 runtime 可以使用 schema serializer。生成的 request 和
response 类型由 service companion 使用的 schema module 注册，service 实现不需要手动注册 serializer。

## 实现 Server

实现生成的 coroutine base class，并注册到普通 grpc-java server：

```kotlin
import demo.greeter.GreeterGrpcKt
import demo.greeter.HelloReply
import demo.greeter.HelloRequest
import io.grpc.ServerBuilder

class GreeterService : GreeterGrpcKt.GreeterCoroutineImplBase() {
  override suspend fun sayHello(request: HelloRequest): HelloReply =
    HelloReply(reply = "Hello, ${request.name}")
}

val server = ServerBuilder
  .forPort(50051)
  .addService(GreeterService())
  .build()
  .start()
```

未实现的生成方法会返回 gRPC `UNIMPLEMENTED`。Service 方法抛出的异常遵循 grpc-kotlin server 行为。

## 创建 Client

从 grpc-java channel 直接构造生成的 coroutine stub：

```kotlin
import demo.greeter.GreeterGrpcKt
import demo.greeter.HelloRequest
import io.grpc.ManagedChannelBuilder

val channel = ManagedChannelBuilder
  .forAddress("localhost", 50051)
  .usePlaintext()
  .build()

val stub = GreeterGrpcKt.GreeterCoroutineStub(channel)
val reply = stub.sayHello(HelloRequest(name = "Fory"))
```

Channel 构造、关闭、deadline、credential、interceptor、load balancing、retry 和 server lifecycle
仍由 grpc-java/grpc-kotlin 负责。

## Streaming RPC

Fory service 可以使用 gRPC 的所有 streaming shape：

```protobuf
service Greeter {
  rpc SayHello (HelloRequest) returns (HelloReply);
  rpc LotsOfReplies (HelloRequest) returns (stream HelloReply);
  rpc LotsOfGreetings (stream HelloRequest) returns (HelloReply);
  rpc Chat (stream HelloRequest) returns (stream HelloReply);
}
```

Streaming RPC 使用 `kotlinx.coroutines.flow.Flow`。

| IDL shape                                 | Server 方法                               | Client 方法                               |
| ----------------------------------------- | ----------------------------------------- | ----------------------------------------- |
| `rpc A (Req) returns (Res)`               | `suspend fun a(request: Req): Res`        | `suspend fun a(request: Req): Res`        |
| `rpc A (Req) returns (stream Res)`        | `fun a(request: Req): Flow<Res>`          | `fun a(request: Req): Flow<Res>`          |
| `rpc A (stream Req) returns (Res)`        | `suspend fun a(requests: Flow<Req>): Res` | `suspend fun a(requests: Flow<Req>): Res` |
| `rpc A (stream Req) returns (stream Res)` | `fun a(requests: Flow<Req>): Flow<Res>`   | `fun a(requests: Flow<Req>): Flow<Res>`   |

生成 method path 保留 schema 中的 service 和 method 名称，例如 `/demo.greeter.Greeter/SayHello`。

Server 可以直接返回或消费 `Flow`：

```kotlin
import demo.greeter.GreeterGrpcKt
import demo.greeter.HelloReply
import demo.greeter.HelloRequest
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.toList

class GreeterService : GreeterGrpcKt.GreeterCoroutineImplBase() {
  override fun lotsOfReplies(request: HelloRequest): Flow<HelloReply> = flow {
    emit(HelloReply(reply = "Hello, ${request.name}"))
    emit(HelloReply(reply = "Welcome, ${request.name}"))
  }

  override suspend fun lotsOfGreetings(
    requests: Flow<HelloRequest>
  ): HelloReply {
    val names = requests.toList().joinToString(", ") { it.name }
    return HelloReply(reply = names)
  }

  override fun chat(requests: Flow<HelloRequest>): Flow<HelloReply> =
    requests.map { request ->
      HelloReply(reply = "Hello, ${request.name}")
    }
}
```

生成的 client 暴露对应的 coroutine 和 `Flow` API：

```kotlin
import demo.greeter.HelloRequest
import kotlinx.coroutines.flow.flowOf

stub.lotsOfReplies(HelloRequest(name = "Fory")).collect { reply ->
  println(reply.reply)
}

val summary = stub.lotsOfGreetings(
  flowOf(
    HelloRequest(name = "Ada"),
    HelloRequest(name = "Grace"),
  )
)
println(summary.reply)

stub.chat(
  flowOf(
    HelloRequest(name = "Fory"),
    HelloRequest(name = "RPC"),
  )
).collect { reply ->
  println(reply.reply)
}
```

## gRPC 运行时行为

生成的 service code 只替换 request/response 序列化。常规 gRPC service 行为仍由 grpc-java 和
grpc-kotlin 提供：

- Deadline 和取消
- TLS 和认证
- 名称解析与负载均衡
- Client/server interceptor
- Status code 和 metadata
- Channel 池化与生命周期管理

## 互操作性

生成的 Kotlin service companion 在 gRPC frame 中使用 Fory 二进制 payload。它可以与从同一 schema
生成的其他 Fory gRPC companion 互操作，例如 Java、Go、Python 和 Rust。通用 protobuf gRPC
client 无法解码这些 payload。

## 故障排查

### 缺少生成的 service 文件

同时传入 `--grpc` 和 `--kotlin_out`。没有 service 定义的 schema 只会生成 model 文件和 schema module。

### 运行时找不到 serializer class

确保生成的 Kotlin model source 运行了 KSP，并且 `fory-kotlin-ksp` 与 `fory-kotlin` 使用同一个 Fory 版本。

### gRPC 类无法解析

向应用 module 添加 grpc-java 和 grpc-kotlin 依赖。Fory Kotlin artifact 不会自动添加这些依赖。

### Protobuf client 无法读取响应

Fory gRPC 使用 Fory 二进制协议 payload，不是 protobuf wire-format message。请在两端使用同一份
schema 生成的 Fory gRPC companion。
