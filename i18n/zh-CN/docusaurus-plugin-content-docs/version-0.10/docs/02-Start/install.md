---
id: install
title: 安装 Apache Fury
sidebar_position: 0
---

Apache Fury 源码下载请参见 Apache Fury [download](https://github.com/apache/fury/releases)页面。

### Fury Java 安装

要使用 Maven 添加对 Apache Fury 的依赖，请使用以下配置：

```xml
<dependency>
  <groupId>org.apache.fury</groupId>
  <artifactId>fury-core</artifactId>
  <version>0.10.3</version>
</dependency>
<!-- row/arrow format support -->
<!-- <dependency>
  <groupId>org.apache.fury</groupId>
  <artifactId>fury-format</artifactId>
  <version>0.10.3</version>
</dependency> -->
```

### Fury Scala 安装

要使用 Maven 添加 scala 2.13 的 Fury scala 依赖，请使用以下配置：

```xml
<dependency>
  <groupId>org.apache.fury</groupId>
  <artifactId>fury-scala_2.13</artifactId>
  <version>0.10.3</version>
</dependency>
```

要使用 Maven 添加 scala 3 的 Fury scala 依赖，请使用以下配置：

```xml
<dependency>
  <groupId>org.apache.fury</groupId>
  <artifactId>fury-scala_3</artifactId>
  <version>0.10.3</version>
</dependency>
```

要使用 sbt 添加 scala 2.13 的 Fury scala 依赖，请使用以下配置：

```sbt
libraryDependencies += "org.apache.fury" % "fury-scala_2.13" % "0.10.3"
```

要使用 sbt 添加 scala 3 的 Fury scala 依赖，请使用以下配置：

```sbt
libraryDependencies += "org.apache.fury" % "fury-scala_3" % "0.10.3"
```

## Fury Kotlin 安装

To add a dependency on Fury kotlin with maven, use the following:

```xml
<dependency>
  <groupId>org.apache.fury</groupId>
  <artifactId>fury-kotlin</artifactId>
  <version>0.10.3</version>
</dependency>
```
