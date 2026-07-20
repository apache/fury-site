---
title: 故障排查
sidebar_position: 10
id: dart_troubleshooting
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

本页汇总 Dart 运行时中常见的问题及其修复方式。

## `Only xlang payloads are supported by the Dart runtime.`

写端发送的是 native-mode（非 xlang）载荷。请确保每个服务都走跨语言兼容路径：

- **Java**：在 Fory builder 上添加 `.withLanguage(Language.XLANG)`。
- **Go**：在 Fory 选项中使用 `WithXlang(true)`。
- **其他运行时**：查看各自文档，确认如何启用跨语言模式。

## `Type ... is not registered.`

Fory 不知道如何序列化或反序列化这个类型。可按以下方式修复：

1. 如果还没生成代码，先运行：`dart run build_runner build --delete-conflicting-outputs`
2. 在调用 `serialize` 或 `deserialize` **之前**，先调用生成的 `register` 函数，或者 `registerSerializer`
3. 注册消息中可能出现的**所有**类型，而不仅仅是根类型。例如，如果 `Order` 包含 `Address`，那两者都要注册

## 生成的 part 文件缺失或已过期

重新生成代码：

```bash
cd dart/packages/fory
dart run build_runner build --delete-conflicting-outputs
```

如果你移动了文件或重命名了类型，请在重新执行分析或测试前先重新构建。

## `Deserialized value has type ..., expected ...`

载荷描述的类型与 `deserialize<T>` 中的 `T` 不一致。常见原因包括：

- 写端注册该类型时使用的 ID 或名称，与读端不一致
- 载荷来自另一条代码路径，根对象类型不同
- 你正在反序列化异构容器。应先按 `Object?` 或 `List<Object?>` 解码，再做类型转换

## 反序列化后对象不再是同一个实例

默认情况下，Fory 不会跟踪对象标识，因此两个字段如果指向同一个对象，round trip 后会变成两个独立副本。

如果需要保留对象标识：

- 对 `@ForyStruct` 内部字段，在对应字段上加 `@ForyField(ref: true)`
- 对顶层集合，调用 `fory.serialize(...)` 时传入 `trackRef: true`
- 在自定义序列化器中，使用 `context.writeRef` / `context.readRef`，并在读取嵌套字段之前先调用 `context.reference(obj)`

## 跨语言字段不匹配（数据缺失或值错误）

典型症状：往返另一种语言后，字段变成默认值，或者类型错误。

检查清单：

1. 双方使用相同的注册身份，即相同数字 ID，**或**相同的 `namespace + typeName`
2. 在第一份载荷发送前，就已经分配了稳定 `@ForyField(id: ...)`
3. 数字宽度兼容。当对端字段是 Java `int`、Go `int32` 或 C# `int` 时，在 Dart 端使用 `Int32`
4. 日期时间字段使用 `Timestamp` / `LocalDate`，而不是原始 `DateTime`
5. 如果用到 Schema 演进，则**双方**都要开启 `compatible: true`

## 本地运行测试

主 Dart 包：

```bash
dart run build_runner build --delete-conflicting-outputs
dart analyze
dart test
```

集成测试包：

```bash
cd dart/packages/fory-test
dart run build_runner build --delete-conflicting-outputs
dart test
```

## 相关主题

- [跨语言](xlang-serialization.md)
- [代码生成](code-generation.md)
- [自定义序列化器](custom-serializers.md)
