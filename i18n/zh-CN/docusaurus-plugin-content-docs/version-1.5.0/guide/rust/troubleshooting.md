---
title: 故障排查
sidebar_position: 13
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

本页介绍 Apache Fory™ Rust 的常见问题和调试技巧。

## 常见问题

### 类型注册表错误

**错误**：`TypeId ... not found in type_info registry`

**原因**：该类型从未在当前 `Fory` 实例中注册。

**解决方案**：在序列化之前注册类型：

```rust
let mut fory = Fory::default();
fory.register::<MyStruct>(100)?;  // 使用前注册
```

请确认：

- 每个动态具体目标都通过与之匹配的结构化序列化器、联合类型序列化器或自定义序列化器 API 注册。
- 反序列化端复用了相同的 ID 或名称映射。

使用外部类型序列化时，应注册所选的外部结构化序列化器或自定义序列化器，而不是其第三方目标类型：

```rust
fory.register::<UserSerializer>(100)?;
```

不要注册 `VecSerializer<UserSerializer>` 或其他承载序列化器。请注册 `UserSerializer`，然后在字段上使用递归的 `list`、`map` 或 `tuple` 注解，或者在根值上选择承载序列化器。

### 类型不匹配错误

**原因**：字段类型不兼容或 Schema 已变更。

**解决方案**：

- 保持兼容模式启用，以支持 Schema 演进
- 确保跨版本字段类型匹配

```rust
// 从通信双方移除所有 compatible(false) 覆盖。
let fory = Fory::builder()
    // 现有选项
    .build();
```

### 外部类型序列化选择错误

如果派生宏报告 `with` 的目标类型错误，请确认所选序列化器声明了完全匹配的字段目标类型：

```rust
impl Serializer for UserSerializer {
    type Target = third_party::User;
    // ...
}
```

对于透明 holder，请选择目标类型与字段类型完全匹配的承载序列化器：

```rust
#[fory(with = OptionSerializer<UserSerializer>)]
user: Option<third_party::User>
```

对于完全匹配的容器字段，也可以使用承载序列化器：

```rust
#[fory(with = VecSerializer<UserSerializer>)]
users: Vec<third_party::User>
```

当选择元素、map 子节点或 tuple 位置时，请使用递归集合语法：

```rust
#[fory(list(element(with = UserSerializer)))]
users: Vec<third_party::User>
```

如果注册只在 xlang 模式下失败，请检查外部结构化序列化器是否包含带多个字段的 Rust native 枚举变体。这种结构没有对应的 xlang `UNION` 表示；请使用 native 模式，或修改共享 Schema。

## 调试技巧

### 在错误处 Panic 以获取回溯

将 `FORY_PANIC_ON_ERROR=1` 与 `RUST_BACKTRACE=1` 一起启用，使程序在错误构造的确切位置 panic：

```bash
RUST_BACKTRACE=1 FORY_PANIC_ON_ERROR=1 cargo test --features tests
```

完成后重置该变量，以免面向用户的代码路径中止。

### 跟踪结构体字段

在 `#[derive(ForyStruct)]` 旁添加 `#[fory(debug)]` 属性，以发出 hook 调用：

```rust
#[derive(ForyStruct)]
#[fory(debug)]
struct MyStruct {
    field1: i32,
    field2: String,
}
```

使用调试 hook 编译后，调用以下函数接入自定义回调：

- `set_before_write_field_func`
- `set_after_write_field_func`
- `set_before_read_field_func`
- `set_after_read_field_func`

需要恢复默认值时，请使用 `reset_struct_debug_hooks()`。

### 轻量级日志

不使用自定义 hook 时，可以启用 `ENABLE_FORY_DEBUG_OUTPUT=1` 来打印字段级读写事件：

```bash
ENABLE_FORY_DEBUG_OUTPUT=1 cargo test --features tests
```

这对于排查对齐或游标不匹配尤其有用。

### 检查生成的代码

使用 `cargo expand` 检查 Fory 派生宏生成的代码：

```bash
cargo expand --test mod $mod$::$file$ > expanded.rs
```

## 运行测试

### 运行所有测试

```bash
cargo test --features tests
```

### 运行指定测试

```bash
cargo test -p tests --test $test_file $test_method
```

### 在调试模式下运行测试

```bash
RUST_BACKTRACE=1 FORY_PANIC_ON_ERROR=1 ENABLE_FORY_DEBUG_OUTPUT=1 \
  cargo test --test mod $dir$::$test_file::$test_method -- --nocapture
```

## 测试环境注意事项

部分集成测试要求 `FORY_PANIC_ON_ERROR` 保持未设置状态。仅在针对性调试会话中设置该变量：

```bash
# 仅用于指定的调试任务
FORY_PANIC_ON_ERROR=1 cargo test -p tests --test specific_test -- --nocapture

# 正常运行测试（不在错误处 panic）
cargo test --features tests
```

## 错误处理最佳实践

优先使用 facade `Error` 类型上的静态构造函数：

- `Error::type_mismatch`
- `Error::invalid_data`
- `Error::unknown`

这样可以保持诊断一致，并确保按需启用的 panic 正常工作。

## 快速参考

| 环境变量                     | 用途                       |
| ---------------------------- | -------------------------- |
| `RUST_BACKTRACE=1`           | 启用堆栈跟踪               |
| `FORY_PANIC_ON_ERROR=1`      | 在错误位置 panic 以便调试  |
| `ENABLE_FORY_DEBUG_OUTPUT=1` | 打印字段级读写事件         |

## 相关主题

- [配置](configuration.md) - Fory 选项
- [类型注册](type-registration.md) - 注册最佳实践
- [Schema 演进](schema-evolution.md) - 兼容模式
- [外部类型序列化](external-types.md) - 字段和根值序列化器选择
