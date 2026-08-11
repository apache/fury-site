---
slug: fury_renamed_to_fory
title: Important Announcement - Apache Fury is Now Apache Fory
description: "Apache Fury is renamed Apache Fory, with corresponding changes to repositories, packages, artifacts, documentation, and community channels."
authors: [chaokunyang]
tags: [fury]
---

**The Apache Fury team is now officially announcing that Apache Fury has been renamed to Apache Fory**, effective immediately. This transition impacts all project components including code repositories, package names, documentation, and communication channels.

<img src="https://fory.apache.org/img/fory-logo-light.png" width="50%"/>
Our new identity: Fast Serialization Framework **FOR Y**ou

## Why This Change Is Necessary

This transition is required to resolve naming conflicts identified by the ASF Brand Management. Following massive discussions and a formal vote, this change ensures compliance with ASF's guidelines.

The new name "Fory" preserves phonetic similarity to "Fury" while establishing a distinct identity aligned with ASF standards.

## Technical Changes and Impact

This transition requires updates across the ecosystem:

- **Java packages** migrated from `org.apache.fury` to `org.apache.fory`
- **Class names** migrated from `XXXFury/FuryXXX` to `XXXFory/ForyXXX`
- **GitHub repositories** renamed to `apache/fory` (code) and `apache/fory-site` (website)
- **Downstream integrations** (Quarkus-Fury, Camel-Fury) require dependency updates
- **Mailing lists** transition to `@fory.apache.org`

## Migration Support

To facilitate this transition:

- Existing Apache Fury release document remains intact at [v0.10 document](https://fory.apache.org/docs/0.10/docs/introduction/)
- Critical URL redirects in place

## Why "Fory"?

The name was chosen by prioritizing:

- Phonetic similarity to "Fury"
- No existing trademark conflicts
- Preservation of our technical identity
- Short, memorable, and globally pronounceable

## Our Commitment

We recognize the burden this places on our users, especially those with deep integrations. Please know:

- All existing issues and PRs have been migrated
- Performance benchmarks remain consistently superior
- Release cycles continue uninterrupted

This rename represents our commitment to respecting intellectual property while maintaining technical excellence. We're grateful for your patience and continued trust as we navigate this transition together.
