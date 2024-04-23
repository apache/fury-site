---
id: install
title: Install
sidebar_position: 0
---

The official Apache Fury releases are provided as source artifacts.

For source download, please see Fury [download](/docs/download/) page.


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
Maven groupId will be changed to `org.apache.fury` when the next version is released.

Note:
> This was released before Fury joined the Apache Incubator, Fury hasn't made a release under ASF yet.
> The maven groupId will be replaced to `org.apache.fury` when the next version is released.
