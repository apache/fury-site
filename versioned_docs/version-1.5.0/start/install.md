---
id: install
title: Install
sidebar_position: 0
---

Apache Fory™ releases are available both as source artifacts and language-specific packages.

For source downloads, see the Apache Fory™ [download](https://fory.apache.org/download) page.

## Java

Use Maven to add Apache Fory™:

```xml
<dependency>
  <groupId>org.apache.fory</groupId>
  <artifactId>fory-core</artifactId>
  <version>1.5.0</version>
</dependency>
<!-- Optional row format support -->
<!--
<dependency>
  <groupId>org.apache.fory</groupId>
  <artifactId>fory-format</artifactId>
  <version>1.5.0</version>
</dependency>
-->
```

## Scala

Scala 2.13 with Maven:

```xml
<dependency>
  <groupId>org.apache.fory</groupId>
  <artifactId>fory-scala_2.13</artifactId>
  <version>1.5.0</version>
</dependency>
```

Scala 3 with Maven:

```xml
<dependency>
  <groupId>org.apache.fory</groupId>
  <artifactId>fory-scala_3</artifactId>
  <version>1.5.0</version>
</dependency>
```

Scala 2.13 with sbt:

```sbt
libraryDependencies += "org.apache.fory" % "fory-scala_2.13" % "1.5.0"
```

Scala 3 with sbt:

```sbt
libraryDependencies += "org.apache.fory" % "fory-scala_3" % "1.5.0"
```

## Kotlin

Add Apache Fory™ Kotlin with Maven:

```xml
<dependency>
  <groupId>org.apache.fory</groupId>
  <artifactId>fory-kotlin</artifactId>
  <version>1.5.0</version>
</dependency>
```

## Python

```bash
python -m pip install --upgrade pip
pip install pyfory==1.5.0
```

## Go

Use the full Go module path `github.com/apache/fory/go/fory`:

```bash
go get github.com/apache/fory/go/fory@v1.5.0
```

If your Go proxy has not picked up the new submodule tag yet, retry later or use `GOPROXY=direct` temporarily.

## Rust

```toml
[dependencies]
fory = "1.5.0"
```

Or use `cargo add`:

```bash
cargo add fory@1.5.0
```

## JavaScript / TypeScript

Install the published JavaScript package from npm:

```bash
npm install @apache-fory/core
```

Optional native acceleration requires Node.js 20+:

```bash
npm install @apache-fory/hps
```

## Dart

Add Apache Fory™ Dart to `pubspec.yaml`:

```yaml
dependencies:
  fory: ^1.5.0

dev_dependencies:
  build_runner: ^2.4.13
```

Generate serializers after defining annotated types:

```bash
dart run build_runner build --delete-conflicting-outputs
```

## C\#

Install the `Apache.Fory` NuGet package. It includes both the runtime and the source generator for `[ForyStruct]` types.

```bash
dotnet add package Apache.Fory --version 1.5.0
```

```xml
<ItemGroup>
  <PackageReference Include="Apache.Fory" Version="1.5.0" />
</ItemGroup>
```

## Swift

Add Apache Fory™ from the GitHub repository with Swift Package Manager:

```swift
dependencies: [
    .package(url: "https://github.com/apache/fory.git", exact: "1.5.0")
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
