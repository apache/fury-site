---
title: Kotlin 设置
sidebar_position: 11
id: kotlin
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

Fory Kotlin 提供二进制对象序列化、生成的模型、Fory gRPC 和 Android 支持。它基于 Fory Java 运行，支持 Java 8 及更高版本。

## 验证工具链

```bash
java -version
./gradlew --version
# or: mvn -version
```

## 对象序列化

在应用模块中添加运行时：

```kotlin title="build.gradle.kts"
dependencies {
  implementation("org.apache.fory:fory-kotlin:1.6.1")
}
```

创建 `src/main/kotlin/KotlinExample.kt`：

```kotlin
import org.apache.fory.ThreadSafeFory
import org.apache.fory.kotlin.ForyKotlin

data class User(val id: Long, val name: String)

fun main() {
    val fory: ThreadSafeFory = ForyKotlin.builder()
        .withXlang(true)
        .requireClassRegistration(true)
        .buildThreadSafeFory()
    fory.register(User::class.java, 1)

    val bytes = fory.serialize(User(1, "Alice"))
    val decoded = fory.deserialize(bytes) as User
    println(decoded.name)
}
```

如果项目应用了 Gradle 的 `application` 插件，请运行对应的应用任务：

```bash
./gradlew run
```

与其他 Fory 运行时共享的数据使用 xlang 模式，仅供 Kotlin/JVM 使用的数据使用 native 模式。接下来可阅读 [Kotlin 对象序列化](../object-serialization/kotlin/index.md)、[xlang](../object-serialization/kotlin/basic-serialization.md#cross-language-interoperability)或 [native 模式](../object-serialization/kotlin/native.md)。

## 其他能力

- **Fory IDL 与编译器** 通过 KSP 生成 Kotlin 模型和注册辅助代码。请参阅[编译器快速入门](../compiler/getting-started.md)和 [Kotlin 生成代码指南](../compiler/generated-code/kotlin.md)。
- **Fory gRPC** 通过 grpc-kotlin 和 grpc-java 传输使用 Fory 编码的消息。请参阅 [Kotlin gRPC](../grpc/kotlin.md)。
- **Android** 使用生成的序列化器和同一个 Fory Kotlin 运行时。请参阅 [Android 对象序列化](../object-serialization/java/android.md)。
