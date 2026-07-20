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

Fory 可以为包含 service 定义的 schema 生成 Dart gRPC service companion。
生成代码使用标准 `package:grpc` client、service base、method descriptor、
call option、deadline、取消和 status code；request 和 response 对象则使用
Fory 序列化，而不是 protobuf。

当 RPC 两端都由同一份 Fory IDL、protobuf IDL 或 FlatBuffers IDL 生成，并且
两端都期望 Fory 编码的 message body 时，可以使用这种模式。如果 API 必须被通用
protobuf client、reflection 工具或期望 protobuf message bytes 的组件消费，请使用
标准 protobuf gRPC 代码生成。

## 添加依赖

`fory` package 不会加入 gRPC 依赖。编译或运行生成 service companion 的应用需要
添加 `grpc`，同时添加用于生成 Fory serializer 代码的 `build_runner` dev dependency：

```yaml
dependencies:
  fory: ^1.4.0
  grpc: ^4.0.0

dev_dependencies:
  build_runner: ^2.4.0
```

client 和 server 应用使用同一组依赖。

## 定义 Service

Service 定义可以来自 Fory IDL、protobuf IDL 或 FlatBuffers `rpc_service` 定义。
Fory IDL service 示例：

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

使用 `--grpc` 生成 Dart model 和 gRPC companion 代码：

```bash
foryc service.fdl --dart_out=./lib/generated --grpc
```

然后运行一次 `build_runner`，为生成的 model 输出 Fory serializer part 文件。代码运行前
必须执行这一步：

```bash
dart run build_runner build --delete-conflicting-outputs
```

对这个 schema，Dart generator 会输出如下文件（model 文件和 module 名称来自 package
最后一段 `greeter`）：

| 文件                                        | 用途                                      |
| ------------------------------------------- | ----------------------------------------- |
| `demo/greeter/greeter.dart`                 | Fory model type 和 schema module          |
| `demo/greeter/greeter.fory.dart`            | Serializer 和注册逻辑，由 build_runner 生成 |
| `demo/greeter/greeter_grpc.dart`            | gRPC client、service base 和 method descriptor |
| `GreeterForyModule` in `greeter.dart`       | 生成类型的 Fory 注册 module               |
| `GreeterServiceBase` in `greeter_grpc.dart` | server 实现使用的 base class              |
| `GreeterClient` in `greeter_grpc.dart`      | gRPC 调用使用的 client stub               |

生成的 client 和 service base 会自动获取可用的 `Fory`，并在首次使用时注册该
schema 的类型，因此不需要手动注册。若需要共享自定义 `Fory`（例如已经配置了额外
module 的实例），可在第一次 RPC 前调用一次 `GreeterForyModule.install(yourFory)`；
这是可选操作。

## 实现 Server

继承生成的 `GreeterServiceBase`，并用 grpc-dart 的 `Server` 承载：

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

## 创建 Client

通过 `ClientChannel` 使用生成的 client：

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

## Streaming RPC

Fory service 定义可以使用相同的 gRPC streaming 形态：

```protobuf
service Greeter {
  rpc SayHello (HelloRequest) returns (HelloReply);
  rpc LotsOfReplies (HelloRequest) returns (stream HelloReply);
  rpc LotsOfGreetings (stream HelloRequest) returns (HelloReply);
  rpc Chat (stream HelloRequest) returns (stream HelloReply);
}
```

生成的 Dart 方法遵循 grpc-dart 约定。单响应方法返回 `ResponseFuture<R>`
（client-streaming 会用 `.single` 适配调用）；streaming 响应方法返回
`ResponseStream<R>`。Server 端，单请求以 message type 传入，streaming 请求以
`Stream` 传入；方法对单响应返回 `Future`，对 streaming 响应返回 `Stream`：

| IDL shape                                 | Client 方法                                         | Server 方法（override）                               |
| ----------------------------------------- | --------------------------------------------------- | ----------------------------------------------------- |
| `rpc A (Req) returns (Res)`               | `ResponseFuture<Res> a(Req request, {CallOptions?})` | `Future<Res> a(ServiceCall call, Req request)`        |
| `rpc A (Req) returns (stream Res)`        | `ResponseStream<Res> a(Req request, {CallOptions?})` | `Stream<Res> a(ServiceCall call, Req request)`        |
| `rpc A (stream Req) returns (Res)`        | `ResponseFuture<Res> a(Stream<Req> request, {...})`  | `Future<Res> a(ServiceCall call, Stream<Req> request)` |
| `rpc A (stream Req) returns (stream Res)` | `ResponseStream<Res> a(Stream<Req> request, {...})`  | `Stream<Res> a(ServiceCall call, Stream<Req> request)` |

Server 实现直接使用生成的 streaming 方法形态：

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

生成的 client 返回标准 grpc-dart 调用对象：

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

生成的 descriptor 会为 gRPC path 保留 IDL 中精确的 service 和 method 名称；
Dart 方法使用 camelCase 名称。

## 生成的 Module 名称

Dart model 文件和 schema module 按 package 的最后一段命名，而不是按 gRPC service
命名。（当 schema 没有 package 时，使用源文件 stem。）

| Schema 输入（package）        | Model 文件          | Schema module           |
| ----------------------------- | ------------------- | ----------------------- |
| `service.fdl` (`demo.greeter`) | `greeter.dart`      | `GreeterForyModule`     |
| `api.fdl` (`demo.order_events`) | `order_events.dart` | `OrderEventsForyModule` |
| `greeter.fdl` (`demo.greeter`) | `greeter.dart`      | `GreeterForyModule`     |

名为 `Greeter` 的 gRPC service 仍会生成 `<stem>_grpc.dart` companion，其中包含
`GreeterClient` 和 `GreeterServiceBase`；它不会改变 schema module 名称。如果多个
schema 文件使用同一个 package leaf，请将它们放到不同输出目录，或选择能生成不同 Dart
model 文件的 package/file 名称。

## gRPC 运行时行为

生成的 service 代码只替换 request 和 response 序列化。所有常规 gRPC 运行行为仍由你的
gRPC stack 负责：

- Deadline 和取消
- TLS 和认证
- 名称解析与负载均衡
- Client 和 server interceptor
- Status code 和 metadata
- Channel 生命周期管理

## 故障排查

### 缺少 `package:grpc` 类型

将 `grpc` 加到应用依赖。生成的 Fory service 文件会 import grpc-dart API，但 `fory`
有意不依赖 gRPC。

### 生成代码引用缺失的 `.fory.dart` Part

生成或重新生成 Dart source 后，运行 `dart run build_runner build --delete-conflicting-outputs`。
Serializer part 文件由 `build_runner` 生成，不由 `foryc` 直接生成。

### Protobuf Client 无法解码 Service

Fory gRPC companion 不使用 protobuf 编码格式。请为 Fory-generated service 使用
Fory-generated client，或为通用 protobuf client 暴露单独的 protobuf service endpoint。
