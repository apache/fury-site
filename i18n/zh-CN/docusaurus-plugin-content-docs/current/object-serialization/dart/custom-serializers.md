---
title: 自定义序列化器
sidebar_position: 10
id: custom-serializers
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

自定义序列化器允许精确控制类型的编码和解码方式。以下情况使用自定义序列化器：

- 需要完全自定义的二进制布局
- 目标需要字段名称转换或值转换
- 目标只公开工厂或私有构造方式
- 无法通过匹配的公共成员获取目标的完整状态
- 正在实现 union/判别类型

自己的模型使用 `@ForyStruct()`。对于其他包中结构匹配的类，请使用[外部结构化序列化器](external-types.md)。

## 实现 `Serializer<T>`

继承 `Serializer<T>` 并实现 `write` 和 `read`。使用 `context.buffer` 读写原始字节：

```dart
import 'package:fory/fory.dart';

final class Person {
  Person(this.name, this.age);

  final String name;
  final int age;
}

final class PersonSerializer extends Serializer<Person> {
  const PersonSerializer();

  @override
  void write(WriteContext context, Person value) {
    final buffer = context.buffer;
    buffer.writeUtf8(value.name);
    buffer.writeInt64FromInt(value.age);
  }

  @override
  Person read(ReadContext context) {
    final buffer = context.buffer;
    return Person(buffer.readUtf8(), buffer.readInt64AsInt());
  }
}
```

使用前注册序列化器：

```dart
final fory = Fory();
fory.registerSerializer(
  Person,
  const PersonSerializer(),
  name: 'example.Person',
);
```

## 写入嵌套对象

当序列化器具有本身由 Fory 管理的字段时，请使用 `context.writeRef` 和 `context.readRef`，而不是递归调用 `fory.serialize`。这样可以保证引用跟踪正确，并避免在嵌套载荷内写入完整根帧。

```dart
@override
void write(WriteContext context, Wrapper value) {
  context.writeRef(value.child);
}

@override
Wrapper read(ReadContext context) {
  return Wrapper(context.readRef() as Child);
}
```

如果嵌套值不需要引用标识跟踪（即确定该值在对象图中绝不会出现多次），请使用 `writeNonRef`：

```dart
context.writeNonRef(value.child);
```

## Union

对于判别式/带标签 union，请继承 `UnionSerializer<T>` 而不是 `Serializer<T>`。先写入判别值，再写入当前变体；读取判别值后执行相应分派。

```dart
final class ShapeSerializer extends UnionSerializer<Shape> {
  const ShapeSerializer();

  @override
  void write(WriteContext context, Shape value) {
    // write active variant
  }

  @override
  Shape read(ReadContext context) {
    // read discriminant, return correct variant
    throw UnimplementedError();
  }
}
```

## 自定义序列化器中的循环引用

如果序列化器可能遇到循环对象图，请在读取嵌套字段**之前**将对象绑定到引用跟踪器：

```dart
final value = Node.empty();
context.reference(value);         // register the object first
value.next = context.readRef() as Node?;  // now nested reads can refer back to it
return value;
```

跳过此步骤会导致指向该对象的反向引用解析为 `null`。

## 提示

- 在热路径中使用 `context.buffer` 直接读写字节。
- 所有端使用相同标识（`id` 或 `name`）注册序列化器。

## 相关主题

- [类型注册](type-registration.md)
- [外部类型序列化](external-types.md)
- [跨语言序列化](core-api.md#cross-language-interoperability)
- [故障排查](troubleshooting.md)
