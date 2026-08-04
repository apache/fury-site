---
title: C++ gRPC
sidebar_position: 6
id: cpp
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

对于定义了服务的 Schema，Fory 可以生成 C++ gRPC 服务配套代码。生成的代码使用
gRPC C++ 进行传输，并使用 Fory 序列化请求和响应载荷。该功能要求 gRPC C++
1.39.0 或更高版本。

当所有 RPC 对等端都由同一份 Fory IDL、protobuf IDL 或 FlatBuffers IDL 生成，
并且你希望结合 gRPC 传输语义与 Fory 载荷编码时，请使用此模式。如果客户端或工具
必须直接处理 protobuf 消息字节，请使用标准的 protobuf gRPC 代码生成。

## 添加依赖

使用 Bazel 时，请使用工作区内可见的 Fory 标签。下面的示例适用于将 Fory 作为名为
`fory` 的外部模块引入的项目：

```bazel
load("@rules_cc//cc:defs.bzl", "cc_library")

cc_library(
    name = "greeter_generated",
    srcs = ["generated/demo_greeter.service.grpc.cc"],
    hdrs = glob(["generated/*.h"]),
    includes = ["generated"],
    deps = [
        "@fory//cpp/fory/serialization:fory_serialization",
        "@grpc//:grpc++",
    ],
)
```

在 Fory 仓库内，请使用 `//cpp/fory/serialization:fory_serialization`，而不是
`@fory//cpp/fory/serialization:fory_serialization`。

使用 CMake 时，请先确保 Fory C++ 目标可见。如果使用已安装的 Fory 包，请调用
`find_package(Fory CONFIG REQUIRED)`，然后添加生成的源文件，并显式链接这两个库：

```cmake
find_package(Fory CONFIG REQUIRED)
find_package(gRPC 1.39.0 CONFIG REQUIRED)

add_library(greeter_generated
    generated/demo_greeter.service.grpc.cc
)
target_compile_features(greeter_generated PUBLIC cxx_std_17)
target_include_directories(greeter_generated PUBLIC generated)
target_link_libraries(greeter_generated PUBLIC
    fory::serialization
    gRPC::grpc++
)
```

如果项目通过 `FetchContent` 或 `add_subdirectory` 引入 Fory，请先完成引入，再链接
`fory::serialization`。

请使用与服务技术栈其余部分兼容的依赖版本。

## 定义服务

服务定义可以来自 Fory IDL、protobuf IDL 或 FlatBuffers `rpc_service` 定义。
Fory IDL 服务如下所示：

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

使用 `--grpc` 生成 C++ 模型和 gRPC 配套代码：

```bash
foryc service.fdl --cpp_out=./generated/cpp --grpc
```

对于此 Schema，C++ 生成器会输出：

| 文件                           | 用途                                     |
| ------------------------------ | ---------------------------------------- |
| `demo_greeter.h`               | Fory 模型类型和注册辅助函数              |
| `demo_greeter.service.h`       | 同步服务接口和路径常量                   |
| `demo_greeter.service.grpc.h`  | 同步客户端、服务器适配器和 Fory 编解码器 |
| `demo_greeter.service.grpc.cc` | Stub 调用和服务器路由实现                |

在应用代码中包含生成的 gRPC 头文件，并在构建目标中只编译一次
`demo_greeter.service.grpc.cc`。编解码器会直接生成在 gRPC 头文件中；没有单独的
Fory gRPC 运行时源文件。

## 实现服务器

实现生成的同步接口，并将生成的服务器适配器注册到常规 gRPC C++ 服务器。

```cpp
#include "demo_greeter.service.grpc.h"

#include <memory>
#include <grpcpp/server_builder.h>
#include <grpcpp/security/server_credentials.h>

class MyGreeter final : public demo::greeter::service::Greeter {
 public:
  ::grpc::Status SayHello(::grpc::ServerContext* context,
                          const ::demo::greeter::HelloRequest* request,
                          ::demo::greeter::HelloReply* response) override {
    (void)context;
    response->set_reply("Hello, " + request->name());
    return ::grpc::Status::OK;
  }
};

MyGreeter implementation;
demo::greeter::service::grpc::GreeterServiceGrpc service(&implementation);
::grpc::ServerBuilder builder;
builder.AddListeningPort("0.0.0.0:50051", ::grpc::InsecureServerCredentials());
builder.RegisterService(&service);
std::unique_ptr<::grpc::Server> server = builder.BuildAndStart();
server->Wait();
```

生成的服务代码会序列化生成的请求和响应类型，因此服务实现无需手动执行 Fory 注册。

## 创建客户端

使用生成的同步客户端 Stub：

```cpp
#include "demo_greeter.service.grpc.h"

#include <iostream>
#include <grpcpp/create_channel.h>
#include <grpcpp/security/credentials.h>

auto channel =
    ::grpc::CreateChannel("localhost:50051", ::grpc::InsecureChannelCredentials());
auto stub = demo::greeter::service::grpc::GreeterStub::NewStub(channel);

demo::greeter::HelloRequest request;
request.set_name("Fory");
demo::greeter::HelloReply response;
::grpc::ClientContext context;
::grpc::Status status = stub->SayHello(&context, request, &response);
if (status.ok()) {
  std::cout << response.reply() << std::endl;
}
```

通道配置、凭证、截止时间、元数据、取消、重试策略和传输生命周期仍由 gRPC C++ 负责。

## 流式 RPC

Fory 服务定义可以使用一元、服务器流式、客户端流式和双向流式 RPC 形式：

```protobuf
service Greeter {
  rpc SayHello (HelloRequest) returns (HelloReply);
  rpc LotsOfReplies (HelloRequest) returns (stream HelloReply);
  rpc LotsOfGreetings (stream HelloRequest) returns (HelloReply);
  rpc Chat (stream HelloRequest) returns (stream HelloReply);
}
```

生成的 C++ 代码遵循同步 gRPC C++ 约定：

- 一元方法返回 `grpc::Status`，并使用请求和响应指针。
- 服务器流式方法在客户端返回 `std::unique_ptr<grpc::ClientReader<U>>`，在服务器端
  接收 `grpc::ServerWriter<U>*`。
- 客户端流式方法在客户端返回 `std::unique_ptr<grpc::ClientWriter<T>>`，在服务器端
  接收 `grpc::ServerReader<T>*`。
- 双向流式方法在客户端返回 `std::unique_ptr<grpc::ClientReaderWriter<T, U>>`，
  在服务器端接收 `grpc::ServerReaderWriter<U, T>*`。
- 每个消息帧（包括流式消息帧）都使用生成的编解码器。

在服务实现中，请以生成的方法签名作为具体请求和响应类型的准确信息来源：

```cpp
::grpc::Status LotsOfReplies(
    ::grpc::ServerContext* context,
    const ::demo::greeter::HelloRequest* request,
    ::grpc::ServerWriter<::demo::greeter::HelloReply>* writer) override {
  (void)context;
  ::demo::greeter::HelloReply reply;
  reply.set_reply("Hello, " + request->name());
  writer->Write(reply);
  reply.set_reply("Welcome, " + request->name());
  writer->Write(reply);
  return ::grpc::Status::OK;
}
```

生成的客户端会返回标准 gRPC C++ 流式辅助对象：

```cpp
demo::greeter::HelloRequest request;
request.set_name("Fory");

::grpc::ClientContext context;
auto reader = stub->LotsOfReplies(&context, request);
demo::greeter::HelloReply reply;
while (reader->Read(&reply)) {
  std::cout << reply.reply() << std::endl;
}
::grpc::Status status = reader->Finish();
```

使用 `WritesDone()` 结束客户端流，并始终调用 `Finish()` 获取最终状态。

生成的描述符会为 gRPC 路径保留 IDL 中准确的服务名和方法名。

## gRPC 运行时行为

生成的服务配套代码只提供 Fory 序列化和 gRPC C++ 绑定。运行行为仍遵循标准 gRPC C++
行为：

- 截止时间和取消
- TLS 和身份认证
- 状态码和元数据
- 通道和服务器生命周期
- 同步流式反压

## 故障排除

### 缺少 gRPC C++ 头文件或符号

将上文所示的 gRPC C++ 依赖添加到编译生成服务文件的目标中，并确保生成的
`.service.grpc.cc` 文件只编译一次。

### `UNIMPLEMENTED`

确认已通过 `ServerBuilder::RegisterService(...)` 注册生成的服务器适配器，并确认
客户端和服务器由相同的包名、服务名和方法名生成。

### Protobuf 客户端无法解码服务

Fory gRPC 配套代码的消息不使用 protobuf 编码格式。对于 Fory 生成的服务，请使用
Fory 生成的客户端；如果需要支持通用 protobuf 客户端，请另行提供 protobuf 服务端点。
