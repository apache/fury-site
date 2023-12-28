---
id: install
title: Install
sidebar_position: 0
---

### Java

Nightly snapshot:

```xml
<repositories>
  <repository>
    <id>apache</id>
    <url>https://repository.apache.org/snapshots/</url>
    <releases>
      <enabled>false</enabled>
    </releases>
    <snapshots>
      <enabled>true</enabled>
    </snapshots>
  </repository>
</repositories>
<dependency>
  <groupId>org.apache.fury</groupId>
  <artifactId>fury-core</artifactId>
  <version>0.5.0-SNAPSHOT</version>
</dependency>
<!-- row/arrow format support -->
<!-- <dependency>
  <groupId>org.apache.fury</groupId>
  <artifactId>fury-format</artifactId>
  <version>0.5.0-SNAPSHOT</version>
</dependency> -->
```

Release version:

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
# Python wheel will be released in the future.
# Currently you need to specify `--pre` to install
# the unstable version.
pip install pyfury
```

### Golang

```bash
go get https://github.com/apache/incubator-fury/go/fury
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
fury_derive = { git= "https://github.com/apache/incubator-fury.git", branch = "main" }
lazy_static = { version = "1.4.0" }

```
