---
title: gRPC 支持
sidebar_position: 10
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

Fory 可以为包含 service 定义的 schema 生成 C# gRPC service companion。生成代码使用标准 .NET
gRPC API，而 request/response 对象使用 Fory payload 编码。

当 RPC 两端都由同一份 Fory IDL、protobuf IDL 或 FlatBuffers IDL 生成，并且你希望使用
gRPC 传输语义与 Fory payload 编码时，可以使用这种模式。如果 API 必须被通用 protobuf client
消费，请使用标准 protobuf gRPC 代码生成。

## 添加依赖

Server project：

```xml
<ItemGroup>
  <PackageReference Include="Apache.Fory" Version="1.4.0" />
  <PackageReference Include="Grpc.AspNetCore" Version="2.71.0" />
</ItemGroup>
```

Client project：

```xml
<ItemGroup>
  <PackageReference Include="Apache.Fory" Version="1.4.0" />
  <PackageReference Include="Grpc.Core.Api" Version="2.71.0" />
  <PackageReference Include="Grpc.Net.Client" Version="2.71.0" />
</ItemGroup>
```

根据应用使用的 .NET gRPC hosting/client package 调整依赖。`Apache.Fory` 不会把 gRPC 作为硬依赖。

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

生成 C# model 和 gRPC companion：

```bash
foryc service.fdl --csharp_out=./generated/csharp --grpc
```

生成 companion 会包含 service base、client、method descriptor，以及 Fory-backed request/response
marshaller。

## 实现 Server

```csharp
using Grpc.Core;

public sealed class GreeterService : Greeter.GreeterBase
{
    public override Task<HelloReply> SayHello(
        HelloRequest request,
        ServerCallContext context)
    {
        return Task.FromResult(new HelloReply
        {
            Reply = $"Hello, {request.Name}"
        });
    }
}
```

在 ASP.NET Core gRPC host 中注册生成 service，与普通 .NET gRPC service 一样管理 TLS、认证、
interceptor、deadline 和 cancellation。

## 创建 Client

```csharp
using Grpc.Net.Client;

using var channel = GrpcChannel.ForAddress("https://localhost:50051");
var client = new Greeter.GreeterClient(channel);
var reply = await client.SayHelloAsync(new HelloRequest { Name = "Fory" });
Console.WriteLine(reply.Reply);
```

生成 client 使用 Fory marshaller 编码 request/response。Call option、metadata、deadline 和
credential 仍遵循 .NET gRPC 行为。

## Streaming RPC

Fory service 支持 unary、server-streaming、client-streaming 和 bidirectional streaming。生成 C#
代码使用 .NET gRPC 的 `AsyncUnaryCall`、`AsyncServerStreamingCall`、`AsyncClientStreamingCall`
和 `AsyncDuplexStreamingCall` 形态。

## 故障排查

### 缺少 `Grpc.*` 类型

添加应用所需的 .NET gRPC package，例如 `Grpc.AspNetCore` 或 `Grpc.Net.Client`。

### Protobuf Client 无法读取响应

Fory gRPC 使用 Fory 二进制协议 payload，不是 protobuf wire-format message。请在两端使用同一份
schema 生成的 Fory gRPC companion。
