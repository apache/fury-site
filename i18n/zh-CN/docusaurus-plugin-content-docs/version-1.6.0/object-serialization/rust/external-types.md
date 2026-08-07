---
title: 外部类型序列化
sidebar_position: 10
id: external-types
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

Rust 外部类型序列化允许应用直接序列化其他 crate 拥有的类型，无需包装值。对于可访问的公共 Schema，请使用派生的外部结构化序列化器；对于不透明或带有不变量的类型，请使用自定义序列化器。

## 统一的序列化器模型

序列化器实现会声明它所处理的 Rust 值类型：

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

对于普通本地类型，该类型自身提供序列化器。对于外部类型，本地序列化器在不包装或转换应用值的情况下提供序列化行为。这些方法处理主体数据；Fory 的完整值 `write` 和 `read` 操作会添加所需的引用和类型信息封装。

当根值是 `Vec<third_party::User>` 这样的容器时，请组合 Fory 提供的 `VecSerializer<UserSerializer>` 等载体序列化器。这些是编译期类型，永远不会被实例化。

不存在单独的公共字段序列化器、适配器、编码器或解码器 trait。

## 外部结构化序列化器

当目标的每个字段或枚举变体都可公开访问，并且可以用相同结构直接构造目标时，请使用外部结构化序列化器：

```rust
use fory::ForyStruct;

#[derive(ForyStruct)]
#[fory(target = third_party::User)]
struct UserSerializer {
    name: String,
    age: u32,
}
```

外部结构化序列化器是一项 Schema 和代码生成声明。Fory 永远不会构造 `UserSerializer` 值。生成的代码从 `third_party::User` 读取字段，并直接构造 `third_party::User`。

对于外部枚举或 union，外部结构化序列化器声明定义编码 Schema。在 xlang 模式中，显式 Fory ID 和基于声明顺序的回退规则定义 ENUM 或 UNION 标签。原生数据枚举保留现有的本地 `ForyUnion` 标签规则；外部类型序列化不会为显式 ID 赋予新的原生含义。外部枚举的源码声明顺序并不定义 Schema。生成的穷举匹配仍会校验目标变体的名称和结构。

结构体和纯枚举的外部结构化序列化器保留现有 STRUCT 和 ENUM 格式。兼容 xlang 的数据枚举保留 UNION，而原生结构体风格枚举保留现有的 `xlang = false` Rust 枚举格式。序列化器声明不会出现在编码格式中。

私有、带有不变量或标记为 `#[non_exhaustive]` 的目标不能使用外部结构化序列化器。

兼容 xlang 的数据枚举使用 `ForyUnion` 和现有的 union case 规则：

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

为了无损读取 xlang union，目标必须表示相同的内存中未知 case 载体。第三方 crate 可以通过声明 `Value<U>` 等泛型枚举来保持对 Fory 的独立；应用将序列化器目标设置为 `Value<UnknownCase>`。无法承载未知 case 的目标不能用于无损外部 xlang union 序列化。

### 原生结构体风格枚举 {#native-struct-style-enums}

使用 `xlang = false` 时，外部结构化序列化器支持完整的 Rust 数据枚举范围：unit 变体、包含一个或多个字段的 tuple 变体、包含一个或多个字段的具名变体，以及这些结构的任意组合。

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

`ForyUnion` 仍是携带数据的 Rust 枚举唯一使用的派生宏；不存在单独的原生枚举宏。直接序列化器、载体序列化器、列表元素、map key/value 和异构 tuple 位置的序列化器注解也能用于 tuple 和具名变体的载荷内部。原生结构体风格枚举同时支持兼容模式和 Schema 一致的原生序列化。

xlang union case 最多只能携带一个备选值。因此，多字段 tuple 或具名 Rust 变体只能用于原生模式。在 `xlang = true` 时为此类枚举注册序列化器，会在发布注册信息前返回错误。Fory 不会丢弃字段、合成隐藏的变体结构体，也不会静默地将该类型编码为 EXT。

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

    // Required only for sync Arc dynamic carriers.
    fn read_arc_any(
        context: &mut ReadContext,
    ) -> Result<Arc<dyn Any + Send + Sync>, Error> {
        let value: Arc<dyn Any + Send + Sync> =
            Arc::new(Self::read_data(context)?);
        Ok(value)
    }
}
```

自定义序列化器使用现有的 EXT 或 NAMED_EXT 编码类型。其内部主体的演进由应用负责。如果主体长度控制一次内存分配，自定义序列化器必须在预留或分配存储空间之前，使用读取上下文提供的可用字节和对象图内存检查。

当自定义序列化器组合在可变大小载体之下时，载体中计数之后的完整字节必须保证每个声明的元素或 map 条目平均至少占用一个字节。Fory 会在写入载体后检查一次；如果主体过于紧凑，无法满足配套的分配安全检查，则返回错误。固定数组以及 `Vec`、`VecDeque` 或 `BinaryHeap` 中的零大小元素不会根据该计数分配存储空间，因此不受此限制。

Fory 只会在为最终 Arc 所有者预留空间后调用可选的 `read_arc_any` 方法；上面的方法只执行一次该分配，不得再次为同一个外层所有者预留空间。不需要同步 Arc 动态载体的自定义序列化器可以省略此方法，并且仍可用于类型化值、Box 和 Rc；此时尝试物化同步 Arc 会返回不支持错误。

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

`with` 选择一个序列化器，其目标必须与声明的字段类型完全一致。对于 `Option`、`Box`、`Rc`、`Arc`、Fory 弱引用载体、`RefCell` 和 `Mutex`，请用对应的载体序列化器包装子序列化器。例如，使用 `OptionSerializer<UserSerializer>` 处理 `Option<third_party::User>`，使用 `ArcSerializer<UserSerializer>` 处理 `Arc<third_party::User>`。`RefCell` 和 `Mutex` 会保留子值的编码结构；序列化这些直接字段时只进行一次借用或加锁，反序列化则直接构造持有者，不会增加额外的堆所有者。嵌套在任何这些包装器之后的外部结构化序列化器仍然支持兼容 Schema 演进。

在未跳过的派生字段中，应让每个载体构造器的规范名称保持可见，可以带上模块路径。这同时适用于字段的 Rust 类型和 `with` 序列化器树。例如，应直接写出 `Vec<third_party::User>` 和 `VecSerializer<UserSerializer>`，不要用类型别名或重命名导入隐藏任一载体树。叶子序列化器别名仍然有效。载体别名在根值处也仍然有效，因为 Rust 无需字段代码生成即可解析序列化器类型。跳过的字段也可以使用载体别名，因为它不产生字段 Schema 或主体字节，只使用所选序列化器的默认值。

跳过的外部字段可以使用 `#[fory(skip, with = UserSerializer)]`。此时，序列化器只用于其可能失败的构造默认值；该字段不产生 Schema 或主体字节。如果这个跳过字段的默认值是序列化器的唯一用途，则无需注册。默认值会接收当前读取上下文，并且必须在任何自有内存分配之前预留对象图内存。跳过的 list/map/tuple 字段可以保留递归子序列化器注解，但空容器默认值不会调用其子序列化器。

列表元素、map 子项和 tuple 位置在各自的递归 Schema 节点选择序列化器：

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

Tuple 索引从零开始。未提及的 tuple 位置使用其普通序列化器，tuple 元素可以包含相同的递归 list、map 或 tuple 元数据。支持元数从 1 到 22 的 tuple。

递归字段选择覆盖 `Vec`、`VecDeque`、`LinkedList`、`HashSet`、`BTreeSet`、`BinaryHeap`、固定数组、`HashMap`、`BTreeMap`，以及元数从 1 到 22 的 tuple。`direct_users` 为精确的 Vec 节点选择载体序列化器；`users` 则递归选择元素序列化器。两种形式都使用相同的内置 Vec 实现和结构化 LIST 表示。序列化器注解只应用于其声明所在的节点，绝不会静默传播到复合类型内部。

节点本地的 `#[fory(with = PackedUsersSerializer)]` 也可以选择一个自定义序列化器，其精确目标是整个 `Vec`、map、set、array 或 tuple。该字段使用不透明的 EXT/NAMED_EXT 编码，并且没有子 Schema。它不能同时使用 `list`、`map`、`tuple`、`array`、`bytes` 或 `encoding`。当复合类型应保留结构化编码类型，而只有子项需要选择序列化器时，应改用递归 list/map/tuple 注解。这种不透明自定义方式不是用户声明的载体序列化器，不能组合子序列化器。

如果注册了这种精确的完整容器自定义序列化器，精确目标类型的擦除多态值会使用它。普通的未注解类型化字段，以及子类型自行提供序列化器的根值，仍使用内置的结构化容器格式；显式载体序列化器根值也仍保留其声明的结构化格式。注册不会重定向这些静态路径。

## 根值

普通本地根值继续使用 `serialize`、`serialize_to`、`deserialize` 和 `deserialize_from`。

外部根值需要选择其序列化器：

```rust
let bytes = fory.serialize_with::<UserSerializer>(&user)?;
let decoded =
    fory.deserialize_with::<UserSerializer>(&bytes)?;
```

完整的序列化器选择式根值方法包括：

- `serialize_with`;
- `serialize_to_with`;
- `deserialize_with`;
- `deserialize_from_with`.

序列化器是编译期类型参数。运行时不会传递序列化器实例、包装值或镜像值。

对于容器根值，请组合对应的 Fory 载体序列化器：

```rust
use fory::VecSerializer;

fory.register::<UserSerializer>(100)?;

let users: Vec<third_party::User> = load_users();
let bytes =
    fory.serialize_with::<VecSerializer<UserSerializer>>(&users)?;
let decoded: Vec<third_party::User> =
    fory.deserialize_with::<VecSerializer<UserSerializer>>(&bytes)?;
```

`VecSerializer<UserSerializer>` 的目标是 `Vec<third_party::User>`，并保留普通 LIST 格式。请注册所选的 `UserSerializer` 等外部结构化序列化器，不要注册载体序列化器本身。

Map key、map value 和嵌套容器可以递归组合：

```rust
use fory::{HashMapSerializer, VecSerializer};

type DirectorySerializer =
    HashMapSerializer<ExternalKeySerializer, VecSerializer<UserSerializer>>;

let bytes =
    fory.serialize_with::<DirectorySerializer>(&directory)?;
```

对于嵌套列表，`VecSerializer<VecSerializer<UserSerializer>>` 的目标是 `Vec<Vec<third_party::User>>`。

异构 tuple 根值按位置进行组合：

```rust
use fory::Tuple2Serializer;

type EntrySerializer =
    Tuple2Serializer<String, UserSerializer>;

let bytes =
    fory.serialize_with::<EntrySerializer>(&entry)?;
```

`EntrySerializer` 的目标是 `(String, third_party::User)`。Tuple 载体序列化器保留与普通双元素 tuple 相同的原生或异构 LIST 表示。

完整的载体序列化器系列包括：

- `OptionSerializer`、`BoxSerializer`、`RcSerializer`、`ArcSerializer`、
  `RcWeakSerializer`、`ArcWeakSerializer`、`RefCellSerializer` 和
  `MutexSerializer`；
- `VecSerializer`, `VecDequeSerializer`, `LinkedListSerializer`,
  `HashSetSerializer`、`BTreeSetSerializer`、`BinaryHeapSerializer` 和
  `ArraySerializer`；
- `HashMapSerializer` 和 `BTreeMapSerializer`；
- 从 `Tuple1Serializer` 到 `Tuple22Serializer`。

不存在 `Tuple0Serializer`：`()` 没有子项，仍由自身提供序列化器。`PhantomData<T>` 也没有被序列化的子项，因此不需要组合序列化器。

`Cell<T>` 目前不是受支持的 Rust 序列化载体，因此没有 `CellSerializer`。`RefCell<T>` 是受支持的内部可变性载体。标准库的 `Weak<T>` 也不是 Fory 的 `RcWeak<T>` 或 `ArcWeak<T>` 的别名。

每个子参数都是另一种序列化器类型。它可以是以自身为目标的普通序列化器、外部结构化序列化器、自定义叶子序列化器，或另一个 Fory 载体序列化器。这四种形式都会保留载体的内置编码。普通本地类型以自身作为序列化器，因此 `HashMapSerializer<String, UserSerializer>` 的目标是 `HashMap<String, third_party::User>`。`ArraySerializer<S, N>` 使用所选子序列化器对应的载体选择。`i32` 等规范原始类型序列化器会保留其密集数组格式；外部结构化或自定义子序列化器则使用 LIST，即使其目标是 Rust 原始类型。

`VecSerializer<S>` 也会保留由子序列化器选择的普通 Vec 格式。`VecSerializer<i32>` 使用 `INT32_ARRAY`，`VecSerializer<u8>` 使用 `BINARY`，而 `VecSerializer<UserSerializer>` 使用 LIST。嵌套的 `VecSerializer<VecSerializer<i32>>` 使用外层 LIST，其元素类型是普通的 `INT32_ARRAY` 表示。序列化器组合绝不会将规范的原始类型 vector 转换为对象 LIST。

生成的字段会保留其声明的字段 Schema。未注解的 `Vec<i32>` 字段是 `LIST<VARINT32>`，而 `#[fory(list(element(encoding = fixed)))] Vec<i32>` 是 `LIST<INT32>`。`#[fory(array)]` 选择密集数组，`#[fory(bytes)]` 选择 BINARY。所有这些形式（包括 `VecSerializer<S>` 根值）都会保留由其声明 Schema 选择的内置 Vec 编码。

Fory 绝不会根据目标类型或注册信息推断序列化器组合。请在载体序列化器类型中显式指定每个外部子序列化器。字段可以使用 `with` 选择精确的载体序列化器，例如 `#[fory(with = VecSerializer<UserSerializer>)]`。在递归子节点选择序列化器时，请使用内联的 `list(element(...))` 或 `map(key(...), value(...))` 语法，或者带索引的 `tuple(element(...))` 语法。

精确针对整个容器或整个 tuple 的自定义序列化器仍可作为有效的不透明根值，但它使用 EXT/NAMED_EXT，而不是内置结构化表示，并且不会选择子序列化器。

`_with` 方法后缀表示其泛型参数用于选择序列化器，与 `#[fory(with = UserSerializer)]` 相对应。

## 注册

结构化序列化器和自定义序列化器使用现有注册类别。请为每个序列化器选择一种标识方式。

数字注册：

```rust
fory.register::<UserSerializer>(100)?;
fory.register::<CommandSerializer>(101)?; // Native struct-style enum.
fory.register_union::<ValueSerializer>(102)?; // Xlang-compatible union.
fory.register_serializer::<UuidSerializer>(103)?;
```

名称注册：

```rust
fory.register_by_name::<UserSerializer>("example.User")?;
fory.register_by_name::<CommandSerializer>("example.Command")?;
fory.register_union_by_name::<ValueSerializer>("example.Value")?;
fory.register_serializer_by_name::<UuidSerializer>("example.Uuid")?;
```

注册会将编码标识与序列化器的目标关联起来。一个 `Fory` 实例针对给定目标只接受一个已注册的动态序列化器。注册不会替换普通静态序列化器，也不会为未注解字段或根值隐式选择它。请在第一次序列化操作前完成注册。注册每个结构化或自定义外部子序列化器，绝不要注册载体序列化器。

载体组合不会使整个容器成为动态 `Any` 目标。如果精确的完整容器必须参与擦除动态分派，请注册精确目标类型的自定义序列化器，并使用其 EXT/NAMED_EXT 表示。

## 多态

已注册的外部目标通过其目标标识参与 `Box<dyn Any>` 和 `Rc<dyn Any>`。`Send + Sync` 目标也可以参与 `Arc<dyn Any + Send + Sync>`，前提是其结构化派生生成了 Arc 物化器，或其自定义序列化器实现了 `read_arc_any`。

当所选具体序列化器支持相应模式时，这些擦除载体可在原生和 xlang 模式下工作。编码格式中不会写入 Rust 载体和应用 trait 名称；xlang 模式仍要求每个具体目标具有可由 xlang 表示的结构化或 EXT 标识。

应用 trait 扩展一个小型、对象安全的 `ForyObject` trait，而不是 `Serializer`：

```rust
use fory::{register_trait_type, ForyObject};

trait Animal: ForyObject {
    fn name(&self) -> &str;
}

register_trait_type!(Animal, Dog, third_party::Cat);
```

具体目标列表是封闭且显式的。每个目标都可以使用普通序列化器、外部结构化序列化器或自定义序列化器。

对于 `Arc<dyn Trait>`，同步形式要求该 trait 和列出的目标实现 `Send + Sync`：

```rust
use fory::{register_trait_type, ForyObject};

trait Animal: ForyObject + Send + Sync {
    fn name(&self) -> &str;
}

register_trait_type!(sync Animal, Dog, third_party::Cat);
```

对于给定 trait，请选择非同步或同步声明及宏调用中的一种，不要同时使用两者。

生成的 trait 根值序列化器名称默认是宏所在模块的私有项。库可以使用 `register_trait_type!(pub Animal, ...)` 或 `register_trait_type!(pub sync Animal, ...)` 导出它们；该 trait 和列出的目标至少必须具有同等可见性。

`Box<dyn Animal>` 仍然是直接根值。该宏会为 `Rc<dyn Animal>` 根值生成零大小序列化器类型；对于同步形式的宏，还会为 `Arc<dyn Animal>` 根值生成该类型。它不会生成 Rc/Arc 值包装器，也不会执行包装转换。

Trait 载体序列化器不通过 ID 或名称注册。应用通过普通序列化器、外部结构化序列化器或自定义序列化器注册每个允许的具体目标。

## 相关主题

- [自定义序列化器](custom-serializers.md)
- [多态](polymorphism.md)
- [类型注册](type-registration.md)
- [Schema 演进](schema-evolution.md)
