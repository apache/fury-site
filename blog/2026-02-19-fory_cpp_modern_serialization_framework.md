---
slug: fory_cpp_blazing_fast_serialization_framework
title: "Introducing Apache Fory™ C++: Blazing-Fast, Type-Safe Serialization for Modern C++"
description: "Apache Fory C++ provides type-safe, compile-time serialization with cross-language interoperability, polymorphism, references, and schema evolution."
authors: [chaokunyang]
tags: [fory, cpp, serialization, cross-language]
---

**TL;DR**: Apache Fory C++ is a blazing-fast, cross-language serialization framework delivering **exceptional binary performance** with support for **polymorphic types, circular references, schema evolution, and seamless interoperability** with Java, Python, Go, Rust, and JavaScript — all via modern C++17 with zero runtime reflection overhead.

- 🐙 GitHub: https://github.com/apache/fory
- 📚 Docs: https://fory.apache.org/docs/guide/cpp

<img src="/img/fory-logo-light.png" width="50%"/>

---

## The C++ Serialization Problem

Every C++ developer working in a polyglot environment eventually hits the same wall. Existing options force a painful choice:

1. **IDL-first frameworks** (Protocol Buffers, FlatBuffers): Require upfront schema compilation, lose native C++ type expressiveness, and carry significant integration friction. Every type change means regenerating code across all languages in lock-step.
2. **Reflection-based frameworks** (Boost.Serialization, cereal): Limited cross-language support, no circular reference handling, no polymorphism without boilerplate. They work well within a single language but break down at system boundaries.
3. **Hand-rolled binary formats**: Fast but brittle — any schema change risks silent corruption, and every new type requires manual encode/decode logic.

Apache Fory C++ eliminates this trade-off. It delivers performance competitive with the fastest C++ serialization libraries while providing first-class support for polymorphism, shared/circular references, schema evolution, and **binary compatibility with Java, Python, Go, Rust, and JavaScript** — through a clean C++17 API.

---

## What Makes Apache Fory C++ Different?

### Compile-Time Code Generation

Most serialization frameworks pay a runtime cost for flexibility — inspecting type information through virtual dispatch or hash maps at every call. Apache Fory takes a different approach: the `FORY_STRUCT` macro uses C++ template metaprogramming to generate all serialization logic at compile time. The result is inlined, type-specific code with no virtual dispatch, no reflection, and no runtime overhead:

```cpp
#include "fory/serialization/fory.h"
using namespace fory::serialization;

struct Person {
  std::string name;
  int32_t age;
  std::vector<std::string> hobbies;
  std::map<std::string, std::string> metadata;
  std::optional<std::string> nickname;
};
FORY_STRUCT(Person, name, age, hobbies, metadata, nickname);
```

That single macro generates compile-time field metadata, efficient serialization/deserialization code via ADL (Argument-Dependent Lookup), and type registration hooks. The macro can be placed inside the class body to access private fields, or at namespace scope for third-party types.

### Cross-Language Binary Protocol

Apache Fory C++ speaks the same binary wire format as Java, Python, Go, Rust, and JavaScript. Serialize a struct in C++, deserialize it in Python — no adaptation layer, no schema translation, no version negotiation needed. This is especially powerful for microservice architectures where different teams own different services in different languages:

```cpp
// C++: Serialize
auto fory = Fory::builder().xlang(true).build();
fory.register_struct<Person>(100);
auto bytes = fory.serialize(person).value();
```

```python
# Python: Deserialize (same binary format, same type ID)
fory = pyfory.Fory(xlang=True)
fory.register(Person, type_id=100)  # Same ID as C++
person = fory.deserialize(data)
```

The core requirements for cross-language interoperability are consistent type IDs/Names across participating runtimes, matching canonical field names, and compatible field types for those names.

### Polymorphism via Smart Pointers

Serializing polymorphic objects is notoriously difficult in C++. Most frameworks require manual type tagging or generate large amounts of boilerplate. Apache Fory handles it automatically: it detects polymorphic types via `std::is_polymorphic<T>` and preserves the full runtime type identity through `std::shared_ptr` and `std::unique_ptr`. When you deserialize a `shared_ptr<Animal>` that holds a `Dog`, you get a `Dog` back — no extra code required:

```cpp
struct Animal { virtual ~Animal() = default; int32_t age = 0; };
FORY_STRUCT(Animal, age);
struct Dog : Animal { std::string breed; };
FORY_STRUCT(Dog, FORY_BASE(Animal), breed);
struct Cat : Animal { std::string color; };
FORY_STRUCT(Cat, FORY_BASE(Animal), color);

struct Shelter { std::vector<std::shared_ptr<Animal>> animals; };
FORY_STRUCT(Shelter, animals);

auto fory = Fory::builder().track_ref(true).build();
fory.register_struct<Shelter>(10); fory.register_struct<Dog>(11); fory.register_struct<Cat>(12);

Shelter s;
s.animals.push_back(std::make_shared<Dog>()); // Dog at runtime
s.animals.push_back(std::make_shared<Cat>()); // Cat at runtime

auto decoded = fory.deserialize<Shelter>(fory.serialize(s).value()).value();
assert(dynamic_cast<Dog*>(decoded.animals[0].get()) != nullptr); // Runtime type preserved!
```

Fory also supports `std::unique_ptr` for exclusive-ownership polymorphic fields, and collections of smart pointers (`std::vector<std::shared_ptr<Base>>`, `std::map<K, std::unique_ptr<Base>>`).

### Shared/Circular Reference Tracking

Many real-world data models contain shared objects or cycles: a parent node pointing to its children, which point back to the parent; an order referencing a customer who appears in multiple orders. Standard serialization frameworks either duplicate the data (wasting space) or crash with a stack overflow when they encounter a cycle.

With `track_ref(true)`, Fory tracks object identity across the entire graph. Shared objects are serialized exactly once; every subsequent reference is encoded as a back-reference. Cycles terminate naturally:

```cpp
struct Node {
  virtual ~Node() = default;
  int32_t id = 0;
  std::vector<std::shared_ptr<Node>> neighbors;
};
FORY_STRUCT(Node, id, neighbors);

auto fory = Fory::builder().track_ref(true).build();
fory.register_struct<Node>(200);

auto node1 = std::make_shared<Node>(); node1->id = 1;
auto node2 = std::make_shared<Node>(); node2->id = 2;
node1->neighbors.push_back(node2);
node2->neighbors.push_back(node1);  // Cycle — handled correctly!

auto bytes = fory.serialize(node1).value();
// No stack overflow, no duplicate data — the cycle is preserved faithfully
auto decoded = fory.deserialize<std::shared_ptr<Node>>(bytes).value();
```

This makes Fory a natural fit for graph databases, entity-component systems, and any domain model with bidirectional relationships.

### Schema Evolution

In a microservice deployment, services update independently. A new version of the user service may add a `phone` field while old consumers are still running. Without schema evolution support, this forces a coordinated, big-bang deployment. Apache Fory's **compatible mode** removes this constraint entirely:

```cpp
// Version 1
struct UserV1 { std::string name; int32_t age; };
FORY_STRUCT(UserV1, name, age);

// Version 2 — new fields added independently
struct UserV2 { std::string name; int32_t age; std::string email; };
FORY_STRUCT(UserV2, name, age, email);

auto fory_v1 = Fory::builder().compatible(true).xlang(true).build();
auto fory_v2 = Fory::builder().compatible(true).xlang(true).build();
fory_v1.register_struct<UserV1>(100);
fory_v2.register_struct<UserV2>(100);  // Same type ID enables evolution

auto bytes = fory_v1.serialize(UserV1{"Alice", 30}).value();
auto v2 = fory_v2.deserialize<UserV2>(bytes).value();
assert(v2.name == "Alice" && v2.email == "");  // Default for missing field
```

In compatible mode, fields are matched by name rather than position. New fields receive C++ default values when missing; removed fields are safely skipped. This enables rolling upgrades and independent service deployments without any serialization errors.

### Row Format: Zero-Copy Analytics

Beyond object graph serialization, Apache Fory C++ implements a **row-based binary format** designed for analytics workloads. The row format stores data in a contiguous memory layout with a null bitmap, fixed-size slots for primitives, and a variable-length section for strings and nested objects. This enables **O(1) random field access by index** — you can read a single field from a large struct without touching the rest of the data.

This is particularly valuable in data pipelines and OLAP workloads where only a small subset of fields are queried per record:

```cpp
#include "fory/encoder/row_encoder.h"
using namespace fory::row::encoder;

struct SensorReading {
  int32_t sensor_id; double temperature; std::string location;
  FORY_STRUCT(SensorReading, sensor_id, temperature, location);
};

RowEncoder<SensorReading> encoder;
encoder.encode({42, 23.5, "rack-B"});
auto row = encoder.get_writer().to_row();

// Read any field in O(1) — no deserialization of unused fields
int32_t id    = row->get_int32(0);
double  temp  = row->get_double(1);
auto    loc   = row->get_string(2);
```

For zero-copy access into an existing buffer (e.g., from a memory-mapped file or network receive buffer), Fory can point a `Row` directly at the memory without copying:

```cpp
auto src = encoder.get_writer().to_row();
fory::row::Row view(src->schema());
view.point_to(src->buffer(), src->base_offset(), src->size_bytes());  // Zero-copy view
int32_t id = view.get_int32(0);  // Reads directly from the original buffer
```

Use the row format for analytics, OLAP-style workloads, and partial field access. Use object graph serialization for full object round-trips with references and polymorphism.

---

## Installation

Fory C++ requires a C++17-compatible compiler (GCC 7+, Clang 5+, MSVC 2017+) and supports both CMake and Bazel build systems.

### CMake (FetchContent)

The simplest integration is via CMake's `FetchContent` module, which fetches and builds Fory as part of your project:

```cmake
cmake_minimum_required(VERSION 3.16)
project(my_project LANGUAGES CXX)
set(CMAKE_CXX_STANDARD 17)

include(FetchContent)
FetchContent_Declare(fory
    GIT_REPOSITORY https://github.com/apache/fory.git
    GIT_TAG v0.15.0
    SOURCE_SUBDIR cpp)
FetchContent_MakeAvailable(fory)

add_executable(my_app main.cc)
target_link_libraries(my_app PRIVATE fory::serialization)
```

### Bazel

For Bazel-based projects, add Fory as a module dependency:

```bazel
bazel_dep(name = "fory", version = "0.15.0")
git_override(module_name = "fory",
    remote = "https://github.com/apache/fory.git",
    commit = "v0.15.0")
```

```bazel
cc_binary(name = "my_app", srcs = ["main.cc"],
    deps = ["@fory//cpp/fory/serialization:fory_serialization"])
```

---

## Native Serialization

For pure C++ applications without cross-language requirements, disabling `xlang` produces a more compact binary encoding because no cross-language type metadata is emitted. This is the fastest possible path:

```cpp
auto fory = Fory::builder()
    .xlang(false)      // Native C++ mode — tighter encoding
    .track_ref(false)  // Disable if no shared/circular refs
    .build();

fory.register_struct<Address>(1);
fory.register_struct<Person>(2);

// Serialize
auto result = fory.serialize(person);
if (!result.ok()) { std::cerr << result.error().to_string(); return 1; }
std::vector<uint8_t> bytes = std::move(result).value();

// Deserialize
auto decoded = fory.deserialize<Person>(bytes);
assert(decoded.ok() && person == decoded.value());
```

`FORY_STRUCT` handles several important C++ patterns that commonly arise in production codebases:

```cpp
// Private fields — place macro in public: section
class Secure {
  int32_t secret_; std::string token_;
public:
  FORY_STRUCT(Secure, secret_, token_);
};

// Inheritance — FORY_BASE includes base class fields
struct Derived : Base {
  std::string extra;
  FORY_STRUCT(Derived, FORY_BASE(Base), extra);
};

// External/third-party types — use at namespace scope (public fields only)
namespace ext { struct Coord { double lat, lon; }; }
FORY_STRUCT(ext::Coord, lat, lon);
```

### Error Handling

All Fory operations return `Result<T, Error>`, making error handling explicit and composable. The `FORY_TRY` macro provides a concise early-return pattern for functions that propagate errors:

```cpp
// Option 1: Conditional check
auto r = fory.serialize(obj);
if (r.ok()) { auto bytes = std::move(r).value(); }
else { std::cerr << r.error().to_string(); }

// Option 2: FORY_TRY macro for early return
FORY_TRY(bytes, fory.serialize(obj));
// Use bytes directly — any error propagates automatically
```

### Thread Safety

Fory provides two variants with different threading guarantees. Choose based on whether your serialization is centralized (shared instance) or distributed across threads:

```cpp
// Single-threaded (fastest) — one instance per thread, no synchronization overhead
auto fory = Fory::builder().build();

// Thread-safe — shared across threads via an internal instance pool
auto fory = Fory::builder().build_thread_safe();
fory.register_struct<MyType>(1);  // Register all types before sharing
std::thread t([&]() { fory.serialize(obj); });  // Safe to call concurrently
```

---

## Cross-Language Serialization

### Without IDL

When you control both sides of the wire and can coordinate type definitions manually, the simplest approach is to register types with matching numeric IDs in each language. This requires no additional tooling and works well for small, stable schemas:

```cpp
// C++
auto fory = Fory::builder().xlang(true).build();
fory.register_struct<Order>(201);
auto bytes = fory.serialize(order).value();
```

```java
// Java — same binary format, same type ID
Fory fory = Fory.builder().withLanguage(Language.XLANG).build();
fory.register(Order.class, 201);
Order order = (Order) fory.deserialize(bytes);
```

```python
# Python — same binary format, same type ID
fory = pyfory.Fory(xlang=True)
fory.register(Order, type_id=201)
order = fory.deserialize(data)
```

**Field matching**: In cross-language mode, field names are normalized to snake_case and matched by that canonical name. Ordering follows Fory's xlang field-order rules (not simple alphabetical ordering), so keep names semantically consistent across languages.

### With the Fory Schema IDL Compiler

As schemas grow and span more services and teams, manually maintaining consistent field names, type IDs, and type definitions across five languages becomes error-prone. The **Fory Schema IDL Compiler** (`foryc`) solves this by letting you define types once in a `.fdl` file and generating idiomatic, production-ready code for every target language. The generated code includes typed accessors, serialization macros, registration helpers, and `to_bytes()`/`from_bytes()` helpers — so you never write serialization plumbing by hand.

#### 1. Install the compiler

```bash
pip install fory-compiler
foryc --help
```

#### 2. Write a schema (`ecommerce.fdl`)

Fory IDL syntax is concise and deliberately close to protobuf, so it is easy to pick up. Field modifiers like `optional`, `ref`, and `list` map directly to idiomatic C++ types:

```protobuf
package ecommerce;

enum OrderStatus {
    PENDING = 0; CONFIRMED = 1; SHIPPED = 2; DELIVERED = 3;
}

message Address {
    string street = 1; string city = 2; string country = 3;
}

message Customer {
    string           id      = 1;
    string           name    = 2;
    optional string  email   = 3;   // Nullable: maps to std::optional<std::string>
    optional Address address = 4;
}

message OrderItem {
    string  sku        = 1;
    int32   quantity   = 2;
    float64 unit_price = 3;
}

// Discount can be either a fixed amount or a percentage — modelled as a union
message FixedDiscount   { float64 amount     = 1; }
message PercentDiscount { float64 percentage = 1; }

// union maps to std::variant<FixedDiscount, PercentDiscount> in C++
union Discount {
    FixedDiscount   fixed   = 1;
    PercentDiscount percent = 2;
}

message Order {
    string            order_id   = 1;
    ref Customer      customer   = 2;  // ref: std::shared_ptr + reference tracking
    list<OrderItem>   items      = 3;  // list: std::vector<OrderItem>
    OrderStatus       status     = 4;
    float64           total      = 5;
    optional string   notes      = 6;
    timestamp         created_at = 7;
    optional Discount discount   = 8;  // optional union field
}
```

The IDL type system maps cleanly to native C++ constructs. `union` is a first-class IDL construct that generates a `std::variant`-based wrapper class in C++, with typed case accessors (`is_fixed()`, `as_fixed()`, etc.) and a `visit()` method. Here is the full set of field modifiers and their C++ equivalents:

| Modifier           | C++ type                             | Purpose                        |
| ------------------ | ------------------------------------ | ------------------------------ |
| `optional T`       | `std::optional<T>`                   | Nullable field                 |
| `ref T`            | `std::shared_ptr<T>`                 | Shared / circular reference    |
| `ref(weak=true) T` | `fory::serialization::SharedWeak<T>` | Weak reference (breaks cycles) |
| `list<T>`          | `std::vector<T>`                     | Ordered list                   |
| `map<K,V>`         | `std::map<K,V>`                      | Key-value map                  |

#### 3. Generate code

`foryc` generates a single header file per schema for C++, and equivalent files for every other target language. All generated files use the same type IDs derived from the package and type names, guaranteeing binary compatibility without any manual coordination:

```bash
# Generate C++ header directly under ./generated
foryc ecommerce.fdl --cpp_out ./generated

# Generate multiple languages with explicit output directories
foryc ecommerce.fdl --cpp_out ./generated --java_out ./java/src/main/java --python_out ./python/gen --go_out ./go/gen --rust_out ./rust/gen
```

The output structure for C++ is one header per schema file under the directory passed to `--cpp_out`. For example, `--cpp_out ./generated` produces `generated/ecommerce.h`. The header contains all types under the `ecommerce::` namespace, with `FORY_STRUCT` macros and a `register_types()` helper already wired up.

#### 4. Use the generated C++ code

The generated header provides `final` classes with typed accessors and `to_bytes()`/`from_bytes()` helpers. There is no manual Fory instance setup required — the helpers manage it internally:

```cpp
#include "generated/ecommerce.h"

ecommerce::Order order;
order.set_order_id("ORD-2025-001");
order.mutable_customer()->set_name("Alice");
order.set_status(ecommerce::OrderStatus::CONFIRMED);
order.set_total(159.98);

// to_bytes()/from_bytes() are generated — no Fory boilerplate needed
auto bytes = order.to_bytes().value();
auto restored = ecommerce::Order::from_bytes(bytes).value();
assert(restored.order_id() == "ORD-2025-001");
```

Because the generated Java, Python, and Go code uses the same type IDs, bytes serialized by the C++ `to_bytes()` helper can be deserialized by the Java `fromBytes()` or Python `from_bytes()` helpers out of the box — no extra configuration required.

---

## Supported Types

Apache Fory C++ supports a comprehensive set of types covering all common C++ data structures and cross-language primitives:

| Category       | C++ Types                                                                                                      |
| -------------- | -------------------------------------------------------------------------------------------------------------- |
| Primitives     | `bool`, `int8_t`…`int64_t`, `uint8_t`…`uint64_t`, `float`, `double`                                            |
| Strings        | `std::string`, `std::string_view`, `std::u16string`                                                            |
| Collections    | `std::vector<T>`, `std::set<T>`, `std::unordered_set<T>`, `std::map<K,V>`, `std::unordered_map<K,V>`           |
| Optional/Union | `std::optional<T>`, `std::variant<Ts...>`                                                                      |
| Smart Pointers | `std::shared_ptr<T>` (ref tracking + polymorphism), `std::unique_ptr<T>`, `fory::serialization::SharedWeak<T>` |
| Temporal       | `std::chrono::nanoseconds`, `fory::serialization::Timestamp`, `fory::serialization::Date`                      |
| Enums          | Scoped/unscoped enums; use `FORY_ENUM` for non-continuous values                                               |
| User structs   | Any type annotated with `FORY_STRUCT`                                                                          |

All collection element and map value types can be arbitrarily nested, including structs, smart pointers, and `std::optional`.

---

## Configuration Reference

Fory instances are constructed through a fluent builder API. All options have sensible defaults, so most applications only need to set one or two:

```cpp
auto fory = Fory::builder()
    .xlang(true)                // Cross-language binary protocol (default: true)
    .compatible(true)           // Schema evolution / compatible mode (default: false)
    .track_ref(true)            // Shared/circular reference tracking (default: true)
    .max_dyn_depth(10)          // Max polymorphic nesting depth (default: 5)
    .check_struct_version(true) // Validate struct hash on deserialization (default: false)
    .build();                   // Single-threaded; use build_thread_safe() for multi-thread
```

**Tuning guide**: Disable `compatible` for maximum throughput when schema changes are coordinated (same binary deployed together). Disable `track_ref` for pure value types with no sharing or cycles — it eliminates per-object reference bookkeeping. Use `xlang(false)` for C++-only deployments to get a more compact binary encoding.

---

## Benchmarks

Apache Fory delivers exceptional performance across diverse data shapes. The combination of compile-time code generation, variable-length integer encoding, and a carefully designed binary protocol yields major gains versus text formats and strong results versus Protocol Buffers. In the current C++ benchmark report, Fory throughput vs Protobuf ranges from about **1.1x to 12.2x** depending on workload and operation:

<img src="/img/benchmarks/cpp/throughput.png" width="90%"/>

The C++ implementation achieves similar relative speedups to the Java implementation. Because both share the same binary protocol design, and C++ serialization code is generated at compile time (eliminating the JIT warm-up cost), C++ performance is competitive or superior for latency-sensitive workloads.

Serialized Data Sizes (bytes)

| Datatype         | Fory | Protobuf |
| ---------------- | ---- | -------- |
| Struct           | 58   | 61       |
| Sample           | 446  | 375      |
| MediaContent     | 365  | 301      |
| StructList       | 184  | 315      |
| SampleList       | 1980 | 1890     |
| MediaContentList | 1535 | 1520     |

---

## Conclusion

Apache Fory C++ brings together a set of capabilities that no other C++ serialization library delivers as a cohesive package:

- **Performance**: Template-based compile-time codegen eliminates all runtime reflection overhead; a highly efficient binary protocol minimizes both serialized size and CPU cycles
- **Cross-language**: The same binary format works natively with Java, Python, Go, Rust, and JavaScript
- **Native C++ idioms**: `std::shared_ptr`, `std::optional`, `std::variant`, `fory::serialization::SharedWeak` — all handled naturally
- **Production-ready features**: Polymorphism, circular references, schema evolution, thread safety out of the box
- **Schema-first option**: The Fory IDL Compiler generates consistent, idiomatic code across all languages from a single `.fdl` definition — no more manually synchronizing type IDs across codebases

Whether you are building a high-performance game server, a polyglot microservice backend, a real-time analytics pipeline, or an embedded system serializing complex domain models, Apache Fory C++ has you covered.

**Get started:**

```bash
git clone https://github.com/apache/fory.git
cd fory/examples/cpp/hello_world
cmake -B build -DCMAKE_BUILD_TYPE=Release && cmake --build build
./build/hello_world
```

**Documentation:**

- C++ Serialization Guide: [fory.apache.org/docs/guide/cpp](https://fory.apache.org/docs/guide/cpp)
- Fory Schema IDL Compiler: [fory.apache.org/docs/compiler](https://fory.apache.org/docs/compiler)
- Xlang Serialization Spec: [fory.apache.org/docs/specification](https://fory.apache.org/docs/specification/xlang_serialization_spec/)

**Community:**

- GitHub: [apache/fory](https://github.com/apache/fory)
- Slack: [Join our community](https://join.slack.com/t/fory-project/shared_invite/zt-1u8soj4qc-ieYEu7ciHOqA2mo47llS8A)
- License: Apache License 2.0
