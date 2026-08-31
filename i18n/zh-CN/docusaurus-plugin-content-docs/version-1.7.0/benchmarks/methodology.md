---
title: 基准测试方法论
sidebar_position: 2
id: methodology
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

有价值的序列化基准测试应记录足够的上下文，以便复现工作负载，并避免将语义不同的测试当作等价结果比较。

## 必需上下文

- 仓库 commit 和依赖版本；
- 硬件、操作系统、运行时版本和相关环境变量；
- Schema 和对象填充方式；
- xlang 或 native 模式、兼容模式、引用跟踪和注册方式；
- 预热、fork/process、迭代次数、持续时间和并发度；
- 测量的序列化表示和操作；
- 精确命令和原始结果位置。

## 解读报告

只比较同一种操作和等价的数据语义。不要在不说明语义差异的情况下，将 xlang 载荷与 native 载荷比较，
或将完整对象重建与 Row Format 字段访问比较。基于 JIT 和代码生成的实现需要有代表性的预热。

如果决策依赖当前代码，请运行当前有效的 benchmark harness。仓库中保存的报告只代表其记录的
commit 和环境。
