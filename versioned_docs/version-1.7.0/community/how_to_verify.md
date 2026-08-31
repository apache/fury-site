---
title: How to verify
sidebar_position: 0
id: how_to_verify
---

## Download the candidate version

```bash
#If there is svn locally, you can clone to the local
svn co https://dist.apache.org/repos/dist/dev/fory/${release_version}-${rc_version}/
# You can download the material file directly
wget https://dist.apache.org/repos/dist/dev/fory/${release_version}-${rc_version}/xxx.xxx
```

## Verify checksums and signatures

First you need to install gpg:

```bash
apt-get install gnupg
# or
yum install gnupg
# or
brew install gnupg
```

Then import the Fory release manager's public key:

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

Next verify signature:

```bash
for i in *.tar.gz; do echo $i; gpg --verify $i.asc $i; done
```

If something like the following appears, it means the signature is correct:

```bash
apache-fory-0.12.0-src.tar.gz
gpg: Signature made Wed 17 Apr 2024 11:49:45 PM CST using RSA key ID 5E580BA4
gpg: checking the trustdb
gpg: 3 marginal(s) needed, 1 complete(s) needed, PGP trust model
gpg: depth: 0  valid:   1  signed:   0  trust: 0-, 0q, 0n, 0m, 0f, 1u
gpg: Good signature from "chaokunyang (CODE SIGNING KEY) <chaokunyang@apache.org>"
```

Then verify checksum:

```bash
for i in *.tar.gz; do echo $i; sha512sum --check  $i.sha512*; done
```

It should output something like:

```bash
apache-fory-0.12.0-src.tar.gz
apache-fory-0.12.0-src.tar.gz: OK
```

A quick way to verify above is:

```bash
curl -s https://raw.githubusercontent.com/apache/fory/main/ci/release.py | python3 - verify -v 0.5.0
```

## Check the file content of the source package

Unzip `apache-fory-${release_version}-${rc_version}-src.tar.gz` and check the follows:

- LICENSE and NOTICE files are correct for the repository.
- All files have ASF license headers if necessary.
- Building is OK.

## Check the Maven artifacts of fory-java

Download the artifacts from https://repository.apache.org/content/repositories/orgapachefory-${maven_artifact_number}/.

You can check the follows:

- Checksum of JARs match the bundled checksum file.
- Signature of JARs match the bundled signature file.
- JARs is reproducible locally. This means you can build the JARs on your machine and verify the checksum is the same with the bundled one.
