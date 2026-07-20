---
title: 引用跟踪
sidebar_position: 45
id: reference_tracking
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

本页说明 Fory 在跨语言序列化中如何处理共享引用与循环引用的引用跟踪。

## 概述

引用跟踪支持：

- **共享引用**：同一对象被多次引用时只序列化一次
- **循环引用**：对象引用自身或形成环
- **内存效率**：重复对象不会产生重复数据

## 启用引用跟踪

### Java

```java
Fory fory = Fory.builder()
    .withLanguage(Language.XLANG)
    .withRefTracking(true)
    .build();
```

### Python

```python
fory = pyfory.Fory(xlang=True, ref_tracking=True)
```

### Go

```go
fory := forygo.NewFory(true)  // true enables ref tracking
```

### C++

```cpp
auto fory = fory::Fory::create(fory::Config{
    .ref_tracking = true
});
```

### Rust

```rust
let fory = Fory::builder()
    .with_ref_tracking(true)
    .build();
```

## 编码格式

启用引用跟踪后，可空字段会在值之前写入 **ref 标记字节**：

```
[ref_flag] [value data if not null/ref]
```

其中 `ref_flag` 为：

| 值 | 含义 |
| -------------------------- | ----------------------------------------------------- |
| `-1` (NULL_FLAG) | 值为 null |
| `-2` (NOT_NULL_VALUE_FLAG) | 值存在，且是首次出现 |
| `≥0` | 指向此前已序列化对象的引用 ID |

## 引用跟踪与可空性

二者是**相互独立**的概念：

| 概念 | 目的 | 控制方式 |
| ---------------------- | ------------------------------------------ | ---------------------------------------- |
| **可空性** | 字段是否可以保存 null 值 | 字段类型（`Optional<T>`）或注解 |
| **引用跟踪** | 是否对重复对象去重 | 全局 `refTracking` 选项 |

关键行为：

- ref 标记字节**只会为可空字段写入**
- 即使 `refTracking=true`，不可空字段也完全跳过 ref 标记
- 引用去重只适用于多次出现的对象

```java
// Reference tracking enabled, but non-nullable fields still skip ref flags
Fory fory = Fory.builder()
    .withLanguage(Language.XLANG)
    .withRefTracking(true)
    .build();
```

## 按字段配置引用跟踪

默认情况下，即使全局 `refTracking=true`，**大多数字段也不会跟踪引用**。只有特定指针/智能指针类型默认跟踪引用。

### 各语言默认行为

| 语言 | 默认引用跟踪 | 默认跟踪引用的类型 |
| -------- | -------------------- | --------------------------------- |
| Java | 否 | 无（使用注解启用） |
| Python | 否 | 无（使用注解启用） |
| Go | 否 | 无（使用 `fory:"ref"` 启用） |
| C++ | 否 | `std::shared_ptr<T>` |
| Rust | 否 | `Rc<T>`、`Arc<T>`、`Weak<T>` |

### 自定义字段级引用跟踪

#### Java：@ForyField 注解

```java
public class Document {
    // Default: no ref tracking
    String title;

    // Enable ref tracking for this field
    @ForyField(trackingRef = true)
    Author author;

    // Shared across documents, track refs to avoid duplicates
    @ForyField(trackingRef = true)
    List<Tag> tags;
}
```

#### C++：fory::field 包装器

```cpp
struct Document {
    std::string title;

    // shared_ptr tracks refs by default
    std::shared_ptr<Author> author;

    // Explicitly enable ref tracking
    fory::field<std::vector<Tag>, 1, fory::track_ref<true>> tags;

    // Explicitly disable ref tracking
    fory::field<std::shared_ptr<Data>, 2, fory::track_ref<false>> data;
};
FORY_STRUCT(Document, title, author, tags, data);
```

#### Rust：字段属性

```rust
#[derive(Fory)]
#[tag("example.Document")]
struct Document {
    title: String,

    // Rc/Arc track refs by default
    author: Rc<Author>,

    // Explicitly enable ref tracking
    #[track_ref]
    tags: Vec<Tag>,
}
```

#### Go：结构体 tag

```go
type Document struct {
    Title string

    // Enable ref tracking for pointer to struct
    Author *Author `fory:"ref"`

    // Enable ref tracking for slice
    Tags []Tag `fory:"ref"`
}
```

### 何时启用字段级引用跟踪

以下字段应启用引用跟踪：

- 可能多次包含同一个对象实例
- 参与循环引用链
- 持有可能被共享的大对象

以下字段应禁用或保持默认：

- 始终包含唯一值
- 是基本类型或简单值类型
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

| Language   | Shared Refs | Circular Refs        |
| ---------- | ----------- | -------------------- |
| Java       | Yes         | Yes                  |
| Python     | Yes         | Yes                  |
| Go         | Yes         | Yes                  |
| C++        | Yes         | Yes                  |
| JavaScript | Yes         | Yes                  |
| Rust       | Yes         | No (ownership rules) |

## Performance Considerations

- **Overhead**: Reference tracking adds a hash map lookup per object
- **When to enable**: Use when data has shared/circular references
- **When to disable**: Use for simple data structures without sharing

## See Also

- [Field Nullability](field-nullability.md) - How nullability affects serialization
- [Serialization](serialization.md) - Basic cross-language serialization examples
- [Xlang Specification](https://fory.apache.org/docs/specification/fory_xlang_serialization_spec) - Binary protocol details
