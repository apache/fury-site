---
slug: fory_1_4_0_release
title: Apache Fory 1.4.0 正式发布
description: "Fory 1.4.0 推出面向 Java 的 Fory JSON，并改进性能、安全性、兼容性、Python 支持和流式反序列化。"
authors: [chaokunyang]
tags: [fory, java, kotlin, scala, android, python, rust, cpp, go, csharp, swift, dart, compiler]
---

Apache Fory 团队很高兴地宣布 1.4.0 版本正式发布。本次发布由 9 位贡献者共同完成，包含 [65 个 PR](https://github.com/apache/fory/compare/v1.3.0...v1.4.0)。请访问[安装](https://fory.apache.org/zh-CN/docs/start/install)页面，获取适用于您所用平台的库。

## 亮点

* 面向 Java 推出 Fory JSON，提供高性能代码生成、丰富的注解与 mix-in、动态属性，以及 Android 和 GraalVM 原生镜像支持。
* 通过可配置的容器内存预算、更高效的流反序列化、Python 3.14 支持，以及多项跨运行时修复，进一步提升性能、安全性和兼容性。

## 面向 Java 的 Fory JSON

Fory 1.4.0 推出了 Fory JSON，这是一款高性能、线程安全的 Java JSON 序列化框架。它能够在标准 JSON 与符合 Java 使用习惯的领域对象之间进行直接映射，适用于 HTTP API、浏览器通信、日志、配置及其他需要互操作的文本载荷。

主要能力包括：

* **高性能序列化：**经过优化的 reader 和 writer 可配合解释执行及运行时生成的序列化器，同时加速 JSON 编码与解码。
* **丰富的 Java 对象映射：**支持普通类、Java record、基于 creator 构造的不可变类、常用 JDK 类型和泛型容器。
* **灵活的定制能力：**注解、mix-in 和自定义 codec 可共同将应用类型映射到 JSON，覆盖属性名称、顺序、包含规则、creator、多态、展开值、动态属性和特殊表示形式。
* **广泛的平台支持：**支持 JDK 8 及以上版本，同时支持 Android 和 GraalVM 原生镜像。

在应用中添加 `fory-json` 依赖：

```xml
<dependency>
  <groupId>org.apache.fory</groupId>
  <artifactId>fory-json</artifactId>
  <version>1.4.0</version>
</dependency>
```

`ForyJson` 构建完成后不可变且线程安全，因此同一个实例可以在多个线程间复用：

```java
import org.apache.fory.json.ForyJson;

public final class JsonExample {
  private static final ForyJson JSON = ForyJson.builder().build();

  public static final class User {
    public long id;
    public String name;

    public User() {}
  }

  public static void main(String[] args) {
    User user = new User();
    user.id = 7;
    user.name = "Alice";

    // Serialize to JSON text and deserialize from text.
    String text = JSON.toJson(user);
    User fromText = JSON.fromJson(text, User.class);

    // Serialize directly to UTF-8 bytes and deserialize without an intermediate String.
    byte[] utf8 = JSON.toJsonBytes(user);
    User fromUtf8 = JSON.fromJson(utf8, User.class);
  }
}
```

完整的类型模型、注解与 mix-in、动态属性、自定义序列化器、安全控制，以及 Android 或 GraalVM 的配置方法，请参阅 [Fory JSON 文档](/zh-CN/docs/json/)。

## 新功能

* feat(java): 通过静态 VarHandle 直接访问字段，由 @chaokunyang 在 https://github.com/apache/fory/pull/3778 中贡献
* feat(python): 新增 Python 3.14 CI 和 wheel，由 @chaokunyang 在 https://github.com/apache/fory/pull/3781 中贡献
* feat(java): 新增 Fory JSON 序列化，由 @chaokunyang 在 https://github.com/apache/fory/pull/3784 中贡献
* feat(java): 优化 Java 序列化性能，由 @chaokunyang 在 https://github.com/apache/fory/pull/3794 中贡献
* feat(format): 支持以 Optional 为键的自定义编解码器，由 @stevenschlansker 在 https://github.com/apache/fory/pull/3800 中贡献
* feat(java): 完善 Java JSON 序列化与反序列化，由 @chaokunyang 在 https://github.com/apache/fory/pull/3806 中贡献
* perf(java): 避免流反序列化期间缓冲区以平方级增长，由 @temni 在 https://github.com/apache/fory/pull/3809 中贡献
* ci(swift): 强制执行 swift-format，由 @chaokunyang 在 https://github.com/apache/fory/pull/3812 中贡献
* ci: 复用缓存的 Swift 构建产物，由 @chaokunyang 在 https://github.com/apache/fory/pull/3811 中贡献
* refactor(go): 移除静态代码生成，由 @chaokunyang 在 https://github.com/apache/fory/pull/3815 中贡献
* feat: 新增容器内存预算，由 @chaokunyang 在 https://github.com/apache/fory/pull/3795 中贡献
* feat(java): 新增一次性日志 API，由 @chaokunyang 在 https://github.com/apache/fory/pull/3821 中贡献
* perf(java): 优化 Java JSON 序列化与反序列化性能，由 @chaokunyang 在 https://github.com/apache/fory/pull/3808 中贡献
* feat(java): 为 Fory JSON 新增异步代码生成，由 @chaokunyang 在 https://github.com/apache/fory/pull/3825 中贡献
* feat(java): 新增 JSON 类型检查器，由 @chaokunyang 在 https://github.com/apache/fory/pull/3829 中贡献
* feat(java): 重构 JSON 编解码器 API，由 @chaokunyang 在 https://github.com/apache/fory/pull/3830 中贡献
* perf(java): 优化 JSON 序列化性能，由 @chaokunyang 在 https://github.com/apache/fory/pull/3834 中贡献
* feat(java): 新增 Fory JSON 注解，由 @chaokunyang 在 https://github.com/apache/fory/pull/3835 中贡献
* feat(compiler): 处理 C++ 标识符转义和名称冲突，由 @BaldDemian 在 https://github.com/apache/fory/pull/3839 中贡献
* feat(java): 增强类检查，由 @chaokunyang 在 https://github.com/apache/fory/pull/3837 中贡献
* feat(java): 新增 JSON 属性顺序注解，由 @chaokunyang 在 https://github.com/apache/fory/pull/3840 中贡献
* feat(json): 支持动态对象属性，由 @chaokunyang 在 https://github.com/apache/fory/pull/3841 中贡献
* refactor(java): 简化 JSON 子类型成员写入，由 @chaokunyang 在 https://github.com/apache/fory/pull/3842 中贡献
* feat(java): 新增 JSON 编解码器注解，由 @chaokunyang 在 https://github.com/apache/fory/pull/3844 中贡献
* refactor(java): 将 GraalVM feature 嵌入 core 模块，由 @chaokunyang 在 https://github.com/apache/fory/pull/3845 中贡献
* feat(java): 支持在 GraalVM 原生镜像中使用 Fory JSON，由 @chaokunyang 在 https://github.com/apache/fory/pull/3846 中贡献
* feat(java): 将 DefaultJdkClassAllowList 设为 public，由 @eryanwcp 在 https://github.com/apache/fory/pull/3849 中贡献
* feat(java): 更新 AllowListChecker，加入禁用类列表和允许类列表检查，由 @eryanwcp 在 https://github.com/apache/fory/pull/3850 中贡献
* feat(java): 在 Android 上支持 Fory JSON，由 @chaokunyang 在 https://github.com/apache/fory/pull/3852 中贡献
* refactor(java): 简化 JSON 编解码器注解，由 @chaokunyang 在 https://github.com/apache/fory/pull/3854 中贡献
* feat(java): 新增 JSON 值注解，由 @chaokunyang 在 https://github.com/apache/fory/pull/3855 中贡献
* feat(java): 为 Android 生成 JSON object/record 编解码器辅助类，由 @chaokunyang 在 https://github.com/apache/fory/pull/3857 中贡献
* feat(java): 支持展开 JSON 属性，由 @chaokunyang 在 https://github.com/apache/fory/pull/3856 中贡献
* feat(java): 新增 JSON 对象字段缓存，由 @chaokunyang 在 https://github.com/apache/fory/pull/3862 中贡献
* feat(java): 新增 JSON mix-in 支持，由 @chaokunyang 在 https://github.com/apache/fory/pull/3863 中贡献
* feat(java): 新增抽象 JSON 值编解码器，由 @chaokunyang 在 https://github.com/apache/fory/pull/3865 中贡献
* perf(java): 修复 JSON 性能回退，由 @chaokunyang 在 https://github.com/apache/fory/pull/3866 中贡献

## 问题修复

* fix(java): 将 ForyBuilder 建议性日志调整为 info 级别，由 @chaokunyang 在 https://github.com/apache/fory/pull/3777 中贡献
* fix(java): 修复 LinkedBlockingQueue 反序列化未限制容量的问题，由 @00sense 在 https://github.com/apache/fory/pull/3786 中贡献
* fix(ci): 修复 checkstyle CI 错误输出，由 @stevenschlansker 在 https://github.com/apache/fory/pull/3796 中贡献
* fix(c++): 替换已弃用的 std::aligned_storage，由 @RisinT96 在 https://github.com/apache/fory/pull/3793 中贡献
* fix(c++): 使时间类型支持哈希，由 @BaldDemian 在 https://github.com/apache/fory/pull/3789 中贡献
* fix(java): 为 JDK 25 trusted lookup 新增 Unsafe 回退机制，由 @chaokunyang 在 https://github.com/apache/fory/pull/3802 中贡献
* fix(compiler): 禁止 any、message 和 union 类型作为 Map 键类型，由 @BaldDemian 在 https://github.com/apache/fory/pull/3804 中贡献
* fix(java): 修复获取集合元素类型的问题，由 @Pigsy-Monk 在 https://github.com/apache/fory/pull/3803 中贡献
* fix(compiler): 在 IDL 校验中拒绝 optional any，由 @BaldDemian 在 https://github.com/apache/fory/pull/3807 中贡献
* fix(compiler): 不再为包含 any 的 message 和 union 生成 C++ 相等性方法，由 @BaldDemian 在 https://github.com/apache/fory/pull/3810 中贡献
* fix(Java): 防止自引用集合触发 normalizeIterableTypeArguments 栈溢出，由 @Pigsy-Monk 在 https://github.com/apache/fory/pull/3817 中贡献
* fix(compiler): 在元数据宏中为 C++ union case 类型创建别名，由 @BaldDemian 在 https://github.com/apache/fory/pull/3814 中贡献
* fix(compiler): 在文档中使用 Protobuf 语法高亮，由 @ayush00git 在 https://github.com/apache/fory/pull/3819 中贡献
* fix(C++): 新增 unordered_map 类型信息钩子，由 @BaldDemian 在 https://github.com/apache/fory/pull/3820 中贡献
* fix(rust): 稳定元字符串动态缓存，由 @chaokunyang 在 https://github.com/apache/fory/pull/3822 中贡献
* fix: 保持跳过的引用 ID 对齐，由 @chaokunyang 在 https://github.com/apache/fory/pull/3823 中贡献
* fix(rust): 修复 MurmurHash 计算，由 @chaokunyang 在 https://github.com/apache/fory/pull/3824 中贡献
* fix(java): 保留集合 TypeDef 的序列化器系列，由 @chaokunyang 在 https://github.com/apache/fory/pull/3827 中贡献
* fix(java): 稳定 readResolve 类型元信息，由 @chaokunyang 在 https://github.com/apache/fory/pull/3831 中贡献
* fix(java): 跳过兼容模式下缺失的 struct 字段，由 @chaokunyang 在 https://github.com/apache/fory/pull/3833 中贡献
* fix(java): 在跨语言序列化中支持继承字段，由 @chaokunyang 在 https://github.com/apache/fory/pull/3838 中贡献
* fix(java): 支持 Guava Android 集合，由 @chaokunyang 在 https://github.com/apache/fory/pull/3851 中贡献
* fix(java): 稳定 GraalVM 字段偏移量，由 @chaokunyang 在 https://github.com/apache/fory/pull/3853 中贡献
* fix(java): 恢复继承容器字段的类型，由 @chaokunyang 在 https://github.com/apache/fory/pull/3864 中贡献

## 其他改进

* chore: 将 Fory review skill 整合到 agent 指南中，由 @chaokunyang 在 https://github.com/apache/fory/pull/3779 中贡献
* chore(release): 将版本号更新至 1.3.0，由 @chaokunyang 在 https://github.com/apache/fory/pull/3792 中贡献
* chore(javascript): 新增 JavaScript 代码格式化，由 @chaokunyang 在 https://github.com/apache/fory/pull/3813 中贡献
* docs(compiler): 补充 gRPC 服务 stub 文档，由 @ayush00git 在 https://github.com/apache/fory/pull/3818 中贡献

## 新贡献者

* @00sense 在 https://github.com/apache/fory/pull/3786 中完成首次贡献
* @RisinT96 在 https://github.com/apache/fory/pull/3793 中完成首次贡献
* @temni 在 https://github.com/apache/fory/pull/3809 中完成首次贡献
* @eryanwcp 在 https://github.com/apache/fory/pull/3849 中完成首次贡献

**完整变更日志**：https://github.com/apache/fory/compare/v1.3.0...v1.4.0
