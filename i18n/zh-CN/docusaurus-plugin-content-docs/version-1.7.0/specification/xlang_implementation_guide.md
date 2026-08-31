---
title: Xlang 实现指南
sidebar_position: 10
id: xlang_implementation_guide
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

## 概述

本指南介绍当前各 Fory 实现采用的 xlang 所有权模型。

编码格式由 [Xlang 序列化规范](xlang_serialization_spec.md)定义。本文讨论服务边界、操作流程和内部所有权。新的 Fory 实现不必采用相同的类名，但应保持相同的控制流：

- 根操作保留在 `Fory` 门面上
- 嵌套载荷的工作保留在显式读写上下文中
- 类型元信息保留在类型解析器层
- 序列化器专注于载荷

当本指南与编码格式规范冲突时，以 `docs/specification/xlang_serialization_spec.md` 为准。当它与特定语言的实现细节冲突时，以该语言的当前实现代码为准。

## 事实来源

按以下顺序使用这些来源：

1. `docs/specification/xlang_serialization_spec.md`
2. 当前语言实现
3. `integration_tests/` 下的跨语言测试

对于 Dart，实现结构以以下组件为中心：

- `Fory`
- `WriteContext`
- `ReadContext`
- `RefWriter`
- `RefReader`
- `TypeResolver`
- `StructSerializer`

## 实现所有权模型

### `Fory` 是根操作门面

`Fory` 拥有一个 Fory 实例的可复用服务。

在 Dart 中，`Fory` 恰好拥有四个可复用成员：

- `Buffer`
- `WriteContext`
- `ReadContext`
- `TypeResolver`

在 Java 中，`Fory` 还拥有 `JITContext` 和 `CopyContext` 等实例本地服务，但所有权规则相同：`Fory` 是根门面，而不是嵌套序列化器执行工作的地方。

`Fory` 负责：

- 为根操作准备共享缓冲区
- 写入和读取根 xlang 头位图
- 将嵌套值编码委托给 `WriteContext`
- 将嵌套值解码委托给 `ReadContext`
- 通过 `TypeResolver` 拥有注册过程
- 在顶层 `finally` 中重置操作本地的上下文状态

嵌套序列化器不得回调根 `serialize(...)` 或 `deserialize(...)` 入口。

### `WriteContext` 和 `ReadContext` 保存操作本地状态

`WriteContext` 和 `ReadContext` 由 `Fory` 为一次根操作准备，并由 `Fory` 在 `finally` 块中重置后复用。

`prepare(...)` 应只绑定当前缓冲区和根操作输入。`reset()` 应清除操作本地的可变状态。

这些操作本地状态包括：

- 当前缓冲区
- 当前 `RefWriter` 或 `RefReader`
- 元字符串状态
- 共享类型定义状态
- 按身份索引的操作本地暂存状态
- 逻辑对象图深度

生成的和手写的序列化器都应将这些上下文视为操作本地服务的唯一来源。序列化器不得在线程局部变量、全局变量或序列化器实例字段中保存环境实例状态。

### `WriteContext`

`WriteContext` 拥有写侧的全部单次操作状态：

- 当前 `Buffer`
- `RefWriter`
- `MetaStringWriter`
- 共享 TypeDef 写入状态
- 根 `trackRef` 模式
- 递归深度及其限制

它提供如下单次原语辅助方法：

- `writeBool`
- `writeInt32`
- `writeVarUInt32`

这些辅助方法用于提供便利。执行重复原语 I/O 的序列化器应缓存 `final buffer = context.buffer;`，并直接调用缓冲区方法。

### `ReadContext`

`ReadContext` 拥有读侧的全部单次操作状态：

- 当前 `Buffer`
- `RefReader`
- `MetaStringReader`
- 共享 TypeDef 读取状态
- 递归深度及其限制

它提供相应的单次原语辅助方法：

- `readBool`
- `readInt32`
- `readVarUInt32`

生成的结构体序列化器构造目标实例后，立即调用 `context.reference(value)`，这样反向引用才能解析到该对象。

## 引用跟踪

引用处理由两个显式服务负责：

- `RefWriter` 写入 null、引用和新值标记，并按身份记住先前写入的对象。
- `RefReader` 解码这些标记、预留读取引用 ID，并解析先前物化的对象。

xlang 引用标记为：

- `NULL_FLAG (-3)`
- `REF_FLAG (-2)`
- `NOT_NULL_VALUE_FLAG (-1)`
- `REF_VALUE_FLAG (0)`

关键行为：

- 基本值绝不使用引用跟踪
- 字段元数据控制生成结构体内部的引用行为
- 根 `trackRef` 只用于没有字段元数据的顶层对象图和容器根
- 在完成全部嵌套读取前分配对象的序列化器，必须尽早通过 `context.reference(...)` 绑定该对象

## 类型解析

`TypeResolver` 拥有：

- 内置类型解析
- 按数值 id 或 `namespace + typeName` 注册
- 序列化器查找
- 结构体元数据查找
- 类型元信息编码和解码
- 包名、类型名和字段名的规范编码元字符串
- 用于具名类型解析的编码名称查找
- struct、compatible struct、enum、ext 和 union 形式的编码类型决策

在 Java xlang 模式中，具体实现为 `XtypeResolver`。在 Dart 中，相同的职责由内部 `TypeResolver` 承担。

序列化器不会自行解析类元数据。它们请求当前上下文读写嵌套值，再由上下文将类型工作委托给 `TypeResolver`。

### 外部类型序列化的所有权

无法将 Fory 行为直接附加到每一种应用值类型的语言绑定，可以将序列化器提供方与其目标值分离。

所有权划分如下：

- 序列化器提供方拥有静态序列化行为；对于外部结构化序列化器，它还拥有本地 Schema 声明
- 目标拥有目标类型的值、宿主类型身份、存储大小和动态向下转型
- 值序列化器拥有目标体、完整根值、默认值、值类型身份、根/动态类型信息和值级多态
- 内部字段 codec 针对同一目标扩展值序列化器，并拥有 `FieldType`、字段 null/引用分帧、字段容量提示、远程字段元数据、兼容字段组合和递归载体字段 Schema
- 一个载体实现拥有由根序列化器和字段 codec 复用的主体、分配、插入和引用算法
- 自定义序列化器拥有其不透明主体内部的分配，并且必须在分配前执行相应的可读字节、策略和对象图内存检查
- `Fory` 拥有根分帧以及操作设置/重置
- `TypeResolver` 拥有注册和动态查找

#### C# 生成的结构化序列化器

C# 对普通结构化序列化器和外部结构化序列化器使用同一条按目标索引的源码生成路径。`ForyStructAttribute` 不可继承：参与可序列化继承层次的每个第一方类都带有直接注解。外部声明为不可修改的目标提供等价契约。

对于一个具体的普通类，编译级继承层次发现会产生两个互相独立的不可变输出：

- 一组扁平化的编码成员，用于字段排序、Schema 哈希、`TypeMeta` 以及生成的读写；以及
- 一个浅层存储模型，仅用于对象图内存计量。

编码成员集从基类开始，由声明所有的生成描述符组装。属性重写链先折叠为一个逻辑槽位，再由协议比较器验证完整集合并排序。隐藏成员保留其确切声明类型。生成的子类绝不调用父序列化器主体，也绝不将基类对象编码为嵌套值。

每个可继承的普通类都会发布一个按目标索引的编译器契约，其中包含：

- 它的确切目标；
- 它直接声明的确切编码成员数；
- 每个直接声明编码成员的确定性访问器上的一个描述符：字段使用可写 `ref` 访问器，属性使用 getter 和与之匹配的 setter；以及
- 一个 public static readonly 累计 `HierarchyShallowBytes` 值。

提供方的浅层值等于直接父提供方的值加上当前类直接声明的物理实例字段。密封具体序列化器在内部使用相同的累计表达式，但不发布提供方标记、描述符或继承层次值。具体序列化器只添加一次对象自身存储。属性从不直接增加存储，而 private、readonly、编译器生成和非编码实例字段会增加。引用子编译只使用可访问的提供方契约；不会导入、枚举或重建父类的私有字段。

仅作为提供方的目标生成静态提供方；具体非密封序列化器携带相同契约，而不引入第二个类型或转发路径。internal 提供方仅对通过正常 C# 可访问性授权的程序集可用，例如通过 `InternalsVisibleTo`；不可访问或只能通过 extern alias 访问的契约不拥有另一次编译的继承层次。

只要 C# 可访问性允许，生成器就生成普通的直接成员访问。当引用子类需要访问声明所有的状态时，提供方会发布访问器。访问器签名保留成员的 CLR 类型和可空性元数据。缺失或含糊的提供方会使生成失败。

抽象普通类只生成其继承层次提供方，不创建序列化器实例或注册。其属性描述符可以发布尚未解析的抽象重写槽位；具体后代必须提供可调用实现。具体类要求合法的无参构造，并保留现有顺序：先分配目标对象，再读取子项，并按既有时机发布引用。

`ForyStructAttribute` 和 `ForyEnumAttribute` 带有可选的 `Target` 类型。本地非泛型抽象类提供外部结构化声明，而空的非泛型静态类选择外部 enum 目标：

```csharp
[ForyStruct(Target = typeof(ThirdParty.User))]
internal abstract class UserSerializer
{
    [ForyField(
        1,
        TargetDeclaringType = typeof(ThirdParty.User),
        TargetMemberName = "<Name>k__BackingField")]
    public abstract string Name { get; }
}

[ForyEnum(Target = typeof(ThirdParty.Status))]
internal static class StatusSerializer
{
}
```

外部声明仅作为编译期生成器输入。它们绝不会被实例化、在运行时被反射、注册、发布引用或用作编码身份。所有序列化器类型位置、构造、`TypeInfo`、元数据、引用发布、生成工厂键、根、字段、动态值和载体均使用目标类型。

外部成员可以绑定可见的同名字段或属性。对于外部类目标，设置 `TargetDeclaringType` 和 `TargetMemberName` 则会声明目标或其非 `object` 祖先上的一个确切字段。确切编码映射也会提供物理存储；`Ignore = true` 只提供浅层存储。外部 struct 目标仅支持可见成员映射。未映射的可见 public 实例字段只会被加入外部类浅层存储一次。生成器绝不会发现引用程序集中 private 字段。

`BaseOnly = true` 使外部类声明成为完整第三方继承层次前缀的终止提供方。它可以列出确切的目标和目标祖先字段，且不发布独立工厂或注册。普通子类消费该提供方的方式与消费普通父提供方完全相同。`BaseOnly` 目标可以是抽象或不可构造的，因为只会物化具体普通子类。

确切 private 映射是绑定到版本的包 ABI 声明。如果目标 ABI 发生变化，编码访问器会以 CLR 缺失字段错误失败；不存在反射或备用成员回退。在 .NET 8 上，生成器会拒绝声明所有者或签名为泛型的 private 编码访问。类目标仍支持可见的闭合泛型成员和显式的仅存储字段映射。若不导入 private 布局，就无法区分不可访问的指针字段与固定缓冲区存储，因此确切 private 指针映射会被拒绝。

独立外部结构化目标要求可访问的具体 class 或 struct、合法的无参构造和可写的已声明编码状态。仅构造器、仅工厂、readonly、init-only、经转换和自定义编码形状应使用自定义 `Serializer<T>`。当目标元数据带有可空性注解时，显式可空性必须匹配；否则由声明提供 Schema 可空性。

每个生成的普通或外部 struct 都使用 `TypeResolver.RegisterGeneratedStruct<T, TSerializer>(bool evolving)`，将生成器所有的 `Evolving` 传入目标 `TypeInfo`。生成的 enum 和 union 使用 `TypeResolver.RegisterGenerated<T, TSerializer>()`。抽象普通提供方和 `BaseOnly` 提供方不注册。一个目标有多个生成所有者时，会在生成期间或跨程序集工厂注册的冷路径上确定性拒绝。替换自定义序列化器时仍遵循解析器的正常目标规则。

C# 载体组合仍以目标为基础。解析器递归绑定 `Nullable<T>`、一维 `T[]`、`List<T>`、`LinkedList<T>`、`Queue<T>`、`Stack<T>`、`HashSet<T>`、`SortedSet<T>`、`ImmutableHashSet<T>`、`Dictionary<TKey, TValue>`、`SortedDictionary<TKey, TValue>`、`SortedList<TKey, TValue>`、`ConcurrentDictionary<TKey, TValue>` 和 `NullableKeyDictionary<TKey, TValue>`。普通、外部和自定义序列化器使用相同的载体主体。不存在继承层次的运行时查找、提供方对象、回调、Schema 树、逐元素分派或额外的值分配。

动态 `object` 值和 union 通过 `TypeResolver` 解析具体目标类型。任意静态类型的接口或基类多态仍不受支持。除目标/成员元数据 token 外，扁平普通和外部生成热主体保持相同的工作量与分配形状；继承层次组合属于静态初始化和编译期元数据工作。

Rust 明确命名了这些序列化器操作边界：

- `Serializer::write` 和 `Serializer::read` 处理完整值，包括所请求的引用和类型信息信封。
- `Serializer::write_data` 和 `Serializer::read_data` 只处理目标主体。
- `write_with_type_info` 和 `read_with_type_info` 仍是基于已解析值元数据的完整值操作。

Rust 在 `Serializer` 上用五个关联常量表示不可变的值序列化器属性：

- `IS_OPTIONAL` 表示所选值形状带有 Option 语义；
- `IS_POLYMORPHIC` 表示其具体目标由应用值选择；
- `IS_SHARED_REF` 表示它使用现有共享引用编码行为；
- `IS_WRAPPER` 表示它是 Fory 所有、没有独立注册身份的包装序列化器；以及
- `REQUIRES_SCOPED_ACCESS` 表示检查或使用其中的动态值需要借用、锁或 weak upgrade。

这些是类型级值属性，必须通过单态化折叠。`Codec<T>` 通过 `Serializer<Target = T>` 继承它们，不重新声明。`SerializerCodec<S>` 从 `S` 转发这些属性。依赖值的 `is_none(value)` 和 `dynamic_type_id(value)` 操作仍是函数。`is_none` 仅表示 `Option::None`，包括透明 Option 传播；弱目标过期仍是单独的弱访问结果。

`Serializer` 没有字段 API 或字段 Schema 参数。尤其是，它不公开 `FieldType`、字段兼容读取、已声明字段泛型状态、字段 null/引用策略或字段编码选择。Rust 的内部 `Codec<T>` 扩展 `Serializer<Target = T>` 并拥有这些字段操作。叶级 `SerializerCodec<S>` 通过转发到 `S` 实现值行为，并自行实现字段行为；它绝不调用 `S` 上的字段钩子。其值容量提示原样转发。生成字段和字段模式载体主体使用 codec 所有的字段容量提示；该提示会添加或转发字段分帧，但不改变根或值组合。

序列化器提供方身份是宿主实现细节，绝不会编码。外部结构化序列化器使用与等价直接支持目标相同的 STRUCT、ENUM 或 UNION 元数据和值格式。并非 Fory 实现对现有内置类型的规范序列化器的自定义序列化器使用 EXT 或 NAMED_EXT。分离序列化器提供方并不取代实现所拥有的内置映射。

静态生成字段和由序列化器选择的根，应直接分派给其 Schema 选择的序列化器。Rust 字段 `with = S` 选择确切字段节点，并要求 `S::Target` 等于声明的字段类型。它接受普通、外部结构化、自定义或载体序列化器。例如，`with = VecSerializer<UserSerializer>` 选择结构化 `Vec<User>` 字段节点，而 `list(element(with = UserSerializer))` 递归选择子节点。透明字段选择其确切载体序列化器，如 `OptionSerializer<UserSerializer>`。字段代码生成会将两种形式都递归降低为载体 codec。

Rust 过程宏无法解析类型别名或重命名导入。由于该设计没有关联 codec 映射 trait 或运行时回退，带 Schema 的派生字段声明 Rust 类型中的每个载体构造器，以及其 `with` 树中每个 Fory 所有的载体构造器，都必须使用其规范终端名称，可以带限定名。叶序列化器别名、根载体别名，以及只被已跳过字段的值级默认值使用的载体别名仍然有效。derive 会识别经过完整审计的载体语法，并只将未知类型降低为叶序列化器。叶适配器会在解析器发布前的冷字段 Schema 构造过程中，根据现有编码类别拒绝别名形式的非包装载体。别名形式的 Fory 所有包装器不能独立注册，因此会在正常的必需提供方查找中失败。叶适配器不会消费 `IS_WRAPPER`、检查运行时类型名或增加值路径分支。

当根是包含所选外部子项的透明、集合、定长数组、map 或异构 tuple 组合时，绑定应公开由绑定所有、特定于载体并由子序列化器递归参数化的静态序列化器。例如，基于 `S` 的 vector 载体序列化器以 `S::Target` 的 vector 为目标；基于 `KS` 和 `VS` 的 map 载体序列化器以从 `KS::Target` 到 `VS::Target` 的 map 为目标；N 元 tuple 载体序列化器的目标则由每个 `Si::Target` 按位置组成。

根载体组合递归组合值序列化器。字段组合递归组合 codec。两者有意采用不同的编译期类型树：根载体不得构造字段 codec 树，也不得请求或合成 `FieldType`。根载体读取只能使用直接子状态或值 `TypeInfo` 子状态；远程 `FieldType` 只属于字段 codec 入口。子项实现 `Serializer` 时，每个载体实现提供 `Serializer` 行为；只有子项实现 `Codec` 时才提供字段 `Codec` 行为。两层调用同一套载体主体、分配、插入和引用实现。它们不得复制集合、map、引用、holder、定长数组、tuple 或兼容读取算法。仍然调用完整载体序列化器的纯元数据适配器不算支持外部子项。

Rust 保持外部结构化序列化器生成的 `write_data` 主体不内联。否则，递归载体组合会把该主体复制到每个 list、map、tuple 和包装器单态中。这是成功直达路径上的函数边界，并非冷路径，且不增加运行时选择、回调或分配。自有生成序列化器仍采用普通编译器内联启发式。

透明引用载体只消费自己的 null 或引用信封。如果兼容模式将用户类型元数据放在所选子主体之前，子项仍必须消费该元数据并使用其远程 Schema。如果包含 Schema 改为声明递归载体子项，该子项会直接接收已声明的字段元数据。实现不得丢弃任一形式的元数据，也不得读取载体信封两次。

载体序列化器不是注册用户类型：它们保持载体的标准编码类别，没有解析器条目或动态 harness；到达所选用户类型子项时，任何注册都归该子项所有。载体委托必须包含每一种现有规范特化，而不是强制使用通用集合形状。例如，基于规范 `i32` 序列化器的 Rust vector 载体序列化器保留 `INT32_ARRAY`；基于规范 `u8` 序列化器的保留 BINARY；基于外部结构化或自定义序列化器的使用 LIST。嵌套 vector 在根字节中保留所选子项表示；等价字段 codec 树则在递归 `FieldType` 中保留它。

对于 Rust，经过审计的载体序列化器表面是穷尽的：

- `OptionSerializer<S>`、`BoxSerializer<S>`、`RcSerializer<S>`、`ArcSerializer<S>`、Fory `RcWeakSerializer<S>`/`ArcWeakSerializer<S>`、`RefCellSerializer<S>` 和 `MutexSerializer<S>`；
- `VecSerializer<S>`、`VecDequeSerializer<S>`、`LinkedListSerializer<S>`、`HashSetSerializer<S>`、`BTreeSetSerializer<S>`、`BinaryHeapSerializer<S>` 和 `ArraySerializer<S, N>`；
- `HashMapSerializer<KS, VS>` 和 `BTreeMapSerializer<KS, VS>`；
- 从 `Tuple1Serializer<S0>` 到 `Tuple22Serializer<S0, ..., S21>`。

每个载体序列化器目标都由子序列化器目标递归组成。每个子项可以是以自身为目标的普通序列化器、外部结构化序列化器、自定义序列化器或另一个载体序列化器；四种形式均进入同一载体主体实现。由于 Rust 没有可变参数泛型，`Tuple1Serializer` 到 `Tuple22Serializer` 及对应的特定元数 codec 都由宏生成；不会引入 public 序列化器列表 trait 或运行时 tuple 描述符。单元 `()` 和 `PhantomData<T>` 没有序列化子项，不需要序列化器组合。擦除的 Any/应用 trait 载体保留其动态注册目标所有者，而不会伪装成静态子序列化器。

`Cell<T>` 不在当前 Rust 序列化器表面中：derive 只识别它的 Send/Sync 属性。不存在 `Cell` 序列化器或 codec，因此该功能不得发明 `CellSerializer<S>`，也不得将 `Cell` 视为 `RefCell`。同样，标准库弱指针并不是 Fory 弱载体的别名。

对于 Swift，`Serializer` 通过关联的 `Target` 遵循相同的确切目标所有权边界。自提供的结构化或自定义序列化器使用 `Target == Self`；单独提供的结构化或自定义序列化器则指定另一个目标类型。序列化器操作是静态的，接收或返回 `Target`。Fory 从不实例化序列化器对象，生成的外部结构化代码会直接读取目标属性并构造目标。

静态选择统一遵循提供方所有权。自身符合 `Serializer` 且 `Target == Self` 的目标，会在根、生成字段、optional、array、set 和 dictionary 中隐式选择。这包括有意追加一致性的外部类型。`Target` 为另一类型的序列化器类型，必须在需要它的每个静态节点显式选择。即使它是该目标唯一已注册的提供方，注册也不会推导出该序列化器，因为 Swift 无法反向推导出唯一的 `S: Serializer` 来满足 `S.Target == T`。

追加一致性是进程全局的。`@retroactive` 确认 Swift 的所有权警告，但不会让重复的 `(Target, Protocol)` 一致性变得安全。应用可以在有意拥有唯一全局绑定时使用它；public 库通常应使用独立序列化器，让应用显式选择实现。

Swift `StructSerializer` 覆盖每一种结构化注册类别。普通和外部的 `@ForyStruct`、`@ForyEnum` 和 `@ForyUnion` 展开都符合该协议；自定义 EXT 序列化器不符合。

Swift 中对文档隐藏的 `FieldCodec` 针对同一确切目标扩展值序列化。它拥有 `FieldType`、递归字段泛型、字段 null/引用策略、兼容字段读取、标量转换和注解选择的字段编码。`Serializer` 没有 `FieldType`、兼容字段钩子或已声明泛型参数。只有 `FieldCodec` 携带 `hasDeclaredChildren` 模式；当外层字段元数据拥有递归子 Schema 时，该模式保留规范的集合和 map 头决策。`SerializerCodec<S>` 是生成的叶适配器，目标为 `S.Target`。由于 `FieldCodec` 扩展 `Serializer`，它的值级部分必须仍是有效根序列化器，但根代码不能观察任何仅字段操作。在非兼容模式下，没有类型信息信封的确切非 optional 所选叶，在不需要引用信封时调用 `S.readData`；被跟踪的引用目标仍经由 `S.read`。兼容或递归保留的元数据仍归 `SerializerCodec<S>` 所有，并在作用域完整保留的情况下进入所选序列化器。

数值字段 codec 将该值级部分委托给规范数值序列化器；紧凑数组字段 codec 则委托给规范 LIST 载体。只有它们的字段操作使用定长、带 tag 或紧凑字段表示。因此，允许用作根不会增加备用数值或紧凑数组编码映射。

Swift `Serializer.isWrapper` 是对文档隐藏的值级属性，仅用于拒绝将 Fory 所有的透明包装器作为独立 EXT 注册。`OptionalSerializer` 会设置它；集合载体不会。自定义序列化器不会因目标拼写获得包装器状态，并且可以拥有独立的不透明载体主体。目标身份冲突会阻止它替换预置的规范动态内置类型。

Swift 递归载体序列化器的完整支持集合为：

- `OptionalSerializer<S>`，目标为 `S.Target?`；
- `ArraySerializer<S>`，目标为 `[S.Target]`，编码形状为 LIST；
- `SetSerializer<S>`，目标为 `Set<S.Target>`，其中 `S.Target: Hashable`；
- `DictionarySerializer<KS, VS>`，目标为 `[KS.Target: VS.Target]`，其中 `KS.Target: Hashable`。

当其子项为字段 codec 时，每个载体序列化器有条件地提供字段 codec 行为。因此根组合包含序列化器，而字段组合包含递归降低的字段 codec；两者都调用同一个载体主体、分配、插入、引用和兼容实现。普通 `Optional`、`Array`、`Set` 和 `Dictionary` 一致性在确切自目标约束下委托给相同所有者。这些约束同样适用于用户声明的和追加一致性的外部子项。载体序列化器无状态且不注册。

透明 Swift `OptionalSerializer` 没有独立的字段元数据身份。其字段 codec 元数据作用域递归委托给被包装的字段 codec，包括非 null 读取，因此已接受的远程子元数据仍由所选叶或嵌套载体拥有。

对于静态选择的根和载体根，Swift `Array` 都是 LIST，包括 `[Int32]`。`@ArrayField` 是单独的仅字段密集 bool/数值选择；隐藏在动态 `Any` 中的确切原语数组使用其规范动态紧凑数组映射。只有规范原语字段 codec 可以选择紧凑形式；非规范的所选子项会被拒绝，而不会根据其目标语法获得映射。`Data` 仍是 BINARY 叶。

Swift 不支持泛型 tuple、定长数组、cell、box、weak、引用 holder、`ContiguousArray`、`ArraySlice`、result、range、deque、`NSSet` 或 `NSDictionary` 序列化器。外部子项组合不得发明这些载体。`AnyHashable`、`UnknownCase` 和 `ByteBuffer` 分别是动态键 holder、union 值 holder 和传输所有者，而不是递归静态载体。

Swift 外部结构化声明使用结构化宏：

```swift
@ForyStruct(target: ThirdParty.User.self)
struct UserSerializer {
    var name: String
    var age: UInt32
}
```

生成的普通值声明使用 `Target = Self`。由于 Swift 拒绝类中的嵌套 `Target = Self` 类型别名，生成的普通类会显式命名声明类；两种形式表达同一个确切自目标关系。

等价目标选择也适用于 `@ForyEnum` 和 `@ForyUnion`。值 Schema 声明以值类型为目标，并使用直接带标签构造。类 Schema 声明以类为目标，通过可访问的零参数初始化器分配最终目标，在读取子字段前发布它，并为可访问的可变属性赋值。生成的 Swift 会强制类目标满足 `AnyObject` 约束。Swift 没有反向的否定泛型约束，因此冷注册验证会在发布元数据前，拒绝以类为目标的值 Schema 声明。不可访问、不可变、带不变量或非穷尽目标需要自定义序列化器；实现不得把反射、不安全布局访问、不可用重载技巧、Schema 镜像值、转换包装器或 builder 用作回退。

Swift 宏无法检查另一类型的存储布局。因此，外部类的浅层对象图内存公式只使用其声明字段。`@ForyField(ignore: true)` 添加一个仅预算声明字段，不添加 Schema、目标访问、构造或编码代码。对于大量被省略的存储，应用必须使用这种形式。

外部结构化 union 要求目标公开无损的 `unknown(UnknownCase)` case。无依赖目标模块可以公开泛型未知载荷，并让应用选择其 `UnknownCase` 特化；目标也可以直接使用 Fory 的载体。Fory 不会转换其他模块的未知表示。缺少这种形状的第三方 union 需要自定义序列化器，并且不能声称与结构化 union 编码等价。

普通 Swift 生成字段会递归选择无需注解的自提供声明类型。Swift 字段选择使用 `@ForyField(with: S.self)` 选择一个确切声明节点；选择独立序列化器或另一项有意覆盖时，则使用 `.with(S.self)` 在 `ForyFieldType` 的 list、set、map 和 union 载荷节点内选择。所选 optional 或完整集合节点会命名其确切载体序列化器。规范的完整载体语法递归降低为与结构化字段 DSL 相同的字段 codec 树。编译器会强制所选序列化器目标等于声明字段节点。

Swift 根选择使用序列化器元类型：

```swift
fory.serialize(user, with: UserSerializer.self)
fory.deserialize(bytes, with: UserSerializer.self)
fory.serialize(users, with: ArraySerializer<UserSerializer>.self)
```

`Data`、追加到 `Data` 和 `ByteBuffer` 形式共享同一根分帧和可复用上下文。普通根要求 `T.Target == T`，并委托给同一个所选序列化器辅助方法。这会接纳每个自提供方，包括有意追加一致性的外部类型，但不会从注册推导独立序列化器。不存在并行的序列化器选择别名或应用声明的结构化容器 Schema。根门面保持现有模块边界和内联策略；静态特化属于其下的序列化器、生成代码和载体所有者。不要仅为了把完整根流程强制内联到客户端，就将解析器或可复用上下文状态公开为 `@usableFromInline`。所选 Swift 读取根携带一个由 `S.Target == T` 约束的推导结果泛型。调用仍为 `deserialize(..., with: S.self)`，但同类型泛型允许调用者提供具体目标元数据，并避免每次未特化根调用中的关联目标查找和动态结果存储设置。

生成的值 struct `readData` 直接拥有目标构造。当外部结构化序列化器有递归选择的载体字段时，为控制代码体积，该所有者可以不内联；但 `readData` 与最终目标结果缓冲区之间不得放置返回大型 private 值的辅助方法。生成的类读取器保留 private 辅助方法，因为类分配所有者必须在读取子项前发布预留引用。

Swift `TypeResolver` 同时按序列化器身份和具体目标身份索引同一个不可变 `TypeInfo`。静态 Schema 和显式选择使用序列化器身份；动态写入使用目标身份；编码读取使用数值 ID 或名称。所有方向共享一个 writer、exact reader、compatible reader、元数据和注册所有者。public 注册通过 ID 或名称 API 接受所选结构化或自定义序列化器。发布前会拒绝载体、动态、内置和字段 codec 身份。

Swift 对任意应用协议的存在类型使用无状态 `DynamicSerializer<T>`。动态写入解析已注册的具体目标，向下转型一次到其序列化器的确切目标，并调用共享 `TypeInfo` harness。动态读取只物化最终具体目标一次，再将其转换为所请求的存在类型。正常目标注册就是 allowlist，因此 Swift 不需要标记协议、协议专用注册表、封闭目标列表宏、协议编码身份、序列化器值或包装集合。协议根和根载体显式选择动态序列化器，例如 `DynamicSerializer<any Animal>` 和 `ArraySerializer<DynamicSerializer<any Animal>>`。为保持源代码兼容性，Swift 保留直接 `Any` 和 `AnyObject` 根重载。这些重载使用 `DynamicSerializer<Any>` 或 `DynamicSerializer<AnyObject>` 转发到同一所选序列化器根，不增加并行 codec、分帧、查找或分配路径。其追加到 Data 和 ByteBuffer 形式遵循相同规则。由于 Swift 允许每个值转换为 `Any`，不自行序列化的具体值可以通过 `Any` 重载进入已注册动态目标查找。需要时显式 `with:` 选择会命名独立静态序列化器。Swift 不公开无约束泛型动态根、`any Serializer` 根或专用异构容器根重载。

`DynamicSerializer<T>` 覆盖完整值引用处理。它先解析具体 `TypeInfo`，再决定目标是否为引用；只有外部动态字段形状保守使用 `isRefType == true`。外部动态序列化器拥有可空性和类型信息。其 `TypeInfo` harness 对值目标调用主体序列化，对类目标调用具体的完整值引用信封。动态槽位计量使用已声明存在类型布局，而不是把每个值都视为引用。`AnyObject` 读取在类型转换前拒绝值类型元数据，避免 Swift 分配桥接对象。任意非 optional 协议没有合成默认值；optional 协议值通过 `OptionalSerializer` 组合。

所选 codec 具有 UNKNOWN 静态身份的确切生成字段仍会写入和读取具体 `TypeInfo`；载体头为动态子项拥有该信息且不会重复它。动态 map chunk 保持既定的键类型/值类型/键主体/值主体顺序，并复用两个已解析 `TypeInfo` 条目而不再次查找目标。保留的动态 `TypeInfo` 由选择它的序列化器限定作用域，因此 `AnyHashable` 和 `DynamicSerializer<T>` 可以共享一个实现，而不会互相替换作用域身份。

Swift 拒绝大小为零的非 null MAP chunk，因为它们无法推进已解码条目计数。只有一侧为 null 的条目会把非 null 侧编码成完整字段值：先是存在时的引用信封，再是未声明的 `TypeInfo`，最后是其主体。MAP writer、reader 和兼容字段 skipper 使用这种完整字段顺序，而不是非 null chunk 的共享类型前缀顺序。静态和动态 MAP 分支使用相同顺序与验证。

动态 Any 和协议路径直接操作最终目标值及容器。静态组合从不进入目标查找；动态查找只发生在显式动态边界。

Swift 异构动态集合使用其确切支持的目标形状：`[Any]`、`[String: Any]`、`[Int32: Any]` 和 `[AnyHashable: Any]`。把同构 list 或 map 赋给 `Any` 不会擦除其具体目标身份，也不得触发转换后的集合或第二个集合 codec。同构 list 和 map 使用普通或显式选择的载体序列化器。预置的确切原语数组保留其紧凑动态映射。`[AnyHashable: Any]` 中的 null 动态键物化为 `AnyHashable(ForyAnyNullValue())`。

当载体为用户类型字段 codec 保留远程子元数据时，叶 codec 不再经过另一个信封就进入所选序列化器，使其 exact 或 compatible reader 能看到保留的 `TypeInfo`。内置叶 codec 直接读取其字段主体。

Swift 只支持 xlang 编码模式。已知 `@ForyUnion` case 有零个或一个关联值；多个逻辑字段使用显式 struct 载荷。没有需要保留的 Swift 原生多字段 enum 编码。

Rust tuple 字段元数据选择稀疏的从零开始的位置，未提及的位置使用普通序列化器。它会降低为特定元数 tuple codec；根载体则递归组合 tuple 序列化器，两者使用相同的特定元数 tuple 主体。现有 tuple 编码契约保持不变：原生非兼容模式使用直接异构位置主体；兼容原生和 xlang 模式使用现有异构 LIST 形式。现有 UNKNOWN 泛型 `FieldType` 形状保持不变，不编码序列化器类型或位置索引。

Rust 的原语集合选择必须只有一个由普通类型、载体序列化器和 derive 共享的所有者。Type ID、主体编码、预留空间、字段元数据和兼容读取不能使用独立表。这包括规范 `u8` BINARY 和现有 `isize`/`usize` 密集数组类型。private 原语数组/载体所有者从子项标量 `static_type_id()`、确切 Rust 子目标和载体模式推导父类别。标量序列化器和 codec 只声明标量行为及标量编码 ID；public 序列化器契约和通用 codec 契约都不公开父数组类别。同一 private 映射验证不安全批量复制，并提供兼容 LIST/array 元素元数据。

Rust 1.70 无法从关联 const 选择 codec 类型，因此现有 Vec 和定长数组载体实现类型是原语和对象主体的唯一所有者。Vec 实现携带两个既定 Schema 选择作为编译期 const。即使子项是规范原语，`STRUCTURAL_LIST` 也让未注解和显式 `list(...)` 生成字段保持为 LIST。普通根、Vec 载体序列化器、`#[fory(bytes)]` 和 `#[fory(array)]` 会禁用它，使载体可以消费经过验证的规范子类别。`DENSE_ARRAY` 仅对显式 `#[fory(array)]` 为 true；它把规范 `u8` BINARY 映射到 `UINT8_ARRAY`。对于根、载体序列化器、LIST 字段和 `#[fory(bytes)]`，它为 false。因此，未注解 `Vec<i32>` 字段保持 `LIST<VARINT32>`，显式定长元素 list 保持 `LIST<INT32>`，普通或由序列化器选择的原语 Vec 根保留其密集数组或 BINARY 表示。以原语为目标的外部结构化或自定义序列化器仍是对象 LIST 子项，因为其序列化器不公开规范标量编码 ID。derive 可以验证显式原语类别，但不会把 Rust 类型映射到编码 ID。内联标量 ID 和确切目标检查必须在单态化后折叠。derive 始终使用同一统一核心载体实现，不维护普通组合 AST 原语表。

注册由拥有方序列化器或字段 codec 的访问驱动。在 Schema 构造或值处理访问所选用户序列化器的已注册身份或注册支撑元数据前，该序列化器必须已注册。缺失的 Option、空集合或 map、空 weak 值、零长度定长数组或等价递归分支，在其所有路径没有进行这种访问时，可以不注册子项而完成。声明类型主体路径调用其静态选择的序列化器而不查找注册；如果包含 Schema 提供该声明，它的元数据构造已拥有唯一必需的注册/不匹配检查。现有外层 `FieldType` 不声明位置的异构 tuple，则通过正常的逐位置类型元数据操作触达任何必需子注册。绑定不得添加急切递归根验证遍历、已到达主体检查、选择器树、组合目标查找、逐元素序列化器分派、分配、回调或热路径分支来改变该行为。完整容器的确切自定义序列化器仍是独立不透明 EXT/NAMED_EXT 选择。它拥有已注册动态目标身份，而未注册载体序列化器继续拥有显式静态结构组合。

载体序列化器没有独立注册身份。结构化注册要求现有结构化序列化器契约以及匹配的 STRUCT/ENUM/UNION 类别。自定义注册要求独立 EXT/NAMED_EXT 序列化器并拒绝 `IS_WRAPPER`。Option、Box、Rc、Arc、RcWeak、ArcWeak、RefCell 和 Mutex 载体序列化器会独立于其子类别设置此属性。list、set、map、定长数组和 tuple 保持 false，并通过自身编码类别被拒绝。以相同 Rust 形状之一为目标的自定义序列化器也保持 false，因为它拥有独立不透明 EXT 主体。private 内置注册只验证预期的内部 type ID。这些语义检查使用现有序列化器契约和编码类别。自定义 EXT 注册是 `IS_WRAPPER` 的唯一使用方。

动态值应按具体目标身份解析。当 Fory 实现需要两个方向时，其序列化器提供方到类型信息、以及目标到类型信息的索引，必须指向相同的不可变注册元数据和序列化器 harness，而不是创建并行元数据或序列化路径。内部上下文和解析器入口必须命名方向；Rust 对静态 Schema 身份使用 `write_provider_type_info`/`get_provider_type_info`，对动态值身份使用 `write_target_type_info`/`get_target_type_info`。含糊查找不得探测一个 map 后回退到另一个。编码读取仍将编码的 ID 或名称解析到同一元数据。

当现有同构 LIST/SET 或 MAP 头发出一个动态选择的具体类型时，该头所有者会解析并验证目标一次，并为编码 chunk 保留已解析注册元数据。每个主体都借用该确切元数据调用现有动态 harness；不得为每个元素或条目重复目标查找或克隆引用计数元数据句柄。异构 chunk 保留现有逐值元数据路径。该传递不增加编码字段、运行时序列化器实例、回调、Schema 树、缓存或静态路径分支。

动态目标检查可能失败，并且以没有哨兵目标身份的方式表示缺失值。当 `!C::IS_POLYMORPHIC || !C::REQUIRES_SCOPED_ACCESS` 时，LIST/SET 所有者可以预检查一个子项；该调用方本地决策不得成为另一个序列化器能力。需要 `RefCell` 借用、`Mutex` 锁或 weak upgrade 的多态子项会跳过目标/null 预检查，并在一次 holder 访问下通过现有异构路径写入每个值。非多态可空 holder 保留现有 LIST/SET null 头扫描，然后只进行一次主体访问而不重复 null 检查。MAP 两侧的元数据和 null 标志都位于任一主体之前，因此可空或受访问约束的多态 MAP holder 会短暂检查一次 null/目标，释放借用、guard 或升级后的 owner，随后进行正常主体访问。实现不得跨 map 另一侧保留该访问、暂存主体字节、分配预备值、调用回调或改变 MAP 编码顺序。weak 包装器不会让目标存活；需要一次连贯观察的操作必须在该所有操作期间保留升级后的 strong owner。

如果封闭多态成员关系在编码 ID/名称查找后需要宿主目标身份，共享 harness 或注册元数据必须保留可选目标身份。已注册本地行为提供该身份；纯远程 stub 不提供，且必须在成员检查、序列化器调用或分配前进入缺失注册错误。不要扫描反向 map、发明哨兵身份或添加第二个元数据缓存。

序列化器代码不得物化序列化器提供方值或结构镜像值。生成的结构化读取直接构造目标。动态物化器只分配一次所请求的最终所有者，并使用目标大小进行内存计量。

可能物化值且可能失败的序列化器默认值，必须接收当前读取状态或上下文。字段 codec 使用继承的序列化器默认值，而不是定义第二套默认 API。具体所有者在分配前预留对象图内存；null、缺失兼容字段和已跳过字段路径不能仅因不消费主体字节就绕过正常分配预算。

兼容结构读取仍保留在正常 struct 兼容性所有者中。已检查元数据缓存仍是已接受远程元数据的唯一所有者；序列化器分派不得添加另一验证标记、元数据缓存或 exact-Schema 决策。

## 根帧职责

每个根载荷都以一字节位图开头，由 `Fory` 自身读写，而不是由序列化器读写。

当前 xlang 根位：

| 位  | 含义               |
| --- | ------------------ |
| `0` | null 根载荷        |
| `1` | xlang 载荷         |
| `2` | 正在使用带外缓冲区 |

根位图必须与逐对象引用标记保持分离：

- 根位图描述整个载荷
- 引用标志每次描述一个嵌套值

## 序列化流程

### 根写入路径

当前根写入流程为：

1. `Fory.serialize(...)` 或 `serializeTo(...)` 准备目标缓冲区。
2. `Fory` 调用 `writeContext.prepare(...)`。
3. `Fory` 写入根位图。
4. `Fory` 将根对象委托给 `WriteContext`。
5. `writeContext.reset()` 在 `finally` 中运行。

对于非 null 根值，`WriteContext.writeRootValue(...)` 执行：

1. 引用/null 分帧
2. 写入类型元数据
3. 写入载荷

载荷序列化器只负责其类型的载荷。它们不写根位图，也不拥有注册或类型头编码。

### 嵌套写入使用 `WriteContext`

重要规则：

- 嵌套序列化器需要引用处理或类型元数据时，必须使用 `WriteContext` 辅助方法，如 `writeRef(...)`、`writeNonRef(...)` 和容器辅助方法
- 重复的原语写入应直接通过缓冲区进行
- 嵌套序列化器流程应保持直线化；不要仅为清理单次操作状态而添加内部 `try/finally` 块
- 顶层 `Fory.serialize(...)` 拥有操作重置的 `finally`

## 反序列化流程

### 根读取路径

当前根读取流程与写入流程对称：

1. `Fory.deserialize(...)` 或 `deserializeFrom(...)` 读取根位图。
2. null 根立即返回。
3. `Fory` 验证 xlang 模式和其他根分帧要求。
4. `Fory` 调用 `readContext.prepare(...)`。
5. `Fory` 委托给 `ReadContext`。
6. `readContext.reset()` 在 `finally` 中运行。

### `ReadContext` 拥有引用预留和载荷物化

`ReadContext.readRef()` 执行正常的 xlang 读取序列：

1. 消费下一个引用标记
2. 适当时立即返回 `null` 或反向引用
3. 为新的引用跟踪值预留一个新的读取引用 id
4. 读取类型元数据
5. 读取载荷
6. 将预留的读取引用 id 绑定到已完成对象

原语和类似字符串的热路径应直接从缓冲区读取；复杂载荷委托给已解析的序列化器。

### 流与缓冲区字节读取

实现必须将字节可用性保留在字节所有者层，同时将字符串、二进制、原语数组、压缩和集合语义保留在序列化器中。

分配前读取检查所需的字节所有者原语，是类似 `checkReadableBytes(byteCount)` 的可读性检查。此设计不要求实现增加额外的通用读取上下文方法。可读性检查成功后，序列化器使用现有的本地缓冲区读取、复制或解码路径。

可读性检查只是一项字节操作。它不得解码字符串、原语数组元素计数、压缩模式或集合容量策略。

对于按字节计数的大值，每个实现都应在分配变长结果前调用字节所有者可读性检查。这适用于二进制值、字符串、decimal 或元数据主体，以及编码主体以字节衡量的原语编码数组。对于多字节原语编码数组，应将编码字节数而不仅仅是逻辑元素数与可读字节数比较。

1. 在序列化器中验证编码字节数。对于定长原语数组，在分配前检查溢出和元素对齐，如 `wireByteCount % elementByteWidth == 0`，再从编码字节数推导逻辑元素数。
2. 分配变长结果前，无条件调用 `checkReadableBytes(wireByteCount)`。缓冲区支撑的输入通常只做一次边界比较就从该检查返回。流支撑的输入使用同一调用；字节所有者在已缓冲足够字节时处理快速路径，否则持续填充读取缓冲区，直到所请求编码主体可读或记录输入错误。
3. 证明可读后，只分配一次最终值，并从当前可读缓冲区将数据复制或解码到最终结果。

`checkReadableBytes` 不是 `ensureCapacity(wireByteCount)` 操作。在流模式中，结束时字节所有者可能在读取缓冲区中持有完整编码主体，但它必须随着成功从流读取字节而扩展该缓冲区。它应从当前已证明的缓冲区容量开始增长，例如将当前容量翻倍，并且只在这一有界增长步骤到达当前目标时才封顶。当流实现本身是调用方拥有的可信代码时，字节所有者可以把所有者本地的可用性信号用作一次性增长提示；如果该提示缺失或不足，则必须回退到从已缓冲字节开始的有界增长。在输入字节或所有者本地增长提示能够证明中间缓冲区容量合理之前，不得按攻击者声明的长度预留空间。流慢路径可能多进行一次中间缓冲区复制；这优于序列化器本地的分块累积和最终容器反复扩容。

对于按字节计数的值，序列化器不应测试 `availableBytes()` 后再调用 `checkReadableBytes`，从而复制字节所有者的快速路径分支。把该分支保留在字节所有者中，可使每种语言遵循相同的正确性规则，并让序列化器热路径专注于自身编码语义。

对于原语编码数组：

- 比较并证明编码字节数，而不仅仅是逻辑元素数。
- 将压缩、位打包、字节序转换和其他原语数组编码语义保留在序列化器中。`checkReadableBytes` 只证明编码字节存在。
- 对于压缩或转换后的主体，序列化器仍必须在分配或返回最终值前验证解码长度和编码专用元数据。

常见序列化器形状为：

```text
wireByteCount = readVarUint32()
elementWidth = primitiveWireElementWidth(kind)
validate wireByteCount and element alignment
elementCount = wireByteCount / elementWidth

ctx.checkReadableBytes(wireByteCount)
result = allocatePrimitiveResult(elementCount)
copy or decode wireByteCount bytes from the current readable buffer into result
advance the reader index by wireByteCount
return result
```

字节值是同一策略中 `elementWidth == 1` 的特化。此时序列化器形状为：

```text
byteCount = readVarUint32()

ctx.checkReadableBytes(byteCount)
result = allocateBytes(byteCount)
copy byteCount bytes from the current readable buffer into result
advance the reader index by byteCount
return result
```

此策略避免了三种低效实现形状：

- 在编码主体可读前就分配完整的最终连续值
- 在流慢路径中扩展或反复复制最终结果容器
- 当字节所有者能够一次证明可读性并公开正常缓冲读取时，仍添加序列化器本地分块缓冲区

当目标表示并非直接字节目标时，暂存缓冲区仍然合适，例如字符串转码、压缩、非原地字节序转换、位打包值，或流 API 无法读取到调用方提供目标的实现。

对于定长原语数组，在确切编码字节数读取成功前，最终结果不得对调用方可见。

对于 list、set、map 和其他容器读取器，声明的逻辑元素数不是编码字节数，因此序列化器仍必须拥有全部元素、chunk、可空性、引用和类型分派语义。对于基于计数的预分配，它仍是恰当的分配证明：验证非空计数并读取分配前的任何序列化器所有头或类型元数据后，在依据该计数分配、预留后备容量或设置 size hint 前调用 `checkReadableBytes(logicalCount)`。字节所有者处理缓冲区与流就绪状态；容器序列化器随后按声明计数分配，并通过正常所有路径读取元素。

此检查不是完整的容器主体验证。它只防止较小或截断的输入造成按大计数预分配。chunk 大小、重复键、元素值语义和协议严格性仍归容器/map 序列化器所有，并且只应在保护真实所有者不变量时验证。

物化读取器还应在分配或设置 size hint 前，预留根操作的估算对象图内存预算。预算状态属于 `ReadContext` 或等价根读取状态，而不是环境线程局部状态。根门面只设置或重置单次操作预算；不得预留根类型或根自身字节。`maxGraphMemoryBytes` 默认为固定 `128 MiB`；正值配置会覆盖默认值；显式非正配置无效，必须在配置期间或创建 Fory 实例时拒绝。不要从根输入大小推导该预算，也不要为该预算添加动态流已读字节计量。

由于每个根的预算固定，读取状态不应把配置的最大值镜像到第二个活动限制字段。使用现有配置；如果其他地方无法取得配置，则使用一个已配置最大值字段和可变剩余预算。

读取上下文或等价读取状态只拥有原始字节预留。它不得公开按计数算术辅助方法，也不得公开集合、map、array、struct 或 object 的语义预留 API。具体序列化器和生成序列化器所有者负责计算其分配所有路径的存储常量与公式，包括按计数字节的溢出检查。

读取状态不得为该功能扩展任何非内存预算 API，包括引用发布控制、临时所有者控制、序列化器所有者控制、转换辅助方法，或编码正在物化哪类值的 API。这些决策属于具体序列化器和生成序列化器。

该预算是物化对象图所有者的近似门禁，主要涵盖集合、map、array、struct 和 object。它不测量确切堆字节，实际进程内存可能更高。只在存储或分配值的所有者处预留一次自身存储。根门面只重置预算，不得预留根值存储。引用支撑的容器、map、set 和对象/引用数组预留非零所有者自身成本以及引用槽；每个被引用堆所有者在物化时再预留自己的浅层自身成本。内联/值容器预留元素存储；内联/值 map 预留键和值存储；指针、box 和动态物化所有者预留其分配的堆或装箱存储。值序列化器，包括根和生成的 struct/product 读取路径，不预留自身存储。struct/record/POJO/tuple、compatible、generated 和 dynamic object 所有者，仅在引用对象实现或动态/装箱物化路径中，预留非零浅层自身成本和浅层字段存储。

父项不得递归包含子 object、collection、map、string、binary 或原语密集数组内容。跳过作为独立所有者的 enum/union，也跳过专用 string、binary、原语标量、原语数组和原语密集数组叶所有者，但不要跳过 vector 或值对象 list 等一般内联值容器。如果引用槽大小不易或无法可靠查询，使用 4 字节引用槽。原生代码实现可以使用保守下界估计，而不是猜测不可移植的 object、container、allocator、table、node、entry 或 debug 布局细节。在预算比较或分配前拒绝算术溢出，并在后备分配或容量预留前保留现有 `checkReadableBytes` 证明。

被跳过的叶所有者仍必须受剩余输入字节约束。如果未读字节不足以容纳 string、binary value、原语标量、原语数组或原语密集数组，读取器不得读取或创建该叶值。

对于 TypeDef 或 TypeMeta 主体，先通过字节所有者证明编码元数据主体字节可读。字段列表分配应发生在该主体可读性检查之后，不应把单独的小初始容量上限当作安全规则。

实现还应在冷元数据解析路径上限制接收的元数据主体和 struct 字段列表。`maxTypeMetaBytes` 限制一个编码 TypeDef 或 TypeMeta 主体，不包括 8 字节头和任何扩展大小 varint，并在复制或解压该主体前检查。`maxTypeFields` 限制一个接收 struct 元数据主体声明的字段数，并在预留或分配字段列表前检查。这些限制是运行时资源控制；不会改变编码、类型身份、动态加载、未知类型行为、反序列化策略或 Schema 演进语义。元数据缓存命中和生成字段读取器仍是热路径，不得为这些限制增加工作。

远程 Schema 版本限制属于同一个冷元数据处理路径。头缓存命中必须跳过剩余元数据体并返回缓存元数据，不执行 Schema 限制检查、哈希重验证、分配或策略处理。协议定义的 52 位 TypeDef/TypeMeta 头哈希是唯一的 Schema 标识。当选定本地类型已经持有所接收的头时，即为本地 Schema 命中：跳过数据体并使用本地元数据，不比较字段数组或编码元数据字节，不发布到持久远程缓存，也不消耗 Schema 版本计数。此行为适用于带有元数据体的 struct 以及具名 enum、ext 和 union。头部低 12 位仅属于当前帧；命中时读取当前大小和可选扩展以检查边界并跳过，不验证当前保留位或压缩标志。低位标志验证仅属于冷未命中路径。

头未命中时进入元数据解析路径：证明并读取元数据体字节，依据头验证数据体，验证字段数量，并通过现有注册和反序列化策略检查解析类型。若解析前尚无本地头，此仅在未命中时执行的路径可以延迟构建本地元数据，将其 52 位头哈希与已验证的接收哈希比较。哈希相等时选择本地元数据，无需比较字节或字段，也不消耗远程 Schema 版本计数。否则，检查 Schema 版本限制，构建所需读取状态，发布到持久元数据缓存，然后记录 Schema 计数。失败或不兼容的元数据不得发布到持久缓存，也不得消耗 Schema 版本计数。纯基于 ID 的 enum、ext 和 typed-union 值不携带 TypeDef 或 TypeMeta 数据体，必须保持常规 type-id 加 user-type-id 路径。兼容的具名 enum、ext 和 union 元数据通常只有一个版本，但作为共享元数据发送且发生非本地元数据未命中时，仍计入已接受的远程元数据总数。`maxTypeFields` 仅适用于 struct 字段列表。

仅在未命中时使用的本地候选必须由元数据所有者在完成现有类、注册和策略检查后，根据已解码身份确定。只比较其 52 位头哈希与已验证的接收哈希。不要保留或比较元数据字节或字段，不要为重复验证而在调用链中传递额外预期类型参数，也不要增加另一套已接受头状态。缓存命中绝不重复未命中时的工作。

当静态声明的兼容具名 enum、ext 或 union 字段读取共享元数据时，解码元数据必须匹配已声明的 type id、namespace 和 type name，元数据所有者才能将其发布到持久缓存或记录 Schema 计数。已接受的头或引用缓存命中仍会跳过数据体，不得重跑数据体哈希、Schema 限制或注册检查；字段读取器也不得把其他已声明具名类型的元数据当作当前字段元数据。应依据未命中时绑定的具体元数据所有者身份处理这些命中，不检查元数据体，也不重复检查其 namespace、type name、user id 或编码类型。

跳过路径无需物化已跳过的值。现有字节跳过操作应先消费任何可用缓冲前缀，再以有界步骤跳过或丢弃剩余流字节。

### 嵌套读取使用 `ReadContext`

重要规则：

- 提前分配结果对象的序列化器，必须在读取可能反向引用它的嵌套子项前调用 `context.reference(obj)`
- 嵌套序列化器流程应保持直线化；不要仅为恢复单次操作状态而添加内部 `try/finally` 块
- 顶层 `Fory.deserialize(...)` 拥有操作重置的 `finally`

## 深度跟踪

`WriteContext` 和 `ReadContext` 显式跟踪逻辑对象深度。`increaseDepth()` 强制执行 `Config.maxDepth`。

深度应显式保留在上下文中，而不是只依赖原生调用栈。同时，深度清理不应依赖遍布序列化器代码的嵌套 `try/finally` 块。顶层上下文重置必须能够在失败后恢复单次操作状态。

## Struct 兼容性

struct 专用 Schema/版本分帧和兼容字段布局属于 struct 序列化器层，而不属于 `Fory` 或 public 序列化器 API。

在 Dart 中，该内部所有者是 `StructSerializer`。

`StructSerializer` 负责：

- 兼容模式关闭且版本检查开启时的 Schema 哈希分帧
- 兼容模式开启时的兼容 struct 字段重映射
- 缓存兼容读取布局
- 跳过未知兼容字段
- 将兼容读取布局显式传给生成的序列化器
- 在生成分派前，把匹配的兼容字段分类为确切直接读取、兼容转换或纯远程跳过

当启用 `Config.compatible` 且 struct 标记为 evolving 时：

- 编码类型使用 compatible struct 形式
- writer 发出共享 TypeDef 元数据
- 读取按标识符映射传入字段并跳过未知字段
- 生成的序列化器直接应用匹配字段，同时保留自身的对象构造和默认值规则
- Schema 完全匹配的字段使用与同 Schema 读取相同的直接读取形状，不得接收远程兼容元数据
- 只有当布局把远程/本地顶层标量对分类为可无损转换，且两个字段 Schema 的 `trackingRef = false` 时，匹配标量字段才可使用兼容标量转换
- 兼容标量转换只适用于立即匹配字段。不得通过向子 Schema 递归应用标量转换来接纳嵌套 collection、array、map key 和 map value Schema。
- 当元素域匹配时，直接顶层 `list<T?>` 到密集 `array<T>` 的匹配字段必须分类为兼容；可空元素 Schema 位本身不能导致 Schema 对被拒绝。实际 null 元素载荷会在密集数组读取器中失败。当实现无法在不使用泛型/引用路径的情况下物化引用跟踪 list 元素时，引用跟踪 list 元素分帧是独立问题，仍可拒绝。

当禁用 `compatible` 且启用 `checkStructVersion` 时：

- writer 为 struct 载荷发出 Schema 哈希
- 读取侧在读取字段前检查该哈希

兼容标量转换由兼容 struct 字段读取器或生成的兼容布局 action 拥有。根门面、读写上下文、类型解析器、类解析器、xlang 类型解析器和原始缓冲区工具，不得公开 public 转换 API 或携带转换状态。解析器可以提供用于布局分类的字段 Schema 元数据，但转换决策和值适配仍保留在序列化器所有的兼容字段布局中。任一匹配 Schema 的 `trackingRef = true` 时，布局分类必须拒绝顶层标量转换；同一标量类型对的顶层 `trackingRef` 分帧不同时也必须拒绝；转换器不得为标量不匹配添加引用表路径。容器内部的递归 Schema 比较必须拒绝标量不匹配，而不是复用顶层标量转换矩阵。生成的序列化器应直接消费已分类的布局决策：

- 源码生成序列化器使用布局的匹配字段分派键，选择确切直接字段代码、兼容转换代码或跳过代码
- 重新生成的序列化器也可以在分类后编译针对远程 Schema 的直线化读取器，不使用第二个外部 matched-id switch；前提是生成源码仍包含纯直接、纯转换和显式跳过操作
- 兼容标量转换 case 必须读取分类所选的具体远程编码标量，并且只组合所需无损转换；不得调用按远程和本地标量 type ID、字段描述符、字段名或 Schema 资格辅助方法重新分派的通用运行时转换器

引用与 null/optional 分帧匹配的同 Schema 读取器必须保持直接标量读取路径，不增加转换分支或逐字段转换对象。当两个字段都不跟踪引用时，原始标量类型相同但 null/optional 分帧不同，仍可使用兼容的 nullable/optional 组合路径。

## 元字符串与共享类型元数据

两个显式状态支撑 xlang 类型元数据：

- `MetaStringWriter` 和 `MetaStringReader` 对 namespace 与 type-name 字符串去重并解码
- 共享 TypeDef 写入/读取状态跟踪已公布的 TypeDef 元数据

所有权规则：

- 规范编码名称位于 `TypeResolver` 中
- 单次操作动态元字符串 id 位于 `MetaStringWriter` 和 `MetaStringReader` 上
- 共享类型定义表是操作本地上下文状态

对于携带编码哈希的大型 MetaString，该哈希本身就是经检查后的缓存标识。数据体长度属于当前帧：哈希缓存命中时只检查相应字节数可读并跳过，不将长度或数据体与缓存值比较。仅缓存未命中时读取数据体、验证哈希并发布已检查的值。

## Xlang 模式中的 Enum

在 xlang 模式中，enum 按数值 tag 序列化，而不是按名称。

在 Java 中：

- 默认 tag 是声明 ordinal
- `@ForyEnumId` 可以用稳定的显式 tag 覆盖它
- `serializeEnumByName(true)` 影响原生 Java 模式，而不影响 xlang 模式

在 C# 中，enum 的底层数值就是 xlang tag。对于稀疏 C# enum，Java 对端必须声明匹配的 `@ForyEnumId` 值，而不能依赖声明 ordinal。

其他 Fory 实现即使配置或注解表面不同，也应保持相同编码规则。

Rust 携带数据的 enum 只有在每个已知 variant 是 unit，或恰好携带一个备选值并满足 union case 规则时，才是 xlang union。Rust 原生模式（`xlang = false`）还可以通过原生 enum 格式编码具有多个字段的 tuple 或 named variant。这些 struct 风格 enum 形状没有隐式 xlang 映射。xlang 模式注册必须在发布解析器状态前的冷 Schema/类型选择路径上拒绝它们；生成代码不得丢弃字段、合成未声明的 variant struct 或回退到 EXT。

## 带外缓冲区对象

缓冲区对象处理遵循相同划分：

- 一个根位表示是否使用带外缓冲区
- 嵌套缓冲区对象载荷仍逐值决定采用带内还是带外
- 序列化器使用读写上下文辅助方法，而不是绕过上下文层

## 代码生成

正常的 Dart 集成路径为：

1. 用 `@ForyStruct` 注解 struct
2. 用 `@ForyField` 注解字段覆盖项
3. 运行 `build_runner`
4. 调用生成的逐库辅助方法，例如 `<InputFile>ForyModule.register(...)`，以绑定 private 生成元数据并注册生成类型

生成代码应发出：

- private 序列化器类
- private 元数据常量
- 供用户从应用代码调用的 public 逐库注册辅助方法
- 使序列化器工厂保持 private 的 private 生成安装辅助方法

public 辅助方法应是 Fory 注册 API 上的精简生成包装器，而不是 public 全局注册表或第二套无关注册 API 族。

### Dart 普通 Struct 继承

Dart 普通 `ForyStruct` 继承是代码生成期的字段发现、规范化、访问、构造和扁平化变更。它不会重新设计引用协议。

对于具体已注解子类，生成器遍历实例化的父类和已应用 mixin 存储链，而不是只查看子类直接的 `element.fields`。每一层的 `InterfaceType.element.fields` 都公开其声明元素，包括另一库中的 private 声明。Dart 可见性控制哪种生成表达式可以访问元素，而不控制是否发现元素。

存储收集器：

1. 访问实例化的父类；
2. 按应用顺序访问实际应用的 mixin；
3. 访问当前类；
4. 恰好一次收集每一层声明的具体实例存储。

它排除 `Object`、interface、mixin `on` 约束、abstract accessor、static 字段、external 字段，以及不拥有存储的 synthetic 成员。mixin 槽位按其应用点和声明字段标识，因此多次应用不能按拼写或 `baseElement` 折叠。

每个已发现存储字段遵循同一管线：

```text
complete hierarchy discovery
  -> declaration-owned @ForyField(ignore: true)
  -> concrete-child ignoreInheritedPrivateFields policy
  -> concrete generic substitution
  -> direct or companion access resolution
  -> constructor validation
  -> one globally sorted child schema
```

`@ForyField(ignore: true)` 是声明所有、逐字段的省略项。执行该检查后，具有 `ignoreInheritedPrivateFields: true` 的具体子类会移除父类或已应用 mixin 声明的每个 private 字段，包括同库、跨库、直接和传递祖先。它不移除子类声明的 private 字段或继承的 public 字段。两种省略形式都绕过替换、访问、构造、编码身份、引用分析和 codec 工作，而它们的物理槽位仍计入具体对象的浅层对象图内存字段计数。任何仍被包含却无法解析的字段都会导致生成错误。

所有权固定如下：

| 关注点                | 所有者                     |
| --------------------- | -------------------------- |
| 字段身份与注解        | 声明存储字段               |
| 继承层次发现/替换     | 具体子类生成器             |
| 继承 private 字段省略 | 具体已注解子类             |
| 跨库 private 权限     | 字段声明库中的 public 边界 |
| Schema、排序与 codec  | 具体已注解子类             |
| 构造                  | 所选具体子类生成式构造器   |
| 引用分析/发布         | 现有具体子类序列化器路径   |
| 对象图内存自身计费    | 一个具体子对象             |
| 外部目标字段列表      | 显式外部序列化器声明       |

具体子类省略选项默认为 `false`，不会从祖先注解继承，并且只对拥有扁平 Schema 的普通具体声明有效。它在外部目标声明以及纯提供方的抽象、开放泛型或 mixin 边界上无效。它在完整存储发现之后、泛型替换或访问解析之前应用，因此即使 companion 存在，匹配字段也不需要直接访问或 companion。

对于仍然包含的字段，public 继承字段以及在子类库中声明的 private 继承字段使用直接生成访问，不需要父类注解。另一库中声明的 private 字段要求该字段声明库中的 public 继承层次边界带有 `ForyStruct(exposePrivateFields: true)`。`exposePrivateFields` 默认为 `false`，不能与 `ForyStruct.target` 一起使用，并且只授权生成提供方库访问。它不启用发现、不改变同库访问、不改变字段包含关系，也不允许使用方授权另一库的 private 状态。

public 边界可以公开从 private class 或 mixin 继承的同库 private 存储。如果 private 字段来自多个 Dart 库，每个声明库都必须独立提供已选择加入的 public 边界和可见 companion。选择声明库中离子类最近且对子类可见的合格边界。

提供方的 `.fory.dart` part 会生成一个 public `@nodoc` 类型化 static 访问 companion。它为每个已公开且未忽略的 private 字段生成确切 getter；只为可变存储生成 setter，不为 `final` 或 `late final` 存储生成 setter。接收者是 public 边界类型。泛型 bound 和 public 签名中嵌套的每一种类型，都必须能够在提供方库外命名。companion 不得使用 `dynamic`、`Object?` 桥接转换、反射、回调、运行时查找、父序列化器或存储的运行时状态。companion 生成与每个使用方子类的 `ignoreInheritedPrivateFields` 值无关。具体边界可以同时启用两个选项：自身序列化器应用省略策略，而其提供方 companion 继续公开声明库中符合条件的 private 存储。

子类源码必须有一个直接 import 或 re-export namespace，以公开 public 边界和 companion。构建依赖包前，必须先生成并发布提供方输出。缺失权限、隐藏或含糊的 companion namespace、无法命名的签名，或不再到达确切存储槽的分派，都会导致生成错误。子类还必须验证完整具体继承层次，确保边界之下的字段隐藏不会把生成的 getter 或 setter 重定向到另一槽位。

每个被包含的 `final` 或 `late final` 字段都必须由静态证明的身份流初始化：

```text
selected concrete-child constructor parameter
  -> redirect or super parameter
  -> exact storage field
```

可接受边包括确切 field formal、super formal、构造器字段初始化器中的直接参数引用，以及重定向或 super-constructor 参数中的直接参数引用。具体泛型替换后类型必须保持完全相同，包括可空性。调用、运算符、转换、null 断言、常量、构造器主体赋值，以及只有名称相同而元素身份不同的情况，都不能作为证明。被包含 final 字段上的声明初始化器不受支持，因为解码值无法拥有该槽位。不存在构造后 final 写入、反射或回退。

连接到所选构造器参数的可变字段，通过同一确切身份流初始化一次。其余可变字段要求确切 setter，并在构造后恢复。required 构造器参数必须有一个无歧义字段来源。optional named 参数可以省略；被省略的 optional positional 参数之后不能再有已传入 positional 参数。构造器参数和赋值按已解析存储字段身份匹配，而不是按字段名称字符串匹配。如果省略移除了 required 参数唯一的序列化来源，生成会失败；生成器不得发明值或放宽身份证明。

具体子类拥有一个 `GeneratedStructSchema`、一套规范字段排序、一个序列化器和描述符缓存、一次重建、一条引用发布路径和一个对象图内存所有者。父序列化器既不嵌套也不调用，不要求父类型注册。单独注解的具体父类只为该确切类型的值拥有自己独立扁平化的 Schema。

被包含的直接字段和继承字段会进入同一规范化列表，再进行现有递归引用分析和 `needsRootRef` 计算。被包含的继承 `ref: true` 和嵌套容器元数据的行为，与等价直接子类字段相同；被省略字段不进入该列表。继承不会增加引用状态、`ReadContext` API、序列化器签名、调用契约变更、运行时分支、槽位、哨兵、回调、包装器、兼容布局状态或父引用所有者。等价扁平模型也存在的失败属于独立的引用子系统问题。

Java 只为该功能提供扁平模型比较：它的对象序列化器跨继承扩展一个字段描述符列表，不增加继承专用引用状态。Java 现有引用契约使用 `readRefIds` 栈、真实引用 ID 和它的 `-1` 哨兵，把 `reference(obj)` 与当前序列化器调用关联起来。该契约与 Dart 当前引用子系统不同，不应作为 Dart 继承支持的一部分移植。Dart 继承只需要匹配自身的等价扁平模型。

继承层次遍历、替换、访问验证和构造器证明均在生成期间运行。现有扁平序列化器不增加运行时工作；public 和同库继承字段生成与等价扁平字段相同的直接操作；策略过滤不生成运行时检查；被包含的跨库 private 字段只增加一次可内联的类型化 static companion 调用。生成不得引入运行时继承层次遍历、分配、回调、反射或父类分派。

子类的浅层对象图内存公式为：

```text
24 + 4 * actualConcreteStorageFieldCount
```

它对每个真实继承和忽略的存储槽位计数一次，不增加父对象自身费用。

生成的诊断必须指出具体子类、声明字段、声明库以及失败的访问或构造器路径，然后给出可操作的修复方法。常见修复包括：在所有者库的 public 边界添加 `exposePrivateFields: true`；导入其生成 companion；原样转发构造器值；把 `@ForyField(ignore: true)` 放在字段声明上；当所有祖先 private 状态都应省略时，在具体子类上设置 `ignoreInheritedPrivateFields: true`；或使用自定义序列化器。诊断必须说明继承层次发现与跨库访问互相独立。

继承层次存储、公开边界或 `ignoreInheritedPrivateFields` 发生变化时，需要重新生成每个受影响的 `.fory.dart` 文件。兼容模式使用正常的缺失/未知字段处理；固定 Schema 对端必须一同变更。实现不得添加专用旧版读取器、保留仅限子声明的备用路径、只按名称绑定构造器、使用 late-final setter 路径、回退到另一访问模型或委托给父序列化器。

验收要求每个继承层次存储槽位均满足以下之一：被其声明省略；被具体子类继承 private 策略省略；或以有效类型、访问路径、编码身份和重建路径恰好表示一次。等价的已包含扁平模型和继承模型必须生成相同的规范 Schema、编码字节、引用 ID 和往返行为。外部目标声明保持显式且不受影响。

### Dart 外部结构化序列化器

Dart 外部类型序列化扩展 `ForyStruct`，增加可选的编译期 `target` 和具名生成式 `constructor`。被注解的 `abstract final` 类仅是 Schema 声明。它没有运行时值或注册身份。

生成器必须通过一个 struct 模型和一个 emitter 分析普通与外部 struct。private 生成符号名来自声明名称。每个生成序列化器类型位置都使用目标类型：`Serializer<Target>`、`GeneratedStructSchema<Target>`、读写签名、构造器调用、Schema `type` 和生成模块分派。

对于每个序列化声明字段，解析同名且实例化 Dart 类型完全相同的可访问目标 getter。构造器参数和任何构造后 setter 也必须完全匹配。只有注解命名 public named generative constructor 时才选择它。factory constructor、abstract target、开放目标类型，以及回到目标的基于构造器的引用跟踪路径，都在生成期间拒绝。递归检查包含受支持 list、set 和 map 字段元数据中嵌套的目标元素、键和值。

外部声明的字段就是完整 Schema。它可以显式命名目标继承的可访问属性，但生成器不会自动扫描外部目标继承层次以寻找 Schema 字段。`exposePrivateFields` 和 `ignoreInheritedPrivateFields` 在外部声明上无效。

外部对象的浅层对象图内存公式，是声明字段与在目标、其父类和已应用 mixin 上发现的 public 实例字段的并集。由声明表示的 public 目标字段只计数一次。`@ForyField(ignore: true)` 添加仅预算的声明存储，不添加目标访问、构造、元数据或编码代码。

生成代码直接读取 getter，并调用目标构造器或 setter。它不得分配声明、通过中间对象复制值、调用运行时回调、执行成员名称查找，或根据 struct 是否外部进行分支。现有生成 struct、注册、解析器、字段、集合、map、兼容读取和引用路径仍是唯一运行时路径。

注册由生成模块和现有生成注册 API 按 `Target` 索引。直接根、生成字段、动态值以及递归 collection/map 子项解析到同一个目标注册。Dart 根集合保留现有无类型外层形状。

## 目录布局

每个 Dart 包的 `lib/` 树下只允许一层嵌套源码目录。

允许：

- `lib/fory.dart`
- `lib/src/<file>.dart`
- `lib/src/<area>/<file>.dart`

不允许：

- `lib/src/<area>/<subarea>/<file>.dart`

## 新实现的序列化器设计规则

任何新的 xlang 实现都应遵循这些规则，即使其表面 API 看起来不同：

1. 将根操作保留在 `Fory` 门面上，将嵌套载荷工作保留在显式读写上下文中。
2. 将引用跟踪保留在专用读侧和写侧服务之后，使禁用路径保持低成本。
3. 让序列化器只处理载荷。类型元数据、注册和根分帧属于 `Fory` 与类型解析器层。
4. 显式跟踪单次操作状态。不要依赖环境线程局部实例状态。
5. 在物化新对象前预留读取引用 ID；嵌套子项一旦可能反向引用部分构造的对象，就立即绑定该对象。
6. 将操作设置与操作清理分离。`prepare(...)` 绑定当前操作输入，`reset()` 清除操作本地状态。
7. 保持根位图、逐对象引用标志、类型头和载荷字节之间的分离。
8. 内部命名应属于序列化领域。优先使用 `serializer`、`binding` 和 `layout` 等词；避免 RPC 风格的 `session` 或 `plan` 等含糊控制流词。
9. 当实现语言支持 cold 和 no-inline 注解时，让序列化器热路径可达的错误、缓存未命中、Schema 不匹配、不支持能力和其他冷入口不参与热路径内联。不要把成功的动态分派标记为 cold。
10. 每次 xlang 协议或所有权变更后，运行跨语言测试矩阵，并同时更新本指南和 [Xlang 序列化规范](xlang_serialization_spec.md)。

## 验证

对于 Dart 实现变更，至少运行：

```bash
cd dart
dart run build_runner build
dart analyze
dart test
```

对于生成使用方覆盖，还应运行：

```bash
cd dart/packages/fory-test
dart run build_runner build
dart test
```
