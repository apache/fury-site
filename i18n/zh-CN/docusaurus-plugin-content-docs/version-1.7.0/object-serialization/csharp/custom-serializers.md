---
title: 自定义序列化器
sidebar_position: 11
id: custom-serializers
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

当类型没有使用 `[ForyStruct]` 生成序列化器，或需要专用编码时，请使用自定义序列化器。

[外部类型序列化](external-types.md)会为可变的第三方目标生成序列化器，包括精确的私有字段或重命名字段。对于不可变、只能通过构造函数或工厂创建、readonly、init-only、需要转换或采用自定义编码的目标，请使用自定义序列化器。在 .NET 8 上，如果私有外部编码字段的声明类型或访问器签名是泛型，也需要使用自定义序列化器。仅映射存储的精确映射不会生成私有访问器。

## 实现 `Serializer<T>`

```csharp
using Apache.Fory;

public sealed class Point
{
    public int X { get; set; }
    public int Y { get; set; }
}

public sealed class PointSerializer : Serializer<Point>
{
    public override Point DefaultValue => new();

    public override void WriteData(WriteContext context, in Point value, bool hasGenerics)
    {
        context.Writer.WriteVarInt32(value.X);
        context.Writer.WriteVarInt32(value.Y);
    }

    public override Point ReadData(ReadContext context)
    {
        return new Point
        {
            X = context.Reader.ReadVarInt32(),
            Y = context.Reader.ReadVarInt32(),
        };
    }
}
```

## 注册序列化器

```csharp
Fory fory = Fory.Builder().Build();
fory.Register<Point, PointSerializer>(200);

Point value = new() { X = 10, Y = 20 };
byte[] payload = fory.Serialize(value);
Point decoded = fory.Deserialize<Point>(payload);
```

当通信方通过名称而非数字 ID 标识类型时，请使用名称重载：

```csharp
fory.Register<Point, PointSerializer>("com.example.Point");
```

## 序列化器行为说明

- `WriteData` / `ReadData` 只处理载荷内容。
- 除非被重写，否则引用标志和类型信息由基类 `Serializer<T>.Write` / `Read` 处理。
- `DefaultValue` 用于 null/default 回退路径。

## 最佳实践

1. 保持序列化器确定且对称。
2. 对包含大量整数的载荷，有意识地选择 varint/fixed/tagged 编码。
3. 在所有读取端和写入端注册自定义序列化器。
4. 普通领域模型优先使用生成的 `[ForyStruct]` 序列化器。

## 相关主题

- [类型注册](type-registration.md)
- [Schema 元数据](schema-metadata.md)
- [故障排查](troubleshooting.md)
