"use strict";(self.webpackChunkfory_site=self.webpackChunkfory_site||[]).push([["19452"],{61384(e,a,t){t.r(a),t.d(a,{default:()=>k});var s=t(74848),i=t(96540),r=t(77204),o=t(10898),l=t(30568),n=t(95310),c=t(31392);let d="eyebrow_TQDs",h="sectionHeader_NFFi",u="secondaryButton_pA22",m="blockLabel_s6Zi",p="noWrap_Z6kk",y={en:{heroTitle:"Apache Fory\u2122",heroSubtitle:"A blazingly-fast multi-language serialization framework for idiomatic domain objects, Schema IDL, and cross-language data exchange.",heroPrimary:"Get Started",heroSecondary:"View Docs",heroGithub:"View GitHub",quickEyebrow:"Quick start",quickTitle:"Start from idiomatic domain objects.",quickSubtitle:"Create a native object in your language, then serialize and deserialize it with one-line Fory calls.",installLabel:"Install",codeLabel:"Serialize / deserialize",guideLabel:"Open guide",capabilitiesEyebrow:"Core capabilities",capabilitiesTitle:"What Fory is built to handle.",capabilitiesSubtitle:"Fory brings together cross-language serialization, idiomatic object support, Schema IDL/code generation, reference tracking, schema evolution, and row-format access.",schemaEyebrow:"Schema IDL",schemaTitle:"Model contracts that still understand object graphs.",schemaSubtitle:"Fory IDL starts with familiar message definitions, then adds unions and reference-aware fields for data models that ordinary IDLs tend to flatten.",performanceEyebrow:"Performance",performanceTitle:"Designed for high-throughput serialization paths.",performanceSubtitle:"Fory combines efficient binary encoding with highly optimized serializers, from JIT compilation to statically generated code.",benchmarkCta:"View full benchmark charts",useCasesEyebrow:"Data boundaries",useCasesTitle:"Match Fory to each data boundary.",useCasesSubtitle:"Use one serialization layer, but choose the payload surface by the boundary your data crosses.",ecosystemTitle:"Adopt Fory without changing the object model.",ecosystemSubtitle:"Choose the wire mode for each boundary, promote shared models into Fory IDL when contracts need to last, then validate the exact path with per-language benchmarks."},zh:{heroTitle:"Apache Fory\u2122",heroSubtitle:"\u4E00\u4E2A\u9762\u5411\u539F\u751F\u9886\u57DF\u5BF9\u8C61\u3001Schema IDL \u548C\u8DE8\u8BED\u8A00\u6570\u636E\u4EA4\u6362\u7684\u9AD8\u6027\u80FD\u591A\u8BED\u8A00\u5E8F\u5217\u5316\u6846\u67B6\u3002",heroPrimary:"\u5F00\u59CB\u4F7F\u7528",heroSecondary:"\u67E5\u770B\u6587\u6863",heroGithub:"\u67E5\u770B GitHub",quickEyebrow:"\u5FEB\u901F\u5F00\u59CB",quickTitle:"\u4ECE\u539F\u751F\u9886\u57DF\u5BF9\u8C61\u5F00\u59CB\u3002",quickSubtitle:"\u7528\u4F60\u7684\u8BED\u8A00\u521B\u5EFA\u539F\u751F\u5BF9\u8C61\uFF0C\u7136\u540E\u5206\u522B\u901A\u8FC7\u4E00\u884C Fory \u8C03\u7528\u5B8C\u6210\u5E8F\u5217\u5316\u548C\u53CD\u5E8F\u5217\u5316\u3002",installLabel:"\u5B89\u88C5",codeLabel:"\u5E8F\u5217\u5316 / \u53CD\u5E8F\u5217\u5316",guideLabel:"\u6253\u5F00\u6307\u5357",capabilitiesEyebrow:"\u6838\u5FC3\u80FD\u529B",capabilitiesTitle:"Fory \u9762\u5411\u8FD9\u4E9B\u95EE\u9898\u800C\u8BBE\u8BA1\u3002",capabilitiesSubtitle:"Fory \u5C06\u8DE8\u8BED\u8A00\u5E8F\u5217\u5316\u3001\u539F\u751F\u5BF9\u8C61\u652F\u6301\u3001Schema IDL/codegen\u3001\u5F15\u7528\u8DDF\u8E2A\u3001Schema \u6F14\u8FDB\u548C row-format \u8BBF\u95EE\u7EC4\u5408\u5728\u4E00\u8D77\u3002",schemaEyebrow:"Schema IDL",schemaTitle:"\u7406\u89E3\u5BF9\u8C61\u56FE\u7684\u6A21\u578B\u5951\u7EA6\u3002",schemaSubtitle:"Fory IDL \u4ECE\u719F\u6089\u7684 message \u5B9A\u4E49\u5F00\u59CB\uFF0C\u5E76\u63D0\u4F9B union \u4E0E\u5F15\u7528\u611F\u77E5\u5B57\u6BB5\uFF0C\u8868\u8FBE\u666E\u901A IDL \u5BB9\u6613\u538B\u5E73\u7684\u5BF9\u8C61\u6A21\u578B\u3002",performanceEyebrow:"\u6027\u80FD",performanceTitle:"\u9762\u5411\u9AD8\u541E\u5410\u5E8F\u5217\u5316\u8DEF\u5F84\u800C\u8BBE\u8BA1\u3002",performanceSubtitle:"Fory \u7ED3\u5408\u9AD8\u6548\u4E8C\u8FDB\u5236\u7F16\u7801\u548C\u9AD8\u5EA6\u4F18\u5316\u7684 serializer\uFF0C\u4ECE JIT \u7F16\u8BD1\u5230\u9759\u6001\u751F\u6210\u4EE3\u7801\u3002",benchmarkCta:"\u67E5\u770B\u5B8C\u6574\u6027\u80FD\u56FE\u8868",useCasesEyebrow:"\u6570\u636E\u8FB9\u754C",useCasesTitle:"\u8BA9 Fory \u5339\u914D\u6BCF\u4E00\u79CD\u6570\u636E\u8FB9\u754C\u3002",useCasesSubtitle:"\u4F7F\u7528\u540C\u4E00\u5C42\u5E8F\u5217\u5316\u80FD\u529B\uFF0C\u4F46\u6839\u636E\u6570\u636E\u8DE8\u8D8A\u7684\u8FB9\u754C\u9009\u62E9\u4E0D\u540C payload \u8868\u9762\u3002",ecosystemTitle:"\u4E0D\u6539\u53D8\u5BF9\u8C61\u6A21\u578B\u5730\u91C7\u7528 Fory\u3002",ecosystemSubtitle:"\u6309\u6570\u636E\u8FB9\u754C\u9009\u62E9 wire mode\uFF1B\u5F53\u6A21\u578B\u9700\u8981\u957F\u671F\u7EF4\u62A4\u65F6\u63A8\u8FDB\u5230 Fory IDL\uFF1B\u4E0A\u7EBF\u524D\u7528\u591A\u8BED\u8A00 Benchmark \u9A8C\u8BC1\u5B9E\u9645\u8DEF\u5F84\u3002"}},g=[{id:"java",label:"Java",installLanguage:"xml",install:`<dependency>
  <groupId>org.apache.fory</groupId>
  <artifactId>fory-core</artifactId>
  <version>1.7.0</version>
</dependency>`,codeLanguage:"java",guide:"/docs/object-serialization/java/",summary:"Java supports xlang and native modes, JIT serializers, schema evolution, and Java-native object graph features.",code:`import org.apache.fory.Fory;

public record Person(String name, int age) {}

Fory fory = Fory.builder()
    .withXlang(true)
    .build();
fory.register(Person.class, "Person");

byte[] bytes = fory.serialize(new Person("Alice", 30));
Person out = (Person) fory.deserialize(bytes);`},{id:"python",label:"Python",installLanguage:"bash",install:"pip install pyfory==1.7.0",codeLanguage:"python",guide:"/docs/object-serialization/python/",summary:"pyfory supports xlang, Python native mode, dataclasses, row format, and out-of-band buffers.",code:`from dataclasses import dataclass
import pyfory

@dataclass
class Person:
    name: str
    age: pyfory.Int32

fory = pyfory.Fory(xlang=True)
fory.register(Person, typename="Person")

data = fory.serialize(Person("Alice", 30))
out = fory.deserialize(data)`},{id:"rust",label:"Rust",installLanguage:"bash",install:"cargo add fory@1.7.0",codeLanguage:"rust",guide:"/docs/object-serialization/rust/",summary:"Rust uses derive macros for type-safe structs and supports both xlang and native payloads.",code:`use fory::{Error, Fory, ForyStruct};

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
}`},{id:"go",label:"Go",installLanguage:"bash",install:"go get github.com/apache/fory/go/fory@v1.7.0",codeLanguage:"go",guide:"/docs/object-serialization/go/",summary:"Go supports xlang and native modes with exported structs, circular references, and schema-aware serializers.",code:`type Person struct {
    Name string
    Age  int32
}

f := fory.New(fory.WithXlang(true))
_ = f.RegisterStructByName(Person{}, "Person")

payload, _ := f.Serialize(&Person{Name: "Alice", Age: 30})
var out Person
_ = f.Deserialize(payload, &out)`},{id:"cpp",label:"C++",installLanguage:"cmake",install:`include(FetchContent)
FetchContent_Declare(
  fory
  GIT_REPOSITORY https://github.com/apache/fory.git
  GIT_TAG v1.7.0
  SOURCE_SUBDIR cpp
)
FetchContent_MakeAvailable(fory)`,codeLanguage:"cpp",guide:"/docs/object-serialization/cpp/",summary:"C++17 support covers xlang/native payloads, macro-based type registration, and row-format APIs.",code:`struct Person {
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
auto out = fory.deserialize<Person>(bytes).value();`},{id:"javascript",label:"JavaScript",installLanguage:"bash",install:"npm install @apache-fory/core@1.7.0 @apache-fory/hps@1.7.0",codeLanguage:"typescript",guide:"/docs/object-serialization/javascript/",summary:"JavaScript/TypeScript is xlang-only, schema-driven, and runs in Node.js or browsers.",code:`import Fory, { Type } from "@apache-fory/core";

const personType = Type.struct(
  { typeName: "Person" },
  { name: Type.string(), age: Type.int32() },
);

const fory = new Fory();
const { serialize, deserialize } = fory.register(personType);

const payload = serialize({ name: "Alice", age: 30 });
const out = deserialize(payload);`},{id:"csharp",label:"C#",installLanguage:"bash",install:"dotnet add package Apache.Fory --version 1.7.0",codeLanguage:"csharp",guide:"/docs/object-serialization/csharp/",summary:".NET support uses source-generated serializers for Fory structs, enums, and unions.",code:`using Apache.Fory;

[ForyStruct]
public sealed class Person
{
    public string Name { get; set; } = "";
    public int Age { get; set; }
}

Fory fory = Fory.Builder().Build();
fory.Register<Person>("Person");

byte[] payload = fory.Serialize(new Person { Name = "Alice", Age = 30 });
Person out = fory.Deserialize<Person>(payload);`},{id:"swift",label:"Swift",installLanguage:"swift",install:'.package(url: "https://github.com/apache/fory.git", exact: "1.7.0")',codeLanguage:"swift",guide:"/docs/object-serialization/swift/",summary:"Swift uses @ForyStruct, @ForyEnum, and @ForyUnion macros for xlang-compatible models.",code:`import Fory

@ForyStruct
struct Person: Equatable {
    var name: String = ""
    var age: Int32 = 0
}

let fory = Fory()
try fory.register(Person.self, name: "Person")

let payload = try fory.serialize(Person(name: "Alice", age: 30))
let out: Person = try fory.deserialize(payload)`},{id:"dart",label:"Dart",installLanguage:"yaml",install:`dependencies:
  fory: ^1.7.0

dev_dependencies:
  build_runner: ^2.4.13`,codeLanguage:"dart",guide:"/docs/object-serialization/dart/",summary:"Dart uses generated serializers across Dart VM, Flutter, AOT, and web targets.",code:`import 'package:fory/fory.dart';

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
final out = fory.deserialize<Person>(payload);`},{id:"scala",label:"Scala",installLanguage:"sbt",install:'libraryDependencies += "org.apache.fory" %% "fory-scala" % "1.7.0"',codeLanguage:"scala",guide:"/docs/object-serialization/scala/",summary:"Scala builds on Fory Java with optimized serializers for case classes, collections, tuples, and Option.",code:`import org.apache.fory.scala.ForyScala

case class Person(name: String, age: Int)

val fory = ForyScala.builder()
  .withXlang(true)
  .build()
fory.register(classOf[Person], "Person")

val payload = fory.serialize(Person("Alice", 30))
val out = fory.deserialize(payload).asInstanceOf[Person]`},{id:"kotlin",label:"Kotlin",installLanguage:"kotlin",install:`implementation("org.apache.fory:fory-kotlin:1.7.0")
ksp("org.apache.fory:fory-kotlin-ksp:1.7.0")`,codeLanguage:"kotlin",guide:"/docs/object-serialization/kotlin/",summary:"Kotlin adds data-class support, Android guidance, and KSP static serializers for xlang/schema mode.",code:`import org.apache.fory.kotlin.ForyKotlin

data class Person(val name: String, val age: Int)

val fory = ForyKotlin.builder()
    .withXlang(true)
    .requireClassRegistration(true)
    .buildThreadSafeFory()
fory.register(Person::class.java, "Person")

val payload = fory.serialize(Person("Alice", 30))
val out = fory.deserialize(payload) as Person`}],b=[{title:"Cross-language encoding",zhTitle:"\u8DE8\u8BED\u8A00\u7F16\u7801",label:"XLANG",description:"Serialize in one supported runtime and deserialize in another with the xlang wire format.",zhDescription:"\u901A\u8FC7 xlang \u7EBF\u683C\u5F0F\uFF0C\u5728\u4E00\u4E2A\u53D7\u652F\u6301\u8FD0\u884C\u65F6\u5E8F\u5217\u5316\uFF0C\u5728\u53E6\u4E00\u4E2A\u8FD0\u884C\u65F6\u53CD\u5E8F\u5217\u5316\u3002",link:"/docs/object-serialization/xlang/"},{title:"Domain objects first",zhTitle:"\u9886\u57DF\u5BF9\u8C61\u4F18\u5148",label:"OBJECTS",description:"Work with Java classes, Python dataclasses, Go structs, Rust/C++ structs, and generated or annotated models.",zhDescription:"\u76F4\u63A5\u4F7F\u7528 Java \u7C7B\u3001Python dataclass\u3001Go struct\u3001Rust/C++ struct\uFF0C\u4EE5\u53CA\u751F\u6210\u6216\u6CE8\u89E3\u6A21\u578B\u3002",link:"/docs/start/"},{title:"Reference-aware Schema IDL",zhTitle:"\u652F\u6301\u5F15\u7528\u8BED\u4E49\u7684 Schema IDL",label:"IDL",description:"Define schemas once with optional fields, refs, IDs, unions, and services, then generate native code.",zhDescription:"\u4E00\u6B21\u5B9A\u4E49 optional\u3001ref\u3001ID\u3001union \u548C service \u7B49 schema\uFF0C\u518D\u751F\u6210\u5404\u8BED\u8A00\u539F\u751F\u4EE3\u7801\u3002",link:"/docs/compiler/"},{title:"Row-format random access",zhTitle:"Row format \u968F\u673A\u8BBF\u95EE",label:"ROW",description:"Read fields, arrays, and nested values without deserializing the whole object; integrate with Arrow where supported.",zhDescription:"\u65E0\u9700\u53CD\u5E8F\u5217\u5316\u5B8C\u6574\u5BF9\u8C61\u5373\u53EF\u8BFB\u53D6\u5B57\u6BB5\u3001\u6570\u7EC4\u548C\u5D4C\u5957\u503C\uFF0C\u5E76\u5728\u652F\u6301\u8BED\u8A00\u4E2D\u5BF9\u63A5 Arrow\u3002",link:"/docs/row-format/"},{title:"Optimized runtimes",zhTitle:"\u8FD0\u884C\u65F6\u4F18\u5316",label:"FAST",description:"Use Java/JavaScript JIT serializers, Rust/C++/Swift macros, C# source generators, Kotlin KSP, and Dart build_runner output.",zhDescription:(0,s.jsxs)(s.Fragment,{children:["\u4F7F\u7528 ",(0,s.jsx)("span",{className:p,children:"Java/JavaScript"})," JIT serializer\u3001Rust/C++/Swift macro\u3001C# source generator\u3001Kotlin KSP \u548C Dart build_runner \u8F93\u51FA\u3002"]}),link:"/docs/object-serialization/java/"},{title:"Broad platform support",zhTitle:"\u591A\u8FD0\u884C\u65F6\u751F\u6001",label:"MULTI",description:"Use Fory from Java, Python, C++, Go, Rust, JavaScript/TypeScript, C#, Swift, Dart, Scala, Kotlin, and Android.",zhDescription:(0,s.jsxs)(s.Fragment,{children:["\u8986\u76D6 Java\u3001Python\u3001C++\u3001Go\u3001Rust\u3001",(0,s.jsx)("span",{className:p,children:"JavaScript/TypeScript"}),"\u3001C#\u3001Swift\u3001Dart\u3001Scala\u3001Kotlin \u548C Android\u3002"]}),link:"/docs/start/"}],f=[{label:"Idiomatic",zhLabel:"\u539F\u751F",title:"Idiomatic Objects",zhTitle:"\u539F\u751F\u5BF9\u8C61",text:"Serialize existing domain objects directly in the target language.",zhText:"\u5728\u76EE\u6807\u8BED\u8A00\u5185\u76F4\u63A5\u5E8F\u5217\u5316\u5DF2\u6709\u9886\u57DF\u5BF9\u8C61\uFF0C\u65E0\u9700\u989D\u5916\u624B\u52A8\u8F6C\u6362\u4EE3\u7801\u3002",link:"/docs/start/"},{label:"XLANG",zhLabel:"XLANG",title:"Cross-language Encoding",zhTitle:"\u8DE8\u8BED\u8A00\u7F16\u7801",text:"Unified cross-language type system and binary encoding.",zhText:"\u7EDF\u4E00\u7684\u8DE8\u8BED\u8A00\u7C7B\u578B\u7CFB\u7EDF\u4E0E\u4E8C\u8FDB\u5236\u7F16\u7801\u3002",link:"/docs/object-serialization/xlang/"},{label:"IDL",zhLabel:"IDL",title:"Reference-aware IDL",zhTitle:"\u5F15\u7528\u611F\u77E5 IDL",text:"Define shared contracts with refs, unions, and native code generation.",zhText:"\u7528 refs\u3001unions \u548C\u539F\u751F\u4EE3\u7801\u751F\u6210\u5B9A\u4E49\u5171\u4EAB\u5951\u7EA6\u3002",link:"/docs/compiler/"},{label:"FAST",zhLabel:"FAST",title:"High Performance",zhTitle:"\u9AD8\u6027\u80FD",text:"Highly optimized JIT and statically generated serializers.",zhText:"\u9AD8\u5EA6\u4F18\u5316\u7684 JIT serializer \u4E0E\u9759\u6001\u751F\u6210 serializer\u3002",link:"/docs/benchmarks/"}],x=[{title:"Message Type",zhTitle:"Message \u7C7B\u578B",text:"Define structured data types with typed fields, field IDs, and explicit optional fields.",zhText:"\u7528 typed fields\u3001\u5B57\u6BB5 ID \u548C\u660E\u786E\u7684 optional \u5B57\u6BB5\u5B9A\u4E49\u7ED3\u6784\u5316\u6570\u636E\u7C7B\u578B\u3002"},{title:"Union Type",zhTitle:"Union \u7C7B\u578B",text:"Map one-of-several cases to tagged unions, and to native union or sum types where supported.",zhText:"\u628A one-of-several case \u6620\u5C04\u4E3A tagged union\uFF1B\u5728\u652F\u6301\u7684\u8BED\u8A00\u4E2D\u751F\u6210\u539F\u751F union \u6216 sum type\u3002",code:`message Dog {
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
}`},{title:"Circular References",zhTitle:"\u5FAA\u73AF\u5F15\u7528",text:"Use ref-tracked fields when the same object can be shared or a graph contains cycles.",zhText:"\u5F53\u5BF9\u8C61\u4F1A\u88AB\u5171\u4EAB\uFF0C\u6216\u56FE\u7ED3\u6784\u4E2D\u5B58\u5728\u73AF\u65F6\uFF0C\u7528 ref \u5B57\u6BB5\u4FDD\u7559\u5F15\u7528\u8BED\u4E49\u3002",code:`message Node {
    string value = 1;
    ref Node parent = 2;
    list<ref Node> children = 3;
}`}],z=`package example;

${x.flatMap(e=>e.code?[e.code]:[]).join("\n\n")}`,j=[{label:"IDL Overview",zhLabel:"IDL \u6982\u89C8",link:"/docs/compiler/"},{label:"Compiler Guide",zhLabel:"\u7F16\u8BD1\u5668\u6307\u5357",link:"/docs/compiler/getting-started"},{label:"Generated Code",zhLabel:"\u751F\u6210\u4EE3\u7801",link:"/docs/compiler/generated-code/"}],v=[{value:"Optimized Serializers",zhValue:"\u4F18\u5316 Serializer",text:"Use JIT serializers, source generators, macros, KSP, and build_runner where each runtime supports them.",zhText:"\u5728\u5404\u8FD0\u884C\u65F6\u4F7F\u7528 JIT serializer\u3001source generator\u3001macro\u3001KSP \u548C build_runner\u3002"},{value:"Efficient Encoding",zhValue:"\u9AD8\u6548\u7F16\u7801",text:"Encode typed objects into an efficient binary format for fast serialization and deserialization.",zhText:"\u5C06\u7C7B\u578B\u5316\u5BF9\u8C61\u7F16\u7801\u4E3A\u9762\u5411\u5FEB\u901F\u5E8F\u5217\u5316\u548C\u53CD\u5E8F\u5217\u5316\u7684\u9AD8\u6548\u4E8C\u8FDB\u5236\u683C\u5F0F\u3002"}],T=[{title:"Language boundary",zhTitle:"\u8BED\u8A00\u8FB9\u754C",text:"Use xlang when services in different languages need to exchange the same typed payload directly.",zhText:"\u5F53\u4E0D\u540C\u8BED\u8A00\u670D\u52A1\u9700\u8981\u76F4\u63A5\u4EA4\u6362\u540C\u4E00\u4EFD\u7C7B\u578B\u5316\u8F7D\u8377\u65F6\uFF0C\u4F7F\u7528 xlang\u3002"},{title:"Runtime boundary",zhTitle:"\u8FD0\u884C\u65F6\u8FB9\u754C",text:"Use native mode when objects stay inside one runtime and object graph fidelity matters.",zhText:"\u5F53\u5BF9\u8C61\u53EA\u5728\u540C\u4E00\u8FD0\u884C\u65F6\u5185\u6D41\u8F6C\uFF0C\u4E14\u5BF9\u8C61\u56FE\u8BED\u4E49\u91CD\u8981\u65F6\uFF0C\u4F7F\u7528 native mode\u3002"},{title:"Read boundary",zhTitle:"\u8BFB\u53D6\u8FB9\u754C",text:"Use row format for partial reads and analytics workloads that should not rebuild whole objects.",zhText:"\u5F53\u90E8\u5206\u8BFB\u53D6\u548C\u5206\u6790\u7C7B\u5DE5\u4F5C\u8D1F\u8F7D\u4E0D\u5E94\u91CD\u5EFA\u5B8C\u6574\u5BF9\u8C61\u65F6\uFF0C\u4F7F\u7528 row format\u3002"}],S=[{label:"01",title:"Choose the wire mode",zhTitle:"\u9009\u62E9 wire mode",text:"Use xlang for portable payloads shared across languages; use native mode for same-runtime traffic that needs broader runtime-specific object models.",zhText:"\u8DE8\u8BED\u8A00\u5171\u4EAB payload \u65F6\u4F7F\u7528 xlang\uFF1B\u540C\u8FD0\u884C\u65F6\u6D41\u91CF\u9700\u8981\u66F4\u5B8C\u6574\u7684\u8BED\u8A00\u5BF9\u8C61\u6A21\u578B\u65F6\u4F7F\u7528 native mode\u3002",cta:"Usage guide",zhCta:"\u4F7F\u7528\u6307\u5357",action:"Usage guide",zhAction:"\u4F7F\u7528\u6307\u5357",link:"/docs/start/"},{label:"02",title:"Promote shared contracts",zhTitle:"\u6C89\u6DC0\u5171\u4EAB\u5951\u7EA6",text:"Define Fory IDL once, generate type-safe native models across languages, and use optional fields, refs, unions, or services when contracts evolve.",zhText:"\u7528 Fory IDL \u5B9A\u4E49\u4E00\u6B21\u6A21\u578B\uFF0C\u751F\u6210\u591A\u8BED\u8A00\u7C7B\u578B\u5B89\u5168\u4EE3\u7801\uFF1B\u5951\u7EA6\u6F14\u8FDB\u65F6\u4F7F\u7528 optional\u3001ref\u3001union \u6216 service\u3002",cta:"Schema IDL guide",zhCta:"Schema IDL",action:"Schema IDL guide",zhAction:"Schema IDL \u6307\u5357",link:"/docs/compiler/"},{label:"03",title:"Benchmark the rollout path",zhTitle:"\u9A8C\u8BC1\u4E0A\u7EBF\u8DEF\u5F84",text:"Compare serialization throughput, deserialization throughput, payload size, and reproduction steps for the runtime you plan to ship.",zhText:"\u6309\u8BA1\u5212\u4E0A\u7EBF\u7684\u8FD0\u884C\u65F6\u5BF9\u6BD4\u5E8F\u5217\u5316/\u53CD\u5E8F\u5217\u5316\u541E\u5410\u3001payload \u5927\u5C0F\u548C\u590D\u73B0\u5B9E\u9A8C\u6B65\u9AA4\u3002",cta:"Benchmark charts",zhCta:"Benchmark",action:"Benchmark charts",zhAction:"Benchmark \u56FE\u8868",link:"/docs/benchmarks/"}];function w(e){return"zh-CN"===e?"zh":"en"}let P=function(){let{i18n:{currentLocale:e}}=(0,o.A)(),a=y[w(e)],t="zh"===w(e),[r,l]=(0,i.useState)("java"),p=(0,i.useMemo)(()=>g.find(e=>e.id===r)??g[0],[r]);return(0,s.jsxs)("main",{className:"homepage_Mn1j",children:[(0,s.jsxs)("section",{className:"hero_H13s",children:[(0,s.jsxs)("div",{className:"heroContent_hqVf",children:[(0,s.jsx)("h1",{children:a.heroTitle}),(0,s.jsx)("p",{className:"heroSubtitle_PdJw",children:a.heroSubtitle}),(0,s.jsxs)("div",{className:"heroActions_Bt4v",children:[(0,s.jsx)(n.A,{className:"primaryButton_PGGg",to:"/docs/start/",children:a.heroPrimary}),(0,s.jsx)(n.A,{className:u,to:"/docs/introduction/",children:a.heroSecondary}),(0,s.jsx)(n.A,{className:"ghostButton_VNyw",to:"https://github.com/apache/fory",children:a.heroGithub})]})]}),(0,s.jsx)("div",{className:"surfacePanel_P5f3","aria-label":t?"Fory \u6587\u6863\u5165\u53E3":"Fory documentation paths",children:(0,s.jsx)("div",{className:"surfaceOptions_dRnf",children:f.map(e=>(0,s.jsxs)(n.A,{className:"surfaceOption_iXZZ",to:e.link,children:[(0,s.jsx)("span",{className:"surfaceOptionBadge_WiBk",children:t?e.zhLabel:e.label}),(0,s.jsxs)("span",{className:"surfaceOptionBody_F9sE",children:[(0,s.jsx)("strong",{children:t?e.zhTitle:e.title}),(0,s.jsx)("small",{children:t?e.zhText:e.text})]})]},e.title))})})]}),(0,s.jsxs)("section",{className:"capabilities_38pY",children:[(0,s.jsxs)("div",{className:h,children:[(0,s.jsx)("span",{children:a.capabilitiesEyebrow}),(0,s.jsx)("h2",{children:a.capabilitiesTitle}),(0,s.jsx)("p",{children:a.capabilitiesSubtitle})]}),(0,s.jsx)("div",{className:"capabilityGrid_wiYQ",children:b.map(e=>(0,s.jsxs)(n.A,{className:"capabilityCard_VnNv",to:e.link,children:[(0,s.jsx)("span",{children:e.label}),(0,s.jsx)("h3",{children:t?e.zhTitle:e.title}),(0,s.jsx)("p",{children:t?e.zhDescription:e.description})]},e.title))})]}),(0,s.jsxs)("section",{className:"quickStart_RMXJ",children:[(0,s.jsxs)("div",{className:h,children:[(0,s.jsx)("span",{children:a.quickEyebrow}),(0,s.jsx)("h2",{children:a.quickTitle}),(0,s.jsx)("p",{children:a.quickSubtitle})]}),(0,s.jsxs)("div",{className:"runtimeShell_WQrd",children:[(0,s.jsx)("div",{className:"runtimeTabs_SgP1",role:"tablist","aria-label":"Runtime examples",children:g.map(e=>(0,s.jsx)("button",{"aria-selected":e.id===r,className:e.id===r?"runtimeTabActive_b5i4":"runtimeTab_YjtG",onClick:()=>l(e.id),role:"tab",type:"button",children:e.label},e.id))}),(0,s.jsxs)("div",{className:"runtimeDetail_cEWr",children:[(0,s.jsxs)("div",{className:"runtimeSummary_OyHv",children:[(0,s.jsxs)("div",{className:"runtimeTitleRow_jY3R",children:[(0,s.jsx)("span",{children:p.label}),(0,s.jsx)(n.A,{className:"runtimeGuideButton_xIWL",to:p.guide,children:t?`${p.label} \u{6307}\u{5357}`:`${p.label} Guide`})]}),(0,s.jsx)("p",{children:p.summary}),(0,s.jsxs)("div",{className:"installBlock_LCAE",children:[(0,s.jsx)("div",{className:m,children:a.installLabel}),(0,s.jsx)(c.A,{language:p.installLanguage,children:p.install})]})]}),(0,s.jsxs)("div",{className:"codeBlock_VFPE",children:[(0,s.jsx)("div",{className:m,children:a.codeLabel}),(0,s.jsx)(c.A,{language:p.codeLanguage,children:p.code})]})]})]})]}),(0,s.jsx)("section",{className:"schemaIdl_cE3h",children:(0,s.jsxs)("div",{className:"schemaLayout_XpK6",children:[(0,s.jsxs)("div",{className:"schemaCopy_y6DP",children:[(0,s.jsx)("span",{className:d,children:a.schemaEyebrow}),(0,s.jsx)("h2",{children:a.schemaTitle}),(0,s.jsx)("p",{children:a.schemaSubtitle}),(0,s.jsx)("div",{className:"schemaFeatureList_sBmg",children:x.map((e,a)=>(0,s.jsxs)("article",{className:"schemaFeature_TzQ3",children:[(0,s.jsx)("span",{children:String(a+1).padStart(2,"0")}),(0,s.jsxs)("div",{children:[(0,s.jsx)("h3",{children:t?e.zhTitle:e.title}),(0,s.jsx)("p",{children:t?e.zhText:e.text})]})]},e.title))}),(0,s.jsx)("div",{className:"schemaActions_haf3",children:j.map(e=>(0,s.jsx)(n.A,{className:"schemaActionButton_Egd9",to:e.link,children:t?e.zhLabel:e.label},e.link))})]}),(0,s.jsxs)("div",{className:"schemaPreview_PIA0","aria-label":a.schemaTitle,children:[(0,s.jsxs)("div",{className:"schemaPreviewHeader_E7tH",children:[(0,s.jsx)("span",{children:"model.fdl"}),(0,s.jsx)("strong",{children:"Fory IDL"})]}),(0,s.jsx)(c.A,{language:"protobuf",children:z})]})]})}),(0,s.jsxs)("section",{className:"performance_DK6w",children:[(0,s.jsxs)("div",{className:"performanceCopy_RRfj",children:[(0,s.jsx)("span",{children:a.performanceEyebrow}),(0,s.jsx)("h2",{children:a.performanceTitle}),(0,s.jsx)("p",{children:a.performanceSubtitle}),(0,s.jsx)(n.A,{className:u,to:"/docs/benchmarks/",children:a.benchmarkCta})]}),(0,s.jsx)("div",{className:"performanceCards_emZ1",children:v.map(e=>(0,s.jsxs)("div",{className:"performanceCard_cEv3",children:[(0,s.jsx)("strong",{children:t?e.zhValue:e.value}),(0,s.jsx)("p",{children:t?e.zhText:e.text})]},e.value))})]}),(0,s.jsxs)("section",{className:"useCases_wQBm",children:[(0,s.jsxs)("div",{className:h,children:[(0,s.jsx)("span",{children:a.useCasesEyebrow}),(0,s.jsx)("h2",{children:a.useCasesTitle}),(0,s.jsx)("p",{children:a.useCasesSubtitle})]}),(0,s.jsx)("div",{className:"useCaseGrid_yVvJ",children:T.map(e=>(0,s.jsxs)("article",{className:"useCaseCard_fqdc",children:[(0,s.jsx)("h3",{children:t?e.zhTitle:e.title}),(0,s.jsx)("p",{children:t?e.zhText:e.text})]},e.title))})]}),(0,s.jsxs)("section",{className:"ecosystem_EAwp",children:[(0,s.jsxs)("div",{className:"ecosystemHeader_EYS5",children:[(0,s.jsx)("span",{className:d,children:t?"\u91C7\u7528\u8DEF\u5F84":"Adoption path"}),(0,s.jsx)("h2",{children:a.ecosystemTitle}),(0,s.jsx)("p",{children:a.ecosystemSubtitle})]}),(0,s.jsx)("div",{className:"adoptionGrid_xF1l",children:S.map(e=>(0,s.jsxs)("article",{className:"adoptionCard_BhbD",children:[(0,s.jsxs)("div",{className:"adoptionHeaderRow_x0KT",children:[(0,s.jsx)("span",{className:"adoptionStep_R11K",children:e.label}),(0,s.jsx)("h3",{children:t?e.zhTitle:e.title})]}),(0,s.jsx)("p",{children:t?e.zhText:e.text}),(0,s.jsx)(n.A,{className:"adoptionButton_ByAZ",to:e.link,children:t?e.zhAction:e.action})]},e.title))})]})]})};function k(){let{siteConfig:e}=(0,o.A)(),a=(0,l.T)({id:"homepage.metaDescription",message:e.tagline,description:"The meta description of the homepage"});return(0,s.jsx)(r.A,{title:`${e.title}`,description:a,children:(0,s.jsx)(P,{})})}}}]);