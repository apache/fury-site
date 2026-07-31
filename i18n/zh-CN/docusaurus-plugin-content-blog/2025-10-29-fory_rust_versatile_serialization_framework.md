---
slug: fory_rust_versatile_serialization_framework
title: "Apache Fory™ Rust：面向现代应用的灵活易用的高性能序列化框架"
authors: [chaokunyang]
tags: [fory, rust]
---

**TL;DR**：Apache Fory Rust 是一个速度极快的跨语言序列化框架，在提供**超高序列化性能**的同时，支持**共享与循环引用、trait 对象、Schema 演进、行格式访问和外部类型**。它以 Rust 的安全保证和编译期代码生成为基础，专为不愿在性能与开发体验之间妥协的开发者而设计。

- 🐙 GitHub: https://github.com/apache/fory
- 📦 Crate: https://crates.io/crates/fory

<img src="/img/fory-logo-light.png" width="50%"/>

---

## 序列化困境

每一位后端工程师都遇到过这样的时刻：应用需要序列化嵌套对象、循环引用、多态类型等复杂数据结构，却不得不在三种糟糕的方案中做出选择：

1. **快但脆弱**：手写二进制格式，一旦 Schema 变化就可能失效
2. **灵活但缓慢**：文本格式会带来显著的运行时开销
3. **复杂且受限**：现有方案无法支持语言中的高级特性

Apache Fory Rust 终结了这种非此即彼的选择。它在处理现代应用复杂性的同时提供出色性能：Rust 原生开发可直接派生 Schema；当团队需要跨语言生成类型时，也可以选择共享 IDL。

## Apache Fory Rust 有何不同？

### 1. **真正的跨语言互操作**

Apache Fory Rust 与 Java、Python、C++、Go、C#、Swift、Dart 等语言实现使用同一套二进制协议。只需在两端注册匹配的 Schema，就可以在 Rust 中序列化数据，再由另一种语言通过同一种紧凑二进制格式完成反序列化。

```rust
use fory::{Fory, ForyStruct};
use std::collections::HashMap;

#[derive(ForyStruct)]
struct User {
    name: String,
    age: i32,
    metadata: HashMap<String, String>,
}

let mut fory = Fory::builder().xlang(true).build();
fory.register::<User>(100)?;

let user = User {
    name: "Alice".to_string(),
    age: 30,
    metadata: HashMap::from([(
        "role".to_string(),
        "admin".to_string(),
    )]),
};
let bytes = fory.serialize(&user)?;
// 在另一种 Fory 运行时中注册匹配类型，然后反序列化 `bytes`。
```

这不只是使用方便，它还会改变我们构建多语言微服务架构的方式。数字 ID 能提供更紧凑的类型元信息，而稳定的注册名称则便于彼此独立的服务团队进行协调。

### 2. **自动处理共享与循环引用**

许多序列化框架遇到循环引用时会直接报错。Apache Fory 能自动跟踪并保留引用身份：

**共享引用**：

```rust
use fory::Fory;
use std::rc::Rc;

let fory = Fory::builder()
    .xlang(false)
    .track_ref(true)
    .build();

// 创建一个共享值
let shared = Rc::new(String::from("shared_value"));

// 多次引用同一个值
let data = vec![shared.clone(), shared.clone(), shared.clone()];

// 共享值只会被序列化一次
let bytes = fory.serialize(&data)?;
let decoded: Vec<Rc<String>> = fory.deserialize(&bytes)?;

// 验证引用身份得到保留
assert_eq!(decoded.len(), 3);
assert_eq!(*decoded[0], "shared_value");

// 三个 Rc 指针都指向同一个对象
assert!(Rc::ptr_eq(&decoded[0], &decoded[1]));
assert!(Rc::ptr_eq(&decoded[1], &decoded[2]));
```

**循环引用**：

```rust
use fory::{Fory, ForyStruct, RcWeak};
use std::{cell::RefCell, rc::Rc};

#[derive(ForyStruct)]
struct Node {
    value: i32,
    parent: RcWeak<RefCell<Node>>,     // 弱指针打破循环
    children: Vec<Rc<RefCell<Node>>>,  // 跟踪强引用
}

let mut fory = Fory::builder()
    .xlang(false)
    .track_ref(true)
    .build();
fory.register::<Node>(100)?;

// 构建包含循环引用的父子树
let parent = Rc::new(RefCell::new(Node { ... }));
let child = Rc::new(RefCell::new(Node {
    parent: RcWeak::from(&parent),  // 反向指向父节点
    ...
}));
parent.borrow_mut().children.push(child.clone());

// 序列化会自动处理循环
let bytes = fory.serialize(&parent)?;
let decoded: Rc<RefCell<Node>> = fory.deserialize(&bytes)?;

// 引用关系得到保留
let decoded_child = decoded.borrow().children[0].clone();
let decoded_parent = decoded_child.borrow().parent.upgrade().unwrap();
assert!(Rc::ptr_eq(&decoded, &decoded_parent));
```

这不仅是一项锦上添花的功能，更是图数据库、对象关系映射和复杂领域模型不可或缺的能力。

### 3. **Trait 对象序列化**

Rust 的 trait 系统提供了强大的抽象能力，但序列化 `Box<dyn Trait>` 一直十分棘手。Apache Fory 让这件事变得简单：

```rust
use fory::{register_trait_type, Fory, ForyObject, ForyStruct};

trait Animal: ForyObject {
    fn speak(&self) -> String;
}

#[derive(ForyStruct)]
struct Dog { name: String, breed: String }

impl Animal for Dog {
    fn speak(&self) -> String {
        "Woof!".to_string()
    }
}

#[derive(ForyStruct)]
struct Cat { name: String, color: String }

impl Animal for Cat {
    fn speak(&self) -> String {
        "Meow!".to_string()
    }
}

// 注册具体实现
register_trait_type!(Animal, Dog, Cat);

let mut fory = Fory::builder().xlang(false).build();
fory.register::<Dog>(100)?;
fory.register::<Cat>(101)?;

// 序列化异构集合
let animals: Vec<Box<dyn Animal>> = vec![
    Box::new(Dog { ... }),
    Box::new(Cat { ... }),
];

let bytes = fory.serialize(&animals)?;
let decoded: Vec<Box<dyn Animal>> = fory.deserialize(&bytes)?;

// 多态行为得到保留
decoded[0].speak();  // "Woof!"
decoded[1].speak();  // "Meow!"
```

**另一种选择：无需注册 trait，直接使用 `dyn Any`**：

```rust
use std::rc::Rc;
use std::any::Any;

// 无需定义或注册 trait
let dog: Rc<dyn Any> = Rc::new(Dog { name: "Rex".to_string(), breed: "Labrador".to_string() });
let cat: Rc<dyn Any> = Rc::new(Cat { name: "Whiskers".to_string(), color: "Orange".to_string() });

let bytes = fory.serialize(&dog)?;
let decoded: Rc<dyn Any> = fory.deserialize(&bytes)?;

// 向下转换为具体类型
let unwrapped = decoded.downcast_ref::<Dog>().unwrap();
assert_eq!(unwrapped.name, "Rex");
```

**支持范围**：

- `Box<dyn Trait>`：拥有所有权的 trait 对象
- `Rc<dyn Trait>` / `Arc<dyn Trait>`：引用计数的 trait 对象
- `Rc<dyn Any>` / `Arc<dyn Any + Send + Sync>`：无需应用 trait 的运行时类型派发
- 为 `Rc<dyn Trait>` 和 `Arc<dyn Trait>` 生成根序列化器

这为插件系统、异构集合和可扩展架构打开了新的可能，也让过去难以序列化的模型变得切实可用。

### 4. **不破坏兼容性的 Schema 演进**

微服务往往独立演进。Apache Fory 的**兼容模式**允许服务在无需同步协调的情况下调整 Schema：

```rust
use fory::{Fory, ForyStruct};
use std::collections::HashMap;

// 服务 A：版本 1
#[derive(ForyStruct)]
struct UserV1 {
    name: String,
    age: i32,
    address: String,
}

let mut fory_v1 = Fory::builder().xlang(false).build();
fory_v1.register::<UserV1>(1)?;

// 服务 B：独立演进后的版本 2
#[derive(ForyStruct)]
struct UserV2 {
    name: String,
    age: i32,
    // 删除 address
    phone: Option<String>,     // 新增字段
    metadata: HashMap<String, String>,  // 另一个新增字段
}

let mut fory_v2 = Fory::builder().xlang(false).build();
fory_v2.register::<UserV2>(1)?;

// 将 V1 数据反序列化为 V2 结构
let v1_bytes = fory_v1.serialize(&user_v1)?;
let user_v2: UserV2 = fory_v2.deserialize(&v1_bytes)?;
// 缺失字段会自动使用默认值
```

**兼容性规则**：

- ✅ 新增字段（应用默认值）
- ✅ 删除字段（反序列化时跳过）
- ✅ 调整字段顺序（按名称匹配）
- ✅ 改变可空性（`T` ↔ `Option<T>`）
- ✅ 在转换无损时调整部分标量字段类型
- ❌ 有损或不兼容的类型变更

这对于零停机部署和多语言微服务至关重要。

### 5. **外部类型序列化**

Rust 的孤儿规则通常不允许你为另一个 crate 所拥有的类型派生序列化 trait。Apache Fory 无需把包装对象引入应用模型，就能解决这一问题：

```rust
use fory::{Fory, ForyStruct};

#[derive(ForyStruct)]
#[fory(target = third_party::User)]
struct UserSerializer {
    name: String,
    age: u32,
}

let mut fory = Fory::builder().xlang(true).build();
fory.register::<UserSerializer>(100)?;

let user = third_party::User {
    name: "Alice".to_string(),
    age: 30,
};

let bytes = fory.serialize_with::<UserSerializer>(&user)?;
let decoded: third_party::User =
    fory.deserialize_with::<UserSerializer>(&bytes)?;
```

`UserSerializer` 是一项编译期 Schema 和代码生成声明，而不是运行时创建的镜像值。Fory 会直接读取 `third_party::User` 的字段，并直接重建该类型。字段可以通过 `#[fory(with = UserSerializer)]` 选择同一个序列化器，`VecSerializer<UserSerializer>` 等承载序列化器则能把这种能力扩展到集合根节点。

对于包含私有字段或需要维持不变量的不透明类型，可以改为实现 Fory 的 `Serializer` trait。这两条路径让第三方类型无需修改源代码或增加转换层，也能成为一等序列化对象。

## 技术基础

### 协议设计

Apache Fory 使用了一套兼顾性能与灵活性的二进制协议：

```
| fory header | reference meta | type meta | value data |
```

**关键创新**：

1. **高效编码**：可变长整数、紧凑类型 ID 和位打包标志
2. **引用跟踪**：自动去除共享对象的重复数据，只序列化一次，后续写入引用
3. **紧凑元信息**：高效编码并去除类型元信息中的重复内容
4. **小端序布局**：针对现代 CPU 架构优化

### 编译期代码生成

不同于基于反射的框架，Apache Fory 通过过程宏在编译期生成序列化代码：

```rust
use fory::ForyStruct;

#[derive(ForyStruct)]
struct Person {
    name: String,
    age: i32,
    address: Address,
}

// derive 宏会生成序列化器实现和 Schema 元数据。
```

**优势**：

- ⚡ **零运行时开销**：无需反射，也不需要虚表查找
- 🛡️ **类型安全**：在编译期发现错误，而不是在运行时 panic
- 📦 **更小的二进制体积**：只为实际使用的类型生成代码
- 🔍 **IDE 支持**：完整保留自动补全和错误检查能力

### 架构

Apache Fory Rust 由三个职责明确的 crate 组成：

```
fory/            # 公共 API 门面
  └─ 运行时与 derive 重导出

fory-core/       # 核心序列化引擎
  ├─ fory.rs         # 主入口
  ├─ buffer.rs       # 零拷贝二进制 I/O
  ├─ serializer/     # 特定类型的序列化器
  ├─ resolver/       # 类型注册与派发
  ├─ meta/           # 元字符串压缩
  ├─ types/          # Fory 内置类型
  └─ row/            # 行格式实现

fory-derive/     # 过程宏
  ├─ object/         # ForyStruct/ForyEnum/ForyUnion derive 宏
  └─ fory_row.rs     # ForyRow derive 宏
```

这种模块化设计实现了清晰的职责分离，也让代码库更易维护。

## 基准测试：真实场景下的性能

当前 Rust 基准测试套件覆盖了具有代表性的原始类型、集合、结构体和嵌套对象负载，同时测量序列化与反序列化吞吐量。测试在同一套已提交的基准框架下，对比 Apache Fory、Prost Protocol Buffers 和 MessagePack。

![Rust 序列化基准测试吞吐量](../../../docs/benchmarks/rust/throughput.png)

这张图展示了 Fory 为何适合性能敏感型系统：代码生成的序列化器、紧凑二进制布局和专门优化的集合路径，可以在不牺牲复杂 Rust 应用所需能力的前提下提供高吞吐量。完整的环境信息、负载定义、载荷大小和详细结果，请参阅[完整 Rust 基准测试报告](/docs/benchmarks/rust/)。

## 何时使用 Apache Fory Rust

### ✅ **理想使用场景**

1. **多语言团队构建的微服务**
   - 不同服务使用不同编程语言
   - 需要通过共享协议紧凑地交换数据
   - 独立部署之间需要 Schema 演进

2. **高性能数据管道**
   - 每秒处理数百万条记录
   - 内存受限的环境（使用行格式）
   - 需要选择性访问字段的分析负载

3. **复杂领域模型**
   - 循环引用（父子关系、图结构）
   - 多态类型（trait 对象、继承层次）
   - 包含共享引用的丰富对象图

4. **实时系统**
   - 对序列化延迟要求严格
   - 需要重复访问大型结构化数据集
   - 需要零拷贝的行格式字段访问

### ⚠️ **以下情况可考虑其他方案**

1. **需要人类可读的数据**：使用 JSON/YAML 便于调试
2. **需要长期存储格式**：数据湖场景可使用 Parquet
3. **数据非常简单**：对于基础类型，serde + bincode 更简单

## 五分钟快速上手

### 安装

在 `Cargo.toml` 中添加：

```toml
[dependencies]
fory = "1.5.0"
```

### 基础对象序列化

```rust
use fory::{Error, Fory, ForyStruct};

#[derive(ForyStruct, Debug, PartialEq)]
struct User {
    name: String,
    age: i32,
    email: String,
}

fn main() -> Result<(), Error> {
    let mut fory = Fory::builder().xlang(false).build();
    fory.register::<User>(1)?;  // 使用唯一 ID 注册
    let user = User {
        name: "Alice".to_string(),
        age: 30,
        email: "alice@example.com".to_string(),
    };
    // 序列化
    let bytes = fory.serialize(&user)?;
    // 反序列化
    let decoded: User = fory.deserialize(&bytes)?;
    assert_eq!(user, decoded);
    Ok(())
}
```

### 跨语言序列化

```rust
use fory::Fory;

// 启用跨语言模式
let mut fory = Fory::builder().xlang(true).build();

// 在每种语言中使用 ID 或名称注册同一个逻辑类型
fory.register::<User>(100)?;
// fory.register_by_name::<User>("example.User")?;

let bytes = fory.serialize(&user)?;
// 现在可以在 Java、Python、Go 等语言中反序列化这些数据
```

请在所有语言中使用**一致的 ID 或名称**注册类型：

- **按 ID 注册**（`fory.register::<User>(1)`）：序列化速度更快、编码更紧凑，但需要协调以避免 ID 冲突
- **按名称注册**（`fory.register_by_name::<User>("example.User")`）：更灵活、更不容易冲突，也更便于跨团队管理，但编码会稍大

## 支持的类型

Apache Fory Rust 支持完整而丰富的类型体系：

**原始类型**：`bool`、`i8`、`i16`、`i32`、`i64`、`f32`、`f64`、`String`

**集合**：`Vec<T>`、`VecDeque<T>`、`LinkedList<T>`、`HashMap<K,V>`、`BTreeMap<K,V>`、`HashSet<T>`、`BTreeSet<T>`、`BinaryHeap<T>`、`Option<T>`

**智能指针**：`Box<T>`、`Rc<T>`、`Arc<T>`、`RcWeak<T>`、`ArcWeak<T>`、`RefCell<T>`、`Mutex<T>`

**日期/时间**：`Date`、`Timestamp`、`Duration` 以及受支持的 `chrono` 类型

**自定义类型**：为对象图派生 `ForyStruct`、`ForyEnum` 或 `ForyUnion`，为行格式派生 `ForyRow`

**Trait 对象**：`Box<dyn T>`、`Rc<dyn T>`、`Arc<dyn T>`、`Rc<dyn Any>`、`Arc<dyn Any + Send + Sync>`

## 生产环境注意事项

### 线程安全

完成注册后，`Fory` 就可以安全地在线程之间共享。所有类型注册完成后（注册需要 `&mut Fory`），将实例包装在 `Arc` 中，即可由多个工作线程并发执行序列化和反序列化。

```rust
use fory::Fory;
use std::{sync::Arc, thread};

let mut fory = Fory::builder().xlang(false).build();
fory.register::<Item>(1)?;
let fory = Arc::new(fory); // 注册完成后，`Fory` 实现了 Send + Sync

let item = Item::default();
let handles: Vec<_> = (0..4)
    .map(|_| {
        let fory = Arc::clone(&fory);
        let input = item.clone();
        thread::spawn(move || {
            let bytes = fory.serialize(&input).expect("serialization succeeds");
            let decoded: Item = fory.deserialize(&bytes).expect("valid data");
            (bytes, decoded)
        })
    })
    .collect();

for handle in handles {
    let (bytes, decoded) = handle.join().expect("thread finished");
    // 使用 `bytes` / `decoded`
}
```

### 错误处理

Apache Fory 的所有可失败操作都使用 `Result<T, Error>`：

```rust
match fory.deserialize::<User>(&bytes) {
    Ok(user) => process_user(user),
    Err(e) => log::error!("Deserialization failed: {}", e),
}
```

## 文档

- Apache Fory Rust 指南：[📖 查看](https://fory.apache.org/docs/guide/rust/)
- Apache Fory 外部类型序列化：[📖 查看](https://fory.apache.org/docs/guide/rust/external_types)
- Apache Fory Rust 基准测试：[📊 查看](https://fory.apache.org/docs/benchmarks/rust/)
- Apache Fory Rust API 文档：[📖 查看](https://docs.rs/fory/latest/fory/)
- Apache Fory 跨语言序列化规范：[📖 查看](https://fory.apache.org/docs/specification/fory_xlang_serialization_spec/)

## 社区与贡献

Apache Fory 是一个 **Apache 软件基金会**项目，拥有活跃且不断成长的社区：

- **GitHub**：[apache/fory](https://github.com/apache/fory)
- **文档**：[fory.apache.org](https://fory.apache.org)
- **Slack**：[加入社区](https://join.slack.com/t/fory-project/shared_invite/zt-1u8soj4qc-ieYEu7ciHOqA2mo47llS8A)
- **Issue Tracker**：[GitHub Issues](https://github.com/apache/fory/issues)

### 如何贡献

我们欢迎各种形式的贡献：

1. **代码**：实现新功能并改进现有能力
2. **文档**：编写教程、示例和指南
3. **测试**：添加基准测试、模糊测试和集成测试
4. **反馈**：报告 Bug、提出功能需求或分享使用场景

贡献指南请参阅 [CONTRIBUTING.md](https://github.com/apache/fory/blob/main/CONTRIBUTING.md)。

### 许可证

Apache Fory 采用 **Apache License 2.0**，这是一项允许商业使用、修改和分发的宽松开源许可证。

## 结语

Apache Fory Rust 为序列化带来了一次范式转变：

- **不再权衡取舍**：同时获得性能与灵活性
- **不再编写样板代码**：derive 宏负责处理复杂细节
- **不再增加转换层**：外部类型序列化器直接处理第三方类型值

无论你正在构建微服务、数据管道还是实时系统，Apache Fory Rust 都能以出色的易用性提供所需性能。

**立即体验**：

```bash
cargo add fory
```

**加入社区**：

```bash
git clone https://github.com/apache/fory.git
cd fory/rust
cargo test --features tests
```

**分享你的经验**：

- 撰写博客介绍你的使用场景
- 在本地 Rust Meetup 上进行分享
- 提交来自你所在领域的基准测试
