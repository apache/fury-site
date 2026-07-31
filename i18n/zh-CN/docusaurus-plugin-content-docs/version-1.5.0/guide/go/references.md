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

Fory Go 支持引用跟踪，用于处理循环引用和共享对象。这对序列化图、带父指针的树、带环链表等复杂数据结构至关重要。

## 启用引用跟踪

引用跟踪**默认禁用**。创建 Fory 实例时启用它：

```go
f := fory.New(fory.WithXlang(true), fory.WithTrackRef(true))
```

**重要**：必须启用全局引用跟踪，任何引用跟踪才会生效。当 `WithTrackRef(false)`（默认值）时，所有逐字段引用 tag 都会被忽略。

## 引用跟踪的工作方式

### 不使用引用跟踪（默认）

禁用时，每个对象都会独立序列化：

```go
f := fory.New(fory.WithXlang(true))  // TrackRef 默认禁用

shared := &Data{Value: 42}
container := &Container{A: shared, B: shared}

data, _ := f.Serialize(container)
// 'shared' 会被序列化两次（不去重）
```

### 使用引用跟踪

启用后，对象会按身份进行跟踪：

```go
f := fory.New(fory.WithXlang(true), fory.WithTrackRef(true))

shared := &Data{Value: 42}
container := &Container{A: shared, B: shared}

data, _ := f.Serialize(container)
// 'shared' 只序列化一次，第二次出现会写为引用
```

## 引用标志

Fory 在序列化期间使用标志表示引用状态：

| 标志               | 值    | 含义                         |
| ------------------ | ----- | ---------------------------- |
| `NullFlag`         | -3    | Nil/null 值                  |
| `RefFlag`          | -2    | 指向先前已序列化对象的引用   |
| `NotNullValueFlag` | -1    | 非 null 值（后续为数据）     |
| `RefValueFlag`     | 0     | 引用值标志                   |

## 可引用类型

只有特定类型支持引用跟踪。在 xlang 模式中，以下类型可以跟踪引用：

| 类型                          | 是否跟踪引用 | 说明                         |
| ----------------------------- | ------------ | ---------------------------- |
| `*struct`（指向 struct 的指针） | 是           | 使用 `fory:"ref"` tag 启用   |
| `any`（interface）            | 是           | 自动跟踪                     |
| `[]T`（slice）                | 是           | 使用 `fory:"ref"` tag 启用   |
| `map[K]V`                     | 是           | 使用 `fory:"ref"` tag 启用   |
| `*int`、`*string` 等          | 否           | 排除指向基本类型的指针       |
| 基本类型                      | 否           | 值类型                       |
| `time.Time`、`time.Duration`  | 否           | 值类型                       |
| 数组（`[N]T`）                | 否           | 值类型                       |

## 逐字段引用控制

默认情况下，即使设置了全局 `WithTrackRef(true)`，单个字段的引用跟踪也**禁用**。可以使用 `ref` struct tag 为特定字段启用引用跟踪：

```go
type Container struct {
    // 为此字段启用引用跟踪
    SharedData *Data `fory:"ref"`

    // 显式禁用引用跟踪（与默认值相同）
    SimpleData *Data `fory:"ref=false"`
}
```

**重要说明**：

- 逐字段 tag 只有在设置全局 `WithTrackRef(true)` 时才会生效
- 当全局 `WithTrackRef(false)`（默认）时，所有字段 ref tag 都会被忽略
- 适用于 slice、map 和指向 struct 的指针字段
- 指向基本类型的指针（例如 `*int`、`*string`）不能使用此 tag
- 默认值为 `ref=false`（字段级别不启用引用跟踪）

更多细节请参阅 [Struct Tags](schema-metadata.md)。

## 循环引用

循环数据结构需要启用引用跟踪：

### 循环链表

```go
type Node struct {
    Value int32
    Next  *Node `fory:"ref"`
}

f := fory.New(fory.WithXlang(true), fory.WithTrackRef(true))
f.RegisterStruct(Node{}, 1)

// 创建循环链表
n1 := &Node{Value: 1}
n2 := &Node{Value: 2}
n3 := &Node{Value: 3}
n1.Next = n2
n2.Next = n3
n3.Next = n1  // 循环引用回 n1

data, _ := f.Serialize(n1)

var result Node
f.Deserialize(data, &result)
// 循环结构会被保留
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

// 创建图
a := &GraphNode{ID: 1}
b := &GraphNode{ID: 2}
c := &GraphNode{ID: 3}

// 双向连接
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

// 共享配置
config := &Config{Setting: "value"}

// 对同一对象的多个引用
app := &Application{
    MainConfig:     config,
    BackupConfig:   config,
    FallbackConfig: config,
}

data, _ := f.Serialize(app)
// 'config' 序列化一次，其余位置为引用

var result Application
f.Deserialize(data, &result)
// result.MainConfig == result.BackupConfig == result.FallbackConfig
```

## 性能注意事项

### 开销

引用跟踪会增加开销：

- 用于跟踪已见对象的内存（哈希表）
- 序列化期间的哈希查找
- 引用标志和 ID 产生的额外字节

### 何时启用

**在以下情况下启用引用跟踪**：

- 数据存在循环引用
- 同一个对象被引用多次
- 正在序列化图结构
- 必须保留对象身份

**在以下情况下禁用引用跟踪**：

- 数据是树状结构（无环）
- 每个对象只出现一次
- 需要最高性能
- 对象身份不重要

### 内存使用

引用跟踪会维护正在序列化对象的映射：

```go
// 内部引用跟踪结构
type RefResolver struct {
    writtenObjects map[refKey]int32  // 指针 -> 引用 ID
    readObjects    []reflect.Value   // 引用 ID -> 对象
}
```

对于大型对象图，这可能增加内存使用。

## 错误处理

### 不使用引用跟踪

未启用跟踪的循环引用会导致栈溢出或最大深度错误：

```go
f := fory.New(fory.WithXlang(true))  // 不启用引用跟踪

n1 := &Node{Value: 1}
n1.Next = n1  // 自引用

data, err := f.Serialize(n1)
// 错误：max depth exceeded（或栈溢出）
```

### 无效引用 ID

反序列化期间，无效引用 ID 会产生错误：

```go
// 错误类型：ErrKindInvalidRefId
```

当序列化数据包含指向先前未序列化对象的引用时，就会发生这种情况。

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

    // 创建带相互好友关系的人
    alice := &Person{Name: "Alice"}
    bob := &Person{Name: "Bob"}
    charlie := &Person{Name: "Charlie"}

    alice.Friends = []*Person{bob, charlie}
    alice.BestFriend = bob

    bob.Friends = []*Person{alice, charlie}
    bob.BestFriend = alice  // 互为最好的朋友

    charlie.Friends = []*Person{alice, bob}

    // 序列化
    data, err := f.Serialize(alice)
    if err != nil {
        panic(err)
    }
    fmt.Printf("Serialized %d bytes\n", len(data))

    // 反序列化
    var result Person
    if err := f.Deserialize(data, &result); err != nil {
        panic(err)
    }

    // 验证循环引用被保留
    fmt.Printf("Alice's best friend: %s\n", result.BestFriend.Name)
    fmt.Printf("Bob's best friend: %s\n", result.BestFriend.BestFriend.Name)
    // 输出：Alice（循环引用被保留）
}
```

## 相关主题

- [配置](configuration.md)
- [Struct Tags](schema-metadata.md)
- [Xlang 序列化](xlang-serialization.md)
