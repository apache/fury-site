---
title: Compact Row
sidebar_position: 2
id: compact
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

Compact Row 是仅支持 Java 的 Row 编码，可减少固定槽位和 null bitmap 开销。它与 Standard Row
的编码格式不兼容。

## 创建 Compact Encoder

```java
RowEncoder<MyBean> encoder =
    Encoders.buildBeanCodec(MyBean.class)
        .compactEncoding()
        .build()
        .get();

BinaryRow row = encoder.toRow(value);
MyBean decoded = encoder.fromRow(row);
```

在单个线程中复用 encoder。并发线程应分别创建 encoder。

## 布局权衡

- 固定大小字段使用自然宽度，而不是 Standard Row 的八字节槽位。
- 字段按对齐要求排序，以减少 padding。
- 没有可空字段时省略 null bitmap。
- 固定大小的嵌套 struct 可以内联存储。

仅当所有 reader 都使用 Java，且节省的空间足以抵消 Java 特有布局的限制时，才应选择 Compact Row。
Java/Python/C++/Rust 互操作请使用 [Standard Row](standard.md)。

精确二进制布局请参阅 [Row Format 规范](../specification/row_format_spec.md)。
