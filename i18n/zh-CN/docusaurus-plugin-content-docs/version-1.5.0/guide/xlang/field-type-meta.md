---
title: 字段类型元信息
sidebar_position: 46
id: field_type_meta
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

字段类型元信息配置用于控制结构体字段序列化时是否写入类型信息。当实际运行时类型可能不同于声明字段类型时，它是支持多态的关键。

## 概述

序列化结构体字段时，Fory 需要判断是否写入类型元信息：

- **静态类型**：直接使用声明字段类型的序列化器（不写入类型信息）
- **动态类型**：写入类型信息以支持运行时子类型

## 何时需要类型元信息

以下场景需要类型元信息：

1. **接口/抽象字段**：声明类型是抽象类型，因此必须记录具体类型
2. **多态字段**：运行时类型可能是声明类型的子类
3. **跨语言兼容性**：接收端需要类型信息才能正确反序列化

以下场景不需要类型元信息：

1. **final/具体类型**：声明类型是 final/sealed，不能被继承
2. **基本类型**：编译期已知类型
3. **性能优化**：明确知道运行时类型始终与声明类型一致

## 各语言配置

### Java

Java 需要显式配置，因为具体类只要没有标记为 `final` 就可能被继承。

使用带 `dynamic` 参数的 `@ForyField` 注解：

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

    // TRUE: Always write type info (support runtime subtypes)
    @ForyField(id = 2, dynamic = Dynamic.TRUE)
    private Shape concreteShape;  // Type info written even if concrete
}
```

**Dynamic 选项**：

| 值 | 行为 |
| ------- | ------------------------------------------------------ |
| `AUTO` | 接口/抽象类型为动态类型，具体类型不是 |
| `FALSE` | 不写入类型信息，使用声明类型的序列化器 |
| `TRUE` | 始终写入类型信息以支持运行时子类型 |

**使用场景**：

- `AUTO`：默认行为，适合大多数场景
- `FALSE`：明确知道精确类型时用于性能优化
- `TRUE`：具体字段可能持有子类实例时使用

### C++

C++ 使用 `fory::dynamic<V>` 模板标签或 `.dynamic(bool)` 构建方法：

**使用 `fory::field<>` 模板**：

```cpp
#include "fory/serialization/fory.h"

// Abstract base class with pure virtual methods
struct Animal {
    virtual ~Animal() = default;
    virtual std::string speak() const = 0;
};

struct Zoo {
    // Auto: type info written because Animal is polymorphic (std::is_polymorphic)
    fory::field<std::shared_ptr<Animal>, 0, fory::nullable> animal;

    // Force non-dynamic: skip type info even though Animal is polymorphic
    fory::field<std::shared_ptr<Animal>, 1, fory::nullable, fory::dynamic<false>> fixed_animal;

    // Force dynamic: write type info even for non-polymorphic types
    fory::field<std::shared_ptr<Data>, 2, fory::dynamic<true>> polymorphic_data;
};
FORY_STRUCT(Zoo, animal, fixed_animal, polymorphic_data);
```

**使用 `FORY_FIELD_CONFIG` 宏**：

```cpp
struct Zoo {
    std::shared_ptr<Animal> animal;
    std::shared_ptr<Animal> fixed_animal;
    std::shared_ptr<Data> polymorphic_data;
};

FORY_STRUCT(Zoo, animal, fixed_animal, polymorphic_data);

FORY_FIELD_CONFIG(Zoo,
    (animal, fory::F(0).nullable()),                    // Auto-detect polymorphism
    (fixed_animal, fory::F(1).nullable().dynamic(false)), // Skip type info
    (polymorphic_data, fory::F(2).dynamic(true))        // Force type info
);
```

**默认行为**：Fory 通过 `std::is_polymorphic<T>` 自动检测多态。带纯虚方法的类型默认按动态类型处理。

### Go and Rust

Go 和 Rust **不需要**显式动态配置，原因是：

- **Go**：接口类型天然是动态的，Fory 可以从类型判断它是否为接口
- **Rust**：trait object（`dyn Trait`）在类型系统中有显式标记

这些语言的类型系统已经表明字段是否具备多态性：

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

使用带 `dynamic` 参数的 `pyfory.field()`：

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

| 模式 | 抽象类 | 具体对象类型 | 数值/str/time 类型 |
| ----------- | -------------- | --------------------- | ---------------------- |
| Native 模式 | `True` | `True` | `False` |
| Xlang 模式 | `True` | `False` | `False` |

- **抽象类**：`dynamic` 始终为 `True`（必须写入类型信息）
- **Native 模式**：对象类型的 `dynamic` 默认为 `True`，数值/str/time 类型为 `False`
- **Xlang 模式**：具体类型的 `dynamic` 默认为 `False`

## 默认行为

| 语言 | 接口/抽象类型 | 具体类型 |
| -------- | ------------------------ | ---------------- |
| Java | 动态（写入类型） | 静态（不写入类型） |
| C++ | 动态（virtual） | 静态 |
| Go | 动态（interface） | 静态（struct） |
| Rust | 动态（dyn Trait） | 静态 |
| Python | 动态（所有对象） | 动态 |

## 性能考虑

写入类型元信息会带来开销：

- **空间**：类型信息会增加序列化输出的字节数
- **时间**：序列化/反序列化期间需要解析类型

以下场景可使用 `dynamic = FALSE`（Java）或 `dynamic(false)`（C++）：

- 确定运行时类型与声明类型一致
- 对性能要求很高且不需要多态
- 字段类型实际上等同于 final

## 跨语言兼容性

为跨语言消费序列化数据时：

1. **使用一致的类型注册**：在各语言中用相同 ID 注册类型
2. **优先显式配置**：不确定接收端预期时使用 `dynamic = TRUE`
3. **记录多态字段**：明确哪些字段可能包含子类型

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

FORY_STRUCT(Zoo, animal, maybe_mixed_breed);

FORY_FIELD_CONFIG(Zoo,
    (animal, fory::F(0).nullable()),              // Auto-detect (Animal is polymorphic)
    (maybe_mixed_breed, fory::F(1).dynamic(true)) // Force dynamic for concrete type
);
```

## Related Topics

- [Field Nullability](field_nullability) - Controlling null handling for fields
- [Field Reference Tracking](reference_tracking) - Managing shared/circular references
- [Type Mapping](../../specification/xlang_type_mapping) - Cross-language type compatibility
