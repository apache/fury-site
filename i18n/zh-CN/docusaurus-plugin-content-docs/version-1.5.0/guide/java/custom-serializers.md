---
title: 自定义序列化器
sidebar_position: 4
id: custom_serializers
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

本页介绍当前 Java 自定义序列化器 API。

## 构造函数输入

自定义序列化器不应该持有 `Fory`。

- 当序列化器只依赖不可变配置、并且可共享时，使用 `Config`。
- 当序列化器需要类型元信息、泛型或嵌套动态分派时，使用 `TypeResolver`。
- 如果序列化器持有 `TypeResolver`，它通常就不可共享，也不应实现 `Shareable`。

## 基础序列化器

运行时状态应通过 `WriteContext` 和 `ReadContext` 传递。只有在确实要做多次读写时，才把 buffer 提取到局部变量中。

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

如果序列化器可共享，就使用基于 `Config` 的构造方式注册：

```java
Fory fory = Fory.builder().build();
fory.registerSerializer(Foo.class, new FooSerializer(fory.getConfig()));
```

## 嵌套对象

如果序列化器需要写入或读取嵌套对象，请使用 context helper，而不要持有 `Fory`：

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

由于它不保留任何运行时局部可变状态，因此该序列化器可以实现 `Shareable`。

## 集合序列化器

对于 Java 集合，请继承 `CollectionSerializer` 或 `CollectionLikeSerializer`。

- `CollectionSerializer` 用于真正的 `Collection` 实现。
- `CollectionLikeSerializer` 用于形态像集合、但并未实现 `Collection` 的类型。
- 当集合可以使用标准元素代码生成路径时，保持 `supportCodegenHook == true`。
- 只有在你需要完全控制元素 IO 时，才把 `supportCodegenHook` 设为 `false`。

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
    writeContext.getBuffer().writeVarUint32Small7(value.size());
    return value;
  }

  @Override
  public T onCollectionRead(Collection collection) {
    return (T) collection;
  }

  @Override
  public Collection newCollection(ReadContext readContext) {
    MemoryBuffer buffer = readContext.getBuffer();
    int numElements = buffer.readVarUint32Small7();
    setNumElements(numElements);
    return new ArrayList(numElements);
  }
}
```

## Map 序列化器

对于 Java map，请继承 `MapSerializer` 或 `MapLikeSerializer`。

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
    writeContext.getBuffer().writeVarUint32Small7(value.size());
    return value;
  }

  @Override
  public T onMapRead(Map map) {
    return (T) map;
  }

  @Override
  public Map newMap(ReadContext readContext) {
    MemoryBuffer buffer = readContext.getBuffer();
    int numElements = buffer.readVarUint32Small7();
    setNumElements(numElements);
    return new LinkedHashMap(numElements);
  }
}
```

## 注册

```java
Fory fory = Fory.builder().build();

fory.registerSerializer(Foo.class, new FooSerializer(fory.getConfig()));
fory.registerSerializer(
    CustomMap.class, new CustomMapSerializer<>(fory.getTypeResolver(), CustomMap.class));
fory.registerSerializer(
    CustomCollection.class,
    new CustomCollectionSerializer<>(fory.getTypeResolver(), CustomCollection.class));
```

如果希望 Fory 按需懒加载地构造序列化器，可以注册工厂：

```java
fory.registerSerializer(
    CustomMap.class, resolver -> new CustomMapSerializer<>(resolver, CustomMap.class));
```

## 可共享性

当某个序列化器能够在等价运行时之间以及并发操作中安全复用时，就应实现 `Shareable` 标记接口。可共享序列化器不能保留操作状态、运行时局部可变状态，也不能在多次调用之间复用可变 scratch buffer。使用者可以通过 `serializer instanceof Shareable` 来判断其是否可共享。

在实践中：

- 只依赖 `Config` 的序列化器通常是可共享的。
- 基于 `TypeResolver` 的序列化器通常不可共享。
- 操作状态应放在 `WriteContext`、`ReadContext` 和 `CopyContext` 中，而不是放在序列化器字段里。
