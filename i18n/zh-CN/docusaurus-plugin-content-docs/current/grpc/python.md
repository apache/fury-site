---
title: Python gRPC
sidebar_position: 5
id: python
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

Fory 可以为定义了服务的 Schema 生成 Python gRPC 服务配套代码。生成的模块使用 `grpcio` 进行传输，并使用 Fory 序列化请求和响应对象。

当每个 RPC 对等端均由同一份 Fory IDL、protobuf IDL 或 FlatBuffers IDL 生成，并且你希望结合 gRPC 传输语义与 Fory 载荷编码时，请使用此模式。如果客户端或工具必须直接使用 protobuf 消息字节，请采用标准的 protobuf gRPC 代码生成方式。

Python gRPC 生成默认使用 `grpc.aio` AsyncIO API。生成的服务端实现基类使用 `async def` 方法，生成的存根与 `grpc.aio.Channel` 实例配合使用，流式 RPC 则使用异步可迭代对象。同步 `grpcio` 配套代码仍可通过 `--grpc-python-mode=sync` 生成。

## 安装依赖

请安装 `grpcio` 和 `pyfory`。生成的配套代码会导入 `grpc`，在默认模式下还会导入 `grpc.aio`，但 `pyfory` 不会将 gRPC 作为硬依赖引入。

```bash
pip install pyfory grpcio
```

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

使用 `--grpc` 生成 Python 模型和 gRPC 配套代码：

```bash
foryc service.fdl --python_out=./generated/python --grpc
```

对于此 Schema，Python 生成器会生成：

| 文件                   | 用途                                      |
| ---------------------- | ----------------------------------------- |
| `demo_greeter.py`      | Fory 数据类和注册辅助函数                 |
| `demo_greeter_grpc.py` | `grpc.aio` 存根、服务端实现基类和注册函数 |

模块名由 Fory 包名派生而来，其中的点会替换为下划线。没有包名的 Schema 使用 `generated.py` 和 `generated_grpc.py`。

## 实现异步服务端

继承生成的服务端实现基类，并将其注册到 `grpc.aio` 服务器。生成的 Python 方法名使用蛇形命名法，而 gRPC 方法路径会保留原始 IDL 方法名。

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

生成的配套代码会序列化生成的请求和响应类型，因此服务实现不需要手动注册 Fory 类型。

## 创建异步客户端

通过 `grpc.aio` 通道使用生成的存根。生产环境中的客户端通常会传入配置了 TLS/身份认证的通道：

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

对于本地测试和开发，可以显式使用不安全的通道：

```python
# Test-only channel. Use a TLS/auth-configured grpc.aio.Channel in production.
async with grpc.aio.insecure_channel("localhost:50051") as channel:
    stub = demo_greeter_grpc.GreeterStub(channel)
```

通道选项、凭据、截止时间、元数据、重试和拦截器仍由 `grpcio` 负责。

## 流式 RPC

Fory 服务定义可以使用单请求单响应、服务端流式、客户端流式和双向流式 RPC 形式：

```protobuf
service Greeter {
  rpc SayHello (HelloRequest) returns (HelloReply);
  rpc LotsOfReplies (HelloRequest) returns (stream HelloReply);
  rpc LotsOfGreetings (stream HelloRequest) returns (HelloReply);
  rpc Chat (stream HelloRequest) returns (stream HelloReply);
}
```

默认的 Python gRPC 输出遵循 `grpc.aio` 约定：

| IDL 形式                                  | 服务端实现方法形式                         | 存根方法形式               |
| ----------------------------------------- | ------------------------------------------ | -------------------------- |
| `rpc A (Req) returns (Res)`               | `async def` 返回一个响应对象               | 可等待对象返回一个响应对象 |
| `rpc A (Req) returns (stream Res)`        | `async def` 逐个产出响应对象               | 返回响应的异步迭代器       |
| `rpc A (stream Req) returns (Res)`        | 消费异步迭代器并返回响应                   | 接受请求的异步迭代器       |
| `rpc A (stream Req) returns (stream Res)` | 消费异步迭代器并通过异步迭代器逐个产出响应 | 接受并返回异步迭代器       |

服务端实现方法使用蛇形命名法，而生成的描述符会为 gRPC 路径保留 IDL 中准确的服务名和方法名。

服务端实现使用异步方法和异步迭代：

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

生成的客户端使用 `grpc.aio` 流式调用形式：

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

## 同步模式

对于现有的同步 `grpcio` 应用或未运行 asyncio 事件循环的环境，请使用同步模式。请显式生成同步配套代码：

```bash
foryc service.fdl --python_out=./generated/python --grpc --grpc-python-mode=sync
```

同步模式会生成相同的 `<module>_grpc.py` 文件名和公共名称，但服务端实现方法使用普通的 `def`，应用则使用 `grpc.server(...)` 和标准 `grpc.Channel` 实例。

单请求单响应同步服务端示例：

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

单请求单响应同步客户端示例：

```python
import grpc

import demo_greeter
import demo_greeter_grpc


with grpc.insecure_channel("localhost:50051") as channel:
    stub = demo_greeter_grpc.GreeterStub(channel)
    reply = stub.say_hello(demo_greeter.HelloRequest(name="Fory"))
    print(reply.reply)
```

同步流式调用遵循常规的 `grpcio` 迭代器和生成器约定。

## gRPC 运行时行为

生成的服务配套代码只提供 Fory 序列化回调。运维行为仍遵循标准的 `grpcio` 行为：

- 截止时间和取消
- TLS 和身份认证凭据
- 客户端和服务端拦截器
- 状态码、详细信息和元数据
- 默认模式下的异步事件循环、通道和服务器生命周期
- 同步模式下服务端的线程池大小

## 故障排查

### `ModuleNotFoundError: No module named 'grpc'`

请在运行生成的服务模块的环境中安装 `grpcio`：

```bash
pip install grpcio
```

### `TypeError: Unsupported gRPC servicer type`

请将生成的服务端实现子类的实例传给 `demo_greeter_grpc.add_servicer(...)`。如果模式包含多个服务，生成的注册函数只接受与之匹配的生成服务端实现类型。

### `UNIMPLEMENTED`

请确认已将生成的服务端实现注册到服务器，并且客户端和服务端由相同的包名、服务名和方法名生成。

### Protobuf 客户端无法解码服务

Fory gRPC 配套代码不会对消息使用 protobuf 编码格式。请为 Fory 生成的服务使用 Fory 生成的客户端，或者为通用 protobuf 客户端提供单独的 protobuf 服务端点。
