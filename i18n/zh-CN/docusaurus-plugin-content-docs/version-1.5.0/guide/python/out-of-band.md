---
title: 带外序列化
sidebar_position: 7
id: out_of_band
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

Fory 支持 pickle5 兼容的带外缓冲区序列化，用于高效零拷贝处理大型数据结构。

## 概述

带外序列化将元数据与实际数据缓冲区分离，允许：

- **零拷贝传输**：使用 `memoryview` 通过网络或 IPC 发送数据时
- **提高性能**：用于大型数据集
- **Pickle5 兼容性**：使用 `pickle.PickleBuffer`
- **灵活的流支持**：写入任何可写对象（文件、BytesIO、套接字等）

## 基础带外序列化

```python
import pyfory
import numpy as np

fory = pyfory.Fory(xlang=False, ref=False, strict=False)

# 大型 numpy 数组
array = np.arange(10000, dtype=np.float64)

# 使用带外缓冲区序列化
buffer_objects = []
serialized_data = fory.serialize(array, buffer_callback=buffer_objects.append)

# 将缓冲区对象转换为 memoryview 以进行零拷贝传输
# 对于连续缓冲区（bytes、numpy 数组），这是零拷贝
# 对于非连续数据，可能会创建副本以确保连续性
buffers = [obj.getbuffer() for obj in buffer_objects]

# 使用带外缓冲区反序列化（接受 memoryview、bytes 或 Buffer）
deserialized_array = fory.deserialize(serialized_data, buffers=buffers)

assert np.array_equal(array, deserialized_array)
```

## 使用 Pandas DataFrame 的带外序列化

```python
import pyfory
import pandas as pd
import numpy as np

fory = pyfory.Fory(xlang=False, ref=False, strict=False)

# 创建带数值列的 DataFrame
df = pd.DataFrame({
    'a': np.arange(1000, dtype=np.float64),
    'b': np.arange(1000, dtype=np.int64),
    'c': ['text'] * 1000
})

# 使用带外缓冲区序列化
buffer_objects = []
serialized_data = fory.serialize(df, buffer_callback=buffer_objects.append)
buffers = [obj.getbuffer() for obj in buffer_objects]

# 反序列化
deserialized_df = fory.deserialize(serialized_data, buffers=buffers)

assert df.equals(deserialized_df)
```

## 选择性带外序列化

通过提供回调来控制哪些缓冲区带外传输，该回调返回 `True` 保持数据内联或返回 `False` 带外发送：

```python
import pyfory
import numpy as np

fory = pyfory.Fory(xlang=False, ref=True, strict=False)

arr1 = np.arange(1000, dtype=np.float64)
arr2 = np.arange(2000, dtype=np.float64)
data = [arr1, arr2]

buffer_objects = []
counter = 0

def selective_callback(buffer_object):
    global counter
    counter += 1
    # 只有偶数编号的缓冲区带外发送
    if counter % 2 == 0:
        buffer_objects.append(buffer_object)
        return False  # 带外
    return True  # 内联

serialized = fory.serialize(data, buffer_callback=selective_callback)
buffers = [obj.getbuffer() for obj in buffer_objects]
deserialized = fory.deserialize(serialized, buffers=buffers)
```

## Pickle5 兼容性

Fory 的带外序列化完全兼容 pickle 协议 5：

```python
import pyfory
import pickle

fory = pyfory.Fory(xlang=False, ref=False, strict=False)

# 自动支持 PickleBuffer 对象
data = b"Large binary data"
pickle_buffer = pickle.PickleBuffer(data)

# 使用缓冲区回调序列化以进行带外处理
buffer_objects = []
serialized = fory.serialize(pickle_buffer, buffer_callback=buffer_objects.append)
buffers = [obj.getbuffer() for obj in buffer_objects]

# 使用缓冲区反序列化
deserialized = fory.deserialize(serialized, buffers=buffers)
assert bytes(deserialized.raw()) == data
```

## 将缓冲区写入不同的流

`BufferObject.write_to()` 方法接受任何可写流对象：

```python
import pyfory
import numpy as np
import io

fory = pyfory.Fory(xlang=False, ref=False, strict=False)

array = np.arange(1000, dtype=np.float64)

# 收集带外缓冲区
buffer_objects = []
serialized = fory.serialize(array, buffer_callback=buffer_objects.append)

# 写入不同的流类型
for buffer_obj in buffer_objects:
    # 写入 BytesIO（内存流）
    bytes_stream = io.BytesIO()
    buffer_obj.write_to(bytes_stream)

    # 写入文件
    with open('/tmp/buffer_data.bin', 'wb') as f:
        buffer_obj.write_to(f)

    # 获取零拷贝 memoryview（用于连续缓冲区）
    mv = buffer_obj.getbuffer()
    assert isinstance(mv, memoryview)
```

**注意**：对于连续内存缓冲区（如 bytes、numpy 数组），`getbuffer()` 返回零拷贝 `memoryview`。对于非连续数据，可能会创建副本以确保连续性。

## 相关主题

- [NumPy 集成](numpy-integration.md) - NumPy 数组序列化
- [基础序列化](basic-serialization.md) - 标准序列化
- [配置](configuration.md) - Fory 参数
