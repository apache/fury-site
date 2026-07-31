---
title: 配置选项
sidebar_position: 4
id: configuration
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

本页记录通过 `ForyBuilder` 提供的全部配置选项。

## ForyBuilder 选项

| 选项名称                            | 描述                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | 默认值                                                        |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `timeRefIgnored`                    | 启用引用跟踪时，是否忽略 `TimeSerializers` 中注册的所有时间类型及其子类的引用跟踪。如果忽略，可通过调用 `Fory#registerSerializer(Class, Serializer)` 为某个时间类型启用引用跟踪，例如 `fory.registerSerializer(Date.class, new DateSerializer(fory.getConfig(), true))`。注意，必须在为任何包含时间字段的类型生成序列化器代码之前启用引用跟踪，否则这些字段仍会跳过引用跟踪。                                                                                                                            | `true`                                                        |
| `compressInt`                       | 启用或禁用 int 压缩以减小体积。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | `true`                                                        |
| `compressLong`                      | 启用或禁用 long 压缩以减小体积。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | `true`                                                        |
| `compressIntArray`                  | 当数值较小时，启用或禁用 int 数组压缩。显式注册 `CompressedArraySerializers` 后，JDK 8 至 15 使用标量宽度分析；JDK 16 及更高版本会在解析 `jdk.incubator.vector` 后自动选择 Vector API 实现。                                                                                                                                                                                                                                                                                                                                 | `false`                                                       |
| `compressLongArray`                 | 当数值较小时，启用或禁用 long 数组压缩。显式注册 `CompressedArraySerializers` 后，JDK 8 至 15 使用标量宽度分析；JDK 16 及更高版本会在解析 `jdk.incubator.vector` 后自动选择 Vector API 实现。                                                                                                                                                                                                                                                                                                                                | `false`                                                       |
| `compressString`                    | 启用或禁用字符串压缩以减小体积。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | `false`                                                       |
| `classLoader`                       | 因为 Fory 会缓存类元数据，每个 `Fory` 实例的类加载器是固定的。若要使用其他类加载器，请创建配置了该类加载器的新 `Fory` 或 `ThreadSafeFory`；也可以在首次解析类之前使用线程上下文类加载器。                                                                                                                                                                                                                                                                                                                                      | `Thread.currentThread().getContextClassLoader()`              |
| `compatible`                        | Schema 演进模式。`true`：读取端可以容忍兼容的字段新增、删除和重新排序。`false`：仅当所有读取端和写入端始终使用相同的类 Schema，并且需要更高序列化性能和更小体积时使用。未设置时，xlang 和原生模式都会启用兼容模式。[查看更多](schema-evolution.md)。                                                                                                                                                                                                                                                                             | `true`                                                        |
| `checkClassVersion`                 | 对有意使用相同 Schema 的载荷检查类版本哈希。启用兼容模式时，Fory 会关闭此检查，因为兼容模式会携带用于演进的 Schema 元数据。                                                                                                                                                                                                                                                                                                                                                                                               | `false`                                                       |
| `checkJdkClassSerializable`         | 启用或禁用对 `java.*` 下类型的 `Serializable` 接口检查。如果某个 `java.*` 下的类未实现 `Serializable`，Fory 会抛出 `UnsupportedOperationException`。                                                                                                                                                                                                                                                                                                                                                                                | `true`                                                        |
| `registerGuavaTypes`                | 是否预注册 `RegularImmutableMap` / `RegularImmutableList` 等 Guava 类型。这些类型不是公共 API，但看起来相当稳定。                                                                                                                                                                                                                                                                                                                                                                                                       | `true`                                                        |
| `requireClassRegistration`          | 禁用后可能允许反序列化未知类，从而带来安全风险。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | `true`                                                        |
| `maxDepth`                          | 设置反序列化最大深度，超过该深度时抛出异常。可用于抵御反序列化拒绝服务攻击。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `50`                                                          |
| `maxGraphMemoryBytes`               | 一次根对象反序列化的近似对象图内存限制。它主要覆盖物化后的集合、映射、数组、struct 和对象；叶子值由剩余输入字节数限制。                                                                                                                                                                                                                                                                                                                                                                                                      | `134217728`                                                   |
| `maxTypeFields`                     | 一个收到的远端 struct 元数据正文中可接受的最大字段数。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | `512`                                                         |
| `maxTypeMetaBytes`                  | 一个收到的 TypeDef 或 TypeMeta 正文可接受的最大编码字节数，不含 8 字节头部以及可能存在的扩展长度 varint。                                                                                                                                                                                                                                                                                                                                                                                                                                                     | `4096`                                                        |
| `maxSchemaVersionsPerType`          | 一个逻辑类型可接受的最大远端元数据版本数。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | `10`                                                          |
| `maxAverageSchemaVersionsPerType`   | 所有已接受远端类型的平均元数据版本数上限；有效的全局下限为 `8192` 个元数据条目。                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | `3`                                                           |
| `suppressClassRegistrationWarnings` | 是否抑制类注册警告。这些警告可用于安全审计，但也可能造成干扰，因此默认启用抑制。                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | `true`                                                        |
| `metaShareEnabled`                  | 启用或禁用元数据共享模式。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | 启用兼容模式时为 `true`，否则为 `false`。                     |
| `scopedMetaShareEnabled`            | 作用域元数据共享只关注单次序列化过程。在该过程中创建或识别的元数据仅归属于本次序列化，不与其他序列化过程共享。                                                                                                                                                                                                                                                                                                                                                                                                                                               | 启用兼容模式时为 `true`，否则为 `false`。                     |
| `metaCompressor`                    | 设置元数据压缩器。传入的 `MetaCompressor` 必须线程安全。默认使用基于 `Deflater` 的 `DeflaterMetaCompressor`；也可以传入 `zstd` 等其他压缩器以获得更高压缩率。                                                                                                                                                                                                                                                                                                                                                                                              | `DeflaterMetaCompressor`                                      |
| `deserializeUnknownClass`           | 启用或禁用对不存在或未知类数据的反序列化或跳过。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | 启用兼容模式时为 `true`，否则为 `false`。                     |
| `codeGenEnabled`                    | 禁用后可能加快首次序列化，但会减慢后续序列化。未显式设置时，普通 JVM 默认启用代码生成，Android 和 GraalVM native image 默认禁用。Android 或 GraalVM native image 接受显式的 `withCodegen(true)`，但最终构建配置仍会强制使用解释执行序列化器并发出警告。如果存在构建期生成的 `@ForyStruct` 静态序列化器，普通 JVM 上的 `withCodegen(false)` 和 Android 会使用它，而不是解释执行对象序列化器。                                                                                                       | 普通 JVM 上为 `true`；Android 和 GraalVM native image 上为 `false` |
| `asyncCompilationEnabled`           | 启用后，序列化会先使用解释执行模式，并在某个类的异步序列化器 JIT 完成后切换到 JIT 序列化。Android 和 GraalVM native image 不支持运行时代码生成，因此该选项会被强制关闭。                                                                                                                                                                                                                                                                                                                                                                                        | `false`                                                       |
| `copyRef`                           | 禁用后复制性能更好，但 Fory 深拷贝会忽略循环引用和共享引用。对象图中的同一引用会在一次 `Fory#copy` 中被复制为不同对象。                                                                                                                                                                                                                                                                                                                                                                                                                                       | `false`                                                       |
| `serializeEnumByName`               | 启用后，Fory 会序列化枚举名称而不是数字枚举 tag。未启用时，Fory 默认写入声明顺序对应的 ordinal；如果枚举配置了 `@ForyEnumId`，则写入显式的稳定 ID。                                                                                                                                                                                                                                                                                                                                                                                                            | `false`                                                       |

## 示例配置

```java
Fory fory = Fory.builder()
  .withXlang(false)
  // 为共享引用和循环引用启用引用跟踪。
  // 如果没有重复引用，禁用它可获得更好性能。
  .withRefTracking(false)
  // 压缩 int 以减小体积
  .withIntCompressed(true)
  // 压缩 long 以减小体积
  .withLongCompressed(true)
  // 可选：仅当每个读取端和写入端始终使用相同的类 Schema 时，
  // 才使用 `compatible=false`。
  // .withCompatible(false)
  // 启用异步多线程编译
  .withAsyncCompilation(true)
  .build();
```

## 兼容模式

xlang 与原生模式默认都启用兼容模式。当类可能独立演进、服务独立部署，或不同语言手写 xlang Schema 时，请保留此默认设置。

只有在反序列化每个载荷时使用的类 Schema 始终与序列化时使用的类 Schema 相同，并且需要更高序列化性能和更小体积时，才使用 `withCompatible(false)`。对于 xlang 载荷，只有在确认每种语言都使用相同 Schema，或者原生类型由 Fory Schema IDL 生成后，才调用 `withCompatible(false)`。

## 安全

在生产环境和处理任何不受信任的载荷来源时，请保持类注册启用：

```java
Fory fory = Fory.builder()
    .requireClassRegistration(true)
    .withMaxDepth(50)
    .withMaxGraphMemoryBytes(128L * 1024 * 1024)
    .build();
```

安全相关选项：

- `requireClassRegistration(true)` 将反序列化限制为已注册类。
- `withMaxDepth(...)` 拒绝异常深的对象图。
- `withMaxGraphMemoryBytes(...)` 为一次根对象反序列化期间物化的对象图设置近似内存限制。估算主要覆盖集合、映射、数组、struct 和对象，不包括字符串、二进制数据、基本类型标量和密集基本类型数组等叶子值。实际进程内存可能高于此限制。叶子值仍受可用字节检查保护：如果未读取的输入中没有足够字节，Fory 就不会读取或创建该叶子值。默认值固定为 `128 MiB`；可信工作负载需要更大或更小限制时，可设置一个正数形式的字节上限。
- `withMaxTypeFields(...)` 和 `withMaxTypeMetaBytes(...)` 约束一个收到的远端元数据正文的字段数和编码正文大小。
- `withMaxSchemaVersionsPerType(...)` 和 `withMaxAverageSchemaVersionsPerType(...)` 约束可接受的远端元数据版本数，但不改变注册、动态加载或 Schema 演进语义。
- `withDeserializeUnknownClass(false)` 避免从元数据物化未知类。
- `checkJdkClassSerializable(true)` 保持对 `java.*` 类的 JDK 可序列化性检查。
- 类注册警告可用于安全审计；需要显示意外类型时，请使用 `suppressClassRegistrationWarnings(false)`。

只有处理可信载荷时才能使用 `requireClassRegistration(false)`；需要动态加载类时，还应搭配 `TypeChecker` 允许列表。

## 相关主题

- [Schema 元数据](schema-metadata.md) - `@ForyField`、`@Ignore`、整数编码注解、`serializeEnumByName` 和 `@ForyEnumId`
- [Schema 演进](schema-evolution.md) - 兼容模式与元数据共享
- [压缩](compression.md) - Int、long 和数组压缩详情
- [类型注册](type-registration.md) - 类注册选项
- [静态生成序列化器](static-generated-serializers.md) - 面向 `@ForyStruct`、`codegen=false` 和 Android 的注解处理器静态生成序列化器
