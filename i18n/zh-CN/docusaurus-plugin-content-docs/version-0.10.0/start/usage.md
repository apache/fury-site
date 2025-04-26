---
id: usage
title: Apache Fury 使用
sidebar_position: 1
---

本章节演示不同编程语言使用 Apache Fury 进行序列化。

## Java 序列化

```java
import java.util.List;
import java.util.Arrays;
import io.fury.*;

public class Example {
  public static void main(String[] args) {
    SomeClass object = new SomeClass();
    // Note that Fury instances should be reused between
    // multiple serializations of different objects.
    Fury fury = Fury.builder().withLanguage(Language.JAVA)
      // Allow to deserialize objects unknown types,
      // more flexible but less secure.
      // .requireClassRegistration(false)
      .build();
    // Registering types can reduce class name serialization overhead, but not mandatory.
    // If secure mode enabled, all custom types must be registered.
    fury.register(SomeClass.class);
    byte[] bytes = fury.serialize(object);
    System.out.println(fury.deserialize(bytes));
  }
}
```

## Scala序列化

```scala
import org.apache.fury.Fury
import org.apache.fury.serializer.scala.ScalaSerializers

case class Person(name: String, id: Long, github: String)
case class Point(x : Int, y : Int, z : Int)

object ScalaExample {
  val fury: Fury = Fury.builder().withScalaOptimizationEnabled(true).build()
  // Register optimized fury serializers for scala
  ScalaSerializers.registerSerializers(fury)
  fury.register(classOf[Person])
  fury.register(classOf[Point])

  def main(args: Array[String]): Unit = {
    val p = Person("Shawn Yang", 1, "https://github.com/chaokunyang")
    println(fury.deserialize(fury.serialize(p)))
    println(fury.deserialize(fury.serialize(Point(1, 2, 3))))
  }
}

## Kotlin序列化
```kotlin
import org.apache.fury.Fury
import org.apache.fury.ThreadSafeFury
import org.apache.fury.serializer.kotlin.KotlinSerializers

data class Person(val name: String, val id: Long, val github: String)
data class Point(val x : Int, val y : Int, val z : Int)

fun main(args: Array<String>) {
    // 注意: 下面的Fury初始化代码应该只执行一次，而不是在每次序列化前都运行
    val fury: ThreadSafeFury = Fury.builder().requireClassRegistration(true).buildThreadSafeFury()
    KotlinSerializers.registerSerializers(fury)
    fury.register(Person::class.java)
    fury.register(Point::class.java)

    val p = Person("Shawn Yang", 1, "https://github.com/chaokunyang")
    println(fury.deserialize(fury.serialize(p)))
    println(fury.deserialize(fury.serialize(Point(1, 2, 3))))
}
```

## 跨语言序列化

### Java

```java
import com.google.common.collect.ImmutableMap;
import io.fury.*;

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

  // mvn exec:java -Dexec.mainClass="io.fury.examples.ReferenceExample"
  public static void main(String[] args) {
    Fury fury = Fury.builder().withLanguage(Language.XLANG)
      .withRefTracking(true).build();
    fury.register(SomeClass.class, "example.SomeClass");
    byte[] bytes = fury.serialize(createObject());
    // bytes can be data serialized by other languages.
    System.out.println(fury.deserialize(bytes));
    ;
  }
}
```

### Python

```python
from typing import Dict
import pyfury

class SomeClass:
    f1: "SomeClass"
    f2: Dict[str, str]
    f3: Dict[str, str]

fury = pyfury.Fury(ref_tracking=True)
fury.register_class(SomeClass, "example.SomeClass")
obj = SomeClass()
obj.f2 = {"k1": "v1", "k2": "v2"}
obj.f1, obj.f3 = obj, obj.f2
data = fury.serialize(obj)
# bytes can be data serialized by other languages.
print(fury.deserialize(data))
```

### Golangs

```go
package main

import (
 "fmt"
 furygo "github.com/apache/fury/go/fury"
)

func main() {
 type SomeClass struct {
  F1 *SomeClass
  F2 map[string]string
  F3 map[string]string
 }
 fury := furygo.NewFury(true)
 if err := fury.RegisterTagType("example.SomeClass", SomeClass{}); err != nil {
  panic(err)
 }
 value := &SomeClass{F2: map[string]string{"k1": "v1", "k2": "v2"}}
 value.F3 = value.F2
 value.F1 = value
 bytes, err := fury.Marshal(value)
 if err != nil {
 }
 var newValue interface{}
 // bytes can be data serialized by other languages.
 if err := fury.Unmarshal(bytes, &newValue); err != nil {
  panic(err)
 }
 fmt.Println(newValue)
}
```

### JavaScript

```typescript
import Fury, { Type } from '@furyjs/fury';

/**
 * @furyjs/hps use v8's fast-calls-api that can be called directly by jit, ensure that the version of Node is 20 or above.
 * Experimental feature, installation success cannot be guaranteed at this moment
 * If you are unable to install the module, replace it with `const hps = null;`
 **/
import hps from '@furyjs/hps';

// Now we describe data structures using JSON, but in the future, we will use more ways.
const description = Type.object('example.foo', {
  foo: Type.string(),
});
const fury = new Fury({ hps });
const { serialize, deserialize } = fury.registerSerializer(description);
const input = serialize({ foo: 'hello fury' });
const result = deserialize(input);
console.log(result);
```

### Rust

```rust
use fury::{from_buffer, to_buffer, Fury};

#[derive(Fury, Debug, PartialEq)]
#[tag("example.foo")]
struct Animal {
    name: String,
    category: String,
}

#[derive(Fury, Debug, PartialEq)]
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
