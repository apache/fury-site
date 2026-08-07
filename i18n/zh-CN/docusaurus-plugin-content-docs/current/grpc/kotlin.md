---
title: Kotlin gRPC 支持
sidebar_position: 13
id: kotlin
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

Fory IDL 可以生成 Kotlin 协程 gRPC 配套代码。生成的 gRPC 文件使用标准的 grpc-java 和 grpc-kotlin API，而每条请求和响应消息均由 Fory 序列化。

当 RPC 两端均由同一份 Fory IDL、protobuf IDL 或 FlatBuffers IDL 生成，并且双方都预期消息体采用 Fory 编码时，请使用此模式。如果 API 必须供通用 protobuf 客户端、反射工具或预期接收 protobuf 消息字节的组件使用，请采用常规的 protobuf gRPC 代码生成方式。

## 添加依赖

请将 Fory Kotlin、KSP、grpc-java、grpc-kotlin、协程库以及一种 grpc-java 传输实现添加到编译生成源码的应用或服务模块中。

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

如果应用已统一采用其他 grpc-java 传输实现，也可以使用该实现。生成的 Kotlin Fory gRPC 不需要通过 `grpc-protobuf` 编码载荷。

## 定义服务

服务定义可以来自 Fory IDL、protobuf IDL 或 FlatBuffers 的 `rpc_service` 定义。Fory IDL 服务示例如下：

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

使用 `--grpc` 生成 Kotlin 模型和 gRPC 配套代码：

```bash
foryc service.fdl --kotlin_out=./generated/kotlin --grpc
```

对于此 schema，Kotlin 生成器会生成：

| 文件                | 用途                         |
| ------------------- | ---------------------------- |
| `HelloRequest.kt`   | 请求的 Fory 模型类型         |
| `HelloReply.kt`     | 响应的 Fory 模型类型         |
| `ServiceForyModule` | 生成类型的 Fory 注册模块     |
| `GreeterGrpcKt.kt`  | 协程服务基类、存根和编解码器 |

编译生成的模型文件时，请运行 KSP，以确保 schema 序列化器在运行时可用。生成的请求和响应类型由服务配套代码所使用的生成 schema 模块注册，因此服务实现无需执行自定义序列化器注册。

## 实现服务端

实现生成的协程基类，并将其注册到标准 grpc-java 服务端。

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

未实现的生成方法会以 gRPC `UNIMPLEMENTED` 状态失败。服务方法抛出的异常遵循 grpc-kotlin 服务端行为。

## 创建客户端

直接使用 grpc-java 通道构造生成的协程存根。

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

通道的构造和关闭、截止时间、凭据、拦截器、负载均衡、重试以及服务端生命周期，仍由 grpc-java/grpc-kotlin 照常负责。

## 流式 RPC

Fory 服务定义可以使用相同的 gRPC 流式调用形式：

```protobuf
service Greeter {
  rpc SayHello (HelloRequest) returns (HelloReply);
  rpc LotsOfReplies (HelloRequest) returns (stream HelloReply);
  rpc LotsOfGreetings (stream HelloRequest) returns (HelloReply);
  rpc Chat (stream HelloRequest) returns (stream HelloReply);
}
```

流式 RPC 使用 `kotlinx.coroutines.flow.Flow`。

| IDL 形式                                  | 服务端方法                                | 客户端方法                                |
| ----------------------------------------- | ----------------------------------------- | ----------------------------------------- |
| `rpc A (Req) returns (Res)`               | `suspend fun a(request: Req): Res`        | `suspend fun a(request: Req): Res`        |
| `rpc A (Req) returns (stream Res)`        | `fun a(request: Req): Flow<Res>`          | `fun a(request: Req): Flow<Res>`          |
| `rpc A (stream Req) returns (Res)`        | `suspend fun a(requests: Flow<Req>): Res` | `suspend fun a(requests: Flow<Req>): Res` |
| `rpc A (stream Req) returns (stream Res)` | `fun a(requests: Flow<Req>): Flow<Res>`   | `fun a(requests: Flow<Req>): Flow<Res>`   |

生成的方法路径会保留 schema 中服务和方法名称的准确形式，例如 `/demo.greeter.Greeter/SayHello`。

服务端实现可以直接返回或使用 `Flow` 值：

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

生成的客户端会公开匹配的协程和 Flow API：

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

## gRPC 栈行为

生成的服务代码只替换请求和响应的序列化方式。标准 gRPC 的所有运行能力仍由 grpc-java 和 grpc-kotlin 负责：

- 截止时间和取消
- TLS 和身份认证
- 名称解析和负载均衡
- 客户端和服务端拦截器
- 状态码和元数据
- 通道池化和生命周期管理

## 互操作性

生成的 Kotlin 服务配套代码在 gRPC 帧中使用 Fory 二进制载荷。它们可与根据同一 Schema 生成的其他 Fory gRPC 配套代码互操作，例如 Java、Go、Python 和 Rust 配套代码。通用 protobuf gRPC 客户端无法解码这些载荷。

Fory IDL 服务支持直接使用联合类型作为请求和响应类型。对于 protobuf 输入，请使用 protobuf 前端所接受的 protobuf 服务形式；消息中的 protobuf `oneof` 字段会转换为 Fory 联合类型字段。

## 故障排查

### 未生成服务文件

同时传入 `--grpc` 和 `--kotlin_out`。不含服务定义的 schema 只会生成模型文件和 schema 模块。

### 运行时找不到序列化器类

确保 KSP 会处理生成的 Kotlin 模型源码，并且 `fory-kotlin-ksp` 与 `fory-kotlin` 使用相同的 Fory 版本。

### 无法解析 gRPC 类

请将 grpc-java 和 grpc-kotlin 依赖添加到应用模块。Fory Kotlin 构件不会自动添加这些依赖。

### Protobuf 客户端无法读取响应

Fory gRPC 使用 Fory 二进制协议载荷，而不是 protobuf 编码格式消息。同一服务 Schema 的两端都应使用生成的 Fory gRPC 配套代码。
