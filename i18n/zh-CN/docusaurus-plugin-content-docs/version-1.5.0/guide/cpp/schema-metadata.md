---
title: Schema 元数据
sidebar_position: 5
id: schema_metadata
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

字段配置直接嵌入在 `FORY_STRUCT` 中。字段条目可以是裸字段，也可以是包含成员名和 `fory::F(...)` 构建器的元组：

```cpp
#include "fory/serialization/fory.h"

struct DataV2 {
  uint32_t id;
  uint64_t timestamp;
  std::optional<uint32_t> version;
};

FORY_STRUCT(DataV2, id, (timestamp, fory::F().tagged()), version);
```

该配置是编译期元数据。它不会分配编解码器对象，也不会在序列化路径上增加虚分派。

## 字段身份 {#field-identity}

`fory::F()` 使用名称模式的字段身份。裸字段也使用名称模式：

```cpp
FORY_STRUCT(DataV2, id, (timestamp, fory::F().tagged()), version);
```

`fory::F(id)` 使用显式的基于 ID 的字段身份。ID 必须是非负数：

```cpp
FORY_STRUCT(DataV2, (id, fory::F(0)), (timestamp, fory::F(1).tagged()),
            (version, fory::F(2)));
```

没有显式 ID 的字段仍使用其 snake_case 字段名。在同一协议字段组内，显式 ID 会排在基于名称的字段之前，因此单个 `FORY_STRUCT` 可以混用 `fory::F(id)`、`fory::F()` 和裸字段。

## 标量编码 {#scalar-encoding}

整数编码可以配置在字段上，也可以配置在嵌套 value-node spec 上：

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

| Method     | 含义                         |
| ---------- | ---------------------------- |
| `fixed()`  | 在合法类型上使用定长整数编码 |
| `varint()` | 在合法类型上使用变长整数编码 |
| `tagged()` | 在合法类型上使用带 tag 的整数编码 |

非法的标量/类型组合会在编译期失败。

## 嵌套 Spec {#nested-specs}

对容器和包装承载类型内部的 value-node spec，请使用 `fory::T` 命名空间。无类型 spec 会推断该节点处的实际 C++ 类型：

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

带类型的 spec 是可选的校验器，也能显式表达预期的节点类型：

```cpp
FORY_STRUCT(Foo, (nested, fory::F().map(T::uint32().varint(),
                                        T::list(T::int64().tagged()))));
```

支持的递归组合方法如下：

| Method              | 适用于                                      |
| ------------------- | ------------------------------------------- |
| `list(elem)`        | `std::vector<T>` 和类 list 字段             |
| `set(elem)`         | `std::set<T>` 和类 set 字段                 |
| `map(key, value)`   | `std::map<K, V>` 和类 map 字段              |
| `map().key(spec)`   | 仅覆盖 map key                              |
| `map().value(spec)` | 仅覆盖 map value                            |
| `inner(child)`      | 透明的单子节点承载类型                      |

当只有一侧需要非默认编码时，局部 map 覆盖很有用：

```cpp
FORY_STRUCT(Foo,
            (nested, fory::F().map().key(T::varint())),
            (other, fory::F().map().value(T::list(T::tagged()))));
```

## 承载类型内部 Spec {#carrier-inner-specs}

对包装器式承载类型使用 `.inner(...)`。承载类型的种类仍来自实际 C++ 类型，并控制可空性和引用行为：

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

`.inner(...)` 是 `std::optional<T>`、`std::shared_ptr<T>`、`std::unique_ptr<T>` 和 `fory::serialization::SharedWeak<T>` 唯一公开的组合器。

## 可空性、引用跟踪和动态字段 {#nullability-reference-tracking-and-dynamic-fields}

`std::optional<T>` 默认可空。智能指针可以在字段 spec 中标记为可空或启用引用跟踪：

```cpp
struct Node {
  std::string name;
  std::shared_ptr<Node> next;
};

FORY_STRUCT(Node, name, (next, fory::F().nullable().ref()));
```

对于多态指针字段，使用 `.dynamic(true)` 始终写入运行时类型信息，使用 `.dynamic(false)` 直接使用声明类型，或省略它让 Fory 根据 C++ 类型推断行为：

```cpp
struct Zoo {
  std::shared_ptr<Animal> star;
  std::shared_ptr<Animal> mascot;
};

FORY_STRUCT(Zoo, (star, fory::F().nullable().dynamic(true)),
            (mascot, fory::F().nullable().dynamic(false)));
```

## Union {#unions}

`FORY_UNION` case 必须使用显式 ID。名称模式的 `fory::F()` 对 union 元数据无效：

```cpp
struct Choice {
  std::variant<std::string, uint32_t> value;

  static Choice text(std::string value);
  static Choice code(uint32_t value);
};

FORY_UNION(Choice, (text, std::string, fory::F(1)),
           (code, uint32_t, fory::F(2).fixed()));
```

当生成的 C++ 能从非重载的单参数工厂函数推断载荷类型时，可以省略显式 case 类型：

```cpp
FORY_UNION(GeneratedChoice, (text, fory::F(1)),
           (code, fory::F(2).fixed()));
```

三元素形式是手写代码稳定的公开形式。
