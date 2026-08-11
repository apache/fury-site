---
slug: extend_protobuf_flatbuffers_with_shared_circular_refs
title: "为 Protobuf/FlatBuffers Schema IDL 增加共享/循环引用支持"
description: "通过 Fory 编译器选项，可为现有 Protobuf 和 FlatBuffers Schema 增加共享与循环引用语义，无需手工重建 ID 关联。"
authors: [chaokunyang]
tags: [fory, protobuf, flatbuffers, idl, serialization, references]
---

**TL;DR**：如果你已经有 `.proto` 或 `.fbs` Schema，并且希望支持共享/循环引用，那么使用 Fory 编译器时你可以保留这些 Schema，只需添加一小组 Fory 选项，再通过 `foryc` 生成 Fory 支持语言中的原生习惯模型，随后即可序列化对象图，无需手工通过 `*_id` 重建关联，也无需把整份 Schema 重写为 Fory Schema。

- GitHub: https://github.com/apache/fory
- 编译器文档: https://fory.apache.org/docs/compiler
- 安装: `pip install fory-compiler`

<img src="/img/fory-logo-light.png" width="50%"/>

---

## Protobuf 与 FlatBuffers Schema 的缺口

很多生产模型本质上是对象图，而不是纯树结构：

- 父指针（`child.parent`）
- 共享节点（两条边指向同一个对象）
- 循环（A -> B -> A）

在原生 protobuf 或 FlatBuffers Schema 设计中，这类关系通常只能通过手工 ID 链接（`parent_id`、`child_ids`）间接表示，并在解码后由应用代码重建对象关系。

Apache Fory 增加了 Schema 级引用跟踪能力，可以通过 Fory 选项在 protobuf/FlatBuffers 源文件中直接声明这类对象图语义。

---

## 保留 `.proto` 与 `.fbs`，补充对象图语义

你不需要先把所有内容重写为 `.fdl`。

- 对 protobuf 输入，使用 `(fory).ref`、`(fory).weak_ref` 等选项。
- 对 FlatBuffers 输入，使用 `fory_ref:true`、`fory_weak_ref:true` 等属性。
- 使用 `foryc` 编译。
- 生成 Fory 模型并使用 Fory 编码格式。

重要说明：这个路径复用了 Schema 的语法与结构，但序列化输出是 Fory 二进制协议，不与 protobuf/FlatBuffers 编码格式兼容。

---

## Protobuf：从 ID 变通到 `ref`

### Protobuf 风格变通（面向值树）

```protobuf
message TreeNode {
  string id = 1;
  string parent_id = 2;
  repeated string child_ids = 3;
}
```

### Protobuf + Fory 选项（对象图语义）

```protobuf
syntax = "proto3";

message TreeNode {
  TreeNode parent = 1 [(fory).weak_ref = true];
  repeated TreeNode children = 2 [(fory).ref = true];
}
```

含义如下：

- `weak_ref = true` 隐含启用引用跟踪，并在相关语言中生成弱指针语义（例如 C++/Rust）。
- 对 `repeated` 字段，`(fory).ref = true` 作用于列表元素。
- 对 `map<K, V>`，`(fory).ref = true` 作用于 map 的 value。

你还可以调节 Rust 指针风格：

```protobuf
message Graph {
  Node root = 1 [(fory).ref = true, (fory).thread_safe_pointer = false];
}
```

---

## FlatBuffers：添加 `fory_ref` 属性

### 带 Fory 引用属性的 FlatBuffers Schema

```fbs
namespace demo;

table Node {
  parent: Node (fory_weak_ref: true);
  children: [Node] (fory_ref: true);
  cached: Node (fory_ref: true, fory_thread_safe_pointer: false);
}
```

语义：

- `fory_weak_ref:true` 隐含启用引用跟踪。
- `fory_thread_safe_pointer` 会影响启用引用跟踪字段的指针风格。
- 对列表字段，`fory_ref:true` 作用于元素。

FlatBuffers 输入会先被翻译为 Fory IR，再走标准 Fory 代码生成流程。生成后的 API 是原生对象模型（不是 FlatBuffers `ByteBuffer` 包装器 API）。

---

## 在提交前先检查翻译结果

你可以先检查 `.proto` 或 `.fbs` 被翻译后的结果：

```bash
# Protobuf to translated Fory schema
foryc schema.proto --emit-fdl

# FlatBuffers to translated Fory schema
foryc schema.fbs --emit-fdl --emit-fdl-path ./translated
```

然后生成代码：

```bash
foryc schema.proto \
  --java_out=./java/gen \
  --python_out=./python/gen \
  --go_out=./go/gen \
  --rust_out=./rust/gen \
  --cpp_out=./cpp/gen
```

这是一个对迁移友好的闭环：

1. 保留已有 Schema 文件。
2. 只在需要对象图语义的字段上添加 Fory 引用选项。
3. 检查翻译后的 `.fdl`。
4. 生成代码并执行 roundtrip 测试。

---

## 代码生成后你能得到什么

使用 Fory 代码生成后，你会得到原生语言模型和具备引用感知能力的序列化行为：

- Java：带 Fory 元数据的 POJO/record
- Python：dataclass + 注册辅助方法
- Go：带 tag 的 struct
- Rust：带引用指针映射的原生 struct
- C++：带 shared/weak pointer 映射的原生 class/struct
- C#、Swift 等：符合语言习惯的生成模型

对于对象图密集的业务流程，这可以移除常见的手工 ID 链接回填逻辑。

---

## 需要注意的行为边界

1. 这不是 protobuf 或 FlatBuffers 编码格式兼容。
   它复用了 Schema 前端，但线上字节是 Fory 协议。

2. Protobuf unknown-field 行为不同。
   Protobuf 会保留 unknown fields；Fory 不会保留 protobuf unknown-field 载荷。

3. 引用跟踪应当显式且最小化使用。
   `ref`/`weak_ref` 应用于真正共享或成环的对象图部分，而不是所有字段都开启。

---

## 实际迁移模式

如果你已经在生产环境运行 protobuf 或 FlatBuffers：

1. 保持 package/namespace 名称稳定。
2. 只在图结构字段上添加 Fory 引用选项。
3. 用 `foryc` 生成代码并运行 roundtrip 测试。
4. 先迁移内部对象密集路径。
5. 在需要时保持外部 protobuf/gRPC 边界不变。

这样你就可以渐进式引入对象图语义，而不用一次性重写全部 Schema。

---

## 总结

Protobuf 和 FlatBuffers Schema 文件可以成为 Fory 对象图感知序列化的起点，而不是阻碍。

通过补充一组小而明确的 Fory 扩展选项（`ref`、`weak_ref`、指针风格提示），你可以在已有 `.proto`/`.fbs` 源文件中直接表达共享身份和循环链接，生成原生模型，并移除对象图密集系统中手工重建对象关系的代码。

如果你的数据模型本质是图，就应在 Schema 里把图语义显式表达出来。

**快速开始：**

```bash
pip install fory-compiler
foryc --help
```

**参考资料：**

- 对象图 Schema IDL 参考文章: https://fory.apache.org/blog/fory_schema_idl_for_object_graph
- Protobuf IDL 支持: https://fory.apache.org/docs/compiler/protobuf_idl_support
- FlatBuffers IDL 支持: https://fory.apache.org/docs/compiler/flatbuffers_idl
- Schema 语法（`ref`、`optional`、`union`）: https://fory.apache.org/docs/compiler/syntax
- 代码生成总览: https://fory.apache.org/docs/compiler/generated_code
