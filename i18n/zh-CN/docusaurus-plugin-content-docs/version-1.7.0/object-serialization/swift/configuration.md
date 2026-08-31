---
title: 配置
sidebar_position: 4
id: configuration
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

本页介绍 `Config` 和推荐的 Fory 预设。

## Config

`Fory` 使用以下配置：

```swift
public struct Config {
  public let trackRef: Bool
  public let compatible: Bool
  public let checkClassVersion: Bool
  public let maxDepth: Int
  public let maxGraphMemoryBytes: Int64
  public let maxUnbackedContainerItems: Int
  public let maxTypeFields: Int
  public let maxTypeMetaBytes: Int
  public let maxSchemaVersionsPerType: Int
  public let maxAverageSchemaVersionsPerType: Int
}
```

默认配置：

```swift
let fory = Fory() // ref=false, compatible=true
```

Swift 只支持 xlang 编码格式，因此没有 `xlang` 选项可传入 `Config` 或 `Fory` 初始化器。

## 线程

`Fory` 是单线程的，针对在调用线程上复用一对读写上下文进行了优化。每个线程复用一个实例，
不要并发使用同一实例。

## 选项

### `trackRef`

为可跟踪引用的类型启用共享引用或循环引用跟踪。

- `false`：不使用引用表（对于无环或仅包含值的对象图更小、更快）
- `true`：保留 class/引用对象图的对象标识

```swift
let fory = Fory(ref: true)
```

### `compatible`

启用兼容 Schema 模式，以支持跨版本演进。

- `false`：序列化更快、体积更小
- `true`：兼容模式（支持添加、移除和重排字段）

只有每个读取端和写入端始终使用相同 Schema，且希望获得更快的序列化速度和更小的体积时，
才使用 `compatible: false`。对于跨语言载荷，只有确认每种语言使用相同 Schema，或原生类型
由 Fory Schema IDL 生成后，才设置 `compatible: false`。

```swift
let fory = Fory(compatible: false)
```

### `checkClassVersion`

控制禁用兼容模式时的 class 版本验证。省略时，默认值为 `true`（当
`compatible: false`）和 `false`（当 `compatible: true`）。

```swift
let fory = Fory(compatible: false, checkClassVersion: true)
```

### 大小和深度限制

`maxDepth` 限制一次根反序列化过程中嵌套用户值的实例化深度。静态声明的递归结构体、类和联合类型，动态选择的 `Any` 值，以及兼容模式字段跳过共享该根深度预算。null 和对已实例化值的引用不会额外消耗一层深度。

TypeMeta 泛型元数据的最大嵌套深度固定为 `20`。写入端拒绝超过此限制的元数据，读取端应用
相同限制。

`maxGraphMemoryBytes` 为一次根反序列化设置近似对象图内存限制。该估算主要涵盖已物化的
array、dictionary、set、struct、class 和对象。字符串、二进制数据、基本标量和基本类型
密集数组等叶子值不计入，因此实际进程内存可能高于此值。叶子值仍受可用字节数检查保护：
如果未读取的输入没有足够字节，Fory 不会读取或创建该叶子值。所有根输入形式的默认限制
固定为 `128 MiB`。正数会覆盖默认值。创建 Fory 实例时会拒绝显式指定的非正数。

`maxUnbackedContainerItems` 限制一次根反序列化期间，重复读取主体未消耗成比例输入的集合元素
和 map entry 数量。默认值为 `8192`；零表示严格禁止。

兼容模式的远程元数据也受以下限制：

- `maxTypeFields` 默认为 `512`，限制单个接收的 struct 元数据主体中的字段数。
- `maxTypeMetaBytes` 默认为 `4096`，限制单个接收的 TypeMeta 主体中的编码主体字节数，不包括
  8 字节头部和任何扩展大小 varint。
- `maxSchemaVersionsPerType` 默认为 `10`，限制单个逻辑类型允许的远程元数据版本数。
- `maxAverageSchemaVersionsPerType` 默认为 `3`，限制所有已接受远程类型的平均版本数。有效
  全局下限为 `8192` 个 Schema。

```swift
let fory = Fory(
  maxDepth: 5,
  maxGraphMemoryBytes: 128 * 1024 * 1024,
  maxUnbackedContainerItems: 8192,
  maxTypeFields: 512,
  maxTypeMetaBytes: 4096,
  maxSchemaVersionsPerType: 10,
  maxAverageSchemaVersionsPerType: 3
)
```

## 推荐预设

### 默认服务载荷

```swift
let fory = Fory()
```

### 对象图/对象标识工作负载

```swift
let fory = Fory(ref: true)
```

### 相同 Schema 优化

只有每个读取端和写入端始终使用相同 Schema 时才使用此设置。

```swift
let fory = Fory(compatible: false)
```

## 安全

有关信任边界、安全的读取端配置和验证方法，请参阅 [Swift 安全](security.md)。
