---
title: Schema 演进
sidebar_position: 8
id: schema_evolution
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

Apache Fory™ C# 在兼容模式下支持 Schema 演进。兼容模式默认启用。

## 兼容模式

```csharp
Fory fory = Fory.Builder()
    .Build();
```

兼容模式会写入类型元信息，使结构体定义不同的读写端也能互操作。

对于独立的[外部结构序列化器](external-types.md)，字段名称、字段 ID、Schema 描述符
和 `Evolving` 设置来自本地序列化器声明。每个版本都应使用相同且稳定的编码标识
注册第三方目标。普通抽象 class 和外部 `BaseOnly` 声明不能设置 `Evolving`；
该设置由每个具体派生类自行定义。

## 继承的 Schema

一个具体 C# class 使用单个扁平化 Schema，其中既包含自身的编码成员，也包含每个
带注解基类所选取的成员。因此，添加、删除、重命名或更改基类编码成员，都会更改
所有具体派生类的 Schema。基类编码声明发生变化后，需要重新构建并部署派生类程序集。

不属于编码成员的物理字段不会影响字段顺序、Schema hash 或 `TypeMeta`。这些字段发生
变化时，应重新构建拥有带注解基类或外部继承层次声明的程序集。当被引用包的程序集
标识发生变化时，还应重新构建依赖它的派生类程序集。

当值可以无损转换时，兼容模式 reader 还允许部分标量字段类型发生变化。匹配字段可以
在 `bool`、`string`、数值标量和 `decimal` 之间读取，只要转换后的值保持相同逻辑值。
布尔字符串必须严格为 `"0"`、`"1"`、`"true"` 或 `"false"`。数值字符串必须使用有限的
ASCII 十进制语法，不能包含空白、前导加号、Unicode 数字、下划线、十六进制表示、
`NaN` 或无穷值。数值和 decimal 读取为字符串时使用规范的普通十进制文本。可空字段
仍可与这些转换组合使用，但启用引用跟踪的标量类型变化不兼容。无效字符串、超出范围
的值和有损数值转换会在反序列化期间失败。

## 示例：新增一个字段

```csharp
using Apache.Fory;

[ForyStruct]
public sealed class OneStringField
{
    public string? F1 { get; set; }
}

[ForyStruct]
public sealed class TwoStringField
{
    public string F1 { get; set; } = string.Empty;
    public string F2 { get; set; } = string.Empty;
}

Fory fory1 = Fory.Builder().Build();
fory1.Register<OneStringField>(200);

Fory fory2 = Fory.Builder().Build();
fory2.Register<TwoStringField>(200);

byte[] payload = fory1.Serialize(new OneStringField { F1 = "hello" });
TwoStringField evolved = fory2.Deserialize<TwoStringField>(payload);

// F2 falls back to default value on reader side.
System.Diagnostics.Debug.Assert(evolved.F1 == "hello");
System.Diagnostics.Debug.Assert(evolved.F2 == string.Empty);
```

## 相同 Schema 优化

仅当所有 reader 和 writer 始终使用相同 Schema，并且你希望提升序列化速度、
减小载荷体积时，才使用此设置：

```csharp
Fory sameSchema = Fory.Builder()
    .Compatible(false)
    .CheckStructVersion(true)
    .Build();
```

由于 C# 只使用 xlang 编码格式，因此只有在确认所有对端都使用相同 Schema，
或者原生类型由 Fory Schema IDL 生成后，才应使用 `Compatible(false)`。
此模式会在 Schema hash 不匹配时抛出异常。

## 最佳实践

1. 对独立部署的服务保持兼容模式启用。
2. 在不同版本之间保持稳定的 type ID。
3. 新增字段时提供安全的默认值。
4. 对有意使用相同 Schema 的载荷，配合 `Compatible(false)` 使用
   `CheckStructVersion(true)`。

## 相关主题

- [配置](configuration.md)
- [外部类型](external-types.md)
- [类型注册](type-registration.md)
- [故障排查](troubleshooting.md)
