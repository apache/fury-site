---
title: 如何加入Fury
sidebar_position: 0
id: how_to_join_community
---

首先，为你选择加入开源贡献者的行列点赞。其次，我们非常感激你选择参与Fury社区，为这个开源项目贡献力量。

## Fury贡献指南

Fury团队通常在GitHub上进行开发和issue维护，请打开[GitHub官网](https://github.com/)，点击右上角的`Sign up`按钮，注册自己的账号，迈出你开源之旅的第一步。

在[Fury仓库](https://github.com/apache/fury)中，我们有一份面向所有开源贡献者的[指南](https://fury.apache.org/zh-CN/docs/community/)，介绍了版本管理、分支管理等内容。**请花几分钟时间阅读并理解它**。

## 你的第一个Pull Request

### 第0步：安装Git

Git是一种版本控制系统，用于跟踪和管理软件开发项目中的代码变更。它帮助开发者记录和管理代码的历史，便于团队协作、代码版本控制、代码合并等操作。通过Git，你可以跟踪每个文件的每个版本，并轻松在不同版本之间切换和比较。Git还提供了分支管理功能，允许多个并发开发任务同时进行。

- 访问Git官方网站：[https://git-scm.com/](https://git-scm.com/)
- 下载最新版本的Git安装程序。
- 运行下载的安装程序，按照安装向导的提示进行安装。
- 安装完成后，可以在命令行中使用`git version`命令确认安装成功。

### 第1步：Fork项目

- 首先，你需要fork这个项目。进入[Fury项目页面](https://github.com/apache/fury)，点击右上角的Fork按钮。
- 在你的GitHub账号中，会出现项目xxxx（你的GitHub用户名）/fury。
- 在你的本地电脑上，使用以下命令获取一个fury文件夹：

```
// ssh
git clone git@github.com:xxxx（你的GitHub用户名）/fury.git
// https
git clone https://github.com/xxxx（你的GitHub用户名）/fury.git
```

### 第2步：获取项目代码

- 进入fury文件夹，添加fury的远程地址：

```
git remote add upstream https://github.com/apache/fury.git
```

### 第3步：创建分支

- 好了，现在你可以开始贡献我们的代码了。Fury的默认分支是main分支。无论是功能开发、问题修复还是文档编写，都请新建一个分支，再合并到main分支。使用以下代码创建分支：

```
// 创建功能开发分支
git checkout -b feat/xxxx

// 创建问题修复开发分支
git checkout -b fix/xxxx

// 创建文档、demo分支
git checkout -b docs/add-java-demo
```

假设我们创建了文档修改分支`docs/add-java-demo`，我们添加了一些代码并提交到代码仓库。

- `git add .`
- `git commit -a -m "docs: add java demo and related docs"`

### 第4步：合并修改

- 切换回你的开发分支：

```
git checkout docs/add-java-demo
```

- 将更新的代码提交到你的分支：

```
git push origin docs/add-java-demo
```

### 第5步：提交Pull Request

你可以点击GitHub代码仓库页面上的`Compare & pull request`按钮。或者通过`contribute`按钮创建。

- 填写本次修改是什么类型的修改。
- 填写关联的issue。
- 如果有复杂的变更，请说明背景和解决方案。

填写完相关信息后，点击Create pull request提交。

## **轻松迈入Fury开源贡献之旅**

"**good first issue**"是开源社区中常见的标签，这个标签的目的是帮助新的贡献者找到适合他们的入门级问题。

Fury的入门级问题可以通过[issue列表](https://github.com/apache/fury/issues)查看。

如果你目前**有时间并且愿意**参与社区贡献，可以看看issues中的**good first issue**，选择一个你感兴趣并且适合你认领的问题。

## 拥抱Apache Fury社区

在你为Fury贡献代码的同时，我们鼓励你参与其他让社区更加繁荣的事情，比如：

- 为项目的发展、功能规划等提出建议。
- 撰写文章、制作视频、举办讲座来推广Fury。
- 编写推广计划，与团队一起执行。