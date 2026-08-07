---
title: 安全
sidebar_position: 99
id: security
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

当 Python 读取端接收来自应用信任边界之外的字节时，请遵循本页说明。Fory 会重建应用值，
但不会验证发送者身份、保护传输完整性，也不会判断一个合法值是否获准用于某项业务操作。

## 应用边界

反序列化之前：

- 在传输层或存储层验证发送者身份并保护消息完整性。
- 在 Fory 外部限制请求或文件大小、超时时间和并发量。
- 只注册端点允许的应用类型，并在第一次根操作之前完成读取端配置。
- 使用反序列化结果之前，根据应用的授权规则和领域规则验证该值。

## 内置保护

应像对待不可信 pickle 字节一样对待来自不可信来源的原生模式字节。设置 `strict=False` 时，原生模式可以重建 Python 对象、导入模块、调用归约钩子以及重建动态类或函数。

### 生产配置

生产载荷应保持 `strict=True`，除非整个数据来源都可信，并由 `DeserializationPolicy` 负责其余信任决策：

```python
import pyfory

fory = pyfory.Fory(
    xlang=True,
    ref=False,
    strict=True,
    max_depth=50,
    max_type_fields=512,
    max_type_meta_bytes=4096,
    max_schema_versions_per_type=10,
    max_average_schema_versions_per_type=3,
    max_graph_memory_bytes=128 * 1024 * 1024,
)

fory.register(UserModel, name="example.User")
fory.register(OrderModel, name="example.Order")
```

仅对可信的仅限 Python 载荷使用动态原生模式反序列化（`strict=False`）：

```python
import pyfory

fory = pyfory.Fory(
    xlang=False,
    ref=True,
    strict=False,
    max_depth=100,
)
```

接收的远程元数据也受到限制：

- `max_type_fields` 限制单个已接收结构体元数据正文可接受的字段数。
- `max_type_meta_bytes` 限制单个已接收 TypeDef 正文可接受的编码正文字节数。
- `max_schema_versions_per_type` 限制每个逻辑类型可接受的远程元数据版本。
- `max_average_schema_versions_per_type` 限制所有已接受远程类型的平均值。
- `max_graph_memory_bytes` 为单次根反序列化期间实例化的对象图内存设置近似门限。估算主要覆盖列表、元组、集合、字典、对象数组、结构体和 Python 对象。它会跳过字符串、二进制数据、原始标量和稠密原始类型数组等叶子值，因此实际进程内存可能高于该值。叶子值仍受字节可用性检查保护：如果未读取的输入没有足够字节，Fory 不会读取或创建该叶子值。所有根输入形式的默认值固定为 `128 MiB`。可信载荷确实需要更大或更小门限时，请设置正数字节值。
- `max_unbacked_container_items` 限制单次根反序列化中重复读取正文没有消耗相应输入的集合元素和映射条目。默认值为 `8192`；零表示严格限制。

这些限制不会改变 `strict`、`policy`、动态加载、未知类处理或 Schema 演进语义。

### DeserializationPolicy

必须使用 `strict=False` 时，请使用 `DeserializationPolicy` 限制反序列化期间接受的动态类型和钩子：

```python
import pyfory
from pyfory import DeserializationPolicy

dangerous_modules = {"subprocess", "os", "__builtin__"}

class SafeDeserializationPolicy(DeserializationPolicy):
    def validate_class(self, cls, is_local, **kwargs):
        if cls.__module__ in dangerous_modules:
            raise ValueError(f"Blocked dangerous class: {cls.__module__}.{cls.__name__}")

    def intercept_reduce_call(self, callable_obj, args, **kwargs):
        if getattr(callable_obj, "__name__", "") == "Popen":
            raise ValueError("Blocked attempt to invoke subprocess.Popen")
        return None

    def intercept_setstate(self, obj, state, **kwargs):
        if isinstance(state, dict) and "password" in state:
            state["password"] = "***REDACTED***"
        return None

policy = SafeDeserializationPolicy()
fory = pyfory.Fory(xlang=False, ref=True, strict=False, policy=policy)
```

可用的策略钩子包括：

引用验证钩子通过抛出异常拒绝输入；不拒绝时，保持反序列化后的引用不变。

| 钩子                                         | 说明                                   |
| -------------------------------------------- | -------------------------------------- |
| `validate_class(cls, is_local)`              | 验证或阻止类类型                       |
| `validate_module(module_name, is_local)`     | 验证或阻止模块导入                     |
| `validate_function(func, is_local)`          | 验证或阻止函数引用                     |
| `validate_method(method, is_local)`          | 验证或阻止方法引用                     |
| `intercept_reduce_call(callable_obj, args)`  | 拦截 `__reduce__` 调用                 |
| `inspect_reduced_object(obj)`                | 检查或替换通过 `__reduce__` 创建的对象 |
| `intercept_setstate(obj, state)`             | 在 `__setstate__` 前清理状态           |
| `authorize_instantiation(cls, args, kwargs)` | 控制类实例化                           |

### 安全检查清单

- 对不可信数据保持 `strict=True`。
- 反序列化前注册所有预期的应用类型。
- 使用 `DeserializationPolicy` 约束必须设置 `strict=False` 的场景。
- 将 `max_depth` 保持在足以拒绝异常深度载荷的较低值。
- 对多数输入，将 `max_graph_memory_bytes` 保持为固定的 `128 MiB` 默认值；对于合法集合/映射/结构体大小不同的可信工作负载，则设置显式正数门限。
- 不要将跨语言/原生模式选择视为安全控制。

## 验证

除正常往返测试外，还应为边界添加负向测试。确认配置后的读取端会拒绝意外的应用类型、
过深的嵌套、超出资源限制的输入以及格式错误的输入。一次读取失败后，还应确认同一 Fory 实例
仍能正确读取下一个合法根值。

完整选项请参阅[配置](configuration.md)，Fory 注册 API 请参阅[类型注册](type-registration.md)。
