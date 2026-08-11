---
title: "Apache Fory™ 从 Apache 孵化器毕业，成为 Apache 顶级项目"
description: "Apache Fory 从 Apache 孵化器毕业，正式成为 Apache 软件基金会顶级项目。"
date: 2025-07-18
slug: apache-fory-graduated
tags: [announcement, serialization, asf]
authors: [chaokunyang]
---

**大家好！Apache Fory 团队很高兴宣布，[Apache Fory™](https://fory.apache.org/) 已从 [Apache Incubator](https://incubator.apache.org/) 正式毕业，成为 [Apache Software Foundation](https://apache.org/) 的 Top-Level Project（TLP）。这标志着项目在技术成熟度与可持续开源治理方面，已达到 Apache Way 的要求。**

## 什么是 Apache Fory？

**Apache Fory** 是一个超高速的多语言序列化框架，面向系统与语言之间的数据交换场景。通过结合 **JIT compilation** 与 **zero-copy** 技术，Fory 在易用性很高的前提下，相比其他序列化框架可实现最高 **170 倍**的性能提升。

### 核心特性

- 🌐 **跨语言序列化**：Java、Python、C++、Go、JavaScript、Rust、Scala、Kotlin
- ⚡️ **零拷贝优化**：面向大规模数据集，尽可能降低内存开销
- 🔄 **Schema 演进**：支持前向/后向兼容，适应数据结构持续演化
- 🔒 **安全优先**：通过类注册机制降低反序列化漏洞风险
- 📦 **多协议支持**：对象图、Row format 与 Java-compatible 等模式

### 快速开始

Java 序列化示例：

```java
Fory fory = Fory.builder().build();
fory.register(DataModel.class);

DataModel obj = new DataModel(/*...*/);
byte[] bytes = fory.serialize(obj);
DataModel restored = (DataModel) fory.deserialize(bytes);
```

Python 序列化示例：

```python
from dataclasses import dataclass
import pyfory

class Foo:
    name: str:
    age: int
pyfory.register(Foo)
bytes = pyfory.serialize(Foo("Shawn", 30))  # Ultra-fast encoding
restored = pyfory.deserialize(bytes)  # Instant decoding
```

## 孵化历程

自 2023 年 12 月进入 Apache 孵化器以来，Fory 在社区与技术层面都取得了显著进展。

### 社区成长

- 👥 90+ 位贡献者
- 🔧 新增 6 位 committer，其中 1 位晋升为 PPMC
- 🤝 在金融、电商与云场景中实现多元化落地

### 技术进展

- 🚀 发布 14 个符合 ASF 规范的版本（0.5.0 到 0.11.2）
- 🔄 4 位 release manager 保障可持续发布运作
- ™ 商标问题已完成处置：Fury → Fory 更名成功落地
- ✅ 成熟度验证：满足 ASF 毕业要求并完成评估

### Apache Way 落地

- 📬 100% 在 dev@ 邮件列表公开讨论
- 🗳️ 通过正式投票推进共识决策
- 🌐 基础设施完整迁移至 Fory 命名空间

## 为什么毕业很重要

毕业意味着 Fory 已证明：

- 具备可持续治理能力，且 PMC 组成多元
- 通过严格发布流程具备企业级稳定性
- 社区可独立运作，不受单一厂商主导
- 完整满足 ASF 在安全、许可与治理方面的规范

## 下一步计划

成为 Top-Level Project 后，Fory 的路线图包括：

- 能力增强
  - 持续强化跨语言兼容场景下的 Schema 演进能力
  - 推进 Rust/C++ 序列化的生产级支持
  - 持续优化 Pyfory 性能，并增强对 pickle 的 drop-in replacement 能力
- 生态集成
  - GRPC Integration
  - Protobuf Migration Tool
- 社区成长
  - 更完善的用户文档体系
  - 面向新贡献者的结构化导师机制
  - 与早期采用者共建生产实践案例

## 参与方式

体验 Fory 的性能：

Java：

```xml
<dependency>
  <groupId>org.apache.fory</groupId>
  <artifactId>fory-core</artifactId>
  <version>0.11.2</version>
</dependency>
```

Python：

```bash
pip install pyfory
```

加入我们的社区：

- 🌐 Website: https://fory.apache.org
- 💬 Slack: [fory-project.slack.com](https://join.slack.com/t/fory-project/shared_invite/zt-36g0qouzm-kcQSvV_dtfbtBKHRwT5gsw)
- 📧 Mailing list: dev@fory.apache.org
- 🐙 GitHub: https://github.com/apache/fory

## 致谢

Fory 项目的 PMC 成员如下，感谢他们做出的关键贡献：

- [Shawn Yang (Chair)](https://github.com/chaokunyang)
- [tison](https://github.com/tisonkun)
- [Xuanwo](https://github.com/xuanwo)
- [Twice](https://github.com/pragmatwice)
- [PJ Fanning](https://github.com/pjfanning)
- [Pan Li](https://github.com/pandalee99)
- Xin Wang
- Weipeng Wang
- liyu
- [eolivelli](https://github.com/eolivelli)

同时也感谢所有提交代码、反馈问题、改进文档的贡献者。这项里程碑属于整个 Apache Fory 社区！
