---
title: 基础序列化
sidebar_position: 2
id: basic_serialization
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

本页介绍基本的序列化模式和 Fory 实例创建。

## 创建 Fory 实例

### 单线程 Fory

对于单线程应用程序：

```java
Fory fory = Fory.builder()
  .withLanguage(Language.JAVA)
  // 启用引用跟踪以支持共享/循环引用。
  // 如果没有重复引用，禁用它会有更好的性能。
  .withRefTracking(false)
  .withCompatibleMode(CompatibleMode.SCHEMA_CONSISTENT)
  // 启用类型前向/后向兼容性
  // 禁用它以获得更小的大小和更好的性能。
  // .withCompatibleMode(CompatibleMode.COMPATIBLE)
  // 启用异步多线程编译。
  .withAsyncCompilation(true)
  .build();
byte[] bytes = fory.serialize(object);
System.out.println(fory.deserialize(bytes));
```

### 线程安全 Fory

对于多线程应用程序：

```java
ThreadSafeFory fory = Fory.builder()
  .withLanguage(Language.JAVA)
  // 启用引用跟踪以支持共享/循环引用。
  // 如果没有重复引用，禁用它会有更好的性能。
  .withRefTracking(false)
  // 压缩 int 以获得更小的大小
  // .withIntCompressed(true)
  // 压缩 long 以获得更小的大小
  // .withLongCompressed(true)
  .withCompatibleMode(CompatibleMode.SCHEMA_CONSISTENT)
  // 启用类型前向/后向兼容性
  // 禁用它以获得更小的大小和更好的性能。
  // .withCompatibleMode(CompatibleMode.COMPATIBLE)
  // 启用异步多线程编译。
  .withAsyncCompilation(true)
  .buildThreadSafeFory();
byte[] bytes = fory.serialize(object);
System.out.println(fory.deserialize(bytes));
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

## 序列化 API

### 基本序列化/反序列化

```java
// 将对象序列化为字节数组
byte[] bytes = fory.serialize(object);

// 将字节数组反序列化为对象
Object obj = fory.deserialize(bytes);
```

### 带类型的序列化/反序列化

```java
// 使用显式类型序列化
byte[] bytes = fory.serializeJavaObject(object);

// 使用预期类型反序列化
MyClass obj = fory.deserializeJavaObject(bytes, MyClass.class);
```

### 带类型信息的序列化/反序列化

```java
// 带类型信息序列化
byte[] bytes = fory.serializeJavaObjectAndClass(object);

// 使用嵌入的类型信息反序列化
Object obj = fory.deserializeJavaObjectAndClass(bytes);
```

## 最佳实践

1. **复用 Fory 实例**：创建 Fory 成本很高，始终复用实例
2. **使用适当的线程安全性**：根据需要在单线程和线程安全之间选择
3. **注册类**：注册常用类以获得更好的性能
4. **配置引用跟踪**：如果没有循环/共享引用，请禁用它

## 相关主题

- [配置选项](configuration.md) - 所有 ForyBuilder 选项
- [类型注册](type-registration.md) - 类注册
- [故障排除](troubleshooting.md) - 常见 API 使用问题
