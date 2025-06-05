---
title: 如何验证 Apache Fory
sidebar_position: 0
id: how_to_verify
---

详细的 Check list，请参阅[Apache 检查清单](https://cwiki.apache.org/confluence/display/INCUBATOR/Incubator+Release+Checklist)

## 下载 Apache Fory

```bash
# If there is svn locally, you can clone to the local
svn co https://dist.apache.org/repos/dist/dev/incubator/fory/${release_version}-${rc_version}/
# You can download the material file directly
wget https://dist.apache.org/repos/dist/dev/incubator/fory/${release_version}-${rc_version}/xxx.xxx
```

## 验证 checksums 和 signatures

首先，您需要安装 gpg：

```bash
apt-get install gnupg
# or
yum install gnupg
# or
brew install gnupg
```

之后，导入 Apache Fory release manager 的公钥：

```bash
curl https://downloads.apache.org/incubator/fory/KEYS > KEYS # Download KEYS
gpg --import KEYS # Import KEYS to local
# Then, trust the public key:
gpg --edit-key <KEY-used-in-this-version> # Edit the key(mentioned in vote email)
# It will enter the interactive mode, use the following command to trust the key:
gpg (GnuPG) 2.0.22; Copyright (C) 2013 Free Software Foundation, Inc.
This is free software: you are free to change and redistribute it.
There is NO WARRANTY, to the extent permitted by law.


pub  4096R/5E580BA4  created: 2024-03-27  expires: never       usage: SC
                     trust: unknown       validity: unknown
sub  4096R/A31EF728  created: 2024-03-27  expires: never       usage: E
[ unknown] (1). chaokunyang (CODE SIGNING KEY) <chaokunyang@apache.org>

gpg> trust
pub  4096R/5E580BA4  created: 2024-03-27  expires: never       usage: SC
                     trust: unknown       validity: unknown
sub  4096R/A31EF728  created: 2024-03-27  expires: never       usage: E
[ unknown] (1). chaokunyang (CODE SIGNING KEY) <chaokunyang@apache.org>

Please decide how far you trust this user to correctly verify other users' keys
(by looking at passports, checking fingerprints from different sources, etc.)

  1 = I don't know or won't say
  2 = I do NOT trust
  3 = I trust marginally
  4 = I trust fully
  5 = I trust ultimately
  m = back to the main menu

Your decision? 5
Do you really want to set this key to ultimate trust? (y/N) y

pub  4096R/5E580BA4  created: 2024-03-27  expires: never       usage: SC
                     trust: ultimate      validity: unknown
sub  4096R/A31EF728  created: 2024-03-27  expires: never       usage: E
[ unknown] (1). chaokunyang (CODE SIGNING KEY) <chaokunyang@apache.org>
Please note that the shown key validity is not necessarily correct
unless you restart the program.
```

接下来验证签名：

```bash
for i in *.tar.gz; do echo $i; gpg --verify $i.asc $i; done
```

如果出现如下内容，则表示签名正确：

```bash
apache-fory-incubating-0.5.0-src.tar.gz
gpg: Signature made Wed 17 Apr 2024 11:49:45 PM CST using RSA key ID 5E580BA4
gpg: checking the trustdb
gpg: 3 marginal(s) needed, 1 complete(s) needed, PGP trust model
gpg: depth: 0  valid:   1  signed:   0  trust: 0-, 0q, 0n, 0m, 0f, 1u
gpg: Good signature from "chaokunyang (CODE SIGNING KEY) <chaokunyang@apache.org>"
```

然后验证 checksum：

```bash
for i in *.tar.gz; do echo $i; sha512sum --check  $i.sha512; done
```

它应该输出如下内容：

```bash
apache-fory-incubating-0.5.0-src.tar.gz
apache-fory-incubating-0.5.0-src.tar.gz: OK
```

## 检查源码包中的文件

解压缩 `apache-fory-${release_version}-${rc_version}-src.tar.gz` 并检查以下内容：

- 此存储库 LICENSE 和 NOTICE 文件是正确的；
- 如有必要，所有文件都有 ASF 许可证标头；
- 项目构建通过。

## 检查 fory-java 的 Maven artifacts

下载 Apache Fory：https://repository.apache.org/content/repositories/orgapachefory-${maven_artifact_number}/.

您可以检查以下内容：

- JAR 的 Checksum 与项目绑定的 checksum 文件一致。
- JAR 的 signature 与项目绑定的 signature 文件一致。
- JAR 在本地是可重复的。这意味着您可以在计算机上构建 JAR，并验证 checksum 和与项目绑定的相同。
