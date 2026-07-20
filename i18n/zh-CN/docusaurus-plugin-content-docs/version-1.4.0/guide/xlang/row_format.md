---
title: 行格式
sidebar_position: 5
id: row_format
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

Fory 行格式是一种缓存友好的二进制格式，专为高效随机访问和部分序列化而设计。与对象图序列化不同，行格式允许您在不反序列化整个对象的情况下读取单个字段。

## 特性

- **零拷贝随机访问**：直接从二进制数据中读取特定字段
- **部分序列化**：在序列化期间跳过不必要的字段
- **跨语言兼容**：行格式数据可以在 Java、Python 和 C++ 之间共享
- **Apache Arrow 集成**：将行格式与 Arrow RecordBatch 相互转换以进行分析（Java/Python）

## Java

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

RowEncoder<Foo> encoder = Encoders.bean(Foo.class);
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
// 可以被 Python 零拷贝读取
BinaryRow binaryRow = encoder.toRow(foo);
// 可以是来自 Python 的数据
Foo newFoo = encoder.fromRow(binaryRow);
// 零拷贝读取 List<Integer> f2
BinaryArray binaryArray2 = binaryRow.getArray(1);
// 零拷贝读取 List<Bar> f4
BinaryArray binaryArray4 = binaryRow.getArray(3);
// 零拷贝读取 List<Bar> f4 的第 11 个元素
BinaryRow barStruct = binaryArray4.getStruct(10);

// 零拷贝读取 List<Bar> f4 的第 11 个元素的 f2 的第 6 个元素
barStruct.getArray(1).getInt64(5);
RowEncoder<Bar> barEncoder = Encoders.bean(Bar.class);
// 反序列化部分数据
Bar newBar = barEncoder.fromRow(barStruct);
Bar newBar2 = barEncoder.fromRow(binaryArray4.getStruct(20));
```

## Python

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

encoder = pyfory.encoder(Foo)
foo = Foo(f1=10, f2=list(range(1000_000)),
         f3={f"k{i}": i for i in range(1000_000)},
         f4=[Bar(f1=f"s{i}", f2=list(range(10))) for i in range(1000_000)])
binary: bytes = encoder.to_row(foo).to_bytes()
print(f"start: {datetime.datetime.now()}")
foo_row = pyfory.RowData(encoder.schema, binary)
print(foo_row.f2[100000], foo_row.f4[100000].f1, foo_row.f4[200000].f2[5])
print(f"end: {datetime.datetime.now()}")

binary = pickle.dumps(foo)
print(f"pickle start: {datetime.datetime.now()}")
new_foo = pickle.loads(binary)
print(new_foo.f2[100000], new_foo.f4[100000].f1, new_foo.f4[200000].f2[5])
print(f"pickle end: {datetime.datetime.now()}")
```

## Apache Arrow 支持

Fory 行格式支持从/到 Arrow Table/RecordBatch 的自动转换，以用于分析工作负载。

### Java

```java
Schema schema = TypeInference.inferSchema(BeanA.class);
ArrowWriter arrowWriter = ArrowUtils.createArrowWriter(schema);
Encoder<BeanA> encoder = Encoders.rowEncoder(BeanA.class);
for (int i = 0; i < 10; i++) {
  BeanA beanA = BeanA.createBeanA(2);
  arrowWriter.write(encoder.toRow(beanA));
}
return arrowWriter.finishAsRecordBatch();
```

### Python

```python
import pyfory
encoder = pyfory.encoder(Foo)
encoder.to_arrow_record_batch([foo] * 10000)
encoder.to_arrow_table([foo] * 10000)
```

## 接口和扩展类型的支持

Fory 支持 Java `interface` 类型和子类（`extends`）类型的行格式映射，实现更动态和灵活的数据 schema。

这些增强功能在 [#2243](https://github.com/apache/fory/pull/2243)、[#2250](https://github.com/apache/fory/pull/2250) 和 [#2256](https://github.com/apache/fory/pull/2256) 中引入。

### 示例：使用 RowEncoder 的接口映射

```java
public interface Animal {
  String speak();
}

public class Dog implements Animal {
  public String name;

  @Override
  public String speak() {
    return "Woof";
  }
}

// 使用接口类型的 RowEncoder 进行编码和解码
RowEncoder<Animal> encoder = Encoders.bean(Animal.class);
Dog dog = new Dog();
dog.name = "Bingo";
BinaryRow row = encoder.toRow(dog);
Animal decoded = encoder.fromRow(row);
System.out.println(decoded.speak()); // Woof
```

### 示例：使用 RowEncoder 的扩展类型

```java
public class Parent {
    public String parentField;
}

public class Child extends Parent {
    public String childField;
}

// 使用父类类型的 RowEncoder 进行编码和解码
RowEncoder<Parent> encoder = Encoders.bean(Parent.class);
Child child = new Child();
child.parentField = "Hello";
child.childField = "World";
BinaryRow row = encoder.toRow(child);
Parent decoded = encoder.fromRow(row);
```

## 另请参阅

- [行格式规范](https://fory.apache.org/docs/next/specification/fory_row_format_spec) - 二进制格式详情
- [Java 行格式指南](../java/row-format.md) - Java 特定的行格式文档
- [Python 行格式指南](../python/row-format.md) - Python 特定的行格式文档
