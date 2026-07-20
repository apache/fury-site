---
title: 故障排除
sidebar_position: 13
id: troubleshooting
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

本页介绍常见问题及其解决方案。

## 常见问题

### 格式功能的 ImportError

```python
# 解决方案：安装行格式支持
pip install pyfory[format]

# 或从源码安装格式支持
pip install -e ".[format]"
```

### 序列化性能慢

```python
# 检查是否启用了 Cython 加速
import pyfory
print(pyfory.ENABLE_FORY_CYTHON_SERIALIZATION)  # 应该为 True

# 如果为 False，Cython 扩展可能未正确编译
# 重新安装：pip install --force-reinstall --no-cache-dir pyfory
```

### 跨语言兼容性问题

```python
# 使用一致的命名进行显式类型注册
f = pyfory.Fory(xlang=True)
f.register(MyClass, typename="com.package.MyClass")  # 在所有语言中使用相同的名称
```

### 循环引用错误或重复数据

```python
# 启用引用跟踪
f = pyfory.Fory(ref=True)  # 循环引用所需

# 循环引用示例
class Node:
    def __init__(self, value):
        self.value = value
        self.next = None

node1 = Node(1)
node2 = Node(2)
node1.next = node2
node2.next = node1  # 循环引用

data = f.dumps(node1)
result = f.loads(data)
assert result.next.next is result  # 循环引用被保留
```

### Schema 演化不工作

```python
# 启用兼容模式用于 schema 演化
f = pyfory.Fory(xlang=True, compatible=True)

# 版本 1：原始类
@dataclass
class User:
    name: str
    age: int

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

### 严格模式下的类型注册错误

```python
# 在序列化之前注册所有自定义类型
f = pyfory.Fory(strict=True)

# 使用前必须注册
f.register(MyClass, type_id=100)
f.register(AnotherClass, type_id=101)

# 或禁用严格模式（生产环境不推荐）
f = pyfory.Fory(strict=False)  # 仅在受信任的环境中使用
```

## 调试模式

在导入 pyfory 之前设置环境变量以禁用 Cython 进行调试：

```python
import os
os.environ['ENABLE_FORY_CYTHON_SERIALIZATION'] = '0'
import pyfory  # 现在使用纯 Python 实现

# 这对以下情况很有用：
# 1. 调试协议问题
# 2. 理解序列化行为
# 3. 无需重新编译 Cython 的开发
```

## 错误处理

优雅地处理常见的序列化错误：

```python
import pyfory
from pyfory.error import TypeUnregisteredError, TypeNotCompatibleError

fory = pyfory.Fory(strict=True)

try:
    data = fory.dumps(my_object)
except TypeUnregisteredError as e:
    print(f"类型未注册：{e}")
    # 注册类型并重试
    fory.register(type(my_object), type_id=100)
    data = fory.dumps(my_object)
except Exception as e:
    print(f"序列化失败：{e}")

try:
    obj = fory.loads(data)
except TypeNotCompatibleError as e:
    print(f"Schema 不匹配：{e}")
    # 处理版本不匹配
except Exception as e:
    print(f"反序列化失败：{e}")
```

## 开发环境设置

```bash
git clone https://github.com/apache/fory.git
cd fory/python

# 安装依赖
pip install -e ".[dev,format]"

# 运行测试
pytest -v -s .

# 运行特定测试
pytest -v -s pyfory/tests/test_serializer.py

# 格式化代码
ruff format .
ruff check --fix .
```

## 相关主题

- [配置](configuration.md) - Fory 参数
- [类型注册](type-registration.md) - 注册最佳实践
- [安全性](configuration.md) - 安全配置
