---
title: 多态
sidebar_position: 6
id: polymorphism
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

当字段、元素或根值声明为更宽泛的类型时，跨语言多态会保留值的具体已注册类型。每个对等端都必须就具体类型标识和兼容字段 Schema 达成一致。

## 运行时规则

确切语法参见所选运行时的 Schema 元数据、注册和多态页面。[跨语言序列化规范](../../specification/xlang_serialization_spec.md)定义共享行为和限制。

不要仅根据宿主语言的继承关系推断跨语言支持。具体子类型必须具有可移植的跨语言映射，并在每个可能接收它的对等端协调注册。
