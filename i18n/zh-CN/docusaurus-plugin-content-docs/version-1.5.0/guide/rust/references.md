---
title: 共享和循环引用
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

Apache Fory™ 使用 `Rc<T>` 和 `Arc<T>` 自动跟踪和保留共享对象的引用身份。

## 共享引用

当同一对象被多次引用时，Fory 仅序列化一次，并对后续出现使用引用 ID。这确保了：

- **空间效率**：序列化输出中无数据重复
- **引用身份保留**：反序列化的对象保持相同的共享关系
- **循环引用支持**：使用 `RcWeak<T>` 和 `ArcWeak<T>` 打破循环

### 使用 Rc 的共享引用

```rust
use fory::Fory;
use std::rc::Rc;

let fory = Fory::default();

// 创建共享值
let shared = Rc::new(String::from("shared_value"));

// 多次引用它
let data = vec![shared.clone(), shared.clone(), shared.clone()];

// 共享值仅序列化一次
let bytes = fory.serialize(&data);
let decoded: Vec<Rc<String>> = fory.deserialize(&bytes)?;

// 验证引用身份被保留
assert_eq!(decoded.len(), 3);
assert_eq!(*decoded[0], "shared_value");

// 所有三个 Rc 指针指向同一对象
assert!(Rc::ptr_eq(&decoded[0], &decoded[1]));
assert!(Rc::ptr_eq(&decoded[1], &decoded[2]));
```

### 使用 Arc 的共享引用

对于线程安全的共享引用，使用 `Arc<T>`：

```rust
use fory::Fory;
use std::sync::Arc;

let fory = Fory::default();

let shared = Arc::new(String::from("shared_value"));
let data = vec![shared.clone(), shared.clone()];

let bytes = fory.serialize(&data);
let decoded: Vec<Arc<String>> = fory.deserialize(&bytes)?;

assert!(Arc::ptr_eq(&decoded[0], &decoded[1]));
```

## 使用弱指针的循环引用

要序列化类似父子关系或双向链表结构的循环引用，使用 `RcWeak<T>` 或 `ArcWeak<T>` 来打破循环。

**工作原理：**

- 弱指针序列化为对其目标对象的引用
- 如果强指针已被丢弃，弱指针序列化为 `Null`
- 前向引用（弱指针出现在目标之前）通过回调解析
- 弱指针的所有克隆共享相同的内部单元以进行自动更新

### 使用 RcWeak 的循环引用

```rust
use fory::{Fory, Error};
use fory::ForyObject;
use fory::RcWeak;
use std::rc::Rc;
use std::cell::RefCell;

#[derive(ForyObject, Debug)]
struct Node {
    value: i32,
    parent: RcWeak<RefCell<Node>>,
    children: Vec<Rc<RefCell<Node>>>,
}

let mut fory = Fory::default();
fory.register::<Node>(2000);

// 构建父子树
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

// 序列化和反序列化循环结构
let bytes = fory.serialize(&parent);
let decoded: Rc<RefCell<Node>> = fory.deserialize(&bytes)?;

// 验证循环关系
assert_eq!(decoded.borrow().children.len(), 2);
for child in &decoded.borrow().children {
    let upgraded_parent = child.borrow().parent.upgrade().unwrap();
    assert!(Rc::ptr_eq(&decoded, &upgraded_parent));
}
```

### 使用 Arc 的线程安全循环图

```rust
use fory::{Fory, Error};
use fory::ForyObject;
use fory::ArcWeak;
use std::sync::{Arc, Mutex};

#[derive(ForyObject)]
struct Node {
    val: i32,
    parent: ArcWeak<Mutex<Node>>,
    children: Vec<Arc<Mutex<Node>>>,
}

let mut fory = Fory::default();
fory.register::<Node>(6000);

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

let bytes = fory.serialize(&parent);
let decoded: Arc<Mutex<Node>> = fory.deserialize(&bytes)?;

assert_eq!(decoded.lock().unwrap().children.len(), 2);
for child in &decoded.lock().unwrap().children {
    let upgraded_parent = child.lock().unwrap().parent.upgrade().unwrap();
    assert!(Arc::ptr_eq(&decoded, &upgraded_parent));
}
```

## 支持的智能指针类型

| 类型         | 描述                                 |
| ------------ | ------------------------------------ |
| `Rc<T>`      | 引用计数，跟踪共享引用               |
| `Arc<T>`     | 线程安全引用计数，跟踪共享引用       |
| `RcWeak<T>`  | 指向 `Rc<T>` 的弱引用，打破循环引用  |
| `ArcWeak<T>` | 指向 `Arc<T>` 的弱引用，打破循环引用 |
| `RefCell<T>` | 内部可变性，运行时借用检查           |
| `Mutex<T>`   | 线程安全内部可变性                   |

## 最佳实践

1. **使用 Rc/Arc 共享数据**：让 Fory 处理去重
2. **使用弱指针处理循环**：防止无限递归
3. **对线程安全场景优先使用 Arc**：当数据跨越线程边界时
4. **与 RefCell/Mutex 结合使用**：用于内部可变性

## 相关主题

- [基础序列化](basic-serialization.md) - 支持的类型
- [多态](polymorphism.md) - 使用 Rc/Arc 的 Trait 对象
- [配置](configuration.md) - 引用跟踪选项
