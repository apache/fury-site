---
title: 序列化
sidebar_position: 30
id: serialization
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

本页演示常见的跨语言序列化模式。当各端使用匹配的类型标识、字段 schema 和兼容性设置时，在一种受支持语言中序列化的数据可以在任何其他受支持语言中反序列化。

## 远端 Schema Metadata 限制

兼容模式可能为 reader 尚未知的类型接收远端 metadata（`TypeDef` 或 `TypeMeta`）。Fory 会限制可接受的不同远端 metadata 版本数量，并限制每个收到的 metadata body 大小：

- `maxSchemaVersionsPerType`：一个逻辑类型可接受的最大远端 metadata 版本数，默认值为 `10`。
- `maxAverageSchemaVersionsPerType`：所有已接受远端类型的平均 metadata 版本数，默认值为 `3`；有效全局下限为 `8192` 个 metadata entry。
- `maxTypeFields`：一个收到的 struct metadata body 可声明的最大字段数，默认值为 `512`。
- `maxTypeMetaBytes`：一个收到的 TypeDef 或 TypeMeta body 的最大编码 metadata body 字节数，不包含 8 字节 header 和扩展 size varint，默认值为 `4096`。

这些限制是资源保护。它们不会改变编码格式、注册要求、动态类型加载、unknown-type handling 或 Schema 演进兼容性。

仅当数据不是恶意输入，且可信 peer 会发送更大的 metadata 或大量 schema 版本时，才调高这些值。

| 语言                  | 字段数选项          | Metadata 字节选项     | 单类型版本选项                 | 平均版本选项                          |
| --------------------- | ------------------- | --------------------- | ------------------------------ | ------------------------------------- |
| Java                  | `withMaxTypeFields` | `withMaxTypeMetaBytes` | `withMaxSchemaVersionsPerType` | `withMaxAverageSchemaVersionsPerType` |
| Scala                 | `withMaxTypeFields` | `withMaxTypeMetaBytes` | `withMaxSchemaVersionsPerType` | `withMaxAverageSchemaVersionsPerType` |
| Kotlin                | `withMaxTypeFields` | `withMaxTypeMetaBytes` | `withMaxSchemaVersionsPerType` | `withMaxAverageSchemaVersionsPerType` |
| Python                | `max_type_fields`   | `max_type_meta_bytes` | `max_schema_versions_per_type` | `max_average_schema_versions_per_type` |
| JavaScript/TypeScript | `maxTypeFields`     | `maxTypeMetaBytes`    | `maxSchemaVersionsPerType`     | `maxAverageSchemaVersionsPerType`     |
| C++                   | `max_type_fields`   | `max_type_meta_bytes` | `max_schema_versions_per_type` | `max_average_schema_versions_per_type` |
| Go                    | `WithMaxTypeFields` | `WithMaxTypeMetaBytes` | `WithMaxSchemaVersionsPerType` | `WithMaxAverageSchemaVersionsPerType` |
| Rust                  | `max_type_fields`   | `max_type_meta_bytes` | `max_schema_versions_per_type` | `max_average_schema_versions_per_type` |
| C#                    | `MaxTypeFields`     | `MaxTypeMetaBytes`    | `MaxSchemaVersionsPerType`     | `MaxAverageSchemaVersionsPerType`     |
| Swift                 | `maxTypeFields`     | `maxTypeMetaBytes`    | `maxSchemaVersionsPerType`     | `maxAverageSchemaVersionsPerType`     |
| Dart                  | `maxTypeFields`     | `maxTypeMetaBytes`    | `maxSchemaVersionsPerType`     | `maxAverageSchemaVersionsPerType`     |

## 序列化内置类型

常见类型可以自动序列化，无需注册：原始数值类型、字符串、二进制、数组、列表、映射等。

低精度浮点值也是内置 xlang 类型系统的一部分：

- `float16` 和 `array<float16>`
- `bfloat16` 和 `array<bfloat16>`

请使用类型映射参考中记录的特定语言承载类型。Python 使用 `pyfory.Float16` 和 `pyfory.BFloat16` 作为注解标记；标量值是原生 Python `float`，密集低精度数组使用 `pyfory.Float16Array` 和 `pyfory.BFloat16Array`。Go 对标量、切片和数组承载类型使用 `float16` 和 `bfloat16` 包；JavaScript 对标量 `float16` 和 `bfloat16` 使用 `number`，并对相应的 `array<T>` schema 使用密集数组承载类型 `BoolArray`、`Float16Array` 和 `BFloat16Array`。Dart 对标量字段使用 `double` 加 `Float16Type` 或 `Bfloat16Type` 元数据，并对密集数组使用 `Float16List` / `Bfloat16List`。Java 在受支持的低精度承载类型上使用 `@ArrayType` 来表示 `array<float16>` / `array<bfloat16>` schema，而普通对象数组仍走 `list` 路径；C++、Rust 和 C# 提供各自专用的标量和数组承载类型。

当 `compatible=true` 时，直接的 struct/class 字段可以在密集 bool/数值 `T` 的 `list<T>` 与 `array<T>` 之间演进。相同符号性和宽度域中的整数列表元素编码，与对应的密集数组元素域匹配。这只适用于直接匹配的字段 schema，不适用于嵌套 collection、map、array、union 或泛型位置。如果对端 `list<T>` 载荷声明了可空或启用引用跟踪的元素，将其读入本地 `array<T>` 字段会触发兼容读取错误。

### Java

```java
import org.apache.fory.*;
import org.apache.fory.config.*;

import java.util.*;

public class Example1 {
  public static void main(String[] args) {
    Fory fory = Fory.builder().withXlang(true).build();
    List<Object> list = ofArrayList(true, false, "str", -1.1, 1, new int[100], new double[20]);
    byte[] bytes = fory.serialize(list);
    // bytes can be deserialized by other languages
    fory.deserialize(bytes);
    Map<Object, Object> map = new HashMap<>();
    map.put("k1", "v1");
    map.put("k2", list);
    map.put("k3", -1);
    bytes = fory.serialize(map);
    // bytes can be deserialized by other languages
    fory.deserialize(bytes);
  }
}
```

### Python

```python
import pyfory
import numpy as np

fory = pyfory.Fory(xlang=True)
object_list = [True, False, "str", -1.1, 1,
               np.full(100, 0, dtype=np.int32), np.full(20, 0.0, dtype=np.double)]
data = fory.serialize(object_list)
# bytes can be deserialized by other languages
new_list = fory.deserialize(data)
object_map = {"k1": "v1", "k2": object_list, "k3": -1}
data = fory.serialize(object_map)
# bytes can be deserialized by other languages
new_map = fory.deserialize(data)
print(new_map)
```

### Go

```go
package main

import forygo "github.com/apache/fory/go/fory"
import "fmt"

func main() {
  list := []any{true, false, "str", -1.1, 1, make([]int32, 10), make([]float64, 20)}
  fory := forygo.NewFory(forygo.WithXlang(true))
  bytes, err := fory.Marshal(list)
  if err != nil {
    panic(err)
  }
  var newValue any
  // bytes can be deserialized by other languages
  if err := fory.Unmarshal(bytes, &newValue); err != nil {
    panic(err)
  }
  fmt.Println(newValue)
  dict := map[string]any{
    "k1": "v1",
    "k2": list,
    "k3": -1,
  }
  bytes, err = fory.Marshal(dict)
  if err != nil {
    panic(err)
  }
  // bytes can be deserialized by other languages
  if err := fory.Unmarshal(bytes, &newValue); err != nil {
    panic(err)
  }
  fmt.Println(newValue)
}
```

### JavaScript

```javascript
import Fory from "@apache-fory/core";

const fory = new Fory();
const input = fory.serialize("hello fory");
const result = fory.deserialize(input);
console.log(result);
```

### Rust

```rust
use fory::Fory;

fn run() {
    let fory = Fory::builder().xlang(true).build();
    let bin = fory.serialize(&"hello".to_string()).expect("serialize success");
    let obj: String = fory.deserialize(&bin).expect("deserialize success");
    assert_eq!("hello".to_string(), obj);
}
```

## 序列化自定义类型

用户定义类型必须使用 register API 注册，以建立不同语言中类型之间的映射关系。请在所有语言中使用一致的类型名称。

### Java

```java
import org.apache.fory.*;
import org.apache.fory.config.*;
import java.util.*;

public class Example2 {
  public static class SomeClass1 {
    Object f1;
    Map<Byte, Integer> f2;
  }

  public static class SomeClass2 {
    Object f1;
    String f2;
    List<Object> f3;
    Map<Byte, Integer> f4;
    Byte f5;
    Short f6;
    Integer f7;
    Long f8;
    Float f9;
    Double f10;
    short[] f11;
    List<Short> f12;
  }

  public static Object createObject() {
    SomeClass1 obj1 = new SomeClass1();
    obj1.f1 = true;
    obj1.f2 = ofHashMap((byte) -1, 2);
    SomeClass2 obj = new SomeClass2();
    obj.f1 = obj1;
    obj.f2 = "abc";
    obj.f3 = ofArrayList("abc", "abc");
    obj.f4 = ofHashMap((byte) 1, 2);
    obj.f5 = Byte.MAX_VALUE;
    obj.f6 = Short.MAX_VALUE;
    obj.f7 = Integer.MAX_VALUE;
    obj.f8 = Long.MAX_VALUE;
    obj.f9 = 1.0f / 2;
    obj.f10 = 1 / 3.0;
    obj.f11 = new short[]{(short) 1, (short) 2};
    obj.f12 = ofArrayList((short) -1, (short) 4);
    return obj;
  }

  // mvn exec:java -Dexec.mainClass="org.apache.fory.examples.Example2"
  public static void main(String[] args) {
    Fory fory = Fory.builder().withXlang(true).build();
    fory.register(SomeClass1.class, "example.SomeClass1");
    fory.register(SomeClass2.class, "example.SomeClass2");
    byte[] bytes = fory.serialize(createObject());
    // bytes can be deserialized by other languages
    System.out.println(fory.deserialize(bytes));
  }
}
```

### Python

```python
from dataclasses import dataclass
from typing import List, Dict, Any
import pyfory, array


@dataclass
class SomeClass1:
    f1: Any
    f2: Dict[pyfory.Int8, pyfory.Int32]


@dataclass
class SomeClass2:
    f1: Any = None
    f2: str = None
    f3: List[str] = None
    f4: Dict[pyfory.Int8, pyfory.Int32] = None
    f5: pyfory.Int8 = None
    f6: pyfory.Int16 = None
    f7: pyfory.Int32 = None
    # int type will be taken as `pyfory.Int64`.
    # use `pyfory.Int32` for type hint if peer uses more narrow type.
    f8: int = None
    f9: pyfory.Float32 = None
    # float type will be taken as `pyfory.Float64`
    f10: float = None
    f11: pyfory.Array[pyfory.Int16] = None
    f12: List[pyfory.Int16] = None


if __name__ == "__main__":
    f = pyfory.Fory(xlang=True)
    f.register_type(SomeClass1, typename="example.SomeClass1")
    f.register_type(SomeClass2, typename="example.SomeClass2")
    obj1 = SomeClass1(f1=True, f2={-1: 2})
    obj = SomeClass2(
        f1=obj1,
        f2="abc",
        f3=["abc", "abc"],
        f4={1: 2},
        f5=2 ** 7 - 1,
        f6=2 ** 15 - 1,
        f7=2 ** 31 - 1,
        f8=2 ** 63 - 1,
        f9=1.0 / 2,
        f10=1 / 3.0,
        f11=array.array("h", [1, 2]),
        f12=[-1, 4],
    )
    data = f.serialize(obj)
    # bytes can be deserialized by other languages
    print(f.deserialize(data))
```

### Go

```go
package main

import forygo "github.com/apache/fory/go/fory"
import "fmt"

func main() {
  type SomeClass1 struct {
    F1 any
    F2 map[int8]int32
  }

  type SomeClass2 struct {
    F1  any
    F2  string
    F3  []any
    F4  map[int8]int32
    F5  int8
    F6  int16
    F7  int32
    F8  int64
    F9  float32
    F10 float64
    F11 []int16
    F12 []int16
  }
  serializer := forygo.NewFory(forygo.WithXlang(true))
  if err := serializer.RegisterStructByName(SomeClass1{}, "example.SomeClass1"); err != nil {
    panic(err)
  }
  if err := serializer.RegisterStructByName(SomeClass2{}, "example.SomeClass2"); err != nil {
    panic(err)
  }
  obj1 := &SomeClass1{F1: true, F2: map[int8]int32{-1: 2}}
  obj := &SomeClass2{
    F1:  obj1,
    F2:  "abc",
    F3:  []any{"abc", "abc"},
    F4:  map[int8]int32{1: 2},
    F5:  127,
    F6:  32767,
    F7:  2147483647,
    F8:  9223372036854775807,
    F9:  1.0 / 2,
    F10: 1.0 / 3.0,
    F11: []int16{1, 2},
    F12: []int16{-1, 4},
  }
  bytes, err := serializer.Marshal(obj)
  if err != nil {
    panic(err)
  }
  var newValue any
  // bytes can be deserialized by other languages
  if err := serializer.Unmarshal(bytes, &newValue); err != nil {
    panic(err)
  }
  fmt.Println(newValue)
}
```

### JavaScript

```javascript
import Fory, { Type } from "@apache-fory/core";

// Describe data structures using JSON schema
const description = Type.struct(
  { typeName: "example.foo" },
  {
    foo: Type.string(),
  },
);
const fory = new Fory();
const { serialize, deserialize } = fory.register(description);
const input = serialize({ foo: "hello fory" });
const result = deserialize(input);
console.log(result);
```

### Rust

```rust
use chrono::{NaiveDate, NaiveDateTime};
use fory::{Fory, ForyStruct};
use std::collections::HashMap;

#[test]
fn complex_struct() {
    #[derive(ForyStruct, Debug, PartialEq)]
    struct Animal {
        category: String,
    }

    #[derive(ForyStruct, Debug, PartialEq)]
    struct Person {
        c1: Vec<u8>,  // binary
        c2: Vec<i16>, // primitive array
        animal: Vec<Animal>,
        c3: Vec<Vec<u8>>,
        name: String,
        c4: HashMap<String, String>,
        age: u16,
        op: Option<String>,
        op2: Option<String>,
        date: NaiveDate,
        time: NaiveDateTime,
        c5: f32,
        c6: f64,
    }
    let person: Person = Person {
        c1: vec![1, 2, 3],
        c2: vec![5, 6, 7],
        c3: vec![vec![1, 2], vec![1, 3]],
        animal: vec![Animal {
            category: "Dog".to_string(),
        }],
        c4: HashMap::from([
            ("hello1".to_string(), "hello2".to_string()),
            ("hello2".to_string(), "hello3".to_string()),
        ]),
        age: 12,
        name: "helo".to_string(),
        op: Some("option".to_string()),
        op2: None,
        date: NaiveDate::from_ymd_opt(2025, 12, 12).unwrap(),
        time: NaiveDateTime::from_timestamp_opt(1689912359, 0).unwrap(),
        c5: 2.0,
        c6: 4.0,
    };

    let mut fory = Fory::builder().xlang(true).build();
    fory
        .register_by_name::<Animal>("example", "foo2")
        .expect("register Animal");
    fory
        .register_by_name::<Person>("example", "foo")
        .expect("register Person");
    let bin = fory.serialize(&person).expect("serialize success");
    let obj: Person = fory.deserialize(&bin).expect("deserialize success");
    assert_eq!(person, obj);
}
```

## 序列化共享引用和循环引用

共享引用和循环引用可以自动序列化，不会产生重复数据或递归错误。启用引用跟踪即可使用此功能。

### Java

```java
import org.apache.fory.*;
import org.apache.fory.config.*;
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

  // mvn exec:java -Dexec.mainClass="org.apache.fory.examples.ReferenceExample"
  public static void main(String[] args) {
    Fory fory = Fory.builder()
        .withXlang(true)
        .withRefTracking(true)
        .build();
    fory.register(SomeClass.class, "example.SomeClass");
    byte[] bytes = fory.serialize(createObject());
    // bytes can be deserialized by other languages
    System.out.println(fory.deserialize(bytes));
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

fory = pyfory.Fory(xlang=True, ref=True)
fory.register_type(SomeClass, typename="example.SomeClass")
obj = SomeClass()
obj.f2 = {"k1": "v1", "k2": "v2"}
obj.f1, obj.f3 = obj, obj.f2
data = fory.serialize(obj)
# bytes can be deserialized by other languages
print(fory.deserialize(data))
```

### Go

```go
package main

import forygo "github.com/apache/fory/go/fory"
import "fmt"

func main() {
  type SomeClass struct {
    F1 *SomeClass
    F2 map[string]string
    F3 map[string]string
  }
  fory := forygo.NewFory(forygo.WithXlang(true), forygo.WithTrackRef(true))
  if err := fory.RegisterStruct(SomeClass{}, 65); err != nil {
    panic(err)
  }
  value := &SomeClass{F2: map[string]string{"k1": "v1", "k2": "v2"}}
  value.F3 = value.F2
  value.F1 = value
  bytes, err := fory.Marshal(value)
  if err != nil {
    panic(err)
  }
  var newValue any
  // bytes can be deserialized by other languages
  if err := fory.Unmarshal(bytes, &newValue); err != nil {
    panic(err)
  }
  fmt.Println(newValue)
}
```

### JavaScript

```javascript
import Fory, { Type } from "@apache-fory/core";

const description = Type.struct("example.foo", {
  foo: Type.string(),
  bar: Type.struct("example.foo").setTrackingRef(true),
});

const fory = new Fory({ ref: true });
const { serialize, deserialize } = fory.register(description);
const data: any = {
  foo: "hello fory",
};
data.bar = data;
const input = serialize(data);
const result = deserialize(input);
console.log(result.bar.foo === result.foo);
```

### Rust

由于所有权限制，Rust 中无法实现循环引用。

## 另请参阅

- [零拷贝序列化](zero-copy.md) - 大型数据的带外序列化
- [类型映射](../../specification/xlang_type_mapping.md) - 跨语言类型映射参考
- [入门指南](getting-started.md) - 安装和设置
- [Xlang 序列化规范](../../specification/xlang_serialization_spec.md) - 二进制协议细节
