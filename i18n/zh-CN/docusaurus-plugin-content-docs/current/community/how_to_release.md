---
title: 如何发布
sidebar_position: 0
id: how_to_release
---

本文主要介绍如何发布新版本的 Apache Fory。

## 介绍

源代码发布是 Apache 最重视以及最重要的部分。

请注意许可证和发布的软件签名问题。发布软件是一件严肃的事情，并会产生相应的法律后果。

## release manager 第一次发布

### 环境要求

此发布过程在 Ubuntu 系统中运行，需要以下几个环境依赖：

- JDK 1.8+
- Apache Maven 3.x+
- Python 3.8
- GnuPG 2.x
- Git
- SVN（Apache 基金会使用 svn 来托管项目发布）
- **设置环境变量**：如果您在不同的目录下配置了 gpg 密钥，请执行 `export GNUPGHOME=$(xxx)` 导出环境变量。

### 准备 GPG 密钥

如果您是第一次作为软件发布者，您需要准备一个 GPG 密钥。

您可以参考这里的[快速开始](https://infra.apache.org/openpgp.html)获取一个 GPG 密钥或者获取更多相关信息。

#### 安装 GPG

```bash
sudo apt install gnupg2
```

#### 生成 GPG 密钥

请使用您的 Apache 名字和电子邮件地址生成 GPG 密钥：

```bash
$ gpg --full-gen-key
gpg (GnuPG) 2.2.20; Copyright (C) 2020 Free Software Foundation, Inc.
This is free software: you are free to change and redistribute it.
There is NO WARRANTY, to the extent permitted by law.

Please select what kind of key you want:
   (1) RSA and RSA (default)
   (2) DSA and Elgamal
   (3) DSA (sign only)
   (4) RSA (sign only)
  (14) Existing key from card
Your selection? 1 # input 1
RSA keys may be between 1024 and 4096 bits long.
What keysize do you want? (2048) 4096 # input 4096
Requested keysize is 4096 bits
Please specify how long the key should be valid.
         0 = key does not expire
      <n>  = key expires in n days
      <n>w = key expires in n weeks
      <n>m = key expires in n months
      <n>y = key expires in n years
Key is valid for? (0) 0 # input 0
Key does not expire at all
Is this correct? (y/N) y # input y

GnuPG needs to construct a user ID to identify your key.

Real name: Chaokun Yang                   # input your name
Email address: chaokunyang@apache.org     # input your email
Comment: CODE SIGNING KEY                 # input some annotations, optional
You selected this USER-ID:
    "Chaokun <chaokunyang@apache.org>"

Change (N)ame, (C)omment, (E)mail or (O)kay/(Q)uit? O # input O
We need to generate a lot of random bytes. It is a good idea to perform
some other action (type on the keyboard, move the mouse, utilize the
disks) during the prime generation; this gives the random number
generator a better chance to gain enough entropy.
We need to generate a lot of random bytes. It is a good idea to perform
some other action (type on the keyboard, move the mouse, utilize the
disks) during the prime generation; this gives the random number
generator a better chance to gain enough entropy.

# Input the security key
┌──────────────────────────────────────────────────────┐
│ Please enter this passphrase                         │
│                                                      │
│ Passphrase: _______________________________          │
│                                                      │
│       <OK>                              <Cancel>     │
└──────────────────────────────────────────────────────┘
# key generation will be done after your inputting the key with the following output
gpg: key E49B00F626B marked as ultimately trusted
gpg: revocation certificate stored as '/Users/chaokunyang/.gnupg/openpgp-revocs.d/1E2CDAE4C08AD7D694D1CB139D7BE8E45E580BA4.rev'
public and secret key created and signed.

pub   rsa4096 2022-07-12 [SC]
      1E2CDAE4C08AD7D694D1CB139D7BE8E45E580BA4
uid           [ultimate] Chaokun <chaokunyang@apache.org>
sub   rsa4096 2022-07-12 [E]
```

#### 上传公钥至 GPG 密钥服务器

首先，列出您所创建的 GPG 密钥：

```bash
gpg --list-keys
```

执行相关命令之后，您将看到如下输出：

```bash
--------------------------------------------------
pub   rsa4096 2024-03-27 [SC]
      1E2CDAE4C08AD7D694D1CB139D7BE8E45E580BA4
uid           [ultimate] chaokunyang (CODE SIGNING KEY) <chaokunyang@apache.org>
sub   rsa4096 2024-03-27 [E]
```

然后，将您的密钥 ID 发送到密钥服务器：

```bash
gpg --keyserver keys.openpgp.org --send-key <key-id> # e.g., 1E2CDAE4C08AD7D694D1CB139D7BE8E45E580BA4
```

其中，`keys.openpgp.org` 是一个随机选择的密钥服务器，可以使用 keyserver.ubuntu.com 或任何其他功能完备的密钥服务器。

#### 检查密钥是否创建成功

上传大约需要一分钟；之后，您可以通过电子邮件在相应的密钥服务器上检查。

将密钥上传到密钥服务器的主要目的是为了加入一个可信的[信任网络](https://infra.apache.org/release-signing.html#web-of-trust)。

#### 将 GPG 公钥添加到项目 KEYS 文件中

发布分支的 svn 仓库是：https://dist.apache.org/repos/dist/release/incubator/fory

请在发布分支的 KEYS 中添加公钥：

```bash
svn co https://dist.apache.org/repos/dist/release/incubator/fory fory-dist
# As this step will copy all the versions, it will take some time. If the network is broken, please use svn cleanup to delete the lock before re-execute it.
cd fory-dist
(gpg --list-sigs YOUR_NAME@apache.org && gpg --export --armor YOUR_NAME@apache.org) >> KEYS # Append your key to the KEYS file
svn add .   # It is not needed if the KEYS document exists before.
svn ci -m "add gpg key for YOUR_NAME" # Later on, if you are asked to enter a username and password, just use your apache username and password.
```

#### 将 GPG 公钥上传到您的 GitHub 帐户

- 输入 `https://github.com/settings/keys` 以添加您的 GPG 密钥。
- 如果添加后发现“未验证”字样，请将 GPG 密钥中使用的电子邮件地址绑定到您的 GitHub 帐户（https://github.com/settings/emails）。

### 延伸阅读

建议您在发布之前阅读以下文档，了解有关 Apache 基金会发布软件的更多详细信息，但这不是必须的：

- 发布政策：https://www.apache.org/legal/release-policy.html
- 孵化器发布：http://incubator.apache.org/guides/releasemanagement.html
- TLP 版本：https://infra.apache.org/release-distribution
- 发布标志：https://infra.apache.org/release-signing.html
- 发布发布：https://infra.apache.org/release-publishing.html
- 发布下载页面：https://infra.apache.org/release-download-pages.html
- 发布 maven artifacts：https://infra.apache.org/publishing-maven-artifacts.html

## 开始有关发布的讨论

通过发送电子邮件至以下地址发起有关下一个版本的讨论：dev@fory.apache.org：

标题：

```
[DISCUSS] Release Apache Fory(incubating) ${release_version}
```

内容：

```
Hello, Apache Fory(incubating) Community,

This is a call for a discussion to release Apache Fory(incubating) version ${release_version}.

The change lists about this release:

https://github.com/apache/fory/compare/v0.4.1...v0.5.0

Please leave your comments here about this release plan. We will bump the version in repo and start the release process after the discussion.

Thanks,

${name}
```

## 准备发布

如果讨论结果中没有出现反对声音，您需要做一些发布版本的准备工作。

### Github 分支和标签

- 创建一个名为 `releases-0.5.0`
- 通过执行命令将版本 `$version` 升级到 `python ci/release.py bump_version -l all -version $version`
- 执行 git commit 并将分支推送到 `git@github.com:apache/fory.git`
- 通过 `git tag v0.5.0-rc1` 创建一个新标签，然后将其推送到 `git@github.com:apache/fory.git`

### 构建 artifacts 并上传到 SVN dist/dev 仓库

首先，您需要通过 `python ci/release.py build -v $version` 构建预发布 artifacts。

然后您需要把它上传到 svn dist repo。dev 分支的 dist 仓库地址是：https://dist.apache.org/repos/dist/dev/incubator/fory

```bash
# As this step will copy all the versions, it will take some time. If the network is broken, please use svn cleanup to delete the lock before re-execute it.
svn co https://dist.apache.org/repos/dist/dev/incubator/fory fory-dist-dev
```

然后，上传项目：

```bash
cd fory-dist-dev
# create a directory named by version
mkdir ${release_version}-${rc_version}
# copy source code and signature package to the versioned directory
cp ${repo_dir}/dist/* ${release_version}-${rc_version}
# check svn status
svn status
# add to svn
svn add ${release_version}-${rc_version}
# check svn status
svn status
# commit to SVN remote server
svn commit -m "Prepare for fory ${release_version}-${rc_version}"
```

访问 https://dist.apache.org/repos/dist/dev/incubator/fory/ 以检查 artifacts 是否正确上传。

### 如果出现问题该怎么办

如果某些文件是意外出现或者发生某些错误，则需要删除相关内容并执行 `svn delete`，然后重复上述上传过程。

## 投票

作为一个孵化项目，新版本发布需要 Apache Fory 社区和孵化器社区的投票。

- release_version：Fory 的版本，如 0.5.0。
- release_candidate_version：投票的版本，如 0.5.0-rc1。
- maven_artifact_number：Maven 暂存 artifacts 的数量。如 1001. 具体来说，可以通过搜索 “fory” 来找到 maven_artifact_number https://repository.apache.org/#stagingRepositories.

### Fory 社区投票

发送电子邮件至 Fory Community：dev@fory.apache.org：

标题：

```
[VOTE] Release Apache Fory(incubating) v${release_version}-${rc_version}
```

内容：

```
Hello, Apache Fory(incubating) Community:

This is a call for vote to release Apache Fory(Incubating)
version release-0.5.0-rc3.

Apache Fory(incubating) - A blazingly fast multi-language serialization
framework powered by JIT and zero-copy.

The change lists about this release:

https://github.com/apache/fory/compare/v0.4.1...v0.5.0-rc3

The release candidates:
https://dist.apache.org/repos/dist/dev/incubator/fory/0.5.0-rc3/

The maven staging for this release:
https://repository.apache.org/content/repositories/orgapachefory-1003

Git tag for the release:
https://github.com/apache/fory/releases/tag/v0.5.0-rc3

Git commit for the release:
https://github.com/apache/fory/commit/fae06330edd049bb960536e978a45b97bca66faf

The artifacts signed with PGP key [5E580BA4], corresponding to
[chaokunyang@apache.org], that can be found in keys file:
https://downloads.apache.org/incubator/fory/KEYS

The vote will be open for at least 72 hours until the necessary number of votes are reached.

Please vote accordingly:

[ ] +1 approve
[ ] +0 no opinion
[ ] -1 disapprove with the reason

To learn more about Fory, please see https://fory.apache.org/

*Valid check is a requirement for a vote. *Checklist for reference:

[ ] Download Fory is valid.
[ ] Checksums and PGP signatures are valid.
[ ] Source code distributions have correct names matching the current release.
[ ] LICENSE and NOTICE files are correct.
[ ] All files have license headers if necessary.
[ ] No compiled archives bundled in source archive.
[ ] Can compile from source.

More detail checklist please refer:
https://cwiki.apache.org/confluence/display/INCUBATOR/Incubator+Release+Checklist

How to Build and Test, please refer to: https://github.com/apache/fory/blob/main/docs/guide/DEVELOPMENT.md

Thanks,
Chaokun Yang
```

在至少获得 3 + 1 且具有约束力的投票（来自 Fory Podling PMC 成员和提交者）并没有收到否决票之后，发布投票结果：

标题：

```
[RESULT][VOTE] Release Apache Fory(incubating) v${release_version}-${rc_version}
```

内容：

```
Hello, Apache Fory(incubating) Community,

The vote to release Apache Fory(Incubating) v${release_version}-${rc_version} has passed.

The vote PASSED with 3 binding +1 and 0 -1 vote:

Binding votes:

- xxx
- yyy
- zzz

Vote thread: ${vote_thread_url}

Thanks,

${name}
```

### 孵化器社区投票

发送电子邮件至：general@incubator.apache.org：

标题：

```
[VOTE] Release Apache Fory(incubating) v${release_version}-${rc_version}
```

内容：

```
Hello everyone,

This is a call for the vote to release Apache Fory(Incubating) v${release_version}-${rc_version}.

The Apache Fory community has voted and approved the release of Apache
Fory(incubating) v${release_version}-${rc_version}. We now kindly request the IPMC members
review and vote for this release.

Apache Fory(incubating) - A blazingly fast multi-language serialization
framework powered by JIT and zero-copy.

Fory community vote thread:
${community_vote_thread_url}

Vote result thread:
${community_vote_result_thread_url}

The release candidate:
https://dist.apache.org/repos/dist/dev/incubator/fory/${release_version}-${rc_version}/

This release has been signed with a PGP available here:
https://downloads.apache.org/incubator/fory/KEYS

Git tag for the release:
https://github.com/apache/fory/releases/tag/v${release_version}-${rc_version}/

Git commit for the release:
https://github.com/apache/fory/commit/$xxx

Maven staging repo:
https://repository.apache.org/content/repositories/orgapachefory-${maven_artifact_number}/

How to Build and Test, please refer to:
https://github.com/apache/fory/blob/main/docs/guide/DEVELOPMENT.md

Please download, verify, and test.

The VOTE will pass after 3 binding approve.

[ ] +1 approve
[ ] +0 no opinion
[ ] -1 disapprove with the reason

To learn more about apache fory, please see https://fory.apache.org/

Checklist for reference:

[ ] Download links are valid.
[ ] Checksums and signatures.
[ ] LICENSE/NOTICE files exist
[ ] No unexpected binary files
[ ] All source files have ASF headers
[ ] Can compile from source

Thanks,

${name}
```

至少 72 小时后，至少有 3 + 1 具有约束力的投票（来自孵化器 PMC 成员）且没有否决票，发布投票结果：

标题：

```
[RESULT][VOTE] Release Apache Fory(incubating) v${release_version}-${rc_version}
```

内容：

```
Hi Incubator PMC,

The vote to release Apache Fory(incubating) v${release_version}-${rc_version} has passed with
4 +1 binding and 3 +1 non-binding votes, no +0 or -1 votes.

Binding votes：

- xxx
- yyy
- zzz

Non-Binding votes:

- aaa

Vote thread: ${incubator_vote_thread_url}

Thanks for reviewing and voting for our release candidate.

We will proceed with publishing the approved artifacts and sending out the announcement soon.
```

### 如果投票失败怎么办

如果投票失败，请单击“删除”以删除暂存的 Maven artifacts。

解决提出的问题，然后再次提出 `rc_version` 的新投票。

## 官方发布

### 将 artifacts 发布到 SVN 发布目录

- release_version：Fory 的发布版本，如 0.5.0
- release_candidate_version：投票版本，如 0.5.0-rc1

```bash
svn mv https://dist.apache.org/repos/dist/dev/incubator/fory/${release_version}-${rc_version} https://dist.apache.org/repos/dist/release/incubator/fory/${release_version} -m "Release fory ${release_version}"
```

### 更改 Fory 网站下载链接

提交 PR 到 https://github.com/apache/fory-site 仓库更新 Fory 版本，[下载页面](https://fory.apache.org/download)

### 发布 Maven artifacts

- maven_artifact_number：Maven 暂存 artifacts 的数量。如 1001。
- 打开https://repository.apache.org/#stagingRepositories.
- 找到 artifacts `orgapachefory-${maven_artifact_number}`，点击“发布”。

### 发送公告

将发布公告发送给 dev@fory.apache.org 并且抄送给 announce@apache.org。

标题：

```
[ANNOUNCE] Release Apache Fory(incubating) ${release_version}
```

内容：

```
Hi all,

The Apache Fory(incubating) community is pleased to announce
that Apache Fory(incubating) {release_version} has been released!

Apache Fory(incubating) - A blazingly fast multi-language serialization
framework powered by JIT and zero-copy.

The release notes are available here:
https://github.com/apache/fory/releases/tag/v${release_version}

For the complete list of changes:
https://github.com/apache/fory/compare/v0.5.0...v${release_version}

Apache Fory website: https://fory.apache.org/

Download Links: https://fory.apache.org/download

Fory Resources:
- Fory github repo: https://github.com/apache/fory
- Issue: https://github.com/apache/fory/issues
- Mailing list: dev@fory.apache.org

We are looking to grow our community and welcome new contributors. If
you are interested in contributing to Fory, please contact us on the
mailing list or on GitHub. We will be happy to help you get started.

------------------
Best Regards,
${your_name}
```

至此，整个发布流程结束。
