---
title: 带外序列化
sidebar_position: 11
id: out-of-band
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

Fory 支持兼容 pickle5 的带外缓冲区序列化，可通过零拷贝高效处理大型数据结构。

## 概述

带外序列化将元数据与实际数据缓冲区分离，可以实现：

- 使用 `memoryview` 通过网络或 IPC 发送数据时进行**零拷贝传输**
- 提升大型数据集的性能
- 使用 `pickle.PickleBuffer` 实现 **Pickle5 兼容**
- **灵活的流支持**——可写入任意可写对象（文件、BytesIO、socket 等）

## 基础带外序列化

```python
import pyfory
import numpy as np

fory = pyfory.Fory(xlang=False, ref=False, strict=False)

# Large numpy array
array = np.arange(10000, dtype=np.float64)

# Serialize with out-of-band buffers
buffer_objects = []
serialized_data = fory.serialize(array, buffer_callback=buffer_objects.append)

# Convert buffer objects to memoryview for zero-copy transmission
# For contiguous buffers (bytes, numpy arrays), this is zero-copy
# For non-contiguous data, a copy may be created to ensure contiguity
buffers = [obj.getbuffer() for obj in buffer_objects]

# Deserialize with out-of-band buffers (accepts memoryview, bytes, or Buffer)
deserialized_array = fory.deserialize(serialized_data, buffers=buffers)

assert np.array_equal(array, deserialized_array)
```

## Pandas DataFrame 带外序列化

```python
import pyfory
import pandas as pd
import numpy as np

fory = pyfory.Fory(xlang=False, ref=False, strict=False)

# Create a DataFrame with numeric columns
df = pd.DataFrame({
    'a': np.arange(1000, dtype=np.float64),
    'b': np.arange(1000, dtype=np.int64),
    'c': ['text'] * 1000
})

# Serialize with out-of-band buffers
buffer_objects = []
serialized_data = fory.serialize(df, buffer_callback=buffer_objects.append)
buffers = [obj.getbuffer() for obj in buffer_objects]

# Deserialize
deserialized_df = fory.deserialize(serialized_data, buffers=buffers)

assert df.equals(deserialized_df)
```

## 选择性带外序列化

通过回调控制哪些缓冲区走带外路径：返回 `True` 将数据保留在带内，返回 `False` 则带外发送：

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
    # Only send even-numbered buffers out-of-band
    if counter % 2 == 0:
        buffer_objects.append(buffer_object)
        return False  # Out-of-band
    return True  # In-band

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

# PickleBuffer objects are automatically supported
data = b"Large binary data"
pickle_buffer = pickle.PickleBuffer(data)

# Serialize with buffer callback for out-of-band handling
buffer_objects = []
serialized = fory.serialize(pickle_buffer, buffer_callback=buffer_objects.append)
buffers = [obj.getbuffer() for obj in buffer_objects]

# Deserialize with buffers
deserialized = fory.deserialize(serialized, buffers=buffers)
assert bytes(deserialized.raw()) == data
```

## 将缓冲区写入不同的流

`BufferObject.write_to()` 方法接受任意可写流对象：

```python
import pyfory
import numpy as np
import io

fory = pyfory.Fory(xlang=False, ref=False, strict=False)

array = np.arange(1000, dtype=np.float64)

# Collect out-of-band buffers
buffer_objects = []
serialized = fory.serialize(array, buffer_callback=buffer_objects.append)

# Write to different stream types
for buffer_obj in buffer_objects:
    # Write to BytesIO (in-memory stream)
    bytes_stream = io.BytesIO()
    buffer_obj.write_to(bytes_stream)

    # Write to file
    with open('/tmp/buffer_data.bin', 'wb') as f:
        buffer_obj.write_to(f)

    # Get zero-copy memoryview (for contiguous buffers)
    mv = buffer_obj.getbuffer()
    assert isinstance(mv, memoryview)
```

**注意**：对于连续内存缓冲区（如 bytes、numpy 数组），`getbuffer()` 返回零拷贝 `memoryview`。对于不连续数据，可能会创建副本以保证连续性。

## 相关主题

- [NumPy 集成](numpy-integration.md) - NumPy 数组序列化
- [基础序列化](core-api.md) - 标准序列化
- [配置](configuration.md) - Fory 参数
