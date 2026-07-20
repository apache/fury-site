---
title: C# 序列化指南
sidebar_position: 0
id: serialization_index
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

Apache Fory™ C# 是面向 .NET 的高性能跨语言序列化运行时。它提供对象图序列化、Schema 演进、泛型对象载荷支持，以及面向并发负载的线程安全封装。

## 为什么选择 Fory C#？

- 面向 .NET 8+ 的高性能二进制序列化
- 与 Java、Python、C++、Go、Rust 和 JavaScript 中的 Fory 实现保持跨语言兼容
- 基于 source generator 的 `[ForyObject]` 类型序列化器
- 可选引用跟踪，支持共享对象图和循环对象图
- 面向 Schema 演进的兼容模式
- 面向多线程服务的线程安全运行时 `ThreadSafeFory`

## 快速开始

### 要求

- .NET SDK 8.0+
- C# 语言版本 12+

### 从 NuGet 安装

引用单个 `Apache.Fory` 包即可。它同时包含运行时和 `[ForyObject]` 类型所需的 source generator。

```xml
<ItemGroup>
  <PackageReference Include="Apache.Fory" Version="1.4.0" />
</ItemGroup>
```

### 基础示例

```csharp
using Apache.Fory;

[ForyObject]
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
- `Serialize<object?>(...)` / `Deserialize<object?>(...)`，用于动态载荷
- `Register<T>(uint typeId)` 以及基于命名空间和名称的注册 API
- `Register<T, TSerializer>(...)`，用于自定义序列化器

## 文档

| 主题                                          | 说明                               |
| --------------------------------------------- | ---------------------------------- |
| [配置](configuration.md) | 构建器选项与运行时模式 |
| [基础序列化](basic-serialization.md) | 强类型和动态序列化 API |
| [类型注册](type-registration.md) | 注册用户类型和自定义序列化器 |
| [自定义序列化器](custom-serializers.md) | 实现 `Serializer<T>` |
| [字段配置](schema-metadata.md) | `[Field]` 特性与整数编码选项 |
| [引用](references.md) | 共享引用与循环引用处理 |
| [Schema 演进](schema-evolution.md) | 兼容模式行为 |
| [跨语言](xlang-serialization.md) | 互操作性指导 |
| [支持的类型](supported-types.md) | 内置类型与生成类型支持 |
| [线程安全](thread-safety.md) | `Fory` 与 `ThreadSafeFory` 的用法 |
| [故障排查](troubleshooting.md) | 常见错误与调试步骤 |

## 相关资源

- [跨语言序列化规范](../../specification/xlang_serialization_spec.md)
- [跨语言指南](../xlang/index.md)
- [C# 源码目录](https://github.com/apache/fory/tree/main/csharp)
