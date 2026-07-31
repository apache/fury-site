---
title: gRPC 支持
sidebar_position: 13
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

Fory 可以为包含 service 定义的 schema 生成 Python gRPC service companion。生成 module
使用 `grpcio` 负责传输，并使用 Fory 序列化 request 和 response 对象。

当每个 RPC peer 都由同一份 Fory IDL、protobuf IDL 或 FlatBuffers IDL 生成，并且你希望
使用 gRPC 传输语义与 Fory payload 编码时，可以使用这种模式。如果 client 或工具必须直接
消费 protobuf message bytes，请使用标准 protobuf gRPC 代码生成。

Python gRPC 生成默认使用 `grpc.aio` AsyncIO API。生成的 servicer base 使用
`async def` 方法，生成的 stub 搭配 `grpc.aio.Channel` 实例使用，streaming RPC 使用
async iterable。同步 `grpcio` companion 仍可通过 `--grpc-python-mode=sync` 生成。

## 安装依赖

将 `grpcio` 与 `pyfory` 一起安装。生成的 companion 会 import `grpc`，并且在默认模式下
import `grpc.aio`；但 `pyfory` 不会把 gRPC 作为硬依赖。

```bash
pip install pyfory grpcio
```

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

使用 `--grpc` 生成 Python model 和 gRPC companion 代码：

```bash
foryc service.fdl --python_out=./generated/python --grpc
```

对这个 schema，Python generator 会输出：

| 文件                   | 用途                                      |
| ---------------------- | ----------------------------------------- |
| `demo_greeter.py`      | Fory dataclass 和注册辅助逻辑             |
| `demo_greeter_grpc.py` | `grpc.aio` stub、servicer base 和注册函数 |

Module 名称来自 Fory package，点号会替换为下划线。没有 package 的 schema 使用
`generated.py` 和 `generated_grpc.py`。

## 实现 Async Server

继承生成的 servicer，并将它注册到 `grpc.aio` server。生成的 Python 方法名使用
snake_case，而 gRPC wire path 保留原始 IDL method 名称。

```python
import asyncio

import grpc.aio

import demo_greeter
import demo_greeter_grpc


class Greeter(demo_greeter_grpc.GreeterServicer):
    async def say_hello(self, request, context):
        return demo_greeter.HelloReply(reply=f"Hello, {request.name}")


async def serve():
    server = grpc.aio.server()
    demo_greeter_grpc.add_servicer(Greeter(), server)
    server.add_insecure_port("[::]:50051")
    await server.start()
    await server.wait_for_termination()


if __name__ == "__main__":
    asyncio.run(serve())
```

生成的 request 和 response 类型由生成 companion 序列化，因此 service 实现不需要手动
执行 Fory 注册。

## 创建 Async Client

通过 `grpc.aio` channel 使用生成的 stub。生产 client 通常传入配置了 TLS/认证的 channel：

```python
import asyncio

import grpc
import grpc.aio

import demo_greeter
import demo_greeter_grpc


async def main():
    credentials = grpc.ssl_channel_credentials()
    async with grpc.aio.secure_channel("api.example.com:443", credentials) as channel:
        stub = demo_greeter_grpc.GreeterStub(channel)
        reply = await stub.say_hello(demo_greeter.HelloRequest(name="Fory"))
        print(reply.reply)


if __name__ == "__main__":
    asyncio.run(main())
```

本地测试和开发可以显式使用 insecure channel：

```python
# Test-only channel. Use a TLS/auth-configured grpc.aio.Channel in production.
async with grpc.aio.insecure_channel("localhost:50051") as channel:
    stub = demo_greeter_grpc.GreeterStub(channel)
```

Channel option、credential、deadline、metadata、retry 和 interceptor 仍由 `grpcio` 负责。

## Streaming RPC

Fory service 定义可以使用 unary、server-streaming、client-streaming 和 bidirectional
streaming RPC 形态：

```protobuf
service Greeter {
  rpc SayHello (HelloRequest) returns (HelloReply);
  rpc LotsOfReplies (HelloRequest) returns (stream HelloReply);
  rpc LotsOfGreetings (stream HelloRequest) returns (HelloReply);
  rpc Chat (stream HelloRequest) returns (stream HelloReply);
}
```

默认 Python gRPC 输出遵循 `grpc.aio` 约定：

| IDL shape                                 | Servicer 方法形态                              | Stub 方法形态                  |
| ----------------------------------------- | ---------------------------------------------- | ------------------------------ |
| `rpc A (Req) returns (Res)`               | `async def` 返回一个 response 对象             | awaitable 返回一个 response 对象 |
| `rpc A (Req) returns (stream Res)`        | `async def` yield response 对象                | 返回 response async iterator   |
| `rpc A (stream Req) returns (Res)`        | 消费 async iterator 并返回 response            | 接收 request async iterator    |
| `rpc A (stream Req) returns (stream Res)` | 消费并 yield async iterator                    | 接收并返回 async iterator      |

Servicer 方法使用 snake_case 名称；生成 descriptor 会保留精确的 IDL service 和
method 名称作为 gRPC path。

Server 实现使用 async 方法和 async iteration：

```python
class Greeter(demo_greeter_grpc.GreeterServicer):
    async def lots_of_replies(self, request, context):
        yield demo_greeter.HelloReply(reply=f"Hello, {request.name}")
        yield demo_greeter.HelloReply(reply=f"Welcome, {request.name}")

    async def lots_of_greetings(self, request_iterator, context):
        names = []
        async for request in request_iterator:
            names.append(request.name)
        return demo_greeter.HelloReply(reply=", ".join(names))

    async def chat(self, request_iterator, context):
        async for request in request_iterator:
            yield demo_greeter.HelloReply(reply=f"Hello, {request.name}")
```

生成的 client 使用 `grpc.aio` streaming 调用形态：

```python
credentials = grpc.ssl_channel_credentials()
async with grpc.aio.secure_channel("api.example.com:443", credentials) as channel:
    stub = demo_greeter_grpc.GreeterStub(channel)

    async for reply in stub.lots_of_replies(
        demo_greeter.HelloRequest(name="Fory")
    ):
        print(reply.reply)

    async def greeting_requests():
        yield demo_greeter.HelloRequest(name="Ada")
        yield demo_greeter.HelloRequest(name="Grace")

    summary = await stub.lots_of_greetings(greeting_requests())
    print(summary.reply)

    async def chat_requests():
        yield demo_greeter.HelloRequest(name="Fory")
        yield demo_greeter.HelloRequest(name="RPC")

    async for reply in stub.chat(chat_requests()):
        print(reply.reply)
```

## Sync 模式

已有同步 `grpcio` 应用，或不运行 asyncio event loop 的环境，可以使用 sync 模式。显式生成
sync companion：

```bash
foryc service.fdl --python_out=./generated/python --grpc --grpc-python-mode=sync
```

Sync 模式输出相同的 `<module>_grpc.py` 文件名和 public name，但 servicer 方法使用普通
`def`，应用使用 `grpc.server(...)` 和标准 `grpc.Channel` 实例。

Unary sync server 示例：

```python
from concurrent import futures

import grpc

import demo_greeter
import demo_greeter_grpc


class Greeter(demo_greeter_grpc.GreeterServicer):
    def say_hello(self, request, context):
        return demo_greeter.HelloReply(reply=f"Hello, {request.name}")


server = grpc.server(futures.ThreadPoolExecutor(max_workers=8))
demo_greeter_grpc.add_servicer(Greeter(), server)
server.add_insecure_port("[::]:50051")
server.start()
server.wait_for_termination()
```

Unary sync client 示例：

```python
import grpc

import demo_greeter
import demo_greeter_grpc


with grpc.insecure_channel("localhost:50051") as channel:
    stub = demo_greeter_grpc.GreeterStub(channel)
    reply = stub.say_hello(demo_greeter.HelloRequest(name="Fory"))
    print(reply.reply)
```

Sync streaming 遵循普通 `grpcio` iterator 和 generator 约定。

## gRPC 运行时行为

生成的 service companion 只提供 Fory serialization callback。运行行为仍遵循标准
`grpcio`：

- Deadline 和取消
- TLS 和认证 credential
- Client/server interceptor
- Status code、details 和 metadata
- 默认模式下的 async event loop、channel 和 server 生命周期
- Sync 模式下同步 server 的线程池大小

## 故障排查

### 缺少 `grpc`

安装 `grpcio`：

```bash
pip install grpcio
```

### `UNIMPLEMENTED`

确认生成的 servicer 已注册到 server，并且 client 与 server 来自相同 package、service 和 method 名称。

### Protobuf Client 无法解码

Fory gRPC 使用 Fory 二进制协议 payload，不是 protobuf wire-format message。两端应使用同一份
schema 生成的 Fory gRPC companion。
