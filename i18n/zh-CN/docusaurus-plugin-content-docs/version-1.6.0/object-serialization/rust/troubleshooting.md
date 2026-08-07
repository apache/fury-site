---
title: 故障排查
sidebar_position: 90
id: troubleshooting
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

本文介绍 Apache Fory™ Rust 的常见问题和调试技巧。

## 常见问题

### 类型注册表错误

**错误**：`TypeId ... not found in type_info registry`

**原因**：类型从未向当前 `Fory` 实例注册。

**解决方案**：在序列化前注册类型：

```rust
let mut fory = Fory::default();
fory.register::<MyStruct>(100)?;  // Register before use
```

请确认：

- 每个具体动态目标都通过匹配的结构化、联合或自定义序列化器 API 注册。
- 反序列化端复用相同的 ID 或名称映射。

对于外部类型序列化，请注册选定的外部结构化序列化器或自定义序列化器，而不是第三方目标：

```rust
fory.register::<UserSerializer>(100)?;
```

不要注册 `VecSerializer<UserSerializer>` 或其他载体序列化器。应注册 `UserSerializer`，然后在字段上使用递归 `list`、`map` 或 `tuple` 注解，或在根上选择载体序列化器。

### 类型不匹配错误

**原因**：字段类型不兼容或 Schema 已更改。

**解决方案**：

- 为 Schema 演进保持启用兼容模式
- 确保字段类型在版本之间匹配

```rust
// Remove any compatible(false) override from the peers.
let fory = Fory::builder()
    // existing options
    .build();
```

### 外部类型序列化选择错误

如果派生报告 `with` 面向错误类型，请验证所选序列化器声明了确切字段目标：

```rust
impl Serializer for UserSerializer {
    type Target = third_party::User;
    // ...
}
```

对于透明持有者，请选择目标为确切字段类型的载体序列化器：

```rust
#[fory(with = OptionSerializer<UserSerializer>)]
user: Option<third_party::User>
```

对于确切容器字段，载体序列化器也有效：

```rust
#[fory(with = VecSerializer<UserSerializer>)]
users: Vec<third_party::User>
```

选择元素、映射子节点或元组位置时，请使用递归集合语法：

```rust
#[fory(list(element(with = UserSerializer)))]
users: Vec<third_party::User>
```

如果注册仅在跨语言模式中失败，请检查外部结构化序列化器是否包含带多个字段的原生 Rust 枚举变体。该形态没有跨语言 UNION 表示；请使用原生模式或更改共享 Schema。

## 调试技巧

### 为回溯启用遇错 panic

同时启用 `FORY_PANIC_ON_ERROR=1` 和 `RUST_BACKTRACE=1`，以在构造错误的确切位置触发 panic：

```bash
RUST_BACKTRACE=1 FORY_PANIC_ON_ERROR=1 cargo test --features tests
```

之后请重置该变量，以免中止面向用户的代码路径。

### 结构体字段跟踪

添加 `#[fory(debug)]` 属性，并与 `#[derive(ForyStruct)]` 一起使用，以生成钩子调用：

```rust
#[derive(ForyStruct)]
#[fory(debug)]
struct MyStruct {
    field1: i32,
    field2: String,
}
```

使用调试钩子编译后，可调用以下函数接入自定义回调：

- `set_before_write_field_func`
- `set_after_write_field_func`
- `set_before_read_field_func`
- `set_after_read_field_func`

需要恢复默认设置时使用 `reset_struct_debug_hooks()`。

### 轻量日志

不使用自定义钩子时，启用 `ENABLE_FORY_DEBUG_OUTPUT=1` 打印字段级读写事件：

```bash
ENABLE_FORY_DEBUG_OUTPUT=1 cargo test --features tests
```

这对于排查对齐或游标不匹配尤其有用。

### 检查生成代码

使用 `cargo expand` 检查 Fory 派生宏生成的代码：

```bash
cargo expand --test mod $mod$::$file$ > expanded.rs
```

## 运行测试

### 运行所有测试

```bash
cargo test --features tests
```

### 运行特定测试

```bash
cargo test -p tests --test $test_file $test_method
```

### 使用调试运行测试

```bash
RUST_BACKTRACE=1 FORY_PANIC_ON_ERROR=1 ENABLE_FORY_DEBUG_OUTPUT=1 \
  cargo test --test mod $dir$::$test_file::$test_method -- --nocapture
```

## 测试期间注意事项

某些集成测试要求不设置 `FORY_PANIC_ON_ERROR`。仅在针对性调试会话中导出该变量：

```bash
# For specific debugging only
FORY_PANIC_ON_ERROR=1 cargo test -p tests --test specific_test -- --nocapture

# Normal test run (without panic on error)
cargo test --features tests
```

## 错误处理最佳实践

优先使用门面 `Error` 类型上的静态构造函数：

- `Error::type_mismatch`
- `Error::invalid_data`
- `Error::unknown`

这样可以保持诊断一致，并让选择启用的 panic 正常工作。

## 快速参考

| 环境变量                     | 用途                          |
| ---------------------------- | ----------------------------- |
| `RUST_BACKTRACE=1`           | 启用堆栈跟踪                  |
| `FORY_PANIC_ON_ERROR=1`      | 在错误位置触发 panic 以便调试 |
| `ENABLE_FORY_DEBUG_OUTPUT=1` | 打印字段级读写事件            |

## 相关主题

- [配置](configuration.md) - Fory 选项
- [类型注册](type-registration.md) - 注册最佳实践
- [Schema 演进](schema-evolution.md) - 兼容模式
- [外部类型序列化](external-types.md) - 字段和根值序列化器选择
