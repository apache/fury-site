---
title: 线程安全
sidebar_position: 11
id: thread_safety
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

本指南介绍 Fory Go 的并发使用模式，包括线程安全包装器以及多 goroutine 环境中的最佳实践。

## 默认 Fory 实例

默认 `Fory` 实例**不是线程安全的**：

```go
f := fory.New(fory.WithXlang(true))

// 不安全：多个 goroutine 并发访问
go func() {
    f.Serialize(value1)  // 竞态条件！
}()
go func() {
    f.Serialize(value2)  // 竞态条件！
}()
```

### 为什么不是线程安全的？

出于性能考虑，Fory 会复用内部状态：

- Buffer 会在调用之间清空并复用
- 引用解析器会被重置
- Context 对象会被回收

这避免了内存分配，但要求独占访问。

## 线程安全包装器

并发使用时，请使用 `threadsafe` 包：

```go
import "github.com/apache/fory/go/fory/threadsafe"

// 创建线程安全的 Fory
f := threadsafe.New()

// 可安全并发使用
go func() {
    data, _ := f.Serialize(value1)
}()
go func() {
    data, _ := f.Serialize(value2)
}()
```

### 工作方式

线程安全包装器使用 `sync.Pool`：

1. **获取**：从池中获取一个 Fory 实例
2. **使用**：执行序列化/反序列化
3. **复制**：复制结果数据（buffer 将被复用）
4. **释放**：将实例返回到池中

```go
// 简化实现
func (f *Fory) Serialize(v any) ([]byte, error) {
    fory := f.pool.Get().(*fory.Fory)
    defer f.pool.Put(fory)

    data, err := fory.Serialize(v)
    if err != nil {
        return nil, err
    }

    // 复制，因为底层 buffer 将被复用
    result := make([]byte, len(data))
    copy(result, data)
    return result, nil
}
```

### API

```go
// 创建线程安全实例
f := threadsafe.New()

// 实例方法
data, err := f.Serialize(value)
err = f.Deserialize(data, &target)

// 泛型函数
data, err := threadsafe.Serialize(f, &value)
err = threadsafe.Deserialize(f, data, &target)

// 全局便捷函数
data, err := threadsafe.Marshal(&value)
err = threadsafe.Unmarshal(data, &target)
```

## 类型注册

类型注册应在并发使用前完成：

```go
f := threadsafe.New()

// 并发访问前注册类型
f.RegisterStruct(User{}, 1)
f.RegisterStruct(Order{}, 2)

// 现在可以安全并发使用
go func() {
    f.Serialize(&User{ID: 1})
}()
```

### 线程安全注册

线程安全包装器会安全地处理注册：

```go
// 安全：注册过程会同步
f := threadsafe.New()
f.RegisterStruct(User{}, 1)  // 线程安全
```

不过，为获得最佳性能，建议在启动时、并发使用前注册所有类型。

## 零拷贝注意事项

### 非线程安全实例

使用默认 Fory 时，返回的字节 slice 是内部 buffer 的视图：

```go
f := fory.New(fory.WithXlang(true))

data1, _ := f.Serialize(value1)
// data1 目前有效

data2, _ := f.Serialize(value2)
// data1 现在已失效（buffer 被复用）
```

### 线程安全实例

线程安全包装器会自动复制数据：

```go
f := threadsafe.New()

data1, _ := f.Serialize(value1)
data2, _ := f.Serialize(value2)
// data1 和 data2 都有效（独立副本）
```

这更安全，但会带来分配开销。

## 性能对比

| 场景           | 非线程安全        | 线程安全                 |
| -------------- | ----------------- | ------------------------ |
| 单 goroutine   | 最快              | 较慢（池开销）           |
| 多 goroutine   | 不安全            | 安全，扩展性好           |
| 内存分配       | 最少              | 每次调用复制             |
| Buffer 复用    | 是                | 每个池内实例各自复用     |

### 基准测试

```go
func BenchmarkNonThreadSafe(b *testing.B) {
    f := fory.New(fory.WithXlang(true))
    f.RegisterStruct(User{}, 1)
    user := &User{ID: 1, Name: "Alice"}

    for i := 0; i < b.N; i++ {
        data, _ := f.Serialize(user)
        _ = data
    }
}

func BenchmarkThreadSafe(b *testing.B) {
    f := threadsafe.New()
    f.RegisterStruct(User{}, 1)
    user := &User{ID: 1, Name: "Alice"}

    for i := 0; i < b.N; i++ {
        data, _ := f.Serialize(user)
        _ = data
    }
}
```

## 使用模式

### 每个 Goroutine 一个实例

当 goroutine 数量已知并追求最高性能时：

```go
func worker(id int) {
    // 每个 worker 都有自己的 Fory 实例
    f := fory.New(fory.WithXlang(true))
    f.RegisterStruct(User{}, 1)

    for task := range tasks {
        data, _ := f.Serialize(task)
        process(data)
    }
}

// 启动 worker
for i := 0; i < numWorkers; i++ {
    go worker(i)
}
```

### 共享线程安全实例

当 goroutine 数量动态变化或希望保持简单时：

```go
// 单个共享实例
var f = threadsafe.New()

func init() {
    f.RegisterStruct(User{}, 1)
}

func handleRequest(user *User) []byte {
    // 可从任何 goroutine 安全调用
    data, _ := f.Serialize(user)
    return data
}
```

### HTTP Handler 示例

```go
var fory = threadsafe.New()

func init() {
    fory.RegisterStruct(Response{}, 1)
}

func handler(w http.ResponseWriter, r *http.Request) {
    response := &Response{
        Status: "ok",
        Data:   getData(),
    }

    // 安全：threadsafe.Fory 会处理并发
    data, err := fory.Serialize(response)
    if err != nil {
        http.Error(w, err.Error(), 500)
        return
    }

    w.Header().Set("Content-Type", "application/octet-stream")
    w.Write(data)
}
```

## 常见错误

### 共享非线程安全实例

```go
// 错误：竞态条件
var f = fory.New(fory.WithXlang(true))

func handler1() {
    f.Serialize(value1)  // 竞态！
}

func handler2() {
    f.Serialize(value2)  // 竞态！
}
```

**修复**：使用 `threadsafe.New()` 或每个 goroutine 一个实例。

### 保留 Buffer 引用

```go
// 错误：下一次调用会使 buffer 失效
f := fory.New(fory.WithXlang(true))
data, _ := f.Serialize(value1)
savedData := data  // 只复制了 slice 头！

f.Serialize(value2)  // 使 data 和 savedData 失效
```

**修复**：克隆数据或使用线程安全包装器。

```go
// 正确：克隆数据
data, _ := f.Serialize(value1)
savedData := make([]byte, len(data))
copy(savedData, data)

// 或使用线程安全实例（自动复制）
f := threadsafe.New()
data, _ := f.Serialize(value1)  // 已经复制
```

### 并发注册类型

```go
// 有风险：并发注册
go func() {
    f.RegisterStruct(TypeA{}, 1)
}()
go func() {
    f.Serialize(value)  // 可能看不到 TypeA
}()
```

**修复**：在并发使用前注册所有类型。

## 最佳实践

1. **启动时注册类型**：在任何并发操作之前完成
2. **保留引用时克隆数据**：使用非线程安全实例时
3. **热路径使用每个 worker 一个实例**：消除池竞争
4. **优化前先做性能分析**：线程安全开销可能可以忽略

## 相关主题

- [配置](configuration.md)
- [基础序列化](basic-serialization.md)
- [故障排查](troubleshooting.md)
