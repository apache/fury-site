---
id: install
title: 安装
sidebar_position: 0
---

Apache Fory™ 同时提供源码发布物和各语言对应的软件包。

源码下载请参见 Apache Fory™ [download](https://fory.apache.org/download) 页面。

## Java

使用 Maven 添加 Apache Fory™：

```xml
<dependency>
  <groupId>org.apache.fory</groupId>
  <artifactId>fory-core</artifactId>
  <version>1.4.0</version>
</dependency>
<!-- 可选的 row format 支持 -->
<!--
<dependency>
  <groupId>org.apache.fory</groupId>
  <artifactId>fory-format</artifactId>
  <version>1.4.0</version>
</dependency>
-->
```

## Scala

Scala 2.13 的 Maven 依赖：

```xml
<dependency>
  <groupId>org.apache.fory</groupId>
  <artifactId>fory-scala_2.13</artifactId>
  <version>1.4.0</version>
</dependency>
```

Scala 3 的 Maven 依赖：

```xml
<dependency>
  <groupId>org.apache.fory</groupId>
  <artifactId>fory-scala_3</artifactId>
  <version>1.4.0</version>
</dependency>
```

Scala 2.13 的 sbt 依赖：

```sbt
libraryDependencies += "org.apache.fory" % "fory-scala_2.13" % "1.4.0"
```

Scala 3 的 sbt 依赖：

```sbt
libraryDependencies += "org.apache.fory" % "fory-scala_3" % "1.4.0"
```

## Kotlin

使用 Maven 添加 Apache Fory™ Kotlin：

```xml
<dependency>
  <groupId>org.apache.fory</groupId>
  <artifactId>fory-kotlin</artifactId>
  <version>1.4.0</version>
</dependency>
```

## Python

```bash
python -m pip install --upgrade pip
pip install pyfory==1.4.0
```

## Go

请使用完整的 Go 模块路径 `github.com/apache/fory/go/fory`：

```bash
go get github.com/apache/fory/go/fory@v1.4.0
```

如果你的 Go proxy 还没有同步新的子模块 tag，请稍后重试，或者临时使用 `GOPROXY=direct`。

## Rust

```toml
[dependencies]
fory = "1.4.0"
```

或者使用 `cargo add`：

```bash
cargo add fory@1.4.0
```

## JavaScript / TypeScript

从 npm 安装已发布的 JavaScript 包：

```bash
npm install @apache-fory/core
```

可选的原生加速需要 Node.js 20+：

```bash
npm install @apache-fory/hps
```

## Dart

在 `pubspec.yaml` 中添加 Apache Fory™ Dart：

```yaml
dependencies:
  fory: ^1.4.0

dev_dependencies:
  build_runner: ^2.4.13
```

定义带注解的类型后生成序列化器：

```bash
dart run build_runner build --delete-conflicting-outputs
```

## C\#

安装 `Apache.Fory` NuGet 包。它同时包含运行时以及 `[ForyStruct]` 类型所需的源代码生成器。

```bash
dotnet add package Apache.Fory --version 1.4.0
```

```xml
<ItemGroup>
  <PackageReference Include="Apache.Fory" Version="1.4.0" />
</ItemGroup>
```

## Swift

使用 Swift Package Manager 从 GitHub 仓库引入 Apache Fory™：

```swift
dependencies: [
    .package(url: "https://github.com/apache/fory.git", exact: "1.4.0")
],
targets: [
    .target(
        name: "MyApp",
        dependencies: [
            .product(name: "Fory", package: "fory")
        ]
    )
]
```
