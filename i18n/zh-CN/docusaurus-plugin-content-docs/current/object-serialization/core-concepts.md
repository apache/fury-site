---
title: 核心概念
sidebar_position: 1
id: core-concepts
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

Fory 对象序列化把对象图转换为字节，并在读取时重建对象图。默认的
[xlang 模式](xlang.md)和受支持的[原生模式](native.md)都使用这些核心概念；所选模式决定
可使用的类型和线格式规则。

## 对象图

一个根值可以包含标量字段、集合、Map、嵌套对象、重复引用和循环引用。序列化从根值开始遍历
对象图，反序列化则根据编码的类型和字段数据创建新的对象图。

这与序列化一行数据或 JSON 文档不同。对象序列化可以保留运行时类型和对象身份，使读取端能够
重建应用对象，而不只是读取值。可信的分析数据应使用[行格式](../row-format/index.md)，JSON
交换应使用 [Fory JSON](../json/index.md)。

## 运行时实例和注册

Fory 实例持有序列化模式、Schema 行为、引用设置、已注册类型、自定义序列化器和读取限制。
应在第一次根序列化或反序列化之前完成配置和注册，然后复用该实例。第一次根操作开始后，注册
会被冻结，从而保证同一个实例始终以相同方式解析类型。

各运行时的线程安全方式不同。有些运行时提供线程安全包装器或对象池，另一些要求每个线程或任务
使用独立实例。共享普通实例之前，请先查看对应语言文档中的并发约定。

## 类型和类型标识

内置类型的标识由 Fory 定义。应用的 Struct、Class、Enum、Union 和扩展类型使用注册的数字 ID
或名称。类型标识决定“由哪个序列化器和模型读取该值”，字段 Schema 则描述“模型包含哪些数据”。

静态已知字段可以直接使用其声明类型。动态字段还会携带具体运行时类型，用于接口、抽象类、
Trait Object、宽泛对象类型或异构值。动态类型更灵活，但所有可能的具体类型都必须完成注册，
并且受到所选模式支持。

xlang 模式要求所有通信方协调一致的可移植类型标识和类型映射；原生模式可以使用运行时特有的
类型与标识。可移植规则请参阅 [Xlang 序列化](xlang.md)，具体注册 API 请参阅各语言的类型注册页面。

## Schema 和演进

Schema 描述结构化值的字段及其嵌套类型。兼容模式携带 Schema 元数据，使读取端能够处理受支持的
字段增加、删除、重排和类型适配。读写端可能独立部署时，应使用兼容模式。

同 Schema 模式假设两端拥有完全一致的类型标识、字段、嵌套类型、可空性和引用元数据。它可以减少
元数据和字节大小，但 Schema 不一致会导致错误。只有同一个发布流程能保证所有读写端始终同步时
才应使用该模式。

契约发布后，应保持字段 ID 或名称稳定。重命名或复用标识可能使一次预期的演进被解释为另一个字段
或类型。

## 可空性

可空性决定一个值位置是否允许没有值。不同语言通过可空引用、Option 类型、指针、注解或 Schema
元数据表达可空性。可空字段与“字段值恰好等于默认值”不是同一概念。

读写端应保持可空性一致。兼容模式可以处理文档明确支持的可空和缺失字段情况，但不能把远端的
null 放入本地没有合法 null 或缺失值表示的载体。

## 引用跟踪

引用跟踪用于保留对象身份。当对象图多次包含同一个对象，或包含循环引用时，应启用引用跟踪。
如果未启用，重复值可能被重建为多个不同对象，循环引用也可能递归直到操作失败。

对于不关心对象身份的无环值型数据，应保持引用跟踪关闭，以避免额外的对象元数据和查找开销。
有些运行时同时使用全局设置和字段级元数据，准确行为请参阅对应语言的“引用”或“基础序列化”页面。

## 多态

当字段声明类型比实际值更宽泛时，多态序列化会保存该值的具体类型。读取端必须知道并接受该具体
类型，而且该类型必须能由所选模式表示。

仅有宿主语言继承关系并不会自动形成可移植契约。跨语言数据只能使用所有通信方都有 xlang 映射的
候选类型。同运行时数据可以通过原生模式使用更多语言特有的 Class、Trait 或钩子行为。

## 自定义序列化器

当内置 Schema 推断无法表达某个类型时，可以使用自定义序列化器。注册操作把自定义序列化器与
应用类型关联起来。自定义序列化器必须遵守所选模式的规则：xlang 序列化器需要可移植表示，原生
序列化器可以使用运行时特有的数据和钩子。

如果内置序列化器或生成模型已经能表达该类型，应优先使用它们，以便更容易理解 Schema 演进、
引用处理和跨语言行为。

## 继续选择模式

- [Xlang 序列化](xlang.md)是默认模式；不同语言运行时交换字节时必须使用它。
- [原生序列化](native.md)用于受支持的同运行时场景，适合需要原生类型或原生行为的数据。
- 选择模式后，再进入具体语言目录查看安装、API、配置、注册、平台、安全和故障排除文档。
