---
title: 类型注册
sidebar_position: 5
id: type_registration
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

本页介绍如何在 Apache Fory™ C# 中注册用户类型。

## 按数字 type ID 注册

显式 ID 可以提供紧凑且稳定的跨服务映射。

```csharp
Fory fory = Fory.Builder().Build();
fory.Register<User>(100);
fory.Register<Order>(101);
```

## 按类型名注册

如果你更倾向于使用符号化映射，可以按名称注册。单字符串重载接受完整的对外名称，
并在最后一个点号处拆分它。

```csharp
Fory fory = Fory.Builder().Build();
fory.Register<User>("com.example.User");
```

不含点号的名称使用空命名空间：

```csharp
fory.Register<User>("User");
```

如果已经分别持有命名空间和最终类型名，也可以使用拆分参数的重载：

```csharp
fory.Register<User>("com.example", "User");
```

## 注册自定义序列化器

```csharp
Fory fory = Fory.Builder().Build();
fory.Register<MyType, MyTypeSerializer>(200);
```

同样支持基于名称的自定义序列化器注册：

```csharp
fory.Register<MyType, MyTypeSerializer>("com.example.MyType");
```

## 线程安全注册

`ThreadSafeFory` 提供相同的注册 API。注册信息会传播到各个线程内运行时。

```csharp
using ThreadSafeFory fory = Fory.Builder().BuildThreadSafe();
fory.Register<User>(100);
fory.Register<Order>(101);
```

## 注册规则

- 在写端和读端都要注册用户定义类型。
- 在服务和语言之间保持 ID 或名称映射一致。
- 对于外部类型序列化，应注册第三方目标，例如
  `fory.Register<ThirdParty.User>(100)`，而不是本地序列化器声明。
- 按具体类型注册具体派生 class。带注解的抽象基类以及
  `BaseOnly = true` 的外部声明仅为派生类提供 Schema，不需要注册。
- 需要直接为可序列化继承层次中的每个第一方 class 添加注解。注册派生 class
  并不会让没有注解的基类变得可序列化。
- 使用拆分参数的重载时，`typeName` 不能为空且不能包含点号。
- 在高频序列化负载开始前完成注册，避免类型元信息缺失。

## 相关主题

- [基础序列化](basic-serialization.md)
- [外部类型](external-types.md)
- [自定义序列化器](custom-serializers.md)
- [跨语言](xlang-serialization.md)
