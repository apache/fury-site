---
title: 类型注册
sidebar_position: 5
id: type-registration
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

本文介绍 Apache Fory™ Rust 的类型注册方法。

## 按 ID 注册

使用数字 ID 注册类型，以获得快速、紧凑的序列化：

```rust
use fory::Fory;
use fory::ForyStruct;

#[derive(ForyStruct)]
struct User {
    name: String,
    age: i32,
}

let mut fory = Fory::builder().xlang(false).build();
fory.register::<User>(1)?;

let user = User {
    name: "Alice".to_string(),
    age: 30,
};

let bytes = fory.serialize(&user)?;
let decoded: User = fory.deserialize(&bytes)?;
```

## 按名称注册

为保证跨语言兼容性，请使用稳定名称注册。使用 `.` 分隔命名空间前缀和类型名称：

```rust
let mut fory = Fory::builder().xlang(true).build();

// Register with symbolic type identity
fory.register_by_name::<MyStruct>("com.example.MyStruct")?;
```

## 注册自定义序列化器

对于需要自定义序列化逻辑的类型，请注册自定义序列化器：

```rust
let mut fory = Fory::builder().xlang(false).build();
fory.register_serializer::<UuidSerializer>(100)?;
```

外部结构化序列化器使用普通结构化注册 API：

```rust
fory.register::<UserSerializer>(101)?;
```

序列化器的 `Target` 是运行时值类型。注册不需要单独的外部类型 API。在字段上，`with` 可以选择 `VecSerializer<UserSerializer>` 等确切载体序列化器，而递归 `list`、`map` 或 `tuple` 注解在子节点选择序列化器。在根上组合相同的载体序列化器。载体序列化器不注册。

## 注册一致性

Rust 注册 API 使用显式 ID 或显式名称。序列化和反序列化对等端应保持相同的注册映射：

```rust
// Serializer side
let mut fory = Fory::builder().xlang(false).build();
fory.register::<TypeA>(1)?;
fory.register::<TypeB>(2)?;
fory.register::<TypeC>(3)?;

// Deserializer side - MUST use the same ID mapping
let mut fory = Fory::builder().xlang(false).build();
fory.register::<TypeA>(1)?;
fory.register::<TypeB>(2)?;
fory.register::<TypeC>(3)?;
```

## 线程安全注册

在线程启动前完成所有注册：

```rust
use std::sync::Arc;
use std::thread;

let mut fory = Fory::builder().xlang(false).build();
fory.register::<User>(1)?;
fory.register::<Order>(2)?;

// Now share across threads
let fory = Arc::new(fory);

let handles: Vec<_> = (0..4)
    .map(|_| {
        let shared = Arc::clone(&fory);
        thread::spawn(move || {
            // Use fory for serialization
        })
    })
    .collect();
```

## 最佳实践

1. **使用一致的 ID**：为实现跨语言兼容性，所有语言使用相同类型 ID
2. **线程启动前注册**：在线程启动前完成所有注册
3. **跨语言模式使用命名空间**：使类型名称在各语言间保持一致
4. **显式 ID 保证稳定性**：生产环境避免自动生成 ID

## 相关主题

- [配置](configuration.md) - Fory 构建器选项
- [跨语言序列化](basic-serialization.md#cross-language-interoperability) - xlang 模式注册
- [自定义序列化器](custom-serializers.md) - 自定义序列化
- [外部类型序列化](external-types.md) - 第三方目标和载体根值
