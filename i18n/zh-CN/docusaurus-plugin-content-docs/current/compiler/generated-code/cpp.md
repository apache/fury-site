---
title: C++
sidebar_position: 5
id: cpp
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

## 输出布局

C++ 输出为每个 Schema 文件生成一个头文件，例如：

- `<cpp_out>/addressbook.h`

## 类型生成

消息生成带类型化访问器和字节辅助方法的 `final` 类：

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
    static fory::Result<PhoneNumber, fory::Error> from_bytes(
        const uint8_t* data, std::size_t size);
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

可选消息字段生成 `has_xxx`、`mutable_xxx` 和 `clear_xxx` API：

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

联合生成 `std::variant` 包装器：

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

生成的头文件包含用于序列化元数据的 `FORY_UNION`、`FORY_ENUM` 和 `FORY_STRUCT` 宏。
字段和载荷配置嵌入生成的 `FORY_STRUCT`/`FORY_UNION` 条目中。

## 注册

生成的注册函数：

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

## 使用方式

```cpp
addressbook::Person person;
person.set_name("Alice");
*person.mutable_pet() = addressbook::Animal::dog(addressbook::Dog{});

auto bytes = person.to_bytes();
auto restored = addressbook::Person::from_bytes(bytes.value());
```

## gRPC 服务配套代码

使用 `--grpc` 时，C++ 会生成 `<stem>.service.h`、`<stem>.service.grpc.h` 和 `<stem>.service.grpc.cc`。API 头文件在 `::<namespace>::service` 下包含同步接口和路由常量；绑定头文件包含生成的 `grpc::SerializationTraits` 以及位于 `::<namespace>::service::grpc` 下的客户端和服务端包装器。构建和使用指南请参阅 [C++ gRPC](../../grpc/cpp.md)。
