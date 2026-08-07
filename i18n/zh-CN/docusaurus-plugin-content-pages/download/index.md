---
id: download
title: 下载
---

Apache Fory™ 的官方发布以源码制品形式提供。

如需二进制安装，请参见 Apache Fory™ [快速开始](/zh-CN/docs/start/)文档。

## 最新版本

当前最新源码版本为 1.6.0：

| 版本  | 日期       | 源码                                                                                                                                                                                                                                                                                | 发布说明                                                        |
| ----- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| 1.6.0 | 2026-08-07 | [source](https://www.apache.org/dyn/closer.lua/fory/1.6.0/apache-fory-1.6.0-src.tar.gz?action=download) [asc](https://downloads.apache.org/fory/1.6.0/apache-fory-1.6.0-src.tar.gz.asc) [sha512](https://downloads.apache.org/fory/1.6.0/apache-fory-1.6.0-src.tar.gz.sha512) | [release notes](https://github.com/apache/fory/releases/tag/v1.6.0) |

## 所有归档版本

如需更早版本，请访问 [archive](https://archive.apache.org/dist/fory)。

## 验证发布文件

强烈建议对下载的文件进行校验。

Fory 为下载站点上的所有文件提供 SHA 摘要和 PGP 签名文件。
这些文件与对应制品同名，仅额外带有 `.sha512` 或 `.asc` 扩展名。

### 校验 Checksum

要验证 SHA 摘要，你需要 `.tar.gz` 文件及其对应的 `.tar.gz.sha512` 文件。示例命令如下：

```bash
sha512sum --check apache-fory-1.6.0-src.tar.gz.sha512
```

输出类似下面这样即表示校验通过：

```bash
apache-fory-1.6.0-src.tar.gz: OK
```

### 校验签名

要验证 PGP 签名，首先需要下载 [release KEYS](https://downloads.apache.org/fory/KEYS)。

然后导入下载得到的 `KEYS`：

```bash
gpg --import KEYS
```

之后可以校验签名：

```bash
gpg --verify apache-fory-1.6.0-src.tar.gz.asc apache-fory-1.6.0-src.tar.gz
```

如果出现如下输出，即表示签名正确：

```bash
gpg: Signature made Tue Aug  4 14:27:34 2026 CST
gpg:                using RSA key 1E2CDAE4C08AD7D694D1CB139D7BE8E45E580BA4
gpg: Good signature from "chaokunyang (CODE SIGNING KEY) <chaokunyang@apache.org>" [unknown]
```

你还应通过如下命令进一步校验该密钥：

```bash
gpg --fingerprint 1E2CDAE4C08AD7D694D1CB139D7BE8E45E580BA4
```

输出应类似：

```bash
pub   rsa4096 2024-03-27 [SC]
      1E2C DAE4 C08A D7D6 94D1  CB13 9D7B E8E4 5E58 0BA4
uid           [ unknown] chaokunyang (CODE SIGNING KEY) <chaokunyang@apache.org>
sub   rsa4096 2024-03-27 [E]
```
