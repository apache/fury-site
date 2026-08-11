---
slug: fury_renamed_to_fory
title: 重要公告 - Apache Fury 现已更名为 Apache Fory
description: "Apache Fury 正式更名为 Apache Fory，代码仓库、包名、构件、文档和社区沟通渠道随之更新。"
authors: [chaokunyang]
tags: [fury]
---

**Apache Fury 团队现正式宣布，Apache Fury 已即日起更名为 Apache Fory**。此次变更将影响项目的全部组成部分，包括代码仓库、包名、文档与沟通渠道。

<img src="https://fory.apache.org/img/fory-logo-light.png" width="50%"/>
我们的新身份：Fast Serialization Framework **FOR Y**ou

## 为什么需要这次更名

此次更名是为了解决 ASF Brand Management 识别出的命名冲突问题。经过大规模讨论与正式投票后，该调整可确保项目符合 ASF 品牌与命名规范。

新名称 “Fory” 在发音上与 “Fury” 保持接近，同时建立了符合 ASF 标准的独立身份。

## 技术变更与影响

此次更名需要在整个生态中完成更新：

- **Java 包名** 从 `org.apache.fury` 迁移到 `org.apache.fory`
- **类名** 从 `XXXFury/FuryXXX` 迁移到 `XXXFory/ForyXXX`
- **GitHub 仓库** 更名为 `apache/fory`（代码）和 `apache/fory-site`（网站）
- **下游集成**（Quarkus-Fury、Camel-Fury）需要更新依赖
- **邮件列表** 迁移到 `@fory.apache.org`

## 迁移支持

为便于大家完成迁移：

- 现有 Apache Fury 版本文档仍保留在 [v0.10 document](https://fory.apache.org/docs/0.10/docs/introduction/)
- 关键 URL 已配置重定向

## 为什么是 “Fory”？

这个名称的选择优先考虑了以下因素：

- 与 “Fury” 发音相近
- 无现有商标冲突
- 延续项目的技术身份
- 简短、易记、便于全球用户发音

## 我们的承诺

我们理解这次变更会给用户带来迁移成本，尤其是已经深度集成的使用者。请相信：

- 所有历史 issue 与 PR 已完成迁移
- 性能基准优势将继续保持
- 版本发布节奏不会中断

此次更名体现了我们在尊重知识产权前提下，坚持技术卓越的承诺。感谢大家在这个过渡过程中的耐心与信任。
