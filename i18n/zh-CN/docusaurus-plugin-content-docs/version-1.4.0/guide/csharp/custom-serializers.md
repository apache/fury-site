---
title: 自定义序列化器
sidebar_position: 4
id: custom_serializers
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

当某个类型不是通过 `[ForyObject]` 生成，或者需要专门的编码方式时，可以使用自定义序列化器。

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

## 序列化器行为说明

- `WriteData` / `ReadData` 只负责处理载荷内容。
- 除非显式重写，否则引用标志和类型信息由基类 `Serializer<T>.Write` / `Read` 处理。
- `DefaultValue` 用于空值或默认值回退路径。

## 最佳实践

1. 保持序列化器逻辑确定且读写对称。
2. 对整数密集型载荷要有意识地选择 varint、fixed 或 tagged 编码。
3. 在所有读写端都注册自定义序列化器。
4. 对常规领域模型优先使用 `[ForyObject]` 生成的序列化器。

## 相关主题

- [类型注册](type-registration.md)
- [字段配置](schema-metadata.md)
- [故障排查](troubleshooting.md)
