---
title: Java 行格式
sidebar_position: 3
id: java
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

Apache Fory™ 提供一种支持随机访问的行格式，无需完整反序列化即可从二进制数据中读取嵌套字段。在处理仅需访问部分数据的大型对象时，这能大幅降低开销。

## 概述

行格式是一种缓存友好的二进制随机访问格式，支持：

- **零拷贝访问**：直接从二进制数据中读取字段，无需分配对象
- **部分反序列化**：仅访问所需字段
- **跳过序列化**：跳过不需要字段的序列化
- **跨语言兼容性**：标准行可在 Python、Java、C++ 和 Rust 之间通用
- **列式格式转换**：可自动转换为 Apache Arrow 列式格式

## 安装

Java 行格式要求 Java 11 或更高版本，且不支持 Android。请在应用中添加 `fory-format` 构件，其版本应与其他 Fory 模块一致。

Maven：

```xml
<dependency>
  <groupId>org.apache.fory</groupId>
  <artifactId>fory-format</artifactId>
  <version>1.7.0</version>
</dependency>
```

Gradle：

```kotlin
implementation("org.apache.fory:fory-format:1.7.0")
```

## 基本用法

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

// Create large dataset
Foo foo = new Foo();
foo.f1 = 10;
foo.f2 = IntStream.range(0, 1_000_000).boxed().collect(Collectors.toList());
foo.f3 = IntStream.range(0, 1_000_000).boxed().collect(Collectors.toMap(i -> "k" + i, i -> i));
List<Bar> bars = new ArrayList<>(1_000_000);
for (int i = 0; i < 1_000_000; i++) {
  Bar bar = new Bar();
  bar.f1 = "s" + i;
  bar.f2 = LongStream.range(0, 10).boxed().collect(Collectors.toList());
  bars.add(bar);
}
foo.f4 = bars;

// Encode to row format (cross-language compatible with Python/C++/Rust)
BinaryRow binaryRow = encoder.toRow(foo);

// Reconstruct the complete object only when the application needs it.
Foo decoded = encoder.fromRow(binaryRow);

// Zero-copy random access without full deserialization
BinaryArray f2Array = binaryRow.getArray(1);              // Access f2 list
BinaryArray f4Array = binaryRow.getArray(3);              // Access f4 list
BinaryRow bar10 = f4Array.getStruct(10);                  // Access 11th Bar
long value = bar10.getArray(1).getInt64(5);               // Access 6th element of bar.f2

// Name-based access without repeated schema lookups
Schema schema = encoder.schema();
Schema.Int32Field f1 = schema.int32Field("f1");
Schema.ArrayField f4 = schema.arrayField("f4");
int f1Value = f1.get(binaryRow);
ArrayData f4ByName = f4.get(binaryRow);

// Partial deserialization - only deserialize what you need
RowEncoder<Bar> barEncoder = Encoders.bean(Bar.class);
Bar bar1 = barEncoder.fromRow(f4Array.getStruct(10));     // Deserialize 11th Bar only
Bar bar2 = barEncoder.fromRow(f4Array.getStruct(20));     // Deserialize 21st Bar only

// Full deserialization when needed
Foo newFoo = encoder.fromRow(binaryRow);
```

请在用户代码中缓存返回的 `Schema.*Field` 句柄，并将它们复用于具有相同 Schema 的所有行。调用 `schema.int32Field("f1")` 时，会将字段名称解析为序号来创建类型化句柄；对于从 Java Bean 派生的 Schema，此调用接受 Java 小驼峰字段名，同时会验证预期的行格式类型并存储解析出的序号。之后调用 `f1.get(binaryRow)` 等方法时，会直接使用序号访问行数据，不会再次查询 Schema 映射或构造类型化句柄。

## 主要优势

| 特性         | 说明                                          |
| ------------ | --------------------------------------------- |
| 零拷贝访问   | 无需反序列化整个对象即可读取嵌套字段          |
| 内存效率     | 直接从磁盘对大型数据集进行内存映射            |
| 跨语言       | 二进制格式在 Java、Python、C++、Rust 之间兼容 |
| 部分反序列化 | 仅反序列化所需的特定元素                      |
| 高性能       | 为分析工作负载跳过不必要的数据解析            |

## 何时使用行格式

行格式适用于：

- **分析工作负载**：仅需访问特定字段时
- **大型数据集**：完整反序列化成本过高时
- **内存映射文件**：处理大于内存容量的数据时
- **数据管道**：无需完整重建对象即可处理数据
- **跨语言数据共享**：需要从多种语言访问数据时

## 跨语言兼容性

行格式可在多种语言之间无缝使用。同一份二进制数据可通过以下语言访问：

### Python

```python
import pyfory
from dataclasses import dataclass
from typing import List, Dict

@dataclass
class Bar:
    f1: str
    f2: List[pyfory.Int64]

@dataclass
class Foo:
    f1: pyfory.Int32
    f2: List[pyfory.Int32]
    f3: Dict[str, pyfory.Int32]
    f4: List[Bar]

encoder = pyfory.encoder(Foo)
binary: bytes = encoder.to_row(foo).to_bytes()

# Zero-copy access
foo_row = pyfory.RowData(encoder.schema, binary)
print(foo_row.f2[100000])
print(foo_row.f4[100000].f1)
```

### C++

```cpp
#include "fory/encoder/row_encoder.h"
#include "fory/row/writer.h"

struct Bar {
  std::string f1;
  std::vector<int64_t> f2;
  FORY_STRUCT(Bar, f1, f2);
};

struct Foo {
  int32_t f1;
  std::vector<int32_t> f2;
  std::map<std::string, int32_t> f3;
  std::vector<Bar> f4;
  FORY_STRUCT(Foo, f1, f2, f3, f4);
};

fory::row::encoder::RowEncoder<Foo> encoder;
encoder.encode(foo);
auto row = encoder.get_writer().to_row();

// Zero-copy random access
auto f2_array = row->get_array(1);
auto f4_array = row->get_array(3);
auto bar10 = f4_array->get_struct(10);
int64_t value = bar10->get_array(1)->get_int64(5);
std::string str = bar10->get_string(0);
```

## 性能对比

| 操作         | 对象格式               | 行格式               |
| ------------ | ---------------------- | -------------------- |
| 完整反序列化 | 分配所有对象           | 零分配               |
| 单个字段访问 | 需要完整反序列化       | 直接读取偏移位置     |
| 内存使用量   | 在内存中保留完整对象图 | 仅保留已访问的字段   |
| 适用场景     | 小型对象、完整访问     | 大型对象、选择性访问 |

## Apache Arrow 转换

将 Java 行转换为 Arrow `RecordBatch` 以进行分析处理：

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

## 接口与扩展类型

Java 行格式可以将接口或父类 Schema 映射到具体值。此项支持在 [#2243](https://github.com/apache/fory/pull/2243)、[#2250](https://github.com/apache/fory/pull/2250) 和 [#2256](https://github.com/apache/fory/pull/2256) 中引入。

### 接口映射

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

RowEncoder<Animal> encoder = Encoders.bean(Animal.class);
Dog dog = new Dog();
dog.name = "Bingo";
BinaryRow row = encoder.toRow(dog);
Animal decoded = encoder.fromRow(row);
System.out.println(decoded.speak()); // Woof
```

### 扩展类型映射

```java
public class Parent {
  public String parentField;
}

public class Child extends Parent {
  public String childField;
}

RowEncoder<Parent> encoder = Encoders.bean(Parent.class);
Child child = new Child();
child.parentField = "Hello";
child.childField = "World";
BinaryRow row = encoder.toRow(child);
Parent decoded = encoder.fromRow(row);
```

## 相关主题

- [跨语言互操作](../object-serialization/java/basic-serialization.md#cross-language-interoperability) - xlang 模式
- [Java 高级功能](../object-serialization/java/advanced-features.md) - 零拷贝对象序列化
- [行格式规范](https://fory.apache.org/docs/specification/row_format_spec) - 协议详情
