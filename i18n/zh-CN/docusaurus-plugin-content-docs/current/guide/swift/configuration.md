---
title: 配置
sidebar_position: 2
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

本页介绍 `ForyConfig` 以及推荐的运行时配置。

## ForyConfig

`Fory` 的配置结构如下：

```swift
public struct ForyConfig {
    public var xlang: Bool
    public var trackRef: Bool
    public var compatible: Bool
    public let checkClassVersion: Bool
    public let maxDepth: Int
    public let maxGraphMemoryBytes: Int64
    public let maxTypeFields: Int
    public let maxTypeMetaBytes: Int
    public let maxSchemaVersionsPerType: Int
    public let maxAverageSchemaVersionsPerType: Int
}
```

默认配置：

```swift
let fory = Fory() // xlang=true, trackRef=false, compatible=false
```

## 线程模型

`Fory` 是单线程运行时，会在调用线程上复用一组读写上下文。建议每个线程复用一个实例，不要把同一个实例并发共享给多个线程。

## 配置项

### `xlang`

控制是否启用跨语言协议模式。

- `true`：使用 xlang 编码格式，默认值
- `false`：使用 Swift 原生模式

```swift
let fory = Fory(xlang: true)
```

### `trackRef`

为可跟踪引用的类型启用共享引用和循环引用跟踪。

- `false`：不维护引用表，适合无环或纯值对象图
- `true`：保留类对象图中的身份关系

```swift
let fory = Fory(xlang: true, trackRef: true)
```

### `compatible`

启用跨版本的兼容 Schema 模式。

- `false`：Schema 一致模式，更严格，元信息开销更低
- `true`：兼容模式，支持字段新增、删除和重排

```swift
let fory = Fory(xlang: true, trackRef: false, compatible: true)
```

### Size 和 Depth 限制

`maxDepth` 限制解码 payload 的嵌套深度。

`maxGraphMemoryBytes` 为单次根对象反序列化设置近似的对象图内存阈值。估算主要涵盖
实际创建的 array、dictionary、set、struct、class 和 object。它不包含 string、
binary data、primitive scalar 和紧凑 primitive array 等叶子值，因此实际的进程内存
可能高于这个值。叶子值仍受可用字节数检查保护：如果未读输入没有足够的字节，Fory
就不会读取或创建该叶子值。对于所有根输入形式，默认限制固定为 `128 MiB`。可以用
一个正数覆盖默认值；创建运行时时会拒绝显式传入的非正数值。

兼容模式下的远端 metadata 也会被限制：

- `maxTypeFields` 默认值为 `512`，限制一个收到的 struct metadata body 中的字段数。
- `maxTypeMetaBytes` 默认值为 `4096`，限制一个收到的 TypeMeta body 的编码 body 字节数，不包含 8 字节 header 和扩展 size varint。
- `maxSchemaVersionsPerType` 默认值为 `10`，限制一个逻辑类型可接受的远端 metadata 版本数。
- `maxAverageSchemaVersionsPerType` 默认值为 `3`，限制所有已接受远端类型的平均版本数；有效全局下限为 `8192` 个 schema。

```swift
let fory = Fory(
  maxDepth: 5,
  maxGraphMemoryBytes: 128 * 1024 * 1024,
  maxTypeFields: 512,
  maxTypeMetaBytes: 4096,
  maxSchemaVersionsPerType: 10,
  maxAverageSchemaVersionsPerType: 3
)
```

## 推荐配置

### 本地严格 Schema

```swift
let fory = Fory(xlang: false, trackRef: false, compatible: false)
```

### 跨语言服务载荷

```swift
let fory = Fory(xlang: true, trackRef: false, compatible: true)
```

### 需要对象身份的图结构载荷

```swift
let fory = Fory(xlang: true, trackRef: true, compatible: true)
```

## 安全

安全相关配置：

- 在反序列化不可信 payload 前，只注册预期的生成 model。
- 对 intentional same-schema payload，将 `checkClassVersion` 与 `compatible: false` 配合使用。
- 根据服务接受的最大嵌套深度设置 `maxDepth`。
- 将 `maxGraphMemoryBytes` 用作 collection、map、array、struct、class 和 object 密集型
  载荷的近似阈值。它不是精确的 heap 上限；叶子值受剩余输入字节数限制。
- 除非数据不是恶意输入，且可信 peer 会发送更大的 metadata 或大量 schema 版本，否则保持远端 schema metadata 限制的默认值。
