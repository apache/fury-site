---
id: usage
title: 使用
sidebar_position: 1
---

本章节提供 Apache Fory™ 的快速入门示例。

## 选择模式

Apache Fory™ 有两种线格式模式：

- **xlang 模式**是默认模式，也是跨语言共享载荷时使用的可移植格式。跨语言服务应使用 xlang 模式；Dart、JavaScript/TypeScript、C# 和 Swift 也只暴露 xlang 模式。
- **原生模式**通过 `xlang=false` 或对应的 builder 选项启用，适用于 Java、Scala、Kotlin、Python、C++、Go 和 Rust。只有读写双方都属于同一运行时家族时才使用原生模式，因为它遵循该运行时的原生类型系统，支持更广的语言特有对象面，并针对该运行时优化。

xlang/default 用法默认使用 schema-compatible 模式。原生模式默认使用 schema-consistent 载荷，只有显式启用 compatible 模式时才改变。

## xlang 模式

当字节需要跨运行时边界传输时使用 xlang 模式。自定义类型需要在每个对端使用相同的数字 ID 或 namespace/type name 注册。

下面的示例中，支持双模式的运行时都会显式设置 xlang 选项。Dart、JavaScript/TypeScript、C# 和 Swift 只支持 xlang 模式，因此示例不会展示 xlang 开关。

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

更多跨语言规则和示例请参见：

- [跨语言序列化指南](../guide/xlang/index.md)
- [Java 指南](../guide/java/index.md)
- [Python 指南](../guide/python/index.md)
- [Dart 指南](../guide/dart/index.md)
- [Go 指南](../guide/go/index.md)
- [Rust 指南](../guide/rust/index.md)
- [C++ 指南](../guide/cpp/index.md)
- [C# 指南](../guide/csharp/index.md)
- [Swift 指南](../guide/swift/index.md)

## 原生模式

只有在每个读写方都属于同一运行时家族时才使用原生模式。原生模式支持比可移植 xlang 映射更广的语言特有对象模型，并针对所属运行时优化。

Java 和 Python 的原生模式都是同语言场景的一等入口。当你要替换 JDK serialization、Kryo、FST、Hessian 或 Java-only Protocol Buffers 载荷时，Java 应从原生模式开始。当你要替换 `pickle` 或 `cloudpickle` 并且载荷只在 Python 内流转时，Python 应使用原生模式。

Dart、JavaScript/TypeScript、C# 和 Swift 不暴露原生模式。

### Java

```java
Fory fory = Fory.builder()
    .withXlang(false)
    .requireClassRegistration(true)
    .build();
```

注册 Java 类后照常使用 `serialize` / `deserialize`。Java 对象钩子、`Externalizable`、动态对象图、对象拷贝和 Java 原生模式 zero-copy buffer 参见 [Java 指南](../guide/java/index.md)。

### Python

```python
import pyfory

fory = pyfory.Fory(xlang=False, ref=False, strict=True)
```

注册 Python 类后照常使用 `serialize` / `deserialize`。原生模式的 pickle 替代行为和安全设置参见 [Python 指南](../guide/python/index.md)。

### Go

```go
f := fory.New(fory.WithXlang(false))
```

Go-only 结构体、指针、接口和 Go 特有类型行为可使用原生模式。struct tag 和原生模式配置参见 [Go 指南](../guide/go/index.md)。

### Rust

```rust
let mut fory = Fory::builder().xlang(false).build();
```

依赖 Rust 特有对象行为的 Rust-only 载荷可使用原生模式。derive、引用和支持类型参见 [Rust 指南](../guide/rust/index.md)。

### C++

```cpp
auto fory = Fory::builder().xlang(false).build();
```

不需要可移植 xlang 类型映射的 C++-only 流量可使用原生模式。`FORY_STRUCT`、配置和 schema metadata 参见 [C++ 指南](../guide/cpp/index.md)。

### Scala

```scala
val fory = ForyScala.builder()
  .withXlang(false)
  .build()
```

需要 Scala case class、集合、tuple、option 或 enum 并且只在 Scala/JVM 内流转的载荷可使用原生模式。参见 [Scala 指南](../guide/scala/index.md)。

### Kotlin

```kotlin
val fory = ForyKotlin.builder()
    .withXlang(false)
    .requireClassRegistration(true)
    .buildThreadSafeFory()
```

需要 Kotlin data class、可空类型、range、unsigned value 或 Kotlin 集合并且只在 Kotlin/JVM 内流转的载荷可使用原生模式。参见 [Kotlin 指南](../guide/kotlin/index.md)。

## Row Format 编码

Row format 提供对序列化数据的零拷贝随机访问，适合分析型工作负载和数据处理管线。

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

更多 row format 细节请参见 [Java Row Format 指南](../guide/java/row-format.md) 或 [Python Row Format 指南](../guide/python/row-format.md)。
