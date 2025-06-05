---
id: install
title: Install
sidebar_position: 0
---

The official Apache Fory releases are provided as source artifacts.

For source download, please see Fory [download](https://fory.apache.org/download) page.

## Java

To add a dependency on Fory using Maven, use the following:

```xml
<dependency>
  <groupId>org.apache.fory</groupId>
  <artifactId>fory-core</artifactId>
  <version>0.10.3</version>
</dependency>
<!-- row/arrow format support -->
<!-- <dependency>
  <groupId>org.apache.fory</groupId>
  <artifactId>fory-format</artifactId>
  <version>0.10.3</version>
</dependency> -->
```

## Scala

To add a dependency on Fory scala for scala 2.13 with maven, use the following:

```xml
<dependency>
  <groupId>org.apache.fory</groupId>
  <artifactId>fory-scala_2.13</artifactId>
  <version>0.10.3</version>
</dependency>
```

To add a dependency on Fory scala for scala 3 with maven, use the following:

```xml
<dependency>
  <groupId>org.apache.fory</groupId>
  <artifactId>fory-scala_3</artifactId>
  <version>0.10.3</version>
</dependency>
```

To add a dependency on Fory scala for scala 2.13 with sbt, use the following:

```sbt
libraryDependencies += "org.apache.fory" % "fory-scala_2.13" % "0.10.3"
```

To add a dependency on Fory scala for scala 3 with sbt, use the following:

```sbt
libraryDependencies += "org.apache.fory" % "fory-scala_3" % "0.10.3"
```

## Kotlin

To add a dependency on Fory kotlin with maven, use the following:

```xml
<dependency>
  <groupId>org.apache.fory</groupId>
  <artifactId>fory-kotlin</artifactId>
  <version>0.10.3</version>
</dependency>
```
