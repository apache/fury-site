---
id: usage
title: Apache Fory 使用
sidebar_position: 1
---

本章节演示不同编程语言使用 Apache Fory 进行序列化。

## Java 序列化

```java
import java.util.List;
import java.util.Arrays;
import io.fory.*;

public class Example {
  public static void main(String[] args) {
    SomeClass object = new SomeClass();
    // Note that Fory instances should be reused between
    // multiple serializations of different objects.
    Fory fory = Fory.builder().withLanguage(Language.JAVA)
      // Allow to deserialize objects unknown types,
      // more flexible but less secure.
      // .requireClassRegistration(false)
      .build();
    // Registering types can reduce class name serialization overhead, but not mandatory.
    // If secure mode enabled, all custom types must be registered.
    fory.register(SomeClass.class);
    byte[] bytes = fory.serialize(object);
    System.out.println(fory.deserialize(bytes));
  }
}
```

## Scala序列化

```scala
import org.apache.fory.Fory
import org.apache.fory.serializer.scala.ScalaSerializers

case class Person(name: String, id: Long, github: String)
case class Point(x : Int, y : Int, z : Int)

object ScalaExample {
  val fory: Fory = Fory.builder().withScalaOptimizationEnabled(true).build()
  // Register optimized fory serializers for scala
  ScalaSerializers.registerSerializers(fory)
  fory.register(classOf[Person])
  fory.register(classOf[Point])

  def main(args: Array[String]): Unit = {
    val p = Person("Shawn Yang", 1, "https://github.com/chaokunyang")
    println(fory.deserialize(fory.serialize(p)))
    println(fory.deserialize(fory.serialize(Point(1, 2, 3))))
  }
}

## Kotlin序列化
```kotlin
import org.apache.fory.Fory
import org.apache.fory.ThreadSafeFory
import org.apache.fory.serializer.kotlin.KotlinSerializers

data class Person(val name: String, val id: Long, val github: String)
data class Point(val x : Int, val y : Int, val z : Int)

fun main(args: Array<String>) {
    // 注意: 下面的Fory初始化代码应该只执行一次，而不是在每次序列化前都运行
    val fory: ThreadSafeFory = Fory.builder().requireClassRegistration(true).buildThreadSafeFory()
    KotlinSerializers.registerSerializers(fory)
    fory.register(Person::class.java)
    fory.register(Point::class.java)

    val p = Person("Shawn Yang", 1, "https://github.com/chaokunyang")
    println(fory.deserialize(fory.serialize(p)))
    println(fory.deserialize(fory.serialize(Point(1, 2, 3))))
}
```

## 跨语言序列化

### Java

```java
import com.google.common.collect.ImmutableMap;
import io.fory.*;

import java.util.Map;

public class ReferenceExample {
  public static class SomeClass {
    SomeClass f1;
    Map<String, String> f2;
    Map<String, String> f3;
  }

  public static Object createObject() {
    SomeClass obj = new SomeClass();
    obj.f1 = obj;
    obj.f2 = ImmutableMap.of("k1", "v1", "k2", "v2");
    obj.f3 = obj.f2;
    return obj;
  }

  // mvn exec:java -Dexec.mainClass="io.fory.examples.ReferenceExample"
  public static void main(String[] args) {
    Fory fory = Fory.builder().withLanguage(Language.XLANG)
      .withRefTracking(true).build();
    fory.register(SomeClass.class, "example.SomeClass");
    byte[] bytes = fory.serialize(createObject());
    // bytes can be data serialized by other languages.
    System.out.println(fory.deserialize(bytes));
    ;
  }
}
```

### Python

```python
from typing import Dict
import pyfory

class SomeClass:
    f1: "SomeClass"
    f2: Dict[str, str]
    f3: Dict[str, str]

fory = pyfory.Fory(ref_tracking=True)
fory.register_class(SomeClass, "example.SomeClass")
obj = SomeClass()
obj.f2 = {"k1": "v1", "k2": "v2"}
obj.f1, obj.f3 = obj, obj.f2
data = fory.serialize(obj)
# bytes can be data serialized by other languages.
print(fory.deserialize(data))
```

### Golangs

```go
package main

import (
 "fmt"
 forygo "github.com/apache/fory/go/fory"
)

func main() {
 type SomeClass struct {
  F1 *SomeClass
  F2 map[string]string
  F3 map[string]string
 }
 fory := forygo.NewFory(true)
 if err := fory.RegisterTagType("example.SomeClass", SomeClass{}); err != nil {
  panic(err)
 }
 value := &SomeClass{F2: map[string]string{"k1": "v1", "k2": "v2"}}
 value.F3 = value.F2
 value.F1 = value
 bytes, err := fory.Marshal(value)
 if err != nil {
 }
 var newValue interface{}
 // bytes can be data serialized by other languages.
 if err := fory.Unmarshal(bytes, &newValue); err != nil {
  panic(err)
 }
 fmt.Println(newValue)
}
```

### JavaScript

```typescript
import Fory, { Type } from '@foryjs/fory';

/**
 * @foryjs/hps use v8's fast-calls-api that can be called directly by jit, ensure that the version of Node is 20 or above.
 * Experimental feature, installation success cannot be guaranteed at this moment
 * If you are unable to install the module, replace it with `const hps = null;`
 **/
import hps from '@foryjs/hps';

// Now we describe data structures using JSON, but in the future, we will use more ways.
const description = Type.object('example.foo', {
  foo: Type.string(),
});
const fory = new Fory({ hps });
const { serialize, deserialize } = fory.registerSerializer(description);
const input = serialize({ foo: 'hello fory' });
const result = deserialize(input);
console.log(result);
```

### Rust

```rust
use fory::{from_buffer, to_buffer, Fory};

#[derive(Fory, Debug, PartialEq)]
#[tag("example.foo")]
struct Animal {
    name: String,
    category: String,
}

#[derive(Fory, Debug, PartialEq)]
#[tag("example.bar")]
struct Person {
    name: String,
    age: u32,
    pets: Vec<Animal>,
}

fn main() {
    let penson = Person {
        name: "hello".to_string(),
        age: 12,
        pets: vec![
            Animal {
                name: "world1".to_string(),
                category: "cat".to_string(),
            },
            Animal {
                name: "world2".to_string(),
                category: "dog".to_string(),
            },
        ],
    };
    let bin = to_buffer(&penson);
    let obj: Person = from_buffer(&bin).expect("should success");
    assert_eq!(obj, penson);
}
```
