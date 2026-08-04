---
title: 零拷贝序列化
sidebar_position: 7
id: zero-copy
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

零拷贝序列化允许将大型二进制数据（字节数组、数字数组）带外序列化，从而避免内存复制并降低序列化开销。

## 何时使用零拷贝

以下情况使用零拷贝序列化：

- 序列化大型字节数组或二进制块
- 处理数字数组（int[]、double[] 等）
- 通过高性能网络传输数据
- 对内存效率要求很高

## 工作原理

1. **序列化**：提取大型缓冲区，并通过回调单独返回
2. **传输**：分别传输主序列化数据和缓冲区对象
3. **反序列化**：重新提供缓冲区以重建原始对象

这样可以避免将大型数据复制到主序列化缓冲区。

## Java

```java
import org.apache.fory.*;
import org.apache.fory.config.*;
import org.apache.fory.serializer.BufferObject;
import org.apache.fory.memory.MemoryBuffer;

import java.util.*;
import java.util.stream.Collectors;

public class ZeroCopyExample {
  public static void main(String[] args) {
    Fory fory = Fory.builder().withXlang(true).build();

    // Data with large arrays
    List<Object> list = List.of(
        "str",
        new byte[1000],    // Large byte array
        new int[100],      // Large int array
        new double[100]    // Large double array
    );

    // Collect buffer objects during serialization
    Collection<BufferObject> bufferObjects = new ArrayList<>();
    byte[] bytes = fory.serialize(list, e -> !bufferObjects.add(e));

    // Convert to buffers for transport
    List<MemoryBuffer> buffers = bufferObjects.stream()
        .map(BufferObject::toBuffer)
        .collect(Collectors.toList());

    // Deserialize with buffers
    Object result = fory.deserialize(bytes, buffers);
    System.out.println(result);
  }
}
```

## Python

```python
import array
import pyfory
import numpy as np

fory = pyfory.Fory(xlang=True)

# Data with large arrays
data = [
    "str",
    bytes(bytearray(1000)),           # Large byte array
    array.array("i", range(100)),     # Large int array
    np.full(100, 0.0, dtype=np.double) # Large numpy array
]

# Collect buffer objects during serialization
serialized_objects = []
serialized_data = fory.serialize(data, buffer_callback=serialized_objects.append)

# Convert to buffers for transport
buffers = [obj.to_buffer() for obj in serialized_objects]

# Deserialize with buffers
result = fory.deserialize(serialized_data, buffers=buffers)
print(result)
```

## Go

```go
package main

import forygo "github.com/apache/fory/go/fory"
import "fmt"

func main() {
  serializer := forygo.NewFory(forygo.WithXlang(true))

  // Data with large arrays
  list := []any{
    "str",
    make([]byte, 1000), // Large byte array
  }

  buf := forygo.NewByteBuffer(nil)
  var bufferObjects []forygo.BufferObject

  // Collect buffer objects during serialization
  if err := serializer.SerializeWithCallback(buf, list, func(o forygo.BufferObject) bool {
    bufferObjects = append(bufferObjects, o)
    return false
  }); err != nil {
    panic(err)
  }

  // Convert to buffers for transport
  var buffers []*forygo.ByteBuffer
  for _, o := range bufferObjects {
    buffers = append(buffers, o.ToBuffer())
  }

  // Deserialize with buffers
  var newList []any
  if err := serializer.DeserializeWithCallbackBuffers(buf, &newList, buffers); err != nil {
    panic(err)
  }
  fmt.Println(newList)
}
```

## 使用场景

### 高性能数据传输

通过网络发送大型数据集时：

```java
// Sender
Collection<BufferObject> buffers = new ArrayList<>();
byte[] metadata = fory.serialize(dataObject, e -> !buffers.add(e));

// Send metadata and buffers separately
network.sendMetadata(metadata);
for (BufferObject buf : buffers) {
    network.sendBuffer(buf.toBuffer());
}

// Receiver
byte[] metadata = network.receiveMetadata();
List<MemoryBuffer> buffers = network.receiveBuffers();
Object data = fory.deserialize(metadata, buffers);
```

### 内存映射文件

零拷贝非常适合内存映射文件：

```java
// Write
Collection<BufferObject> buffers = new ArrayList<>();
byte[] data = fory.serialize(largeObject, e -> !buffers.add(e));
writeToFile("data.bin", data);
for (int i = 0; i < buffers.size(); i++) {
    writeToFile("buffer" + i + ".bin", buffers.get(i).toBuffer());
}

// Read
byte[] data = readFromFile("data.bin");
List<MemoryBuffer> buffers = readBufferFiles();
Object result = fory.deserialize(data, buffers);
```

## 性能注意事项

1. **阈值**：由于回调开销，小型数组可能无法从零拷贝中受益
2. **网络**：缓冲区可以无复制发送时，零拷贝的收益最大
3. **内存**：避免缓冲区复制，从而降低峰值内存用量

## 另请参阅

- [跨语言概述](index.md) - 标准序列化工作流和运行时指南
- [Python 带外指南](../python/out-of-band.md) - Python 专用零拷贝详情
