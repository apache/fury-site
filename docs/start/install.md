---
id: install
title: Install
sidebar_position: 0
---

### Java
To add a dependency on Fury using Maven, use the following:

```xml
<dependency>
  <groupId>org.furyio</groupId>
  <artifactId>fury-core</artifactId>
  <version>0.4.1</version>
</dependency>
<!-- row/arrow format support -->
<!-- <dependency>
  <groupId>org.furyio</groupId>
  <artifactId>fury-format</artifactId>
  <version>0.4.1</version>
</dependency> -->
```
Maven groupId will be changed to `org.apache.fury` when next version is released.

### Scala
```sbt
libraryDependencies += "org.furyio" % "fury-core" % "0.4.1"
```

### Python

```bash
pip install pyfury
```

### Golang

```bash
go get github.com/apache/incubator-fury/go/fury
```

### JavaScript

```bash
npm install @furyjs/fury
```

### Rust

```bash
# Cargo.toml

[dependencies]
fury = { git= "https://github.com/apache/incubator-fury.git", branch = "main" }
lazy_static = { version = "1.4.0" }
```
