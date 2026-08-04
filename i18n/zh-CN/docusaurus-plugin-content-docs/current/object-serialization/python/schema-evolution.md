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

Apache Fory™ 在兼容模式下支持 Schema 演进，允许在保持兼容性的同时增加或删除字段。跨语言模式和原生模式都默认启用兼容模式。

当转换无损时，兼容读取器也能容忍部分标量字段类型变化。匹配字段在转换后保持相同逻辑值时，可以在 `bool`、`str`、数字标量和 `Decimal` 之间读取。例如，`"true"`、`"false"`、`"0"` 和 `"1"` 可读取为布尔值；`"123"` 可读取到能容纳 `123` 的数字字段；数字和小数可读取为规范字符串；只有不损失精度或范围时，数字扩宽或收窄才会成功。

标量转换仅适用于匹配的兼容字段，不适用于根值或集合元素。字符串到数字的转换只接受有限 ASCII 十进制字面量，不允许空白、前导 `+`、Unicode 数字、下划线，也不允许 `NaN` 和 `Infinity` 等特殊值。无效字符串、超出范围的值和有损转换会在反序列化期间以 `pyfory.error.ForyInvalidDataError` 失败。Optional 和可空字段仍可与这些转换组合，但启用引用跟踪的标量类型变化不兼容。

## 默认兼容模式

```python
import pyfory

f = pyfory.Fory()
native_f = pyfory.Fory(xlang=False)
```

`pyfory.dataclass` 也支持 `slots=True`：

```python
@pyfory.dataclass(slots=True)
class SlotMessage:
    id: int
```

## Schema 演进示例

```python
import pyfory
from dataclasses import dataclass

# Version 1: Original class
@dataclass
class User:
    name: str
    age: pyfory.Int32

f = pyfory.Fory(xlang=True)
f.register(User, name="User")
data = f.dumps(User("Alice", 30))

# Version 2: Add new field (backward compatible)
@dataclass
class User:
    name: str
    age: pyfory.Int32
    email: str = "unknown@example.com"  # New field with default

# Can still deserialize old data
user = f.loads(data)
print(user.email)  # "unknown@example.com"
```

## 支持的变更

- **新增字段**：提供默认值
- **删除字段**：旧数据中的额外字段会被跳过
- **重排字段**：字段按名称而非位置匹配

## 未知远程结构体

当兼容元数据描述的 Struct 没有本地注册时，Python 返回 `pyfory.UnknownStruct`。这一固定的纯数据载体通过映射式访问公开远程字段，并且可以使用原始 Schema 再次序列化：

```python
value = reader.deserialize(data)
assert isinstance(value, pyfory.UnknownStruct)
print(value["name"])

forwarded = reader.serialize(value)
```

该行为同样适用于 `strict=True`：Fory 不会导入、生成或实例化以发送端名称命名的 Python 类。需要实例化应用类型的读取端应注册匹配的类。

## 相同 Schema 类优化

仅当每个载荷反序列化时使用的类 Schema 始终与序列化时相同，并且希望获得更快速度和更小体积时，才使用 `compatible=False`。对于跨语言载荷，只有在确认每种语言使用相同 Schema，或原生类型由 Fory Schema IDL 生成时，才设置 `compatible=False`。

```python
f = pyfory.Fory(xlang=False, compatible=False)
```

对于单个 dataclass，可使用 `pyfory.dataclass(evolving=False)` 选择退出演进元数据：

```python
import pyfory

@pyfory.dataclass(evolving=False)
class SameSchemaMessage:
    id: int
    name: str
```

## 最佳实践

1. 为新字段**始终提供默认值**
2. 为跨语言兼容**使用名称**
3. 部署前**测试 Schema 变更**
4. 为团队**记录 Schema 版本**

## 相关主题

- [配置](configuration.md) - 兼容模式设置
- [跨语言序列化](xlang.md) - 跨语言 Schema 演进
- [类型注册](type-registration.md) - 注册模式
