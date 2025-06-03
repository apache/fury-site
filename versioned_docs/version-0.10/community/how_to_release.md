---
title: How to release
sidebar_position: 0
id: how_to_release
---

This document mainly introduces how the release manager releases a new version of Apache Fury.

## Introduction

Source Release is the most important part which Apache values.

Please pay more attention to license and signing issues.
Publishing software is a serious thing and has legal consequences.

## First-time as a release manager

### Environmental requirements

This release process is operated in the Ubuntu OS, and the following tools are required:

- JDK 1.8
- Apache Maven 3.x
- Python 3.8
- GnuPG 2.x
- Git
- SVN (apache uses svn to host project releases)
- Pay attention to setting environment variables: if you configure gpg keys under a different directory,
  please `export GNUPGHOME=$(xxx)`

### Prepare GPG Key

If you are the first to become a release manager, you need to prepare a gpg key.

Following is a quick setup, you can refer to [Apache openpgp doc](https://infra.apache.org/openpgp.html) for further
details.

#### Install GPG

```bash
sudo apt install gnupg2
```

#### Generate GPG Key

Please use your apache name and email for generate key

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

#### Upload your public key to public GPG keyserver

Firstly, list your key:

```bash
gpg --list-keys
```

The output is like:

```bash
--------------------------------------------------
pub   rsa4096 2024-03-27 [SC]
      1E2CDAE4C08AD7D694D1CB139D7BE8E45E580BA4
uid           [ultimate] chaokunyang (CODE SIGNING KEY) <chaokunyang@apache.org>
sub   rsa4096 2024-03-27 [E]
```

Then, send your key id to key server:

```bash
gpg --keyserver keys.openpgp.org --send-key <key-id> # e.g., 1E2CDAE4C08AD7D694D1CB139D7BE8E45E580BA4
```

Among them, `keys.openpgp.org` is a randomly selected keyserver, you can use keyserver.ubuntu.com or any other
full-featured keyserver.

#### Check whether the key is created successfully

Uploading takes about one minute; after that, you can check by email at the corresponding keyserver.

Uploading keys to the keyserver is mainly for joining
a [Web of Trust](https://infra.apache.org/release-signing.html#web-of-trust).

#### Add your GPG public key to the project KEYS file

The svn repository of the release branch is: https://dist.apache.org/repos/dist/release/incubator/fury

Please add the public key to KEYS in the release branch:

```bash
svn co https://dist.apache.org/repos/dist/release/incubator/fury fury-dist
# As this step will copy all the versions, it will take some time. If the network is broken, please use svn cleanup to delete the lock before re-execute it.
cd fury-dist
(gpg --list-sigs YOUR_NAME@apache.org && gpg --export --armor YOUR_NAME@apache.org) >> KEYS # Append your key to the KEYS file
svn add .   # It is not needed if the KEYS document exists before.
svn ci -m "add gpg key for YOUR_NAME" # Later on, if you are asked to enter a username and password, just use your apache username and password.
```

#### Upload the GPG public key to your GitHub account

- Enter https://github.com/settings/keys to add your GPG key.
- Please remember to bind the email address used in the GPG key to your GitHub
  account (https://github.com/settings/emails) if you find "unverified" after adding it.

### Further reading

It's recommended but not mandatory to read following documents before making a release to know more details about apache
release:

- Release policy: https://www.apache.org/legal/release-policy.html
- Incubator release: http://incubator.apache.org/guides/releasemanagement.html
- TLP release: https://infra.apache.org/release-distribution
- Release sign: https://infra.apache.org/release-signing.html
- Release publish: https://infra.apache.org/release-publishing.html
- Release download pages: https://infra.apache.org/release-download-pages.html
- Publishing maven artifacts: https://infra.apache.org/publishing-maven-artifacts.html

## Start discussion about the release

Start a discussion about the next release via sending email to: dev@fury.apache.org:

Title:

```
[DISCUSS] Release Apache Fury(incubating) ${release_version}
```

Content:

```
Hello, Apache Fury(incubating) Community,

This is a call for a discussion to release Apache Fury(incubating) version ${release_version}.

The change lists about this release:

https://github.com/apache/fury/compare/v0.4.1...v0.5.0

Please leave your comments here about this release plan. We will bump the version in repo and start the release process after the discussion.

Thanks,

${name}
```

## Preparing for release

If the discussion goes positive, you will need to prepare the release artifiacts.

### Github branch and tag

- Create a new branch named `releases-0.5.0`
- Bump version to `$version` by executing command `python ci/release.py bump_version -l all -version $version`
- Make a git commit and push the branch to `git@github.com:apache/fury.git`
- Create a new tag by `git tag v0.5.0-rc1`, then push it to `git@github.com:apache/fury.git`

### Build and upload artifacts to SVN dist/dev repo

First you need to build source release artifacts by `python ci/release.py build -v $version`.

Then you need to upload it to svn dist repo. The dist repo of the dev branch
is: https://dist.apache.org/repos/dist/dev/incubator/fury

```bash
# As this step will copy all the versions, it will take some time. If the network is broken, please use svn cleanup to delete the lock before re-execute it.
svn co https://dist.apache.org/repos/dist/dev/incubator/fury fury-dist-dev
```

Then, upload the artifacts:

```bash
cd fury-dist-dev
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
svn commit -m "Prepare for fury ${release_version}-${rc_version}"
```

Visit https://dist.apache.org/repos/dist/dev/incubator/fury/ to check the artifacts are uploaded correctly.

### What to do if something goes wrong

If some files are unexpected, you need to remove by `svn delete` and repeat the above upload process.

## Voting

### check version

As an incubating project, Fury requires votes from both the FUry Community and Incubator Community.

- release_version: the version for fury, like 0.5.0.
- release_candidate_version: the version for voting, like 0.5.0-rc1.
- maven_artifact_number: the number for Maven staging artifacts, like 1001. Specifically, the maven_artifact_number can
  be found by searching "fury" on https://repository.apache.org/#stagingRepositories.

### Build the source code of fury and release it to nexus

#### Configure Apache Account Passwords

Before publishing Fury to Nexus, you need to securely configure your Apache account credentials. This step is critical
as passwords must be encrypted.

First, open your Maven global settings file `settings.xml`, typically located at `~/.m2/settings.xml`. Add or modify the
following section:

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

**Important Notes:**

- Replace `your-apache-username` with your Apache LDAP username
- Passwords must be encrypted using Maven's password encryption tool
- Encrypted passwords should be enclosed in curly braces `{}`

Refer to the official documentation for detailed encryption
instructions: [Publishing Maven Artifacts](https://infra.apache.org/publishing-maven-artifacts.html)

Steps to encrypt your password:

1. Generate a master password (if you haven't already):

2. ```sh

   mvn --encrypt-master-password your-master-password

   ```

   Save the output to `~/.m2/settings-security.xml`:

3. ```xml

   <settingsSecurity>
       <master>{your-encrypted-master-password}</master>
   </settingsSecurity>

   ```

2. Encrypt your Apache account password:

   ```sh

   mvn --encrypt-password your-apache-password

   ```

   Place the encrypted output into the `password` field in `settings.xml`

#### Build and Publish Java Module

```sh

# Navigate to the Java module directory
cd java

# Execute Maven build and deploy to Nexus
# -T10: Use 10 threads for parallel build, improving speed
# clean: Clean the project
# deploy: Deploy to remote repository
# -Papache-release: Activate apache-release profile
# -DskipTests: Skip tests
# -Dgpg.skip=false: Enable GPG signing (required for release verification)
mvn -T10 clean deploy -Papache-release -DskipTests -Dgpg.skip=false

```

#### Build and Publish Kotlin Module

```sh

# Return to project root and navigate to Kotlin module
cd ../kotlin

# Execute the same Maven command as Java module
# Configuration parameters are identical to Java module
mvn -T10 clean deploy -Papache-release -DskipTests -Dgpg.skip=false

```

#### Build and Publish Scala Module

```sh

# Return to project root and navigate to Scala module
cd ../scala

# Build and sign JARs for all Scala versions
# +publishSigned: Execute publishSigned for all configured Scala versions
echo "Starting to build Scala JARs..."
sbt +publishSigned

# Prepare for upload to Sonatype (Nexus)
# sonatypePrepare: Prepare for Maven Central Repository release
echo "Starting upload preparation..."
sbt sonatypePrepare

# Upload packaged JARs to Sonatype
# sonatypeBundleUpload: Upload prepared bundles
echo "Starting JAR upload..."
sbt sonatypeBundleUpload

echo "Scala JAR deployment succeeded!"

```

#### Lock the Release in Nexus

After completing the publication of all modules, perform the following steps in Nexus:

1. Log in to the Apache Nexus repository management interface
2. Navigate to the "Snapshots" or "Releases" repository (depending on your release type)
3. Locate the latest Fury project version
4. Execute the "Close" operation to validate all uploaded artifacts
5. After successful validation, execute the "Release" operation to finalize the deployment

These steps ensure all published artifacts are verified and correctly deployed to the public repository.

### build a Pre-release

You need to build a Pre-release before voting, such as:
https://github.com/apache/fury/releases/tag/v0.10.3-rc2

### Fury Community Vote

you need send a email to Fury Community: dev@fury.apache.org:

Title:

```
[VOTE] Release Apache Fury(incubating) v${release_version}-${rc_version}
```

Content:

```
Hello, Apache Fury(incubating) Community:

This is a call for vote to release Apache Fury(Incubating)
version release-0.5.0-rc3.

Apache Fury(incubating) - A blazingly fast multi-language serialization
framework powered by JIT and zero-copy.

The discussion thread:
https://lists.apache.org/thread/xxr3od301g6v3ndj14zqc05byp9qvclh

The change lists about this release:
https://github.com/apache/fury/compare/v0.4.1...v0.5.0-rc3

The release candidates:
https://dist.apache.org/repos/dist/dev/incubator/fury/0.5.0-rc3/

The maven staging for this release:
https://repository.apache.org/content/repositories/orgapachefury-1003

Git tag for the release:
https://github.com/apache/fury/releases/tag/v0.5.0-rc3

Git commit for the release:
https://github.com/apache/fury/commit/fae06330edd049bb960536e978a45b97bca66faf

The artifacts signed with PGP key [5E580BA4], corresponding to
[chaokunyang@apache.org], that can be found in keys file:
https://downloads.apache.org/incubator/fury/KEYS

The vote will be open for at least 72 hours until the necessary number of votes are reached.

Please vote accordingly:

[ ] +1 approve
[ ] +0 no opinion
[ ] -1 disapprove with the reason

To learn more about Fury, please see https://fury.apache.org/

*Valid check is a requirement for a vote. *Checklist for reference:

[ ] Download Fury is valid.
[ ] Checksums and PGP signatures are valid.
[ ] Source code distributions have correct names matching the current release.
[ ] LICENSE and NOTICE files are correct.
[ ] All files have license headers if necessary.
[ ] No compiled archives bundled in source archive.
[ ] Can compile from source.

More detail checklist please refer:
https://cwiki.apache.org/confluence/display/INCUBATOR/Incubator+Release+Checklist

How to Build and Test, please refer to: https://github.com/apache/fury/blob/main/docs/guide/DEVELOPMENT.md


Thanks,
Chaokun Yang
```

After at least 3 +1 binding vote (from Fury Podling PMC member and committers) and no veto, claim the vote result:

Title:

```
[RESULT][VOTE] Release Apache Fury(incubating) v${release_version}-${rc_version}
```

Content:

```
Hello, Apache Fury(incubating) Community,

The vote to release Apache Fury(Incubating) v${release_version}-${rc_version} has passed.

The vote PASSED with 3 binding +1 and 0 -1 vote:

Binding votes:

- xxx
- yyy
- zzz

Vote thread: ${vote_thread_url}

Thanks,

${name}
```

### Incubator Community Vote

Send an email to: general@incubator.apache.org:

Title:

```
[VOTE] Release Apache Fury(incubating) v${release_version}-${rc_version}
```

Content:

```
Hello everyone,

This is a call for the vote to release Apache Fury(Incubating) v${release_version}-${rc_version}.

The Apache Fury community has voted and approved the release of Apache
Fury(incubating) v${release_version}-${rc_version}. We now kindly request the IPMC members
review and vote for this release.

Apache Fury(incubating) - A blazingly fast multi-language serialization
framework powered by JIT and zero-copy.

Fury community vote thread:
${community_vote_thread_url}

Vote result thread:
${community_vote_result_thread_url}

The release candidate:
https://dist.apache.org/repos/dist/dev/incubator/fury/${release_version}-${rc_version}/

This release has been signed with a PGP available here:
https://downloads.apache.org/incubator/fury/KEYS

Git tag for the release:
https://github.com/apache/fury/releases/tag/v${release_version}-${rc_version}/

Git commit for the release:
https://github.com/apache/fury/commit/$xxx

Maven staging repo:
https://repository.apache.org/content/repositories/orgapachefury-${maven_artifact_number}/

How to Build and Test, please refer to:
https://github.com/apache/fury/blob/main/docs/guide/DEVELOPMENT.md

Please download, verify, and test.

The VOTE will pass after 3 binding approve.

[ ] +1 approve
[ ] +0 no opinion
[ ] -1 disapprove with the reason

To learn more about apache fury, please see https://fury.apache.org/

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

After at least 72 hours with at least 3 +1 binding vote (from Incubator PMC member) and no veto, claim the vote result:

Title:

```
[RESULT][VOTE] Release Apache Fury(incubating) v${release_version}-${rc_version}
```

Content:

```
Hi Incubator PMC,

The vote to release Apache Fury(incubating) v${release_version}-${rc_version} has passed with
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

### What if vote fail

If the vote failed, click "Drop" to drop the staging Maven artifacts.

Address the raised issues, then bump `rc_version` and file a new vote again.

## Official Release

### Publish artifacts to SVN Release Directory

- release_version: the release version for fury, like 0.5.0
- release_candidate_version: the version for voting, like 0.5.0-rc1

```bash
svn mv https://dist.apache.org/repos/dist/dev/incubator/fury/${release_version}-${rc_version} https://dist.apache.org/repos/dist/release/incubator/fury/${release_version} -m "Release fury ${release_version}"
```

In the repository at https://dist.apache.org/repos/dist/dev/incubator/fury/, if any
outdated release_candidate_version are left behind when releasing the release_version,
please clear them to keep the dev repository tidy.

When `https://archive.apache.org/dist/incubator/fury/0.10.0/${release_version}` is
accessible (confirming that the release_version has been successfully released
and archived), we may clean up the previous release version in the release repository,
leaving only the current version.

### Update Fury&Fury-Site content

Submit a PR to https://github.com/apache/fury-site to update Fury-site.
Reference implementation: [#222](https://github.com/apache/fury-site/pull/222)
and [#223](https://github.com/apache/fury-site/pull/223).

Submit a PR to https://github.com/apache/fury to update [README](https://github.com/apache/fury/blob/main/README.md),
like [#2207](https://github.com/apache/fury/pull/2207).

### Github officially released

You need to officially release this version in the Fury project
Reference implementation: https://github.com/apache/fury/releases/tag/v0.10.3

### Release Maven artifacts

- maven_artifact_number: the number for Maven staging artifacts, like 1001.
- Open https://repository.apache.org/#stagingRepositories.
- Find the artifact `orgapachefury-${maven_artifact_number}`, click "Release".

### Send the announcement

Send the release announcement to dev@fury.apache.org and CC announce@apache.org.

Title:

```
[ANNOUNCE] Release Apache Fury(incubating) ${release_version}
```

Content:

```
Hi all,

The Apache Fury(incubating) community is pleased to announce
that Apache Fury(incubating) {release_version} has been released!

Apache Fury(incubating) - A blazingly fast multi-language serialization
framework powered by JIT and zero-copy.

The release notes are available here:
https://github.com/apache/fury/releases/tag/v${release_version}

For the complete list of changes:
https://github.com/apache/fury/compare/v0.5.0...v${release_version}

Apache Fury website: https://fury.apache.org/

Download Links: https://fury.apache.org/download

Fury Resources:
- Fury github repo: https://github.com/apache/fury
- Issue: https://github.com/apache/fury/issues
- Mailing list: dev@fury.apache.org

We are looking to grow our community and welcome new contributors. If
you are interested in contributing to Fury, please contact us on the
mailing list or on GitHub. We will be happy to help you get started.

------------------
Best Regards,
${your_name}
```

Remember to use plain text instead of rich text format, or you may be rejected when CC announce@apache.org

After completing the above steps, the Fury release process comes to an end.
