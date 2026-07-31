---
title: 生成代码
sidebar_position: 5
id: generated_code
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

本文介绍各目标语言的生成代码。

Fory IDL 生成的类型符合宿主语言习惯，可以直接用作领域对象。根据目标语言的不同，生成类型还包含字节转换辅助方法以及 Schema 模块或注册辅助方法。

生成的 Schema 模块根据 Schema 源文件命名，而不是根据包或命名空间命名。对于直接在语言包或命名空间中公开模块的目标，`AddressbookForyModule` 或 `ComplexPbForyModule` 这类名称可让多个 IDL 文件面向同一个包或命名空间，而不会产生冲突的 `ForyModule` 类型。

## 参考 Schema

以下示例使用两个实际的 Schema：

1. `addressbook.fdl`（显式类型 ID）
2. `auto_id.fdl`（无显式类型 ID）

### `addressbook.fdl`（节选）

```protobuf
package addressbook;

option go_package = "github.com/myorg/myrepo/gen/addressbook;addressbook";

message Person [id=100] {
    string name = 1;
    int32 id = 2;

    enum PhoneType [id=101] {
        PHONE_TYPE_MOBILE = 0;
        PHONE_TYPE_HOME = 1;
        PHONE_TYPE_WORK = 2;
    }

    message PhoneNumber [id=102] {
        string number = 1;
        PhoneType phone_type = 2;
    }

    list<PhoneNumber> phones = 7;
    Animal pet = 8;
}

message Dog [id=104] {
    string name = 1;
    int32 bark_volume = 2;
}

message Cat [id=105] {
    string name = 1;
    int32 lives = 2;
}

union Animal [id=106] {
    Dog dog = 1;
    Cat cat = 2;
}

message AddressBook [id=103] {
    list<Person> people = 1;
    map<string, Person> people_by_name = 2;
}
```

### `auto_id.fdl`（节选）

```protobuf
package auto_id;

enum Status {
    UNKNOWN = 0;
    OK = 1;
}

message Envelope {
    string id = 1;

    message Payload {
        int32 value = 1;
    }

    union Detail {
        Payload payload = 1;
        string note = 2;
    }

    Payload payload = 2;
    Detail detail = 3;
    Status status = 4;
}

union Wrapper {
    Envelope envelope = 1;
    string raw = 2;
}
```

## Java

### 输出布局

对于 `package addressbook`，Java 输出生成在：

- `<java_out>/addressbook/`
- 类型文件：`AddressBook.java`、`Person.java`、`Dog.java`、`Cat.java`、`Animal.java`
- Schema 模块：`AddressbookForyModule.java`

对于没有 Java 包的 Schema，Schema 模块名称取自源文件的主文件名。例如，`main.fdl` 会生成 `MainForyModule.java`。Java 导入图不能混用默认包 Schema 与具名 Java 包。

### 类型生成

消息会生成带有 `@ForyField`、默认构造函数、getter/setter 和字节辅助方法的 Java 类：

```java
public class Person {
    public static enum PhoneType {
        MOBILE,
        HOME,
        WORK;
    }

    public static class PhoneNumber {
        @ForyField(id = 1)
        private String number;

        @ForyField(id = 2)
        private PhoneType phoneType;

        public byte[] toBytes() { ... }
        public static PhoneNumber fromBytes(byte[] bytes) { ... }
    }

    @ForyField(id = 1)
    private String name;

    @ForyField(id = 8)
    private Animal pet;

    public byte[] toBytes() { ... }
    public static Person fromBytes(byte[] bytes) { ... }
}
```

设置 `evolving=false` 的消息会使用 Java 固定 Schema 结构体编码生成。

联合类型会生成继承 `org.apache.fory.type.union.Union` 的类：

```java
public final class Animal extends Union {
    public enum AnimalCase {
        DOG(1),
        CAT(2);
        public final int id;
        AnimalCase(int id) { this.id = id; }
    }

    public static Animal ofDog(Dog v) { ... }
    public AnimalCase getAnimalCase() { ... }
    public int getAnimalCaseId() { ... }

    public boolean hasDog() { ... }
    public Dog getDog() { ... }
    public void setDog(Dog v) { ... }
}
```

### Schema 模块

每个 JVM Schema 都会生成一个 `ForyModule`。导入的 Schema 模块通过 `fory.register(...)` 安装，因此共享导入会由 Fory 实例去重。

```java
public final class AddressbookForyModule implements org.apache.fory.ForyModule {
  public static final AddressbookForyModule INSTANCE = new AddressbookForyModule();

  static ThreadSafeFory getFory() { ... }

  @Override
  public void install(Fory fory) {
    org.apache.fory.resolver.TypeResolver resolver = fory.getTypeResolver();
    resolver.registerUnion(Animal.class, 106L, new org.apache.fory.serializer.UnionSerializer(resolver, Animal.class));
    resolver.register(Person.class, 100L);
    resolver.register(Person.PhoneType.class, 101L);
    resolver.register(Person.PhoneNumber.class, 102L);
    resolver.register(Dog.class, 104L);
    resolver.register(Cat.class, 105L);
    resolver.register(AddressBook.class, 103L);
  }
}
```

对于没有显式 `[id=...]` 的 Schema，生成的注册代码使用计算得到的数字 ID（以下示例来自 `auto_id.fdl`）：

```java
resolver.register(Status.class, 1124725126L);
resolver.registerUnion(Wrapper.class, 1471345060L, new org.apache.fory.serializer.UnionSerializer(resolver, Wrapper.class));
resolver.register(Envelope.class, 3022445236L);
resolver.registerUnion(Envelope.Detail.class, 1609214087L, new org.apache.fory.serializer.UnionSerializer(resolver, Envelope.Detail.class));
resolver.register(Envelope.Payload.class, 2862577837L);
```

如果设置了 `option enable_auto_type_id = false;`，注册代码会使用符号名称：

```java
resolver.register(Config.class, "myapp.models", "Config");
resolver.registerUnion(
    Holder.class,
    "myapp.models",
    "Holder",
    new org.apache.fory.serializer.UnionSerializer(resolver, Holder.class));
```

### 使用示例

```java
Person person = new Person();
person.setName("Alice");
person.setPet(Animal.ofDog(new Dog()));

byte[] data = person.toBytes();
Person restored = Person.fromBytes(data);
```

### gRPC 服务伴生代码

当 Schema 包含服务且编译器使用 `--grpc` 运行时，Java 生成器会在模型类型旁为每个服务生成一个 `<ServiceName>Grpc.java` 文件。

```java
public final class AddressBookServiceGrpc {
  public static final String SERVICE_NAME = "addressbook.AddressBookService";

  public static AddressBookServiceStub newStub(io.grpc.Channel channel) { ... }
  public static AddressBookServiceBlockingStub newBlockingStub(io.grpc.Channel channel) { ... }
  public static AddressBookServiceFutureStub newFutureStub(io.grpc.Channel channel) { ... }

  public abstract static class AddressBookServiceImplBase
      implements io.grpc.BindableService {
    public void lookup(Person request, io.grpc.stub.StreamObserver<AddressBook> responseObserver) { ... }
  }
}
```

生成的 marshaller 使用 Schema 模块的 `ThreadSafeFory` 序列化每个请求或响应。它使用 grpc-java 的 `MethodDescriptor.Marshaller` API，因此编译这些文件的应用必须提供 grpc-java 依赖。这些依赖不会添加到 Fory Java 构件中。

## Python

### 输出布局

每个 Schema 文件会生成一个 Python 模块，例如：

- `<python_out>/addressbook.py`

### 类型生成

联合类型会生成 case 枚举和带有类型化辅助方法的 `Union` 子类：

```python
class AnimalCase(Enum):
    DOG = 1
    CAT = 2

class Animal(Union):
    @classmethod
    def dog(cls, v: Dog) -> "Animal": ...

    def case(self) -> AnimalCase: ...
    def case_id(self) -> int: ...

    def is_dog(self) -> bool: ...
    def dog_value(self) -> Dog: ...
    def set_dog(self, v: Dog) -> None: ...
```

消息会生成 `@pyfory.dataclass` 类型，嵌套类型仍保持嵌套：

```python
@pyfory.dataclass
class Person:
    class PhoneType(IntEnum):
        MOBILE = 0
        HOME = 1
        WORK = 2

    @pyfory.dataclass
    class PhoneNumber:
        number: str = pyfory.field(id=1, default="")
        phone_type: Person.PhoneType = pyfory.field(id=2, default=None)

    name: str = pyfory.field(id=1, default="")
    phones: List[Person.PhoneNumber] = pyfory.field(id=7, default_factory=list)
    pet: Animal = pyfory.field(id=8, default=None)

    def to_bytes(self) -> bytes: ...
    @classmethod
    def from_bytes(cls, data: bytes) -> "Person": ...
```

### 注册

生成的注册函数如下：

```python
def register_addressbook_types(fory: pyfory.Fory):
    fory.register_union(Animal, type_id=106, serializer=AnimalSerializer(fory))
    fory.register_type(Person, type_id=100)
    fory.register_type(Person.PhoneType, type_id=101)
    fory.register_type(Person.PhoneNumber, type_id=102)
    fory.register_type(Dog, type_id=104)
    fory.register_type(Cat, type_id=105)
    fory.register_type(AddressBook, type_id=103)
```

对于没有显式 `[id=...]` 的 Schema，生成的注册代码使用计算得到的数字 ID：

```python
fory.register_type(Status, type_id=1124725126)
fory.register_union(Wrapper, type_id=1471345060, serializer=WrapperSerializer(fory))
fory.register_type(Envelope, type_id=3022445236)
fory.register_union(Envelope.Detail, type_id=1609214087, serializer=Envelope.DetailSerializer(fory))
fory.register_type(Envelope.Payload, type_id=2862577837)
```

如果设置了 `option enable_auto_type_id = false;`：

```python
fory.register_type(Config, name="myapp.models.Config")
fory.register_union(
    Holder,
    name="myapp.models.Holder",
    serializer=HolderSerializer(fory),
)
```

### 使用示例

```python
person = Person(name="Alice", pet=Animal.dog(Dog(name="Rex", bark_volume=10)))

data = person.to_bytes()
restored = Person.from_bytes(data)
```

### gRPC 服务伴生代码

当 Schema 包含服务且编译器使用 `--grpc` 运行时，Python 生成器会生成名为 `<module>_grpc.py` 的伴生模块。模块名取自 Fory 包名，其中的点会替换为下划线；如果 Schema 没有包，则使用 `generated`。Python gRPC 输出默认使用 `grpc.aio` AsyncIO API。

```python
import grpc
import grpc.aio


class AddressBookServiceStub:
    def __init__(self, channel):
        self.lookup = channel.unary_unary(
            "/addressbook.AddressBookService/Lookup",
            request_serializer=_serialize,
            response_deserializer=_deserialize,
        )


class AddressBookServiceServicer:
    async def lookup(self, request, context):
        await context.abort(grpc.StatusCode.UNIMPLEMENTED, "Method not implemented!")


def add_servicer(servicer, server): ...
```

Python gRPC 序列化器接收并返回完整的 `bytes` 载荷，因此生成的回调会直接调用模型模块的 `_get_fory().serialize(...)` 和 `_get_fory().deserialize(...)`。使用生成伴生模块的应用必须安装 `grpcio`；`pyfory` 不会添加 gRPC 硬依赖。Python API 使用 snake_case 方法名，同时在 gRPC 路径中保留原始 IDL 方法名。

使用 `--grpc --grpc-python-mode=sync` 可生成同步 Python `grpcio` 伴生代码。同步模式保持相同的生成文件名和公开名称，但服务端方法使用普通 `def` 方法以及同步的 `grpc.Channel` 和 `grpc.Server` 实例。

## Rust

### 输出布局

每个 Schema 会生成一个 Rust 模块文件，例如：

- `<rust_out>/addressbook.rs`

使用 `--grpc` 且 Schema 包含服务时，Rust 还会生成：

- `<rust_out>/addressbook_service.rs`
- `<rust_out>/addressbook_service_grpc.rs`

### 类型生成

联合类型映射为带有 `#[fory(id = ...)]` Schema case 属性的 Rust 枚举。`#[fory(unknown)] Unknown(::fory::UnknownCase)` 标记由 Fory 提供的前向兼容载体。该标记只用于选择载体，不会向 Schema case 表添加条目；Schema case 仍可使用完整的 `0..N` ID 范围。生成的类型化联合必须至少包含一个非 `Unknown` case。编译器会将声明的第一个非 `Unknown` case 标记为 `#[fory(default)]`。当该 case 的载荷实现 Rust 标准 `Default` trait 时，编译器还会基于该 case 生成标准 `Default` 实现：

```rust
#[derive(::fory::ForyUnion, Clone, Debug, PartialEq, Eq, Hash)]
pub enum Animal {
    #[fory(unknown)]
    Unknown(::fory::UnknownCase),
    #[fory(id = 0, default)]
    Dog(self::Dog),
    #[fory(id = 1)]
    Cat(self::Cat),
}

impl ::std::default::Default for Animal {
    fn default() -> Self {
        Self::Dog(<self::Dog as ::std::default::Default>::default())
    }
}
```

如果选定 case 的载荷未实现标准 `Default`，例如 `any` 载荷，则生成的联合类型不会生成必定成功的 `Default` 实现。这个模型层面的默认值独立于 Fory 的可失败反序列化默认值；后者通过相应的 codec 和当前读取上下文重建选定的 case。

嵌套类型会生成嵌套模块：

```rust
pub mod person {
    #[derive(ForyEnum, Debug, Clone, PartialEq, Default)]
    #[repr(i32)]
    pub enum PhoneType {
        #[default]
        Mobile = 0,
        Home = 1,
        Work = 2,
    }

    #[derive(ForyStruct, Debug, Clone, PartialEq, Default)]
    pub struct PhoneNumber {
        #[fory(id = 1)]
        pub number: String,
        #[fory(id = 2)]
        pub phone_type: PhoneType,
    }
}
```

消息派生 `ForyStruct`，并包含 `to_bytes`/`from_bytes` 辅助方法：

```rust
#[derive(ForyStruct, Debug, Clone, PartialEq, Default)]
pub struct Person {
    #[fory(id = 1)]
    pub name: String,
    #[fory(id = 7)]
    pub phones: Vec<person::PhoneNumber>,
    #[fory(id = 8)]
    pub pet: Animal,
}
```

### 注册

生成的注册函数如下：

```rust
pub fn register_types(fory: &mut Fory) -> Result<(), fory::Error> {
    fory.register_union::<Animal>(106)?;
    fory.register::<person::PhoneType>(101)?;
    fory.register::<person::PhoneNumber>(102)?;
    fory.register::<Person>(100)?;
    fory.register::<Dog>(104)?;
    fory.register::<Cat>(105)?;
    fory.register::<AddressBook>(103)?;
    Ok(())
}
```

对于没有显式 `[id=...]` 的 Schema，生成的注册代码使用计算得到的数字 ID：

```rust
fory.register::<Status>(1124725126)?;
fory.register_union::<Wrapper>(1471345060)?;
fory.register::<Envelope>(3022445236)?;
fory.register_union::<envelope::Detail>(1609214087)?;
fory.register::<envelope::Payload>(2862577837)?;
```

如果设置了 `option enable_auto_type_id = false;`：

```rust
fory.register_by_name::<Config>("myapp.models.Config")?;
fory.register_union_by_name::<Holder>("myapp.models.Holder")?;
```

### 使用示例

```rust
let person = Person {
    name: "Alice".into(),
    pet: Animal::Dog(self::Dog::default()),
    ..Default::default()
};

let bytes = person.to_bytes()?;
let restored = Person::from_bytes(&bytes)?;
```

### gRPC 服务伴生代码

当 Schema 包含服务且编译器使用 `--grpc` 运行时，Rust 生成器会生成一个服务 API 模块和一个 tonic 绑定模块。对于名为 `addressbook` 的 Schema 模块，这两个文件分别是 `addressbook_service.rs` 和 `addressbook_service_grpc.rs`。

服务 API 模块包含异步 trait 和 gRPC 路径常量：

```rust
#[::tonic::async_trait]
pub trait AddressBookService: ::std::marker::Send + ::std::marker::Sync + 'static {
    async fn lookup(
        &self,
        request: ::tonic::Request<crate::addressbook::Person>,
    ) -> ::std::result::Result<
        ::tonic::Response<crate::addressbook::AddressBook>,
        ::tonic::Status,
    >;
}

pub const ADDRESS_BOOK_SERVICE_SERVICE_NAME: &str = "addressbook.AddressBookService";
pub const ADDRESS_BOOK_SERVICE_LOOKUP_PATH: &str = "/addressbook.AddressBookService/Lookup";
```

tonic 绑定模块包含由 Fory 支持的 codec、载荷实现以及客户端/服务端包装器。它使用生成模型类型的 `to_bytes` 和 `from_bytes` 辅助方法序列化每个请求或响应：

```rust
impl codec::ForyGrpcPayload for crate::addressbook::Person {
    fn encode_fory_payload(&self) -> ::std::result::Result<::std::vec::Vec<u8>, ::fory::Error> {
        self.to_bytes()
    }

    fn decode_fory_payload(payload: &[u8]) -> ::std::result::Result<Self, ::fory::Error> {
        Self::from_bytes(payload)
    }
}
```

编译生成 Rust 服务文件的应用必须提供 `tonic` 和 `bytes` 依赖；Fory 的 Rust crate 不会将这些 gRPC 依赖作为硬依赖添加。

## C++

### 输出布局

每个 Schema 文件会生成一个 C++ 头文件，例如：

- `<cpp_out>/addressbook.h`

### 类型生成

消息会生成带有类型化访问器和字节辅助方法的 `final` 类：

```cpp
class Person final {
 public:
  class PhoneNumber final {
   public:
    const std::string& number() const;
    std::string* mutable_number();
    template <class Arg, class... Args>
    void set_number(Arg&& arg, Args&&... args);

    fory::Result<std::vector<uint8_t>, fory::Error> to_bytes() const;
    static fory::Result<PhoneNumber, fory::Error> from_bytes(const std::vector<uint8_t>& data);
  };

  const std::string& name() const;
  std::string* mutable_name();
  template <class Arg, class... Args>
  void set_name(Arg&& arg, Args&&... args);

  const Animal& pet() const;
  Animal* mutable_pet();
};
```

可选消息字段会生成 `has_xxx`、`mutable_xxx` 和 `clear_xxx` API：

```cpp
class Envelope final {
 public:
  bool has_payload() const { return payload_ != nullptr; }
  const Envelope::Payload& payload() const { return *payload_; }
  Envelope::Payload* mutable_payload() {
    if (!payload_) {
      payload_ = std::make_unique<Envelope::Payload>();
    }
    return payload_.get();
  }
  void clear_payload() { payload_.reset(); }

 private:
  std::unique_ptr<Envelope::Payload> payload_;
};
```

联合类型会生成 `std::variant` 包装器：

```cpp
class Animal final {
 public:
  enum class AnimalCase : uint32_t {
    DOG = 1,
    CAT = 2,
  };

  static Animal dog(Dog v);
  static Animal cat(Cat v);

  AnimalCase animal_case() const noexcept;
  uint32_t animal_case_id() const noexcept;

  bool is_dog() const noexcept;
  const Dog* as_dog() const noexcept;
  Dog* as_dog() noexcept;
  const Dog& dog() const;
  Dog& dog();

  template <class Visitor>
  decltype(auto) visit(Visitor&& vis) const;

 private:
  std::variant<Dog, Cat> value_;
};
```

生成的头文件包含用于序列化元数据的 `FORY_UNION`、`FORY_ENUM` 和 `FORY_STRUCT` 宏。字段和载荷配置嵌入生成的 `FORY_STRUCT`/`FORY_UNION` 条目中。

### 注册

生成的注册函数如下：

```cpp
inline void register_types(fory::serialization::BaseFory& fory) {
    fory.register_union<Animal>(106);
    fory.register_enum<Person::PhoneType>(101);
    fory.register_struct<Person::PhoneNumber>(102);
    fory.register_struct<Person>(100);
    fory.register_struct<Dog>(104);
    fory.register_struct<Cat>(105);
    fory.register_struct<AddressBook>(103);
}
```

对于没有显式 `[id=...]` 的 Schema，生成的注册代码使用计算得到的数字 ID：

```cpp
fory.register_enum<Status>(1124725126);
fory.register_union<Wrapper>(1471345060);
fory.register_struct<Envelope>(3022445236);
fory.register_union<Envelope::Detail>(1609214087);
fory.register_struct<Envelope::Payload>(2862577837);
```

如果设置了 `option enable_auto_type_id = false;`：

```cpp
fory.register_struct<Config>("myapp.models.Config");
fory.register_union<Holder>("myapp.models.Holder");
```

### 使用示例

```cpp
addressbook::Person person;
person.set_name("Alice");
*person.mutable_pet() = addressbook::Animal::dog(addressbook::Dog{});

auto bytes = person.to_bytes();
auto restored = addressbook::Person::from_bytes(bytes.value());
```

## Go

### 输出布局

Go 输出路径取决于 Schema 选项和 `--go_out`。

对于 `addressbook.fdl`，已配置 `go_package`，生成输出会遵循所配置的导入路径/包（例如位于 `--go_out` 根目录下）。

没有 `go_package` 时，输出使用指定的 `--go_out` 目录以及根据包名派生的文件名。

### 类型生成

嵌套类型默认使用下划线命名（`Person_PhoneType`、`Person_PhoneNumber`）：

```go
type Person_PhoneType int32

const (
    Person_PhoneTypeMobile Person_PhoneType = 0
    Person_PhoneTypeHome   Person_PhoneType = 1
    Person_PhoneTypeWork   Person_PhoneType = 2
)

type Person_PhoneNumber struct {
    Number    string           `fory:"id=1"`
    PhoneType Person_PhoneType `fory:"id=2"`
}
```

消息会生成带有 `fory` tag 和字节辅助方法的结构体：

```go
type Person struct {
    Name   string               `fory:"id=1"`
    Id     int32                `fory:"id=2"`
    Phones []Person_PhoneNumber `fory:"id=7,type=list"`
    Pet    Animal               `fory:"id=8"`
}

func (m *Person) ToBytes() ([]byte, error) { ... }
func (m *Person) FromBytes(data []byte) error { ... }
```

联合类型会生成带有构造函数、访问器和访问者 API 的类型化 case 结构体：

```go
type AnimalCase uint32

type Animal struct {
    case_ AnimalCase
    value any
}

func DogAnimal(v *Dog) Animal { ... }
func CatAnimal(v *Cat) Animal { ... }

func (u Animal) Case() AnimalCase { ... }
func (u Animal) AsDog() (*Dog, bool) { ... }
func (u Animal) Visit(visitor AnimalVisitor) error { ... }
```

### 注册

生成的注册函数如下：

```go
func RegisterTypes(f *fory.Fory) error {
    if err := f.RegisterUnion(Animal{}, 106, fory.NewUnionSerializer(...)); err != nil {
        return err
    }
    if err := f.RegisterEnum(Person_PhoneType(0), 101); err != nil {
        return err
    }
    if err := f.RegisterStruct(Person_PhoneNumber{}, 102); err != nil {
        return err
    }
    if err := f.RegisterStruct(Person{}, 100); err != nil {
        return err
    }
    return nil
}
```

对于没有显式 `[id=...]` 的 Schema，生成的注册代码使用计算得到的数字 ID：

```go
if err := f.RegisterEnum(Status(0), 1124725126); err != nil { ... }
if err := f.RegisterUnion(Wrapper{}, 1471345060, fory.NewUnionSerializer(...)); err != nil { ... }
if err := f.RegisterStruct(Envelope{}, 3022445236); err != nil { ... }
if err := f.RegisterUnion(Envelope_Detail{}, 1609214087, fory.NewUnionSerializer(...)); err != nil { ... }
if err := f.RegisterStruct(Envelope_Payload{}, 2862577837); err != nil { ... }
```

如果设置了 `option enable_auto_type_id = false;`：

```go
if err := f.RegisterStructByName(Config{}, "myapp.models.Config"); err != nil { ... }
if err := f.RegisterUnionByName(Holder{}, "myapp.models.Holder", fory.NewUnionSerializer(...)); err != nil { ... }
```

`go_nested_type_style` 控制嵌套类型的命名方式：

```protobuf
option go_nested_type_style = "camelcase";
```

同时设置二者时，CLI 标志 `--go_nested_type_style` 会覆盖此 Schema 选项。

### 使用示例

```go
person := &Person{
    Name: "Alice",
    Pet:  DogAnimal(&Dog{Name: "Rex"}),
}

data, err := person.ToBytes()
if err != nil {
    panic(err)
}
var restored Person
if err := restored.FromBytes(data); err != nil {
    panic(err)
}
```

### gRPC 服务伴生代码

当 Schema 包含服务且编译器使用 `--grpc` 运行时，Go 生成器会在模型文件旁生成一个 `<module>_grpc.go` 文件。伴生文件包含 grpc-go 客户端和服务端接口，以及由 Fory 支持的 `CodecV2`。

```go
type AddressBookServiceClient interface {
    Lookup(ctx context.Context, in *Person, opts ...grpc.CallOption) (*AddressBook, error)
}

func NewAddressBookServiceClient(cc grpc.ClientConnInterface) AddressBookServiceClient { ... }

type CodecV2 struct{}
```

生成的 codec 与生成的 `ToBytes` 和 `FromBytes` 辅助方法使用同一个包级线程安全 Fory 运行时。应用应将 `CodecV2{}` 传给 grpc-go 服务端选项，生成的客户端则会在每次调用时强制使用同一 codec：

```go
server := grpc.NewServer(grpc.ForceServerCodecV2(addressbook.CodecV2{}))
addressbook.RegisterAddressBookServiceServer(server, service)

client := addressbook.NewAddressBookServiceClient(conn)
```

Go 方法名以 PascalCase 标识符导出，而 gRPC 方法路径会精确保留 Schema 中的服务名和方法名。更改服务名或方法名后，请重新生成通信两端的代码。

编译这些文件的应用必须提供 grpc-go 依赖；Fory Go 包不会将 gRPC 作为硬依赖添加。

## C\#

### 输出布局

每个 Schema 会生成一个 C# `.cs` 文件，例如：

- `<csharp_out>/addressbook/Addressbook.cs`

C# 模型文件名使用规范化为 PascalCase 的源文件主文件名。例如，`service.fdl` 生成 `Service.cs`，`order-events.fdl` 生成 `OrderEvents.cs`，`123-schema.fdl` 生成 `Schema123Schema.cs`。

### 类型生成

消息会生成带有 C# 属性和字节辅助方法的 `[ForyStruct]` 类：

```csharp
[ForyStruct]
public sealed partial class Person
{
    public string Name { get; set; } = string.Empty;
    public int Id { get; set; }
    public List<Person.PhoneNumber> Phones { get; set; } = new();
    public Animal Pet { get; set; } = null!;

    public byte[] ToBytes() { ... }
    public static Person FromBytes(byte[] data) { ... }
}
```

联合类型会生成 `[ForyUnion]` 代数数据类型（ADT）。`Unknown(UnknownCase)` 是由 Fory 提供、使用 `[ForyUnknownCase]` 标记的前向兼容载体。该标记只用于选择载体，不会向 Schema case 表添加条目。Schema 定义的 case 使用非负 `[ForyCase]` ID。如果某个 case 需要非默认 Schema 编码，生成的 `[ForyCase]` 会携带 `Type`。已知 case 的记录名使用 PascalCase FDL case 名称；必要时载荷类型会以限定引用形式生成，以避免名称冲突。类型化联合必须至少包含一个非 `Unknown` case。

```csharp
[ForyUnion]
public abstract partial record Animal
{
    private Animal() {}

    [ForyUnknownCase]
    public sealed partial record Unknown(UnknownCase Value) : Animal;

    [ForyCase(0)]
    public sealed partial record Dog(global::addressbook.Dog Value) : Animal;

    [ForyCase(1)]
    public sealed partial record Cat(global::addressbook.Cat Value) : Animal;
}
```

### 模块安装

每个 Schema 都会生成一个模块类，该类先安装导入的模块，再注册本地 Schema 类型：

```csharp
public static class AddressbookForyModule
{
    public static void Install(Fory fory)
    {
        fory.Register<addressbook.Animal>((uint)106);
        fory.Register<addressbook.Person>((uint)100);
        // ...
    }
}
```

C# 模型文件的基础名和模块类都使用规范化后的源文件主文件名。它们不使用 `csharp_namespace`，也不使用 gRPC 服务名。例如，`service.fdl` 生成 `Service.cs` 和 `ServiceForyModule`，而 `order-events.fdl` 生成 `OrderEvents.cs` 和 `OrderEventsForyModule`。名为 `Greeter` 的 gRPC 服务会生成服务伴生文件 `GreeterGrpc.cs`，但不会改变 Schema 模块名称。要获得 `GreeterForyModule`，请将 Schema 文件命名为 `greeter.fdl` 或 `Greeter.fdl`。

此源文件命名规则允许多个 Schema 面向同一 C# 命名空间而不会发生冲突。生成器不会创建根据命名空间或服务派生的模块别名。

未提供显式类型 ID 时，生成的安装代码使用计算得到的数字 ID（与其他目标语言的行为一致）。

### gRPC 服务伴生代码

当 Schema 包含服务且编译器使用 `--grpc` 运行时，C# 生成器会在 Schema 模型文件旁为每个服务生成一个 `<ServiceName>Grpc.cs` 文件。

```csharp
public static partial class AddressBookService
{
    public abstract partial class AddressBookServiceBase
    {
        public virtual Task<AddressBook> Lookup(
            Person request,
            grpc::ServerCallContext context) { ... }
    }

    public partial class AddressBookServiceClient
        : grpc::ClientBase<AddressBookServiceClient>
    {
        public virtual AddressBook Lookup(Person request, grpc::CallOptions options) { ... }
        public virtual grpc::AsyncUnaryCall<AddressBook> LookupAsync(
            Person request,
            grpc::CallOptions options) { ... }
    }

    public static grpc::ServerServiceDefinition BindService(
        AddressBookServiceBase serviceImpl) { ... }

    public static void BindService(
        grpc::ServiceBinderBase serviceBinder,
        AddressBookServiceBase? serviceImpl) { ... }
}
```

每个生成的方法描述符都使用由 Fory 支持的静态 `Grpc.Core.Marshaller<T>`，并复用 Schema 模块的 `ThreadSafeFory`。反序列化通过 `PayloadAsReadOnlySequence()` 读取 gRPC 消息体，并拒绝单个 Fory 帧之后的尾随字节。生成的服务伴生代码不使用 protobuf 解析器，也不会为每次 RPC 调用创建 Fory 实例。

流式 RPC 映射到标准 gRPC C# API：

| IDL 形态                                  | 服务端方法                                                                    | 客户端方法                                  |
| ----------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------- |
| `rpc A (Req) returns (Res)`               | `Task<Res> A(Req request, ServerCallContext context)`                         | `A(...)` 和 `AAsync(...)`                   |
| `rpc A (Req) returns (stream Res)`        | `Task A(Req request, IServerStreamWriter<Res> responseStream, ...)`           | `AsyncServerStreamingCall<Res> A(...)`      |
| `rpc A (stream Req) returns (Res)`        | `Task<Res> A(IAsyncStreamReader<Req> requestStream, ...)`                     | `AsyncClientStreamingCall<Req, Res> A(...)` |
| `rpc A (stream Req) returns (stream Res)` | `Task A(IAsyncStreamReader<Req> requestStream, IServerStreamWriter<Res> ...)` | `AsyncDuplexStreamingCall<Req, Res> A(...)` |

编译生成 C# 服务文件的应用必须提供 `Grpc.Core.Api`，以及选用的 .NET gRPC 托管或客户端包，例如 `Grpc.AspNetCore` 或 `Grpc.Net.Client`。`Apache.Fory` 包不会将 gRPC 依赖作为硬依赖添加。

## JavaScript/TypeScript

### 输出布局

每个 Schema 会生成一个 JavaScript/TypeScript `.ts` 文件，例如：

- `<javascript_out>/addressbook.ts`

当 Schema 包含服务时，JavaScript 还可以生成服务伴生文件：

- 使用 `--grpc` 时生成 `<javascript_out>/addressbook_grpc.ts`
- 使用 `--grpc-web` 时生成 `<javascript_out>/addressbook_grpc_web.ts`

### 类型生成

消息会生成字段名采用 camelCase 的 `export interface` 声明：

```typescript
export interface Person {
  name: string;
  id: number;
  phones: PhoneNumber[];
  pet?: Animal | null;
}
```

枚举会生成 `export enum` 声明：

```typescript
export enum PhoneType {
  MOBILE = 0,
  HOME = 1,
  WORK = 2,
}
```

联合类型会生成带有 case 枚举的可辨识联合：

```typescript
export enum AnimalCase {
  DOG = 1,
  CAT = 2,
}

export type Animal =
  { case: AnimalCase.DOG; value: Dog } | { case: AnimalCase.CAT; value: Cat };
```

### Schema 辅助方法

每个生成的模型文件都会导出用于自定义 `Fory` 实例的注册辅助方法和根类型序列化辅助方法。公开 API 如下：

```typescript
import type Fory, { Serializer } from "@apache-fory/core";

export function registerAddressbookTypes(fory: Fory): {
  person: {
    serialize: (value: Person | null) => Uint8Array;
    deserialize: (bytes: Uint8Array) => Person;
    serializer: Serializer;
  };
};
export const serializePerson: (value: Person | null) => Uint8Array;
export const deserializePerson: (bytes: Uint8Array) => Person;
```

导入的 Schema 模块会由 `registerXxxTypes(fory)` 自动注册。对于生成的默认序列化路径，请使用 `serializeX` 和 `deserializeX`。当应用自行管理 `Fory` 实例时，请调用 `registerXxxTypes(fory)`。生成的 gRPC 伴生代码会自动导入这些辅助方法。

### gRPC 服务伴生代码

当 Schema 包含服务且编译器使用 `--grpc` 运行时，JavaScript 生成器会生成名为 `<module>_grpc.ts` 的 Node.js 伴生文件。该文件包含服务描述符、处理器接口、客户端类以及适用于 `@grpc/grpc-js` 的服务端注册辅助方法。

```typescript
export interface GreeterHandlers extends grpc.UntypedServiceImplementation {
  sayHello: grpc.handleUnaryCall<HelloRequest, HelloReply>;
}

export function addGreeterService(
  server: grpc.Server,
  handlers: GreeterHandlers,
): void { ... }

export class GreeterClient extends grpc.Client { ... }
```

编译器使用 `--grpc-web` 运行时，JavaScript 生成器会生成名为 `<module>_grpc_web.ts` 的浏览器伴生文件。该文件包含适用于 `grpc-web` 的回调客户端；包含一元 RPC 的服务还会获得 Promise 客户端：

```typescript
export class GreeterWebClient { ... }

export class GreeterWebPromiseClient { ... }
```

Node.js 服务伴生代码会导入 `@grpc/grpc-js`；浏览器伴生代码会导入 `grpc-web`。请将相应包添加到编译或运行生成文件的应用中。

## Swift

### 输出布局

每个 Schema 会生成一个 Swift `.swift` 文件，例如：

- `<swift_out>/addressbook/addressbook.swift`

### 类型生成

生成器使用拆分的模型宏和稳定的字段/case ID 创建 Swift 模型。类型化联合必须包含 `@ForyUnknownCase case unknown(UnknownCase)` 以及至少一个非 `unknown` case；`unknown(UnknownCase)` 只是由 Fory 提供的前向兼容载体。该标记只用于选择载体，不会向 Schema case 表添加条目。

当包/命名空间非空时，命名空间的组织形式由 `swift_namespace_style` 控制：

- `enum`（默认）：使用嵌套枚举作为命名空间包装器。
- `flatten`：为顶层类型名称添加根据包名派生的前缀（例如 `Demo_Foo_User`）。

当包/命名空间为空时，不应用枚举包装器或扁平化前缀。

对于采用默认 `enum` 风格的非空包：

```swift
public enum Addressbook {
    @ForyUnion
    public enum Animal {
        @ForyUnknownCase
        case unknown(UnknownCase)
        @ForyCase(id: 0)
        case dog(Addressbook.Dog)
        @ForyCase(id: 1)
        case cat(Addressbook.Cat)
    }

    @ForyStruct
    public struct Person: Equatable {
        @ForyField(id: 1)
        public var name: String = ""
        @ForyField(id: 8)
        public var pet: Addressbook.Animal =
            Addressbook.Animal.dog(Addressbook.Dog())
    }
}
```

对于采用 `flatten` 风格的非空包：

```swift
@ForyStruct
public struct Addressbook_Person: Equatable { ... }
```

同时设置二者时，CLI 标志 `--swift_namespace_style` 会覆盖 Schema 选项 `swift_namespace_style`。

联合类型会生成为带有关联载荷值的标签 Swift 枚举。递归联合类型会生成为 `indirect` 枚举。第一个已知联合 case 必须具有有限且可递归构造的默认值；如果第一个 case 的默认值存在循环，编译器会拒绝该 Schema，而不是生成无法终止的初始化器。带有 `ref`/`weak_ref` 字段的消息会生成为 `final class` 模型，以保留引用语义。对于直接存储的消息循环，必须将循环上的至少一条边标记为 `ref`；否则编译器会拒绝该 Schema，因为 Swift 值类型无法表示这种循环。列表/映射字段中的定长或带标签整数编码会生成为 Swift 字段类型提示，例如 `@ListField(element: .encoding(.fixed))` 或 `@MapField(value: .encoding(.tagged))`。对于非空的定长整数列表元素，Swift 会将该字段归类为相应的 Fory 基元紧凑数组类型；定长整数集合仍然使用 Fory 集合。

### 模块安装

每个 Schema 都包含一个负责传递安装导入模块的 `ForyModule` 所有者：

```swift
public enum ForyModule {
    public static func install(_ fory: Fory) throws {
        try ComplexPb.ForyModule.install(fory)
        try fory.register(Addressbook.Person.self, id: 100)
        try fory.register(Addressbook.Animal.self, id: 106)
    }
}
```

对于采用 `flatten` 风格的非空包，辅助类型也会添加前缀（例如 `Addressbook_ForyModule`）。

对于没有显式 `[id=...]` 的 Schema，安装代码使用计算得到的数字 ID。如果设置了 `option enable_auto_type_id = false;`，生成代码会使用基于名称的注册 API。

## Dart

### 输出布局

每个 Schema 会生成两个 Dart 文件：一个包含注解类型和 IDL 模块所有者的主 `.dart` 文件，以及一个包含生成序列化器和元数据的 `.fory.dart` part 文件。

- `<dart_out>/package/package.dart`
- `<dart_out>/package/package.fory.dart`

### 类型生成

消息会生成带有 `@ForyStruct` 注解的 `final class` 声明，每个字段都带有 `@ForyField`：

```dart
@ForyStruct()
final class Person {
  Person();

  @ForyField(id: 1)
  String name = '';

  @ForyField(id: 2, type: Int32Type())
  int id = 0;

  @ForyField(id: 7)
  List<Person_PhoneNumber> phones = <Person_PhoneNumber>[];

  @ForyField(id: 8)
  Animal pet = Animal._empty();
}
```

枚举会生成带有 `rawValue` getter 和 `fromRawValue` 工厂方法的 Dart `enum` 声明：

```dart
enum Person_PhoneType {
  mobile,
  home,
  work;

  int get rawValue => switch (this) {
    Person_PhoneType.mobile => 0,
    Person_PhoneType.home => 1,
    Person_PhoneType.work => 2,
  };

  static Person_PhoneType fromRawValue(int value) => switch (value) {
    0 => Person_PhoneType.mobile,
    1 => Person_PhoneType.home,
    2 => Person_PhoneType.work,
    _ => throw StateError('Unknown Person_PhoneType raw value $value.'),
  };
}
```

联合类型会生成带有 `@ForyUnion` 注解的类，其中包含工厂构造函数、case 枚举和自定义序列化器：

```dart
enum AnimalCase {
  dog,
  cat;

  int get id => switch (this) {
    AnimalCase.dog => 1,
    AnimalCase.cat => 2,
  };
}

@ForyUnion()
final class Animal {
  final AnimalCase _case;
  final Object? _value;

  const Animal._(this._case, this._value);

  factory Animal.dog(Dog value) => Animal._(AnimalCase.dog, value);
  factory Animal.cat(Cat value) => Animal._(AnimalCase.cat, value);

  bool get isDog => _case == AnimalCase.dog;
  Dog get dogValue => _value as Dog;
  // ...
}
```

嵌套类型使用扁平下划线命名（例如 `Person_PhoneNumber`、`Person_PhoneType`）。

`list<T>` 字段生成有序集合载体并使用 Fory 列表协议。`array<T>` 字段生成密集的一维布尔或数值载体，并使用专用的密集数组协议。生成代码不能只因为某种语言拥有优化的类列表载体就选择 `array<T>`；Schema 类型由 IDL 决定。

| IDL Schema          | Dart 生成载体          | 说明                                       |
| ------------------- | ---------------------- | ------------------------------------------ |
| `list<int32>`       | `List<int>`            | 列表协议，varint 元素编码                   |
| `list<fixed int32>` | `List<int>`            | 列表协议，定长元素段                       |
| `array<bool>`       | `BoolList`             | 每个布尔值一个字节                         |
| `array<int8>`       | `Int8List`             | 密集有符号字节                             |
| `array<int16>`      | `Int16List`            | 密集小端序 int16                           |
| `array<int32>`      | `Int32List`            | 密集小端序 int32                           |
| `array<int64>`      | `Int64List`            | 密集小端序 int64                           |
| `array<uint8>`      | `Uint8List`            | 密集无符号字节                             |
| `array<uint16>`     | `Uint16List`           | 密集小端序 uint16                          |
| `array<uint32>`     | `Uint32List`           | 密集小端序 uint32                          |
| `array<uint64>`     | `Uint64List`           | 密集小端序 uint64                          |
| `array<float16>`    | `Float16List`          | 密集 binary16 存储                         |
| `array<bfloat16>`   | `Bfloat16List`         | 密集 bfloat16 存储                         |
| `array<float32>`    | `Float32List`          | 密集小端序 float32                         |
| `array<float64>`    | `Float64List`          | 密集小端序 float64                         |

使用 `ArrayType(element: BoolType())` 的生成 Dart 字段必须使用 `BoolList`；普通 `List<bool>` 仍是 `list<bool>` 的生成及手写载体。

列表元素或映射值的引用跟踪使用容器语法糖注解：

```dart
@ListField(element: DeclaredType(ref: true))
@ForyField(id: 3)
List<Node> children = <Node>[];

@MapField(value: DeclaredType(ref: true))
@ForyField(id: 2)
Map<String, Node> byName = <String, Node>{};
```

### 模块安装

每个生成的 Dart IDL 库都包含一个根据输入文件命名的模块所有者，例如 `addressbook.dart` 对应 `AddressbookForyModule`。该模块先安装导入的模块，再使用默认 IDL 标识注册每个本地 Schema 类型：

```dart
abstract final class AddressbookForyModule {
  static void install(Fory fory) {
    complex_pb.ComplexPbForyModule.install(fory);
    _registerType(fory, Person);
    _registerType(fory, Dog);
  }

  static Fory getFory() { ... }

  static void _registerType(Fory fory, Type type) {
    if (type == Person) {
      registerGeneratedStruct(fory, _personForySchema, id: 100, namespace: null, typeName: null);
      return;
    }
    // ... other types
  }
}
```

### 使用示例

```dart
import 'package:fory/fory.dart';
import 'generated/addressbook/addressbook.dart';

void main() {
  final fory = Fory();
  AddressbookForyModule.install(fory);

  final person = Person()
    ..name = 'Alice'
    ..id = 1;

  final bytes = fory.serialize(person);
  final roundTrip = fory.deserialize<Person>(bytes);
}
```

### gRPC 服务伴生代码

当 Schema 包含服务且编译器使用 `--grpc` 运行时，Dart 生成器会在模型类型旁为每个 Schema 生成一个 `<module>_grpc.dart` 文件。该文件面向 `package:grpc`。请求和响应序列化使用伴生代码自动获取的 Fory 运行时，该运行时会在首次使用时注册 Schema 类型，因此无需手动注册；应用也可以选择在首次调用前通过 Schema 模块的 `install(...)` 注入自定义 `Fory`。

生成器支持全部四种 RPC 模式：一元、服务端流式、客户端流式和双向流式。客户端类继承 `Client`；服务基类继承 `Service`，并使用 `$addMethod` 自行注册每个方法。

```dart
class GreeterClient extends Client {
  // Single response: ResponseFuture. Streaming response: ResponseStream.
  ResponseFuture<HelloReply> sayHello(HelloRequest request, {CallOptions? options}) { ... }
  ResponseStream<HelloReply> sayHellos(HelloRequest request, {CallOptions? options}) { ... }
  ResponseFuture<HelloReply> collectHellos(Stream<HelloRequest> request, {CallOptions? options}) { ... }
  ResponseStream<HelloReply> chatHellos(Stream<HelloRequest> request, {CallOptions? options}) { ... }
}

abstract class GreeterServiceBase extends Service {
  Future<HelloReply> sayHello(ServiceCall call, HelloRequest request);
  Stream<HelloReply> sayHellos(ServiceCall call, HelloRequest request);
  Future<HelloReply> collectHellos(ServiceCall call, Stream<HelloRequest> request);
  Stream<HelloReply> chatHellos(ServiceCall call, Stream<HelloRequest> request);
}
```

单响应客户端方法返回 `ResponseFuture<R>`（客户端流式调用使用 `.single` 适配流式调用）；流式响应方法返回 `ResponseStream<R>`。在服务端，实现会覆盖抽象方法：单个请求以 `Q` 形式接收，客户端流式请求以 `Stream<Q>` 形式接收；单响应返回 `Future`，流式响应返回 `Stream`。编译这些文件的应用必须提供 `grpc` 依赖；Fory Dart 运行时不会添加该依赖。gRPC 路径使用原始 IDL 方法名。

## Kotlin

Kotlin 目标仅生成 Kotlin 源代码。编译器不会生成 Java 文件。

### 输出布局

对于带有 `package addressbook` 的源文件 `addressbook.fdl`，Kotlin 输出生成在：

- `<kotlin_out>/addressbook/`
- 类型文件：`AddressBook.kt`、`Person.kt`、`Dog.kt`、`Cat.kt`、`Animal.kt`
- Schema 模块：`AddressbookForyModule.kt`

Schema 模块名称取自源文件的主文件名。同一 Kotlin 包中的 Schema 必须生成不同的文件名；写入文件前，编译器会拒绝重复的 Kotlin 生成文件路径。

如果存在 `option kotlin_package = "...";`，输出路径和 Kotlin 包会使用该选项；否则 Kotlin 使用 FDL 包。Kotlin 导入图不能混用默认包 Schema 与具名 Kotlin 包。注册仍使用 FDL 包，以保持跨语言类型名称稳定。

### 类型生成

消息默认生成 Kotlin `data class` 声明：

```kotlin
@ForyStruct
public data class Person(
  @field:ForyField(id = 1)
  public val name: String,

  @field:ForyField(id = 7)
  public val phones: List<PersonPhoneNumber>,

  @field:ForyField(id = 8)
  public val pet: Animal,
) {
  public fun toBytes(): ByteArray = AddressbookForyModule.getFory().serialize(this)

  public companion object {
    public fun fromBytes(bytes: ByteArray): Person =
      AddressbookForyModule.getFory().deserialize(bytes, Person::class.java)
  }
}
```

对于编译器检测到参与构造循环的消息，生成器会生成普通可变类，使生成的序列化器可以在读取反向引用前发布该实例：

```kotlin
@ForyStruct
public class Node() {
  @ForyField(id = 1)
  public var id: String = ""

  @Ref
  @ForyField(id = 2)
  public var parent: Node? = null
}
```

生成的 Kotlin IDL 源代码使用 Kotlin `?` 表示可空性，而不是 Fory `@Nullable`；这也适用于因编译器检测到构造循环而生成的可变类。

枚举会生成带有稳定 Fory 枚举 ID 的 Kotlin 枚举类。联合类型会生成带有 `@ForyUnion` 的密封类；由 Fory 提供的 `Unknown(UnknownCase)` 载体使用 `@ForyUnknownCase` 标记。该标记只用于选择载体，不会向 Schema case 表添加条目。Schema 定义的 case 可以使用 `0..N` 的 case ID，并持有单个 `value` 属性。类型化联合必须至少包含一个非 `Unknown` case。

```kotlin
package addressbook

import org.apache.fory.annotation.ForyCase
import org.apache.fory.annotation.ForyUnion
import org.apache.fory.annotation.ForyUnknownCase
import org.apache.fory.type.union.UnknownCase

@ForyUnion
public sealed class Animal {
  @ForyUnknownCase
  public data class Unknown(public val value: UnknownCase) : Animal()

  @ForyCase(id = 0)
  public data class Dog(public val value: addressbook.Dog) : Animal()
}
```

当 Schema case 名称和载荷类型具有相同的简单名称时，带包的 Kotlin 输出会保留 Schema case 名称，并限定载荷类型。如果某种目标输出模式无法为冲突表达合法限定名，编译器会在生成的 case 类名称后添加 `Case`。

Kotlin `int32`、`int64`、`uint32` 和 `uint64` 字段默认使用 xlang varint 编码，因此生成的 Kotlin 在默认情况下不会生成 `@VarInt`。只有 Schema 请求非默认编码时，才会生成 `@Fixed` 或 `@Tagged`。`duration` 映射为 `kotlin.time.Duration`，编码时会拒绝无限时长。密集 `array<float16>` 和 `array<bfloat16>` 使用 Java 核心的 `Float16Array` 和 `BFloat16Array` 载体。生成的 Kotlin IDL 对 `array<int8>` 使用 `@ArrayType ByteArray`，包括嵌套位置。

### Schema 模块

生成的 Schema 模块会注册 Schema 类型，并根据目标类名解析 KSP 生成的序列化器。包所持有的辅助 Fory 实例使用 `ForyKotlin.builder().withXlang(true)` 并安装 Schema 模块，因此消息的 `toBytes`/`fromBytes` 辅助方法无需调用方管理 Fory 配置即可工作。对于 `addressbook.fdl`：

```kotlin
public object AddressbookForyModule : ForyModule {
  private val fory: ThreadSafeFory by lazy {
    ForyKotlin.builder()
      .withXlang(true)
      .withRefTracking(true)
      .withModule(this)
      .buildThreadSafeFory()
  }

  internal fun getFory(): ThreadSafeFory = fory

  override fun install(fory: Fory) {
    KotlinSerializers.registerType(fory, Person::class.java, 100L)
    KotlinSerializers.registerSerializer(fory, Person::class.java)
    KotlinSerializers.registerUnion(fory, Animal::class.java, 106L)
  }
}
```

`registerUnion` 会查找生成的 `<Target>_ForySerializer`；调用方无需传入序列化器实例。

### gRPC 服务伴生代码

当 Schema 包含服务且编译器使用 `--grpc` 运行时，Kotlin 生成器会在模型类型旁为每个服务生成一个 `<ServiceName>GrpcKt.kt` 文件。该文件包含 grpc-kotlin 协程伴生对象，而不是 Java `*Grpc.java` 源代码。

```kotlin
public object AddressBookServiceGrpcKt {
  public const val SERVICE_NAME: String = "addressbook.AddressBookService"

  @JvmStatic
  public val serviceDescriptor: io.grpc.ServiceDescriptor
    get() = serviceDescriptorValue

  @JvmStatic
  public val lookupMethod: io.grpc.MethodDescriptor<Person, AddressBook>
    get() = lookupMethodValue

  public abstract class AddressBookServiceCoroutineImplBase(
    coroutineContext: kotlin.coroutines.CoroutineContext =
      kotlin.coroutines.EmptyCoroutineContext,
  ) : io.grpc.kotlin.AbstractCoroutineServerImpl(coroutineContext) {
    public open suspend fun lookup(request: Person): AddressBook =
      throw io.grpc.StatusException(
        io.grpc.Status.UNIMPLEMENTED.withDescription(
          "Method addressbook.AddressBookService/Lookup is unimplemented",
        ),
      )
  }

  public class AddressBookServiceCoroutineStub @JvmOverloads constructor(
    channel: io.grpc.Channel,
    callOptions: io.grpc.CallOptions = io.grpc.CallOptions.DEFAULT,
  ) : io.grpc.kotlin.AbstractCoroutineStub<AddressBookServiceCoroutineStub>(
    channel,
    callOptions,
  ) {
    public suspend fun lookup(
      request: Person,
      headers: io.grpc.Metadata = io.grpc.Metadata(),
    ): AddressBook =
      io.grpc.kotlin.ClientCalls.unaryRpc(
        channel,
        lookupMethod,
        request,
        callOptions,
        headers,
      )
  }
}
```

流式 RPC 使用 `kotlinx.coroutines.flow.Flow`：

| IDL 形态                                  | 服务端方法                                | 客户端方法                                |
| ----------------------------------------- | ----------------------------------------- | ----------------------------------------- |
| `rpc A (Req) returns (Res)`               | `suspend fun a(request: Req): Res`        | `suspend fun a(request: Req): Res`        |
| `rpc A (Req) returns (stream Res)`        | `fun a(request: Req): Flow<Res>`          | `fun a(request: Req): Flow<Res>`          |
| `rpc A (stream Req) returns (Res)`        | `suspend fun a(requests: Flow<Req>): Res` | `suspend fun a(requests: Flow<Req>): Res` |
| `rpc A (stream Req) returns (stream Res)` | `fun a(requests: Flow<Req>): Flow<Res>`   | `fun a(requests: Flow<Req>): Flow<Res>`   |

每个方法描述符都使用由 Fory 支持的 `io.grpc.MethodDescriptor.Marshaller`，并复用生成 Schema 模块的 `ThreadSafeFory`。生成的服务伴生代码不会调用 protobuf 解析器，不会公开 KSP 序列化器类名，也不会为每次调用创建 Fory 实例。

编译生成 Kotlin 服务文件的应用必须提供 grpc-java、grpc-kotlin 和 `kotlinx-coroutines-core` 依赖。Fory Kotlin 构件不会将这些 gRPC 依赖作为硬依赖添加。

## Scala

Scala 目标仅生成 Scala 3 源代码。`fory-scala` 构件仍支持 Scala 2.13 和 Scala 3，但生成的 IDL 源代码和宏派生需要 Scala 3。

### 输出布局

对于 `package addressbook`，Scala 输出生成在：

- `<scala_out>/addressbook/`
- 类型文件：`AddressBook.scala`、`Person.scala`、`Dog.scala`、`Cat.scala`、`Animal.scala`
- Schema 模块：`AddressbookForyModule.scala`

对于没有 Scala 包的 Schema，Schema 模块名称取自源文件的主文件名。例如，`main.fdl` 会生成 `MainForyModule.scala`。Scala 导入图不能混用默认包 Schema 与具名 Scala 包。

### 类型生成

不在编译器检测到的构造循环中的消息会生成 case 类：

```scala
import org.apache.fory.annotation.{ForyField, ForyStruct}
import org.apache.fory.scala.ForySerializer

@ForyStruct
final case class Person(
  @ForyField(id = 1) name: String,
  @ForyField(id = 3) email: Option[String],
  @ForyField(id = 7) phones: List[Person.PhoneNumber],
  @ForyField(id = 8) pet: Animal
) derives ForySerializer {
  def toBytes(): Array[Byte] =
    AddressbookForyModule.getFory.serialize(this)
}

object Person {
  def fromBytes(bytes: Array[Byte]): Person =
    AddressbookForyModule.getFory.deserialize(bytes).asInstanceOf[Person]
}
```

处于循环构造周期中的消息会生成带有可变序列化字段的普通类，使读取过程可以在读取反向引用前注册对象：

```scala
import org.apache.fory.annotation.{ForyField, ForyStruct, Ref}
import org.apache.fory.scala.ForySerializer

@ForyStruct
final class Node() derives ForySerializer {
  @ForyField(id = 1)
  var id: String = ""

  @Ref
  @ForyField(id = 2)
  var parent: Option[Node] = None
}
```

枚举会生成带有稳定 Fory ID 的 Scala 3 枚举：

```scala
import org.apache.fory.annotation.ForyEnumId

enum PhoneType {
  @ForyEnumId(0)
  case Mobile

  @ForyEnumId(1)
  case Home

  @ForyEnumId(2)
  case Work
}
```

联合类型会生成 Scala 3 代数数据类型（ADT）枚举。`Unknown(UnknownCase)` 是由 Fory 提供、使用 `@ForyUnknownCase` 标记的前向兼容载体。该标记只用于选择载体，不会添加 Schema 条目，因此该载体不在 Schema case 表中。Schema 定义的 case 使用非负 `@ForyCase` ID。类型化联合必须至少包含一个非 `Unknown` case。

```scala
package addressbook

import org.apache.fory.annotation.{ForyCase, ForyUnion, ForyUnknownCase}
import org.apache.fory.scala.ForySerializer
import org.apache.fory.`type`.union.UnknownCase

@ForyUnion
enum Animal derives ForySerializer {
  @ForyUnknownCase
  case Unknown(value: UnknownCase)

  @ForyCase(id = 0)
  case Dog(value: _root_.addressbook.Dog)

  @ForyCase(id = 1)
  case Cat(value: _root_.addressbook.Cat)
}
```

当 Schema case 名称和载荷类型具有相同的简单名称时，带包的 Scala 输出会保留 Schema case 名称，并限定载荷类型。如果某种目标输出模式无法为冲突表达合法限定名，编译器会在生成的 case 名称后添加 `Case`。

`optional T` 字段会生成 `Option[T]`。顶层消息引用在字段或构造函数参数上使用 `@Ref`。嵌套元素/值引用使用 `List[Node @Ref]` 这类类型使用注解。

### Schema 模块

生成的 Schema 模块会注册 Schema 序列化器、枚举、结构体和联合类型。包所持有的辅助 Fory 实例使用 `ForyScala.builder().withXlang(true)` 并安装 Schema 模块，因此消息的 `toBytes`/`fromBytes` 辅助方法无需调用方管理 Fory 配置即可工作：

```scala
object AddressbookForyModule extends org.apache.fory.ForyModule {
  private lazy val fory: ThreadSafeFory =
    ForyScala.builder()
      .withXlang(true)
      .withRefTracking(true)
      .withModule(this)
      .buildThreadSafeFory()

  private[addressbook] def getFory: ThreadSafeFory = fory

  override def install(fory: Fory): Unit = {
    ScalaSerializers.registerEnum(fory, classOf[Person.PhoneType], 101L)
    ForySerializer.register(fory, classOf[Person.PhoneNumber], 102L)
    ForySerializer.register(fory, classOf[Person], 100L)
    ForySerializer.register(fory, classOf[Animal], 106L)
  }
}
```

### gRPC 服务伴生代码

当 Schema 包含服务且编译器使用 `--grpc` 运行时，Scala 生成器会为每个本地服务定义生成一个 `<ServiceName>Grpc.scala` 伴生文件。该文件与生成的模型和 Schema 模块位于同一个 Scala 包中。

对于如下服务：

```protobuf
service AddressBookService {
  rpc Lookup (Person) returns (AddressBook);
  rpc Watch (Person) returns (stream AddressBook);
  rpc Upload (stream Person) returns (AddressBook);
  rpc Chat (stream Person) returns (stream AddressBook);
}
```

生成的伴生文件包含：

- `SERVICE_NAME` 和 grpc-java 方法描述符
- 用于服务端实现的 `AddressBookServiceImplBase`
- 用于客户端调用的 `AddressBookServiceClient`
- 由 Fory 支持、用于请求和响应载荷的 grpc-java marshaller

生成的 Scala 客户端为每个方法保留 grpc-java API，同时为能够通过直接 Scala 句柄保留所需生命周期控制的 RPC 形态添加符合 Scala 习惯的便捷方法：

| RPC 形态                                                | Scala 便捷方法                       | grpc-java 风格方法                               |
| ------------------------------------------------------- | ----------------------------------- | ------------------------------------------------ |
| `rpc Lookup (Person) returns (AddressBook)`             | `lookup(request): RpcFuture[Resp]`  | 异步观察者、阻塞调用和 `ListenableFuture`         |
| `rpc Watch (Person) returns (stream AddressBook)`       | `watch(request): RpcIterator[Resp]` | 异步观察者和阻塞迭代器                            |
| `rpc Upload (stream Person) returns (AddressBook)`      | 无                                  | 请求 `StreamObserver`                            |
| `rpc Chat (stream Person) returns (stream AddressBook)` | 无                                  | 请求和响应 `StreamObserver`                      |

一元客户端便捷方法返回 `org.apache.fory.scala.rpc.RpcFuture`：

```scala
val client = AddressBookServiceGrpc.newClient(channel)
val call = client.lookup(person)
call.asFuture.foreach(handleAddressBook)(scala.concurrent.ExecutionContext.global)
```

服务端流式客户端便捷方法返回 `org.apache.fory.scala.rpc.RpcIterator`：

```scala
val stream = client.watch(person)
try {
  while (stream.hasNext) {
    handleAddressBook(stream.next())
  }
} finally {
  stream.close()
}
```

如果客户端在消费完整个流之前停止，请关闭或取消 `RpcIterator`。生成的适配器会取消底层 gRPC 调用，避免服务端继续写入客户端不再读取的响应流。

客户端流式和双向流式方法使用 grpc-java `StreamObserver` API：

```scala
val requestStream = client.upload(
  new io.grpc.stub.StreamObserver[AddressBook] {
    override def onNext(value: AddressBook): Unit = handleAddressBook(value)
    override def onError(t: Throwable): Unit = handleError(t)
    override def onCompleted(): Unit = ()
  }
)
requestStream.onNext(person)
requestStream.onCompleted()
```

服务端实现与 grpc-java 对应。一元方法可以覆盖 Scala 生成的直接请求到响应方法，但流式方法需要覆盖基于观察者的方法，并按照 grpc-java 生命周期规则调用 `onNext`、`onError` 和 `onCompleted`。

编译生成 Scala gRPC 伴生文件的应用必须提供 grpc-java 依赖，例如 `grpc-api`、`grpc-stub`，以及 `grpc-netty-shaded` 这类传输实现。`fory-scala` 构件不会将 grpc-java 作为硬依赖添加。

## 跨语言说明

### 类型 ID 行为

- 显式 `[id=...]` 值会由生成的模块安装代码或注册辅助方法直接使用。
- 省略类型 ID 时，生成代码会使用计算得到的数字 ID（参见 `auto_id.*` 输出）。
- 如果设置了 `option enable_auto_type_id = false;`，生成的模块安装代码或注册辅助方法会使用基于名称的 API，而不是数字 ID。

### 嵌套类型形态

| 语言                  | 嵌套类型形式                   |
| --------------------- | ------------------------------ |
| Java                  | `Person.PhoneNumber`           |
| Python                | `Person.PhoneNumber`           |
| Rust                  | `person::PhoneNumber`          |
| C++                   | `Person::PhoneNumber`          |
| Go                    | `Person_PhoneNumber`（默认）   |
| C#                    | `Person.PhoneNumber`           |
| JavaScript/TypeScript | `Person.PhoneNumber`           |
| Swift                 | `Person.PhoneNumber`           |
| Dart                  | `Person_PhoneNumber`           |
| Kotlin                | `PersonPhoneNumber`            |
| Scala                 | `Person.PhoneNumber`           |

### 字节辅助方法命名

| 语言                  | 辅助方法                  |
| --------------------- | ------------------------- |
| Java                  | `toBytes` / `fromBytes`   |
| Kotlin                | `toBytes` / `fromBytes`   |
| Scala                 | `toBytes` / `fromBytes`   |
| Python                | `to_bytes` / `from_bytes` |
| Rust                  | `to_bytes` / `from_bytes` |
| C++                   | `to_bytes` / `from_bytes` |
| Go                    | `ToBytes` / `FromBytes`   |
| C#                    | `ToBytes` / `FromBytes`   |
| JavaScript/TypeScript | （通过 `fory.serialize()`）|
| Swift                 | `toBytes` / `fromBytes`   |
| Dart                  | （通过 `fory.serialize()`）|
