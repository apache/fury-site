---
title: 入门指南
sidebar_position: 10
id: getting_started
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

本指南介绍所有受支持语言中跨语言序列化的安装与基础设置。

## 安装

### Java

**Maven：**

```xml
<dependency>
  <groupId>org.apache.fory</groupId>
  <artifactId>fory-core</artifactId>
  <version>1.4.0</version>
</dependency>
```

**Gradle：**

```gradle
implementation 'org.apache.fory:fory-core:1.4.0'
```

### Python

```bash
pip install pyfory
```

### Go

```bash
go get github.com/apache/fory/go/fory
```

### Rust

```toml
[dependencies]
fory = "1.4.0"
```

### JavaScript/TypeScript

```bash
npm install @apache-fory/core
```

对于可选的 Node.js 字符串快速路径：

```bash
npm install @apache-fory/core @apache-fory/hps
```

### C\#

```bash
dotnet add package Apache.Fory --version 1.4.0
```

### Dart

```bash
dart pub add fory:^1.4.0
dart pub add dev:build_runner
```

### Swift

将 Fory 添加到 `Package.swift`：

```swift
dependencies: [
  .package(url: "https://github.com/apache/fory.git", exact: "1.4.0")
]
```

### Scala

```scala
libraryDependencies += "org.apache.fory" %% "fory-scala" % "1.4.0"
```

### Kotlin

```kotlin
implementation("org.apache.fory:fory-kotlin:1.4.0")
```

### C++

使用 Bazel 或 CMake 从源码构建。详见 [C++ 指南](../cpp/index.md)。

## 创建 Xlang 运行时

对于暴露模式开关的运行时，Xlang 模式是默认选项。Swift、C#、JavaScript/TypeScript 和 Dart
只暴露 xlang 编码格式。下面的示例将兼容的 Schema 演进保留在默认路径上，只展示会改变其他设置的选项。

### Java

```java
import org.apache.fory.*;
import org.apache.fory.config.*;

Fory fory = Fory.builder()
    .withXlang(true)
    .withRefTracking(true)  // Optional: for circular references
    .build();
```

### Python

```python
import pyfory

fory = pyfory.Fory(xlang=True)

# Enable reference tracking when needed
fory = pyfory.Fory(xlang=True, ref=True)
```

### Go

```go
import forygo "github.com/apache/fory/go/fory"

fory := forygo.NewFory(forygo.WithXlang(true))
// Or with reference tracking
fory := forygo.NewFory(forygo.WithXlang(true), forygo.WithTrackRef(true))
```

### Rust

```rust
use fory::Fory;

let fory = Fory::builder().xlang(true).build();
```

### JavaScript/TypeScript

```javascript
import Fory, { Type } from "@apache-fory/core";

const fory = new Fory();
```

### C\#

```csharp
using Apache.Fory;

Fory fory = Fory.Builder().Build();
```

### Dart

```dart
import 'package:fory/fory.dart';

final fory = Fory();
```

### Swift

```swift
import Fory

let fory = Fory()
```

### Scala

```scala
import org.apache.fory.scala.ForyScala

val fory = ForyScala.builder()
  .withXlang(true)
  .build()
```

### Kotlin

```kotlin
import org.apache.fory.kotlin.ForyKotlin

val fory = ForyKotlin.builder()
    .withXlang(true)
    .build()
```

### C++

```cpp
#include "fory/serialization/fory.h"

using namespace fory::serialization;

auto fory = Fory::builder().xlang(true).build();
```

## 类型注册

自定义类型必须在所有语言中使用一致的名称或 ID 注册。

### 按名称注册（推荐）

使用字符串名称更灵活，也更不容易发生冲突：

**Java：**

```java
fory.register(Person.class, "example.Person");
```

**Python：**

```python
fory.register_type(Person, typename="example.Person")
```

**Go：**

```go
fory.RegisterStructByName(Person{}, "example.Person")
```

**Rust：**

```rust
use fory::{Fory, ForyStruct};

#[derive(ForyStruct)]
struct Person {
    name: String,
    age: i32,
}

let mut fory = Fory::builder().xlang(true).build();
fory
    .register_by_name::<Person>("example", "Person")
    .expect("register Person");
```

**JavaScript/TypeScript：**

```javascript
const personType = Type.struct(
  { typeName: "example.Person" },
  {
    name: Type.string(),
    age: Type.int32(),
  },
);
const { serialize, deserialize } = fory.register(personType);
```

**C++：**

```cpp
fory.register_struct<Person>("example", "Person");
// For enums, use register_enum:
// fory.register_enum<Color>("example", "Color");
```

**C#：**

```csharp
fory.Register<Person>("example", "Person");
```

**Dart：**

```dart
PersonForyModule.register(
  fory,
  Person,
  namespace: 'example',
  typeName: 'Person',
);
```

**Swift：**

```swift
try fory.register(Person.self, namespace: "example", name: "Person")
```

**Scala：**

```scala
fory.register(classOf[Person], "example.Person")
```

**Kotlin：**

```kotlin
fory.register(Person::class.java, "example.Person")
```

### 按 ID 注册

使用数字 ID 速度更快，并且生成的二进制输出更小：

**Java：**

```java
fory.register(Person.class, 100);
```

**Python：**

```python
fory.register_type(Person, type_id=100)
```

**Go：**

```go
fory.RegisterStruct(Person{}, 100)
```

**Rust：**

```rust
fory.register::<Person>(100)?;
```

**JavaScript/TypeScript：**

```javascript
const personType = Type.struct(
  { typeId: 100 },
  {
    name: Type.string(),
    age: Type.int32(),
  },
);
```

**C++：**

```cpp
fory.register_struct<Person>(100);
// For enums, use register_enum:
// fory.register_enum<Color>(101);
```

**C#：**

```csharp
fory.Register<Person>(100);
```

**Dart：**

```dart
PersonForyModule.register(fory, Person, id: 100);
```

**Swift：**

```swift
fory.register(Person.self, id: 100)
```

**Scala：**

```scala
fory.register(classOf[Person], 100)
```

**Kotlin：**

```kotlin
fory.register(Person::class.java, 100)
```

## Hello World 示例

下面给出一个完整示例，展示如何在 Java 中序列化、在 Python 中反序列化：

### Java（序列化端）

```java
import org.apache.fory.*;
import org.apache.fory.config.*;
import java.nio.file.*;

public class Person {
    public String name;
    public int age;
}

public class HelloWorld {
    public static void main(String[] args) throws Exception {
        Fory fory = Fory.builder().withXlang(true).build();
        fory.register(Person.class, "example.Person");

        Person person = new Person();
        person.name = "Alice";
        person.age = 30;

        byte[] bytes = fory.serialize(person);
        Files.write(Path.of("person.bin"), bytes);
        System.out.println("Serialized to person.bin");
    }
}
```

### Python（反序列化端）

```python
import pyfory
from dataclasses import dataclass

@dataclass
class Person:
    name: str
    age: pyfory.Int32

fory = pyfory.Fory(xlang=True)
fory.register_type(Person, typename="example.Person")

with open("person.bin", "rb") as f:
    data = f.read()

person = fory.deserialize(data)
print(f"Name: {person.name}, Age: {person.age}")
# Output: Name: Alice, Age: 30
```

## 最佳实践

1. **使用一致的类型名**：确保所有语言使用相同的类型名或 ID。
2. **启用引用跟踪**：如果你的数据包含循环引用或共享引用。
3. **复用 Fory 实例**：创建 Fory 实例成本较高，应尽量复用。
4. **使用类型注解**：在 Python 中使用 `pyfory.Int32` 等标记来获得精确的类型映射。
5. **测试跨语言链路**：验证序列化在所有目标语言之间都能正确工作。

## 后续步骤

- [类型映射](../../specification/xlang_type_mapping.md) - 跨语言类型映射参考
- [序列化](serialization.md) - 更详细的序列化示例
- [故障排查](troubleshooting.md) - 常见问题与解决方案
