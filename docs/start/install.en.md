---
title: Install
order: 0
---

### Java

Nightly snapshot:

```xml
<repositories>
  <repository>
    <id>sonatype</id>
    <url>https://s01.oss.sonatype.org/content/repositories/snapshots</url>
    <releases>
      <enabled>false</enabled>
    </releases>
    <snapshots>
      <enabled>true</enabled>
    </snapshots>
  </repository>
</repositories>
<dependency>
  <groupId>org.furyio</groupId>
  <artifactId>fury-core</artifactId>
  <version>0.4.0-SNAPSHOT</version>
</dependency>
<!-- row/arrow format support -->
<!-- <dependency>
  <groupId>org.furyio</groupId>
  <artifactId>fury-format</artifactId>
  <version>0.4.0-SNAPSHOT</version>
</dependency> -->
```

Release version:

```xml
<dependency>
  <groupId>org.furyio</groupId>
  <artifactId>fury-core</artifactId>
  <version>0.3.1</version>
</dependency>
<!-- row/arrow format support -->
<!-- <dependency>
  <groupId>org.furyio</groupId>
  <artifactId>fury-format</artifactId>
  <version>0.3.1</version>
</dependency> -->
```
### Scala
```sbt
libraryDependencies += "org.furyio" % "fury-core" % "0.3.1"
```

### Python

```bash
# Python wheel will be released in the future.
# Currently you need to specify `--pre` to install
# the unstable version.
pip install pyfury --pre
```

### Golang

```bash
go get github.com/alipay/fury/go/fury
```

### JavaScript

```bash
npm install @furyjs/fury
```

### Rust

```bash
# Cargo.toml

[dependencies]
fury = { git= "https://github.com/alipay/fury.git", branch = "main" }
fury_derive = { git= "https://github.com/alipay/fury.git", branch = "main" }
lazy_static = { version = "1.4.0" }

```
