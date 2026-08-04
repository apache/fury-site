---
title: 故障排查
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

本文介绍使用跨语言序列化时的常见问题及解决方案。

## 类型注册错误

### “Type not registered”错误

**现象：**

```
Error: Type 'example.Person' is not registered
```

**原因：**反序列化前未注册类型，或类型名称不匹配。

**解决方案：**

1. 确保两端使用相同名称注册类型：

   ```java
   // Java
   fory.register(Person.class, "example.Person");
   ```

   ```python
   # Python
   fory.register_type(Person, name="example.Person")
   ```

2. 检查类型名称是否存在拼写错误或大小写差异

3. 在任何序列化或反序列化调用之前注册类型

### “Type ID mismatch”错误

**现象：**

```
Error: Expected type ID 100, got 101
```

**原因：**不同语言使用了不同的类型 ID。

**解决方案：**使用一致的类型 ID：

```java
// Java
fory.register(Person.class, 100);
fory.register(Address.class, 101);
```

```python
# Python
fory.register_type(Person, type_id=100)
fory.register_type(Address, type_id=101)
```

## 类型映射问题

### 整数溢出

**现象：**值被意外截断或回绕。

**原因：**不同语言使用了不同宽度的整数。

**解决方案：**

1. 在 Python 中使用显式类型注解：

   ```python
   @dataclass
   class Data:
       value: pyfory.Int32  # Not just 'int'
   ```

2. 确保整数范围兼容：
   - `int8`: -128 to 127
   - `int16`: -32,768 to 32,767
   - `int32`: -2,147,483,648 to 2,147,483,647

### 浮点精度损失

**现象：**浮点值的精度与预期不符。

**原因：**混用了 `float32` 和 `float64` 类型。

**解决方案：**

1. 使用一致的浮点类型：

   ```python
   @dataclass
   class Data:
       value: pyfory.Float32  # Explicit 32-bit float
   ```

2. 注意 Python 的 `float` 默认映射为 `float64`

### 字符串编码错误

**现象：**

```
Error: Invalid UTF-8 sequence
```

**原因：**字符串未使用 UTF-8 编码。

**解决方案：**

1. 确保所有字符串都是有效的 UTF-8
2. 在 Python 中，序列化前先解码字节：

   ```python
   text = raw_bytes.decode('utf-8')
   ```

## 字段顺序问题

### “Field mismatch”错误

**现象：**反序列化对象的字段值错误。

**原因：**不同语言的字段顺序不同。

**解决方案：**Fory 按字段的 snake_case 名称排序。请确保字段名称一致：

```java
// Java - fields will be sorted: age, email, name
public class Person {
    public String name;
    public int age;
    public String email;
}
```

```python
# Python - same field order
@dataclass
class Person:
    name: str
    age: pyfory.Int32
    email: str
```

## 引用跟踪问题

### 循环引用导致栈溢出

**现象：**

```
StackOverflowError or RecursionError
```

**原因：**引用跟踪已禁用，但数据包含循环引用。

**解决方案：**启用引用跟踪：

```java
// Java
Fory fory = Fory.builder()
    .withRefTracking(true)
    .build();
```

```python
# Python
fory = pyfory.Fory(ref=True)
```

### 对象重复

**现象：**反序列化后，共享对象变成了多个副本。

**原因：**引用跟踪已禁用。

**解决方案：**对象图中存在共享对象时启用引用跟踪。

## 跨语言类型问题

### 跨语言模式中的不兼容类型

**现象：**

```
Error: Type 'Optional' is not supported in xlang mode
```

**原因：**使用了没有跨语言对应类型的 Java 专属类型。

**解决方案：**使用兼容类型：

```java
// Instead of Optional<String>
public String email;  // nullable

// Instead of BigDecimal
public double amount;

// Instead of EnumSet<Status>
public Set<Status> statuses;
```

## 版本兼容性

### Schema 哈希不匹配

**现象：**反序列化失败，并出现 `class version hash mismatch`、`schema version mismatch`、`struct version mismatch` 或 `hash mismatch` 等错误。

**原因：**写入端和读取端禁用了兼容模式，但它们的结构体/类 Schema 不同。在跨语言模式下，即使每种语言都进行了合理的本地更改，也可能出现这种情况，因为字段名称、类型注解、字段 ID、可空性和生成的 Schema 元数据仍必须完全一致。

**解决方案：**

1. 仔细对齐每个服务和语言中的 Schema：字段名称或字段 ID、字段顺序、类型注解、可空性以及类型注册 ID/名称。
2. 当前实现的跨语言模式默认使用兼容模式。如果某个对等端显式选择了 `compatible=false`，请移除该覆盖设置，或在每个对等端启用兼容模式。兼容模式会写入额外的 Schema 元数据，因此载荷更大，但建议可能独立演进的跨语言服务使用该模式。
3. 只有每个读取端和写入端始终使用相同 Schema 时，才设置 `compatible=false`。对于跨语言载荷，只有确认每种语言都使用该 Schema，或原生类型由 Fory Schema IDL 生成时才这样做。

### 序列化格式已更改

**现象：**升级 Fory 后反序列化失败。

**原因：**序列化格式发生了破坏性变更。

**解决方案：**

1. 确保所有服务使用兼容的 Fory 版本
2. 查看发行说明中的破坏性变更
3. 考虑使用 Schema 演进（兼容模式）进行渐进式升级

## 调试技巧

### 启用调试日志

**Java:**

```java
// Add to JVM options
-Dfory.debug=true
```

**Python:**

```python
import logging
logging.getLogger('pyfory').setLevel(logging.DEBUG)
```

### 检查序列化数据

使用十六进制转储检查二进制格式：

```python
data = fory.serialize(obj)
print(data.hex())
```

### 测试往返序列化

始终在每种语言中测试往返序列化：

```java
byte[] bytes = fory.serialize(obj);
Object result = fory.deserialize(bytes);
assert obj.equals(result);
```

### 跨语言测试

部署前测试所有目标语言之间的序列化：

```bash
# Serialize in Java
java -jar serializer.jar > data.bin

# Deserialize in Python
python deserializer.py data.bin
```

## 常见错误

1. **未注册类型**：始终在使用前注册自定义类型
2. **类型名称/ID 不一致**：所有语言使用相同的名称/ID
3. **混用跨语言和原生载荷**：确保每个对等端都使用跨语言编码格式
4. **类型注解错误**：在 Python 中使用 `pyfory.Int32` 等标记
5. **忽略引用跟踪**：存在循环引用或共享引用时启用

## 另请参阅

- [类型映射](../../specification/xlang_type_mapping.md) - 跨语言类型映射参考
- [快速入门](../../start/index.md) - 运行时设置指南
- [Java 故障排查](../java/troubleshooting.md) - Java 专属问题
- [Python 故障排查](../python/troubleshooting.md) - Python 专属问题
