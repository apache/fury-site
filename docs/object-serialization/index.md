---
title: Object Serialization
sidebar_position: 0
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

Binary Object Serialization reconstructs object graphs, including registered application types,
collections, polymorphic values, and optional shared references.

## Choose a mode

| Mode   | Use it when                                          | Start here                   |
| ------ | ---------------------------------------------------- | ---------------------------- |
| Xlang  | Bytes cross runtime boundaries                       | [Xlang mode](xlang/index.md) |
| Native | Every writer and reader uses the same runtime family | [Native mode](native.md)     |

Xlang and native are the only object-serialization modes. Row Format is a random-access analytical
representation, and Fory JSON is a Java JSON codec; use the
[format chooser](../introduction/choose-a-format.md) when object reconstruction is not your goal.

## Browse by runtime

Choose a runtime to find its installation route, lifecycle, exact APIs, configuration, type
registration, schema behavior, extensions, platforms, and troubleshooting:

| Runtime               | Modes                | Documentation                                          |
| --------------------- | -------------------- | ------------------------------------------------------ |
| Java                  | xlang and native     | [Java runtime](./java/index.md)                        |
| Python                | xlang and native     | [Python runtime](./python/index.md)                    |
| C++                   | xlang and native     | [C++ runtime](./cpp/index.md)                          |
| Go                    | xlang and native     | [Go runtime](./go/index.md)                            |
| Rust                  | xlang and native     | [Rust runtime](./rust/index.md)                        |
| JavaScript/TypeScript | xlang                | [JavaScript/TypeScript runtime](./javascript/index.md) |
| C#                    | xlang                | [C# runtime](./csharp/index.md)                        |
| Swift                 | xlang                | [Swift runtime](./swift/index.md)                      |
| Dart                  | xlang                | [Dart runtime](./dart/index.md)                        |
| Scala                 | xlang and JVM native | [Scala runtime](./scala/index.md)                      |
| Kotlin                | xlang and JVM native | [Kotlin runtime](./kotlin/index.md)                    |

## Security

Before decoding externally supplied bytes, read [Security](security.md). It
covers accepted-type policy, registration, resource limits, transport responsibilities, and
negative verification for both modes.

## Specifications

- [Xlang serialization format](../specification/xlang_serialization_spec.md)
- [Java native object graph format](../specification/java_serialization_spec.md)
- [Xlang type mapping](../specification/xlang_type_mapping.md)
