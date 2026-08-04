---
title: 类型标识与动态字段
sidebar_position: 2
id: type-identity
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

字段类型元信息配置控制序列化结构体字段时是否写入类型信息。当实际具体类型可能不同于声明的字段类型时，这是支持多态的关键。

## 概述

序列化结构体字段时，Fory 需要确定是否写入类型元数据：

- **静态类型**：直接使用声明字段类型的序列化器（不写入类型信息）
- **动态类型**：写入类型信息以支持子类型

## 何时需要类型元信息

以下情况需要类型元数据：

1. **接口/抽象字段**：声明类型是抽象类型，因此必须记录具体类型
2. **多态字段**：具体类型可能是声明类型的子类
3. **跨语言兼容性**：接收端需要类型信息才能正确反序列化

以下情况不需要类型元数据：

1. **final/具体类型**：声明类型是 final/sealed，无法被继承
2. **原始类型**：类型在编译期已知
3. **性能优化**：确定具体类型始终与声明类型一致

## 各语言配置

### Java

Java 需要显式配置，因为具体类除非标记为 `final`，否则仍可被继承。

使用 `@ForyField` 注解的 `dynamic` 参数：

```java
import org.apache.fory.annotation.ForyField;
import org.apache.fory.annotation.ForyField.Dynamic;

public class Container {
    // AUTO (default): Interface types write type info, concrete types don't
    @ForyField(id = 0)
    private Shape shape;  // Interface - type info written

    // FALSE: Never write type info (use declared type's serializer)
    @ForyField(id = 1, dynamic = Dynamic.FALSE)
    private Circle circle;  // Always treated as Circle

    // TRUE: Always write type info (support subtypes)
    @ForyField(id = 2, dynamic = Dynamic.TRUE)
    private Shape concreteShape;  // Type info written even if concrete
}
```

**动态选项**：

| 值      | 行为                                     |
| ------- | ---------------------------------------- |
| `AUTO`  | 接口/抽象类型为动态类型，具体类型不是    |
| `FALSE` | 从不写入类型信息，使用声明类型的序列化器 |
| `TRUE`  | 始终写入类型信息以支持子类型             |

**使用场景**：

- `AUTO`：默认行为，适用于大多数场景
- `FALSE`：已知确切类型时用于性能优化
- `TRUE`：具体字段可能保存子类实例时使用

### C++

C++ 使用 `.dynamic(bool)` 构建器方法，并将其放在 `FORY_STRUCT` 中：

```cpp
#include "fory/serialization/fory.h"

// Abstract base class with pure virtual methods
struct Animal {
    virtual ~Animal() = default;
    virtual std::string speak() const = 0;
};

struct Zoo {
    // Auto: type info written because Animal is polymorphic (std::is_polymorphic)
    std::shared_ptr<Animal> animal;

    // Force non-dynamic: skip type info even though Animal is polymorphic
    std::shared_ptr<Animal> fixed_animal;

    // Force dynamic: write type info even for non-polymorphic types
    std::shared_ptr<Data> polymorphic_data;
};
FORY_STRUCT(Zoo,
    (animal, fory::F(0).nullable()),                    // Auto-detect polymorphism
    (fixed_animal, fory::F(1).nullable().dynamic(false)), // Skip type info
    (polymorphic_data, fory::F(2).dynamic(true))        // Force type info
);
```

**默认行为**：Fory 通过 `std::is_polymorphic<T>` 自动检测多态。带纯虚方法的类型默认视为动态类型。

### Go 和 Rust

Go 和 Rust **不需要**显式动态配置，因为：

- **Go**：接口类型本身就是动态类型，Fory 可以根据类型判断它是否为接口
- **Rust**：特征对象（`dyn Trait`）在类型系统中有显式标记

这些语言的类型系统已经能够表明字段是否为多态字段：

```go
// Go: interface types are automatically dynamic
type Container struct {
    Shape  Shape       // Interface - type info written automatically
    Circle Circle      // Concrete struct - no type info needed
}
```

```rust
// Rust: trait objects are explicitly marked
struct Container {
    shape: Box<dyn Shape>,  // Trait object - type info written automatically
    circle: Circle,         // Concrete type - no type info needed
}
```

### Python

使用 `pyfory.field()` 的 `dynamic` 参数：

```python
from dataclasses import dataclass
from abc import ABC, abstractmethod
import pyfory

class Shape(ABC):
    @abstractmethod
    def area(self) -> float:
        pass

@dataclass
class Circle(Shape):
    radius: float = 0.0

    def area(self) -> float:
        return 3.14159 * self.radius * self.radius

@dataclass
class Container:
    # Abstract class: dynamic is always True (type info written)
    shape: Shape = pyfory.field(id=0)

    # Concrete type with explicit dynamic=True (force type info)
    circle: Circle = pyfory.field(id=1, dynamic=True)

    # Concrete type with explicit dynamic=False (skip type info)
    fixed_circle: Circle = pyfory.field(id=2, dynamic=False)
```

**默认行为**：

| 模式       | 抽象类 | 具体对象类型 | 数值/str/time 类型 |
| ---------- | ------ | ------------ | ------------------ |
| 原生模式   | `True` | `True`       | `False`            |
| 跨语言模式 | `True` | `False`      | `False`            |

- **抽象类**：`dynamic` 始终为 `True`（必须写入类型信息）
- **原生模式**：对象类型的 `dynamic` 默认为 `True`，数值/str/time 类型默认为 `False`
- **跨语言模式**：具体类型的 `dynamic` 默认为 `False`

## 默认行为

| 语言   | 接口/抽象类型     | 具体类型       |
| ------ | ----------------- | -------------- |
| Java   | 动态（写入类型）  | 静态（无类型） |
| C++    | 动态（virtual）   | 静态           |
| Go     | 动态（interface） | 静态（struct） |
| Rust   | 动态（dyn Trait） | 静态           |
| Python | 动态（所有对象）  | 动态           |

## 性能注意事项

写入类型元数据会产生开销：

- **空间**：类型信息会增加序列化输出的字节数
- **时间**：序列化和反序列化期间需要解析类型

以下情况使用 `dynamic = FALSE`（Java）或 `dynamic(false)`（C++）：

- 确定具体类型与声明类型一致
- 性能至关重要且不需要多态
- 字段类型实际上是 final

## 跨语言兼容性

为跨语言消费序列化数据时：

1. **使用一致的类型注册**：各语言使用相同的 ID 注册类型
2. **优先显式配置**：不确定接收端预期时使用 `dynamic = TRUE`
3. **记录多态字段**：明确说明哪些字段可能包含子类型

## 示例：多态容器

### Java

```java
public interface Animal {
    String speak();
}

public class Dog implements Animal {
    private String name;

    @Override
    public String speak() { return "Woof!"; }
}

public class Cat implements Animal {
    private String name;

    @Override
    public String speak() { return "Meow!"; }
}

public class Zoo {
    // Type info written because Animal is an interface
    @ForyField(id = 0)
    private Animal animal;

    // Force type info for concrete type that may hold subtypes
    @ForyField(id = 1, dynamic = Dynamic.TRUE)
    private Dog maybeMixedBreed;
}
```

### C++

```cpp
// Abstract base class with pure virtual methods
class Animal {
public:
    virtual std::string speak() const = 0;
    virtual ~Animal() = default;
};

class Dog : public Animal {
public:
    std::string name;
    std::string speak() const override { return "Woof!"; }
};

struct Zoo {
    std::shared_ptr<Animal> animal;
    std::shared_ptr<Dog> maybe_mixed_breed;
};

FORY_STRUCT(Zoo,
    (animal, fory::F(0).nullable()),              // Auto-detect (Animal is polymorphic)
    (maybe_mixed_breed, fory::F(1).dynamic(true)) // Force dynamic for concrete type
);
```

## 相关主题

- [字段可空性](nullability.md) - 控制字段的 null 处理
- [引用跟踪](references.md) - 管理共享引用和循环引用
- [类型映射](../../specification/xlang_type_mapping.md) - 跨语言类型兼容性

## 在对等端之间协调类型标识

每个对等端都必须使用相同的数字 ID，或相同的命名空间和类型名称注册自定义类型。数字 ID 生成的元数据更小；名称则更容易在独立部署的服务之间协调。不要在一个对等端使用 ID 注册，而在另一个对等端使用名称注册。

确切的注册 API 请参阅所选运行时指南：
[Java](../java/core-api.md#cross-language-interoperability)、[Python](../python/core-api.md#cross-language-interoperability)、
[C++](../cpp/core-api.md#cross-language-interoperability)、[Go](../go/core-api.md#cross-language-interoperability)、
[Rust](../rust/core-api.md#cross-language-interoperability)、[JavaScript](../javascript/core-api.md#cross-language-interoperability)、
[C#](../csharp/core-api.md#cross-language-interoperability)、[Swift](../swift/core-api.md#cross-language-interoperability)、
[Dart](../dart/core-api.md#cross-language-interoperability)、[Scala](../scala/core-api.md#cross-language-interoperability) 和
[Kotlin](../kotlin/core-api.md#cross-language-interoperability)。
