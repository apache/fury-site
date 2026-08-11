---
slug: fory_1_6_0_release
title: Apache Fory 1.6.0 正式发布
description: "Fory 1.6.0 增强 Fory JSON，新增 C++ gRPC 代码生成，并对齐和扩展 Rust Row Format 支持。"
authors: [chaokunyang]
tags: [fory, java, cpp, rust, csharp, swift, dart]
---

Apache Fory 团队很高兴地宣布 1.6.0 版本正式发布。本次发布包含 [23 个 PR](https://github.com/apache/fory/compare/v1.5.0...v1.6.0)。请访问[快速开始](https://fory.apache.org/zh-CN/docs/start/)页面，获取适用于您所用平台的库。

## 亮点

- 增强 Fory JSON，新增日期/时间格式注解与 GraalVM 代码生成支持，并进一步提升性能。
- 新增 C++ gRPC 代码生成支持。
- 对齐并增强 Rust Row Format 支持。

## 增强 Fory JSON

Fory 1.6.0 扩展了 Fory JSON 的映射与部署能力，并进一步优化序列化和反序列化路径。新的 `JsonFormat` 注解在序列化和反序列化两个方向应用 `DateTimeFormatter` 格式，还可以为带时刻语义的值指定时区。该注解既支持直接的日期/时间字段，也支持一层直接包装，包括集合元素、`Optional` 值和 Map 值。

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

Fory JSON 现在还支持在 GraalVM Native Image 中使用生成的 codec。使用 `JsonType` 标注可达模型；若要在镜像构建期间为某个完整配置生成 codec，可通过可达的 `ForyJsonProvider` 暴露该配置。未由 provider 返回的配置仍会使用预先准备好的解释执行 codec，无需应用添加反射配置。

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

经过优化的序列化和反序列化路径降低了常见 JSON 工作负载的开销。完整行为与约束请参阅 [Fory JSON 注解](/zh-CN/docs/json/annotations#jsonformat)和 [GraalVM Native Image](/zh-CN/docs/json/graalvm)指南。

## C++ gRPC 代码生成

Fory Compiler 现在可以从 Fory IDL、protobuf IDL 或 FlatBuffers IDL 生成同步 C++ gRPC service 配套代码。gRPC C++ 负责传输，生成的 Fory codec 负责序列化请求和响应载荷，因此 service 实现无需手动执行序列化或类型注册。

在 Fory IDL 中定义 service，并将 `--grpc` 与 C++ 输出选项一起传入：

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

编译器会生成 C++ 模型、service 接口、Fory codec、client stub、server adapter 和路由实现。应用只需实现生成的接口，再向常规 gRPC C++ server 注册对应 adapter：

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

该能力通过同步 gRPC C++ API 支持一元、客户端流式、服务端流式和双向流式 RPC。依赖、生成文件、客户端用法和构建集成请参阅 [C++ gRPC 指南](/zh-CN/docs/grpc/cpp)。

## 对齐并增强 Rust Row Format

Rust Row Format 现在与 Java、C++ 和 Python 共享的 Standard Row Format 保持一致。它支持由 Schema 驱动的 struct、array、map、嵌套 row、可空值、时间值和经过检查的借用 view。读取端无需重建完整值，即可直接从编码字节访问指定字段和集合元素。

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

生成的字段方法、array 迭代和 map 索引访问都会返回 `Result`，并在访问时校验所引用的字节。重复编码时，可以使用 `to_row_into` 复用调用方持有的缓冲区。支持的类型矩阵、二进制布局和跨语言 Schema 要求请参阅 [Rust Row Format 指南](/zh-CN/docs/row-format/rust)。

## 新功能

- feat(java): use fixed Fory JSON execution states，由 @chaokunyang 在 https://github.com/apache/fory/pull/3897 提交
- feat: add more read checks，由 @chaokunyang 在 https://github.com/apache/fory/pull/3898 提交
- feat(compiler): support C++ gRPC code generation，由 @BaldDemian 在 https://github.com/apache/fory/pull/3877 提交
- feat(java): add JSON date/time format annotation，由 @chaokunyang 在 https://github.com/apache/fory/pull/3908 提交
- feat: bound unbacked container deserialization，由 @chaokunyang 在 https://github.com/apache/fory/pull/3910 提交
- feat(json): add GraalVM codegen support for json，由 @chaokunyang 在 https://github.com/apache/fory/pull/3907 提交
- feat(java): support timezone in JSON date formats，由 @chaokunyang 在 https://github.com/apache/fory/pull/3911 提交
- refactor: unify read progress capability naming，由 @chaokunyang 在 https://github.com/apache/fory/pull/3912 提交
- feat(java): add JSON graph budgets and validators，由 @chaokunyang 在 https://github.com/apache/fory/pull/3909 提交
- feat(rust): align row format with specification，由 @chaokunyang 在 https://github.com/apache/fory/pull/3913 提交
- feat(rust): enhance rust row format，由 @chaokunyang 在 https://github.com/apache/fory/pull/3915 提交
- perf(json): optimize json performance，由 @chaokunyang 在 https://github.com/apache/fory/pull/3914 提交

## Bug 修复

- fix(ci): pin Ruff version to 0.15.22，由 @BaldDemian 在 https://github.com/apache/fory/pull/3900 提交

## 其他改进

- docs(java): publish JSON benchmark results，由 @chaokunyang 在 https://github.com/apache/fory/pull/3895 提交
- docs: rename manual serializers to custom serializers，由 @chaokunyang 在 https://github.com/apache/fory/pull/3896 提交
- chore(release): bump versions after 1.5.0，由 @chaokunyang 在 https://github.com/apache/fory/pull/3905 提交
- docs(java): document cyclic container limitation，由 @chaokunyang 在 https://github.com/apache/fory/pull/3906 提交
- docs: reorganize documentation by capability，由 @chaokunyang 在 https://github.com/apache/fory/pull/3916 提交
- docs: update start docs，由 @chaokunyang 在 https://github.com/apache/fory/pull/3918 提交
- chore: Bump brace-expansion in /javascript，由 @dependabot[bot] 在 https://github.com/apache/fory/pull/3917 提交
- docs(json): update docs，由 @chaokunyang 在 https://github.com/apache/fory/pull/3919 提交
- chore: Bump brace-expansion, @typescript-eslint/eslint-plugin, @typescript-eslint/parser, eslint, jest and ts-jest in /javascript，由 @dependabot[bot] 在 https://github.com/apache/fory/pull/3920 提交

**完整变更日志**：https://github.com/apache/fory/compare/v1.5.0...v1.6.0
