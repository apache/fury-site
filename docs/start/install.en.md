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
    <url>https://oss.sonatype.org/content/repositories/snapshots/</url>
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

Release version: coming soon.

### Python

```bash
# Python whl will be released soon.
# Currently you need to install from the source.
git clone https://github.com/alipay/fury.git
cd fury/python
pip install -v -e .
```

### Golang

Coming soon.

### JavaScript

```bash
npm install @furyjs/fury
```
