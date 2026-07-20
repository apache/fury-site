---
title: 行格式
sidebar_position: 7
id: row_format
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

本页介绍用于高性能、缓存友好的数据访问的行格式序列化。

## 概述

Apache Fory™ 行格式是一种针对以下场景优化的二进制格式：

- **随机访问**：无需反序列化整个对象即可读取任意字段
- **零拷贝**：无数据复制的直接内存访问
- **缓存友好**：连续内存布局提高 CPU 缓存效率
- **列式转换**：易于转换为 Apache Arrow 格式
- **部分序列化**：只序列化需要的字段

## 何时使用行格式

| 使用场景           | 行格式 | 对象图 |
| ------------------ | ------ | ------ |
| 分析/OLAP          | ✅     | ❌     |
| 随机字段访问       | ✅     | ❌     |
| 完整对象序列化     | ❌     | ✅     |
| 复杂对象图         | ❌     | ✅     |
| 引用跟踪           | ❌     | ✅     |
| 跨语言（简单类型） | ✅     | ✅     |

## 快速开始

```cpp
#include "fory/encoder/row_encoder.h"
#include "fory/row/writer.h"

using namespace fory::row;
using namespace fory::row::encoder;

// 定义结构体
struct Person {
  int32_t id;
  std::string name;
  float score;
};

// 注册字段元数据（行编码必需）
FORY_FIELD_INFO(Person, id, name, score);

int main() {
  // 创建编码器
  RowEncoder<Person> encoder;

  // 编码一个 person
  Person person{1, "Alice", 95.5f};
  encoder.Encode(person);

  // 获取编码后的行
  auto row = encoder.GetWriter().ToRow();

  // 随机访问字段
  int32_t id = row->GetInt32(0);
  std::string name = row->GetString(1);
  float score = row->GetFloat(2);

  assert(id == 1);
  assert(name == "Alice");
  assert(score == 95.5f);

  return 0;
}
```

## 行编码器

### 基本用法

`RowEncoder<T>` 模板类提供类型安全的编码：

```cpp
#include "fory/encoder/row_encoder.h"

// 使用 FORY_FIELD_INFO 定义结构体
struct Point {
  double x;
  double y;
};
FORY_FIELD_INFO(Point, x, y);

// 创建编码器
RowEncoder<Point> encoder;

// 访问 schema（用于检查）
const Schema& schema = encoder.GetSchema();
std::cout << "Fields: " << schema.field_names().size() << std::endl;

// 编码值
Point p{1.0, 2.0};
encoder.Encode(p);

// 获取结果作为 Row
auto row = encoder.GetWriter().ToRow();
```

### 嵌套结构体

```cpp
struct Address {
  std::string city;
  std::string country;
};
FORY_FIELD_INFO(Address, city, country);

struct Person {
  std::string name;
  Address address;
};
FORY_FIELD_INFO(Person, name, address);

// 编码嵌套结构体
RowEncoder<Person> encoder;
Person person{"Alice", {"New York", "USA"}};
encoder.Encode(person);

auto row = encoder.GetWriter().ToRow();
std::string name = row->GetString(0);

// 访问嵌套结构体
auto address_row = row->GetStruct(1);
std::string city = address_row->GetString(0);
std::string country = address_row->GetString(1);
```

### 数组 / 列表

```cpp
struct Record {
  std::vector<int32_t> values;
  std::string label;
};
FORY_FIELD_INFO(Record, values, label);

RowEncoder<Record> encoder;
Record record{{1, 2, 3, 4, 5}, "test"};
encoder.Encode(record);

auto row = encoder.GetWriter().ToRow();
auto array = row->GetArray(0);

int count = array->num_elements();
for (int i = 0; i < count; i++) {
  int32_t value = array->GetInt32(i);
}
```

### 直接编码数组

```cpp
// 直接编码 vector（不在结构体内）
std::vector<Person> people{
    {"Alice", {"NYC", "USA"}},
    {"Bob", {"London", "UK"}}
};

RowEncoder<decltype(people)> encoder;
encoder.Encode(people);

// 获取数组数据
auto array = encoder.GetWriter().CopyToArrayData();
auto first_person = array->GetStruct(0);
std::string first_name = first_person->GetString(0);
```

## 行数据访问

### Row 类

`Row` 类提供对结构体字段的随机访问：

```cpp
class Row {
public:
  // 空值检查
  bool IsNullAt(int i) const;

  // 基本类型 getter
  bool GetBoolean(int i) const;
  int8_t GetInt8(int i) const;
  int16_t GetInt16(int i) const;
  int32_t GetInt32(int i) const;
  int64_t GetInt64(int i) const;
  float GetFloat(int i) const;
  double GetDouble(int i) const;

  // 字符串/二进制 getter
  std::string GetString(int i) const;
  std::vector<uint8_t> GetBinary(int i) const;

  // 嵌套类型
  std::shared_ptr<Row> GetStruct(int i) const;
  std::shared_ptr<ArrayData> GetArray(int i) const;
  std::shared_ptr<MapData> GetMap(int i) const;

  // 元数据
  int num_fields() const;
  SchemaPtr schema() const;

  // 调试
  std::string ToString() const;
};
```

### ArrayData 类

`ArrayData` 类提供对列表/数组元素的访问：

```cpp
class ArrayData {
public:
  // 空值检查
  bool IsNullAt(int i) const;

  // 元素数量
  int num_elements() const;

  // 基本类型 getter（与 Row 相同）
  int32_t GetInt32(int i) const;
  // ... 其他基本类型

  // 字符串 getter
  std::string GetString(int i) const;

  // 嵌套类型
  std::shared_ptr<Row> GetStruct(int i) const;
  std::shared_ptr<ArrayData> GetArray(int i) const;
  std::shared_ptr<MapData> GetMap(int i) const;

  // 类型信息
  ListTypePtr type() const;
};
```

### MapData 类

`MapData` 类提供对 map 键值对的访问：

```cpp
class MapData {
public:
  // 元素数量
  int num_elements();

  // 以数组形式访问键和值
  std::shared_ptr<ArrayData> keys_array();
  std::shared_ptr<ArrayData> values_array();

  // 类型信息
  MapTypePtr type();
};
```

## Schema 和类型

### Schema 定义

Schema 定义行数据的结构：

```cpp
#include "fory/row/schema.h"

using namespace fory::row;

// 以编程方式创建 schema
auto person_schema = schema({
    field("id", int32()),
    field("name", utf8()),
    field("score", float32()),
    field("active", boolean())
});

// 访问 schema 信息
for (const auto& f : person_schema->fields()) {
  std::cout << f->name() << ": " << f->type()->name() << std::endl;
}
```

### 类型系统

行格式可用的类型：

```cpp
// 基本类型
DataTypePtr boolean();    // bool
DataTypePtr int8();       // int8_t
DataTypePtr int16();      // int16_t
DataTypePtr int32();      // int32_t
DataTypePtr int64();      // int64_t
DataTypePtr float32();    // float
DataTypePtr float64();    // double

// 字符串和二进制
DataTypePtr utf8();       // std::string
DataTypePtr binary();     // std::vector<uint8_t>

// 复杂类型
DataTypePtr list(DataTypePtr element_type);
DataTypePtr map(DataTypePtr key_type, DataTypePtr value_type);
DataTypePtr struct_(std::vector<FieldPtr> fields);
```

### 类型推断

`RowEncodeTrait` 模板自动推断类型：

```cpp
// 基本类型的类型推断
RowEncodeTrait<int32_t>::Type();  // 返回 int32()
RowEncodeTrait<float>::Type();    // 返回 float32()
RowEncodeTrait<std::string>::Type();  // 返回 utf8()

// 集合的类型推断
RowEncodeTrait<std::vector<int32_t>>::Type();  // 返回 list(int32())

// map 的类型推断
RowEncodeTrait<std::map<std::string, int32_t>>::Type();
// 返回 map(utf8(), int32())

// 结构体的类型推断（需要 FORY_FIELD_INFO）
RowEncodeTrait<Person>::Type();  // 返回 struct_({...})
RowEncodeTrait<Person>::Schema();  // 返回 schema({...})
```

## 行写入器

### RowWriter

用于手动构造行：

```cpp
#include "fory/row/writer.h"

// 创建 schema
auto my_schema = schema({
    field("x", int32()),
    field("y", float64()),
    field("name", utf8())
});

// 创建写入器
RowWriter writer(my_schema);
writer.Reset();

// 写入字段
writer.Write(0, 42);          // x = 42
writer.Write(1, 3.14);        // y = 3.14
writer.WriteString(2, "test"); // name = "test"

// 获取结果
auto row = writer.ToRow();
```

### ArrayWriter

用于手动构造数组：

```cpp
// 创建数组类型
auto array_type = list(int32());

// 创建写入器
ArrayWriter writer(array_type);
writer.Reset(5);  // 5 个元素

// 写入元素
for (int i = 0; i < 5; i++) {
  writer.Write(i, i * 10);
}

// 获取结果
auto array = writer.CopyToArrayData();
```

### 空值

```cpp
// 在特定索引处设置空值
writer.SetNullAt(2);  // 字段 2 为空

// 读取时检查空值
if (!row->IsNullAt(2)) {
  std::string value = row->GetString(2);
}
```

## 内存布局

### 行布局

```
+------------------+--------------------+--------------------+
|    空值位图      |    固定大小数据     |    变长数据        |
+------------------+--------------------+--------------------+
|   ceil(n/8) B    |     8 * n 字节     |       可变         |
+------------------+--------------------+--------------------+
```

- **空值位图**：每字段一位，指示空值
- **固定大小数据**：每字段 8 字节（基本类型直接存储，变长类型存储偏移量+大小）
- **变长数据**：字符串、数组、嵌套结构体

### 数组布局

```
+------------+------------------+--------------------+--------------------+
| 元素数量   |    空值位图      |    固定大小数据     |    变长数据        |
+------------+------------------+--------------------+--------------------+
|   8 字节   |  ceil(n/8) 字节  |   elem_size * n    |       可变         |
+------------+------------------+--------------------+--------------------+
```

### Map 布局

```
+------------------+------------------+
|    键数组        |    值数组        |
+------------------+------------------+
```

## 性能提示

### 1. 复用编码器

```cpp
RowEncoder<Person> encoder;

// 编码多条记录
for (const auto& person : people) {
  encoder.Encode(person);
  auto row = encoder.GetWriter().ToRow();
  // 处理 row...
}
```

### 2. 预分配缓冲区

```cpp
// 获取缓冲区引用进行预分配
auto& buffer = encoder.GetWriter().buffer();
buffer->Reserve(expected_size);
```

### 3. 批量处理

```cpp
// 批量处理以提高缓存利用率
std::vector<Person> batch;
batch.reserve(BATCH_SIZE);

while (hasMore()) {
  batch.clear();
  fillBatch(batch);

  for (const auto& person : batch) {
    encoder.Encode(person);
    process(encoder.GetWriter().ToRow());
  }
}
```

### 4. 零拷贝读取

```cpp
// 指向现有缓冲区（零拷贝）
Row row(schema);
row.PointTo(buffer, offset, size);

// 直接从缓冲区访问字段
int32_t id = row.GetInt32(0);
```

## 支持类型汇总

| C++ 类型                 | 行类型           | 固定大小 |
| ------------------------ | ---------------- | -------- |
| `bool`                   | `boolean()`      | 1 字节   |
| `int8_t`                 | `int8()`         | 1 字节   |
| `int16_t`                | `int16()`        | 2 字节   |
| `int32_t`                | `int32()`        | 4 字节   |
| `int64_t`                | `int64()`        | 8 字节   |
| `float`                  | `float32()`      | 4 字节   |
| `double`                 | `float64()`      | 8 字节   |
| `std::string`            | `utf8()`         | 可变     |
| `std::vector<T>`         | `list(T)`        | 可变     |
| `std::map<K,V>`          | `map(K,V)`       | 可变     |
| `std::optional<T>`       | 内部类型         | 可空     |
| 结构体 (FORY_FIELD_INFO) | `struct_({...})` | 可变     |

## 相关主题

- [基础序列化](basic-serialization.md) - 对象图序列化
- [配置](configuration.md) - 构建器选项
- [支持的类型](supported-types.md) - 所有支持的类型
