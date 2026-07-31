---
title: gRPC 支持
sidebar_position: 25
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

Fory 可以为包含 service 定义的 schema 生成 JavaScript service companion。生成的 service code
使用普通 gRPC transport，但 request 和 response 对象使用 Fory 序列化，而不是 protobuf。

当 RPC 两端都由同一份 Fory IDL、protobuf IDL 或 FlatBuffers IDL 生成，并且两端都期望
Fory 编码的 message body 时，可以使用这种模式。如果 API 必须被通用 protobuf client、
reflection 工具或期望 protobuf message bytes 的组件消费，请使用标准 protobuf gRPC 代码生成。

使用 `--grpc` 生成 Node.js server/client 代码；使用 `--grpc-web` 生成调用 gRPC-Web 兼容
server 或 proxy 的浏览器 client。

## 添加依赖

生成的 model 文件依赖 `@apache-fory/core`。

Node.js gRPC companion 导入 `@grpc/grpc-js`：

```bash
npm install @apache-fory/core @grpc/grpc-js
```

浏览器 gRPC-Web companion 导入 `grpc-web`：

```bash
npm install @apache-fory/core grpc-web
```

Fory 不会把 gRPC package 作为硬依赖。只需添加应用实际使用的 transport package。

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

生成 Node.js gRPC binding：

```bash
foryc service.fdl --javascript_out=./generated/javascript --grpc
```

生成浏览器 gRPC-Web binding：

```bash
foryc service.fdl --javascript_out=./generated/javascript --grpc-web
```

也可以同时生成：

```bash
foryc service.fdl --javascript_out=./generated/javascript --grpc --grpc-web
```

输出包含：

| 文件                  | 用途                                    |
| --------------------- | --------------------------------------- |
| `service.ts`          | interface、enum、union 和 schema helper |
| `service_grpc.ts`     | Node.js `@grpc/grpc-js` server/client   |
| `service_grpc_web.ts` | 浏览器 `grpc-web` client                |

## 实现 Node.js Server

```ts
import * as grpc from "@grpc/grpc-js";
import {
  GreeterHandlers,
  addGreeterService,
} from "./generated/javascript/service_grpc";

const greeter: GreeterHandlers = {
  sayHello(call, callback) {
    callback(null, {
      reply: `Hello, ${call.request.name}`,
    });
  },
};

const server = new grpc.Server();
addGreeterService(server, greeter);
server.bindAsync(
  "0.0.0.0:50051",
  grpc.ServerCredentials.createInsecure(),
  (error, port) => {
    if (error) {
      throw error;
    }
    server.start();
    console.log(`listening on ${port}`);
  },
);
```

## 创建 Node.js Client

```ts
import * as grpc from "@grpc/grpc-js";
import { createGreeterClient } from "./generated/javascript/service_grpc";

const client = createGreeterClient(
  "localhost:50051",
  grpc.credentials.createInsecure(),
);

client.sayHello({ name: "Fory" }, (error, reply) => {
  if (error) {
    throw error;
  }
  console.log(reply.reply);
});
```

可以继续使用普通 `@grpc/grpc-js` metadata、call option、credential、deadline 和 interceptor。

## 创建 Browser Client

```ts
import { createGreeterWebClient } from "./generated/javascript/service_grpc_web";

const client = createGreeterWebClient("https://api.example.com", {
  wireFormat: "grpcweb",
});

client.sayHello({ name: "Fory" }, null, (error, reply) => {
  if (error) {
    console.error(error.message);
    return;
  }
  console.log(reply.reply);
});
```

Unary 调用也可以使用生成的 promise client：

```ts
import { createGreeterWebPromiseClient } from "./generated/javascript/service_grpc_web";

const client = createGreeterWebPromiseClient("https://api.example.com");
const reply = await client.sayHello({ name: "Fory" });
console.log(reply.reply);
```

## Streaming RPC

Node.js companion 支持所有 gRPC streaming shape。浏览器 gRPC-Web companion 支持 unary 和
server-streaming；gRPC-Web 不支持 client-streaming 或 bidirectional streaming，compiler 会拒绝
这些 shape 的 `--grpc-web` 生成。

```protobuf
service Greeter {
  rpc SayHello (HelloRequest) returns (HelloReply);
  rpc LotsOfReplies (HelloRequest) returns (stream HelloReply);
  rpc LotsOfGreetings (stream HelloRequest) returns (HelloReply);
  rpc Chat (stream HelloRequest) returns (stream HelloReply);
}
```

Node.js server 实现使用普通 `@grpc/grpc-js` streaming call object。生成 companion 只负责把 Fory
payload 接入 gRPC，deadline、credential、metadata、interceptor 和错误语义仍遵循 gRPC 库行为。

```ts
const greeter: GreeterHandlers = {
  sayHello(call, callback) {
    callback(null, { reply: `Hello, ${call.request.name}` });
  },

  lotsOfReplies(call) {
    call.write({ reply: `Hello, ${call.request.name}` });
    call.write({ reply: `Welcome, ${call.request.name}` });
    call.end();
  },

  lotsOfGreetings(call, callback) {
    const names: string[] = [];
    call.on("data", (request) => {
      names.push(request.name);
    });
    call.on("end", () => {
      callback(null, { reply: `Hello, ${names.join(", ")}` });
    });
  },

  chat(call) {
    call.on("data", (request) => {
      call.write({ reply: `Hello, ${request.name}` });
    });
    call.on("end", () => {
      call.end();
    });
  },
};
```

Node.js client 使用与 RPC shape 对应的生成方法：

```ts
const replies = client.lotsOfReplies({ name: "Fory" });
replies.on("data", (reply) => {
  console.log(reply.reply);
});

const greetings = client.lotsOfGreetings((error, reply) => {
  if (error) {
    throw error;
  }
  console.log(reply.reply);
});
greetings.write({ name: "Alice" });
greetings.write({ name: "Bob" });
greetings.end();

const chat = client.chat();
chat.on("data", (reply) => {
  console.log(reply.reply);
});
chat.write({ name: "Alice" });
chat.write({ name: "Bob" });
chat.end();
```

包含 server-streaming 方法的 service 中，生成的 gRPC-Web companion 默认使用 `grpcwebtext`
编码格式。只有 unary 方法的 service 默认使用 `grpcweb`。也可以显式指定：

```ts
const client = createGreeterWebClient("https://api.example.com", {
  wireFormat: "grpcwebtext",
});
```

浏览器 client 可以用 callback client 消费 server-streaming RPC：

```ts
const stream = client.lotsOfReplies({ name: "Fory" });

stream.on("data", (reply) => {
  console.log(reply.reply);
});
stream.on("error", (error) => {
  console.error(error.message);
});
stream.on("end", () => {
  console.log("stream ended");
});
```

## gRPC 运行时行为

生成的 service code 只替换 request/response 序列化。常规 gRPC service 行为仍由 transport package
提供：

- TLS 和 credential
- Metadata 和 status code
- Deadline 和取消
- Client/server interceptor
- 负载均衡和部署相关 proxy 配置

## 故障排查

### 缺少 gRPC Package

Node.js 添加 `@grpc/grpc-js`，浏览器添加 `grpc-web`。生成 model 仍需要 `@apache-fory/core`。

### gRPC-Web Client-Streaming 或 Bidirectional RPC 被拒绝

gRPC-Web 不支持 client-streaming 或 bidirectional streaming。对于这些 shape，请使用 `--grpc`
生成 Node.js companion，或只向浏览器 client 暴露 unary 和 server-streaming 方法。

### Protobuf Client 无法读取响应

Fory gRPC 使用 Fory 二进制协议 payload，不是 protobuf wire-format message。请在两端使用同一份
schema 生成的 Fory gRPC companion。
