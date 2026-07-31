---
title: Schema 演化
sidebar_position: 3
id: schema_evolution
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

Apache Fory™ 在 **Compatible 模式**下支持 schema 演化，允许序列化和反序列化双方拥有不同的类型定义。

## Compatible 模式

使用 `compatible(true)` 启用 schema 演化：

```cpp
#include "fory/serialization/fory.h"

using namespace fory::serialization;

// 版本 1：原始 schema
struct PersonV1 {
  std::string name;
  int32_t age;
};
FORY_STRUCT(PersonV1, name, age);

// 版本 2：添加 email 字段
struct PersonV2 {
  std::string name;
  int32_t age;
  std::string email;  // 新字段
};
FORY_STRUCT(PersonV2, name, age, email);

int main() {
  // 为每个 schema 版本创建单独的 Fory 实例
  auto fory_v1 = Fory::builder()
      .compatible(true)  // 启用 schema 演化
      .xlang(true)
      .build();

  auto fory_v2 = Fory::builder()
      .compatible(true)
      .xlang(true)
      .build();

  // 使用相同的类型 ID 进行 schema 演化
  constexpr uint32_t PERSON_TYPE_ID = 100;
  fory_v1.register_struct<PersonV1>(PERSON_TYPE_ID);
  fory_v2.register_struct<PersonV2>(PERSON_TYPE_ID);

  // 使用 V1 序列化
  PersonV1 v1{"Alice", 30};
  auto bytes = fory_v1.serialize(v1).value();

  // 反序列化为 V2 - email 获得默认值（空字符串）
  auto v2 = fory_v2.deserialize<PersonV2>(bytes).value();
  assert(v2.name == "Alice");
  assert(v2.age == 30);
  assert(v2.email == "");  // 缺失字段的默认值

  return 0;
}
```

## Schema 演化特性

Compatible 模式支持以下 schema 变更：

| 变更类型     | 支持 | 行为                         |
| ------------ | ---- | ---------------------------- |
| 添加新字段   | ✅   | 缺失字段使用默认值           |
| 删除字段     | ✅   | 额外字段被跳过               |
| 重排字段顺序 | ✅   | 按名称匹配字段，而非位置     |
| 更改可空性   | ✅   | `T` ↔ `std::optional<T>`     |
| 更改字段类型 | ❌   | 类型必须兼容                 |
| 重命名字段   | ❌   | 字段名必须匹配（区分大小写） |

## 添加字段（向后兼容）

当使用具有额外字段的新 schema 反序列化旧数据时：

```cpp
// 旧 schema (V1)
struct ProductV1 {
  std::string name;
  double price;
};
FORY_STRUCT(ProductV1, name, price);

// 新 schema (V2) 带有额外字段
struct ProductV2 {
  std::string name;
  double price;
  std::vector<std::string> tags;       // 新字段
  std::map<std::string, std::string> attributes;  // 新字段
};
FORY_STRUCT(ProductV2, name, price, tags, attributes);

// 序列化 V1
ProductV1 v1{"Laptop", 999.99};
auto bytes = fory_v1.serialize(v1).value();

// 反序列化为 V2
auto v2 = fory_v2.deserialize<ProductV2>(bytes).value();
assert(v2.name == "Laptop");
assert(v2.price == 999.99);
assert(v2.tags.empty());        // 默认：空 vector
assert(v2.attributes.empty());  // 默认：空 map
```

## 删除字段（向前兼容）

当使用具有较少字段的旧 schema 反序列化新数据时：

```cpp
// 完整 schema
struct UserFull {
  int64_t id;
  std::string username;
  std::string email;
  std::string password_hash;
  int32_t login_count;
};
FORY_STRUCT(UserFull, id, username, email, password_hash, login_count);

// 精简 schema（删除了 3 个字段）
struct UserMinimal {
  int64_t id;
  std::string username;
};
FORY_STRUCT(UserMinimal, id, username);

// 序列化完整版本
UserFull full{12345, "johndoe", "john@example.com", "hash123", 42};
auto bytes = fory_full.serialize(full).value();

// 反序列化为精简版本 - 额外字段被跳过
auto minimal = fory_minimal.deserialize<UserMinimal>(bytes).value();
assert(minimal.id == 12345);
assert(minimal.username == "johndoe");
// email、password_hash、login_count 被跳过
```

## 字段重排

在 compatible 模式下，字段按名称匹配，而非位置：

```cpp
// 原始字段顺序
struct ConfigOriginal {
  std::string host;
  int32_t port;
  bool enable_ssl;
  std::string protocol;
};
FORY_STRUCT(ConfigOriginal, host, port, enable_ssl, protocol);

// 重排后的字段
struct ConfigReordered {
  bool enable_ssl;      // 移到第一位
  std::string protocol; // 移到第二位
  std::string host;     // 移到第三位
  int32_t port;         // 移到最后
};
FORY_STRUCT(ConfigReordered, enable_ssl, protocol, host, port);

// 使用原始顺序序列化
ConfigOriginal orig{"localhost", 8080, true, "https"};
auto bytes = fory_orig.serialize(orig).value();

// 使用不同字段顺序反序列化 - 正常工作
auto reordered = fory_reord.deserialize<ConfigReordered>(bytes).value();
assert(reordered.host == "localhost");
assert(reordered.port == 8080);
assert(reordered.enable_ssl == true);
assert(reordered.protocol == "https");
```

## 嵌套结构体演化

Schema 演化递归支持嵌套结构体：

```cpp
// V1 Address
struct AddressV1 {
  std::string street;
  std::string city;
};
FORY_STRUCT(AddressV1, street, city);

// V2 Address 带有新字段
struct AddressV2 {
  std::string street;
  std::string city;
  std::string country;  // 新字段
  std::string zipcode;  // 新字段
};
FORY_STRUCT(AddressV2, street, city, country, zipcode);

// V1 Employee 使用 V1 Address
struct EmployeeV1 {
  std::string name;
  AddressV1 home_address;
};
FORY_STRUCT(EmployeeV1, name, home_address);

// V2 Employee 使用 V2 Address 和新字段
struct EmployeeV2 {
  std::string name;
  AddressV2 home_address;  // 嵌套结构体已演化
  std::string employee_id; // 新字段
};
FORY_STRUCT(EmployeeV2, name, home_address, employee_id);

// 使用相同 ID 注册类型
constexpr uint32_t ADDRESS_TYPE_ID = 100;
constexpr uint32_t EMPLOYEE_TYPE_ID = 101;

fory_v1.register_struct<AddressV1>(ADDRESS_TYPE_ID);
fory_v1.register_struct<EmployeeV1>(EMPLOYEE_TYPE_ID);
fory_v2.register_struct<AddressV2>(ADDRESS_TYPE_ID);
fory_v2.register_struct<EmployeeV2>(EMPLOYEE_TYPE_ID);

// 序列化 V1
EmployeeV1 emp_v1{"Jane Doe", {"123 Main St", "NYC"}};
auto bytes = fory_v1.serialize(emp_v1).value();

// 反序列化为 V2
auto emp_v2 = fory_v2.deserialize<EmployeeV2>(bytes).value();
assert(emp_v2.name == "Jane Doe");
assert(emp_v2.home_address.street == "123 Main St");
assert(emp_v2.home_address.city == "NYC");
assert(emp_v2.home_address.country == "");  // 默认值
assert(emp_v2.home_address.zipcode == "");  // 默认值
assert(emp_v2.employee_id == "");           // 默认值
```

## 双向演化

Schema 演化双向工作：

```cpp
// V2 -> V1（降级）
PersonV2 v2{"Charlie", 35, "charlie@example.com"};
auto bytes = fory_v2.serialize(v2).value();

auto v1 = fory_v1.deserialize<PersonV1>(bytes).value();
assert(v1.name == "Charlie");
assert(v1.age == 35);
// email 字段在反序列化时被丢弃
```

## 默认值

当字段缺失时，使用 C++ 默认初始化：

| 类型                   | 默认值         |
| ---------------------- | -------------- |
| `int8_t`、`int16_t`... | `0`            |
| `float`、`double`      | `0.0`          |
| `bool`                 | `false`        |
| `std::string`          | `""`           |
| `std::vector<T>`       | 空 vector      |
| `std::map<K,V>`        | 空 map         |
| `std::set<T>`          | 空 set         |
| `std::optional<T>`     | `std::nullopt` |
| 结构体类型             | 默认构造       |

## SchemaConsistent 模式（默认）

不使用 compatible 模式时，schema 必须完全匹配：

```cpp
// 严格模式（默认）
auto fory = Fory::builder()
    .compatible(false)  // 默认：schema 必须匹配
    .xlang(true)
    .build();

// 序列化/反序列化要求相同的 schema
// Schema 不匹配可能导致错误或未定义行为
```

**何时使用 SchemaConsistent 模式：**

- Schema 保证匹配（相同的二进制版本）
- 需要最高性能（更少的元数据开销）
- 您同时控制序列化和反序列化

**何时使用 Compatible 模式：**

- Schema 可能独立演化
- 需要跨版本兼容性
- 不同服务可能有不同的 schema 版本

## 类型 ID 要求

要使 schema 演化正常工作：

1. **相同类型 ID**：同一结构体的不同版本必须使用相同的类型 ID
2. **一致的 ID**：类型 ID 必须在所有 Fory 实例中保持一致
3. **注册所有版本**：每个 Fory 实例注册自己的结构体版本

```cpp
constexpr uint32_t PERSON_TYPE_ID = 100;

// 实例 1 使用 PersonV1
fory_v1.register_struct<PersonV1>(PERSON_TYPE_ID);

// 实例 2 使用 PersonV2
fory_v2.register_struct<PersonV2>(PERSON_TYPE_ID);

// 相同的类型 ID 启用 schema 演化
```

## 最佳实践

### 1. 为演化做规划

设计 schema 时考虑未来的变更：

```cpp
// 好的做法：对可能删除的字段使用 optional
struct Config {
  std::string host;
  int32_t port;
  std::optional<std::string> deprecated_field;  // 以后可以删除
};
```

### 2. 使用有意义的默认值

考虑新字段使用什么默认值才有意义：

```cpp
struct Settings {
  int32_t timeout_ms;      // 默认：0（可能需要一个合理的默认值）
  bool enabled;            // 默认：false
  std::string mode;        // 默认：""（可能需要 "default"）
};
```

### 3. 记录 Schema 版本

跟踪 schema 变更以便调试：

```cpp
// V1：初始 schema（2024-01-01）
// V2：添加 email 字段（2024-02-01）
// V3：添加 phone、address 字段（2024-03-01）
```

### 4. 测试演化路径

测试升级和降级场景：

```cpp
// 测试 V1 -> V2
// 测试 V2 -> V1
// 测试 V1 -> V3
// 测试 V3 -> V1
```

## 跨语言 Schema 演化

使用 xlang 模式时，schema 演化跨语言工作：

```cpp
// 使用 compatible 模式的 C++
auto fory = Fory::builder()
    .compatible(true)
    .xlang(true)
    .build();
```

```java
// 使用 compatible 模式的 Java
Fory fory = Fory.builder()
    .withCompatibleMode(CompatibleMode.COMPATIBLE)
    .withLanguage(Language.XLANG)
    .build();
```

即使 schema 版本不同，两个实例也可以交换数据。

## 相关主题

- [配置](configuration.md) - 启用 compatible 模式
- [类型注册](type-registration.md) - 类型 ID 管理
- [跨语言](xlang-serialization.md) - 跨语言注意事项
