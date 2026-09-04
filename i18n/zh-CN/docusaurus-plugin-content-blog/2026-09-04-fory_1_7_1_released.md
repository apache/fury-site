---
slug: fory_1_7_1_release
title: Apache Fory 1.7.1 正式发布
description: "Fory 1.7.1 支持将 64 位整数写为字符串，并默认使用 Base64 表示 JSON 字节数组。"
authors: [chaokunyang]
tags: [fory, java, json, javascript, xlang]
---

Apache Fory 团队很高兴地宣布 1.7.1 版本正式发布。这个补丁版本提升了 Java JSON 的互操作性，
扩展了跨语言字段 tag ID，并为多个运行时带来了正确性与兼容性修复。请访问
[快速开始](https://fory.apache.org/zh-CN/docs/start/)页面，获取适用于您所用平台的库。

## 亮点

- Java JSON 支持将 64 位整数值写为字符串，帮助应用在 JSON 经过 JavaScript 时保持精确值。
- Java JSON 现在默认将字节数组写为 Base64 字符串，为二进制数据提供更紧凑、更通用的表示形式。

## 避免 JSON 中的 64 位整数精度损失

JavaScript 数字无法精确表示所有 64 位整数。Fory JSON 1.7.1 新增 `writeLongAsString` builder 选项，
当数据会经过 JavaScript 或其他数值范围受限的使用方时，应用可以将 Java `long` 和 `Long` 值输出为
带引号的十进制字符串：

```java
import org.apache.fory.json.ForyJson;

ForyJson json = ForyJson.builder().writeLongAsString(true).build();
String encoded = json.toJson(9_007_199_254_740_993L);

assert encoded.equals("\"9007199254740993\"");
```

该选项默认关闭。它也适用于受支持的 Long 类包装器，以及数组、collection、Map 和等效 Scala、Kotlin
容器中声明的 Long 值。无论写入端是否启用该选项，Reader 都同时接受带引号和不带引号的整数 token。
完整行为请参阅 [Java JSON 对象映射指南](/zh-CN/docs/json/object-mapping)。

## 默认使用 Base64 表示字节数组

未标注的 Java `byte[]` 值现在使用带引号的标准 Base64 字符串，不再使用十进制字节值组成的 JSON
数组。例如，字节 `{1, -2, 3}` 会写为 `"Af4D"`。这符合 JSON 生态中常见的二进制数据表示方式，
并能减少二进制密集型载荷的编码和解析开销。

这是相对于 Fory 1.7.0 的默认表示变化。Base64 Reader 不接受旧的数字数组表示。需要保留该表示的
应用可以为精确字段或 getter 显式选择数字数组格式：

```java
import org.apache.fory.json.annotation.JsonByteArray;

public final class Attachment {
  @JsonByteArray(JsonByteArray.Format.ARRAY)
  public byte[] content;
}
```

Base64 与数字数组的映射详情请参阅 [JSON 注解指南](/zh-CN/docs/json/annotations)中的
`JsonByteArray` 说明。

## 功能改进

- feat(xlang): 将字段 tag ID 扩展为 signed int32，由
  [@chaokunyang](https://github.com/chaokunyang) 在
  [#3982](https://github.com/apache/fory/pull/3982) 中贡献
- feat(json): 支持将 long 值写为字符串，由
  [@chaokunyang](https://github.com/chaokunyang) 在
  [#4008](https://github.com/apache/fory/pull/4008) 中贡献
- feat(json): 默认将字节数组编码为 Base64 JSON 字符串，由
  [@ingokegel](https://github.com/ingokegel) 在
  [#4012](https://github.com/apache/fory/pull/4012) 中贡献

## 问题修复

- fix(ci): 增加 Android Gradle 内存，由 [@chaokunyang](https://github.com/chaokunyang) 在
  [#3980](https://github.com/apache/fory/pull/3980) 中贡献
- fix(xlang): 补全字段 tag 校验，由 [@chaokunyang](https://github.com/chaokunyang) 在
  [#3984](https://github.com/apache/fory/pull/3984) 中贡献
- test(java): 缩短继承 tag 测试名称，由 [@chaokunyang](https://github.com/chaokunyang) 在
  [#3985](https://github.com/apache/fory/pull/3985) 中贡献
- fix: 加固底层编解码器边界，由 [@chaokunyang](https://github.com/chaokunyang) 在
  [#3987](https://github.com/apache/fory/pull/3987) 中贡献
- fix(go): 在分块处理期间保留基本类型 Map 的迭代状态，由
  [@chaokunyang](https://github.com/chaokunyang) 在
  [#3990](https://github.com/apache/fory/pull/3990) 中贡献
- fix(js): 避免负数 varint64 快速路径中的精度损失，由
  [@ayush00git](https://github.com/ayush00git) 在
  [#3992](https://github.com/apache/fory/pull/3992) 中贡献
- fix(java): 复用本地兼容类型信息，由 [@chaokunyang](https://github.com/chaokunyang) 在
  [#4000](https://github.com/apache/fory/pull/4000) 中贡献
- fix(kotlin): 接受受支持的元数据版本，由 [@chaokunyang](https://github.com/chaokunyang) 在
  [#4001](https://github.com/apache/fory/pull/4001) 中贡献
- fix(javascript): 为类型元信息使用正确的特殊字符，由
  [@ayush00git](https://github.com/ayush00git) 在
  [#3995](https://github.com/apache/fory/pull/3995) 中贡献
- ci(kotlin): 在 JDK 26 上测试 Kotlin 2.4.10，由
  [@chaokunyang](https://github.com/chaokunyang) 在
  [#4002](https://github.com/apache/fory/pull/4002) 中贡献
- fix(javascript): 为写入路径预留 writer 容量，由
  [@ayush00git](https://github.com/ayush00git) 在
  [#3994](https://github.com/apache/fory/pull/3994) 中贡献
- fix(rust): 修正 `Send`/`Sync` 所有权，由 [@chaokunyang](https://github.com/chaokunyang) 在
  [#4003](https://github.com/apache/fory/pull/4003) 中贡献
- fix(scala): 支持 fory-json-scala 中的嵌套 case class，由
  [@pjfanning](https://github.com/pjfanning) 在
  [#4006](https://github.com/apache/fory/pull/4006) 中贡献
- fix(javascript): 将过小的 float16 值下溢为带符号零，由
  [@ayush00git](https://github.com/ayush00git) 在
  [#4004](https://github.com/apache/fory/pull/4004) 中贡献
- fix(javascript): 为动态非整数保留 float64 精度，由
  [@ayush00git](https://github.com/ayush00git) 在
  [#4005](https://github.com/apache/fory/pull/4005) 中贡献
- fix(javascript): 按最近偶数规则舍入 float16 值，由
  [@chaokunyang](https://github.com/chaokunyang) 在
  [#4007](https://github.com/apache/fory/pull/4007) 中贡献

## 其他改进

- chore: 改进 Fory 发布 skill，由 [@chaokunyang](https://github.com/chaokunyang) 在
  [#3979](https://github.com/apache/fory/pull/3979) 中贡献
- chore: 清理不必要的缓冲区检查，由 [@chaokunyang](https://github.com/chaokunyang) 在
  [#3988](https://github.com/apache/fory/pull/3988) 中贡献

## 新贡献者

- [@ingokegel](https://github.com/ingokegel) 在
  [#4012](https://github.com/apache/fory/pull/4012) 中完成首次贡献

**完整变更日志**：[v1.7.0...v1.7.1](https://github.com/apache/fory/compare/v1.7.0...v1.7.1)
