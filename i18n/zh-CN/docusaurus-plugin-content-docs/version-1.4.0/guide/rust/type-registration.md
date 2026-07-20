---
title: 类型注册
sidebar_position: 3
id: type_registration
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

本页涵盖 Apache Fory™ Rust 中的类型注册方法。

## 按 ID 注册

使用数字 ID 注册类型以实现快速、紧凑的序列化：

```rust
use fory::Fory;
use fory::ForyObject;

#[derive(ForyObject)]
struct User {
    name: String,
    age: i32,
}

let mut fory = Fory::default();
fory.register::<User>(1)?;

let user = User {
    name: "Alice".to_string(),
    age: 30,
};

let bytes = fory.serialize(&user)?;
let decoded: User = fory.deserialize(&bytes)?;
```

## 按命名空间注册

为了跨语言兼容性，使用命名空间和类型名称注册：

```rust
let mut fory = Fory::default()
    .compatible(true)
    .xlang(true);

// 使用基于命名空间的命名注册
fory.register_by_namespace::<MyStruct>("com.example", "MyStruct");
```

## 注册自定义序列化器

对于需要自定义序列化逻辑的类型：

```rust
let mut fory = Fory::default();
fory.register_serializer::<CustomType>(100);
```

## 注册顺序

当使用没有显式 ID 的基于 ID 的注册时，注册顺序很重要。确保序列化和反序列化之间的注册顺序一致：

```rust
// 序列化器端
let mut fory = Fory::default();
fory.register::<TypeA>(1)?;
fory.register::<TypeB>(2)?;
fory.register::<TypeC>(3)?;

// 反序列化器端 - 必须使用相同顺序
let mut fory = Fory::default();
fory.register::<TypeA>(1)?;
fory.register::<TypeB>(2)?;
fory.register::<TypeC>(3)?;
```

## 线程安全注册

在生成线程之前执行所有注册：

```rust
use std::sync::Arc;
use std::thread;

let mut fory = Fory::default();
fory.register::<User>(1)?;
fory.register::<Order>(2)?;

// 现在可以在线程间共享
let fory = Arc::new(fory);

let handles: Vec<_> = (0..4)
    .map(|_| {
        let shared = Arc::clone(&fory);
        thread::spawn(move || {
            // 使用 fory 进行序列化
        })
    })
    .collect();
```

## 最佳实践

1. **使用一致的 ID**：在所有语言中为相同类型使用相同的类型 ID 以实现跨语言兼容性
2. **在线程化之前注册**：在生成线程之前完成所有注册
3. **对 xlang 使用命名空间**：使类型名称在各语言之间保持一致
4. **显式 ID 以保持稳定性**：在生产环境中避免自动生成的 ID

## 相关主题

- [配置](configuration.md) - Fory 构建器选项
- [跨语言](xlang-serialization.md) - XLANG 模式注册
- [自定义序列化器](custom-serializers.md) - 自定义序列化
