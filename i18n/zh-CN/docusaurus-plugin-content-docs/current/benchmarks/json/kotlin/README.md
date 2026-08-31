# Kotlin JSON 基准测试 {#kotlin-json-benchmarks}

基准测试程序位于 [`benchmarks/kotlin`](https://github.com/apache/fory/tree/main/benchmarks/kotlin)，对比 Fory JSON Kotlin、kotlinx.serialization、Moshi 和 Jackson Kotlin，采用以下设置：

- 使用同一个不可变 `MediaContent` 模型，不提供公共无参构造函数；
- 使用 SHA-256 为 `8faba2f57ab397f319aced5cf1e8411a76785557d4c7d1703ec9d540354310a1` 的 Eishay 测试数据；
- 对每个库测试 String 序列化、UTF-8 字节序列化、String 反序列化和 UTF-8 字节反序列化；
- 在一次标准 JMH 运行中执行全部 16 个方法；
- 在计时范围外准备并保留声明类型的序列化器、适配器、读取器和写入器；
- 计时前检查测试数据解码、自身输出往返，以及所有输出的 JSON 树等价性。
