---
title: 虚拟线程
sidebar_position: 16
id: virtual-threads
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

Apache Fory Java 使用 `buildThreadSafeFory()` 支持虚拟线程工作负载。该方法构建固定大小的共享 `ThreadPoolFory`，池大小为 `4 * availableProcessors()`。如需其他固定池大小，请使用 `buildThreadSafeForyPool(poolSize)`。

## 使用二进制输入/输出 API

使用虚拟线程时，请始终使用 Fory 的二进制输入/输出 API：

- `serialize(Object)` 或 `serialize(MemoryBuffer, Object)`
- `deserialize(byte[])` 或 `deserialize(MemoryBuffer)`

典型用法：

```java
ThreadSafeFory fory = Fory.builder().withXlang(false)
    .requireClassRegistration(false)
    .buildThreadSafeFory();

byte[] bytes = fory.serialize(request);
Object value = fory.deserialize(bytes);
```

## 大量虚拟线程不要使用流式 API

在大量使用虚拟线程的工作负载中，不要使用基于流或通道的 API：

- `serialize(OutputStream, Object)`
- `deserialize(ForyInputStream)`
- `deserialize(ForyReadableChannel)`

这些 API 会在整个阻塞调用期间持续占用池中的 `Fory` 实例。虚拟线程很多时，大量 `Fory` 实例会在等待 I/O 时一直处于占用状态。每个 `Fory` 实例通常使用约 `30~50 KB` 内存，因此阻塞 I/O 期间保留大量实例会迅速累积内存开销。

仅当虚拟线程最多只有几百个，且额外保留的 `Fory` 内存仍可接受时，才对虚拟线程使用流式 API。

## 为什么二进制 API 更合适

序列化和反序列化属于 CPU 工作。Fory 速度很快，因此与网络传输时间相比，这段 CPU 时间通常很短。

大多数情况下，无需让网络传输与 Fory 反序列化重叠。Fory 反序列化时间通常不到网络传输时间的 `1/10`，所以优化传输路径远比尝试通过 Fory 流式处理单个对象图重要。

大多数 RPC 系统也已经使用带帧的字节消息，而不是 Java 对象流。例如，gRPC 使用长度分隔帧，与 Fory 的二进制 API 天然契合。

推荐的虚拟线程模式如下：

1. 将一条帧消息读入字节数组。
2. 调用 `fory.deserialize(bytes)`。
3. 生成响应对象。
4. 调用 `fory.serialize(response)`。
5. 将响应字节作为下一帧写出。

## 推荐模式

```java
byte[] requestBytes = readOneFrame(channel);
Request request = (Request) fory.deserialize(requestBytes);

Response response = handle(request);
byte[] responseBytes = fory.serialize(response);
writeOneFrame(channel, responseBytes);
```

这样可以让 Fory 专注于快速的 CPU 密集型部分，并将阻塞 I/O 留在序列化器之外。

## 超大载荷：分块长度分隔流

多数情况下，上述常规字节帧模式已经足够。只有处理非常大的载荷，且希望让传输与序列化、反序列化重叠时，才考虑分块流式传输。

即便如此，也不要使用 Fory 的流式 API。应将一个大载荷拆分为多个子对象图，把每个子对象图序列化为 `byte[]`，然后依次写入：

1. 帧长度
2. 分块字节

在虚拟线程中反序列化时：

1. 读取帧长度
2. 精确读取对应数量的字节
3. 调用 `fory.deserialize(chunkBytes)`

这样，传输层可以逐块传送数据，而 Fory 仍然处理完整的二进制帧。

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

长度分隔帧十分常见，gRPC 也使用长度分隔帧而不是 Java 对象流，因此这种模式非常适合典型的 RPC 和虚拟线程传输。
