---
title: Schema IDL 语法
sidebar_position: 3
id: schema-idl
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

本文档提供 Fory IDL 的语法和语义参考。

有关编译器的使用和构建集成，请参阅
[编译指南](cli.md)。用于 protobuf/FlatBuffers 前端映射
规则，请参见[协议缓冲区 IDL 支持](protobuf-idl.md) 和
[FlatBuffers IDL 支持](flatbuffers-idl.md)。

## 文件结构

Fory IDL 文件通常包含：

1. 可选的 package 声明
2. 可选的文件级选项
3. 可选的 import 语句
4. 类型定义（枚举、消息和联合类型）
5. 可选的服务定义

```protobuf
// Optional package declaration
package com.example.models;

// Optional file-level options
option java_package = "com.example.models";

// Import statements
import "common/types.fdl";

// Type definitions
enum Color [id=100] { ... }
message User [id=101] { ... }
message OrderRequest [id=102] { ... }
message Order [id=103] { ... }
union Event [id=104] { ... }

// Service definitions
service OrderService {
    rpc GetOrder (OrderRequest) returns (Order);
}
```

## 注释

Fory IDL 支持单行注释和块注释：

```protobuf
// This is a single-line comment

/*
 * This is a block comment
 * that spans multiple lines
 */

message Example {
    string name = 1;  // Inline comment
}
```

## Package 声明

包声明定义文件中所有类型的命名空间。

```protobuf
package com.example.models;
```

您可以选择指定用于自动生成的类型 ID 的包别名：

```protobuf
package com.example.models alias models_v1;
```

**规则：**

- 可选但推荐
- 必须出现在任何类型定义之前
- 每个文件只有一个包声明
- 用于基于名称的类型注册
- 包别名用于自动 ID 哈希

**语言映射：**

| 语言                  | 包的用途               |
| --------------------- | ---------------------- |
| Java                  | Java 包                |
| Python                | 模块名称（点到下划线） |
| Go                    | 包名称（最后一个组件） |
| Rust                  | 模块名称（点到下划线） |
| C++                   | 命名空间（点到 `::`）  |
| C#                    | 命名空间               |
| JavaScript/TypeScript | TypeScript 模块名称    |
| Swift                 | 命名空间包装器或前缀   |
| Dart                  | 库名称（包段）         |
| Scala                 | Scala包                |
| Kotlin                | Kotlin包               |

## 文件级选项

可以在文件级别指定选项来控制特定于语言的代码生成。

### 语法

```protobuf
option option_name = value;
```

### Java Package 选项

覆盖生成代码的 Java 包：

```protobuf
package payment;
option java_package = "com.mycorp.payment.v1";

message Payment {
    string id = 1;
}
```

**影响：**

- 生成的Java文件将位于`com/mycorp/payment/v1/`目录中
- Java 包声明将为 `package com.mycorp.payment.v1;`
- 类型注册仍然使用Fory IDL包（`payment`）以实现跨语言兼容性

### Go Package 选项

指定Go导入路径和包名：

```protobuf
package payment;
option go_package = "github.com/mycorp/apis/gen/payment/v1;paymentv1";

message Payment {
    string id = 1;
}
```

**格式：** `"import/path;package_name"` 或 `"import/path"` （最后一段用作包名称）

**影响：**

- 生成的 Go文件将有`package paymentv1`
- 导入路径可以在其他Go代码中使用
- 类型注册仍然使用Fory IDL包（`payment`）以实现跨语言兼容性

### C# 命名空间选项

覆盖生成代码的 C# 命名空间：

```protobuf
package payment;
option csharp_namespace = "MyCorp.Payment.V1";

message Payment {
    string id = 1;
}
```

**影响：**

- 生成的 C# 文件使用 `namespace MyCorp.Payment.V1;`
- 输出路径遵循命名空间段（`MyCorp/Payment/V1/` 位于 `--csharp_out` 下）
- 类型注册仍然使用Fory IDL包（`payment`）以实现跨语言兼容性

### Kotlin Package 选项

覆盖生成源的 Kotlin 包：

```protobuf
package payment;
option kotlin_package = "com.mycorp.payment.v1";

message Payment {
    string id = 1;
}
```

**影响：**

- 生成的 Kotlin 文件写入 `com/mycorp/payment/v1/`
- Kotlin 源使用 `package com.mycorp.payment.v1`
- 为保持跨语言兼容性，类型注册仍使用 Fory IDL package（`payment`）

如果未设置 `kotlin_package`，Kotlin 将使用 FDL package。Kotlin 导入图不能混用默认 package Schema 与具名 Kotlin package。

### Go 嵌套类型样式选项

控制嵌套消息/枚举/联合类型的 Go 命名：

```protobuf
package payment;
option go_nested_type_style = "camelcase";

message Envelope {
    message Payload {
        string id = 1;
    }
}
```

**可选值：**

- `underscore`（默认）：`Envelope_Payload`
- `camelcase`：`EnvelopePayload`

如果两者都设置，CLI 标志 `--go_nested_type_style` 会覆盖 Schema 选项。

### Swift 命名空间样式选项

控制包命名空间如何反映在 Swift 生成的类型名称中：

```protobuf
package payment.v1;
option swift_namespace_style = "flatten";

message Payment {
    string id = 1;
}
```

**可选值：**

- `enum`（默认）：命名空间包装器（例如 `Payment.V1.Payment`）
- `flatten`：为顶层类型添加 package 前缀（例如 `Payment_V1_Payment`）

**重要：**命名空间包装器/前缀仅在包非空时应用。如果包为空，Swift 会直接为两种样式发出顶级类型。

如果两者都设置，CLI 标志 `--swift_namespace_style` 会覆盖 Schema 选项。

### Rust Chrono 时间类型选项

Rust 生成的代码默认使用 Fory 的轻量级时间载体类型：
`fory::Date`、`fory::Timestamp` 和 `fory::Duration`。如果生成的 Rust API
需要公开 chrono 时间类型，请设置 `rust_use_chrono_temporal_types`：

```protobuf
package payment;
option rust_use_chrono_temporal_types = true;

message Event {
    date business_day = 1;
    timestamp created_at = 2;
    duration timeout = 3;
}
```

启用此选项后，Rust 代码会将 `date` 映射为 `chrono::NaiveDate`，将 `timestamp`
映射为 `chrono::NaiveDateTime`，并将 `duration` 映射为 `chrono::Duration`。
编译生成代码的 Rust crate 必须依赖 `chrono`，并启用 Fory 的 `chrono` feature。

### Java 外层类名选项

生成所有类型作为单个外部包装类的内部类：

```protobuf
package payment;
option java_outer_classname = "DescriptorProtos";

enum Status {
    UNKNOWN = 0;
    ACTIVE = 1;
}

message Payment {
    string id = 1;
    Status status = 2;
}
```

**影响：**

- 生成单个文件 `DescriptorProtos.java` 而不是单独的文件
- 所有枚举和消息成为 `public static` 内部类
- 外部类是带有私有构造函数的 `public final`
- 用于将相关类型分组在一起

**生成的结构：**

```java
public final class DescriptorProtos {
    private DescriptorProtos() {}

    public static enum Status {
        UNKNOWN,
        ACTIVE;
    }

    public static class Payment {
        private String id;
        private Status status;
        // ...
    }
}
```

**与java_package结合使用：**

```protobuf
package payment;
option java_package = "com.example.proto";
option java_outer_classname = "PaymentProtos";

message Payment {
    string id = 1;
}
```

这会生成 `com/example/proto/PaymentProtos.java`，所有类型都作为内部类。

### Java 多文件选项

控制类型是在单独的文件中生成还是作为内部类生成：

```protobuf
package payment;
option java_outer_classname = "PaymentProtos";
option java_multiple_files = true;

message Payment {
    string id = 1;
}

message Receipt {
    string id = 1;
}
```

**行为：**

| `java_outer_classname` | `java_multiple_files` | 结果                         |
| ---------------------- | --------------------- | ---------------------------- |
| 未设置                 | 任何                  | 单独的文件（每种类型一个）   |
| 放                     | `false`（默认）       | 所有类型作为内部类的单个文件 |
| 放                     | `true`                | 单独的文件（覆盖外部类）     |

**`java_multiple_files = true`的效果：**

- 每个顶级枚举和消息都有自己的 `.java` 文件
- 覆盖 `java_outer_classname` 行为
- 当您想要单独的文件但仍为其他目的指定外部类名称时很有用

**没有 java_multiple_files 的示例（默认）：**

```protobuf
option java_outer_classname = "PaymentProtos";
// Generates: PaymentProtos.java containing Payment and Receipt as inner classes
```

**java_multiple_files = true 的示例：**

```protobuf
option java_outer_classname = "PaymentProtos";
option java_multiple_files = true;
// Generates: Payment.java, Receipt.java (separate files)
```

### 多个选项

可以指定多个选项：

```protobuf
package payment;
option java_package = "com.mycorp.payment.v1";
option go_package = "github.com/mycorp/apis/gen/payment/v1;paymentv1";
option deprecated = true;

message Payment {
    string id = 1;
}
```

### Protobuf 扩展语法

在 `.fdl` 文件中，仅使用 Fory IDL 原生语法（例如，`[id=100]`、`ref`、
`optional`、`nullable=true`）。

`(fory).` Protobuf 扩展语法仅适用于 `.proto` 文件和 protobuf 前端。

有关 protobuf 扩展选项，请参阅
[协议缓冲区 IDL 支持](protobuf-idl.md#fory-extension-options-protobuf)。

### 选项优先级

对于特定于语言的包/命名空间：

1. 特定语言的选项（`java_package`、`go_package`、`csharp_namespace`、
   `kotlin_package`)
2. Fory IDL package 声明（回退选项）

**例子：**

```protobuf
package myapp.models;
option java_package = "com.example.generated";
```

| 场景                  | 使用的 Java 包          |
| --------------------- | ----------------------- |
| 存在 `java_package`   | `com.example.generated` |
| 不存在 `java_package` | `myapp.models`（回退）  |

### 跨语言类型注册

特定于语言的选项仅影响代码的生成位置，而不影响用于序列化的类型命名空间。这确保了跨语言兼容性：

```protobuf
package myapp.models;
option java_package = "com.mycorp.generated";
option go_package = "github.com/mycorp/gen;genmodels";

message User {
    string name = 1;
}
```

所有语言都将注册 `User`，并使用命名空间 `myapp.models`，从而实现：

- Java序列化数据→Go反序列化
- Go序列化数据→Java反序列化
- 任何语言组合均可无缝运行

## Import 语句

Import 语句允许您使用其他 Fory IDL 文件中定义的类型。

### 基本语法

```protobuf
import "path/to/file.fdl";
```

### 多个 Import

```protobuf
import "common/types.fdl";
import "common/enums.fdl";
import "models/address.fdl";
```

### 路径解析

导入路径是相对于导入文件解析的：

```
project/
├── common/
│   └── types.fdl
├── models/
│   ├── user.fdl      # import "../common/types.fdl"
│   └── order.fdl     # import "../common/types.fdl"
└── main.fdl          # import "common/types.fdl"
```

**规则：**

- 导入路径是带引号的字符串（双引号或单引号）
- 路径相对于导入文件的目录进行解析
- 导入的类型变得可用，就像在当前文件中定义的一样
- 循环导入被检测并报告为错误
- 传递导入有效（如果 A 导入 B 并且 B 导入 C，则 A 可以访问 C 的类型）

### 完整示例

**常见/类型.fdl：**

```protobuf
package common;

enum Status [id=100] {
    PENDING = 0;
    ACTIVE = 1;
    COMPLETED = 2;
}

message Address [id=101] {
    string street = 1;
    string city = 2;
    string country = 3;
}
```

**模型/user.fdl：**

```protobuf
package models;
import "../common/types.fdl";

message User [id=200] {
    string id = 1;
    string name = 2;
    Address home_address = 3;  // Uses imported type
    Status status = 4;          // Uses imported enum
}
```

### 不支持的导入语法

**不支持**以下 protobuf 导入修饰符：

```protobuf
// NOT SUPPORTED - will produce an error
import public "other.fdl";
import weak "other.fdl";
```

**`import public`**：Fory IDL 使用更简单的导入模型。所有导入的类型仅适用于导入文件。不支持重新导出。在需要的地方直接导入每个文件。

**`import weak`**：Fory IDL 要求所有导入在编译时都存在。不支持可选依赖项。

### 导入错误

编译器报告错误：

- **文件未找到**：导入的文件不存在
- **循环导入**：A 导入 B，B 又导入 A（直接或间接）
- **解析错误**：导入文件中的语法错误
- **不支持的语法**：`import public` 或 `import weak`

## 枚举定义

枚举定义一组命名整数常量。

### 基本语法

```protobuf
enum Status {
    PENDING = 0;
    ACTIVE = 1;
    COMPLETED = 2;
}
```

### 使用显式类型 ID

```protobuf
enum Status [id=100] {
    PENDING = 0;
    ACTIVE = 1;
    COMPLETED = 2;
}
```

### 保留值

保留字段编号或名称以防止重复使用：

```protobuf
enum Status {
    reserved 2, 15, 9 to 11, 40 to max;  // Reserved numbers
    reserved "OLD_STATUS", "DEPRECATED"; // Reserved names
    PENDING = 0;
    ACTIVE = 1;
    COMPLETED = 3;
}
```

### 枚举类型选项

枚举级选项在枚举名称之后的 `[]` 中内联声明：

```protobuf
enum Status [deprecated=true] {
    PENDING = 0;
    ACTIVE = 1;
}
```

FDL 不支持枚举体内的 `option ...;` 语句。

**不支持：**

- **不支持** `allow_alias`。每个枚举值必须有一个唯一的整数。

### 语言映射

| 语言                  | 执行                                   |
| --------------------- | -------------------------------------- |
| Java                  | `enum Status { UNKNOWN, ACTIVE, ... }` |
| Python                | `class Status(IntEnum): UNKNOWN = 0`   |
| Go                    | `type Status int32` 带常数             |
| Rust                  | `#[repr(i32)] enum Status { Unknown }` |
| C++                   | `enum class Status : int32_t { ... }`  |
| C#                    | `enum Status { Unknown, Active, ... }` |
| JavaScript/TypeScript | `export enum Status { UNKNOWN, ... }`  |
| Swift                 | `enum Status` 具有稳定的 ID            |
| Dart                  | `enum Status { unknown, active, ... }` |
| Scala                 | Scala 3 `enum Status`                  |
| Kotlin                | `enum class Status`                    |

### 枚举前缀剥离

当枚举值使用 protobuf 样式前缀（UPPER_SNAKE_CASE 中的枚举名称）时，编译器会自动删除具有范围枚举的语言的前缀：

```protobuf
// Input with prefix
enum DeviceTier {
    DEVICE_TIER_UNKNOWN = 0;
    DEVICE_TIER_TIER1 = 1;
    DEVICE_TIER_TIER2 = 2;
}
```

**生成的代码：**

| 语言                  | 输出                                      | 风格         |
| --------------------- | ----------------------------------------- | ------------ |
| Java                  | `UNKNOWN, TIER1, TIER2`                   | 作用域枚举   |
| Rust                  | `Unknown, Tier1, Tier2`                   | 作用域枚举   |
| C++                   | `UNKNOWN, TIER1, TIER2`                   | 作用域枚举   |
| Python                | `UNKNOWN, TIER1, TIER2`                   | 范围内枚举   |
| Go                    | `DeviceTierUnknown, DeviceTierTier1, ...` | 无作用域常量 |
| JavaScript/TypeScript | `UNKNOWN, TIER1, TIER2`                   | 作用域枚举   |
| C#                    | `Unknown, Tier1, Tier2`                   | 作用域枚举   |
| Swift                 | `unknown, tier1, tier2`                   | 作用域枚举   |
| Dart                  | `unknown, tier1, tier2`                   | 作用域枚举   |
| Scala                 | `Unknown, Tier1, Tier2`                   | 作用域枚举   |
| Kotlin                | `UNKNOWN, TIER1, TIER2`                   | 作用域枚举   |

**注意：** 仅当其余部分是有效标识符时才会删除前缀。例如，`DEVICE_TIER_1` 保持不变，因为 `1` 不是有效的标识符名称。

**语法：**

```
enum_def     := 'enum' IDENTIFIER [type_options] '{' enum_body '}'
type_options := '[' type_option (',' type_option)* ']'
type_option  := IDENTIFIER '=' option_value
enum_body    := (reserved_stmt | enum_value)*
reserved_stmt := 'reserved' reserved_items ';'
enum_value   := IDENTIFIER '=' INTEGER ';'
```

**规则：**

- 枚举名称在文件中必须是唯一的
- 枚举值必须具有显式整数赋值
- 值整数在枚举中必须是唯一的（无别名）
- 类型 ID (`[id=100]`) 对于枚举来说是可选的，但建议跨语言使用

**具有所有功能的示例：**

```protobuf
// HTTP status code categories
enum HttpCategory [id=200] {
    reserved 10 to 20;           // Reserved for future use
    reserved "UNKNOWN";          // Reserved name
    INFORMATIONAL = 1;
    SUCCESS = 2;
    REDIRECTION = 3;
    CLIENT_ERROR = 4;
    SERVER_ERROR = 5;
}
```

## 消息定义

消息使用类型化字段定义结构化数据类型。

### 基本语法

```protobuf
message Person {
    string name = 1;
    int32 age = 2;
}
```

### 使用显式类型 ID

```protobuf
message Person [id=101] {
    string name = 1;
    int32 age = 2;
}
```

### 不使用显式类型 ID

```protobuf
message Person {  // Auto-generated when enable_auto_type_id = true
    string name = 1;
    int32 age = 2;
}
```

### 语言映射

| 语言                  | 执行                           |
| --------------------- | ------------------------------ |
| Java                  | 带有 getter/setter 的 POJO 类  |
| Python                | `@dataclass`级                 |
| Go                    | 具有导出字段的结构             |
| Rust                  | 结构为 `#[derive(ForyStruct)]` |
| C++                   | 具有 `FORY_STRUCT` 宏的结构    |
| C#                    | `[ForyStruct]`级               |
| JavaScript/TypeScript | `export interface`声明         |
| Swift                 | `@ForyStruct` 结构或类         |
| Dart                  | `@ForyStruct` `final class`    |
| Scala                 | Scala 3 `case class` 或类      |
| Kotlin                | `data class`或类               |

类型 ID 控制消息、联合和枚举的跨语言注册。看
[类型 ID](#type-ids) 用于自动生成、别名和冲突处理。

### 保留字段

保留字段编号或名称以防止删除字段后重复使用：

```protobuf
message User {
    reserved 2, 15, 9 to 11;       // Reserved field numbers
    reserved "old_field", "temp";  // Reserved field names
    string id = 1;
    string name = 3;
}
```

### 消息类型选项

消息级选项在消息名称之后的 `[]` 中内联声明：

```protobuf
message User [deprecated=true] {
    string id = 1;
    string name = 2;
}
```

FDL 不支持消息或枚举主体内的 `option ...;` 语句。

**语法：**

```
message_def  := 'message' IDENTIFIER [type_options] '{' message_body '}'
type_options := '[' type_option (',' type_option)* ']'
type_option  := IDENTIFIER '=' option_value
message_body := (reserved_stmt | nested_type | field_def)*
nested_type  := enum_def | message_def | union_def
```

**规则：**

- 类型 ID 遵循[类型 ID](#type-ids) 中的规则。

## 嵌套类型

消息可以包含嵌套消息、枚举和联合定义。这对于定义与其父消息密切相关的类型非常有用。

### 嵌套消息

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

### 嵌套枚举

```protobuf
message Container {
    enum Status {
        STATUS_UNKNOWN = 0;
        STATUS_ACTIVE = 1;
        STATUS_INACTIVE = 2;
    }
    Status status = 1;
}
```

### 限定类型名称

可以使用限定名称 (Parent.Child) 从其他消息引用嵌套类型：

```protobuf
message SearchResponse {
    message Result {
        string url = 1;
        string title = 2;
    }
}

message SearchResultCache {
    // Reference nested type with qualified name
    SearchResponse.Result cached_result = 1;
    list<SearchResponse.Result> all_results = 2;
}
```

### 深度嵌套类型

嵌套可以是多层深度：

```protobuf
message Outer {
    message Middle {
        message Inner {
            string value = 1;
        }
        Inner inner = 1;
    }
    Middle middle = 1;
}

message OtherMessage {
    // Reference deeply nested type
    Outer.Middle.Inner deep_ref = 1;
}
```

### 特定语言的生成

| 语言                  | 嵌套类型生成                                                  |
| --------------------- | ------------------------------------------------------------- |
| Java                  | 静态内部类（`SearchResponse.Result`）                         |
| Python                | 数据类中的嵌套类                                              |
| Go                    | 带下划线的平面结构（`SearchResponse_Result`，可配置为驼峰式） |
| Rust                  | 嵌套模块（`search_response::Result`）                         |
| C++                   | 嵌套类（`SearchResponse::Result`）                            |
| C#                    | 嵌套类（`SearchResponse.Result`）                             |
| JavaScript/TypeScript | 单位名称 (`Result`)                                           |
| Swift                 | 嵌套命名空间包装器或扁平化名称                                |
| Dart                  | 带下划线的扁平类（`SearchResponse_Result`）                   |
| Scala                 | 嵌套 companion/object 作用域                                  |
| Kotlin                | 平面生成的名称                                                |

**注意：**Go 默认使用下划线分隔嵌套名称；设置 `option go_nested_type_style = "camelcase";` 可使用拼接名称。Rust 会为嵌套类型生成嵌套模块。

### 嵌套类型规则

- 嵌套类型名称在其父消息中必须是唯一的
- 嵌套类型可以有自己的类型 ID
- 数字类型 ID 必须全局唯一（包括嵌套类型）；自动生成和冲突处理请参阅[类型 ID](#type-ids)
- 在消息中，您可以通过简单名称引用嵌套类型
- 从外部引用时，使用限定名称（Parent.Child）

## 联合定义

联合类型定义一个值，该值只能包含多个 case 类型中的一个。

### 基本语法

```protobuf
union Animal [id=106] {
    Dog dog = 1;
    Cat cat = 2;
}
```

### 在消息中使用联合

```protobuf
message Person [id=100] {
    Animal pet = 1;
    optional Animal favorite_pet = 2;
}
```

### 规则

- case ID 必须为非负数，并且在联合类型中唯一
- 特定语言的未知 case 标记只选择前向兼容载体，不会在 Schema case 表中新增条目
- case 不能是 `optional` 或 `ref`
- 联合 case 支持载荷元数据的字段选项，例如标量编码
  和集合元素元数据
- Case 类型可以是基本类型、枚举、消息或其他命名类型
- 联合类型 ID 遵循 [类型 ID](#type-ids) 中的规则。

**语法：**

```
union_def  := 'union' IDENTIFIER [type_options] '{' union_field* '}'
union_field := ['repeated'] field_type IDENTIFIER '=' INTEGER [field_options] ';'
```

## 服务定义 {#service-definition}

服务用于在 Fory IDL 中定义 RPC 方法契约。服务定义是可选的：即使 Schema 包含服务，
也仍会生成常规数据模型类型。只有为 Java、Python、Go、Rust、C#、Dart、Scala、Kotlin 或
JavaScript 等受支持目标使用 `--grpc` 运行编译器时，才会额外生成 gRPC 服务代码。
JavaScript 浏览器 gRPC-Web 客户端使用 `--grpc-web` 生成。

```protobuf
message GetPetRequest [id=200] {
    string name = 1;
}

message PetRecord [id=201] {
    string name = 1;
    Animal animal = 2;
}

service PetDirectory {
    rpc GetPet (GetPetRequest) returns (PetRecord);
    rpc Classify (Animal) returns (Animal);
}
```

第一个方法使用消息作为请求和响应类型。第二个方法展示 Fory IDL 对直接使用联合类型作为请求和响应类型的支持。

### 流式 RPC

在请求类型、响应类型或两者之前使用 `stream`：

```protobuf
service PetDirectory {
    rpc GetPet (GetPetRequest) returns (PetRecord);              // unary
    rpc WatchPets (GetPetRequest) returns (stream PetRecord);    // server streaming
    rpc ImportPets (stream PetRecord) returns (PetRecord);       // client streaming
    rpc ChatPets (stream Animal) returns (stream Animal);        // bidirectional streaming
}
```

### RPC 类型规则

- 请求和响应类型必须引用命名消息或联合类型。
- 枚举、基本类型、集合、Map 和数组不能直接作为 RPC 请求或响应类型。在服务契约中使用这些值时，请将其包装在消息中。
- 生成的 gRPC 配套代码使用 Fory 序列化每个 RPC 载荷。
  编译或运行这些配套代码的应用需要自行提供 gRPC
  依赖项，例如 grpc-java、grpc-kotlin、`grpcio`、grpc-go、Rust `tonic`
  和 `bytes`、Scala grpc-java API、`@grpc/grpc-js`、`grpc-web`、C#
  `Grpc.Core.Api` 及服务端或客户端软件包，或 Dart `package:grpc`。Python
  配套代码默认使用 `grpc.aio`；通过 `--grpc-python-mode=sync` 也可生成同步模式代码。

**语法：**

```
service_def := 'service' IDENTIFIER '{' rpc_method* '}'
rpc_method  := 'rpc' IDENTIFIER '(' ['stream'] named_type ')'
               'returns' '(' ['stream'] named_type ')' ';'
```

## 字段定义

字段定义消息的属性。

### 基本语法

```protobuf
field_type field_name = field_number;
```

### 带修饰符

```protobuf
optional list<string> tags = 1;  // Nullable list
list<optional string> tags = 2;  // Elements may be null
list<ref Node> nodes = 3;        // Elements tracked as references
```

**语法：**

```
field_def    := [modifiers] field_type IDENTIFIER '=' INTEGER ';'
modifiers    := { 'optional' | 'ref' }
field_type   := primitive_type | named_type | list_type | array_type | map_type
list_type    := 'list' '<' { 'optional' | 'ref' | scalar_encoding } field_type '>'
array_type   := 'array' '<' array_element_type '>'
```

`optional` 位于 `list` 之前时作用于集合字段。不能将 `optional` 直接应用于
`any`；请使用 `any`、`list<any>` 或 `map<K, any>`，不要使用 `optional any`、
`list<optional any>` 或 `map<K, optional any>`。`ref` 仅适用于具名 message/union
字段；对于集合内容，请使用 `list<ref T>` 或 `map<K, ref V>`。`repeated` 可作为
`list` 的别名。

### 字段修饰符 {#field-modifiers}

#### `optional`

将字段标记为可为空：

```protobuf
message User {
    string name = 1;           // Required, non-null
    optional string email = 2; // Nullable
}
```

请勿直接使用 `optional` 或 `[nullable = true]` 修饰 `any`。编译器
拒绝 `optional any`、`any [nullable = true]`、`list<optional any>` 和
`map<K, optional any>`；请改用 `any`、`list<any>` 或 `map<K, any>`。

**生成的代码：**

| 语言                  | 非可选             | 选修的                            |
| --------------------- | ------------------ | --------------------------------- |
| Java                  | `String name`      | `@Nullable String email`          |
| Python                | `name: str`        | `name: Optional[str]`             |
| Go                    | `Name string`      | `Name *string`                    |
| Rust                  | `name: String`     | `name: Option<String>`            |
| C++                   | `std::string name` | `std::optional<std::string> name` |
| C#                    | `string name`      | `string? email`                   |
| JavaScript/TypeScript | `name: string`     | `name?: string \| null`           |
| Swift                 | `String name`      | `String? email`                   |
| Dart                  | `String name`      | `String? email`                   |
| Scala                 | `name: String`     | `email: Option[String]`           |
| Kotlin                | `name: String`     | `email: String?`                  |

**默认值：**

| 类型       | 默认值              |
| ---------- | ------------------- |
| 非可选类型 | 默认语言            |
| 可选类型   | `null`/`None`/`nil` |

#### `ref`

启用共享/循环引用的引用跟踪：

```protobuf
message Node {
    string value = 1;
    ref Node parent = 2;     // Can point to shared object
    list<ref Node> children = 3;
}
```

**使用案例：**

- 共享对象（同一对象被多次引用）
- 循环引用（带有循环的对象图）
- 具有父指针的树结构

**生成的代码：**

| 语言                  | 不带`ref`      | 配`ref`                                   |
| --------------------- | -------------- | ----------------------------------------- |
| Java                  | `Node parent`  | `Node parent`，带 `@Ref`                  |
| Python                | `parent: Node` | `parent: Node = pyfory.field(ref=True)`   |
| Go                    | `Parent Node`  | `Parent *Node`，带 `fory:"ref"`           |
| Rust                  | `parent: Node` | `parent: Arc<Node>`                       |
| C++                   | `Node parent`  | `std::shared_ptr<Node> parent`            |
| C#                    | `Node parent`  | 带引用跟踪的 `Node? parent`               |
| JavaScript/TypeScript | `parent: Node` | `parent: Node`（不区分 ref）              |
| Swift                 | `Node parent`  | 带引用跟踪的类引用                        |
| Dart                  | `Node parent`  | `Node parent`，带 `@ForyField(ref: true)` |
| Scala                 | `parent: Node` | `@Ref parent: Node`                       |
| Kotlin                | `parent: Node` | `@Ref parent: Node?`                      |

Rust 默认对引用跟踪字段使用 `Arc` 和 `ArcWeak`。设置 `ref(thread_safe=false)` 后，
生成的 Rust 类型将改用单线程 `Rc` 或 `RcWeak` 载体。该设置只选择 Rust 代码生成
使用的载体；它不会改变 wire format，也不会使被引用的值本身变为线程安全。
protobuf 选项语法参见 [Protocol Buffers IDL 支持](protobuf-idl.md#field-level-options)。

Rust 指针载体映射：

| Fory IDL                                        | Rust 类型       |
| ----------------------------------------------- | --------------- |
| `ref Node parent`                               | `Arc<Node>`     |
| `ref(thread_safe=false) Node parent`            | `Rc<Node>`      |
| `ref(weak=true) Node parent`                    | `ArcWeak<Node>` |
| `ref(weak=true, thread_safe=false) Node parent` | `RcWeak<Node>`  |

#### `list`

将字段标记为有序集合：

```protobuf
message Document {
    list<string> tags = 1;
    list<User> authors = 2;
}
```

**生成的代码：**

| 语言                  | 类型                       |
| --------------------- | -------------------------- |
| Java                  | `List<String>`             |
| Python                | `List[str]`                |
| Go                    | `[]string`                 |
| Rust                  | `Vec<String>`              |
| C++                   | `std::vector<std::string>` |
| C#                    | `List<string>`             |
| JavaScript/TypeScript | `string[]`                 |
| Swift                 | `[String]`                 |
| Dart                  | `List<String>`             |
| Scala                 | `List[String]`             |
| Kotlin                | `List<String>`             |

### 组合修饰符

修饰符可以组合：

```fdl
message Example {
    optional list<string> tags = 1;  // Nullable list
    list<optional string> aliases = 2; // Elements may be null
    list<ref Node> children = 3;       // Elements tracked as references
    optional ref User owner = 4;       // Nullable tracked reference
}
```

`optional` 位于 `list` 之前时作用于字段/集合。`ref` 不能位于 `list` 或 `map`
之前；请将 `ref` 放入元素类型或值类型中。`repeated` 可作为 `list` 的别名。

**列表修饰符映射：**

| Fory IDL                | Java                         | Python                | Go                      | Rust                  | C++                                       | Dart                                                          | Scala                  |
| ----------------------- | ---------------------------- | --------------------- | ----------------------- | --------------------- | ----------------------------------------- | ------------------------------------------------------------- | ---------------------- |
| `optional list<string>` | `@Nullable List<String>`     | `Optional[List[str]]` | `[]string` + `nullable` | `Option<Vec<String>>` | `std::optional<std::vector<std::string>>` | `List<String>?`                                               | `Option[List[String]]` |
| `list<optional string>` | `List<String>`（可为空元素） | `List[Optional[str]]` | `[]*string`             | `Vec<Option<String>>` | `std::vector<std::optional<std::string>>` | `List<String?>`                                               | `List[Option[String]]` |
| `list<ref User>`        | `List<@Ref User>`            | `List[User]`          | `[]*User` + `ref=false` | `Vec<Arc<User>>`      | `std::vector<std::shared_ptr<User>>`      | `List<User>` + `@ListField(element: DeclaredType(ref: true))` | `List[User @Ref]`      |

在 Fory IDL 中使用 `ref(thread_safe=false)`（或
protobuf中的`[(fory).thread_safe_pointer = false]`）生成`Rc`而不是
Rust 中的 `Arc`。

## 字段编号

每个字段必须有一个唯一的正整数标识符：

```protobuf
message Example {
    string first = 1;
    string second = 2;
    string third = 3;
}
```

**规则和最佳实践：**

- 消息中的数字必须是唯一的。
- 数字必须是正整数。
- 允许有间隙，并且在删除字段时很有用。
- 优先选择从 `1` 开始的顺序编号。
- 切勿将已删除的字段编号重复用于其他字段。

## 类型系统 {#type-system}

Fory IDL 为基本类型、命名类型和集合提供统一类型系统。字段修饰符（`optional`、`ref`）控制可空性和
引用跟踪，而 `list<T>` 和 `array<T>` 用于选择集合 Schema 类型
（参见[字段修饰符](#field-modifiers)）。

本节中的简表列出常见的生成载体。完整的 1.0 语言支持范围（包括 C#、Swift、Dart、Scala 和 Kotlin）请参见
[xlang 类型映射规范](../specification/xlang_type_mapping.md)。

### 基本类型

| 类型        | 描述                                | 尺寸   |
| ----------- | ----------------------------------- | ------ |
| `bool`      | 布尔值                              | 1 字节 |
| `int8`      | 有符号 8 位整数                     | 1 字节 |
| `int16`     | 有符号 16 位整数                    | 2 字节 |
| `int32`     | 有符号 32 位整数，默认为 varint     | 4 字节 |
| `int64`     | 有符号 64 位整数，默认为 PVL varint | 8 字节 |
| `uint8`     | 无符号 8 位整数                     | 1字节  |
| `uint16`    | 无符号 16 位整数                    | 2 字节 |
| `uint32`    | 无符号 32 位整数，默认为 varint     | 4 字节 |
| `uint64`    | 无符号 64 位整数，默认为 PVL varint | 8 字节 |
| `float16`   | IEEE 754 binary16 浮点              | 2 字节 |
| `bfloat16`  | Brain Floating Point                | 2 字节 |
| `float32`   | 32 位浮点数                         | 4 字节 |
| `float64`   | 64 位浮点数                         | 8 字节 |
| `string`    | UTF-8 字符串                        | 可变   |
| `bytes`     | 二进制数据                          | 可变   |
| `date`      | 日历日期                            | 可变   |
| `timestamp` | 带时区的日期和时间                  | 可变   |
| `duration`  | 时长                                | 可变   |
| `decimal`   | 十进制值                            | 可变   |
| `any`       | 动态值（具体类型）                  | 可变   |

#### 布尔值

| 语言                  | 类型                  | 说明       |
| --------------------- | --------------------- | ---------- |
| Java                  | `boolean` / `Boolean` | 基本或装箱 |
| Python                | `bool`                |            |
| Go                    | `bool`                |            |
| Rust                  | `bool`                |            |
| C++                   | `bool`                |            |
| JavaScript/TypeScript | `boolean`             |            |
| Dart                  | `bool`                |            |

#### 整数类型

Fory IDL 提供固定宽度有符号整数（32/64 位整数默认使用变长编码）：

| Fory IDL 类型 | 位宽  | 范围              |
| ------------- | ----- | ----------------- |
| `int8`        | 8 位  | -128 至 127       |
| `int16`       | 16 位 | -32,768 至 32,767 |
| `int32`       | 32 位 | -2^31 至 2^31 - 1 |
| `int64`       | 64 位 | -2^63 至 2^63 - 1 |

**语言映射（有符号）：**

| Fory IDL | Java    | Python         | Go      | Rust  | C++       | JavaScript/TypeScript | Dart    |
| -------- | ------- | -------------- | ------- | ----- | --------- | --------------------- | ------- |
| `int8`   | `byte`  | `pyfory.Int8`  | `int8`  | `i8`  | `int8_t`  | `number`              | `int`   |
| `int16`  | `short` | `pyfory.Int16` | `int16` | `i16` | `int16_t` | `number`              | `int`   |
| `int32`  | `int`   | `pyfory.Int32` | `int32` | `i32` | `int32_t` | `number`              | `int`   |
| `int64`  | `long`  | `pyfory.Int64` | `int64` | `i64` | `int64_t` | `bigint \| number`    | `Int64` |

Fory IDL 提供固定宽度无符号整数（32/64 位整数默认使用变长编码）：

| Fory IDL | 位宽  | 范围          |
| -------- | ----- | ------------- |
| `uint8`  | 8 位  | 0 至 255      |
| `uint16` | 16 位 | 0 至 65,535   |
| `uint32` | 32 位 | 0 至 2^32 - 1 |
| `uint64` | 64 位 | 0 至 2^64 - 1 |

**语言映射（无符号）：**

| Fory IDL | Java    | Python          | Go       | Rust  | C++        | JavaScript/TypeScript | Dart     |
| -------- | ------- | --------------- | -------- | ----- | ---------- | --------------------- | -------- |
| `uint8`  | `short` | `pyfory.UInt8`  | `uint8`  | `u8`  | `uint8_t`  | `number`              | `int`    |
| `uint16` | `int`   | `pyfory.UInt16` | `uint16` | `u16` | `uint16_t` | `number`              | `int`    |
| `uint32` | `long`  | `pyfory.UInt32` | `uint32` | `u32` | `uint32_t` | `number`              | `int`    |
| `uint64` | `long`  | `pyfory.UInt64` | `uint64` | `u64` | `uint64_t` | `bigint \| number`    | `Uint64` |

#### 整数编码修饰符

对于 32/64 位整数，Fory IDL 默认使用变长编码。需要其他编码格式时，请添加标量编码修饰符：

| 修饰符   | 有效类型                             | 说明             |
| -------- | ------------------------------------ | ---------------- |
| `varint` | `int32`、`int64`、`uint32`、`uint64` | 默认值的显式拼写 |
| `fixed`  | `int32`、`int64`、`uint32`、`uint64` | 固定宽度小端序   |
| `tagged` | `int64`、`uint64`                    | 标记 64 位编码   |

修饰符是标量类型表达式的一部分，因此也可用于嵌套 list 和 map 位置：

```protobuf
fixed int32 id = 1;
list<fixed int32> offsets = 2;
map<string, tagged uint64> counters = 3;
```

带下划线的整数编码名称不是 FDL 类型名称。

#### 浮点类型

| Fory IDL 类型 | 位宽  | 精度            |
| ------------- | ----- | --------------- |
| `float32`     | 32 位 | 约 7 位数字     |
| `float64`     | 64 位 | 约 15-16 位数字 |

**语言映射：**

| Fory IDL   | Java       | Python 注解/值              | Go                  | Rust       | C++                | JavaScript/TypeScript | Dart      |
| ---------- | ---------- | --------------------------- | ------------------- | ---------- | ------------------ | --------------------- | --------- |
| `float16`  | `Float16`  | `pyfory.Float16` / `float`  | `float16.Float16`   | `Float16`  | `fory::float16_t`  | `number`              | `double`  |
| `bfloat16` | `BFloat16` | `pyfory.BFloat16` / `float` | `bfloat16.BFloat16` | `BFloat16` | `fory::bfloat16_t` | `number`              | `double`  |
| `float32`  | `float`    | `pyfory.Float32`            | `float32`           | `f32`      | `float`            | `number`              | `Float32` |
| `float64`  | `double`   | `pyfory.Float64`            | `float64`           | `f64`      | `double`           | `number`              | `double`  |

#### 字符串类型

| 语言                  | 类型          | 说明         |
| --------------------- | ------------- | ------------ |
| Java                  | `String`      | 不可变的     |
| Python                | `str`         |              |
| Go                    | `string`      | 不可变的     |
| Rust                  | `String`      | 拥有，堆分配 |
| C++                   | `std::string` |              |
| JavaScript/TypeScript | `string`      |              |
| Dart                  | `String`      |              |

#### 字节类型

| 语言                  | 类型                   | 说明     |
| --------------------- | ---------------------- | -------- |
| Java                  | `byte[]`               |          |
| Python                | `bytes`                | 不可变的 |
| Go                    | `[]byte`               |          |
| Rust                  | `Vec<u8>`              |          |
| C++                   | `std::vector<uint8_t>` |          |
| JavaScript/TypeScript | `Uint8Array`           |          |
| Dart                  | `Uint8List`            |          |

#### 时间类型

##### 日期

| 语言                  | 类型                  | 说明                                                                  |
| --------------------- | --------------------- | --------------------------------------------------------------------- |
| Java                  | `java.time.LocalDate` |                                                                       |
| Python                | `datetime.date`       |                                                                       |
| Go                    | `time.Time`           | 时间部分被忽略                                                        |
| Rust                  | `fory::Date`          | 设置 `rust_use_chrono_temporal_types = true` 生成 `chrono::NaiveDate` |
| C++                   | `fory::Date`          |                                                                       |
| JavaScript/TypeScript | `Date`                |                                                                       |
| Dart                  | `LocalDate`           | Fory 封装类型                                                         |

##### 时间戳

| 语言                  | 类型                | 说明                                                                      |
| --------------------- | ------------------- | ------------------------------------------------------------------------- |
| Java                  | `java.time.Instant` | 基于 UTC                                                                  |
| Python                | `datetime.datetime` |                                                                           |
| Go                    | `time.Time`         |                                                                           |
| Rust                  | `fory::Timestamp`   | 设置 `rust_use_chrono_temporal_types = true` 生成 `chrono::NaiveDateTime` |
| C++                   | `fory::Timestamp`   |                                                                           |
| JavaScript/TypeScript | `Date`              |                                                                           |
| Dart                  | `Timestamp`         | Fory 封装类型                                                             |

##### Duration

| 语言   | 类型                 | 说明                                                                 |
| ------ | -------------------- | -------------------------------------------------------------------- |
| Java   | `java.time.Duration` |                                                                      |
| Python | `datetime.timedelta` |                                                                      |
| Go     | `time.Duration`      |                                                                      |
| Rust   | `fory::Duration`     | 设置 `rust_use_chrono_temporal_types = true` 生成 `chrono::Duration` |
| C++    | `fory::Duration`     |                                                                      |
| Dart   | `Duration`           |                                                                      |

#### Any

| 语言                  | 类型                         | 说明                   |
| --------------------- | ---------------------------- | ---------------------- |
| Java                  | `Object`                     | 写入的具体值类型元数据 |
| Python                | `Any`                        | 写入的具体值类型元数据 |
| Go                    | `any`                        | 写入的具体值类型元数据 |
| Rust                  | `Arc<dyn Any + Send + Sync>` | 写入具体值的类型元数据 |
| C++                   | `std::any`                   | 写入的具体值类型元数据 |
| JavaScript/TypeScript | `any`                        | 写入的具体值类型元数据 |
| Dart                  | `Object?`                    | 写入具体值的类型元数据 |

**示例：**

```protobuf
enum EventType [id=120] {
    CREATED = 0;
    DELETED = 1;
}

message UserCreated [id=121] {
    string user_id = 1;
}

message Envelope [id=122] {
    EventType type = 1;
    any payload = 2;
}
```

**生成的代码（`Envelope.payload`）：**

| 语言                  | 生成的字段类型                        |
| --------------------- | ------------------------------------- |
| Java                  | `Object payload`                      |
| Python                | `payload: Any`                        |
| Go                    | `Payload any`                         |
| Rust                  | `payload: Arc<dyn Any + Send + Sync>` |
| C++                   | `std::any payload`                    |
| JavaScript/TypeScript | `payload: any`                        |
| Dart                  | `Object? payload`                     |

**说明：**

- `any` 始终写入 null 标志（与 `nullable` 相同），因为值可能为空。
- `optional` 和 `[nullable = true]` 不能直接用于 `any`；请使用
  `any`、`list<any>` 或 `map<K, any>` 而不是 `optional any`，
  `list<optional any>` 或 `map<K, optional any>`。
- 允许的动态值仅限于 `bool`、`string`、`enum`、`message` 和 `union`。
  不支持其他基本类型（数字、字节、日期/时间）和 list/map；请将它们包装在消息中，或改用显式字段。
- `ref` 不允许用于 `any` 字段（包括 list/map 值）。如果需要引用跟踪，请将 `any` 包装在消息中。
- 具体类型必须在目标语言 Schema/IDL 注册表中注册；未知类型无法反序列化。

### 命名类型

按名称引用其他消息、枚举或联合：

```protobuf
enum Status { ... }
message User { ... }

message Order {
    User customer = 1;    // Reference to User message
    Status status = 2;    // Reference to Status enum
}
```

### 集合类型

#### 列表 (`list`)

列表字段使用 `list<...>` 类型。`repeated` 也可作为别名。修饰符组合和语言映射请参阅[字段修饰符](#field-modifiers)。

嵌套集合支持取决于目标语言能力。C++ 生成器接受 `list<list<...>>`、
`list<map<...>>` 和 `map<..., list<...>>` 等嵌套集合 Schema；尚未实现嵌套字段
Schema 的目标语言仍会拒绝这些写法。如果需要跨所有目标语言的可移植 Schema，请使用消息包装器。

#### 数组 (`array`)

对于动态长度的密集数值数据，请使用 `array<T>`。`array<T>` 是与 `list<T>` 不同的
Schema 类型，使用紧凑的基本类型数组编码载荷。

```protobuf
message Embedding {
    array<int32> indices = 1;
    array<float32> values = 2;
    array<uint8> pixels = 3;
}
```

`array<T>` 仅接受 `bool`、整数和浮点元素类型。它不接受 `optional`、`ref`、
命名/对象类型、`string`、`bytes`、map，也不接受 `array<fixed int32>` 等标量整数编码修饰符；
根据数组约定，数组元素始终采用固定宽度编码。

生成的载体因语言而异，但 Schema 类型保持一致：

| IDL Schema        | Java 默认值                  | Python 默认值          | Dart 默认值    | JavaScript/TypeScript    |
| ----------------- | ---------------------------- | ---------------------- | -------------- | ------------------------ |
| `list<bool>`      | `BoolList` / `List<Boolean>` | `List[bool]`           | `List<bool>`   | `Type.list(Type.bool())` |
| `array<bool>`     | `boolean[]`                  | `pyfory.BoolArray`     | `BoolList`     | `Type.boolArray()`       |
| `array<int8>`     | `@Int8Type byte[]`           | `pyfory.Int8Array`     | `Int8List`     | `Type.int8Array()`       |
| `array<int16>`    | `short[]`                    | `pyfory.Int16Array`    | `Int16List`    | `Type.int16Array()`      |
| `array<int32>`    | `int[]`                      | `pyfory.Int32Array`    | `Int32List`    | `Type.int32Array()`      |
| `array<int64>`    | `long[]`                     | `pyfory.Int64Array`    | `Int64List`    | `Type.int64Array()`      |
| `array<uint8>`    | `@UInt8Type byte[]`          | `pyfory.UInt8Array`    | `Uint8List`    | `Type.uint8Array()`      |
| `array<uint16>`   | `@UInt16Type short[]`        | `pyfory.UInt16Array`   | `Uint16List`   | `Type.uint16Array()`     |
| `array<uint32>`   | `@UInt32Type int[]`          | `pyfory.UInt32Array`   | `Uint32List`   | `Type.uint32Array()`     |
| `array<uint64>`   | `@UInt64Type long[]`         | `pyfory.UInt64Array`   | `Uint64List`   | `Type.uint64Array()`     |
| `array<float16>`  | `Float16Array`               | `pyfory.Float16Array`  | `Float16List`  | `Type.float16Array()`    |
| `array<bfloat16>` | `BFloat16Array`              | `pyfory.BFloat16Array` | `Bfloat16List` | `Type.bfloat16Array()`   |
| `array<float32>`  | `float[]`                    | `pyfory.Float32Array`  | `Float32List`  | `Type.float32Array()`    |
| `array<float64>`  | `double[]`                   | `pyfory.Float64Array`  | `Float64List`  | `Type.float64Array()`    |

对于手写 Dart 模型，`array<bool>` 需要 `BoolList`，并添加
`@ArrayField(element: BoolType())` 或
`@ForyField(type: ArrayType(element: BoolType()))`；`List<bool>` 仍对应
`list<bool>`。对于手写 Java 模型，无符号基本类型数组在元素类型上使用类型注解，
例如 `private @UInt32Type int[] ids;`。
对于生成的 Kotlin 模型，`array<int8>` 使用 `@ArrayType ByteArray`，
包括嵌套集合和 map 位置。

#### Map

具有指定键和值类型的 Map：

```protobuf
message Config {
    map<string, string> properties = 1;
    map<string, int32> counts = 2;
    map<int32, User> users = 3;
}
```

**语言映射：**

| Fory IDL             | Java                   | Python            | Go                 | Rust                    | C++                                        | JavaScript/TypeScript | Dart                |
| -------------------- | ---------------------- | ----------------- | ------------------ | ----------------------- | ------------------------------------------ | --------------------- | ------------------- |
| `map<string, int32>` | `Map<String, Integer>` | `Dict[str, int]`  | `map[string]int32` | `HashMap<String, i32>`  | `std::unordered_map<std::string, int32_t>` | `Map<string, number>` | `Map<String, int>`  |
| `map<string, User>`  | `Map<String, User>`    | `Dict[str, User]` | `map[string]User`  | `HashMap<String, User>` | `std::unordered_map<std::string, User>`    | `Map<string, User>`   | `Map<String, User>` |

**键类型限制：**

- `string`（最常见）
- `bool`
- 整数类型（`int8`、`int16`、`int32`、`int64`、`uint8`、`uint16`、`uint32`、`uint64`）
- 时间标量类型（`date`、`timestamp`、`duration`）
- 枚举

Map 键不支持 `any`、二进制 `bytes`、浮点类型、`decimal`、消息类型、联合类型、
`list<T>`、`array<T>` 或嵌套 `map<K, V>`。请将这些类型用于 Map 值，或使用可移植的标量或枚举键将它们包装在消息中。

### 类型兼容性矩阵

该矩阵显示了哪些类型转换在不同语言中是安全的：

| 从 -> 到 | bool | int8 | int16 | int32 | int64 | float32 | float64 | string |
| -------- | ---- | ---- | ----- | ----- | ----- | ------- | ------- | ------ |
| bool     | 是   | 是   | 是    | 是    | 是    | -       | -       | -      |
| int8     | -    | 是   | 是    | 是    | 是    | 是      | 是      | -      |
| int16    | -    | -    | 是    | 是    | 是    | 是      | 是      | -      |
| int32    | -    | -    | -     | 是    | 是    | -       | 是      | -      |
| int64    | -    | -    | -     | -     | 是    | -       | -       | -      |
| float32  | -    | -    | -     | -     | -     | 是      | 是      | -      |
| float64  | -    | -    | -     | -     | -     | -       | 是      | -      |
| string   | -    | -    | -     | -     | -     | -       | -       | 是     |

Y = 安全转换，- = 不推荐

### 最佳实践

- 使用 `int32` 作为大多数整数的默认值；对于较大值，请使用 `int64`。
- 对于文本数据 (UTF-8) 使用 `string`，对于二进制数据使用 `bytes`。
- 仅当该字段可能合法地不存在时才使用 `optional`。
- 仅当需要共享或循环引用时才使用 `ref`。
- 对于有序序列，首选 `list`；对于键值查找，首选 `map`。

## 类型 ID {#type-ids}

类型 ID 用于消息、联合类型和枚举，可实现高效的跨语言序列化。当
`enable_auto_type_id = true`（默认）且省略 `id` 时，编译器通过
`MurmurHash3(utf8(package.type_name))`（32 位）自动生成 ID，并在生成的代码中注明。
当 `enable_auto_type_id = false` 时，没有显式 ID 的类型改为按命名空间和名称注册。
编译器会在当前文件和所有导入文件中检测冲突；发生冲突时，
编译器会引发错误并要求显式 `id` 或 `alias`。
对于 Java 和 Scala 生成的代码，嵌套名称注册会把父级路径附加到 namespace，
同时保留嵌套类型的简单名称。例如，
`package demo; message Envelope { message Payload { ... } }` 在这些 JVM 目标中
会注册 `Payload`：其 namespace 为 `demo.Envelope`，类型名称为 `Payload`。

```protobuf
enum Color [id=100] { ... }
message User [id=101] { ... }
union Event [id=102] { ... }
```

枚举类型 ID 仍是可选的；当 `enable_auto_type_id = true` 时，如果省略 ID，
编译器会使用相同的哈希算法自动生成 ID。

### 使用显式类型 ID

```protobuf
message User [id=101] { ... }
message User [id=101, deprecated=true] { ... }  // Multiple options
```

### 不使用显式类型 ID

```protobuf
message Config { ... }  // Auto-generated when enable_auto_type_id = true
```

您可以设置 `[alias="..."]` 来更改哈希源，而无需重命名类型。

### 实用说明

- 如果类型省略 `id` 且 `enable_auto_type_id = true`，Fory 会使用
  `MurmurHash3(utf8(package.type_name))`（32 位）生成 ID。
- 包别名和类型别名会改变哈希输入，可在不重命名公共类型的情况下解决哈希冲突。
- 小 varint 范围（`0-127`）内的手动 ID 在 wire format 中更紧凑；自动生成的 ID
  通常更大，一般占用 4-5 字节。

### ID 分配策略

```protobuf
// Enums: 100-199
enum Status [id=100] { ... }
enum Priority [id=101] { ... }

// User domain: 200-299
message User [id=200] { ... }
message UserProfile [id=201] { ... }

// Order domain: 300-399
message Order [id=300] { ... }
message OrderItem [id=301] { ... }
```

## 完整示例

```protobuf
// E-commerce domain model
package com.shop.models;

// Enums with type IDs
enum OrderStatus [id=100] {
    PENDING = 0;
    CONFIRMED = 1;
    SHIPPED = 2;
    DELIVERED = 3;
    CANCELLED = 4;
}

enum PaymentMethod [id=101] {
    CREDIT_CARD = 0;
    DEBIT_CARD = 1;
    PAYPAL = 2;
    BANK_TRANSFER = 3;
}

// Messages with type IDs
message Address [id=200] {
    string street = 1;
    string city = 2;
    string state = 3;
    string country = 4;
    string postal_code = 5;
}

message Customer [id=201] {
    string id = 1;
    string name = 2;
    optional string email = 3;
    optional string phone = 4;
    optional Address billing_address = 5;
    optional Address shipping_address = 6;
}

message Product [id=202] {
    string sku = 1;
    string name = 2;
    string description = 3;
    float64 price = 4;
    int32 stock = 5;
    list<string> categories = 6;
    map<string, string> attributes = 7;
}

message OrderItem [id=203] {
    ref Product product = 1;  // Track reference to avoid duplication
    int32 quantity = 2;
    float64 unit_price = 3;
}

message Order [id=204] {
    string id = 1;
    ref Customer customer = 2;
    list<OrderItem> items = 3;
    OrderStatus status = 4;
    PaymentMethod payment_method = 5;
    float64 total = 6;
    optional string notes = 7;
    timestamp created_at = 8;
    optional timestamp shipped_at = 9;
}

// Config without explicit type ID (auto-generated when enable_auto_type_id = true)
message ShopConfig {
    string store_name = 1;
    string currency = 2;
    float64 tax_rate = 3;
    list<string> supported_countries = 4;
}
```

有关 protobuf 特定的扩展选项和 `(fory).` 语法，请参阅
[协议缓冲区 IDL 支持](protobuf-idl.md#fory-extension-options-protobuf)。

## 语法总结

```
file         := [package_decl] file_option* import_decl* definition*

package_decl := 'package' package_name ['alias' package_name] ';'
package_name := IDENTIFIER ('.' IDENTIFIER)*

file_option  := 'option' option_name '=' option_value ';'
option_name  := IDENTIFIER

import_decl  := 'import' STRING ';'

definition   := type_def | service_def
type_def     := enum_def | message_def | union_def

enum_def     := 'enum' IDENTIFIER [type_options] '{' enum_body '}'
enum_body    := (reserved_stmt | enum_value)*
enum_value   := IDENTIFIER '=' INTEGER ';'

message_def  := 'message' IDENTIFIER [type_options] '{' message_body '}'
message_body := (reserved_stmt | nested_type | field_def)*
nested_type  := enum_def | message_def | union_def
field_def    := [modifiers] field_type IDENTIFIER '=' INTEGER [field_options] ';'

union_def    := 'union' IDENTIFIER [type_options] '{' union_field* '}'
union_field  := ['repeated'] field_type IDENTIFIER '=' INTEGER [field_options] ';'

service_def  := 'service' IDENTIFIER '{' rpc_method* '}'
rpc_method   := 'rpc' IDENTIFIER '(' ['stream'] named_type ')'
                'returns' '(' ['stream'] named_type ')' ';'
option_value := 'true' | 'false' | IDENTIFIER | INTEGER | STRING

reserved_stmt := 'reserved' reserved_items ';'
reserved_items := reserved_item (',' reserved_item)*
reserved_item := INTEGER | INTEGER 'to' INTEGER | INTEGER 'to' 'max' | STRING

modifiers    := { 'optional' | 'ref' | 'repeated' }

field_type   := [scalar_encoding] (primitive_type | named_type | list_type | array_type | map_type)
primitive_type := 'bool'
               | 'int8' | 'int16' | 'int32' | 'int64'
               | 'uint8' | 'uint16' | 'uint32' | 'uint64'
               | 'float16' | 'bfloat16' | 'float32' | 'float64'
               | 'string' | 'bytes'
               | 'date' | 'timestamp' | 'duration' | 'decimal'
               | 'any'
scalar_encoding := 'varint' | 'fixed' | 'tagged'
named_type   := qualified_name
qualified_name := IDENTIFIER ('.' IDENTIFIER)*   // e.g., Parent.Child
list_type    := 'list' '<' { 'optional' | 'ref' | scalar_encoding } field_type '>'
array_type   := 'array' '<' array_element_type '>'
map_type     := 'map' '<' field_type ',' field_type '>'

type_options := '[' type_option (',' type_option)* ']'
type_option  := IDENTIFIER '=' option_value         // e.g., id=100, deprecated=true
field_options := '[' field_option (',' field_option)* ']'
field_option := IDENTIFIER '=' option_value         // e.g., deprecated=true, ref=true

STRING       := '"' [^"\n]* '"' | "'" [^'\n]* "'"
IDENTIFIER   := [a-zA-Z_][a-zA-Z0-9_]*
INTEGER      := '-'? [0-9]+
```
