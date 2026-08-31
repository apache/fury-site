---
title: 共享引用与循环引用
sidebar_position: 8
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

Apache Fory™ 使用 `Rc<T>` 和 `Arc<T>` 自动跟踪并保留共享对象的引用标识。

## 共享引用

同一对象被多次引用时，Fory 只序列化一次，并对后续出现使用引用 ID。这可以确保：

- **空间效率**：序列化输出中没有重复数据
- **保留引用标识**：反序列化对象保持相同的共享关系
- **循环引用支持**：使用 `RcWeak<T>` 和 `ArcWeak<T>` 打破循环

### 使用 Rc 的共享引用

```rust
use fory::Fory;
use std::rc::Rc;

let fory = Fory::builder().xlang(false).build();

// Create a shared value
let shared = Rc::new(String::from("shared_value"));

// Reference it multiple times
let data = vec![shared.clone(), shared.clone(), shared.clone()];

// The shared value is serialized only once
let bytes = fory.serialize(&data)?;
let decoded: Vec<Rc<String>> = fory.deserialize(&bytes)?;

// Verify reference identity is preserved
assert_eq!(decoded.len(), 3);
assert_eq!(*decoded[0], "shared_value");

// All three Rc pointers point to the same object
assert!(Rc::ptr_eq(&decoded[0], &decoded[1]));
assert!(Rc::ptr_eq(&decoded[1], &decoded[2]));
```

### 使用 Arc 的共享引用

对于线程安全的共享引用，请使用 `Arc<T>`：

```rust
use fory::Fory;
use std::sync::Arc;

let fory = Fory::builder().xlang(false).build();

let shared = Arc::new(String::from("shared_value"));
let data = vec![shared.clone(), shared.clone()];

let bytes = fory.serialize(&data)?;
let decoded: Vec<Arc<String>> = fory.deserialize(&bytes)?;

assert!(Arc::ptr_eq(&decoded[0], &decoded[1]));
```

## 使用弱指针的循环引用

要序列化父子关系或双向链接结构等循环引用，请使用 `RcWeak<T>` 或 `ArcWeak<T>` 打破循环。

**工作原理：**

- 弱指针序列化为对目标对象的引用
- 如果强指针已被丢弃，弱指针序列化为 `Null`
- 前向引用（弱指针先于目标出现）通过回调解析
- 弱指针的所有克隆共享同一内部单元，以便自动更新

### 使用 RcWeak 的循环引用

```rust
use fory::{Fory, Error};
use fory::ForyStruct;
use fory::RcWeak;
use std::rc::Rc;
use std::cell::RefCell;

#[derive(ForyStruct, Debug)]
struct Node {
    value: i32,
    parent: RcWeak<RefCell<Node>>,
    children: Vec<Rc<RefCell<Node>>>,
}

let mut fory = Fory::builder().xlang(false).build();
fory.register::<Node>(2000)?;

// Build a parent-child tree
let parent = Rc::new(RefCell::new(Node {
    value: 1,
    parent: RcWeak::new(),
    children: vec![],
}));

let child1 = Rc::new(RefCell::new(Node {
    value: 2,
    parent: RcWeak::from(&parent),
    children: vec![],
}));

let child2 = Rc::new(RefCell::new(Node {
    value: 3,
    parent: RcWeak::from(&parent),
    children: vec![],
}));

parent.borrow_mut().children.push(child1.clone());
parent.borrow_mut().children.push(child2.clone());

// Serialize and deserialize the circular structure
let bytes = fory.serialize(&parent)?;
let decoded: Rc<RefCell<Node>> = fory.deserialize(&bytes)?;

// Verify the circular relationship
assert_eq!(decoded.borrow().children.len(), 2);
for child in &decoded.borrow().children {
    let upgraded_parent = child.borrow().parent.upgrade().unwrap();
    assert!(Rc::ptr_eq(&decoded, &upgraded_parent));
}
```

### 使用 Arc 的线程安全循环对象图

```rust
use fory::{Fory, Error};
use fory::ForyStruct;
use fory::ArcWeak;
use std::sync::{Arc, Mutex};

#[derive(ForyStruct)]
struct Node {
    val: i32,
    parent: ArcWeak<Mutex<Node>>,
    children: Vec<Arc<Mutex<Node>>>,
}

let mut fory = Fory::builder().xlang(false).build();
fory.register::<Node>(6000)?;

let parent = Arc::new(Mutex::new(Node {
    val: 10,
    parent: ArcWeak::new(),
    children: vec![],
}));

let child1 = Arc::new(Mutex::new(Node {
    val: 20,
    parent: ArcWeak::from(&parent),
    children: vec![],
}));

let child2 = Arc::new(Mutex::new(Node {
    val: 30,
    parent: ArcWeak::from(&parent),
    children: vec![],
}));

parent.lock().unwrap().children.push(child1.clone());
parent.lock().unwrap().children.push(child2.clone());

let bytes = fory.serialize(&parent)?;
let decoded: Arc<Mutex<Node>> = fory.deserialize(&bytes)?;

assert_eq!(decoded.lock().unwrap().children.len(), 2);
for child in &decoded.lock().unwrap().children {
    let upgraded_parent = child.lock().unwrap().parent.upgrade().unwrap();
    assert!(Arc::ptr_eq(&decoded, &upgraded_parent));
}
```

## 支持的智能指针类型

| 类型         | 说明                                     |
| ------------ | ---------------------------------------- |
| `Rc<T>`      | 引用计数，跟踪共享引用                   |
| `Arc<T>`     | 线程安全的引用计数，跟踪共享引用         |
| `RcWeak<T>`  | 指向 `Rc<T>` 的弱引用，用于打破循环引用  |
| `ArcWeak<T>` | 指向 `Arc<T>` 的弱引用，用于打破循环引用 |
| `RefCell<T>` | 带运行时借用检查的内部可变性             |
| `Mutex<T>`   | 线程安全的内部可变性                     |

## 最佳实践

1. **共享数据使用 Rc/Arc**：让 Fory 处理去重
2. **循环引用使用弱指针**：防止无限递归
3. **线程安全场景优先使用 Arc**：数据跨越线程边界时
4. **与 RefCell/Mutex 组合**：实现内部可变性

## 相关主题

- [基本序列化](basic-serialization.md) - 支持的类型
- [多态](polymorphism.md) - 使用 Rc/Arc 的特征对象
- [配置](configuration.md) - 引用跟踪选项
