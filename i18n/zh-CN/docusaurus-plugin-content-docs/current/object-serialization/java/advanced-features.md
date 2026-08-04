---
title: 高级功能
sidebar_position: 8
id: advanced-features
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

本页介绍不属于首次使用范畴的 Java Fory 高级功能。Java 原生模式的零拷贝序列化参见
[原生序列化](native.md)，深拷贝语义参见[对象复制](object-copy.md)。

## 自定义内存分配

Fory 提供 `MemoryAllocator` 接口，可用于自定义序列化过程中内存缓冲区的分配与扩容方式。这适用于性能优化、内存池化或内存用量调试。

### MemoryAllocator 接口

`MemoryAllocator` 接口定义了两个关键方法：

```java
public interface MemoryAllocator {
  /**
   * Allocates a new MemoryBuffer with the specified initial capacity.
   */
  MemoryBuffer allocate(int initialCapacity);

  /**
   * Grows an existing buffer to accommodate the new capacity.
   * The implementation must grow the buffer in-place by modifying
   * the existing buffer instance.
   */
  void grow(MemoryBuffer buffer, int newCapacity);
}
```

### 使用自定义内存分配器

可以设置供所有 `MemoryBuffer` 实例使用的全局内存分配器：

```java
// Create a custom allocator
MemoryAllocator customAllocator = new MemoryAllocator() {
  @Override
  public MemoryBuffer allocate(int initialCapacity) {
    // Add extra capacity for debugging or pooling
    return MemoryBuffer.fromByteArray(new byte[initialCapacity + 100]);
  }

  @Override
  public void grow(MemoryBuffer buffer, int newCapacity) {
    if (newCapacity <= buffer.size()) {
      return;
    }

    // Custom growth strategy - add 100% extra capacity
    int newSize = (int) (newCapacity * 2);
    byte[] data = new byte[newSize];
    buffer.get(0, data, 0, buffer.size());
    buffer.initHeapBuffer(data, 0, data.length);
  }
};

// Set the custom allocator globally
MemoryBuffer.setGlobalAllocator(customAllocator);

// All subsequent MemoryBuffer allocations will use your custom allocator
Fory fory = Fory.builder().withXlang(false).build();
byte[] bytes = fory.serialize(someObject); // Uses custom allocator
```

### 默认内存分配器行为

默认分配器采用以下扩容策略：

- 小于 `BUFFER_GROW_STEP_THRESHOLD`（100MB）的缓冲区：容量扩大至 2 倍
- 更大的缓冲区：容量扩大至 1.5 倍（上限为 `Integer.MAX_VALUE - 8`）

这在避免频繁重新分配与防止内存用量过高之间取得了平衡。

### 使用场景

自定义内存分配器适用于：

- **内存池化**：复用已分配的缓冲区，降低 GC 压力
- **性能调优**：根据工作负载采用不同的扩容策略
- **调试**：添加日志或跟踪以监控内存用量
- **堆外内存**：与堆外内存管理系统集成

## 日志

### ForyLogger

默认情况下，Fory 内部使用自定义日志器 `ForyLogger`，日志级别为 `WARN`；也可为 `INFO`，后者在设置 `ENABLE_FORY_DEBUG_OUTPUT=1` 时生效。可在进程启动前将 `FORY_LOG_LEVEL` 设为 `ERROR`、`WARN`、`INFO` 或 `DEBUG`，以配置进程的默认级别。`ForyLogger` 会将一条日志的数据构造成单个字符串并直接发送到 `System.out`。输出行格式类似如下（以 Log4j 记法表示）：

```
%d{yyyy-MM-dd hh:mm:ss} %p  %C:%L [%t] - %m%n
```

该格式不可更改。

输出示例：

```
2025-11-07 08:49:59 INFO  CompileUnit:55 [main] - Generate code for org.apache.fory.builder.SerializedLambdaForyCodec_0 took 35 ms.
2025-11-07 08:50:00 INFO  JaninoUtils:121 [main] - Compile [SerializedLambdaForyCodec_0] take 144 ms
```

### Slf4jLogger

如果需要更完善的日志器，可通过 `LoggerFactory.useSlf4jLogging()` 配置 Fory 使用 Slf4j。例如，在创建 Fory 前启用 Slf4j：

```java
public static final ThreadSafeFory FORY;

static {
  LoggerFactory.useSlf4jLogging(true);
  FORY = Fory.builder().withXlang(false)
    .buildThreadSafeFory();
}
```

**注意：** 应用在 GraalVM 原生镜像中运行时，通过 `useSlf4jLogging` 启用 Slf4j 的设置会被忽略。

### 抑制 Fory 日志

`ForyLogger` 和 `Slf4jLogger` 都支持控制日志输出级别或完全禁用日志。通过 `LoggerFactory.setLogLevel()` 配置日志级别：

```java
static {
  // to log only WARN and higher
  LoggerFactory.setLogLevel(LogLevel.WARN_LEVEL);

  // to disable logging entirely
  LoggerFactory.disableLogging();
}
```

**注意：** 所选日志级别会先于 Slf4j 实现自身的日志级别生效。因此，如果像上例一样设置了 `WARN_LEVEL`，即使 Logback 已启用 INFO，也看不到 Fory 的 INFO 消息。

## 相关主题

- [压缩](compression.md) - 数据压缩选项
- [配置](configuration.md) - 所有 ForyBuilder 选项
- [原生序列化](native.md) - 仅限 Java 的序列化、JDK 钩子和零拷贝缓冲区
- [对象复制](object-copy.md) - 深拷贝功能
- [跨语言序列化](xlang.md) - Java 跨语言互操作
