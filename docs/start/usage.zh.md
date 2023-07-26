---
title: 快速开始
order: 1
---

下面是一个如何使用Fury的快速指南，更多信息请查看 [用户指南](https://github.com/alipay/fury/blob/main/docs/README.md)，[跨语言序列化指南](https://github.com/alipay/fury/blob/main/docs/guide/xlang_object_graph_guide.md)， [行存指南](https://github.com/alipay/fury/blob/main/docs/guide/row_format_guide.md).

### Fury Java 序列化

该模式比跨语言序列化有更好的性能，更小的序列化结果。

```java
import io.fury.*;

import java.util.*;

public class Example {
  public static void main(String[] args) {
    SomeClass object = new SomeClass();
    // 注意应该在多次序列化之间复用Fury实例
    {
      Fury fury = Fury.builder().withLanguage(Language.JAVA)
        // 允许反序列化未知类型，如果未知类型包含恶意代码则会有安全风险
        // .requireClassRegistration(false)
        .build();
      // 注册类型可以减少类名称序列化，但不是必须的。
      // 如果安全模式开启(默认开启)，所有自定义类型必须注册。
      fury.register(SomeClass.class);
      byte[] bytes = fury.serialize(object);
      System.out.println(fury.deserialize(bytes));
    }
    {
      ThreadSafeFury fury = Fury.builder().withLanguage(Language.JAVA)
        // 允许反序列化未知类型，如果未知类型包含恶意代码则会有安全风险
        // .requireClassRegistration(false)
        .buildThreadSafeFury();
      byte[] bytes = fury.serialize(object);
      System.out.println(fury.deserialize(bytes));
    }
    {
      ThreadSafeFury fury = new ThreadLocalFury(classLoader -> {
        Fury f = Fury.builder().withLanguage(Language.JAVA)
          .withClassLoader(classLoader).build();
        f.register(SomeClass.class);
        return f;
      });
      byte[] bytes = fury.serialize(object);
      System.out.println(fury.deserialize(bytes));
    }
  }
}
```

### 跨语言对象图序列化

**Java**

```java
import io.fury.*;

import java.util.*;

public class ReferenceExample {
  public static class SomeClass {
    SomeClass f1;
    Map<String, String> f2;
    Map<String, String> f3;
  }

  public static Object createObject() {
    SomeClass obj = new SomeClass();
    obj.f1 = obj;
    obj.f2 = ofHashMap("k1", "v1", "k2", "v2");
    obj.f3 = obj.f2;
    return obj;
  }

  // mvn exec:java -Dexec.mainClass="io.fury.examples.ReferenceExample"
  public static void main(String[] args) {
    Fury fury = Fury.builder().withLanguage(Language.XLANG)
      .withRefTracking(true).build();
    fury.register(SomeClass.class, "example.SomeClass");
    byte[] bytes = fury.serialize(createObject());
    // bytes可以是其它语言序列化的数据.
    System.out.println(fury.deserialize(bytes));
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
# bytes可以是其它语言序列化的数据.
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
	// bytes可以是其它语言序列化的数据.
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
use fury::{from_buffer, to_buffer};
use fury_derive::{Deserialize, FuryMeta, Serialize};

#[derive(FuryMeta, Deserialize, Serialize, Debug, PartialEq)]
#[tag("example.foo")]
struct Animal {
    name: String,
    category: String,
}

#[derive(FuryMeta, Deserialize, Serialize, Debug, PartialEq)]
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
// 该数据可以被Python零拷贝直接读取
BinaryRow binaryRow = encoder.toRow(foo);
// 这里的数据可以来自python
Foo newFoo = encoder.fromRow(binaryRow);
// 零拷贝读取 List<Integer> f2
BinaryArray binaryArray2 = binaryRow.getArray(1);
// 零拷贝读取 List<Bar> f4
BinaryArray binaryArray4 = binaryRow.getArray(4);
// 零拷贝读取 `readList<Bar> f4` 的第11个元素
BinaryRow barStruct = binaryArray4.getStruct(10);
// 零拷贝读取 `readList<Bar> f4` 的第11个元素的第二个元素的第6个元素
barStruct.getArray(1).getLong(5);
Encoder<Bar> barEncoder = Encoders.bean(Bar.class);
// 反序列化部分数据
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
