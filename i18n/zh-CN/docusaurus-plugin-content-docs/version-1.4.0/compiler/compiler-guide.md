---
title: 编译器指南
sidebar_position: 3
id: compiler_guide
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

本指南介绍 Fory IDL 编译器的安装、使用方式和集成方法。

## 安装

### 从源码安装

```bash
cd compiler
pip install -e .
```

### 验证安装

```bash
foryc --help
```

## 命令行接口

### 基本用法

```bash
foryc [OPTIONS] FILES...
```

```bash
foryc --scan-generated [OPTIONS]
```

### 选项

编译选项：

| 选项                                  | 说明                                               | 默认值        |
| ------------------------------------- | -------------------------------------------------- | ------------- |
| `--lang`                              | 目标语言列表，使用逗号分隔                         | `all`         |
| `--output`, `-o`                      | 输出目录                                           | `./generated` |
| `-I`, `--proto_path`, `--import_path` | 添加 import 搜索路径（可重复指定）                 | （无）        |
| `--java_out=DST_DIR`                  | 在 DST_DIR 中生成 Java 代码                        | （无）        |
| `--python_out=DST_DIR`                | 在 DST_DIR 中生成 Python 代码                      | （无）        |
| `--cpp_out=DST_DIR`                   | 在 DST_DIR 中生成 C++ 代码                         | （无）        |
| `--go_out=DST_DIR`                    | 在 DST_DIR 中生成 Go 代码                          | （无）        |
| `--rust_out=DST_DIR`                  | 在 DST_DIR 中生成 Rust 代码                        | （无）        |
| `--csharp_out=DST_DIR`                | 在 DST_DIR 中生成 C# 代码                          | （无）        |
| `--javascript_out=DST_DIR`            | 在 DST_DIR 中生成 JavaScript/TypeScript 代码       | （无）        |
| `--swift_out=DST_DIR`                 | 在 DST_DIR 中生成 Swift 代码                       | （无）        |
| `--dart_out=DST_DIR`                  | 在 DST_DIR 中生成 Dart 代码                        | （无）        |
| `--scala_out=DST_DIR`                 | 在 DST_DIR 中生成 Scala 3 代码                     | （无）        |
| `--kotlin_out=DST_DIR`                | 在 DST_DIR 中生成 Kotlin 代码                      | （无）        |
| `--go_nested_type_style`              | Go 嵌套类型命名方式：`camelcase` 或 `underscore`   | `underscore`  |
| `--swift_namespace_style`             | Swift 命名空间方式：`enum` 或 `flatten`            | `enum`        |
| `--emit-fdl`                          | 输出转换后的 FDL（用于非 FDL 输入）                | `false`       |
| `--emit-fdl-path`                     | 将转换后的 FDL 写入此路径（文件或目录）            | （stdout）    |
| `--grpc`                              | 为支持的输出生成 gRPC service companion 代码       | `false`       |
| `--grpc-python-mode=MODE`             | Python gRPC 模式：`async` 或 `sync`                | `async`       |
| `--grpc-web`                          | 生成 JavaScript gRPC-Web client companion          | `false`       |

支持 schema 级文件选项，用于控制特定语言的生成行为。
对于 `go_nested_type_style` 和 `swift_namespace_style`，当 CLI 标志和
schema 选项同时存在时，CLI 标志优先生效。Rust temporal 代码生成没有 CLI 标志：
需要在 schema 中设置 `option rust_use_chrono_temporal_types = true;`，以生成
`chrono::NaiveDate`、`chrono::NaiveDateTime` 和 `chrono::Duration`，而不是默认的
`fory::Date`、`fory::Timestamp` 和 `fory::Duration`。编译基于 chrono 的 Rust
生成代码的 crate 必须依赖 `chrono`，并启用 Fory 的 `chrono` feature。

扫描选项（配合 `--scan-generated`）：

| 选项         | 说明                   | 默认值  |
| ------------ | ---------------------- | ------- |
| `--root`     | 要扫描的根目录         | `.`     |
| `--relative` | 输出相对于根目录的路径 | `false` |
| `--delete`   | 删除匹配的生成文件     | `false` |
| `--dry-run`  | 仅扫描/打印，不删除    | `false` |

### 扫描生成文件

使用 `--scan-generated` 查找 `foryc` 生成的文件。扫描器会递归遍历目录树，跳过
`build/`、`target/` 和隐藏目录，并在发现每个生成文件时打印出来。

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

**为选定的一组语言编译：**

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

**编译包含 service 定义的简单 schema（Java + Python + Go + Rust + C# + Dart + Scala + Kotlin + JavaScript 模型）：**

```bash
foryc compiler/examples/service.fdl --java_out=./generated/java --python_out=./generated/python --go_out=./generated/go --rust_out=./generated/rust --csharp_out=./generated/csharp --dart_out=./generated/dart --scala_out=./generated/scala --kotlin_out=./generated/kotlin --javascript_out=./generated/javascript
```

**生成 Java、Python、Go、Rust、C#、Dart、Scala、Kotlin 和 Node.js JavaScript gRPC service companion 代码：**

```bash
foryc compiler/examples/service.fdl --java_out=./generated/java --python_out=./generated/python --go_out=./generated/go --rust_out=./generated/rust --csharp_out=./generated/csharp --dart_out=./generated/dart --scala_out=./generated/scala --kotlin_out=./generated/kotlin --javascript_out=./generated/javascript --grpc
```

生成的 gRPC service 代码使用 Fory 序列化请求和响应载荷。Java 输出会导入
grpc-java API，Python 输出默认使用 `grpc.aio`，Go 输出会导入 grpc-go，Rust 输出会导入
`tonic` 和 `bytes`，Scala 输出会导入 grpc-java API，Kotlin 输出会导入 grpc-java 和
grpc-kotlin API 并使用 coroutine stub。C# 输出会导入 `Grpc.Core.Api` 类型，并可由
`Grpc.AspNetCore` 等常规 .NET gRPC package 承载，或通过 `Grpc.Net.Client` 调用。Dart 输出
会导入 `package:grpc`。JavaScript 输出会导入 `@grpc/grpc-js`。编译或运行这些生成
service 文件的应用需要自行提供 gRPC 依赖。Fory package 不会为此功能加入强制 gRPC 依赖。

为已有同步 `grpcio` 应用生成同步 Python gRPC companion：

```bash
foryc compiler/examples/service.fdl --python_out=./generated/python --grpc --grpc-python-mode=sync
```

**生成 JavaScript gRPC-Web 浏览器 client：**

```bash
foryc compiler/examples/service.fdl --javascript_out=./generated/javascript --grpc --grpc-web
```

**使用 import 搜索路径：**

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

**语言专属输出目录（protoc 风格）：**

```bash
# Generate only Java code to a specific directory
foryc schema.fdl --java_out=./src/main/java

# Generate multiple languages to different directories
foryc schema.fdl --java_out=./java/gen --python_out=./python/src --cpp_out=./cpp/gen --go_out=./go/gen --rust_out=./rust/gen --csharp_out=./csharp/gen --javascript_out=./javascript/src --swift_out=./swift/gen --dart_out=./dart/gen --scala_out=./scala/gen --kotlin_out=./kotlin/gen

# Combine with import paths
foryc schema.fdl --java_out=./gen/java -I proto/ -I common/

# Generate Scala 3 code to a specific directory
foryc schema.fdl --scala_out=./src/main/scala

# Generate Kotlin code to a specific directory
foryc schema.fdl --kotlin_out=./src/main/kotlin
```

使用 `--{lang}_out` 选项时：

- 只生成显式指定的语言（不会生成全部语言）
- 编译器会写入指定目录（特定语言的生成器仍可能创建 package/module 子目录）
- 兼容 protoc 风格工作流

**查看从 proto/fbs 输入转换后的 Fory IDL：**

```bash
# Print translated Fory IDL to stdout
foryc schema.proto --emit-fdl

# Write translated Fory IDL to a directory
foryc schema.fbs --emit-fdl --emit-fdl-path ./translated
```

## Import 路径解析

编译带有 import 的 Fory IDL 文件时，编译器按以下顺序查找被导入文件：

1. **相对于导入者文件（默认）** - 始终会首先自动搜索包含 import 语句的文件所在目录。同目录 import 不需要 `-I` 标志。
2. **每个 `-I` 路径的顺序** - 命令行上指定的额外搜索路径

**同目录 import 会自动生效：**

```protobuf
// main.fdl
import "common.fdl";  // Found if common.fdl is in the same directory
```

```bash
# No -I needed for same-directory imports
foryc main.fdl
```

**示例项目结构：**

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

## 支持语言

| 语言                  | 标志         | 输出后缀 | 说明                                 |
| --------------------- | ------------ | -------- | ------------------------------------ |
| Java                  | `java`       | `.java`  | 带 Fory 注解的 POJO                  |
| Python                | `python`     | `.py`    | 带类型提示的 dataclass               |
| Go                    | `go`         | `.go`    | 带 struct tag 的结构体               |
| Rust                  | `rust`       | `.rs`    | 带 derive 宏的结构体                 |
| C++                   | `cpp`        | `.h`     | 带 FORY 宏的结构体                   |
| C#                    | `csharp`     | `.cs`    | 带 Fory attribute 的类               |
| JavaScript/TypeScript | `javascript` | `.ts`    | 带注册函数的 interface               |
| Swift                 | `swift`      | `.swift` | Fory Swift 模型宏                    |
| Dart                  | `dart`       | `.dart`  | 带注解的 `@ForyStruct` 类            |
| Scala                 | `scala`      | `.scala` | 使用宏派生的 Scala 3 模型            |
| Kotlin                | `kotlin`     | `.kt`    | 使用 KSP serializer 的 Kotlin 模型   |

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

- 每个类型（enum 或 message）一个文件
- Package 结构与 Fory IDL package 一致
- 生成 schema module 类

### Python

```
generated/
└── python/
    └── example.py
```

- 所有类型位于单个 module
- Module 名称由 package 派生
- 包含注册函数

### Go

```
generated/
└── go/
    └── example/
        └── example.go
```

- 所有类型位于单个文件
- 目录名和 package 名称由 `go_package` 或 Fory IDL package 派生
- 包含注册函数

### Rust

```
generated/
└── rust/
    └── example.rs
```

- 所有类型位于单个 module
- Module 名称由 package 派生
- 包含注册函数

### C++

```
generated/
└── cpp/
    └── example.h
```

- 单个头文件
- Namespace 与 package 匹配（点号转换为 `::`）
- Header guard 和前向声明

### JavaScript/TypeScript

```
generated/
└── javascript/
  └── example.ts
```

- 每个 schema 生成单个 `.ts` 文件
- message 生成为 `export interface` 声明
- enum 生成为 `export enum` 声明
- union 生成为带 case enum 的判别联合
- 包含注册辅助函数

### C\#

```
generated/
└── csharp/
    └── example/
        └── example.cs
```

- 每个 schema 生成单个 `.cs` 文件
- Namespace 使用 `csharp_namespace`（如已设置）或 Fory IDL package
- 包含以源文件为前缀的 `XXXForyModule` 安装 helper，以及 `ToBytes`/`FromBytes` 方法
- 被导入的 schema 会由生成的 helper 传递安装（例如 `root.idl` 导入 `addressbook.fdl` 和 `tree.fdl`）

### Swift

```
generated/
└── swift/
    └── addressbook/
        └── addressbook.swift
```

- 每个 schema 生成单个 `.swift` 文件
- Package 片段会映射为嵌套 Swift enum（例如 `addressbook.*` -> `Addressbook.*`）
- 生成的 message 使用 `@ForyStruct`，enum 使用 `@ForyEnum`，union 使用 `@ForyUnion`/`@ForyCase`
- Union 类型生成为带关联载荷值的 tagged enum
- 每个 schema 都包含 schema 文件 module owner 和 `toBytes`/`fromBytes` helper
- 被导入的 schema 会由生成的 module helper 传递安装

### Dart

```
generated/
└── dart/
    └── package/
        ├── package.dart
        └── package.fory.dart
```

- 每个 schema 生成两个文件：包含带注解类型的主 `.dart` 文件，以及包含生成 serializer 的 `.fory.dart` part 文件
- Package 片段映射为目录（例如 `demo.foo` → `demo/foo/`）
- IDL module 类包含在主文件中；生成的 serializer 元数据包含在 part 文件中
- 非可选、非 `ref` 的 primitive list 使用类型化数组（例如 `Int32List`）
- 使用 `--grpc` 时，会在 model 文件旁为每个 schema 生成一个 `<stem>_grpc.dart` companion，
  其中包含各 service 的 `Client` 和 `ServiceBase`，并导入 `package:grpc`

### Scala

```
generated/
└── scala/
    └── example/
        ├── User.scala
        ├── Status.scala
        ├── Animal.scala
        └── ExampleForyModule.scala
```

- 每个生成类型一个 Scala 3 源文件
- Package 结构与 Fory IDL package 一致
- Message 派生 `org.apache.fory.scala.ForySerializer`
- `optional T` 字段使用 `Option[T]`
- Enum 使用 Scala 3 `enum`
- Union 使用 Scala 3 ADT `enum`，并带 `@ForyUnion`、`@ForyCase` 和一个 `Unknown`
- 包含 schema module object

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

- 每个生成类型一个 Kotlin 源文件
- Package 结构在设置 `kotlin_package` 时使用该选项，否则使用 Fory IDL package
- Message 使用 `@ForyStruct` 和 KSP 生成的 serializer
- Enum 使用稳定的 Fory enum ID
- Union 使用 sealed class，并带 `@ForyUnion`、`@ForyCase` 和 unknown-case carrier
- 包含 schema module object

### C# IDL 矩阵验证

运行端到端 C# IDL 矩阵（FDL/IDL/Proto/FBS 生成以及 roundtrip 测试）：

```bash
cd integration_tests/idl_tests
./run_csharp_tests.sh
```

此 runner 会执行以下场景的 schema-consistent 和 compatible roundtrip：

- `addressbook`、`auto_id`、`complex_pb` primitives
- `collection` 和 union/list 变体
- `optional_types`
- `any_example`（`.fdl`）和 `any_example`（`.proto`）
- `tree` 和 `graph` 引用跟踪场景
- `monster.fbs` 和 `complex_fbs.fbs`
- `root.idl` 跨 package import 覆盖
- 演进 schema 兼容性场景

### Swift IDL 矩阵验证

运行端到端 Swift IDL 矩阵（FDL/IDL/Proto/FBS 生成以及 roundtrip 测试）：

```bash
cd integration_tests/idl_tests
./run_swift_tests.sh
```

此脚本会运行：

- compatible 和 schema-consistent 模式下的本地 Swift IDL roundtrip 测试
- 使用 `IDL_PEER_LANG=swift` 的 Java 驱动 peer roundtrip 验证

脚本还会设置 `DATA_FILE*` 变量，以便覆盖基于文件的 roundtrip 路径。

## 构建集成

### Maven (Java)

添加到 `pom.xml`：

```xml
<build>
  <plugins>
    <plugin>
      <groupId>org.codehaus.mojo</groupId>
      <artifactId>exec-maven-plugin</artifactId>
      <version>3.1.0</version>
      <executions>
        <execution>
          <id>generate-fory-types</id>
          <phase>generate-sources</phase>
          <goals>
            <goal>exec</goal>
          </goals>
          <configuration>
            <executable>foryc</executable>
            <arguments>
              <argument>${project.basedir}/src/main/fdl/schema.fdl</argument>
              <argument>--java_out</argument>
              <argument>${project.build.directory}/generated-sources/fory</argument>
            </arguments>
          </configuration>
        </execution>
      </executions>
    </plugin>
  </plugins>
</build>
```

添加生成源码：

```xml
<build>
  <plugins>
    <plugin>
      <groupId>org.codehaus.mojo</groupId>
      <artifactId>build-helper-maven-plugin</artifactId>
      <version>3.4.0</version>
      <executions>
        <execution>
          <phase>generate-sources</phase>
          <goals>
            <goal>add-source</goal>
          </goals>
          <configuration>
            <sources>
              <source>${project.build.directory}/generated-sources/fory</source>
            </sources>
          </configuration>
        </execution>
      </executions>
    </plugin>
  </plugins>
</build>
```

### Gradle (Java/Kotlin)

添加到 `build.gradle`：

```groovy
task generateForyTypes(type: Exec) {
    commandLine 'foryc',
        "${projectDir}/src/main/fdl/schema.fdl",
        '--java_out', "${buildDir}/generated/sources/fory"
}

compileJava.dependsOn generateForyTypes

sourceSets {
    main {
        java {
            srcDir "${buildDir}/generated/sources/fory"
        }
    }
}
```

### Python (setuptools)

添加到 `setup.py` 或 `pyproject.toml`：

```python
# setup.py
from setuptools import setup
from setuptools.command.build_py import build_py
import subprocess

class BuildWithForyIdl(build_py):
    def run(self):
        subprocess.run([
            'foryc',
            'schema.fdl',
            '--python_out', 'src/generated'
        ], check=True)
        super().run()

setup(
    cmdclass={'build_py': BuildWithForyIdl},
    # ...
)
```

### Go (go generate)

添加到你的 Go 文件：

```go
//go:generate foryc ../schema.fdl --lang go --output .
package models
```

运行：

```bash
go generate ./...
```

### Rust (build.rs)

添加到 `build.rs`：

```rust
use std::process::Command;

fn main() {
    println!("cargo:rerun-if-changed=schema.fdl");

    let status = Command::new("foryc")
        .args(&["schema.fdl", "--rust_out", "src/generated"])
        .status()
        .expect("Failed to run foryc");

    if !status.success() {
        panic!("Fory IDL compilation failed");
    }
}
```

### CMake (C++)

添加到 `CMakeLists.txt`：

```cmake
find_program(FORY_COMPILER foryc)

add_custom_command(
    OUTPUT ${CMAKE_CURRENT_SOURCE_DIR}/generated/example.h
    COMMAND ${FORY_COMPILER}
        ${CMAKE_CURRENT_SOURCE_DIR}/schema.fdl
        --cpp_out ${CMAKE_CURRENT_SOURCE_DIR}/generated
    DEPENDS ${CMAKE_CURRENT_SOURCE_DIR}/schema.fdl
    COMMENT "Generating Fory IDL types"
)

add_custom_target(generate_fory_idl DEPENDS ${CMAKE_CURRENT_SOURCE_DIR}/generated/example.h)

add_library(mylib ...)
add_dependencies(mylib generate_fory_idl)
target_include_directories(mylib PRIVATE ${CMAKE_CURRENT_SOURCE_DIR}/generated)
```

### Bazel

在 `BUILD` 中创建规则：

```python
genrule(
    name = "generate_fdl",
    srcs = ["schema.fdl"],
    outs = ["generated/example.h"],
    cmd = "$(location //:fory_compiler) $(SRCS) --cpp_out $(RULEDIR)/generated",
    tools = ["//:fory_compiler"],
)

cc_library(
    name = "models",
    hdrs = [":generate_fdl"],
    # ...
)
```

### Dart / Flutter

在 `pubspec.yaml` 中添加 Fory 依赖：

```yaml
dependencies:
  fory: ^1.4.0

dev_dependencies:
  build_runner: ^2.4.0
```

使用编译器生成 schema 类型：

```bash
foryc schema.fdl --dart_out=lib/generated
```

然后运行 `build_runner` 生成 serializer：

```bash
dart run build_runner build
```

## 错误处理

### 语法错误

```
Error: Line 5, Column 12: Expected ';' after field declaration
```

修复方式：检查提示的行是否缺少分号或存在语法问题。

### 类型名重复

```
Error: Duplicate type name: User
```

修复方式：确保同一文件中的每个 enum 和 message 名称唯一。

### 类型 ID 重复

```
Error: Duplicate type ID 100: User and Order
```

修复方式：为每个类型分配唯一类型 ID。

### 未知类型引用

```
Error: Unknown type 'Address' in Customer.address
```

修复方式：先定义被引用的类型，或检查是否存在拼写错误。

Service RPC 的请求和响应类型也按相同方式校验：像
`rpc SayHello (HelloRequest) returns (HelloReply);` 这样的 RPC 必须引用已定义的
message 类型，否则校验器会在 RPC 所在行报告 `Unknown type '...'` 错误。

### 字段号重复

```
Error: Duplicate field number 1 in User: name and id
```

修复方式：在每个 message 内分配唯一字段号。

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

- **纳入版本控制**：Fory IDL schema 文件
- **忽略**：生成代码（可重新生成）

添加到 `.gitignore`：

```
# Generated Fory IDL code
src/generated/
generated/
```

### CI/CD 集成

构建时始终重新生成：

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

修改 schema 时：

1. **不要复用字段号** - 改为标记为 reserved
2. **不要修改类型 ID** - 它们是二进制格式的一部分
3. **新增字段** - 使用新的字段号
4. **使用 `optional`** - 保持向后兼容

```protobuf
message User [id=100] {
    string id = 1;
    string name = 2;
    // Field 3 was removed, don't reuse
    optional string email = 4;  // New field
}
```

## 故障排查

### Command Not Found

```
foryc: command not found
```

**解决方式：** 确保编译器已安装且在 PATH 中：

```bash
pip install -e ./compiler
# Or add to PATH
export PATH=$PATH:~/.local/bin
```

### Permission Denied

```
Permission denied: ./generated
```

**解决方式：** 确保输出目录具备写权限：

```bash
chmod -R u+w ./generated
```

### 生成代码中的 Import 错误

**Java：** 确保项目中包含 Fory 依赖：

```xml
<dependency>
  <groupId>org.apache.fory</groupId>
  <artifactId>fory-core</artifactId>
  <version>${fory.version}</version>
</dependency>
```

**Python：** 确保已安装 pyfory：

```bash
pip install pyfory
```

**Go：** 确保 fory module 可用：

```bash
go get github.com/apache/fory/go/fory
```

**Rust：** 确保 `Cargo.toml` 中包含 fory crate：

```toml
[dependencies]
fory = "x.y.z"
```

**C++：** 确保 Fory 头文件位于 include path 中。

**Dart：** 确保 `pubspec.yaml` 中包含 fory package：

```yaml
dependencies:
  fory: ^1.4.0
```
