---
slug: fory_schema_idl_for_object_graph
title: "Apache Fory™ Schema IDL: Serialization IDL for Object Graphs and Generated API Ergonomics"
description: "Fory Schema IDL generates idiomatic cross-language models with native support for shared references, cycles, polymorphism, and schema evolution."
authors: [chaokunyang]
tags: [fory, idl, schema, serialization, cross-language, codegen]
---

**TL;DR**: Apache Fory Schema IDL is the first cross-language serialization IDL for **object graphs serialization**. Define your types once in a `.fdl` file, and the compiler generates idiomatic domain objects for **Java, Python, Go, Rust, C++, C#, Swift, and more** — with shared refs, cycles, polymorphism, schema evolution, and optional types built into the schema model.

- GitHub: https://github.com/apache/fory
- Docs: https://fory.apache.org/docs/compiler
- Install: `pip install fory-compiler`

<img src="/img/fory-logo-light.png" width="50%"/>

---

## The Object Graph Gap

Most existing serialization IDLs model data as value trees: flat messages with no schema-level notion of shared identity, cycles, or reusable standalone polymorphic types. When the actual data is a graph, that gap usually shows up in three places:

1. **Shared and Circular References**: If two fields refer to the same logical object, Protocol Buffers and FlatBuffers do not preserve that shared identity in the schema or on the wire. Parent pointers, DAGs, and cycles have no schema-level representation, so they fall back to manual ID fields and application-side reconstruction.

2. **Polymorphism**: Protobuf `oneof` and FlatBuffers `union` are inline alternatives embedded in an enclosing message, not reusable standalone schema types. Protobuf `Any` supports open-ended polymorphism, but only for messages and via a type URL. FlatBuffers has no equivalent.

3. **Generated Types as Domain Models**: FlatBuffers APIs are primarily buffer-access wrappers. Protobuf generates transport-first types in many languages, so users often add a conversion layer to get back to idiomatic domain objects. The schema defines the wire format, but not the application model.

Apache Fory Schema IDL closes that gap.

---

## What Makes Fory IDL Different?

Apache Fory Schema IDL is built around object graphs as a first-class concept. You define your types once — including shared references, circular structures, standalone unions, and polymorphic fields — run the compiler, and get idiomatic code in every supported language on top of the same Fory wire format.

In this article, "serialization IDL for object graphs" means the schema itself can describe shared identity, cycles, and reusable polymorphic types directly, instead of forcing users to flatten everything into value trees and rebuild links with manual IDs or application-side conventions later.

That shows up in three places:

- `ref` makes shared references and cycles part of the schema contract.
- `union` and `any` make polymorphism a reusable schema feature rather than only an inline transport detail.
- The generated code stays usable as host-language application models instead of wrapper types that require another conversion layer.

The sections below show how that works in practice.

### First-Class Shared References

Fory IDL has a `ref` modifier that makes shared and circular reference tracking explicit in the schema:

```protobuf
message TreeNode {
    string value = 1;
    ref TreeNode parent = 2;          // Shared reference — can point back
    list<ref TreeNode> children = 3;  // Each child is reference-tracked
}
```

When you serialize a tree where children point back to their parent, Fory encodes each object exactly once and uses back-references for duplicates. No manual ID-link fields. No application-level reconstruction logic. The object graph contract lives in the schema itself.

For parent pointers where you want to break ownership cycles, `ref(weak=true)` generates weak pointer types (e.g., `ArcWeak<Node>` in Rust, `std::weak_ptr` in C++).

### Idiomatic Domain Objects, Not Wrappers

A key difference from Protocol Buffers and FlatBuffers is that compiling a Fory `.fdl` schema produces host-language models you can use directly:

- **Java**: Plain POJOs with `@ForyField` annotations — usable directly in Spring, Hibernate, or any framework
- **Python**: `@dataclass` types with standard type hints
- **Go**: Structs with `fory:"id=..."` struct tags
- **Rust**: Structs with `#[derive(ForyObject)]`
- **C++**: `final` classes with `FORY_STRUCT` macros — zero runtime reflection
- **C#**: Classes with `[ForyObject]` attributes
- **Swift**: `@ForyObject` models with `@ForyField` metadata

In many applications, no adapter layer is needed. The generated types can be used directly as your domain objects.

### Built-In Unions (Sum Types)

Fory IDL has a first-class `union` construct that maps to the most idiomatic sum type in each language:

```protobuf
message Dog {
    string name = 1;
    int32 bark_volume = 2;
}

message Cat {
    string name = 1;
    int32 lives = 2;
}

union Animal {
    Dog dog = 1;
    Cat cat = 2;
}
```

This generates:

- **Rust**: `enum Animal { Dog(Dog), Cat(Cat) }`
- **C++**: `std::variant`-based wrapper with `is_dog()`, `as_dog()`, `visit()` APIs
- **Swift**: Tagged enum with associated values
- **Java**: `Union` subclass with typed case accessors
- **Python**: `Union` subclass with `is_dog()` / `dog_value()` helpers
- **Go**: Typed case struct with `AsDog()` / visitor pattern
- **C#**: `Union` subclass with `IsDog` / `DogValue()` helpers

Every language gets the same semantics, but expressed in each language's idiom.

### Polymorphic Fields with `any`

Sometimes you don't know the concrete type of a field at schema-definition time. An event bus carries heterogeneous payloads. A plugin system accepts user-defined message types. Fory IDL's `any` type handles this — it writes the runtime type identity into the binary stream and resolves it on the other side:

```protobuf
message Envelope {
    string event_type = 1;
    any payload = 2;          // Carries dynamic values supported by Fory
}
```

At runtime, `payload` can hold dynamic values supported by Fory — other generated messages, built-in scalars, or collection types. The serialized bytes include runtime type metadata, so the deserializer can reconstruct the concrete value on the other side:

| Language | Generated Field Type    |
| -------- | ----------------------- |
| Java     | `Object payload`        |
| Python   | `payload: Any`          |
| Go       | `Payload any`           |
| Rust     | `payload: Box<dyn Any>` |
| C++      | `std::any payload`      |
| C#       | `object Payload`        |
| Swift    | `var payload: Any`      |

This gives you protobuf `Any`-like flexibility, but in the generated Fory model and without requiring protobuf-style type URLs in the schema surface.

The three features above — `ref`, `union`/`any`, and idiomatic generated code — make Fory IDL an object-graph-first schema language. Schema evolution is a separate concern, but it completes the production story:

### Schema Evolution Out of the Box

Add fields, remove fields, deploy independently. In compatible mode, fields are matched by field id, missing fields get defaults, and unknown fields are skipped:

```protobuf
// Version 1 — deployed to production
message User {
    string name = 1;
    int32 age = 2;
}

// Version 2 — new field added by another team
message User {
    string name = 1;
    int32 age = 2;
    optional string email = 3;  // New: safely ignored by V1 consumers
}
```

This still follows compatibility rules; it is not a license for arbitrary schema changes. But for normal additive and removal changes, you do not need coordinated big-bang deployments or a separate version-negotiation layer.

---

## A Complete Walkthrough

Let's build a realistic e-commerce schema, see it work across current Fory-supported languages, and then make the object-graph part explicit with a shared-customer round trip.

### 1. Define the Schema

Create `ecommerce.fdl`:

```protobuf
package ecommerce;

enum OrderStatus {
    PENDING = 0;
    CONFIRMED = 1;
    SHIPPED = 2;
    DELIVERED = 3;
}

message Address {
    string street = 1;
    string city = 2;
    string country = 3;
}

message Customer {
    string id = 1;
    string name = 2;
    optional string email = 3;
    optional Address address = 4;
}

message OrderItem {
    string sku = 1;
    int32 quantity = 2;
    float64 unit_price = 3;
}

message Order {
    string order_id = 1;
    ref Customer customer = 2;
    list<OrderItem> items = 3;
    OrderStatus status = 4;
    float64 total = 5;
    optional string notes = 6;
    timestamp created_at = 7;
}

message OrderBatch {
    list<Order> orders = 1;
}
```

### 2. Install the Compiler and Generate Code

```bash
pip install fory-compiler

# Generate code for all currently supported Fory IDL languages in one command
foryc ecommerce.fdl \
  --java_out=./java/src/main/java \
  --python_out=./python/gen \
  --go_out=./go/gen \
  --rust_out=./rust/gen \
  --cpp_out=./cpp/gen \
  --csharp_out=./csharp/gen \
  --swift_out=./swift/gen
```

A single command can generate code for multiple languages. Registration helpers, byte helpers, and type IDs are generated automatically.

### 3. Use the Generated Code

**Java** — serialize an order:

```java
import ecommerce.*;

Order order = new Order();
order.setOrderId("ORD-2026-001");

Customer customer = new Customer();
customer.setName("Alice");
customer.setEmail("alice@example.com");
order.setCustomer(customer);

order.setStatus(OrderStatus.CONFIRMED);
order.setTotal(259.98);

// toBytes() / fromBytes() are generated — no Fory boilerplate
byte[] bytes = order.toBytes();
Order restored = Order.fromBytes(bytes);
```

**Python** — deserialize the same bytes:

```python
from ecommerce import Order

# from_bytes() handles registration and deserialization
order = Order.from_bytes(bytes_from_java)
print(f"{order.order_id}: {order.customer.name} — ${order.total}")
# ORD-2026-001: Alice — $259.98
```

**Go** — process the order:

```go
import "gen/ecommerce"

var order ecommerce.Order
if err := order.FromBytes(bytesFromJava); err != nil {
    panic(err)
}
fmt.Printf("%s: %s — $%.2f\n", order.OrderId, order.Customer.Name, order.Total)
```

**Rust** — type-safe deserialization:

```rust
use gen::ecommerce::Order;

let order = Order::from_bytes(&bytes_from_java)?;
println!("{}: {} — ${:.2}", order.order_id, order.customer.name, order.total);
```

**C++** — zero-overhead access:

```cpp
#include "gen/ecommerce.h"

auto order = ecommerce::Order::from_bytes(bytes_from_java).value();
std::cout << order.order_id() << ": " << order.customer().name()
          << " — $" << order.total() << std::endl;
```

**C#** — strongly-typed deserialization:

```csharp
using Ecommerce;

var order = Order.FromBytes(bytesFromJava);
Console.WriteLine($"{order.OrderId}: {order.Customer.Name} — ${order.Total}");
```

**Swift** — idiomatic model access:

```swift
import Ecommerce

let order = try Order.fromBytes(bytesFromJava)
print("\(order.orderId): \(order.customer.name) — $\(order.total)")
```

The same schema and generated code produce compatible bytes across supported languages with no hand-written conversion layer.

### 4. Preserve Shared Identity, Not Just Values

Because `Order.customer` is declared as `ref Customer`, shared identity is part of the schema contract:

```java
Customer customer = new Customer();
customer.setName("Alice");

Order first = new Order();
first.setOrderId("ORD-1");
first.setCustomer(customer);

Order second = new Order();
second.setOrderId("ORD-2");
second.setCustomer(customer);

OrderBatch batch = new OrderBatch();
batch.setOrders(java.util.Arrays.asList(first, second));

OrderBatch restored = OrderBatch.fromBytes(batch.toBytes());
assert restored.getOrders().get(0).getCustomer()
    == restored.getOrders().get(1).getCustomer();
```

With a value-tree serializer, you typically rebuild this identity yourself. With Fory IDL, the `ref` modifier makes it part of the schema and generated code.

---

## The Full Feature Set

### Nullable Fields with `optional`

```protobuf
message Profile {
    string username = 1;          // Non-optional
    optional string bio = 2;     // Nullable
    optional Address home = 3;   // Nullable struct
}
```

| Language | Non-optional           | Optional                     |
| -------- | ---------------------- | ---------------------------- |
| Java     | `String username`      | `String bio` (nullable)      |
| Python   | `username: str`        | `bio: Optional[str]`         |
| Go       | `Username string`      | `Bio *string`                |
| Rust     | `username: String`     | `bio: Option<String>`        |
| C++      | `std::string`          | `std::optional<std::string>` |
| C#       | `string Username`      | `string? Bio`                |
| Swift    | `var username: String` | `var bio: String?`           |

### Nested Types

```protobuf
message SearchResponse {
    message Result {
        string url = 1;
        string title = 2;
        list<string> snippets = 3;
    }
    list<Result> results = 1;
}
```

Nested types are rendered naturally in each language: `SearchResponse.Result` in Java/Python/C#/Swift, `SearchResponse::Result` in C++, `search_response::Result` in Rust, `SearchResponse_Result` in Go.

### Imports for Multi-File Schemas

```protobuf
// common/types.fdl
package common;
message Address {
    string street = 1;
    string city = 2;
}

// models/user.fdl
package models;
import "common/types.fdl";

message User {
    string name = 1;
    Address home = 2;  // Uses imported type
}
```

```bash
foryc models/user.fdl -I common/ --java_out=./gen
```

The compiler resolves imports, catches import cycles, and keeps generated type registration consistent across imported schemas.

### Language-Specific Options

Override output paths and naming conventions per language without affecting cross-language compatibility:

```protobuf
package payment;
option java_package = "com.mycorp.payment.v1";
option go_package = "github.com/mycorp/gen/payment;paymentv1";
option csharp_namespace = "MyCorp.Payment.V1";
```

These options control _where_ code is generated and how host-language names are shaped — not the underlying Fory wire format or cross-language type identity.

### Rich Type System

Fory IDL covers the full range of types you need for production schemas:

| Category    | Types                                                                      |
| ----------- | -------------------------------------------------------------------------- |
| Integers    | `int8`, `int16`, `int32`, `int64`, `uint8`–`uint64`, `fixed_*`, `tagged_*` |
| Floats      | `float32`, `float64`                                                       |
| Strings     | `string`, `bytes`                                                          |
| Temporal    | `date`, `timestamp`, `duration`                                            |
| Special     | `decimal`, `any`, `bool`                                                   |
| Collections | `list<T>`, `map<K, V>`                                                     |
| Modifiers   | `optional`, `ref`, `ref(weak=true)`                                        |

Integer types use varint encoding by default for 32/64-bit values, with explicit `fixed_*` and `tagged_*` variants when you need specific encodings.

---

## Migrating from Protobuf or FlatBuffers

### Protobuf Migration

Already have `.proto` schemas? The Fory compiler can read them directly and generate Fory code from them:

```bash
foryc existing_schema.proto --java_out=./gen --python_out=./gen
```

The output uses Fory-generated types and the Fory binary protocol. Reading `.proto` input does **not** mean protobuf wire compatibility.

Key mapping:

- `repeated T` → `list<T>`
- `oneof` → Fory `union` + optional field
- `google.protobuf.Timestamp` → `timestamp`
- `google.protobuf.Any` → `any`

You can also add Fory-specific extensions in your `.proto` files:

```protobuf
message TreeNode {
  TreeNode parent = 1 [(fory).weak_ref = true];
  repeated TreeNode children = 2 [(fory).ref = true];
}
```

### FlatBuffers Migration

FlatBuffers schemas work too:

```bash
foryc existing_schema.fbs --lang java,python,go --output ./gen
```

Tables become evolving messages, structs become non-evolving messages, and unions map directly to Fory unions. As with protobuf input, the generated output uses Fory types and Fory wire format rather than FlatBuffers binary compatibility. Add `fory_ref:true` or `fory_weak_ref:true` attributes where graph semantics matter.

### Inspect the Translation

See exactly how your protobuf/FlatBuffers schema maps to Fory IDL:

```bash
foryc schema.proto --emit-fdl
```

This prints the translated `.fdl` to stdout — useful for reviewing the mapping before committing to the migration.

---

## Why Not Just Use Protobuf?

A direct comparison with Protocol Buffers is useful because it is the default reference point for many readers.

| Aspect              | Protocol Buffers                        | Fory IDL                                                     |
| ------------------- | --------------------------------------- | ------------------------------------------------------------ |
| Generated types     | Transport-model-first in many languages | Idiomatic language constructs                                |
| Object graphs       | Application-level IDs / rebuilds        | First-class `ref` / `ref(weak=true)`                         |
| Circular references | Not built-in                            | Built into generated schemas                                 |
| Variant fields      | `oneof` / `Any`                         | `union` / `any` in the generated model                       |
| Performance         | Mature baseline                         | Often faster on object serialization workloads               |
| gRPC ecosystem      | Native, mature                          | In progress (active development)                             |
| Schema evolution    | Field numbers + wire types              | Compatible mode for generated schemas with field-id matching |
| Target languages    | Many (via plugins)                      | Java, Python, Go, Rust, C++, C#, Swift (and growing)         |

**Use protobuf** when gRPC ecosystem integration is your primary concern. **Use Fory IDL** when you need idiomatic domain objects, object-graph semantics, reference tracking, or maximum serialization performance.

Benchmark details and methodology live in the repository's [benchmark reports](https://github.com/apache/fory/tree/main/docs/benchmarks).

---

## Build Integration

The Fory compiler integrates into every major build system. Below are examples for a few common ones — the same pattern (invoke `foryc` as a pre-build step) applies to Cargo build scripts, Bazel rules, CMake custom commands, Swift Package Manager plugins, and others:

**Maven (Java):**

```xml
<execution>
  <id>generate-fory-types</id>
  <phase>generate-sources</phase>
  <goals><goal>exec</goal></goals>
  <configuration>
    <executable>foryc</executable>
    <arguments>
      <argument>${basedir}/src/main/fdl/schema.fdl</argument>
      <argument>--java_out</argument>
      <argument>${project.build.directory}/generated-sources/fory</argument>
    </arguments>
  </configuration>
</execution>
```

**Gradle (Kotlin/Java):**

```groovy
task generateForyTypes(type: Exec) {
    commandLine 'foryc', "${projectDir}/src/main/fdl/schema.fdl",
        '--java_out', "${buildDir}/generated/sources/fory"
}
compileJava.dependsOn generateForyTypes
```

**Go Generate:**

```go
//go:generate foryc ../schema.fdl --lang go --output .
package models
```

**Python (setuptools):**

```python
class BuildWithForyIdl(build_py):
    def run(self):
        subprocess.run(['foryc', 'schema.fdl', '--python_out', 'src/generated'], check=True)
        super().run()
```

---

## Best Practices

1. **Use meaningful package names**: `com.myapp.models` groups types logically and drives namespace generation.

2. **Use `optional` explicitly**: Don't rely on default nullability — make the intent clear in the schema.

3. **Use `ref` only when needed**: Reference tracking has a per-object cost. Use it for shared objects and cycles; skip it for value-type payloads.

4. **Use imports for shared types**: Put common types (Address, Timestamp, etc.) in a shared `.fdl` file and import them.

5. **Use `--emit-fdl` to review migrations**: When consuming `.proto` or `.fbs` input, inspect the translated Fory IDL before committing.

---

## Conclusion

Apache Fory Schema IDL puts object-graph semantics into the schema model instead of leaving them to ad-hoc application code. If you need shared refs, circular structures, polymorphic fields, schema evolution, and generated models that still look idiomatic in each language, it gives you one schema and one compiler workflow for all of that.

Define your types once. Generate everywhere. Serialize object graphs without giving up idiomatic models.

**Get started:**

```bash
pip install fory-compiler
foryc --help
```

**Documentation:**

- Fory IDL Syntax: [fory.apache.org/docs/compiler/syntax](https://fory.apache.org/docs/compiler/syntax)
- Compiler CLI Guide: [fory.apache.org/docs/compiler/compiler_guide](https://fory.apache.org/docs/compiler/compiler_guide)
- Generated Code Reference: [fory.apache.org/docs/compiler/generated_code](https://fory.apache.org/docs/compiler/generated_code)
- Cross-Language Serialization: [fory.apache.org/docs/guide/xlang](https://fory.apache.org/docs/guide/xlang/serialization_index)
- Protobuf Migration: [fory.apache.org/docs/compiler/protobuf_idl_support](https://fory.apache.org/docs/compiler/protobuf_idl_support)
- Benchmark Reports: [github.com/apache/fory/tree/main/docs/benchmarks](https://github.com/apache/fory/tree/main/docs/benchmarks)

**Community:**

- GitHub: [apache/fory](https://github.com/apache/fory)
- Slack: [Join our community](https://join.slack.com/t/fory-project/shared_invite/zt-1u8soj4qc-ieYEu7ciHOqA2mo47llS8A)
- License: Apache License 2.0
