---
title: 类型注册
sidebar_position: 5
id: type-registration
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

## 按数字类型 ID 注册

使用显式 ID 获得紧凑且稳定的跨服务映射。

```csharp
Fory fory = Fory.Builder().Build();
fory.Register<User>(100);
fory.Register<Order>(101);
```

## 按类型名称注册

偏好符号映射时使用名称注册。单字符串重载接受完整的用户可见名称，并在最后一个点处分割。

```csharp
Fory fory = Fory.Builder().Build();
fory.Register<User>("com.example.User");
```

不包含点的名称使用空命名空间：

```csharp
fory.Register<User>("User");
```

如果已经分别取得命名空间和最终类型名称，也可以使用分离参数的重载：

```csharp
fory.Register<User>("com.example", "User");
```

## 注册自定义序列化器

```csharp
Fory fory = Fory.Builder().Build();
fory.Register<MyType, MyTypeSerializer>(200);
```

也支持按名称注册自定义序列化器：

```csharp
fory.Register<MyType, MyTypeSerializer>("com.example.MyType");
```

## 线程安全注册

`ThreadSafeFory` 公开相同的注册 API。注册信息会传播到所有线程各自的 Fory 实例。

```csharp
using ThreadSafeFory fory = Fory.Builder().BuildThreadSafe();
fory.Register<User>(100);
fory.Register<Order>(101);
```

## 注册规则

- 在写入端和读取端都注册用户定义类型。
- 跨服务和语言保持 ID/名称映射一致。
- 对于外部类型序列化，请注册第三方目标，例如 `fory.Register<ThirdParty.User>(100)`，不要注册本地序列化器声明。
- 按具体类型注册具体派生类。带注解的抽象基类和设置了 `BaseOnly = true` 的外部声明为派生类型提供 Schema，不进行注册。
- 直接为可序列化继承层次中的每个第一方类添加注解。注册派生类不会使未注解的基类可序列化。
- 对于分离参数的重载，`typeName` 不得为空且不得包含点。
- 在大规模序列化工作负载开始前完成注册，避免缺少类型元信息。

## 相关主题

- [基本序列化](core-api.md)
- [外部类型](external-types.md)
- [自定义序列化器](custom-serializers.md)
- [跨语言序列化](xlang.md)
