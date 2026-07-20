---
id: usage
title: Usage
sidebar_position: 1
---

This section provides quick examples for getting started with Apache Fory™.

## Choose A Mode

Apache Fory™ has two wire modes:

- **Xlang mode** is the default and the portable format for payloads shared across languages. Use it for cross-language services and for runtimes that expose only xlang mode: Dart, JavaScript/TypeScript, C#, and Swift.
- **Native mode** is selected with `xlang=false` or the equivalent builder option in Java, Scala, Kotlin, Python, C++, Go, and Rust. Use it for same-language traffic because it follows the runtime's native type system, supports a broader language-specific object surface, and is optimized for that runtime.

Xlang/default usage uses schema-compatible mode by default. Native mode uses schema-consistent payloads by default unless compatible mode is enabled explicitly.

## Xlang Mode

Use xlang mode when bytes need to cross runtime boundaries. Register custom types with the same numeric ID or namespace/type name on every peer.

Dual-mode runtimes set the xlang option explicitly in the examples below. Dart, JavaScript/TypeScript, C#, and Swift are xlang-only, so their examples do not show an xlang switch.

### Java

```java
import org.apache.fory.Fory;

public class XlangExample {
  public record Person(String name, int age) {}

  public static void main(String[] args) {
    Fory fory = Fory.builder()
        .withXlang(true)
        .build();
    fory.register(Person.class, "example", "Person");

    Person person = new Person("chaokunyang", 28);
    byte[] bytes = fory.serialize(person);
    Person result = (Person) fory.deserialize(bytes);
    System.out.println(result.name() + " " + result.age());
  }
}
```

### Python

```python
from dataclasses import dataclass
import pyfory

@dataclass
class Person:
    name: str
    age: pyfory.Int32

fory = pyfory.Fory(xlang=True)
fory.register(Person, typename="example.Person")

person = Person(name="chaokunyang", age=28)
data = fory.serialize(person)
result = fory.deserialize(data)
print(result.name, result.age)
```

### Dart

```dart
import 'package:fory/fory.dart';

part 'person.fory.dart';

@ForyStruct()
class Person {
  Person();

  String name = '';

  @ForyField(type: Int32Type())
  int age = 0;
}

void main() {
  final fory = Fory();
  PersonFory.register(
    fory,
    Person,
    namespace: 'example',
    typeName: 'Person',
  );

  final person = Person()
    ..name = 'chaokunyang'
    ..age = 28;

  final bytes = fory.serialize(person);
  final result = fory.deserialize<Person>(bytes);
  print('${result.name} ${result.age}');
}
```

### Go

```go
package main

import (
    "fmt"

    "github.com/apache/fory/go/fory"
)

type Person struct {
    Name string
    Age  int32
}

func main() {
    f := fory.New(fory.WithXlang(true))
    if err := f.RegisterStruct(Person{}, 1); err != nil {
        panic(err)
    }

    person := &Person{Name: "chaokunyang", Age: 28}
    data, err := f.Serialize(person)
    if err != nil {
        panic(err)
    }

    var result Person
    if err := f.Deserialize(data, &result); err != nil {
        panic(err)
    }

    fmt.Printf("%s %d\n", result.Name, result.Age)
}
```

### Rust

```rust
use fory::{Error, Fory, ForyObject};

#[derive(ForyObject, Debug, PartialEq)]
struct Person {
    name: String,
    age: i32,
}

fn main() -> Result<(), Error> {
    let mut fory = Fory::builder().xlang(true).build();
    fory.register_by_name::<Person>("example", "Person")?;

    let person = Person {
        name: "chaokunyang".to_string(),
        age: 28,
    };

    let bytes = fory.serialize(&person)?;
    let result: Person = fory.deserialize(&bytes)?;
    assert_eq!(person, result);
    Ok(())
}
```

### C++

```cpp
#include <cassert>
#include <string>

#include "fory/serialization/fory.h"

using namespace fory::serialization;

struct Person {
  std::string name;
  int32_t age;

  bool operator==(const Person &other) const {
    return name == other.name && age == other.age;
  }

  FORY_STRUCT(Person, name, age);
};

int main() {
  auto fory = Fory::builder().xlang(true).build();
  fory.register_struct<Person>(1);

  Person person{"chaokunyang", 28};
  auto bytes = fory.serialize(person).value();
  auto result = fory.deserialize<Person>(bytes).value();
  assert(person == result);
  return 0;
}
```

### Scala

```scala
import org.apache.fory.Fory
import org.apache.fory.scala.ForyScala

case class Person(name: String, age: Int)

object Example {
  def main(args: Array[String]): Unit = {
    val fory: Fory = ForyScala.builder()
      .withXlang(true)
      .build()
    fory.register(classOf[Person])

    val bytes = fory.serialize(Person("chaokunyang", 28))
    val result = fory.deserialize(bytes).asInstanceOf[Person]
    println(s"${result.name} ${result.age}")
  }
}
```

### Kotlin

```kotlin
import org.apache.fory.ThreadSafeFory
import org.apache.fory.kotlin.ForyKotlin

data class Person(val name: String, val age: Int)

fun main() {
    val fory: ThreadSafeFory = ForyKotlin.builder()
        .withXlang(true)
        .requireClassRegistration(true)
        .buildThreadSafeFory()
    fory.register(Person::class.java)

    val bytes = fory.serialize(Person("chaokunyang", 28))
    val result = fory.deserialize(bytes) as Person
    println("${result.name} ${result.age}")
}
```

### JavaScript / TypeScript

```typescript
import Fory, { Type } from "@apache-fory/core";

const personType = Type.struct(
  { typeName: "example.Person" },
  {
    name: Type.string(),
    age: Type.int32(),
  },
);

const fory = new Fory();
const { serialize, deserialize } = fory.register(personType);

const payload = serialize({ name: "chaokunyang", age: 28 });
const result = deserialize(payload);
console.log(result);
```

### C\#

```csharp
using Apache.Fory;

[ForyObject]
public sealed class Person
{
    public string Name { get; set; } = string.Empty;
    public int Age { get; set; }
}

Fory fory = Fory.Builder().Build();
fory.Register<Person>(1);

Person person = new() { Name = "chaokunyang", Age = 28 };
byte[] data = fory.Serialize(person);
Person result = fory.Deserialize<Person>(data);

Console.WriteLine($"{result.Name} {result.Age}");
```

### Swift

```swift
import Fory

@ForyStruct
struct Person: Equatable {
    var name: String = ""
    var age: Int32 = 0
}

let fory = Fory()
fory.register(Person.self, id: 1)

let person = Person(name: "chaokunyang", age: 28)
let data = try fory.serialize(person)
let result: Person = try fory.deserialize(data)

print("\(result.name) \(result.age)")
```

For more cross-language rules and examples, see:

- [Cross-Language Serialization Guide](../guide/xlang/index.md)
- [Java Guide](../guide/java/index.md)
- [Python Guide](../guide/python/index.md)
- [Dart Guide](../guide/dart/index.md)
- [Go Guide](../guide/go/index.md)
- [Rust Guide](../guide/rust/index.md)
- [C++ Guide](../guide/cpp/index.md)
- [C# Guide](../guide/csharp/index.md)
- [Swift Guide](../guide/swift/index.md)

## Native Mode

Use native mode only when every reader and writer is the same runtime family. Native mode supports broader language-specific object models than portable xlang mappings and is optimized for the owning runtime.

Java and Python native modes are first-class same-language entry points. Use Java native mode when replacing JDK serialization, Kryo, FST, Hessian, or Java-only Protocol Buffers payloads. Use Python native mode when replacing `pickle` or `cloudpickle` for Python-only payloads.

Dart, JavaScript/TypeScript, C#, and Swift do not expose native mode.

### Java

```java
Fory fory = Fory.builder()
    .withXlang(false)
    .requireClassRegistration(true)
    .build();
```

Register Java classes and use `serialize` / `deserialize` as usual. See the [Java Guide](../guide/java/index.md) for Java object hooks, `Externalizable`, dynamic object graphs, object copy, and Java native-mode zero-copy buffers.

### Python

```python
import pyfory

fory = pyfory.Fory(xlang=False, ref=False, strict=True)
```

Register Python classes and use `serialize` / `deserialize` as usual. See the [Python Guide](../guide/python/index.md) for native-mode pickle replacement behavior and security settings.

### Go

```go
f := fory.New(fory.WithXlang(false))
```

Use native mode for Go-only structs, pointers, interfaces, and Go-specific type behavior. See the [Go Guide](../guide/go/index.md) for struct tags and native-mode configuration.

### Rust

```rust
let mut fory = Fory::builder().xlang(false).build();
```

Use native mode for Rust-only payloads that rely on Rust-specific object behavior. See the [Rust Guide](../guide/rust/index.md) for derive, references, and supported types.

### C++

```cpp
auto fory = Fory::builder().xlang(false).build();
```

Use native mode for C++-only traffic that does not need portable xlang type mappings. See the [C++ Guide](../guide/cpp/index.md) for `FORY_STRUCT`, configuration, and schema metadata.

### Scala

```scala
val fory = ForyScala.builder()
  .withXlang(false)
  .build()
```

Use native mode for Scala/JVM-only traffic that needs Scala case classes, collections, tuples, options, or enums on the JVM runtime path. See the [Scala Guide](../guide/scala/index.md).

### Kotlin

```kotlin
val fory = ForyKotlin.builder()
    .withXlang(false)
    .requireClassRegistration(true)
    .buildThreadSafeFory()
```

Use native mode for Kotlin/JVM-only traffic that needs Kotlin data classes, nullable types, ranges, unsigned values, or Kotlin collections on the JVM runtime path. See the [Kotlin Guide](../guide/kotlin/index.md).

## Row Format Encoding

Row format provides zero-copy random access to serialized data, making it ideal for analytics workloads and data processing pipelines.

### Java

```java
import org.apache.fory.format.*;
import java.util.*;
import java.util.stream.*;

public class Bar {
  String f1;
  List<Long> f2;
}

public class Foo {
  int f1;
  List<Integer> f2;
  Map<String, Integer> f3;
  List<Bar> f4;
}

RowEncoder<Foo> encoder = Encoders.bean(Foo.class);
Foo foo = new Foo();
foo.f1 = 10;
foo.f2 = IntStream.range(0, 1000000).boxed().collect(Collectors.toList());
foo.f3 = IntStream.range(0, 1000000).boxed().collect(Collectors.toMap(i -> "k"+i, i -> i));

List<Bar> bars = new ArrayList<>(1000000);
for (int i = 0; i < 1000000; i++) {
  Bar bar = new Bar();
  bar.f1 = "s" + i;
  bar.f2 = LongStream.range(0, 10).boxed().collect(Collectors.toList());
  bars.add(bar);
}
foo.f4 = bars;

// Serialize to row format (can be zero-copy read by Python)
BinaryRow binaryRow = encoder.toRow(foo);

// Deserialize entire object
Foo newFoo = encoder.fromRow(binaryRow);

// Zero-copy access to nested fields without full deserialization
BinaryArray binaryArray2 = binaryRow.getArray(1);  // Access f2 field
BinaryArray binaryArray4 = binaryRow.getArray(3);  // Access f4 field
BinaryRow barStruct = binaryArray4.getStruct(10);   // Access 11th Bar element
long value = barStruct.getArray(1).getInt64(5);     // Access nested value

// Partial deserialization
RowEncoder<Bar> barEncoder = Encoders.bean(Bar.class);
Bar newBar = barEncoder.fromRow(barStruct);
Bar newBar2 = barEncoder.fromRow(binaryArray4.getStruct(20));
```

### Python

```python
from dataclasses import dataclass
from typing import List, Dict
import pyarrow as pa
import pyfory

@dataclass
class Bar:
    f1: str
    f2: List[pa.int64]

@dataclass
class Foo:
    f1: pa.int32
    f2: List[pa.int32]
    f3: Dict[str, pa.int32]
    f4: List[Bar]

encoder = pyfory.encoder(Foo)
foo = Foo(
    f1=10,
    f2=list(range(1000_000)),
    f3={f"k{i}": i for i in range(1000_000)},
    f4=[Bar(f1=f"s{i}", f2=list(range(10))) for i in range(1000_000)]
)

# Serialize to row format
binary: bytes = encoder.to_row(foo).to_bytes()

# Zero-copy random access without full deserialization
foo_row = pyfory.RowData(encoder.schema, binary)
print(foo_row.f2[100000])           # Access element directly
print(foo_row.f4[100000].f1)        # Access nested field
print(foo_row.f4[200000].f2[5])     # Access deeply nested field
```

For more details on row format, see [Java Row Format Guide](../guide/java/row-format.md) or [Python Row Format Guide](../guide/python/row-format.md).
