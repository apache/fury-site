---
title: JavaScript gRPC
sidebar_position: 9
id: javascript
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

对于定义了服务的 schema，Fory 可以生成 JavaScript 服务配套代码。生成的服务代码使用标准 gRPC 传输层，但请求和响应对象由 Fory 而非 protobuf 序列化。

当 RPC 两端均由同一份 Fory IDL、protobuf IDL 或 FlatBuffers IDL 生成，并且双方都预期消息体采用 Fory 编码时，请使用此模式。如果 API 必须供通用 protobuf 客户端、反射工具或预期接收 protobuf 消息字节的组件使用，请采用常规的 protobuf gRPC 代码生成方式。

使用 `--grpc` 生成 Node.js 服务端和客户端代码。使用 `--grpc-web` 生成调用兼容 gRPC-Web 的服务端或代理的浏览器客户端。

## 添加依赖

生成的模型文件依赖 `@apache-fory/core`。

Node.js gRPC 配套代码会导入 `@grpc/grpc-js`：

```bash
npm install @apache-fory/core @grpc/grpc-js
```

浏览器 gRPC-Web 配套代码会导入 `grpc-web`：

```bash
npm install @apache-fory/core grpc-web
```

Fory 不会将 gRPC 包添加为硬依赖。请只添加应用实际使用的传输包。

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

生成 Node.js gRPC 绑定：

```bash
foryc service.fdl --javascript_out=./generated/javascript --grpc
```

生成浏览器 gRPC-Web 绑定：

```bash
foryc service.fdl --javascript_out=./generated/javascript --grpc-web
```

同时生成两者：

```bash
foryc service.fdl --javascript_out=./generated/javascript --grpc --grpc-web
```

对于 `service.fdl`，JavaScript 输出包含：

| 文件                  | 用途                                      |
| --------------------- | ----------------------------------------- |
| `service.ts`          | 接口、枚举、联合类型和 schema 辅助函数    |
| `service_grpc.ts`     | Node.js `@grpc/grpc-js` 服务端/客户端代码 |
| `service_grpc_web.ts` | 浏览器 `grpc-web` 客户端                  |

生成的模型文件会导出 `registerXxxTypes(fory)`，用于自定义 `Fory` 实例；同时还会导出默认的根级辅助函数，例如 `serializeHelloRequest` 和 `deserializeHelloRequest`。生成的 gRPC 配套代码会自动导入这些辅助函数。

## 实现 Node.js 服务端

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

## 创建 Node.js 客户端

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

生成的客户端和服务端可照常使用 `@grpc/grpc-js` 的元数据、调用选项、凭据、截止时间和拦截器。

## 创建浏览器客户端

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

对于一元调用，也可以使用生成的 Promise 客户端：

```ts
import { createGreeterWebPromiseClient } from "./generated/javascript/service_grpc_web";

const client = createGreeterWebPromiseClient("https://api.example.com");
const reply = await client.sayHello({ name: "Fory" });
console.log(reply.reply);
```

## 流式 RPC

Node.js 配套代码支持所有 gRPC 流式调用形式：

```protobuf
service Greeter {
  rpc SayHello (HelloRequest) returns (HelloReply);
  rpc LotsOfReplies (HelloRequest) returns (stream HelloReply);
  rpc LotsOfGreetings (stream HelloRequest) returns (HelloReply);
  rpc Chat (stream HelloRequest) returns (stream HelloReply);
}
```

浏览器 gRPC-Web 配套代码支持一元方法和服务端流式方法。gRPC-Web 不支持客户端流式方法或双向流式方法；编译器会拒绝通过 `--grpc-web` 生成这些形式。

Node.js 服务端实现使用标准的 `@grpc/grpc-js` 流式调用对象：

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

Node.js 客户端使用与 RPC 形式相匹配的生成方法：

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

对于包含服务端流式方法的服务，生成的 gRPC-Web 配套代码默认使用 `grpcwebtext` 编码格式。仅包含一元方法的服务默认使用 `grpcweb`。也可以显式选择格式：

```ts
const client = createGreeterWebClient("https://api.example.com", {
  wireFormat: "grpcwebtext",
});
```

浏览器客户端可以通过回调客户端使用服务端流式 RPC：

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

## gRPC 栈行为

生成的服务代码只替换请求和响应的序列化方式。标准 gRPC 的各项运行能力仍由传输包负责：

- TLS 和凭据
- 元数据和状态码
- 截止时间和取消
- 客户端和服务端拦截器
- 负载均衡和部署相关的代理配置

## 故障排查

### 缺少 gRPC 包

Node.js 配套代码需要添加 `@grpc/grpc-js`，浏览器配套代码需要添加 `grpc-web`。`@apache-fory/core` 有意不依赖这两个传输包中的任何一个。

### gRPC-Web 客户端流式或双向流式 RPC 被拒绝

gRPC-Web 不支持客户端流式或双向流式调用。对于这些形式，请使用 `--grpc` 生成 Node.js 配套代码；或者面向浏览器客户端仅公开一元方法和服务端流式方法。

### Protobuf 客户端无法解码服务

Fory gRPC 配套代码不会对消息使用 protobuf 编码格式。Fory 生成的服务应使用 Fory 生成的客户端；如果需要支持通用 protobuf 客户端，请另行提供 protobuf 服务端点。
