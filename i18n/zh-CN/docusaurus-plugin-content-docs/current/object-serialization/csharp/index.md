---
title: C# 对象序列化
sidebar_position: 0
id: index
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

Apache Fory™ C# 是面向 .NET 的高性能跨语言序列化库。它支持对象图序列化、Schema 演进、通用对象载荷，并为并发工作负载提供线程安全包装器。

## 为什么选择 Fory C#？

- 面向 .NET 8+ 的高性能二进制序列化
- 与 Java、Python、C++、Go、Rust、JavaScript/TypeScript、Swift、Dart、Scala 和 Kotlin 的 Fory 实现兼容
- 基于源码生成器为 `[ForyStruct]` 类型生成序列化器，并支持注册 `[ForyEnum]` 和 `[ForyUnion]`
- 为外部 class、struct 和 enum 目标生成序列化器
- 可选的引用跟踪，可处理共享引用和循环对象图
- 支持 Schema 演进的兼容模式
- 面向多线程服务的线程安全包装器（`ThreadSafeFory`）

## 快速入门

### 环境要求

- .NET SDK 8.0+
- C# 语言版本 12+

### 从 NuGet 安装

只需引用 `Apache.Fory` 包。它同时包含 Fory 库，以及用于 `[ForyStruct]`、`[ForyEnum]` 和 `[ForyUnion]` 类型的源码生成器。

```xml
<ItemGroup>
  <PackageReference Include="Apache.Fory" Version="1.5.0" />
</ItemGroup>
```

### 基本示例

```csharp
using Apache.Fory;

[ForyStruct]
public sealed class User
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Email { get; set; }
}

Fory fory = Fory.Builder().Build();
fory.Register<User>(1);

User user = new()
{
    Id = 1,
    Name = "Alice",
    Email = "alice@example.com",
};

byte[] payload = fory.Serialize(user);
User decoded = fory.Deserialize<User>(payload);
```

## 核心 API

- `Serialize<T>(in T value)` / `Deserialize<T>(...)`
- 对动态载荷使用 `Serialize<object?>(...)` / `Deserialize<object?>(...)`
- 使用 `Register<T>(uint typeId)` 和名称注册 API
- 使用 `Register<T, TSerializer>(...)` 注册自定义序列化器

## 文档

| 主题                                    | 说明                                  |
| --------------------------------------- | ------------------------------------- |
| [配置](configuration.md)                | 构建器选项和模式设置                  |
| [基本序列化](core-api.md)               | 类型化和动态序列化 API                |
| [跨语言序列化](xlang.md)                | 互操作指南                            |
| [Schema 元数据](schema-metadata.md)     | `[ForyField]` ID 和 Schema 类型描述符 |
| [类型注册](type-registration.md)        | 注册用户类型和自定义序列化器          |
| [外部类型](external-types.md)           | 第三方类型的序列化器                  |
| [自定义序列化器](custom-serializers.md) | 实现 `Serializer<T>`                  |
| [引用](references.md)                   | 共享引用和循环引用处理                |
| [Schema 演进](schema-evolution.md)      | 兼容模式行为                          |
| [支持的类型](supported-types.md)        | 内置类型和生成类型支持                |
| [线程安全](thread-safety.md)            | `Fory` 与 `ThreadSafeFory` 的用法     |
| [gRPC 支持](../../grpc/csharp.md)       | 生成由 Fory 支持的 gRPC 服务配套类型  |
| [故障排查](troubleshooting.md)          | 常见错误和调试步骤                    |

## 相关资源

- [跨语言序列化规范](../../specification/xlang_serialization_spec.md)
- [跨语言指南](../xlang/index.md)
- [C# 源码目录](https://github.com/apache/fory/tree/main/csharp)
