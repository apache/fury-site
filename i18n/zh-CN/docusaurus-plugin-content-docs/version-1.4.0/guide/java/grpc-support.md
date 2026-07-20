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

Fory 可以为包含 service 定义的 schema 生成 Java gRPC service companion。生成的 service code
使用普通 grpc-java channel、server、deadline、status code、interceptor 和 transport security，
但 request/response 对象使用 Fory 序列化，而不是 protobuf。

当两端都由同一份 Fory IDL、protobuf IDL 或 FlatBuffers IDL 生成，并且你希望使用 gRPC
传输语义与 Fory payload 编码时，可以使用这种模式。如果 API 必须被通用 protobuf client、
reflection 工具或期望 protobuf message bytes 的组件消费，请使用标准 protobuf gRPC 代码生成。

Scala 生成的 grpc-java companion 见 [Scala gRPC 支持](../scala/grpc-support.md)。Kotlin
coroutine stub 和 service base 见 [Kotlin gRPC 支持](../kotlin/grpc-support.md)。

## 添加依赖

生成的 Java service 文件编译时需要 grpc-java。Fory Java artifact 不会把 gRPC 作为硬依赖，
因此请在应用中添加 grpc-java 依赖：

```xml
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
```

Gradle 示例：

```kotlin
dependencies {
  implementation("org.apache.fory:fory-core:$foryVersion")
  implementation("io.grpc:grpc-api:$grpcVersion")
  implementation("io.grpc:grpc-stub:$grpcVersion")
  implementation("io.grpc:grpc-netty-shaded:$grpcVersion")
}
```

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

使用 `--grpc` 生成 Java model 和 gRPC companion：

```bash
foryc service.fdl --java_out=./generated/java --grpc
```

该 schema 会生成：

| 文件                     | 用途                                  |
| ------------------------ | ------------------------------------- |
| `HelloRequest.java`      | request 的 Fory model 类型            |
| `HelloReply.java`        | response 的 Fory model 类型           |
| `GreeterForyModule.java` | 生成类型的 Fory 注册 module           |
| `GreeterGrpc.java`       | grpc-java service base、stub 和 codec |

生成的 method descriptor 使用 Fory-backed `MethodDescriptor.Marshaller`，因此不会调用 protobuf
parser。

## 实现 Server

实现生成的 service base，并注册到标准 grpc-java `Server`：

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

生成代码负责注册和序列化 request/response 类型，service 实现不需要手动创建 Fory 实例。

## 创建 Client

使用普通 grpc-java channel 和生成 stub：

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

Channel lifecycle、deadline、credential、metadata、load balancing、retry 和 interceptor 都保持
grpc-java 行为。

## Streaming RPC

Fory service 可以使用 gRPC 的所有 streaming shape：

```protobuf
service Greeter {
  rpc SayHello (HelloRequest) returns (HelloReply);
  rpc LotsOfReplies (HelloRequest) returns (stream HelloReply);
  rpc LotsOfGreetings (stream HelloRequest) returns (HelloReply);
  rpc Chat (stream HelloRequest) returns (stream HelloReply);
}
```

生成 Java service 方法遵循 grpc-java 约定：

| IDL shape                                 | Server 方法形态                                        | Client 方法形态                     |
| ----------------------------------------- | ------------------------------------------------------ | ----------------------------------- |
| `rpc A (Req) returns (Res)`               | `void a(Req request, StreamObserver<Res> responses)`   | blocking、async、future unary stub  |
| `rpc A (Req) returns (stream Res)`        | `void a(Req request, StreamObserver<Res> responses)`   | blocking iterator 或 async observer |
| `rpc A (stream Req) returns (Res)`        | `StreamObserver<Req> a(StreamObserver<Res> responses)` | async request observer              |
| `rpc A (stream Req) returns (stream Res)` | `StreamObserver<Req> a(StreamObserver<Res> responses)` | async request observer              |

Server 可以直接实现生成的 streaming 方法：

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

生成的 client 返回标准 grpc-java 调用形态：

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

生成 descriptor 会保留 IDL 中的 service 和 method 名称作为 gRPC path。

## gRPC 运行时行为

生成的 service code 只替换 request/response 序列化。常规 gRPC service 行为仍由 grpc-java 提供：

- Deadline 和取消
- TLS 和认证
- 名称解析与负载均衡
- Client/server interceptor
- Status code 和 metadata
- Channel 池化与生命周期管理

## 故障排查

### 缺少 `io.grpc` 或 Guava 类

添加上面的 grpc-java 依赖。生成的 Fory service 文件导入 grpc-java API，但 Fory Java artifact
不会自动依赖 gRPC。

### `UNIMPLEMENTED`

确认生成的 service 实现已通过 `ServerBuilder.addService(...)` 注册，并且 client 与 server 来自相同
package、service 和 method 名称。

### Protobuf Client 无法解码

Fory gRPC companion 不使用 protobuf wire encoding。请使用 Fory 生成的 client 调用 Fory 生成的
service，或提供单独的 protobuf endpoint。
