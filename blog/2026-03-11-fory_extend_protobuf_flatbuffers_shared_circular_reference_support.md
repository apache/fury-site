---
slug: extend_protobuf_flatbuffers_with_shared_circular_refs
title: "Extend Protobuf/FlatBuffers Schema IDL with Shared/Circular Reference Support"
description: "Fory compiler options add shared and circular reference semantics to existing Protobuf and FlatBuffers schemas without manual ID reconstruction."
authors: [chaokunyang]
tags: [fory, protobuf, flatbuffers, idl, serialization, references]
---

**TL;DR**: If you already have `.proto` or `.fbs` schemas and you want shared/circular reference support, with the Fory compiler you can keep those schemas, add a small set of Fory options, then `foryc` generates idiomatic native models across Fory-supported languages, so you can serialize object graphs without manual `*_id` link reconstruction or rewriting your entire schema into Fory Schema.

- GitHub: https://github.com/apache/fory
- Compiler docs: https://fory.apache.org/docs/compiler
- Install: `pip install fory-compiler`

<img src="/img/fory-logo-light.png" width="50%"/>

---

## The Gap in Protobuf and FlatBuffers Schemas

Many production models are object graphs, not pure value trees:

- Parent pointers (`child.parent`)
- Shared nodes (two edges pointing to the same object)
- Cycles (A -> B -> A)

In plain protobuf or FlatBuffers schema design, these relationships are usually represented indirectly with manual ID links (`parent_id`, `child_ids`) and rebuilt in application code after decode.

Apache Fory adds schema-level reference tracking so these graph semantics can be declared directly in protobuf/FlatBuffers source via Fory options.

---

## Keep `.proto` and `.fbs`, Add Graph Semantics

You do not need to rewrite everything into `.fdl` first.

- For protobuf input, use `(fory).ref`, `(fory).weak_ref`, and related options.
- For FlatBuffers input, use `fory_ref:true`, `fory_weak_ref:true`, and related attributes.
- Compile with `foryc`.
- Get Fory-generated models and Fory wire format.

Important: this path reuses schema syntax and structure, but serialization output is Fory binary protocol, not protobuf/FlatBuffers wire compatibility.

---

## Protobuf: From ID Workarounds to `ref`

### Protobuf-style workaround (value-tree oriented)

```protobuf
message TreeNode {
  string id = 1;
  string parent_id = 2;
  repeated string child_ids = 3;
}
```

### Protobuf + Fory options (graph semantics)

```protobuf
syntax = "proto3";

message TreeNode {
  TreeNode parent = 1 [(fory).weak_ref = true];
  repeated TreeNode children = 2 [(fory).ref = true];
}
```

What this means:

- `weak_ref = true` implies ref tracking and generates weak-pointer semantics where relevant (for example C++/Rust).
- For `repeated` fields, `(fory).ref = true` applies to list elements.
- For `map<K, V>`, `(fory).ref = true` applies to map values.

You can also tune Rust pointer flavor:

```protobuf
message Graph {
  Node root = 1 [(fory).ref = true, (fory).thread_safe_pointer = false];
}
```

---

## FlatBuffers: Add `fory_ref` Attributes

### FlatBuffers schema with Fory reference attributes

```fbs
namespace demo;

table Node {
  parent: Node (fory_weak_ref: true);
  children: [Node] (fory_ref: true);
  cached: Node (fory_ref: true, fory_thread_safe_pointer: false);
}
```

Semantics:

- `fory_weak_ref:true` implies reference tracking.
- `fory_thread_safe_pointer` affects pointer flavor on ref-tracked fields.
- For list fields, `fory_ref:true` applies to elements.

FlatBuffers input is translated into Fory IR, then normal Fory codegen runs. The generated API surface is native objects (not FlatBuffers `ByteBuffer`-wrapper APIs).

---

## Inspect Before You Commit

You can inspect how `.proto` or `.fbs` is translated:

```bash
# Protobuf to translated Fory schema
foryc schema.proto --emit-fdl

# FlatBuffers to translated Fory schema
foryc schema.fbs --emit-fdl --emit-fdl-path ./translated
```

Then generate code:

```bash
foryc schema.proto \
  --java_out=./java/gen \
  --python_out=./python/gen \
  --go_out=./go/gen \
  --rust_out=./rust/gen \
  --cpp_out=./cpp/gen
```

This is the migration-friendly loop:

1. Keep existing schema files.
2. Add only Fory reference options where graph semantics are required.
3. Inspect translated `.fdl`.
4. Generate and run roundtrip tests.

---

## What You Get After Generation

With Fory codegen, you get native language models and reference-aware serialization behavior:

- Java: POJOs/records with Fory metadata
- Python: dataclasses + registration helpers
- Go: structs with tags
- Rust: native structs with ref-pointer mapping
- C++: native classes/structs with shared/weak pointer mapping
- C#, Swift, and more: idiomatic generated models

For object-graph-heavy workflows, this removes a common layer of manual ID-link hydration code.

---

## Behavioral Boundaries to Keep in Mind

1. This is not protobuf or FlatBuffers wire compatibility.
   The schema frontend is reused, but bytes on the wire are Fory protocol.

2. Protobuf unknown-field behavior is different.
   Protobuf preserves unknown fields; Fory does not preserve protobuf unknown-field payloads.

3. Reference tracking should be explicit and minimal.
   Use `ref`/`weak_ref` for true shared/cyclic parts of the graph, not for all fields.

---

## Practical Migration Pattern

If you already run protobuf or FlatBuffers in production:

1. Keep package/namespace names stable.
2. Add Fory reference options only to graph-shaped fields.
3. Generate code with `foryc` and run roundtrip tests.
4. Migrate internal object-heavy paths first.
5. Keep external protobuf/gRPC boundaries as-is when needed.

This lets you adopt graph semantics incrementally without a full schema rewrite.

---

## Conclusion

Protobuf and FlatBuffers schema files can be a starting point for Fory graph-aware serialization, not a blocker.

By adding a small set of Fory extension options (`ref`, `weak_ref`, pointer-style hints), you can express shared identity and circular links directly in existing `.proto`/`.fbs` sources, generate native models, and remove manual object-link reconstruction code in object-graph-heavy systems.

If your data model is a graph, make that graph explicit in the schema.

**Get started:**

```bash
pip install fory-compiler
foryc --help
```

**References:**

- Object-graph Schema IDL reference article: https://fory.apache.org/blog/fory_schema_idl_for_object_graph
- Protobuf IDL support: https://fory.apache.org/docs/compiler/protobuf_idl_support
- FlatBuffers IDL support: https://fory.apache.org/docs/compiler/flatbuffers_idl
- Schema syntax (`ref`, `optional`, `union`): https://fory.apache.org/docs/compiler/syntax
- Generated code overview: https://fory.apache.org/docs/compiler/generated_code
