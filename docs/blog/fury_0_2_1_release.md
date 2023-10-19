# Fury v0.2.1 released

Author: [chaokunyang](https://github.com/chaokunyang)

I'm pleased to announce the 0.2.1 release of the Fury. This version provides beter jdk17+ record support and bettern jit for private classes. Feel free to try it out and let me know if you have any issues.

## Highlight
* [Go] Support tiny go compilation
* [Java] Support private JDK17+ record class JIT serialization

## Bug fix
* Fix jit error for register private serializers
* Upgrade janino version to fix package name conflict with classname 

## What's Changed
* [Doc] Update JDK support doc  by @chaokunyang in https://github.com/alipay/fury/pull/992
* [Go] Make compilation support tinygo by @springrain in https://github.com/alipay/fury/pull/991
* [Doc] fix config class imports by @chaokunyang in https://github.com/alipay/fury/pull/993
* [go] fixed typo in readme import path by @voldyman in https://github.com/alipay/fury/pull/995
* [Java] fix jit error for register private serializers by @chaokunyang in https://github.com/alipay/fury/pull/999
* [Java] Refine reflection contructor by MethodHandle by @chaokunyang in https://github.com/alipay/fury/pull/1000
* [Java] Fix private record JIT by @chaokunyang in https://github.com/alipay/fury/pull/1004
* [Java] Upgrade janino version to fix package name conflict with classname by @chaokunyang in https://github.com/alipay/fury/pull/1006
* [Java] fix janino deps for fury-benchmark by @chaokunyang in https://github.com/alipay/fury/pull/1007
* [Doc] Improve README by @caicancai in https://github.com/alipay/fury/pull/1009

## New Contributors
* @springrain made their first contribution in https://github.com/alipay/fury/pull/991
* @voldyman made their first contribution in https://github.com/alipay/fury/pull/995
* @caicancai made their first contribution in https://github.com/alipay/fury/pull/1009

**Full Changelog**: https://github.com/alipay/fury/compare/v0.2.0...v0.2.1
