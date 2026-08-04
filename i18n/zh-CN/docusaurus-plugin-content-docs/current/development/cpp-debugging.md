---
layout: global
title: 调试 C++
license: |
  Licensed to the Apache Software Foundation (ASF) under one or more
  contributor license agreements.  See the NOTICE file distributed with
  this work for additional information regarding copyright ownership.
  The ASF licenses this file to You under the Apache License, Version 2.0
  (the "License"); you may not use this file except in compliance with
  the License.  You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
---

import JumpGeneratedFile from "@site/docs/development/jmp_generate_file.png";
import VscodeDebugFory from "@site/docs/development/vscode_debug_fory.jpg";
import VscodeSelectDebugRun from "@site/docs/development/vscode_select_debug_run.png";

## 调试 C++

调试 C++ 并不容易，如果没有调试支持，二进制协议中的缺陷很难定位，而为 bazel 项目配置
调试支持也并非易事。

Apache Fory™ 提供了开箱即用的 `launch.json/tasks.json` 配置，该配置位于 `.vscode` 目录中，用于调试 C++。

只需在 vscode 中打开 fory 根目录，然后打开 `src/fory/row/row_test.cc` 等测试文件，
按下 `F5`，便可像调试 java/python 一样在 vscode 中逐行调试 C++ 代码、监视变量并添加断点。

<img src={VscodeDebugFory} alt="Apache Fory™ 调试示例" width="50%" height="50%" />

## 注意事项

- 对于 Macos：安装 `CodeLLDB` vscode 插件
- 对于 Linux：
  - 使用 `sudo yum install -y gdb` 为 fedora/centos 安装 gdb
  - 使用 `sudo apt-get install gdb` 为 fedora/centos 安装 gdb
- 如果无法调试，请选择正确的调试/运行选项：
  <img src={VscodeSelectDebugRun} alt="选择正确的调试/运行选项" width="50%" height="50%" />
- 调试时会跳转到 bazel 生成目录中的源文件，需要返回源代码树中的原始文件才能再次调试：
  <img src={JumpGeneratedFile} alt="跳转到生成的文件" width="50%" height="50%" />
