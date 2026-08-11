---
slug: fory_schema_idl_for_object_graph
title: "Apache Fory™ Schema IDL：面向对象图序列化的 IDL，支持原生类型、多态、共享引用"
description: "Fory Schema IDL 可生成符合各语言习惯的跨语言模型，并原生支持共享引用、循环、多态和 Schema 演进。"
authors: [chaokunyang]
tags: [fory, idl, schema, serialization, cross-language, codegen]
---

**TL;DR**：Apache Fory Schema IDL 是首个面向**对象图序列化**的跨语言 IDL。你只需在 `.fdl` 文件中定义一次类型，编译器就能为 **Java、Python、Go、Rust、C++、C#、Swift 等语言**生成符合各语言习惯的领域对象，并在 Schema 模型中原生支持共享引用、循环、多态、Schema 演进和可选类型。

- GitHub: https://github.com/apache/fory
- 文档: https://fory.apache.org/docs/compiler
- 安装: `pip install fory-compiler`

<img src="/img/fory-logo-light.png" width="50%"/>

---

## 对象图语义的长期缺口

现有大多数序列化 IDL 都把数据建模成值树：消息是扁平的，Schema 层面没有共享身份、循环关系或可复用独立多态类型的概念。当真实数据本质上是图结构时，这个缺口通常会集中暴露在三个地方：

1. **共享引用与循环引用**：如果两个字段指向同一个逻辑对象，Protocol Buffers 和 FlatBuffers 不会在 Schema 或编码格式中保留这种共享身份。父指针、DAG 和循环都没有 Schema 级表达方式，最后只能退化成手工 ID 字段和应用侧重建逻辑。

2. **多态**：Protobuf 的 `oneof` 和 FlatBuffers 的 `union` 都是嵌在外层消息中的内联备选项，不是可复用的独立 Schema 类型。Protobuf 的 `Any` 虽然支持开放式多态，但仅限消息类型，而且通过 type URL 来表达。FlatBuffers 没有对应能力。

3. **生成类型能否直接作为领域模型**：FlatBuffers API 主要是面向 buffer 访问的包装器。Protobuf 在许多语言里生成的也是偏传输模型优先的类型，所以用户通常还要再加一层转换，才能回到符合语言习惯的领域对象。Schema 定义了编码格式，但没有真正定义应用模型。

Apache Fory Schema IDL 正是在补上这块空白。

---

## Apache Fory Schema IDL 不同在哪里？

Apache Fory Schema IDL 从一开始就把对象图当成一等公民。你只需定义一次类型，包括共享引用、循环结构、独立 `union` 和多态字段，运行编译器后，就能在所有已支持语言上得到建立在同一 Fory 编码格式之上的原生代码。

在本文里，“面向对象图的序列化 IDL”指的是：Schema 本身就能直接描述共享身份、循环和可复用的多态类型，而不是强迫用户先把一切压平成值树，再通过手工 ID 或应用层约定把关联关系补回来。

这一点主要体现在三个方面：

- `ref` 让共享引用和循环引用成为 Schema 契约的一部分。
- `union` 和 `any` 让多态成为可复用的 Schema 能力，而不只是内联的传输细节。
- 生成代码可以直接作为宿主语言的应用模型使用，而不是还要再包一层转换器的包装类型。

下面分节看这些能力在实际里是怎么工作的。

### 原生支持的共享引用

Fory IDL 提供 `ref` 修饰符，让共享引用和循环引用在 Schema 中显式可见：

```protobuf
message TreeNode {
    string value = 1;
    ref TreeNode parent = 2;          // 共享引用，可回指父节点
    list<ref TreeNode> children = 3;  // 每个子节点都启用引用跟踪
}
```

当你序列化一棵“子节点会回指父节点”的树时，Fory 会只编码一次每个对象，对重复出现的对象使用回溯引用。无需手工维护 ID 链接字段，也无需在应用层额外重建对象图。对象图契约直接由 Schema 表达。

对于需要打破所有权循环的父指针，`ref(weak=true)` 会生成弱指针类型，例如 Rust 中的 `ArcWeak<Node>`、C++ 中的 `std::weak_ptr`。

### 生成的是领域对象，不是包装器

Fory `.fdl` Schema 编译后的一个关键差异，是生成的宿主语言模型可以直接使用，而不是像 Protocol Buffers 或 FlatBuffers 那样更偏底层包装：

- **Java**：带 `@ForyField` 注解的普通 POJO，可直接用于 Spring、Hibernate 等框架
- **Python**：带标准类型标注的 `@dataclass`
- **Go**：带 `fory:"id=..."` struct tag 的结构体
- **Rust**：带 `#[derive(ForyObject)]` 的结构体
- **C++**：带 `FORY_STRUCT` 宏的 `final` 类，零运行时反射
- **C#**：带 `[ForyObject]` 特性的类
- **Swift**：带 `@ForyObject` 和 `@ForyField` 元数据的模型

在很多应用里，你根本不需要再写一层适配层。生成类型本身就可以直接成为领域对象。

### 内建 `union`（和类型）

Fory IDL 提供一等公民的 `union` 结构，并把它映射为各语言最符合习惯的和类型表达：

```protobuf
message Dog {
    string name = 1;
    int32 bark_volume = 2;
}

message Cat {
    string name = 1;
    int32 lives = 2;
}

union Animal {
    Dog dog = 1;
    Cat cat = 2;
}
```

这会生成：

- **Rust**：`enum Animal { Dog(Dog), Cat(Cat) }`
- **C++**：基于 `std::variant` 的包装器，提供 `is_dog()`、`as_dog()`、`visit()` API
- **Swift**：带关联值的带标签枚举
- **Java**：带类型化 case 访问器的 `Union` 子类
- **Python**：带 `is_dog()` / `dog_value()` 辅助方法的 `Union` 子类
- **Go**：带 `AsDog()` / visitor 模式的类型化 case 结构
- **C#**：带 `IsDog` / `DogValue()` 辅助方法的 `Union` 子类

所有语言共享同一组语义，但呈现方式都遵循各自语言的习惯。

### 用 `any` 表达多态字段

有些时候，你在定义 Schema 时并不知道字段的具体类型。比如事件总线要承载异构载荷，或者插件系统要接收用户自定义消息类型。Fory IDL 的 `any` 正是为此设计的，它会把运行时类型身份写入二进制流，并在另一端解析出来：

```protobuf
message Envelope {
    string event_type = 1;
    any payload = 2;          // 可承载 Fory 支持的动态值
}
```

在运行时，`payload` 可以持有 Fory 支持的动态值，包括其他生成消息、内建标量类型和集合类型。序列化后的字节会包含运行时类型元信息，因此反序列化器可以在另一端恢复出具体值：

| 语言 | 生成字段类型 |
| ---- | ------------ |
| Java | `Object payload` |
| Python | `payload: Any` |
| Go | `Payload any` |
| Rust | `payload: Box<dyn Any>` |
| C++ | `std::any payload` |
| C# | `object Payload` |
| Swift | `var payload: Any` |

这提供了类似 Protobuf `Any` 的灵活性，但直接体现在 Fory 生成模型里，而且不要求在 Schema 表面引入 Protobuf 风格的 type URL。

上面这三项能力，也就是 `ref`、`union` / `any` 和原生生成代码，让 Fory IDL 成为真正面向对象图的 Schema 语言。Schema 演进是另一回事，但它补齐了生产环境最关键的最后一环：

### 开箱即用的 Schema 演进

可以加字段，可以删字段，可以独立发布。在兼容模式下，字段按 field id 匹配，缺失字段使用默认值，未知字段会被跳过：

```protobuf
// 版本 1：已经部署到生产
message User {
    string name = 1;
    int32 age = 2;
}

// 版本 2：另一团队新增字段
message User {
    string name = 1;
    int32 age = 2;
    optional string email = 3;  // 新增字段，V1 消费者可安全忽略
}
```

这依然要遵守兼容性规则，并不是允许你任意修改 Schema。但对于常见的新增字段和删除字段场景，你不需要协调一次大爆炸式发布，也不需要再加一层版本协商机制。

---

## 完整示例

下面我们用一个更贴近真实业务的电商 Schema，看看它如何在当前 Fory 已支持的语言里工作，再用“共享客户对象往返序列化”把对象图能力直观展示出来。

### 1. 定义 Schema

创建 `ecommerce.fdl`：

```protobuf
package ecommerce;

enum OrderStatus {
    PENDING = 0;
    CONFIRMED = 1;
    SHIPPED = 2;
    DELIVERED = 3;
}

message Address {
    string street = 1;
    string city = 2;
    string country = 3;
}

message Customer {
    string id = 1;
    string name = 2;
    optional string email = 3;
    optional Address address = 4;
}

message OrderItem {
    string sku = 1;
    int32 quantity = 2;
    float64 unit_price = 3;
}

message Order {
    string order_id = 1;
    ref Customer customer = 2;
    list<OrderItem> items = 3;
    OrderStatus status = 4;
    float64 total = 5;
    optional string notes = 6;
    timestamp created_at = 7;
}

message OrderBatch {
    list<Order> orders = 1;
}
```

### 2. 安装编译器并生成代码

```bash
pip install fory-compiler

# 一条命令为当前 Fory IDL 支持的全部语言生成代码
foryc ecommerce.fdl \
  --java_out=./java/src/main/java \
  --python_out=./python/gen \
  --go_out=./go/gen \
  --rust_out=./rust/gen \
  --cpp_out=./cpp/gen \
  --csharp_out=./csharp/gen \
  --swift_out=./swift/gen
```

一条命令即可同时生成多种语言的代码。注册辅助方法、字节辅助方法和 type ID 都会自动生成。

### 3. 使用生成代码

**Java** - 序列化订单：

```java
import ecommerce.*;

Order order = new Order();
order.setOrderId("ORD-2026-001");

Customer customer = new Customer();
customer.setName("Alice");
customer.setEmail("alice@example.com");
order.setCustomer(customer);

order.setStatus(OrderStatus.CONFIRMED);
order.setTotal(259.98);

// 自动生成 toBytes() / fromBytes()，无需手写 Fory 样板代码
byte[] bytes = order.toBytes();
Order restored = Order.fromBytes(bytes);
```

**Python** - 反序列化同一份字节：

```python
from ecommerce import Order

# from_bytes() 会处理注册与反序列化
order = Order.from_bytes(bytes_from_java)
print(f"{order.order_id}: {order.customer.name} - ${order.total}")
# ORD-2026-001: Alice - $259.98
```

**Go** - 处理订单：

```go
import "gen/ecommerce"

var order ecommerce.Order
if err := order.FromBytes(bytesFromJava); err != nil {
    panic(err)
}
fmt.Printf("%s: %s - $%.2f\n", order.OrderId, order.Customer.Name, order.Total)
```

**Rust** - 类型安全反序列化：

```rust
use gen::ecommerce::Order;

let order = Order::from_bytes(&bytes_from_java)?;
println!("{}: {} - ${:.2}", order.order_id, order.customer.name, order.total);
```

**C++** - 零额外开销访问：

```cpp
#include "gen/ecommerce.h"

auto order = ecommerce::Order::from_bytes(bytes_from_java).value();
std::cout << order.order_id() << ": " << order.customer().name()
          << " - $" << order.total() << std::endl;
```

**C#** - 强类型反序列化：

```csharp
using Ecommerce;

var order = Order.FromBytes(bytesFromJava);
Console.WriteLine($"{order.OrderId}: {order.Customer.Name} - ${order.Total}");
```

**Swift** - 符合语言习惯的模型访问：

```swift
import Ecommerce

let order = try Order.fromBytes(bytesFromJava)
print("\(order.orderId): \(order.customer.name) - $\(order.total)")
```

同一份 Schema 和生成代码可以在所有已支持语言之间产出兼容字节，全程无需手写转换层。

### 4. 保留共享身份，而不只是值

因为 `Order.customer` 声明为 `ref Customer`，共享身份本身就成为 Schema 契约的一部分：

```java
Customer customer = new Customer();
customer.setName("Alice");

Order first = new Order();
first.setOrderId("ORD-1");
first.setCustomer(customer);

Order second = new Order();
second.setOrderId("ORD-2");
second.setCustomer(customer);

OrderBatch batch = new OrderBatch();
batch.setOrders(java.util.Arrays.asList(first, second));

OrderBatch restored = OrderBatch.fromBytes(batch.toBytes());
assert restored.getOrders().get(0).getCustomer()
    == restored.getOrders().get(1).getCustomer();
```

如果换成值树式序列化器，这种共享身份通常要靠你自己重建。而在 Fory IDL 里，`ref` 直接让它成为 Schema 和生成代码的一部分。

---

## 完整能力一览

### 用 `optional` 表达可空字段

```protobuf
message Profile {
    string username = 1;          // 非可选
    optional string bio = 2;     // 可空
    optional Address home = 3;   // 可空结构体
}
```

| 语言 | 非可选 | 可选 |
| ---- | ------ | ---- |
| Java | `String username` | `String bio`（可为 `null`） |
| Python | `username: str` | `bio: Optional[str]` |
| Go | `Username string` | `Bio *string` |
| Rust | `username: String` | `bio: Option<String>` |
| C++ | `std::string` | `std::optional<std::string>` |
| C# | `string Username` | `string? Bio` |
| Swift | `var username: String` | `var bio: String?` |

### 嵌套类型

```protobuf
message SearchResponse {
    message Result {
        string url = 1;
        string title = 2;
        list<string> snippets = 3;
    }
    list<Result> results = 1;
}
```

嵌套类型会按各语言习惯自然呈现：Java、Python、C#、Swift 中是 `SearchResponse.Result`，C++ 中是 `SearchResponse::Result`，Rust 中是 `search_response::Result`，Go 中是 `SearchResponse_Result`。

### 多文件 Schema 的导入

```protobuf
// common/types.fdl
package common;
message Address {
    string street = 1;
    string city = 2;
}

// models/user.fdl
package models;
import "common/types.fdl";

message User {
    string name = 1;
    Address home = 2;  // 使用导入类型
}
```

```bash
foryc models/user.fdl -I common/ --java_out=./gen
```

编译器会解析导入关系、检查导入循环，并确保导入 Schema 之间的生成类型注册保持一致。

### 语言专属选项

你可以按语言覆盖输出路径和命名约定，同时不影响跨语言兼容性：

```protobuf
package payment;
option java_package = "com.mycorp.payment.v1";
option go_package = "github.com/mycorp/gen/payment;paymentv1";
option csharp_namespace = "MyCorp.Payment.V1";
```

这些选项控制的是代码生成到哪里、以及宿主语言命名如何组织，不会改变底层 Fory 编码格式，也不会改变跨语言类型身份。

### 完整类型系统

Fory IDL 覆盖了生产级 Schema 所需的完整类型范围：

| 类别 | 类型 |
| ---- | ---- |
| 整数 | `int8`, `int16`, `int32`, `int64`, `uint8`-`uint64`, `fixed_*`, `tagged_*` |
| 浮点 | `float32`, `float64` |
| 字符串 | `string`, `bytes` |
| 时间 | `date`, `timestamp`, `duration` |
| 特殊 | `decimal`, `any`, `bool` |
| 集合 | `list<T>`, `map<K, V>` |
| 修饰符 | `optional`, `ref`, `ref(weak=true)` |

32 位和 64 位整数默认使用 varint 编码；如果你需要特定编码方式，也可以显式选择 `fixed_*` 和 `tagged_*` 变体。

---

## 从 Protobuf 或 FlatBuffers 迁移

### Protobuf 迁移

已经有 `.proto` Schema 了？Fory 编译器可以直接读取它们，并从中生成 Fory 代码：

```bash
foryc existing_schema.proto --java_out=./gen --python_out=./gen
```

输出结果会使用 Fory 生成类型和 Fory 二进制编码格式。能够读取 `.proto` 输入，**并不意味着**与 Protobuf 编码格式兼容。

关键映射关系如下：

- `repeated T` -> `list<T>`
- `oneof` -> Fory `union` + 可选字段
- `google.protobuf.Timestamp` -> `timestamp`
- `google.protobuf.Any` -> `any`

你也可以在 `.proto` 文件里加入 Fory 专属扩展：

```protobuf
message TreeNode {
  TreeNode parent = 1 [(fory).weak_ref = true];
  repeated TreeNode children = 2 [(fory).ref = true];
}
```

### FlatBuffers 迁移

FlatBuffers Schema 同样可以直接使用：

```bash
foryc existing_schema.fbs --lang java,python,go --output ./gen
```

其中，table 会变成支持演进的 message，struct 会变成不支持演进的 message，union 会直接映射到 Fory union。和 Protobuf 输入一样，生成结果使用的是 Fory 类型和 Fory 编码格式，而不是 FlatBuffers 二进制兼容。对于需要图语义的字段，可额外加上 `fory_ref:true` 或 `fory_weak_ref:true` 属性。

### 查看转换结果

你可以精确查看 protobuf 或 FlatBuffers Schema 会如何映射到 Fory IDL：

```bash
foryc schema.proto --emit-fdl
```

这会把转换后的 `.fdl` 直接输出到标准输出，方便你在真正迁移之前先审查映射结果。

---

## 为什么不直接用 Protobuf？

把 Fory IDL 和 Protocol Buffers 放在一起对比很有价值，因为对很多读者来说，Protobuf 本身就是默认参照物。

| 维度 | Protocol Buffers | Fory IDL |
| ---- | ---------------- | -------- |
| 生成类型 | 很多语言里更偏传输模型 | 符合语言习惯的原生结构 |
| 对象图 | 依赖应用层 ID / 重建 | 一等公民的 `ref` / `ref(weak=true)` |
| 循环引用 | 非内建能力 | 可直接在生成 Schema 中表达 |
| 变体字段 | `oneof` / `Any` | 生成模型里的 `union` / `any` |
| 性能 | 成熟基线 | 在对象序列化负载上通常更快 |
| gRPC 生态 | 原生且成熟 | 进行中（持续开发） |
| Schema 演进 | 基于字段号和 wire type | 生成 Schema 的兼容模式，按 field id 匹配 |
| 目标语言 | 很多（依赖插件） | Java、Python、Go、Rust、C++、C#、Swift（持续扩展） |

当你的首要诉求是 gRPC 生态集成时，**使用 Protobuf**。当你需要符合语言习惯的领域对象、对象图语义、引用跟踪，或者更高的序列化性能时，**使用 Fory IDL**。

更详细的基准测试数据和方法说明，可在仓库中的 [benchmark reports](https://github.com/apache/fory/tree/main/docs/benchmarks) 查看。

---

## 构建集成

Fory 编译器可以集成进主流构建系统。下面先给出几种常见示例，本质上都是在构建前执行一次 `foryc`。同样的模式也适用于 Cargo build script、Bazel rule、CMake custom command、Swift Package Manager plugin 等场景：

**Maven（Java）：**

```xml
<execution>
  <id>generate-fory-types</id>
  <phase>generate-sources</phase>
  <goals><goal>exec</goal></goals>
  <configuration>
    <executable>foryc</executable>
    <arguments>
      <argument>${basedir}/src/main/fdl/schema.fdl</argument>
      <argument>--java_out</argument>
      <argument>${project.build.directory}/generated-sources/fory</argument>
    </arguments>
  </configuration>
</execution>
```

**Gradle（Kotlin/Java）：**

```groovy
task generateForyTypes(type: Exec) {
    commandLine 'foryc', "${projectDir}/src/main/fdl/schema.fdl",
        '--java_out', "${buildDir}/generated/sources/fory"
}
compileJava.dependsOn generateForyTypes
```

**Go Generate：**

```go
//go:generate foryc ../schema.fdl --lang go --output .
package models
```

**Python（setuptools）：**

```python
class BuildWithForyIdl(build_py):
    def run(self):
        subprocess.run(['foryc', 'schema.fdl', '--python_out', 'src/generated'], check=True)
        super().run()
```

---

## 最佳实践

1. **使用有意义的 package 名称**：例如 `com.myapp.models`，既能更好地组织类型，也会直接影响命名空间生成结果。

2. **显式使用 `optional`**：不要依赖默认可空性，让 Schema 直接表达你的意图。

3. **只在必要时使用 `ref`**：引用跟踪对每个对象都有额外成本。共享对象和循环结构适合使用它；纯值类型载荷则没必要。

4. **把共享类型拆到 import 文件里**：像 Address、Timestamp 这类通用类型，应放到共享 `.fdl` 文件中再导入使用。

5. **迁移时用 `--emit-fdl` 先审查**：如果输入是 `.proto` 或 `.fbs`，先看一遍转换后的 Fory IDL，再决定是否提交。

---

## 结语

Apache Fory Schema IDL 把对象图语义直接放进 Schema 模型，而不是把这部分工作留给零散的应用层代码。如果你需要共享引用、循环结构、多态字段、Schema 演进，以及在各语言里依然符合习惯的生成模型，它提供的是一套统一 Schema 和统一编译器工作流。

定义一次类型，到处生成。序列化对象图，同时保留原生领域模型。

**快速开始：**

```bash
pip install fory-compiler
foryc --help
```

**文档：**

- Fory IDL Syntax: [fory.apache.org/docs/compiler/syntax](https://fory.apache.org/docs/compiler/syntax)
- Compiler CLI Guide: [fory.apache.org/docs/compiler/compiler_guide](https://fory.apache.org/docs/compiler/compiler_guide)
- Generated Code Reference: [fory.apache.org/docs/compiler/generated_code](https://fory.apache.org/docs/compiler/generated_code)
- Cross-Language Serialization: [fory.apache.org/docs/guide/xlang](https://fory.apache.org/docs/guide/xlang/serialization_index)
- Protobuf Migration: [fory.apache.org/docs/compiler/protobuf_idl_support](https://fory.apache.org/docs/compiler/protobuf_idl_support)
- Benchmark Reports: [github.com/apache/fory/tree/main/docs/benchmarks](https://github.com/apache/fory/tree/main/docs/benchmarks)

**社区：**

- GitHub: [apache/fory](https://github.com/apache/fory)
- Slack: [Join our community](https://join.slack.com/t/fory-project/shared_invite/zt-1u8soj4qc-ieYEu7ciHOqA2mo47llS8A)
- License: Apache License 2.0
