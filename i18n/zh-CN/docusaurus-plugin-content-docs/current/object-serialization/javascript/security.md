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

当 JavaScript/TypeScript 读取端接收来自应用信任边界之外的字节时，请遵循本页说明。Fory 会重建应用值，
但不会验证发送者身份、保护传输完整性，也不会判断一个合法值是否获准用于某项业务操作。

## 应用边界

反序列化之前：

- 在传输层或存储层验证发送者身份并保护消息完整性。
- 在 Fory 外部限制请求或文件大小、超时时间和并发量。
- 只注册端点允许的应用类型，并在第一次根操作之前完成读取端配置。
- 使用反序列化结果之前，根据应用的授权规则和领域规则验证该值。

## 内置保护

安全相关配置：

- 反序列化不可信载荷前，只注册预期 Schema。
- 将 `maxDepth` 设置为服务允许的最大嵌套深度。
- 将 `maxGraphMemoryBytes` 设为包含大量 collection、map、array、struct 和 object 的载荷的近似限制。它并非精确的堆上限；叶子值受剩余输入字节限制。
- 保持 `maxTypeFields` 和 `maxTypeMetaBytes` 的默认值，除非数据可信且可信通信方会发送更大的远程元数据。
- 保持 `maxSchemaVersionsPerType` 和 `maxAverageSchemaVersionsPerType` 的默认值，除非数据可信且可信通信方会发送大量远程 Schema 版本。
- 对不可信输入，优先使用显式 `Type.struct(...)` Schema，而不是 `Type.any()`。
- 只传入来自与 Fory 一起部署的官方包版本的 `hps`。

## 验证

除正常往返测试外，还应为边界添加负向测试。确认配置后的读取端会拒绝意外的应用类型、
过深的嵌套、超出资源限制的输入以及格式错误的输入。一次读取失败后，还应确认同一 Fory 实例
仍能正确读取下一个合法根值。

完整选项请参阅[配置](configuration.md)，Fory 注册 API 请参阅[类型注册](type-registration.md)。
