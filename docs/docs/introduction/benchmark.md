---
id: benchmark
title: Benchmark
sidebar_position: 2
---

Different serialization frameworks are suitable for different scenarios, and benchmark results here are for reference only.

If you need to benchmark for your specific scenario, make sure all serialization frameworks are appropriately configured for that scenario.

Dynamic serialization frameworks supports polymorphism and reference, which has more cost compared
to static serialization frameworks, unless it uses the jit techniques as fory did.
Since fory will generate code at runtime, please warm up before collecting benchmark statistics.

### Java Serialization

<img width="33%" alt="" src="/img/benchmarks/serialization/bench_serialize_compatible_STRUCT_to_directBuffer_tps.png" />
<img width="33%" alt="" src="/img/benchmarks/serialization/bench_serialize_compatible_MEDIA_CONTENT_to_array_tps.png" />
<img width="33%" alt="" src="/img/benchmarks/serialization/bench_serialize_MEDIA_CONTENT_to_array_tps.png" />
<img width="33%" alt="" src="/img/benchmarks/serialization/bench_serialize_SAMPLE_to_array_tps.png" />

### Java Deserialization

<img width="33%" alt="" src="/img/benchmarks/deserialization/bench_deserialize_compatible_STRUCT_from_directBuffer_tps.png" />
<img width="33%" alt="" src="/img/benchmarks/deserialization/bench_deserialize_compatible_MEDIA_CONTENT_from_array_tps.png" />
<img width="33%" alt="" src="/img/benchmarks/deserialization/bench_deserialize_MEDIA_CONTENT_from_array_tps.png" />
<img width="33%" alt="" src="/img/benchmarks/deserialization/bench_deserialize_SAMPLE_from_array_tps.png" />

See [benchmarks](https://github.com/apache/fory/tree/main/docs/benchmarks) for more benchmarks about type forward/backward compatibility, off-heap support, zero-copy serialization.

### JavaScript

<img width="33%" alt="" src="/img/benchmarks/javascript/complex_object.jpg" />

The data used for this bar graph includes a complex object that has many kinds of field types, and the size of the JSON data is 3KB.

See [benchmarks](https://github.com/apache/fory/blob/main/javascript/benchmark/index.js) for the benchmark code.
