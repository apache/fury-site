---
title: Rust 设置
sidebar_position: 5
id: rust
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

Fory Rust 提供 xlang 和 native 对象序列化、标准 Row Format、生成的模型以及 Fory gRPC。公开的 `fory` crate 发布在 crates.io，支持 Rust 1.70 及更高版本，并使用 Rust 2021 edition。

## 验证工具链

```bash
rustc --version
cargo --version
```

## 对象序列化

添加公开 crate：

```toml title="Cargo.toml"
[dependencies]
fory = "1.5.0"
```

```rust
use fory::{Error, Fory, ForyStruct};

#[derive(ForyStruct, Debug, PartialEq)]
struct User {
    id: i64,
    name: String,
}

fn main() -> Result<(), Error> {
    let mut fory = Fory::builder().xlang(true).build();
    fory.register::<User>(1)?;

    let user = User {
        id: 1,
        name: "Alice".to_string(),
    };
    let bytes = fory.serialize(&user)?;
    let decoded: User = fory.deserialize(&bytes)?;
    assert_eq!(user, decoded);
    Ok(())
}
```

跨语言数据请使用 [xlang 模式](../object-serialization/rust/basic-serialization.md#cross-language-interoperability)，仅供 Rust 使用的数据请使用 [native 模式](../object-serialization/rust/native.md)。接下来可阅读 [Rust 对象序列化](../object-serialization/rust/index.md)、[配置](../object-serialization/rust/configuration.md)和[类型注册](../object-serialization/rust/type-registration.md)。

## 其他能力

- **Row Format** 使用标准 Fory Row 布局，为可信分析数据提供零拷贝视图。请参阅 [Rust Row Format](../row-format/rust.md)。
- **Fory IDL 与编译器** 生成 Rust 模型和注册辅助代码。请参阅[编译器快速入门](../compiler/getting-started.md)和 [Rust 生成代码指南](../compiler/generated-code/rust.md)。
- **Fory gRPC** 通过 tonic 传输使用 Fory 编码的消息。请参阅 [Rust gRPC](../grpc/rust.md)。
