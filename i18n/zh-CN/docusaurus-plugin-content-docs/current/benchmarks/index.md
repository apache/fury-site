---
title: 基准结果
sidebar_position: 1
id: index
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

> **注意**：不同序列化器和配置各自擅长不同的工作负载。基准测试结果仅供参考。
> 请针对具体使用场景，采用适当的配置和工作负载进行基准测试。

## Java 基准测试

Java 基准测试使用 `docs/benchmarks/object-serialization/native/java` 中的当前测试套件，
将 Fory 与常见 Java 序列化框架进行比较。

**序列化吞吐量**：

![Java 序列化吞吐量](object-serialization/native/java/java_repo_serialization_throughput.png)

**反序列化吞吐量**：

![Java 反序列化吞吐量](object-serialization/native/java/java_repo_deserialization_throughput.png)

**JSON 吞吐量**：

<div style={{display: 'flex', gap: '1rem'}}>
  <img src={require('./json/java/string_throughput.png').default} alt="Java JSON String Throughput" style={{width: 'calc(50% - 0.5rem)'}} />
  <img src={require('./json/java/utf8_bytes_throughput.png').default} alt="Java JSON UTF-8 Throughput" style={{width: 'calc(50% - 0.5rem)'}} />
</div>

**跨语言吞吐量**：

![Java 跨语言吞吐量](object-serialization/xlang/java/throughput.png)

**重要**：测量 Fory 运行时代码生成性能时，需要进行充分预热：

更多基准测试说明、原始数据和完整 Java benchmark README，请参阅 [Java 基准测试](object-serialization/native/java/README.md)。

## Python 基准测试

在对象和列表工作负载中，Fory Python 相比 `pickle` 和 Protobuf 展现出优秀性能。

![Python 吞吐量](object-serialization/xlang/python/throughput.png)

基准测试设置、原始结果和复现步骤请参阅 [Python 基准测试](object-serialization/xlang/python/README.md)。

## Rust 基准测试

与其他 Rust 序列化框架相比，Fory Rust 展现出有竞争力的性能。

![Rust 吞吐量](object-serialization/xlang/rust/throughput.png)

注意：结果取决于硬件、数据集和实现版本。记录的环境、工作负载和复现命令请参阅
[Rust 基准测试报告](object-serialization/xlang/rust/README.md)。

## C++ 基准测试

与 Protobuf C++ 序列化框架相比，Fory C++ 展现出有竞争力的性能。

![C++ 吞吐量](object-serialization/xlang/cpp/throughput.png)

记录的环境、工作负载和复现命令请参阅 [C++ 基准测试报告](object-serialization/xlang/cpp/README.md)。

## Go 基准测试

在单对象和列表工作负载中，Fory Go 相比 Protobuf 和 Msgpack 展现出优秀性能。

![Go 吞吐量](object-serialization/xlang/go/throughput.png)

注意：结果取决于硬件、数据集和实现版本。详情请参阅
[Go 基准测试报告](object-serialization/xlang/go/README.md)。

## C# 基准测试

在有类型对象的序列化和反序列化工作负载中，Fory C# 相比 Protobuf 和 Msgpack 展现出优秀性能。

![C# 吞吐量](object-serialization/xlang/csharp/throughput.png)

注意：结果取决于硬件和运行时版本。详情请参阅
[C# 基准测试报告](object-serialization/xlang/csharp/README.md)。

## Swift 基准测试

在标量对象和列表工作负载中，Fory Swift 相比 Protobuf 和 Msgpack 展现出优秀性能。

![Swift 吞吐量](object-serialization/xlang/swift/throughput.png)

注意：结果取决于硬件和运行时版本。详情请参阅
[Swift 基准测试报告](object-serialization/xlang/swift/README.md)。

## JavaScript 基准测试

在具有代表性的 Node.js 工作负载中，Fory JavaScript 相比 Protocol Buffers 和 JSON 展现出优秀性能。

![JavaScript 吞吐量](object-serialization/xlang/javascript/throughput.png)

注意：结果取决于硬件、数据集和运行时版本。详情请参阅
[JavaScript 基准测试报告](object-serialization/xlang/javascript/README.md)。

## Dart 基准测试

在具有代表性的对象和列表工作负载中，Fory Dart 相比 Protocol Buffers 展现出优秀性能。

![Dart 吞吐量](object-serialization/xlang/dart/throughput.png)

注意：结果取决于硬件、数据集和运行时版本。详情请参阅
[Dart 基准测试报告](object-serialization/xlang/dart/README.md)。

## 正确解读结果

请先阅读[方法论](methodology.md)，再打开能力、运行时、Schema、模式和操作均与自身工作负载匹配的报告。
仓库中保存的结果只是其记录环境下的历史证据，并不保证适用于其他应用或当前 main 分支。
