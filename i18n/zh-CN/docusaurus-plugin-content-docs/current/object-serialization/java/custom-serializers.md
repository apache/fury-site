---
title: 自定义序列化器
sidebar_position: 9
id: custom-serializers
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

本页介绍当前的 Java 自定义序列化器 API。

## 构造器输入

自定义序列化器不应持有 `Fory`。

- 序列化器仅依赖不可变配置且可以共享时，使用 `Config`。
- 序列化器需要类型元数据、泛型或嵌套动态分派时，使用 `TypeResolver`。
- 如果序列化器持有 `TypeResolver`，通常不可共享，不应实现
  `Shareable`.

## 基础序列化器

使用 `WriteContext` 和 `ReadContext` 保存每次操作的状态。只有在执行多次读写时，才将缓冲区取到局部变量中。

```java
import org.apache.fory.config.Config;
import org.apache.fory.context.ReadContext;
import org.apache.fory.context.WriteContext;
import org.apache.fory.memory.MemoryBuffer;
import org.apache.fory.serializer.Serializer;
import org.apache.fory.serializer.Shareable;

public final class FooSerializer extends Serializer<Foo> implements Shareable {
  public FooSerializer(Config config) {
    super(config, Foo.class);
  }

  @Override
  public void write(WriteContext writeContext, Foo value) {
    writeContext.getBuffer().writeInt64(value.f1);
    writeContext.writeString(value.f2);
  }

  @Override
  public Foo read(ReadContext readContext) {
    MemoryBuffer buffer = readContext.getBuffer();
    Foo foo = new Foo();
    foo.f1 = buffer.readInt64();
    foo.f2 = readContext.readString(buffer);
    return foo;
  }
}
```

序列化器可共享时，使用基于 `Config` 的构造器注册：

```java
Fory fory = Fory.builder().withXlang(false).build();
fory.registerSerializer(Foo.class, new FooSerializer(fory.getConfig()));
```

## 嵌套对象

如果序列化器需要读写嵌套对象，请使用上下文辅助方法，而不是持有 `Fory`：

```java
import org.apache.fory.config.Config;
import org.apache.fory.context.ReadContext;
import org.apache.fory.context.WriteContext;
import org.apache.fory.serializer.Serializer;

public final class EnvelopeSerializer extends Serializer<Envelope> {
  public EnvelopeSerializer(Config config) {
    super(config, Envelope.class);
  }

  @Override
  public void write(WriteContext writeContext, Envelope value) {
    writeContext.writeRef(value.header);
    writeContext.writeRef(value.payload);
  }

  @Override
  public Envelope read(ReadContext readContext) {
    Envelope envelope = new Envelope();
    envelope.header = (Header) readContext.readRef();
    envelope.payload = readContext.readRef();
    return envelope;
  }
}
```

该序列化器没有持有 Fory 实例局部的可变状态，因此可以实现 `Shareable`。

## 集合序列化器

对于 Java 集合，请扩展 `CollectionSerializer` 或 `CollectionLikeSerializer`。

- 使用 `CollectionSerializer` 处理真正的 `Collection` 实现。
- 使用 `CollectionLikeSerializer` 处理不实现 `Collection` 但形态类似集合的类型。
- 集合可以使用标准元素代码生成路径时，保持 `supportCodegenHook == true`。
- 仅当需要完全控制元素 I/O 时，才设置 `supportCodegenHook == false`。

示例：

```java
import java.util.ArrayList;
import java.util.Collection;
import org.apache.fory.context.ReadContext;
import org.apache.fory.context.WriteContext;
import org.apache.fory.memory.MemoryBuffer;
import org.apache.fory.resolver.TypeResolver;
import org.apache.fory.serializer.collection.CollectionSerializer;

public final class CustomCollectionSerializer<T extends Collection<?>>
    extends CollectionSerializer<T> {
  public CustomCollectionSerializer(TypeResolver typeResolver, Class<T> type) {
    super(typeResolver, type, true);
  }

  @Override
  public Collection onCollectionWrite(WriteContext writeContext, T value) {
    writeContext.getBuffer().writeVarUInt32Small7(value.size());
    return value;
  }

  @Override
  public T onCollectionRead(Collection collection) {
    return (T) collection;
  }

  @Override
  public Collection newCollection(ReadContext readContext) {
    MemoryBuffer buffer = readContext.getBuffer();
    int numElements = buffer.readVarUInt32Small7();
    setNumElements(numElements);
    return new ArrayList(numElements);
  }
}
```

## 映射序列化器

对于 Java 映射，请扩展 `MapSerializer` 或 `MapLikeSerializer`。

```java
import java.util.LinkedHashMap;
import java.util.Map;
import org.apache.fory.memory.MemoryBuffer;
import org.apache.fory.context.ReadContext;
import org.apache.fory.context.WriteContext;
import org.apache.fory.resolver.TypeResolver;
import org.apache.fory.serializer.collection.MapSerializer;

public final class CustomMapSerializer<T extends Map<?, ?>> extends MapSerializer<T> {
  public CustomMapSerializer(TypeResolver typeResolver, Class<T> type) {
    super(typeResolver, type, true);
  }

  @Override
  public Map onMapWrite(WriteContext writeContext, T value) {
    writeContext.getBuffer().writeVarUInt32Small7(value.size());
    return value;
  }

  @Override
  public T onMapRead(Map map) {
    return (T) map;
  }

  @Override
  public Map newMap(ReadContext readContext) {
    MemoryBuffer buffer = readContext.getBuffer();
    int numElements = buffer.readVarUInt32Small7();
    setNumElements(numElements);
    return new LinkedHashMap(numElements);
  }
}
```

## 注册

```java
Fory fory = Fory.builder().withXlang(false).build();

fory.registerSerializer(Foo.class, new FooSerializer(fory.getConfig()));
fory.registerSerializer(
    CustomMap.class, new CustomMapSerializer<>(fory.getTypeResolver(), CustomMap.class));
fory.registerSerializer(
    CustomCollection.class,
    new CustomCollectionSerializer<>(fory.getTypeResolver(), CustomCollection.class));
```

如果希望 Fory 延迟构造序列化器，请注册工厂：

```java
fory.registerSerializer(
    CustomMap.class, resolver -> new CustomMapSerializer<>(resolver, CustomMap.class));
```

## 可共享性

如果序列化器可以在等价 Fory 实例和并发操作之间安全复用，请实现 `Shareable` 标记接口。可共享的序列化器不得持有操作状态、Fory 实例局部的可变状态，也不得持有跨调用共享的可变暂存缓冲区。使用者可通过 `serializer instanceof Shareable` 检查可共享性。

实践中：

- 仅使用 `Config` 的序列化器通常可以共享。
- 基于 `TypeResolver` 的序列化器通常不可共享。
- 操作状态应放在 `WriteContext`、`ReadContext` 和 `CopyContext` 中，而不是序列化器
  字段中。
