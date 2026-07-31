---
title: 类型注册
sidebar_position: 5
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

本页介绍 Apache Fory™ Rust 中的类型注册方法。

## 按 ID 注册

使用数字 ID 注册类型，可实现快速、紧凑的序列化：

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

为了实现跨语言兼容性，请使用稳定名称注册。使用 `.` 分隔命名空间前缀和类型名称：

```rust
let mut fory = Fory::builder().xlang(true).build();

// 使用符号类型身份注册
fory.register_by_name::<MyStruct>("com.example.MyStruct")?;
```

## 注册自定义序列化器

对于需要自定义序列化逻辑的类型，请注册自定义序列化器：

```rust
let mut fory = Fory::builder().xlang(false).build();
fory.register_serializer::<UuidSerializer>(100)?;
```

外部结构化序列化器使用普通的结构化注册 API：

```rust
fory.register::<UserSerializer>(101)?;
```

序列化器的 `Target` 是运行时值类型。注册时不需要单独的外部类型 API。在字段上，`with` 可以选择与字段类型完全匹配的承载序列化器，例如 `VecSerializer<UserSerializer>`；递归的 `list`、`map` 或 `tuple` 注解则选择子节点上的序列化器。在根值上，使用相同的承载序列化器进行组合。承载序列化器本身不需要注册。

## 注册一致性

Rust 注册 API 使用显式 ID 或显式名称。序列化和反序列化通信双方必须保持相同的注册映射：

```rust
// 序列化端
let mut fory = Fory::builder().xlang(false).build();
fory.register::<TypeA>(1)?;
fory.register::<TypeB>(2)?;
fory.register::<TypeC>(3)?;

// 反序列化端——必须使用相同的 ID 映射
let mut fory = Fory::builder().xlang(false).build();
fory.register::<TypeA>(1)?;
fory.register::<TypeB>(2)?;
fory.register::<TypeC>(3)?;
```

## 线程安全注册

启动线程之前完成所有注册：

```rust
use std::sync::Arc;
use std::thread;

let mut fory = Fory::builder().xlang(false).build();
fory.register::<User>(1)?;
fory.register::<Order>(2)?;

// 现在可以在线程之间共享
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

1. **使用一致的 ID**：为同一种类型在所有语言中使用相同的类型 ID，以实现跨语言兼容性
2. **启动线程前注册**：启动线程之前完成所有注册
3. **对 xlang 使用命名空间**：使类型名称在不同语言之间保持一致
4. **使用显式 ID 保持稳定性**：生产环境中应避免自动生成的 ID

## 相关主题

- [配置](configuration.md) - Fory 构建器选项
- [Xlang 序列化](xlang-serialization.md) - xlang 模式注册
- [自定义序列化器](custom-serializers.md) - 自定义序列化
- [外部类型序列化](external-types.md) - 第三方目标和根承载类型
