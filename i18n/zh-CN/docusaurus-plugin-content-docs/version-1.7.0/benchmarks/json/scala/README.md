# Scala JSON 基准测试报告 {#scala-json-benchmark-report}

本测试使用同一个不可变 Scala MediaContent 模型和 Eishay JSON 文档，对比 fory-json-scala、jsoniter-scala 和 Jackson Scala。String 组不包含 UTF-8 转换；UTF-8 组中各库均使用直接操作字节数组的 API。

- 测试日期：`2026-08-14`
- 源码提交：`588ad6ab355c4c23fa0a2e4f269a8c733cba7b01`
- 平台：macOS-15.7.2-arm64-arm-64bit (arm64)
- JDK：`26.0.1`
- 虚拟机：`OpenJDK 64-Bit Server VM`
- JMH：`1.37`
- 预热：2 轮，每轮 `1 s`
- 测量：2 轮，每轮 `1 s`
- Fork 数：1；线程数：1
- 聚合方式：3 次交替短运行的中位数；误差线表示各次运行之间的最大偏差
- 模式：吞吐量，越高越好

## String

![Scala JSON String 基准测试吞吐量](string_throughput.png)

## UTF-8 字节 {#utf-8-bytes}

![Scala JSON UTF-8 字节基准测试吞吐量](utf8_bytes_throughput.png)

## 结果 {#results}

| 表示形式 | 操作 | fory-json-scala 次/秒 | jsoniter-scala 次/秒 | Jackson Scala 次/秒 | 最快 |
| ------------- | ----------- | ----------------------: | ---------------------: | --------------------: | --------------- |
| 字符串 | 序列化 | 6,760,588 | 2,748,997 | 1,955,855 | fory-json-scala |
| 字符串 | 反序列化 | 3,771,280 | 2,350,297 | 960,362 | fory-json-scala |
| UTF-8 字节 | 序列化 | 9,485,122 | 2,745,567 | 1,761,719 | fory-json-scala |
| UTF-8 字节 | 反序列化 | 3,318,893 | 2,391,923 | 1,080,453 | fory-json-scala |

## Fory 性能优势 {#fory-performance-advantage}

| 表示形式 | 操作 | 相对 jsoniter-scala | 相对 Jackson Scala |
| ------------- | ----------- | ----------------: | ---------------: |
| 字符串 | 序列化 | 145.9% | 245.7% |
| 字符串 | 反序列化 | 60.5% | 292.7% |
| UTF-8 字节 | 序列化 | 245.5% | 438.4% |
| UTF-8 字节 | 反序列化 | 38.8% | 207.2% |
