---
title: 故障排除
sidebar_position: 90
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

本页介绍常见问题及其解决方法。

## 常见问题

### Format 功能出现 ImportError

```python
# Solution: Install Row format support
pip install pyfory[format]

# Or install from source with format support
pip install -e ".[format]"
```

### 序列化性能缓慢

```python
# Check if Cython acceleration is enabled
import pyfory
print(pyfory.ENABLE_FORY_CYTHON_SERIALIZATION)  # Should be True

# If False, Cython extension may not be compiled correctly
# Reinstall with: pip install --force-reinstall --no-cache-dir pyfory
```

### 跨语言兼容性问题

```python
# Use explicit type registration with consistent naming
f = pyfory.Fory(xlang=True)
f.register(MyClass, name="com.package.MyClass")  # Use same name in all languages
```

### 循环引用错误或数据重复

如果对象标识或循环很重要，已注册的跨语言 Schema 对象和 Python 原生对象都需要引用跟踪：

```python
# Enable reference tracking for registered schema objects.
f = pyfory.Fory(ref=True)
```

对于包含循环引用的任意 Python 对象图，请使用 Python 原生模式：

```python
f = pyfory.Fory(xlang=False, ref=True, strict=False)

# Example with circular reference
class Node:
    def __init__(self, value):
        self.value = value
        self.next = None

node1 = Node(1)
node2 = Node(2)
node1.next = node2
node2.next = node1  # Circular reference

data = f.dumps(node1)
result = f.loads(data)
assert result.next.next is result  # Circular reference preserved
```

### Schema 演进未生效

```python
# Keep compatible mode enabled. This is the default.
f = pyfory.Fory()

# Version 1: Original class
@dataclass
class User:
    name: str
    age: pyfory.Int32

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

### 严格模式下的类型注册错误

```python
# Register all custom types before serialization
f = pyfory.Fory(strict=True)

# Must register before use
f.register(MyClass, type_id=100)
f.register(AnotherClass, type_id=101)

# Or disable strict mode (NOT recommended for production)
f = pyfory.Fory(strict=False)  # Use only in trusted environments
```

## 调试模式

为便于调试，可在导入 pyfory **之前**设置环境变量以禁用 Cython：

```python
import os
os.environ['ENABLE_FORY_CYTHON_SERIALIZATION'] = '0'
import pyfory  # Now uses pure Python implementation

# This is useful for:
# 1. Debugging protocol issues
# 2. Understanding serialization behavior
# 3. Development without recompiling Cython
```

## 错误处理

妥善处理常见序列化错误：

```python
import pyfory
from pyfory.error import TypeUnregisteredError, TypeNotCompatibleError

fory = pyfory.Fory(strict=True)

try:
    data = fory.dumps(my_object)
except TypeUnregisteredError as e:
    print(f"Type not registered: {e}")
    # Register the type and retry
    fory.register(type(my_object), type_id=100)
    data = fory.dumps(my_object)
except Exception as e:
    print(f"Serialization failed: {e}")

try:
    obj = fory.loads(data)
except TypeNotCompatibleError as e:
    print(f"Schema mismatch: {e}")
    # Handle version mismatch
except Exception as e:
    print(f"Deserialization failed: {e}")
```

## 开发环境设置

```bash
git clone https://github.com/apache/fory.git
cd fory/python

# Install dependencies
pip install -e ".[dev,format]"

# Run tests
pytest -v -s .

# Run specific test
pytest -v -s pyfory/tests/test_serializer.py

# Format code
ruff format .
ruff check --fix .
```

## 相关主题

- [配置](configuration.md) - Fory 参数
- [类型注册](type-registration.md) - 注册最佳实践
- [对象序列化安全](../security.md) - 安全配置
