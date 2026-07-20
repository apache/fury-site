---
title: 支持的类型
sidebar_position: 5
id: supported_types
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

本页记录 Fory C++ 序列化支持的所有类型。

## 基本类型

所有 C++ 基本类型都支持高效的二进制编码：

| 类型       | 大小   | Fory TypeId | 说明               |
| ---------- | ------ | ----------- | ------------------ |
| `bool`     | 1 字节 | BOOL        | True/false         |
| `int8_t`   | 1 字节 | INT8        | 有符号字节         |
| `uint8_t`  | 1 字节 | INT8        | 无符号字节         |
| `int16_t`  | 2 字节 | INT16       | 有符号短整型       |
| `uint16_t` | 2 字节 | INT16       | 无符号短整型       |
| `int32_t`  | 4 字节 | INT32       | 有符号整型         |
| `uint32_t` | 4 字节 | INT32       | 无符号整型         |
| `int64_t`  | 8 字节 | INT64       | 有符号长整型       |
| `uint64_t` | 8 字节 | INT64       | 无符号长整型       |
| `float`    | 4 字节 | FLOAT32     | IEEE 754 单精度    |
| `double`   | 8 字节 | FLOAT64     | IEEE 754 双精度    |
| `char`     | 1 字节 | INT8        | 字符（作为有符号） |
| `char16_t` | 2 字节 | INT16       | 16 位字符          |
| `char32_t` | 4 字节 | INT32       | 32 位字符          |

```cpp
int32_t value = 42;
auto bytes = fory.serialize(value).value();
auto decoded = fory.deserialize<int32_t>(bytes).value();
assert(value == decoded);
```

## 字符串类型

| 类型               | Fory TypeId | 说明               |
| ------------------ | ----------- | ------------------ |
| `std::string`      | STRING      | UTF-8 编码         |
| `std::string_view` | STRING      | 零拷贝视图（读取） |
| `std::u16string`   | STRING      | UTF-16（转换）     |
| `binary`           | BINARY      | 无长度的原始字节   |

```cpp
std::string text = "Hello, World!";
auto bytes = fory.serialize(text).value();
auto decoded = fory.deserialize<std::string>(bytes).value();
assert(text == decoded);
```

## 集合类型

### Vector / List

`std::vector<T>` 支持任何可序列化的元素类型：

```cpp
std::vector<int32_t> numbers{1, 2, 3, 4, 5};
auto bytes = fory.serialize(numbers).value();
auto decoded = fory.deserialize<std::vector<int32_t>>(bytes).value();

// 嵌套 vector
std::vector<std::vector<std::string>> nested{
    {"a", "b"},
    {"c", "d", "e"}
};
```

### Set

`std::set<T>` 和 `std::unordered_set<T>`：

```cpp
std::set<std::string> tags{"cpp", "serialization", "fory"};
auto bytes = fory.serialize(tags).value();
auto decoded = fory.deserialize<std::set<std::string>>(bytes).value();

std::unordered_set<int32_t> ids{1, 2, 3};
```

### Map

`std::map<K, V>` 和 `std::unordered_map<K, V>`：

```cpp
std::map<std::string, int32_t> scores{
    {"Alice", 100},
    {"Bob", 95}
};
auto bytes = fory.serialize(scores).value();
auto decoded = fory.deserialize<std::map<std::string, int32_t>>(bytes).value();

// 无序 map
std::unordered_map<int32_t, std::string> lookup{
    {1, "one"},
    {2, "two"}
};
```

## 智能指针

### std::optional

任何类型的可空包装：

```cpp
std::optional<int32_t> maybe_value = 42;
std::optional<int32_t> empty_value = std::nullopt;

auto bytes = fory.serialize(maybe_value).value();
auto decoded = fory.deserialize<std::optional<int32_t>>(bytes).value();
assert(decoded.has_value() && *decoded == 42);
```

### std::shared_ptr

带引用跟踪的共享所有权：

```cpp
auto shared = std::make_shared<Person>("Alice", 30);

auto bytes = fory.serialize(shared).value();
auto decoded = fory.deserialize<std::shared_ptr<Person>>(bytes).value();
```

**启用引用跟踪（`track_ref(true)`）时：**

- 共享对象只序列化一次
- 对同一对象的引用被保留
- 循环引用自动处理

### std::unique_ptr

独占所有权：

```cpp
auto unique = std::make_unique<Person>("Bob", 25);

auto bytes = fory.serialize(unique).value();
auto decoded = fory.deserialize<std::unique_ptr<Person>>(bytes).value();
```

## Variant 类型

`std::variant<Ts...>` 用于类型安全的联合：

```cpp
using MyVariant = std::variant<int32_t, std::string, double>;

MyVariant v1 = 42;
MyVariant v2 = std::string("hello");
MyVariant v3 = 3.14;

auto bytes = fory.serialize(v1).value();
auto decoded = fory.deserialize<MyVariant>(bytes).value();
assert(std::get<int32_t>(decoded) == 42);
```

### std::monostate

空 variant 替代：

```cpp
using OptionalInt = std::variant<std::monostate, int32_t>;

OptionalInt empty = std::monostate{};
OptionalInt value = 42;
```

## 时间类型

`fory::Duration`、`fory::Timestamp` 和 `fory::Date` 是由 Fory 提供、声明在 `fory/type/temporal.h` 中的载体类型。它们支持 `std::hash`，可用作 `std::unordered_map` 的键。

默认情况下，FDL/代码生成字段和动态 `std::any` 值使用这些 Fory 载体类型。调用方显式指定 C++ `std::chrono` 时间类型时，也可以将其作为序列化和反序列化目标。

### Duration

有符号时长，以纳秒存储。可使用任何能够转换为 `std::chrono::nanoseconds` 的 `std::chrono` duration 构造，并通过 `to_chrono()` 取回底层值：

```cpp
fory::Duration d(std::chrono::seconds(30));
auto bytes = fory.serialize(d).value();
auto decoded = fory.deserialize<fory::Duration>(bytes).value();

// 与 std::chrono 相互转换
std::chrono::nanoseconds ns = decoded.to_chrono();
int64_t count = decoded.count();  // 总纳秒数
```

### Timestamp

自 Unix 纪元以来的时间点。可使用 `fory::Timestamp::ChronoType` 时间点或自纪元起的纳秒数构造，并通过 `to_chrono()` 取回底层值：

```cpp
using ChronoTs = fory::Timestamp::ChronoType;
auto now = std::chrono::time_point_cast<std::chrono::nanoseconds>(
    std::chrono::system_clock::now());

fory::Timestamp ts(now);
auto bytes = fory.serialize(ts).value();
auto decoded = fory.deserialize<fory::Timestamp>(bytes).value();

// 与 std::chrono 相互转换
ChronoTs tp = decoded.to_chrono();
std::chrono::nanoseconds since_epoch = decoded.time_since_epoch();
```

### Date

自 Unix 纪元以来的天数：

```cpp
fory::Date date{18628};  // 自 1970-01-01 以来的天数

auto bytes = fory.serialize(date).value();
auto decoded = fory.deserialize<fory::Date>(bytes).value();
```

## 用户定义结构体

任何结构体都可以使用 `FORY_STRUCT` 进行序列化：

```cpp
struct Point {
  double x;
  double y;
  double z;
};
FORY_STRUCT(Point, x, y, z);

struct Line {
  Point start;
  Point end;
  std::string label;
};
FORY_STRUCT(Line, start, end, label);
```

## 枚举类型

使用 `FORY_ENUM` 支持作用域和非作用域枚举：

```cpp
// 作用域枚举（C++11 enum class）
enum class Color { RED = 0, GREEN = 1, BLUE = 2 };

// 非连续值的非作用域枚举
enum Priority : int32_t { LOW = -10, NORMAL = 0, HIGH = 10 };
FORY_ENUM(Priority, LOW, NORMAL, HIGH);

// 使用
Color c = Color::GREEN;
auto bytes = fory.serialize(c).value();
auto decoded = fory.deserialize<Color>(bytes).value();
```

## 不支持的类型

当前不支持：

- 原始指针（`T*`）- 使用智能指针代替
- `std::tuple<Ts...>` - 使用结构体代替
- `std::array<T, N>` - 使用 `std::vector<T>` 代替
- 函数指针
- 引用（`T&`、`const T&`）- 仅支持按值传递

## 相关主题

- [基础序列化](basic-serialization.md) - 使用这些类型
- [类型注册](type-registration.md) - 注册类型
- [跨语言](xlang-serialization.md) - 跨语言兼容性
