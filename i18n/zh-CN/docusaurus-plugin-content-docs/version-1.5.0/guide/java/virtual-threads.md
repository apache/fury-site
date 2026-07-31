---
title: 虚拟线程
sidebar_position: 8
id: java_virtual_threads
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

Apache Fory Java 在虚拟线程工作负载下应使用 `buildThreadSafeFory()`。它会构建一个固定大小的共享 `ThreadPoolFory`，其大小为 `4 * availableProcessors()`。如果你需要不同的固定池大小，请使用 `buildThreadSafeForyPool(poolSize)`。

## 使用二进制输入/输出 API

在使用虚拟线程时，应始终使用 Fory 的二进制输入/输出 API：

- `serialize(Object)` 或 `serialize(MemoryBuffer, Object)`
- `deserialize(byte[])` 或 `deserialize(MemoryBuffer)`

典型用法：

```java
ThreadSafeFory fory = Fory.builder()
    .requireClassRegistration(false)
    .buildThreadSafeFory();

byte[] bytes = fory.serialize(request);
Object value = fory.deserialize(bytes);
```

## 在大量虚拟线程场景下不要使用 Stream API

对于大量依赖虚拟线程的工作负载，不要使用基于 stream 或 channel 的 API：

- `serialize(OutputStream, Object)`
- `deserialize(ForyInputStream)`
- `deserialize(ForyReadableChannel)`

这些 API 会在整个阻塞调用期间一直占用一个池化的 `Fory` 实例。在大量虚拟线程场景下，这意味着许多 `Fory` 实例会在等待 I/O 时持续处于占用状态。每个 `Fory` 实例通常会使用大约 `30~50 KB` 内存，因此在阻塞 I/O 期间保留大量实例会很快累积出明显的内存开销。

只有当你的虚拟线程数量至多是几百个，并且这些额外保留的 `Fory` 内存仍然可以接受时，才建议在虚拟线程中使用 stream API。

## 为什么二进制 API 更合适

序列化和反序列化属于 CPU 工作。Fory 本身足够快，因此这部分 CPU 时间通常远短于网络传输时间。

在大多数情况下，你并不需要让网络传输与 Fory 反序列化重叠执行。Fory 反序列化的耗时通常不到网络传输时间的 `1/10`，因此相比尝试通过 Fory 逐步流式处理一个对象图，优化传输路径往往更重要。

大多数 RPC 系统本身也是基于带帧的字节消息，而不是 Java 对象流。例如，gRPC 使用长度定界帧，这与 Fory 的二进制 API 天然契合。

一个适合虚拟线程的模式是：

1. 读取一条完整的带帧消息到字节数组中
2. 调用 `fory.deserialize(bytes)`
3. 生成响应对象
4. 调用 `fory.serialize(response)`
5. 将响应字节写成下一段带帧数据

## 推荐模式

```java
byte[] requestBytes = readOneFrame(channel);
Request request = (Request) fory.deserialize(requestBytes);

Response response = handle(request);
byte[] responseBytes = fory.serialize(response);
writeOneFrame(channel, responseBytes);
```

这种方式让 Fory 只参与高效的 CPU 密集部分，而把阻塞 I/O 留在序列化器之外。

## 超大载荷：分块的长度定界流式处理

对于大多数场景，上述常规的带帧字节模式已经足够。只有在载荷非常大，并且你希望让传输与序列化/反序列化重叠时，才需要考虑分块流式处理。

即便如此，也不要使用 Fory 自带的 stream API。正确做法是：把一个大载荷拆成多个子对象图，将每个子对象图分别序列化为 `byte[]`，然后按以下顺序写出：

1. 帧长度
2. 分块字节

在虚拟线程中进行反序列化时：

1. 读取帧长度
2. 精确读取对应字节数
3. 调用 `fory.deserialize(chunkBytes)`

这样可以让传输按块推进，而 Fory 始终只处理完整的二进制帧。

```java
for (Object chunk : splitIntoSubGraphs(largePayload)) {
  byte[] bytes = fory.serialize(chunk);
  writeFrame(output, bytes);
}

while (hasMoreFrames(input)) {
  int length = readLength(input);
  byte[] bytes = readBytes(input, length);
  Object chunk = fory.deserialize(bytes);
  consumeChunk(chunk);
}
```

长度定界帧非常常见，gRPC 也使用长度定界帧而不是 Java 对象流，因此这种模式与典型 RPC 和虚拟线程传输模型非常契合。
