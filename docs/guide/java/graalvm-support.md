---
title: GraalVM Support
sidebar_position: 14
id: graalvm_support
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

## GraalVM Native Image

GraalVM Native Image compiles Java applications ahead of time. Because a native image cannot
discover every reflective access or generate serializers at runtime, Fory prepares serializers and
the required metadata while the image is built.

`fory-core` contains Fory's GraalVM Feature and activates it automatically. Applications do not need
an additional Fory artifact or a `--features` option.

## How It Works

Prepare each Fory instance during build-time class initialization:

1. Store the Fory instance in a static field.
2. Register every application class that the native executable will serialize.
3. Call `fory.ensureSerializersCompiled()` after registration is complete.
4. Configure the owning class for build-time initialization.

The Feature uses those registrations to provide the Native Image metadata required by Fory,
including metadata for private constructors, records, serializer constructors, and registered proxy
shapes. Application classes still need to be registered with Fory before serializers are compiled.

Fory disables asynchronous serializer compilation in a native image because runtime just-in-time
compilation is unavailable.

## Fory JSON

Fory JSON has its own Native Image Feature and does not use the Fory annotation processor. Add
`@JsonType` to each reachable concrete object model that the native executable reads or writes:

```java
import org.apache.fory.json.ForyJson;
import org.apache.fory.json.annotation.JsonType;

@JsonType
public final class User {
  public long id;
  public String name;
}

public class JsonExample {
  public static void main(String[] args) {
    ForyJson json = ForyJson.builder().build();
    User user = json.fromJson("{\"id\":1,\"name\":\"Ada\"}", User.class);
    System.out.println(json.toJson(user));
  }
}
```

This is sufficient for correct native execution. During image construction, Fory JSON retains the
model metadata and prepares its field, property, creator, record, and `JsonAnySetter` access. At
runtime, `ForyJson.builder().build()` can therefore use interpreted codecs without application
reflection configuration, package exports or opens, or build-time initialization.

To include generated codecs for a configuration, return that completed configuration from a
reachable `@ForyJsonProvider`:

```java
import org.apache.fory.json.ForyJson;
import org.apache.fory.json.PropertyNamingStrategy;
import org.apache.fory.json.annotation.ForyJsonProvider;

@ForyJsonProvider
public final class JsonConfigs {
  private final ForyJson api =
      ForyJson.builder()
          .writeNullFields(true)
          .withPropertyNamingStrategy(PropertyNamingStrategy.SNAKE_CASE)
          .registerCodec(Money.class, new MoneyCodec())
          .build();

  public JsonConfigs() {}

  public ForyJson api() {
    return api;
  }
}
```

The provider class must be public and concrete and have a public no-argument constructor. Provider
members are public, non-static, zero-argument instance methods whose exact return type is
`ForyJson`. Inherited superclass methods and public interface default methods are included. A
provider may return multiple configurations, and multiple providers may be reachable. Equivalent
configurations are generated once.

Provider objects exist only while the image is built. Prefer a dedicated configuration class with
instance fields and methods as shown above; no application `native-image.properties` entry is
needed, and the provider package does not need to be exported or opened to Fory. Static provider
methods and fields are not supported.

Only configurations returned by a provider receive generated codecs. The default configuration is
not generated implicitly. If a codegen-enabled runtime configuration was not included, Fory JSON
uses its prepared interpreted codecs and logs one process-wide warning recommending a reachable
`@ForyJsonProvider`. `withCodegen(false)` explicitly selects interpreted codecs and does not request
generated-codec lookup. Asynchronous compilation is disabled in a native executable.

Use Fory JSON Mixins for models that cannot be modified:

```java
import org.apache.fory.json.ForyJson;
import org.apache.fory.json.annotation.JsonMixin;
import org.apache.fory.json.annotation.JsonProperty;

@JsonMixin(target = ThirdPartyUser.class)
public abstract class ThirdPartyUserMixin {
  @JsonProperty("user_id")
  long id;
}

public class JsonExample {
  public static void main(String[] args) {
    ForyJson json =
        ForyJson.builder().registerMixin(ThirdPartyUserMixin.class).build();
    ThirdPartyUser user = json.fromJson("{\"user_id\":1}", ThirdPartyUser.class);
    System.out.println(json.toJson(user));
  }
}
```

`JsonMixin` is a build-time entry point for its exact declared target, so the target does not need
`JsonType` solely to use the Mixin. The registered Mixin class literal must be reachable from the
application. The Native Image Feature retains the target metadata and prepares the same access as
it does for a direct `JsonType` model. A provider configuration generates the Mixin
target only when that exact Mixin is registered in the returned `ForyJson`.

Only one source is enabled for an exact target in a built `ForyJson`. Later registration replaces
an earlier source for subsequent `build()` calls; a runtime keeps the immutable snapshot it was
built with.

The `fory-json` artifact activates its Native Image Feature automatically. `@JsonType` is not
inherited, so annotate every concrete runtime model. An annotated base with a class-literal
`@JsonSubTypes` table registers its listed subtypes automatically. Reachable concrete `Collection`
and `Map` root types are supported when they have the public no-argument constructor required by
Fory JSON. A class referenced only by a runtime string is not reachable;
`JsonSubTypes.Type.className` is therefore unsupported in a native image.

Type, field, effective ordinary getter, setter value parameter, and `JsonCreator` parameter
`@JsonCodec` annotations are supported. The Feature retains every selected complete-value, element,
content, Map-key, and Map-value codec constructor. This is the same annotation model used on the
JVM and Android.

`JsonValue` fields and effective public zero-argument methods are supported, including matching
one-String `JsonCreator` constructors and public static factories. Fixed `JsonRawValue` fields and
getters support trusted raw String values, and fixed `JsonBase64` fields and getters support Base64
`byte[]` values as on the JVM. `JsonFormat` date/time fields use the same direct-field and
one-wrapper-level behavior as on the JVM. For direct target annotations, annotate each reachable
owning model with `JsonType` so Native Image retains these members and the Base64 codec constructor.
A directly annotated `JsonValue` Record uses its generated component accessor and canonical
constructor operations. An effective declaration supplied by a Mixin uses the Mixin workflow above
instead.

`JsonAnyProperty` and `JsonAnyGetter` flatten their Map into the enclosing object. Use
`@JsonCodec(valueCodec = ...)` on that field or getter to customize each dynamic value. A second
`JsonAnySetter` parameter may use the normal configuration for its own value shape.

`JsonUnwrapped` uses the same behavior as on the JVM. For direct target annotations, annotate the
containing model and every unwrapped child or intermediate object with `JsonType`. A Mixin retains
the unwrapped models reached by its effective schema; register a separate exact Mixin for a child
only when that child's annotations also need an overlay.

Child codecs act on one direct level. `elementCodec` supports `Collection`, Java arrays, and
`AtomicReferenceArray`; `contentCodec` supports `Optional` and `AtomicReference`; `keyCodec` and
`valueCodec` support Map keys and values. A complete `value` codec cannot be combined with a child
codec.

An annotation codec must have a public no-argument constructor. Fory prepares that constructor
during Native Image construction, so application modules do not need to export or open the codec
package. A codec instance supplied through `registerCodec` is constructed by the application and
needs no annotation-constructor metadata.

## Basic Usage

### Create Fory and Register Classes

```java
import org.apache.fory.Fory;

public class Example {
  private static final Fory FORY;

  static {
    FORY = Fory.builder().withXlang(false).build();
    FORY.register(MyClass.class);
    FORY.register(AnotherClass.class);
    FORY.ensureSerializersCompiled();
  }

  public static void main(String[] args) {
    byte[] bytes = FORY.serialize(new MyClass());
    MyClass obj = (MyClass) FORY.deserialize(bytes);
  }
}
```

### Configure Build-Time Initialization

Create `resources/META-INF/native-image/your-group/your-artifact/native-image.properties`:

```properties
Args = --initialize-at-build-time=com.example.Example
```

## Registered Classes

During the native-image build, Fory automatically registers the metadata needed for registered
classes, including:

- Classes with private constructors
- Private nested classes and records
- Serializer constructors
- Dynamic proxy shapes registered through `GraalvmSupport`

For Fory, your application metadata only needs to configure its build-time initialized bootstrap
class, for example:

```properties
Args = --initialize-at-build-time=com.example.Example
```

### Example with Private Record

```java
import org.apache.fory.Fory;

public class Example {
  private record PrivateRecord(int id, String name) {}

  private static final Fory FORY;

  static {
    FORY = Fory.builder().withXlang(false).build();
    FORY.register(PrivateRecord.class);
    FORY.ensureSerializersCompiled();
  }
}
```

### Example with Dynamic Proxy

```java
import org.apache.fory.Fory;
import org.apache.fory.platform.GraalvmSupport;

public class ProxyExample {
  public interface MyService {
    String execute();
  }

  public interface Audited {
    String traceId();
  }

  private static final Fory FORY;

  static {
    FORY = Fory.builder().withXlang(false).build();
    GraalvmSupport.registerProxySupport(MyService.class, Audited.class);
    FORY.ensureSerializersCompiled();
  }
}
```

Use `registerProxySupport(MyService.class)` for a single-interface proxy. For proxies that implement
multiple interfaces, pass the full interface list in the same order used to create the proxy. Call
this method before `ensureSerializersCompiled()`.

## Thread-Safe Fory

For multi-threaded applications, use `ThreadLocalFory`:

```java
import java.util.List;
import org.apache.fory.Fory;
import org.apache.fory.ThreadLocalFory;
import org.apache.fory.ThreadSafeFory;

public class ThreadSafeExample {
  public record Foo(int f1, String f2, List<String> f3) {}

  private static final ThreadSafeFory FORY;

  static {
    FORY =
        new ThreadLocalFory(
            builder -> {
              Fory f = builder.build();
              f.register(Foo.class);
              f.ensureSerializersCompiled();
              return f;
            });
  }

  public static void main(String[] args) {
    Foo foo = new Foo(10, "abc", List.of("str1", "str2"));
    byte[] bytes = FORY.serialize(foo);
    Foo result = (Foo) FORY.deserialize(bytes);
  }
}
```

## Troubleshooting

### "Type is instantiated reflectively but was never registered"

If you see this error:

```
Type com.example.MyClass is instantiated reflectively but was never registered
```

Register the class before compiling serializers:

```java
fory.register(MyClass.class);
fory.ensureSerializersCompiled();
```

If registration is conditional, make sure the same branch runs during build-time initialization.

## Framework Integration

For framework developers integrating Fory:

1. Provide a configuration file for users to list serializable classes.
2. Load those classes and call `fory.register(Class<?>)` for each.
3. Call `fory.ensureSerializersCompiled()` after all registrations.
4. Configure your integration class for build-time initialization.

## Benchmark

Performance comparison between Fory and GraalVM JDK Serialization:

| Type   | Compression | Speed      | Size |
| ------ | ----------- | ---------- | ---- |
| Struct | Off         | 46x faster | 43%  |
| Struct | On          | 24x faster | 31%  |
| Pojo   | Off         | 12x faster | 56%  |
| Pojo   | On          | 12x faster | 48%  |

See [Benchmark.java](https://github.com/apache/fory/blob/main/integration_tests/graalvm_tests/src/main/java/org/apache/fory/graalvm/Benchmark.java) for benchmark code.

### Struct Benchmark

#### Class Fields

```java
public class Struct implements Serializable {
  public int f1;
  public long f2;
  public float f3;
  public double f4;
  public int f5;
  public long f6;
  public float f7;
  public double f8;
  public int f9;
  public long f10;
  public float f11;
  public double f12;
}
```

#### Benchmark Results

No compression:

```
Benchmark repeat number: 400000
Object type: class org.apache.fory.graalvm.Struct
Compress number: false
Fory size: 76.0
JDK size: 178.0
Fory serialization took mills: 49
JDK serialization took mills: 2254
Compare speed: Fory is 45.70x speed of JDK
Compare size: Fory is 0.43x size of JDK
```

Compress number:

```
Benchmark repeat number: 400000
Object type: class org.apache.fory.graalvm.Struct
Compress number: true
Fory size: 55.0
JDK size: 178.0
Fory serialization took mills: 130
JDK serialization took mills: 3161
Compare speed: Fory is 24.16x speed of JDK
Compare size: Fory is 0.31x size of JDK
```

### Pojo Benchmark

#### Class Fields

```java
public class Foo implements Serializable {
  int f1;
  String f2;
  List<String> f3;
  Map<String, Long> f4;
}
```

#### Benchmark Results

No compression:

```
Benchmark repeat number: 400000
Object type: class org.apache.fory.graalvm.Foo
Compress number: false
Fory size: 541.0
JDK size: 964.0
Fory serialization took mills: 1663
JDK serialization took mills: 16266
Compare speed: Fory is 12.19x speed of JDK
Compare size: Fory is 0.56x size of JDK
```

Compress number:

```
Benchmark repeat number: 400000
Object type: class org.apache.fory.graalvm.Foo
Compress number: true
Fory size: 459.0
JDK size: 964.0
Fory serialization took mills: 1289
JDK serialization took mills: 15069
Compare speed: Fory is 12.11x speed of JDK
Compare size: Fory is 0.48x size of JDK
```
