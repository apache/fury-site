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

当 Java 读取端接收来自应用信任边界之外的字节时，请遵循本页说明。Fory 会重建应用值，
但不会验证发送者身份、保护传输完整性，也不会判断一个合法值是否获准用于某项业务操作。

## 应用边界

反序列化之前：

- 在传输层或存储层验证发送者身份并保护消息完整性。
- 在 Fory 外部限制请求或文件大小、超时时间和并发量。
- 只注册端点允许的应用类型，并在第一次根操作之前完成读取端配置。
- 使用反序列化结果之前，根据应用的授权规则和领域规则验证该值。

## 内置保护

在生产环境以及处理任何不可信载荷来源时，请保持类注册启用：

```java
Fory fory = Fory.builder()
    .requireClassRegistration(true)
    .withMaxDepth(50)
    .withMaxGraphMemoryBytes(128L * 1024 * 1024)
    .withMaxUnbackedContainerItems(8192)
    .build();
```

安全相关选项：

- `requireClassRegistration(true)` 将反序列化限制为已注册类。
- `withMaxDepth(...)` 拒绝深度异常的对象图。
- `withMaxGraphMemoryBytes(...)` 为单次根反序列化期间实例化的对象图内存设置近似门限。估算主要覆盖集合、映射、数组、结构体和对象；Fory core 原始类型数组和原始类型列表根据解码长度计入其原始存储。它会跳过字符串、原始标量和不使用原始类型数组序列化器的专用二进制值等叶子值。实际进程内存可能高于该限制。叶子值仍受字节可用性检查保护：如果未读取的输入没有足够字节，Fory 不会读取或创建该叶子值。默认值固定为 `128 MiB`；可信工作负载需要更大或更小门限时，请设置正数字节限制。
- `withMaxUnbackedContainerItems(...)` 限制由数量驱动、但重复读取正文没有消耗相应输入的集合和映射工作。默认值为 `8192`；零表示严格限制。
- `withMaxTypeFields(...)` 和 `withMaxTypeMetaBytes(...)` 限制单个已接收远程元数据正文的字段数与编码正文大小。
- `withMaxSchemaVersionsPerType(...)` 和
  `withMaxAverageSchemaVersionsPerType(...)` 限制可接受的远程元数据版本，而不改变注册、动态加载或 Schema 演进语义。
- `withDeserializeUnknownClass(false)` 避免根据元数据实例化未知类。
- `checkJdkClassSerializable(true)` 保留对 `java.*` 类的 JDK 可序列化性检查。
- 类注册警告可用于安全审计；需要暴露意外类型时，请使用 `suppressClassRegistrationWarnings(false)`。

仅对可信载荷使用 `requireClassRegistration(false)`；需要动态类加载时，应同时配置 `TypeChecker` 允许列表。

## 验证

除正常往返测试外，还应为边界添加负向测试。确认配置后的读取端会拒绝意外的应用类型、
过深的嵌套、超出资源限制的输入以及格式错误的输入。一次读取失败后，还应确认同一 Fory 实例
仍能正确读取下一个合法根值。

完整选项请参阅[配置](configuration.md)，Fory 注册 API 请参阅[类型注册](type-registration.md)。
