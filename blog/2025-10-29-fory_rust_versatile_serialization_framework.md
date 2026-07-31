---
slug: fory_rust_versatile_serialization_framework
title: "Introducing Apache Fory™ Rust: A Versatile Serialization Framework for the Modern Age"
authors: [chaokunyang]
tags: [fory, rust]
---

**TL;DR**: Apache Fory Rust is a blazingly-fast, cross-language serialization framework that delivers **ultra-fast serialization performance** while supporting **shared and circular references, trait objects, schema evolution, row-format access, and external types**. Built with Rust's safety guarantees and compile-time code generation, it's designed for developers who refuse to compromise between performance and developer experience.

- 🐙 GitHub: https://github.com/apache/fory
- 📦 Crate: https://crates.io/crates/fory

<img src="/img/fory-logo-light.png" width="50%"/>

---

## The Serialization Dilemma

Every backend engineer has faced this moment: your application needs to serialize complex data structures such as nested objects, circular references, polymorphic types, and you're forced to choose between three bad options:

1. **Fast but fragile**: Hand-rolled binary formats that break with schema changes
2. **Flexible but slow**: Text formats that add substantial runtime overhead
3. **Complex and limiting**: Existing solutions that don't support your language's advanced features

Apache Fory Rust eliminates this false choice. It's a serialization framework that delivers exceptional performance while handling the complexities of modern applications—with derived Rust schemas for native development and an optional shared IDL when teams want generated types across languages.

## What Makes Apache Fory Rust Different?

### 1. **Truly Cross-Language**

Apache Fory Rust speaks the same binary protocol as Java, Python, C++, Go, C#, Swift, Dart, and other language implementations. Register matching schemas on each side, serialize data in Rust, and deserialize it in another language using the same compact binary format.

```rust
use fory::{Fory, ForyStruct};
use std::collections::HashMap;

#[derive(ForyStruct)]
struct User {
    name: String,
    age: i32,
    metadata: HashMap<String, String>,
}

let mut fory = Fory::builder().xlang(true).build();
fory.register::<User>(100)?;

let user = User {
    name: "Alice".to_string(),
    age: 30,
    metadata: HashMap::from([(
        "role".to_string(),
        "admin".to_string(),
    )]),
};
let bytes = fory.serialize(&user)?;
// Register the matching type in another Fory runtime and deserialize `bytes`.
```

This isn't just convenient—it changes how we develop microservice architectures where different teams use different languages. Numeric IDs provide compact type metadata, while stable registered names make coordination easier across independently managed services.

### 2. **Automatic Shared/Circular Reference Handling**

Most serialization frameworks panic when encountering circular references. Apache Fory tracks and preserves reference identity automatically:

**Shared Reference**:

```rust
use fory::Fory;
use std::rc::Rc;

let fory = Fory::builder()
    .xlang(false)
    .track_ref(true)
    .build();

// Create a shared value
let shared = Rc::new(String::from("shared_value"));

// Reference it multiple times
let data = vec![shared.clone(), shared.clone(), shared.clone()];

// The shared value is serialized only once
let bytes = fory.serialize(&data)?;
let decoded: Vec<Rc<String>> = fory.deserialize(&bytes)?;

// Verify reference identity is preserved
assert_eq!(decoded.len(), 3);
assert_eq!(*decoded[0], "shared_value");

// All three Rc pointers point to the same object
assert!(Rc::ptr_eq(&decoded[0], &decoded[1]));
assert!(Rc::ptr_eq(&decoded[1], &decoded[2]));
```

**Circular Reference**:

```rust
use fory::{Fory, ForyStruct, RcWeak};
use std::{cell::RefCell, rc::Rc};

#[derive(ForyStruct)]
struct Node {
    value: i32,
    parent: RcWeak<RefCell<Node>>,     // Weak pointer breaks cycles
    children: Vec<Rc<RefCell<Node>>>,  // Strong references tracked
}

let mut fory = Fory::builder()
    .xlang(false)
    .track_ref(true)
    .build();
fory.register::<Node>(100)?;

// Build a parent-child tree with circular references
let parent = Rc::new(RefCell::new(Node { ... }));
let child = Rc::new(RefCell::new(Node {
    parent: RcWeak::from(&parent),  // Points back to parent
    ...
}));
parent.borrow_mut().children.push(child.clone());

// Serialization handles the cycle automatically
let bytes = fory.serialize(&parent)?;
let decoded: Rc<RefCell<Node>> = fory.deserialize(&bytes)?;

// Reference relationships preserved!
let decoded_child = decoded.borrow().children[0].clone();
let decoded_parent = decoded_child.borrow().parent.upgrade().unwrap();
assert!(Rc::ptr_eq(&decoded, &decoded_parent));
```

This isn't just a feature—it's essential for graph databases, object-relational mappers, and domain models.

### 3. **Trait Object Serialization**

Rust's trait system enables powerful abstractions, but serializing `Box<dyn Trait>` is notoriously difficult. Apache Fory makes it trivial:

```rust
use fory::{register_trait_type, Fory, ForyObject, ForyStruct};

trait Animal: ForyObject {
    fn speak(&self) -> String;
}

#[derive(ForyStruct)]
struct Dog { name: String, breed: String }

impl Animal for Dog {
    fn speak(&self) -> String {
        "Woof!".to_string()
    }
}

#[derive(ForyStruct)]
struct Cat { name: String, color: String }

impl Animal for Cat {
    fn speak(&self) -> String {
        "Meow!".to_string()
    }
}

// Register implementations
register_trait_type!(Animal, Dog, Cat);

let mut fory = Fory::builder().xlang(false).build();
fory.register::<Dog>(100)?;
fory.register::<Cat>(101)?;

// Serialize heterogeneous collections
let animals: Vec<Box<dyn Animal>> = vec![
    Box::new(Dog { ... }),
    Box::new(Cat { ... }),
];

let bytes = fory.serialize(&animals)?;
let decoded: Vec<Box<dyn Animal>> = fory.deserialize(&bytes)?;

// Polymorphism preserved!
decoded[0].speak();  // "Woof!"
decoded[1].speak();  // "Meow!"
```

**Alternative: Using `dyn Any` without trait registration**:

```rust
use std::rc::Rc;
use std::any::Any;

// No trait definition or registration needed
let dog: Rc<dyn Any> = Rc::new(Dog { name: "Rex".to_string(), breed: "Labrador".to_string() });
let cat: Rc<dyn Any> = Rc::new(Cat { name: "Whiskers".to_string(), color: "Orange".to_string() });

let bytes = fory.serialize(&dog)?;
let decoded: Rc<dyn Any> = fory.deserialize(&bytes)?;

// Downcast to concrete type
let unwrapped = decoded.downcast_ref::<Dog>().unwrap();
assert_eq!(unwrapped.name, "Rex");
```

**Supports**:

- `Box<dyn Trait>` - Owned trait objects
- `Rc<dyn Trait>` / `Arc<dyn Trait>` - Reference-counted trait objects
- `Rc<dyn Any>` / `Arc<dyn Any + Send + Sync>` - Runtime type dispatch without traits
- Generated root serializers for `Rc<dyn Trait>` and `Arc<dyn Trait>`

This unlocks plugin systems, heterogeneous collections, and extensible architectures that were previously impossible to serialize.

### 4. **Schema Evolution Without Breaking Changes**

Microservices evolve independently. Apache Fory's **Compatible mode** allows schema changes without coordination:

```rust
use fory::{Fory, ForyStruct};
use std::collections::HashMap;

// Service A: Version 1
#[derive(ForyStruct)]
struct UserV1 {
    name: String,
    age: i32,
    address: String,
}

let mut fory_v1 = Fory::builder().xlang(false).build();
fory_v1.register::<UserV1>(1)?;

// Service B: Version 2 (evolved independently)
#[derive(ForyStruct)]
struct UserV2 {
    name: String,
    age: i32,
    // address removed
    phone: Option<String>,     // New field
    metadata: HashMap<String, String>,  // Another new field
}

let mut fory_v2 = Fory::builder().xlang(false).build();
fory_v2.register::<UserV2>(1)?;

// V1 data deserializes into V2 structure
let v1_bytes = fory_v1.serialize(&user_v1)?;
let user_v2: UserV2 = fory_v2.deserialize(&v1_bytes)?;
// Missing fields get default values automatically
```

**Compatibility rules**:

- ✅ Add new fields (default values applied)
- ✅ Remove fields (skipped during deserialization)
- ✅ Reorder fields (matched by name)
- ✅ Change nullability (`T` ↔ `Option<T>`)
- ✅ Selected scalar type changes when conversion is lossless
- ❌ Lossy or incompatible type changes

This is critical for zero-downtime deployments and polyglot microservices.

### 5. **External-Type Serialization**

Rust's orphan rules normally prevent you from deriving a serialization trait for a type owned by another crate. Apache Fory solves this without forcing wrapper objects into your application model:

```rust
use fory::{Fory, ForyStruct};

#[derive(ForyStruct)]
#[fory(target = third_party::User)]
struct UserSerializer {
    name: String,
    age: u32,
}

let mut fory = Fory::builder().xlang(true).build();
fory.register::<UserSerializer>(100)?;

let user = third_party::User {
    name: "Alice".to_string(),
    age: 30,
};

let bytes = fory.serialize_with::<UserSerializer>(&user)?;
let decoded: third_party::User =
    fory.deserialize_with::<UserSerializer>(&bytes)?;
```

`UserSerializer` is a compile-time schema and code-generation declaration, not a mirror value created at runtime. Fory reads fields from `third_party::User` and reconstructs that type directly. The same serializer can be selected for a field with `#[fory(with = UserSerializer)]`, while carrier serializers such as `VecSerializer<UserSerializer>` extend the model to collection roots.

For opaque types with private fields or invariants, implement Fory's `Serializer` trait instead. Together, these two paths make third-party types first-class citizens without modifying their source code or adding conversion layers.

## The Technical Foundation

### Protocol Design

Apache Fory uses a sophisticated binary protocol designed for both performance and flexibility:

```
| fory header | reference meta | type meta | value data |
```

**Key innovations**:

1. **Efficient encoding**: Variable-length integers, compact type IDs, bit-packed flags
2. **Reference tracking**: Deduplicates shared objects automatically (serialize once, reference thereafter)
3. **Compact metadata**: Encodes and deduplicates type metadata efficiently
4. **Little-endian layout**: Optimized for modern CPU architectures

### Compile-Time Code Generation

Unlike reflection-based frameworks, Apache Fory generates serialization code at compile time via procedural macros:

```rust
use fory::ForyStruct;

#[derive(ForyStruct)]
struct Person {
    name: String,
    age: i32,
    address: Address,
}

// The derive generates the serializer implementation and schema metadata.
```

**Benefits**:

- ⚡ **Zero runtime overhead**: No reflection, no vtable lookups
- 🛡️ **Type safety**: Compile-time errors instead of runtime panics
- 📦 **Small binary size**: Only code for types you actually use
- 🔍 **IDE support**: Full autocomplete and error checking

### Architecture

Apache Fory Rust consists of three focused crates:

```
fory/            # Public API facade
  └─ Runtime and derive re-exports

fory-core/       # Core serialization engine
  ├─ fory.rs         # Main entry point
  ├─ buffer.rs       # Zero-copy binary I/O
  ├─ serializer/     # Type-specific serializers
  ├─ resolver/       # Type registration & dispatch
  ├─ meta/           # Meta string compression
  ├─ types/          # Built-in Fory types
  └─ row/            # Row format implementation

fory-derive/     # Procedural macros
  ├─ object/         # ForyStruct/ForyEnum/ForyUnion derives
  └─ fory_row.rs     # ForyRow derive macro
```

This modular design ensures clean separation of concerns and makes the codebase maintainable.

## Benchmarks: Real-World Performance

The current Rust benchmark suite measures serialization and deserialization throughput across representative primitive, collection, struct, and nested-object workloads. It compares Apache Fory with Prost Protocol Buffers and MessagePack under the same checked-in benchmark harness.

![Rust serialization benchmark throughput](../docs/benchmarks/rust/throughput.png)

The chart shows why Fory is built for performance-sensitive systems: its generated serializers, compact binary layout, and specialized collection paths deliver high throughput without giving up the features required by complex Rust applications. See the [complete Rust benchmark report](/docs/benchmarks/rust/) for the environment, workload definitions, payload sizes, and detailed results.

## When to Use Apache Fory Rust

### ✅ **Ideal Use Cases**

1. **Microservices with polyglot teams**
   - Different services in different languages
   - Need compact data exchange through a shared protocol
   - Schema evolution across independent deployments

2. **High-performance data pipelines**
   - Processing millions of records per second
   - Memory-constrained environments (use row format)
   - Analytics workloads with selective field access

3. **Complex domain models**
   - Circular references (parent-child relationships, graphs)
   - Polymorphic types (trait objects, inheritance hierarchies)
   - Rich object graphs with shared references

4. **Real-time systems**
   - Low-latency serialization requirements
   - Repeated access to large structured datasets
   - Zero-copy row-format field access

### ⚠️ **Consider Alternatives If**

1. **You need human-readable data**: Use JSON/YAML for debugging
2. **You need long-term storage format**: Use Parquet for data lakes
3. **Your data is trivial**: serde + bincode is simpler for basic types

## Getting Started in 5 Minutes

### Installation

Add to `Cargo.toml`:

```toml
[dependencies]
fory = "1.5.0"
```

### Basic Object Serialization

```rust
use fory::{Error, Fory, ForyStruct};

#[derive(ForyStruct, Debug, PartialEq)]
struct User {
    name: String,
    age: i32,
    email: String,
}

fn main() -> Result<(), Error> {
    let mut fory = Fory::builder().xlang(false).build();
    fory.register::<User>(1)?;  // Register with a unique ID
    let user = User {
        name: "Alice".to_string(),
        age: 30,
        email: "alice@example.com".to_string(),
    };
    // Serialize
    let bytes = fory.serialize(&user)?;
    // Deserialize
    let decoded: User = fory.deserialize(&bytes)?;
    assert_eq!(user, decoded);
    Ok(())
}
```

### Cross-Language Serialization

```rust
use fory::Fory;

// Enable cross-language mode
let mut fory = Fory::builder().xlang(true).build();

// Register the same logical type by ID or name in every language
fory.register::<User>(100)?;
// fory.register_by_name::<User>("example.User")?;

let bytes = fory.serialize(&user)?;
// This can now be deserialized in Java, Python, Go, etc.
```

Register types with **consistent IDs or names** across all languages:

- **By ID** (`fory.register::<User>(1)`): Faster serialization, more compact encoding, but requires coordination to avoid ID conflicts
- **By name** (`fory.register_by_name::<User>("example.User")`): More flexible, less prone to conflicts, easier to manage across teams, but slightly larger encoding

## Supported Types

Apache Fory Rust supports a comprehensive type system:

**Primitives**: `bool`, `i8`, `i16`, `i32`, `i64`, `f32`, `f64`, `String`

**Collections**: `Vec<T>`, `VecDeque<T>`, `LinkedList<T>`, `HashMap<K,V>`, `BTreeMap<K,V>`, `HashSet<T>`, `BTreeSet<T>`, `BinaryHeap<T>`, `Option<T>`

**Smart Pointers**: `Box<T>`, `Rc<T>`, `Arc<T>`, `RcWeak<T>`, `ArcWeak<T>`, `RefCell<T>`, `Mutex<T>`

**Date/Time**: `Date`, `Timestamp`, `Duration`, and supported `chrono` types

**Custom Types**: Derive `ForyStruct`, `ForyEnum`, or `ForyUnion` for object graphs, and `ForyRow` for row format

**Trait Objects**: `Box<dyn T>`, `Rc<dyn T>`, `Arc<dyn T>`, `Rc<dyn Any>`, `Arc<dyn Any + Send + Sync>`

## Production Considerations

### Thread Safety

`Fory` becomes fully thread-safe after registration is complete. Once every type is registered (which requires `&mut Fory`), wrap the instance in an `Arc` and freely share it across worker threads for concurrent serialization and deserialization.

```rust
use fory::Fory;
use std::{sync::Arc, thread};

let mut fory = Fory::builder().xlang(false).build();
fory.register::<Item>(1)?;
let fory = Arc::new(fory); // `Fory` is Send + Sync once registration is done

let item = Item::default();
let handles: Vec<_> = (0..4)
    .map(|_| {
        let fory = Arc::clone(&fory);
        let input = item.clone();
        thread::spawn(move || {
            let bytes = fory.serialize(&input).expect("serialization succeeds");
            let decoded: Item = fory.deserialize(&bytes).expect("valid data");
            (bytes, decoded)
        })
    })
    .collect();

for handle in handles {
    let (bytes, decoded) = handle.join().expect("thread finished");
    // work with `bytes` / `decoded`
}
```

### Error Handling

Apache Fory uses `Result<T, Error>` for all fallible operations:

```rust
match fory.deserialize::<User>(&bytes) {
    Ok(user) => process_user(user),
    Err(e) => log::error!("Deserialization failed: {}", e),
}
```

## Documentation

- Apache Fory Rust Guide: [📖 View](https://fory.apache.org/docs/guide/rust/)
- Apache Fory External-Type Serialization: [📖 View](https://fory.apache.org/docs/guide/rust/external_types)
- Apache Fory Rust Benchmarks: [📊 View](https://fory.apache.org/docs/benchmarks/rust/)
- Apache Fory Rust API Doc: [📖 View](https://docs.rs/fory/latest/fory/)
- Apache Fory Xlang Serialization Spec: [📖 View](https://fory.apache.org/docs/specification/fory_xlang_serialization_spec/)

## Community and Contribution

Apache Fory is an **Apache Software Foundation** project with a vibrant, growing community:

- **GitHub**: [apache/fory](https://github.com/apache/fory)
- **Docs**: [fory.apache.org](https://fory.apache.org)
- **Slack**: [Join our community](https://join.slack.com/t/fory-project/shared_invite/zt-1u8soj4qc-ieYEu7ciHOqA2mo47llS8A)
- **Issue Tracker**: [GitHub Issues](https://github.com/apache/fory/issues)

### How to Contribute

We welcome contributions of all kinds:

1. **Code**: Implement features and improve existing capabilities
2. **Docs**: Write tutorials, examples, and guides
3. **Testing**: Add benchmarks, fuzz tests, integration tests
4. **Feedback**: Report bugs, request features, share use cases

See [CONTRIBUTING.md](https://github.com/apache/fory/blob/main/CONTRIBUTING.md) for guidelines.

### License

Apache Fory is licensed under the **Apache License 2.0**, a permissive open-source license that allows commercial use, modification, and distribution.

## Conclusion

Apache Fory Rust represents a paradigm shift in serialization:

- **No more trade-offs**: Get performance _and_ flexibility
- **No more boilerplate**: Derive macros handle the complexity
- **No more conversion layers**: External-type serializers work directly with third-party values

Whether you're building microservices, data pipelines, or real-time systems, Apache Fory Rust delivers the performance you need with the ergonomics you deserve.

**Try it today**:

```bash
cargo add fory
```

**Join the community**:

```bash
git clone https://github.com/apache/fory.git
cd fory/rust
cargo test --features tests
```

**Share your experience**:

- Write a blog post about your use case
- Present at your local Rust meetup
- Contribute benchmarks from your domain
