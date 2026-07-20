---
title: 行格式
sidebar_position: 9
id: row_format
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

Apache Fory™ 提供高性能的**行格式**以实现零拷贝反序列化。

## 概述

与在内存中重构完整对象的传统对象序列化不同，行格式支持直接从二进制数据**随机访问**字段，无需完整反序列化。

**主要优势：**

- **零拷贝访问**：无需分配或复制数据即可读取字段
- **部分反序列化**：仅访问所需的字段
- **内存映射文件**：处理大于 RAM 的数据
- **缓存友好**：顺序内存布局以提高 CPU 缓存利用率
- **延迟计算**：将昂贵的操作延迟到字段访问时

## 何时使用行格式

- 具有选择性字段访问的分析工作负载
- 仅需要字段子集的大型数据集
- 内存受限环境
- 高吞吐量数据管道
- 从内存映射文件或共享内存读取

## 基础用法

```rust
use fory::{to_row, from_row};
use fory::ForyRow;
use std::collections::BTreeMap;

#[derive(ForyRow)]
struct UserProfile {
    id: i64,
    username: String,
    email: String,
    scores: Vec<i32>,
    preferences: BTreeMap<String, String>,
    is_active: bool,
}

let profile = UserProfile {
    id: 12345,
    username: "alice".to_string(),
    email: "alice@example.com".to_string(),
    scores: vec![95, 87, 92, 88],
    preferences: BTreeMap::from([
        ("theme".to_string(), "dark".to_string()),
        ("language".to_string(), "en".to_string()),
    ]),
    is_active: true,
};

// 序列化为行格式
let row_data = to_row(&profile);

// 零拷贝反序列化 - 无对象分配！
let row = from_row::<UserProfile>(&row_data);

// 直接从二进制数据访问字段
assert_eq!(row.id(), 12345);
assert_eq!(row.username(), "alice");
assert_eq!(row.email(), "alice@example.com");
assert_eq!(row.is_active(), true);

// 高效访问集合
let scores = row.scores();
assert_eq!(scores.size(), 4);
assert_eq!(scores.get(0), 95);
assert_eq!(scores.get(1), 87);

let prefs = row.preferences();
assert_eq!(prefs.keys().size(), 2);
assert_eq!(prefs.keys().get(0), "language");
assert_eq!(prefs.values().get(0), "en");
```

## 工作原理

- 字段在二进制行中编码，原始类型使用固定偏移量
- 变长数据（字符串、集合）使用偏移指针存储
- Null 位图跟踪哪些字段存在
- 通过递归行编码支持嵌套结构

## 性能比较

| 操作         | 对象格式           | 行格式               |
| ------------ | ------------------ | -------------------- |
| 完整反序列化 | 分配所有对象       | 零分配               |
| 单字段访问   | 需要完整反序列化   | 直接偏移读取         |
| 内存使用     | 内存中的完整对象图 | 仅已访问字段在内存中 |
| 适用于       | 小对象，完整访问   | 大对象，选择性访问   |

## ForyRow vs ForyObject

| 功能     | `#[derive(ForyRow)]` | `#[derive(ForyObject)]` |
| -------- | -------------------- | ----------------------- |
| 反序列化 | 零拷贝，延迟         | 完整对象重构            |
| 字段访问 | 直接从二进制         | 正常结构体访问          |
| 内存使用 | 最小                 | 完整对象                |
| 最适合   | 分析，大数据         | 通用序列化              |

## 相关主题

- [基础序列化](basic-serialization.md) - 对象图序列化
- [跨语言](xlang-serialization.md) - 跨语言的行格式
- [行格式规范](https://fory.apache.org/docs/specification/row_format_spec) - 协议细节
