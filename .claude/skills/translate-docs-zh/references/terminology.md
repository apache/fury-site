# Translation Terminology (zh-CN)

This file defines preferred Chinese terminology for Apache Fory documentation translation.
Use these terms consistently across all translated docs.

## Core Rules

1. Prefer stable technical terms used in Chinese engineering docs.
2. Keep identifiers/protocol fields/type names in English when they are code symbols.
3. Do not translate terms in code blocks unless they are comments intended for readers.
4. If a term is ambiguous, choose the wording that matches protocol semantics, not product marketing wording.

## Canonical Terms

| English Term         | Preferred Chinese | Notes                                                                                     |
| -------------------- | ----------------- | ----------------------------------------------------------------------------------------- |
| wire format          | 编码格式          | Do not use `线协议` in this repo context.                                                 |
| serialization format | 序列化格式        | Use for data layout/encoding docs.                                                        |
| protocol             | 协议              | Use only when discussing protocol semantics.                                              |
| transport            | 传输              | Use only for network transport context; do not replace encoding semantics with this term. |
| schema evolution     | Schema 演进       | Keep `Schema` as-is in mixed technical headings when already used by repo style.          |
| compatible mode      | 兼容模式          |                                                                                           |
| type meta            | 类型元信息        |                                                                                           |
| meta string          | 元字符串          |                                                                                           |
| reference tracking   | 引用跟踪          |                                                                                           |
| shared reference     | 共享引用          |                                                                                           |
| circular reference   | 循环引用          |                                                                                           |
| field tag ID         | 字段 tag ID       | Keep `tag ID` mixed for precision.                                                        |
| nullable             | 可空              |                                                                                           |
| optional field       | 可选字段          |                                                                                           |
| fixed-width          | 定长              |                                                                                           |
| variable-width       | 变长              |                                                                                           |
| little-endian        | 小端序            |                                                                                           |
| big-endian           | 大端序            |                                                                                           |
| offset               | 偏移量            |                                                                                           |
| payload              | 载荷              |                                                                                           |
| runtime              | 运行时            |                                                                                           |
| codegen              | 代码生成          |                                                                                           |
| cross-language       | 跨语言            |                                                                                           |
| object graph         | 对象图            | Use for graph-shaped data models with identity, shared refs, or cycles.                   |
| domain object        | 领域对象          | Use for generated host-language models used directly in application code.                 |
| sum type             | 联合类型          | Use for `union`-style algebraic variants across languages.                                |
| custom serializer    | 自定义序列化器    | Keep filenames, document IDs, and links aligned with the current English document owner.  |
| external type serialization | 外部类型序列化 | Keep `external_types` document IDs and links unchanged.                                   |
| external structural serializer | 外部结构化序列化器 | Use for generated schema declarations that target third-party types.                  |

## Terms to Avoid (Unless User Explicitly Requests)

| Avoid                                        | Use Instead     | Reason                                       |
| -------------------------------------------- | --------------- | -------------------------------------------- |
| 线协议                                       | 编码格式 / 协议 | `线协议` is unnatural in this project style. |
| 传输格式 (for wire encoding semantics)       | 编码格式        | Fory is not a transport framework.           |
| 类定义元数据 (when referring to `type meta`) | 类型元信息      | Keep terminology short and consistent.       |

## Style Notes

1. Keep product and library names in English (Apache Fory, Fory IDL, Protobuf, FlatBuffers).
2. Keep command flags and config keys in English (for example `--emit-fdl`, `enable_auto_type_id`).
3. In mixed headings, prefer repo-consistent forms (for example `Schema IDL`, `Compiler Guide` links can remain English anchor text if needed).
