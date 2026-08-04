---
title: Java gRPC
sidebar_position: 4
id: java
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

Fory 可以为定义了服务的 Schema 生成 Java gRPC 服务配套代码。生成的服务代码使用标准的 grpc-java 通道、服务器、截止时间、状态码、拦截器和传输安全机制，而请求和响应对象则使用 Fory 而不是 protobuf 进行序列化。

当 RPC 两端均由同一份 Fory IDL、protobuf IDL 或 FlatBuffers IDL 生成，并且你希望结合 gRPC 传输语义与 Fory 载荷编码时，请使用此模式。如果 API 必须由通用 protobuf 客户端、反射工具或要求 protobuf 消息字节的组件使用，请采用标准的 protobuf gRPC 代码生成方式。

有关 Scala 生成的 grpc-java 配套代码，请参阅 [Scala gRPC 支持](scala.md)。有关 Kotlin 协程存根和服务实现基类，请参阅 [Kotlin gRPC 支持](kotlin.md)。

## 添加依赖

生成的 Java 服务文件依赖 grpc-java 进行编译。Fory Java 构件不会将 gRPC 作为硬依赖引入，因此请在应用构建中添加 grpc-java 依赖，并使其版本与服务技术栈中的其他组件保持一致。

Maven：

```xml
<dependencies>
  <dependency>
    <groupId>org.apache.fory</groupId>
    <artifactId>fory-core</artifactId>
    <version>${fory.version}</version>
  </dependency>
  <dependency>
    <groupId>io.grpc</groupId>
    <artifactId>grpc-api</artifactId>
    <version>${grpc.version}</version>
  </dependency>
  <dependency>
    <groupId>io.grpc</groupId>
    <artifactId>grpc-stub</artifactId>
    <version>${grpc.version}</version>
  </dependency>
  <dependency>
    <groupId>io.grpc</groupId>
    <artifactId>grpc-netty-shaded</artifactId>
    <version>${grpc.version}</version>
  </dependency>
</dependencies>
```

Gradle：

```kotlin
dependencies {
  implementation("org.apache.fory:fory-core:$foryVersion")
  implementation("io.grpc:grpc-api:$grpcVersion")
  implementation("io.grpc:grpc-stub:$grpcVersion")
  implementation("io.grpc:grpc-netty-shaded:$grpcVersion")
}
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

使用 `--grpc` 生成 Java 模型和 gRPC 配套代码：

```bash
foryc service.fdl --java_out=./generated/java --grpc
```

对于此 Schema，Java 生成器会生成：

| 文件                     | 用途                                   |
| ------------------------ | -------------------------------------- |
| `HelloRequest.java`      | 请求对应的 Fory 模型类型               |
| `HelloReply.java`        | 响应对应的 Fory 模型类型               |
| `GreeterForyModule.java` | 生成类型的 Fory 注册模块               |
| `GreeterGrpc.java`       | grpc-java 服务实现基类、存根和编解码器 |

## 实现服务端

继承生成的 `GreeterGrpc.GreeterImplBase` 类，并将其注册到标准的 grpc-java `Server`。

```java
package demo.greeter;

import io.grpc.Server;
import io.grpc.ServerBuilder;
import io.grpc.stub.StreamObserver;

final class GreeterService extends GreeterGrpc.GreeterImplBase {
  @Override
  public void sayHello(
      HelloRequest request, StreamObserver<HelloReply> responseObserver) {
    HelloReply reply = new HelloReply();
    reply.setReply("Hello, " + request.getName());
    responseObserver.onNext(reply);
    responseObserver.onCompleted();
  }
}

public final class GreeterServer {
  public static void main(String[] args) throws Exception {
    Server server =
        ServerBuilder.forPort(50051)
            .addService(new GreeterService())
            .build()
            .start();
    server.awaitTermination();
  }
}
```

生成的代码会注册生成的请求和响应类型，因此服务实现不需要执行自定义序列化器注册。

## 创建客户端

通过普通的 grpc-java 通道使用生成的存根：

```java
package demo.greeter;

import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;

public final class GreeterClient {
  public static void main(String[] args) {
    ManagedChannel channel =
        ManagedChannelBuilder.forAddress("localhost", 50051)
            .usePlaintext()
            .build();
    try {
      GreeterGrpc.GreeterBlockingStub stub =
          GreeterGrpc.newBlockingStub(channel);

      HelloRequest request = new HelloRequest();
      request.setName("Fory");
      HelloReply reply = stub.sayHello(request);
      System.out.println(reply.getReply());
    } finally {
      channel.shutdownNow();
    }
  }
}
```

对于异步调用，请使用 `GreeterGrpc.newStub(channel)`。对于基于 Future 的单请求单响应调用，请使用 `GreeterGrpc.newFutureStub(channel)`。

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

生成的 Java 服务方法遵循 grpc-java 约定：

| IDL 形式                                  | 服务端方法形式                                         | 客户端方法形式                       |
| ----------------------------------------- | ------------------------------------------------------ | ------------------------------------ |
| `rpc A (Req) returns (Res)`               | `void a(Req request, StreamObserver<Res> responses)`   | 阻塞、异步和 Future 单请求单响应存根 |
| `rpc A (Req) returns (stream Res)`        | `void a(Req request, StreamObserver<Res> responses)`   | 阻塞迭代器或异步观察者               |
| `rpc A (stream Req) returns (Res)`        | `StreamObserver<Req> a(StreamObserver<Res> responses)` | 异步请求观察者                       |
| `rpc A (stream Req) returns (stream Res)` | `StreamObserver<Req> a(StreamObserver<Res> responses)` | 异步请求观察者                       |

服务端实现可以直接使用生成的流式方法形式：

```java
package demo.greeter;

import io.grpc.stub.StreamObserver;
import java.util.ArrayList;
import java.util.List;

final class GreeterService extends GreeterGrpc.GreeterImplBase {
  @Override
  public void lotsOfReplies(
      HelloRequest request, StreamObserver<HelloReply> responseObserver) {
    HelloReply first = new HelloReply();
    first.setReply("Hello, " + request.getName());
    responseObserver.onNext(first);

    HelloReply second = new HelloReply();
    second.setReply("Welcome, " + request.getName());
    responseObserver.onNext(second);
    responseObserver.onCompleted();
  }

  @Override
  public StreamObserver<HelloRequest> lotsOfGreetings(
      StreamObserver<HelloReply> responseObserver) {
    List<String> names = new ArrayList<>();
    return new StreamObserver<>() {
      @Override
      public void onNext(HelloRequest request) {
        names.add(request.getName());
      }

      @Override
      public void onError(Throwable error) {
        responseObserver.onError(error);
      }

      @Override
      public void onCompleted() {
        HelloReply reply = new HelloReply();
        reply.setReply(String.join(", ", names));
        responseObserver.onNext(reply);
        responseObserver.onCompleted();
      }
    };
  }

  @Override
  public StreamObserver<HelloRequest> chat(
      StreamObserver<HelloReply> responseObserver) {
    return new StreamObserver<>() {
      @Override
      public void onNext(HelloRequest request) {
        HelloReply reply = new HelloReply();
        reply.setReply("Hello, " + request.getName());
        responseObserver.onNext(reply);
      }

      @Override
      public void onError(Throwable error) {
        responseObserver.onError(error);
      }

      @Override
      public void onCompleted() {
        responseObserver.onCompleted();
      }
    };
  }
}
```

生成的客户端会返回标准的 grpc-java 调用形式：

```java
package demo.greeter;

import io.grpc.stub.StreamObserver;
import java.util.Iterator;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

final class StreamingClient {
  private final GreeterGrpc.GreeterBlockingStub blockingStub;
  private final GreeterGrpc.GreeterStub asyncStub;

  StreamingClient(
      GreeterGrpc.GreeterBlockingStub blockingStub,
      GreeterGrpc.GreeterStub asyncStub) {
    this.blockingStub = blockingStub;
    this.asyncStub = asyncStub;
  }

  void run() throws InterruptedException {
    Iterator<HelloReply> replies =
        blockingStub.lotsOfReplies(newRequest("Fory"));
    while (replies.hasNext()) {
      System.out.println(replies.next().getReply());
    }

    CountDownLatch greetingsDone = new CountDownLatch(1);
    StreamObserver<HelloRequest> greetings =
        asyncStub.lotsOfGreetings(new StreamObserver<>() {
          @Override
          public void onNext(HelloReply reply) {
            System.out.println(reply.getReply());
          }

          @Override
          public void onError(Throwable error) {
            greetingsDone.countDown();
          }

          @Override
          public void onCompleted() {
            greetingsDone.countDown();
          }
        });
    greetings.onNext(newRequest("Ada"));
    greetings.onNext(newRequest("Grace"));
    greetings.onCompleted();
    greetingsDone.await(5, TimeUnit.SECONDS);

    CountDownLatch chatDone = new CountDownLatch(1);
    StreamObserver<HelloRequest> chat =
        asyncStub.chat(new StreamObserver<>() {
          @Override
          public void onNext(HelloReply reply) {
            System.out.println(reply.getReply());
          }

          @Override
          public void onError(Throwable error) {
            chatDone.countDown();
          }

          @Override
          public void onCompleted() {
            chatDone.countDown();
          }
        });
    chat.onNext(newRequest("Fory"));
    chat.onCompleted();
    chatDone.await(5, TimeUnit.SECONDS);
  }

  private static HelloRequest newRequest(String name) {
    HelloRequest request = new HelloRequest();
    request.setName(name);
    return request;
  }
}
```

生成的描述符会为 gRPC 路径保留 IDL 中准确的服务名和方法名。

## gRPC 运行时行为

生成的服务代码只会替换请求和响应的序列化方式。所有常规的 gRPC 运维功能仍由 grpc-java 负责：

- 截止时间和取消
- TLS 和身份认证
- 名称解析和负载均衡
- 客户端和服务端拦截器
- 状态码和元数据
- 通道池化和生命周期管理

## 故障排查

### 缺少 `io.grpc` 或 Guava 类

请添加上文所示的 grpc-java 依赖。生成的 Fory 服务文件会导入 grpc-java API，但 Fory Java 构件有意不依赖 gRPC。

### `UNIMPLEMENTED`

请确认已通过 `ServerBuilder.addService(...)` 注册生成的服务实现，并且客户端和服务端由相同的包名、服务名和方法名生成。

### Protobuf 客户端无法解码服务

Fory gRPC 配套代码不会对消息使用 protobuf 编码格式。请为 Fory 生成的服务使用 Fory 生成的客户端，或者为通用 protobuf 客户端提供单独的 protobuf 服务端点。
