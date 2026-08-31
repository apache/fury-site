---
title: C++ 行格式
sidebar_position: 5
id: cpp
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

本页介绍基于行的序列化格式，用于实现高性能且缓存友好的数据访问。

## 概述

Apache Fory™ 行格式是一种二进制格式，针对以下场景进行了优化：

- **随机访问**：无需反序列化整个对象即可读取任意字段
- **零拷贝**：无需复制数据即可直接访问内存
- **缓存友好**：采用连续内存布局，提高 CPU 缓存效率
- **列式转换**：可轻松转换为 Apache Arrow 格式
- **部分序列化**：仅序列化所需字段

## 何时使用行格式

| 使用场景           | 行格式 | 对象图 |
| ------------------ | ------ | ------ |
| 分析/OLAP          | 支持   | 不支持 |
| 随机字段访问       | 支持   | 不支持 |
| 完整对象序列化     | 不支持 | 支持   |
| 复杂对象图         | 不支持 | 支持   |
| 引用跟踪           | 不支持 | 支持   |
| 跨语言（简单类型） | 支持   | 支持   |

## 快速开始

```cpp
#include "fory/encoder/row_encoder.h"
#include "fory/row/writer.h"

using namespace fory::row;
using namespace fory::row::encoder;

struct Person {
  int32_t id;
  std::string name;
  float score;
  FORY_STRUCT(Person, id, name, score);
};

int main() {
  // Create encoder
  RowEncoder<Person> encoder;

  // encode a person
  Person person{1, "Alice", 95.5f};
  encoder.encode(person);

  // get the encoded row
  auto row = encoder.get_writer().to_row();

  // Random access to fields
  assert(row->get_int32(0) == 1);
  assert(row->get_string(1) == "Alice");
  assert(row->get_float(2) == 95.5f);

  return 0;
}
```

## 行编码器

### 基本用法

`RowEncoder<T>` 模板类提供类型安全的编码：

```cpp
#include "fory/encoder/row_encoder.h"

struct Point {
  double x;
  double y;
  FORY_STRUCT(Point, x, y);
};

// Create encoder
RowEncoder<Point> encoder;

// Access schema (for inspection)
const Schema& schema = encoder.get_schema();
std::cout << "Fields: " << schema.field_names().size() << std::endl;

// encode value
Point p{1.0, 2.0};
encoder.encode(p);

// get result as Row
auto row = encoder.get_writer().to_row();
```

### 嵌套结构体

```cpp
struct Address {
  std::string city;
  std::string country;
  FORY_STRUCT(Address, city, country);
};

struct Person {
  std::string name;
  Address address;
  FORY_STRUCT(Person, name, address);
};

// encode nested struct
RowEncoder<Person> encoder;
Person person{"Alice", {"New York", "USA"}};
encoder.encode(person);

auto row = encoder.get_writer().to_row();
std::string name = row->get_string(0);

// Access nested struct
auto address_row = row->get_struct(1);
std::string city = address_row->get_string(0);
std::string country = address_row->get_string(1);
```

### 数组/列表

```cpp
struct Record {
  std::vector<int32_t> values;
  std::string label;
  FORY_STRUCT(Record, values, label);
};

RowEncoder<Record> encoder;
Record record{{1, 2, 3, 4, 5}, "test"};
encoder.encode(record);

auto row = encoder.get_writer().to_row();
auto array = row->get_array(0);

int count = array->num_elements();
for (int i = 0; i < count; i++) {
  int32_t value = array->get_int32(i);
}
```

### 直接编码数组

```cpp
// encode a vector directly (not inside a struct)
std::vector<Person> people{
    {"Alice", {"NYC", "USA"}},
    {"Bob", {"London", "UK"}}
};

RowEncoder<decltype(people)> encoder;
encoder.encode(people);

// get array data
auto array = encoder.get_writer().copy_to_array_data();
auto first_person = array->get_struct(0);
std::string first_name = first_person->get_string(0);
```

## 行数据访问

### Row 类

`Row` 类支持随机访问结构体字段：

```cpp
class Row {
public:
  // Null check
  bool is_null_at(int i) const;

  // Primitive getters
  bool get_boolean(int i) const;
  int8_t get_int8(int i) const;
  int16_t get_int16(int i) const;
  int32_t get_int32(int i) const;
  int64_t get_int64(int i) const;
  float get_float(int i) const;
  double get_double(int i) const;

  // String/binary getter
  std::string get_string(int i) const;
  std::vector<uint8_t> get_binary(int i) const;

  // Nested types
  std::shared_ptr<Row> get_struct(int i) const;
  std::shared_ptr<ArrayData> get_array(int i) const;
  std::shared_ptr<MapData> get_map(int i) const;

  // Metadata
  int num_fields() const;
  SchemaPtr schema() const;

  // Debug
  std::string to_string() const;
};
```

### ArrayData 类

`ArrayData` 类用于访问嵌套序列中的元素：

```cpp
class ArrayData {
public:
  // Null check
  bool is_null_at(int i) const;

  // Element count
  int num_elements() const;

  // Primitive getters (same as Row)
  int32_t get_int32(int i) const;
  // ... other primitives

  // String getter
  std::string get_string(int i) const;

  // Nested types
  std::shared_ptr<Row> get_struct(int i) const;
  std::shared_ptr<ArrayData> get_array(int i) const;
  std::shared_ptr<MapData> get_map(int i) const;

  // Type info
  ListTypePtr type() const;
};
```

### MapData 类

`MapData` 类用于访问映射中的键值对：

```cpp
class MapData {
public:
  // Element count
  int num_elements();

  // Access keys and values as arrays
  std::shared_ptr<ArrayData> keys_array();
  std::shared_ptr<ArrayData> values_array();

  // Type info
  MapTypePtr type();
};
```

## Schema 与类型

### Schema 定义

Schema 定义行数据的结构：

```cpp
#include "fory/row/schema.h"

using namespace fory::row;

// Create schema programmatically
auto person_schema = schema({
    field("id", int32()),
    field("name", utf8()),
    field("score", float32()),
    field("active", boolean())
});

// Access schema info
for (const auto& f : person_schema->fields()) {
  std::cout << f->name() << ": " << f->type()->name() << std::endl;
}
```

### 类型系统

行格式支持以下类型：

```cpp
// Primitive types
DataTypePtr boolean();    // bool
DataTypePtr int8();       // int8_t
DataTypePtr int16();      // int16_t
DataTypePtr int32();      // int32_t
DataTypePtr int64();      // int64_t
DataTypePtr float32();    // float
DataTypePtr float64();    // double

// String and binary
DataTypePtr utf8();       // std::string
DataTypePtr binary();     // std::vector<uint8_t>

// Complex types
DataTypePtr list(DataTypePtr element_type);
DataTypePtr map(DataTypePtr key_type, DataTypePtr value_type);
DataTypePtr struct_(std::vector<FieldPtr> fields);
```

### 类型推断

`RowEncodeTrait` 模板会自动推断类型：

```cpp
// Type inference for primitives
RowEncodeTrait<int32_t>::Type();  // Returns int32()
RowEncodeTrait<float>::Type();    // Returns float32()
RowEncodeTrait<std::string>::Type();  // Returns utf8()

// Type inference for collections
RowEncodeTrait<std::vector<int32_t>>::Type();  // Returns list(int32())

// Type inference for maps
RowEncodeTrait<std::map<std::string, int32_t>>::Type();
// Returns map(utf8(), int32())

// Type inference for structs (requires FORY_STRUCT)
RowEncodeTrait<Person>::Type();  // Returns struct_({...})
RowEncodeTrait<Person>::Schema();  // Returns schema({...})
```

## 行写入器

### RowWriter

用于手动构造行：

```cpp
#include "fory/row/writer.h"

// Create schema
auto my_schema = schema({
    field("x", int32()),
    field("y", float64()),
    field("name", utf8())
});

// Create writer
RowWriter writer(my_schema);
writer.reset();

// write fields
writer.write(0, 42);          // x = 42
writer.write(1, 3.14);        // y = 3.14
writer.write_string(2, "test"); // name = "test"

// get result
auto row = writer.to_row();
```

### ArrayWriter

用于手动构造数组：

```cpp
// Create array type
auto array_type = list(int32());

// Create writer
ArrayWriter writer(array_type);
writer.reset(5);  // 5 elements

// write elements
for (int i = 0; i < 5; i++) {
  writer.write(i, i * 10);
}

// get result
auto array = writer.copy_to_array_data();
```

### 空值

```cpp
// Set null at specific index
writer.set_null_at(2);  // Field 2 is null

// Check null when reading
if (!row->is_null_at(2)) {
  std::string value = row->get_string(2);
}
```

## 内存布局

### 行布局

```
+------------------+--------------------+--------------------+
|   Null Bitmap    |  Fixed-Size Data   | Variable-Size Data |
+------------------+--------------------+--------------------+
|   ceil(n/8) B    |     8 * n bytes    |      variable      |
+------------------+--------------------+--------------------+
```

- **空值位图**：每个字段占一位，用于表示空值
- **定长数据**：每个字段占 8 字节（基本类型直接存储；可变长类型存储偏移量和大小）
- **变长数据**：字符串、数组和嵌套结构体

### 数组布局

```
+------------+------------------+--------------------+--------------------+
| Num Elems  |   Null Bitmap    |  Fixed-Size Data   | Variable-Size Data |
+------------+------------------+--------------------+--------------------+
|   8 bytes  |  ceil(n/8) bytes |   elem_size * n    |      variable      |
+------------+------------------+--------------------+--------------------+
```

### 映射布局

```
+------------------+------------------+
|    Keys Array    |   Values Array   |
+------------------+------------------+
```

## 性能建议

### 1. 复用编码器

```cpp
RowEncoder<Person> encoder;

// encode multiple records
for (const auto& person : people) {
  encoder.encode(person);
  auto row = encoder.get_writer().to_row();
  // Process row...
}
```

### 2. 预分配缓冲区

```cpp
// get buffer reference for pre-allocation
auto& buffer = encoder.get_writer().buffer();
buffer->reserve(expected_size);
```

### 3. 批量处理

```cpp
// Process in batches for better cache utilization
std::vector<Person> batch;
batch.reserve(BATCH_SIZE);

while (has_more()) {
  batch.clear();
  fill_batch(batch);

  for (const auto& person : batch) {
    encoder.encode(person);
    process(encoder.get_writer().to_row());
  }
}
```

### 4. 零拷贝读取

```cpp
// Point to existing buffer (zero-copy)
Row row(schema);
row.point_to(buffer, offset, size);

// Access fields directly from buffer
int32_t id = row.get_int32(0);
```

## 支持的类型汇总

| C++ 类型              | 行类型           | 固定大小 |
| --------------------- | ---------------- | -------- |
| `bool`                | `boolean()`      | 1 字节   |
| `int8_t`              | `int8()`         | 1 字节   |
| `int16_t`             | `int16()`        | 2 字节   |
| `int32_t`             | `int32()`        | 4 字节   |
| `int64_t`             | `int64()`        | 8 字节   |
| `float`               | `float32()`      | 4 字节   |
| `double`              | `float64()`      | 8 字节   |
| `std::string`         | `utf8()`         | 可变     |
| `std::vector<T>`      | `list(T)`        | 可变     |
| `std::map<K,V>`       | `map(K,V)`       | 可变     |
| `std::optional<T>`    | 内部类型         | 可为空   |
| 结构体（FORY_STRUCT） | `struct_({...})` | 可变     |

## 相关主题

- [C++ 行格式示例](https://github.com/apache/fory/tree/main/examples/cpp/hello_row) - 完整的可运行示例
- [基本序列化](../object-serialization/cpp/basic-serialization.md) - 对象图序列化
- [C++ 对象序列化配置](../object-serialization/cpp/configuration.md) - 构建器选项
- [C++ 对象序列化支持的类型](../object-serialization/cpp/supported-types.md) - 对象序列化类型
