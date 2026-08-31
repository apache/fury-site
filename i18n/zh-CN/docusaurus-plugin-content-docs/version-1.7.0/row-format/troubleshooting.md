---
title: 故障排查
sidebar_position: 90
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

## Standard Row 对端无法读取 Compact Row 字节

Compact Row 是仅支持 Java 的 Row 系列。需要在 Java、Python、C++ 和 Rust 之间共享字节时，
请使用 Standard Row。

## 字段查找失败

确认读取方使用的 Schema 和字段类型与编码后的 Row 相同。只有共享该 Schema 的 Row 才能复用
缓存的类型化字段句柄。

## 嵌套值似乎需要完整反序列化

直接使用 Row、数组和 Map 访问器。只有必须转换为对象的子树才调用所选 Fory Row 编码器的对象重建 API。
