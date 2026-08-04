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

可使用 `ForyBuilder#withIntCompressed`/`ForyBuilder#withLongCompressed` 压缩 int/long 以减小体积。通常压缩 int 已经足够。

两个压缩选项均默认启用。如果序列化体积并不重要（例如此前使用不进行任何压缩的 FlatBuffers），则应禁用压缩。如果数据全部是数字，压缩可能导致 80% 的性能下降。

### Int 压缩

压缩 int 时，Fory 使用 1~5 字节编码。每个字节的第一位表示是否还有下一个字节；若该位已设置，则继续读取后续字节，直至遇到第一位未设置的字节。

### Long 压缩

Fory 支持两种 long 压缩编码：

#### SLI（将较小的 Long 作为 Int）编码（默认）

- 如果 long 位于 `[-1073741824, 1073741823]`，编码为 4 字节 int：`| little-endian: ((int) value) << 1 |`
- 否则写为 9 字节：`| 0b1 | little-endian 8bytes long |`

#### PVL（渐进式变长 Long）编码

- 每个字节的第一位表示是否还有下一个字节。若该位已设置，则继续读取后续字节，直至遇到第一位未设置的字节。
- 负数通过 `(v << 1) ^ (v >> 63)` 转换为正数，以降低较小负数的编码开销。

如果 `long` 类型的数字大多无法用更少字节表示，压缩效果不足以抵消性能开销。如果 long 压缩没有节省多少空间，可尝试将其禁用。

## 数组压缩

当原始类型数组（`int[]` 和 `long[]`）中的每个值都能由更窄的原始类型容纳时，Fory 可以压缩该数组。JDK 8 至 15 使用标量范围分析；在 JDK 16 及更高版本中，多版本 `fory-core` JAR 会自动选择 Vector API 实现。

### 数组压缩的工作方式

数组压缩会分析数组，判断其中的值能否使用更少字节存储：

- **`int[]` → `byte[]`**：所有值都在 [-128, 127] 范围内（体积减少 75%）
- **`int[]` → `short[]`**：所有值都在 [-32768, 32767] 范围内（体积减少 50%）
- **`long[]` → `int[]`**：所有值都在整数范围内（体积减少 50%）

### 配置与注册

要启用数组压缩，必须显式注册序列化器：

```java
Fory fory = Fory.builder()
  .withXlang(false)
  // Enable int array compression
  .withIntArrayCompressed(true)
  // Enable long array compression
  .withLongArrayCompressed(true)
  .build();

// You must explicitly register compressed array serializers
CompressedArraySerializers.registerSerializers(fory);
```

压缩数组序列化器包含在 `fory-core` 中。在 JDK 16 或更高版本上运行时，需要在启动应用时解析孵化阶段的 Vector API 模块：

```bash
java --add-modules=jdk.incubator.vector ...
```

在标量实现与 Vector 实现之间切换无需更改注册或配置。二者会作出相同的压缩决策，并使用相同的序列化格式。

## 字符串压缩

可通过 `ForyBuilder#withStringCompressed(true)` 启用字符串压缩。该功能默认禁用。

## 配置汇总

| 选项                | 说明                   | 默认值  |
| ------------------- | ---------------------- | ------- |
| `compressInt`       | 启用 int 压缩          | `true`  |
| `compressLong`      | 启用 long 压缩         | `true`  |
| `compressIntArray`  | 启用 int 数组宽度压缩  | `false` |
| `compressLongArray` | 启用 long 数组宽度压缩 | `false` |
| `compressString`    | 启用字符串压缩         | `false` |

## 性能注意事项

1. **为数字密集型数据禁用压缩**：如果数据主要由数字组成，压缩开销可能得不偿失
2. **数组压缩实现因 JDK 而异**：JDK 8 至 15 使用标量范围分析；JDK 16 及更高版本自动选择 Vector API 实现
3. **Long 压缩可能对大数值无益**：如果大多数 long 无法用更小的表示形式容纳，请禁用该选项
4. **字符串压缩存在开销**：仅在字符串高度可压缩时启用

## 配置示例

```java
// For mostly numeric data - disable compression
Fory fory = Fory.builder()
  .withXlang(false)
  .withIntCompressed(false)
  .withLongCompressed(false)
  .build();

// For mixed data with arrays - enable array compression
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
- [高级功能](advanced-features.md) - 内存管理
