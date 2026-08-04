---
title: Schema 演进
sidebar_position: 6
id: schema-evolution
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

兼容模式会写入类型元信息，使结构体定义不同的读取端和写入端能够互操作。

对于独立的[外部结构化序列化器](external-types.md)，字段名称、字段 ID、Schema 描述符和 `Evolving` 设置来自本地序列化器声明。请在每个版本中使用相同且稳定的编码标识注册第三方目标。普通抽象类和外部 `BaseOnly` 声明不能设置 `Evolving`；该设置由每个具体派生类型负责。

## 继承的 Schema

具体 C# 类具有一个扁平 Schema，其中包含自身的编码成员以及每个带注解基类选择的成员。因此，新增、删除、重命名或修改基类编码成员会改变每个具体派生类型的 Schema。基类编码声明发生变化时，请重新构建并部署派生程序集。

不属于编码成员的物理字段不会影响字段顺序、Schema 哈希或 `TypeMeta`。这些字段发生变化时，请重新构建拥有带注解基类或外部继承层次声明的程序集。当所引用包的程序集标识发生变化时，请重新构建依赖它的派生程序集。

当值可以无损转换时，兼容读取端还允许部分标量字段类型变化。只要转换后的逻辑值相同，匹配字段就可以在 `bool`、`string`、数值标量和 `decimal` 之间读取。布尔字符串必须严格为 `"0"`、`"1"`、`"true"` 或 `"false"`。数值字符串使用有限 ASCII 十进制语法，不允许空白、前导加号、Unicode 数字、下划线、十六进制表示、`NaN` 或无穷值。将数值和 decimal 读取为字符串时使用规范的普通十进制文本。可空字段仍可与这些转换组合，但启用引用跟踪的标量类型变化不兼容。无效字符串、超出范围的值和有损数值转换会在反序列化期间失败。

## 示例：新增字段

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

仅当每个读取端和写入端始终使用相同 Schema，并且希望获得更快序列化和更小体积时，才使用此设置：

```csharp
Fory sameSchema = Fory.Builder()
    .Compatible(false)
    .CheckStructVersion(true)
    .Build();
```

由于 C# 仅使用 xlang 编码格式，请仅在确认每个通信方使用相同 Schema，或原生类型由 Fory Schema IDL 生成时使用 `Compatible(false)`。Schema 哈希不匹配时，此模式会抛出异常。

## 最佳实践

1. 对独立部署的服务保持启用兼容模式。
2. 跨版本保持类型 ID 稳定。
3. 为新增字段提供安全的默认值。
4. 对有意使用的相同 Schema 载荷，使用 `CheckStructVersion(true)` 并配合 `Compatible(false)`。

## 相关主题

- [配置](configuration.md)
- [外部类型](external-types.md)
- [类型注册](type-registration.md)
- [故障排查](troubleshooting.md)
