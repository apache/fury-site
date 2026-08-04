---
title: 引用跟踪
sidebar_position: 5
id: references
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

本文说明 Fory 在跨语言序列化中如何对共享引用和循环引用进行引用跟踪。

## 概述

引用跟踪支持：

- **共享引用**：多次引用的同一对象只序列化一次
- **循环引用**：支持引用自身或形成环的对象
- **内存效率**：重复对象不会产生重复数据

## 启用引用跟踪

### Java

```java
Fory fory = Fory.builder()
        .withXlang(true)
        .withRefTracking(true)
    .build();
```

### Python

```python
fory = pyfory.Fory(xlang=True, ref=True)
```

### Go

```go
fory := forygo.NewFory(
    forygo.WithXlang(true),
    forygo.WithTrackRef(true),
)
```

### C++

```cpp
auto fory = fory::serialization::Fory::builder().xlang(true).track_ref(true).build();
```

### Rust

```rust
let fory = Fory::builder()
    .xlang(true)
    .track_ref(true).build();
```

### Scala

```scala
import org.apache.fory.scala.ForyScala

val fory = ForyScala.builder()
      .withXlang(true)
      .withRefTracking(true)
  .build()
```

## 编码格式

启用引用跟踪后，可空字段会在值之前写入一个**引用标志字节**：

```
[ref_flag] [value data if not null/ref]
```

其中 `ref_flag` 为：

| 值                         | 含义                          |
| -------------------------- | ----------------------------- |
| `-1` (NULL_FLAG)           | 值为 null                     |
| `-2` (NOT_NULL_VALUE_FLAG) | 值存在，且是首次出现          |
| `≥0`                       | 指向之前已序列化对象的引用 ID |

## 引用跟踪与可空性

二者是**相互独立**的概念：

| 概念         | 用途                 | 控制方式                        |
| ------------ | -------------------- | ------------------------------- |
| **可空性**   | 字段能否保存 null 值 | 字段类型（`Optional<T>`）或注解 |
| **引用跟踪** | 是否对重复对象去重   | 全局 `refTracking` 选项         |

关键行为：

- 引用标志字节**只为可空字段写入**
- 即使设置 `refTracking=true`，不可空字段也完全跳过引用标志
- 引用去重只适用于多次出现的对象

```java
// Reference tracking enabled, but non-nullable fields still skip ref flags
Fory fory = Fory.builder()
        .withXlang(true)
        .withRefTracking(true)
    .build();
```

## 按字段进行引用跟踪

默认情况下，即使全局设置了 `refTracking=true`，**大多数字段也不会跟踪引用**。只有特定的指针或智能指针类型默认跟踪引用。

### 各语言的默认行为

| 语言   | 默认引用跟踪 | 默认跟踪引用的类型                                         |
| ------ | ------------ | ---------------------------------------------------------- |
| Java   | 否           | 无（使用注解启用）                                         |
| Python | 否           | 无（使用注解启用）                                         |
| Go     | 否           | 无（使用 `fory:"ref"` 启用）                               |
| C++    | 是           | `std::shared_ptr<T>`、`fory::serialization::SharedWeak<T>` |
| Rust   | 否           | `Rc<T>`、`Arc<T>`、`Weak<T>`                               |
| Scala  | 否           | 无（使用 `@Ref` 启用）                                     |

### 自定义按字段引用跟踪

#### Java：@Ref 注解

```java
public class Document {
    // Default: no ref tracking
    String title;

    // Enable ref tracking for this field
    @Ref
    Author author;

    // Shared across documents, track refs to avoid duplicates
    List<@Ref Tag> tags;
}
```

#### C++：FORY_STRUCT 字段配置

```cpp
struct Document {
    std::string title;

    // shared_ptr/SharedWeak track refs by default
    std::shared_ptr<Author> author;
    fory::serialization::SharedWeak<Data> data;

    std::shared_ptr<Tag> tag_owner;
};
FORY_STRUCT(Document,
    title,
    author,
    data,
    (tag_owner, fory::F().ref())
);
```

要完全禁用 C++ 引用跟踪，请在序列化器上设置
`Fory::builder().xlang(true).track_ref(false).build()`。

#### Rust：字段属性

```rust
use fory::ForyStruct;
use std::rc::Rc;

#[derive(ForyStruct)]
struct Document {
    title: String,

    // Rc/Arc track refs by default
    author: Rc<Author>,

    // Explicitly enable ref tracking
    #[fory(ref = true)]
    tags: Vec<Tag>,
}
```

#### Scala：@Ref 注解

Scala Schema IDL 和 Scala 3 宏派生使用同一个共享 JVM `@Ref` 注解：

```scala
import org.apache.fory.annotation.{ForyField, ForyStruct, Ref}
import org.apache.fory.scala.ForySerializer

@ForyStruct
final class Node() derives ForySerializer {
  @ForyField(id = 1)
  var children: List[Node @Ref] = List.empty

  @Ref
  @ForyField(id = 2)
  var parent: Option[Node] = None
}
```

在 Scala 中，顶层字段的引用跟踪由字段或构造函数参数上的 `@Ref` 控制。类型使用位置的 `T @Ref` 用于嵌套元素、值或载荷引用，例如 `List[Node @Ref]`。

#### Go：结构体标签

```go
type Document struct {
    Title string

    // Enable ref tracking for pointer to struct
    Author *Author `fory:"ref"`

    // Enable ref tracking for slice
    Tags []Tag `fory:"ref"`
}
```

### 何时启用按字段引用跟踪

对符合以下条件的字段启用引用跟踪：

- 可能多次包含同一个对象实例
- 属于循环引用链的一部分
- 保存可能被共享的大型对象

对符合以下条件的字段禁用引用跟踪（或保留默认设置）：

- 始终包含唯一值
- 属于原始类型或简单值类型
- 不参与对象共享

## 示例：共享引用

```java
public class Container {
    List<String> data;
    List<String> sameData;  // Points to same list
}

Container obj = new Container();
obj.data = Arrays.asList("a", "b", "c");
obj.sameData = obj.data;  // Shared reference

// With refTracking=true: data serialized once, sameData stores reference ID
// With refTracking=false: data serialized twice (duplicate)
```

## 示例：循环引用

```java
public class Node {
    String value;
    Node next;
}

Node a = new Node("A");
Node b = new Node("B");
a.next = b;
b.next = a;  // Circular reference

// With refTracking=true: works correctly
// With refTracking=false: infinite recursion error
```

## 语言支持

| 语言       | 共享引用 | 循环引用         |
| ---------- | -------- | ---------------- |
| Java       | 是       | 是               |
| Python     | 是       | 是               |
| Go         | 是       | 是               |
| C++        | 是       | 是               |
| JavaScript | 是       | 是               |
| Rust       | 是       | 否（所有权规则） |

## 性能注意事项

- **开销**：引用跟踪会为每个对象增加一次哈希表查找
- **何时启用**：数据包含共享引用或循环引用时启用
- **何时禁用**：用于不含共享关系的简单数据结构时禁用

## 另请参阅

- [字段可空性](nullability.md) - 可空性如何影响序列化
- [跨语言概述](index.md) - 跨语言序列化工作流和运行时指南
- [跨语言规范](../../specification/xlang_serialization_spec.md) - 二进制协议详情
