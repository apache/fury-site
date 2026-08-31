---
title: 配置
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

本页介绍 `ForyBuilder` 提供的全部配置选项。

## ForyBuilder 选项

| 选项名称 | 说明 | 默认值 |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `timeRefIgnored` | 启用引用跟踪时，是否忽略 `TimeSerializers` 注册的所有时间类型及其子类的引用跟踪。若已忽略，可调用 `Fory#registerSerializer(Class, Serializer)` 为各时间类型启用引用跟踪，例如 `fory.registerSerializer(Date.class, new DateSerializer(fory.getConfig(), true))`。请注意，应在对包含时间字段的类型进行序列化器代码生成前启用引用跟踪，否则这些字段仍会跳过引用跟踪。 | `true` |
| `compressInt` | 启用或禁用 int 压缩，以减小体积。 | `true` |
| `compressLong` | 启用或禁用 long 压缩，以减小体积。 | `true` |
| `compressIntArray` | 值较小时启用或禁用 int 数组压缩。显式注册 `CompressedArraySerializers` 后，JDK 8 至 15 使用标量宽度分析；JDK 16 及更高版本在解析 `jdk.incubator.vector` 时自动选择 Vector API 实现。 | `false` |
| `compressLongArray` | 值较小时启用或禁用 long 数组压缩。显式注册 `CompressedArraySerializers` 后，JDK 8 至 15 使用标量宽度分析；JDK 16 及更高版本在解析 `jdk.incubator.vector` 时自动选择 Vector API 实现。 | `false` |
| `compressString` | 启用或禁用字符串压缩，以减小体积。 | `false` |
| `classLoader` | 每个 `Fory` 实例的类加载器固定不变，因为 Fory 会缓存类元数据。要使用不同的加载器，请创建配置了该加载器的新 `Fory` 或 `ThreadSafeFory`，或在首次解析类之前使用线程上下文类加载器。 | `Thread.currentThread().getContextClassLoader()` |
| `compatible` | Schema 演进模式。`true`：读取端可以容忍兼容的字段新增、删除和重排。`false`：仅当每个读取端和写入端始终使用相同的类 Schema，并希望获得更快速度和更小体积时使用。未设置时，跨语言模式和原生模式都启用兼容模式。[了解更多](schema-evolution.md)。 | `true` |
| `checkClassVersion` | 为明确使用相同 Schema 的载荷检查类版本哈希。兼容模式携带用于演进的 Schema 元数据，因此启用兼容模式时 Fory 会禁用该检查。 | `false` |
| `checkJdkClassSerializable` | 启用或禁用对 `Serializable` 接口的检查，检查对象为 `java.*` 下的类。如果 `java.*` 下的类没有实现 `Serializable`，Fory 会抛出 `UnsupportedOperationException`。 | `true` |
| `registerGuavaTypes` | 是否预注册 `RegularImmutableMap`/`RegularImmutableList` 等 Guava 类型。这些类型不是公共 API，但看起来相当稳定。 | `true` |
| `requireClassRegistration` | 禁用后可能允许反序列化未知类，从而带来安全风险。 | `true` |
| `maxDepth` | 设置反序列化最大深度；超过该深度时抛出异常，可用于抵御反序列化 DDoS 攻击。 | `50` |
| `maxGraphMemoryBytes` | 单次根反序列化的近似对象图内存门限，主要覆盖实例化的集合、映射、数组、结构体和对象；叶子值由剩余输入字节约束。 | `134217728` |
| `maxUnbackedContainerItems` | 单次根反序列化中，重复读取正文没有相应输入进度支撑的集合元素和映射条目的最大数量。零表示严格限制。 | `8192` |
| `maxTypeFields` | 单个远程结构体元数据正文可接受的最大字段数。 | `512` |
| `maxTypeMetaBytes` | 单个 TypeDef 或 TypeMeta 正文可接受的最大编码字节数，不含 8 字节头部和扩展长度 varint。 | `4096` |
| `maxSchemaVersionsPerType` | 每个逻辑类型可接受的远程元数据版本上限。 | `10` |
| `maxAverageSchemaVersionsPerType` | 所有已接受远程类型的平均远程元数据版本数。有效的全局下限为 `8192` 个元数据条目。 | `3` |
| `suppressClassRegistrationWarnings` | 是否抑制类注册警告。这些警告可用于安全审计，但也可能造成干扰，因此默认启用抑制。 | `true` |
| `metaShareEnabled` | 启用或禁用元数据共享模式。 | 兼容模式启用时为 `true`，否则为 false。 |
| `scopedMetaShareEnabled` | 作用域元数据共享聚焦于单次序列化过程。该过程中创建或识别的元数据仅归其所有，不与其他序列化共享。 | 兼容模式启用时为 `true`，否则为 false。 |
| `metaCompressor` | 为 Schema 元数据设置线程安全的压缩器。用于反序列化的自定义压缩器必须实现下文所述的有界解压。 | `DeflaterMetaCompressor` |
| `deserializeUnknownClass` | 启用或禁用对不存在或未知类的数据进行反序列化或跳过。 | 兼容模式启用时为 `true`，否则为 false。 |
| `codeGenEnabled` | 禁用后首次序列化可能更快，但后续序列化会更慢。未设置时，代码生成在普通 JVM 上默认启用，在 Android 和 GraalVM 原生镜像上默认禁用。Android 或 GraalVM 原生镜像接受显式 `withCodegen(true)`，但最终构建配置会强制使用解释器序列化器并发出警告。如果存在构建时 `@ForyStruct` 静态序列化器，普通 JVM 的 `withCodegen(false)` 和 Android 会使用它替代解释器对象序列化器。 | 普通 JVM 上为 `true`；Android 和 GraalVM 原生镜像上为 `false` |
| `asyncCompilationEnabled` | 启用后，序列化先使用解释器模式，并在类的异步序列化器 JIT 完成后切换到 JIT 序列化。Android 和 GraalVM 原生镜像不支持运行时代码生成，因此会强制关闭此选项。 | `false` |
| `copyRef` | 禁用后复制性能更好，但 Fory 深拷贝会忽略循环引用和共享引用。单次 `Fory#copy` 中，对象图里的同一引用会被复制为不同对象。 | `false` |
| `serializeEnumByName` | 启用后，Fory 序列化枚举名称而非数字枚举 tag。未启用时，Fory 默认写入声明序号；如果枚举配置了 `@ForyEnumId`，则写入显式稳定 ID。 | `false` |

### 自定义元数据压缩器 {#custom-metadata-compressors}

向 `withMetaCompressor` 传入自定义 `MetaCompressor` 时，必须保证线程安全并实现 `decompress(byte[], int, int, int maxOutputSize)`。实现必须在分配输出前拒绝超过 `maxOutputSize` 的输出，或在解压过程中逐步执行该限制。

## 配置示例

```java
Fory fory = Fory.builder()
  .withXlang(false)
  // enable reference tracking for shared/circular reference.
  // Disable it will have better performance if no duplicate reference.
  .withRefTracking(false)
  // compress int for smaller size
  .withIntCompressed(true)
  // compress long for smaller size
  .withLongCompressed(true)
  // Optional: use `compatible=false` only when
  // every reader and writer always uses the same class schema.
  // .withCompatible(false)
  // enable async multi-threaded compilation.
  .withAsyncCompilation(true)
  .build();
```

## 兼容模式

跨语言模式和原生模式都默认启用兼容模式。当类可能独立演进、服务分别部署，或不同语言手写跨语言 Schema 时，请保留该默认设置。

仅当每个载荷的反序列化类 Schema 始终与序列化类 Schema 相同，并且希望获得更快速度和更小体积时，才使用 `withCompatible(false)`。对于跨语言载荷，只有在确认所有语言使用相同 Schema，或原生类型由 Fory Schema IDL 生成时，才调用 `withCompatible(false)`。

## 安全

有关信任边界、安全的读取端配置和验证方法，请参阅 [Java 安全](security.md)。

## 相关主题

- [Schema 元数据](schema-metadata.md) - `@ForyField`、`@Ignore`、整数编码注解、`serializeEnumByName` 和 `@ForyEnumId`
- [Schema 演进](schema-evolution.md) - 兼容模式和元数据共享
- [压缩](compression.md) - int、long 和数组压缩详情
- [类型注册](type-registration.md) - 类注册选项
- [静态生成的序列化器](static-generated-serializers.md) - 注解处理器为 `@ForyStruct`、`codegen=false` 和 Android 生成的静态序列化器
