---
title: 编译器 CLI
sidebar_position: 4
id: cli
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

## 命令行界面

### 基本用法

```bash
foryc [OPTIONS] FILES...
```

```bash
foryc --scan-generated [OPTIONS]
```

### 选项

编译选项：

| 选项                                  | 说明                                             | 默认值        |
| ------------------------------------- | ------------------------------------------------ | ------------- |
| `--lang`                              | 以逗号分隔的目标语言                             | `all`         |
| `--output`, `-o`                      | 输出目录                                         | `./generated` |
| `-I`, `--proto_path`, `--import_path` | 向导入搜索路径添加目录（可重复指定）             | （无）        |
| `--java_out=DST_DIR`                  | 在 DST_DIR 中生成 Java 代码                      | （无）        |
| `--python_out=DST_DIR`                | 在 DST_DIR 中生成 Python 代码                    | （无）        |
| `--cpp_out=DST_DIR`                   | 在 DST_DIR 中生成 C++ 代码                       | （无）        |
| `--go_out=DST_DIR`                    | 在 DST_DIR 中生成 Go 代码                        | （无）        |
| `--rust_out=DST_DIR`                  | 在 DST_DIR 中生成 Rust 代码                      | （无）        |
| `--csharp_out=DST_DIR`                | 在 DST_DIR 中生成 C# 代码                        | （无）        |
| `--javascript_out=DST_DIR`            | 在 DST_DIR 中生成 JavaScript/TypeScript 代码     | （无）        |
| `--swift_out=DST_DIR`                 | 在 DST_DIR 中生成 Swift 代码                     | （无）        |
| `--dart_out=DST_DIR`                  | 在 DST_DIR 中生成 Dart 代码                      | （无）        |
| `--scala_out=DST_DIR`                 | 在 DST_DIR 中生成 Scala 3 代码                   | （无）        |
| `--kotlin_out=DST_DIR`                | 在 DST_DIR 中生成 Kotlin 代码                    | （无）        |
| `--go_nested_type_style`              | Go 嵌套类型命名风格：`camelcase` 或 `underscore` | `underscore`  |
| `--swift_namespace_style`             | Swift 命名空间风格：`enum` 或 `flatten`          | `enum`        |
| `--emit-fdl`                          | 输出转换后的 FDL（用于非 FDL 输入）              | `false`       |
| `--emit-fdl-path`                     | 将转换后的 FDL 写入此路径（文件或目录）          | （标准输出）  |
| `--grpc`                              | 为支持的输出生成 gRPC 服务配套代码               | `false`       |
| `--grpc-python-mode=MODE`             | Python gRPC 模式：`async` 或 `sync`              | `async`       |
| `--grpc-web`                          | 生成 JavaScript gRPC-Web 客户端配套代码          | `false`       |

编译器支持使用 Schema 级文件选项控制特定语言的生成行为。
当 `go_nested_type_style` 和 `swift_namespace_style` 同时出现在 CLI 与 Schema 中时，CLI 标志优先。
Rust 时间类型代码生成没有 CLI 标志：在 Schema 中设置
`option rust_use_chrono_temporal_types = true;`，即可生成
`chrono::NaiveDate`、`chrono::NaiveDateTime` 和 `chrono::Duration`，而不是默认的
`fory::Date`、`fory::Timestamp` 和 `fory::Duration`。编译这些基于 chrono 的 Rust 生成代码时，
crate 必须依赖 `chrono` 并启用 Fory 的 `chrono` feature。

扫描选项（与 `--scan-generated` 一起使用）：

| 选项         | 说明                   | 默认值  |
| ------------ | ---------------------- | ------- |
| `--root`     | 要扫描的根目录         | `.`     |
| `--relative` | 输出相对于根目录的路径 | `false` |
| `--delete`   | 删除匹配的生成文件     | `false` |
| `--dry-run`  | 仅扫描并输出，不删除   | `false` |

### 扫描生成文件

使用 `--scan-generated` 查找 `foryc` 生成的文件。扫描器会递归遍历目录树，
跳过 `build/`、`target/` 和隐藏目录，并在发现每个生成文件时输出其路径。

```bash
# Scan current directory
foryc --scan-generated

# Scan a specific root
foryc --scan-generated --root ./src

# Print paths relative to the scan root
foryc --scan-generated --root ./src --relative

# Delete scanned generated files
foryc --scan-generated --root ./src --delete

# Dry-run (scan and print only)
foryc --scan-generated --root ./src --dry-run
```

### 示例

**为所有语言编译：**

```bash
foryc schema.fdl
```

**为选定的语言子集编译：**

```bash
foryc schema.fdl --lang java,python,csharp,javascript,swift,dart,kotlin
```

**指定输出目录：**

```bash
foryc schema.fdl --output ./src/generated
```

**编译多个文件：**

```bash
foryc user.fdl order.fdl product.fdl --output ./generated
```

**编译包含服务定义的简单 Schema（Java + Python + Go + Rust + C# + Dart + Scala + Kotlin + JavaScript 模型）：**

```bash
foryc compiler/examples/service.fdl --java_out=./generated/java --python_out=./generated/python --go_out=./generated/go --rust_out=./generated/rust --csharp_out=./generated/csharp --dart_out=./generated/dart --scala_out=./generated/scala --kotlin_out=./generated/kotlin --javascript_out=./generated/javascript
```

**生成 Java、Python、Go、Rust、C++、C#、Dart、Scala、Kotlin 和 Node.js JavaScript gRPC 服务配套代码：**

```bash
foryc compiler/examples/service.fdl --java_out=./generated/java --python_out=./generated/python --go_out=./generated/go --rust_out=./generated/rust --cpp_out=./generated/cpp --csharp_out=./generated/csharp --dart_out=./generated/dart --scala_out=./generated/scala --kotlin_out=./generated/kotlin --javascript_out=./generated/javascript --grpc
```

生成的 gRPC 服务代码使用 Fory 序列化请求和响应载荷。Java 输出导入 grpc-java API，Python 输出默认使用
`grpc.aio`，Go 输出导入 grpc-go，Rust 输出导入 `tonic` 和 `bytes`；
C++ 输出包含 gRPC C++ 的 `grpcpp` 头文件，编译它的目标必须将生成代码目录加入 include 路径，
并链接 `fory::serialization` 和 `gRPC::grpc++`。
Scala 输出导入 grpc-java API；Kotlin 输出导入 grpc-java 和 grpc-kotlin API，并使用协程 stub。
C# 输出导入 `Grpc.Core.Api` 类型，可以通过 `Grpc.AspNetCore` 等常规 .NET gRPC 包托管，
也可以通过 `Grpc.Net.Client` 调用。Dart 输出导入 `package:grpc`。
JavaScript 输出导入 `@grpc/grpc-js`。
编译或运行这些生成服务文件的应用必须自行提供 gRPC 依赖。Fory 软件包不会为此功能引入强制 gRPC 依赖。

对于现有的同步 `grpcio` 应用，可使用以下命令生成同步 Python gRPC 配套代码：

```bash
foryc compiler/examples/service.fdl --python_out=./generated/python --grpc --grpc-python-mode=sync
```

**生成 JavaScript gRPC-Web 浏览器客户端：**

```bash
foryc compiler/examples/service.fdl --javascript_out=./generated/javascript --grpc-web
```

如果同一份 JavaScript 输出需要同时包含 Node.js 和浏览器配套代码，请同时使用 `--grpc` 和 `--grpc-web`。
浏览器配套代码会导入 `grpc-web`；应用必须提供该软件包以及与 gRPC-Web 兼容的服务器或代理。

**使用导入搜索路径：**

```bash
# Add a single import path
foryc src/main.fdl -I libs/common

# Add multiple import paths (repeated option)
foryc src/main.fdl -I libs/common -I libs/types

# Add multiple import paths (comma-separated)
foryc src/main.fdl -I libs/common,libs/types,third_party/

# Using --proto_path (protoc-compatible alias)
foryc src/main.fdl --proto_path=libs/common

# Mix all styles
foryc src/main.fdl -I libs/common,libs/types --proto_path third_party/
```

**特定语言的输出目录（protoc 风格）：**

```bash
# Generate only Java code to a specific directory
foryc schema.fdl --java_out=./src/main/java

# Generate multiple languages to different directories
foryc schema.fdl --java_out=./java/gen --python_out=./python/src --cpp_out=./cpp/gen --go_out=./go/gen --rust_out=./rust/gen --csharp_out=./csharp/gen --javascript_out=./javascript/src --swift_out=./swift/gen --dart_out=./dart/gen --scala_out=./scala/gen --kotlin_out=./kotlin/gen

# Combine with import paths
foryc schema.fdl --java_out=./gen/java -I proto/ -I common/

# Generate Scala 3 code to a specific directory
foryc schema.fdl --scala_out=./src/main/scala

# Generate Scala 3 models and gRPC service companions
foryc service.fdl --scala_out=./src/main/scala --grpc

# Generate Kotlin code to a specific directory
foryc schema.fdl --kotlin_out=./src/main/kotlin
```

使用 `--{lang}_out` 选项时：

- 仅生成指定语言，而不是所有语言
- 编译器写入指定目录（特定语言的生成器仍可能创建 package/module 子目录）
- 与 protoc 风格的工作流兼容

**查看从 proto/fbs 输入转换得到的 Fory IDL：**

```bash
# Print translated Fory IDL to stdout
foryc schema.proto --emit-fdl

# Write translated Fory IDL to a directory
foryc schema.fbs --emit-fdl --emit-fdl-path ./translated
```

## 导入路径解析

编译包含导入的 Fory IDL 文件时，编译器按以下顺序搜索被导入文件：

1. **相对于发起导入的文件（默认）** - 编译器始终自动优先搜索包含 import 语句的文件所在目录。同目录导入不需要 `-I` 标志。
2. **依次搜索每个 `-I` 路径** - 命令行中指定的其他搜索路径

**同目录导入会自动生效：**

```protobuf
// main.fdl
import "common.fdl";  // Found if common.fdl is in the same directory
```

```bash
# No -I needed for same-directory imports
foryc main.fdl
```

**项目结构示例：**

```
project/
├── src/
│   └── main.fdl          # import "common.fdl";
└── libs/
    └── common.fdl
```

**不使用 `-I`（失败）：**

```bash
$ foryc src/main.fdl
Import error: Import not found: common.fdl
  Searched in: /project/src
```

**使用 `-I`（成功）：**

```bash
$ foryc src/main.fdl -I libs/
Compiling src/main.fdl...
  Resolved 1 import(s)
```

## 支持的语言

| 语言                  | 标志         | 输出扩展名 | 说明                          |
| --------------------- | ------------ | ---------- | ----------------------------- |
| Java                  | `java`       | `.java`    | 带 Fory 注解的 POJO           |
| Python                | `python`     | `.py`      | 带类型提示的 dataclass        |
| Go                    | `go`         | `.go`      | 带 struct tag 的结构体        |
| Rust                  | `rust`       | `.rs`      | 带派生宏的结构体              |
| C++                   | `cpp`        | `.h`       | 带 FORY 宏的结构体            |
| C#                    | `csharp`     | `.cs`      | 带 Fory attribute 的类        |
| JavaScript/TypeScript | `javascript` | `.ts`      | 带 Schema 模块辅助函数的接口  |
| Swift                 | `swift`      | `.swift`   | Fory Swift 模型宏             |
| Dart                  | `dart`       | `.dart`    | 带注解的 `@ForyStruct` 类     |
| Scala                 | `scala`      | `.scala`   | 使用宏派生的 Scala 3 模型     |
| Kotlin                | `kotlin`     | `.kt`      | 带 KSP 序列化器的 Kotlin 模型 |

## 输出结构

### Java

```
generated/
└── java/
    └── com/
        └── example/
            ├── User.java
            ├── Order.java
            ├── Status.java
            └── ExampleForyModule.java
```

- 每个类型（枚举或消息）对应一个文件
- package 结构与 Fory IDL package 一致
- 生成 Schema 模块类

### Python

```
generated/
└── python/
    └── example.py
```

- 所有类型位于单个模块中
- 模块名派生自 package
- 包含注册函数

### Go

```
generated/
└── go/
    └── example/
        └── example.go
```

- 所有类型位于单个文件中
- 目录和 package 名派生自 `go_package` 或 Fory IDL package
- 包含注册函数

### Rust

```
generated/
└── rust/
    └── example.rs
```

- 所有类型位于单个模块中
- 模块名派生自 package
- 包含注册函数

### C++

```
generated/
└── cpp/
    └── example.h
```

- 单个头文件
- 命名空间与 package 一致（将点号转换为 `::`）
- 包含头文件保护和前置声明

### JavaScript/TypeScript

```
generated/
└── javascript/
    ├── example.ts
    ├── example_grpc.ts      # with --grpc
    └── example_grpc_web.ts  # with --grpc-web
```

- 每个 Schema 对应一个 `.ts` 文件
- 消息使用 `export interface` 声明
- 枚举使用 `export enum` 声明
- 使用 case 枚举的可辨识联合类型
- 包含 Schema 辅助函数 `registerXxxTypes(fory)`，以及默认的 `serializeX` 和
  `deserializeX` 辅助函数
- `--grpc` 输出使用 `@grpc/grpc-js` 的 Node.js 配套代码
- `--grpc-web` 输出使用 `grpc-web` 的浏览器客户端配套代码

### C\#

```
generated/
└── csharp/
    └── example/
        └── Example.cs
```

- 每个 Schema 对应一个 `.cs` 文件，文件名取规范化为 PascalCase 的源文件主名
- 命名空间使用 `csharp_namespace`（若已设置），否则使用 Fory IDL package
- 包含以源文件名为前缀的 `XXXForyModule` 安装辅助类以及 `ToBytes`/`FromBytes` 方法
- 传递式安装导入的 Schema（例如 `root.idl` 导入 `addressbook.fdl` 和 `tree.fdl`）
- 使用 `--grpc` 时，每个服务会在 Schema 文件输出旁生成一个 `<ServiceName>Grpc.cs` 配套文件

### Swift

```
generated/
└── swift/
    └── addressbook/
        └── addressbook.swift
```

- 每个 Schema 对应一个 `.swift` 文件
- package 各段映射为嵌套 Swift 枚举（例如 `addressbook.*` -> `Addressbook.*`）
- 生成的消息使用 `@ForyStruct`，枚举使用 `@ForyEnum`，联合类型使用 `@ForyUnion`/`@ForyCase`
- 联合类型生成为带关联载荷值的标签枚举
- 每个 Schema 都包含 Schema 文件模块所有者和 `toBytes`/`fromBytes` 辅助函数
- 生成的模块辅助函数会传递式安装导入的 Schema

### Dart

```
generated/
└── dart/
    └── package/
        ├── package.dart
        └── package.fory.dart
```

- 每个 Schema 生成两个文件：包含注解类型的主 `.dart` 文件，以及包含生成序列化器的 `.fory.dart` part 文件
- package 各段映射为目录（例如 `demo.foo` → `demo/foo/`）
- 主文件包含 IDL 模块类，part 文件包含生成的序列化器元数据
- 非 optional、非 ref 的基本类型列表使用类型化数组（例如 `Int32List`）
- 使用 `--grpc` 时，每个 Schema 会在模型文件旁生成一个 `<stem>_grpc.dart` 配套文件，
  其中包含每个服务的 `Client` 和 `ServiceBase`，并导入 `package:grpc`

### Scala

```
generated/
└── scala/
    └── example/
        ├── User.scala
        ├── Status.scala
        ├── Animal.scala
        ├── ExampleServiceGrpc.scala
        └── ExampleForyModule.scala
```

- 每个生成类型对应一个 Scala 3 源文件
- package 结构与 Fory IDL package 一致
- 消息派生 `org.apache.fory.scala.ForySerializer`
- `optional T` 字段使用 `Option[T]`
- 枚举使用 Scala 3 `enum`
- 联合类型使用 Scala 3 ADT `enum`，并带有 `@ForyUnion`、`@ForyCase` 和 `Unknown`
- 包含 Schema 模块对象
- 每个本地服务定义在使用 `--grpc` 时生成一个 `<ServiceName>Grpc.scala` 服务配套文件

### Kotlin

```
generated/
└── kotlin/
    └── example/
        ├── User.kt
        ├── Status.kt
        ├── Animal.kt
        └── ExampleForyModule.kt
```

- 每个生成类型对应一个 Kotlin 源文件
- 设置 `kotlin_package` 时使用该 package 结构，否则使用 Fory IDL package
- 消息使用 `@ForyStruct` 和 KSP 生成的序列化器
- 枚举使用稳定的 Fory 枚举 ID
- 联合类型使用带 `@ForyUnion`、`@ForyCase` 和未知 case 载体的密封类
- 包含 Schema 模块对象
- 使用 `--grpc` 时，每个服务生成一个 `<ServiceName>GrpcKt.kt` 协程服务配套文件

### C# IDL 矩阵验证

运行端到端 C# IDL 矩阵（FDL/IDL/Proto/FBS 生成及往返测试）：

```bash
cd integration_tests/idl_tests
./run_csharp_tests.sh
```

此脚本会对以下内容执行同 Schema 和兼容模式的往返测试：

- `addressbook`、`auto_id`、`complex_pb` 基本类型
- `collection` 以及 union/list 变体
- `optional_types`
- `any_example`（`.fdl`）和 `any_example`（`.proto`）
- `tree` 和 `graph` 引用跟踪用例
- `monster.fbs` 和 `complex_fbs.fbs`
- `root.idl` 跨 package 导入覆盖
- Schema 演进兼容性用例

### Swift IDL 矩阵验证

运行端到端 Swift IDL 矩阵（FDL/IDL/Proto/FBS 生成及往返测试）：

```bash
cd integration_tests/idl_tests
./run_swift_tests.sh
```

该脚本会运行：

- 兼容模式和同 Schema 模式下的本地 Swift IDL 往返测试
- 使用 `IDL_PEER_LANG=swift` 的 Java 驱动对端往返验证

该脚本还会设置 `DATA_FILE*` 变量，以覆盖基于文件的往返路径。

## 错误处理

### 语法错误

```
Error: Line 5, Column 12: Expected ';' after field declaration
```

修复方法：检查指定行是否缺少分号或存在语法问题。

### 类型名称重复

```
Error: Duplicate type name: User
```

修复方法：确保文件中的每个枚举和消息都有唯一名称。

### 类型 ID 重复

```
Error: Duplicate type ID 100: User and Order
```

修复方法：为每个类型分配唯一的类型 ID。

### 未知类型引用

```
Error: Unknown type 'Address' in Customer.address
```

修复方法：使用类型之前先定义它，或检查拼写错误。

服务 RPC 的请求和响应类型使用相同方式验证：例如
`rpc SayHello (HelloRequest) returns (HelloReply);` 这样的 RPC 必须引用已定义的消息类型，
否则验证器会在 RPC 所在行报告 `Unknown type '...'` 错误。

### 字段编号重复

```
Error: Duplicate field number 1 in User: name and id
```

修复方法：在每个消息中分配唯一的字段编号。

## 最佳实践

### 项目结构

```
project/
├── fdl/
│   ├── common.fdl       # Shared types
│   ├── user.fdl         # User domain
│   └── order.fdl        # Order domain
├── src/
│   └── generated/       # Generated code (git-ignored)
└── build.gradle
```

### 版本控制

- **跟踪**：Fory IDL Schema 文件
- **忽略**：生成的代码（可重新生成）

添加到 `.gitignore`：

```
# Generated Fory IDL code
src/generated/
generated/
```

### CI/CD 集成

每次构建时都重新生成：

```yaml
# GitHub Actions example
steps:
  - name: Install Fory IDL Compiler
    run: pip install ./compiler

  - name: Generate Types
    run: foryc fdl/*.fdl --output src/generated

  - name: Build
    run: ./gradlew build
```

### Schema 演进

修改 Schema 时：

1. **切勿重用字段编号** - 应将其标记为保留
2. **切勿更改类型 ID** - 它们是二进制格式的一部分
3. **添加新字段** - 使用新的字段编号
4. **使用 `optional`** - 保持向后兼容性

```protobuf
message User [id=100] {
    string id = 1;
    string name = 2;
    // Field 3 was removed, don't reuse
    optional string email = 4;  // New field
}
```

## 故障排查

### 找不到命令

```
foryc: command not found
```

**解决方法：**确保编译器已安装并位于 PATH 中：

```bash
pip install -e ./compiler
# Or add to PATH
export PATH=$PATH:~/.local/bin
```

### 权限被拒绝

```
Permission denied: ./generated
```

**解决方法：**确保拥有输出目录的写入权限：

```bash
chmod -R u+w ./generated
```

### 生成代码中的导入错误

**Java：**确保项目中包含 Fory 依赖：

```xml
<dependency>
  <groupId>org.apache.fory</groupId>
  <artifactId>fory-core</artifactId>
  <version>${fory.version}</version>
</dependency>
```

**Python：**确保已安装 pyfory：

```bash
pip install pyfory
```

**Go：**确保 fory 模块可用：

```bash
go get github.com/apache/fory/go/fory
```

**Rust：**确保 `Cargo.toml` 中包含 fory crate：

```toml
[dependencies]
fory = "x.y.z"
```

**C++：**确保 Fory 头文件位于 include 路径中。

**Dart：**确保 `pubspec.yaml` 中包含 fory 软件包：

```yaml
dependencies:
  fory: ^1.5.0
```
