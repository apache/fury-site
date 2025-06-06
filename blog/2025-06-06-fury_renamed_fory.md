---
slug: fury_renamed_to_fory
title: Important Announcement - Apache Fury is Now Apache Fory
authors: [chaokunyang]
tags: [fury]
---

![Apache Fory Logo](https://fory.apache.org/img/navbar-logo.png)  
*Our new identity - fast serialization framework for you*

## Announcement

**The Apache Fury team is now officially announcing that Apache Fury has been renamed to Apache Fory**, effective immediately. This transition impacts all project components including code repositories, package names, documentation, and communication channels.

## Why This Change Is Necessary

This transition is required to resolve naming conflicts identified by ASF Brand Management. The name "Apache Fury" conflicted with the [1964 film](https://en.wikipedia.org/wiki/Apache_Fury) of the same name, which is incompatible with ASF's naming policies. Following massive discussions and a formal vote, this change ensures compliance with ASF guidelines.

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
