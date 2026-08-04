---
title: 如何验证
sidebar_position: 0
id: how_to_verify
---

## 下载候选版本

```bash
#If there is svn locally, you can clone to the local
svn co https://dist.apache.org/repos/dist/dev/fory/${release_version}-${rc_version}/
# You can download the material file directly
wget https://dist.apache.org/repos/dist/dev/fory/${release_version}-${rc_version}/xxx.xxx
```

## 验证校验和与签名

首先需要安装 gpg：

```bash
apt-get install gnupg
# or
yum install gnupg
# or
brew install gnupg
```

然后导入 Fory 发布经理的公钥：

```bash
curl https://downloads.apache.org/fory/KEYS > KEYS # Download KEYS
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

如果出现类似以下内容，则表示签名正确：

```bash
apache-fory-0.12.0-src.tar.gz
gpg: Signature made Wed 17 Apr 2024 11:49:45 PM CST using RSA key ID 5E580BA4
gpg: checking the trustdb
gpg: 3 marginal(s) needed, 1 complete(s) needed, PGP trust model
gpg: depth: 0  valid:   1  signed:   0  trust: 0-, 0q, 0n, 0m, 0f, 1u
gpg: Good signature from "chaokunyang (CODE SIGNING KEY) <chaokunyang@apache.org>"
```

然后验证校验和：

```bash
for i in *.tar.gz; do echo $i; sha512sum --check  $i.sha512*; done
```

输出应类似于：

```bash
apache-fory-0.12.0-src.tar.gz
apache-fory-0.12.0-src.tar.gz: OK
```

快速完成上述验证的方法是：

```bash
curl -s https://raw.githubusercontent.com/apache/fory/main/ci/release.py | python3 - verify -v 0.5.0
```

## 检查源代码包的文件内容

解压 `apache-fory-${release_version}-${rc_version}-src.tar.gz`，并检查以下内容：

- LICENSE 和 NOTICE 文件对于该仓库是正确的。
- 所有需要许可证头的文件都带有 ASF 许可证头。
- 可以正常构建。

## 检查 fory-java 的 Maven 制品

从 https://repository.apache.org/content/repositories/orgapachefory-${maven_artifact_number}/ 下载制品。

可以检查以下内容：

- JAR 的校验和与随附的校验和文件一致。
- JAR 的签名与随附的签名文件一致。
- JAR 可以在本地复现。这意味着您可以在自己的计算机上构建 JAR，并验证其校验和与随附制品的校验和相同。
