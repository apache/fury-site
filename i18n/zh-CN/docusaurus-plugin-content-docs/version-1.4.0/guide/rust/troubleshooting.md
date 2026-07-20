---
title: 故障排除
sidebar_position: 10
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

本页涵盖 Apache Fory™ Rust 的常见问题和调试技术。

## 常见问题

### 类型注册表错误

**错误**：`TypeId ... not found in type_info registry`

**原因**：该类型从未在当前 `Fory` 实例中注册。

**解决方案**：在序列化之前注册类型：

```rust
let mut fory = Fory::default();
fory.register::<MyStruct>(100)?;  // 使用前注册
```

确认：

- 每个可序列化的结构体或 trait 实现都调用 `fory.register::<T>(type_id)`
- 在反序列化端重用相同的 ID

### 类型不匹配错误

**原因**：字段类型不兼容或 schema 已更改。

**解决方案**：

- 启用 compatible 模式以支持 schema 演化
- 确保跨版本字段类型匹配

```rust
let fory = Fory::default().compatible(true);
```

## 调试技术

### 启用错误时 Panic 以获取回溯

在 `RUST_BACKTRACE=1` 旁边切换 `FORY_PANIC_ON_ERROR=1`，在构造错误的确切位置 panic：

```bash
RUST_BACKTRACE=1 FORY_PANIC_ON_ERROR=1 cargo test --features tests
```

之后重置该变量以避免中止面向用户的代码路径。

### 结构体字段跟踪

在 `#[derive(ForyObject)]` 旁边添加 `#[fory(debug)]` 属性以发出钩子调用：

```rust
#[derive(ForyObject)]
#[fory(debug)]
struct MyStruct {
    field1: i32,
    field2: String,
}
```

使用调试钩子编译后，调用这些函数以插入自定义回调：

- `set_before_write_field_func`
- `set_after_write_field_func`
- `set_before_read_field_func`
- `set_after_read_field_func`

当你想要恢复默认值时，使用 `reset_struct_debug_hooks()`。

### 轻量级日志

在没有自定义钩子的情况下，启用 `ENABLE_FORY_DEBUG_OUTPUT=1` 以打印字段级读/写事件：

```bash
ENABLE_FORY_DEBUG_OUTPUT=1 cargo test --features tests
```

这在调查对齐或游标不匹配时特别有用。

### 检查生成的代码

使用 `cargo expand` 检查 Fory derive 宏生成的代码：

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

## 测试时的卫生

一些集成测试期望 `FORY_PANIC_ON_ERROR` 保持未设置状态。仅在集中调试会话时导出它：

```bash
# 仅用于特定调试
FORY_PANIC_ON_ERROR=1 cargo test -p tests --test specific_test -- --nocapture

# 正常测试运行（不在错误时 panic）
cargo test --features tests
```

## 错误处理最佳实践

优先使用 `fory_core::error::Error` 上的静态构造函数：

- `Error::type_mismatch`
- `Error::invalid_data`
- `Error::unknown`

这样可以保持诊断的一致性，并使选择性 panic 正确工作。

## 快速参考

| 环境变量                     | 目的                    |
| ---------------------------- | ----------------------- |
| `RUST_BACKTRACE=1`           | 启用堆栈跟踪            |
| `FORY_PANIC_ON_ERROR=1`      | 在错误位置 panic 以调试 |
| `ENABLE_FORY_DEBUG_OUTPUT=1` | 打印字段级读/写事件     |

## 相关主题

- [配置](configuration.md) - Fory 选项
- [类型注册](type-registration.md) - 注册最佳实践
- [Schema 演化](schema-evolution.md) - Compatible 模式
