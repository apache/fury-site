---
title: 压缩
sidebar_position: 10
id: compression
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

本页介绍用于减小序列化数据体积的压缩选项。

## 整数压缩

可使用 `ForyBuilder#withIntCompressed` / `ForyBuilder#withLongCompressed` 对 int / long 进行压缩以减小体积。通常压缩 int 就足够了。

这两个压缩选项默认都已启用。如果序列化体积并不重要，例如你之前使用的是不会做压缩的 FlatBuffers，那么应考虑关闭压缩。如果你的数据几乎全是数字，压缩可能带来 80% 的性能回退。

### Int 压缩

对于 int 压缩，Fory 使用 1 到 5 个字节进行编码。每个字节的第一位表示后面是否还有下一个字节。如果第一位被置位，就继续读取下一个字节，直到某个字节的第一位未置位为止。

### Long 压缩

对于 long 压缩，Fory 支持两种编码方式：

#### SLI（Small Long as Int）编码，默认

- 如果 long 落在 `[-1073741824, 1073741823]` 范围内，则按 4 字节 int 编码：`| little-endian: ((int) value) << 1 |`
- 否则写成 9 字节：`| 0b1 | little-endian 8bytes long |`

#### PVL（Progressive Variable-length Long）编码

- 每个字节的第一位表示后面是否还有下一个字节。如果第一位被置位，就继续读取下一个字节，直到某个字节的第一位未置位为止。
- 负数会通过 `(v << 1) ^ (v >> 63)` 转换为正数，以降低小负数的编码成本。

如果一个数字虽然是 `long` 类型，但多数情况下并不能用更小字节数表示，那么压缩效果就不会理想，不值得承担对应的性能成本。如果你发现它没有带来明显的空间收益，可以考虑关闭 long 压缩。

## 数组压缩

当原始数组（`int[]` 和 `long[]`）中的每个值都能放入范围更窄的基本类型时，Fory 可以压缩这些数组。JDK 8 至 15 使用标量范围分析；在 JDK 16 及更高版本上，多版本 `fory-core` JAR 会自动选择 Vector API 实现。

### 数组压缩如何工作

数组压缩会分析数组，判断这些值是否可以用更少字节存储：

- **`int[]` → `byte[]`**：当所有值都落在 [-128, 127] 范围内时，体积减少 75%
- **`int[]` → `short[]`**：当所有值都落在 [-32768, 32767] 范围内时，体积减少 50%
- **`long[]` → `int[]`**：当所有值都可落入 int 范围时，体积减少 50%

### 配置与注册

要启用数组压缩，你必须显式注册对应的序列化器：

```java
Fory fory = Fory.builder()
  .withXlang(false)
  // 启用 int 数组压缩
  .withIntArrayCompressed(true)
  // 启用 long 数组压缩
  .withLongArrayCompressed(true)
  .build();

// 你必须显式注册压缩数组序列化器
CompressedArraySerializers.registerSerializers(fory);
```

压缩数组序列化器已包含在 `fory-core` 中。在 JDK 16 或更高版本上运行时，请在启动应用时解析孵化阶段的 Vector API 模块：

```bash
java --add-modules=jdk.incubator.vector ...
```

在标量实现与 Vector 实现之间切换不需要更改注册或配置。两者采用相同的压缩判断，并使用相同的序列化格式。

## 字符串压缩

字符串压缩可通过 `ForyBuilder#withStringCompressed(true)` 启用。该选项默认关闭。

## 配置摘要

| 选项                | 描述                      | 默认值  |
| ------------------- | ------------------------- | ------- |
| `compressInt`       | 启用 int 压缩             | `true`  |
| `compressLong`      | 启用 long 压缩            | `true`  |
| `compressIntArray`  | 启用 int 数组宽度压缩     | `false` |
| `compressLongArray` | 启用 long 数组宽度压缩    | `false` |
| `compressString`    | 启用字符串压缩            | `false` |

## 性能注意事项

1. **数字密集型数据建议关闭压缩**：如果你的数据大多是数字，压缩开销可能并不划算。
2. **数组压缩实现取决于 JDK**：JDK 8 至 15 使用标量范围分析；JDK 16 及更高版本会自动选择 Vector API 实现。
3. **Long 压缩未必适合大数值**：如果多数 long 无法放进更小表示，请关闭它。
4. **字符串压缩存在开销**：仅在字符串高度可压缩时启用。

## 示例配置

```java
// 主要是数字的数据：关闭压缩
Fory fory = Fory.builder()
  .withXlang(false)
  .withIntCompressed(false)
  .withLongCompressed(false)
  .build();

// 包含数组的混合数据：启用数组压缩
Fory fory = Fory.builder()
  .withXlang(false)
  .withIntCompressed(true)
  .withLongCompressed(true)
  .withIntArrayCompressed(true)
  .withLongArrayCompressed(true)
  .build();
CompressedArraySerializers.registerSerializers(fory);
```

## 相关主题

- [配置](configuration.md) - 所有 ForyBuilder 选项
- [高级特性](advanced-features.md) - 内存管理
