---
title: 安全
sidebar_position: 11
id: security
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

使用 Fory JSON 处理不可信输入前，必须明确允许实例化哪些 JVM 类型，以及接口执行哪些资源限制。Fory JSON 不会从 JSON 输入推导任意 Java 类名，但注解、声明的目标类型和自定义编解码器仍共同决定由应用控制的对象范围。

Kotlin 类型令牌和元数据是可信 Schema 声明，不是输入获得权限的来源。Kotlin 模块会在解析前验证逻辑类型、物理 JVM 载体以及构造函数/默认值操作。JSON 输入不能选择类、构造函数、编译器默认值目标、对象、伴生对象、模块、编解码器或可调用对象。`JsonSubTypes` 只从有限表中选择逻辑名称，该表来自显式条目或推导的 sealed 层次结构。

## 类型策略与类加载

Fory JSON 始终应用固定的禁止列表。如果只允许映射选定的模型 package，请通过
`withTypeChecker` 添加应用允许列表：

```java
ForyJson json =
    ForyJson.builder()
        .withTypeChecker(
            (className, context) ->
                className.startsWith("com.example.model.")
                    || className.equals("java.util.List")
                    || className.equals("java.util.Map"))
        .build();
```

允许声明 Schema 使用的每个应用模型和非内置容器类型。checker 会在为序列化和解析准备应用类型时运行，
因此必须线程安全。内置标量类型通常不会调用自定义 checker，但如果内置目标使用应用 codec，
该目标也会接受 checker 检查。自定义 codec 绝不会绕过固定禁止列表。

空的 `JsonSubTypes.value` 允许选定顶层基类型的静态 sealed 闭包。这仍是封闭集合：JSON 不能指定类名、搜索类路径，也不能允许精确 open 成员后续增加的后代。如果完整 sealed 闭包超出接口信任范围，请声明非空显式子类型表，或使用 `withTypeChecker` 拒绝精确的推导类。固定禁用列表验证完整推导闭包，自定义 checker 可缩小该闭包；拒绝全部推导类会报错。显式子类型表是精确声明，若 checker 拒绝其中某个条目则会失败。

`withClassLoader` 设置用于加载注解所声明子类型 `className` 条目的 ClassLoader。
如果未设置，`build()` 会保存当前线程上下文 ClassLoader 的快照，并回退到定义 `ForyJson` 的
ClassLoader。此后更改线程上下文 ClassLoader 不会影响该 `ForyJson` 实例。

以下类型的自然 JSON 映射不安全或存在歧义，因此默认被拒绝：`Class`、`URL`、`InetAddress`
和 `InetSocketAddress`。应用可以通过自己拥有的精确自定义 codec 支持 `URL`。任意
`Number` 和 `CharSequence` 子类同样需要精确的内置或自定义 codec。

## 深度与对象图内存限制 {#depth-and-graph-memory-limits}

`maxDepth` 限制数组和对象的嵌套深度，默认值为 `20`，配置值必须为正数。它并不是输入字节数或
内存配额。`ForyJsonBuilder.withMaxGraphMemoryBytes` 独立限制每次根读取所创建并保留的对象图
近似大小。默认值是固定的 `ForyJson.DEFAULT_MAX_GRAPH_MEMORY_BYTES`，即 128 MiB；显式值必须
为正数。String 根输入与 UTF-8 字节数组根输入使用相同的配置限制。每次根读取都从完整预算开始，
无论成功还是失败，都不会减少下一次操作的预算。该限制并非根据输入长度推导。

内置计量包括 POJO 和 Record 的浅层存储，集合和 set 及候选元素引用槽位，Map 及候选键/值引用槽位，引用数组及其槽位，以及基本类型数组及其存储。自然 `JsonObject` 和 `JsonArray` 值遵循相同 Map 和集合规则。长度未知的集合、Map 和数组按 1024 项分批预留存储，在每批最后一个子元素之前及尾部执行。因此，重复 set 元素以及重复或被覆盖的 Map 成员，每次在输入中出现都会计量。即使所有元素都是叶子值，引用数组仍会计量；即使所有属性都是叶子值，对象也会计量。`AtomicReference`、`AtomicReferenceArray` 和泛型 `Optional<T>` 包含包装对象及引用存储。新分配的基本类型 Optional 或原子基本类型包装也会计量一次；缓存的空 Optional 单例不属于新的对象图所有者。

专用叶值 codec 不计入对象图：null、字符串、字符、布尔值、包括任意精度数在内的数值、枚举、
时间及其他标量值，以及二进制值。由二进制或 Base64 codec 处理的 `byte[]` 仍是二进制叶值；
从 JSON 数值数组读取的同一 Java 载体则是基本类型数组所有者。可用字节数和语法检查仍独立于对象图计量。

会实例化复合对象图所有者的自定义 codec，必须为每个复合应用对象、collection、Map 或引用数组调用
`JsonReader.reserveGraphMemory`，并传入由应用定义的字节估算值。未知长度的保留存储应按有限批次
预留，在每批最后一个子值之前及末尾执行；codec 也可以更早预留。自定义标量或其他专用叶值表示无需预留。

对象图预算是可移植的近似值，并非精确的 JVM 堆计量。它无法包含应用 constructor 或 validator
内部使用的内存、临时解析存储、自定义 codec 未预留的分配，或无关进程内存。因此实际内存用量可能
超过配置的预算。

Kotlin 不增加独立的集合、输入或工作区限制。数组、集合、Map 和普通对象使用与 Java、Scala 相同的核心深度和对象图内存计量。解释执行时的构造函数参数数组大小由可信模型元数据确定，不来自输入声明的数量，也不会保留在解码后的对象图中。单例和 `Unit` 读取返回现有实例；装箱值类结果在实际创建包装对象时计量一次。

编译器默认值、模型构造函数、验证器和应用编解码器属于可信应用代码，其内部分配和副作用不会被沙箱隔离，也不计入对象图预算。它们抛出异常时仍会使根操作失败并清理根解析状态，但后续因尾随输入导致的失败无法撤销已经执行的代码。解码不可信输入时，应相应检查这些副作用。

## 外部控制与验证

Fory JSON 不负责身份认证、授权、加密、签名，也不施加 HTTP 请求大小限制。请将其类型、深度和对象图
限制，与适合端点的传输 body 限制、身份认证、授权、超时和领域验证结合使用。

使用负向测试验证系统会拒绝意外目标类型、过深嵌套、过大的保留对象图以及不符合应用规则的值。
