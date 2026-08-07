---
title: JDK 自定义序列化
sidebar_position: 12
id: jdk-serialization
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

Java 原生模式在写入 Fory 原生格式时，可以遵循现有的 JDK 对象自定义钩子。迁移已经实现 Java 序列化行为的类时，请参考本页。

## JDK 序列化钩子

Java 原生模式支持许多现有 Java 对象模型使用的 JDK 序列化钩子：

- `writeObject` 和 `readObject`
- `writeReplace` 和 `readResolve`
- `readObjectNoData`
- `Externalizable`

```java
import java.io.IOException;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.io.Serializable;

public class MyClass implements Serializable {
  private void writeObject(ObjectOutputStream out) throws IOException {
    // Custom serialization logic.
  }

  private void readObject(ObjectInputStream in) throws IOException {
    // Custom deserialization logic.
  }

  private Object writeReplace() {
    return this;
  }

  private Object readResolve() {
    return this;
  }
}
```

Fory 原生载荷不是 JDK `ObjectOutputStream` 载荷。为兼容 Java 对象，Fory 会遵循这些钩子，但新的载荷应由 Fory 写入和读取。

## 从 Java 序列化框架迁移

替换 JDK 序列化、Kryo、FST、Hessian 或仅限 Java 的 Protocol Buffers 流水线时：

1. 数据仅供 Java 使用，因此从 `.withXlang(false)` 开始。
2. 保持 `requireClassRegistration(true)`，并使用显式 ID 注册应用类。
3. 写入端和读取端独立滚动发布时，保持兼容模式开启。
4. 仅在对象标识或循环引用很重要时启用 `.withRefTracking(true)`。
5. 为热点类添加自定义序列化器，避免使用开销较大的 JDK 序列化钩子。
6. 尽可能分离新旧字节流。

当应用读取的数据可能是 JDK `ObjectOutputStream` 字节，也可能是 Fory 原生模式字节时，`JavaSerializer.serializedByJDK` 可以先识别 JDK 载荷，再回退到 Fory：

```java
import java.io.ByteArrayInputStream;
import java.io.ObjectInputStream;
import org.apache.fory.serializer.JavaSerializer;

if (JavaSerializer.serializedByJDK(bytes)) {
  ObjectInputStream objectInputStream = new ObjectInputStream(new ByteArrayInputStream(bytes));
  return objectInputStream.readObject();
}
return fory.deserialize(bytes);
```

仅在确实接受两种格式的边界使用这一桥接方式。其他情况下，Fory 原生模式载荷应直接由 Fory 写入和读取。

## 使用边界

Fory 原生载荷不是 JDK `ObjectOutputStream` 载荷。应在明确区分格式的边界之后处理混合的旧版数据流，并使用 Fory 自定义序列化器实现新的高吞吐对象定制。
