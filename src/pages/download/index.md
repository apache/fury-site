---
id: download
title: Apache Fory™ Download
---

The official Apache Fory™ releases are provided as source artifacts.

For binary install, please see the Apache Fory™ [getting started](/docs/start/) documentation.

## The latest release

The latest source release is 1.7.0:

| Version | Date       | Source                                                                                                                                                                                                                                                                              | Release Notes                                                        |
| ------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| 1.7.0   | 2026-08-28 | [source](https://www.apache.org/dyn/closer.lua/fory/1.7.0/apache-fory-1.7.0-src.tar.gz?action=download) [asc](https://downloads.apache.org/fory/1.7.0/apache-fory-1.7.0-src.tar.gz.asc) [sha512](https://downloads.apache.org/fory/1.7.0/apache-fory-1.7.0-src.tar.gz.sha512) | [release notes](https://github.com/apache/fory/releases/tag/v1.7.0) |

## All archived releases

For older releases, please check the [archive](https://archive.apache.org/dist/fory).

## Verify a release

It's highly recommended to verify the files that you download.

Fory provides SHA digest and PGP signature files for all the files that we host on the download site.
These files are named after the files they relate to but have `.sha512/.asc` extensions.

### Verifying Checksums

To verify the SHA digests, you need the `.tar.gz` file and its associated `.tar.gz.sha512` file. An example command:

```bash
sha512sum --check apache-fory-1.7.0-src.tar.gz.sha512
```

It should output something like:

```bash
apache-fory-1.7.0-src.tar.gz: OK
```

### Verifying Signatures

To verify the PGP signatures, you will need to download the
[release KEYS](https://downloads.apache.org/fory/KEYS) first.

Then import the downloaded `KEYS`:

```bash
gpg --import KEYS
```

Then you can verify signature:

```bash
gpg --verify apache-fory-1.7.0-src.tar.gz.asc apache-fory-1.7.0-src.tar.gz
```

If something like the following appears, it means the signature is correct:

```bash
gpg: Signature made Tue Aug 25 18:38:25 2026 CST
gpg:                using RSA key 1E2CDAE4C08AD7D694D1CB139D7BE8E45E580BA4
gpg: Good signature from "chaokunyang (CODE SIGNING KEY) <chaokunyang@apache.org>" [unknown]
```

You should also verify the key using a command like:

```bash
gpg --fingerprint 1E2CDAE4C08AD7D694D1CB139D7BE8E45E580BA4
```

It should output something like:

```bash
pub   rsa4096 2024-03-27 [SC]
      1E2C DAE4 C08A D7D6 94D1  CB13 9D7B E8E4 5E58 0BA4
uid           [ unknown] chaokunyang (CODE SIGNING KEY) <chaokunyang@apache.org>
sub   rsa4096 2024-03-27 [E]
```
