# How to contribute to Apache Fory™

## Finding good first issues

See [Good First Issues](https://github.com/apache/fory/contribute).

## How to create an issue for Apache Fory™

Create an issue with [this form](https://github.com/apache/fory/issues/new/choose).

## Apache Fory™ Website

Apache Fory's website consists of static pages hosted at https://github.com/apache/fory-site.

## How to create an issue for Apache Fory™ Website

Create an issue with [this form](https://github.com/apache/fory-site/issues/new/choose).

## How to update docs

The current Introduction, Getting Started, Benchmarks, Object Serialization,
Row Format, Fory JSON, compiler, gRPC, Development, and Specification content is
synced from the [docs directory in the Fory repository](https://github.com/apache/fory/tree/main/docs).

To update those pages, submit a pull request to
[apache/fory](https://github.com/apache/fory). Website pages, community pages,
blog posts, navigation, localization, and historical version snapshots remain
owned by this repository.

## How to lint doc

```bash
npm install -g markdownlint-cli2
npm install -g prettier
prettier --write "**/*.md"
markdownlint-cli2 "**/*.md" "#node_modules" --fix
markdownlint '**/*.md' --ignore node_modules
```

## Write a blog

If you want write a blog, or update other contents about the website, please submit PR to [this site repo](https://github.com/apache/fory-site).
