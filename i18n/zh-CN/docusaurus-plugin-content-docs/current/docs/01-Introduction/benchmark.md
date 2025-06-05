---
id: benchmark
title: Benchmark
sidebar_position: 2
---

不同的序列化框架适用于不同的场景，这里的 benchmark 结果仅供参考。

如果你需要针对特定场景进行 benchmark 测试，请确保所有序列化框架都针对该场景进行了适当配置。

动态序列化框架支持多态和引用，与静态序列化框架相比，这成本更高，除非它和 Fory 一样使用 JIT 技术。由于 Fory 在运行时生成代码，因此请在收集 benchmark 统计信息之前进行系统预热。

### Java 序列化

<img width="33%" alt="" src="/img/benchmarks/serialization/bench_serialize_compatible_STRUCT_to_directBuffer_tps.png" />
<img width="33%" alt="" src="/img/benchmarks/serialization/bench_serialize_compatible_MEDIA_CONTENT_to_array_tps.png" />
<img width="33%" alt="" src="/img/benchmarks/serialization/bench_serialize_MEDIA_CONTENT_to_array_tps.png" />
<img width="33%" alt="" src="/img/benchmarks/serialization/bench_serialize_SAMPLE_to_array_tps.png" />

### Java 反序列化

<img width="33%" alt="" src="/img/benchmarks/deserialization/bench_deserialize_compatible_STRUCT_from_directBuffer_tps.png" />
<img width="33%" alt="" src="/img/benchmarks/deserialization/bench_deserialize_compatible_MEDIA_CONTENT_from_array_tps.png" />
<img width="33%" alt="" src="/img/benchmarks/deserialization/bench_deserialize_MEDIA_CONTENT_from_array_tps.png" />
<img width="33%" alt="" src="/img/benchmarks/deserialization/bench_deserialize_SAMPLE_from_array_tps.png" />

有关类型向前/向后兼容性、堆外支持、零拷贝序列化的更多 benchmark 测试，请参见[benchmarks](https://github.com/apache/fory/tree/main/docs/benchmarks)

### JavaScript

<img width="33%" alt="" src="/img/benchmarks/javascript/complex_object.jpg" />

该条形图使用的数据包括一个具有多种字段类型的复杂对象，JSON 数据的大小为 3KB。

请参阅[benchmarks](https://github.com/apache/fory/blob/main/javascript/benchmark/index.js) benchmark 测试代码。
