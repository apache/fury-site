---
title: Schema 演化
sidebar_position: 6
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

Apache Fory™ 在兼容模式下支持 schema 演化，允许在保持兼容性的同时添加/删除字段。

## 启用兼容模式

```python
import pyfory

f = pyfory.Fory(xlang=True, compatible=True)
```

## Schema 演化示例

```python
import pyfory
from dataclasses import dataclass

# 版本 1：原始类
@dataclass
class User:
    name: str
    age: int

f = pyfory.Fory(xlang=True, compatible=True)
f.register(User, typename="User")
data = f.dumps(User("Alice", 30))

# 版本 2：添加新字段（向后兼容）
@dataclass
class User:
    name: str
    age: int
    email: str = "unknown@example.com"  # 带默认值的新字段

# 仍然可以反序列化旧数据
user = f.loads(data)
print(user.email)  # "unknown@example.com"
```

## 支持的变更

- **添加新字段**：带默认值
- **删除字段**：具有额外字段的旧数据将被跳过
- **重新排序字段**：字段按名称匹配，而不是位置

## 最佳实践

1. **始终为新字段提供默认值**
2. **使用 typename 实现跨语言兼容性**
3. **在部署前测试 schema 变更**
4. **为团队记录 schema 版本**

## 相关主题

- [配置](configuration.md) - 兼容模式设置
- [跨语言](xlang-serialization.md) - 跨语言的 schema 演化
- [类型注册](type-registration.md) - 注册模式
