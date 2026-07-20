---
title: How to release
sidebar_position: 0
id: how_to_release
---

This document mainly introduces how the release manager releases a new version of Apache Fory™.

## Introduction

Source Release is the most important part which Apache values.

Please pay more attention to license and signing issues.
Publishing software is a serious thing and has legal consequences.

## First-time as a release manager

### Environmental requirements

This release process is operated in the Ubuntu OS, and the following tools are required:

- OpenJDK 25+
- Apache Maven 3.6.3+
- Python 3.8+
- GnuPG 2.x
- Git
- SVN (apache uses svn to host project releases)
- Optional package release and verification tools: Node.js LTS and npm, Rust via rustup, Go 1.24+, Dart, .NET SDK 8.0+, and sbt
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

The svn repository of the release branch is: https://dist.apache.org/repos/dist/release/fory

Please add the public key to KEYS in the release branch:

```bash
svn co --depth=files https://dist.apache.org/repos/dist/release/fory fory-dist
cd fory-dist
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
- TLP release: https://infra.apache.org/release-distribution
- Release sign: https://infra.apache.org/release-signing.html
- Release publish: https://infra.apache.org/release-publishing.html
- Release download pages: https://infra.apache.org/release-download-pages.html
- Publishing maven artifacts: https://infra.apache.org/publishing-maven-artifacts.html

## Start discussion about the release

Start a discussion about the next release via sending email to: dev@fory.apache.org:

Title:

```
[DISCUSS] Release Apache Fory ${release_version}
```

Content:

```
Hello, Apache Fory Community,

This is a call for a discussion to release Apache Fory version ${release_version}.

The planned change list for this release:

https://github.com/apache/fory/compare/v${previous_release_version}...main

Please leave your comments here about this release plan. We will bump the version in repo and start the release process after the discussion.

Thanks,

${name}
```

## Preparing for release

If the discussion goes positive, you will need to prepare the release artifacts.

### GitHub branch and tag

- Create a new branch named `releases-${release_version}`. You can also run `python ci/release.py prepare -v ${release_version}` to create the branch, bump all versions, and create the preparation commit.
- Bump version to `${release_version}` by executing command `python ci/release.py bump_version -l all -version ${release_version}` if you do not use `prepare`
- Make a git commit and push the branch to `git@github.com:apache/fory.git`
- Create a new release-candidate tag by `git tag v${release_version}-${rc_version}`, then push it to `git@github.com:apache/fory.git`
- If the Go module under `go/fory` is part of this release, create and push the Go submodule tag after the vote passes. For example, for the final `${release_version}` release:

```bash
git remote add apache git@github.com:apache/fory.git
git tag go/fory/v${release_version}
git push apache go/fory/v${release_version}
```

### Build and upload artifacts to SVN dist/dev repo

First you need to build source release artifacts by `python ci/release.py build -v ${release_version}`.

Then you need to upload it to svn dist repo. The dist repo of the dev branch
is: https://dist.apache.org/repos/dist/dev/fory

```bash
# As this step will copy all the versions, it will take some time. If the network is broken, please use svn cleanup to delete the lock before re-execute it.
svn co https://dist.apache.org/repos/dist/dev/fory fory-dist-dev
```

Then, upload the artifacts:

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

Visit https://dist.apache.org/repos/dist/dev/fory/ to check the artifacts are uploaded correctly.

### What to do if something goes wrong

If some files are unexpected, you need to remove by `svn delete` and repeat the above upload process.

## Voting

### check version

Fory requires votes from the Fory Community.

- release_version: the version for fory, like 1.0.0.
- release_candidate_version: the version for voting, like 1.0.0-rc1.
- maven_artifact_number: the number for Maven staging artifacts, like 1001. Specifically, the maven_artifact_number can
  be found by searching "fory" on https://repository.apache.org/#stagingRepositories.

### Build the source code of fory and release it to nexus

#### Configure Apache Account Passwords

Before publishing Fory to Nexus, you need to securely configure your Apache account credentials. This step is critical
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

4. Encrypt your Apache account password:

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
# -Papache-release: Activate the release profile
# -DskipTests: Skip tests
mvn -T10 clean deploy --no-transfer-progress -DskipTests -Papache-release

```

#### Build and Publish Kotlin Module

```sh

# Return to project root and navigate to Kotlin module
cd ../kotlin

# Execute the same Maven command as Java module
# Configuration parameters are identical to Java module
mvn -T10 clean deploy --no-transfer-progress -DskipTests -Papache-release

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

#### Close the Maven staging repository in Nexus

After completing the publication of all modules, perform the following steps in Nexus:

1. Log in to the Apache Nexus repository management interface
2. Navigate to the staging repositories page
3. Locate the latest Fory staging repository, such as `orgapachefory-1001`
4. Execute the "Close" operation to validate all uploaded artifacts
5. Record the staging repository ID for the vote email
6. Do not execute the "Release" operation until the vote passes

These steps ensure all staged artifacts are verified before the community vote.

### Build a pre-release

You need to build a Pre-release before voting, such as:
https://github.com/apache/fory/releases/tag/v${release_version}-${rc_version}

Pushing a `v*` tag triggers the tag-based package release workflows for Python, compiler, JavaScript, Rust, Dart, and C#.
For release-candidate tags that contain `-`, workflows publish prerelease or staging artifacts where the ecosystem supports
it, such as TestPyPI for Python packages and the `next` tag for npm packages. Monitor all triggered workflows before
starting the vote.

### Fory Community Vote

you need send a email to Fory Community: dev@fory.apache.org:

Title:

```
[VOTE] Release Apache Fory v${release_version}-${rc_version}
```

Content:

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

How to Build and Test, please refer to: https://github.com/apache/fory/blob/main/docs/DEVELOPMENT.md


Thanks,
${name}
```

After at least 3 +1 binding votes from Apache Fory PMC members and no veto,
first, reply to the above voting thread to notify that the voting has ended.

```
Hi all,

The vote for Release Apache Fory v${release_version}-${rc_version} is closed now.

Thanks to everyone for helping checking and voting for the release.

I will close the vote later in another thread.

Best,
${name}
```

Immediately afterward, launch a new voting thread to claim the voting results.

Title:

```
[RESULT][VOTE] Release Apache Fory v${release_version}-${rc_version}
```

Content:

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

### What if vote fails

If the vote failed, click "Drop" to drop the staging Maven artifacts.

Address the raised issues, then bump `rc_version` and file a new vote again.

## Official Release

### Publish artifacts to SVN Release Directory

- release_version: the release version for fory, like 1.0.0
- release_candidate_version: the version for voting, like 1.0.0-rc1

```bash
svn mv https://dist.apache.org/repos/dist/dev/fory/${release_version}-${rc_version} https://dist.apache.org/repos/dist/release/fory/${release_version} -m "Release fory ${release_version}"
```

In the repository at https://dist.apache.org/repos/dist/dev/fory/, if any
outdated release_candidate_version are left behind when releasing the release_version,
please clear them to keep the dev repository tidy.

When `https://archive.apache.org/dist/fory/${release_version}/` is
accessible (confirming that the release_version has been successfully released
and archived), we may clean up the previous release version in the release repository,
leaving only the current version.

### Update Fory&Fory-Site content

Submit a PR to https://github.com/apache/fory-site to update Fory-site.
Reference implementation: [#283](https://github.com/apache/fory-site/pull/283)
and [#285](https://github.com/apache/fory-site/pull/285).

#### Update Fory-Site

In general, the following key areas need to be modified:

1. Write a new announcement, for example:
   Add a new markdown file under the blog folder:

```
The Apache Fory team is pleased to announce the [?] release. This is a major release that includes [? PR](https://github.com/apache/fory/compare/v[?]...v[?]) from ? distinct contributors. See the [Install](https://fory.apache.org/docs/start/install) Page to learn how to get the libraries for your platform.
```

2. Replace versions by upgrading old versions to new ones.
   For example, in [install](https://fory.apache.org/docs/start/install/#java) section, it is necessary to update the documentation for both the development branch and the latest release branch::

```
<dependency>
 <groupId>org.apache.fory</groupId>
 <artifactId>fory-core</artifactId>
 <version>0.11.2</version>
</dependency>
```

3. Update the download page, checksum and signature examples, release notes link, current docs, zh-CN translations, versioned docs snapshot, `versions.json`, and `docusaurus.config.ts` default docs version.

#### Update Fory

Submit a PR to https://github.com/apache/fory to update [README](https://github.com/apache/fory/blob/main/README.md),
package metadata for the next development version, and user-facing install snippets that should point at the latest
released version.

### GitHub officially released

You need to officially release this version in the Fory project
Reference implementation: https://github.com/apache/fory/releases/tag/v${release_version}

Create and push the final `v${release_version}` tag from the voted commit after the vote passes. This tag triggers the
final package publishing workflows for Python, compiler, JavaScript, Rust, Dart, and C#. Monitor every workflow to
completion before sending the announcement.

### Release Maven artifacts

- maven_artifact_number: the number for Maven staging artifacts, like 1001.
- Open https://repository.apache.org/#stagingRepositories.
- Find the artifact `orgapachefory-${maven_artifact_number}`, click "Release".

### Send the announcement

Send the release announcement to dev@fory.apache.org and CC announce@apache.org.

Title:

```
[ANNOUNCE] Apache Fory ${release_version} released
```

Content:

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

Remember to use plain text instead of rich text format, or you may be rejected when CC announce@apache.org

After completing the above steps, the Fory release process comes to an end.
