---
title: C# 设置
sidebar_position: 7
id: csharp
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

Fory C# 提供 xlang 对象序列化、生成的模型以及 Fory gRPC。`Apache.Fory` NuGet 软件包需要 .NET 8 或更高版本，其中同时包含运行时和源代码生成器。

## 验证工具链

```bash
dotnet --version
```

## 对象序列化

创建控制台项目并添加已发布的软件包：

```bash
dotnet new console -n ForyExample
cd ForyExample
dotnet add package Apache.Fory --version 1.6.1
```

将 `Program.cs` 替换为：

```csharp
using Apache.Fory;

[ForyStruct]
public sealed class User
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
}

public static class Program
{
    public static void Main()
    {
        Fory fory = Fory.Builder().Build();
        fory.Register<User>(1);

        byte[] bytes = fory.Serialize(new User { Id = 1, Name = "Alice" });
        User decoded = fory.Deserialize<User>(bytes);
        Console.WriteLine(decoded.Name);
    }
}
```

```bash
dotnet run
```

C# 使用 xlang 模式。接下来可阅读 [C# 对象序列化](../object-serialization/csharp/index.md)、[xlang 类型](../object-serialization/csharp/basic-serialization.md#cross-language-interoperability)、[配置](../object-serialization/csharp/configuration.md)和 [Schema 演进](../object-serialization/csharp/schema-evolution.md)。

## 其他能力

- **Fory IDL 与编译器** 生成 C# 模型和注册辅助代码。请参阅[编译器快速入门](../compiler/getting-started.md)和 [C# 生成代码指南](../compiler/generated-code/csharp.md)。
- **Fory gRPC** 通过常规 .NET gRPC 传输使用 Fory 编码的消息。请参阅 [C# gRPC](../grpc/csharp.md)。
