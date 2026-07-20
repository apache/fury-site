---
title: Xlang 序列化
sidebar_position: 2
id: xlang_serialization
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

Apache Fory™ Dart 生成的二进制格式与 Java、Go、C#、Python、Rust 和 Swift 的 Fory 运行时保持一致。你可以在 Dart 中写消息，在 Java 中读取，或者反过来，整个过程都不需要额外的转换层。

## 设置

像平常一样创建 `Fory` 实例即可。Dart 中不需要单独开启“xlang 模式”：

```dart
final fory = Fory(); // 或者在需要 Schema 演进时使用 Fory(compatible: true)
```

关键要求是：通信两端必须用同一身份注册同一个类型。

## 注册身份

最重要的规则是：**每一端都要使用相同的类型身份**。你有两种选择：

### 数字 ID

更适合小团队、强协同的场景：

```dart
// Dart
ModelsFory.register(fory, Person, id: 100);
```

### Namespace + Type Name

更适合多个团队分别定义类型的场景：

```dart
// Dart
ModelsFory.register(
  fory,
  Person,
  namespace: 'example',
  typeName: 'Person',
);
```

不要在不同运行时上对同一个类型混用这两种策略。

## Dart 到 Java 示例

### Dart

```dart
import 'package:fory/fory.dart';

part 'person.fory.dart';

@ForyStruct()
class Person {
  Person();

  String name = '';
  Int32 age = Int32(0);
}

final fory = Fory();
PersonFory.register(fory, Person, id: 100);
final bytes = fory.serialize(Person()
  ..name = 'Alice'
  ..age = Int32(30));
```

### Java

```java
Fory fory = Fory.builder()
    .withLanguage(Language.XLANG)
    .build();

fory.register(Person.class, 100);
Person value = (Person) fory.deserialize(bytesFromDart);
```

## Dart 到 C# 示例

### Dart

```dart
final fory = Fory(compatible: true);
PersonFory.register(fory, Person, id: 100);
final bytes = fory.serialize(Person()
  ..name = 'Alice'
  ..age = Int32(30));
```

### CSharp

```csharp
[ForyObject]
public sealed class Person
{
    public string Name { get; set; } = string.Empty;
    public int Age { get; set; }
}

Fory fory = Fory.Builder()
    .Compatible(true)
    .Build();

fory.Register<Person>(100);
Person person = fory.Deserialize<Person>(payloadFromDart);
```

## Dart 到 Go 示例

### Dart

```dart
final fory = Fory();
PersonFory.register(fory, Person, id: 100);
final bytes = fory.serialize(Person()
  ..name = 'Alice'
  ..age = Int32(30));
```

### Go

```go
type Person struct {
    Name string
    Age  int32
}

f := fory.New(fory.WithXlang(true))
_ = f.RegisterStruct(Person{}, 100)

var person Person
_ = f.Deserialize(bytesFromDart, &person)
```

## 字段匹配规则

Fory 会按字段名或稳定字段 ID 匹配字段。为了获得稳健的跨语言互操作性：

1. 各端对同一类型使用相同的类型身份，即相同的数字 ID 或相同的 `namespace + typeName`。
2. 在首次对外发送载荷之前，为所有字段分配稳定的 `@ForyField(id: ...)`。
3. 保持字段名一致，或者依赖字段 ID，因为 Dart 通常使用 `lowerCamelCase`，Go 为导出字段使用 `PascalCase`，C# 也常用 `PascalCase` 属性。
4. 使用兼容的数字类型：当对端为 Java `int`、Go `int32` 或 C# `int` 时，在 Dart 中使用 `Int32`；Dart 的 `double` 对应 64 位浮点；32 位浮点请使用 `Float32`。
5. 日期时间字段优先使用 `Timestamp` 和 `LocalDate`，不要直接用原始 `DateTime`。
6. 发布前一定要在所有目标语言间完成真实 round trip 验证。

## Dart 的类型映射说明

由于 Dart `int` 本身并不承诺精确的跨语言编码宽度，所以一旦跨语言解释需要精确定义，就应优先使用包装类型或数字字段注解：

- `Int32` 对应 xlang `int32`
- `UInt32` 对应 xlang `uint32`
- `Float16` 和 `Float32` 对应用于较小宽度的浮点数
- `Timestamp` 和 `LocalDate` 用于显式的时间语义

参见 [支持的类型](supported-types.md) 和 [xlang type mapping](../../specification/xlang_type_mapping.md)。

## 验证

在生产环境依赖跨语言契约之前，请让每一种支持的运行时都完成端到端验证。

运行 Dart 端：

```bash
dart run build_runner build --delete-conflicting-outputs
dart analyze
dart test
```

## 相关主题

- [类型注册](type-registration.md)
- [Schema 演进](schema-evolution.md)
- [跨语言指南](../xlang/index.md)
