---
title: 类型注册与安全性
sidebar_position: 3
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

本页介绍类型注册机制和安全配置。

## 类型注册

在严格模式下，只有已注册的类型才能被反序列化。这可以防止任意代码执行：

```python
import pyfory

# 严格模式（生产环境推荐）
f = pyfory.Fory(strict=True)

class SafeClass:
    def __init__(self, data):
        self.data = data

# 在严格模式下必须注册类型
f.register(SafeClass, typename="com.example.SafeClass")

# 现在序列化可以正常工作
obj = SafeClass("safe data")
data = f.serialize(obj)
result = f.deserialize(data)

# 未注册的类型将引发异常
class UnsafeClass:
    pass

# 在严格模式下这将失败
try:
    f.serialize(UnsafeClass())
except Exception as e:
    print("安全保护已激活！")
```

## 注册模式

### 模式 1：简单注册

```python
fory.register(MyClass, type_id=100)
```

### 模式 2：使用类型名称的跨语言注册

```python
fory.register(MyClass, typename="com.example.MyClass")
```

### 模式 3：使用自定义序列化器

```python
fory.register(MyClass, type_id=100, serializer=MySerializer(fory.type_resolver, MyClass))
```

### 模式 4：批量注册

```python
type_id = 100
for model_class in [User, Order, Product, Invoice]:
    fory.register(model_class, type_id=type_id)
    type_id += 1
```

## 安全模式

### 严格模式（推荐）

```python
# 生产环境始终使用 strict=True
fory = pyfory.Fory(strict=True)

# 显式注册允许的类型
fory.register(UserModel, type_id=100)
fory.register(OrderModel, type_id=101)
```

### 非严格模式

**⚠️ 安全警告**：当 `strict=False` 时，Fory 将反序列化任意类型，如果数据来自不受信任的源，这可能带来安全风险。仅在完全信任数据源的受控环境中使用 `strict=False`。

```python
# 仅在受信任的环境中
fory = pyfory.Fory(xlang=False, ref=True, strict=False)
```

如果确实需要使用 `strict=False`，请配置 `DeserializationPolicy`：

```python
from pyfory import DeserializationPolicy

class SafePolicy(DeserializationPolicy):
    def validate_class(self, cls, is_local, **kwargs):
        # 阻止危险模块
        if cls.__module__ in {'subprocess', 'os', '__builtin__'}:
            raise ValueError(f"已阻止：{cls}")
        return None

fory = pyfory.Fory(xlang=False, strict=False, policy=SafePolicy())
```

## 最大深度保护

限制反序列化深度以防止栈溢出攻击：

```python
fory = pyfory.Fory(
    strict=True,
    max_depth=100  # 根据数据结构深度调整
)
```

## 最佳实践

1. **生产环境始终使用 `strict=True`**
2. **使用 `type_id` 提高性能**，使用 `typename` 提高灵活性
3. **在任何序列化之前预先注册所有类型**
4. **根据数据结构设置适当的 `max_depth`**
5. **必要时使用 `DeserializationPolicy`** 当需要 `strict=False` 时

## 相关主题

- [配置](configuration.md) - Fory 参数
- [安全性](configuration.md) - DeserializationPolicy 详情
- [自定义序列化器](custom-serializers.md) - 自定义序列化
