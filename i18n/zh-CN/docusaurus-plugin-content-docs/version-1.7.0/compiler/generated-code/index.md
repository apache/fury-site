---
title: 概述
sidebar_position: 1
id: index
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

本文档介绍各目标语言生成的代码。

Fory IDL 生成的类型遵循宿主语言习惯，可以直接用作领域对象。根据目标语言，生成的类型还包含 `to/from bytes` 辅助方法以及 Schema 模块或注册辅助方法。

生成的 Schema 模块根据 Schema 源文件命名，而不是根据包或命名空间命名。对于在语言
包或命名空间中直接公开模块的目标，`AddressbookForyModule` 或
`ComplexPbForyModule` 等名称允许多个 IDL 文件指向同一个包或命名空间，而不会生成
冲突的 `ForyModule` 类型。

## 参考 Schema

以下示例使用两个真实 Schema：

1. `addressbook.fdl`（显式类型 ID）
2. `auto_id.fdl`（无显式类型 ID）

### `addressbook.fdl` 摘录

```protobuf
package addressbook;

option go_package = "github.com/myorg/myrepo/gen/addressbook;addressbook";

message Person [id=100] {
    string name = 1;
    int32 id = 2;

    enum PhoneType [id=101] {
        PHONE_TYPE_MOBILE = 0;
        PHONE_TYPE_HOME = 1;
        PHONE_TYPE_WORK = 2;
    }

    message PhoneNumber [id=102] {
        string number = 1;
        PhoneType phone_type = 2;
    }

    list<PhoneNumber> phones = 7;
    Animal pet = 8;
}

message Dog [id=104] {
    string name = 1;
    int32 bark_volume = 2;
}

message Cat [id=105] {
    string name = 1;
    int32 lives = 2;
}

union Animal [id=106] {
    Dog dog = 1;
    Cat cat = 2;
}

message AddressBook [id=103] {
    list<Person> people = 1;
    map<string, Person> people_by_name = 2;
}
```

### `auto_id.fdl` 摘录

```protobuf
package auto_id;

enum Status {
    UNKNOWN = 0;
    OK = 1;
}

message Envelope {
    string id = 1;

    message Payload {
        int32 value = 1;
    }

    union Detail {
        Payload payload = 1;
        string note = 2;
    }

    Payload payload = 2;
    Detail detail = 3;
    Status status = 4;
}

union Wrapper {
    Envelope envelope = 1;
    string raw = 2;
}
```

## 跨语言说明

### 类型 ID 行为

- 生成的模块安装或注册辅助方法直接使用显式 `[id=...]` 值。
- 省略类型 ID 时，生成的代码使用计算得到的数字 ID（参见 `auto_id.*` 输出）。
- 如果设置了 `option enable_auto_type_id = false;`，生成的模块安装或注册辅助方法会使用基于名称的 API，而不是数字 ID。

### 嵌套类型形式

| 语言                  | 嵌套类型形式                 |
| --------------------- | ---------------------------- |
| Java                  | `Person.PhoneNumber`         |
| Python                | `Person.PhoneNumber`         |
| Rust                  | `person::PhoneNumber`        |
| C++                   | `Person::PhoneNumber`        |
| Go                    | `Person_PhoneNumber`（默认） |
| C#                    | `Person.PhoneNumber`         |
| JavaScript/TypeScript | `Person.PhoneNumber`         |
| Swift                 | `Person.PhoneNumber`         |
| Dart                  | `Person_PhoneNumber`         |
| Kotlin                | `PersonPhoneNumber`          |
| Scala                 | `Person.PhoneNumber`         |

### 字节辅助方法命名

| 语言                  | 辅助方法                    |
| --------------------- | --------------------------- |
| Java                  | `toBytes` / `fromBytes`     |
| Kotlin                | `toBytes` / `fromBytes`     |
| Scala                 | `toBytes` / `fromBytes`     |
| Python                | `to_bytes` / `from_bytes`   |
| Rust                  | `to_bytes` / `from_bytes`   |
| C++                   | `to_bytes` / `from_bytes`   |
| Go                    | `ToBytes` / `FromBytes`     |
| C#                    | `ToBytes` / `FromBytes`     |
| JavaScript/TypeScript | （通过 `fory.serialize()`） |
| Swift                 | `toBytes` / `fromBytes`     |
| Dart                  | （通过 `fory.serialize()`） |

## 语言参考

请选择目标语言对应的生成代码参考。生成的模型仍是普通的语言原生类型，并使用该语言支持的
Fory 序列化 API。

| 语言                  | 生成代码参考                           |
| --------------------- | -------------------------------------- |
| Java                  | [Java](java.md)                        |
| Python                | [Python](python.md)                    |
| C++                   | [C++](cpp.md)                          |
| Go                    | [Go](go.md)                            |
| Rust                  | [Rust](rust.md)                        |
| JavaScript/TypeScript | [JavaScript/TypeScript](javascript.md) |
| C#                    | [C#](csharp.md)                        |
| Swift                 | [Swift](swift.md)                      |
| Dart                  | [Dart](dart.md)                        |
| Scala                 | [Scala](scala.md)                      |
| Kotlin                | [Kotlin](kotlin.md)                    |
