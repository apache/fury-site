---
title: 多态序列化
sidebar_position: 9
id: polymorphism
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

Apache Fory™ 通过智能指针（`std::shared_ptr` 和 `std::unique_ptr`）支持多态序列化，为继承层次结构提供动态分派和类型灵活性。

## 支持的多态类型

- `std::shared_ptr<Base>` - 支持多态分派的共享所有权
- `std::unique_ptr<Base>` - 支持多态分派的独占所有权
- 集合：`std::vector<std::shared_ptr<Base>>`、`std::map<K, std::unique_ptr<Base>>`
- 可选值：`std::optional<std::shared_ptr<Base>>`

## 基本多态序列化

```cpp
#include "fory/serialization/fory.h"

using namespace fory::serialization;

// Define base class with virtual methods
struct Animal {
  virtual ~Animal() = default;
  virtual std::string speak() const = 0;
  int32_t age = 0;
};
FORY_STRUCT(Animal, age);

// Define derived classes
struct Dog : Animal {
  std::string speak() const override { return "Woof!"; }
  std::string breed;
};
FORY_STRUCT(Dog, FORY_BASE(Animal), breed);

struct Cat : Animal {
  std::string speak() const override { return "Meow!"; }
  std::string color;
};
FORY_STRUCT(Cat, FORY_BASE(Animal), color);

// Struct with polymorphic field
struct Zoo {
  std::shared_ptr<Animal> star_animal;
};
FORY_STRUCT(Zoo, star_animal);

int main() {
  auto fory = Fory::builder().xlang(true).track_ref(true).build();

  // Register all types with unique type IDs
  fory.register_struct<Zoo>(100);
  fory.register_struct<Dog>(101);
  fory.register_struct<Cat>(102);

  // Create object with polymorphic field
  Zoo zoo;
  zoo.star_animal = std::make_shared<Dog>();
  zoo.star_animal->age = 3;
  static_cast<Dog*>(zoo.star_animal.get())->breed = "Labrador";

  // Serialize
  auto bytes_result = fory.serialize(zoo);
  assert(bytes_result.ok());

  // Deserialize - concrete type is preserved
  auto decoded_result = fory.deserialize<Zoo>(bytes_result.value());
  assert(decoded_result.ok());

  auto decoded = std::move(decoded_result).value();
  assert(decoded.star_animal->speak() == "Woof!");
  assert(decoded.star_animal->age == 3);

  auto* dog_ptr = dynamic_cast<Dog*>(decoded.star_animal.get());
  if (dog_ptr == nullptr || dog_ptr->breed != "Labrador") {
    return 1;
  }
}
```

## 多态类型注册

对于多态序列化，请使用唯一类型 ID 注册派生类型：

```cpp
// Register with numeric type ID
fory.register_struct<Derived1>(100);
fory.register_struct<Derived2>(101);
```

**为什么注册类型 ID？**

- 紧凑的二进制表示
- 快速的类型查找和分派
- 与非多态类型注册保持一致

## 自动多态检测

Fory 使用 `std::is_polymorphic<T>` 自动检测多态类型：

```cpp
struct Base {
  virtual ~Base() = default;  // Virtual destructor makes it polymorphic
  int32_t value = 0;
};

struct NonPolymorphic {
  int32_t value = 0;  // No virtual methods
};

// Polymorphic field - type info written automatically
struct Container1 {
  std::shared_ptr<Base> ptr;  // Auto-detected as polymorphic
};

// Non-polymorphic field - no type info written
struct Container2 {
  std::shared_ptr<NonPolymorphic> ptr;  // Not polymorphic
};
```

## 控制动态分派

使用 `fory::F().dynamic(V)` 并将其放入 `FORY_STRUCT`，以覆盖自动多态检测：

```cpp
struct Animal {
  virtual ~Animal() = default;
  virtual std::string speak() const = 0;
};

struct Pet {
  // Auto-detected: type info written (Animal has virtual methods)
  std::shared_ptr<Animal> animal1;

  // Force dynamic: type info written explicitly
  std::shared_ptr<Animal> animal2;

  // Force non-dynamic: skip type info (faster but no subtype support)
  std::shared_ptr<Animal> animal3;
};
FORY_STRUCT(Pet, animal1, (animal2, fory::F().dynamic(true)),
            (animal3, fory::F().dynamic(false)));
```

**何时使用 `dynamic(false)`：**

- 确定具体类型始终与声明类型一致
- 性能至关重要且不需要子类型支持
- 虽然存在多态基类，但实际处理的是单态数据

### Schema 元数据

直接在 `FORY_STRUCT` 中配置字段元数据：

```cpp
struct Zoo {
  std::shared_ptr<Animal> star;      // Auto-detected as polymorphic
  std::shared_ptr<Animal> backup;    // Nullable polymorphic field
  std::shared_ptr<Animal> mascot;    // Non-dynamic (no subtype dispatch)
};
FORY_STRUCT(Zoo, (star, fory::F(0)),
            (backup, fory::F(1).nullable()),
            (mascot, fory::F(2).dynamic(false)));
```

有关 `nullable()`、`ref()` 和其他字段级选项的完整详情，请参阅 [Schema 元数据](schema-metadata.md)。

## std::unique_ptr 多态

对于多态类型，`std::unique_ptr` 的工作方式与 `std::shared_ptr` 相同：

```cpp
struct Container {
  std::unique_ptr<Animal> pet;
};
FORY_STRUCT(Container, pet);

auto fory = Fory::builder().xlang(true).track_ref(true).build();
fory.register_struct<Container>(200);
fory.register_struct<Dog>(201);

Container container;
container.pet = std::make_unique<Dog>();
static_cast<Dog*>(container.pet.get())->breed = "Beagle";

auto bytes = fory.serialize(container).value();
auto decoded = fory.deserialize<Container>(bytes).value();

// Runtime type preserved
auto* dog = dynamic_cast<Dog*>(decoded.pet.get());
assert(dog != nullptr);
assert(dog->breed == "Beagle");
```

## 多态对象集合

```cpp
#include <vector>
#include <map>

struct AnimalShelter {
  std::vector<std::shared_ptr<Animal>> animals;
  std::map<std::string, std::unique_ptr<Animal>> registry;
};
FORY_STRUCT(AnimalShelter, animals, registry);

auto fory = Fory::builder().xlang(true).track_ref(true).build();
fory.register_struct<AnimalShelter>(100);
fory.register_struct<Dog>(101);
fory.register_struct<Cat>(102);

AnimalShelter shelter;
shelter.animals.push_back(std::make_shared<Dog>());
shelter.animals.push_back(std::make_shared<Cat>());
shelter.registry["pet1"] = std::make_unique<Dog>();

auto bytes = fory.serialize(shelter).value();
auto decoded = fory.deserialize<AnimalShelter>(bytes).value();

// All concrete types preserved
assert(dynamic_cast<Dog*>(decoded.animals[0].get()) != nullptr);
assert(dynamic_cast<Cat*>(decoded.animals[1].get()) != nullptr);
assert(dynamic_cast<Dog*>(decoded.registry["pet1"].get()) != nullptr);
```

## 引用跟踪

`std::shared_ptr` 的引用跟踪对多态类型同样适用。详情和示例参见[支持的类型](supported-types.md)。

## 嵌套多态深度限制

为防止深层嵌套的多态结构导致栈溢出，Fory 会限制最大动态嵌套深度：

```cpp
struct Container {
  virtual ~Container() = default;
  int32_t value = 0;
  std::shared_ptr<Container> nested;
};
FORY_STRUCT(Container, value, nested);

// Default max_dyn_depth is 5
auto fory1 = Fory::builder().xlang(true).build();
assert(fory1.config().max_dyn_depth == 5);

// Increase limit for deeper nesting
auto fory2 = Fory::builder().xlang(true).max_dyn_depth(10).build();
fory2.register_struct<Container>(1);

// Create deeply nested structure
auto level3 = std::make_shared<Container>();
level3->value = 3;

auto level2 = std::make_shared<Container>();
level2->value = 2;
level2->nested = level3;

auto level1 = std::make_shared<Container>();
level1->value = 1;
level1->nested = level2;

// Serialization succeeds
auto bytes = fory2.serialize(level1).value();

// Deserialization succeeds with sufficient depth
auto decoded = fory2.deserialize<std::shared_ptr<Container>>(bytes).value();
```

**超出深度错误：**

```cpp
auto fory_shallow = Fory::builder().xlang(true).max_dyn_depth(2).build();
fory_shallow.register_struct<Container>(1);

// 3 levels exceeds max_dyn_depth=2
auto result = fory_shallow.deserialize<std::shared_ptr<Container>>(bytes);
assert(!result.ok());  // Fails with depth exceeded error
```

**何时调整：**

- **增大 `max_dyn_depth`**：用于合理的深层嵌套多态数据结构
- **减小 `max_dyn_depth`**：用于更严格的安全要求或浅层数据结构

## 多态字段的可空性

默认情况下，Schema 中的 `std::shared_ptr<T>` 和 `std::unique_ptr<T>` 字段视为不可空。要允许 `nullptr`，请在 `FORY_STRUCT` 中将字段标记为可空。

```cpp
struct Pet {
  // Non-nullable (default)
  std::shared_ptr<Animal> primary;

  // Nullable via explicit field metadata
  std::shared_ptr<Animal> optional;
};
FORY_STRUCT(Pet, primary, (optional, fory::F().nullable()));
```

更多详情参见 [Schema 元数据](schema-metadata.md)。

## 将多态与其他功能组合

### 多态 + 引用跟踪

```cpp
struct GraphNode {
  virtual ~GraphNode() = default;
  int32_t id = 0;
  std::vector<std::shared_ptr<GraphNode>> neighbors;
};
FORY_STRUCT(GraphNode, id, neighbors);

struct WeightedNode : GraphNode {
  double weight = 0.0;
};
FORY_STRUCT(WeightedNode, FORY_BASE(GraphNode), weight);

// Enable ref tracking to handle shared references and cycles
auto fory = Fory::builder().xlang(true).track_ref(true).build();
fory.register_struct<GraphNode>(100);
fory.register_struct<WeightedNode>(101);

// Create cyclic graph
auto node1 = std::make_shared<WeightedNode>();
node1->id = 1;

auto node2 = std::make_shared<WeightedNode>();
node2->id = 2;

node1->neighbors.push_back(node2);
node2->neighbors.push_back(node1);  // Cycle

auto bytes = fory.serialize(node1).value();
auto decoded = fory.deserialize<std::shared_ptr<GraphNode>>(bytes).value();
// Cycle handled correctly
```

### 多态 + Schema 演进

多态类型的 Schema 演进默认启用兼容模式：

```cpp
auto fory = Fory::builder()
    .xlang(true)
    .track_ref(true)
    .build();
```

## 最佳实践

1. 对多态类型**使用类型 ID 注册**：

   ```cpp
   fory.register_struct<DerivedType>(100);
   ```

2. 对多态类型**启用引用跟踪**：

   ```cpp
   auto fory = Fory::builder().xlang(true).track_ref(true).build();
   ```

3. **必须使用虚析构函数**：确保基类具有虚析构函数：

   ```cpp
   struct Base {
     virtual ~Base() = default;  // Required for polymorphism
   };
   ```

4. 使用 `FORY_BASE` **声明每个序列化基类关系**：

   ```cpp
   FORY_STRUCT(DerivedType, FORY_BASE(BaseType), derived_field);
   ```

   这样 Fory 就能验证多态值，并在反序列化期间为多重继承正确调整指针。未声明基类关系的派生值无法通过该基类智能指针类型反序列化。

5. 在序列化或反序列化前**注册所有具体类型**：

   ```cpp
   fory.register_struct<Derived1>(100);
   fory.register_struct<Derived2>(101);
   ```

6. 反序列化后**使用 `dynamic_cast`** 向下转换：

   ```cpp
   auto* derived = dynamic_cast<DerivedType*>(base_ptr.get());
   if (derived) {
     // Use derived-specific members
   }
   ```

7. 根据数据结构深度**调整 `max_dyn_depth`**：

   ```cpp
   auto fory = Fory::builder().xlang(true).max_dyn_depth(10).build();
   ```

8. 对可选多态字段**使用 `nullable()`**：

   ```cpp
   FORY_STRUCT(Holder, (optional_ptr, fory::F().nullable()));
   ```

## 错误处理

```cpp
auto bytes_result = fory.serialize(obj);
if (!bytes_result.ok()) {
  std::cerr << "Serialization failed: "
            << bytes_result.error().to_string() << std::endl;
  return;
}

auto decoded_result = fory.deserialize<MyType>(bytes_result.value());
if (!decoded_result.ok()) {
  std::cerr << "Deserialization failed: "
            << decoded_result.error().to_string() << std::endl;
  return;
}
```

**常见错误：**

- **类型未注册**：使用前为所有具体类型注册唯一 ID
- **超出深度**：对于深层嵌套结构，增大 `max_dyn_depth`
- **类型 ID 冲突**：确保所有已注册类型中的每个类型都具有唯一类型 ID

## 性能注意事项

**多态序列化开销：**

- 为每个多态对象写入类型元数据（约 16-32 字节）
- 反序列化期间进行动态类型解析
- 动态分派需要调用虚函数

**优化技巧：**

1. 具体类型与声明类型一致时**使用 `dynamic(false)`**：

   ```cpp
   FORY_STRUCT(Holder, (fixed_type, fory::F().dynamic(false)));
   ```

2. **尽量减小嵌套深度**，以降低元数据开销

3. 在集合中**批量处理多态对象**，而非使用单独字段

4. 不需要多态时，**考虑非多态替代方案**：

   ```cpp
   std::variant<Dog, Cat> animal;  // Type-safe union instead of polymorphism
   ```

## 相关主题

- [类型注册](type-registration.md) - 注册用于序列化的类型
- [Schema 元数据](schema-metadata.md) - 字段级元数据和选项
- [支持的类型](supported-types.md) - 智能指针和集合
- [配置](configuration.md) - `max_dyn_depth` 和其他设置
- [基本序列化](basic-serialization.md) - 核心序列化概念
