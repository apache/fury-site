---
title: Scala 设置
sidebar_position: 10
id: scala
license: |
  Licensed to the Apache Software Foundation (ASF) under one or more
  contributor license agreements.  See the NOTICE file distributed with
  this work for additional information regarding copyright ownership.
  The ASF licenses this file to You under the Apache License, Version 2.0
  (the "License"); you may not use this file except in compliance with
  the License.  You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
---

Fory Scala 提供二进制对象序列化、生成的模型以及 Fory gRPC。运行时制品支持 Scala 2.13 和 Scala 3；生成的 Scala 模型需要 Scala 3。

## 验证工具链

```bash
java -version
scala -version
sbt --version
```

## 对象序列化

在 `build.sbt` 中添加运行时：

```sbt
ThisBuild / scalaVersion := "3.3.1"
libraryDependencies += "org.apache.fory" %% "fory-scala" % "1.5.0"
```

创建 `src/main/scala/ScalaExample.scala`：

```scala
import org.apache.fory.Fory
import org.apache.fory.scala.ForyScala

case class User(id: Long, name: String)

object ScalaExample {
  def main(args: Array[String]): Unit = {
    val fory: Fory = ForyScala.builder()
      .withXlang(true)
      .build()
    fory.register(classOf[User], 1)

    val bytes = fory.serialize(User(1, "Alice"))
    val decoded = fory.deserialize(bytes).asInstanceOf[User]
    println(decoded.name)
  }
}
```

```bash
sbt run
```

与其他 Fory 运行时共享的数据使用 xlang 模式，仅供 Scala/JVM 使用的数据使用 native 模式。接下来可阅读 [Scala 对象序列化](../object-serialization/scala/index.md)、[xlang](../object-serialization/scala/core-api.md#cross-language-interoperability)或 [native 模式](../object-serialization/scala/native.md)。

## 其他能力

- **Fory IDL 与编译器** 生成 Scala 3 模型和注册辅助代码。请参阅[编译器快速入门](../compiler/getting-started.md)和 [Scala 生成代码指南](../compiler/generated-code/scala.md)。
- **Fory gRPC** 通过 grpc-java 传输使用 Fory 编码的消息。请参阅 [Scala gRPC](../grpc/scala.md)。
