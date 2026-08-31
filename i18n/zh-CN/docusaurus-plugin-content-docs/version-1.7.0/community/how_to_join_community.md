---
title: 如何加入 Apache Fory™
sidebar_position: 0
id: how_to_join_community
---

首先，为您选择加入开源贡献者行列点赞。其次，非常感谢您选择参与 Fory 社区，并为这个开源项目贡献力量。

## Fory 贡献指南

Fory 团队通常在 GitHub 上进行开发和维护 Issue。请打开 [GitHub 网站](https://github.com/)，点击右上角的 `Sign up` 按钮，注册自己的账号，迈出开源之旅的第一步。

在 [Fory 仓库](https://github.com/apache/fory)中，我们为所有开源贡献者准备了一份[指南](https://fory.apache.org/zh-CN/docs/community/)，其中介绍了版本管理和分支管理等内容。**请花几分钟时间阅读并理解它**。

## 您的第一个 Pull Request

### 第 0 步：安装 Git

Git 是一种版本控制系统，用于跟踪和管理软件开发项目中的代码变更。它可以帮助开发者记录和管理代码历史，便于团队协作、代码版本控制、代码合并等操作。借助 Git，您可以跟踪每个文件的各个版本，并轻松切换和比较不同版本。Git 还提供分支管理功能，允许同时开展多个并行开发任务。

- 访问 Git 官方网站：[https://git-scm.com/] (https://git-scm.com/)
- 下载最新版本的 Git 安装程序。
- 运行下载的安装程序，并按照安装向导的提示完成安装。
- 安装完成后，可以在命令行中使用 `git version` 命令确认是否安装成功。

### 第 1 步：Fork 项目

- 首先，您需要 Fork 此项目。进入 [Fory 项目页面](https://github.com/apache/fory)，然后点击右上角的 Fork 按钮。
- 在您的 GitHub 账号中，将会出现 xxxx（您的 GitHub 用户名）/fory 项目。
- 在本地计算机上，使用以下命令获取 fory 文件夹：

```
// ssh
git clone git@github.com:xxxx (your GitHub username)/fory.git
// https
git clone https://github.com/xxxx (your GitHub username)/fory.git
```

### 第 2 步：获取项目代码

- 进入 fory 文件夹，并添加 fory 的远程地址：

```
git remote add upstream https://github.com/apache/fory.git
```

### 第 3 步：创建分支

- 现在，您可以开始贡献代码了。Fory 的默认分支是 main 分支。无论是开发功能、修复 Bug 还是编写文档，请先创建新分支，再将其合并到 main 分支。使用以下代码创建分支：

```
// Create a function development branch
git checkout -b feat/xxxx

// Create a problem-fixing development branch
git checkout -b fix/xxxx

// Create a documentation, demo branch
git checkout -b docs/add-java-demo
```

假设我们已创建文档修改分支 `docs/add-java-demo`，添加了一些代码并将其提交到了代码仓库。

- `git add .`
- `git commit -a -m "docs: add java demo and related docs"`

### 第 4 步：合并修改

- 切换回您的开发分支：

```
git checkout docs/add-java-demo
```

- 将更新后的代码提交到您的分支：

```
git push origin docs/add-java-demo
```

### 第 5 步：提交 Pull Request

您可以在 GitHub 代码仓库页面点击 `Compare & pull request` 按钮，也可以通过 `contribute` 按钮创建。

- 填写此次修改的类型。
- 填写关联的 Issue。
- 如果变更较为复杂，请说明背景和解决方案。

填写相关信息后，点击 Create pull request 提交。

## **轻松开启 Fory 开源贡献之旅**

“**good first issue**”是开源社区中的常见标签，目的是帮助新贡献者找到适合入门的 Issue。

您可以通过 [Issue 列表](https://github.com/apache/fory/issues)查看 Fory 的入门 Issue。

如果您目前**有时间也有意愿**参与社区贡献，可以查看 Issue 中的 **good first issue**，选择一个自己感兴趣且适合认领的 Issue。

## 融入 Apache Fory™ 社区

在为 Fory 贡献代码的同时，我们也鼓励您参与其他有助于社区繁荣的活动，例如：

- 为项目发展、功能规划等提出建议。
- 创作文章和视频，举办讲座来推广 Fory。
- 编写推广计划，并与团队共同执行。
