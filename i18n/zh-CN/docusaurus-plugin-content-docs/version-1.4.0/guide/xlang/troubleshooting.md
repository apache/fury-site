---
title: 故障排查
sidebar_position: 6
id: xlang_troubleshooting
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

本页涵盖了使用跨语言序列化时的常见问题和解决方案。

## 类型注册错误

### "类型未注册"错误

**症状：**

```
Error: Type 'example.Person' is not registered
```

**原因：** 在反序列化之前未注册类型，或类型名称不匹配。

**解决方案：**

1. 确保类型在双方使用相同的名称注册：

   ```java
   // Java
   fory.register(Person.class, "example.Person");
   ```

   ```python
   # Python
   fory.register_type(Person, typename="example.Person")
   ```

2. 检查类型名称中的拼写错误或大小写差异

3. 在任何序列化/反序列化调用之前注册类型

### "类型 ID 不匹配"错误

**症状：**

```
Error: Expected type ID 100, got 101
```

**原因：** 跨语言使用了不同的类型 ID。

**解决方案：** 使用一致的类型 ID：

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

**症状：** 值被截断或意外包装。

**原因：** 跨语言使用了不同的整数大小。

**解决方案：**

1. 在 Python 中，使用显式类型注解：

   ```python
   @dataclass
   class Data:
       value: pyfory.Int32Type  # 而不仅仅是 'int'
   ```

2. 确保整数范围兼容：
   - `int8`：-128 到 127
   - `int16`：-32,768 到 32,767
   - `int32`：-2,147,483,648 到 2,147,483,647

### 浮点精度损失

**症状：** 浮点值的精度出乎意料。

**原因：** 混合使用 `float32` 和 `float64` 类型。

**解决方案：**

1. 使用一致的浮点类型：

   ```python
   @dataclass
   class Data:
       value: pyfory.Float32Type  # 显式 32 位浮点数
   ```

2. 请注意，Python 的 `float` 默认映射到 `float64`

### 字符串编码错误

**症状：**

```
Error: Invalid UTF-8 sequence
```

**原因：** 非 UTF-8 编码的字符串。

**解决方案：**

1. 确保所有字符串都是有效的 UTF-8
2. 在 Python 中，在序列化之前解码字节：

   ```python
   text = raw_bytes.decode('utf-8')
   ```

## 字段顺序问题

### "字段不匹配"错误

**症状：** 反序列化的对象具有错误的字段值。

**原因：** 语言之间的字段顺序不同。

**解决方案：** Fory 按字段的 snake_cased 名称对字段进行排序。确保字段名称一致：

```java
// Java - 字段将按以下顺序排序：age、email、name
public class Person {
    public String name;
    public int age;
    public String email;
}
```

```python
# Python - 相同的字段顺序
@dataclass
class Person:
    name: str
    age: pyfory.Int32Type
    email: str
```

## 引用跟踪问题

### 循环引用导致栈溢出

**症状：**

```
StackOverflowError 或 RecursionError
```

**原因：** 引用跟踪被禁用，但数据具有循环引用。

**解决方案：** 启用引用跟踪：

```java
// Java
Fory fory = Fory.builder()
    .withLanguage(Language.XLANG)
    .withRefTracking(true)
    .build();
```

```python
# Python
fory = pyfory.Fory(ref_tracking=True)
```

### 重复对象

**症状：** 共享对象在反序列化后被重复。

**原因：** 引用跟踪被禁用。

**解决方案：** 如果对象在图中共享，请启用引用跟踪。

## 语言模式问题

### "无效的魔术数字"错误

**症状：**

```
Error: Invalid magic number in header
```

**原因：** 一方使用 Java 原生模式而不是 xlang 模式。

**解决方案：** 确保双方都使用 xlang 模式：

```java
// Java - 必须使用 Language.XLANG
Fory fory = Fory.builder()
    .withLanguage(Language.XLANG)
    .build();
```

### Xlang 模式中的不兼容类型

**症状：**

```
Error: Type 'Optional' is not supported in xlang mode
```

**原因：** 使用了没有跨语言等效项的 Java 特定类型。

**解决方案：** 使用兼容的类型：

```java
// 而不是 Optional<String>
public String email;  // nullable

// 而不是 BigDecimal
public double amount;

// 而不是 EnumSet<Status>
public Set<Status> statuses;
```

## 版本兼容性

### 序列化格式已更改

**症状：** 升级 Fory 后反序列化失败。

**原因：** 序列化格式中的破坏性更改。

**解决方案：**

1. 确保所有服务使用兼容的 Fory 版本
2. 检查发布说明中的破坏性更改
3. 考虑使用 schema 演化（compatible 模式）进行渐进式升级

## 调试技巧

### 启用调试日志

**Java：**

```java
// 添加到 JVM 选项
-Dfory.debug=true
```

**Python：**

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

### 测试往返

始终在每种语言中测试往返序列化：

```java
byte[] bytes = fory.serialize(obj);
Object result = fory.deserialize(bytes);
assert obj.equals(result);
```

### 跨语言测试

在部署之前测试所有目标语言的序列化：

```bash
# 在 Java 中序列化
java -jar serializer.jar > data.bin

# 在 Python 中反序列化
python deserializer.py data.bin
```

## 常见错误

1. **未注册类型**：始终在使用前注册自定义类型
2. **类型名称/ID 不一致**：在所有语言中使用相同的名称/ID
3. **忘记 xlang 模式**：在 Java 中使用 `Language.XLANG`
4. **错误的类型注解**：在 Python 中使用 `pyfory.Int32Type` 等
5. **忽略引用跟踪**：为循环/共享引用启用

## 另请参阅

- [类型映射](https://fory.apache.org/docs/specification/xlang_type_mapping) - 跨语言类型映射参考
- [入门指南](getting-started.md) - 设置指南
- [Java 故障排查](../java/troubleshooting.md) - Java 特定问题
- [Python 故障排查](../python/troubleshooting.md) - Python 特定问题
