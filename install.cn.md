---
title: 安装Fury
order: 0
---


### Java

Nightly快照版本:

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
<version>0.1.0-SNAPSHOT</version>
</dependency>
  <!-- row/arrow format support -->
  <!-- <dependency>
    <groupId>org.furyio</groupId>
    <artifactId>fury-format</artifactId>
    <version>0.1.0-SNAPSHOT</version>
  </dependency> -->
```

正式版本:

```xml
<dependency>
  <groupId>org.furyio</groupId>
  <artifactId>fury-core</artifactId>
  <version>0.1.0-alpha.2</version>
</dependency>
  <!-- row/arrow format support -->
  <!-- <dependency>
    <groupId>org.furyio</groupId>
    <artifactId>fury-format</artifactId>
    <version>0.1.0-alpha.2</version>
  </dependency> -->
```

### Python

```bash
# Python whl即将发布，目前需要源码安装
git clone https://github.com/alipay/fury.git
cd fury/python
pip install -v -e .
```

### JavaScript

```bash
npm install @furyjs/fury
```

### Golang

即将发布

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
