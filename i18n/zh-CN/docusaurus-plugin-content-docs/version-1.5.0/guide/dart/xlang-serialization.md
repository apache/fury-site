---
title: Xlang 序列化
sidebar_position: 6
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

Apache Fory™ Dart 序列化所用的二进制格式与 Java、Go、C#、Python、Rust 和 Swift
的 Fory 实现相同。你可以在 Dart 中写入消息、在 Java 中读取，也可以使用其他任意
语言组合，而无需任何转换层。

## 设置

像平常一样创建 `Fory` 实例即可。Dart 不需要单独启用 xlang 选项：

```dart
final fory = Fory(); // xlang payloads with compatible schema evolution
```

关键要求是通信两端必须使用相同的标识注册同一个类型。

## 注册标识

最重要的规则是：**每一端都要使用相同的类型标识**。你有两种选择：

### 数字 ID

适合规模较小、协作紧密的团队：

```dart
// Dart
ModelsForyModule.register(fory, Person, id: 100);
```

### Namespace + Type Name

适合多个团队独立定义类型的场景：

```dart
// Dart
ModelsForyModule.register(
  fory,
  Person,
  name: 'example.Person',
);
```

不要在不同实现中为同一类型混用这两种策略。

## 外部类型

对于由另一个 Dart package 拥有的 struct 类，请定义一个
[外部结构化序列化器](external-types.md)，并使用每个对端都采用的相同 ID 或名称
注册目标类型：

```dart
@ForyStruct(target: third_party.User)
abstract final class UserSerializer {
  @ForyField(id: 1)
  late final String name;

  @ForyField(id: 2, type: Int32Type())
  late final int age;
}

ExternalSerializersForyModule.register(
  fory,
  third_party.User,
  id: 100,
);
```

该声明的字段 ID、名称、可空性和编码宽度注解共同定义 Dart 端的 xlang Schema。
外部声明可以显式列出目标类型中可访问的继承属性，但 Fory 不会自动扫描外部目标的
继承层次。

## Dart 到 Java 示例

### Dart

```dart
import 'package:fory/fory.dart';

part 'person.fory.dart';

@ForyStruct()
class Person {
  Person();

  String name = '';

  @ForyField(type: Int32Type())
  int age = 0;
}

final fory = Fory();
PersonForyModule.register(fory, Person, id: 100);
final bytes = fory.serialize(Person()
  ..name = 'Alice'
  ..age = 30);
```

### Java

```java
Fory fory = Fory.builder()
        .withXlang(true)
        .build();

fory.register(Person.class, 100);
Person value = (Person) fory.deserialize(bytesFromDart);
```

## Dart 到 C# 示例

### Dart

```dart
final fory = Fory();
PersonForyModule.register(fory, Person, id: 100);
final bytes = fory.serialize(Person()
  ..name = 'Alice'
  ..age = 30);
```

### CSharp

```csharp
[ForyStruct]
public sealed class Person
{
    public string Name { get; set; } = string.Empty;
    public int Age { get; set; }
}

Fory fory = Fory.Builder()
    .Build();

fory.Register<Person>(100);
Person person = fory.Deserialize<Person>(payloadFromDart);
```

## Dart 到 Go 示例

### Dart

```dart
final fory = Fory();
PersonForyModule.register(fory, Person, id: 100);
final bytes = fory.serialize(Person()
  ..name = 'Alice'
  ..age = 30);
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

Fory 按字段名或稳定的字段 ID 匹配字段。为确保可靠的跨语言互操作性：

1. 每一端都为同一类型使用相同的类型标识（相同的数字 ID 或相同的 `name`）。
2. 在发送第一份载荷之前，为所有字段分配稳定的 `@ForyField(id: ...)` 值。
3. 保持字段名一致，或者依赖字段 ID，因为 Dart 通常使用 `lowerCamelCase`，Go 的导出字段使用 `PascalCase`，C# 属性也常使用 `PascalCase`。
4. 使用显式数字字段元信息：对 Java `int`、Go `int32` 和 C# `int`，Dart 使用 `@ForyField(type: Int32Type())`；64 位浮点数使用 Dart `double`；16 位浮点数使用带 `Float16Type` 或 `Bfloat16Type` 注解的 `double`；32 位浮点数使用 `Float32`；完整范围的 64 位值使用 `Int64` / `Uint64`。
5. 时间字段使用 `Timestamp`、`LocalDate` 和 `Duration`，而不是原始 `DateTime`。
6. 发布前验证所有语言之间的真实往返。

对于常规 Dart 类，Fory 会将具体父类和所应用 mixin 的存储扁平化到带注解子类的
单一 struct Schema 中。父类字段和子类字段共享同一个字段 ID namespace 和规范顺序，
因此对端语言应定义等价的扁平字段集合。被 `@ForyField(ignore: true)` 或具体子类的
`ignoreInheritedPrivateFields` 选项省略的字段不会出现在对端 Schema 中。
父类不会被编码为嵌套对象。

继承的 `@ForyField(ref: true)` 和嵌套容器引用元信息与直接声明在子类上的字段使用
相同的引用行为。继承不会改变 xlang 引用帧，也不会增加父类级别的引用状态。

## Dart 类型映射说明

Dart `int` 本身并不承诺精确的 xlang 编码宽度，因此当跨语言解释需要精确定义时，
应优先使用显式字段元信息：

- xlang `int32` 使用 `@ForyField(type: Int32Type())`
- xlang `uint32` 使用 `@ForyField(type: Uint32Type())`
- 更窄的整数宽度使用 `@ForyField(type: Int8Type())` / `@ForyField(type: Int16Type())` / `@ForyField(type: Uint8Type())` / `@ForyField(type: Uint16Type())`
- Web 上完整范围的 64 位值使用 `Int64` 和 `Uint64`
- 16 位浮点标量使用带 `Float16Type` 或 `Bfloat16Type` 注解的 `double` 字段，单精度值使用 `Float32`
- 16 位浮点数组载荷使用 `Float16List` 和 `Bfloat16List`
- 显式时间语义使用 `Timestamp`、`LocalDate` 和 `Duration`

### List 与稠密数组

除非字段带有显式数组元信息，否则 `List<T>` 始终表示 Fory `list<T>`。
`array<T>` 仅用于稠密的一维 bool 或数值数据。

| Fory Schema       | Dart 字段载体及注解                                  |
| ----------------- | --------------------------------------------------- |
| `list<bool>`      | `List<bool>`                                        |
| `array<bool>`     | `@ArrayField(element: BoolType()) BoolList`         |
| `array<int8>`     | `@ArrayField(element: Int8Type()) Int8List`         |
| `array<int16>`    | `@ArrayField(element: Int16Type()) Int16List`       |
| `array<int32>`    | `@ArrayField(element: Int32Type()) Int32List`       |
| `array<int64>`    | `@ArrayField(element: Int64Type()) Int64List`       |
| `array<uint8>`    | `@ArrayField(element: Uint8Type()) Uint8List`       |
| `array<uint16>`   | `@ArrayField(element: Uint16Type()) Uint16List`     |
| `array<uint32>`   | `@ArrayField(element: Uint32Type()) Uint32List`     |
| `array<uint64>`   | `@ArrayField(element: Uint64Type()) Uint64List`     |
| `array<float16>`  | `@ArrayField(element: Float16Type()) Float16List`   |
| `array<bfloat16>` | `@ArrayField(element: Bfloat16Type()) Bfloat16List` |
| `array<float32>`  | `@ArrayField(element: Float32Type()) Float32List`   |
| `array<float64>`  | `@ArrayField(element: Float64Type()) Float64List`   |

请参见 [支持的类型](supported-types.md) 和 [xlang 类型映射](../../specification/xlang_type_mapping.md)。

## 验证

在生产环境中依赖跨语言契约之前，请让支持的每种实现都完成端到端载荷测试。

运行 Dart 端：

```bash
dart run build_runner build
dart analyze
dart test
```

## 相关主题

- [Struct 继承](inheritance.md)
- [类型注册](type-registration.md)
- [外部类型序列化](external-types.md)
- [Schema 演进](schema-evolution.md)
- [Xlang 指南](../xlang/index.md)
