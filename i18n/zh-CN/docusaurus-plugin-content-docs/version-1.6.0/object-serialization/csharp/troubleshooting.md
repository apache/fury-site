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

本页介绍常见 C# 问题及其解决方法。

## `TypeNotRegisteredException`

**症状**：`Type not registered: ...`

**原因**：序列化或反序列化用户类型前未注册该类型。

**解决方法**：

```csharp
Fory fory = Fory.Builder().Build();
fory.Register<MyType>(100);
```

确保写入端和读取端使用相同的类型 ID/名称映射。

## `InvalidDataException: xlang bitmap mismatch`

**原因**：载荷不是 xlang Fory 帧，或者它来自不会生成 C# 所需 xlang 头部的通信方模式。

**解决方法**：确保载荷由兼容 xlang 的通信方生成。C# 始终要求 xlang 头部且不提供模式开关，因此请改为配置写入端：

```java
Fory fory = Fory.builder()
    .withXlang(true)
    .build();
```

```python
fory = pyfory.Fory(xlang=True)
```

## 相同 Schema 载荷的 Schema 版本不匹配

**症状**：反序列化生成的结构体类型时出现 `InvalidDataException`。

**原因**：将 `Compatible(false)` 与 `CheckStructVersion(true)` 结合使用时，会检查有意采用相同 Schema 的载荷的 Schema 哈希。

**解决选项**：

- 为支持 Schema 演进保持启用兼容模式。
- 仅当每个读取端和写入端始终使用相同 Schema 时才使用 `Compatible(false)`。

## 循环引用失败

**症状**：出现类似堆栈溢出的递归或对象图重建问题。

**原因**：循环对象图使用了 `TrackRef(false)`。

**解决方法**：

```csharp
Fory fory = Fory.Builder().TrackRef(true).Build();
```

## 派生类报告 `FORY019`

**原因**：非 `object` 基类没有公开且仅公开一个兼容的生成继承层次声明。通常是因为第一方基类没有直接添加自己的 `[ForyStruct]`、基类包使用旧版生成器构建，或两个被引用的 Schema 程序集声明了同一个第三方基类。

**解决方法**：

- 直接为每个可修改的基类添加 `[ForyStruct]`，然后重新构建基类程序集。
- 对于不可修改的基类，只引用一个外部声明，并将其 `Target` 设置为派生类型的直接第三方基类。
- 移除重复的提供方程序集，并重新构建派生类型。

Fory 不会检查被引用包的私有字段来替代缺失的声明。

## 私有外部字段抛出 `MissingFieldException`

**原因**：精确外部字段声明不再与已安装包版本匹配。`TargetDeclaringType`、`TargetMemberName` 或声明的 CLR 类型与包的私有应用二进制接口不同。

**解决方法**：对照准确的包版本检查成员元数据，更新外部声明及其仅存储字段条目，然后重新构建。不存在反射或备用成员回退机制。

## 并发问题

**原因**：跨线程共享单个 `Fory` 实例。

**解决方法**：使用 `BuildThreadSafe()`。

## 生成的 gRPC 代码编译错误

**症状**：生成的 `*Grpc.cs` 文件找不到 `Grpc.Core` 类型。

**原因**：gRPC 包是应用依赖。`Apache.Fory` 包不会将 gRPC 添加为硬依赖。

**解决方法**：添加 `Grpc.Core.Api` 和所选的 gRPC 服务端或客户端包，例如服务托管使用 `Grpc.AspNetCore`，客户端使用 `Grpc.Net.Client`。参见 [gRPC 支持](../../grpc/csharp.md)。

## Protobuf 客户端无法解码 Fory gRPC 服务

**原因**：Fory gRPC 配套类型使用 gRPC 传输 Fory 编码的消息主体，不会发送 protobuf 消息字节。

**解决方法**：为 Fory 端点使用 Fory 生成的客户端和服务端，或为通用 protobuf 客户端公开单独的 protobuf 端点。

## 验证命令

从仓库根目录运行 C# 测试：

```bash
cd csharp
dotnet test Fory.sln -c Release
```

## 相关主题

- [配置](configuration.md)
- [gRPC 支持](../../grpc/csharp.md)
- [Schema 演进](schema-evolution.md)
- [线程安全](thread-safety.md)
