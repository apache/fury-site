---
title: Schema 演进
sidebar_position: 6
id: schema-evolution
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

Apache Fory™ 在**兼容模式**中支持 Schema 演进，允许序列化和反序列化对等端使用不同的类型定义。

## 兼容模式

兼容模式默认启用：

```cpp
#include "fory/serialization/fory.h"

using namespace fory::serialization;

// Version 1: Original schema
struct PersonV1 {
  std::string name;
  int32_t age;
};
FORY_STRUCT(PersonV1, name, age);

// Version 2: Added email field
struct PersonV2 {
  std::string name;
  int32_t age;
  std::string email;  // NEW FIELD
};
FORY_STRUCT(PersonV2, name, age, email);

int main() {
  // Create separate Fory instances for each schema version
  auto fory_v1 = Fory::builder()
      .xlang(true)
      .build();

  auto fory_v2 = Fory::builder()
      .xlang(true)
      .build();

  // Register with the SAME type ID for schema evolution
  constexpr uint32_t PERSON_TYPE_ID = 100;
  fory_v1.register_struct<PersonV1>(PERSON_TYPE_ID);
  fory_v2.register_struct<PersonV2>(PERSON_TYPE_ID);

  // Serialize with V1
  PersonV1 v1{"Alice", 30};
  auto bytes = fory_v1.serialize(v1).value();

  // Deserialize as V2 - email gets default value (empty string)
  auto v2 = fory_v2.deserialize<PersonV2>(bytes).value();
  assert(v2.name == "Alice");
  assert(v2.age == 30);
  assert(v2.email == "");  // Default value for missing field

  return 0;
}
```

## Schema 演进功能

兼容模式支持以下 Schema 变更：

| 变更类型     | 支持情况 | 行为                           |
| ------------ | -------- | ------------------------------ |
| 添加新字段   | 支持     | 缺失字段使用默认值             |
| 删除字段     | 支持     | 跳过多余字段                   |
| 重排字段     | 支持     | 按名称而非位置匹配字段         |
| 更改可空性   | 支持     | `T` ↔ `std::optional<T>`       |
| 更改字段类型 | 部分支持 | 标量变更必须无损               |
| 重命名字段   | 不支持   | 字段名称必须匹配（区分大小写） |

当值可以无损转换时，兼容读取端可以处理部分标量字段类型变更。如果转换后的值具有相同逻辑值，匹配字段可以在 `bool`、`std::string`、数字标量和十进制字段之间读取。布尔字符串必须严格为 `"0"`、`"1"`、`"true"` 或 `"false"`。数字字符串必须使用有限的 ASCII 十进制表示，不允许空白、前导 `+`、Unicode 数字、分隔符或 `NaN` 和 `Infinity` 等非有限值。数字和十进制可以读取为规范字符串；只有不丢失精度或范围时，数字扩宽或缩窄才会成功。可空和可选字段包装器仍可与这些转换组合，但启用引用跟踪的标量类型变更不兼容。无效字符串和有损转换会在反序列化期间失败。

## 添加字段（向后兼容）

使用包含新增字段的新 Schema 反序列化旧数据时：

```cpp
// Old schema (V1)
struct ProductV1 {
  std::string name;
  double price;
};
FORY_STRUCT(ProductV1, name, price);

// New schema (V2) with additional fields
struct ProductV2 {
  std::string name;
  double price;
  std::vector<std::string> tags;       // NEW
  std::map<std::string, std::string> attributes;  // NEW
};
FORY_STRUCT(ProductV2, name, price, tags, attributes);

// Serialize V1
ProductV1 v1{"Laptop", 999.99};
auto bytes = fory_v1.serialize(v1).value();

// Deserialize as V2
auto v2 = fory_v2.deserialize<ProductV2>(bytes).value();
assert(v2.name == "Laptop");
assert(v2.price == 999.99);
assert(v2.tags.empty());        // Default: empty vector
assert(v2.attributes.empty());  // Default: empty map
```

## 删除字段（向前兼容）

使用字段较少的旧 Schema 反序列化新数据时：

```cpp
// Full schema
struct UserFull {
  int64_t id;
  std::string username;
  std::string email;
  std::string password_hash;
  int32_t login_count;
};
FORY_STRUCT(UserFull, id, username, email, password_hash, login_count);

// Minimal schema (removed 3 fields)
struct UserMinimal {
  int64_t id;
  std::string username;
};
FORY_STRUCT(UserMinimal, id, username);

// Serialize full version
UserFull full{12345, "johndoe", "john@example.com", "hash123", 42};
auto bytes = fory_full.serialize(full).value();

// Deserialize as minimal - extra fields are skipped
auto minimal = fory_minimal.deserialize<UserMinimal>(bytes).value();
assert(minimal.id == 12345);
assert(minimal.username == "johndoe");
// email, password_hash, login_count are skipped
```

## 字段重排

在兼容模式中，字段按名称而非位置匹配：

```cpp
// Original field order
struct ConfigOriginal {
  std::string host;
  int32_t port;
  bool enable_ssl;
  std::string protocol;
};
FORY_STRUCT(ConfigOriginal, host, port, enable_ssl, protocol);

// Reordered fields
struct ConfigReordered {
  bool enable_ssl;      // Moved to first
  std::string protocol; // Moved to second
  std::string host;     // Moved to third
  int32_t port;         // Moved to last
};
FORY_STRUCT(ConfigReordered, enable_ssl, protocol, host, port);

// Serialize with original order
ConfigOriginal orig{"localhost", 8080, true, "https"};
auto bytes = fory_orig.serialize(orig).value();

// Deserialize with different field order - works correctly
auto reordered = fory_reord.deserialize<ConfigReordered>(bytes).value();
assert(reordered.host == "localhost");
assert(reordered.port == 8080);
assert(reordered.enable_ssl == true);
assert(reordered.protocol == "https");
```

## 嵌套结构体演进

Schema 演进会递归应用于嵌套结构体：

```cpp
// V1 Address
struct AddressV1 {
  std::string street;
  std::string city;
};
FORY_STRUCT(AddressV1, street, city);

// V2 Address with new fields
struct AddressV2 {
  std::string street;
  std::string city;
  std::string country;  // NEW
  std::string zipcode;  // NEW
};
FORY_STRUCT(AddressV2, street, city, country, zipcode);

// V1 Employee with V1 Address
struct EmployeeV1 {
  std::string name;
  AddressV1 home_address;
};
FORY_STRUCT(EmployeeV1, name, home_address);

// V2 Employee with V2 Address and new field
struct EmployeeV2 {
  std::string name;
  AddressV2 home_address;  // Nested struct evolved
  std::string employee_id; // NEW
};
FORY_STRUCT(EmployeeV2, name, home_address, employee_id);

// Register types with same IDs
constexpr uint32_t ADDRESS_TYPE_ID = 100;
constexpr uint32_t EMPLOYEE_TYPE_ID = 101;

fory_v1.register_struct<AddressV1>(ADDRESS_TYPE_ID);
fory_v1.register_struct<EmployeeV1>(EMPLOYEE_TYPE_ID);
fory_v2.register_struct<AddressV2>(ADDRESS_TYPE_ID);
fory_v2.register_struct<EmployeeV2>(EMPLOYEE_TYPE_ID);

// Serialize V1
EmployeeV1 emp_v1{"Jane Doe", {"123 Main St", "NYC"}};
auto bytes = fory_v1.serialize(emp_v1).value();

// Deserialize as V2
auto emp_v2 = fory_v2.deserialize<EmployeeV2>(bytes).value();
assert(emp_v2.name == "Jane Doe");
assert(emp_v2.home_address.street == "123 Main St");
assert(emp_v2.home_address.city == "NYC");
assert(emp_v2.home_address.country == "");  // Default
assert(emp_v2.home_address.zipcode == "");  // Default
assert(emp_v2.employee_id == "");           // Default
```

## 双向演进

Schema 演进可双向工作：

```cpp
// V2 -> V1 (downgrade)
PersonV2 v2{"Charlie", 35, "charlie@example.com"};
auto bytes = fory_v2.serialize(v2).value();

auto v1 = fory_v1.deserialize<PersonV1>(bytes).value();
assert(v1.name == "Charlie");
assert(v1.age == 35);
// email field is discarded during deserialization
```

## 默认值

字段缺失时使用 C++ 默认初始化：

| 类型                   | 默认值         |
| ---------------------- | -------------- |
| `int8_t`, `int16_t`... | `0`            |
| `float`, `double`      | `0.0`          |
| `bool`                 | `false`        |
| `std::string`          | `""`           |
| `std::vector<T>`       | 空 vector      |
| `std::map<K,V>`        | 空 map         |
| `std::set<T>`          | 空 set         |
| `std::optional<T>`     | `std::nullopt` |
| 结构体类型             | 默认构造       |

## 相同 Schema 优化

跨语言模式和原生模式都默认使用兼容模式。只有每个读取端和写入端始终使用相同 Schema，并且希望获得更快序列化和更小体积时，才显式设置 `compatible(false)`：

```cpp
// Same-schema optimization
auto fory = Fory::builder()
    .xlang(true)
    .compatible(false)
    .build();

// Serialization/deserialization requires identical schemas
// Schema mismatches may cause errors or undefined behavior
```

**以下情况使用 `compatible(false)`：**

- 每个读取端和写入端始终使用相同 Schema
- 希望获得更快序列化和更小体积
- 对于跨语言载荷，每种语言都使用同一套已验证 Schema，或使用由 Fory Schema IDL 生成的原生类型

### 按结构体选择退出

对于单个结构体，可以使用 `FORY_STRUCT_EVOLVING` 并将其放在 `FORY_STRUCT` 后，以退出演进元数据：

```cpp
struct SameSchemaMessage {
  int32_t id;
};
FORY_STRUCT(SameSchemaMessage, id);
FORY_STRUCT_EVOLVING(SameSchemaMessage, false);
```

**以下情况使用兼容模式：**

- Schema 可能独立演进
- 需要跨版本兼容性
- 不同服务可能使用不同的 Schema 版本

## 类型 ID 要求

要使 Schema 演进正常工作：

1. **类型 ID 相同**：同一结构体的不同版本必须使用相同类型 ID
2. **ID 一致**：所有 Fory 实例中的类型 ID 必须一致
3. **注册所有版本**：每个 Fory 实例注册自己的结构体版本

```cpp
constexpr uint32_t PERSON_TYPE_ID = 100;

// Instance 1 uses PersonV1
fory_v1.register_struct<PersonV1>(PERSON_TYPE_ID);

// Instance 2 uses PersonV2
fory_v2.register_struct<PersonV2>(PERSON_TYPE_ID);

// Same type ID enables schema evolution
```

## 最佳实践

### 1. 为演进做好规划

设计 Schema 时考虑未来变更：

```cpp
// Good: Use optional for fields that might be removed
struct Config {
  std::string host;
  int32_t port;
  std::optional<std::string> deprecated_field;  // Can be removed later
};
```

### 2. 使用有意义的默认值

考虑新字段应使用什么合理的默认值：

```cpp
struct Settings {
  int32_t timeout_ms;      // Default: 0 (might want a sensible default)
  bool enabled;            // Default: false
  std::string mode;        // Default: "" (might want "default")
};
```

### 3. 记录 Schema 版本

跟踪 Schema 变更以便调试：

```cpp
// V1: Initial schema (2024-01-01)
// V2: Added email field (2024-02-01)
// V3: Added phone, address fields (2024-03-01)
```

### 4. 测试演进路径

同时测试升级和降级场景：

```cpp
// Test V1 -> V2
// Test V2 -> V1
// Test V1 -> V3
// Test V3 -> V1
```

## 跨语言 Schema 演进

使用跨语言模式时，Schema 演进可跨语言工作：

```cpp
// C++ with compatible mode, the default
auto fory = Fory::builder()
    .xlang(true)
    .build();
```

```java
// Java with compatible mode, the default
Fory fory = Fory.builder()
    .withXlang(true)
    .build();
```

即使 Schema 版本不同，两个实例仍可交换数据。

## 相关主题

- [配置](configuration.md) - 启用兼容模式
- [类型注册](type-registration.md) - 类型 ID 管理
- [跨语言序列化](basic-serialization.md#cross-language-interoperability) - 跨语言注意事项
