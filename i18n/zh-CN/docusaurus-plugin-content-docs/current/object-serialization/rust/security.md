---
title: 安全
sidebar_position: 99
id: security
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

当 Rust 读取端接收来自应用信任边界之外的字节时，请遵循本页说明。Fory 会重建应用值，
但不会验证发送者身份、保护传输完整性，也不会判断一个合法值是否获准用于某项业务操作。

## 应用边界

反序列化之前：

- 在传输层或存储层验证发送者身份并保护消息完整性。
- 在 Fory 外部限制请求或文件大小、超时时间和并发量。
- 只注册端点允许的应用类型，并在第一次根操作之前完成读取端配置。
- 使用反序列化结果之前，根据应用的授权规则和领域规则验证该值。

## 内置保护

安全相关配置：

- 反序列化不可信载荷前，注册应用结构体和特征对象实现。
- 使用 `max_dyn_depth(...)` 拒绝意外过深的动态对象图。
- 对大多数输入，将 `max_graph_memory_bytes(...)` 保持为固定默认值 `128 MiB`；只有可信工作负载具有不同的合理集合、映射或结构体大小时才设置正字节限制。
- 除非可信紧凑编解码器需要更大的根限额，否则将 `max_unbacked_container_items(...)` 保持为 `8192`。零会拒绝每个无输入支撑的条目。
- 除非数据确定无恶意且可信对等端会发送更大的元数据或大量 Schema 版本，否则请保留远端 Schema 元数据限制的默认值。
- 对不可信输入，优先使用具体类型字段，而非 `dyn Any` 或宽泛的特征对象字段。

## 验证

除正常往返测试外，还应为边界添加负向测试。确认配置后的读取端会拒绝意外的应用类型、
过深的嵌套、超出资源限制的输入以及格式错误的输入。一次读取失败后，还应确认同一 Fory 实例
仍能正确读取下一个合法根值。

完整选项请参阅[配置](configuration.md)，Fory 注册 API 请参阅[类型注册](type-registration.md)。
