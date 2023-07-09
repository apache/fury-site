---
title: Doc
nav:
  order: 2
---

## Installation

### Java

Nightly snapshot:

```xml
<repositories>
  <repository>
    <id>sonatype</id>
    <url>https://oss.sonatype.org/content/repositories/snapshots/</url>
    <releases>
      <enabled>false</enabled>
    </releases>
    <snapshots>
      <enabled>true</enabled>
    </snapshots>
  </repository>
</repositories>
<dependency>
  <groupId>org.furyio</groupId>
  <artifactId>fury-core</artifactId>
  <version>0.1.0-SNAPSHOT</version>
</dependency>
<!-- row/arrow format support -->
<!-- <dependency>
  <groupId>org.furyio</groupId>
  <artifactId>fury-format</artifactId>
  <version>0.1.0-SNAPSHOT</version>
</dependency> -->
```

Release version: coming soon.

### Python

```bash
# Python whl will be released soon.
# Currently you need to install from the source.
git clone https://github.com/alipay/fury.git
cd fury/python
pip install -v -e .
```

### JavaScript

```bash
npm install @furyjs/fury
```

### Golang

Coming soon.

## Quickstart

Here we give a quick start about how to use fury, see [User Guide](https://github.com/alipay/fury/blob/main/docs/user_guide.md) for more details about java serialization, zero-copy and row format.

### Fury java object graph serialization

If you don't have cross-language requirements, using this mode will
have better performance.

```java
import io.fury.Fury;
import java.util.List;
import java.util.Arrays;

public class Example {
  public static void main(String[] args) {
    SomeClass object = new SomeClass();
    // Note that Fury instances should be reused between
    // multiple serializations of different objects.
    {
      Fury fury = Fury.builder().withLanguage(Fury.Language.JAVA)
        .withRefTracking(true)
        // Allow to deserialize objects unknown types,
        // more flexible but less secure.
        // .withSecureMode(false)
        .build();
      // Registering types can reduce class name serialization overhead, but not mandatory.
      // If secure mode enabled, all custom types must be registered.
      fury.register(SomeClass.class);
      byte[] bytes = fury.serialize(object);
      System.out.println(fury.deserialize(bytes));
    }
    {
      ThreadSafeFury fury = Fury.builder().withLanguage(Fury.Language.JAVA)
        // Allow to deserialize objects unknown types,
        // more flexible but less secure.
        // .withSecureMode(false)
        .withRefTracking(true)
        .buildThreadSafeFury();
      byte[] bytes = fury.serialize(object);
      System.out.println(fury.deserialize(bytes));
    }
    {
      ThreadSafeFury fury = new ThreadSafeFury(() -> {
        Fury fury = Fury.builder().withLanguage(Fury.Language.JAVA)
          .withClassRegistrationRequired(false)
          .withRefTracking(true).build();
        fury.register(SomeClass.class);
        return fury;
      });
      byte[] bytes = fury.serialize(object);
      System.out.println(fury.deserialize(bytes));
    }
  }
}
```

### Cross-language object graph serialization

**Java**

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

**Python**

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

**Golang**

```go
package main

import furygo "github.com/alipay/fury/fury/go/fury"
import "fmt"

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

**JavaScript**

```typescript
import Fury, { TypeDescription, InternalSerializerType } from '@furyjs/fury';

// Experimental feature, installation success cannot be guaranteed at this moment
// If you are unable to install the module, replace it with `const hps = null;`
import hps from '@furyjs/hps';

const description: TypeDescription = {
  type: InternalSerializerType.FURY_TYPE_TAG,
  asObject: {
    props: {
      foo: {
        type: InternalSerializerType.STRING as const,
      },
    },
    tag: 'example.foo',
  },
};
const fury = new Fury({ hps });
const serializer = fury.registerSerializerByDescription(description);
const input = fury.marshal({ foo: 'hello fury' }, serializer);
const result = fury.unmarshal(input);
console.log(result);
```

### Row format

#### Java

```java
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

Encoder<Foo> encoder = Encoders.bean(Foo.class);
Foo foo = new Foo();
foo.f1 = 10;
foo.f2 = IntStream.range(0, 1000000).boxed().collect(Collectors.toList());
foo.f3 = IntStream.range(0, 1000000).boxed().collect(Collectors.toMap(i -> "k"+i, i->i));
List<Bar> bars = new ArrayList<>(1000000);
for (int i = 0; i < 1000000; i++) {
  Bar bar = new Bar();
  bar.f1 = "s"+i;
  bar.f2 = LongStream.range(0, 10).boxed().collect(Collectors.toList());
  bars.add(bar);
}
foo.f4 = bars;
// Can be zero-copy read by python
BinaryRow binaryRow = encoder.toRow(foo);
// can be data from python
Foo newFoo = encoder.fromRow(binaryRow);
// zero-copy read List<Integer> f2
BinaryArray binaryArray2 = binaryRow.getArray(1);
// zero-copy read List<Bar> f4
BinaryArray binaryArray4 = binaryRow.getArray(4);
// zero-copy read 11th element of `readList<Bar> f4`
BinaryRow barStruct = binaryArray4.getStruct(10);

// zero-copy read 6th of f2 of 11th element of `readList<Bar> f4`
barStruct.getArray(1).getLong(5);
Encoder<Bar> barEncoder = Encoders.bean(Bar.class);
// deserialize part of data.
Bar newBar = barEncoder.fromRow(barStruct);
Bar newBar2 = barEncoder.fromRow(binaryArray4.getStruct(20));
```

#### Python

```python
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

encoder = pyfury.encoder(Foo)
foo = Foo(f1=10, f2=list(range(1000_000)),
         f3={f"k{i}": i for i in range(1000_000)},
         f4=[Bar(f1=f"s{i}", f2=list(range(10))) for i in range(1000_000)])
binary: bytes = encoder.to_row(foo).to_bytes()
foo_row = pyfury.RowData(encoder.schema, binary)
print(foo_row.f2[100000], foo_row.f4[100000].f1, foo_row.f4[200000].f2[5])
```
