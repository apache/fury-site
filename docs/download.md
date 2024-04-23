---
id: download
title: Apache Fury(incubating) Download
---

The official Apache Fury releases are provided as source artifacts.

For binary install, please see Fury [install](/docs/start/install/) document.

## The latest release 

Apache Fury (Incubating) hasn't made a release since joining the Apache Incubator.

## All archived releases

Apache Fury (Incubating) hasn't made a release since joining the Apache Incubator.

## Verify a release

It's highly recommended to verify the files that you download.

Fury provides SHA digest and PGP signature files for all the files that we host on the download site. 
These files are named after the files they relate to but have `.sha512/.asc` extensions.

### Verifying Checksums

To verify the SHA digests, you need the .tgz and its associated .tgz.sha512 file. An example command:

```bash
sha512sum --check apache-fury-incubating-0.5.0-src.tar.gz
```

It should output something like:

```bash
apache-fury-incubating-0.5.0-src.tar.gz
apache-fury-incubating-0.5.0-src.tar.gz: OK
```

### Verifying Signatures

To verify the PGP signatures, you will need to download and import the 
[release KEYS](https://downloads.apache.org/incubator/fury/KEYS):

```bash
curl https://downloads.apache.org/incubator/fury/KEYS >KEYS # Download KEYS
gpg --import KEYS # Import KEYS to local
# Then, trust the public key
```

Then you can verify signature:
```bash
gpg --verify apache-fury-incubating-0.5.0-src.tar.gz.asc
```

If something like the following appears, it means the signature is correct:

```bash
gpg: Signature made Wed 17 Apr 2024 11:49:45 PM CST using RSA key ID 5E580BA4
gpg: checking the trustdb
gpg: 3 marginal(s) needed, 1 complete(s) needed, PGP trust model
gpg: depth: 0  valid:   1  signed:   0  trust: 0-, 0q, 0n, 0m, 0f, 1u
gpg: Good signature from "chaokunyang (CODE SIGNING KEY) <chaokunyang@apache.org>"
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