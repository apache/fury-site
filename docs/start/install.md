---
id: install
title: Install
sidebar_position: 0
---

The official Apache Fury releases are provided as source artifacts.

For source download, please see Fury [download](https://fury.apache.org/download) page.

## Java

To add a dependency on Fury using Maven, use the following:

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

## Scala

To add a dependency on Fury scala for scala 2.13 with maven, use the following:

```xml
<dependency>
  <groupId>org.apache.fury</groupId>
  <artifactId>fury-scala_2.13</artifactId>
  <version>0.10.3</version>
</dependency>
```

To add a dependency on Fury scala for scala 3 with maven, use the following:

```xml
<dependency>
  <groupId>org.apache.fury</groupId>
  <artifactId>fury-scala_3</artifactId>
  <version>0.10.3</version>
</dependency>
```

To add a dependency on Fury scala for scala 2.13 with sbt, use the following:

```sbt
libraryDependencies += "org.apache.fury" % "fury-scala_2.13" % "0.10.3"
```

To add a dependency on Fury scala for scala 3 with sbt, use the following:

```sbt
libraryDependencies += "org.apache.fury" % "fury-scala_3" % "0.10.3"
```

## Kotlin

To add a dependency on Fury kotlin with maven, use the following:

```xml
<dependency>
  <groupId>org.apache.fury</groupId>
  <artifactId>fury-kotlin</artifactId>
  <version>0.10.3</version>
</dependency>
```
