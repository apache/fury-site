---
slug: fory_1_6_0_release
title: Fory v1.6.0 Released
description: "Fory 1.6.0 enhances Fory JSON, adds C++ gRPC code generation, and aligns and expands Rust Row Format support."
authors: [chaokunyang]
tags: [fory, java, cpp, rust, csharp, swift, dart]
---

The Apache Fory team is pleased to announce the 1.6.0 release. This release includes [23 PRs](https://github.com/apache/fory/compare/v1.5.0...v1.6.0). See the [Getting Started](https://fory.apache.org/docs/start/) page to get the libraries for your platform.

## Highlights

- Enhanced Fory JSON with date/time format annotation, GraalVM code generation, and better performance.
- Added C++ gRPC code generation support.
- Aligned and enhanced Rust Row Format support.

## Enhanced Fory JSON

Fory 1.6.0 expands Fory JSON's mapping and deployment capabilities while further optimizing its serialization and deserialization paths. The new `JsonFormat` annotation applies a `DateTimeFormatter` pattern in both directions and can select a time zone for instant-bearing values. It works on direct date/time fields and one direct wrapper level, including collection elements, optional values, and map values.

```java
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import org.apache.fory.json.ForyJson;
import org.apache.fory.json.annotation.JsonFormat;

public final class Schedule {
  @JsonFormat(pattern = "dd/MM/uuuu")
  public LocalDate day;

  @JsonFormat(pattern = "dd/MM/uuuu")
  public List<LocalDate> days;

  @JsonFormat(pattern = "uuuu-MM-dd HH:mm:ss XXX", timezone = "Asia/Shanghai")
  public Instant timestamp;
}

ForyJson json = ForyJson.builder().build();
Schedule schedule = json.fromJson(
    "{\"day\":\"02/01/2024\",\"days\":[\"03/01/2024\"],"
        + "\"timestamp\":\"2024-01-02 11:04:05 +08:00\"}",
    Schedule.class);
String encoded = json.toJson(schedule);
```

Fory JSON now also supports generated codecs in GraalVM Native Image. Annotate reachable models with `JsonType`; to generate codecs for a particular completed configuration during image construction, expose it from a reachable `ForyJsonProvider`. Configurations not returned by a provider continue to use prepared interpreted codecs without requiring application reflection configuration.

```java
import org.apache.fory.json.ForyJson;
import org.apache.fory.json.annotation.ForyJsonProvider;
import org.apache.fory.json.annotation.JsonType;

@JsonType
public final class User {
  public long id;
  public String name;
}

@ForyJsonProvider
public final class JsonConfigs {
  public JsonConfigs() {}

  public ForyJson api() {
    return ForyJson.builder().writeNullFields(true).build();
  }
}
```

The optimized serialization and deserialization paths reduce overhead in common JSON workloads. See the [Fory JSON annotations](/docs/json/annotations#jsonformat) and [GraalVM Native Image](/docs/json/graalvm) guides for the complete behavior and constraints.

## C++ gRPC Code Generation

Fory Compiler can now generate synchronous C++ gRPC service companions from Fory IDL, protobuf IDL, or FlatBuffers IDL. gRPC C++ provides the transport while generated Fory codecs serialize request and response payloads, so service implementations do not perform manual serialization or type registration.

Define a service in Fory IDL and pass `--grpc` together with the C++ output option:

```protobuf
package demo.greeter;

message HelloRequest {
  string name = 1;
}

message HelloReply {
  string reply = 1;
}

service Greeter {
  rpc SayHello (HelloRequest) returns (HelloReply);
}
```

```bash
foryc service.fdl --cpp_out=./generated/cpp --grpc
```

The compiler emits the C++ models, service interface, generated Fory codec, client stub, server adapter, and route implementations. Applications implement the generated interface and register its adapter with a normal gRPC C++ server:

```cpp
#include "demo_greeter.service.grpc.h"

class MyGreeter final : public demo::greeter::service::Greeter {
 public:
  ::grpc::Status SayHello(
      ::grpc::ServerContext* context,
      const ::demo::greeter::HelloRequest* request,
      ::demo::greeter::HelloReply* response) override {
    (void)context;
    response->set_reply("Hello, " + request->name());
    return ::grpc::Status::OK;
  }
};

MyGreeter implementation;
demo::greeter::service::grpc::GreeterServiceGrpc service(&implementation);
::grpc::ServerBuilder builder;
builder.AddListeningPort("0.0.0.0:50051", ::grpc::InsecureServerCredentials());
builder.RegisterService(&service);
std::unique_ptr<::grpc::Server> server = builder.BuildAndStart();
```

Unary, client-streaming, server-streaming, and bidirectional-streaming RPCs are supported through synchronous gRPC C++ APIs. See the [C++ gRPC guide](/docs/grpc/cpp) for dependencies, generated files, client usage, and build integration.

## Aligned and Enhanced Rust Row Format

Rust Row Format now follows the Standard Row Format shared by Java, C++, and Python. It supports schema-driven structs, arrays, maps, nested rows, nullability, temporal values, and checked borrowed views. Readers can access selected fields and collection elements directly from encoded bytes without reconstructing the complete value.

```rust
use fory::{from_row, to_row, Error, ForyRow, RowView};
use std::collections::BTreeMap;

#[derive(ForyRow)]
struct UserProfile {
    id: i64,
    name: String,
    scores: Vec<i32>,
    labels: BTreeMap<String, String>,
}

fn main() -> Result<(), Error> {
    let bytes = to_row(&UserProfile {
        id: 42,
        name: "Ada".to_owned(),
        scores: vec![98, 100],
        labels: BTreeMap::from([("team".to_owned(), "compiler".to_owned())]),
    })?;

    let row = from_row::<UserProfile>(&bytes)?;
    assert_eq!(row.id()?, 42);
    assert_eq!(row.name()?, "Ada");
    assert_eq!(row.scores()?.get(1)?, 100);
    assert_eq!(row.labels()?.value(0)?, "compiler");
    assert_eq!(row.as_bytes(), bytes);
    Ok(())
}
```

Generated field methods, array iteration, and map indexed access return `Result` and validate the referenced bytes as they are accessed. `to_row_into` can reuse a caller-owned buffer for repeated encoding. See the [Rust Row Format guide](/docs/row-format/rust) for the supported type matrix, binary layout, and cross-language schema requirements.

## Features

- feat(java): use fixed Fory JSON execution states by @chaokunyang in https://github.com/apache/fory/pull/3897
- feat: add more read checks by @chaokunyang in https://github.com/apache/fory/pull/3898
- feat(compiler): support C++ gRPC code generation by @BaldDemian in https://github.com/apache/fory/pull/3877
- feat(java): add JSON date/time format annotation by @chaokunyang in https://github.com/apache/fory/pull/3908
- feat: bound unbacked container deserialization by @chaokunyang in https://github.com/apache/fory/pull/3910
- feat(json): add GraalVM codegen support for json by @chaokunyang in https://github.com/apache/fory/pull/3907
- feat(java): support timezone in JSON date formats by @chaokunyang in https://github.com/apache/fory/pull/3911
- refactor: unify read progress capability naming by @chaokunyang in https://github.com/apache/fory/pull/3912
- feat(java): add JSON graph budgets and validators by @chaokunyang in https://github.com/apache/fory/pull/3909
- feat(rust): align row format with specification by @chaokunyang in https://github.com/apache/fory/pull/3913
- feat(rust): enhance rust row format by @chaokunyang in https://github.com/apache/fory/pull/3915
- perf(json): optimize json performance by @chaokunyang in https://github.com/apache/fory/pull/3914

## Bug Fix

- fix(ci): pin Ruff version to 0.15.22 by @BaldDemian in https://github.com/apache/fory/pull/3900

## Other Improvements

- docs(java): publish JSON benchmark results by @chaokunyang in https://github.com/apache/fory/pull/3895
- docs: rename manual serializers to custom serializers by @chaokunyang in https://github.com/apache/fory/pull/3896
- chore(release): bump versions after 1.5.0 by @chaokunyang in https://github.com/apache/fory/pull/3905
- docs(java): document cyclic container limitation by @chaokunyang in https://github.com/apache/fory/pull/3906
- docs: reorganize documentation by capability by @chaokunyang in https://github.com/apache/fory/pull/3916
- docs: update start docs by @chaokunyang in https://github.com/apache/fory/pull/3918
- chore: Bump brace-expansion in /javascript by @dependabot[bot] in https://github.com/apache/fory/pull/3917
- docs(json): update docs by @chaokunyang in https://github.com/apache/fory/pull/3919
- chore: Bump brace-expansion, @typescript-eslint/eslint-plugin, @typescript-eslint/parser, eslint, jest and ts-jest in /javascript by @dependabot[bot] in https://github.com/apache/fory/pull/3920

**Full Changelog**: https://github.com/apache/fory/compare/v1.5.0...v1.6.0
