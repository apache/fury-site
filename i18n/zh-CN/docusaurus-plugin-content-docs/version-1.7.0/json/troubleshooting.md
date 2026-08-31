---
title: 故障排查
sidebar_position: 12
id: troubleshooting
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

| 现象 | 可能原因与处理方式 |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| 解析时出现 `ForyJsonException` | JSON 语法无效、类型不匹配、映射不受支持、违反深度或对象图内存限制、validator 失败，或存在尾随内容 |
| `InsecureException` | Fory 禁止列表或配置的 `JsonTypeChecker` 拒绝了某个类 |
| builder 抛出 `IllegalArgumentException` | 检查配置的深度、对象图内存、并发、保留缓冲区和缓存字段名限制 |
| 声明类型写入被拒绝 | 值不可赋给声明类型、类型包含通配符或类型变量，或者向基本类型提供了 null |
| 不可变值未填充 | 使用 record、有效的 `JsonCreator` 或精确的自定义 codec |
| `JsonValue` 读取失败 | 添加一个接收普通 `String` 的 `JsonCreator`，或注册精确的自定义 codec |
| 原始 JSON 输出无效 | 为 `JsonRawValue` 属性提供且只提供一个可信的完整 JSON 值 |
| 无法构造普通对象 | 添加可用的无参 constructor、使用 record 或 `JsonCreator`，或注册自定义 codec；Android 和 GraalVM Native Image 的要求更严格 |
| 普通 accessor 注解失败 | 方法不是有效的 public JavaBean accessor，或已启用 field mode |
| Any 注解失败 | 只使用一种基于字段的形式，或一对类型解析为 `Map<String, V>` 的有效方法形式；方法注解要求关闭 field mode |
| Codec 注解失败 | 解决同一节点或继承层次冲突、移除被隐藏的嵌套覆盖，或使用具有 public 无参 constructor 的 codec 类 |
| 子类型被拒绝 | 写入时未声明基类、运行时类不是类型表中的精确条目，或输入 JSON 结构与配置的包含方式不一致 |
| 无法读取 Collection | 目标应为受支持的接口或常见实现，也可以注册自定义 codec |
| OutputStream 写入失败 | 底层 `IOException` 被包装为 `ForyJsonException` 的 cause |
| Kotlin null 或成员缺失导致失败 | 检查精确的 `jsonTypeRef`、构造函数默认值和可空使用位置；null 不会请求编译器默认值 |
| Kotlin 原始泛型、星投影或类型投影失败 | 提供完整的 `jsonTypeRef<T>()`；`in` 和星投影无法重建一个精确 Schema |
| 不支持的 Kotlin 元数据 | 使用受支持的 Kotlin 2.3 编译器编译模型，并确保经过验证的 JVM 成员与元数据匹配 |
| Kotlin 模型在 Android 代码压缩后失败 | 启用 KSP；精确 Mixin 的来源或目标任一为 Kotlin 时均需使用，并验证生成的规则已打包 |
| Native Image 中缺少 Kotlin 模型 | 从可达的 `ForyJsonProvider` 安装 `ForyJsonKotlin`，启用代码生成，并使精确绑定从该配置可达 |

Fory JSON 的映射、语法、codec、深度、对象图内存、validator 和输出失败使用
`ForyJsonException`。用户 codec 代码仍可能抛出自己的运行时异常。除 `Error` 以外的 creator
和 validator 失败会连同原始 cause 一起包装。
