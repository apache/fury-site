---
title: 自定义序列化器
sidebar_position: 5
id: dart_custom_serializers
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

自定义序列化器让你可以完全控制某个类型如何编码和解码。通常只有在以下情况才需要使用它：

- 类型来自你无法修改的第三方包，无法添加 `@ForyStruct()`
- 你需要完全自定义的二进制布局
- 你要实现 union / discriminated type

对于你自己的模型，`@ForyStruct()` 配合代码生成几乎总是更好的选择。

## 实现 `Serializer<T>`

继承 `Serializer<T>` 并实现 `write` 和 `read`。通过 `context.buffer` 直接读写原始字节：

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
    buffer.writeInt64(value.age);
  }

  @override
  Person read(ReadContext context) {
    final buffer = context.buffer;
    return Person(buffer.readUtf8(), buffer.readInt64());
  }
}
```

在使用前先注册这个序列化器：

```dart
final fory = Fory();
fory.registerSerializer(
  Person,
  const PersonSerializer(),
  namespace: 'example',
  typeName: 'Person',
);
```

## 写入嵌套对象

如果自定义序列化器中的某个字段本身也是由 Fory 管理的类型，请使用 `context.writeRef` 和 `context.readRef`，而不是递归调用 `fory.serialize`。这样才能保持引用跟踪正确，也避免在嵌套载荷里再写入完整根帧。

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

如果你明确知道某个嵌套值永远不会在对象图中重复出现，也不需要保持引用标识，可以用 `writeNonRef`：

```dart
context.writeNonRef(value.child);
```

## Union

对于带判别标签的 union，请继承 `UnionSerializer<T>` 而不是 `Serializer<T>`。先写入判别值，再写入当前激活的变体；读取时先解析判别值，再分派到正确分支。

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

如果你的序列化器会遇到循环对象图，那么在读取嵌套字段之前，必须先把对象绑定到引用跟踪器中：

```dart
final value = Node.empty();
context.reference(value);         // register the object first
value.next = context.readRef() as Node?;  // now nested reads can refer back to it
return value;
```

跳过这一步会导致指向该对象的回溯引用解析成 `null`。

## 提示

- 在热点路径中，优先使用 `context.buffer` 直接读写字节。
- 在所有端上，都用相同的身份注册该序列化器，即相同的 `id` 或相同的 `namespace + typeName`。

## 相关主题

- [类型注册](type-registration.md)
- [跨语言](xlang-serialization.md)
- [故障排查](troubleshooting.md)
