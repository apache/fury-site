---
title: 基础序列化
sidebar_position: 1
id: core-api
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

本页介绍如何使用 Apache Fory™ Dart 的默认 xlang 模式序列化和反序列化值。

## 创建 `Fory` 实例

创建并复用一个实例；每次调用都创建新的 `Fory` 会浪费资源。

```dart
import 'package:fory/fory.dart';

final fory = Fory();
```

## 序列化和反序列化带注解类型

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

void main() {
  final fory = Fory();
  PersonForyModule.register(
    fory,
    Person,
    name: 'example.Person',
  );

  final person = Person()
    ..name = 'Ada'
    ..age = 36;

  final bytes = fory.serialize(person);
  final roundTrip = fory.deserialize<Person>(bytes);
  print(roundTrip.name);
}
```

`deserialize<T>` 返回转换为 `T` 的解码值。如果载荷描述的类型与 `T` 不同，它会抛出异常。

## Null 值

支持直接序列化 `null`：

```dart
final fory = Fory();
final bytes = fory.serialize(null);
final value = fory.deserialize<Object?>(bytes);
```

## 序列化集合和动态载荷

可以直接序列化集合值：

```dart
final fory = Fory();
final bytes = fory.serialize(<Object?>[
  'hello',
  42,
  true,
]);
final value = fory.deserialize<List<Object?>>(bytes);
```

对于异构集合，请反序列化为 `Object?`、`List<Object?>` 或 `Map<Object?, Object?>`。

## 引用跟踪

默认情况下，Fory 不跟踪对象标识；如果同一个对象在列表中出现两次，它会被序列化两次。当数据包含共享引用或循环结构时，请启用引用跟踪。

对于顶层集合：

```dart
final fory = Fory();
final shared = String.fromCharCodes('shared'.codeUnits);
final bytes = fory.serialize(<Object?>[shared, shared], trackRef: true);
final roundTrip = fory.deserialize<List<Object?>>(bytes);
print(identical(roundTrip[0], roundTrip[1])); // true
```

对于生成 struct 内的字段，请改为在该字段上使用 `@ForyField(ref: true)`。

## 复用缓冲区

如果希望避免每次调用都分配新的 `Uint8List`，请将 `serializeTo` 和 `deserializeFrom` 与显式 `Buffer` 配合使用：

```dart
final fory = Fory();
final buffer = Buffer();

fory.serializeTo('Ada', buffer);
final value = fory.deserializeFrom<String>(buffer);
```

这是一项优化。对于大多数应用，默认的 `serialize`/`deserialize` 组合已经足够。

## 序列化前注册类型

序列化自定义 class 或 enum 前，需要向 `Fory` 注册。生成代码可以简化此操作：

```dart
PersonForyModule.register(
  fory,
  Person,
  id: 100,
);
```

如果跳过注册，反序列化会以 `Type ... is not registered` 失败。参见[类型注册](type-registration.md)和[代码生成](code-generation.md)。

## 跨语言互操作 {#cross-language-interoperability}

以下内容说明默认 xlang 格式的跨语言类型映射、类型标识和互操作要求。

Apache Fory™ Dart 与 Java、Go、C#、Python、Rust 和 Swift 的 Fory 实现使用相同的二进制格式进行序列化。你可以在 Dart 中写入消息并在 Java 中读取，反之亦然，无需任何转换层。

### Xlang 配置

按常规方式创建 `Fory` 实例。Dart 中无需启用单独的 xlang 选项：

```dart
final fory = Fory(); // xlang payloads with compatible schema evolution
```

关键要求是两端使用相同身份注册同一类型。

### 注册身份

最重要的规则是：**所有端都使用相同的类型身份**。你有两种选择：

#### 数字 ID

更适合规模较小、协作紧密的团队：

```dart
// Dart
ModelsForyModule.register(fory, Person, id: 100);
```

#### 命名空间 + 类型名称

更适合多个团队独立定义类型的场景：

```dart
// Dart
ModelsForyModule.register(
  fory,
  Person,
  name: 'example.Person',
);
```

不要在不同实现中为同一类型混用这两种策略。

### 外部类型

对于由另一个 Dart 软件包拥有的结构体类，请定义
[外部结构化序列化器](external-types.md)，并使用所有对端都采用的相同 ID 或名称注册目标：

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

声明中的字段 ID、名称、可空性和编码宽度注解定义了 Dart 端的 xlang Schema。外部声明
可以显式列出可访问的继承目标属性，但 Fory 不会自动扫描外部目标的层次结构。

### Dart 到 Java 示例

#### Dart

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

#### Java

```java
Fory fory = Fory.builder()
        .withXlang(true)
        .build();

fory.register(Person.class, 100);
Person value = (Person) fory.deserialize(bytesFromDart);
```

### Dart 到 C# 示例

#### Dart

```dart
final fory = Fory();
PersonForyModule.register(fory, Person, id: 100);
final bytes = fory.serialize(Person()
  ..name = 'Alice'
  ..age = 30);
```

#### CSharp

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

### Dart 到 Go 示例

#### Dart

```dart
final fory = Fory();
PersonForyModule.register(fory, Person, id: 100);
final bytes = fory.serialize(Person()
  ..name = 'Alice'
  ..age = 30);
```

#### Go

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

### 字段匹配规则

Fory 按名称或稳定的字段 ID 匹配字段。为了实现稳健的跨语言互操作：

1. 所有端使用相同的类型身份（相同的数字 ID 或相同的 `name`）。
2. 在发布第一个载荷之前，为所有字段分配稳定的 `@ForyField(id: ...)` 值。
3. 保持字段名称一致或依赖 ID，因为 Dart 通常使用 `lowerCamelCase`，而 Go 的导出字段使用 `PascalCase`，C# 属性也常使用 `PascalCase`。
4. 使用显式数值字段元数据：在 Dart 中使用 `@ForyField(type: Int32Type())` 来对应 Java `int`、Go `int32` 和 C# `int`；64 位浮点数使用 `double`；16 位浮点数使用 `double` 加 `Float16Type` 或 `Bfloat16Type`；32 位浮点数使用 `Float32`；完整范围的 64 位值使用 `Int64` / `Uint64`。
5. 时间字段使用 `Timestamp`、`LocalDate` 和 `Duration`，而不是原始 `DateTime`。
6. 发布前在所有语言之间验证真实的往返处理。

对于普通 Dart 类，Fory 会将具体超类和已应用 mixin 的存储展平到带注解子类的单个结构体
Schema 中。父类和子类字段共享同一个字段 ID 命名空间和同一种规范顺序，因此对端语言
应定义等价的已包含扁平字段集合。由 `@ForyField(ignore: true)` 或具体子类的
`ignoreInheritedPrivateFields` 选项省略的字段不会出现在对端 Schema 中。父类不会编码
为嵌套对象。

已包含的继承 `@ForyField(ref: true)` 和嵌套容器引用元数据，与直接声明在子类上的字段
使用相同的引用行为。继承不会改变 xlang 引用成帧方式，也不会添加父类级别的引用状态。

### Dart 类型映射说明

由于 Dart `int` 本身并不保证确切的 xlang 编码宽度，因此在需要精确跨语言解释时，应优先使用显式字段元数据：

- 使用 `@ForyField(type: Int32Type())` 表示 xlang `int32`
- 使用 `@ForyField(type: Uint32Type())` 表示 xlang `uint32`
- 较窄的整数宽度使用 `@ForyField(type: Int8Type())` / `@ForyField(type: Int16Type())` / `@ForyField(type: Uint8Type())` / `@ForyField(type: Uint16Type())`
- Web 上使用 `Int64` 和 `Uint64` 表示完整范围的 64 位值
- 16 位浮点标量使用 `double` 字段，并添加 `Float16Type` 或 `Bfloat16Type` 注解；单精度值使用 `Float32`
- 16 位浮点数组载荷使用 `Float16List` 和 `Bfloat16List`
- 明确的时间语义使用 `Timestamp`、`LocalDate` 和 `Duration`

#### 列表与稠密数组

除非字段具有显式数组元数据，否则 `List<T>` 始终表示 Fory `list<T>`。仅对一维稠密
bool 或数值数据使用 `array<T>`。

| Fory Schema       | Dart 字段载体与注解                                 |
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

请参阅[支持的类型](supported-types.md)和 [xlang 类型映射](../../specification/xlang_type_mapping.md)。

### 验证

在生产环境中依赖跨语言契约之前，请使用你支持的每种实现对载荷执行端到端测试。

运行 Dart 端：

```bash
dart run build_runner build
dart analyze
dart test
```

### 相关指南

- [结构体继承](inheritance.md)
- [类型注册](type-registration.md)
- [外部类型序列化](external-types.md)
- [Schema 演进](schema-evolution.md)
- [Xlang 指南](../xlang/index.md)

## 相关主题

- [配置](configuration.md)
- [类型注册](type-registration.md)
- [Schema 元数据](schema-metadata.md)
