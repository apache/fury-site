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

Fory Kotlin 提供二进制对象序列化、标准 JSON 映射、生成模型、Fory gRPC 和 Android 支持。它基于 Fory Java 运行，支持 Java 8 及更新版本。

## 验证工具链

```bash
java -version
./gradlew --version
# or: mvn -version
```

## 对象序列化

以下仓库从 Maven Central 解析发布版本坐标，从 Apache 快照仓库解析 `-SNAPSHOT` 坐标。所有 Fory 模块应使用同一版本：

```kotlin title="build.gradle.kts"
repositories {
  maven("https://repository.apache.org/snapshots/") {
    mavenContent { snapshotsOnly() }
  }
  mavenCentral()
}

dependencies {
  implementation("org.apache.fory:fory-kotlin:1.7.0")
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

## 标准 JSON {#standard-json}

Fory JSON 是独立于二进制对象序列化的文本格式。与普通 JSON API、浏览器、日志或其他 JSON 库交互时，可添加其可选 Kotlin 模块：

```kotlin title="build.gradle.kts"
dependencies {
  implementation("org.apache.fory:fory-json-kotlin:1.7.0")
}
```

```kotlin
import org.apache.fory.json.kotlin.ForyJsonKotlin
import org.apache.fory.json.kotlin.jsonTypeRef

data class User(val id: Long, val name: String)

val json = ForyJsonKotlin.builder().build()
val userType = jsonTypeRef<User>()
val text = json.toJson(User(1, "Alice"), userType)
val decoded = json.fromJson(text, userType)
```

运行时直接读取 Kotlin/JVM 元数据。仅在使用 R8 或 ProGuard 的 Android 构建中添加 `fory-json-kotlin-ksp`；它为 Kotlin `@JsonType` 模型和应用源码中声明的精确 Mixin 生成精确保留规则。Native Image 使用常规 `@ForyJsonProvider` 流程。继续阅读 [Kotlin JSON](../json/kotlin.md)。

## 其他能力

- **Fory IDL 与编译器** 通过 KSP 生成 Kotlin 模型和注册辅助代码。请参阅[编译器快速入门](../compiler/getting-started.md)和 [Kotlin 生成代码指南](../compiler/generated-code/kotlin.md)。
- **Fory gRPC** 通过 grpc-kotlin 和 grpc-java 传输使用 Fory 编码的消息。请参阅 [Kotlin gRPC](../grpc/kotlin.md)。
- **Android** 使用生成的序列化器和同一个 Fory Kotlin 运行时。请参阅 [Android 对象序列化](../object-serialization/java/android.md)。
