---
title: 故障排查
sidebar_position: 13
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

本页介绍常见的 C# 运行时问题及其解决方法。

## `TypeNotRegisteredException`

**现象**：`Type not registered: ...`

**原因**：用户类型在没有注册的情况下被序列化或反序列化。

**修复方式**：

```csharp
Fory fory = Fory.Builder().Build();
fory.Register<MyType>(100);
```

请确保读写两端使用相同的 type-ID 或名称映射。

## `InvalidDataException: xlang bitmap mismatch`

**原因**：载荷不是 xlang Fory 帧，或者它来自不输出 C# 所需 xlang 头的对端模式。

**修复方式**：确保载荷由兼容 xlang 的对端生成。C# 始终要求 xlang 头且不提供模式开关，
因此应在 writer 端进行配置：

```java
Fory fory = Fory.builder()
    .withXlang(true)
    .build();
```

```python
fory = pyfory.Fory(xlang=True)
```

## 相同 Schema 载荷的 Schema 版本不匹配

**现象**：反序列化生成的结构体类型时抛出 `InvalidDataException`。

**原因**：`Compatible(false)` 配合 `CheckStructVersion(true)` 会校验有意使用相同
Schema 的载荷的 Schema hash。

**可选修复方式**：

- 保持兼容模式启用以支持 Schema 演进。
- 只有在每个 reader 和 writer 始终使用相同 Schema 时，才使用 `Compatible(false)`。

## 循环引用失败

**现象**：类似栈溢出的递归问题，或者对象图重建异常。

**原因**：循环对象图在 `TrackRef(false)` 下运行。

**修复方式**：

```csharp
Fory fory = Fory.Builder().TrackRef(true).Build();
```

## 派生 Class 报告 `FORY019`

**原因**：一个非 `object` 基类没有提供且仅提供一个兼容的生成式继承层次声明。常见原因
包括：第一方基类自身缺少直接的 `[ForyStruct]`、基类包使用旧版 generator 构建，或者
两个被引用的 Schema 程序集声明了同一个第三方基类。

**修复方式**：

- 直接为每个可修改的基类添加 `[ForyStruct]`，然后重新构建基类程序集。
- 对不可修改的基类，只引用一个外部声明，并将其 `Target` 设为派生类型的直接第三方基类。
- 删除重复的 provider 程序集，然后重新构建派生类。

Fory 不会通过检查被引用包的 private 字段来替代缺失的声明。

## Private 外部字段抛出 `MissingFieldException`

**原因**：精确外部字段声明与已安装的包版本不再匹配。`TargetDeclaringType`、
`TargetMemberName` 或声明的 CLR 类型与包的 private 应用程序二进制接口（ABI）不一致。

**修复方式**：根据准确的包版本检查成员元数据，更新外部声明及其仅存储字段条目，
然后重新构建。Fory 不会回退到反射或其他成员。

## 并发问题

**原因**：在多个线程之间共享同一个 `Fory` 实例。

**修复方式**：改用 `BuildThreadSafe()`。

## 生成的 gRPC 代码编译失败

**现象**：生成的 `*Grpc.cs` 文件找不到 `Grpc.Core` 类型。

**原因**：gRPC 包属于应用依赖。`Apache.Fory` 包不会将 gRPC 作为硬依赖添加。

**修复方式**：添加 `Grpc.Core.Api` 以及所选的 gRPC server 或 client 包，例如 server
hosting 使用 `Grpc.AspNetCore`，client 使用 `Grpc.Net.Client`。请参见
[gRPC 支持](grpc-support.md)。

## Protobuf Client 无法解码 Fory gRPC Service

**原因**：Fory gRPC companion 使用 gRPC 传输，并以 Fory 编码 message body。
它们不会发送 protobuf message 字节。

**修复方式**：Fory endpoint 的 client 和 server 都应使用 Fory 生成代码，或者另外暴露
一个 protobuf endpoint 供通用 protobuf client 使用。

## 验证命令

从仓库根目录运行 C# 测试：

```bash
cd csharp
dotnet test Fory.sln -c Release
```

## 相关主题

- [配置](configuration.md)
- [gRPC 支持](grpc-support.md)
- [Schema 演进](schema-evolution.md)
- [线程安全](thread-safety.md)
