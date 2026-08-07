---
title: Schema 元数据
sidebar_position: 7
id: schema-metadata
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

字段配置直接嵌入 `FORY_STRUCT`。字段条目可以是裸字段、包含成员名称和 `fory::F(...)` 构建器的元组，也可以是已配置的访问器属性：

```cpp
#include "fory/serialization/fory.h"

struct DataV2 {
  uint32_t id;
  uint64_t timestamp;
  std::optional<uint32_t> version;
};

FORY_STRUCT(DataV2, id, (timestamp, fory::F().tagged()), version);
```

访问器属性使用与数据成员相同的字段元数据：

```cpp
class Counter {
public:
  const uint32_t &value() const;
  Counter &value(uint32_t value);

  FORY_STRUCT(Counter, FORY_PROPERTY(value, fory::F().varint()));
};
```

该配置是编译期元数据，不会分配编解码器对象，也不会在序列化路径上增加虚分派。

## 字段标识

`fory::F()` 使用名称模式字段标识，裸字段也使用名称模式：

```cpp
FORY_STRUCT(DataV2, id, (timestamp, fory::F().tagged()), version);
FORY_STRUCT(Counter, FORY_PROPERTY(value, fory::F().varint()));
```

`fory::F(id)` 使用显式的 ID 字段标识。ID 必须为非负数：

```cpp
FORY_STRUCT(DataV2, (id, fory::F(0)), (timestamp, fory::F(1).tagged()),
            (version, fory::F(2)));
```

没有显式 ID 的字段仍使用其 snake_case 字段名称。在同一协议字段组中，显式 ID 排在基于名称的字段之前，因此一个 `FORY_STRUCT` 可以混用 `fory::F(id)`、`fory::F()` 和裸字段。

## 标量编码

整数编码可在字段或嵌套值节点规范上配置：

```cpp
struct Counters {
  uint32_t fixed_id;
  uint64_t tagged_time;
  int64_t signed_score;
};

FORY_STRUCT(Counters, (fixed_id, fory::F().fixed()),
            (tagged_time, fory::F().tagged()),
            (signed_score, fory::F().varint()));
```

支持的标量编码方法如下：

| 方法       | 含义                       |
| ---------- | -------------------------- |
| `fixed()`  | 在适用处使用定长整数编码   |
| `varint()` | 在适用处使用变长整数编码   |
| `tagged()` | 在适用处使用带标签整数编码 |

无效的标量/类型组合会在编译期失败。

## 嵌套规范

容器和包装载体中的值节点规范使用 `fory::T` 命名空间。无类型规范会推断该节点的实际 C++ 类型：

```cpp
namespace T = fory::T;

struct Foo {
  std::vector<uint32_t> values;
  std::map<uint32_t, std::vector<int64_t>> nested;
};

FORY_STRUCT(Foo,
            (values, fory::F().list(T::fixed())),
            (nested, fory::F().map(T::varint(),
                                   T::list(T::tagged()))));
```

有类型规范是可选的验证器，并明确指定预期节点类型：

```cpp
FORY_STRUCT(Foo, (nested, fory::F().map(T::uint32().varint(),
                                        T::list(T::int64().tagged()))));
```

支持以下递归组合方法：

| 方法                | 适用于                                                        |
| ------------------- | ------------------------------------------------------------- |
| `list(elem)`        | `std::vector<T>` 和类似列表的字段                             |
| `set(elem)`         | `std::set<T>` 和类似集合的字段                                |
| `map(key, value)`   | `std::map<K, V>`、`std::unordered_map<K, V>` 和类似映射的字段 |
| `map().key(spec)`   | 仅覆盖映射键                                                  |
| `map().value(spec)` | 仅覆盖映射值                                                  |
| `inner(child)`      | 透明的单子节点载体                                            |

只有键或值的一侧需要非默认编码时，部分映射覆盖非常有用：

```cpp
FORY_STRUCT(Foo,
            (nested, fory::F().map().key(T::varint())),
            (other, fory::F().map().value(T::list(T::tagged()))));
```

## 载体内部规范

对类似包装器的载体使用 `.inner(...)`。载体种类仍由实际 C++ 类型决定，并控制可空和引用行为：

```cpp
struct WrapperFields {
  std::optional<std::vector<uint32_t>> maybe_values;
  std::shared_ptr<std::vector<int64_t>> shared_values;
};

FORY_STRUCT(WrapperFields,
            (maybe_values, fory::F().inner(T::list(T::varint()))),
            (shared_values,
             fory::F().nullable().ref().inner(T::list(T::tagged()))));
```

`.inner(...)` 是 `std::optional<T>`、`std::shared_ptr<T>`、`std::unique_ptr<T>` 和 `fory::serialization::SharedWeak<T>` 唯一的公共组合器。

## 可空性、引用跟踪与动态字段

`std::optional<T>` 默认可空。可以在字段规范中将智能指针标记为可空或启用引用跟踪：

```cpp
struct Node {
  std::string name;
  std::shared_ptr<Node> next;
};

FORY_STRUCT(Node, name, (next, fory::F().nullable().ref()));
```

对于多态指针字段，使用 `.dynamic(true)` 始终写入具体类型信息，使用 `.dynamic(false)` 直接使用声明类型，或省略该设置，让 Fory 根据 C++ 类型推断行为：

```cpp
struct Zoo {
  std::shared_ptr<Animal> star;
  std::shared_ptr<Animal> mascot;
};

FORY_STRUCT(Zoo, (star, fory::F().nullable().dynamic(true)),
            (mascot, fory::F().nullable().dynamic(false)));
```

## 联合

`FORY_UNION` 分支必须使用显式 ID。名称模式 `fory::F()` 不适用于联合元数据：

```cpp
struct Choice {
  std::variant<std::string, uint32_t> value;

  static Choice text(std::string value);
  static Choice code(uint32_t value);
};

FORY_UNION(Choice, (text, std::string, fory::F(1)),
           (code, uint32_t, fory::F(2).fixed()));
```

如果生成的 C++ 可以从非重载的单参数工厂推断载荷类型，则可以省略显式分支类型：

```cpp
FORY_UNION(GeneratedChoice, (text, fory::F(1)),
           (code, fory::F(2).fixed()));
```

三元素形式是手写代码的稳定公共形式。
