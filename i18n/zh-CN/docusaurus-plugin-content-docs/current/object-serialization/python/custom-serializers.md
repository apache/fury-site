---
title: 自定义序列化器
sidebar_position: 8
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

为特殊类型实现自定义序列化逻辑。

## 实现自定义序列化器

只需实现一次 `write/read`，即可同时用于 Python 原生模式和跨语言模式：

```python
import pyfory
from pyfory.serializer import Serializer
from dataclasses import dataclass

@dataclass
class Foo:
    f1: int
    f2: str

class FooSerializer(Serializer):
    def __init__(self, type_resolver, cls):
        super().__init__(type_resolver, cls)

    def write(self, write_context, obj: Foo):
        # Custom serialization logic
        write_context.write_varint32(obj.f1)
        write_context.write_string(obj.f2)

    def read(self, read_context):
        # Custom deserialization logic
        f1 = read_context.read_varint32()
        f2 = read_context.read_string()
        return Foo(f1, f2)

f = pyfory.Fory(xlang=False)
f.register(Foo, type_id=100, serializer=FooSerializer(f.type_resolver, Foo))

# Now Foo uses your custom serializer
data = f.dumps(Foo(42, "hello"))
result = f.loads(data)
print(result)  # Foo(f1=42, f2='hello')
```

## 缓冲区 API

### 写入方法

```python
# Integers
buffer.write_int8(value)
buffer.write_int16(value)
buffer.write_int32(value)
buffer.write_int64(value)

# Variable-length integers
buffer.write_varint32(value)
buffer.write_varint64(value)

# Floating point
buffer.write_float32(value)
buffer.write_float64(value)

# Strings and bytes
buffer.write_string(value)
buffer.write_bytes(value)

# Boolean
buffer.write_bool(value)
```

### 读取方法

```python
# Integers
value = buffer.read_int8()
value = buffer.read_int16()
value = buffer.read_int32()
value = buffer.read_int64()

# Variable-length integers
value = buffer.read_varint32()
value = buffer.read_varint64()

# Floating point
value = buffer.read_float32()
value = buffer.read_float64()

# Strings and bytes
value = buffer.read_string()
value = buffer.read_bytes(length)

# Boolean
value = buffer.read_bool()
```

## 何时使用自定义序列化器

- 来自其他包的外部类型
- 具有特殊序列化要求的类型
- 需要兼容现有数据格式
- 对性能要求较高的自定义编码
- 不适合自动序列化的类型

## 注册自定义序列化器

```python
fory = pyfory.Fory(xlang=False)

# Register with type_id
fory.register(MyClass, type_id=100, serializer=MySerializer(fory.type_resolver, MyClass))

# Register with name (for xlang)
fory.register(MyClass, name="com.example.MyClass", serializer=MySerializer(fory.type_resolver, MyClass))
```

## 相关主题

- [类型注册](type-registration.md) - 注册模式
- [配置](configuration.md) - Fory 参数
- [跨语言序列化](xlang.md) - 跨语言模式的类型注册和 Schema 规则
