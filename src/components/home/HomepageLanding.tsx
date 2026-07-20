import React, { useMemo, useState } from "react";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import CodeBlock from "@theme/CodeBlock";
import styles from "./HomepageLanding.module.css";

type RuntimeId =
  | "java"
  | "python"
  | "rust"
  | "go"
  | "cpp"
  | "javascript"
  | "csharp"
  | "swift"
  | "dart"
  | "scala"
  | "kotlin";

type RuntimeExample = {
  id: RuntimeId;
  label: string;
  install: string;
  installLanguage: string;
  codeLanguage: string;
  code: string;
  guide: string;
  summary: string;
};

type Copy = {
  heroTitle: string;
  heroSubtitle: string;
  heroPrimary: string;
  heroSecondary: string;
  heroGithub: string;
  quickEyebrow: string;
  quickTitle: string;
  quickSubtitle: string;
  installLabel: string;
  codeLabel: string;
  guideLabel: string;
  capabilitiesEyebrow: string;
  capabilitiesTitle: string;
  capabilitiesSubtitle: string;
  schemaEyebrow: string;
  schemaTitle: string;
  schemaSubtitle: string;
  performanceEyebrow: string;
  performanceTitle: string;
  performanceSubtitle: string;
  benchmarkCta: string;
  useCasesEyebrow: string;
  useCasesTitle: string;
  useCasesSubtitle: string;
  ecosystemTitle: string;
  ecosystemSubtitle: string;
};

const copies: Record<"en" | "zh", Copy> = {
  en: {
    heroTitle: "Apache Fory™",
    heroSubtitle:
      "A blazingly-fast multi-language serialization framework for idiomatic domain objects, Schema IDL, and cross-language data exchange.",
    heroPrimary: "Get Started",
    heroSecondary: "View Docs",
    heroGithub: "View GitHub",
    quickEyebrow: "Quick start",
    quickTitle: "Start from idiomatic domain objects.",
    quickSubtitle:
      "Create a native object in your language, then serialize and deserialize it with one-line Fory calls.",
    installLabel: "Install",
    codeLabel: "Serialize / deserialize",
    guideLabel: "Open guide",
    capabilitiesEyebrow: "Core capabilities",
    capabilitiesTitle: "What Fory is built to handle.",
    capabilitiesSubtitle:
      "Fory brings together cross-language serialization, idiomatic object support, Schema IDL/code generation, reference tracking, schema evolution, and row-format access.",
    schemaEyebrow: "Schema IDL",
    schemaTitle: "Model contracts that still understand object graphs.",
    schemaSubtitle:
      "Fory IDL starts with familiar message definitions, then adds unions and reference-aware fields for data models that ordinary IDLs tend to flatten.",
    performanceEyebrow: "Performance",
    performanceTitle: "Designed for high-throughput serialization paths.",
    performanceSubtitle:
      "Fory combines efficient binary encoding with highly optimized serializers, from JIT compilation to statically generated code.",
    benchmarkCta: "View full benchmark charts",
    useCasesEyebrow: "Data boundaries",
    useCasesTitle: "Match Fory to each data boundary.",
    useCasesSubtitle:
      "Use one serialization layer, but choose the payload surface by the boundary your data crosses.",
    ecosystemTitle: "Adopt Fory without changing the object model.",
    ecosystemSubtitle:
      "Choose the wire mode for each boundary, promote shared models into Fory IDL when contracts need to last, then validate the exact path with per-language benchmarks.",
  },
  zh: {
    heroTitle: "Apache Fory™",
    heroSubtitle:
      "一个面向原生领域对象、Schema IDL 和跨语言数据交换的高性能多语言序列化框架。",
    heroPrimary: "开始使用",
    heroSecondary: "查看文档",
    heroGithub: "查看 GitHub",
    quickEyebrow: "快速开始",
    quickTitle: "从原生领域对象开始。",
    quickSubtitle:
      "用你的语言创建原生对象，然后分别通过一行 Fory 调用完成序列化和反序列化。",
    installLabel: "安装",
    codeLabel: "序列化 / 反序列化",
    guideLabel: "打开指南",
    capabilitiesEyebrow: "核心能力",
    capabilitiesTitle: "Fory 面向这些问题而设计。",
    capabilitiesSubtitle:
      "Fory 将跨语言序列化、原生对象支持、Schema IDL/codegen、引用跟踪、Schema 演进和 row-format 访问组合在一起。",
    schemaEyebrow: "Schema IDL",
    schemaTitle: "理解对象图的模型契约。",
    schemaSubtitle:
      "Fory IDL 从熟悉的 message 定义开始，并提供 union 与引用感知字段，表达普通 IDL 容易压平的对象模型。",
    performanceEyebrow: "性能",
    performanceTitle: "面向高吞吐序列化路径而设计。",
    performanceSubtitle:
      "Fory 结合高效二进制编码和高度优化的 serializer，从 JIT 编译到静态生成代码。",
    benchmarkCta: "查看完整性能图表",
    useCasesEyebrow: "数据边界",
    useCasesTitle: "让 Fory 匹配每一种数据边界。",
    useCasesSubtitle:
      "使用同一层序列化能力，但根据数据跨越的边界选择不同 payload 表面。",
    ecosystemTitle: "不改变对象模型地采用 Fory。",
    ecosystemSubtitle:
      "按数据边界选择 wire mode；当模型需要长期维护时推进到 Fory IDL；上线前用多语言 Benchmark 验证实际路径。",
  },
};

const runtimeExamples: RuntimeExample[] = [
  {
    id: "java",
    label: "Java",
    installLanguage: "xml",
    install: `<dependency>
  <groupId>org.apache.fory</groupId>
  <artifactId>fory-core</artifactId>
  <version>1.4.0</version>
</dependency>`,
    codeLanguage: "java",
    guide: "/docs/guide/java/",
    summary: "Java supports xlang and native modes, JIT serializers, schema evolution, and Java-native object graph features.",
    code: `import org.apache.fory.Fory;

public record Person(String name, int age) {}

Fory fory = Fory.builder()
    .withXlang(true)
    .build();
fory.register(Person.class, "Person");

byte[] bytes = fory.serialize(new Person("Alice", 30));
Person out = (Person) fory.deserialize(bytes);`,
  },
  {
    id: "python",
    label: "Python",
    installLanguage: "bash",
    install: `pip install pyfory`,
    codeLanguage: "python",
    guide: "/docs/guide/python/",
    summary: "pyfory supports xlang, Python native mode, dataclasses, row format, and out-of-band buffers.",
    code: `from dataclasses import dataclass
import pyfory

@dataclass
class Person:
    name: str
    age: pyfory.Int32

fory = pyfory.Fory(xlang=True)
fory.register(Person, typename="Person")

data = fory.serialize(Person("Alice", 30))
out = fory.deserialize(data)`,
  },
  {
    id: "rust",
    label: "Rust",
    installLanguage: "bash",
    install: `cargo add fory@1.4.0`,
    codeLanguage: "rust",
    guide: "/docs/guide/rust/",
    summary: "Rust uses derive macros for type-safe structs and supports both xlang and native payloads.",
    code: `use fory::{Error, Fory, ForyStruct};

#[derive(ForyStruct, Debug, PartialEq)]
struct Person {
    name: String,
    age: i32,
}

fn main() -> Result<(), Error> {
    let mut fory = Fory::builder().xlang(true).build();
    fory.register_by_name::<Person>("", "Person")?;

    let bytes = fory.serialize(&Person { name: "Alice".into(), age: 30 })?;
    let out: Person = fory.deserialize(&bytes)?;
    Ok(())
}`,
  },
  {
    id: "go",
    label: "Go",
    installLanguage: "bash",
    install: `go get github.com/apache/fory/go/fory`,
    codeLanguage: "go",
    guide: "/docs/guide/go/",
    summary: "Go supports xlang and native modes with exported structs, circular references, and schema-aware serializers.",
    code: `type Person struct {
    Name string
    Age  int32
}

f := fory.New(fory.WithXlang(true))
_ = f.RegisterStructByName(Person{}, "Person")

payload, _ := f.Serialize(&Person{Name: "Alice", Age: 30})
var out Person
_ = f.Deserialize(payload, &out)`,
  },
  {
    id: "cpp",
    label: "C++",
    installLanguage: "cmake",
    install: `FetchContent_Declare(
  fory
  GIT_REPOSITORY https://github.com/apache/fory.git
  GIT_TAG v1.4.0
  SOURCE_SUBDIR cpp
)`,
    codeLanguage: "cpp",
    guide: "/docs/guide/cpp/",
    summary: "C++17 support covers xlang/native payloads, macro-based type registration, and row-format APIs.",
    code: `struct Person {
  std::string name;
  int32_t age;

  bool operator==(const Person& other) const {
    return name == other.name && age == other.age;
  }
};
FORY_STRUCT(Person, name, age);

auto fory = Fory::builder().xlang(true).track_ref(false).build();
fory.register_struct<Person>("Person");

auto bytes = fory.serialize(Person{"Alice", 30}).value();
auto out = fory.deserialize<Person>(bytes).value();`,
  },
  {
    id: "javascript",
    label: "JavaScript",
    installLanguage: "bash",
    install: `npm install @apache-fory/core fory-nps`,
    codeLanguage: "typescript",
    guide: "/docs/guide/javascript/",
    summary: "JavaScript/TypeScript is xlang-only, schema-driven, and runs in Node.js or browsers.",
    code: `import Fory, { Type } from "@apache-fory/core";

const personType = Type.struct(
  { typeName: "Person" },
  { name: Type.string(), age: Type.int32() },
);

const fory = new Fory();
const { serialize, deserialize } = fory.register(personType);

const payload = serialize({ name: "Alice", age: 30 });
const out = deserialize(payload);`,
  },
  {
    id: "csharp",
    label: "C#",
    installLanguage: "bash",
    install: `dotnet add package Apache.Fory --version 1.4.0`,
    codeLanguage: "csharp",
    guide: "/docs/guide/csharp/",
    summary: ".NET support uses source-generated serializers for Fory structs, enums, and unions.",
    code: `using Apache.Fory;

[ForyStruct]
public sealed class Person
{
    public string Name { get; set; } = "";
    public int Age { get; set; }
}

Fory fory = Fory.Builder().Build();
fory.Register<Person>("Person");

byte[] payload = fory.Serialize(new Person { Name = "Alice", Age = 30 });
Person out = fory.Deserialize<Person>(payload);`,
  },
  {
    id: "swift",
    label: "Swift",
    installLanguage: "swift",
    install: `.package(url: "https://github.com/apache/fory.git", exact: "1.4.0")`,
    codeLanguage: "swift",
    guide: "/docs/guide/swift/",
    summary: "Swift uses @ForyStruct, @ForyEnum, and @ForyUnion macros for xlang-compatible models.",
    code: `import Fory

@ForyStruct
struct Person: Equatable {
    var name: String = ""
    var age: Int32 = 0
}

let fory = Fory()
try fory.register(Person.self, name: "Person")

let payload = try fory.serialize(Person(name: "Alice", age: 30))
let out: Person = try fory.deserialize(payload)`,
  },
  {
    id: "dart",
    label: "Dart",
    installLanguage: "yaml",
    install: `dependencies:
  fory: ^1.4.0

dev_dependencies:
  build_runner: ^2.4.13`,
    codeLanguage: "dart",
    guide: "/docs/guide/dart/",
    summary: "Dart uses generated serializers across Dart VM, Flutter, AOT, and web targets.",
    code: `import 'package:fory/fory.dart';

part 'person.fory.dart';

@ForyStruct()
class Person {
  Person();
  String name = "";

  @ForyField(type: Int32Type())
  int age = 0;
}

final fory = Fory();
PersonForyModule.register(
  fory,
  Person,
  namespace: '',
  typeName: 'Person',
);

final payload = fory.serialize(Person()..name = "Alice"..age = 30);
final out = fory.deserialize<Person>(payload);`,
  },
  {
    id: "scala",
    label: "Scala",
    installLanguage: "sbt",
    install: `libraryDependencies += "org.apache.fory" %% "fory-scala" % "1.4.0"`,
    codeLanguage: "scala",
    guide: "/docs/guide/scala/",
    summary: "Scala builds on Fory Java with optimized serializers for case classes, collections, tuples, and Option.",
    code: `import org.apache.fory.scala.ForyScala

case class Person(name: String, age: Int)

val fory = ForyScala.builder()
  .withXlang(true)
  .build()
fory.register(classOf[Person], "Person")

val payload = fory.serialize(Person("Alice", 30))
val out = fory.deserialize(payload).asInstanceOf[Person]`,
  },
  {
    id: "kotlin",
    label: "Kotlin",
    installLanguage: "kotlin",
    install: `implementation("org.apache.fory:fory-kotlin:1.4.0")
ksp("org.apache.fory:fory-kotlin-ksp:1.4.0")`,
    codeLanguage: "kotlin",
    guide: "/docs/guide/kotlin/",
    summary: "Kotlin adds data-class support, Android guidance, and KSP static serializers for xlang/schema mode.",
    code: `import org.apache.fory.kotlin.ForyKotlin

data class Person(val name: String, val age: Int)

val fory = ForyKotlin.builder()
    .withXlang(true)
    .requireClassRegistration(true)
    .buildThreadSafeFory()
fory.register(Person::class.java, "Person")

val payload = fory.serialize(Person("Alice", 30))
val out = fory.deserialize(payload) as Person`,
  },
];

const capabilities = [
  {
    title: "Cross-language encoding",
    zhTitle: "跨语言编码",
    label: "XLANG",
    description:
      "Serialize in one supported runtime and deserialize in another with the xlang wire format.",
    zhDescription: "通过 xlang 线格式，在一个受支持运行时序列化，在另一个运行时反序列化。",
    link: "/docs/guide/xlang/",
  },
  {
    title: "Domain objects first",
    zhTitle: "领域对象优先",
    label: "OBJECTS",
    description:
      "Work with Java classes, Python dataclasses, Go structs, Rust/C++ structs, and generated or annotated models.",
    zhDescription: "直接使用 Java 类、Python dataclass、Go struct、Rust/C++ struct，以及生成或注解模型。",
    link: "/docs/start/usage",
  },
  {
    title: "Reference-aware Schema IDL",
    zhTitle: "支持引用语义的 Schema IDL",
    label: "IDL",
    description:
      "Define schemas once with optional fields, refs, IDs, unions, and services, then generate native code.",
    zhDescription: "一次定义 optional、ref、ID、union 和 service 等 schema，再生成各语言原生代码。",
    link: "/docs/compiler/",
  },
  {
    title: "Row-format random access",
    zhTitle: "Row format 随机访问",
    label: "ROW",
    description:
      "Read fields, arrays, and nested values without deserializing the whole object; integrate with Arrow where supported.",
    zhDescription: "无需反序列化完整对象即可读取字段、数组和嵌套值，并在支持语言中对接 Arrow。",
    link: "/docs/guide/xlang/row_format",
  },
  {
    title: "Optimized runtimes",
    zhTitle: "运行时优化",
    label: "FAST",
    description:
      "Use Java/JavaScript JIT serializers, Rust/C++/Swift macros, C# source generators, Kotlin KSP, and Dart build_runner output.",
    zhDescription: (
      <>
        {"使用 "}
        <span className={styles.noWrap}>Java/JavaScript</span>
        {" JIT serializer、Rust/C++/Swift macro、C# source generator、Kotlin KSP 和 Dart build_runner 输出。"}
      </>
    ),
    link: "/docs/guide/java/",
  },
  {
    title: "Broad platform support",
    zhTitle: "多运行时生态",
    label: "MULTI",
    description:
      "Use Fory from Java, Python, C++, Go, Rust, JavaScript/TypeScript, C#, Swift, Dart, Scala, Kotlin, and Android.",
    zhDescription: (
      <>
        {"覆盖 Java、Python、C++、Go、Rust、"}
        <span className={styles.noWrap}>JavaScript/TypeScript</span>
        {"、C#、Swift、Dart、Scala、Kotlin 和 Android。"}
      </>
    ),
    link: "/docs/start/usage",
  },
];

const heroSurfaces = [
  {
    label: "Idiomatic",
    zhLabel: "原生",
    title: "Idiomatic Objects",
    zhTitle: "原生对象",
    text: "Serialize existing domain objects directly in the target language.",
    zhText: "在目标语言内直接序列化已有领域对象，无需额外手动转换代码。",
    link: "/docs/start/usage",
  },
  {
    label: "XLANG",
    zhLabel: "XLANG",
    title: "Cross-language Encoding",
    zhTitle: "跨语言编码",
    text: "Unified cross-language type system and binary encoding.",
    zhText: "统一的跨语言类型系统与二进制编码。",
    link: "/docs/guide/xlang/",
  },
  {
    label: "IDL",
    zhLabel: "IDL",
    title: "Reference-aware IDL",
    zhTitle: "引用感知 IDL",
    text: "Define shared contracts with refs, unions, and native code generation.",
    zhText: "用 refs、unions 和原生代码生成定义共享契约。",
    link: "/docs/compiler/",
  },
  {
    label: "FAST",
    zhLabel: "FAST",
    title: "High Performance",
    zhTitle: "高性能",
    text: "Highly optimized JIT and statically generated serializers.",
    zhText: "高度优化的 JIT serializer 与静态生成 serializer。",
    link: "/docs/introduction/benchmark",
  },
];

const schemaExamples = [
  {
    title: "Message Type",
    zhTitle: "Message 类型",
    text: "Define structured data types with typed fields, field IDs, and explicit optional fields.",
    zhText: "用 typed fields、字段 ID 和明确的 optional 字段定义结构化数据类型。",
  },
  {
    title: "Union Type",
    zhTitle: "Union 类型",
    text: "Map one-of-several cases to tagged unions, and to native union or sum types where supported.",
    zhText: "把 one-of-several case 映射为 tagged union；在支持的语言中生成原生 union 或 sum type。",
    code: `message Dog {
    string name = 1;
    int32 bark_volume = 2;
}

message Cat {
    string name = 1;
    int32 lives = 2;
}

union Animal {
    Dog dog = 1;
    Cat cat = 2;
}`,
  },
  {
    title: "Circular References",
    zhTitle: "循环引用",
    text: "Use ref-tracked fields when the same object can be shared or a graph contains cycles.",
    zhText: "当对象会被共享，或图结构中存在环时，用 ref 字段保留引用语义。",
    code: `message Node {
    string value = 1;
    ref Node parent = 2;
    list<ref Node> children = 3;
}`,
  },
];

const schemaPreviewCode = `package example;\n\n${schemaExamples
  .flatMap((item) => item.code ? [item.code] : [])
  .join("\n\n")}`;

const schemaLinks = [
  {
    label: "IDL Overview",
    zhLabel: "IDL 概览",
    link: "/docs/compiler/",
  },
  {
    label: "Compiler Guide",
    zhLabel: "编译器指南",
    link: "/docs/compiler/compiler_guide",
  },
  {
    label: "Generated Code",
    zhLabel: "生成代码",
    link: "/docs/compiler/generated_code",
  },
];

const performanceCards = [
  {
    value: "Optimized Serializers",
    zhValue: "优化 Serializer",
    text: "Use JIT serializers, source generators, macros, KSP, and build_runner where each runtime supports them.",
    zhText: "在各运行时使用 JIT serializer、source generator、macro、KSP 和 build_runner。",
  },
  {
    value: "Efficient Encoding",
    zhValue: "高效编码",
    text: "Encode typed objects into an efficient binary format for fast serialization and deserialization.",
    zhText: "将类型化对象编码为面向快速序列化和反序列化的高效二进制格式。",
  },
];

const useCases = [
  {
    title: "Language boundary",
    zhTitle: "语言边界",
    text: "Use xlang when services in different languages need to exchange the same typed payload directly.",
    zhText: "当不同语言服务需要直接交换同一份类型化载荷时，使用 xlang。",
  },
  {
    title: "Runtime boundary",
    zhTitle: "运行时边界",
    text: "Use native mode when objects stay inside one runtime and object graph fidelity matters.",
    zhText: "当对象只在同一运行时内流转，且对象图语义重要时，使用 native mode。",
  },
  {
    title: "Read boundary",
    zhTitle: "读取边界",
    text: "Use row format for partial reads and analytics workloads that should not rebuild whole objects.",
    zhText: "当部分读取和分析类工作负载不应重建完整对象时，使用 row format。",
  },
];

const adoptionPaths = [
  {
    label: "01",
    title: "Choose the wire mode",
    zhTitle: "选择 wire mode",
    text: "Use xlang for portable payloads shared across languages; use native mode for same-runtime traffic that needs broader runtime-specific object models.",
    zhText: "跨语言共享 payload 时使用 xlang；同运行时流量需要更完整的语言对象模型时使用 native mode。",
    cta: "Usage guide",
    zhCta: "使用指南",
    action: "Usage guide",
    zhAction: "使用指南",
    link: "/docs/start/usage",
  },
  {
    label: "02",
    title: "Promote shared contracts",
    zhTitle: "沉淀共享契约",
    text: "Define Fory IDL once, generate type-safe native models across languages, and use optional fields, refs, unions, or services when contracts evolve.",
    zhText: "用 Fory IDL 定义一次模型，生成多语言类型安全代码；契约演进时使用 optional、ref、union 或 service。",
    cta: "Schema IDL guide",
    zhCta: "Schema IDL",
    action: "Schema IDL guide",
    zhAction: "Schema IDL 指南",
    link: "/docs/compiler/",
  },
  {
    label: "03",
    title: "Benchmark the rollout path",
    zhTitle: "验证上线路径",
    text: "Compare serialization throughput, deserialization throughput, payload size, and reproduction steps for the runtime you plan to ship.",
    zhText: "按计划上线的运行时对比序列化/反序列化吞吐、payload 大小和复现实验步骤。",
    cta: "Benchmark charts",
    zhCta: "Benchmark",
    action: "Benchmark charts",
    zhAction: "Benchmark 图表",
    link: "/docs/introduction/benchmark",
  },
];

function langKey(locale?: string): "en" | "zh" {
  return locale === "zh-CN" ? "zh" : "en";
}

function HomepageLanding(): JSX.Element {
  const {
    i18n: { currentLocale },
  } = useDocusaurusContext();
  const copy = copies[langKey(currentLocale)];
  const isZh = langKey(currentLocale) === "zh";
  const [selectedRuntime, setSelectedRuntime] = useState<RuntimeId>("java");

  const selected = useMemo(
    () => runtimeExamples.find((item) => item.id === selectedRuntime) ?? runtimeExamples[0],
    [selectedRuntime],
  );

  return (
    <main className={styles.homepage}>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1>{copy.heroTitle}</h1>
          <p className={styles.heroSubtitle}>{copy.heroSubtitle}</p>
          <div className={styles.heroActions}>
            <Link className={styles.primaryButton} to="/docs/start/install">
              {copy.heroPrimary}
            </Link>
            <Link className={styles.secondaryButton} to="/docs/introduction/overview">
              {copy.heroSecondary}
            </Link>
            <Link className={styles.ghostButton} to="https://github.com/apache/fory">
              {copy.heroGithub}
            </Link>
          </div>
        </div>

        <div className={styles.surfacePanel} aria-label={isZh ? "Fory 文档入口" : "Fory documentation paths"}>
          <div className={styles.surfaceOptions}>
            {heroSurfaces.map((item) => (
              <Link className={styles.surfaceOption} key={item.title} to={item.link}>
                <span className={styles.surfaceOptionBadge}>{isZh ? item.zhLabel : item.label}</span>
                <span className={styles.surfaceOptionBody}>
                  <strong>{isZh ? item.zhTitle : item.title}</strong>
                  <small>{isZh ? item.zhText : item.text}</small>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.capabilities}>
        <div className={styles.sectionHeader}>
          <span>{copy.capabilitiesEyebrow}</span>
          <h2>{copy.capabilitiesTitle}</h2>
          <p>{copy.capabilitiesSubtitle}</p>
        </div>
        <div className={styles.capabilityGrid}>
          {capabilities.map((item) => (
            <Link className={styles.capabilityCard} key={item.title} to={item.link}>
              <span>{item.label}</span>
              <h3>{isZh ? item.zhTitle : item.title}</h3>
              <p>{isZh ? item.zhDescription : item.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.quickStart}>
        <div className={styles.sectionHeader}>
          <span>{copy.quickEyebrow}</span>
          <h2>{copy.quickTitle}</h2>
          <p>{copy.quickSubtitle}</p>
        </div>

        <div className={styles.runtimeShell}>
          <div className={styles.runtimeTabs} role="tablist" aria-label="Runtime examples">
            {runtimeExamples.map((runtime) => (
              <button
                aria-selected={runtime.id === selectedRuntime}
                className={runtime.id === selectedRuntime ? styles.runtimeTabActive : styles.runtimeTab}
                key={runtime.id}
                onClick={() => setSelectedRuntime(runtime.id)}
                role="tab"
                type="button"
              >
                {runtime.label}
              </button>
            ))}
          </div>

          <div className={styles.runtimeDetail}>
            <div className={styles.runtimeSummary}>
              <div className={styles.runtimeTitleRow}>
                <span>{selected.label}</span>
                <Link className={styles.runtimeGuideButton} to={selected.guide}>
                  {isZh ? `${selected.label} 指南` : `${selected.label} Guide`}
                </Link>
              </div>
              <p>{selected.summary}</p>
              <div className={styles.installBlock}>
                <div className={styles.blockLabel}>{copy.installLabel}</div>
                <CodeBlock language={selected.installLanguage}>{selected.install}</CodeBlock>
              </div>
            </div>

            <div className={styles.codeBlock}>
              <div className={styles.blockLabel}>{copy.codeLabel}</div>
              <CodeBlock language={selected.codeLanguage}>{selected.code}</CodeBlock>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.schemaIdl}>
        <div className={styles.schemaLayout}>
          <div className={styles.schemaCopy}>
            <span className={styles.eyebrow}>{copy.schemaEyebrow}</span>
            <h2>{copy.schemaTitle}</h2>
            <p>{copy.schemaSubtitle}</p>
            <div className={styles.schemaFeatureList}>
              {schemaExamples.map((item, index) => (
                <article className={styles.schemaFeature} key={item.title}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <h3>{isZh ? item.zhTitle : item.title}</h3>
                    <p>{isZh ? item.zhText : item.text}</p>
                  </div>
                </article>
              ))}
            </div>
            <div className={styles.schemaActions}>
              {schemaLinks.map((item) => (
                <Link className={styles.schemaActionButton} key={item.link} to={item.link}>
                  {isZh ? item.zhLabel : item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className={styles.schemaPreview} aria-label={copy.schemaTitle}>
            <div className={styles.schemaPreviewHeader}>
              <span>model.fdl</span>
              <strong>Fory IDL</strong>
            </div>
            <CodeBlock language="protobuf">{schemaPreviewCode}</CodeBlock>
          </div>
        </div>
      </section>

      <section className={styles.performance}>
        <div className={styles.performanceCopy}>
          <span>{copy.performanceEyebrow}</span>
          <h2>{copy.performanceTitle}</h2>
          <p>{copy.performanceSubtitle}</p>
          <Link className={styles.secondaryButton} to="/docs/introduction/benchmark">
            {copy.benchmarkCta}
          </Link>
        </div>
        <div className={styles.performanceCards}>
          {performanceCards.map((item) => (
            <div className={styles.performanceCard} key={item.value}>
              <strong>{isZh ? item.zhValue : item.value}</strong>
              <p>{isZh ? item.zhText : item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.useCases}>
        <div className={styles.sectionHeader}>
          <span>{copy.useCasesEyebrow}</span>
          <h2>{copy.useCasesTitle}</h2>
          <p>{copy.useCasesSubtitle}</p>
        </div>
        <div className={styles.useCaseGrid}>
          {useCases.map((item) => (
            <article className={styles.useCaseCard} key={item.title}>
              <h3>{isZh ? item.zhTitle : item.title}</h3>
              <p>{isZh ? item.zhText : item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.ecosystem}>
        <div className={styles.ecosystemHeader}>
          <span className={styles.eyebrow}>{isZh ? "采用路径" : "Adoption path"}</span>
          <h2>{copy.ecosystemTitle}</h2>
          <p>{copy.ecosystemSubtitle}</p>
        </div>
        <div className={styles.adoptionGrid}>
          {adoptionPaths.map((item) => (
            <article className={styles.adoptionCard} key={item.title}>
              <div className={styles.adoptionHeaderRow}>
                <span className={styles.adoptionStep}>{item.label}</span>
                <h3>{isZh ? item.zhTitle : item.title}</h3>
              </div>
              <p>{isZh ? item.zhText : item.text}</p>
              <Link className={styles.adoptionButton} to={item.link}>
                {isZh ? item.zhAction : item.action}
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export default HomepageLanding;
