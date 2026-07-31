---
title: 零拷贝序列化
sidebar_position: 4
id: xlang_zero_copy
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

零拷贝序列化允许大型二进制数据（字节数组、数值数组）以带外方式序列化，避免内存复制并减少序列化开销。

## 何时使用零拷贝

在以下情况下使用零拷贝序列化：

- 序列化大型字节数组或二进制数据块
- 处理数值数组（int[]、double[] 等）
- 通过高性能网络传输数据
- 内存效率至关重要

## 工作原理

1. **序列化**：大型缓冲区被提取出来，并通过回调单独返回
2. **传输**：主序列化数据和缓冲区对象分别传输
3. **反序列化**：提供缓冲区以重建原始对象

这避免了将大型数据复制到主序列化缓冲区中。

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
    Fory fory = Fory.builder().withLanguage(Language.XLANG).build();

    // 包含大型数组的数据
    List<Object> list = List.of(
        "str",
        new byte[1000],    // 大型字节数组
        new int[100],      // 大型 int 数组
        new double[100]    // 大型 double 数组
    );

    // 在序列化期间收集缓冲区对象
    Collection<BufferObject> bufferObjects = new ArrayList<>();
    byte[] bytes = fory.serialize(list, e -> !bufferObjects.add(e));

    // 转换为缓冲区以便传输
    List<MemoryBuffer> buffers = bufferObjects.stream()
        .map(BufferObject::toBuffer)
        .collect(Collectors.toList());

    // 使用缓冲区反序列化
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

fory = pyfory.Fory()

# 包含大型数组的数据
data = [
    "str",
    bytes(bytearray(1000)),           # 大型字节数组
    array.array("i", range(100)),     # 大型 int 数组
    np.full(100, 0.0, dtype=np.double) # 大型 numpy 数组
]

# 在序列化期间收集缓冲区对象
serialized_objects = []
serialized_data = fory.serialize(data, buffer_callback=serialized_objects.append)

# 转换为缓冲区以便传输
buffers = [obj.to_buffer() for obj in serialized_objects]

# 使用缓冲区反序列化
result = fory.deserialize(serialized_data, buffers=buffers)
print(result)
```

## Go

```go
package main

import forygo "github.com/apache/fory/go/fory"
import "fmt"

func main() {
  fory := forygo.NewFory()

  // 包含大型数组的数据
  list := []interface{}{
    "str",
    make([]byte, 1000), // 大型字节数组
  }

  buf := fory.NewByteBuffer(nil)
  var bufferObjects []fory.BufferObject

  // 在序列化期间收集缓冲区对象
  fory.Serialize(buf, list, func(o fory.BufferObject) bool {
    bufferObjects = append(bufferObjects, o)
    return false
  })

  // 转换为缓冲区以便传输
  var buffers []*fory.ByteBuffer
  for _, o := range bufferObjects {
    buffers = append(buffers, o.ToBuffer())
  }

  // 使用缓冲区反序列化
  var newList []interface{}
  if err := fory.Deserialize(buf, &newList, buffers); err != nil {
    panic(err)
  }
  fmt.Println(newList)
}
```

## JavaScript

```javascript
// 零拷贝支持即将推出
```

## 使用场景

### 高性能数据传输

在通过网络发送大型数据集时：

```java
// 发送方
Collection<BufferObject> buffers = new ArrayList<>();
byte[] metadata = fory.serialize(dataObject, e -> !buffers.add(e));

// 分别发送元数据和缓冲区
network.sendMetadata(metadata);
for (BufferObject buf : buffers) {
    network.sendBuffer(buf.toBuffer());
}

// 接收方
byte[] metadata = network.receiveMetadata();
List<MemoryBuffer> buffers = network.receiveBuffers();
Object data = fory.deserialize(metadata, buffers);
```

### 内存映射文件

零拷贝与内存映射文件配合良好：

```java
// 写入
Collection<BufferObject> buffers = new ArrayList<>();
byte[] data = fory.serialize(largeObject, e -> !buffers.add(e));
writeToFile("data.bin", data);
for (int i = 0; i < buffers.size(); i++) {
    writeToFile("buffer" + i + ".bin", buffers.get(i).toBuffer());
}

// 读取
byte[] data = readFromFile("data.bin");
List<MemoryBuffer> buffers = readBufferFiles();
Object result = fory.deserialize(data, buffers);
```

## 性能考虑

1. **阈值**：由于回调开销，小数组可能不会从零拷贝中受益
2. **网络**：当缓冲区可以在不复制的情况下发送时，零拷贝最有益
3. **内存**：通过避免缓冲区复制来减少峰值内存使用

## 另请参阅

- [序列化](serialization.md) - 标准序列化示例
- [Python 带外指南](../python/out-of-band.md) - Python 特定的零拷贝详情
