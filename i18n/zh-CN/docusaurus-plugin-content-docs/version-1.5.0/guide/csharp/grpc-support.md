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

Fory 可以为定义了服务的 schema 生成 C# gRPC 配套代码。生成的代码使用标准 gRPC 客户端、服务基类、
方法描述符、元数据、截止时间、取消机制和状态码，而请求和响应对象使用 Fory 而非 protobuf 进行序列化。

当 RPC 两端均由同一份 Fory IDL、protobuf IDL 或 FlatBuffers IDL 生成，并且双方都需要
Fory 编码的消息体时，请使用此模式。对于必须由通用 protobuf 客户端、反射工具或需要 protobuf
消息字节的组件使用的 API，请采用标准的 protobuf gRPC 代码生成方式。

## 添加依赖

`Apache.Fory` 包不会引入 gRPC 依赖。请在编译或运行生成的服务配套代码的应用中添加 gRPC 包。

服务端项目：

```xml
<ItemGroup>
  <PackageReference Include="Apache.Fory" Version="1.5.0" />
  <PackageReference Include="Grpc.AspNetCore" Version="2.71.0" />
</ItemGroup>
```

客户端项目：

```xml
<ItemGroup>
  <PackageReference Include="Apache.Fory" Version="1.5.0" />
  <PackageReference Include="Grpc.Core.Api" Version="2.71.0" />
  <PackageReference Include="Grpc.Net.Client" Version="2.71.0" />
</ItemGroup>
```

`Grpc.Core.Api` 是生成的配套代码所使用的 API 接口。服务端和客户端应用可以照常选择所需的 gRPC
托管包或传输包。

## 定义服务

服务定义可以来自 Fory IDL、protobuf IDL 或 FlatBuffers 的 `rpc_service` 定义。Fory IDL
服务如下所示：

```protobuf
package demo.greeter;
option csharp_namespace = "Demo.Greeter";

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

使用 `--grpc` 生成 C# 模型和 gRPC 配套代码：

```bash
foryc service.fdl --csharp_out=./Generated --grpc
```

对于该 schema，C# 生成器会输出：

| 文件                                             | 用途                           |
| ------------------------------------------------ | ------------------------------ |
| `Demo/Greeter/Service.cs`                        | Fory 模型类型和 schema 模块    |
| `Demo/Greeter/GreeterGrpc.cs`                    | gRPC 服务基类、客户端和描述符  |
| `Service.cs` 中的 `ServiceForyModule`            | 生成类型的 Fory 注册模块       |
| `GreeterGrpc.cs` 中的 `Greeter.GreeterBase`      | 服务端实现的基类               |
| `GreeterGrpc.cs` 中的 `Greeter.GreeterClient`    | 用于发起 gRPC 调用的客户端存根 |

## 实现服务端

继承生成的 `Greeter.GreeterBase` 类，并通过标准的 ASP.NET Core gRPC 托管方式映射该服务：

```csharp
using System.Threading.Tasks;
using Demo.Greeter;
using Grpc.Core;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddGrpc();

var app = builder.Build();
app.MapGrpcService<GreeterService>();
app.Run();

public sealed class GreeterService : Greeter.GreeterBase
{
    public override Task<HelloReply> SayHello(
        HelloRequest request,
        ServerCallContext context)
    {
        return Task.FromResult(new HelloReply
        {
            Reply = "Hello, " + request.Name,
        });
    }
}
```

生成的服务配套代码所使用的 schema 模块会注册生成的请求和响应类型，因此服务实现无需进行自定义
序列化器注册。

## 创建客户端

通过 `Grpc.Net.Client` 调用器使用生成的客户端：

```csharp
using Demo.Greeter;
using Grpc.Net.Client;

using GrpcChannel channel = GrpcChannel.ForAddress("https://localhost:5001");
var client = new Greeter.GreeterClient(channel.CreateCallInvoker());

HelloReply reply = await client.SayHelloAsync(
    new HelloRequest { Name = "Fory" });
Console.WriteLine(reply.Reply);
```

生成的客户端还提供同步一元方法和标准的 gRPC 流式调用形式。

## 流式 RPC

Fory 服务定义可以使用与 gRPC 相同的流式调用形式：

```protobuf
service Greeter {
  rpc SayHello (HelloRequest) returns (HelloReply);
  rpc LotsOfReplies (HelloRequest) returns (stream HelloReply);
  rpc LotsOfGreetings (stream HelloRequest) returns (HelloReply);
  rpc Chat (stream HelloRequest) returns (stream HelloReply);
}
```

生成的 C# 服务方法遵循 gRPC C# 约定：

| IDL 形式                                  | 服务端方法                                                                    | 客户端方法                                           |
| ----------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------- |
| `rpc A (Req) returns (Res)`               | `Task<Res> A(Req request, ServerCallContext context)`                         | `Res A(...)` 和 `AsyncUnaryCall<Res> AAsync(...)`    |
| `rpc A (Req) returns (stream Res)`        | `Task A(Req request, IServerStreamWriter<Res> responseStream, ...)`           | `AsyncServerStreamingCall<Res> A(...)`               |
| `rpc A (stream Req) returns (Res)`        | `Task<Res> A(IAsyncStreamReader<Req> requestStream, ...)`                     | `AsyncClientStreamingCall<Req, Res> A(...)`          |
| `rpc A (stream Req) returns (stream Res)` | `Task A(IAsyncStreamReader<Req> requestStream, IServerStreamWriter<Res> ...)` | `AsyncDuplexStreamingCall<Req, Res> A(...)`          |

服务端实现可以直接使用生成的流式方法形式：

```csharp
using System.Collections.Generic;
using System.Threading.Tasks;
using Demo.Greeter;
using Grpc.Core;

public sealed class GreeterService : Greeter.GreeterBase
{
    public override async Task LotsOfReplies(
        HelloRequest request,
        IServerStreamWriter<HelloReply> responseStream,
        ServerCallContext context)
    {
        foreach (string reply in new[]
        {
            "Hello, " + request.Name,
            "Welcome, " + request.Name,
        })
        {
            await responseStream.WriteAsync(new HelloReply { Reply = reply });
        }
    }

    public override async Task<HelloReply> LotsOfGreetings(
        IAsyncStreamReader<HelloRequest> requestStream,
        ServerCallContext context)
    {
        List<string> names = new();
        while (await requestStream.MoveNext(context.CancellationToken))
        {
            names.Add(requestStream.Current.Name);
        }

        return new HelloReply { Reply = string.Join(", ", names) };
    }

    public override async Task Chat(
        IAsyncStreamReader<HelloRequest> requestStream,
        IServerStreamWriter<HelloReply> responseStream,
        ServerCallContext context)
    {
        while (await requestStream.MoveNext(context.CancellationToken))
        {
            await responseStream.WriteAsync(new HelloReply
            {
                Reply = "Hello, " + requestStream.Current.Name,
            });
        }
    }
}
```

生成的客户端返回标准的 gRPC 流式调用对象：

```csharp
using System;
using System.Threading;
using System.Threading.Tasks;
using Demo.Greeter;
using Grpc.Core;

using AsyncServerStreamingCall<HelloReply> replies =
    client.LotsOfReplies(new HelloRequest { Name = "Fory" });
while (await replies.ResponseStream.MoveNext(CancellationToken.None))
{
    Console.WriteLine(replies.ResponseStream.Current.Reply);
}

using AsyncClientStreamingCall<HelloRequest, HelloReply> greetings =
    client.LotsOfGreetings();
await greetings.RequestStream.WriteAsync(new HelloRequest { Name = "Ada" });
await greetings.RequestStream.WriteAsync(new HelloRequest { Name = "Grace" });
await greetings.RequestStream.CompleteAsync();
HelloReply summary = await greetings.ResponseAsync;
Console.WriteLine(summary.Reply);

using AsyncDuplexStreamingCall<HelloRequest, HelloReply> chat = client.Chat();
Task readTask = Task.Run(async () =>
{
    while (await chat.ResponseStream.MoveNext(CancellationToken.None))
    {
        Console.WriteLine(chat.ResponseStream.Current.Reply);
    }
});
await chat.RequestStream.WriteAsync(new HelloRequest { Name = "Fory" });
await chat.RequestStream.CompleteAsync();
await readTask;
```

生成的描述符会为 gRPC 路径保留 IDL 中服务和方法的确切名称。

## 生成的模块名称

C# schema 模块名来自源文件名（不含扩展名），而不是来自 `csharp_namespace`，也不是来自 gRPC
服务名称。

例如：

| Schema 输入        | 模型文件         | Schema 模块             |
| ------------------ | ---------------- | ----------------------- |
| `service.fdl`      | `Service.cs`     | `ServiceForyModule`     |
| `order-events.fdl` | `OrderEvents.cs` | `OrderEventsForyModule` |
| `greeter.fdl`      | `Greeter.cs`     | `GreeterForyModule`     |
| `Greeter.fdl`      | `Greeter.cs`     | `GreeterForyModule`     |

名为 `Greeter` 的 gRPC 服务仍会生成服务配套文件 `GreeterGrpc.cs`，不会改变 schema 模块名。
这样，多个 schema 文件可以指向同一个 C# 命名空间而不会发生冲突。生成器不会生成基于命名空间或
服务名称派生的模块别名。

## gRPC 运行时行为

生成的服务代码仅替换请求和响应的序列化方式。所有标准的 gRPC 运维功能仍由 gRPC 技术栈负责：

- 截止时间和取消
- TLS 和身份验证
- 名称解析和负载均衡
- 客户端和服务端拦截器
- 状态码和元数据
- 通道池和生命周期管理

## 故障排查

### 缺少 `Grpc.Core` 类型

添加 `Grpc.Core.Api`，或添加会以传递依赖方式引入它的服务端或客户端包。生成的 Fory 服务文件
会导入 gRPC API，但 `Apache.Fory` 刻意不依赖 gRPC。

### Protobuf 客户端无法解码服务

Fory gRPC 配套代码不会对消息使用 protobuf 编码格式。请为 Fory 生成的服务使用 Fory 生成的客户端，
或为通用 protobuf 客户端提供单独的 protobuf 服务端点。
