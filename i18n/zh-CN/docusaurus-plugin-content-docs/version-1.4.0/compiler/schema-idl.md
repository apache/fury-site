---
title: Schema IDL 语法
sidebar_position: 2
id: syntax
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

本文档提供 Fory IDL 的语法与语义参考。

编译器使用方式与构建集成请参见 [Compiler Guide](compiler-guide.md)。
protobuf/FlatBuffers 前端映射请参见 [Protocol Buffers IDL Support](protobuf-idl.md) 与 [FlatBuffers IDL Support](flatbuffers-idl.md)。

## 文件结构

一个 Fory IDL 文件通常包含：

1. 可选 `package` 声明
2. 可选文件级 `option`
3. 可选 `import` 语句
4. 类型定义（`enum`、`message`、`union`）
5. 可选的 `service` 定义

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

支持单行注释与块注释：

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

`package` 定义文件中所有类型的命名空间。

```protobuf
package com.example.models;
```

也可以配置 alias（用于自动类型 ID 计算）：

```protobuf
package com.example.models alias models_v1;
```

规则：

- 可选但推荐
- 必须位于任何类型定义之前
- 每个文件最多一个 `package`
- 用于命名空间注册
- `alias` 会参与 auto-ID 哈希

语言映射：

| 语言                  | package 用法                 |
| --------------------- | ---------------------------- |
| Java                  | Java package                 |
| Python                | 模块名（`.` 转 `_`）         |
| Go                    | 包名（取最后一段）           |
| Rust                  | 模块名（`.` 转 `_`）         |
| C++                   | 命名空间（`.` 转 `::`）      |
| C#                    | 命名空间                     |
| JavaScript/TypeScript | TypeScript 模块名            |
| Swift                 | 命名空间包装类型或名称前缀   |
| Dart                  | 库名（保留 package 各段）    |
| Scala                 | Scala package                |
| Kotlin                | Kotlin package               |

## 文件级选项

文件级选项用于控制特定语言的代码生成。

### 语法

```protobuf
option option_name = value;
```

### Java Package 选项

通过 `java_package` 覆盖 Java 输出包名：

```protobuf
package payment;
option java_package = "com.mycorp.payment.v1";

message Payment {
    string id = 1;
}
```

效果：

- Java 文件输出到 `com/mycorp/payment/v1/`
- Java `package` 声明使用该值
- 跨语言类型注册仍以 Fory package（如 `payment`）为准

### Go Package 选项

通过 `go_package` 指定 Go import path 与包名：

```protobuf
package payment;
option go_package = "github.com/mycorp/apis/gen/payment/v1;paymentv1";

message Payment {
    string id = 1;
}
```

格式为 `"import/path;package_name"`，也可以只写 `"import/path"`（此时以最后一段作为包名）。

效果：

- 生成的 Go 文件使用 `package paymentv1`
- 其他 Go 代码可以使用该 import path
- 跨语言类型注册仍以 Fory IDL package（`payment`）为准

### C# Namespace 选项

通过 `csharp_namespace` 覆盖生成代码的 C# 命名空间：

```protobuf
package payment;
option csharp_namespace = "MyCorp.Payment.V1";

message Payment {
    string id = 1;
}
```

效果：

- 生成的 C# 文件使用 `namespace MyCorp.Payment.V1;`
- 输出路径遵循命名空间分段（位于 `--csharp_out` 下的 `MyCorp/Payment/V1/`）
- 跨语言类型注册仍以 Fory IDL package（`payment`）为准

### Kotlin Package 选项

通过 `kotlin_package` 覆盖生成源码的 Kotlin package：

```protobuf
package payment;
option kotlin_package = "com.mycorp.payment.v1";

message Payment {
    string id = 1;
}
```

效果：

- 生成的 Kotlin 文件写入 `com/mycorp/payment/v1/`
- Kotlin 源码使用 `package com.mycorp.payment.v1`
- 跨语言类型注册仍以 Fory IDL package（`payment`）为准

未配置 `kotlin_package` 时，Kotlin 使用 FDL package。Kotlin import 图不能混用默认 package 的 Schema 与命名 Kotlin package。

### Go 嵌套类型风格选项

通过 `go_nested_type_style` 控制嵌套 message、enum 和 union 在 Go 中的命名方式：

```protobuf
package payment;
option go_nested_type_style = "camelcase";

message Envelope {
    message Payload {
        string id = 1;
    }
}
```

可选值：

- `underscore`（默认）：`Envelope_Payload`
- `camelcase`：`EnvelopePayload`

同时设置时，命令行参数 `--go_nested_type_style` 会覆盖 Schema 选项。

### Swift 命名空间风格选项

通过 `swift_namespace_style` 控制 package 命名空间在 Swift 生成类型名称中的呈现方式：

```protobuf
package payment.v1;
option swift_namespace_style = "flatten";

message Payment {
    string id = 1;
}
```

可选值：

- `enum`（默认）：使用命名空间包装类型，例如 `Payment.V1.Payment`
- `flatten`：为顶层类型添加 package 前缀，例如 `Payment_V1_Payment`

**注意：** 仅当 package 非空时才应用命名空间包装或前缀。package 为空时，两种风格都直接生成顶层类型。

同时设置时，命令行参数 `--swift_namespace_style` 会覆盖 Schema 选项。

### Rust Chrono 时间类型选项

Rust 生成代码默认使用 Fory 的轻量时间载体类型：`fory::Date`、`fory::Timestamp` 和 `fory::Duration`。如果生成的 Rust API 需要改为暴露 chrono 时间类型，可设置 `rust_use_chrono_temporal_types`：

```protobuf
package payment;
option rust_use_chrono_temporal_types = true;

message Event {
    date business_day = 1;
    timestamp created_at = 2;
    duration timeout = 3;
}
```

启用后，Rust 代码将 `date` 映射为 `chrono::NaiveDate`，将 `timestamp` 映射为 `chrono::NaiveDateTime`，将 `duration` 映射为 `chrono::Duration`。编译生成代码的 Rust crate 必须依赖 `chrono`，并启用 Fory 的 `chrono` feature。

### Java Outer Classname 选项

将多个类型包装到一个外层类：

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

效果：

- 生成单个 `DescriptorProtos.java`，而不是为每种类型生成独立文件
- 所有 enum 和 message 都成为 `public static` 内部类
- 外层类为带私有构造函数的 `public final` 类
- 适合将相关类型组织在一起

生成结构：

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

与 `java_package` 组合使用：

```protobuf
package payment;
option java_package = "com.example.proto";
option java_outer_classname = "PaymentProtos";

message Payment {
    string id = 1;
}
```

这会生成 `com/example/proto/PaymentProtos.java`，其中所有类型均为内部类。

### Java Multiple Files 选项

控制 Java 是否拆分多文件：

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

行为：

| `java_outer_classname` | `java_multiple_files` | 结果             |
| ---------------------- | --------------------- | ---------------- |
| 未设置                 | 任意                  | 每个类型一个文件 |
| 已设置                 | `false`（默认）       | 单文件 + 内部类  |
| 已设置                 | `true`                | 强制拆分为多文件 |

`java_multiple_files = true` 的效果：

- 每个顶层 enum 和 message 都有独立的 `.java` 文件
- 覆盖 `java_outer_classname` 的行为
- 适用于希望拆分文件、但仍需为其他用途指定外层类名的场景

未配置 `java_multiple_files`（默认）：

```protobuf
option java_outer_classname = "PaymentProtos";
// Generates: PaymentProtos.java containing Payment and Receipt as inner classes
```

配置 `java_multiple_files = true`：

```protobuf
option java_outer_classname = "PaymentProtos";
option java_multiple_files = true;
// Generates: Payment.java, Receipt.java (separate files)
```

### 多个选项组合

```protobuf
package payment;
option java_package = "com.mycorp.payment.v1";
option go_package = "github.com/mycorp/apis/gen/payment/v1;paymentv1";
option deprecated = true;

message Payment {
    string id = 1;
}
```

### Protobuf 扩展语法说明

在 `.fdl` 中请只使用 Fory IDL 原生语法（如 `[id=100]`、`ref`、`optional`、`nullable=true`）。

带 `(fory).` 的 Protobuf 扩展语法仅用于 `.proto` 文件和 Protobuf 前端。

Protobuf 扩展选项详见 [Protocol Buffers IDL Support](protobuf-idl.md#fory-extension-options-protobuf)。

### 选项优先级

特定语言的 package 或命名空间按以下优先级确定：

1. 特定语言选项（`java_package`、`go_package`、`csharp_namespace`、`kotlin_package`）
2. Fory IDL package 声明（兜底）

示例：

```protobuf
package myapp.models;
option java_package = "com.example.generated";
```

| 场景                    | 使用的 Java package            |
| ----------------------- | ------------------------------ |
| 配置 `java_package`     | `com.example.generated`        |
| 未配置 `java_package`   | `myapp.models`（兜底）         |

### 跨语言类型注册

特定语言选项只影响代码生成位置，不改变序列化时使用的类型命名空间，从而保证跨语言兼容性：

```protobuf
package myapp.models;
option java_package = "com.mycorp.generated";
option go_package = "github.com/mycorp/gen;genmodels";

message User {
    string name = 1;
}
```

所有语言都使用命名空间 `myapp.models` 注册 `User`，因此支持：

- Java 序列化的数据由 Go 反序列化
- Go 序列化的数据由 Java 反序列化
- 任意语言组合都可以无缝互操作

## Import 语句

`import` 语句用于引用其他 Fory IDL 文件中定义的类型。

### 基本语法

```protobuf
import "path/to/file.fdl";
```

### 多个导入

```protobuf
import "common/types.fdl";
import "common/enums.fdl";
import "models/address.fdl";
```

### 路径解析

`import` 路径相对于发起导入的文件解析：

```
project/
├── common/
│   └── types.fdl
├── models/
│   ├── user.fdl      # import "../common/types.fdl"
│   └── order.fdl     # import "../common/types.fdl"
└── main.fdl          # import "common/types.fdl"
```

规则：

- import path 是使用单引号或双引号包围的字符串
- path 相对于发起导入的文件所在目录解析
- 导入的类型与当前文件中定义的类型一样可用
- 编译器会检测循环导入并报告错误
- 支持传递导入：若 A 导入 B、B 导入 C，则 A 可以使用 C 的类型

### 完整示例

**common/types.fdl：**

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

**models/user.fdl：**

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

### 不支持的 import 写法

不支持以下 Protobuf import 修饰符：

```protobuf
// NOT SUPPORTED - will produce an error
import public "other.fdl";
import weak "other.fdl";
```

**`import public`：** Fory IDL 使用更简单的导入模型。导入的类型只对发起导入的文件可见，不支持重新导出；请在需要的位置直接导入各文件。

**`import weak`：** Fory IDL 要求编译时所有导入文件都存在，不支持可选依赖。

### import 错误

编译器会报告以下错误：

- **文件不存在：** 找不到导入文件
- **循环导入：** A 直接或间接导入 B，而 B 又导入 A
- **解析错误：** 导入文件存在语法错误
- **不支持的语法：** 使用 `import public` 或 `import weak`

## Enum 定义

enum 定义一组具名整数常量。

### 基本语法

```protobuf
enum Status {
    PENDING = 0;
    ACTIVE = 1;
    COMPLETED = 2;
}
```

### 显式类型 ID

```protobuf
enum Status [id=100] {
    PENDING = 0;
    ACTIVE = 1;
    COMPLETED = 2;
}
```

### 预留值

```protobuf
enum Status {
    reserved 2, 15, 9 to 11, 40 to max;  // Reserved numbers
    reserved "OLD_STATUS", "DEPRECATED"; // Reserved names
    PENDING = 0;
    ACTIVE = 1;
    COMPLETED = 3;
}
```

### enum 类型选项

enum 级选项写在 enum 名称后的 `[]` 中：

```protobuf
enum Status [deprecated=true] {
    PENDING = 0;
    ACTIVE = 1;
}
```

FDL 不支持在 enum 内部使用 `option ...;` 语句。

不支持 `allow_alias`；同一个 enum 中每个枚举值必须使用不同的整数。

### 语言映射

| 语言                  | 实现形式                               |
| --------------------- | -------------------------------------- |
| Java                  | `enum Status { UNKNOWN, ACTIVE, ... }` |
| Python                | `class Status(IntEnum): UNKNOWN = 0`   |
| Go                    | `type Status int32` 配合常量           |
| Rust                  | `#[repr(i32)] enum Status { Unknown }` |
| C++                   | `enum class Status : int32_t { ... }`  |
| C#                    | `enum Status { Unknown, Active, ... }` |
| JavaScript/TypeScript | `export enum Status { UNKNOWN, ... }`  |
| Swift                 | 使用稳定 ID 的 `enum Status`           |
| Dart                  | `enum Status { unknown, active, ... }` |
| Scala                 | Scala 3 `enum Status`                  |
| Kotlin                | `enum class Status`                    |

### 枚举前缀处理

如果枚举值使用 Protobuf 风格前缀（枚举名称的大写蛇形形式），编译器会为具有作用域 enum 的语言自动去除该前缀：

```protobuf
// Input with prefix
enum DeviceTier {
    DEVICE_TIER_UNKNOWN = 0;
    DEVICE_TIER_TIER1 = 1;
    DEVICE_TIER_TIER2 = 2;
}
```

| 语言                  | 输出示例                                  | 风格             |
| --------------------- | ----------------------------------------- | ---------------- |
| Java                  | `UNKNOWN, TIER1, TIER2`                   | 作用域枚举       |
| Rust                  | `Unknown, Tier1, Tier2`                   | 作用域枚举       |
| C++                   | `UNKNOWN, TIER1, TIER2`                   | 作用域枚举       |
| Python                | `UNKNOWN, TIER1, TIER2`                   | 作用域 `IntEnum` |
| Go                    | `DeviceTierUnknown, DeviceTierTier1, ...` | 非作用域常量     |
| JavaScript/TypeScript | `UNKNOWN, TIER1, TIER2`                   | 作用域枚举       |
| C#                    | `Unknown, Tier1, Tier2`                   | 作用域枚举       |
| Swift                 | `unknown, tier1, tier2`                   | 作用域枚举       |
| Dart                  | `unknown, tier1, tier2`                   | 作用域枚举       |
| Scala                 | `Unknown, Tier1, Tier2`                   | 作用域枚举       |
| Kotlin                | `UNKNOWN, TIER1, TIER2`                   | 作用域枚举       |

仅当去除前缀后的内容是合法标识符时才会执行。例如，`DEVICE_TIER_1` 会保持不变，因为 `1` 不是合法标识符。

语法：

```
enum_def     := 'enum' IDENTIFIER [type_options] '{' enum_body '}'
type_options := '[' type_option (',' type_option)* ']'
type_option  := IDENTIFIER '=' option_value
enum_body    := (reserved_stmt | enum_value)*
reserved_stmt := 'reserved' reserved_items ';'
enum_value   := IDENTIFIER '=' INTEGER ';'
```

规则：

- enum 名称在文件中必须唯一
- 每个枚举值都必须显式指定整数
- 同一个 enum 中的整数值必须唯一，不允许别名
- enum 的类型 ID（`[id=100]`）是可选的，但建议在跨语言场景中使用

完整示例：

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

## Message 定义

message 定义包含带类型字段的结构化数据类型。

### 基本语法

```protobuf
message Person {
    string name = 1;
    int32 age = 2;
}
```

### 显式类型 ID

```protobuf
message Person [id=101] {
    string name = 1;
    int32 age = 2;
}
```

### 无显式类型 ID

```protobuf
message Person {  // Auto-generated when enable_auto_type_id = true
    string name = 1;
    int32 age = 2;
}
```

### 语言映射

| 语言                  | 实现形式                           |
| --------------------- | ---------------------------------- |
| Java                  | 带 getter/setter 的 POJO           |
| Python                | `@dataclass` 类                    |
| Go                    | 包含导出字段的 struct              |
| Rust                  | 带 `#[derive(ForyStruct)]` 的 struct |
| C++                   | 带 `FORY_STRUCT` 宏的 struct       |
| C#                    | 带 `[ForyStruct]` 的类             |
| JavaScript/TypeScript | `export interface` 声明            |
| Swift                 | `@ForyStruct` struct 或 class      |
| Dart                  | `@ForyStruct` `final class`        |
| Scala                 | Scala 3 `case class` 或 class      |
| Kotlin                | `data class` 或 class              |

类型 ID 控制 message、union 和 enum 的跨语言注册。自动生成、alias 和冲突处理详见 [类型 ID](#type-ids)。

### 预留字段

```protobuf
message User {
    reserved 2, 15, 9 to 11;       // Reserved field numbers
    reserved "old_field", "temp";  // Reserved field names
    string id = 1;
    string name = 3;
}
```

### message 类型选项

message 级选项写在 message 名称后的 `[]` 中：

```protobuf
message User [deprecated=true] {
    string id = 1;
    string name = 2;
}
```

FDL 不支持在 message 或 enum 内部使用 `option ...;` 语句。

语法：

```
message_def  := 'message' IDENTIFIER [type_options] '{' message_body '}'
type_options := '[' type_option (',' type_option)* ']'
type_option  := IDENTIFIER '=' option_value
message_body := (reserved_stmt | nested_type | field_def)*
nested_type  := enum_def | message_def | union_def
```

类型 ID 遵循 [类型 ID](#type-ids) 中的规则。

## 嵌套类型

message 可以包含嵌套的 message、enum 和 union，适合定义与父 message 紧密相关的类型。

### 嵌套 message

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

### 嵌套 enum

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

### 限定类型名

其他 message 可以通过限定名称（`Parent.Child`）引用嵌套类型：

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

### 深层嵌套类型

嵌套可以有多层：

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

### 各语言生成形态

| 语言                  | 嵌套类型生成方式                                                             |
| --------------------- | ---------------------------------------------------------------------------- |
| Java                  | 静态内部类（`SearchResponse.Result`）                                        |
| Python                | dataclass 中的嵌套类                                                         |
| Go                    | 下划线连接的扁平 struct（`SearchResponse_Result`，可配置为 camelcase）       |
| Rust                  | 嵌套模块（`search_response::Result`）                                        |
| C++                   | 嵌套类（`SearchResponse::Result`）                                           |
| C#                    | 嵌套类（`SearchResponse.Result`）                                            |
| JavaScript/TypeScript | 扁平名称（`Result`）                                                         |
| Swift                 | 嵌套命名空间包装类型或扁平名称                                               |
| Dart                  | 带下划线的扁平类（`SearchResponse_Result`）                                  |
| Scala                 | 嵌套 companion/object 作用域                                                 |
| Kotlin                | 扁平的生成名称                                                               |

Go 默认使用下划线分隔嵌套名称；设置 `option go_nested_type_style = "camelcase";` 可改为拼接名称。Rust 会为嵌套类型生成嵌套模块。

### 嵌套规则

- 嵌套类型名在其父作用域内必须唯一
- 嵌套类型可以拥有自己的类型 ID
- 数字类型 ID 必须全局唯一，包括嵌套类型；自动生成和冲突处理详见 [类型 ID](#type-ids)
- 在一个 message 内，可以使用简单名称引用其中的嵌套类型
- 在 message 外部，使用限定名称（`Parent.Child`）

## Union 定义

union 表示同一时间只保存多个 case 类型之一的值。

### 基本语法

```protobuf
union Animal [id=106] {
    Dog dog = 1;
    Cat cat = 2;
}
```

### 在 message 中使用 union

```protobuf
message Person [id=100] {
    Animal pet = 1;
    optional Animal favorite_pet = 2;
}
```

### 规则

- case ID 必须非负，且在 union 中唯一
- 特定语言的 unknown-case 标记只用于选择承载类型，不会向 Schema case 表中增加条目
- case 不能使用 `optional` 或 `ref`
- union case 支持载荷元数据对应的字段选项，例如标量编码和集合元素元数据
- case 类型可以是基本类型、enum、message 或其他具名类型
- union 类型 ID 遵循 [类型 ID](#type-ids) 中的规则

语法：

```
union_def  := 'union' IDENTIFIER [type_options] '{' union_field* '}'
union_field := ['repeated'] field_type IDENTIFIER '=' INTEGER [field_options] ';'
```

## Service 定义

service 在 Fory IDL 中定义远程过程调用（RPC）方法契约。service 是可选的：包含 service 的 Schema 仍会生成常规数据模型类型；仅当编译器为 Java、Python、Go、Rust、C#、Dart、Scala、Kotlin 和 JavaScript 等受支持语言运行时传入 `--grpc`，才生成 gRPC service 代码。JavaScript 浏览器端 gRPC-Web client 通过 `--grpc-web` 生成。

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

第一个方法使用 message 作为请求和响应类型；第二个方法直接使用 union 作为请求和响应类型，Fory IDL 支持这种用法。

### Streaming RPC

在请求类型、响应类型或两者之前加上 `stream`：

```protobuf
service PetDirectory {
    rpc GetPet (GetPetRequest) returns (PetRecord);              // unary
    rpc WatchPets (GetPetRequest) returns (stream PetRecord);    // server streaming
    rpc ImportPets (stream PetRecord) returns (PetRecord);       // client streaming
    rpc ChatPets (stream Animal) returns (stream Animal);        // bidirectional streaming
}
```

### RPC 类型规则

- 请求和响应类型必须引用具名 message 或 union 类型。
- enum、基本类型、collection、map 和 array 不能直接作为 RPC 请求或响应类型。在 service 契约需要这些值时，请用 message 包装。
- 生成的 gRPC 配套代码使用 Fory 序列化每个 RPC 载荷。编译或运行这些配套代码的应用需自行提供 gRPC 依赖，例如 grpc-java、grpc-kotlin、`grpcio`、grpc-go、Rust `tonic` 与 `bytes`、Scala grpc-java API、`@grpc/grpc-js`、`grpc-web`、C# `Grpc.Core.Api` 加 server 或 client package，以及 Dart `package:grpc`。Python 配套代码默认使用 `grpc.aio`，也可通过 `--grpc-python-mode=sync` 生成同步模式代码。

语法：

```
service_def := 'service' IDENTIFIER '{' rpc_method* '}'
rpc_method  := 'rpc' IDENTIFIER '(' ['stream'] named_type ')'
               'returns' '(' ['stream'] named_type ')' ';'
```

## 字段定义

字段定义 message 的属性。

### 基本语法

```protobuf
field_type field_name = field_number;
```

### 带修饰符语法

```protobuf
optional list<string> tags = 1;  // Nullable list
list<optional string> tags = 2;  // Elements may be null
list<ref Node> nodes = 3;        // Elements tracked as references
```

语法：

```
field_def    := [modifiers] field_type IDENTIFIER '=' INTEGER ';'
modifiers    := { 'optional' | 'ref' }
field_type   := primitive_type | named_type | list_type | array_type | map_type
list_type    := 'list' '<' { 'optional' | 'ref' | scalar_encoding } field_type '>'
array_type   := 'array' '<' array_element_type '>'
```

`list` 前的 `optional` 作用于集合字段。不能将 `optional` 直接用于 `any`；
应使用 `any`、`list<any>` 或 `map<K, any>`，不要使用 `optional any`、
`list<optional any>` 或 `map<K, optional any>`。`ref` 只适用于具名的 message/union
字段；集合内容应使用 `list<ref T>` 或 `map<K, ref V>`。`repeated` 是 `list` 的别名。

### 字段修饰符

#### `optional`

将字段标记为可空：

```protobuf
message User {
    string name = 1;           // Required, non-null
    optional string email = 2; // Nullable
}
```

不要将 `optional` 或 `[nullable = true]` 直接用于 `any`。编译器会拒绝
`optional any`、`any [nullable = true]`、`list<optional any>` 和
`map<K, optional any>`；请改用 `any`、`list<any>` 或 `map<K, any>`。

**生成代码：**

| 语言                  | 非 optional        | optional                          |
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

默认值：

| 类型              | 默认值                |
| ----------------- | --------------------- |
| 非 optional 类型  | 对应语言的默认值      |
| optional 类型     | `null`/`None`/`nil`   |

#### `ref`

开启引用跟踪，用于共享对象与循环结构：

```protobuf
message Node {
    string value = 1;
    ref Node parent = 2;     // Can point to shared object
    list<ref Node> children = 3;
}
```

适用场景：

- 共享对象（同一对象被多次引用）
- 循环引用（存在环的对象图）
- 带父节点指针的树形结构

**生成代码：**

| 语言                  | 不使用 `ref`     | 使用 `ref`                                  |
| --------------------- | ---------------- | ------------------------------------------- |
| Java                  | `Node parent`    | 带 `@Ref` 的 `Node parent`                  |
| Python                | `parent: Node`   | `parent: Node = pyfory.field(ref=True)`     |
| Go                    | `Parent Node`    | 带 `fory:"ref"` 的 `Parent *Node`           |
| Rust                  | `parent: Node`   | `parent: Arc<Node>`                         |
| C++                   | `Node parent`    | `std::shared_ptr<Node> parent`              |
| C#                    | `Node parent`    | 启用引用跟踪的 `Node? parent`               |
| JavaScript/TypeScript | `parent: Node`   | `parent: Node`（不区分 ref）                |
| Swift                 | `Node parent`    | 启用引用跟踪的 class reference              |
| Dart                  | `Node parent`    | 带 `@ForyField(ref: true)` 的 `Node parent` |
| Scala                 | `parent: Node`   | `@Ref parent: Node`                         |
| Kotlin                | `parent: Node`   | `@Ref parent: Node?`                        |

Rust 对启用引用跟踪的字段默认使用 `Arc` 和 `ArcWeak`。生成的 Rust 类型必须使用单线程 `Rc` 或 `RcWeak` 承载类型时，可配置 `ref(thread_safe=false)`。该设置只影响 Rust 代码生成所选的承载类型，不改变编码格式，也不会使被引用值本身具备线程安全性。Protobuf 选项语法详见 [Protocol Buffers IDL Support](protobuf-idl.md#field-level-options)。

Rust 指针承载类型映射：

| Fory IDL                                        | Rust type       |
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

**生成代码：**

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

修饰符可以组合使用：

```fdl
message Example {
    optional list<string> tags = 1;  // Nullable list
    list<optional string> aliases = 2; // Elements may be null
    list<ref Node> children = 3;       // Elements tracked as references
    optional ref User owner = 4;       // Nullable tracked reference
}
```

`list` 前的 `optional` 作用于字段或集合本身。不能在 `list` 或 `map` 前使用 `ref`；应将 `ref` 放在元素或 value 类型中。`repeated` 是 `list` 的别名。

List 修饰符映射：

| Fory IDL                | Java                               | Python                | Go                      | Rust                  | C++                                       | Dart                                                          | Scala                  |
| ----------------------- | ---------------------------------- | --------------------- | ----------------------- | --------------------- | ----------------------------------------- | ------------------------------------------------------------- | ---------------------- |
| `optional list<string>` | `@Nullable List<String>`           | `Optional[List[str]]` | `[]string` + `nullable` | `Option<Vec<String>>` | `std::optional<std::vector<std::string>>` | `List<String>?`                                               | `Option[List[String]]` |
| `list<optional string>` | `List<String>`（元素可空）         | `List[Optional[str]]` | `[]*string`             | `Vec<Option<String>>` | `std::vector<std::optional<std::string>>` | `List<String?>`                                               | `List[Option[String]]` |
| `list<ref User>`        | `List<@Ref User>`                  | `List[User]`          | `[]*User` + `ref=false` | `Vec<Arc<User>>`      | `std::vector<std::shared_ptr<User>>`      | `List<User>` + `@ListField(element: DeclaredType(ref: true))` | `List[User @Ref]`      |

在 Fory IDL 中使用 `ref(thread_safe=false)`（或在 Protobuf 中使用 `[(fory).thread_safe_pointer = false]`），可让 Rust 生成 `Rc` 而非 `Arc`。

## 字段号

每个字段都必须有唯一的正整数标识符：

```protobuf
message Example {
    string first = 1;
    string second = 2;
    string third = 3;
}
```

规则与最佳实践：

- 字段号在一个 message 内必须唯一。
- 字段号必须是正整数。
- 允许留出空号；删除字段后保留空号会很有用。
- 建议从 `1` 开始顺序编号。
- 不要把已删除字段的编号重新用于其他字段。

## Type System {#type-system}

Fory IDL 为基本类型、具名类型和集合提供跨语言类型系统。字段修饰符（`optional`、`ref`）控制可空性与引用跟踪，`list<T>` 和 `array<T>` 用于选择集合 Schema 类型（详见[字段修饰符](#字段修饰符)）。

本节的简表列出常见的生成承载类型。包括 C#、Swift、Dart、Scala 和 Kotlin 在内的完整 1.0 语言支持范围，请参阅[跨语言类型映射规范](../specification/xlang_type_mapping.md)。

### Primitive Types

| 类型        | 说明                               | 大小   |
| ----------- | ---------------------------------- | ------ |
| `bool`      | 布尔值                             | 1 字节 |
| `int8`      | 8 位有符号整数                     | 1 字节 |
| `int16`     | 16 位有符号整数                    | 2 字节 |
| `int32`     | 32 位有符号整数，默认 varint       | 4 字节 |
| `int64`     | 64 位有符号整数，默认 PVL varint   | 8 字节 |
| `uint8`     | 8 位无符号整数                     | 1 字节 |
| `uint16`    | 16 位无符号整数                    | 2 字节 |
| `uint32`    | 32 位无符号整数，默认 varint       | 4 字节 |
| `uint64`    | 64 位无符号整数，默认 PVL varint   | 8 字节 |
| `float16`   | IEEE 754 binary16 浮点数           | 2 字节 |
| `bfloat16`  | Brain floating point               | 2 字节 |
| `float32`   | 32 位浮点数                        | 4 字节 |
| `float64`   | 64 位浮点数                        | 8 字节 |
| `string`    | UTF-8 字符串                       | 变长   |
| `bytes`     | 二进制数据                         | 变长   |
| `date`      | 日历日期                           | 变长   |
| `timestamp` | 带时区的日期和时间                 | 变长   |
| `duration`  | 时间间隔                           | 变长   |
| `decimal`   | 十进制数值                         | 变长   |
| `any`       | 动态值（具体类型）                 | 变长   |

#### Boolean

`bool` 表示布尔值。

| 语言       | 类型      | 说明 |
| ---------- | --------- | ---- |
| Java       | `boolean` / `Boolean` | 基本类型或装箱类型 |
| Python     | `bool`    |      |
| Go         | `bool`    |      |
| Rust       | `bool`    |      |
| C++        | `bool`    |      |
| JavaScript | `boolean` |      |
| Dart       | `bool`    |      |

#### Integer Types

Fory IDL 提供定长有符号整数（32/64 位整数默认使用 varint 编码）：

| Fory IDL 类型 | 大小  | 范围             |
| ------------- | ----- | ---------------- |
| `int8`        | 8 位  | -128 到 127      |
| `int16`       | 16 位 | -32,768 到 32,767 |
| `int32`       | 32 位 | -2^31 到 2^31 - 1 |
| `int64`       | 64 位 | -2^63 到 2^63 - 1 |

**有符号整数映射：**

| Fory IDL | Java    | Python         | Go      | Rust  | C++       | JavaScript         | Dart    |
| -------- | ------- | -------------- | ------- | ----- | --------- | ------------------ | ------- |
| `int8`   | `byte`  | `pyfory.Int8`  | `int8`  | `i8`  | `int8_t`  | `number`           | `int`   |
| `int16`  | `short` | `pyfory.Int16` | `int16` | `i16` | `int16_t` | `number`           | `int`   |
| `int32`  | `int`   | `pyfory.Int32` | `int32` | `i32` | `int32_t` | `number`           | `int`   |
| `int64`  | `long`  | `pyfory.Int64` | `int64` | `i64` | `int64_t` | `bigint \| number` | `Int64` |

Fory IDL 也提供定长无符号整数（32/64 位整数默认使用 varint 编码）：

| Fory IDL | 大小  | 范围           |
| -------- | ----- | -------------- |
| `uint8`  | 8 位  | 0 到 255       |
| `uint16` | 16 位 | 0 到 65,535    |
| `uint32` | 32 位 | 0 到 2^32 - 1  |
| `uint64` | 64 位 | 0 到 2^64 - 1  |

**无符号整数的语言映射：**

| Fory IDL | Java    | Python          | Go       | Rust  | C++        | JavaScript         | Dart     |
| -------- | ------- | --------------- | -------- | ----- | ---------- | ------------------ | -------- |
| `uint8`  | `short` | `pyfory.UInt8`  | `uint8`  | `u8`  | `uint8_t`  | `number`           | `int`    |
| `uint16` | `int`   | `pyfory.UInt16` | `uint16` | `u16` | `uint16_t` | `number`           | `int`    |
| `uint32` | `long`  | `pyfory.UInt32` | `uint32` | `u32` | `uint32_t` | `number`           | `int`    |
| `uint64` | `long`  | `pyfory.UInt64` | `uint64` | `u64` | `uint64_t` | `bigint \| number` | `Uint64` |

#### Integer Encoding Modifiers

Fory IDL 默认对 32/64 位整数使用变长编码。如需其他编码格式，请添加标量编码修饰符：

| 修饰符   | 适用类型                             | 说明               |
| -------- | ------------------------------------ | ------------------ |
| `varint` | `int32`、`int64`、`uint32`、`uint64` | 默认编码的显式写法 |
| `fixed`  | `int32`、`int64`、`uint32`、`uint64` | 定长小端序         |
| `tagged` | `int64`、`uint64`                    | 带 tag 的 64 位编码 |

修饰符属于标量类型表达式，因此可用在嵌套的 list 和 map 中：

```protobuf
fixed int32 id = 1;
list<fixed int32> offsets = 2;
map<string, tagged uint64> counters = 3;
```

带下划线的整数编码名称不是 FDL 类型名。

#### Floating-Point Types

| Fory IDL 类型 | 大小  | 精度          |
| ------------- | ----- | ------------- |
| `float32`     | 32 位 | 约 7 位数字   |
| `float64`     | 64 位 | 约 15-16 位数字 |

| Fory IDL   | Java       | Python annotation/value     | Go                  | Rust       | C++                | JavaScript/TypeScript | Dart      |
| ---------- | ---------- | --------------------------- | ------------------- | ---------- | ------------------ | --------------------- | --------- |
| `float16`  | `Float16`  | `pyfory.Float16` / `float`  | `float16.Float16`   | `Float16`  | `fory::float16_t`  | `number`              | `double`  |
| `bfloat16` | `BFloat16` | `pyfory.BFloat16` / `float` | `bfloat16.BFloat16` | `BFloat16` | `fory::bfloat16_t` | `number`              | `double`  |
| `float32`  | `float`    | `pyfory.Float32`            | `float32`           | `f32`      | `float`            | `number`              | `Float32` |
| `float64`  | `double`   | `pyfory.Float64`            | `float64`           | `f64`      | `double`           | `number`              | `double`  |

#### String Type

`string` 使用 UTF-8 文本语义。

| 语言       | 类型          | 说明                 |
| ---------- | ------------- | -------------------- |
| Java       | `String`      | 不可变               |
| Python     | `str`         |                      |
| Go         | `string`      | 不可变               |
| Rust       | `String`      | 所有权字符串，堆分配 |
| C++        | `std::string` |                      |
| JavaScript | `string`      |                      |
| Dart       | `String`      |                      |

#### Bytes Type

`bytes` 用于原始二进制载荷。

| 语言       | 类型                   | 说明   |
| ---------- | ---------------------- | ------ |
| Java       | `byte[]`               |        |
| Python     | `bytes`                | 不可变 |
| Go         | `[]byte`               |        |
| Rust       | `Vec<u8>`              |        |
| C++        | `std::vector<uint8_t>` |        |
| JavaScript | `Uint8Array`           |        |
| Dart       | `Uint8List`            |        |

#### Temporal Types

##### Date

`date` 表示日期（不含时区时间部分）。

| 语言       | 类型                  | 说明                                                                 |
| ---------- | --------------------- | -------------------------------------------------------------------- |
| Java       | `java.time.LocalDate` |                                                                      |
| Python     | `datetime.date`       |                                                                      |
| Go         | `time.Time`           | 会忽略时间部分                                                       |
| Rust       | `fory::Date`          | 设置 `rust_use_chrono_temporal_types = true` 可生成 `chrono::NaiveDate` |
| C++        | `fory::Date`          |                                                                      |
| JavaScript | `Date`                |                                                                      |
| Dart       | `LocalDate`           | Fory package 提供的类型                                              |

##### Timestamp

`timestamp` 表示时间点（跨语言应统一时间语义与精度预期）。

| 语言       | 类型                  | 说明                                                                     |
| ---------- | --------------------- | ------------------------------------------------------------------------ |
| Java       | `java.time.Instant`   | 基于 UTC                                                                 |
| Python     | `datetime.datetime`   |                                                                          |
| Go         | `time.Time`           |                                                                          |
| Rust       | `fory::Timestamp`     | 设置 `rust_use_chrono_temporal_types = true` 可生成 `chrono::NaiveDateTime` |
| C++        | `fory::Timestamp`     |                                                                          |
| JavaScript | `Date`                |                                                                          |
| Dart       | `Timestamp`           | Fory package 提供的类型                                                  |

##### Duration

`duration` 表示一段时间长度。

| 语言   | 类型                 | 说明                                                                  |
| ------ | -------------------- | --------------------------------------------------------------------- |
| Java   | `java.time.Duration` |                                                                       |
| Python | `datetime.timedelta` |                                                                       |
| Go     | `time.Duration`      |                                                                       |
| Rust   | `fory::Duration`     | 设置 `rust_use_chrono_temporal_types = true` 可生成 `chrono::Duration` |
| C++    | `fory::Duration`     |                                                                       |
| Dart   | `Duration`           |                                                                       |

#### Any

| 语言                  | 类型                         | 说明                 |
| --------------------- | ---------------------------- | -------------------- |
| Java                  | `Object`                     | 写入具体值的类型元信息 |
| Python                | `Any`                        | 写入具体值的类型元信息 |
| Go                    | `any`                        | 写入具体值的类型元信息 |
| Rust                  | `Arc<dyn Any + Send + Sync>` | 写入具体值的类型元信息 |
| C++                   | `std::any`                   | 写入具体值的类型元信息 |
| JavaScript/TypeScript | `any`                        | 写入具体值的类型元信息 |
| Dart                  | `Object?`                    | 写入具体值的类型元信息 |

示例：

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

`Envelope.payload` 生成类型：

| 语言                  | 生成字段类型                         |
| --------------------- | ------------------------------------ |
| Java                  | `Object payload`                     |
| Python                | `payload: Any`                       |
| Go                    | `Payload any`                        |
| Rust                  | `payload: Arc<dyn Any + Send + Sync>` |
| C++                   | `std::any payload`                   |
| JavaScript/TypeScript | `payload: any`                       |
| Dart                  | `Object? payload`                    |

注意：

- `any` 始终写入空值标记（与 `nullable` 相同），因为值可能为空。
- 不支持将 `optional` 和 `[nullable = true]` 直接用于 `any`；请使用 `any`、`list<any>` 或 `map<K, any>`，不要使用 `optional any`、`list<optional any>` 或 `map<K, optional any>`。
- 动态值只能是 `bool`、`string`、enum、message 和 union。其他基本类型（数字、bytes、日期/时间）以及 list/map 不受支持；请将其包装在 message 中或改用显式字段。
- `any` 字段（包括 list/map value）不能使用 `ref`。如果需要引用跟踪，请用 message 包装 `any`。
- 具体类型必须在目标语言的 Schema/IDL 注册中登记；遇到未知类型时反序列化会失败。

### Named Types

可以按名称引用其他 message、enum 或 union：

```protobuf
enum Status { ... }
message User { ... }

message Order {
    User customer = 1;    // Reference to User message
    Status status = 2;    // Reference to Status enum
}
```

### Collection Types

#### List (`list`)

列表字段使用 `list<...>` 类型，`repeated` 是其别名。修饰符组合和语言映射详见[字段修饰符](#字段修饰符)。

嵌套集合是否可用取决于目标语言的实现能力。C++ 生成器支持 `list<list<...>>`、`list<map<...>>` 和 `map<..., list<...>>` 等嵌套集合定义；尚未实现嵌套字段定义的目标语言仍会拒绝这些写法。若需让 Schema 在所有目标语言中可移植，请使用 message 包装。

#### Array (`array`)

`array<T>` 用于动态长度的稠密数值数据。它与 `list<T>` 是不同的 Schema 类型，使用紧凑基本类型数组编码载荷。

```protobuf
message Embedding {
    array<int32> indices = 1;
    array<float32> values = 2;
    array<uint8> pixels = 3;
}
```

`array<T>` 只接受 `bool`、整数和浮点数元素域，不接受 `optional`、`ref`、具名/对象类型、`string`、`bytes`、map 或 `array<fixed int32>` 等标量整数编码修饰符；array 契约规定元素始终使用定长编码。

生成的承载类型因语言而异，但 Schema 类型保持一致：

| IDL Schema        | Java 默认类型                 | Python 默认类型         | Dart 默认类型   | JavaScript/TypeScript    |
| ----------------- | ----------------------------- | ----------------------- | --------------- | ------------------------ |
| `list<bool>`      | `BoolList` / `List<Boolean>`  | `List[bool]`            | `List<bool>`    | `Type.list(Type.bool())` |
| `array<bool>`     | `boolean[]`                   | `pyfory.BoolArray`      | `BoolList`      | `Type.boolArray()`       |
| `array<int8>`     | `@Int8Type byte[]`            | `pyfory.Int8Array`      | `Int8List`      | `Type.int8Array()`       |
| `array<int16>`    | `short[]`                     | `pyfory.Int16Array`     | `Int16List`     | `Type.int16Array()`      |
| `array<int32>`    | `int[]`                       | `pyfory.Int32Array`     | `Int32List`     | `Type.int32Array()`      |
| `array<int64>`    | `long[]`                      | `pyfory.Int64Array`     | `Int64List`     | `Type.int64Array()`      |
| `array<uint8>`    | `@UInt8Type byte[]`           | `pyfory.UInt8Array`     | `Uint8List`     | `Type.uint8Array()`      |
| `array<uint16>`   | `@UInt16Type short[]`         | `pyfory.UInt16Array`    | `Uint16List`    | `Type.uint16Array()`     |
| `array<uint32>`   | `@UInt32Type int[]`           | `pyfory.UInt32Array`    | `Uint32List`    | `Type.uint32Array()`     |
| `array<uint64>`   | `@UInt64Type long[]`          | `pyfory.UInt64Array`    | `Uint64List`    | `Type.uint64Array()`     |
| `array<float16>`  | `Float16Array`                | `pyfory.Float16Array`   | `Float16List`   | `Type.float16Array()`    |
| `array<bfloat16>` | `BFloat16Array`               | `pyfory.BFloat16Array`  | `Bfloat16List`  | `Type.bfloat16Array()`   |
| `array<float32>`  | `float[]`                     | `pyfory.Float32Array`   | `Float32List`   | `Type.float32Array()`    |
| `array<float64>`  | `double[]`                    | `pyfory.Float64Array`   | `Float64List`   | `Type.float64Array()`    |

手写 Dart 模型中，`array<bool>` 需要使用 `BoolList` 加 `@ArrayField(element: BoolType())`，或 `@ForyField(type: ArrayType(element: BoolType()))`；`List<bool>` 仍表示 `list<bool>`。手写 Java 模型中，无符号基本类型数组在元素类型上使用 type-use annotation，例如 `private @UInt32Type int[] ids;`。生成的 Kotlin 模型中，`array<int8>` 使用 `@ArrayType ByteArray`，嵌套集合和 map 中也一样。

#### Map

使用具名 key 和 value 的 map：

```protobuf
message Config {
    map<string, string> properties = 1;
    map<string, int32> counts = 2;
    map<int32, User> users = 3;
}
```

| Fory IDL             | Java                   | Python            | Go                 | Rust                    | C++                                        | JavaScript/TypeScript | Dart               |
| -------------------- | ---------------------- | ----------------- | ------------------ | ----------------------- | ------------------------------------------ | --------------------- | ------------------ |
| `map<string, int32>` | `Map<String, Integer>` | `Dict[str, int]`  | `map[string]int32` | `HashMap<String, i32>`  | `std::unordered_map<std::string, int32_t>` | `Map<string, number>` | `Map<String, int>` |
| `map<string, User>`  | `Map<String, User>`    | `Dict[str, User]` | `map[string]User`  | `HashMap<String, User>` | `std::unordered_map<std::string, User>`    | `Map<string, User>`   | `Map<String, User>` |

key 类型限制：

- `string`（最常用）
- `bool`
- 整数类型（`int8`、`int16`、`int32`、`int64`、`uint8`、`uint16`、`uint32`、`uint64`）
- 时间标量类型（`date`、`timestamp`、`duration`）
- enum

map key 不支持 `any`、二进制 `bytes`、浮点数、`decimal`、message、union、`list<T>`、`array<T>` 或嵌套 `map<K, V>`。请把这些类型放在 map value 中，或使用以可移植标量或 enum 为 key 的 message 包装。

### Type Compatibility Matrix

下表列出跨语言安全的类型转换：

| From -> To | bool | int8 | int16 | int32 | int64 | float32 | float64 | string |
| ---------- | ---- | ---- | ----- | ----- | ----- | ------- | ------- | ------ |
| bool       | Y    | Y    | Y     | Y     | Y     | -       | -       | -      |
| int8       | -    | Y    | Y     | Y     | Y     | Y       | Y       | -      |
| int16      | -    | -    | Y     | Y     | Y     | Y       | Y       | -      |
| int32      | -    | -    | -     | Y     | Y     | -       | Y       | -      |
| int64      | -    | -    | -     | -     | Y     | -       | -       | -      |
| float32    | -    | -    | -     | -     | -     | Y       | Y       | -      |
| float64    | -    | -    | -     | -     | -     | -       | Y       | -      |
| string     | -    | -    | -     | -     | -     | -       | -       | Y      |

Y 表示安全转换，- 表示不建议转换。

### Best Practices

- 大多数整数优先使用 `int32`，数值很大时使用 `int64`。
- 文本数据（UTF-8）使用 `string`，二进制数据使用 `bytes`。
- 只有字段确实可能缺失时才使用 `optional`。
- 只有需要共享引用或循环引用时才使用 `ref`。
- 有序序列优先使用 `list`，键值查找使用 `map`。

## Type IDs

类型 ID 用于高效的跨语言序列化，适用于 message、union 和 enum。当 `enable_auto_type_id = true`（默认）且省略 `id` 时，编译器通过 `MurmurHash3(utf8(package.type_name))`（32 位）自动生成类型 ID，并将其注解到生成代码中。当 `enable_auto_type_id = false` 时，没有显式 ID 的类型改为通过命名空间和名称注册。编译器会在当前文件及所有 import 中检测冲突；发生冲突时，会报告错误并要求显式配置 `id` 或 `alias`。

对于 Java 和 Scala 生成代码，嵌套名称注册会把父路径追加到命名空间，同时保留嵌套类型的简单名称。例如，`package demo; message Envelope { message Payload { ... } }` 在这些 JVM 目标语言中会把 `Payload` 注册为命名空间 `demo.Envelope`、类型名 `Payload`。

```protobuf
enum Color [id=100] { ... }
message User [id=101] { ... }
union Event [id=102] { ... }
```

enum 类型 ID 仍是可选的；若省略且 `enable_auto_type_id = true`，则使用同样的哈希算法自动生成。

### 显式类型 ID

```protobuf
message User [id=101] { ... }
message User [id=101, deprecated=true] { ... }  // Multiple options
```

### 无显式类型 ID

```protobuf
message Config { ... }  // Auto-generated when enable_auto_type_id = true
```

可设置 `[alias="..."]` 来改变哈希输入，而无需重命名类型。

### 实践说明

- 类型省略 `id` 且 `enable_auto_type_id = true` 时，Fory 使用 `MurmurHash3(utf8(package.type_name))`（32 位）生成 ID。
- package alias 和类型 alias 会改变哈希输入，可在不重命名公共类型的情况下解决哈希冲突。
- 较小 varint 范围（`0-127`）内的手动 ID 在编码格式中更紧凑；自动 ID 通常更大，一般占用 4-5 字节。

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

Protobuf 专用扩展选项与 `(fory).` 语法详见 [Protocol Buffers IDL Support](protobuf-idl.md#fory-extension-options-protobuf)。

## 语法摘要

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
