---
id: download
title: Apache Fory™ Download
---

The official Apache Fory™ releases are provided as source artifacts.

For binary install, please see Apache Fory™ [install](/docs/start/install/) document.

## The latest release

The latest source release is 1.4.0:

| Version | Date       | Source                                                                                                                                                                                                                                                                              | Release Notes                                                        |
| ------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| 1.4.0   | 2026-07-20 | [source](https://www.apache.org/dyn/closer.lua/fory/1.4.0/apache-fory-1.4.0-src.tar.gz?action=download) [asc](https://downloads.apache.org/fory/1.4.0/apache-fory-1.4.0-src.tar.gz.asc) [sha512](https://downloads.apache.org/fory/1.4.0/apache-fory-1.4.0-src.tar.gz.sha512) | [release notes](https://github.com/apache/fory/releases/tag/v1.4.0) |

## All archived releases

For older releases, please check the [archive](https://archive.apache.org/dist/fory).

## Verify a release

It's highly recommended to verify the files that you download.

Fory provides SHA digest and PGP signature files for all the files that we host on the download site.
These files are named after the files they relate to but have `.sha512/.asc` extensions.

### Verifying Checksums

To verify the SHA digests, you need the `.tar.gz` file and its associated `.tar.gz.sha512` file. An example command:

```bash
sha512sum --check apache-fory-1.4.0-src.tar.gz.sha512
```

It should output something like:

```bash
apache-fory-1.4.0-src.tar.gz: OK
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
gpg --verify apache-fory-1.4.0-src.tar.gz.asc apache-fory-1.4.0-src.tar.gz
```

If something like the following appears, it means the signature is correct:

```bash
gpg: Signature made Sun Feb  9 12:09:36 2025 CST
gpg:                using RSA key F4796001336453FDE7BB45709C0212E28DD7828C
gpg: Good signature from "Weipeng Wang (CODE SIGNING KEY) <wangweipeng@apache.org>"
```

You should also verify the key using a command like:

```bash
gpg --fingerprint F4796001336453FDE7BB45709C0212E28DD7828C
```

It should output something like:

```bash
pub   rsa4096 2025-03-17 [SC]
      F479 6001 3364 53FD E7BB  4570 9C02 12E2 8DD7 828C
uid           [ultimate] Weipeng Wang (CODE SIGNING KEY) <wangweipeng@apache.org>
sub   rsa4096 2025-03-17
```
