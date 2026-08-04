---
title: 引用
sidebar_position: 8
id: references
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

Fory Go 支持引用跟踪，用于处理循环引用和共享对象。这对于序列化图、带父指针的树和包含环的链表等复杂数据结构至关重要。

## 启用引用跟踪

引用跟踪**默认禁用**。创建 Fory 实例时可启用：

```go
f := fory.New(fory.WithXlang(true), fory.WithTrackRef(true))
```

**重要**：必须启用全局引用跟踪，任何引用跟踪才会生效。当 `WithTrackRef(false)`（默认值）时，会忽略所有字段级引用标签。

## 引用跟踪的工作原理

### 不使用引用跟踪（默认）

禁用后，每个对象独立序列化：

```go
f := fory.New(fory.WithXlang(true))  // TrackRef disabled by default

shared := &Data{Value: 42}
container := &Container{A: shared, B: shared}

data, _ := f.Serialize(container)
// 'shared' is serialized TWICE (no deduplication)
```

### 使用引用跟踪

启用后，按对象标识进行跟踪：

```go
f := fory.New(fory.WithXlang(true), fory.WithTrackRef(true))

shared := &Data{Value: 42}
container := &Container{A: shared, B: shared}

data, _ := f.Serialize(container)
// 'shared' is serialized ONCE, second occurrence is a reference
```

## 引用标志

Fory 使用标志表示序列化期间的引用状态：

| 标志               | 值  | 含义                   |
| ------------------ | --- | ---------------------- |
| `NullFlag`         | -3  | Nil/null 值            |
| `RefFlag`          | -2  | 引用之前已序列化的对象 |
| `NotNullValueFlag` | -1  | 非 null 值（后接数据） |
| `RefValueFlag`     | 0   | 引用值标志             |

## 可跟踪引用的类型

只有部分类型支持引用跟踪。在跨语言模式中，以下类型可以跟踪引用：

| 类型                         | 跟踪引用 | 说明                       |
| ---------------------------- | -------- | -------------------------- |
| `*struct`（结构体指针）      | 是       | 使用 `fory:"ref"` 标签启用 |
| `any`（接口）                | 是       | 自动跟踪                   |
| `[]T`（切片）                | 是       | 使用 `fory:"ref"` 标签启用 |
| `map[K]V`                    | 是       | 使用 `fory:"ref"` 标签启用 |
| `*int`、`*string` 等         | 否       | 排除原始类型指针           |
| 原始类型                     | 否       | 值类型                     |
| `time.Time`、`time.Duration` | 否       | 值类型                     |
| 数组（`[N]T`）               | 否       | 值类型                     |

## 按字段控制引用

默认情况下，即使全局设置了 `WithTrackRef(true)`，单个字段的引用跟踪仍然**禁用**。可以使用 `ref` 结构体标签为特定字段启用引用跟踪：

```go
type Container struct {
    // Enable ref tracking for this field
    SharedData *Data `fory:"ref"`

    // Explicitly disable ref tracking (same as default)
    SimpleData *Data `fory:"ref=false"`
}
```

**重要说明**：

- 字段级标签仅在全局设置 `WithTrackRef(true)` 时生效
- 全局使用 `WithTrackRef(false)`（默认值）时，会忽略所有字段引用标签
- 适用于切片、映射和结构体指针字段
- 原始类型指针（例如 `*int`、`*string`）不能使用此标签
- 默认值为 `ref=false`（字段不跟踪引用）

更多详情参见[结构体标签](schema-metadata.md)。

## 循环引用

循环数据结构必须使用引用跟踪：

### 循环链表

```go
type Node struct {
    Value int32
    Next  *Node `fory:"ref"`
}

f := fory.New(fory.WithXlang(true), fory.WithTrackRef(true))
f.RegisterStruct(Node{}, 1)

// Create circular list
n1 := &Node{Value: 1}
n2 := &Node{Value: 2}
n3 := &Node{Value: 3}
n1.Next = n2
n2.Next = n3
n3.Next = n1  // Circular reference back to n1

data, _ := f.Serialize(n1)

var result Node
f.Deserialize(data, &result)
// Circular structure is preserved
// result.Next.Next.Next == &result
```

### 父子树

```go
type TreeNode struct {
    Value    string
    Parent   *TreeNode   `fory:"ref"`
    Children []*TreeNode `fory:"ref"`
}

f := fory.New(fory.WithXlang(true), fory.WithTrackRef(true))
f.RegisterStruct(TreeNode{}, 1)

root := &TreeNode{Value: "root"}
child1 := &TreeNode{Value: "child1", Parent: root}
child2 := &TreeNode{Value: "child2", Parent: root}
root.Children = []*TreeNode{child1, child2}

data, _ := f.Serialize(root)

var result TreeNode
f.Deserialize(data, &result)
// result.Children[0].Parent == &result
```

### 图结构

```go
type GraphNode struct {
    ID        int32
    Neighbors []*GraphNode `fory:"ref"`
}

f := fory.New(fory.WithXlang(true), fory.WithTrackRef(true))
f.RegisterStruct(GraphNode{}, 1)

// Create a graph
a := &GraphNode{ID: 1}
b := &GraphNode{ID: 2}
c := &GraphNode{ID: 3}

// Bidirectional connections
a.Neighbors = []*GraphNode{b, c}
b.Neighbors = []*GraphNode{a, c}
c.Neighbors = []*GraphNode{a, b}

data, _ := f.Serialize(a)

var result GraphNode
f.Deserialize(data, &result)
```

## 共享对象去重

引用跟踪还会对共享对象去重：

```go
type Config struct {
    Setting string
}

type Application struct {
    MainConfig     *Config `fory:"ref"`
    BackupConfig   *Config `fory:"ref"`
    FallbackConfig *Config `fory:"ref"`
}

f := fory.New(fory.WithXlang(true), fory.WithTrackRef(true))
f.RegisterStruct(Config{}, 1)
f.RegisterStruct(Application{}, 2)

// Shared configuration
config := &Config{Setting: "value"}

// Multiple references to same object
app := &Application{
    MainConfig:     config,
    BackupConfig:   config,
    FallbackConfig: config,
}

data, _ := f.Serialize(app)
// 'config' serialized once, others are references

var result Application
f.Deserialize(data, &result)
// result.MainConfig == result.BackupConfig == result.FallbackConfig
```

## 性能注意事项

### 开销

引用跟踪会增加以下开销：

- 用于跟踪已见对象的内存（哈希表）
- 序列化期间的哈希查找
- 引用标志和 ID 所需的额外字节

### 何时启用

**以下情况启用引用跟踪**：

- 数据包含循环引用
- 同一对象被多次引用
- 序列化图结构
- 必须保留对象标识

**以下情况禁用引用跟踪**：

- 数据为树形结构（无环）
- 每个对象只出现一次
- 要求最高性能
- 对象标识无关紧要

### 内存用量

引用跟踪会维护正在序列化对象的映射：

```go
// Internal reference tracking structure
type RefResolver struct {
    writtenObjects map[refKey]int32  // pointer -> reference ID
    readObjects    []reflect.Value   // reference ID -> object
}
```

对于大型对象图，这可能增加内存用量。

## 错误处理

### 未启用引用跟踪

未跟踪的循环引用会导致栈溢出或最大深度错误：

```go
f := fory.New(fory.WithXlang(true))  // No reference tracking

n1 := &Node{Value: 1}
n1.Next = n1  // Self-reference

data, err := f.Serialize(n1)
// Error: max depth exceeded (or stack overflow)
```

### 无效引用 ID

反序列化期间，无效的引用 ID 会产生错误：

```go
// Error type: ErrKindInvalidRefId
```

当序列化数据包含对之前未序列化对象的引用时，会出现此错误。

## 完整示例

```go
package main

import (
    "fmt"
    "github.com/apache/fory/go/fory"
)

type Person struct {
    Name       string
    Friends    []*Person  `fory:"ref"`
    BestFriend *Person    `fory:"ref"`
}

func main() {
    f := fory.New(fory.WithXlang(true), fory.WithTrackRef(true))
    f.RegisterStruct(Person{}, 1)

    // Create people with mutual friendships
    alice := &Person{Name: "Alice"}
    bob := &Person{Name: "Bob"}
    charlie := &Person{Name: "Charlie"}

    alice.Friends = []*Person{bob, charlie}
    alice.BestFriend = bob

    bob.Friends = []*Person{alice, charlie}
    bob.BestFriend = alice  // Mutual best friends

    charlie.Friends = []*Person{alice, bob}

    // Serialize
    data, err := f.Serialize(alice)
    if err != nil {
        panic(err)
    }
    fmt.Printf("Serialized %d bytes\n", len(data))

    // Deserialize
    var result Person
    if err := f.Deserialize(data, &result); err != nil {
        panic(err)
    }

    // Verify circular references preserved
    fmt.Printf("Alice's best friend: %s\n", result.BestFriend.Name)
    fmt.Printf("Bob's best friend: %s\n", result.BestFriend.BestFriend.Name)
    // Output: Alice (circular reference preserved)
}
```

## 相关主题

- [配置](configuration.md)
- [结构体标签](schema-metadata.md)
- [跨语言序列化](xlang.md)
