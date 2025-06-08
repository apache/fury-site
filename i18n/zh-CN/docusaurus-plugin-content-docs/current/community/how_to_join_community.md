---
title: 如何加入 Fory 社区
sidebar_position: 0
id: how_to_join_community
---

首先为你选择加入开源贡献行列的行为点赞 👍🏻。再者，十分感谢你选择参与到 Fory 社区，为这个开源项目做出贡献。

## Fory 贡献指南

Fory 团队通常在 github 上进行开发和 issue 维护，请打开 [Github 网站](https://github.com/)，点击右上角 `Sign up` 按钮，注册一个自己的账号，开启你开源之旅的第一步。

在 [Fory仓库](https://github.com/apache/fory)中，我们有一份面向所有开源贡献者的[指南](https://fory.apache.org/zh-CN/docs/community/)，介绍了有关版本管理、分支管理等内容，**请花几分钟时间阅读了解一下**。

## 你的第一个 Pull Request

### Step0：安装 Git

Git 是一种版本控制系统，用于跟踪和管理软件开发项目中的代码变更。它帮助开发者记录和管理代码的历史记录，方便团队协作、代码版本控制、合并代码等操作。通过 Git，您可以追踪每个文件的每个版本，并轻松地在不同版本之间进行切换和比较。Git 还提供了分支管理功能，使得可以同时进行多个并行开发任务。

- 访问 Git 官方网站：[https://git-scm.com](https://git-scm.com)
- 下载最新版本的 Git 安装程序。
- 运行下载的安装程序，按照安装向导的提示进行安装。
- 安装完成后，你可以通过命令行使用 `git version` 命令确认安装成功。

### Step1：Fork 项目

- 首先需要 fork 这个项目，进入[Fory项目页面](https://github.com/apache/fory)，点击右上角的 Fork 按钮
- 你的 github 帐号中会出现 xxxx(你的 github 用户名)/fory 这个项目
- 在本地电脑上使用以下命令: 得到一个 fory 文件夹

```
// ssh
git clone git@github.com:xxxx(你的github用户名)/fory.git
// https
git clone https://github.com/xxxx(你的github用户名)/fory.git
```

### Step2：获取项目代码

- 进入 fory 文件夹，添加 fory 的远程地址

```
git remote add upstream https://github.com/apache/fory.git
```

### Step3：创建分支

- 好了，现在可以开始贡献我们的代码了。fory 默认分支为 main  分支。无论是功能开发、bug 修复、文档编写，都请新建立一个分支，再合并到 main 分支上。使用以下代码创建分支：

```shell
// 创建功能开发分支
git checkout -b feat/xxxx

// 创建问题修复开发分支
git checkout -b fix/xxxx

// 创建文档、demo分支
git checkout -b docs/add-java-demo
```

假设我们创建了文档修改分支 `docs/add-java-demo`

- 假设我们已经添加了一些代码，提交到代码库

- git add .

- git commit -a -m "docs: add java demo and related docs" 。

### Step4：合并修改

- 切换回自己的开发分支:

```
git checkout docs/add-java-demo
```

- 把更新代码提交到自己的分支中:

```
git push origin docs/add-java-demo
```

### Step5：提交 Pull Request

你可以在你的 github 代码仓库页面点击 `Compare & pull request` 按钮。或通过 `contribute` 按钮创建。

- 填写这是什么类型的修改
- 填写关联的 issue
- 若有复杂变更，请说明背景和解决方案

相关信息填写完成后，点击 Create pull request 提交。

## **轻松步入 Fory 开源贡献之旅**

"**good first issue**" 是一个在开源社区常见的标签，这个标签的目的是帮助新贡献者找到适合入门的问题。

Fory 的入门问题，你可以通过 [issue 列表](https://github.com/apache/fory/issues)查看。

如果你当前**有时间和意愿**参与到社区贡献，可以在 issue 里看一看 **good first issue**，选择一个感兴趣、适合自己的认领。

## 拥抱 Apache Fory 社区

在你为 Fory 贡献代码之余，我们鼓励你参与其他让社区更加繁荣的事情，比如：

- 为项目的发展、功能规划 等提建议。
- 创作文章、视频，开办讲座来宣传 Fory。
- 撰写推广计划，同团队一同执行。
