---
title: 高级特性
sidebar_position: 10
id: advanced_features
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

本页介绍高级特性，包括零拷贝序列化、深拷贝、内存管理和日志记录。

## 零拷贝序列化

Fory 支持零拷贝序列化，以高效处理大型二进制数据：

```java
import org.apache.fory.*;
import org.apache.fory.config.*;
import org.apache.fory.serializer.BufferObject;
import org.apache.fory.memory.MemoryBuffer;

import java.util.*;
import java.util.stream.Collectors;

public class ZeroCopyExample {
  // 注意 fory 实例应该复用，而不是每次都创建。
  static Fory fory = Fory.builder()
    .withLanguage(Language.JAVA)
    .build();

  public static void main(String[] args) {
    List<Object> list = Arrays.asList("str", new byte[1000], new int[100], new double[100]);
    Collection<BufferObject> bufferObjects = new ArrayList<>();
    byte[] bytes = fory.serialize(list, e -> !bufferObjects.add(e));
    List<MemoryBuffer> buffers = bufferObjects.stream()
      .map(BufferObject::toBuffer).collect(Collectors.toList());
    System.out.println(fory.deserialize(bytes, buffers));
  }
}
```

## 对象深拷贝

Fory 提供高效的深拷贝功能：

### 启用引用跟踪

```java
Fory fory = Fory.builder().withRefCopy(true).build();
SomeClass a = xxx;
SomeClass copied = fory.copy(a);
```

### 禁用引用跟踪（更好的性能）

禁用时，深拷贝将忽略循环引用和共享引用。对象图的相同引用将在一次 `Fory#copy` 中被复制为不同的对象：

```java
Fory fory = Fory.builder().withRefCopy(false).build();
SomeClass a = xxx;
SomeClass copied = fory.copy(a);
```

## 内存分配自定义

Fory 提供了 `MemoryAllocator` 接口，允许你自定义在序列化操作期间如何分配和增长内存缓冲区。这对于性能优化、内存池化或调试内存使用很有用。

### MemoryAllocator 接口

`MemoryAllocator` 接口定义了两个关键方法：

```java
public interface MemoryAllocator {
  /**
   * 分配具有指定初始容量的新 MemoryBuffer。
   */
  MemoryBuffer allocate(int initialCapacity);

  /**
   * 增长现有缓冲区以容纳新容量。
   * 实现必须通过修改现有缓冲区实例来原地增长缓冲区。
   */
  MemoryBuffer grow(MemoryBuffer buffer, int newCapacity);
}
```

### 使用自定义内存分配器

你可以设置一个全局内存分配器，所有 `MemoryBuffer` 实例都将使用它：

```java
// 创建自定义分配器
MemoryAllocator customAllocator = new MemoryAllocator() {
  @Override
  public MemoryBuffer allocate(int initialCapacity) {
    // 为调试或池化添加额外容量
    return MemoryBuffer.fromByteArray(new byte[initialCapacity + 100]);
  }

  @Override
  public MemoryBuffer grow(MemoryBuffer buffer, int newCapacity) {
    if (newCapacity <= buffer.size()) {
      return buffer;
    }

    // 自定义增长策略 - 添加 100% 额外容量
    int newSize = (int) (newCapacity * 2);
    byte[] data = new byte[newSize];
    buffer.copyToUnsafe(0, data, Platform.BYTE_ARRAY_OFFSET, buffer.size());
    buffer.initHeapBuffer(data, 0, data.length);
    return buffer;
  }
};

// 全局设置自定义分配器
MemoryBuffer.setGlobalAllocator(customAllocator);

// 所有后续的 MemoryBuffer 分配都将使用你的自定义分配器
Fory fory = Fory.builder().withLanguage(Language.JAVA).build();
byte[] bytes = fory.serialize(someObject); // 使用自定义分配器
```

### 默认内存分配器行为

默认分配器使用以下增长策略：

- 对于小于 `BUFFER_GROW_STEP_THRESHOLD` (100MB) 的缓冲区：将容量乘以 2
- 对于较大的缓冲区：将容量乘以 1.5（上限为 `Integer.MAX_VALUE - 8`）

这在避免频繁重新分配和防止过度内存使用之间提供了平衡。

### 使用场景

自定义内存分配器适用于：

- **内存池化**：重用分配的缓冲区以减少 GC 压力
- **性能调优**：根据你的工作负载使用不同的增长策略
- **调试**：添加日志记录或跟踪以监控内存使用
- **堆外内存**：与堆外内存管理系统集成

## 日志记录

### ForyLogger

默认情况下，Fory 使用自定义日志记录器 `ForyLogger` 来满足内部需求。它将生成的日志数据构建为单个字符串，并直接发送到 `System.out`。结果行布局类似于（Log4j 表示法）：

```
%d{yyyy-MM-dd hh:mm:ss} %p  %C:%L [%t] - %m%n
```

布局无法更改。

示例输出：

```
2025-11-07 08:49:59 INFO  CompileUnit:55 [main] - Generate code for org.apache.fory.builder.SerializedLambdaForyCodec_0 took 35 ms.
2025-11-07 08:50:00 INFO  JaninoUtils:121 [main] - Compile [SerializedLambdaForyCodec_0] take 144 ms
```

### Slf4jLogger

如果需要更复杂的日志记录器，可以通过 `LoggerFactory.useSlf4jLogging()` 配置 Fory 使用 Slf4j。例如，在创建 Fory 之前启用 Slf4j：

```java
public static final ThreadSafeFory FORY;

static {
  LoggerFactory.useSlf4jLogging(true);
  FORY = Fory.builder()
    .buildThreadSafeFory();
}
```

**注意**：当应用程序在 GraalVM native image 中运行时，通过 `useSlf4jLogging` 启用 Slf4j 将被忽略。

### 抑制 Fory 日志

`ForyLogger` 和 `Slf4jLogger` 都允许控制日志输出级别或完全抑制日志。通过 `LoggerFactory.setLogLevel()` 配置日志级别：

```java
static {
  // 只记录 WARN 及更高级别
  LoggerFactory.setLogLevel(LogLevel.WARN_LEVEL);

  // 完全禁用日志记录
  LoggerFactory.disableLogging();
}
```

**注意**：所选的日志级别在 Slf4j 实现的日志级别之前应用。因此，如果你设置 `WARN_LEVEL`（如上例），即使在 Logback 中启用了 INFO，你也不会看到来自 Fory 的 INFO 消息。

## 相关主题

- [压缩](compression.md) - 数据压缩选项
- [配置选项](configuration.md) - 所有 ForyBuilder 选项
- [跨语言序列化](xlang-serialization.md) - XLANG 模式
