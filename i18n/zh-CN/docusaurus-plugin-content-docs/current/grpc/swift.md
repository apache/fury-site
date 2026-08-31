---
title: Swift gRPC
sidebar_position: 14
id: swift
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

Fory 可以为定义了服务的 Schema 生成 Swift gRPC 配套代码，提供常规 gRPC 服务 provider、客户端、方法描述和服务元数据；请求与响应对象使用 Fory 而非 protobuf 序列化。

当 RPC 双方均从同一份 Fory IDL、protobuf IDL 或 FlatBuffers IDL 生成，且都接收 Fory 编码的消息体时，使用此模式。如果 API 需要供通用 protobuf 客户端、反射工具或要求 protobuf 字节的组件使用，应采用常规 protobuf gRPC 代码生成。

配套代码面向 [grpc-swift](https://github.com/grpc/grpc-swift) 1.x。该版本线的平台最低要求与 Fory Swift 包一致（macOS 13、iOS 16）；grpc-swift 2.x 的最低要求更高。

## 添加依赖 {#add-dependencies}

`Fory` 包不依赖 grpc-swift。请在编译或运行生成代码的包中添加 grpc-swift：

```swift
// Package.swift
dependencies: [
    .package(url: "https://github.com/apache/fory.git", exact: "$version"),
    .package(url: "https://github.com/grpc/grpc-swift.git", from: "1.23.0"),
],
targets: [
    .target(
        name: "App",
        dependencies: [
            .product(name: "Fory", package: "fory"),
            .product(name: "GRPC", package: "grpc-swift"),
        ]
    )
]
```

## 定义服务 {#define-a-service}

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

使用 `--grpc` 生成 Swift 模型和 gRPC 配套代码：

```bash
foryc service.fdl --swift_out=./Sources/App --grpc
```

对于此 Schema，Swift 生成器输出：

| 文件 | 用途 |
| ---------------------- | -------------------------------- |
| `demo/greeter/greeter.swift` | Fory 模型类型和 `ForyModule` 辅助类型 |
| `demo/greeter/GreeterGrpc.swift` | gRPC provider、客户端和服务元数据 |

生成的 gRPC 符号带有包名前缀，因此上述 Schema 会生成 `Demo_Greeter_GreeterAsyncProvider`、`Demo_Greeter_GreeterAsyncClient` 和 `Demo_Greeter_GreeterProvider`。没有包名的 Schema 会省略此前缀，例如 `GreeterAsyncProvider`。

## 实现服务器 {#implement-a-server}

让类型实现生成的 `async`/`await` provider，并使用常规 grpc-swift `Server` 托管：

```swift
import Fory
import GRPC
import NIOPosix

final class GreeterService: Demo_Greeter_GreeterAsyncProvider {
  func sayHello(
    request: Demo.Greeter.HelloRequest,
    context: GRPCAsyncServerCallContext
  ) async throws -> Demo.Greeter.HelloReply {
    Demo.Greeter.HelloReply(reply: "Hello, " + request.name)
  }
}

let group = MultiThreadedEventLoopGroup(numberOfThreads: 1)
let server = try await Server.insecure(group: group)
  .withServiceProviders([GreeterService()])
  .bind(host: "127.0.0.1", port: 1234)
  .get()
```

请求和响应类型由配套代码使用的生成 Schema 模块注册，服务端无需手动注册序列化器。对于不使用 `async`/`await` 的服务端，还会生成基于 `EventLoopFuture` 的 `Demo_Greeter_GreeterProvider`。

## 创建客户端 {#create-a-client}

通过 grpc-swift channel 使用生成的异步客户端：

```swift
import Fory
import GRPC
import NIOPosix

let group = MultiThreadedEventLoopGroup(numberOfThreads: 1)
let channel = try GRPCChannelPool.with(
  target: .host("127.0.0.1", port: 1234),
  transportSecurity: .plaintext,
  eventLoopGroup: group)

let client = Demo_Greeter_GreeterAsyncClient(channel: channel)
let reply = try await client.sayHello(Demo.Greeter.HelloRequest(name: "Fory"))
print(reply.reply)
```

## 流式 RPC {#streaming-rpcs}

Fory 服务定义支持四种 gRPC 调用形式：

```protobuf
service Greeter {
  rpc SayHello (HelloRequest) returns (HelloReply);
  rpc LotsOfReplies (HelloRequest) returns (stream HelloReply);
  rpc LotsOfGreetings (stream HelloRequest) returns (HelloReply);
  rpc BidiHello (stream HelloRequest) returns (stream HelloReply);
}
```

流式方法直接暴露请求和响应类型。provider 通过响应写入器（`send(_:)`）输出服务端响应，通过 `AsyncSequence` 接收客户端输入；客户端针对服务端流式响应返回 `AsyncSequence`：

```swift
// 服务端
func lotsOfReplies(
  request: Demo.Greeter.HelloRequest,
  responseStream: Demo_Greeter_GreeterAsyncResponseStream<Demo.Greeter.HelloReply>,
  context: GRPCAsyncServerCallContext
) async throws {
  try await responseStream.send(Demo.Greeter.HelloReply(reply: "Hi " + request.name))
}

// 客户端
for try await reply in client.lotsOfReplies(Demo.Greeter.HelloRequest(name: "Fory")) {
  print(reply.reply)
}
```

## gRPC 运行时行为 {#grpc-runtime-behavior}

生成的配套代码通过私有 `GRPCPayload` 包装类型携带 Fory 编码的字节。Swift `Fory` 实例只能由单线程使用，因此包装类型按 Schema 模块的配置和注册信息为每个线程创建一个 `Fory`，无需共享实例即可安全地执行并发 RPC。导入的请求和响应类型使用各自的命名空间，并通过所属模块传递注册，因此服务跨越导入边界时无需额外注册。

## Swift 语言模式 {#swift-language-mode}

请以 Swift 5 语言模式编译生成的配套代码（使用 `swift-tools-version:5.9`，或在 6.x 清单中为目标设置 `swiftLanguageMode(.v5)`）。grpc-swift 会在调用任务与事件循环之间传递每个请求和响应，因此编码包装类型要求载荷符合 `Sendable`，而生成的 Fory Swift 模型未声明此协议。此要求适用于所有调用形式，包括一元调用，并不限于流式调用。

## 已知限制 {#known-limitations}

仅生成 async/await 客户端。grpc-swift 的 `EventLoopFuture` 客户端返回以传输消息类型为参数的调用对象，这会暴露内部 Fory 包装类型，因此不生成该客户端。两种 provider（异步和 `EventLoopFuture`）都会生成。

不生成拦截器。grpc-swift 拦截器以传输消息类型为参数，而该类型是内部 Fory 包装类型；生成拦截器钩子会暴露此包装类型。通用功能应通过自定义 channel 或服务端配置实现。

RPC 名称必须能转换为合法的 Swift 成员名。编译器会拒绝仅包含下划线的 RPC 名称，因为其规范化结果 `_` 在 Swift 中用于丢弃值；也会拒绝 `handle`、`serviceName`、`channel` 和 `defaultCallOptions`，因为它们与生成的 provider 和客户端成员冲突。请在 Schema 中重命名这些 RPC。

Swift 模型将每个包放在嵌套的 `enum` 命名空间下，因此两个共享顶层包名的 Schema（例如 `demo.shared` 和 `demo.greeter`）都会生成 `public enum Demo`。编译器会在写入文件前因顶层符号冲突而拒绝生成。这是模型生成的行为，并非 gRPC 特有，但也会影响跨这些包导入类型的服务。应使用不同的顶层包名，例如 `shared.models` 和 `greeter.api`。分别调用 `foryc` 并生成到不同 Swift 模块，仅对无关联的 Schema 有效，因为预检查会递归收集导入：编译 `demo.greeter` 时仍会将 `demo.shared` 纳入依赖图，即使后者已在另一次调用中生成，也会拒绝重复的 `Demo`。导入图中的顶层包名必须互不冲突。

## 故障排查 {#troubleshooting}

### 缺少 grpc-swift 类型 {#missing-grpc-swift-types}

如果构建时找不到 `GRPCAsyncServerCallContext`、`Server` 或 `GRPCChannelPool`，请为编译生成代码的目标添加 grpc-swift 依赖及 `GRPC` product。

### Protobuf 客户端无法解码服务 {#protobuf-clients-cannot-decode-the-service}

生成的配套代码交换的是 Fory 编码的消息体，而不是 protobuf 字节，通用 protobuf 客户端无法解码。双方必须从同一份 Fory IDL 生成，并使用生成的 Fory 配套代码。
