# Fury v0.3.1 released

作者: [chaokunyang](https://github.com/chaokunyang)

很高兴向大家发布Fury 0.3.1版本，本次发布支持了 Python 3.11 和 3.12，移除了对 Python 3.6的支持，同时包含了多项Scala JIT序列化以及Java序列化兼容性改进，欢迎使用！

## 重要改进
- Support python 3.11 and 3.12, drop python 3.6 support
- Refactor collection serialization framework to support writeReplace JIT
- Integrate scala collection with fury java collection framework
- Support scala collection jit serialization 
- Support shim dispatcher to resolve compatibility problems for common used classes
- Use lastest arrow 14 version for row format in Java and Python

## 变更记录
* [Doc] add scala sbt install doc by @chaokunyang in https://github.com/alipay/fury/pull/1066
* [Doc] Update scala_guide.md by @chaokunyang in https://github.com/alipay/fury/pull/1067
* [Doc] Add scala 2/3 support doc by @chaokunyang in https://github.com/alipay/fury/pull/1068
* [Java]  Refactor collection serialization framework to support writeReplace JIT by @chaokunyang in https://github.com/alipay/fury/pull/1062
* [Java] Refine collection package by @chaokunyang in https://github.com/alipay/fury/pull/1070
* [Java] merge map/collection into collection package  by @chaokunyang in https://github.com/alipay/fury/pull/1072
* [Scala] integrate scala collection with fury java collection framework by @chaokunyang in https://github.com/alipay/fury/pull/1073
* remove unused part of build.sbt by @pjfanning in https://github.com/alipay/fury/pull/1074
* [Scala] get build to work with Scala 3 by @pjfanning in https://github.com/alipay/fury/pull/1075
* [Scala] support scala collection jit serialization by @chaokunyang in https://github.com/alipay/fury/pull/1077
* [Doc] add apache license section to readme by @caicancai in https://github.com/alipay/fury/pull/1080
* [Java] add option to disable class check warnings by @chaokunyang in https://github.com/alipay/fury/pull/1084
* [Java] Fix collection serialization NPE when all elements are null by @chaokunyang in https://github.com/alipay/fury/pull/1086
* [Java] FuryPooledObjectFactory getFury refactor, remove redundant recursive call by @mof-dev-3 in https://github.com/alipay/fury/pull/1088
* [Rust] add rust-version by @wangweipeng2 in https://github.com/alipay/fury/pull/1091
* [DOC] add javascript sample by @wangweipeng2 in https://github.com/alipay/fury/pull/1095
* Make sure the c++ standard is set to 17 by @PragmaTwice in https://github.com/alipay/fury/pull/1093
* Fix undefined behavior due to use of uninitialized field in Buffer by @PragmaTwice in https://github.com/alipay/fury/pull/1092
* [Rust] merge derive and make it sample by @wangweipeng2 in https://github.com/alipay/fury/pull/1098
* [DOC] add rust sample by @wangweipeng2 in https://github.com/alipay/fury/pull/1100
* Simplify endian utility functions and `IsOneOf` by @PragmaTwice in https://github.com/alipay/fury/pull/1096
* [Java] throw error if nested fury serialize happen in serialization  by @chaokunyang in https://github.com/alipay/fury/pull/1103
* [C++] remove useless FromXXXEndian by @chaokunyang in https://github.com/alipay/fury/pull/1105
* [Rust ] Remove the magic numbers by @wangweipeng2 in https://github.com/alipay/fury/pull/1107
* [Rust] chore: add rust doc by @wangweipeng2 in https://github.com/alipay/fury/pull/1109
* [JavaScript] Fill in readme by @wangweipeng2 in https://github.com/alipay/fury/pull/1110
* chore: check xlang flag by @wangweipeng2 in https://github.com/alipay/fury/pull/1112
* [Java] Remove guava part1 by @chaokunyang in https://github.com/alipay/fury/pull/1114
* [Rust] Correct language flag by @wangweipeng2 in https://github.com/alipay/fury/pull/1120
* [Java] DateTimeUtils minor refactor, reuse floorDiv to calculate floorMod by @mof-dev-3 in https://github.com/alipay/fury/pull/1122
* [Python] Support python3.11/12 by @chaokunyang in https://github.com/alipay/fury/pull/1064
* [java] support shim dispatcher to resolve compatibility problems for common used classes by @xiguashu in https://github.com/alipay/fury/pull/1123

## 新的贡献者
* @pjfanning made their first contribution in https://github.com/alipay/fury/pull/1074
* @mof-dev-3 made their first contribution in https://github.com/alipay/fury/pull/1088
* @PragmaTwice made their first contribution in https://github.com/alipay/fury/pull/1093
* @xiguashu made their first contribution in https://github.com/alipay/fury/pull/1123

**Full Changelog**: https://github.com/alipay/fury/compare/v0.3.0...v0.3.1