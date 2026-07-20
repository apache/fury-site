---
title: 故障排查
sidebar_position: 14
id: troubleshooting
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

本页介绍常见问题及其解决方案。

## 类不一致与类版本检查

如果你创建 Fory 时没有将 `CompatibleMode` 设为 `org.apache.fory.config.CompatibleMode.COMPATIBLE`，并且遇到奇怪的序列化错误，那么原因可能是序列化端和反序列化端之间的类不一致。

在这种情况下，你可以调用 `ForyBuilder#withClassVersionCheck` 来创建 Fory 进行校验。如果反序列化抛出 `org.apache.fory.exception.ClassNotCompatibleException`，就说明类不一致，此时应改为使用 `ForyBuilder#withCompatibleMode(CompatibleMode.COMPATIBLE)` 创建 Fory。

```java
// 启用类版本检查以诊断问题
Fory fory = Fory.builder()
  .withLanguage(Language.JAVA)
  .withClassVersionCheck(true)
  .build();

// 如果抛出 ClassNotCompatibleException，则改用兼容模式
Fory fory = Fory.builder()
  .withLanguage(Language.JAVA)
  .withCompatibleMode(CompatibleMode.COMPATIBLE)
  .build();
```

**注意**：`CompatibleMode.COMPATIBLE` 会带来更多的性能和空间开销。如果序列化端和反序列化端的类始终一致，就不要默认开启它。

## 使用了错误的反序列化 API

请将 `serialize` 与某个 `deserialize` 重载搭配使用：

| 序列化 API        | 反序列化 API      |
| ----------------- | ----------------- |
| `Fory#serialize`  | `Fory#deserialize` |

**错误示例：**

```java
// ❌ 错误：使用不兼容的目标类型做反序列化
byte[] bytes = fory.serialize(struct1);
Struct2 result = fory.deserialize(bytes, Struct2.class);  // 可能抛出 ClassCastException
```

**正确示例：**

```java
byte[] bytes = fory.serialize(object);
Object result = fory.deserialize(bytes);

byte[] typedBytes = fory.serialize(object);
MyClass typedResult = fory.deserialize(typedBytes, MyClass.class);
```

## 将 POJO 反序列化为另一种类型

如果你想序列化一个 POJO，然后把它反序列化为另一种 POJO 类型，就必须使用 `CompatibleMode.COMPATIBLE`：

```java
public class DeserializeIntoType {
  static class Struct1 {
    int f1;
    String f2;

    public Struct1(int f1, String f2) {
      this.f1 = f1;
      this.f2 = f2;
    }
  }

  static class Struct2 {
    int f1;
    String f2;
    double f3;
  }

  static ThreadSafeFory fory = Fory.builder()
    .withCompatibleMode(CompatibleMode.COMPATIBLE).buildThreadSafeFory();

  public static void main(String[] args) {
    Struct1 struct1 = new Struct1(10, "abc");
    byte[] data = fory.serialize(struct1);
    Struct2 struct2 = fory.deserialize(data, Struct2.class);
  }
}
```

## 常见错误消息

### `"Class not registered"`

**原因**：启用了类注册要求，但该类没有注册。

**解决方案**：在序列化前注册该类：

```java
fory.register(MyClass.class);
// 或使用显式 ID
fory.register(MyClass.class, 100);
```

### `"ClassNotCompatibleException"`

**原因**：序列化端和反序列化端之间的类 schema 不一致。

**解决方案**：使用兼容模式：

```java
Fory fory = Fory.builder()
  .withCompatibleMode(CompatibleMode.COMPATIBLE)
  .build();
```

### `"Max depth exceeded"`

**原因**：对象图过深，可能意味着循环引用攻击。

**解决方案**：如果数据本身合法，就提高最大深度；否则检查是否存在恶意数据：

```java
Fory fory = Fory.builder()
  .withMaxDepth(100)  // 相比默认值 50 提高上限
  .build();
```

### `"Serializer not found"`

**原因**：该类型没有注册对应的序列化器。

**解决方案**：注册自定义序列化器：

```java
fory.registerSerializer(MyClass.class, new MyClassSerializer(fory.getTypeResolver()));
```

## 性能问题

### 首次序列化较慢

**原因**：第一次序列化时发生了 JIT 编译。

**解决方案**：启用异步编译：

```java
Fory fory = Fory.builder()
  .withAsyncCompilation(true)
  .build();
```

### 内存使用过高

**原因**：对象图较大，或引用跟踪带来额外开销。

**解决方案**：

- 如果不需要，关闭引用跟踪：`.withRefTracking(false)`
- 使用自定义内存分配器做池化
- 对大数据集考虑使用行格式

### 序列化结果偏大

**原因**：元数据开销过大，或数据未压缩。

**解决方案**：

- 启用压缩：`.withIntCompressed(true)`、`.withLongCompressed(true)`
- 只在真正需要时使用兼容模式
- 注册类以避免写入类名

## 调试技巧

1. **启用类版本检查** 来诊断 Schema 问题。
2. **检查 API 是否正确配对**，确保 serialize/deserialize 组合正确。
3. **核对注册顺序**，两端必须保持一致。
4. **启用日志** 观察内部行为：

```java
LoggerFactory.setLogLevel(LogLevel.DEBUG_LEVEL);
```

## 相关主题

- [配置](configuration.md) - 所有 ForyBuilder 选项
- [Schema 演进](schema-evolution.md) - 兼容模式详情
- [类型注册](type-registration.md) - 注册最佳实践
- [迁移指南](troubleshooting.md) - 升级 Fory 版本
