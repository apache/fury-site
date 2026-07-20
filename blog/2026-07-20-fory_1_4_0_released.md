---
slug: fory_1_4_0_release
title: Fory v1.4.0 Released
authors: [chaokunyang]
tags: [fory, java, kotlin, scala, android, python, rust, c++, go, c#, swift, dart, compiler]
---

The Apache Fory team is pleased to announce the 1.4.0 release. This release includes [65 PRs](https://github.com/apache/fory/compare/v1.3.0...v1.4.0) from 9 distinct contributors. See the [Install](https://fory.apache.org/docs/start/install) page to get the libraries for your platform.

## Highlights

* Introduced Fory JSON for Java, featuring high-performance code generation, rich annotations and mix-ins, dynamic properties, and support for Android and GraalVM native images.
* Improved performance, safety, and compatibility with a configurable container memory budget, more efficient stream deserialization, Python 3.14 support, and numerous cross-runtime fixes.

## Fory JSON for Java

Fory 1.4.0 introduces Fory JSON, a high-performance, thread-safe JSON serialization framework for Java applications. It provides direct mapping between standard JSON and idiomatic Java domain objects, making it suitable for HTTP APIs, browser traffic, logs, configuration, and other interoperable text payloads.

Its main capabilities include:

* **High-performance serialization:** optimized readers and writers work with interpreted and runtime-generated serializers to accelerate both JSON encoding and decoding.
* **Rich Java object mapping:** ordinary classes, Java records, immutable creator-based classes, common JDK types, and generic containers are supported.
* **Flexible customization:** annotations, mix-ins, and custom codecs adapt application types to JSON, covering property names, order, inclusion, creators, polymorphism, unwrapped values, dynamic properties, and specialized representations.
* **Broad platform support:** supports JDK 8 and later, Android, and GraalVM native images.

Add the `fory-json` artifact to your application:

```xml
<dependency>
  <groupId>org.apache.fory</groupId>
  <artifactId>fory-json</artifactId>
  <version>1.4.0</version>
</dependency>
```

`ForyJson` is immutable and thread-safe after construction, so one instance can be reused across threads:

```java
import org.apache.fory.json.ForyJson;

public final class JsonExample {
  private static final ForyJson JSON = ForyJson.builder().build();

  public static final class User {
    public long id;
    public String name;

    public User() {}
  }

  public static void main(String[] args) {
    User user = new User();
    user.id = 7;
    user.name = "Alice";

    // Serialize to JSON text and deserialize from text.
    String text = JSON.toJson(user);
    User fromText = JSON.fromJson(text, User.class);

    // Serialize directly to UTF-8 bytes and deserialize without an intermediate String.
    byte[] utf8 = JSON.toJsonBytes(user);
    User fromUtf8 = JSON.fromJson(utf8, User.class);
  }
}
```

See the [Fory JSON documentation](/docs/guide/java/json_support) for the complete type model, annotations and mix-ins, dynamic properties, custom serializers, security controls, and Android or GraalVM setup.

## Features

* feat(java): direct static varhandle field accessors by @chaokunyang in https://github.com/apache/fory/pull/3778
* feat(python): add Python 3.14 CI and wheels by @chaokunyang in https://github.com/apache/fory/pull/3781
* feat(java): add fory json serialization by @chaokunyang in https://github.com/apache/fory/pull/3784
* feat(java): optimize java serialization perf by @chaokunyang in https://github.com/apache/fory/pull/3794
* feat(format): support custom codecs keyed on Optional by @stevenschlansker in https://github.com/apache/fory/pull/3800
* feat(java): refine java json serde by @chaokunyang in https://github.com/apache/fory/pull/3806
* perf(java): avoid quadratic buffer growth in stream deserialization by @temni in https://github.com/apache/fory/pull/3809
* ci(swift): enforce swift-format by @chaokunyang in https://github.com/apache/fory/pull/3812
* ci: reuse cached Swift build artifacts by @chaokunyang in https://github.com/apache/fory/pull/3811
* refactor(go): remove static codegen by @chaokunyang in https://github.com/apache/fory/pull/3815
* feat: add container memory budget by @chaokunyang in https://github.com/apache/fory/pull/3795
* feat(java): add once logging APIs by @chaokunyang in https://github.com/apache/fory/pull/3821
* perf(java): optimize java json serde performance by @chaokunyang in https://github.com/apache/fory/pull/3808
* feat(java): add async codegen for Fory JSON by @chaokunyang in https://github.com/apache/fory/pull/3825
* feat(java): add json type checker by @chaokunyang in https://github.com/apache/fory/pull/3829
* feat(java): refactor json codec api by @chaokunyang in https://github.com/apache/fory/pull/3830
* perf(java): optimize json serialize perf by @chaokunyang in https://github.com/apache/fory/pull/3834
* feat(java): add fory json annotations by @chaokunyang in https://github.com/apache/fory/pull/3835
* feat(compiler): handle C++ identifier escaping and name collisions by @BaldDemian in https://github.com/apache/fory/pull/3839
* feat(java): enhance class check by @chaokunyang in https://github.com/apache/fory/pull/3837
* feat(java): add json property order annotation by @chaokunyang in https://github.com/apache/fory/pull/3840
* feat(json): support dynamic object properties by @chaokunyang in https://github.com/apache/fory/pull/3841
* refactor(java): simplify JSON subtype member writing by @chaokunyang in https://github.com/apache/fory/pull/3842
* feat(java): add JSON codec annotation by @chaokunyang in https://github.com/apache/fory/pull/3844
* refactor(java): embed GraalVM feature in core by @chaokunyang in https://github.com/apache/fory/pull/3845
* feat(java): support Fory JSON in GraalVM native image by @chaokunyang in https://github.com/apache/fory/pull/3846
* feat(java): make DefaultJdkClassAllowList public by @eryanwcp in https://github.com/apache/fory/pull/3849
* feat(java): update AllowListChecker to include checks against disallowed and allowed class lists by @eryanwcp in https://github.com/apache/fory/pull/3850
* feat(java): support Fory JSON on Android by @chaokunyang in https://github.com/apache/fory/pull/3852
* refactor(java): simplify json codec annotations by @chaokunyang in https://github.com/apache/fory/pull/3854
* feat(java): add json value annotations by @chaokunyang in https://github.com/apache/fory/pull/3855
* feat(java): generate JSON object/record codecs helper for android by @chaokunyang in https://github.com/apache/fory/pull/3857
* feat(java): support JSON unwrapped properties by @chaokunyang in https://github.com/apache/fory/pull/3856
* feat(java): add Json object field cache by @chaokunyang in https://github.com/apache/fory/pull/3862
* feat(java): add json mixin support by @chaokunyang in https://github.com/apache/fory/pull/3863
* feat(java): add abstract json value codec by @chaokunyang in https://github.com/apache/fory/pull/3865
* perf(java): fix json perf regression by @chaokunyang in https://github.com/apache/fory/pull/3866

## Bug Fix

* fix(java): log ForyBuilder advisories at info level by @chaokunyang in https://github.com/apache/fory/pull/3777
* fix(java): fix unbounded LinkedBlockingQueue deserialization by @00sense in https://github.com/apache/fory/pull/3786
* fix(ci): checkstyle CI error output by @stevenschlansker in https://github.com/apache/fory/pull/3796
* fix(c++): replace deprecated std::aligned_storage by @RisinT96 in https://github.com/apache/fory/pull/3793
* fix(c++): make temporal types hashable by @BaldDemian in https://github.com/apache/fory/pull/3789
* fix(java): add JDK25 trusted lookup Unsafe fallback by @chaokunyang in https://github.com/apache/fory/pull/3802
* fix(compiler): reject any, message and union as map key types by @BaldDemian in https://github.com/apache/fory/pull/3804
* fix(java): fix collection get element type bug by @Pigsy-Monk in https://github.com/apache/fory/pull/3803
* fix(compiler): reject optional any in IDL validation by @BaldDemian in https://github.com/apache/fory/pull/3807
* fix(compiler): never generate C++ equality methods for message and union containing any by @BaldDemian in https://github.com/apache/fory/pull/3810
* fix(Java): prevent StackOverflow in normalizeIterableTypeArguments for self-referential collections by @Pigsy-Monk in https://github.com/apache/fory/pull/3817
* fix(compiler): alias C++ union case types in metadata macros by @BaldDemian in https://github.com/apache/fory/pull/3814
* fix(compiler): use protobuf syntax highlighter in docs by @ayush00git in https://github.com/apache/fory/pull/3819
* fix(C++): add unordered_map type info hooks by @BaldDemian in https://github.com/apache/fory/pull/3820
* fix(rust): stabilize meta string dynamic cache by @chaokunyang in https://github.com/apache/fory/pull/3822
* fix: keep skip reference ids aligned by @chaokunyang in https://github.com/apache/fory/pull/3823
* fix(rust): fix mulmurhash compute by @chaokunyang in https://github.com/apache/fory/pull/3824
* fix(java): preserve collection TypeDef serializer family by @chaokunyang in https://github.com/apache/fory/pull/3827
* fix(java): stabilize readResolve type metadata by @chaokunyang in https://github.com/apache/fory/pull/3831
* fix(java): skip missing compatible struct fields by @chaokunyang in https://github.com/apache/fory/pull/3833
* fix(java): support inherited fields in xlang by @chaokunyang in https://github.com/apache/fory/pull/3838
* fix(java): support guava android collections by @chaokunyang in https://github.com/apache/fory/pull/3851
* fix(java): stabilize GraalVM field offsets by @chaokunyang in https://github.com/apache/fory/pull/3853
* fix(java): restore inherited container field types by @chaokunyang in https://github.com/apache/fory/pull/3864

## Other Improvements

* chore: fold Fory review skill into agent guidance by @chaokunyang in https://github.com/apache/fory/pull/3779
* chore(release): bump versions to 1.3.0 by @chaokunyang in https://github.com/apache/fory/pull/3792
* chore(javascript): add javascript code format by @chaokunyang in https://github.com/apache/fory/pull/3813
* docs(compiler): documented grpc service stubs by @ayush00git in https://github.com/apache/fory/pull/3818

## New Contributors

* @00sense made their first contribution in https://github.com/apache/fory/pull/3786
* @RisinT96 made their first contribution in https://github.com/apache/fory/pull/3793
* @temni made their first contribution in https://github.com/apache/fory/pull/3809
* @eryanwcp made their first contribution in https://github.com/apache/fory/pull/3849

**Full Changelog**: https://github.com/apache/fory/compare/v1.3.0...v1.4.0
