---
title: 安全
sidebar_position: 8
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

使用 Fory JSON 处理不可信输入前，必须先定义允许实例化的 Java 类型，以及端点需要执行的资源限制。
Fory JSON 不会从 JSON 输入推导任意 Java 类名，但注解、声明的目标类型和自定义 codec 仍会定义
由应用控制的对象范围。

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

`withClassLoader` 设置用于加载注解所声明子类型 `className` 条目的 ClassLoader。
如果未设置，`build()` 会保存当前线程上下文 ClassLoader 的快照，并回退到定义 `ForyJson` 的
ClassLoader。此后更改线程上下文 ClassLoader 不会影响该 `ForyJson` 实例。

以下类型的自然 JSON 映射不安全或存在歧义，因此默认被拒绝：`Class`、`URL`、`InetAddress`
和 `InetSocketAddress`。应用可以通过自己拥有的精确自定义 codec 支持 `URL`。任意
`Number` 和 `CharSequence` 子类同样需要精确的内置或自定义 codec。

## 深度与对象图内存限制

`maxDepth` 限制数组和对象的嵌套深度，默认值为 `20`，配置值必须为正数。它并不是输入字节数或
内存配额。`ForyJsonBuilder.withMaxGraphMemoryBytes` 独立限制每次根读取所创建并保留的对象图
近似大小。默认值是固定的 `ForyJson.DEFAULT_MAX_GRAPH_MEMORY_BYTES`，即 128 MiB；显式值必须
为正数。String 根输入与 UTF-8 字节数组根输入使用相同的配置限制。每次根读取都从完整预算开始，
无论成功还是失败，都不会减少下一次操作的预算。该限制并非根据输入长度推导。

内置计量包括 POJO 和 record 的浅层存储；collection 和 set 及候选元素引用槽；Map 及候选键值
引用槽；引用数组及其槽位；以及基本类型数组及其基本类型存储。自然 `JsonObject` 和 `JsonArray`
值遵循相同的 Map 和 collection 规则。未知长度的 collection、Map 和数组存储按 1024 个元素一批
预留：在每批最后一个子值之前以及末尾进行。因此，重复的 set 元素以及重复或被覆盖的 Map 成员，
都会按输入中的每次出现计费。即使引用数组的每个元素都是叶值，仍会计费；即使对象的所有属性都是
叶值，对象本身仍会计费。`AtomicReference`、`AtomicReferenceArray` 和泛型 `Optional<T>` 值包含
wrapper 和引用存储；基本类型 optional 和原子基本类型值属于叶值。

专用叶值 codec 不计入对象图：null、字符串、字符、布尔值、包括任意精度数在内的数值、枚举、
时间及其他标量值，以及二进制值。由二进制或 Base64 codec 处理的 `byte[]` 仍是二进制叶值；
从 JSON 数值数组读取的同一 Java 载体则是基本类型数组所有者。可用字节数和语法检查仍独立于对象图计量。

会实例化复合对象图所有者的自定义 codec，必须为每个复合应用对象、collection、Map 或引用数组调用
`JsonReader.reserveGraphMemory`，并传入由应用定义的字节估算值。未知长度的保留存储应按有限批次
预留，在每批最后一个子值之前及末尾执行；codec 也可以更早预留。自定义标量或其他专用叶值表示无需预留。

对象图预算是可移植的近似值，并非精确的 JVM 堆计量。它无法包含应用 constructor 或 validator
内部使用的内存、临时解析存储、自定义 codec 未预留的分配，或无关进程内存。因此实际内存用量可能
超过配置的预算。

## 外部控制与验证

Fory JSON 不负责身份认证、授权、加密、签名，也不施加 HTTP 请求大小限制。请将其类型、深度和对象图
限制，与适合端点的传输 body 限制、身份认证、授权、超时和领域验证结合使用。

使用负向测试验证系统会拒绝意外目标类型、过深嵌套、过大的保留对象图以及不符合应用规则的值。
