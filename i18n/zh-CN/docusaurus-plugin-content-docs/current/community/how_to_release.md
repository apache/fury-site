---
title: 如何发布
sidebar_position: 0
id: how_to_release
---

本文主要介绍发布经理如何发布 Apache Fory™ 的新版本。

## 简介

源码发布是 Apache 最为重视的环节。

请特别注意许可证和签名问题。发布软件是一件严肃的事情，并会产生法律后果。

## 首次担任发布经理

### 环境要求

本发布流程在 Ubuntu 操作系统上执行，需要以下工具：

- OpenJDK 25+
- Apache Maven 3.6.3+
- Python 3.8+
- GnuPG 2.x
- Git
- SVN（Apache 使用 SVN 托管项目发布版本）
- 可选的软件包发布与验证工具：Node.js LTS 和 npm、通过 rustup 安装的 Rust、Go 1.24+、Dart、.NET SDK 8.0+ 以及 sbt
- 请注意设置环境变量：如果将 GPG 密钥配置在其他目录中，请执行 `export GNUPGHOME=$(xxx)`

### 准备 GPG 密钥

如果您是第一次担任发布经理，需要准备一个 GPG 密钥。

下面提供快速设置步骤。更多详情请参阅 [Apache OpenPGP 文档](https://infra.apache.org/openpgp.html)。

#### 安装 GPG

```bash
sudo apt install gnupg2
```

#### 生成 GPG 密钥

请使用您的 Apache 用户名和电子邮件地址生成密钥。

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

#### 将公钥上传到公共 GPG 密钥服务器

首先，列出您的密钥：

```bash
gpg --list-keys
```

输出类似如下：

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

这里随机选择了 `keys.openpgp.org` 作为密钥服务器，您也可以使用 keyserver.ubuntu.com 或其他功能完整的密钥服务器。

#### 检查密钥是否创建成功

上传大约需要一分钟，之后可以通过相应密钥服务器的电子邮件验证功能进行检查。

将密钥上传到密钥服务器，主要是为了加入[信任网络（Web of Trust）](https://infra.apache.org/release-signing.html#web-of-trust)。

#### 将 GPG 公钥添加到项目的 KEYS 文件

发布分支的 SVN 仓库地址为：https://dist.apache.org/repos/dist/release/fory

请将公钥添加到发布分支的 KEYS 文件中：

```bash
svn co --depth=files https://dist.apache.org/repos/dist/release/fory fory-dist
cd fory-dist
(gpg --list-sigs YOUR_NAME@apache.org && gpg --export --armor YOUR_NAME@apache.org) >> KEYS # Append your key to the KEYS file
svn add .   # It is not needed if the KEYS document exists before.
svn ci -m "add gpg key for YOUR_NAME" # Later on, if you are asked to enter a username and password, just use your apache username and password.
```

#### 将 GPG 公钥上传到您的 GitHub 账户

- 访问 https://github.com/settings/keys 添加您的 GPG 密钥。
- 如果添加后显示 "unverified"，请记得将 GPG 密钥使用的电子邮件地址绑定到您的 GitHub 账户（https://github.com/settings/emails）。

### 延伸阅读

建议在发布前阅读以下文档，以进一步了解 Apache 发布流程，但这不是强制要求：

- 发布政策：https://www.apache.org/legal/release-policy.html
- TLP 发布：https://infra.apache.org/release-distribution
- 发布签名：https://infra.apache.org/release-signing.html
- 发布软件：https://infra.apache.org/release-publishing.html
- 发布下载页面：https://infra.apache.org/release-download-pages.html
- 发布 Maven artifacts：https://infra.apache.org/publishing-maven-artifacts.html

## 发起发布讨论

向 dev@fory.apache.org 发送电子邮件，发起关于下一版本的讨论：

标题：

```
[DISCUSS] Release Apache Fory ${release_version}
```

正文：

```
Hello, Apache Fory Community,

This is a call for a discussion to release Apache Fory version ${release_version}.

The planned change list for this release:

https://github.com/apache/fory/compare/v${previous_release_version}...main

Please leave your comments here about this release plan. We will bump the version in repo and start the release process after the discussion.

Thanks,

${name}
```

## 准备发布

如果讨论结果积极，则需要准备发布 artifacts。

### GitHub 分支和标签

- 创建名为 `releases-${release_version}` 的新分支。也可以运行 `python ci/release.py prepare -v ${release_version}` 来创建分支、更新所有版本并创建准备提交。
- 将版本更新为 `${release_version}`：请执行命令 `python ci/release.py bump_version -l all -version ${release_version}`，但使用 `prepare` 时无需执行。
- 创建 Git 提交并将分支推送到 `git@github.com:apache/fory.git`。
- 使用 `git tag v${release_version}-${rc_version}` 创建新的候选发布标签，然后将其推送到 `git@github.com:apache/fory.git`。
- 如果本次发布包含 `go/fory` 下的 Go 模块，请在投票通过后创建并推送 Go 子模块标签。例如，对于最终的 `${release_version}` 版本：

```bash
git remote add apache git@github.com:apache/fory.git
git tag go/fory/v${release_version}
git push apache go/fory/v${release_version}
```

### 构建 artifacts 并上传到 SVN dist/dev 仓库

首先，执行 `python ci/release.py build -v ${release_version}` 构建源码发布 artifacts。

然后，将其上传到 SVN dist 仓库。dev 分支的 dist 仓库地址为：https://dist.apache.org/repos/dist/dev/fory

```bash
# As this step will copy all the versions, it will take some time. If the network is broken, please use svn cleanup to delete the lock before re-execute it.
svn co https://dist.apache.org/repos/dist/dev/fory fory-dist-dev
```

然后上传 artifacts：

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

访问 https://dist.apache.org/repos/dist/dev/fory/ 检查 artifacts 是否已正确上传。

### 出现问题时如何处理

如果出现非预期文件，请使用 `svn delete` 删除，然后重复上述上传流程。

## 投票

### 检查版本

Fory 发布需要获得 Fory 社区的投票。

- release_version：Fory 的版本，例如 1.0.0。
- release_candidate_version：用于投票的版本，例如 1.0.0-rc1。
- maven_artifact_number：Maven 暂存 artifacts 的编号，例如 1001。可以在 https://repository.apache.org/#stagingRepositories 上搜索 "fory" 找到该编号。

### 构建 Fory 源码并发布到 Nexus

#### 配置 Apache 账户密码

将 Fory 发布到 Nexus 之前，需要安全地配置 Apache 账户凭据。由于密码必须加密，此步骤至关重要。

首先，打开 Maven 全局设置文件 `settings.xml`，该文件通常位于 `~/.m2/settings.xml`。添加或修改以下部分：

```xml

<servers>
    <server>
        <id>apache.snapshots.https</id>
        <username>your-apache-username</username>
        <password>{your-encrypted-password}</password>
    </server>
    <server>
        <id>apache.releases.https</id>
        <username>your-apache-username</username>
        <password>{your-encrypted-password}</password>
    </server>
</servers>
```

**重要说明：**

- 将 `your-apache-username` 替换为您的 Apache LDAP 用户名。
- 密码必须使用 Maven 密码加密工具进行加密。
- 加密后的密码应放在花括号 `{}` 中。

有关详细的加密说明，请参阅官方文档：[发布 Maven Artifacts](https://infra.apache.org/publishing-maven-artifacts.html)

密码加密步骤如下：

1. 生成主密码（如果尚未生成）：

2. ```sh

   mvn --encrypt-master-password your-master-password

   ```

   将输出保存到 `~/.m2/settings-security.xml`：

3. ```xml

   <settingsSecurity>
       <master>{your-encrypted-master-password}</master>
   </settingsSecurity>

   ```

4. 加密您的 Apache 账户密码：

   ```sh

   mvn --encrypt-password your-apache-password

   ```

   将加密后的输出写入 `password` 字段（位于 `settings.xml` 中）。

#### 构建并发布 Java、Kotlin 和 Scala 模块

在仓库根目录运行 JVM 发布命令。默认情况下，它会依次发布 Java、Kotlin 和 Scala：

```sh
python ci/release.py publish_jvm
```

发布脚本会选择 OpenJDK 25 运行时，在正确的模块目录中执行各模块的发布命令，并验证 `fory-core` 的 multi-release 二进制 JAR 和源码 JAR。在 macOS 以外的平台上，请先安装 OpenJDK 25，并在运行命令前设置 `JAVA_HOME` 和 `PATH`。

如需重新运行或逐个发布模块，请使用相应命令：

```sh
python ci/release.py publish_java
python ci/release.py publish_kotlin
python ci/release.py publish_scala
```

单独使用这些命令时，请先发布 Java，并保留在 `java/fory-core/target` 下生成的 artifacts。Kotlin 和 Scala 发布流程需要使用这些 artifacts 完成最终的 `fory-core` 发布 JAR 验证。

#### 在 Nexus 中关闭 Maven 暂存仓库

完成所有模块的发布后，在 Nexus 中执行以下步骤：

1. 登录 Apache Nexus 仓库管理界面。
2. 前往暂存仓库页面。
3. 找到最新的 Fory 暂存仓库，例如 `orgapachefory-1001`。
4. 执行 "Close" 操作，验证所有已上传的 artifacts。
5. 记录暂存仓库 ID，以便写入投票邮件。
6. 在投票通过之前，不要执行 "Release" 操作。

这些步骤可确保所有暂存 artifacts 在社区投票前都已通过验证。

### 构建预发布版本

投票前需要构建一个预发布版本，例如：
https://github.com/apache/fory/releases/tag/v${release_version}-${rc_version}

推送 `v*` 标签会触发 Python、compiler、JavaScript、Rust、Dart 和 C# 基于标签的软件包发布工作流。对于包含 `-` 的候选发布标签，各工作流会在相应生态系统支持的情况下发布预发布或暂存 artifacts，例如将 Python 软件包发布到 TestPyPI，以及为 npm 软件包使用 `next` 标签。开始投票前，请监控所有触发的工作流。

### Fory 社区投票

向 Fory 社区 dev@fory.apache.org 发送电子邮件：

标题：

```
[VOTE] Release Apache Fory v${release_version}-${rc_version}
```

正文：

```
Hello, Apache Fory Community:

This is a call for vote to release Apache Fory
v${release_version}-${rc_version}.

Apache Fory is a blazingly fast multi-language serialization framework
for idiomatic domain objects, schema IDL, and cross-language data
exchange.

The discussion thread:
https://lists.apache.org/thread/xxr3od301g6v3ndj14zqc05byp9qvclh

The change lists about this release:
https://github.com/apache/fory/compare/v${previous_release_version}...v${release_version}-${rc_version}

The release candidates:
https://dist.apache.org/repos/dist/dev/fory/${release_version}-${rc_version}/

The maven staging for this release:
https://repository.apache.org/content/repositories/orgapachefory-${maven_artifact_number}

Git tag for the release:
https://github.com/apache/fory/releases/tag/v${release_version}-${rc_version}

If this release also publishes the Go module, include the Go submodule tag too:
https://github.com/apache/fory/releases/tag/go/fory/v${release_version}

Git commit for the release:
https://github.com/apache/fory/commit/${release_commit}

The artifacts signed with PGP key [${gpg_key_id}], corresponding to
[${apache_email}], that can be found in keys file:
https://downloads.apache.org/fory/KEYS

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

How to Build and Test, please refer to: https://github.com/apache/fory/blob/main/docs/development/index.md


Thanks,
${name}
```

在获得至少 3 票来自 Apache Fory PMC 成员且具有约束力的 +1 票，并且没有否决票后，请先回复上述投票邮件线程，通知投票已经结束。

```
Hi all,

The vote for Release Apache Fory v${release_version}-${rc_version} is closed now.

Thanks to everyone for helping checking and voting for the release.

I will close the vote later in another thread.

Best,
${name}
```

随后立即发起一个新邮件线程，公布投票结果。

标题：

```
[RESULT][VOTE] Release Apache Fory v${release_version}-${rc_version}
```

正文：

```
Hello, Apache Fory Community,

The vote to release Apache Fory v${release_version}-${rc_version} has passed.

The vote PASSED with 3 binding +1 votes and 0 -1 votes:

Binding votes:

- xxx
- yyy
- zzz

Vote thread: ${vote_thread_url}

Thanks,

${name}
```

### 投票失败时如何处理

如果投票失败，请点击 "Drop" 删除暂存的 Maven artifacts。

解决提出的问题，然后递增 `rc_version` 并重新发起投票。

## 正式发布

### 将 artifacts 发布到 SVN 发布目录

- release_version：Fory 的发布版本，例如 1.0.0。
- release_candidate_version：用于投票的版本，例如 1.0.0-rc1。

```bash
svn mv https://dist.apache.org/repos/dist/dev/fory/${release_version}-${rc_version} https://dist.apache.org/repos/dist/release/fory/${release_version} -m "Release fory ${release_version}"
```

发布 release_version 时，如果 https://dist.apache.org/repos/dist/dev/fory/ 仓库中还留有过期的 release_candidate_version，请将其清理，以保持 dev 仓库整洁。

当 `https://archive.apache.org/dist/fory/${release_version}/` 可访问时，即可确认 release_version 已成功发布并归档。此时可以清理发布仓库中的上一发布版本，仅保留当前版本。

### 更新 Fory 和 Fory-Site 内容

向 https://github.com/apache/fory-site 提交 PR 以更新 Fory-Site。
参考实现：[#283](https://github.com/apache/fory-site/pull/283) 和 [#285](https://github.com/apache/fory-site/pull/285)。

#### 更新 Fory-Site

通常需要修改以下关键部分：

1. 编写一则新公告，例如：
   在 blog 目录下添加新的 Markdown 文件：

```
The Apache Fory team is pleased to announce the [?] release. This is a major release that includes [? PR](https://github.com/apache/fory/compare/v[?]...v[?]) from ? distinct contributors. See [Getting Started](https://fory.apache.org/docs/start/) to choose a runtime and install the libraries for your platform.
```

2. 将旧版本号更新为新版本号。
   例如，更新开发分支和最新发布分支的 [Java 配置](https://fory.apache.org/docs/start/java)及其链接的功能指南：

```
<dependency>
 <groupId>org.apache.fory</groupId>
 <artifactId>fory-core</artifactId>
 <version>0.11.2</version>
</dependency>
```

3. 更新下载页面、校验和与签名示例、发布说明链接、current 文档、zh-CN 翻译、versioned docs 快照、`versions.json` 以及 `docusaurus.config.ts` 中的默认文档版本。

#### 更新 Fory

向 https://github.com/apache/fory 提交 PR，更新 [README](https://github.com/apache/fory/blob/main/README.md)、下一开发版本的软件包元数据，以及应指向最新发布版本的面向用户的安装代码片段。

### 在 GitHub 上正式发布

需要在 Fory 项目中正式发布此版本。
参考实现：https://github.com/apache/fory/releases/tag/v${release_version}

投票通过后，根据通过投票的提交创建并推送最终的 `v${release_version}` 标签。此标签会触发 Python、compiler、JavaScript、Rust、Dart 和 C# 的最终软件包发布工作流。发送公告前，请监控每个工作流直至完成。

### 发布 Maven artifacts

- maven_artifact_number：Maven 暂存 artifacts 的编号，例如 1001。
- 打开 https://repository.apache.org/#stagingRepositories。
- 找到 artifact `orgapachefory-${maven_artifact_number}`，点击 "Release"。

### 发送公告

将发布公告发送到 dev@fory.apache.org，并抄送 announce@apache.org。

标题：

```
[ANNOUNCE] Apache Fory ${release_version} released
```

正文：

```
Hi all,

The Apache Fory community is pleased to announce
that Apache Fory ${release_version} is now available.

Apache Fory is a blazingly fast multi-language serialization framework
for idiomatic domain objects, schema IDL, and cross-language data
exchange.

This release includes ${pr_count} PRs from ${contributor_count} contributors.

Highlights in ${release_version} include:

- ...

Release blog, with details and examples:
https://fory.apache.org/blog/fory_${release_version_with_underscores}_release

The release notes are available here:
https://github.com/apache/fory/releases/tag/v${release_version}

For the complete list of changes:
https://github.com/apache/fory/compare/v${previous_release_version}...v${release_version}

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

请使用纯文本而不是富文本格式，否则抄送 announce@apache.org 时邮件可能会被拒收。

完成以上步骤后，Fory 发布流程至此结束。
