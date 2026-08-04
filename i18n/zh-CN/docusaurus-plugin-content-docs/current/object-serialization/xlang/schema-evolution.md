---
title: Schema 演进
sidebar_position: 3
id: schema-evolution
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

跨语言兼容模式携带 Schema 元数据，使读取端可以容忍受支持的字段新增、删除和重排。只有每个读取端和写入端都使用相同 Schema 时，相同 Schema 模式才能减少元数据。

## 选择兼容模式或相同 Schema 模式

独立部署的对等端应保持兼容模式。只有确认每个运行时都使用相同的字段标识、可空性、引用元数据和类型后，才使用相同 Schema 模式。

运行时 API 和示例位于各运行时的 `schema-evolution.md` 页面。规范性 Schema 元数据和兼容行为由[跨语言序列化规范](../../specification/xlang_serialization_spec.md)定义。
