---
title: Java
sidebar_position: 2
id: java
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

对于 `package addressbook`，Java 输出生成在：

- `<java_out>/addressbook/`
- 类型文件：`AddressBook.java`、`Person.java`、`Dog.java`、`Cat.java`、`Animal.java`
- Schema 模块：`AddressbookForyModule.java`

对于没有 Java 包的 Schema，Schema 模块名称从源文件主名（stem）派生，例如 `main.fdl`
生成 `MainForyModule.java`。Java 导入图不能混用默认包 Schema 和命名 Java 包。

## 类型生成

消息生成带 `@ForyField`、默认构造函数、getter/setter 和字节辅助方法的 Java 类：

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

带 `evolving=false` 的消息使用 Java 固定 Schema struct 编码生成。

联合生成扩展 `org.apache.fory.type.union.Union` 的类：

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

## Schema 模块

每个 JVM Schema 都会生成一个 `ForyModule`。导入的 Schema 模块通过
`fory.register(...)` 安装，因此共享导入由 Fory 实例去重。

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

对于没有显式 `[id=...]` 的 Schema，生成的注册代码使用计算得到的数字 ID（例如来自 `auto_id.fdl`）：

```java
resolver.register(Status.class, 1124725126L);
resolver.registerUnion(Wrapper.class, 1471345060L, new org.apache.fory.serializer.UnionSerializer(resolver, Wrapper.class));
resolver.register(Envelope.class, 3022445236L);
resolver.registerUnion(Envelope.Detail.class, 1609214087L, new org.apache.fory.serializer.UnionSerializer(resolver, Envelope.Detail.class));
resolver.register(Envelope.Payload.class, 2862577837L);
```

如果设置了 `option enable_auto_type_id = false;`，注册使用符号名称：

```java
resolver.register(Config.class, "myapp.models", "Config");
resolver.registerUnion(
    Holder.class,
    "myapp.models",
    "Holder",
    new org.apache.fory.serializer.UnionSerializer(resolver, Holder.class));
```

## 使用方式

```java
Person person = new Person();
person.setName("Alice");
person.setPet(Animal.ofDog(new Dog()));

byte[] data = person.toBytes();
Person restored = Person.fromBytes(data);
```

## gRPC 服务配套代码

使用 `--grpc` 时，Java 为每个服务生成一个 `<ServiceName>Grpc.java`。它公开 `SERVICE_NAME`、服务和方法描述符、`<ServiceName>ImplBase`，以及异步、阻塞和 future stub 工厂。依赖项以及服务端、客户端和流式用法请参阅 [Java gRPC](../../grpc/java.md)。
