---
slug: fory_1_5_0_release
title: Apache Fory 1.5.0 正式发布
authors: [chaokunyang]
tags: [fory, java, rust, csharp, swift, dart]
---

Apache Fory 团队很高兴地宣布 1.5.0 版本正式发布。本次发布包含 [25 个 PR](https://github.com/apache/fory/compare/v1.4.0...v1.5.0)。请访问[安装](https://fory.apache.org/zh-CN/docs/start/install)页面，获取适用于您所用平台的库。

## 亮点

* Fory JSON 的性能最高比 Jackson 快 5 倍、比 Gson 快 10 倍。
* Rust、Dart、Swift 和 C# 现已支持外部类型序列化，可为第三方结构化类型生成序列化器，同时保留常规 xlang 类型标识和编码方式。
* C# 和 Dart 现已支持类继承；Dart 还支持按需忽略继承的私有字段。

## 更快的 Fory JSON

Fory 1.5.0 为 Fory JSON 带来显著的性能跃升，对序列化和反序列化路径均进行了深度优化，性能最高比 Jackson 快 5 倍、比 Gson 快 10 倍。

<img src="/img/blog/fory_1_5_0_release/string_throughput.png" width="90%"/>

<img src="/img/blog/fory_1_5_0_release/utf8_bytes_throughput.png" width="90%"/>

| 表示形式   | 操作       | fory-json ops/sec | Jackson ops/sec | Gson ops/sec | 相比 Jackson | 相比 Gson |
| ---------- | ---------- | ----------------: | --------------: | -----------: | -----------: | --------: |
| String     | 序列化     |         7,387,465 |       2,049,368 |    1,084,042 |        3.60× |     6.81× |
| String     | 反序列化   |         2,897,955 |       1,074,885 |      902,772 |        2.70× |     3.21× |
| UTF-8 字节 | 序列化     |        10,375,498 |       1,868,614 |    1,037,211 |        5.55× |    10.00× |
| UTF-8 字节 | 反序列化   |         3,077,158 |       1,268,397 |      933,079 |        2.43× |     3.30× |

## Rust/Swift/CSharp/Dart 的外部类型序列化

Fory 1.5.0 为 Rust、Dart、Swift 和 C# 新增外部类型序列化。应用可以为无法修改、因而不能添加 Fory 注解的第三方结构化类型定义本地序列化器或 Schema 声明。随后，Fory 可以直接读写目标值，无需包装对象或中间镜像对象。

生成的声明沿用相应运行时常规的注册方式与编码模型。在 xlang 模式下，外部 struct、enum 和 union 使用与直接支持的类型相同的对应类型标识和编码方式。对于私有、不透明或需要维持内部不变量的目标类型，如果结构化代码生成并不合适，仍可使用自定义序列化器。

在 Rust 中，本地 derive 指定目标类型，并在处理根值时显式选择：

```rust
use fory::{Fory, ForyStruct};

#[derive(ForyStruct)]
#[fory(target = third_party::User)]
struct UserSerializer {
    name: String,
    age: u32,
}

let mut fory = Fory::builder().xlang(true).build();
fory.register::<UserSerializer>(100)?;
let bytes = fory.serialize_with::<UserSerializer>(&user)?;
let decoded =
    fory.deserialize_with::<UserSerializer>(&bytes)?;
```

Dart 根据本地 `target` 声明生成序列化器，再通过生成的模块注册第三方目标类型：

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

Swift 在应用继续传入 `ThirdParty.User` 值的同时，注册并选择外部序列化器：

```swift
@ForyStruct(target: ThirdParty.User.self)
struct UserSerializer {
    var name: String
    var age: UInt32
}

try fory.register(UserSerializer.self, id: 100)
let bytes = try fory.serialize(user, with: UserSerializer.self)
let decoded = try fory.deserialize(bytes, with: UserSerializer.self)
```

C# 源代码生成使用本地抽象声明，并通过常规 API 注册目标类型：

```csharp
using Apache.Fory;
using S = Apache.Fory.Schema.Types;

[ForyStruct(Target = typeof(ThirdParty.User))]
internal abstract class UserSerializer
{
    [ForyField(1)]
    public abstract string Name { get; }

    [ForyField(2, Type = typeof(S.Int32))]
    public abstract int Age { get; }
}

fory.Register<ThirdParty.User>(100);
byte[] bytes = fory.Serialize(user);
```

有关构造要求、嵌套容器、动态值和高级映射，请参阅 [Rust](/zh-CN/docs/guide/rust/external_types)、[Dart](/zh-CN/docs/guide/dart/external_types)、[Swift](/zh-CN/docs/guide/swift/external_types) 和 [C#](/zh-CN/docs/guide/csharp/external_types) 的专门指南。

## C# 和 Dart 的类继承支持

Fory 1.5.0 为 C# 和 Dart 新增类继承支持。在这两种运行时中，继承的存储字段和子类的存储字段会表示为一个扁平化 Schema，而不是嵌套的基类对象。因此，常规的字段排序、Schema 演进、引用跟踪和对象图内存检查仍可直接应用于具体类型。

在 C# 中，由于 `[ForyStruct]` 不会被继承，因此需要直接为每个参与继承的类添加注解。带注解的抽象基类为具体子类提供 Schema 字段，而只需注册具体派生类型：

```csharp
[ForyStruct]
public abstract class Entity
{
    [ForyField(1)]
    private long _id;

    public long Id => _id;
}

[ForyStruct]
public sealed class User : Entity
{
    [ForyField(2)]
    public string Name { get; set; } = string.Empty;
}

fory.Register<User>(102);
```

Dart 代码生成会发现超类和已应用 mix-in 中的存储字段。父类继承而来的公共字段无需注解，具体子类还可以按需忽略继承的私有字段：

```dart
class MessageBase {
  int sequence = 0;
  String _cache = '';
}

@ForyStruct(ignoreInheritedPrivateFields: true)
class TextMessage extends MessageBase {
  TextMessage();

  String text = '';
}
```

生成的 `TextMessage` Schema 包含 `sequence` 和 `text`，但不包含继承的私有字段 `_cache`。该选项不会忽略继承的公共字段，也不会忽略由子类自身声明的私有字段。

有关构造函数规则、跨 package 的私有字段访问、mix-in、泛型、引用和 Schema 兼容性，请参阅 [C# 类继承](/zh-CN/docs/guide/csharp/basic_serialization#class-inheritance)和 [Dart 继承](/zh-CN/docs/guide/dart/inheritance)。

## 新功能

* feat(java): 新增可配置的 JSON 基准测试报告，由 @chaokunyang 在 https://github.com/apache/fory/pull/3870 中贡献
* feat(java): 优化 JSON 性能，由 @chaokunyang 在 https://github.com/apache/fory/pull/3871 中贡献
* feat(rust): 支持外部类型序列化，由 @chaokunyang 在 https://github.com/apache/fory/pull/3881 中贡献
* feat(dart): 新增外部类型序列化，由 @chaokunyang 在 https://github.com/apache/fory/pull/3886 中贡献
* feat(swift): 支持外部类型序列化，由 @chaokunyang 在 https://github.com/apache/fory/pull/3888 中贡献
* feat(csharp): 支持外部类型序列化，由 @chaokunyang 在 https://github.com/apache/fory/pull/3889 中贡献
* feat(xlang): 强化外部类型支持，由 @chaokunyang 在 https://github.com/apache/fory/pull/3890 中贡献
* feat(csharp): 支持类继承代码生成，由 @chaokunyang 在 https://github.com/apache/fory/pull/3893 中贡献
* feat(dart): 新增 Dart 继承支持，由 @chaokunyang 在 https://github.com/apache/fory/pull/3892 中贡献
* feat(dart): 支持忽略继承的私有字段，由 @chaokunyang 在 https://github.com/apache/fory/pull/3894 中贡献

## 问题修复

* fix(cpp): 校验带 tag 的 struct 字段读取，由 @chaokunyang 在 https://github.com/apache/fory/pull/3884 中贡献
* fix(xlang): 拒绝格式错误的元字符串，由 @chaokunyang 在 https://github.com/apache/fory/pull/3885 中贡献
* fix(cpp): 校验多态智能指针读取，由 @chaokunyang 在 https://github.com/apache/fory/pull/3887 中贡献
* fix: 修复发布错误，由 @chaokunyang 在 https://github.com/apache/fory/pull/3891 中贡献

## 其他改进

* chore: 修复发布脚本，由 @chaokunyang 在 https://github.com/apache/fory/pull/3867 中贡献
* chore: 将 /javascript 中的 protobufjs 从 7.6.2 升级至 7.6.3，由 @dependabot[bot] 在 https://github.com/apache/fory/pull/3868 中贡献
* chore: 将 /benchmarks/java 中的 com.fasterxml.jackson.core:jackson-databind 从 2.22.0 升级至 2.22.1，由 @dependabot[bot] 在 https://github.com/apache/fory/pull/3869 中贡献
* chore(release): 将版本号更新至 1.4.0，由 @chaokunyang 在 https://github.com/apache/fory/pull/3874 中贡献
* docs: 新增 Java JSON 序列化文档，由 @chaokunyang 在 https://github.com/apache/fory/pull/3875 中贡献
* chore: 修复 package 元数据链接，由 @chaokunyang 在 https://github.com/apache/fory/pull/3876 中贡献
* chore: 将 /javascript 中的 protobufjs 从 7.6.3 升级至 7.6.5，由 @dependabot[bot] 在 https://github.com/apache/fory/pull/3878 中贡献
* chore: 将 /javascript 中的 tar 从 7.5.16 升级至 7.5.20，由 @dependabot[bot] 在 https://github.com/apache/fory/pull/3879 中贡献
* chore: 将 /java/fory-testsuite 中的 com.fasterxml.jackson.core:jackson-core 从 2.18.6 升级至 2.18.8，由 @dependabot[bot] 在 https://github.com/apache/fory/pull/3880 中贡献
* chore: 将 /javascript 中的 tar 从 7.5.20 升级至 7.5.22，由 @dependabot[bot] 在 https://github.com/apache/fory/pull/3882 中贡献
* chore(deps): 升级测试依赖，由 @chaokunyang 在 https://github.com/apache/fory/pull/3883 中贡献

**完整变更日志**：https://github.com/apache/fory/compare/v1.4.0...v1.5.0
