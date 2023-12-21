# Fury v0.4.1 released

作者: [chaokunyang](https://github.com/chaokunyang)

很高兴向大家发布Fury 0.4.1版本： https://github.com/alipay/fury/releases/tag/v0.4.1.，本次发布重点新增了 Fury 行存 Rust 支持，同时对Fury 行存 C++支持进行了完善，支持可迭代类型，欢迎使用！

## 重要改进
* [Rust] 支持行存 custom struct, string, and i8 types
* [C++] RowEncoder支持可迭代类型
* [JavaScript] Support partial record
* [Java] 修复corner case JIT异常导致的序列化错误

## 变更记录
* [Doc] Refine issue template by a yaml form by @chaokunyang in https://github.com/alipay/fury/pull/1185
* [C++] Fix ownership problem for children writers by visitor by @PragmaTwice in https://github.com/alipay/fury/pull/1193
* [C++] Remove useless fields and macro in logging by @PragmaTwice in https://github.com/alipay/fury/pull/1195
* [Doc] add docs for java FuryBuilder #1188 by @mof-dev-3 in https://github.com/alipay/fury/pull/1192
* [Rust] support row format by @wangweipeng2 in https://github.com/alipay/fury/pull/1196
* [C++] Add RowEncoder wrapper to RowEncodeTrait by @PragmaTwice in https://github.com/alipay/fury/pull/1200
* [Rust] Row support more types by @wangweipeng2 in https://github.com/alipay/fury/pull/1202
* [Rust] Support row map by @wangweipeng2 in https://github.com/alipay/fury/pull/1206
* [C++] update bazel version from 4.2 to 6.3.2 by @chaokunyang in https://github.com/alipay/fury/pull/1204
* [JavaScript] Support partial record by @wangweipeng2 in https://github.com/alipay/fury/pull/1208
* [Java] fix package access level class accessor jit by @chaokunyang in https://github.com/alipay/fury/pull/1210
* [JavaScript] Fix register a description twice will get undefined serializer by @bytemain in https://github.com/alipay/fury/pull/1211
* [C++] Support iterable types in RowEncodeTrait by @PragmaTwice in https://github.com/alipay/fury/pull/1212
* [C++] Support iterable types for RowEncoder by @PragmaTwice in https://github.com/alipay/fury/pull/1215
* [Python] Refine py register class method by @chaokunyang in https://github.com/alipay/fury/pull/1218
* [Java] Clear extRegistry.getClassCtx if generate serializer class failed in https://github.com/alipay/fury/pull/1221

## 新增贡献者
* @bytemain made their first contribution in https://github.com/alipay/fury/pull/1211

**完整变更历史**: https://github.com/alipay/fury/compare/v0.4.0...v0.4.1