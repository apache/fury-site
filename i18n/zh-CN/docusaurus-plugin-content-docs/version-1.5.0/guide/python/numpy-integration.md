---
title: NumPy 与科学计算
sidebar_position: 8
id: numpy_integration
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

Fory 原生支持 numpy 数组，提供优化的序列化。

## NumPy 数组序列化

大型数组在可能的情况下使用零拷贝：

```python
import pyfory
import numpy as np

f = pyfory.Fory()

# 原生支持 Numpy 数组
arrays = {
    'matrix': np.random.rand(1000, 1000),
    'vector': np.arange(10000),
    'bool_mask': np.random.choice([True, False], size=5000)
}

data = f.serialize(arrays)
result = f.deserialize(data)

# 对于兼容的数组类型使用零拷贝
assert np.array_equal(arrays['matrix'], result['matrix'])
```

## Pandas DataFrame

Fory 可以高效序列化 Pandas DataFrame：

```python
import pyfory
import pandas as pd
import numpy as np

f = pyfory.Fory(xlang=False, ref=False, strict=False)

df = pd.DataFrame({
    'a': np.arange(1000, dtype=np.float64),
    'b': np.arange(1000, dtype=np.int64),
    'c': ['text'] * 1000
})

data = f.serialize(df)
result = f.deserialize(data)

assert df.equals(result)
```

## 使用带外缓冲区的零拷贝

对于大型数组的最大性能，使用带外序列化：

```python
import pyfory
import numpy as np

f = pyfory.Fory(xlang=False, ref=False, strict=False)

# 大型数组
array = np.random.rand(10000, 1000)

# 带外零拷贝
buffer_objects = []
data = f.serialize(array, buffer_callback=buffer_objects.append)
buffers = [obj.getbuffer() for obj in buffer_objects]

result = f.deserialize(data, buffers=buffers)
assert np.array_equal(array, result)
```

## 支持的数组类型

- `np.ndarray`（所有 dtype）
- `np.matrix`
- 结构化数组
- 记录数组

## 相关主题

- [带外序列化](out-of-band.md) - 零拷贝缓冲区
- [基础序列化](basic-serialization.md) - 标准用法
