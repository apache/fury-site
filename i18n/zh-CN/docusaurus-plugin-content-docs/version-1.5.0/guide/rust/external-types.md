---
title: 外部类型序列化
sidebar_position: 14
id: external_types
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

Rust 外部类型序列化允许应用程序直接序列化由其他 crate 所拥有的类型，无需包装值。对于可访问的公开 Schema，请使用派生的外部结构化序列化器；对于不透明类型或需要维持不变量的类型，请使用自定义序列化器。

## 统一的序列化器模型

序列化器实现会声明其处理的 Rust 值类型：

```rust
pub trait Serializer {
    type Target;

    fn write_data(
        value: &Self::Target,
        context: &mut WriteContext,
    ) -> Result<(), Error>;

    fn read_data(context: &mut ReadContext) -> Result<Self::Target, Error>;
}
```

对于普通本地类型，该类型由自身提供序列化器。对于外部类型，本地序列化器可以提供序列化行为，而无需包装或转换应用程序值。这些方法处理主体数据；Fory 的完整值 `write` 和 `read` 操作会添加所需的引用包装和类型信息包装。

当根值是 `Vec<third_party::User>` 这样的容器时，请组合 Fory 提供的承载序列化器，例如 `VecSerializer<UserSerializer>`。这些是编译时类型，永远不会被实例化。

Fory 不提供单独的公共字段序列化器、adapter、encoder 或 decoder trait。

## 外部结构化序列化器

当目标的每个字段或枚举变体都可公开访问，并且目标可以用相同结构直接构造时，请使用外部结构化序列化器：

```rust
use fory::ForyStruct;

#[derive(ForyStruct)]
#[fory(target = third_party::User)]
struct UserSerializer {
    name: String,
    age: u32,
}
```

外部结构化序列化器是一项 Schema 和代码生成声明。Fory 永远不会构造 `UserSerializer` 值。生成的代码会从 `third_party::User` 读取字段，并直接构造 `third_party::User`。

对于外部枚举或联合类型，外部结构化序列化器声明定义编码 Schema。在 xlang 模式下，显式 Fory ID 和按声明顺序生成的回退值定义 `ENUM` 或 `UNION` tag。Native 数据枚举仍然沿用现有的本地 `ForyUnion` tag 规则；外部类型序列化不会为显式 ID 赋予新的 native 含义。外部枚举的源代码声明顺序不定义 Schema。生成的穷举匹配仍会校验目标变体的名称和结构。

结构体和纯枚举的外部结构化序列化器继续使用现有的 `STRUCT` 和 `ENUM` 格式。与 xlang 兼容的数据枚举继续使用 `UNION`，而 native 结构体风格枚举继续使用现有的 `xlang = false` Rust 枚举格式。序列化器声明本身不会出现在编码数据中。

外部结构化序列化器不适用于私有类型、需要维持不变量的类型或 `#[non_exhaustive]` 目标。

与 xlang 兼容的数据枚举使用 `ForyUnion` 和现有的联合类型 case 规则：

```rust
use fory::{ForyUnion, UnknownCase};

#[derive(ForyUnion)]
#[fory(target = third_party::Value<UnknownCase>)]
enum ValueSerializer {
    #[fory(default)]
    Null,
    Text(String),
    Count(i64),
    #[fory(unknown)]
    Unknown(UnknownCase),
}
```

为了无损读取 xlang 联合类型，目标必须能够表示相同的运行时 unknown 承载类型。第三方 crate 可以通过声明 `Value<U>` 这样的泛型枚举来保持对 Fory 的独立性；应用程序将序列化器目标设置为 `Value<UnknownCase>`。无法承载 unknown case 的目标不能用于无损的外部 xlang 联合类型序列化。

### Native 结构体风格枚举

在 `xlang = false` 下，外部结构化序列化器支持完整的 Rust 数据枚举：unit 变体、带一个或多个字段的 tuple 变体、带一个或多个字段的具名变体，以及这些结构的任意组合。

```rust
use fory::ForyUnion;

#[derive(ForyUnion)]
#[fory(target = third_party::Command)]
enum CommandSerializer {
    #[fory(default)]
    Idle,
    Create {
        #[fory(with = UuidSerializer)]
        id: uuid::Uuid,
        label: String,
    },
    Move(i32, i32),
}
```

`ForyUnion` 仍然是携带数据的 Rust 枚举所使用的唯一派生宏；没有单独的 native 枚举宏。在 tuple 和具名变体载荷内部，同样可以使用直接序列化器、承载序列化器、list 元素、map key/value 以及异构 tuple 位置序列化器注解。Native 结构体风格枚举同时支持兼容模式和 Schema 一致的 native 序列化。

一个 xlang union case 最多只能携带一个可选值。因此，包含多个字段的 tuple 或具名 Rust 变体只能用于 native 模式。在 `xlang = true` 下为此类枚举注册序列化器时，会在发布注册之前返回错误。Fory 不会丢弃字段、合成隐藏的变体结构体，也不会静默地将该类型编码为 `EXT`。

## 自定义序列化器

对于 UUID 或 Jiff 值等不透明类型，请使用自定义序列化器：

```rust
use fory::{Error, ReadContext, Serializer, WriteContext};
use std::any::Any;
use std::sync::Arc;

struct UuidSerializer;

#[cold]
#[inline(never)]
fn invalid_uuid(error: uuid::Error) -> Error {
    Error::invalid_data(error.to_string())
}

impl Serializer for UuidSerializer {
    type Target = uuid::Uuid;

    fn write_data(
        value: &uuid::Uuid,
        context: &mut WriteContext,
    ) -> Result<(), Error> {
        context.writer.write_bytes(value.as_bytes());
        Ok(())
    }

    fn read_data(context: &mut ReadContext) -> Result<uuid::Uuid, Error> {
        let bytes = context.reader.read_bytes(16)?;
        uuid::Uuid::from_slice(bytes).map_err(invalid_uuid)
    }

    // 仅同步 Arc 动态承载类型需要此方法。
    fn read_arc_any(
        context: &mut ReadContext,
    ) -> Result<Arc<dyn Any + Send + Sync>, Error> {
        let value: Arc<dyn Any + Send + Sync> =
            Arc::new(Self::read_data(context)?);
        Ok(value)
    }
}
```

自定义序列化器使用现有的 `EXT` 或 `NAMED_EXT` 编码类型。其内部主体的演进由应用程序负责。如果主体长度会控制内存分配，自定义序列化器在预留或分配存储空间之前，必须使用读取上下文提供的可用字节数检查和对象图内存检查。

当自定义序列化器组合在变长承载类型之下时，承载类型中位于计数之后的完整字节数，平均必须达到每个已声明元素或 map 条目至少一个字节。Fory 会在承载类型写入后统一检查一次；如果主体过于紧凑，无法满足与之配对的分配安全检查，则返回错误。定长数组以及 `Vec`、`VecDeque` 或 `BinaryHeap` 中的零大小元素不会根据该计数分配存储空间，因此不受此限制。

Fory 只会在为最终 `Arc` owner 预留空间之后调用可选的 `read_arc_any` 方法；上面展示的方法只执行一次该分配，不得再次为同一个外层 owner 预留空间。不需要同步 `Arc` 动态承载类型的自定义序列化器可以省略此方法，并且仍然适用于带具体类型的值、`Box` 和 `Rc`；此时尝试具体化同步 `Arc` 会返回不支持错误。

## 字段和嵌套值

静态外部值需要显式指定其序列化器：

```rust
use fory::{ForyStruct, MutexSerializer, RefCellSerializer};
use std::cell::RefCell;
use std::sync::Mutex;

#[derive(ForyStruct)]
struct Request {
    #[fory(with = UuidSerializer)]
    request_id: uuid::Uuid,

    #[fory(with = UserSerializer)]
    user: third_party::User,

    #[fory(with = RefCellSerializer<UserSerializer>)]
    mutable_user: RefCell<third_party::User>,

    #[fory(with = MutexSerializer<UserSerializer>)]
    locked_user: Mutex<third_party::User>,
}
```

`with` 选择一个目标类型与已声明字段类型完全匹配的序列化器。对于 `Option`、`Box`、`Rc`、`Arc`、Fory 弱引用承载类型、`RefCell` 和 `Mutex`，请围绕子序列化器选择对应的承载序列化器。例如，对 `Option<third_party::User>` 使用 `OptionSerializer<UserSerializer>`，对 `Arc<third_party::User>` 使用 `ArcSerializer<UserSerializer>`。`RefCell` 和 `Mutex` 会保留子项的编码结构；序列化这些直接字段时只执行一次 borrow 或 lock，反序列化则会直接构造 holder，不会额外创建堆 owner。无论外部结构化序列化器嵌套在哪一种 wrapper 之后，兼容的 Schema 演进仍然有效。

在未跳过的派生字段中，每个承载类型构造器的规范名称都必须可见，可以选择带上模块路径。这同时适用于字段的 Rust 类型和 `with` 序列化器树。例如，应直接写出 `Vec<third_party::User>` 和 `VecSerializer<UserSerializer>`，不要通过类型别名或重命名导入隐藏任何一个承载类型树。叶子序列化器别名仍然有效。承载序列化器别名用于根值时也仍然有效，因为 Rust 会直接解析序列化器类型，无需生成字段代码。已跳过的字段也可以使用承载类型别名，因为它不会生成字段 Schema，只会使用所选序列化器的默认值。

已跳过的外部字段可以使用 `#[fory(skip, with = UserSerializer)]`。此时序列化器只用于其可能失败的构造默认值；该字段不会贡献任何 Schema 或主体字节。如果序列化器仅用于此处的跳过字段默认值，则无需注册。默认值会接收当前读取上下文，并且在进行任何自有内存分配前，必须预留对象图内存。已跳过的 list/map/tuple 字段可以保留递归子序列化器注解，不过空容器默认值不会调用其子项。

List 元素、map 子项和 tuple 位置在各自的递归 Schema 节点上选择序列化器：

```rust
use fory::{ForyStruct, VecSerializer};
use std::collections::HashMap;

#[derive(ForyStruct)]
struct Directory {
    #[fory(with = VecSerializer<UserSerializer>)]
    direct_users: Vec<third_party::User>,

    #[fory(list(element(with = UserSerializer)))]
    users: Vec<third_party::User>,

    #[fory(map(
        key(with = ExternalKeySerializer),
        value(with = UserSerializer)
    ))]
    by_key: HashMap<third_party::Key, third_party::User>,

    #[fory(tuple(
        element(index = 0, with = ExternalKeySerializer),
        element(index = 1, list(element(with = UserSerializer)))
    ))]
    entry: (third_party::Key, Vec<third_party::User>),
}
```

Tuple 索引从零开始。未提及的 tuple 位置使用其普通序列化器，tuple 元素内部可以继续包含相同的递归 list、map 或 tuple 元数据。支持的 tuple 元素数量为 1 到 22。

递归字段选择支持 `Vec`、`VecDeque`、`LinkedList`、`HashSet`、`BTreeSet`、`BinaryHeap`、定长数组、`HashMap`、`BTreeMap` 以及元素数量为 1 到 22 的 tuple。`direct_users` 为完全匹配的 `Vec` 节点选择承载序列化器；`users` 则递归选择元素序列化器。这两种形式都使用相同的内置 `Vec` 实现和结构化 `LIST` 表示。一个序列化器注解只应用于其声明的节点，绝不会静默地在组合类型中传播。

节点局部的 `#[fory(with = PackedUsersSerializer)]` 也可以选择一个自定义序列化器，其精确目标是整个 `Vec`、map、set、array 或 tuple。该字段使用不透明的 `EXT`/`NAMED_EXT` 编码，不包含子 Schema。它不能同时使用 `list`、`map`、`tuple`、`array`、`bytes` 或 `encoding`。当组合类型应保留其结构化编码类型，而只有子项需要选择序列化器时，应使用另一种选择——递归 list/map/tuple 注解。这种不透明的自定义方式不是用户声明的承载序列化器，不能组合子序列化器。

如果注册了这个与整个容器精确匹配的自定义序列化器，则精确目标的类型擦除多态值会使用它。子类型自行提供序列化器的普通无注解静态字段和根值仍然使用内置结构化容器格式；显式承载序列化器根值也仍然使用其声明的结构化格式。注册不会改变这些静态路径。

## 根值

普通本地根值继续使用 `serialize`、`serialize_to`、`deserialize` 和 `deserialize_from`。

外部根值需要选择其序列化器：

```rust
let bytes = fory.serialize_with::<UserSerializer>(&user)?;
let decoded =
    fory.deserialize_with::<UserSerializer>(&bytes)?;
```

完整的序列化器选择根值 API 包括：

- `serialize_with`；
- `serialize_to_with`；
- `deserialize_with`；
- `deserialize_from_with`。

序列化器是编译时类型参数。运行时无需传入序列化器实例、wrapper 或镜像值。

对于容器根值，请组合相应的 Fory 承载序列化器：

```rust
use fory::VecSerializer;

fory.register::<UserSerializer>(100)?;

let users: Vec<third_party::User> = load_users();
let bytes =
    fory.serialize_with::<VecSerializer<UserSerializer>>(&users)?;
let decoded: Vec<third_party::User> =
    fory.deserialize_with::<VecSerializer<UserSerializer>>(&bytes)?;
```

`VecSerializer<UserSerializer>` 的目标是 `Vec<third_party::User>`，并保留普通 `LIST` 格式。注册 `UserSerializer` 等所选外部结构化序列化器；不要注册承载序列化器本身。

Map key、map value 和嵌套容器可以递归组合：

```rust
use fory::{HashMapSerializer, VecSerializer};

type DirectorySerializer =
    HashMapSerializer<ExternalKeySerializer, VecSerializer<UserSerializer>>;

let bytes =
    fory.serialize_with::<DirectorySerializer>(&directory)?;
```

对于嵌套 list，`VecSerializer<VecSerializer<UserSerializer>>` 的目标是 `Vec<Vec<third_party::User>>`。

异构 tuple 根值按位置组合：

```rust
use fory::Tuple2Serializer;

type EntrySerializer =
    Tuple2Serializer<String, UserSerializer>;

let bytes =
    fory.serialize_with::<EntrySerializer>(&entry)?;
```

`EntrySerializer` 的目标是 `(String, third_party::User)`。Tuple 承载序列化器保留与普通双元素 tuple 相同的 native 或异构 `LIST` 表示。

完整的承载序列化器包括：

- `OptionSerializer`、`BoxSerializer`、`RcSerializer`、`ArcSerializer`、`RcWeakSerializer`、`ArcWeakSerializer`、`RefCellSerializer` 和 `MutexSerializer`；
- `VecSerializer`、`VecDequeSerializer`、`LinkedListSerializer`、`HashSetSerializer`、`BTreeSetSerializer`、`BinaryHeapSerializer` 和 `ArraySerializer`；
- `HashMapSerializer` 和 `BTreeMapSerializer`；
- `Tuple1Serializer` 至 `Tuple22Serializer`。

Fory 不提供 `Tuple0Serializer`：`()` 不包含子项，由自身提供序列化器。`PhantomData<T>` 同样不包含序列化子项，因此无需组合序列化器。

`Cell<T>` 目前不是 Rust 支持的序列化承载类型，因此没有 `CellSerializer`。`RefCell<T>` 是支持的内部可变承载类型。标准库 `Weak<T>` 也不是 Fory `RcWeak<T>` 或 `ArcWeak<T>` 的别名。

每个子参数都是另一个序列化器类型。它可以是以自身为目标的普通序列化器、外部结构化序列化器、自定义叶子序列化器或另一个 Fory 承载序列化器。这四种形式都会保留承载类型的内置编码。普通本地类型由自身提供序列化器，因此 `HashMapSerializer<String, UserSerializer>` 的目标是 `HashMap<String, third_party::User>`。`ArraySerializer<S, N>` 使用所选子序列化器对应的承载类型选择。`i32` 这样的规范原始类型序列化器会保留其紧凑数组格式，而外部结构化序列化器或自定义子序列化器使用 `LIST`，即使其目标是 Rust 原始类型也是如此。

`VecSerializer<S>` 同样会保留由其子项选择的普通 `Vec` 格式。`VecSerializer<i32>` 使用 `INT32_ARRAY`，`VecSerializer<u8>` 使用 `BINARY`，而 `VecSerializer<UserSerializer>` 使用 `LIST`。嵌套的 `VecSerializer<VecSerializer<i32>>` 使用外层 `LIST`，其元素类型是普通的 `INT32_ARRAY` 表示。序列化器组合绝不会将规范的原始类型 vector 转换成对象 `LIST`。

生成的字段会保留其声明的字段 Schema。未添加注解的 `Vec<i32>` 字段是 `LIST<VARINT32>`，`#[fory(list(element(encoding = fixed)))] Vec<i32>` 则是 `LIST<INT32>`。`#[fory(array)]` 选择紧凑 array，`#[fory(bytes)]` 选择 `BINARY`。包括 `VecSerializer<S>` 根值在内，所有这些形式都会保留其已声明 Schema 所选择的内置 `Vec` 编码。

Fory 永远不会根据目标类型或注册信息推断序列化器组合。请在承载序列化器类型中显式指定每个外部子序列化器。字段可以通过 `with` 选择一个精确的承载序列化器，例如 `#[fory(with = VecSerializer<UserSerializer>)]`。当序列化器在递归子节点上选择时，请使用内联的 `list(element(...))`、`map(key(...), value(...))` 语法或带索引的 `tuple(element(...))` 语法。

与整个容器或整个 tuple 精确匹配的自定义序列化器仍然可以作为不透明根值使用，但它会使用 `EXT`/`NAMED_EXT`，而不是内置结构化表示，并且不会选择子序列化器。

`_with` 方法后缀表示其泛型参数用于选择序列化器，与 `#[fory(with = UserSerializer)]` 一致。

## 注册

结构化序列化器和自定义序列化器使用现有的注册类别。请为每个序列化器选择一种身份形式。

数字注册：

```rust
fory.register::<UserSerializer>(100)?;
fory.register::<CommandSerializer>(101)?; // Native 结构体风格枚举。
fory.register_union::<ValueSerializer>(102)?; // 与 Xlang 兼容的联合类型。
fory.register_serializer::<UuidSerializer>(103)?;
```

名称注册：

```rust
fory.register_by_name::<UserSerializer>("example.User")?;
fory.register_by_name::<CommandSerializer>("example.Command")?;
fory.register_union_by_name::<ValueSerializer>("example.Value")?;
fory.register_serializer_by_name::<UuidSerializer>("example.Uuid")?;
```

注册会将编码身份与序列化器的目标相关联。对于同一个目标，一个 `Fory` 实例只接受一个已注册的动态序列化器。注册不会替换普通静态序列化器，也不会为无注解字段或根值隐式选择该序列化器。请在首次执行序列化操作前完成注册。注册每个结构化或自定义外部子序列化器；永远不要注册承载序列化器。

承载序列化器组合不会使整个容器成为动态 `Any` 目标。如果精确的整个容器必须参与类型擦除动态分派，请注册自定义的精确目标序列化器，并使用其 `EXT`/`NAMED_EXT` 表示。

## 多态

已注册的外部目标通过其目标身份参与 `Box<dyn Any>` 和 `Rc<dyn Any>`。如果结构化派生生成了 `Arc` 具体化代码，或其自定义序列化器实现了 `read_arc_any`，那么满足 `Send + Sync` 的目标还可以参与 `Arc<dyn Any + Send + Sync>`。

当所选具体序列化器支持对应模式时，这些类型擦除承载类型可以在 native 和 xlang 模式中使用。Rust 承载类型和应用程序 trait 名称不会被写入；xlang 模式仍然要求每个具体目标都具有可由 xlang 表示的结构化身份或 `EXT` 身份。

应用程序 trait 扩展小型且对象安全的 `ForyObject` trait，而不是 `Serializer`：

```rust
use fory::{register_trait_type, ForyObject};

trait Animal: ForyObject {
    fn name(&self) -> &str;
}

register_trait_type!(Animal, Dog, third_party::Cat);
```

具体目标列表是封闭且显式的。每个目标都可以使用普通序列化器、外部结构化序列化器或自定义序列化器。

对于 `Arc<dyn Trait>`，`sync` 形式要求 trait 和列出的目标实现 `Send + Sync`：

```rust
use fory::{register_trait_type, ForyObject};

trait Animal: ForyObject + Send + Sync {
    fn name(&self) -> &str;
}

register_trait_type!(sync Animal, Dog, third_party::Cat);
```

对于一个给定 trait，只能使用非 `sync` 声明和宏调用，或只使用 `sync` 声明和宏调用，不能同时使用两者。

默认情况下，生成的 trait 根序列化器名称仅在宏所在模块内可见。库可以使用 `register_trait_type!(pub Animal, ...)` 或 `register_trait_type!(pub sync Animal, ...)` 导出它们；trait 和列出的目标必须至少与生成的序列化器具有相同的可见范围。

`Box<dyn Animal>` 仍然可以直接作为根值。宏会为 `Rc<dyn Animal>` 根值生成零大小序列化器类型；对于 `sync` 宏形式，还会为 `Arc<dyn Animal>` 根值生成相应类型。宏不会生成 `Rc`/`Arc` 值 wrapper，也不会执行 wrapper 转换。

Trait 承载序列化器不需要按 ID 或名称注册。应用程序应通过普通序列化器、外部结构化序列化器或自定义序列化器注册每个允许的具体目标。

## 相关主题

- [自定义序列化器](custom-serializers.md)
- [多态](polymorphism.md)
- [类型注册](type-registration.md)
- [Schema 演进](schema-evolution.md)
