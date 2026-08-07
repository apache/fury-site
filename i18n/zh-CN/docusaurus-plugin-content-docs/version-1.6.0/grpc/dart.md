---
title: Dart gRPC
sidebar_position: 11
id: dart
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

对于定义了服务的 schema，Fory 可以生成配套的 Dart gRPC 服务代码。生成的代码使用常规的 `package:grpc` 客户端、服务基类、方法描述符、调用选项、截止时间、取消机制和状态码，但请求与响应对象使用 Fory 而非 protobuf 进行序列化。

当 RPC 两端都从同一份 Fory IDL、protobuf IDL 或 FlatBuffers IDL 生成，并且都使用 Fory 编码的消息体时，请使用此模式。如果 API 必须由通用 protobuf 客户端、反射工具或要求使用 protobuf 消息字节的组件调用，请使用标准的 protobuf gRPC 代码生成方式。

## 添加依赖

`fory` 包不会添加 gRPC 依赖。请在编译或运行所生成配套服务代码的应用中添加 `grpc`，并添加用于生成 Fory 序列化器代码的开发依赖 `build_runner`：

```yaml
dependencies:
  fory: ^1.6.0
  grpc: ^4.0.0

dev_dependencies:
  build_runner: ^2.4.0
```

客户端和服务端应用使用相同的依赖即可。

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

使用 `--grpc` 生成 Dart 模型和配套的 gRPC 代码：

```bash
foryc service.fdl --dart_out=./lib/generated --grpc
```

然后运行一次 `build_runner`，为生成的模型生成 Fory 序列化器 part 文件（代码运行前必须完成此步骤）：

```bash
dart run build_runner build
```

对于此 schema，Dart 生成器会生成以下内容（模型文件和模块以包名的最后一段 `greeter` 命名）：

| 文件                                        | 用途                                       |
| ------------------------------------------- | ------------------------------------------ |
| `demo/greeter/greeter.dart`                 | Fory 模型类型和 schema 模块                |
| `demo/greeter/greeter.fory.dart`            | 序列化器和注册代码（由 build_runner 生成） |
| `demo/greeter/greeter_grpc.dart`            | gRPC 客户端、服务基类和方法描述符          |
| `GreeterForyModule` in `greeter.dart`       | 生成类型的 Fory 注册模块                   |
| `GreeterServiceBase` in `greeter_grpc.dart` | 服务端实现的基类                           |
| `GreeterClient` in `greeter_grpc.dart`      | 用于 gRPC 调用的客户端存根                 |

生成的客户端和服务基类会自动获取一个就绪的 `Fory`，并在首次使用时注册 schema 中的类型，因此无需手动注册。如果需要共享自定义 `Fory`（例如，已配置额外模块的实例），请在第一次 RPC 调用之前执行一次 `GreeterForyModule.install(yourFory)`；这一步是可选的。

## 实现服务端

继承生成的 `GreeterServiceBase`，并使用 grpc-dart 的 `Server` 托管服务：

```dart
import 'dart:io';

import 'package:grpc/grpc.dart';
import 'demo/greeter/greeter.dart';
import 'demo/greeter/greeter_grpc.dart';

class GreeterService extends GreeterServiceBase {
  @override
  Future<HelloReply> sayHello(ServiceCall call, HelloRequest request) async {
    final reply = HelloReply()..reply = 'Hello, ${request.name}';
    return reply;
  }
}

Future<void> main() async {
  final server = Server.create(services: [GreeterService()]);
  await server.serve(address: InternetAddress.loopbackIPv4, port: 50051);
}
```

## 创建客户端

通过 `ClientChannel` 使用生成的客户端：

```dart
import 'package:grpc/grpc.dart';
import 'demo/greeter/greeter.dart';
import 'demo/greeter/greeter_grpc.dart';

Future<void> main() async {
  final channel = ClientChannel(
    'localhost',
    port: 50051,
    options: const ChannelOptions(
      credentials: ChannelCredentials.insecure(),
    ),
  );
  final client = GreeterClient(channel);

  final reply = await client.sayHello(HelloRequest()..name = 'Fory');
  print(reply.reply);

  await channel.shutdown();
}
```

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

生成的 Dart 方法遵循 grpc-dart 的惯例。单一响应返回 `ResponseFuture<R>`（客户端流式调用通过 `.single` 适配调用）；流式响应返回 `ResponseStream<R>`。在服务端，单一请求以消息类型传入，流式请求以 `Stream` 传入；方法对单一响应返回 `Future`，对流式响应返回 `Stream`：

| IDL 形式                                  | 客户端方法                                           | 服务端方法（重写）                                     |
| ----------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------ |
| `rpc A (Req) returns (Res)`               | `ResponseFuture<Res> a(Req request, {CallOptions?})` | `Future<Res> a(ServiceCall call, Req request)`         |
| `rpc A (Req) returns (stream Res)`        | `ResponseStream<Res> a(Req request, {CallOptions?})` | `Stream<Res> a(ServiceCall call, Req request)`         |
| `rpc A (stream Req) returns (Res)`        | `ResponseFuture<Res> a(Stream<Req> request, {...})`  | `Future<Res> a(ServiceCall call, Stream<Req> request)` |
| `rpc A (stream Req) returns (stream Res)` | `ResponseStream<Res> a(Stream<Req> request, {...})`  | `Stream<Res> a(ServiceCall call, Stream<Req> request)` |

服务端实现可直接使用生成的流式方法形式：

```dart
class GreeterService extends GreeterServiceBase {
  @override
  Stream<HelloReply> lotsOfReplies(
    ServiceCall call,
    HelloRequest request,
  ) async* {
    for (final greeting in ['Hello, ${request.name}', 'Welcome, ${request.name}']) {
      yield HelloReply()..reply = greeting;
    }
  }

  @override
  Future<HelloReply> lotsOfGreetings(
    ServiceCall call,
    Stream<HelloRequest> request,
  ) async {
    final names = <String>[];
    await for (final message in request) {
      names.add(message.name);
    }
    return HelloReply()..reply = names.join(', ');
  }

  @override
  Stream<HelloReply> chat(
    ServiceCall call,
    Stream<HelloRequest> request,
  ) async* {
    await for (final message in request) {
      yield HelloReply()..reply = 'Hello, ${message.name}';
    }
  }
}
```

生成的客户端返回标准的 grpc-dart 调用对象：

```dart
// Server streaming.
await for (final reply in client.lotsOfReplies(HelloRequest()..name = 'Fory')) {
  print(reply.reply);
}

// Client streaming.
final summary = await client.lotsOfGreetings(
  Stream.fromIterable([
    HelloRequest()..name = 'Ada',
    HelloRequest()..name = 'Grace',
  ]),
);
print(summary.reply);

// Bidirectional streaming.
await for (final reply in client.chat(
  Stream.fromIterable([HelloRequest()..name = 'Fory']),
)) {
  print(reply.reply);
}
```

生成的描述符会在 gRPC 路径中原样保留 IDL 服务名和方法名，而 Dart 方法使用 camelCase 命名。

## 生成的模块名称

Dart 模型文件和 schema 模块根据包名的最后一段命名，而不是根据 gRPC 服务名命名。（当 schema 没有包名时，则使用源文件的基本名称。）

| Schema 输入（包名）             | 模型文件            | Schema 模块             |
| ------------------------------- | ------------------- | ----------------------- |
| `service.fdl` (`demo.greeter`)  | `greeter.dart`      | `GreeterForyModule`     |
| `api.fdl` (`demo.order_events`) | `order_events.dart` | `OrderEventsForyModule` |
| `greeter.fdl` (`demo.greeter`)  | `greeter.dart`      | `GreeterForyModule`     |

名为 `Greeter` 的 gRPC 服务仍会生成配套文件 `<stem>_grpc.dart`，其中包含 `GreeterClient` 和 `GreeterServiceBase`；它不会改变 schema 模块名称。如果多个 schema 文件使用相同的包名末段，请将它们放在不同的输出目录中，或选择能够生成不同 Dart 模型文件的包名或文件名。

## 运行行为

生成的服务代码仅替换请求与响应的序列化方式。所有常规 gRPC 运行能力仍由 gRPC 技术栈负责：

- 截止时间与取消
- TLS 与身份验证
- 名称解析与负载均衡
- 客户端与服务端拦截器
- 状态码与元数据
- Channel 生命周期管理

## 故障排除

### 缺少 `package:grpc` 类型

请将 `grpc` 添加到应用依赖中。生成的 Fory 服务文件会导入 grpc-dart API，但 `fory` 有意不依赖 gRPC。

### 生成的代码引用了缺失的 `.fory.dart` Part 文件

生成或重新生成 Dart 源文件后，请运行 `dart run build_runner build`。序列化器 part 文件由 `build_runner` 而非 `foryc` 生成。

### Protobuf 客户端无法解码服务

Fory gRPC 配套代码不会对消息使用 protobuf 编码格式。对于 Fory 生成的服务，请使用 Fory 生成的客户端；如需支持通用 protobuf 客户端，请另行公开 protobuf 服务端点。
